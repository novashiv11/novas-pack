// Nova's Pack service worker: makes the app work offline. It only ever talks to this site.
//
// When you change any app file, bump VERSION so every phone fetches the new files.
// Pages and files are served from the cache first (fast, offline) and refreshed in the background,
// so a normal update shows up the next time the app is opened.
const VERSION = "2026-10-10-1";
const CACHE = `novas-pack-${VERSION}`;
const CLIPS = "novas-pack-clips";

const ASSETS = [
  "./", "index.html", "app.css", "site.css", "manifest.webmanifest",
  "js/app.js", "js/db.js", "js/ics.js", "js/util.js", "js/state.js", "js/logic.js", "js/forms.js", "js/sample.js",
  "js/views/parts.js", "js/views/today.js", "js/views/health.js", "js/views/food.js", "js/views/training.js", "js/views/more.js",
  "data/skills.js", "data/care.js",
  "fonts/bricolage-grotesque-latin.woff2", "fonts/plus-jakarta-sans-latin.woff2",
  "img/brand/nova-head.svg", "img/icons/icon-192.png", "img/icons/icon-512.png", "img/icons/icon-maskable-512.png",
  "favicon.svg", "favicon.ico", "apple-touch-icon.png",
  "card.html", "card.js", "site.js", "privacy.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // One missing file shouldn't stop the rest from being cached.
    await Promise.all(ASSETS.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("novas-pack-") && key !== CACHE && key !== CLIPS) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/clips/")) { event.respondWith(clip(req)); return; }
  if (req.method !== "GET") return;
  event.respondWith(cached(req, event));
});

// Cache first, then refresh the cached copy in the background.
async function cached(req, event) {
  const cache = await caches.open(CACHE);
  const url = new URL(req.url);
  const key = url.origin + url.pathname; // ignore ?name=… so card.html works offline too
  const hit = await cache.match(key) || (req.mode === "navigate" ? await cache.match("./") : null);
  const fresh = fetch(req).then((res) => {
    if (res && res.ok && res.type === "basic") cache.put(key, res.clone()).catch(() => {});
    return res;
  }).catch(() => null);
  if (hit) { event.waitUntil(fresh); return hit; }
  return (await fresh) || new Response("Offline, and this page isn't saved yet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

// Training clips are optional files Shiv drops into /clips. A missing clip answers 204 (no content)
// instead of a 404, so the app can quietly show "Clip coming soon". Clips you've watched work offline.
async function clip(req) {
  const cache = await caches.open(CLIPS);
  const key = new Request(req.url, { method: "GET" });
  try {
    const res = await fetch(req);
    if (res.ok) {
      if (req.method === "GET" && res.status === 200) cache.put(key, res.clone()).catch(() => {});
      return res;
    }
  } catch { /* offline */ }
  const hit = await cache.match(key);
  if (hit) return req.method === "HEAD" ? new Response(null, { status: 200, headers: hit.headers }) : hit;
  return new Response(null, { status: 204 });
}
