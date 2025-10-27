// service-worker.js — resilient cache & quiet logs
const VER = 'v36';
const CACHE = `hnc-${VER}`;

// ここは「存在が確実なパス名」のみ（クエリは書かない）
const CORE = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'icon.png',
];

// ---- ユーティリティ
const toAbs = (p) => new URL(p, self.registration.scope).href;
const sameOrigin = (req) => new URL(req.url).origin === self.location.origin;
const isHTML = (req) =>
  req.mode === 'navigate' ||
  (req.headers.get('accept') || '').includes('text/html');

// クエリ付きの静的資産は「パスのみ」をキーにキャッシュする
function normalizeStaticRequest(req) {
  const u = new URL(req.url);
  if (!sameOrigin(req)) return req;
  if (!/\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(u.pathname)) return req;
  return new Request(u.origin + u.pathname, { method: req.method, headers: req.headers });
}

// ---- install: navigation preload を無効化 & 安全プリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.disable(); } catch {}
      }
      const cache = await caches.open(CACHE);

      // 1件ずつ安全に precache（失敗しても続行）
      const tasks = CORE.map(async (p) => {
        const url = toAbs(p);
        try {
          const res = await fetch(url, { cache: 'reload' });
          if (!res.ok) throw new Error(`${res.status} ${url}`);
          // パス名キーで格納（将来の ?v=xx に効く）
          const u = new URL(url);
          const key = new Request(u.origin + u.pathname);
          await cache.put(key, res.clone());
        } catch (e) {
          // 失敗はログだけにして SW の install 自体は成功させる
          console.warn('[SW] precache skip:', p, String(e));
        }
      });
      await Promise.allSettled(tasks);
    } catch (e) {
      console.warn('[SW] install error:', e);
    }
  })());
  self.skipWaiting();
});

// ---- activate: 古いキャッシュ掃除 & 先読みOFF & 即時制御
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k === CACHE ? Promise.resolve() : caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch {}
    }
    await self.clients.claim();
  })());
});

// ---- fetch: HTML はネット優先 → キャッシュ、静的は SWR（キー正規化）
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // ナビゲーションは常に respondWith（警告対策）
  if (isHTML(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const net = await fetch(req, { cache: 'no-store' });
        // index.html のみパス名キーで更新
        const u = new URL(toAbs('index.html'));
        await cache.put(new Request(u.origin + u.pathname), net.clone());
        return net;
      } catch {
        // パス名キーでフォールバック（/index.html）
        const hit = await cache.match(toAbs('index.html'));
        if (hit) return hit;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // 同一オリジンの静的資産は SWR（クエリ無視のキーを使う）
  if (sameOrigin(req) && /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i.test(new URL(req.url).pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const keyReq = normalizeStaticRequest(req); // パス名キー
      const cached = await cache.match(keyReq);
      const fetching = fetch(req).then(async (res) => {
        if (res && res.ok) {
          // ネット成功時はパス名キーで更新
          await cache.put(keyReq, res.clone());
        }
        return res;
      }).catch(() => null);
      return cached || (await fetching) || new Response('', { status: 504 });
    })());
    return;
  }

  // その他はネット優先（同一オリジンのみ成功時キャッシュ）
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res && res.ok && sameOrigin(req)) {
        // その他はそのままのキー（APIなど）
        await cache.put(req, res.clone());
      }
      return res;
    } catch {
      const hit = await cache.match(req);
      return hit || new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
