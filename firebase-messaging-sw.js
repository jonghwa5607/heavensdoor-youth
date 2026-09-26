/* 하늘의문 중고등부 — FCM 백그라운드 푸시 수신 서비스워커
   저장 위치: index.html 과 같은 폴더(저장소 루트) */

importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD6L-1ZpEosMsnOUoKy52gmOAmvPdiwoj0",
  authDomain: "heavensdoor-teen.firebaseapp.com",
  projectId: "heavensdoor-teen",
  storageBucket: "heavensdoor-teen.firebasestorage.app",
  messagingSenderId: "122338824909",
  appId: "1:122338824909:web:738ee265236ef485cdcf84"
});

const messaging = firebase.messaging();

/* 앱이 저장한 진동/무음 설정을 IndexedDB(hd-prefs/kv/notifMode)에서 읽는다.
   서비스워커는 localStorage에 접근할 수 없으므로 IndexedDB를 다리로 사용. */
function readNotifMode() {
  return new Promise(function (resolve) {
    try {
      var req = indexedDB.open('hd-prefs', 1);
      req.onupgradeneeded = function () { try { req.result.createObjectStore('kv'); } catch (e) {} };
      req.onsuccess = function () {
        try {
          var db = req.result;
          var tx = db.transaction('kv', 'readonly');
          var g = tx.objectStore('kv').get('notifMode');
          g.onsuccess = function () { resolve(g.result === 'silent' ? 'silent' : 'vibrate'); };
          g.onerror = function () { resolve('vibrate'); };
        } catch (e) { resolve('vibrate'); }
      };
      req.onerror = function () { resolve('vibrate'); };
    } catch (e) { resolve('vibrate'); }
  });
}

messaging.onBackgroundMessage(function (payload) {
  const d = payload.data || {};
  const n = payload.notification || {};
  return readNotifMode().then(function (mode) {
    const silent = (mode === 'silent');
    return self.registration.showNotification(d.title || n.title || '하늘의문 중고등부', {
      body: d.body || n.body || '',
      badge: 'badge-mono.png',
      tag: d.nid || undefined,      // 같은 알림이면 하나로 합쳐짐(중복 방지 보강)
      renotify: false,
      silent: silent,               // 무음이면 소리·진동 없음
      vibrate: silent ? [] : [200, 100, 200],
      // 클릭 시 앱이 해당 페이지로 이동할 수 있도록 알림번호(nid)·이동주소를 함께 저장
      data: { url: d.url || '/', nid: d.nid || '' }
    });
  });
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var data = (e.notification && e.notification.data) || {};
  var nid = data.nid || '';
  // 앱을 열 주소: 알림번호가 있으면 ?hdnid= 로 넘겨 정확한 페이지로 이동, 없으면 최근 알림으로
  var openUrl = nid ? ('/?hdnid=' + encodeURIComponent(nid)) : '/?opennotif=1';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        // 이미 앱이 열려 있으면: 그 창에 알림번호를 전달하고(→해당 페이지로 이동) 포커스
        if ('focus' in c) {
          try { c.postMessage({ type: 'hd-notif-open', nid: nid }); } catch (_) {}
          return c.focus();
        }
      }
      // 열린 창이 없으면 새로 연다 (앱이 로드되며 ?hdnid= 를 읽어 이동)
      if (clients.openWindow) return clients.openWindow(openUrl);
    })
  );
});
