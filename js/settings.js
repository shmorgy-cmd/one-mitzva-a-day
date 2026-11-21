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

function locationLabel(loc) {
  if (!loc) return null;
  return loc.name;
}

function settingsSummary(settings, profile) {
  const parts = [];
  if (settings.location) parts.push(locationLabel(settings.location));
  if (profile && profile.reason) parts.push(reasonLabel(profile.reason) + (profile.community ? " · " + communityLabel(profile.community) : ""));
  return parts.length ? parts.join(" · ") : "Settings";
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
  let profile = getProfile() || { reason: null, community: null };
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
  modal.appendChild(sEl("p", "settings-privacy", "Saved only on this device. Your city is sent to Hebcal to calculate times."));

  // --- Location ---------------------------------------------------------
  const locSection = sEl("section", "settings-section");
  locSection.appendChild(sEl("h4", "settings-label", "Your city"));
  locSection.appendChild(sEl("p", "settings-help", "Used for candle-lighting, Havdalah, fast and prayer times."));

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
  const ilSection = sEl("section", "settings-section");
  ilSection.appendChild(sEl("h4", "settings-label", "Calendar"));
  ilSection.appendChild(sEl("p", "settings-help", "Outside Israel, most festivals have an extra day, and some weeks' Torah readings differ."));
  const ilGroup = sEl("div", "settings-radios");
  ilGroup.setAttribute("role", "radiogroup");
  ilGroup.setAttribute("aria-label", "Israel or outside Israel");
  ilSection.appendChild(ilGroup);
  modal.appendChild(ilSection);

  function renderIsrael() {
    ilGroup.innerHTML = "";
    const autoText = settings.location
      ? `Automatic — ${isInIsrael({ ...settings, israelMode: "auto" }) ? "Israel" : "outside Israel"} (from your city)`
      : `Automatic — ${isInIsrael({ ...settings, israelMode: "auto" }) ? "Israel" : "outside Israel"} (from your device)`;
    [["auto", autoText], ["il", "Israel"], ["diaspora", "Outside Israel"]].forEach(([val, text]) => {
      const label = sEl("label", "settings-radio");
      const r = sEl("input");
      r.type = "radio";
      r.name = "israel-mode";
      r.value = val;
      r.checked = settings.israelMode === val;
      r.addEventListener("change", () => {
        settings.israelMode = val;
        saveSettings(settings);
        changed = true;
      });
      label.appendChild(r);
      label.appendChild(sEl("span", null, text));
      ilGroup.appendChild(label);
    });
  }

  // --- Profile ----------------------------------------------------------
  const pSection = sEl("section", "settings-section");
  pSection.appendChild(sEl("h4", "settings-label", "About you"));
  pSection.appendChild(sEl("p", "settings-help", "Tailors explanations and customs on each card."));
  const reasonGroup = sEl("div", "settings-radios");
  reasonGroup.setAttribute("role", "radiogroup");
  reasonGroup.setAttribute("aria-label", "What brings you here");
  pSection.appendChild(reasonGroup);
  const commWrap = sEl("div", "settings-community");
  const commLabel = sEl("label", "settings-help", "Community");
  commLabel.htmlFor = "settings-community-select";
  const commSelect = sEl("select", "settings-input");
  commSelect.id = "settings-community-select";
  COMMUNITIES.forEach(c => {
    const o = sEl("option", null, c.label);
    o.value = c.id;
    commSelect.appendChild(o);
  });
  commWrap.appendChild(commLabel);
  commWrap.appendChild(commSelect);
  pSection.appendChild(commWrap);
  modal.appendChild(pSection);

  function renderProfile() {
    reasonGroup.innerHTML = "";
    [...REASONS.map(r => [r.id, r.label]), [null, "Prefer not to say"]].forEach(([val, text]) => {
      const label = sEl("label", "settings-radio");
      const r = sEl("input");
      r.type = "radio";
      r.name = "reason";
      r.value = val || "";
      r.checked = (profile.reason || null) === val;
      r.addEventListener("change", () => {
        profile = { reason: val, community: val === "jewish" ? (profile.community || "other") : null };
        saveProfile(profile);
        changed = true;
        renderProfile();
      });
      label.appendChild(r);
      label.appendChild(sEl("span", null, text));
      reasonGroup.appendChild(label);
    });
    commWrap.hidden = profile.reason !== "jewish";
    commSelect.value = profile.community || "other";
  }
  commSelect.addEventListener("change", () => {
    profile = { ...profile, community: commSelect.value };
    saveProfile(profile);
    changed = true;
  });

  // --- Done -------------------------------------------------------------
  const done = sEl("button", "settings-done", "Done");
  done.type = "button";
  modal.appendChild(done);

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
  renderProfile();
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");
  input.focus();
}
