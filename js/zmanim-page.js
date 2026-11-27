/**
 * zmanim-page.js — the Times page (zmanim.html): the day's halachic times for the
 * saved city, with a day picker. zmanim.html?date=2026-11-27 opens that day.
 */

// The visitor's profile and settings (reportLink and the community times read them).
let currentProfile = getProfile();
let currentSettings = getSettings();

function zpParseDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "");
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
function zpISO(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function zpAddDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function zpToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }

let zpDate = zpParseDate(new URLSearchParams(location.search).get("date")) || zpToday();
let zpTimer = null;

function zpGo(date) {
  zpDate = date;
  const iso = zpISO(date);
  history.replaceState(null, "", iso === zpISO(zpToday()) ? "zmanim.html" : `zmanim.html?date=${iso}`);
  renderZmanimPage();
}

async function renderZmanimPage() {
  if (zpTimer) { clearInterval(zpTimer); zpTimer = null; }
  const app = document.getElementById("zp-app");
  const date = zpDate;
  const isToday = zpISO(date) === zpISO(zpToday());
  app.innerHTML = "";

  // Title, date and city
  const top = el("section", "mz-top zp-top");
  top.appendChild(el("h1", "mz-title", isToday ? "Today's times" : "Times"));
  const heb = el("p", "zp-heb", "");
  heb.lang = "he";
  heb.dir = "rtl";
  top.appendChild(heb);
  top.appendChild(el("p", "mz-sub", date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })));
  const loc = currentSettings.location;
  const city = el("p", "zp-city");
  city.appendChild(el("span", null, loc ? `For ${loc.name}` : "No city set yet"));
  const change = el("button", "zp-city-btn", loc ? "Change city" : "Set your city");
  change.type = "button";
  change.addEventListener("click", openNavSettings);
  city.appendChild(change);
  top.appendChild(city);
  app.appendChild(top);
  fetchJSON(`https://www.hebcal.com/converter?cfg=json&date=${zpISO(date)}&g2h=1`)
    .then(h => { if (zpISO(date) === zpISO(zpDate)) heb.textContent = h.hebrew || ""; })
    .catch(() => {});

  // Day picker: ← Today →, and any date
  const nav = el("div", "zp-nav");
  const btn = (label, aria, onClick, cls) => {
    const b = el("button", "ds-btn" + (cls ? " " + cls : ""), label);
    b.type = "button";
    if (aria) b.setAttribute("aria-label", aria);
    b.addEventListener("click", onClick);
    return b;
  };
  nav.appendChild(btn("‹", "Previous day", () => zpGo(zpAddDays(zpDate, -1))));
  nav.appendChild(btn("Today", "Back to today", () => zpGo(zpToday()), isToday ? "ds-btn--today" : ""));
  nav.appendChild(btn("›", "Next day", () => zpGo(zpAddDays(zpDate, 1))));
  const other = el("label", "ds-btn ds-other");
  other.appendChild(el("span", "ds-other-ic", "📅"));
  other.appendChild(el("span", "ds-other-text", "Other date"));
  const input = el("input", "ds-date-input");
  input.type = "date";
  input.value = zpISO(date);
  input.setAttribute("aria-label", "Choose any date");
  input.addEventListener("change", () => { const d = zpParseDate(input.value); if (d) zpGo(d); });
  other.appendChild(input);
  nav.appendChild(other);
  app.appendChild(nav);

  const body = el("section", "zp-body");
  app.appendChild(body);

  if (!loc) {
    body.appendChild(el("p", "intro", "Zmanim depend on sunrise and sunset where you are, so they need your city — they're never guessed."));
    const set = el("button", "settings-link-btn", "Set your city for exact times");
    set.type = "button";
    set.addEventListener("click", openNavSettings);
    body.appendChild(set);
    return;
  }

  body.appendChild(el("p", "intro", "Loading the times…"));
  let times = null;
  try { times = await fetchZmanim(loc, zpISO(date)); } catch (e) { console.warn(e); }
  if (zpISO(date) !== zpISO(zpDate)) return; // moved to another day meanwhile
  body.innerHTML = "";
  if (!times) {
    body.appendChild(el("p", "intro", "Couldn't load the times right now — check your connection and try again."));
    return;
  }

  const community = pcCommunityKey(currentProfile && currentProfile.reason === "jewish" ? currentProfile.community : null);
  const groups = buildZmanimGroups(times, community);
  const nextBox = el("p", "zm-next");
  body.appendChild(nextBox);
  const grid = el("div", "zp-grid");
  body.appendChild(grid);

  const rowsEls = [];
  groups.forEach(g => {
    const card = el("article", "zp-card");
    const head = el("div", "zp-card-head");
    head.appendChild(iconBadge(g.icon || "sunrise", "icon-badge--gold"));
    head.appendChild(el("h2", null, g.title));
    card.appendChild(head);
    const dl = el("dl", "zm-list");
    g.rows.forEach(r => {
      const row = el("div", "zm-row");
      const dt = el("dt", null, r.label);
      if (r.note) dt.appendChild(el("span", "zm-note", r.note));
      row.appendChild(dt);
      row.appendChild(el("dd", null, r.iso ? fmtZman(r.iso) : (r.text || "—")));
      dl.appendChild(row);
      rowsEls.push({ r, row });
    });
    card.appendChild(dl);
    grid.appendChild(card);
  });

  body.appendChild(el("p", "pc-review", "Calculated by Hebcal for your city. Opinions differ on several of these times — ask your rabbi which ones your community follows."));
  body.appendChild(reportLink(`zmanim:${zpISO(date)}`));

  // Today: what's next is highlighted and what has passed fades; it updates every minute.
  function paint() {
    if (!isToday) { nextBox.hidden = true; return; }
    const now = new Date();
    const next = nextZman(groups, now);
    rowsEls.forEach(({ r, row }) => {
      // Every row at that same time (midday shows in two groups, sunset in three).
      row.classList.toggle("is-next", !!next && !!r.iso && Math.abs((r.at || new Date(r.iso)) - next.at) < 60000);
      row.classList.toggle("is-past", !!r.iso && (r.at || new Date(r.iso)) < now);
    });
    nextBox.hidden = !next;
    if (next) nextBox.textContent = `Coming up at ${fmtZman(next.row.iso)} — ${next.group.title}: ${next.row.label}`;
  }
  paint();
  if (isToday) zpTimer = setInterval(paint, 60000);
}

// After a settings change (city, profile), redraw instead of reloading.
window.onSettingsChanged = () => {
  currentSettings = getSettings();
  currentProfile = getProfile();
  renderZmanimPage();
};

document.addEventListener("DOMContentLoaded", renderZmanimPage);
