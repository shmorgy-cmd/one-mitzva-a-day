/**
 * profile.js — a tiny, local-only visitor profile used to tailor what the
 * page shows: what brings you here, gender, family, prayer tradition and
 * "show me everything". Nothing here is sent anywhere; it lives in the
 * browser's localStorage on the visitor's own device.
 */

const PROFILE_KEY = "omad_profile_v1";

const REASONS = [
  { id: "jewish-reminders", label: "I'm Jewish — I want daily reminders", blurb: "Concise: what to do and when" },
  { id: "jewish-growing", label: "I'm Jewish — becoming more observant", blurb: "Step by step, with the \"why\"" },
  { id: "jewish-reconnecting", label: "I'm Jewish — reconnecting with Judaism", blurb: "Gentle, from the beginning, no pressure" },
  { id: "converting", label: "I'm in the process of converting", blurb: "Notes on blessings and Shabbat for this stage" },
  { id: "converted", label: "I recently converted", blurb: "Beginner-friendly explanations — you're fully Jewish" },
  { id: "curious", label: "I'm curious to learn more", blurb: "Everything explained, nothing assumed" }
];

const GENDERS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "unspecified", label: "Prefer not to say" }
];

const CHILDREN = [
  { id: "none", label: "No children" },
  { id: "young", label: "Young children" },
  { id: "teens", label: "Teens" },
  { id: "grown", label: "Grown children" }
];

const NUSACHS = [
  { id: "ashkenaz", label: "Ashkenaz", community: "ashkenazi" },
  { id: "sefard", label: "Sefard (Chassidic)", community: "ashkenazi" },
  { id: "sephardi", label: "Sephardi / Edot HaMizrach", community: "sephardi" },
  { id: "chabad", label: "Chabad (Nusach Ari)", community: "chabad" },
  { id: "other", label: "Other", community: "other" },
  { id: "unsure", label: "Not sure", community: "other" }
];

/** The customs group a nusach follows ("other" shows each side by side). */
function communityForNusach(nusach) {
  const n = NUSACHS.find(x => x.id === nusach);
  return n ? n.community : null;
}

/** Brings an older saved profile up to the current shape. */
function migrateProfile(p) {
  if (!p || typeof p !== "object") return null;
  const out = { ...p };
  if (out.reason === "jewish") out.reason = "jewish-reminders";
  if (out.reason && !REASONS.some(r => r.id === out.reason)) out.reason = null;
  if (!out.nusach && out.community) {
    out.nusach = { ashkenazi: "ashkenaz", litvish: "ashkenaz", sephardi: "sephardi", chabad: "chabad" }[out.community] || "unsure";
  }
  if (!NUSACHS.some(n => n.id === out.nusach)) out.nusach = null;
  if (!GENDERS.some(g => g.id === out.gender)) out.gender = null;
  if (!CHILDREN.some(c => c.id === out.children)) out.children = null;
  if (typeof out.married !== "boolean") out.married = null;
  out.showAll = !!out.showAll;
  out.community = communityForNusach(out.nusach);
  return out;
}

function emptyProfile() {
  return { reason: null, gender: null, married: null, children: null, nusach: null, community: null, showAll: false };
}

function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? migrateProfile(JSON.parse(raw)) : null;
  } catch (e) {
    return null;
  }
}

/** Saves the profile and returns the cleaned-up copy that was stored. */
function saveProfile(profile) {
  const clean = migrateProfile(profile) || emptyProfile();
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...clean, setAt: new Date().toISOString() }));
  } catch (e) { /* localStorage unavailable — profile just won't persist */ }
  return clean;
}

function clearProfile() {
  try { localStorage.removeItem(PROFILE_KEY); } catch (e) {}
}

function pel(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function reasonLabel(reason) {
  const r = REASONS.find(x => x.id === reason);
  return r ? r.label : "Just exploring";
}

/** Short version for the menu-bar summary. */
function reasonShort(reason) {
  return {
    "jewish-reminders": "Daily reminders",
    "jewish-growing": "Growing",
    "jewish-reconnecting": "Reconnecting",
    converting: "Converting",
    converted: "Welcome home",
    curious: "Curious"
  }[reason] || null;
}

function nusachLabel(nusach) {
  const n = NUSACHS.find(x => x.id === nusach);
  return n ? n.label : null;
}

function communityLabel(community) {
  return { ashkenazi: "Ashkenazi", sephardi: "Sephardi / Mizrahi", chabad: "Chabad", litvish: "Litvish / Yeshivish", other: "Other / not sure" }[community] || null;
}

// ---------------------------------------------------------------------
// Pill choice groups — shared by Settings and the welcome wizard
// ---------------------------------------------------------------------

/**
 * A row of pill buttons that behave like radio buttons.
 * options: [{ id, label, blurb? }]; value: the selected id; onPick(id).
 * `stack` lays them out one per line with their blurb underneath.
 */
function choicePills(name, options, value, onPick, stack) {
  const group = pel("div", "pill-group" + (stack ? " pill-group--stack" : ""));
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", name);
  const buttons = [];
  options.forEach(o => {
    const b = pel("button", "pill");
    b.type = "button";
    b.setAttribute("role", "radio");
    const lab = pel("span", "pill-label");
    lab.textContent = o.label;
    b.appendChild(lab);
    if (stack && o.blurb) {
      const s = pel("small", "pill-blurb");
      s.textContent = o.blurb;
      b.appendChild(s);
    }
    const on = value === o.id;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-checked", String(on));
    b.addEventListener("click", () => {
      buttons.forEach(x => { const sel = x === b; x.classList.toggle("is-on", sel); x.setAttribute("aria-checked", String(sel)); });
      onPick(o.id);
    });
    buttons.push(b);
    group.appendChild(b);
  });
  return group;
}

/** The "About you" choices (gender, married, children), used in both places. */
function aboutYouFields(profile, onChange) {
  const wrap = pel("div", "about-fields");
  wrap.appendChild(choicePills("Gender", GENDERS, profile.gender, id => { profile.gender = id; onChange(); }));
  wrap.appendChild(pel("div", "pill-sub", "Family"));
  wrap.appendChild(choicePills("Married", [{ id: "yes", label: "Married" }, { id: "no", label: "Not married" }],
    profile.married === true ? "yes" : profile.married === false ? "no" : null,
    id => { profile.married = id === "yes"; onChange(); }));
  const kids = choicePills("Children", CHILDREN, profile.children, id => { profile.children = id; onChange(); });
  kids.classList.add("pill-group--gap");
  wrap.appendChild(kids);
  wrap.appendChild(pel("p", "pill-note", "With children, you'll see kids' activities and things to share with them."));
  return wrap;
}

// ---------------------------------------------------------------------
// Welcome wizard (first visit)
// ---------------------------------------------------------------------

/** Opens the 4-step welcome. Calls `onDone(profile)` once the visitor
 *  finishes or skips. Safe to call any time to let the visitor change answers. */
function openOnboarding(onDone) {
  const existing = document.getElementById("onboarding-overlay");
  if (existing) existing.remove();

  const profile = { ...emptyProfile(), ...(getProfile() || {}) };
  const settings = typeof getSettings === "function" ? getSettings() : null;

  const overlay = pel("div", "onboarding-overlay");
  overlay.id = "onboarding-overlay";
  const modal = pel("div", "onboarding-modal wizard");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "wizard-title");
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");

  let step = 0;
  let openSettingsAfter = false;

  function finish() {
    const saved = saveProfile(profile);
    if (settings && typeof saveSettings === "function") saveSettings(settings);
    overlay.classList.add("onboarding-overlay--closing");
    setTimeout(() => {
      overlay.remove();
      document.body.classList.remove("no-scroll");
      onDone(saved);
      if (openSettingsAfter && typeof openNavSettings === "function") openNavSettings();
    }, 220);
  }

  const STEPS = [
    {
      title: "What brings you here?",
      lead: "This sets how much we explain and the kind of encouragement you'll see.",
      body: () => choicePills("What brings you here", REASONS, profile.reason, id => { profile.reason = id; }, true)
    },
    {
      title: "A little about you",
      lead: "So we can show the mitzvot and reflections that fit your life. Some mitzvot are different for men and women.",
      body: () => aboutYouFields(profile, () => {})
    },
    {
      title: "Your prayer tradition",
      lead: "Blessings and customs follow your nusach. Not sure? We'll show the common practice and the alternatives.",
      body: () => choicePills("Prayer tradition", NUSACHS, profile.nusach, id => { profile.nusach = id; })
    },
    {
      title: "Where you are",
      lead: "Your city sets candle-lighting and prayer times. Customs set the holiday calendar and Torah readings.",
      body: () => {
        const w = pel("div");
        const city = pel("div", "wizard-city");
        const name = settings && settings.location ? settings.location.name : null;
        const cityText = pel("span", "wizard-city-name");
        cityText.textContent = name ? "📍 " + name : "📍 No city yet";
        city.appendChild(cityText);
        const choose = pel("button", "pill");
        choose.type = "button";
        choose.textContent = name ? "Change city" : "Choose my city";
        choose.addEventListener("click", () => { openSettingsAfter = true; finish(); });
        city.appendChild(choose);
        w.appendChild(city);
        if (settings) {
          w.appendChild(pel("div", "pill-sub", "Customs"));
          w.appendChild(choicePills("Customs", israelModeOptions(settings), settings.israelMode || "auto", id => { settings.israelMode = id; }));
          w.appendChild(pel("p", "pill-note", "Visiting Israel? Keep the customs of where you live."));
        }
        return w;
      }
    }
  ];

  function render() {
    const s = STEPS[step];
    modal.innerHTML = "";
    const dots = pel("div", "wizard-steps");
    STEPS.forEach((_, i) => dots.appendChild(pel("i", i <= step ? "is-on" : "")));
    modal.appendChild(dots);
    const kicker = pel("div", "wizard-kicker");
    kicker.textContent = step === 0 ? "Welcome to One Mitzva a Day" : `Step ${step + 1} of ${STEPS.length}`;
    modal.appendChild(kicker);
    const h = pel("h3", "onboarding-title");
    h.id = "wizard-title";
    h.textContent = s.title;
    modal.appendChild(h);
    const lead = pel("p", "onboarding-sub");
    lead.textContent = s.lead;
    modal.appendChild(lead);
    modal.appendChild(s.body());
    modal.appendChild(pel("p", "pill-note wizard-privacy", "🔒 Saved only on this device. You can change it anytime in Settings."));

    const foot = pel("div", "wizard-foot");
    const left = pel("button", "onboarding-skip");
    left.type = "button";
    left.textContent = step === 0 ? "Skip for now" : "← Back";
    left.addEventListener("click", () => { if (step === 0) finish(); else { step--; render(); } });
    foot.appendChild(left);
    const next = pel("button", "settings-done");
    next.type = "button";
    next.textContent = step === STEPS.length - 1 ? "Start →" : "Next →";
    next.addEventListener("click", () => { if (step === STEPS.length - 1) finish(); else { step++; render(); } });
    foot.appendChild(next);
    modal.appendChild(foot);
    modal.scrollTop = 0;
  }

  render();
}
