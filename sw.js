// 安親訂餐 PWA Service Worker
// 採「網路優先」：永遠抓最新版，離線時才用快取，避免顯示舊版系統
const CACHE = 'anqing-orders-v2';

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // 只處理 GET
  // 不快取 Firebase / 第三方 API 即時資料
  const url = req.url;
  if (url.includes('firestore') || url.includes('googleapis') || url.includes('gstatic') || url.includes('ipapi') || url.includes('ipify') || url.includes('make.com')) {
    return; // 交給瀏覽器直接處理
  }
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE);
      try { cache.put(req, fresh.clone()); } catch (_) {}
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      throw err;
    }
  })());
});
