// service-worker.js — navigation preload used correctly
const VER = 'v1-preload';
const CACHE = `hnc-${VER}`;
const PRECACHE = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json', '/icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(PRECACHE);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // ★ 有効化
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    // 旧キャッシュ掃除
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k === CACHE ? Promise.resolve() : caches.delete(k)));
    await self.clients.claim();
  })());
});

// ナビゲーションは必ず respondWith の中で preloadResponse を「待つ」
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);

      // 1) 先読みがあれば最優先で使う（★ここが肝）
      const pre = await event.preloadResponse;
      if (pre) {
        cache.put(req, pre.clone());
        return pre;
      }

      // 2) 通常のネット → キャッシュ更新
      try {
        const net = await fetch(req, { cache: 'no-store' });
        cache.put(req, net.clone());
        return net;
      } catch {
        // 3) オフライン時はキャッシュ → index.html
        const hit = await cache.match(req) || await cache.match('/index.html');
        return hit || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // （以下は B と同じでOK）
  event.respondWith((async () => {
    if (new URL(req.url).origin === self.location.origin &&
        /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(new URL(req.url).pathname)) {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const fetching = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(()=>null);
      return cached || (await fetching) || new Response('', { status: 504 });
    }
    try { return await fetch(req); }
    catch {
      const cache = await caches.open(CACHE);
      return (await cache.match(req)) || new Response('Offline', { status: 503 });
    }
  })());
});
