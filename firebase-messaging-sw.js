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

messaging.onBackgroundMessage(function (payload) {
  const d = payload.data || {};
  const n = payload.notification || {};
  self.registration.showNotification(d.title || n.title || '하늘의문 중고등부', {
    body: d.body || n.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.nid || undefined,      // 같은 알림이면 하나로 합쳐짐(중복 방지 보강)
    renotify: false,
    vibrate: [200, 100, 200],
    data: { url: d.url || '/' }
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
