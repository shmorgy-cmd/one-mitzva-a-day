/**
 * integrations.js — the optional outside services (all off until configured in
 * js/config.js) plus the "Report an error" links:
 *
 *   • OneSignal push — loaded only after a visitor opts in from Settings
 *   • GoatCounter analytics — cookie-free page counts, only when a code is set
 *   • reportLink(cardId) — a prefilled email or GitHub issue for a content card
 */

const PUSH_OPTIN_KEY = "omad_push_optin";
const ONESIGNAL_SDK = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

function pushConfigured() {
  return !!(SITE_CONFIG && SITE_CONFIG.oneSignalAppId);
}

function pushOptedIn() {
  try { return pushConfigured() && localStorage.getItem(PUSH_OPTIN_KEY) === "1"; } catch (e) { return false; }
}

let oneSignalReady = null;

/** Loads the OneSignal SDK (once) and initializes it on our own service worker,
 *  so caching/offline keeps working alongside push. Resolves to the OneSignal object. */
function loadOneSignal() {
  if (oneSignalReady) return oneSignalReady;
  oneSignalReady = new Promise((resolve, reject) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: SITE_CONFIG.oneSignalAppId,
          // sw.js imports OneSignal's worker code when it's registered with
          // OneSignal's parameters, so there is a single service worker.
          serviceWorkerPath: "sw.js",
          serviceWorkerParam: { scope: new URL("./", location.href).pathname },
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false }
        });
        resolve(OneSignal);
      } catch (e) {
        reject(e);
      }
    });
    const s = document.createElement("script");
    s.src = ONESIGNAL_SDK;
    s.defer = true;
    s.onerror = () => reject(new Error("Couldn't load OneSignal"));
    document.head.appendChild(s);
  });
  return oneSignalReady;
}

/** Called from Settings. Returns a short status message for the panel. */
async function setPushOptIn(on) {
  if (!pushConfigured()) return "Messages aren't set up yet.";
  try { localStorage.setItem(PUSH_OPTIN_KEY, on ? "1" : "0"); } catch (e) { /* ignore */ }
  try {
    const OneSignal = await loadOneSignal();
    if (on) {
      await OneSignal.Notifications.requestPermission();
      await OneSignal.User.PushSubscription.optIn();
      return OneSignal.User.PushSubscription.optedIn
        ? "You're subscribed to weekly and holiday messages."
        : "Notifications are blocked for this site — you can allow them in your browser settings.";
    }
    await OneSignal.User.PushSubscription.optOut();
    return "You won't get weekly or holiday messages.";
  } catch (e) {
    console.warn("OneSignal", e);
    // Don't leave the flag on: it would stop our own service worker registering.
    try { localStorage.setItem(PUSH_OPTIN_KEY, "0"); } catch (err) { /* ignore */ }
    oneSignalReady = null;
    return "Messages couldn't be set up right now — please try again later.";
  }
}

// --- Analytics ------------------------------------------------------------------

function loadAnalytics() {
  const code = SITE_CONFIG && SITE_CONFIG.goatCounterCode;
  if (!code || location.hostname === "localhost" || location.protocol === "file:") return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `https://${encodeURIComponent(code)}.goatcounter.com/count`;
  document.head.appendChild(s);
}

// --- Weekly email sign-up (Kit) -------------------------------------------------

/** Renders the sign-up card when a Kit form ID is configured. It's a plain HTML
 *  form posted to Kit — no Kit script is loaded, and nothing is sent until the
 *  visitor presses Subscribe. */
function renderNewsletterCard() {
  const container = document.getElementById("newsletter-container");
  if (!container) return;
  container.innerHTML = "";
  const formId = SITE_CONFIG && SITE_CONFIG.kitFormId;
  if (!formId) return;

  const card = document.createElement("article");
  card.className = "newsletter-card";
  card.innerHTML = `
    <h3>This week in Judaism</h3>
    <p class="newsletter-sub">One short email before each Shabbat: what's coming up, a mitzvah to try, and a link to the printable Shabbat sheet.</p>
    <form class="newsletter-form" method="post" novalidate>
      <label class="newsletter-field">
        <span>First name <em>(optional)</em></span>
        <input type="text" name="fields[first_name]" autocomplete="given-name" maxlength="60" />
      </label>
      <label class="newsletter-field">
        <span>Email</span>
        <input type="email" name="email_address" autocomplete="email" required />
      </label>
      <button type="submit" class="newsletter-btn">Subscribe</button>
      <p class="newsletter-fine">Sent with Kit. We'll only use your email for this newsletter, and you can unsubscribe from any email.</p>
      <p class="newsletter-status" role="status"></p>
    </form>`;
  const form = card.querySelector("form");
  form.action = `https://app.kit.com/forms/${encodeURIComponent(formId)}/subscriptions`;
  const status = card.querySelector(".newsletter-status");
  const emailInput = form.querySelector('input[type="email"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!emailInput.value || !emailInput.checkValidity()) {
      status.textContent = "Please enter a valid email address.";
      emailInput.focus();
      return;
    }
    const btn = form.querySelector("button");
    btn.disabled = true;
    status.textContent = "Subscribing…";
    try {
      // Kit doesn't allow reading the reply from another site, so the request is
      // sent "no-cors"; a network failure still lands in the catch below.
      await fetch(form.action, { method: "POST", body: new FormData(form), mode: "no-cors" });
      form.reset();
      status.textContent = "Almost done — check your inbox and confirm your subscription.";
    } catch (err) {
      status.textContent = "That didn't go through — please check your connection and try again.";
    } finally {
      btn.disabled = false;
    }
  });
  container.appendChild(card);
}

// --- Report an error --------------------------------------------------------------

/** A small "Report an error" link for a content card. The report includes the
 *  card id, the day being viewed and the calendar/community setting — never the
 *  city or anything personal. */
function reportLink(cardId) {
  const viewed = typeof viewingDate !== "undefined" && viewingDate ? toISO(viewingDate) : "";
  const settings = typeof currentSettings !== "undefined" ? currentSettings : getSettings();
  const community = currentProfile && currentProfile.community ? currentProfile.community : "not set";
  const subject = `Error report: ${cardId}`;
  const body = [
    `Card: ${cardId}`,
    `Day viewed: ${viewed}`,
    `Calendar: ${isInIsrael(settings) ? "Israel" : "outside Israel"}`,
    `Community: ${community}`,
    "",
    "What looks wrong, and what should it say?",
    ""
  ].join("\n");

  const a = document.createElement("a");
  a.className = "report-link";
  a.textContent = "Report an error";
  a.rel = "noopener";
  if (SITE_CONFIG.reportEmail) {
    a.href = `mailto:${SITE_CONFIG.reportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  } else {
    a.href = `${SITE_CONFIG.reportIssuesUrl}?title=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    a.target = "_blank";
  }
  a.setAttribute("aria-label", `Report an error in this card (${cardId})`);
  return a;
}

document.addEventListener("DOMContentLoaded", () => {
  loadAnalytics();
  renderNewsletterCard();
  if (pushOptedIn()) loadOneSignal().catch(e => console.warn("OneSignal", e));
});
