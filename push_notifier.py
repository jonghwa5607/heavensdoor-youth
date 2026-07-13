import os, re, json, time, html
import firebase_admin
from firebase_admin import credentials, firestore, messaging

MAX_AGE_HOURS = 12
MAX_SEND      = 40

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


def recipients(n, members):
    out = []
    for u in members:
        if not u.get("approved") or u.get("hidden"):
            continue
        uid = u.get("id")
        if uid in (n.get("hiddenBy") or []) or uid in (n.get("readBy") or []):
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

    members = [d.to_dict() for d in db.collection("members").stream()]
    cfg = db.collection("settings").document("app").get()
    admin_tokens = (cfg.to_dict() or {}).get("adminFcm", []) if cfg.exists else []

    notifs = [d.to_dict() for d in db.collection("notifications").stream()]
    notifs = [n for n in notifs if n.get("id")]
    notifs.sort(key=lambda n: notif_ts(n["id"]) or 0, reverse=True)

    sent_total = 0
    for n in notifs[:200]:
        if sent_total >= MAX_SEND:
            break
        nid = n["id"]
        ts = notif_ts(nid)
        if ts and ts < cutoff:
            continue
        if db.collection("pushLog").document(nid).get().exists:
            continue

        body = clean(n.get("text", ""))
        if not body:
            db.collection("pushLog").document(nid).set({"skipped": True, "at": now_ms})
            continue

        tokens = []
        for u in recipients(n, members):
            if u.get("notifMode") == "silent":
                continue
            tokens += (u.get("fcm") or [])
        if n.get("forTeacher") or n.get("forRole") in ("all", "teacher"):
            tokens += admin_tokens
        tokens = list(dict.fromkeys(t for t in tokens if t))[:450]

        if tokens:
            msg = messaging.MulticastMessage(
                notification=messaging.Notification(title="하늘의문 중고등부", body=body[:180]),
                data={"nid": str(nid), "url": "/"},
                webpush=messaging.WebpushConfig(
                    fcm_options=messaging.WebpushFCMOptions(link="/")
                ),
                tokens=tokens,
            )
            try:
                res = messaging.send_each_for_multicast(msg)
                print(f"[SEND] {nid} -> {res.success_count}/{len(tokens)}")
                dead = [
                    tokens[i]
                    for i, r in enumerate(res.responses)
                    if not r.success
                    and r.exception
                    and "registration-token-not-registered" in str(r.exception)
                ]
                if dead:
                    for u in members:
                        cur = u.get("fcm") or []
                        keep = [t for t in cur if t not in dead]
                        if len(keep) != len(cur):
                            db.collection("members").document(u["id"]).update({"fcm": keep})
                sent_total += 1
            except Exception as e:
                print(f"[FAIL] {nid}: {e}")
        else:
            print(f"[SKIP] {nid} - no devices")

        db.collection("pushLog").document(nid).set({"at": now_ms, "n": len(tokens)})

    print(f"done: {sent_total} sent")


if __name__ == "__main__":
    main()
