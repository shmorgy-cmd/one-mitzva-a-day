/**
 * profile.js — a tiny, local-only visitor profile ("why are you here" /
 * "what's your background") used purely to tailor which notes and framing
 * show up in the content and prayer cards. Nothing here is sent anywhere;
 * it lives in the browser's localStorage on the visitor's own device.
 */

const PROFILE_KEY = "omad_profile_v1";

const REASONS = [
  { id: "jewish", label: "I'm Jewish", icon: "star", blurb: "See customs framed for your own community's practice." },
  { id: "converting", label: "I'm exploring conversion", icon: "heart", blurb: "Extra grounding notes on the basics, alongside the daily content." },
  { id: "curious", label: "Just curious to learn", icon: "book-star", blurb: "Friendly context wherever a term or custom might be unfamiliar." }
];

const COMMUNITIES = [
  { id: "ashkenazi", label: "Ashkenazi" },
  { id: "sephardi", label: "Sephardi / Mizrahi" },
  { id: "chabad", label: "Chabad" },
  { id: "litvish", label: "Litvish / Yeshivish" },
  { id: "other", label: "Other / not sure" }
];

function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, setAt: new Date().toISOString() }));
  } catch (e) { /* localStorage unavailable — profile just won't persist */ }
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

/** Renders the onboarding overlay. Calls `onDone(profile)` once the visitor
 *  finishes or skips. Safe to call any time to let the visitor change answers. */
function openOnboarding(onDone) {
  const existing = document.getElementById("onboarding-overlay");
  if (existing) existing.remove();

  const overlay = pel("div", "onboarding-overlay");
  overlay.id = "onboarding-overlay";

  const modal = pel("div", "onboarding-modal");
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");

  function finish(profile) {
    saveProfile(profile);
    overlay.classList.add("onboarding-overlay--closing");
    setTimeout(() => {
      overlay.remove();
      document.body.classList.remove("no-scroll");
      onDone(profile);
    }, 220);
  }

  function renderStep1() {
    modal.innerHTML = "";
    modal.appendChild(pel("div", "onboarding-badge", getIcon("star")));
    modal.appendChild(pel("h3", "onboarding-title", "Welcome — what brings you here?"));
    modal.appendChild(pel("p", "onboarding-sub", "This just tailors a few notes on the page for you. It stays on this device — nothing is sent anywhere, and you can change it anytime."));

    const grid = pel("div", "onboarding-grid");
    REASONS.forEach(r => {
      const btn = pel("button", "onboarding-option");
      btn.type = "button";
      btn.innerHTML = `<span class="onboarding-option-icon">${getIcon(r.icon)}</span><span class="onboarding-option-label">${r.label}</span><span class="onboarding-option-blurb">${r.blurb}</span>`;
      btn.addEventListener("click", () => {
        if (r.id === "jewish") {
          renderStep2();
        } else {
          finish({ reason: r.id, community: null });
        }
      });
      grid.appendChild(btn);
    });
    modal.appendChild(grid);

    const skip = pel("button", "onboarding-skip", "Skip for now");
    skip.type = "button";
    skip.addEventListener("click", () => finish({ reason: null, community: null }));
    modal.appendChild(skip);
  }

  function renderStep2() {
    modal.innerHTML = "";
    modal.appendChild(pel("div", "onboarding-badge", getIcon("book-star")));
    modal.appendChild(pel("h3", "onboarding-title", "Which community's customs fit you best?"));
    modal.appendChild(pel("p", "onboarding-sub", "Some customs — like exactly when Selichot begins — genuinely differ by community. This helps the page match yours."));

    const grid = pel("div", "onboarding-grid onboarding-grid--compact");
    COMMUNITIES.forEach(c => {
      const btn = pel("button", "onboarding-option onboarding-option--compact");
      btn.type = "button";
      btn.innerHTML = `<span class="onboarding-option-label">${c.label}</span>`;
      btn.addEventListener("click", () => finish({ reason: "jewish", community: c.id }));
      grid.appendChild(btn);
    });
    modal.appendChild(grid);

    const back = pel("button", "onboarding-skip", "← Back");
    back.type = "button";
    back.addEventListener("click", renderStep1);
    modal.appendChild(back);
  }

  renderStep1();
}

function reasonLabel(reason) {
  const r = REASONS.find(x => x.id === reason);
  return r ? r.label : "Just exploring";
}

function communityLabel(community) {
  const c = COMMUNITIES.find(x => x.id === community);
  return c ? c.label : null;
}
