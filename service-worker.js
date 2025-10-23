// service-worker.js（GitHub Pages対応・相対パス版）
const VERSION = 'hnc-app-v7'; // ← 数字を変えるとキャッシュが確実に更新されます
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

// ---- install ----
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ASSETS))
  );
});

// ---- activate ----
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    )
  );
});

// ---- fetch ----
self.addEventListener('fetch', (e) => {
  // APIなど、非GETはスキップ
  if (e.request.method !== 'GET') return;

  // キャッシュ優先（オフライン対応）
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // キャッシュに追加（リソース限定）
        if (res.ok && e.request.url.startsWith(self.location.origin)) {
          caches.open(VERSION).then((cache) => cache.put(e.request, res.clone()));
        }
        return res;
      });
    })
  );
});
