/**
 * sw.js — makes One Mitzva a Day work offline.
 *
 *  • App files (HTML, CSS, JS, icons) are saved on install ("precache") and
 *    served from the saved copy, refreshed in the background.
 *  • Hebcal and Sefaria data: network first, saved copy when offline.
 *    Hebcal's calendar is requested with a date window that shifts every day,
 *    so it's also saved under a "loose" key without the dates — offline, the
 *    most recent calendar for the same city/settings is used instead.
 *  • Google Fonts: saved copy first.
 *
 * Bump CACHE_VERSION whenever app files change so visitors get the update.
 */

const CACHE_VERSION = "v26";

// For visitors who opted in to OneSignal messages, OneSignal registers this same
// file with its own query parameters (appId, sdkVersion…) — only then is its
// push code loaded. Everyone else's worker never contacts OneSignal.
if (/[?&]appId=/.test(self.location.search)) {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
}
const APP_CACHE = `omad-app-${CACHE_VERSION}`;
const DATA_CACHE = "omad-data";
const FONT_CACHE = "omad-fonts";

const APP_FILES = [
  "./",
  "index.html",
  "manifest.json",
  "css/style.css",
  "js/config.js",
  "js/integrations.js",
  "js/icons.js",
  "js/profile.js",
  "js/personalize.js",
  "js/settings.js",
  "js/prayers.js",
  "js/prayer-changes.js",
  "js/daily-guide.js",
  "js/prayer-texts.js",
  "js/timeline.js",
  "js/print.js",
  "js/prep.js",
  "js/content.js",
  "js/mitzvot.js",
  "js/quiz.js",
  "js/offline.js",
  "js/app.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

const DATA_HOSTS = ["www.hebcal.com", "www.sefaria.org", "geocoding-api.open-meteo.com"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(APP_FILES.map(f => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("omad-app-") && k !== APP_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Hebcal calendar URL without its start/end dates, used as a fallback key. */
function looseCalendarKey(url) {
  const u = new URL(url);
  if (u.hostname !== "www.hebcal.com" || u.pathname !== "/hebcal") return null;
  u.searchParams.delete("start");
  u.searchParams.delete("end");
  u.searchParams.set("omad_loose", "1"); // a key no real request uses
  u.searchParams.sort();
  return u.toString();
}

async function networkFirstData(request) {
  const cache = await caches.open(DATA_CACHE);
  const loose = looseCalendarKey(request.url);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      if (loose) cache.put(loose, response.clone());
    }
    return response;
  } catch (err) {
    const saved = await cache.match(request) || (loose && await cache.match(loose));
    if (saved) return saved;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") cache.put(request, response.clone());
  return response;
}

/** App files: serve the saved copy right away, refresh it in the background. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(APP_CACHE);
  const saved = await cache.match(request, { ignoreSearch: true });
  const network = fetch(request)
    .then(response => { if (response.ok) cache.put(request, response.clone()); return response; })
    .catch(() => null);
  if (saved) return saved;
  const fresh = await network;
  if (fresh) return fresh;
  if (request.mode === "navigate") return cache.match("index.html");
  return Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (DATA_HOSTS.includes(url.hostname)) {
    event.respondWith(networkFirstData(request));
  } else if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
  } else if (url.origin === self.location.origin) {
    if (url.pathname.endsWith("/tests.html")) return; // tests always hit the network
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Clicking one of our own local reminders focuses (or opens) the app.
// (OneSignal's notifications are handled by OneSignal's own code.)
self.addEventListener("notificationclick", (event) => {
  if (!/^(candles|prep)-/.test(event.notification.tag || "")) return;
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      const existing = list.find(c => "focus" in c);
      return existing ? existing.focus() : self.clients.openWindow("./");
    })
  );
});
