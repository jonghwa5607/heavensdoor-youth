/* 하늘의문 중고등부 PWA service worker
   버전을 올리면(예: hd-v2) 배포 시 기존 캐시가 자동 정리됩니다. */
const CACHE = 'hd-v2';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './assets.js',
  './app.js',
  './app-sync.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function staleWhileRevalidate(req) {
  return caches.open(CACHE).then(function (c) {
    return c.match(req).then(function (cached) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200) c.put(req, res.clone());
        return res;
      }).catch(function () { return cached; });
      return cached || net;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Google Fonts (CSS + woff2) → 오프라인에서도 글씨체 유지되도록 캐시
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }

  // 그 외 외부 요청(Firebase/Firestore/Auth 등)은 절대 건드리지 않음 → 실시간 동기화 보호
  if (url.origin !== self.location.origin) return;

  // 앱 화면(HTML) → 네트워크 우선(최신 반영), 오프라인이면 캐시된 셸로 폴백
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var cp = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', cp); });
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) { return r || caches.match('./'); });
      })
    );
    return;
  }

  // 앱 코드·스타일(app.js/app-sync.js/styles.css) → 네트워크 우선(배포 즉시 반영),
  // 오프라인이면 캐시로 폴백. assets.js(대용량 정적 데이터)는 아래 캐시 우선으로 처리.
  var pth = url.pathname;
  if (/\.(?:js|css)$/.test(pth) && !/assets\.js$/.test(pth)) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, cp); });
        }
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  // 같은 도메인의 정적 파일(아이콘, assets.js 등) → 캐시 우선
  e.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, cp); });
        }
        return res;
      });
    })
  );
});
