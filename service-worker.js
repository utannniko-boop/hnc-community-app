/* =========================================================
   HNC Community PWA - Service Worker (safe SWR pattern)
   - 「Response body is already used」を回避
   - GET のみキャッシュ対象
   - 同一オリジンの静的アセットはプリキャッシュ
   ========================================================= */

const VERSION = 'v8'; // ← 数字を上げると更新が確実
const STATIC_CACHE = `static-${VERSION}`;

// ルート配下のパスを想定（GitHub Pages でサブパスなら調整）
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './resources.json',
  './icon.png',
  './supabase-client.js',
];

// ---- install: プリキャッシュ ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// ---- activate: 古いキャッシュ削除 ＋ navigation preload ----
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 古いバージョンのキャッシュを掃除
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => (key !== STATIC_CACHE ? caches.delete(key) : Promise.resolve()))
    );

    // Navigation Preload（対応ブラウザのみ）
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch (_) {}
    }
    self.clients.claim();
  })());
});

// ---- fetch: stale-while-revalidate（安全な clone の仕方）----
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 非GET・chrome-extension等はスルー
  if (req.method !== 'GET' || req.url.startsWith('chrome-extension://')) return;

  // API 等の別オリジンは network-first（キャッシュ汚染を避ける）
  const sameOrigin = new URL(req.url).origin === self.location.origin;

  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);

    // 1) まずキャッシュ（同一オリジンの静的）を探す
    const cached = await cache.match(req);
    // 2) ネットワークから最新を取得（取得できたらキャッシュ更新）
    const networkPromise = fetch(req, { cache: 'no-store' })
      .then(async (netRes) => {
        // ここで netRes は一度しか使えないので、put 用に clone を作る
        // ただしエラー応答はキャッシュしない。opaque はOK（CDNなどで発生）
        try {
          const cacheable = netRes.ok || netRes.type === 'opaque';
          if (cacheable && sameOrigin) {
            await cache.put(req, netRes.clone());
          }
        } catch (e) {
          // put 失敗は無視（quota等）
        }
        return netRes; // これはそのまま返却（ここでは clone しない）
      })
      .catch(() => undefined); // オフライン等

    // 3) 返すものの優先順位
    //    - 同一オリジン: キャッシュがあれば先に返す（SWR）
    //    - 異オリジン: ネット成功なら返す、だめなら（同一オリジンなら）キャッシュ
    if (sameOrigin) {
      return cached || (await networkPromise) || offlineFallback(req);
    } else {
      return (await networkPromise) || cached || offlineFallback(req);
    }
  })());
});

// ---- ナビゲーション時の簡易フォールバック（任意）----
function offlineFallback(req) {
  // HTML ナビゲーションなら簡易メッセージを返す
  if (req.mode === 'navigate') {
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title><h1>オフラインです</h1><p>ネットワーク接続を確認して再読み込みしてください。</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
  return new Response('', { status: 503 });
}
