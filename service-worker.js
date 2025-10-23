// service-worker.js — Navigation Preload 安定化版
// -------------------------------------------------------------
const CACHE_VER  = 'v6';
const CACHE_NAME = `hnc-pwa-${CACHE_VER}`;

const PRECACHE = [
  '/', '/index.html',
  '/style.css?v=31',
  '/app.js?v=31',
  '/manifest.json', '/icon.png',
];

// 外部API等はキャッシュしない
const isBypassCache = (url) => {
  const u = new URL(url, self.location.origin);
  return u.origin !== self.location.origin;
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 古いキャッシュ削除
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : null));

    // Navigation Preload 有効化（対応環境のみ）
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

// ---------------------------------------------
// 重要ポイント：
// - navigation では *必ず* respondWith 内で preloadResponse を await
// - さらに waitUntil にも preloadResponse をぶら下げて、Promise を放置しない
// ---------------------------------------------
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Document / Navigation
  if (req.mode === 'navigate' || req.destination === 'document') {
    // preloadResponse が発火したなら、解決まで待つ（警告抑止）
    if (self.registration.navigationPreload && event.preloadResponse) {
      event.waitUntil(event.preloadResponse.catch(() => {}));
    }

    event.respondWith((async () => {
      try {
        // 1) Preload を最優先で利用
        if (self.registration.navigationPreload && event.preloadResponse) {
          const pre = await event.preloadResponse;
          if (pre) return pre;
        }
        // 2) ネット
        const net = await fetch(req);
        return net;
      } catch {
        // 3) オフライン時フォールバック
        const cached = await caches.match(req);
        return cached || caches.match('/index.html');
      }
    })());
    return;
  }

  // 外部APIなどはネット直行
  if (isBypassCache(req.url)) {
    event.respondWith((async () => {
      try { return await fetch(req); }
      catch { return new Response('', { status: 504, statusText: 'Gateway Timeout' }); }
    })());
    return;
  }

  // 静的資産は Stale-While-Revalidate
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const updating = fetch(req).then(res => {
      if (res && (res.status === 200 || res.type === 'basic' || res.type === 'opaqueredirect')) {
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => cached);
    return cached || updating;
  })());
});

// 手動アップデート用（任意）
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
