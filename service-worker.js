// service-worker.js — High Performance (Navigation Preload 有効)
// -------------------------------------------------------------

// ⚠ 必ずバージョンを上げてデプロイ（キャッシュ破棄のため）
const CACHE_VER  = 'v5';
const CACHE_NAME = `hnc-pwa-${CACHE_VER}`;

// クリティカルアセット（初回表示に必要な最小限）
const PRECACHE = [
  '/',                     // ルート
  '/index.html',           // HTML
  '/style.css?v=31',       // CSS（バージョンはあなたの値に合わせて）
  '/app.js?v=31',          // JS（同上）
  '/manifest.json',        // PWA
  '/icon.png',             // アイコン
];

// 外部APIなど「キャッシュしない(or 短期)」URL判定
const isBypassCache = (url) => {
  const u = new URL(url, self.location.origin);
  // 1) クロスオリジンの治験APIは常にネット優先（opaque増殖を防ぐ）
  if (u.hostname !== self.location.hostname) return true;
  // 2) 任意に追加（例：/api/ など）
  // if (u.pathname.startsWith('/api/')) return true;
  return false;
};

// -------------------------------------------------------------
// Install: コアファイルを先読み（Precache）
// -------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE);
  })());
  self.skipWaiting();
});

// -------------------------------------------------------------
// Activate: 古いキャッシュ削除 + Navigation Preload 有効化
// -------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve())
    );

    // Navigation Preload を有効化（重要）
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

// -------------------------------------------------------------
// Fetch: 高速初期表示のための戦略
//  - Document: preloadResponse → network → cache → /index.html
//  - 静的アセット(CSS/JS/画像): Stale-While-Revalidate
//  - 外部APIなどはネット直行（bypass）
// -------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1) Navigation / Document
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith((async () => {
      try {
        // A. Preload（ブラウザが並列で取りにいったもの）を**必ず await**
        const preload = await event.preloadResponse;
        if (preload) return preload;

        // B. ネットワーク（最速）
        const net = await fetch(request);
        // HTML は都度変わる可能性もあるため、ここではキャッシュに保存しない
        return net;
      } catch (err) {
        // C. オフライン時はキャッシュ or SPA fallback
        const cached = await caches.match(request);
        return cached || caches.match('/index.html');
      }
    })());
    return;
  }

  // 2) 外部API や bypass 対象はネット直行（キャッシュしない）
  if (isBypassCache(request.url)) {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch (err) {
        // API はフォールバックなし（必要ならここでダミー応答を作る）
        return new Response('', { status: 504, statusText: 'Gateway Timeout' });
      }
    })());
    return;
  }

  // 3) 静的リソース（CSS/JS/画像等）は「Stale-While-Revalidate」
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const fetchAndUpdate = fetch(request)
      .then((res) => {
        // 応答が有効ならキャッシュ更新
        if (res && (res.status === 200 || res.type === 'opaqueredirect' || res.type === 'basic')) {
          cache.put(request, res.clone());
        }
        return res;
      })
      .catch(() => cached); // ネット失敗時は手元のキャッシュを返す

    // 手元にあれば即返して体感を速く、その裏で更新
    return cached || fetchAndUpdate;
  })());
});

// -------------------------------------------------------------
// オプション：メッセージ経由で手動アップデート（任意）
// -------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
