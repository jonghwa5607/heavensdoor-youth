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
  const n = payload.notification || {};
  const d = payload.data || {};
  self.registration.showNotification(n.title || '하늘의문 중고등부', {
    body: n.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.nid || undefined,
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
