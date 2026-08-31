/* eslint-env serviceworker */
// Contour's service worker. The app is meant to be opened outdoors, where the network
// often isn't there, so the whole shell — document, script, stylesheet, fonts and icons —
// is precached at install and served from the cache first. There is no backend and no
// runtime data to sync: every activity already lives in localStorage.
//
// The precache list and the version below are injected at build time by the
// `contourServiceWorker` plugin in vite.config.ts. The version is a hash of the
// precached files' contents, so a build that changes nothing emits a byte-identical
// worker and the browser sees no update to install.
//
// Deliberately no skipWaiting(): a new worker only takes over once every tab running
// the old one has gone. Swapping the shell out underneath a session that is recording
// is the one failure this app cannot afford, and an update that lands on the next cold
// start costs nothing.

// `ignoreVary` on every lookup: a static host commonly answers with `Vary: Origin` or
// `Vary: Accept-Encoding`, and the worker's own precache requests carry neither header
// the page's module script and stylesheet requests do. Honouring Vary would miss on
// exactly the two files the app cannot start without. Nothing here is negotiated —
// one origin, one representation per URL — so there is nothing for Vary to protect.
const MATCH = { ignoreVary: true };

const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const SHELL = '__SHELL__';
const CACHE = `contour-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // `reload` so the shell is precached from the network rather than from whatever
      // the HTTP cache happens to be holding.
      cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('contour-') && key !== CACHE).map((key) => caches.delete(key)));
      // Claim the first load, which fetched everything itself and has no controller yet.
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // The app is one document: every navigation, whatever its path or query, is answered
  // with the precached shell and routed by the app itself once it boots.
  event.respondWith(request.mode === 'navigate' ? shell() : cacheFirst(request));
});

async function shell() {
  const cached = await caches.match(SHELL, { cacheName: CACHE, ...MATCH });
  if (cached) return cached;
  try {
    return await fetch(SHELL);
  } catch {
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, MATCH);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    // Only same-origin successes are worth keeping; an opaque or errored response
    // cached here would be indistinguishable from a good one on the next load.
    if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  } catch {
    return Response.error();
  }
}
