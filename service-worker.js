// service-worker.js — Navigation Preload 安定化＆高速初期表示
// ------------------------------------------------------------
const CACHE_VER  = 'v7';                     // ← 変更して更新を強制
const CACHE_NAME = `hnc-pwa-${CACHE_VER}`;
const PRECACHE = [
  '/', '/index.html',
  '/style.css?v=31',
  '/app.js?v=31',
  '/manifest.json', '/icon.png',
];

// 外部（同一オリジン以外）や API はキャッシュしない
const isExternal = (url) => new URL(url, self.location.origin).origin !== self.location.origin;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 古いキャッシュの掃除
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : null));

    // Navigation Preload を有効化（対応環境のみ）
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

// fetch
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // ------- Document / Navigation -------
  if (req.mode === 'navigate' || req.destination === 'document') {
    // preloadResponse を必ず消化（警告の根治）
    const preloadPromise = (self.registration.navigationPreload && event.preloadResponse)
      ? event.preloadResponse
      : Promise.resolve(null);
    event.waitUntil(preloadPromise.catch(() => {}));

    event.respondWith((async () => {
      try {
        // 1) preload を最優先で待つ
        const pre = await preloadPromise;
        if (pre) return pre;

        // 2) ネット優先（初期表示を高速化）
        const net = await fetch(req);
        // 成功したら裏でキャッシュ更新（次回オフライン用）
        const cache = await caches.open(CACHE_NAME);
        cache.put('/', net.clone());
        return net;
      } catch {
        // 3) オフライン時はキャッシュフォールバック
        const cacheHit = await caches.match(req);
        return cacheHit || caches.match('/index.html');
      }
    })());
    return;
  }

  // ------- 外部 or API 等はネット直行 -------
  if (isExternal(req.url)) {
    event.respondWith((async () => {
      try { return await fetch(req); }
      catch { return new Response('', { status: 504, statusText: 'Gateway Timeout' }); }
    })());
    return;
  }

  // ------- 静的資産は Stale-While-Revalidate -------
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const updating = fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || updating;
  })());
});

// 手動更新（任意）
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
