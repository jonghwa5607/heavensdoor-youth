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
# 0) 매일/매주 정해진 시각(한국시간 10시)에 생일·축일·결석 알림 생성
# ══════════════════════════════════════════════════════════
def _kst_now():
    return datetime.now(KST)

def _today_key():
    return _kst_now().strftime("%Y-%m-%d")

def _saturdays_back(n):
    """오늘 이전(오늘 포함) 최근 n개의 토요일 날짜 문자열"""
    out = []
    d = _kst_now().date()
    # 이번 주 토요일 찾기 (월=0..일=6, 토=5)
    while d.weekday() != 5:
        d = d - timedelta(days=1)
    for i in range(n):
        out.append((d - timedelta(days=7 * i)).isoformat())
    return out

def _absent_streak(u, vac):
    """연속 결석 주 수 — 방학 토요일 제외, 최근 토요일부터 거슬러 셈"""
    weeks = [d for d in _saturdays_back(20) if d not in vac]
    attended = set(u.get("attendedWeeks") or [])
    n = 0
    for w in weeks:
        if w in attended:
            break
        n += 1
    return n

def build_scheduled_notifs(now_ms, members):
    now = _kst_now()
    # 10시대(10:00~10:59)에만 동작. cron이 1분마다 도니 그날 첫 실행에서 생성됨
    if now.hour != 10:
        return 0

    made = 0
    m, d = now.month, now.day
    yr = now.year
    tkey = _today_key()

    # settings 에서 방학 목록
    try:
        cfg = (db.collection("settings").document("app").get().to_dict() or {})
    except Exception:
        cfg = {}
    vac = (cfg.get("vacDates") or []) + (cfg.get("eduVacDates") or [])

    approved = [u for u in members if u.get("approved") and not u.get("hidden")]

    # ── 생일 (당일 10시) ──
    for u in approved:
        if u.get("graduated"):
            continue
        if int(u.get("birthMonth") or 0) == m and int(u.get("birthDay") or 0) == d:
            nid = "nt-bday-all-" + str(u.get("id")) + "-" + str(yr)
            if not db.collection("notifications").document(nid).get().exists:
                db.collection("notifications").document(nid).set({
                    "id": nid, "time": "방금", "readBy": [], "hiddenBy": [], "ts": now_ms,
                    "text": f"🎂 오늘은 <b>{u.get('name','')} {u.get('baptism','')}</b>님의 생일이에요. 함께 축하해주세요!",
                    "forRole": "all", "tap": {"type": "bday", "targetId": u.get("id")},
                }); made += 1
            if u.get("role") == "student":
                sid = "nt-bday-self-" + str(u.get("id")) + "-" + str(yr)
                if not db.collection("notifications").document(sid).get().exists:
                    db.collection("notifications").document(sid).set({
                        "id": sid, "time": "방금", "readBy": [], "hiddenBy": [], "ts": now_ms,
                        "text": "🎂 생일 축하해요! 오늘은 당신의 특별한 날이에요 🎉",
                        "forStudentId": u.get("id"), "tap": {"type": "bday", "targetId": u.get("id")},
                    }); made += 1

    # ── 축일 (당일 10시) ──
    for u in approved:
        if int(u.get("feastMonth") or 0) == m and int(u.get("feastDay") or 0) == d:
            nid = "nt-feast-all-" + str(u.get("id")) + "-" + str(yr)
            if not db.collection("notifications").document(nid).get().exists:
                db.collection("notifications").document(nid).set({
                    "id": nid, "time": "방금", "readBy": [], "hiddenBy": [], "ts": now_ms,
                    "text": f"✝️ 오늘은 <b>{u.get('name','')} {u.get('baptism','')}</b>님의 축일이에요. 함께 축하해주세요!",
                    "forRole": "all", "tap": {"type": "bday", "targetId": u.get("id")},
                }); made += 1
            if u.get("role") == "student" and not u.get("graduated"):
                sid = "nt-feast-self-" + str(u.get("id")) + "-" + str(yr)
                if not db.collection("notifications").document(sid).get().exists:
                    db.collection("notifications").document(sid).set({
                        "id": sid, "time": "방금", "readBy": [], "hiddenBy": [], "ts": now_ms,
                        "text": f"✝️ 축일 축하해요! 오늘은 수호 성인 <b>성 {u.get('baptism','')}</b>의 날이에요 🙏",
                        "forStudentId": u.get("id"), "tap": {"type": "bday", "targetId": u.get("id")},
                    }); made += 1

    # ── 결석 (일요일 10시, 연속 3주 이상) ──
    if now.weekday() == 6:  # 일요일
        HEAD = {3: "🚨 [경고]", 4: "🆘 [긴급]"}
        for u in approved:
            if u.get("role") != "student" or u.get("graduated"):
                continue
            n = _absent_streak(u, vac)
            if n < 3:
                continue
            head = HEAD.get(min(n, 4), "🚨 [경고]") if n >= 4 else "🚨 [경고]"
            gk = u.get("gradeKey") or ""
            # 담당 교사에게
            tnid = f"nt-absent-t-{u.get('id')}-{tkey}"
            if not db.collection("notifications").document(tnid).get().exists:
                db.collection("notifications").document(tnid).set({
                    "id": tnid, "time": "방금", "readBy": [], "hiddenBy": [], "ts": now_ms,
                    "text": f"{head} <b>{u.get('name','')} {u.get('baptism','')}</b> ({u.get('gradeLabel','')}) 학생이 {n}주 연속 결석했어요. 관리가 필요해요.",
                    "forRole": "teacher-grade-" + gk, "tap": {"type": "absent"},
                }); made += 1
            # 학생 본인에게
            snid = f"nt-absent-s-{u.get('id')}-{tkey}"
            if not db.collection("notifications").document(snid).get().exists:
                db.collection("notifications").document(snid).set({
                    "id": snid, "time": "방금", "readBy": [], "hiddenBy": [], "ts": now_ms,
                    "text": "🙏 요즘 주일학교에서 얼굴을 못 봤어요. 다음 주엔 꼭 만나요! 기다리고 있을게요 💛",
                    "forStudentId": u.get("id"), "tap": {"type": "attend"},
                }); made += 1

    return made


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

    members_early = [d.to_dict() for d in db.collection("members").stream()]
    made2 = build_scheduled_notifs(now_ms, members_early)
    if made2:
        print(f"[SCHED] {made2}건 생성")

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

        if n.get("noPush"):
            db.collection("pushLog").document(nid).set({"skip": "noPush", "at": now_ms})
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
                    print(f"   성공 → {tokens[i][:20]}…")
                    continue
                err = str(r.exception)
                print(f"   실패({tokens[i][:14]}…): {err[:70]}")
                if "not-registered" in err.lower().replace("_","-") or "invalid" in err.lower():
                    dead.append(tokens[i])
            if dead:
                for u in members:
                    cur = u.get("fcm") or []
                    keep = [t for t in cur if t not in dead]
                    if len(keep) != len(cur):
                        db.collection("members").document(u["id"]).update({"fcm": keep})
                        print(f"   죽은 토큰 정리: members/{u['id']}")
                        u["fcm"] = keep
                keep_admin = [t for t in admin_tokens if t not in dead]
                if len(keep_admin) != len(admin_tokens):
                    db.collection("settings").document("app").update({"adminFcm": keep_admin})
                    print(f"   죽은 토큰 정리: settings/adminFcm ({len(admin_tokens)}→{len(keep_admin)})")
                    admin_tokens = keep_admin
            sent += 1
        except Exception as e:
            print(f"[FAIL] {nid}: {e}")

        db.collection("pushLog").document(nid).set({"at": now_ms, "n": len(tokens)})

    print(f"완료: {sent}건 발송")


if __name__ == "__main__":
    main()
