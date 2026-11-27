/**
 * mitzvot-page.js — the Everyday Mitzvot page (mitzvot.html).
 *
 *   • The list: today's mitzvah, "Start here" first steps for the visitor's
 *     profile, then each theme (first few, with "See all"); a search box and
 *     theme chips narrow it down.
 *   • One mitzvah (mitzvot.html#<id>): why it matters, how to do it, the words
 *     (Hebrew, transliteration on hover/tap, English, speaker), the visitor's
 *     community custom, a thought to take along, related mitzvot, previous/next.
 *   • "I'm learning this" / "I do this", saved only in this browser.
 */

// Read by reportLink() (integrations.js) and the glossary, as on the home page.
let currentProfile = getProfile();

const MZ_TRACK_KEY = "omad_mitzvot_track_v1";
const MZ_PER_THEME = 4;
const mzById = new Map(MITZVOT.map(m => [m.id, m]));
const mzState = { q: "", cat: "all" };

function mzThemeOf(id) {
  return MITZVA_CATEGORIES.find(c => c.ids.includes(id)) || null;
}

function mzTrack() {
  try { return JSON.parse(localStorage.getItem(MZ_TRACK_KEY) || "{}") || {}; } catch (e) { return {}; }
}

/** Sets (or, pressed again, clears) "learning" / "doing" for one mitzvah. */
function mzSetTrack(id, kind) {
  const t = mzTrack();
  if (t[id] === kind) delete t[id]; else t[id] = kind;
  try { localStorage.setItem(MZ_TRACK_KEY, JSON.stringify(t)); } catch (e) { /* not saved */ }
}

function mzBadge(icon, extra) {
  return iconBadge(icon, extra || "icon-badge--sm");
}

// --- The list -------------------------------------------------------------------

function mzCard(m) {
  const b = el("a", "mz-card");
  b.href = `#${m.id}`;
  b.appendChild(mzBadge(m.icon));
  const t = el("span", "mz-card-text");
  t.appendChild(el("span", "mz-card-title", m.title));
  t.appendChild(el("span", "mz-card-sub", m.subtitle));
  if (MITZVA_GENDER[m.id]) t.appendChild(el("span", "mz-gtag", MITZVA_GENDER_LABEL[MITZVA_GENDER[m.id]]));
  b.appendChild(t);
  const tr = mzTrack()[m.id];
  if (tr) b.appendChild(el("span", `mz-mark mz-mark--${tr}`, tr === "doing" ? "✓ Doing" : "Learning"));
  return b;
}

function mzRenderList() {
  const app = document.getElementById("mz-app");
  app.innerHTML = "";
  document.title = "Everyday Mitzvot — One Mitzva a Day";
  const track = mzTrack();
  const learning = Object.values(track).filter(v => v === "learning").length;
  const doing = Object.values(track).filter(v => v === "doing").length;

  const top = el("section", "mz-top");
  top.appendChild(el("h1", "mz-title", "Everyday Mitzvot"));
  top.appendChild(el("p", "mz-sub", "Small practices for every day — pick one, learn it, try it. There's no rush."));
  if (learning || doing) {
    const p = el("div", "mz-progress");
    const a = el("button", "mz-pill", `Learning ${learning}`);
    const d = el("button", "mz-pill mz-pill--doing", `Doing ${doing}`);
    [a, d].forEach(x => {
      x.type = "button";
      x.addEventListener("click", () => { mzState.cat = "mine"; mzRenderList(); });
    });
    p.appendChild(a);
    p.appendChild(d);
    top.appendChild(p);
  }
  app.appendChild(top);

  // Search and theme chips stay at the top while scrolling.
  const bar = el("div", "mz-search");
  const input = el("input");
  input.type = "search";
  input.placeholder = "Search: challah, mezuzah, kindness…";
  input.setAttribute("aria-label", "Search the everyday mitzvot");
  input.value = mzState.q;
  input.addEventListener("input", () => { mzState.q = input.value; mzRenderResults(); });
  bar.appendChild(input);
  const chips = el("div", "mz-chips");
  chips.setAttribute("role", "toolbar");
  chips.setAttribute("aria-label", "Themes");
  const chipDefs = [{ key: "all", name: "All" }, ...(learning || doing ? [{ key: "mine", name: "My mitzvot" }] : []), ...MITZVA_CATEGORIES];
  chipDefs.forEach(c => {
    const b = el("button", "mz-chip", c.name);
    b.type = "button";
    if (c.ids) b.appendChild(el("small", null, String(c.ids.length)));
    b.setAttribute("aria-pressed", mzState.cat === c.key ? "true" : "false");
    b.addEventListener("click", () => { mzState.cat = c.key; mzRenderList(); });
    chips.appendChild(b);
  });
  bar.appendChild(chips);
  app.appendChild(bar);

  const results = el("div", "mz-results");
  results.id = "mz-results";
  app.appendChild(results);
  mzRenderResults();
}

function mzRenderResults() {
  const box = document.getElementById("mz-results");
  box.innerHTML = "";
  const q = mzState.q.trim().toLowerCase();
  const matches = (m) => !q || [m.title, m.subtitle, m.intro].join(" ").toLowerCase().includes(q);

  if (!q && mzState.cat === "all") {
    const t = getMitzvahForDate(new Date(), currentProfile);
    const today = el("a", "mz-today");
    today.href = `#${t.id}`;
    today.appendChild(mzBadge(t.icon, "icon-badge--gold"));
    const tx = el("span");
    tx.appendChild(el("span", "mz-kicker", "Today's mitzvah"));
    tx.appendChild(el("strong", null, t.title));
    tx.appendChild(el("span", "mz-card-sub", t.subtitle));
    today.appendChild(tx);
    box.appendChild(today);

    const reason = !currentProfile || !currentProfile.reason ? "curious"
      : isJewishProfile(currentProfile) ? "jewish"
      : currentProfile.reason === "converting" ? "converting" : "curious";
    const sh = el("h2", "mz-h2", "Start here");
    sh.appendChild(el("small", null, "gentle first steps"));
    box.appendChild(sh);
    const row = el("div", "mz-start");
    // Women start with Shabbat candles instead of tefillin (unless "Show me everything").
    const women = currentProfile && currentProfile.gender === "female" && !currentProfile.showAll;
    const start = MITZVA_START_HERE[reason].map(id => women && MITZVA_GENDER[id] === "male" ? "shabbat-candles" : id);
    [...new Set(start)].forEach(id => mzById.get(id) && row.appendChild(mzCard(mzById.get(id))));
    box.appendChild(row);

    // Each theme shows its first few; "See all" opens the whole theme.
    MITZVA_CATEGORIES.forEach(c => {
      const h = el("h2", "mz-h2", c.name);
      h.appendChild(el("small", null, String(c.ids.length)));
      box.appendChild(h);
      const grid = el("div", "mz-grid");
      c.ids.slice(0, MZ_PER_THEME).forEach(id => mzById.get(id) && grid.appendChild(mzCard(mzById.get(id))));
      box.appendChild(grid);
      if (c.ids.length > MZ_PER_THEME) {
        const more = el("button", "mz-more", `See all ${c.ids.length} in ${c.name} →`);
        more.type = "button";
        more.addEventListener("click", () => { mzState.cat = c.key; mzRenderList(); window.scrollTo(0, 0); });
        box.appendChild(more);
      }
    });
    return;
  }

  let list;
  if (mzState.cat === "mine") list = MITZVOT.filter(m => mzTrack()[m.id]);
  else if (mzState.cat === "all") list = MITZVA_CATEGORIES.flatMap(c => c.ids).map(id => mzById.get(id)).filter(Boolean);
  else list = MITZVA_CATEGORIES.find(c => c.key === mzState.cat).ids.map(id => mzById.get(id)).filter(Boolean);
  list = list.filter(matches);
  const heading = q
    ? `${list.length} result${list.length === 1 ? "" : "s"}`
    : (mzState.cat === "mine" ? "My mitzvot" : MITZVA_CATEGORIES.find(c => c.key === mzState.cat).name);
  box.appendChild(el("h2", "mz-h2", heading));
  if (!list.length) {
    box.appendChild(el("p", "mz-empty", q ? "Nothing found — try another word." : "Nothing here yet."));
    return;
  }
  const grid = el("div", "mz-grid");
  list.forEach(m => grid.appendChild(mzCard(m)));
  box.appendChild(grid);
}

// --- One mitzvah ---------------------------------------------------------------------

function mzSection(title) {
  const sec = el("section", "mz-sec");
  sec.appendChild(el("h2", null, title));
  return sec;
}

function mzRenderDetail(m) {
  const app = document.getElementById("mz-app");
  app.innerHTML = "";
  window.scrollTo(0, 0);
  document.title = `${m.title} — Everyday Mitzvot`;
  const profile = currentProfile;
  const used = new Set();
  const d = el("article", "mz-detail");

  const back = el("a", "mz-back", "← All everyday mitzvot");
  back.href = "#";
  back.addEventListener("click", (e) => {
    // Go back if we came from the list, so its search and scroll stay as they were.
    if (history.state && history.state.mzFromList) { e.preventDefault(); history.back(); }
  });
  d.appendChild(back);

  const theme = mzThemeOf(m.id);
  if (theme) d.appendChild(el("div", "mz-d-theme", theme.name));
  const head = el("div", "mz-d-head");
  head.appendChild(mzBadge(m.icon, "icon-badge--gold"));
  head.appendChild(el("h1", null, m.title));
  d.appendChild(head);
  d.appendChild(el("p", "mz-d-sub", m.subtitle));
  if (MITZVA_GENDER[m.id]) {
    const g = el("p", "mz-d-gender");
    g.appendChild(genderView(currentProfile) === "both" || currentProfile && currentProfile.showAll
      ? genderTag(MITZVA_GENDER_LABEL[MITZVA_GENDER[m.id]], currentProfile)
      : el("span", "g-tag g-tag--plain", MITZVA_GENDER_LABEL[MITZVA_GENDER[m.id]]));
    d.appendChild(g);
  }

  const track = el("div", "mz-track");
  [["learning", "learn", "📖 I'm learning this"], ["doing", "do", "✓ I do this"]].forEach(([kind, cls, label]) => {
    const b = el("button", cls, label);
    b.type = "button";
    b.setAttribute("aria-pressed", mzTrack()[m.id] === kind ? "true" : "false");
    b.addEventListener("click", () => { mzSetTrack(m.id, kind); mzRenderDetail(m); });
    track.appendChild(b);
  });
  d.appendChild(track);
  d.appendChild(el("p", "mz-track-note", "Saved only on this device — no account."));

  const why = mzSection("Why it matters");
  why.appendChild(richEl("p", null, m.intro, profile, used));
  d.appendChild(why);

  const how = mzSection("How to do it");
  const ol = el("ol", "mz-steps");
  m.steps.forEach(s => ol.appendChild(richEl("li", null, s, profile, used)));
  how.appendChild(ol);
  d.appendChild(how);

  if (m.blessings || m.texts) {
    const words = mzSection("The words");
    const community = pcCommunityKey((profile && profile.community) || null);
    const texts = (m.texts || []).map(r => ({ key: r.key, opts: Object.assign({ community }, r.opts || {}) }));
    renderWords(words, m.blessings, texts, null);
    d.appendChild(words);
  }

  const extras = MITZVA_EXTRAS[m.id] || {};
  const minhag = renderMinhagBox(extras.minhagim, profile);
  const takingOn = renderTakingOnBox(extras.takingOn, profile, used);
  if (minhag || takingOn) {
    const sec = mzSection(minhag ? "Your community's custom" : "Taking it on");
    if (minhag) sec.appendChild(minhag);
    if (takingOn) sec.appendChild(takingOn);
    d.appendChild(sec);
  }
  const toneNote = toneMitzvahNote(m, profile);
  if (toneNote) d.appendChild(toneNote);

  const ref = mzSection("A thought to take with you");
  ref.appendChild(richEl("p", "mz-reflect", m.inspiration, profile, used));
  if (m.sources && m.sources.length) {
    const s = el("details", "mz-sources");
    s.appendChild(el("summary", null, "Sources"));
    s.appendChild(el("p", null, m.sources.join("; ")));
    ref.appendChild(s);
  }
  ref.appendChild(reportLink(`mitzvah:${m.id}`));
  d.appendChild(ref);

  if (theme) {
    const others = theme.ids.filter(id => id !== m.id).slice(0, 4).map(id => mzById.get(id)).filter(Boolean);
    if (others.length) {
      d.appendChild(el("h2", "mz-h2", `More in ${theme.name}`));
      const grid = el("div", "mz-grid");
      others.forEach(o => grid.appendChild(mzCard(o)));
      d.appendChild(grid);
    }
    const i = theme.ids.indexOf(m.id);
    const nav = el("nav", "mz-nav");
    nav.setAttribute("aria-label", "Previous and next mitzvah");
    [[mzById.get(theme.ids[i - 1]), "prev", "← Previous"], [mzById.get(theme.ids[i + 1]), "next", "Next →"]].forEach(([x, cls, label]) => {
      if (!x) { nav.appendChild(el("span")); return; }
      const a = el("a", cls);
      a.href = `#${x.id}`;
      a.appendChild(el("small", null, label));
      a.appendChild(document.createTextNode(x.title));
      nav.appendChild(a);
    });
    d.appendChild(nav);
  }
  app.appendChild(d);
}

// --- Routing -----------------------------------------------------------------------

let mzLastWasList = false;

function mzRoute() {
  const id = decodeURIComponent(location.hash.slice(1));
  const m = mzById.get(id);
  if (m) {
    // Remember that this page was opened from the list, for the Back link.
    if (mzLastWasList) history.replaceState({ mzFromList: true }, "");
    mzRenderDetail(m);
    mzLastWasList = false;
  } else {
    mzRenderList();
    mzLastWasList = true;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyTransliterationPref();
  initHebrewVoice();
  window.addEventListener("hashchange", mzRoute);
  mzRoute();
});
