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
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: d.nid || undefined,      // 같은 알림이면 하나로 합쳐짐(중복 방지 보강)
      renotify: false,
      silent: silent,               // 무음이면 소리·진동 없음
      vibrate: silent ? [] : [200, 100, 200],
      data: { url: d.url || '/' }
    });
  });
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
