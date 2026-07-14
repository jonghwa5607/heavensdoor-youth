"""
하늘의문 중고등부 — 푸시 알림 발송기 (GitHub Actions, 무료)

하는 일:
  1) reminders 컬렉션에서 '시간이 된' 리마인더를 찾아 알림을 생성한다
     → 앱이 꺼져 있어도 리마인더가 동작한다
  2) notifications 컬렉션에서 아직 안 보낸 알림을 골라 FCM 푸시를 보낸다
  3) pushLog 에 기록해 중복 발송을 막는다
"""
import os, re, json, time, html
from datetime import datetime, timezone, timedelta

import firebase_admin
from firebase_admin import credentials, firestore, messaging

APP_URL = "https://heavensdoor-youth.vercel.app/"   # FCM은 전체 HTTPS 주소를 요구함

KST = timezone(timedelta(hours=9))     # 리마인더 시각은 한국 시간 기준
MAX_AGE_HOURS = 12                     # 이보다 오래된 알림은 보내지 않음
MAX_SEND = 40                          # 한 번에 보낼 최대 알림 수

sa = json.loads(os.environ["FIREBASE_SA"])
firebase_admin.initialize_app(credentials.Certificate(sa))
db = firestore.client()


def clean(t):
    t = re.sub(r"<br\s*/?>", " ", t or "")
    t = re.sub(r"<[^>]+>", "", t)
    return html.unescape(t).strip()


def notif_ts(nid):
    m = re.search(r"(\d{13})", str(nid or ""))
    return int(m.group(1)) if m else None


# ══════════════════════════════════════════════════════════
# 1) 시간이 된 리마인더 → 알림 생성
# ══════════════════════════════════════════════════════════
def build_reminder_notifs(now_ms):
    made = 0
    try:
        reminders = [d.to_dict() for d in db.collection("reminders").stream()]
    except Exception as e:
        print(f"[REM] 조회 실패: {e}")
        return 0

    for r in reminders:
        rid = r.get("id")
        if not rid or r.get("done") or not r.get("date") or not r.get("time"):
            continue

        try:
            due = datetime.fromisoformat(f"{r['date']}T{r['time']}").replace(tzinfo=KST)
        except Exception:
            continue

        due_ms = int(due.timestamp() * 1000)
        if due_ms > now_ms:
            continue                                   # 아직 시간 전
        if now_ms - due_ms > 24 * 3600 * 1000:
            continue                                   # 하루 넘게 지난 건 제외

        nid = "nt-rem-" + str(rid)
        ref = db.collection("notifications").document(nid)
        if ref.get().exists:
            continue                                   # 이미 생성됨

        doc = {
            "id": nid,
            "text": f"📌 리마인더: <b>{r.get('content','')}</b> ⏰ {r['time']}",
            "time": "방금",
            "readBy": [],
            "hiddenBy": [],
            "ts": due_ms,
        }
        if r.get("shared"):
            doc["forRole"] = "teacher"                 # 교사 전체 공유
        elif r.get("ownerId"):
            doc["forTeacherId"] = r["ownerId"]         # 작성자 본인만
        else:
            doc["forRole"] = "teacher"

        ref.set(doc)
        made += 1
        print(f"[REM] 알림 생성: {rid} ({r['date']} {r['time']})")

    return made


# ══════════════════════════════════════════════════════════
# 2) 수신 대상 계산 (index.html 의 notifMatch 와 동일 규칙)
#    ※ 읽음 여부는 보지 않는다 — 푸시는 별개 채널
# ══════════════════════════════════════════════════════════
def recipients(n, members):
    out = []
    for u in members:
        if not u.get("approved") or u.get("hidden"):
            continue
        uid = u.get("id")
        if uid in (n.get("hiddenBy") or []):
            continue

        ok = False
        if n.get("forStudentId"):
            ok = uid == n["forStudentId"]
        elif n.get("forTeacherId"):
            ok = uid == n["forTeacherId"]
        elif n.get("forTeacher"):
            ok = u.get("role") == "teacher"
        else:
            role = n.get("forRole")
            if role == "all":
                ok = True
            elif role == "teacher":
                ok = u.get("role") == "teacher"
            elif role == "student":
                ok = u.get("role") == "student"
            elif role and role.startswith("teacher-grade-"):
                gk = role.replace("teacher-grade-", "")
                ok = u.get("role") == "teacher" and (
                    u.get("teacherType") == gk
                    or u.get("teacherType") in ("principal", "admin")
                    or u.get("isAdmin")
                )
            elif not role:
                ok = True
        if ok:
            out.append(u)
    return out


def main():
    now_ms = int(time.time() * 1000)
    cutoff = now_ms - MAX_AGE_HOURS * 3600 * 1000

    made = build_reminder_notifs(now_ms)
    if made:
        print(f"[REM] {made}건 생성")

    members = [d.to_dict() for d in db.collection("members").stream()]
    try:
        cfg = db.collection("settings").document("app").get()
        admin_tokens = (cfg.to_dict() or {}).get("adminFcm", []) if cfg.exists else []
    except Exception:
        admin_tokens = []

    notifs = [d.to_dict() for d in db.collection("notifications").stream()]
    notifs = [n for n in notifs if n.get("id")]
    notifs.sort(key=lambda n: n.get("ts") or notif_ts(n["id"]) or 0, reverse=True)

    total_devices = sum(len(u.get("fcm") or []) for u in members) + len(admin_tokens)
    print(f"등록된 기기: {total_devices}대 / 회원 {len(members)}명")
    if total_devices == 0:
        print("⚠️ 푸시를 켠 기기가 하나도 없습니다. 앱 > 알림 설정 > '푸시 알림 켜기'를 눌러주세요.")

    sent = 0
    for n in notifs[:200]:
        if sent >= MAX_SEND:
            break
        nid = n["id"]
        ts = n.get("ts") or notif_ts(nid)
        if ts and ts < cutoff:
            continue
        if db.collection("pushLog").document(nid).get().exists:
            continue

        body = clean(n.get("text", ""))
        if not body:
            db.collection("pushLog").document(nid).set({"skip": True, "at": now_ms})
            continue

        tokens = []
        for u in recipients(n, members):
            if u.get("notifMode") == "silent":
                continue
            tokens += u.get("fcm") or []
        if n.get("forTeacher") or n.get("forRole") in ("all", "teacher"):
            tokens += admin_tokens
        tokens = list(dict.fromkeys(t for t in tokens if t))[:450]

        if not tokens:
            print(f"[SKIP] {nid} - 대상 기기 없음 : {body[:30]}")
            db.collection("pushLog").document(nid).set({"at": now_ms, "n": 0})
            continue

        msg = messaging.MulticastMessage(
            notification=messaging.Notification(
                title="하늘의문 중고등부", body=body[:180]
            ),
            data={"nid": str(nid), "url": APP_URL},
            webpush=messaging.WebpushConfig(
                fcm_options=messaging.WebpushFCMOptions(link=APP_URL)
            ),
            tokens=tokens,
        )
        try:
            res = messaging.send_each_for_multicast(msg)
            print(f"[SEND] {nid} -> {res.success_count}/{len(tokens)} : {body[:40]}")

            dead = []
            for i, r in enumerate(res.responses):
                if r.success:
                    continue
                err = str(r.exception)
                print(f"   실패: {err[:90]}")
                if "not-registered" in err or "invalid-argument" in err:
                    dead.append(tokens[i])
            if dead:
                for u in members:
                    cur = u.get("fcm") or []
                    keep = [t for t in cur if t not in dead]
                    if len(keep) != len(cur):
                        db.collection("members").document(u["id"]).update({"fcm": keep})
                        print(f"   죽은 토큰 정리: {u['id']}")
            sent += 1
        except Exception as e:
            print(f"[FAIL] {nid}: {e}")

        db.collection("pushLog").document(nid).set({"at": now_ms, "n": len(tokens)})

    print(f"완료: {sent}건 발송")


if __name__ == "__main__":
    main()
