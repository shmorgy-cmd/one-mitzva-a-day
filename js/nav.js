/**
 * nav.js — the menu bar on every page: the logo (home), the four pages (Today,
 * Torah, Everyday Mitzvot, About) and Settings, plus the phone's bottom bar with
 * the same four pages. The markup is in each page; this marks the current page,
 * adds the tab icons, shows the saved city under "Settings" and opens the
 * settings panel from any page.
 *
 * Each page says which one it is with <body data-page="today|torah|mitzvot|about">.
 * A page can set window.onSettingsChanged to refresh itself after a settings
 * change; otherwise the page reloads.
 */

const NAV_GEAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>';

/** The saved city under "Settings" (or a nudge to set one). */
function updateNavSettings() {
  const small = document.getElementById("nav-settings-city");
  const btn = document.getElementById("nav-settings");
  if (!small || !btn) return;
  const settings = getSettings();
  const city = settings.location ? settings.location.name : "Set your city";
  small.textContent = city;
  btn.setAttribute("aria-label", `Settings — ${settingsSummary(settings, getProfile())}`);
}

/** Opens the settings panel; after a change, the page refreshes itself. */
function openNavSettings() {
  openSettingsPanel((changed) => {
    updateNavSettings();
    if (!changed) return;
    if (typeof window.onSettingsChanged === "function") window.onSettingsChanged();
    else location.reload();
  });
}

function initNav() {
  const page = document.body.dataset.page || "";
  document.querySelectorAll(".site-bar [data-page], #tab-bar [data-page]").forEach(a => {
    const on = a.dataset.page === page;
    a.classList.toggle("is-active", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  document.querySelectorAll("#tab-bar a").forEach(a => {
    if (a.querySelector(".tab-icon")) return;
    const label = a.textContent;
    a.innerHTML = `<span class="tab-icon" aria-hidden="true">${getIcon(a.dataset.icon)}</span><span>${label}</span>`;
  });
  const btn = document.getElementById("nav-settings");
  if (btn) {
    const gear = btn.querySelector(".sb-gear");
    if (gear && !gear.innerHTML) gear.innerHTML = NAV_GEAR_SVG;
    btn.addEventListener("click", openNavSettings);
  }
  updateNavSettings();
  initCompactBar();
}

/** The banner shows the tagline at the top of the page and shrinks to a slim bar
 *  once you scroll. Two thresholds (shrink past 80px, grow back only near the top)
 *  so the change in height can't make it flicker. */
function initCompactBar() {
  let compact = false;
  let pending = false;
  const update = () => {
    pending = false;
    const y = window.scrollY;
    const next = compact ? y > 4 : y > 80;
    if (next !== compact) {
      compact = next;
      document.body.classList.toggle("bar-compact", compact);
    }
  };
  window.addEventListener("scroll", () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

document.addEventListener("DOMContentLoaded", initNav);
