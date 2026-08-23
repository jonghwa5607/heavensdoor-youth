/**
 * 하늘의문 중고등부 — 알림 발송 Worker (Cloudflare)
 *
 * 하는 일 (1분마다 자동 실행):
 *   1) reminders 에서 시간이 된 리마인더 → 알림 생성
 *   2) 매일/매주 10시(한국시간): 생일·축일·결석 알림 생성
 *   3) notifications 에서 아직 안 보낸 알림 → FCM 푸시 발송
 *   4) 죽은 토큰 자동 정리
 *
 * 필요한 환경변수(Cloudflare Settings > Variables):
 *   FIREBASE_SA   : Firebase 서비스 계정 JSON 전체 (Secret)
 *   PROJECT_ID    : heavensdoor-teen  (Text)
 *   APP_URL       : https://heavensdoor-youth.vercel.app/  (Text)
 */

const KST_OFFSET = 9 * 3600 * 1000;
const MAX_AGE_HOURS = 12;
const MAX_SEND = 40;

export default {
  // 1분마다 Cron이 부르는 진입점
  async scheduled(event, env, ctx) {
    ctx.waitUntil(run(env));
  },
  // 브라우저로 열었을 때 수동 실행/상태 확인용
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/run') {
      const log = await run(env);
      return new Response(log.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    return new Response('heavensdoor push worker OK', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  },
};

// ────────────────────────────────────────────────────────────
// 메인 로직
// ────────────────────────────────────────────────────────────
async function run(env) {
  const log = [];
  const nowMs = Date.now();
  const projectId = env.PROJECT_ID || 'heavensdoor-teen';
  const appUrl = env.APP_URL || 'https://heavensdoor-youth.vercel.app/';

  let sa;
  try {
    sa = JSON.parse(env.FIREBASE_SA);
  } catch (e) {
    log.push('[FATAL] FIREBASE_SA 파싱 실패: ' + e);
    return log;
  }

  let token;
  try {
    token = await getAccessToken(sa);
  } catch (e) {
    log.push('[FATAL] 액세스 토큰 발급 실패: ' + e);
    return log;
  }
  if (!token) { log.push('[FATAL] 토큰이 비어있음'); return log; }
  log.push('토큰 OK (' + String(token).slice(0, 12) + '…)');

  const db = new Firestore(projectId, token);

  // ── 읽기 절약 ──
  // 회원·설정은 '실제로 보낼 게 있을 때'만 읽는다. (매분 전체 읽기가 할당량을 태우던 원인)
  let members = null, cfg = null;
  const getMembers = async () => {
    if (members) return members;
    members = await db.list('members');
    log.push('members 읽기: ' + members.length + '명');
    return members;
  };
  const getCfg = async () => {
    if (cfg) return cfg;
    try { cfg = (await db.get('settings', 'app')) || {}; } catch (e) { cfg = {}; }
    return cfg;
  };

  // 1) 리마인더 → 알림 생성 (아직 처리 안 된 것만 조건 조회)
  let rems = [];
  try {
    rems = await db.query('reminders', { field: 'notified', op: 'EQUAL', value: false, limit: 50 });
  } catch (e) {
    log.push('[WARN] 리마인더 조회 실패: ' + String(e).slice(0, 60));
  }
  // notified 필드가 없는 옛 리마인더 보완 — 하루 두 번(0분/30분)만 전체 확인
  {
    const mm = kstNow(nowMs).getUTCMinutes();
    if (mm === 3 || mm === 33) {
      try {
        const all = await db.list('reminders');
        const seen = new Set(rems.map(r => r.id));
        all.forEach(r => { if (r.id && r.notified === undefined && !seen.has(r.id)) rems.push(r); });
      } catch (e) {}
    }
  }
  let made = 0;
  for (const r of rems) {
    const rid = r.id;
    if (!rid || r.done || !r.date || !r.time) continue;
    if (r.notified) continue;                    // 이미 알림 생성됨 → 재확인 안 함(읽기 절약)
    const dueMs = kstToMs(r.date, r.time);
    if (isNaN(dueMs) || dueMs > nowMs) continue;
    if (nowMs - dueMs > 24 * 3600 * 1000) continue;
    const nid = 'nt-rem-' + rid;
    const doc = {
      id: nid, text: `📌 리마인더: <b>${r.content || ''}</b> ⏰ ${r.time}`,
      time: '방금', readBy: [], hiddenBy: [], ts: dueMs,
      pushed: false,                       // ← 이게 없으면 매분 조회에 안 잡혀 최대 10분 늦어짐
    };
    if (r.shared) doc.forRole = 'teacher';
    else if (r.ownerId) doc.forTeacherId = r.ownerId;
    else doc.forRole = 'teacher';
    await db.set('notifications', nid, doc);
    await db.update('reminders', rid, { notified: true });   // 다음 실행부터 건너뜀
    made++;
    log.push(`[REM] 알림 생성: ${rid} (${r.date} ${r.time})`);
  }

  // 2) 생일·축일·결석 — 하루 한 번만 실행 (표시 문서로 확인해 읽기 1회로 끝냄)
  let madeSched = 0;
  {
    const kst = kstNow(nowMs);
    const hour = kst.getUTCHours();
    if (hour >= 10 && hour <= 22) {
      const dayKey = kst.toISOString().slice(0, 10);
      const markId = 'sched-' + dayKey;
      if (!(await db.exists('meta', markId))) {
        madeSched = await buildScheduled(db, nowMs, await getMembers(), log, await getCfg());
        await db.set('meta', markId, { id: markId, ts: nowMs });
        log.push('[SCHED] 오늘치 생성 완료');
      }
    }
  }

  // 1.5) 예약 게시물 발행 → posts 생성 + notifications(pushed:false)
  try {
    const sched = await db.query('scheduledPosts', { field: 'published', op: 'EQUAL', value: false, limit: 50 });
    for (const sp of sched) {
      if (!sp || !sp.id || sp.published || !sp.schedDate || !sp.schedTime || !sp.post) continue;
      const dueMs = kstToMs(sp.schedDate, sp.schedTime);
      if (isNaN(dueMs) || dueMs > nowMs) continue;
      if (nowMs - dueMs > 24 * 3600 * 1000) { await db.update('scheduledPosts', sp.id, { published: true }); log.push('[SCHED-POST] 만료 스킵: ' + sp.id); continue; }
      const post = Object.assign({}, sp.post);
      if (!post.id) post.id = 'p' + dueMs;
      // 주간공지(wn-)는 누군가 이미 올렸으면 덮어쓰지 않는다
      if (String(post.id).indexOf('wn-') === 0 && await db.exists('posts', post.id)) {
        await db.update('scheduledPosts', sp.id, { published: true });
        log.push('[SCHED-POST] 이미 게시됨(스킵): ' + post.id);
        continue;
      }
      const k = kstNow(dueMs);
      post.ts = dueMs;
      post.date = k.getUTCFullYear() + '.' + String(k.getUTCMonth() + 1).padStart(2, '0') + '.' + String(k.getUTCDate()).padStart(2, '0');
      post.scheduled = false;
      await db.set('posts', post.id, post);
      if (sp.notif && sp.notif.id && !(await db.exists('notifications', sp.notif.id))) {
        const ndoc = Object.assign({ time: '방금', readBy: [], hiddenBy: [] }, sp.notif, { ts: dueMs, pushed: false });
        await db.set('notifications', sp.notif.id, ndoc);
      }
      await db.update('scheduledPosts', sp.id, { published: true });
      log.push('[SCHED-POST] 발행: ' + sp.id + ' → ' + post.id + ' (' + sp.schedDate + ' ' + sp.schedTime + ')');
    }
  } catch (e) {
    log.push('[WARN] 예약글 처리 실패: ' + String(e).slice(0, 80));
  }

  const cutoff = nowMs - MAX_AGE_HOURS * 3600 * 1000;

  // 아직 안 보낸 알림만 조회 (컬렉션 전체 읽기 금지 — 무료 할당량 초과의 주범이었음)
  // ts 로 거르면 ts 가 없는 알림(앱에서 만든 것)이 통째로 누락되므로 pushed 기준으로 조회한다.
  let notifs = [];
  try {
    notifs = await db.query('notifications', {
      field: 'pushed', op: 'EQUAL', value: false,
      limit: 30,
    });
  } catch (e) {
    log.push('[WARN] 알림 조회 실패: ' + String(e).slice(0, 80));
  }
  // pushed 필드가 없는 옛 알림 보완 — 매분 돌면 읽기 낭비라 10분에 한 번만 훑는다.
  // (앱이 이제 ts·pushed 를 항상 기록하므로, 과거 데이터 대비용 안전망)
  // 옛 알림(pushed 필드 없음) 보완 — 앱이 이제 항상 pushed:false 를 기록하므로
  // 안전망으로 15분에 한 번만 훑는다. (매분 훑으면 읽기 낭비)
  if (kstNow(nowMs).getUTCMinutes() % 15 === 0) {
    try {
      const legacy = await db.query('notifications', { limit: 15 });
      const seen = new Set(notifs.map(n => n.id));
      legacy.forEach(n => { if (n.id && n.pushed === undefined && !seen.has(n.id)) notifs.push(n); });
    } catch (e) {}
  }

  const pending = notifs
    .filter(n => n.id && !n.pushed)
    .filter(n => { const t = n.ts || notifTs(n.id); return !t || t >= cutoff; })   // 시각을 알 수 있으면 오래된 것 제외
    .sort((a, b) => (b.ts || notifTs(b.id) || 0) - (a.ts || notifTs(a.id) || 0))
    .slice(0, 30);
  if (!pending.length) {
    if (made) log.push(`[REM] ${made}건 생성`);
    if (madeSched) log.push(`[SCHED] ${madeSched}건 생성`);
    log.push('완료: 0건 발송 (회원 조회 없음)');
    return log;
  }

  // 여기까지 왔을 때만 회원·설정을 읽는다
  const membersList = await getMembers();
  const adminTokens = ((await getCfg()).adminFcm) || [];
  const totalDevices = membersList.reduce((t, u) => t + ((u.fcm || []).length), 0) + adminTokens.length;
  log.push(`등록된 기기: ${totalDevices}대 / 회원 ${membersList.length}명`);

  let sent = 0;
  for (const n of pending) {
    if (sent >= MAX_SEND) break;
    const nid = n.id;

    if (n.noPush) { await db.update('notifications', nid, { pushed: true }); continue; }

    const body = clean(n.text || '');
    if (!body) { await db.update('notifications', nid, { pushed: true }); continue; }

    const nTs = n.ts || notifTs(nid) || 0;   // 이 알림이 만들어진 시각

    let tokens = [];
    for (const u of recipients(n, membersList)) {
      if (u.notifMode === 'silent') continue;
      // 가입(joinedAt) 이전에 만들어진 알림은 그 사람에게 보내지 않음 (앱의 _joinTs 필터와 동일)
      if (nTs && joinedMsOf(u) > nTs) continue;
      tokens = tokens.concat(u.fcm || []);
    }
    if (n.forTeacher || n.forRole === 'all' || n.forRole === 'teacher') {
      tokens = tokens.concat(adminTokens);
    }
    tokens = [...new Set(tokens.filter(Boolean))].slice(0, 450);

    if (!tokens.length) {
      log.push(`[SKIP] ${nid} - 받을 기기 없음 : ${body.slice(0, 30)}`);
      // 학생 결석 알림은 학생이 아직 푸시를 안 켰을 수 있어, 확정하지 않고 12시간 안에 재시도한다.
      if (!String(nid).startsWith('nt-absent-s-')) {
        await db.update('notifications', nid, { pushed: true });
      }
      continue;
    }

    const dead = [];
    let ok = 0;
    for (const tk of tokens) {
      const res = await sendFCM(token, projectId, tk, body, nid, appUrl);
      if (res.ok) ok++;
      else if (res.dead) dead.push(tk);
    }
    log.push(`[SEND] ${nid} -> ${ok}/${tokens.length} : ${body.slice(0, 40)}`);

    if (dead.length) {
      for (const u of membersList) {
        const cur = u.fcm || [];
        const keep = cur.filter(t => !dead.includes(t));
        if (keep.length !== cur.length) {
          await db.update('members', u.id, { fcm: keep });
          u.fcm = keep;
          log.push(`   죽은 토큰 정리: members/${u.id}`);
        }
      }
      const keepAdmin = adminTokens.filter(t => !dead.includes(t));
      if (keepAdmin.length !== adminTokens.length) {
        await db.update('settings', 'app', { adminFcm: keepAdmin });
        adminTokens = keepAdmin;
        log.push('   죽은 토큰 정리: settings/adminFcm');
      }
    }
    sent++;
    // 성공 0건 + 실패가 '죽은 토큰'이 아닌 일시 오류면 확정하지 않고 다음 실행에서 재시도(최대 30분).
    const transientFail = (ok === 0 && tokens.length > 0 && dead.length < tokens.length);
    const nAge = nTs ? (nowMs - nTs) : Infinity;
    if (transientFail && nAge < 30 * 60 * 1000) {
      log.push(`   일시 전송 실패 → 재시도 대기(${Math.round(nAge / 60000)}분): ${nid}`);
    } else {
      await db.update('notifications', nid, { pushed: true });
    }
  }

  if (made) log.push(`[REM] ${made}건 생성`);
  if (madeSched) log.push(`[SCHED] ${madeSched}건 생성`);
  log.push(`완료: ${sent}건 발송`);
  return log;
}

// ────────────────────────────────────────────────────────────
// 10시 스케줄 알림 (생일·축일·결석)
// ────────────────────────────────────────────────────────────
async function buildScheduled(db, nowMs, members, log, cfg) {
  const kst = new Date(nowMs + KST_OFFSET);
  const hour = kst.getUTCHours();
  // 한국시간 10시부터. 10시대에 Cron이 걸러질 수 있으므로 22시까지는 '아직 없으면' 생성한다.
  // (문서 ID로 하루 1회 중복 방지되므로 여러 번 돌아도 알림은 한 번만 간다)
  if (hour < 10 || hour > 22) return 0;

  const m = kst.getUTCMonth() + 1, d = kst.getUTCDate(), yr = kst.getUTCFullYear();
  const dow = kst.getUTCDay(); // 0=일
  const tkey = `${yr}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  let made = 0;

  cfg = cfg || {};
  const vac = (cfg.vacDates || []).concat(cfg.eduVacDates || []);
  const approved = members.filter(u => u.approved && !u.hidden);

  const mk = async (id, doc) => {
    if (await db.exists('notifications', id)) return;
    await db.set('notifications', id, { id, time: '방금', readBy: [], hiddenBy: [], ts: nowMs, pushed: false, ...doc });
    made++;
  };

  // 생일
  for (const u of approved) {
    if (u.graduated) continue;
    if (+u.birthMonth === m && +u.birthDay === d) {
      await mk(`nt-bday-all-${u.id}-${yr}`, {
        text: `🎂 오늘은 <b>${u.name || ''} ${u.baptism || ''}</b>님의 생일이에요. 함께 축하해주세요!`,
        forRole: 'all', tap: { type: 'bday', targetId: u.id },
      });
      if (u.role === 'student') {
        await mk(`nt-bday-self-${u.id}-${yr}`, {
          text: '🎂 생일 축하해요! 오늘은 당신의 특별한 날이에요 🎉',
          forStudentId: u.id, tap: { type: 'bday', targetId: u.id },
        });
      }
    }
  }

  // 축일
  for (const u of approved) {
    if (+u.feastMonth === m && +u.feastDay === d) {
      await mk(`nt-feast-all-${u.id}-${yr}`, {
        text: `✝️ 오늘은 <b>${u.name || ''} ${u.baptism || ''}</b>님의 축일이에요. 함께 축하해주세요!`,
        forRole: 'all', tap: { type: 'bday', targetId: u.id },
      });
      if (u.role === 'student' && !u.graduated) {
        await mk(`nt-feast-self-${u.id}-${yr}`, {
          text: `✝️ 축일 축하해요! 오늘은 수호 성인 <b>성 ${u.baptism || ''}</b>의 날이에요 🙏`,
          forStudentId: u.id, tap: { type: 'bday', targetId: u.id },
        });
      }
    }
  }

  // 결석 (토요일 오전 10시, 직전 토요일까지 집계, 연속 3주+)
  if (dow === 6) {
    const todayStr = `${yr}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const sats = saturdaysBack(kst, 20).filter(s => !vac.includes(s) && s < todayStr);
    for (const u of approved) {
      if (u.role !== 'student' || u.graduated) continue;
      const attended = new Set(u.attendedWeeks || []);
      const jn = u.joinedAt || null;
      let n = 0;
      for (const w of sats) {
        if (jn && w < jn) break;          // 가입일 이전 주는 결석으로 세지 않음 (앱과 동일)
        if (attended.has(w)) break;
        n++;
      }
      if (n < 3) continue;
      const head = n >= 4 ? '🆘 [긴급]' : '🚨 [경고]';
      await mk(`nt-absent-t-${u.id}-${tkey}`, {
        text: `${head} <b>${u.name || ''} ${u.baptism || ''}</b> (${u.gradeLabel || ''}) 학생이 ${n}주 연속 결석했어요. 관리가 필요해요.`,
        forRole: 'teacher-grade-' + (u.gradeKey || ''), absentUid: u.id, tap: { type: 'absent' },
      });
      await mk(`nt-absent-s-${u.id}-${tkey}`, {
        text: '🙏 요즘 주일학교에서 얼굴을 못 봤어요. 다음 주엔 꼭 만나요! 기다리고 있을게요 💛',
        forStudentId: u.id, tap: { type: 'attend' },
      });
    }
  }

  // 주간공지 리마인더 (목요일 10시+, 아직 안 올렸으면 교감·교무·관리자에게)
  // 앱과 동일한 알림 ID(nt-wnrem-<토요일>-<교사id>)를 써서 중복 생성이 안 되게 한다.
  if (dow === 4) {
    const wnSat = nextSaturdayStr(kst);                 // 이번 주 토요일(다가오는)
    const posted = await db.exists('posts', 'wn-' + wnSat);  // 이미 주간공지를 올렸는가
    if (!posted) {
      const dd = wnSat.split('-');
      const wnTitle = `${+dd[1]}월 ${+dd[2]}일 주간공지`;
      for (const u of approved) {
        if (u.role !== 'teacher') continue;
        if (!(u.teacherType === 'principal' || u.teacherType === 'admin' || u.isAdmin)) continue;
        await mk(`nt-wnrem-${wnSat}-${u.id}`, {
          text: `📢 <b>${wnTitle}</b>를 올려주세요 (목요일)`,
          forTeacherId: u.id, tap: { type: 'weekly-notice' },
        });
      }
      if (made) log.push('[WN] 주간공지 리마인더 생성');
    }
  }

  return made;
}

// ────────────────────────────────────────────────────────────
// 수신 대상 계산 (앱의 notifMatch 와 동일)
// ────────────────────────────────────────────────────────────
function recipients(n, members) {
  const out = [];
  for (const u of members) {
    if (!u.approved || u.hidden) continue;
    if ((n.hiddenBy || []).includes(u.id)) continue;
    let ok = false;
    if (n.forStudentId) ok = u.id === n.forStudentId;
    else if (n.forTeacherId) ok = u.id === n.forTeacherId;
    else if (n.forTeacher) ok = u.role === 'teacher';
    else {
      const role = n.forRole;
      if (role === 'all') ok = true;
      else if (role === 'teacher') ok = u.role === 'teacher';
      else if (role === 'student') ok = u.role === 'student';
      else if (role === 'parent') ok = u.role === 'parent';
      else if (role === 'teacher-parent') ok = u.role === 'teacher' || u.role === 'parent';
      else if (role && role.startsWith('teacher-grade-')) {
        const gk = role.replace('teacher-grade-', '');
        ok = u.role === 'teacher' && (u.teacherType === gk || u.teacherType === 'principal' || u.teacherType === 'admin' || u.isAdmin);
      } else if (!role) ok = true;
    }
    if (ok) out.push(u);
  }
  return out;
}

// ────────────────────────────────────────────────────────────
// FCM 발송 (HTTP v1 API)
// ────────────────────────────────────────────────────────────
async function sendFCM(accessToken, projectId, deviceToken, body, nid, appUrl) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        // 절전(Doze) 상태에서도 즉시 깨우도록 높은 우선순위로 보낸다. TTL 하루.
        webpush: { headers: { Urgency: 'high', TTL: '86400' } },
        // notification 블록을 넣지 않는다 — 넣으면 브라우저가 자동으로 알림을 하나 더 그려서
        // 서비스워커의 onBackgroundMessage 와 합쳐 2개가 뜬다. data 만 보내 SW가 1개만 그리게 함.
        data: {
          nid: String(nid),
          url: appUrl,
          title: '하늘의문 중고등부',
          body: body.slice(0, 180),
        },
      },
    }),
  });
  if (res.ok) return { ok: true };
  let err = '';
  try { err = JSON.stringify(await res.json()); } catch (e) { err = String(res.status); }
  const dead = err.includes('UNREGISTERED') || err.includes('INVALID_ARGUMENT') || err.includes('NOT_FOUND');
  return { ok: false, dead, err };
}

// ────────────────────────────────────────────────────────────
// 서비스 계정 → OAuth 액세스 토큰 (JWT 서명)
// ────────────────────────────────────────────────────────────
async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  };
  const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = enc(header) + '.' + enc(claim);
  const key = await importKey(sa.private_key);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = unsigned + '.' + b64url(new Uint8Array(sig));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const j = await res.json();
  if (!j.access_token) throw new Error('토큰 발급 실패: ' + JSON.stringify(j));
  return j.access_token;
}

async function importKey(pem) {
  const b = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const bin = Uint8Array.from(atob(b), c => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', bin.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

function b64url(bytes) {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ────────────────────────────────────────────────────────────
// Firestore REST 최소 클라이언트
// ────────────────────────────────────────────────────────────
class Firestore {
  constructor(projectId, token) {
    this.base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    this.token = token;
  }
  _h() { return { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }; }

  async list(col) {
    const out = [];
    let pageToken = '';
    do {
      const url = this.base + '/' + col + '?pageSize=300' + (pageToken ? '&pageToken=' + pageToken : '');
      const res = await fetch(url, { headers: this._h() });
      const j = await res.json();
      if (j.error) throw new Error(col + ' 조회 오류: ' + (j.error.message || JSON.stringify(j.error)));
      (j.documents || []).forEach(doc => out.push(fromFsDoc(doc)));
      pageToken = j.nextPageToken || '';
    } while (pageToken);
    return out;
  }
  // 조건 쿼리 — 컬렉션 전체를 읽지 않고 필요한 문서만 가져온다 (읽기 절약의 핵심)
  async query(col, { field, op = 'GREATER_THAN_OR_EQUAL', value, orderBy, desc = true, limit = 30 } = {}) {
    const body = { structuredQuery: { from: [{ collectionId: col }], limit } };
    if (field !== undefined) {
      body.structuredQuery.where = {
        fieldFilter: { field: { fieldPath: field }, op, value: toFsVal(value) },
      };
    }
    if (orderBy) {
      body.structuredQuery.orderBy = [
        { field: { fieldPath: orderBy }, direction: desc ? 'DESCENDING' : 'ASCENDING' },
      ];
    }
    const res = await fetch(this.base + ':runQuery', {
      method: 'POST', headers: this._h(), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(col + ' 쿼리 오류: ' + (await res.text()).slice(0, 120));
    const j = await res.json();
    return (j || []).filter(r => r.document).map(r => fromFsDoc(r.document));
  }
  async get(col, id) {
    const res = await fetch(`${this.base}/${col}/${encodeURIComponent(id)}`, { headers: this._h() });
    if (!res.ok) return null;
    return fromFsDoc(await res.json());
  }
  async exists(col, id) {
    const res = await fetch(`${this.base}/${col}/${encodeURIComponent(id)}`, { headers: this._h() });
    return res.ok;
  }
  async set(col, id, obj) {
    return fetch(`${this.base}/${col}/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: this._h(), body: JSON.stringify({ fields: toFsFields(obj) }),
    });
  }
  async update(col, id, obj) {
    const mask = Object.keys(obj).map(k => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
    return fetch(`${this.base}/${col}/${encodeURIComponent(id)}?${mask}`, {
      method: 'PATCH', headers: this._h(), body: JSON.stringify({ fields: toFsFields(obj) }),
    });
  }
}

// Firestore 값 ↔ JS 값 변환
function fromFsDoc(doc) {
  const o = { _name: doc.name };
  const f = doc.fields || {};
  for (const k in f) o[k] = fromFsVal(f[k]);
  if (o.id === undefined && doc.name) o.id = doc.name.split('/').pop();
  return o;
}
function fromFsVal(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFsVal);
  if ('mapValue' in v) { const o = {}; const f = v.mapValue.fields || {}; for (const k in f) o[k] = fromFsVal(f[k]); return o; }
  return null;
}
function toFsFields(obj) { const f = {}; for (const k in obj) f[k] = toFsVal(obj[k]); return f; }
function toFsVal(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsVal) } };
  if (typeof v === 'object') return { mapValue: { fields: toFsFields(v) } };
  return { nullValue: null };
}

// ────────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────────
const KEEP_ICONS = ['\u{1F6A8}', '\u{1F198}'];   // 중요/긴급 표시만 유지
function clean(t) {
  return String(t || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    // 장식용 아이콘 제거 (알림 문구를 간결하게)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2200}-\u{2BFF}\u{FE0F}\u{20E3}\u{2122}\u{2139}]/gu,
      (m) => (KEEP_ICONS.includes(m) ? m : ''))
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
function kstNow(ms){ return new Date((ms||Date.now()) + KST_OFFSET); }
function joinedMsOf(u) {
  // 정밀 가입 시각(joinedTs) 우선. 없으면 joinedAt(날짜)의 KST 자정.
  if (u && u.joinedTs) return Number(u.joinedTs) || 0;
  var j = u && u.joinedAt;
  if (!j || typeof j !== 'string') return 0;
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(j);
  if (!m) return 0;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], 0, 0, 0) - KST_OFFSET;
}
function notifTs(nid) { const m = String(nid || '').match(/(\d{13})/); return m ? Number(m[1]) : null; }
function kstToMs(date, time) {
  // date=YYYY-MM-DD, time=HH:MM (한국시간)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m || !t) return NaN;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]) - KST_OFFSET;
}
function nextSaturdayStr(kstDate) {
  // kstDate(KST) 기준으로 다가오는(또는 오늘) 토요일 YYYY-MM-DD
  let d = new Date(Date.UTC(kstDate.getUTCFullYear(), kstDate.getUTCMonth(), kstDate.getUTCDate()));
  const diff = (6 - d.getUTCDay() + 7) % 7;
  d = new Date(d.getTime() + diff * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
function saturdaysBack(kstDate, n) {
  // kstDate: KST 기준 Date (UTC 메서드로 읽음)
  const out = [];
  let d = new Date(Date.UTC(kstDate.getUTCFullYear(), kstDate.getUTCMonth(), kstDate.getUTCDate()));
  while (d.getUTCDay() !== 6) d = new Date(d.getTime() - 86400000);
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getTime() - i * 7 * 86400000);
    out.push(`${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}-${String(x.getUTCDate()).padStart(2, '0')}`);
  }
  return out;
}
