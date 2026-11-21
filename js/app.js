/**
 * app.js — fetches live Jewish-calendar data from the Hebcal API, builds a
 * context object, matches it against OCCASIONS (content.js), and renders
 * the page. Also fetches today's daily Torah portion (one of the week's
 * seven aliyot, matched to the day of the week per the Chabad "Chitas"
 * custom) from Hebcal (for the verse range) and Sefaria (for the text).
 */

const HEBCAL_BASE = "https://www.hebcal.com/hebcal";
const CONVERTER_BASE = "https://www.hebcal.com/converter";
const SEFARIA_BASE = "https://www.sefaria.org/api/texts";

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

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url} (${res.status})`);
  return res.json();
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
  return (data.items || []).map(e => ({
    ...e,
    time: e.date.length > 10 ? e.date.slice(11, 16) : null,
    at: e.date.length > 10 ? new Date(e.date) : null, // exact moment, for reminders
    date: startOfDay(parseLocalDate(e.date.slice(0, 10)))
  }));
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

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function iconBadge(iconName, extraClass) {
  const badge = el("div", "icon-badge" + (extraClass ? " " + extraClass : ""));
  badge.innerHTML = getIcon(iconName);
  return badge;
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

/** Like el(), but runs the text through the glossary so curious/converting
 *  visitors get tap-to-explain terms. `used` keeps each term to one link per card. */
function richEl(tag, cls, text, profile, used) {
  const e = el(tag, cls);
  e.innerHTML = glossify(text, profile, used);
  return e;
}

function renderOccasionCard(container, occ, ctx, index) {
  const profile = ctx.profile;
  const extras = OCCASION_EXTRAS[occ.id] || {};
  const used = new Set();
  const card = el("article", "occasion-card");
  card.style.animationDelay = `${index * 90}ms`;

  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge(occ.icon));
  headRow.appendChild(el("h3", null, occ.title));
  card.appendChild(headRow);

  const intro = resolve(occ.content.intro, ctx).replace("{{OMER_DAY}}", ctx.omerDay > 0 ? ctx.omerDay : "");
  card.appendChild(richEl("p", "intro", intro, profile, used));

  const whyBox = renderWhyBox(resolve(extras.why, ctx), profile, used, ctx.hebrewDateLabel);
  if (whyBox) card.appendChild(whyBox);

  const halacha = resolve(occ.content.halacha, ctx);
  if (halacha && halacha.length) {
    card.appendChild(el("h4", "section-label", "Halacha & Practice"));
    const ul = el("ul", "halacha-list");
    halacha.forEach(h => ul.appendChild(richEl("li", null, h, profile, used)));
    card.appendChild(ul);
  }

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

  const inspiration = resolve(occ.content.inspiration, ctx);
  if (inspiration) {
    card.appendChild(el("h4", "section-label", "For Reflection"));
    card.appendChild(richEl("p", "inspiration", inspiration, profile, used));
  }

  const occSources = sourcesEl(occ.sources);
  if (occSources) card.appendChild(occSources);
  card.appendChild(reportLink(`occasion:${occ.id}`));
  makeCollapsible(card, 2, index === 0);
  container.appendChild(card);
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
    .filter(e => e.category === "holiday" || e.category === "roshchodesh" || e.category === "omer")
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

function countdownLabel(group, today) {
  const untilStart = daysBetween(today, group.start);
  if (untilStart > 1) return `in ${untilStart} days`;
  if (untilStart === 1) return "tomorrow";
  const todays = group.events.find(e => daysBetween(e.date, today) === 0);
  if (group.key === "omer") {
    const m = todays && /(\d+)/.exec(todays.title);
    return m ? `day ${m[1]} of 49` : "today";
  }
  if (group.key === "chanukah") {
    // Hebcal titles each day by the candles lit that evening ("Chanukah: 4 Candles"),
    // plus a final "Chanukah: 8th Day" with no lighting.
    const m = todays && /(\d+) Candles?/.exec(todays.title);
    if (m) return m[1] === "1" ? "1st candle tonight" : `${ordinal(Number(m[1]))} candle tonight`;
    return "last day";
  }
  if (group.days === 1) return "today";
  return `day ${daysBetween(group.start, today) + 1} of ${group.days}`;
}

function renderCountdownStrip(container, today, events, onSelect) {
  const groups = groupCountdownEvents(events)
    .filter(g => daysBetween(today, g.end) >= 0 && daysBetween(today, g.start) <= 30);

  const strip = el("div", "countdown-strip");
  groups.slice(0, 6).forEach((g, i) => {
    const untilStart = daysBetween(today, g.start);
    const ongoing = untilStart <= 0;
    const label = countdownLabel(g, today);
    const chip = el("button", "countdown-chip");
    chip.type = "button";
    chip.style.animationDelay = `${i * 60}ms`;
    if (ongoing) chip.classList.add("countdown-chip--today");
    chip.appendChild(el("span", "countdown-days", ongoing ? (label === "today" ? "Today" : label) : label));
    chip.appendChild(el("span", "countdown-title", g.name));
    chip.title = `${g.name} · ${label} — see the details`;
    chip.setAttribute("aria-label", `${g.name}, ${label}`);
    chip.addEventListener("click", () => onSelect(ongoing ? today : g.start));
    strip.appendChild(chip);
  });
  container.appendChild(strip);
}

/** Convert a Hebcal leyning string like "Deuteronomy 16:18-17:13" (or "...16:18-20" same-chapter)
 *  into a Sefaria API ref path like "Deuteronomy.16.18-17.13". */
function leyningToSefariaPath(str) {
  const m = /^(.+?)\s(\d+):(\d+)-(?:(\d+):)?(\d+)$/.exec(str);
  if (!m) return null;
  const [, book, c1, v1, c2, v2] = m;
  const endChapter = c2 || c1;
  return `${book.replace(/ /g, "_")}.${c1}.${v1}-${endChapter}.${v2}`;
}

const BOOK_ICONS = {
  Genesis: "book-genesis",
  Exodus: "book-exodus",
  Leviticus: "book-leviticus",
  Numbers: "book-numbers",
  Deuteronomy: "book-deuteronomy"
};

function bookIconFromRef(ref) {
  if (!ref) return "book-star";
  const book = ref.split(/\s\d/)[0];
  return BOOK_ICONS[book] || "book-star";
}

async function loadTorahPortion(events, today) {
  const parashatEvents = events.filter(e => e.category === "parashat" && e.leyning);

  // Normal case: the upcoming (or current) Shabbat has its own weekly portion.
  let parashatEvt = parashatEvents
    .filter(e => daysBetween(today, e.date) >= 0 && daysBetween(today, e.date) <= 10)
    .sort((a, b) => a.date - b.date)[0];

  // Some years a Yom Tov falls on Shabbat and displaces the regular weekly reading
  // for that week entirely (no "parashat" event appears). Fall back to the most
  // recently completed portion so the page still shows something meaningful.
  let carriedOver = false;
  if (!parashatEvt) {
    parashatEvt = parashatEvents
      .filter(e => daysBetween(e.date, today) >= 0 && daysBetween(e.date, today) <= 10)
      .sort((a, b) => b.date - a.date)[0];
    carriedOver = true;
  }

  if (!parashatEvt) return null;

  const dow = today.getDay(); // 0=Sun..6=Sat
  const aliyaNum = String(dow + 1);
  const aliyaRef = parashatEvt.leyning[aliyaNum]; // e.g. "Deuteronomy 16:18-17:13"

  const result = {
    parashaName: parashatEvt.title.replace(/^Parashat\s+/, ""),
    hebrewName: parashatEvt.hebrew,
    shabbatDate: parashatEvt.date,
    aliyaNum: parseInt(aliyaNum, 10),
    aliyaRef,
    carriedOver,
    text: null
  };

  if (aliyaRef) {
    const path = leyningToSefariaPath(aliyaRef);
    if (path) {
      try {
        const data = await fetchJSON(`${SEFARIA_BASE}/${path}?context=0&commentary=0`);
        result.text = { ref: aliyaRef, sefariaPath: path, english: data.text, hebrew: data.he };
      } catch (e) {
        console.warn("Sefaria fetch failed", e);
        result.text = { ref: aliyaRef, sefariaPath: path, english: null, hebrew: null };
      }
    }
  }

  return result;
}

function flattenSefaria(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr.flat(Infinity).filter(Boolean);
  return [arr];
}

/** Parse untrusted HTML without executing anything (unlike innerHTML on a live
 *  element, DOMParser never runs scripts or fires onerror handlers). */
function parseHtml(s) {
  return new DOMParser().parseFromString(`<body>${s || ""}</body>`, "text/html").body;
}

function stripHtml(s) {
  return parseHtml(s).textContent || "";
}

/** Sefaria verses embed translator footnotes as
 *  <sup class="footnote-marker">n</sup><i class="footnote">…</i>.
 *  Returns the verse as plain-text pieces with numbered note references
 *  ({ ref: N }) in place of each footnote, and pushes the note text into `notes`. */
function cleanSefariaVerse(html, notes) {
  const body = parseHtml(html);
  body.querySelectorAll("i.footnote").forEach(fn => {
    const term = fn.querySelector("b");
    const termText = term ? term.textContent.trim() : "";
    if (term) term.remove();
    notes.push({ term: termText, text: fn.textContent.replace(/\s+/g, " ").trim() });
    const marker = document.createElement("sup");
    marker.setAttribute("data-note", String(notes.length));
    fn.replaceWith(marker);
  });
  body.querySelectorAll("sup.footnote-marker").forEach(s => s.remove());

  const pieces = [];
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) pieces.push(node.textContent);
    else if (node.matches("sup[data-note]")) pieces.push({ ref: Number(node.getAttribute("data-note")) });
  }
  return pieces;
}

/** Fill `box` with cleaned verses; note references become small superscripts. */
function renderVerses(box, verses) {
  box.innerHTML = "";
  verses.forEach((pieces, i) => {
    if (i > 0) box.appendChild(document.createTextNode(" "));
    pieces.forEach(p => {
      if (typeof p === "string") box.appendChild(document.createTextNode(p));
      else {
        const sup = el("sup", "torah-note-ref", String(p.ref));
        sup.title = `Note ${p.ref}`;
        box.appendChild(sup);
      }
    });
  });
}

function renderTorahPortion(container, portion) {
  const card = el("article", "torah-card");
  if (!portion) {
    card.appendChild(el("h3", null, "This Week's Torah Portion"));
    card.appendChild(el("p", "intro", "Couldn't load this week's Torah portion right now — try refreshing the page in a moment."));
    container.appendChild(card);
    return;
  }

  const book = portion.aliyaRef ? portion.aliyaRef.split(/\s\d/)[0] : null;
  if (book) card.classList.add("book-" + book);

  const dayLabel = DOW_NAMES[new Date().getDay()];
  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge(bookIconFromRef(portion.aliyaRef), "icon-badge--gold"));
  headRow.appendChild(el("h3", null, `Parshat ${portion.parashaName}`));
  card.appendChild(headRow);
  card.appendChild(el("p", "torah-meta", `${portion.hebrewName || ""} · ${portion.carriedOver ? "Most recently read on Shabbat, " : "Read this Shabbat, "}${fmtDate(portion.shabbatDate)}`));

  const chitasNote = el("p", "intro");
  if (portion.carriedOver) {
    chitasNote.innerHTML = `A Yom Tov falls on this coming Shabbat, so the regular weekly reading is set aside this week. Here's the most recently completed portion to continue learning from — the day-by-day cycle picks back up next week.`;
  } else {
    chitasNote.innerHTML = `Following the daily custom of dividing the week's Torah reading into seven parts — one per day — <strong>today (${dayLabel})</strong> is the day for the <strong>${ordinal(portion.aliyaNum)} aliyah</strong>${portion.aliyaRef ? ` (${portion.aliyaRef})` : ""}.`;
  }
  card.appendChild(chitasNote);

  const engNotes = [];
  const hebNotes = [];
  const eng = portion.text ? flattenSefaria(portion.text.english).map(v => cleanSefariaVerse(v, engNotes)) : [];
  const heb = portion.text ? flattenSefaria(portion.text.hebrew).map(v => cleanSefariaVerse(v, hebNotes)) : [];

  if (eng.length || heb.length) {
    const toggleRow = el("div", "lang-toggle");
    const engBtn = el("button", "lang-btn lang-btn--active", "English");
    const hebBtn = el("button", "lang-btn", "עברית");
    engBtn.type = "button";
    hebBtn.type = "button";
    toggleRow.appendChild(engBtn);
    toggleRow.appendChild(hebBtn);
    card.appendChild(toggleRow);

    const textBox = el("p", "torah-text");
    card.appendChild(textBox);

    const notesBox = el("details", "torah-notes");
    card.appendChild(notesBox);

    function showNotes(notes) {
      notesBox.innerHTML = "";
      notesBox.hidden = !notes.length;
      if (!notes.length) return;
      notesBox.appendChild(el("summary", null, `Translator's notes (${notes.length})`));
      const ol = el("ol");
      notes.forEach(n => {
        const li = el("li");
        if (n.term) li.appendChild(el("strong", null, n.term + " "));
        li.appendChild(document.createTextNode(n.text));
        ol.appendChild(li);
      });
      notesBox.appendChild(ol);
    }

    function showLang(lang) {
      const isHeb = lang === "he";
      renderVerses(textBox, isHeb ? heb : eng);
      showNotes(isHeb ? hebNotes : engNotes);
      textBox.classList.toggle("torah-text--hebrew", isHeb);
      hebBtn.classList.toggle("lang-btn--active", isHeb);
      engBtn.classList.toggle("lang-btn--active", !isHeb);
    }
    showLang(eng.length ? "en" : "he");

    if (eng.length && heb.length) {
      engBtn.addEventListener("click", () => showLang("en"));
      hebBtn.addEventListener("click", () => showLang("he"));
    } else {
      hebBtn.disabled = !heb.length;
      engBtn.disabled = !eng.length;
    }
  }

  const link = el("a", "torah-link", "Read the full portion on Sefaria →");
  link.href = portion.text && portion.text.sefariaPath ? `https://www.sefaria.org/${portion.text.sefariaPath}` : "https://www.sefaria.org/";
  link.target = "_blank";
  link.rel = "noopener";
  card.appendChild(link);
  card.appendChild(reportLink(`torah:${portion.parashaName}${portion.aliyaRef ? ":" + portion.aliyaRef : ""}`));

  makeCollapsible(card, 3, false);
  container.appendChild(card);
}

function renderPrayerCard(container, prayerInfo) {
  if (!prayerInfo || !prayerInfo.prayer) return;
  const { prayer, precise } = prayerInfo;
  const card = el("article", "occasion-card prayer-card");

  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge(prayer.icon, "icon-badge--gold"));
  const titleWrap = el("div");
  titleWrap.appendChild(el("h3", null, prayer.title));
  const windowText = precise ? prayerWindowTimes(prayerInfo.key, prayerInfo.times) : null;
  titleWrap.appendChild(el("p", "torah-meta", precise
    ? `Right now in ${prayerInfo.placeName}${windowText ? ` · ${windowText}` : ""}`
    : `Right now (${prayer.window}, approximate)`));
  headRow.appendChild(titleWrap);
  card.appendChild(headRow);

  if (!precise) {
    // Sits outside the collapsible header, so tapping it doesn't toggle the card.
    const setCity = el("button", "settings-link-btn prayer-set-city", "Set your city for exact times");
    setCity.type = "button";
    setCity.addEventListener("click", openSettings);
    card.appendChild(setCity);
  }

  const profile = currentProfile;
  const extras = PRAYER_EXTRAS[prayerInfo.key] || {};
  const used = new Set();

  card.appendChild(richEl("p", "intro", prayer.content.intro, profile, used));

  card.appendChild(el("h4", "section-label", "Halacha & Practice"));
  const ul = el("ul", "halacha-list");
  prayer.content.halacha.forEach(h => ul.appendChild(richEl("li", null, h, profile, used)));
  card.appendChild(ul);

  const minhagBox = renderMinhagBox(extras.minhagim, profile);
  if (minhagBox) card.appendChild(minhagBox);
  const takingOnBox = renderTakingOnBox(extras.takingOn, profile, used);
  if (takingOnBox) card.appendChild(takingOnBox);

  card.appendChild(el("h4", "section-label", "For Reflection"));
  card.appendChild(richEl("p", "inspiration", prayer.content.inspiration, profile, used));
  const prayerSources = sourcesEl(prayer.sources);
  if (prayerSources) card.appendChild(prayerSources);
  card.appendChild(reportLink(`prayer:${prayerInfo.key}`));

  // Keep the header, the intro and (when shown) the "set your city" link visible.
  makeCollapsible(card, precise ? 2 : 3, false);
  container.appendChild(card);
}

function renderPrepCard(container, upcoming, isBrowsingAhead) {
  if (!upcoming) return;
  const { guide, daysUntil, offlineDays } = upcoming;
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

  makeCollapsible(card, 2, false);
  container.appendChild(card);
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

/** Mitzvot with no `timeGate` apply any time of day — those are the ones eligible
 *  to be "today's mitzvah" or to appear in the always-visible reference list.
 *  Time-gated ones (Modeh Ani, morning hand-washing, shoe order) only surface
 *  during their actual window, so they don't get shown as generically "for today"
 *  at 8pm. */
function anytimeMitzvot() {
  return MITZVOT.filter(m => !m.timeGate);
}

/** Deterministic "today's mitzvah" — advances daily, wraps around the list,
 *  and moves with whatever date is being browsed (true to the site's name). */
function getMitzvahForDate(date) {
  const pool = anytimeMitzvot();
  // Count whole days from a fixed local date (not the day of the year, which restarts
  // on January 1 and would repeat recent mitzvot within days of New Year).
  const days = Math.round((startOfDay(date) - new Date(2024, 0, 1)) / 86400000);
  return pool[((days % pool.length) + pool.length) % pool.length];
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
  const minhagBox = renderMinhagBox(extras.minhagim, profile);
  if (minhagBox) container.appendChild(minhagBox);
  const takingOnBox = renderTakingOnBox(extras.takingOn, profile, used);
  if (takingOnBox) container.appendChild(takingOnBox);
  container.appendChild(el("h4", "section-label", "For Reflection"));
  container.appendChild(richEl("p", "inspiration", m.inspiration, profile, used));
  const mSources = sourcesEl(m.sources);
  if (mSources) container.appendChild(mSources);
  container.appendChild(reportLink(`mitzvah:${m.id}`));
}

function renderDailyMitzvahCard(container, mitzvah) {
  container.innerHTML = "";
  const card = el("article", "occasion-card daily-mitzvah-card");

  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge(mitzvah.icon, "icon-badge--gold"));
  const titleWrap = el("div");
  titleWrap.appendChild(el("h3", null, mitzvah.title));
  titleWrap.appendChild(el("p", "torah-meta", `Today's Mitzvah · ${mitzvah.subtitle}`));
  headRow.appendChild(titleWrap);
  card.appendChild(headRow);

  appendMitzvahDetail(card, mitzvah);

  makeCollapsible(card, 1, true);
  container.appendChild(card);
}

/** A single row inside the "Everyday Mitzvot" list — its own small, independent
 *  expand/collapse, lighter-weight than a full card. */
function renderMitzvahRow(m) {
  const row = el("div", "mitzvah-row");
  const head = el("button", "mitzvah-row-head");
  head.type = "button";
  head.setAttribute("aria-expanded", "false");
  head.appendChild(iconBadge(m.icon, "icon-badge--sm"));
  const titleWrap = el("span", "mitzvah-row-title");
  titleWrap.appendChild(el("span", "mitzvah-row-name", m.title));
  titleWrap.appendChild(el("span", "mitzvah-row-subtitle", m.subtitle));
  head.appendChild(titleWrap);
  head.appendChild(el("span", "card-chevron", "▾"));
  row.appendChild(head);

  const body = el("div", "card-body");
  const inner = el("div", "card-body-inner");
  appendMitzvahDetail(inner, m);
  body.appendChild(inner);
  row.appendChild(body);

  head.addEventListener("click", () => {
    const open = row.classList.toggle("is-open");
    head.setAttribute("aria-expanded", open ? "true" : "false");
  });

  return row;
}

function renderMitzvotSection(container) {
  container.innerHTML = "";
  const card = el("article", "occasion-card mitzvot-card");

  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge("coin"));
  const titleWrap = el("div");
  titleWrap.appendChild(el("h3", null, "Everyday Mitzvot"));
  titleWrap.appendChild(el("p", "torah-meta", "A quick reference — not tied to any date"));
  headRow.appendChild(titleWrap);
  card.appendChild(headRow);

  card.appendChild(el("p", "intro", "The small, daily practices worth knowing: blessings, customs, and habits that come up every day rather than once a year. Tap any one to open it."));

  const list = el("div", "mitzvot-list");
  anytimeMitzvot().forEach(m => list.appendChild(renderMitzvahRow(m)));
  card.appendChild(list);

  makeCollapsible(card, 2, false);
  container.appendChild(card);
}

/** Morning-only practices (Modeh Ani, morning hand-washing, shoe order) — shown
 *  only while it's actually Shacharit time, right alongside the prayer card. */
function renderMorningMitzvotCard(container) {
  container.innerHTML = "";
  const morningMitzvot = MITZVOT.filter(m => m.timeGate === "morning");
  if (!morningMitzvot.length) return;

  const card = el("article", "occasion-card mitzvot-card morning-mitzvot-card");

  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge("sunrise", "icon-badge--gold"));
  const titleWrap = el("div");
  titleWrap.appendChild(el("h3", null, "Morning Practices"));
  titleWrap.appendChild(el("p", "torah-meta", "Since it's morning right now"));
  headRow.appendChild(titleWrap);
  card.appendChild(headRow);

  card.appendChild(el("p", "intro", "A few things meant specifically for the start of the day."));

  const list = el("div", "mitzvot-list");
  morningMitzvot.forEach(m => list.appendChild(renderMitzvahRow(m)));
  card.appendChild(list);

  makeCollapsible(card, 2, true);
  container.appendChild(card);
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

function renderQuizCard(container, occasions, portion, mitzvah) {
  container.innerHTML = "";
  const questions = buildTodaysQuiz(occasions, portion, mitzvah);
  if (!questions.length) return;

  const card = el("article", "occasion-card quiz-card");

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
    retryBtn.addEventListener("click", () => renderQuizCard(container, occasions, portion, mitzvah));
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

  makeCollapsible(card, 2, false);
  container.appendChild(card);
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const GEAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>';

/** The settings button under the date nav — summarizes city + profile and opens the panel. */
function renderProfilePill(profile) {
  const existing = document.getElementById("profile-pill");
  if (existing) existing.remove();

  const pill = el("button", "profile-pill");
  pill.id = "profile-pill";
  pill.type = "button";
  pill.setAttribute("aria-label", `Settings: ${settingsSummary(currentSettings, profile)}`);
  pill.innerHTML = GEAR_SVG;
  pill.appendChild(el("span", null, settingsSummary(currentSettings, profile)));
  pill.addEventListener("click", openSettings);
  document.querySelector(".date-nav").insertAdjacentElement("afterend", pill);
}

function openSettings() {
  openSettingsPanel((changed) => { if (changed) refreshAll(); });
}

/** Re-read settings and re-fetch everything that depends on location, the
 *  Israel setting, or the profile. */
async function refreshAll() {
  currentSettings = getSettings();
  currentProfile = getProfile();
  renderProfilePill(currentProfile);
  browseEvents = null;
  try {
    realTodayEvents = await loadCalendarWindow(realToday);
    const countdownContainer = document.getElementById("countdown-container");
    countdownContainer.innerHTML = "";
    renderCountdownStrip(countdownContainer, realToday, realTodayEvents, (date) => setViewingDate(date));
    scheduleReminders(realTodayEvents);
    renderInstallHint();
  } catch (e) {
    console.error(e);
  }
  await setViewingDate(viewingDate);
}

// --- Prayer changes card ---------------------------------------------

function renderPrayerChangeItem(item, used) {
  const li = el("li", "pc-item");
  li.appendChild(el("p", "pc-title", item.title));
  li.appendChild(richEl("p", "pc-detail", item.detail, currentProfile, used));
  if (item.where && item.where !== "—") li.appendChild(el("p", "pc-where", `Where: ${item.where}`));
  prayerCustomsFor(item, currentProfile && currentProfile.community).forEach(c => {
    const p = el("p", "pc-custom");
    p.appendChild(el("strong", null, `${c.label}: `));
    p.appendChild(document.createTextNode(c.text));
    li.appendChild(p);
  });
  return li;
}

/** Renders the full prayer-changes card (collapsed — the Today summary shows the
 *  headlines) and returns the engine's result for the summary to reuse. */
function renderPrayerChangesCard(container, date, heb, hebTomorrow, events) {
  container.innerHTML = "";
  if (!heb || !heb.hm) return null;
  const israel = isInIsrael(currentSettings);
  const changes = getPrayerChanges({
    date, heb, hebTomorrow, israel, events,
    community: currentProfile && currentProfile.reason === "jewish" ? currentProfile.community : null
  });
  const used = new Set();

  const card = el("article", "occasion-card prayer-changes-card");
  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge("book-star", "icon-badge--gold"));
  const titleWrap = el("div");
  const isToday = daysBetween(realToday, date) === 0;
  titleWrap.appendChild(el("h3", null, isToday ? "Prayer changes today" : "Prayer changes this day"));
  titleWrap.appendChild(el("p", "torah-meta", `${heb.hd} ${heb.hm} ${heb.hy} · ${israel ? "Israel" : "outside Israel"} calendar`));
  headRow.appendChild(titleWrap);
  card.appendChild(headRow);

  card.appendChild(el("h4", "section-label", "Shacharit & Mincha"));
  if (changes.today.length) {
    const ul = el("ul", "pc-list");
    changes.today.forEach(i => ul.appendChild(renderPrayerChangeItem(i, used)));
    card.appendChild(ul);
  } else {
    card.appendChild(el("p", "pc-nothing", "Nothing changes today — it's the regular weekday service."));
  }

  if (changes.tonight.length) {
    card.appendChild(el("h4", "section-label", "Tonight at Maariv"));
    const ul = el("ul", "pc-list");
    changes.tonight.forEach(i => ul.appendChild(renderPrayerChangeItem(i, used)));
    card.appendChild(ul);
  }

  if (changes.season.length) {
    const details = el("details", "pc-season");
    details.appendChild(el("summary", null, "This season (said every day for now)"));
    const ul = el("ul", "pc-list");
    changes.season.forEach(i => ul.appendChild(renderPrayerChangeItem(i, used)));
    details.appendChild(ul);
    card.appendChild(details);
  }

  card.appendChild(el("p", "pc-review", "A learning aid that still needs review by a rabbi. Customs differ between communities — check with your rabbi before relying on it."));
  card.appendChild(reportLink(`prayer-changes:${heb.hd}-${heb.hm}`));
  makeCollapsible(card, 1, false);
  container.appendChild(card);
  return changes;
}

// --- Times card ------------------------------------------------------

function fmtClock(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Days when a times card is worth showing even before a city is set. */
function isTimesDay(events, date) {
  const dow = date.getDay();
  if (dow === 5 || dow === 6) return true;
  return events.some(e => daysBetween(e.date, date) === 0 &&
    (e.yomtov || /^Erev /.test(e.title) || e.subcat === "fast"));
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

/** The next holiday after `date` (one entry per multi-day holiday), skipping
 *  special Shabbatot, Rosh Chodesh and the Omer count. */
function nextHoliday(events, date) {
  return groupCountdownEvents(events).find(g =>
    daysBetween(date, g.start) > 0 &&
    g.events[0].category === "holiday" &&
    g.events[0].subcat !== "shabbat");
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

function summaryRow({ icon, label, value, note, onClick, actionLabel }) {
  const li = el("li", "ts-row-wrap");
  const row = el(onClick ? "button" : "div", "ts-row");
  if (onClick) {
    row.type = "button";
    row.addEventListener("click", onClick);
    if (actionLabel) row.setAttribute("aria-label", `${label}: ${value}. ${actionLabel}`);
  }
  const badge = el("span", "ts-icon");
  badge.innerHTML = getIcon(icon);
  row.appendChild(badge);
  const text = el("span", "ts-text");
  text.appendChild(el("span", "ts-label", label));
  text.appendChild(el("span", "ts-value", value));
  if (note) text.appendChild(el("span", "ts-note", note));
  row.appendChild(text);
  if (onClick) row.appendChild(el("span", "ts-chevron", "›"));
  li.appendChild(row);
  return li;
}

function renderTodaySummary({ date, events, occasions, changes, mitzvah }) {
  const list = document.getElementById("today-summary-rows");
  list.innerHTML = "";
  const isToday = daysBetween(realToday, date) === 0;

  // 1. Today's occasion in one line
  const [top, season] = occasions;
  const occLine = top.id === "generic-weekday"
    ? (season ? season.title : "No holiday — an ordinary day in the Jewish calendar")
    : [top.title, season && season.title].filter(Boolean).join(" · ");
  list.appendChild(summaryRow({
    icon: top.icon, label: isToday ? "Today" : "This day", value: occLine,
    onClick: () => goToSection("occasion-container"), actionLabel: "Open today's card"
  }));

  // 2. Prayer changes (headlines only)
  if (changes) {
    const tonightTitle = (t) => `Tonight: ${t.replace(/\s*(from )?tonight$/i, "")}`;
    const titles = [...changes.today.map(i => i.title), ...changes.tonight.map(i => tonightTitle(i.title))];
    const shown = titles.slice(0, 3).join(" · ");
    const value = titles.length ? shown + (titles.length > 3 ? ` · +${titles.length - 3} more` : "") : "No changes — the regular service";
    list.appendChild(summaryRow({
      icon: "book-star", label: "In prayer", value,
      note: "A learning aid — check with your rabbi",
      onClick: () => goToSection("prayer-changes-container"), actionLabel: "Open prayer changes"
    }));
  }

  // 3. Times (or a prompt to set the city on days that need them)
  const timed = timedEventsOn(events, date);
  if (timed.length) {
    list.appendChild(summaryRow({
      icon: "candles-shabbat", label: `Times · ${currentSettings.location.name}`,
      value: timed.map(e => `${timedEventLabel(e)} ${fmtClock(e.time)}`).join(" · ")
    }));
  } else if (!currentSettings.location && isTimesDay(events, date)) {
    list.appendChild(summaryRow({
      icon: "candles-shabbat", label: "Times", value: "Set your city for candle-lighting and other times",
      onClick: openSettings, actionLabel: "Open settings"
    }));
  }

  // 4. Mitzvah of the day
  list.appendChild(summaryRow({
    icon: mitzvah.icon, label: "Mitzvah of the day", value: mitzvah.title,
    onClick: () => goToSection("daily-mitzvah-container"), actionLabel: "Open the mitzvah"
  }));

  // 5. Next holiday + prep countdown
  const next = nextHoliday(events, date);
  const prep = nextPrepInfo(events, date);
  const parts = [];
  if (next) parts.push(`${next.name} ${inDays(daysBetween(date, next.start))}`);
  if (prep) {
    if (prep.ready) parts.push(`${prep.name} prep list is ready (${inDays(prep.daysUntil)})`);
    else if (prep.opensIn > 0) parts.push(`${prep.name} prep list opens ${inDays(prep.opensIn)}`);
  }
  if (parts.length) {
    list.appendChild(summaryRow({
      icon: "star", label: "Coming up", value: parts.join(" · "),
      onClick: () => goToSection("prep-section"), actionLabel: "Open the prep section"
    }));
  }

  // 6. Printable sheet for the next Shabbat / Yom Tov
  const block = findRestBlock(events, date);
  if (block) {
    const holidays = blockHolidayNames(events, block);
    const name = holidays.length ? holidays.join(" & ") : "Shabbat";
    const li = el("li", "ts-print-wrap");
    const btn = el("button", "ts-print");
    btn.type = "button";
    btn.innerHTML = PRINTER_SVG;
    btn.appendChild(el("span", null, `Print for ${name} · ${shortDate(block.days[0])}`));
    btn.addEventListener("click", () => openPrintPreview(date));
    li.appendChild(btn);
    list.appendChild(li);
  }
}

const PRINTER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M7 9V3h10v6M7 17H4v-7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7h-3M7 14h10v7H7z"/></svg>';

// --- Browsing state -------------------------------------------------
// `realToday` never changes once the page loads; it's what the countdown
// strip and the "getting ready" prep card are always based on, since those
// are meant to help someone plan *before* they go offline for a chag.
// `viewingDate` is whatever date the visitor has navigated to.
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
  if (browseEvents && date >= browseWindowStart && date <= browseWindowEnd) {
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

function renderViewingBanner(date) {
  const existing = document.getElementById("viewing-banner");
  if (existing) existing.remove();
  if (daysBetween(realToday, date) === 0) return;

  const banner = el("div", "viewing-banner");
  banner.id = "viewing-banner";
  const label = daysBetween(realToday, date) > 0 ? "Looking ahead to" : "Looking back at";
  banner.appendChild(el("span", null, `${label} ${fmtDate(date)}`));
  const backBtn = el("button", "viewing-banner-back", "Back to Today");
  backBtn.type = "button";
  backBtn.addEventListener("click", () => setViewingDate(realToday));
  banner.appendChild(backBtn);
  document.querySelector(".ts-date").insertAdjacentElement("beforebegin", banner);
}

async function setViewingDate(date) {
  date = startOfDay(date);
  viewingDate = date;
  document.getElementById("date-input").value = toISO(date);

  const [events, hebrewInfo] = await Promise.all([
    ensureEventsCover(date),
    getHebrewDateCached(date)
  ]);

  document.getElementById("hebrew-date").textContent = hebrewInfo ? hebrewInfo.hebrew || "" : "";
  document.getElementById("gregorian-date").textContent = fmtDate(date);
  renderViewingBanner(date);
  const hebTomorrow = await getHebrewDateCached(addDays(date, 1));
  const changes = renderPrayerChangesCard(document.getElementById("prayer-changes-container"), date, hebrewInfo, hebTomorrow, events);

  const ctx = buildContext(date, events, hebrewInfo, currentProfile);
  const occasions = pickOccasions(ctx);

  const occContainer = document.getElementById("occasion-container");
  occContainer.innerHTML = "";
  occasions.forEach((o, i) => renderOccasionCard(occContainer, o, ctx, i));

  if (ctx.erevTavshilin && ctx.isToday(ctx.erevTavshilin)) {
    const notice = el("div", "tavshilin-banner");
    notice.textContent = "Reminder: prepare Eruv Tavshilin before the holiday begins tonight, since this Yom Tov runs directly into Shabbat.";
    occContainer.prepend(notice);
  }

  const prepContainer = document.getElementById("prep-container");
  prepContainer.innerHTML = "";
  const upcomingPrep = findUpcomingPrepGuide(events, date);
  renderPrepCard(prepContainer, upcomingPrep, daysBetween(realToday, date) !== 0);
  if (!upcomingPrep) {
    const info = nextPrepInfo(events, date);
    const msg = info
      ? `No holiday prep needed yet. The ${info.name} checklist opens ${inDays(Math.max(info.opensIn, 0))}.`
      : "No major holiday prep in the next few weeks.";
    prepContainer.appendChild(el("p", "prep-empty", msg));
  }

  const todaysMitzvah = getMitzvahForDate(date);
  renderDailyMitzvahCard(document.getElementById("daily-mitzvah-container"), todaysMitzvah);
  renderTodaySummary({ date, events, occasions, changes, mitzvah: todaysMitzvah });

  const torahContainer = document.getElementById("torah-container");
  torahContainer.innerHTML = "";
  const portion = await loadTorahPortion(events, date).catch(e => { console.error(e); return null; });
  renderTorahPortion(torahContainer, portion);
  // Re-render so the list picks up the visitor's current profile.
  renderMitzvotSection(document.getElementById("mitzvot-container"));

  renderQuizCard(document.getElementById("quiz-container"), occasions, portion, todaysMitzvah);

  const prayerContainer = document.getElementById("prayer-container");
  const morningContainer = document.getElementById("morning-mitzvot-container");
  prayerContainer.innerHTML = "";
  morningContainer.innerHTML = "";
  if (daysBetween(realToday, date) === 0) {
    const prayerInfo = await loadPrayerCard(date, currentSettings.location).catch(e => { console.error(e); return null; });
    renderPrayerCard(prayerContainer, prayerInfo);
    if (prayerInfo && prayerInfo.key === "shacharit") {
      renderMorningMitzvotCard(morningContainer);
    }
  }
}

function renderDateNav(container) {
  container.innerHTML = "";
  const nav = el("div", "date-nav");

  const prevBtn = el("button", "date-nav-arrow", "←");
  prevBtn.type = "button";
  prevBtn.setAttribute("aria-label", "Previous day");
  prevBtn.addEventListener("click", () => setViewingDate(addDays(viewingDate, -1)));

  const input = el("input", "date-input");
  input.type = "date";
  input.id = "date-input";
  input.value = toISO(viewingDate);
  input.addEventListener("change", () => {
    if (input.value) setViewingDate(parseLocalDate(input.value));
  });

  const nextBtn = el("button", "date-nav-arrow", "→");
  nextBtn.type = "button";
  nextBtn.setAttribute("aria-label", "Next day");
  nextBtn.addEventListener("click", () => setViewingDate(addDays(viewingDate, 1)));

  const todayBtn = el("button", "date-nav-today", "Today");
  todayBtn.type = "button";
  todayBtn.addEventListener("click", () => setViewingDate(realToday));

  nav.appendChild(prevBtn);
  nav.appendChild(input);
  nav.appendChild(nextBtn);
  nav.appendChild(todayBtn);
  container.appendChild(nav);
}

async function init() {
  realToday = startOfDay(new Date());
  viewingDate = realToday;
  document.getElementById("gregorian-date").textContent = fmtDate(realToday);

  renderDateNav(document.getElementById("date-nav-container"));

  const aboutCard = document.querySelector(".about-card");
  if (aboutCard) makeCollapsible(aboutCard, 1, false);

  renderMitzvotSection(document.getElementById("mitzvot-container"));

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
    renderProfilePill(currentProfile);
    await setViewingDate(realToday);

    if (!currentProfile) {
      openOnboarding((newProfile) => {
        currentProfile = newProfile;
        renderProfilePill(newProfile);
        setViewingDate(viewingDate);
      });
    }

    const countdownContainer = document.getElementById("countdown-container");
    countdownContainer.innerHTML = "";
    renderCountdownStrip(countdownContainer, realToday, realTodayEvents, (date) => setViewingDate(date));

    // A link ending in #print opens the printable Shabbat / Yom Tov sheet directly.
    if (location.hash === "#print") openPrintPreview(realToday);

    initOffline(realTodayEvents);

  } catch (err) {
    console.error(err);
    document.getElementById("occasion-container").innerHTML =
      '<p class="error">Something went wrong loading today\'s calendar data. Please check your connection and refresh.</p>';
  }
}

/** Mobile bottom tab bar: icons, and highlight the section currently on screen. */
function initTabBar() {
  const bar = document.getElementById("tab-bar");
  if (!bar) return;
  const links = [...bar.querySelectorAll("a")];
  links.forEach(a => {
    const label = a.textContent;
    a.innerHTML = `<span class="tab-icon" aria-hidden="true">${getIcon(a.dataset.icon)}</span><span>${label}</span>`;
  });
  // Sections that belong to each tab; today's cards (prayer, occasion) count as "Today"
  // even though they sit below the Prep section on the page.
  const extra = {
    top: ["prayer-changes-container", "prayer-container", "morning-mitzvot-container", "occasion-container"]
  };
  const sections = [];
  links.forEach(a => {
    const id = a.getAttribute("href").slice(1);
    [id, ...(extra[id] || [])].forEach(sid => sections.push({ id: sid, link: a }));
  });

  // The active tab owns the lowest section whose top has scrolled past a line
  // near the top of the screen; at the very bottom of the page, the last tab.
  function updateActiveTab() {
    // Sections are scrolled to ~12px from the top (scroll-margin), so a line at 60px
    // picks the section just tapped even when it's short (like Prep).
    const line = 60;
    let active = links[0];
    let best = -Infinity;
    sections.forEach(({ id, link }) => {
      const target = document.getElementById(id);
      if (!target || !target.offsetHeight) return;
      const top = target.getBoundingClientRect().top;
      if (top <= line && top > best) { best = top; active = link; }
    });
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) active = links[links.length - 1];
    links.forEach(a => {
      const on = a === active;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
    });
  }
  let pending = false;
  window.addEventListener("scroll", () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; updateActiveTab(); });
  }, { passive: true });
  window.updateActiveTab = updateActiveTab;
  updateActiveTab();
}

document.addEventListener("DOMContentLoaded", () => {
  initTabBar();
  init();
});
