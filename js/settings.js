/**
 * settings.js — the visitor's saved settings: their city (for candle-lighting,
 * Havdalah, fast and prayer times), whether to follow the Israel or
 * outside-Israel calendar, and the welcome-box profile (profile.js).
 *
 * Stored only in this browser's localStorage. The city is sent to Hebcal to
 * calculate times; city *search* text goes to Open-Meteo's free geocoder,
 * because Hebcal's own city search doesn't allow calls from other websites.
 * Open-Meteo returns GeoNames ids, the same ids Hebcal uses.
 */

const SETTINGS_KEY = "omad_settings_v1";
const GEOCODE_BASE = "https://geocoding-api.open-meteo.com/v1/search";

function defaultSettings() {
  return { location: null, israelMode: "auto" };
}

function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings(), ...JSON.parse(raw) } : defaultSettings();
  } catch (e) {
    return defaultSettings();
  }
}

function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* not persisted */ }
}

function deviceTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return ""; }
}

/** Israel calendar? "auto" follows the saved city's country (or, with no city,
 *  the device's time zone); the visitor can override either way. */
function isInIsrael(settings) {
  if (settings.israelMode === "il") return true;
  if (settings.israelMode === "diaspora") return false;
  if (settings.location) return settings.location.cc === "IL";
  return deviceTimeZone() === "Asia/Jerusalem";
}

/** Query-string fragment identifying the location for Hebcal's calendar and zmanim APIs. */
function hebcalLocationQuery(location) {
  if (!location) return "";
  if (location.geonameid) return `&geonameid=${encodeURIComponent(location.geonameid)}`;
  return `&geo=pos&latitude=${location.lat}&longitude=${location.lon}&tzid=${encodeURIComponent(location.tzid)}`;
}

/** Everything a Hebcal calendar call needs: location, Israel flag, candle times. */
function hebcalCalendarQuery(settings) {
  let q = isInIsrael(settings) ? "&i=on" : "&i=off";
  if (settings.location) q += "&c=on" + hebcalLocationQuery(settings.location);
  return q;
}

async function searchCities(query) {
  const url = `${GEOCODE_BASE}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("city search failed");
  const data = await res.json();
  return (data.results || []).map(r => ({
    geonameid: r.id,
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(", "),
    cc: r.country_code,
    lat: Math.round(r.latitude * 10000) / 10000,
    lon: Math.round(r.longitude * 10000) / 10000,
    tzid: r.timezone
  }));
}

/** Hebcal knows most, but not every, GeoNames place. Check once when the city is
 *  chosen and fall back to plain coordinates if Hebcal doesn't recognise the id. */
async function verifyLocationWithHebcal(loc) {
  try {
    const res = await fetch(`https://www.hebcal.com/zmanim?cfg=json&geonameid=${loc.geonameid}`);
    if (res.ok) return loc;
  } catch (e) { /* fall through */ }
  const { geonameid, ...pos } = loc;
  return pos;
}

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Location isn't available in this browser."));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const tz = deviceTimeZone();
        resolve({
          name: "Your current location",
          region: tz,
          // Rounded to ~1 km: plenty for prayer times, and no more precise than needed.
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lon: Math.round(pos.coords.longitude * 100) / 100,
          tzid: tz,
          cc: tz === "Asia/Jerusalem" ? "IL" : null
        });
      },
      () => reject(new Error("We couldn't get your location. You can search for your city instead.")),
      { timeout: 10000, maximumAge: 60 * 60 * 1000 }
    );
  });
}

/** The place's name for use inside a sentence ("Times for your current location"). */
function placeInSentence(loc) {
  if (!loc) return "your city";
  return loc.name === "Your current location" ? "your current location" : loc.name;
}

function locationLabel(loc) {
  if (!loc) return null;
  return loc.name;
}

function settingsSummary(settings, profile) {
  const parts = [];
  if (settings.location) parts.push(locationLabel(settings.location));
  if (profile && profile.reason) parts.push(reasonShort(profile.reason));
  if (profile && profile.nusach && profile.nusach !== "unsure" && profile.nusach !== "other") parts.push(nusachLabel(profile.nusach).split(" (")[0].split(" /")[0]);
  return parts.length ? parts.join(" · ") : "Settings";
}

/** The three customs choices, with "Automatic" saying what it resolves to. */
function israelModeOptions(settings) {
  const autoIL = isInIsrael({ ...settings, israelMode: "auto" });
  return [
    { id: "auto", label: `Automatic (${autoIL ? "Israel" : "outside Israel"})` },
    { id: "il", label: "Israel customs" },
    { id: "diaspora", label: "Outside Israel customs" }
  ];
}

// ---------------------------------------------------------------------
// Settings panel
// ---------------------------------------------------------------------

function sEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Opens the settings panel. `onDone(changed)` runs once it closes;
 *  `changed` is true when anything that affects the page was changed. */
function openSettingsPanel(onDone) {
  const existing = document.getElementById("settings-overlay");
  if (existing) existing.remove();

  const settings = getSettings();
  const profile = { ...emptyProfile(), ...(getProfile() || {}) };
  let changed = false;
  const opener = document.activeElement;

  const overlay = sEl("div", "onboarding-overlay");
  overlay.id = "settings-overlay";
  const modal = sEl("div", "onboarding-modal settings-modal");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "settings-title");
  overlay.appendChild(modal);

  const head = sEl("div", "settings-head");
  const title = sEl("h3", "onboarding-title", "Settings");
  title.id = "settings-title";
  head.appendChild(title);
  const closeX = sEl("button", "settings-close", "×");
  closeX.type = "button";
  closeX.setAttribute("aria-label", "Close settings");
  head.appendChild(closeX);
  modal.appendChild(head);
  modal.appendChild(sEl("p", "settings-privacy", "🔒 Saved only on this device. Only your city is sent (to Hebcal), to calculate times."));

  function numbered(n, title, hint) {
    const sec = sEl("section", "settings-section settings-section--num");
    const h = sEl("h4", "settings-label");
    h.appendChild(sEl("span", "settings-num", String(n)));
    h.appendChild(document.createTextNode(title));
    sec.appendChild(h);
    if (hint) sec.appendChild(sEl("p", "settings-help", hint));
    return sec;
  }
  function saveP() { Object.assign(profile, saveProfile(profile)); changed = true; }

  // --- 1. What brings you here ------------------------------------------
  const reasonSec = numbered(1, "What brings you here?", "Sets how much we explain and the kind of encouragement you'll see.");
  reasonSec.appendChild(choicePills("What brings you here", REASONS, profile.reason, id => { profile.reason = id; saveP(); }, true));
  modal.appendChild(reasonSec);

  // --- 2. About you -----------------------------------------------------
  const aboutSec = numbered(2, "About you", "Some mitzvot are different for men and women. We'll show the ones that are yours.");
  aboutSec.appendChild(aboutYouFields(profile, saveP));
  modal.appendChild(aboutSec);

  // --- 3. Nusach --------------------------------------------------------
  const nusachSec = numbered(3, "Your prayer tradition (nusach)", "Blessings and customs follow your tradition. Not sure? We'll show the common practice and the alternatives.");
  nusachSec.appendChild(choicePills("Prayer tradition", NUSACHS, profile.nusach, id => { profile.nusach = id; saveP(); }));
  nusachSec.appendChild(sEl("p", "pill-note", "Your tradition also adds the days your community keeps to the calendar."));
  nusachSec.appendChild(nusachHelp());
  modal.appendChild(nusachSec);

  // --- 4. Where you are -------------------------------------------------
  const locSection = numbered(4, "Where you are", "Your city sets candle-lighting, Havdalah, fast and prayer times.");

  const current = sEl("div", "settings-current");
  locSection.appendChild(current);

  const searchRow = sEl("div", "settings-search");
  const input = sEl("input", "settings-input");
  input.type = "search";
  input.placeholder = "Search for a city…";
  input.setAttribute("aria-label", "Search for a city");
  input.autocomplete = "off";
  searchRow.appendChild(input);
  locSection.appendChild(searchRow);

  const results = sEl("ul", "settings-results");
  results.setAttribute("role", "listbox");
  results.setAttribute("aria-label", "Matching cities");
  locSection.appendChild(results);

  const geoBtn = sEl("button", "settings-link-btn", "Use my current location instead");
  geoBtn.type = "button";
  locSection.appendChild(geoBtn);

  const locStatus = sEl("p", "settings-status");
  locStatus.setAttribute("role", "status");
  locSection.appendChild(locStatus);
  modal.appendChild(locSection);

  function renderCurrent() {
    current.innerHTML = "";
    if (settings.location) {
      const label = sEl("span", "settings-current-name", settings.location.name);
      current.appendChild(label);
      if (settings.location.region) current.appendChild(sEl("span", "settings-current-region", " · " + settings.location.region));
      const clear = sEl("button", "settings-link-btn", "Remove");
      clear.type = "button";
      clear.addEventListener("click", () => {
        settings.location = null;
        saveSettings(settings);
        changed = true;
        renderCurrent();
        renderIsrael();
      });
      current.appendChild(clear);
    } else {
      current.appendChild(sEl("span", "settings-current-none", "No city set — times are hidden or approximate."));
    }
  }

  async function chooseLocation(loc) {
    locStatus.textContent = "Saving…";
    const verified = loc.geonameid ? await verifyLocationWithHebcal(loc) : loc;
    settings.location = verified;
    saveSettings(settings);
    changed = true;
    input.value = "";
    results.innerHTML = "";
    locStatus.textContent = `Saved: ${verified.name}.`;
    renderCurrent();
    renderIsrael();
  }

  let searchTimer = null;
  let searchSeq = 0;
  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (q.length < 2) { results.innerHTML = ""; locStatus.textContent = ""; return; }
    searchTimer = setTimeout(async () => {
      const seq = ++searchSeq;
      locStatus.textContent = "Searching…";
      try {
        const found = await searchCities(q);
        if (seq !== searchSeq) return;
        results.innerHTML = "";
        locStatus.textContent = found.length ? "" : "No cities found — try another spelling.";
        found.forEach(c => {
          const li = sEl("li");
          const btn = sEl("button", "settings-result");
          btn.type = "button";
          btn.setAttribute("role", "option");
          btn.appendChild(sEl("span", "settings-result-name", c.name));
          btn.appendChild(sEl("span", "settings-result-region", c.region));
          btn.addEventListener("click", () => chooseLocation(c));
          li.appendChild(btn);
          results.appendChild(li);
        });
      } catch (e) {
        if (seq === searchSeq) locStatus.textContent = "City search isn't available right now — please try again.";
      }
    }, 300);
  });

  geoBtn.addEventListener("click", async () => {
    locStatus.textContent = "Asking your browser for your location…";
    try {
      await chooseLocation(await getBrowserLocation());
    } catch (e) {
      locStatus.textContent = e.message;
    }
  });

  // --- Israel / outside Israel -----------------------------------------
  // Israel / outside Israel customs, inside "Where you are".
  locSection.appendChild(sEl("div", "pill-sub", "Customs"));
  const ilWrap = sEl("div");
  locSection.appendChild(ilWrap);
  locSection.appendChild(sEl("p", "pill-note", "Outside Israel, most festivals have an extra day and some weeks' Torah readings differ. Visiting Israel? Keep the customs of where you live."));

  function renderIsrael() {
    ilWrap.innerHTML = "";
    ilWrap.appendChild(choicePills("Israel or outside Israel customs", israelModeOptions(settings), settings.israelMode || "auto", id => {
      settings.israelMode = id;
      saveSettings(settings);
      changed = true;
    }));
  }

  // --- Show me everything -----------------------------------------------
  const allSec = sEl("section", "settings-section");
  const allLabel = sEl("label", "settings-toggle");
  const allBox = sEl("input");
  allBox.type = "checkbox";
  allBox.className = "settings-switch";
  allBox.checked = !!profile.showAll;
  allBox.addEventListener("change", () => { profile.showAll = allBox.checked; saveP(); });
  allLabel.appendChild(allBox);
  const allText = sEl("span", "settings-toggle-text", "Show me everything");
  allText.appendChild(sEl("small", null, "See practices for everyone, each one labeled (for men, for women, with children…)."));
  allLabel.appendChild(allText);
  allSec.appendChild(allLabel);
  modal.appendChild(allSec);

  // --- 5. Reminders -------------------------------------------------------
  const rSection = numbered(5, "Reminders", "These only work while this page (or the installed app) is open.");
  const rStatus = sEl("p", "settings-status");
  rStatus.setAttribute("role", "status");
  settings.reminders = settings.reminders || { candles: false, prep: false };

  function reminderToggle(key, text) {
    const label = sEl("label", "settings-radio");
    const box = sEl("input");
    box.type = "checkbox";
    box.checked = !!settings.reminders[key];
    box.addEventListener("change", async () => {
      settings.reminders[key] = box.checked;
      saveSettings(settings);
      changed = true;
      if (box.checked && "Notification" in window && Notification.permission === "default") {
        try { await Notification.requestPermission(); } catch (e) { /* ignore */ }
      }
      renderReminderStatus();
    });
    label.appendChild(box);
    label.appendChild(sEl("span", null, text));
    return label;
  }

  function renderReminderStatus() {
    const anyOn = settings.reminders.candles || settings.reminders.prep || settings.reminders.tefillin;
    if (!anyOn) { rStatus.textContent = ""; return; }
    if ((settings.reminders.candles || settings.reminders.tefillin) && !settings.location) {
      rStatus.textContent = "Set your city above so we know the times for your reminders.";
    } else if (!("Notification" in window)) {
      rStatus.textContent = "This browser doesn't support notifications — reminders will appear on the page instead.";
    } else if (Notification.permission === "granted") {
      rStatus.textContent = "Notifications are on.";
    } else if (Notification.permission === "denied") {
      rStatus.textContent = "Notifications are blocked for this site — reminders will appear on the page instead.";
    } else {
      rStatus.textContent = "Reminders will appear on the page.";
    }
  }

  const rGroup = sEl("div", "settings-radios");
  rGroup.appendChild(reminderToggle("candles", "Candle lighting — 30 minutes before"));
  // Tallit and tefillin — a men's mitzvah, so for women only with "Show me everything".
  if (profile.gender !== "female" || profile.showAll) {
    rGroup.appendChild(reminderToggle("tefillin", "Tallit and tefillin — 30 minutes before the best time for Shacharit ends (weekdays)"));
  }
  rGroup.appendChild(reminderToggle("prep", "When a holiday prep checklist is ready"));
  rSection.appendChild(rGroup);
  rSection.appendChild(rStatus);

  // Weekly & holiday messages (OneSignal push) — only offered once configured.
  if (pushConfigured()) {
    const pushLabel = sEl("label", "settings-radio settings-push");
    const pushBox = sEl("input");
    pushBox.type = "checkbox";
    pushBox.checked = pushOptedIn();
    const pushStatus = sEl("p", "settings-status");
    pushStatus.setAttribute("role", "status");
    pushBox.addEventListener("change", async () => {
      pushStatus.textContent = "One moment…";
      pushStatus.textContent = await setPushOptIn(pushBox.checked);
    });
    pushLabel.appendChild(pushBox);
    pushLabel.appendChild(sEl("span", null, "Weekly & holiday messages — even when the app is closed"));
    rSection.appendChild(pushLabel);
    rSection.appendChild(sEl("p", "settings-help", "Sent through OneSignal, an outside service, which stores a subscription ID for this device — no name or email. On iPhone, add the app to your home screen first."));
    rSection.appendChild(pushStatus);
  }

  modal.appendChild(rSection);
  renderReminderStatus();

  // --- Done (and About, which isn't in the phone's bottom bar) -----------
  const foot = sEl("div", "settings-foot");
  const about = sEl("a", "settings-link-btn", "About One Mitzva a Day");
  about.href = "about.html";
  foot.appendChild(about);
  const done = sEl("button", "settings-done", "Done");
  done.type = "button";
  foot.appendChild(done);
  modal.appendChild(foot);

  function close() {
    overlay.remove();
    document.body.classList.remove("no-scroll");
    document.removeEventListener("keydown", onKey);
    if (opener && opener.focus) opener.focus();
    onDone(changed);
  }
  function onKey(e) { if (e.key === "Escape") close(); }
  done.addEventListener("click", close);
  closeX.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", onKey);

  renderCurrent();
  renderIsrael();
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");
  closeX.focus();
}
