/**
 * app.js — fetches live Jewish-calendar data from the Hebcal API, builds a
 * context object, matches it against OCCASIONS (content.js), and renders
 * the page. Also fetches today's daily Torah portion (one of the week's
 * seven aliyot, matched to the day of the week per the Chabad "Chitas"
 * custom) from Hebcal (for the verse range) and Sefaria (for the text).
 */

const HEBCAL_BASE = "https://www.hebcal.com/hebcal";
const CONVERTER_BASE = "https://www.hebcal.com/converter";

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toISO(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/** Parse a "YYYY-MM-DD" date-only string as a LOCAL midnight Date — `new Date(str)`
 *  parses date-only ISO strings as UTC midnight, which shifts a day in negative-offset
 *  timezones once localized. Hebcal's `date` fields are always date-only. */
function parseLocalDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfDay(d) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
}

/** Find the Ashkenazi Selichot start date (Motzei Shabbat) given Rosh Hashanah (day 1) date. */
function computeSelichotStart(roshHashanaDate) {
  const d = new Date(roshHashanaDate);
  while (d.getDay() !== 6) d.setDate(d.getDate() - 1); // walk back to nearest Saturday
  const diffDays = daysBetween(d, roshHashanaDate);
  if (diffDays < 4) d.setDate(d.getDate() - 7);
  return d;
}

/** Erev Tavshilin is needed when a multi-day Yom Tov begins on Thursday (running Thu-Fri into Shabbat). */
function needsErevTavshilin(yomTovFirstDay) {
  return yomTovFirstDay.getDay() === 4; // Thursday
}

async function loadCalendarWindow(today) {
  const start = toISO(addDays(today, -25));
  const end = toISO(addDays(today, 40));
  const url = `${HEBCAL_BASE}?v=1&cfg=json&start=${start}&end=${end}&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on&o=on&leyning=on${hebcalCalendarQuery(currentSettings)}`;
  const data = await fetchJSON(url);
  // Timed events (candle lighting, Havdalah, fast begins/ends) come as
  // "2026-12-18T16:12:00-05:00" — keep the wall-clock time for display, in the
  // saved city's own time zone, and use the date part for matching days.
  const list = (data.items || []).map(e => ({
    ...e,
    time: e.date.length > 10 ? e.date.slice(11, 16) : null,
    at: e.date.length > 10 ? new Date(e.date) : null, // exact moment, for reminders
    date: startOfDay(parseLocalDate(e.date.slice(0, 10)))
  }));
  // Days kept by particular communities (shown by nusach — see community-days.js).
  if (typeof communityDaysBetween === "function") {
    list.push(...communityDaysBetween(addDays(today, -25), addDays(today, 40), isInIsrael(currentSettings)));
  }
  return list;
}

async function loadHebrewDate(today) {
  const url = `${CONVERTER_BASE}?cfg=json&date=${toISO(today)}&g2h=1`;
  return fetchJSON(url);
}

function buildContext(today, events, hebrewDateInfo, profile) {
  const findEvent = (fn) => events.find(fn);

  // Rosh Hashana day 1 is titled "Rosh Hashana <year>" (e.g. "Rosh Hashana 5787"),
  // distinct from "Erev Rosh Hashana", "Rosh Hashana II", and "Rosh Hashana LaBehemot".
  const rhFirst = findEvent(e => /^Rosh Hashana \d{3,4}$/.test(e.title));

  const ykEvent = findEvent(e => e.title === "Yom Kippur");
  const tishaBavEvent = findEvent(e => /^Tish.a B.Av/.test(e.title));
  const t17Event = findEvent(e => /^Tzom Tammuz$/.test(e.title));

  // Sephardi custom recites Selichot nightly from Rosh Chodesh Elul; Ashkenazi/Chabad/
  // Litvish custom starts the Motzei Shabbat closest to Rosh Hashana (at least 4 nights before).
  const isSephardi = profile && profile.community === "sephardi";
  let selichotStart = null;
  if (isSephardi) {
    const roshChodeshElul = findEvent(e => e.title === "Rosh Chodesh Elul");
    selichotStart = roshChodeshElul ? roshChodeshElul.date : null;
  } else {
    const leilSelichotEvent = findEvent(e => e.title === "Leil Selichot");
    selichotStart = leilSelichotEvent ? leilSelichotEvent.date : (rhFirst ? computeSelichotStart(rhFirst.date) : null);
  }

  // Erev Tavshilin: check upcoming multi-day Yom Tov starts (RH, Sukkot I, Pesach I, Shavuot I)
  let erevTavshilin = null;
  const ytStarts = events.filter(e =>
    /^Rosh Hashana \d{3,4}$/.test(e.title) ||
    e.title === "Sukkot I" || e.title === "Pesach I" || e.title === "Shavuot I"
  );
  for (const yt of ytStarts) {
    if (needsErevTavshilin(yt.date)) {
      const evDate = addDays(yt.date, -1); // Wednesday, the day before Thu/Fri Yom Tov
      if (evDate >= addDays(today, -1)) {
        erevTavshilin = evDate;
        break;
      }
    }
  }

  // Omer count: Pesach day 2 (16 Nisan) is Omer day 1. Find Pesach II event.
  // "Pesach II" outside Israel; "Pesach II (CH’’M)" (Chol HaMoed) in Israel.
  const pesachII = findEvent(e => /^Pesach II\b/.test(e.title));
  let omerDay = -1;
  if (pesachII) {
    const diff = daysBetween(pesachII.date, today) + 1;
    if (diff >= 1 && diff <= 49) omerDay = diff;
  }
  if (omerDay === -1) {
    // Fallback when Pesach is outside the fetched window: use Hebcal's own Omer event for today.
    const todaysOmer = events.find(e => e.category === "omer" && daysBetween(e.date, today) === 0);
    if (todaysOmer) {
      const m = /(\d+)/.exec(todaysOmer.title);
      if (m) omerDay = parseInt(m[1], 10);
    }
  }

  const hd = hebrewDateInfo || {};
  const hebrewMonth = hd.hm || "";
  const hebrewToday = hd.hebrew || "";

  return {
    today,
    events,
    findEvent,
    isToday: (d) => d && daysBetween(today, d) === 0,
    daysUntil: (d) => (d ? daysBetween(today, d) : null),
    dow: today.getDay(),
    hebrewMonth,
    hebrewToday,
    hebrewDateLabel: hd.hd && hd.hm && hd.hy ? `${hd.hd} ${hd.hm} ${hd.hy}` : hebrewToday,
    // Chanukah: Hebcal names each day by the candles lit that evening.
    chanukahCandlesTonight: (() => {
      const e = events.find(ev => /^Chanukah: \d+ Candles?$/.test(ev.title) && daysBetween(ev.date, today) === 0);
      return e ? Number(/(\d+)/.exec(e.title)[1]) : 0;
    })(),
    chanukahLastDay: events.some(ev => ev.title === "Chanukah: 8th Day" && daysBetween(ev.date, today) === 0),
    profile: profile || { reason: null, community: null },
    isSephardi,
    selichotStart,
    erevTavshilin,
    daysUntilRoshHashana: rhFirst ? daysBetween(today, rhFirst.date) : 999,
    daysSinceRoshHashana: rhFirst ? daysBetween(rhFirst.date, today) : -999,
    daysUntilYomKippur: ykEvent ? daysBetween(today, ykEvent.date) : 999,
    daysUntilTishaBav: tishaBavEvent ? daysBetween(today, tishaBavEvent.date) : 999,
    daysSince17Tammuz: t17Event ? daysBetween(t17Event.date, today) : -999,
    omerDay
  };
}

function pickOccasions(ctx) {
  const matches = OCCASIONS.filter(o => {
    try { return o.match(ctx); } catch (e) { console.error("match error in", o.id, e); return false; }
  });
  matches.sort((a, b) => b.priority - a.priority);
  // Show top match, plus the generic Elul/Omer/ThreeWeeks "season" card if a specific day-event also fired.
  const top = matches[0];
  const seasonIds = new Set(["elul-general", "aseret-yemei-teshuva", "sefirat-haomer", "three-weeks"]);
  const season = matches.find(m => m.id !== top.id && seasonIds.has(m.id));
  return season ? [top, season] : [top];
}

function fmtDate(d) {
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

/** Turns a fully-built card into a click-to-expand accordion: the first
 *  `visibleCount` top-level children (typically the header plus a short
 *  intro) stay visible, everything after is collapsed into `.card-body`
 *  until the header is clicked (or Enter/Space, for keyboard users). */
function makeCollapsible(card, visibleCount, startOpen) {
  const children = Array.from(card.children);
  const toWrap = children.slice(visibleCount);
  const headRow = card.querySelector(".card-head");
  if (!toWrap.length || !headRow) {
    if (startOpen) card.classList.add("is-open");
    return;
  }

  const body = el("div", "card-body");
  const inner = el("div", "card-body-inner");
  toWrap.forEach(node => inner.appendChild(node));
  body.appendChild(inner);
  card.appendChild(body);

  headRow.classList.add("card-head--toggle");
  headRow.setAttribute("tabindex", "0");
  headRow.setAttribute("role", "button");
  headRow.setAttribute("aria-expanded", startOpen ? "true" : "false");
  headRow.appendChild(el("span", "card-chevron", "▾"));

  function toggle() {
    const open = card.classList.toggle("is-open");
    headRow.setAttribute("aria-expanded", open ? "true" : "false");
  }
  headRow.addEventListener("click", toggle);
  headRow.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
  });

  if (startOpen) card.classList.add("is-open");
}

/** Content fields may be a plain value or a function(ctx) => value, so a handful of
 *  entries (Selichot timing, Elul framing) can adapt to the visitor's profile. */
function resolve(field, ctx) {
  return typeof field === "function" ? field(ctx) : field;
}

/** A small "Sources:" line for the bottom of a card (null when there are none). */
function sourcesEl(sources) {
  if (!sources || !sources.length) return null;
  const p = el("p", "card-sources");
  p.appendChild(el("strong", null, "Sources: "));
  p.appendChild(document.createTextNode(sources.join("; ")));
  return p;
}

/** An occasion's intro, with the Omer day filled in. */
function occasionIntro(occ, ctx) {
  return resolve(occ.content.intro, ctx).replace("{{OMER_DAY}}", ctx.omerDay > 0 ? ctx.omerDay : "");
}

/**
 * The top of the page, under the date: one line saying what today is, a thought
 * for today (the occasion's reflection), and "More about today" — the halacha,
 * customs, blessings and notes, closed until opened. On an ordinary weekday the
 * timeline already covers the practice, so only the line and the thought show.
 */
function renderTodayContext(occasions, ctx) {
  const lineBox = document.getElementById("today-line");
  const moreBox = document.getElementById("today-more");
  lineBox.innerHTML = "";
  moreBox.innerHTML = "";
  const isToday = daysBetween(realToday, ctx.today) === 0; // the real today, not just the viewed day
  const special = occasions.filter(o => o.id !== "generic-weekday");
  const top = occasions[0];

  // 1. What today is
  const line = el("div", "today-line");
  line.appendChild(iconBadge(top.icon, "icon-badge--sm"));
  const omer = (o) => o.id === "sefirat-haomer" && ctx.omerDay > 0 ? ` · day ${ctx.omerDay}` : "";
  const names = special.map(o => o.title + omer(o));
  // A holiday can also be Shabbat or Rosh Chodesh — say so on the same line.
  if (names.length) {
    const rc = ctx.findEvent(e => e.category === "roshchodesh" && ctx.isToday(e.date));
    if (rc && !special.some(o => o.id === "rosh-chodesh")) names.push(rc.title);
    if (ctx.today.getDay() === 6 && !special.some(o => o.id === "shabbat")) names.unshift("Shabbat");
  }
  line.appendChild(el("p", "today-line-text", names.length
    ? names.join(" · ")
    : (isToday ? "An ordinary weekday — where most of Jewish life happens" : "An ordinary weekday")));
  lineBox.appendChild(line);

  // 2. A thought for today
  const used = new Set();
  const thought = resolve(top.content.inspiration, ctx);
  if (thought) {
    // Folded to one line (a preview); tap to read it all.
    const box = el("details", "today-thought");
    const sum = el("summary");
    sum.appendChild(el("span", "today-thought-label", isToday ? "💭 A thought for today" : "💭 A thought for this day"));
    sum.appendChild(el("span", "today-thought-peek", stripHtml(thought)));
    box.appendChild(sum);
    box.appendChild(richEl("p", "today-thought-text", thought, ctx.profile, used));
    moreBox.appendChild(box);
  }

  // 3. More about today (holidays, fasts, seasons…)
  if (special.length) {
    const details = el("details", "today-more");
    details.appendChild(el("summary", null, isToday ? "More about today" : "More about this day"));
    const body = el("div", "today-more-body");
    special.forEach((occ, i) => {
      const part = el("section", "today-more-part");
      if (special.length > 1) part.appendChild(el("h3", "today-more-title", occ.title));
      appendOccasionDetail(part, occ, ctx, used, i > 0 || occ !== top);
      body.appendChild(part);
    });
    details.appendChild(body);
    moreBox.appendChild(details);
  }
}

/** Everything about one occasion except its title: the intro, "why today",
 *  halacha, blessings, customs, the visitor's minhag and notes, sources — and
 *  its reflection when it isn't already shown as the thought for today. */
function appendOccasionDetail(card, occ, ctx, used, withInspiration) {
  const profile = ctx.profile;
  const extras = OCCASION_EXTRAS[occ.id] || {};
  card.appendChild(richEl("p", "intro", occasionIntro(occ, ctx), profile, used));

  const whyBox = renderWhyBox(resolve(extras.why, ctx), profile, used, ctx.hebrewDateLabel);
  if (whyBox) card.appendChild(whyBox);

  const halacha = resolve(occ.content.halacha, ctx);
  if (halacha && halacha.length) {
    card.appendChild(el("h4", "section-label", "Halacha & Practice"));
    const ul = el("ul", "halacha-list");
    halacha.forEach(h => ul.appendChild(richEl("li", null, h, profile, used)));
    card.appendChild(ul);
  }
  renderWords(card, resolve(occ.content.blessings, ctx), resolve(occ.content.texts, ctx), "The blessings");

  const customs = resolve(occ.content.customs, ctx);
  if (customs && customs.length) {
    card.appendChild(el("h4", "section-label", "Customs"));
    const ul = el("ul", "customs-list");
    customs.forEach(c => ul.appendChild(richEl("li", null, c, profile, used)));
    card.appendChild(ul);
  }

  const minhagBox = renderMinhagBox(extras.minhagim, profile);
  if (minhagBox) card.appendChild(minhagBox);

  const beginnerNote = resolve(occ.content.beginnerNote, ctx);
  if (beginnerNote && wantsExplanations(profile)) {
    const box = el("div", "beginner-note");
    box.appendChild(el("span", "beginner-note-label", "New to this? "));
    const span = el("span");
    span.innerHTML = glossify(beginnerNote, profile, used);
    box.appendChild(span);
    card.appendChild(box);
  }

  const takingOnBox = renderTakingOnBox(resolve(extras.takingOn, ctx), profile, used);
  if (takingOnBox) card.appendChild(takingOnBox);

  const convertBox = renderConvertNoteBox(occ.id, profile, used);
  if (convertBox) card.appendChild(convertBox);

  const inspiration = withInspiration && resolve(occ.content.inspiration, ctx);
  if (inspiration) {
    card.appendChild(el("h4", "section-label", "For Reflection"));
    card.appendChild(richEl("p", "inspiration", inspiration, profile, used));
  }

  const occSources = sourcesEl(occ.sources);
  if (occSources) card.appendChild(occSources);
  card.appendChild(reportLink(`occasion:${occ.id}`));
}

/** Multi-day observances that Hebcal lists as one event per day. Each pattern maps
 *  that holiday's daily events onto one group, so the countdown strip shows a
 *  single card ("Chanukah · in 13 days") instead of one card per candle/day. */
const MULTI_DAY_GROUPS = [
  { key: "chanukah", name: "Chanukah", test: e => /^Chanukah\b/.test(e.title) },
  { key: "pesach", name: "Pesach", test: e => /^Pesach [IVX]+\b/.test(e.title) },
  { key: "sukkot", name: "Sukkot", test: e => /^Sukkot [IVX]+\b/.test(e.title) },
  { key: "rosh-hashana", name: "Rosh Hashanah", test: e => /^Rosh Hashana( \d{3,4}| II)$/.test(e.title) },
  { key: "shavuot", name: "Shavuot", test: e => /^Shavuot( I{1,2})?$/.test(e.title) },
  { key: "omer", name: "Counting the Omer", test: e => e.category === "omer" }
];

/** Collapse Hebcal events into one entry per holiday: { name, start, end, days, events }.
 *  Two-day Rosh Chodesh (same title on consecutive days) collapses the same way. */
function groupCountdownEvents(events) {
  const relevant = events
    .filter(e => e.category === "holiday" || e.category === "roshchodesh" || e.category === "omer"
      || (e.category === "community" && !e.quiet && typeof communityDayShown === "function" && communityDayShown(e, currentProfile) === "plain"))
    .filter(e => !/^Erev /.test(e.title) && !/^Mevarchim/.test(e.title))
    .sort((a, b) => a.date - b.date);

  const groups = [];
  const open = new Map(); // group key -> group still accepting consecutive days
  for (const e of relevant) {
    const def = MULTI_DAY_GROUPS.find(g => g.test(e));
    const key = def ? def.key : e.title;
    const name = def ? def.name : e.title;
    const g = open.get(key);
    // Days of one holiday are consecutive; a gap of more than a day starts a new group
    // (e.g. next year's Rosh Chodesh with the same name never merges).
    if (g && daysBetween(g.end, e.date) <= 1) {
      if (daysBetween(g.end, e.date) === 1) g.days++;
      g.end = e.date;
      g.events.push(e);
    } else {
      const ng = { key, name, start: e.date, end: e.date, days: 1, events: [e] };
      groups.push(ng);
      open.set(key, ng);
    }
  }
  return groups;
}

/** The week's portion for `today` plus today's aliyah text (fetching the text also
 *  saves it for offline reading on torah.html). Helpers live in torah.js. */
async function loadTorahPortion(events, today) {
  const p = findParasha(events, today);
  if (!p) return null;
  const text = p.aliyaRef ? await loadAliyahText(p.aliyaRef) : null;
  return Object.assign(p, { text });
}

/** The parsha line in the date card: this week's portion and the viewed day's
 *  aliyah, linking to the reading page. */
function renderTodayParsha(events, date) {
  const box = document.getElementById("today-parsha");
  if (!box) return;
  box.innerHTML = "";
  const p = findParasha(events, date);
  if (!p) return;
  const a = el("a", "today-parsha");
  a.href = torahPageHref(date);
  a.appendChild(iconBadge(bookIconFromRef(p.aliyaRef), "icon-badge--gold"));
  const text = el("span", "today-parsha-text");
  text.appendChild(el("strong", null, `Parshat ${p.parashaName}`));
  const isToday = daysBetween(realToday, date) === 0;
  const day = isToday ? "Today" : DOW_NAMES[date.getDay()];
  const sub = p.carriedOver
    ? "This week's reading is set aside for Yom Tov — keep learning last week's"
    : `${day}: ${trOrdinal(p.aliyaNum)} aliyah${p.aliyaRef ? ` (${trPrettyRef(p.aliyaRef)})` : ""}`;
  text.appendChild(el("span", null, sub));
  a.appendChild(text);
  a.appendChild(el("span", "today-parsha-go", "Read →"));
  a.setAttribute("aria-label", `Read Parshat ${p.parashaName}. ${sub}`);
  box.appendChild(a);
  renderFamilyCorner(box, p.parashaName);
  renderNextStep(box, date);
}

/** "Your next step this week" — for those becoming more observant: one mitzvah
 *  they haven't marked "I do this" yet, the same all week, a new one next week. */
function renderNextStep(box, date) {
  if (toneOf(currentProfile) !== "jewish-growing") return;
  let track = {};
  try { track = JSON.parse(localStorage.getItem("omad_mitzvot_track_v1") || "{}") || {}; } catch (e) { /* ignore */ }
  const women = currentProfile.gender === "female" && !currentProfile.showAll;
  const pool = anytimeMitzvot().filter(m => track[m.id] !== "doing" && !(women && MITZVA_GENDER[m.id] === "male"));
  if (!pool.length) return;
  const week = Math.floor(daysBetween(new Date(2024, 0, 7), date) / 7); // weeks from a Sunday
  const m = pool[((week % pool.length) + pool.length) % pool.length];
  const a = el("a", "next-step");
  a.href = `mitzvot.html#${m.id}`;
  const t = el("span", "fc-head");
  t.appendChild(el("span", "fc-kicker", "🌱 Your next step this week"));
  t.appendChild(el("strong", null, m.title));
  t.appendChild(el("span", "next-step-sub", m.subtitle));
  a.appendChild(t);
  a.appendChild(el("span", "today-parsha-go", "Learn how →"));
  box.appendChild(a);
}

/** Under the parsha: a kids' corner (young children) or questions to talk over
 *  with teens, from the week's parsha content. Folded until opened. */
function renderFamilyCorner(box, parashaName) {
  const c = typeof parshaContent === "function" ? parshaContent(parashaName) : null;
  if (!c) return;
  const young = familyShow("young", currentProfile);
  const teens = familyShow("teens", currentProfile);
  const corner = (cls, kicker, title, kind) => {
    const d = el("details", "family-corner " + cls);
    const s = el("summary");
    const t = el("span", "fc-head");
    t.appendChild(el("span", "fc-kicker", kicker));
    t.appendChild(el("strong", null, title));
    s.appendChild(t);
    d.appendChild(s);
    const body = el("div", "fc-body");
    const tagRow = el("p", "fc-tag");
    tagRow.appendChild(familyTag(kind, currentProfile));
    body.appendChild(tagRow);
    d.appendChild(body);
    box.appendChild(d);
    return body;
  };
  if (young && c.kids) {
    const k = c.kids;
    const body = corner("family-corner--kids", "🎈 For the kids this week", k.title, "young");
    body.appendChild(el("p", "fc-story", k.story));
    if (k.word) {
      const w = el("p", "fc-word");
      w.appendChild(el("span", "fc-emoji", k.word.emoji || "✨"));
      const wt = el("span");
      wt.appendChild(el("b", null, `Word of the week: ${k.word.word}`));
      wt.appendChild(document.createTextNode(` — ${k.word.meaning}`));
      w.appendChild(wt);
      body.appendChild(w);
    }
    if (k.questions && k.questions.length) {
      body.appendChild(el("p", "fc-label", "Ask them"));
      const ul = el("ul", "fc-list");
      k.questions.forEach(q => ul.appendChild(el("li", null, q)));
      body.appendChild(ul);
    }
    if (k.draw) body.appendChild(el("p", "fc-draw", `🖍️ ${k.draw}`));
  }
  if (teens && c.questions && c.questions.length) {
    const body = corner("family-corner--teens", "💬 Talk about it with your teens", `Parshat ${parashaName}`, "teens");
    if (c.summary) body.appendChild(el("p", "fc-story", c.summary));
    body.appendChild(el("p", "fc-label", "Questions for the table"));
    const ul = el("ul", "fc-list");
    c.questions.forEach(q => ul.appendChild(el("li", null, q)));
    body.appendChild(ul);
  }
}

/** A get-ready guide. `inSheet`: shown open in the slide-up panel (daystrip.js). */
function renderPrepCard(container, upcoming, isBrowsingAhead, inSheet) {
  if (!upcoming) return;
  const { guide, daysUntil, offlineDays, date } = upcoming;
  if (guide.kind === "day") return renderDayPrepCard(container, upcoming, isBrowsingAhead, inSheet);
  const card = el("article", "occasion-card prep-card");

  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge(guide.icon, "icon-badge--gold"));
  const titleWrap = el("div");
  titleWrap.appendChild(el("h3", null, `Getting Ready for ${guide.name}`));
  const dayWord = daysUntil === 0 ? "today" : daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;
  const asOf = isBrowsingAhead ? " (as of the day you're viewing)" : "";
  titleWrap.appendChild(el("p", "torah-meta", `Starts ${dayWord}${asOf} · about ${offlineDays} day${offlineDays === 1 ? "" : "s"} offline once it begins`));
  headRow.appendChild(titleWrap);
  card.appendChild(headRow);

  card.appendChild(el("p", "intro", `Since you won't be checking this page once ${guide.name} begins, here's what's worth handling now.`));

  const profile = currentProfile;
  const extras = PREP_EXTRAS[guide.key] || {};
  const used = new Set();

  card.appendChild(el("h4", "section-label", "Shopping List"));
  const shopUl = el("ul", "halacha-list");
  guide.shopping.forEach(s => shopUl.appendChild(richEl("li", null, s, profile, used)));
  card.appendChild(shopUl);

  card.appendChild(el("h4", "section-label", "Before It Begins"));
  const prepUl = el("ul", "halacha-list");
  guide.prep.forEach(p => prepUl.appendChild(richEl("li", null, p, profile, used)));
  card.appendChild(prepUl);

  const minhagBox = renderMinhagBox(extras.minhagim, profile);
  if (minhagBox) card.appendChild(minhagBox);
  const takingOnBox = renderTakingOnBox(extras.takingOn, profile, used);
  if (takingOnBox) card.appendChild(takingOnBox);

  card.appendChild(el("h4", "section-label", "What to Expect"));
  card.appendChild(richEl("p", "intro", guide.expectNote, profile, used));
  card.appendChild(reportLink(`prep:${guide.key}`));

  if (!inSheet) makeCollapsible(card, 1, false);
  container.appendChild(card);
}

/** "Get ready" card for a holiday, fast or special day that isn't Yom Tov:
 *  its story, meaning, how to prepare yourself, and a practical checklist. */
function renderDayPrepCard(container, upcoming, isBrowsingAhead, inSheet) {
  const { guide, daysUntil, date } = upcoming;
  const card = el("article", "occasion-card prep-card");
  const profile = currentProfile;
  const extras = PREP_EXTRAS[guide.key] || {};
  const used = new Set();
  const fmt = (d) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge(guide.icon, "icon-badge--gold"));
  const titleWrap = el("div");
  titleWrap.appendChild(el("h3", null, daysUntil === 0 ? `Today: ${guide.name}` : `Let's get ready: ${guide.name}`));
  const asOf = isBrowsingAhead ? " (from the day you're viewing)" : "";
  const whenLine = guide.when ? guide.when(date, fmt) : fmt(date);
  titleWrap.appendChild(el("p", "torah-meta", `${inDays(daysUntil).replace(/^in /, "In ").replace(/^today$/, "Today").replace(/^tomorrow$/, "Tomorrow")}${asOf} · ${whenLine}`));
  headRow.appendChild(titleWrap);
  card.appendChild(headRow);

  card.appendChild(richEl("p", "intro", guide.meaning, profile, used));

  const list = (label, items, cls) => {
    if (!items || !items.length) return;
    card.appendChild(el("h4", "section-label", label));
    const ul = el("ul", cls || "halacha-list");
    items.forEach(s => ul.appendChild(richEl("li", null, s, profile, used)));
    card.appendChild(ul);
  };

  if (guide.history && guide.history.length) {
    card.appendChild(el("h4", "section-label", "The Story"));
    guide.history.forEach(p => card.appendChild(richEl("p", "prep-history", p, profile, used)));
  }
  list("Getting Ready", guide.prep);
  list("Shopping List", guide.shopping);
  list("Preparing Yourself", guide.practices);
  renderWords(card, guide.blessings, guide.texts, "The blessings to learn");

  const minhagBox = renderMinhagBox(extras.minhagim, profile);
  if (minhagBox) card.appendChild(minhagBox);
  const takingOnBox = renderTakingOnBox(extras.takingOn, profile, used);
  if (takingOnBox) card.appendChild(takingOnBox);

  if (guide.expectNote) {
    card.appendChild(el("h4", "section-label", "What to Expect"));
    card.appendChild(richEl("p", "intro", guide.expectNote, profile, used));
  }
  const src = sourcesEl(guide.sources);
  if (src) card.appendChild(src);
  card.appendChild(reportLink(`prep:${guide.key}`));

  if (!inSheet) makeCollapsible(card, 1, false);
  container.appendChild(card);
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function appendMitzvahDetail(container, m) {
  const profile = currentProfile;
  const extras = MITZVA_EXTRAS[m.id] || {};
  const used = new Set();
  container.appendChild(richEl("p", "intro", m.intro, profile, used));
  container.appendChild(el("h4", "section-label", "How It's Done"));
  const ul = el("ul", "halacha-list");
  m.steps.forEach(s => ul.appendChild(richEl("li", null, s, profile, used)));
  container.appendChild(ul);
  renderWords(container, m.blessings, resolveMitzvahTexts(m.texts), "The words");
  const minhagBox = renderMinhagBox(extras.minhagim, profile);
  if (minhagBox) container.appendChild(minhagBox);
  const toneNote = toneMitzvahNote(m, profile);
  if (toneNote) container.appendChild(toneNote);
  const takingOnBox = renderTakingOnBox(extras.takingOn, profile, used);
  if (takingOnBox) container.appendChild(takingOnBox);
  container.appendChild(el("h4", "section-label", "For Reflection"));
  container.appendChild(richEl("p", "inspiration", m.inspiration, profile, used));
  const mSources = sourcesEl(m.sources);
  if (mSources) container.appendChild(mSources);
  container.appendChild(reportLink(`mitzvah:${m.id}`));
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** Re-shuffles a question's answer order and recomputes correctIndex to match,
 *  so the correct answer isn't always in the same slot. */
function shuffleQuestionOptions(q) {
  const correctText = q.options[q.correctIndex];
  const options = shuffled(q.options);
  return { ...q, options, correctIndex: options.indexOf(correctText) };
}

function buildTodaysQuiz(occasions, portion, mitzvah) {
  const pool = [];
  occasions.forEach(o => {
    if (QUIZ_BANK[o.id]) pool.push({ ...QUIZ_BANK[o.id], topic: o.title });
  });
  const torahQ = buildTorahQuizQuestion(portion);
  if (torahQ) pool.push({ ...torahQ, topic: "This Week's Torah Portion" });
  const mitzvahQ = buildMitzvahQuizQuestion(mitzvah, anytimeMitzvot());
  if (mitzvahQ) pool.push({ ...mitzvahQ, topic: "Today's Mitzvah" });

  return shuffled(pool).slice(0, 4).map(shuffleQuestionOptions);
}

/** The quiz. `inline`: inside the timeline's "Test yourself" item (no card header). */
function renderQuizCard(container, occasions, portion, mitzvah, inline) {
  if (!container) return;
  container.innerHTML = "";
  const questions = buildTodaysQuiz(occasions, portion, mitzvah);
  if (!questions.length) { if (inline) container.appendChild(el("p", "intro", "No questions for today yet — come back tomorrow.")); return; }

  const card = el("article", "occasion-card quiz-card" + (inline ? " quiz-card--inline" : ""));

  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge("trophy", "icon-badge--gold"));
  const titleWrap = el("div");
  titleWrap.appendChild(el("h3", null, "Test Yourself"));
  titleWrap.appendChild(el("p", "torah-meta", `${questions.length} quick question${questions.length === 1 ? "" : "s"} on what's above`));
  headRow.appendChild(titleWrap);
  card.appendChild(headRow);

  card.appendChild(el("p", "intro", "See what stuck — no pressure, just for fun."));

  let answered = 0;
  let score = 0;

  const resultBanner = el("div", "quiz-result");
  resultBanner.hidden = true;

  function showResult() {
    const pct = score / questions.length;
    let message;
    if (pct === 1) message = "Perfect score! You clearly know your stuff today.";
    else if (pct >= 0.75) message = "Great job — you've nearly got today locked in.";
    else if (pct >= 0.5) message = "Solid! A couple worth a second look.";
    else message = "A good first pass — scroll back up and try again anytime.";

    resultBanner.innerHTML = "";
    resultBanner.appendChild(el("span", "quiz-score", `${score} / ${questions.length}`));
    resultBanner.appendChild(el("span", null, message));
    const retryBtn = el("button", "quiz-retry", "Shuffle & Try Again");
    retryBtn.type = "button";
    retryBtn.addEventListener("click", () => renderQuizCard(container, occasions, portion, mitzvah, inline));
    resultBanner.appendChild(retryBtn);
    resultBanner.hidden = false;
  }

  const listEl = el("div", "quiz-list");
  questions.forEach((q, qi) => {
    const qBlock = el("div", "quiz-question");
    if (q.topic) qBlock.appendChild(el("span", "quiz-topic", q.topic));
    qBlock.appendChild(el("p", "quiz-question-text", q.question));

    const optionsEl = el("div", "quiz-options");
    q.options.forEach((opt, oi) => {
      const btn = el("button", "quiz-option", opt);
      btn.type = "button";
      btn.addEventListener("click", () => {
        if (qBlock.classList.contains("answered")) return;
        qBlock.classList.add("answered");
        answered++;
        const correct = oi === q.correctIndex;
        if (correct) score++;
        btn.classList.add(correct ? "quiz-option--correct" : "quiz-option--wrong");
        if (!correct) {
          optionsEl.children[q.correctIndex].classList.add("quiz-option--correct");
        }
        Array.from(optionsEl.children).forEach(b => b.disabled = true);
        if (answered === questions.length) showResult();
      });
      optionsEl.appendChild(btn);
    });

    qBlock.appendChild(optionsEl);
    listEl.appendChild(qBlock);
  });
  card.appendChild(listEl);
  card.appendChild(resultBanner);

  if (inline) card.querySelector(".card-head").remove();
  else makeCollapsible(card, 2, false);
  container.appendChild(card);
}

/** Fill in the Today summary's Torah row: the parsha and today's aliyah. */
function updateTorahSummary(portion) {
  const value = document.getElementById("tl-torah-why");
  if (!value || !portion) return;
  value.textContent = portion.aliyaRef
    ? `${portion.parashaName} · today's part: the ${ordinal(portion.aliyaNum)} aliyah (${portion.aliyaRef.replace(/(\d+):(\d+)-\1:/, "$1:$2–").replace(/-/g, "–")})`
    : `${portion.parashaName} — a few minutes with this week's portion.`;
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Settings live in the menu bar (nav.js); a change there refreshes the Today page. */
function openSettings() {
  openNavSettings();
}
window.onSettingsChanged = () => refreshAll();

/** Re-read settings and re-fetch everything that depends on location, the
 *  Israel setting, or the profile. */
async function refreshAll() {
  currentSettings = getSettings();
  currentProfile = getProfile();
  updateNavSettings();
  browseEvents = null;
  try {
    realTodayEvents = await loadCalendarWindow(realToday);
    scheduleReminders(realTodayEvents);
    renderInstallHint();
  } catch (e) {
    console.error(e);
  }
  await setViewingDate(viewingDate);
}

// --- "What to do today" card -------------------------------------------

function renderGuideItem(item, used) {
  const wrap = el("div", "dg-item");
  wrap.appendChild(el("p", "dg-title", item.title));
  if (item.when) wrap.appendChild(el("p", "dg-when", item.when));
  if (item.steps && item.steps.length) {
    const ol = el("ol", "dg-steps");
    item.steps.forEach(s => ol.appendChild(richEl("li", null, s, currentProfile, used)));
    wrap.appendChild(ol);
  }
  const group = renderBlessingGroup(item.blessings);
  if (group) wrap.appendChild(group);
  (item.texts || []).forEach(ref => {
    const t = renderPrayerText(ref, false);
    if (t) wrap.appendChild(t);
  });
  prayerCustomsFor(item, currentProfile && currentProfile.community).forEach(c => {
    const p = el("p", "pc-custom");
    p.appendChild(el("strong", null, `${c.label}: `));
    p.appendChild(document.createTextNode(c.text));
    wrap.appendChild(p);
  });
  return wrap;
}

// --- Prayer changes card ---------------------------------------------

function renderPrayerChangeItem(item, used, textCtx) {
  const li = el("li", "pc-item");
  li.appendChild(el("p", "pc-title", item.title));
  li.appendChild(richEl("p", "pc-detail", item.detail, currentProfile, used));
  if (item.where && item.where !== "—") li.appendChild(el("p", "pc-where", `Where: ${item.where}`));
  if (textCtx) {
    prayerChangeTexts(item.id, textCtx).forEach(ref => {
      const t = renderPrayerText(ref, true);
      if (t) li.appendChild(t);
    });
  }
  prayerCustomsFor(item, currentProfile && currentProfile.community).forEach(c => {
    const p = el("p", "pc-custom");
    p.appendChild(el("strong", null, `${c.label}: `));
    p.appendChild(document.createTextNode(c.text));
    li.appendChild(p);
  });
  return li;
}

// --- Times card ------------------------------------------------------

function fmtClock(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function timedEventLabel(e) {
  if (e.category === "candles") return e.memo && /Parashat|Shabbat/.test(e.memo) ? "Shabbat candle lighting" : "Candle lighting";
  if (e.category === "havdalah") return e.date.getDay() === 6 ? "Shabbat ends · Havdalah" : "Holiday ends · Havdalah";
  if (/^Fast begins/.test(e.title)) return `Fast begins${e.memo ? " · " + e.memo : ""}`;
  if (/^Fast ends/.test(e.title)) return `Fast ends${e.memo ? " · " + e.memo : ""}`;
  return e.title;
}

function timedEventsOn(events, date) {
  return events
    .filter(e => e.time && daysBetween(e.date, date) === 0)
    .filter(e => e.category === "candles" || e.category === "havdalah" || /^Fast (begins|ends)/.test(e.title))
    .sort((a, b) => a.time.localeCompare(b.time));
}

// --- Prep helpers ----------------------------------------------------

/** The next prep guide after `date`: either open now ({ ready: true }) or the
 *  number of days until its checklist opens. Uses this year's Hebcal dates. */
function nextPrepInfo(events, date) {
  const open = findUpcomingPrepGuide(events, date);
  if (open) return { ready: true, name: open.guide.name, daysUntil: open.daysUntil };
  let best = null;
  for (const guide of PREP_GUIDES) {
    const evt = events.find(e => guide.matchTitle(e.title) && daysBetween(date, e.date) > 0);
    if (!evt) continue;
    const daysUntil = daysBetween(date, evt.date);
    if (!best || daysUntil < best.daysUntil) best = { ready: false, name: guide.name, daysUntil, opensIn: daysUntil - guide.leadDays };
  }
  return best;
}

function inDays(n) {
  return n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
}

// --- Today summary ---------------------------------------------------

/** Opens the first collapsible card inside `containerId` and scrolls to it. */
function goToSection(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const card = container.querySelector("article");
  const head = card && card.querySelector(".card-head--toggle");
  if (card && head && !card.classList.contains("is-open")) head.click();
  container.scrollIntoView({ behavior: "smooth", block: "start" });
}

const PRINTER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M7 9V3h10v6M7 17H4v-7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7h-3M7 14h10v7H7z"/></svg>';

// --- The day's data for the timeline --------------------------------------

/** The visitor's community, when they've told us they're Jewish (else null). */
function profileCommunity() {
  return (currentProfile && currentProfile.community) || null;
}

const zmanimCache = new Map();
/** Zmanim for the saved city on `date` (null without a city or on failure);
 *  shared by the timeline and the zmanim card so it's fetched once. */
function getZmanimCached(date) {
  const loc = currentSettings.location;
  if (!loc) return Promise.resolve(null);
  const key = `${toISO(date)}|${JSON.stringify(loc)}`;
  if (!zmanimCache.has(key)) {
    zmanimCache.set(key, fetchZmanim(loc, toISO(date)).catch(e => {
      console.warn("zmanim fetch failed", e);
      zmanimCache.delete(key);
      return null;
    }));
  }
  return zmanimCache.get(key);
}

/** What changes in prayer this day, plus what the prayer-text boxes need. */
function computePrayerChanges(date, heb, hebTomorrow, events) {
  if (!heb || !heb.hm) return { changes: null, textCtx: null };
  const changes = getPrayerChanges({
    date, heb, hebTomorrow, israel: isInIsrael(currentSettings), events, community: profileCommunity(),
    nusach: currentProfile && currentProfile.nusach
  });
  const textCtx = {
    info: pcDayInfo(events, date),
    next: pcDayInfo(events, addDays(date, 1)),
    community: pcCommunityKey(profileCommunity())
  };
  return { changes, textCtx };
}

function computeDailyGuide(date, heb, events) {
  if (!heb || !heb.hm) return null;
  return getDailyGuide({
    date, heb, israel: isInIsrael(currentSettings), events, community: profileCommunity(), fmt: fmtClock
  });
}

/** Icons for the "What's different today" box, by prayer-change or guide id. */
const DAY_NOTE_ICONS = {
  "hallel-full": "🎶", "hallel-half": "🎶", "hallel-modern": "🎶", "no-hallel": "🔇",
  "yaaleh-vyavo": "🌙", "yaaleh-tonight": "🌙", musaf: "📜", "al-hanissim": "✨", "al-hanissim-tonight": "✨",
  megillah: "📜", aneinu: "🙏", "fast-torah": "📖", "tisha-bav": "💔", eichah: "💔",
  "no-tachanun": "🌤️", "no-tachanun-mincha": "🌤️", "tachanun-modern": "🌤️", "tachanun-community": "🌤️",
  "omer-today": "🌾", "omer-tonight": "🌾", "atah-chonantanu": "🕯️", selichot: "🙏", "selichot-first": "🙏",
  "avinu-malkeinu": "🙏", "avinu-malkeinu-erev-yk": "🙏", "aseret-changes": "📖",
  "tal-umatar-start": "🌧️", "tal-umatar-end": "☀️", geshem: "🌧️", tal: "💧",
  candles: "🕯️", "chanukah-lights": "🕎", "chanukah-day": "🕎", "eruv-tavshilin": "🍲", havdalah: "🍷",
  "kabbalat-shabbat": "🌅", shofar: "📯", lulav: "🌿", "no-lulav": "🌿", tashlich: "🌊", yizkor: "🕯️"
};

/** "What's different today": the special things to know at a glance — prayer
 *  changes, no tefillin, candles, Eruv Tavshilin, a fast, a Yom Tov — or that it's a
 *  regular day. Each one jumps to its place in the timeline. */
function renderDayNotes(date, info, changes, guide, events) {
  const box = document.getElementById("day-notes");
  if (!box) return;
  box.innerHTML = "";
  const notes = [];
  const add = (icon, text, target) => notes.push({ icon, text, target });
  const dow = date.getDay();
  const noTefillin = info.yomTov || dow === 6 || (info.cholHamoed && tlNoTefillinOnCholHamoed(currentProfile, isInIsrael(currentSettings)));
  if (noTefillin && genderShow("male", currentProfile)) add("🚫", "No tefillin today", "no-tefillin");
  // Rosh Chodesh is a special day for women: many have the custom of lighter work.
  if (info.roshChodesh && genderShow("female", currentProfile)) {
    notes.push({ icon: "🌙", text: "A special day for women", why: "Many women have the custom of doing less work today (like sewing or laundry) — a gift given to the women of the desert, who wouldn't give their jewelry for the golden calf.", gender: genderView(currentProfile) === "female" ? null : "For women" });
  }
  // Days your community keeps (community-days.js), each with its story.
  const todaysEvents = (events || []).filter(e => daysBetween(e.date, date) === 0);
  const nusach = currentProfile && currentProfile.nusach;
  if (typeof communityDayShown === "function") {
    // Yours first, then other communities' days (labeled with whose they are).
    const mine = (e) => communityDayShown(e, currentProfile) === "plain" ? 0 : 1;
    todaysEvents.filter(e => communityDayShown(e, currentProfile)).sort((a, b) => mine(a) - mine(b)).forEach(e => {
      notes.push({ icon: /Yahrzeit|Hillula|Gimmel Tammuz|Yud Shevat|Chof Av/.test(e.title) ? "🕯️" : /seder|Mimouna/i.test(e.title) ? "🍯" : /Kippur Katan|BeHaB/.test(e.title) ? "🙏" : "✨",
        text: e.title, why: e.blurb, community: { text: communityDayLabel(e), for: e.for } });
    });
    // Shabbat Mevarchim: Chabad and many Chassidim say all of Tehillim before Shacharit.
    const mev = todaysEvents.find(e => e.category === "mevarchim");
    const tehillim = ["chabad", "sefard"];
    const sideBySide = nusach === "unsure" || nusach === "other" || (currentProfile && currentProfile.showAll);
    if (mev && (tehillim.includes(nusach) || sideBySide)) {
      notes.push({ icon: "📜", text: "Tehillim before Shacharit", why: `Today is Shabbat Mevarchim — the new month is blessed after the Torah reading (${mev.title.replace(/^Mevarchim Chodesh /, "Rosh Chodesh ")}). Chabad and many Chassidic communities say the whole book of Tehillim before Shacharit, often together in shul.`, community: { text: "Chabad & Chassidic", for: tehillim } });
    }
  }
  const guideAll = guide ? [...guide.today, ...guide.tonight] : [];
  if (info.fast && !guideAll.some(g => /fast/i.test(g.title))) {
    const begins = (events || []).find(e => e.at && /^Fast begins/.test(e.title) && daysBetween(e.date, date) === 0);
    const ends = (events || []).find(e => e.at && /^Fast ends/.test(e.title) && daysBetween(e.date, date) === 0);
    add("⏳", `Fast day${begins ? ` from ${fmtClock(begins.time)}` : ""}${ends ? ` · ends ${fmtClock(ends.time)}` : ""}`, ends ? "fast-ends" : null);
  }
  (changes ? changes.today : []).forEach(c => add(DAY_NOTE_ICONS[c.id] || "📖", c.title, "shacharit"));
  (changes ? changes.tonight : []).forEach(c => add(DAY_NOTE_ICONS[c.id] || "🌙", /tonight/i.test(c.title) ? c.title : `Tonight: ${c.title}`, "maariv"));
  // Weekly practices — routine, but not obvious to someone still learning, so they're
  // shown too, marked with how often they happen.
  const weekly = [];
  guideAll.forEach(g => {
    if (g.id === "weekday-torah") {
      weekly.push({ icon: "📖", text: "Torah reading at Shacharit", tag: "every Monday & Thursday", target: "guide-weekday-torah" });
      return;
    }
    if (notes.some(n => n.target === "guide-" + g.id)) return;
    const title = g.title.split(" — ")[0];
    const icon = DAY_NOTE_ICONS[g.id] || (/fast/i.test(title) ? "⏳" : /Chanukah|menorah/i.test(title) ? "🕎" : /dinner|Kiddush|meal/i.test(title) ? "🍷" : /Shabbat|Yom Tov|candle/i.test(title) ? "🕯️" : "⭐");
    add(icon, `${title}${g.when ? ` · ${g.when}` : ""}`, "guide-" + g.id);
  });
  const tachanunListed = (changes ? changes.today : []).some(c => /tachanun/.test(c.id));
  if (!tachanunListed) {
    if (dow === 5) weekly.push({ icon: "🌤️", text: "No Tachanun at Mincha", tag: "every Friday, before Shabbat", target: "mincha" });
    else if (dow === 6) weekly.push({ icon: "🌤️", text: "No Tachanun", tag: "never said on Shabbat", target: "shacharit" });
    else if (info.yomTov) weekly.push({ icon: "🌤️", text: "No Tachanun", tag: "never said on Yom Tov", target: "shacharit" });
  }

  const isToday = daysBetween(realToday, date) === 0;
  const chipFor = (n, cls) => {
    // A chip with an explanation (and no timeline item) opens it in place.
    const chip = el(n.target || n.why ? "button" : "span", "day-note" + (cls ? " " + cls : "") + (n.why ? " day-note--why" : ""));
    if (n.target || n.why) chip.type = "button";
    chip.appendChild(el("span", "day-note-icon", n.icon));
    const text = el("span", null, n.text);
    if (n.tag) { text.appendChild(document.createTextNode(" ")); text.appendChild(el("span", "day-note-tag", n.tag)); }
    chip.appendChild(text);
    if (n.target) chip.addEventListener("click", () => jumpToTimelineItem(n.target));
    if (!n.why) return chip;
    const wrap = el("span", "day-note-wrap");
    wrap.appendChild(chip);
    if (n.gender) wrap.appendChild(genderTag(n.gender, currentProfile));
    if (n.community) wrap.appendChild(communityTag(n.community.text, n.community.for, currentProfile));
    const why = el("span", "day-note-why", n.why);
    why.hidden = true;
    chip.setAttribute("aria-expanded", "false");
    chip.addEventListener("click", () => { why.hidden = !why.hidden; chip.setAttribute("aria-expanded", String(!why.hidden)); });
    wrap.appendChild(why);
    return wrap;
  };
  const card = el("div", "day-notes" + (notes.length ? "" : " day-notes--plain"));
  if (!notes.length) {
    const line = el("div", "day-notes-line");
    line.appendChild(el("span", "day-notes-icon", "✅"));
    line.appendChild(el("span", "day-notes-plain", isToday
      ? "A regular weekday — no changes to the prayers today."
      : "A regular weekday — no changes to the prayers."));
    card.appendChild(line);
  } else {
    card.appendChild(el("p", "day-notes-title", isToday ? "What's different today" : "What's different this day"));
    const list = el("div", "day-notes-list");
    notes.forEach(n => list.appendChild(chipFor(n)));
    card.appendChild(list);
  }
  if (weekly.length) {
    card.appendChild(el("p", "day-notes-title day-notes-title--weekly", notes.length ? "Also, as every week" : "As every week"));
    const list = el("div", "day-notes-list");
    weekly.forEach(n => list.appendChild(chipFor(n, "day-note--weekly")));
    card.appendChild(list);
  }
  box.appendChild(card);
}

/** Scroll to an item in the timeline, opening its part of the day if it's folded. */
function jumpToTimelineItem(id) {
  const li = document.getElementById("tl-" + id);
  if (!li) return;
  const sec = li.closest(".tl-part");
  if (sec && sec.classList.contains("is-folded")) sec.querySelector(".tl-part-toggle").click();
  const target = document.getElementById("tl-" + id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("is-flash");
    setTimeout(() => target.classList.remove("is-flash"), 1600);
  }
}

/** Under the timeline: what's coming up next, and the printable Shabbat sheet. */
function renderDayFooter(container, date, events) {
  // The printable Shabbat / Yom Tov sheet is now next to the day strip's arrows (daystrip.js).
}

// --- Browsing state -------------------------------------------------
// `realToday` never changes once the page loads; reminders are based on it.
// The Coming up date cards and get-ready guide follow `viewingDate`,
// which is whatever date the visitor has navigated to.
let realToday = null;
let realTodayEvents = null;
let viewingDate = null;
let browseEvents = null;
let browseWindowStart = null;
let browseWindowEnd = null;
let currentProfile = null;
let currentSettings = getSettings();
const hebrewDateCache = new Map();

async function ensureEventsCover(date) {
  if (browseEvents && date >= browseWindowStart && addDays(date, 30) <= browseWindowEnd) {
    return browseEvents;
  }
  const events = await loadCalendarWindow(date);
  browseEvents = events;
  browseWindowStart = addDays(date, -25);
  browseWindowEnd = addDays(date, 40);
  return events;
}

async function getHebrewDateCached(date) {
  const key = toISO(date);
  if (hebrewDateCache.has(key)) return hebrewDateCache.get(key);
  const info = await loadHebrewDate(date).catch(() => null);
  hebrewDateCache.set(key, info);
  return info;
}

/** The small label above the date: "Today is", or "Looking ahead to / back at" with a
 *  way back when browsing another day. */
function renderViewingBanner(date) {
  const label = document.getElementById("ts-label");
  const existing = document.getElementById("viewing-banner");
  if (existing) existing.remove();
  const diff = daysBetween(realToday, date);
  if (label) label.textContent = diff === 0 ? "Today is" : diff > 0 ? "Looking ahead to" : "Looking back at";
  if (diff === 0) return;
  const backBtn = el("button", "viewing-banner-back", "Back to today");
  backBtn.id = "viewing-banner";
  backBtn.type = "button";
  backBtn.addEventListener("click", () => setViewingDate(realToday));
  document.querySelector(".ts-date").appendChild(backBtn);
}

/** "17 Kislev 5787" from Hebcal's converter (hd, hm, hy). */
function hebDateEnglish(info, withYear = true) {
  if (!info || !info.hd || !info.hm) return "";
  return `${info.hd} ${info.hm}${withYear && info.hy ? " " + info.hy : ""}`;
}

/** Under the Hebrew date: the Jewish day begins at sunset, so say when it changes. */
function renderHebrewDateChange(hebTomorrow, times) {
  const box = document.getElementById("hebrew-date-change");
  if (!box) return;
  const next = hebDateEnglish(hebTomorrow, false);
  if (!next) { box.textContent = ""; return; }
  const sunset = times && times.sunset;
  const at = sunset ? ` (${tlCityFormatter(times)(new Date(sunset))})` : "";
  box.textContent = `🌇 Until sunset${at} · then ${next}`;
}

async function setViewingDate(date) {
  date = startOfDay(date);
  viewingDate = date;
  dsFollow(date); // the day strip (daystrip.js)

  const [events, hebrewInfo] = await Promise.all([
    ensureEventsCover(date),
    getHebrewDateCached(date)
  ]);

  document.getElementById("hebrew-date").textContent = hebrewInfo ? hebrewInfo.hebrew || "" : "";
  document.getElementById("hebrew-date-en").textContent = hebDateEnglish(hebrewInfo);
  document.getElementById("hebrew-date-change").textContent = "";
  document.getElementById("gregorian-date").textContent = fmtDate(date);
  renderViewingBanner(date);
  const [hebTomorrow, times] = await Promise.all([
    getHebrewDateCached(addDays(date, 1)),
    getZmanimCached(date)
  ]);
  if (!pcSameDay(viewingDate, date)) return; // the visitor moved to another day meanwhile
  renderHebrewDateChange(hebTomorrow, times);
  const { changes, textCtx } = computePrayerChanges(date, hebrewInfo, hebTomorrow, events);

  const ctx = buildContext(date, events, hebrewInfo, currentProfile);
  const occasions = pickOccasions(ctx);

  renderTodayContext(occasions, ctx);
  renderTodayParsha(events, date);

  const todaysMitzvah = getMitzvahForDate(date, currentProfile);
  const guide = computeDailyGuide(date, hebrewInfo, events);
  const timelineContainer = document.getElementById("timeline-container");
  renderTimeline({
    container: timelineContainer,
    nowContainer: document.getElementById("now-container"),
    date, isToday: daysBetween(realToday, date) === 0, times, events,
    guide, changes: changes || { today: [], tonight: [], season: [] }, textCtx, mitzvah: todaysMitzvah,
    community: pcCommunityKey(profileCommunity()), info: pcDayInfo(events, date),
    hebDay: hebDateEnglish(hebrewInfo, false), hebNight: hebDateEnglish(hebTomorrow, false)
  });
  renderDayFooter(timelineContainer, date, events);
  renderDayNotes(date, pcDayInfo(events, date), changes, guide, events);

  // The week's portion (the reading itself is on torah.html).
  const portion = findParasha(events, date);
  updateTorahSummary(portion);

  // The quiz lives in the timeline's Midday part ("Test yourself").
  renderQuizCard(document.getElementById("tl-quiz-box"), occasions, portion, todaysMitzvah, true);
}

/** Mitzvah texts can depend on the visitor's community (e.g. the tefillin blessings). */
function resolveMitzvahTexts(texts) {
  const community = pcCommunityKey(profileCommunity());
  return (texts || []).map(ref => ({ key: ref.key, opts: Object.assign({ community }, ref.opts || {}) }));
}

async function init() {
  applyTransliterationPref();
  initHebrewVoice();
  realToday = startOfDay(new Date());
  viewingDate = realToday;
  document.getElementById("gregorian-date").textContent = fmtDate(realToday);

  try {
    const [events, hebrewDateInfo] = await Promise.all([
      loadCalendarWindow(realToday),
      loadHebrewDate(realToday).catch(() => null)
    ]);
    realTodayEvents = events;
    browseEvents = events;
    browseWindowStart = addDays(realToday, -25);
    browseWindowEnd = addDays(realToday, 40);
    hebrewDateCache.set(toISO(realToday), hebrewDateInfo);

    currentProfile = getProfile();
    updateNavSettings();
    await setViewingDate(realToday);

    if (!currentProfile) {
      openOnboarding((newProfile) => {
        currentProfile = newProfile;
        updateNavSettings();
        setViewingDate(viewingDate);
      });
    }


    // A link ending in #print opens the printable Shabbat / Yom Tov sheet directly.
    if (location.hash === "#print") openPrintPreview(realToday);

    initOffline(realTodayEvents);

  } catch (err) {
    console.error(err);
    document.getElementById("today-line").innerHTML =
      '<p class="error">Something went wrong loading today\'s calendar data. Please check your connection and refresh.</p>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init();
});
