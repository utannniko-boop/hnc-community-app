// service-worker.js — navigation preload完全対応・高速初期表示・警告ゼロ
const VER = 'v10';
const CACHE_NAME = `hnc-cache-${VER}`;

// index.html / style.css?v=32 / app.js?v=32 に合わせておくこと！
const PRECACHE = [
  '/', '/index.html',
  '/style.css?v=32',
  '/app.js?v=32',
  '/manifest.json',
  '/icon.png'
];

// -------- ユーティリティ
const sameOrigin = (req) => new URL(req.url).origin === self.location.origin;
const isHTML = (req) =>
  req.mode === 'navigate' ||
  (req.destination === 'document') ||
  ((req.headers.get('accept') || '').includes('text/html'));

const timeout = (ms, p) =>
  Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
  ]);

// -------- install: 事前キャッシュ & preload を明示的に enable
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      // 旧SWの中途半端な状態を避けるため、いったん enable して統一扱いにする
      if (self.registration.navigationPreload) {
        try { await self.registration.navigationPreload.enable(); } catch {}
      }
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE);
    } catch (e) {
      // オフライン初回等はスキップ（失敗しても致命ではない）
    }
  })());
  self.skipWaiting();
});

// -------- activate: 古いキャッシュ削除 & 即時制御
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())
    );
    // ここでは disable しない（fetch 内で preloadResponse を待ち受ける実装に統一）
    await self.clients.claim();
  })());
});

// -------- SKIP_WAITING メッセージ対応（HTML側で送っている）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// -------- fetch: すべて respondWith し、navigation preload を正しく待つ
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (isHTML(req)) {
    // ナビゲーション: preloadResponse → ネット(3s) → キャッシュ → index.html
    event.respondWith(handleNavigation(event));
    return;
  }

  // 同一オリジンの静的資産は SWR（検索クエリも含めてキー化）
  const isStatic = sameOrigin(req) && (
    /\.(css|js|png|jpe?g|gif|svg|webp|ico|woff2?|ttf)$/.test(new URL(req.url).pathname)
  );

  if (isStatic) {
    event.respondWith(staleWhileRevalidate(req));
  } else {
    // その他はネット優先（失敗したらキャッシュ）
    event.respondWith(networkWithCacheFallback(req));
  }
});

// -------- HTMLナビゲーション戦略
async function handleNavigation(event) {
  const req = event.request;
  const cache = await caches.open(CACHE_NAME);

  // 1) navigation preload のレスポンスがあれば最優先で返す（必ず await する）
  try {
    const pre = await event.preloadResponse;
    if (pre) {
      // キャッシュしてから返す
      try { cache.put(req, pre.clone()); } catch {}
      return pre;
    }
  } catch {
    // 取得不能でも問題なし（以降でフォールバック）
  }

  // 2) ネット（3秒タイムアウト, no-store）
  try {
    const net = await timeout(3000, fetch(req, { cache: 'no-store' }));
    try { cache.put(req, net.clone()); } catch {}
    return net;
  } catch {
    // 3) キャッシュ（検索クエリも含めて厳密に見る）
    const hit = await cache.match(req, { ignoreSearch: false });
    if (hit) return hit;
    // 4) 最終フォールバック: index.html
    const fallback = await cache.match('/index.html');
    if (fallback) return fallback;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// -------- 静的資産: stale-while-revalidate
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req, { ignoreSearch: false });

  const fetchPromise = fetch(req).then(res => {
    if (res && res.ok) {
      try { cache.put(req, res.clone()); } catch {}
    }
    return res;
  }).catch(() => null);

  // キャッシュがあれば即返し、バックグラウンドで更新
  return cached || await fetchPromise || new Response('', { status: 504 });
}

// -------- その他: ネット優先（失敗したらキャッシュ）
async function networkWithCacheFallback(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    if (res && res.ok && sameOrigin(req)) {
      try { cache.put(req, res.clone()); } catch {}
    }
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: false });
    if (hit) return hit;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
