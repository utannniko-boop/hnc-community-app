// service-worker.js — 安定・高速・警告ゼロ版（navigation preload を完全無効化）
const VER = 'v9';
const CACHE_NAME = `hnc-cache-${VER}`;
const PRECACHE = [
  '/', '/index.html',
  '/style.css?v=31',
  '/app.js?v=31',
  '/manifest.json', '/icon.png'
];

// ---- 便利関数
const sameOrigin = (req) => new URL(req.url).origin === self.location.origin;
const isHTML = (req) => req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
const timeout = (ms, p) => Promise.race([p, new Promise((_, rej)=>setTimeout(()=>rej(new Error('timeout')), ms))]);

// ---- install: 事前キャッシュ & preload完全OFF
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.disable(); } catch {}
      }
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE);
    } catch(e) {
      // オフライン初回でも続行
    }
  })());
  self.skipWaiting();
});

// ---- activate: 古いキャッシュ削除 & preload完全OFF & 即時制御
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch {}
    }
    await self.clients.claim();
  })());
});

// ---- fetch: HTMLはネット優先(3秒タイムアウト)→キャッシュ、静的はSWR
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // すべての fetch に respondWith を与え、preload 周りの警告を根絶
  if (isHTML(req)) {
    event.respondWith(networkFirstHTML(req));
  } else if (sameOrigin(req) && (/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i).test(new URL(req.url).pathname)) {
    event.respondWith(staleWhileRevalidate(req));
  } else {
    // そのほかは通常のネット（失敗時のみキャッシュ）
    event.respondWith(networkWithCacheFallback(req));
  }
});

// ---- 戦略: HTML はネット優先 + 3秒タイムアウト
async function networkFirstHTML(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const net = await timeout(3000, fetch(req, { cache: 'no-store' }));
    // 成功したら保存（検索クエリは別物として保持）
    cache.put(req, net.clone());
    return net;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: false });
    if (hit) return hit;
    // index.html を最後の砦に
    const fallback = await cache.match('/index.html');
    if (fallback) return fallback;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// ---- 戦略: 静的資産は stale-while-revalidate
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req, { ignoreSearch: false });
  const fetchPromise = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(()=>null);
  return cached || await fetchPromise || new Response('', { status: 504 });
}

// ---- 戦略: ネット優先（失敗したらキャッシュ）
async function networkWithCacheFallback(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    if (res && res.ok && sameOrigin(req)) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: false });
    if (hit) return hit;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
