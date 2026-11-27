/**
 * offline.js — the "installable app" layer:
 *   • registers the service worker (sw.js) and shows an offline notice
 *   • once a day, prefetches the next 14 days of data so the app works offline
 *   • shows an "install this app" hint (Android/desktop prompt, iOS instructions)
 *   • opt-in local reminders (candle lighting, prep checklist) while the app is open
 */

const PREFETCH_KEY = "omad_prefetch_v1";
const INSTALL_DISMISSED_KEY = "omad_install_dismissed";
const PREP_NOTIFIED_KEY = "omad_prep_notified";
const PREFETCH_DAYS = 14;

let swRegistration = null;
let deferredInstallPrompt = null;
let reminderTimers = [];

function oEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// --- Service worker & offline notice ------------------------------------------

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return null;
  // Subscribed to OneSignal messages: OneSignal registers sw.js itself (with its
  // parameters); registering it again here would drop its push code.
  if (typeof pushOptedIn === "function" && pushOptedIn()) return null;
  try {
    swRegistration = await navigator.serviceWorker.register("sw.js");
    return swRegistration;
  } catch (e) {
    console.warn("Service worker registration failed", e);
    return null;
  }
}

function renderOfflineBanner() {
  let banner = document.getElementById("offline-banner");
  if (navigator.onLine) { if (banner) banner.remove(); return; }
  if (banner) return;
  banner = oEl("div", "offline-banner", "You're offline — showing saved data. Times and readings for the next two weeks are available.");
  banner.id = "offline-banner";
  banner.setAttribute("role", "status");
  document.querySelector("main").prepend(banner);
}

// --- 14-day prefetch ------------------------------------------------------------

/** Fetch (through the service worker, which saves them) the exact requests the
 *  page will make when browsing the next two weeks. Runs at most once a day per
 *  settings combination, one request at a time to stay polite to Hebcal/Sefaria. */
async function prefetchUpcoming(events) {
  if (!navigator.onLine || !("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.ready;
  const today = startOfDay(new Date());
  const settings = getSettings();
  const stamp = `${toISO(today)}|${JSON.stringify(settings.location || null)}|${isInIsrael(settings)}`;
  try { if (localStorage.getItem(PREFETCH_KEY) === stamp) return; } catch (e) { /* ignore */ }

  const quiet = (p) => p.catch(() => null);
  // The calendar window itself (the service worker also keeps it under a
  // date-free key, so it still answers offline on the following days).
  await quiet(loadCalendarWindow(today));
  for (let i = 0; i <= PREFETCH_DAYS + 1; i++) {
    const d = addDays(today, i);
    await quiet(fetch(`${CONVERTER_BASE}?cfg=json&date=${toISO(d)}&g2h=1`));
    if (settings.location) await quiet(fetchZmanim(settings.location, toISO(d)));
    if (i <= PREFETCH_DAYS) await quiet(loadTorahPortion(events, d));
    if (d.getDay() === 6) await quiet(loadParshaSummary(d, isInIsrael(settings)));
  }
  // The blessing recordings, so the speaker buttons work offline too.
  if (typeof allAudioRecordings === "function") {
    for (const src of allAudioRecordings()) await quiet(fetch(src));
  }
  try { localStorage.setItem(PREFETCH_KEY, stamp); } catch (e) { /* ignore */ }
}

// --- Install hint ---------------------------------------------------------------

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function installDismissed() {
  try { return localStorage.getItem(INSTALL_DISMISSED_KEY) === "1"; } catch (e) { return false; }
}

function renderInstallHint() {
  const existing = document.getElementById("install-hint");
  if (existing) existing.remove();
  if (isStandalone() || installDismissed()) return;
  const canPrompt = !!deferredInstallPrompt;
  const ios = isIOS();
  if (!canPrompt && !ios) return;

  const hint = oEl("div", "install-hint");
  hint.id = "install-hint";
  hint.setAttribute("role", "region");
  hint.setAttribute("aria-label", "Install the app");
  const icon = oEl("img", "install-icon");
  icon.src = "icons/icon-192.png";
  icon.alt = "";
  hint.appendChild(icon);
  const text = oEl("div", "install-text");
  text.appendChild(oEl("strong", null, "Add One Mitzva a Day to your home screen"));
  text.appendChild(oEl("span", null, ios
    ? "In Safari, tap the Share button, then “Add to Home Screen”. It opens like an app and works offline."
    : "Install it to open it like an app — it works offline, too."));
  hint.appendChild(text);

  const actions = oEl("div", "install-actions");
  if (canPrompt) {
    const btn = oEl("button", "install-btn", "Install");
    btn.type = "button";
    btn.addEventListener("click", async () => {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      hint.remove();
    });
    actions.appendChild(btn);
  }
  const dismiss = oEl("button", "install-dismiss", "Not now");
  dismiss.type = "button";
  dismiss.addEventListener("click", () => {
    try { localStorage.setItem(INSTALL_DISMISSED_KEY, "1"); } catch (e) { /* ignore */ }
    hint.remove();
  });
  actions.appendChild(dismiss);
  hint.appendChild(actions);

  // In the welcome card on the Today page, right under the date (other pages: none).
  const slot = document.getElementById("install-slot");
  if (!slot) return;
  slot.appendChild(hint);
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  renderInstallHint();
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  const hint = document.getElementById("install-hint");
  if (hint) hint.remove();
});

// --- Local reminders (while the app is open) -----------------------------------

function showToast(title, body) {
  const t = oEl("div", "reminder-toast");
  t.setAttribute("role", "status");
  t.appendChild(oEl("strong", null, title));
  t.appendChild(oEl("span", null, body));
  const close = oEl("button", "reminder-toast-close", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss reminder");
  close.addEventListener("click", () => t.remove());
  t.appendChild(close);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 60000);
}

/** System notification when allowed, otherwise an on-page message. */
async function notify(title, body, tag) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const reg = swRegistration || (navigator.serviceWorker && await navigator.serviceWorker.getRegistration());
      if (reg && reg.showNotification) {
        await reg.showNotification(title, { body, tag, icon: "icons/icon-192.png", badge: "icons/icon-192.png" });
        return;
      }
      new Notification(title, { body, tag, icon: "icons/icon-192.png" });
      return;
    } catch (e) { /* fall back to the toast */ }
  }
  showToast(title, body);
}

function scheduleReminders(events) {
  reminderTimers.forEach(clearTimeout);
  reminderTimers = [];
  const settings = getSettings();
  const prefs = settings.reminders || {};
  const now = Date.now();

  if (prefs.candles && settings.location) {
    events
      .filter(e => e.category === "candles" && e.at)
      .forEach(e => {
        const fireAt = e.at.getTime() - 30 * 60 * 1000;
        const wait = fireAt - now;
        // Only within the next day — the page has to be open for it to fire anyway.
        if (wait > 0 && wait < 26 * 60 * 60 * 1000) {
          reminderTimers.push(setTimeout(() => {
            notify("Candle lighting in 30 minutes", `${timedEventLabel(e)} is at ${fmtClock(e.time)} in ${settings.location.name}.`, `candles-${toISO(e.date)}`);
          }, wait));
        }
      });
  }

  if (prefs.prep) {
    const info = nextPrepInfo(events, startOfDay(new Date()));
    if (info && info.ready) {
      const key = `${info.name}|${new Date().getFullYear()}`;
      let done = null;
      try { done = localStorage.getItem(PREP_NOTIFIED_KEY); } catch (e) { /* ignore */ }
      if (done !== key) {
        try { localStorage.setItem(PREP_NOTIFIED_KEY, key); } catch (e) { /* ignore */ }
        notify(`${info.name} is coming up`, `It starts ${inDays(info.daysUntil)} — your prep checklist is ready.`, `prep-${key}`);
      }
    }
  }
}

// --- Entry point (called from app.js once today's events are loaded) -----------

function initOffline(events) {
  renderInstallHint();
  scheduleReminders(events);
  // Let the page finish its own requests first.
  setTimeout(() => prefetchUpcoming(events).catch(e => console.warn("prefetch failed", e)), 4000);
}

// The service worker and offline notice start right away — even if today's
// data can't load, so a later visit can still work offline.
document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
  renderOfflineBanner();
  window.addEventListener("online", renderOfflineBanner);
  window.addEventListener("offline", renderOfflineBanner);
});
