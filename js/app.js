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
    const isFast = g.events.some(e => e.subcat === "fast");
    if (isFast) chip.classList.add("countdown-chip--fast");
    chip.appendChild(el("span", "countdown-days", ongoing ? (label === "today" ? "Today" : label) : label));
    chip.appendChild(el("span", "countdown-title", g.name));
    if (isFast) chip.appendChild(el("span", "countdown-tag", "Fast day"));
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

function renderPrepCard(container, upcoming, isBrowsingAhead) {
  if (!upcoming) return;
  const { guide, daysUntil, offlineDays, date } = upcoming;
  if (guide.kind === "day") return renderDayPrepCard(container, upcoming, isBrowsingAhead);
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

/** "Get ready" card for a holiday, fast or special day that isn't Yom Tov:
 *  its story, meaning, how to prepare yourself, and a practical checklist. */
function renderDayPrepCard(container, upcoming, isBrowsingAhead) {
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

  makeCollapsible(card, 2, false);
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
  prayerCustomsFor(item,currentProfile && currentProfile.reason === "jewish" ? currentProfile.community : null).forEach(c => {
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

// --- Zmanim card --------------------------------------------------------

/** Halachic midnight tonight ≈ today's midday + 12 hours (within a minute or two). */
function zmanPlus12h(iso) {
  const m = /^(.*T)(\d{2}):(\d{2})(.*)$/.exec(iso || "");
  if (!m) return null;
  const d = new Date(iso);
  d.setHours(d.getHours() + 12);
  const h = (Number(m[2]) + 12) % 24;
  return { iso: `${m[1]}${String(h).padStart(2, "0")}:${m[3]}${m[4]}`, at: d };
}

/**
 * The day's zmanim for the saved city, grouped by what you're doing, each with
 * its earliest and latest time. Built from Hebcal's /zmanim for the viewed date.
 */
function buildZmanimGroups(t, community) {
  const midnight = zmanPlus12h(t.chatzot);
  const chabad = community === "chabad";
  return [
    {
      title: "Tallit and tefillin",
      rows: [
        { label: "Earliest (misheyakir — light enough to recognize someone)", iso: t.misheyakir },
        { label: "Latest: before sunset (ideally worn for Shacharit)", iso: t.sunset }
      ]
    },
    {
      title: "Shacharit (morning prayer)",
      rows: [
        { label: "Earliest, after the fact (dawn, alot hashachar)", iso: chabad ? t.alosBaalHatanya : t.alotHaShachar },
        { label: "Ideal start (sunrise, netz)", iso: t.sunrise },
        { label: "Latest for the Amidah (Magen Avraham — earlier, stricter)", iso: t.sofZmanTfillaMGA },
        { label: "Latest for the Amidah (Gra)", iso: chabad ? t.sofZmanTfilaBaalHatanya : t.sofZmanTfilla, note: chabad ? "Alter Rebbe's time (Chabad)" : null },
        { label: "Latest after the fact (midday, chatzot)", iso: t.chatzot }
      ]
    },
    {
      title: "Morning Shema",
      rows: [
        { label: "Latest (Magen Avraham — earlier, stricter)", iso: t.sofZmanShmaMGA },
        { label: "Latest (Gra)", iso: chabad ? t.sofZmanShmaBaalHatanya : t.sofZmanShma, note: chabad ? "Alter Rebbe's time (Chabad)" : null }
      ]
    },
    {
      title: "Mincha (afternoon prayer)",
      rows: [
        { label: "Earliest (Mincha Gedolah)", iso: t.minchaGedola },
        { label: "Preferred from (Mincha Ketanah)", iso: t.minchaKetana },
        { label: "Plag HaMincha", iso: t.plagHaMincha, note: "Some may pray Maariv from here, and light Shabbat candles early" },
        { label: "Latest (sunset)", iso: t.sunset }
      ]
    },
    {
      title: "Maariv (evening prayer) and the evening Shema",
      rows: [
        { label: "Earliest (nightfall — three stars)", iso: t.tzeit85deg || t.dusk },
        { label: "Ideally before (halachic midnight, about)", iso: midnight && midnight.iso, at: midnight && midnight.at },
        { label: "Latest after the fact: dawn", iso: null, text: "Until dawn tomorrow" }
      ]
    }
  ];
}

async function renderZmanimCard(container, date) {
  container.innerHTML = "";
  const card = el("article", "occasion-card zmanim-card");
  const head = el("div", "card-head");
  head.appendChild(iconBadge("sunrise", "icon-badge--gold"));
  const titleWrap = el("div");
  titleWrap.appendChild(el("h3", null, "All of the day's times (zmanim)"));
  const isToday = daysBetween(realToday, date) === 0;
  const loc = currentSettings.location;
  titleWrap.appendChild(el("p", "torah-meta", loc ? `Earliest and latest for each prayer · ${shortDate(date)} · ${loc.name}` : "Earliest and latest times for each prayer"));
  head.appendChild(titleWrap);
  card.appendChild(head);

  if (!loc) {
    card.appendChild(el("p", "dg-sub", "Zmanim depend on sunrise and sunset where you are, so they need your city — they're never guessed."));
    const btn = el("button", "settings-link-btn", "Set your city for exact times");
    btn.type = "button";
    btn.addEventListener("click", openSettings);
    card.appendChild(btn);
    container.appendChild(card);
    return;
  }

  const times = await getZmanimCached(date);
  if (!pcSameDay(viewingDate, date)) return; // the visitor moved to another day meanwhile
  if (!times) {
    card.appendChild(el("p", "dg-sub", "Couldn't load the times right now — try again in a moment."));
    container.appendChild(card);
    return;
  }

  const community = pcCommunityKey(currentProfile && currentProfile.reason === "jewish" ? currentProfile.community : null);
  const groups = buildZmanimGroups(times, community);
  const now = new Date();
  let nextRow = null;
  if (isToday) {
    groups.forEach(g => g.rows.forEach(r => {
      if (!r.iso) return;
      const at = r.at || new Date(r.iso);
      if (at > now && (!nextRow || at < nextRow.at)) nextRow = { row: r, at, group: g };
    }));
    if (nextRow) {
      card.appendChild(el("p", "zm-next", `Coming up at ${fmtZman(nextRow.row.iso)} — ${nextRow.group.title}: ${nextRow.row.label}`));
    }
  }

  groups.forEach(g => {
    card.appendChild(el("h4", "section-label", g.title));
    const dl = el("dl", "zm-list");
    g.rows.forEach(r => {
      const row = el("div", "zm-row");
      if (nextRow && nextRow.row === r) row.classList.add("is-next");
      if (isToday && r.iso && (r.at || new Date(r.iso)) < now) row.classList.add("is-past");
      const dt = el("dt", null, r.label);
      if (r.note) dt.appendChild(el("span", "zm-note", r.note));
      row.appendChild(dt);
      row.appendChild(el("dd", null, r.iso ? fmtZman(r.iso) : (r.text || "—")));
      dl.appendChild(row);
    });
    card.appendChild(dl);
  });

  card.appendChild(el("p", "pc-review", "Calculated by Hebcal for your city. Opinions differ on several of these times — ask your rabbi which ones your community follows."));
  makeCollapsible(card, isToday && nextRow ? 2 : 1, false);
  container.appendChild(card);
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

const PRINTER_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M7 9V3h10v6M7 17H4v-7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7h-3M7 14h10v7H7z"/></svg>';

// --- The day's data for the timeline --------------------------------------

/** The visitor's community, when they've told us they're Jewish (else null). */
function profileCommunity() {
  return currentProfile && currentProfile.reason === "jewish" ? currentProfile.community : null;
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
    date, heb, hebTomorrow, israel: isInIsrael(currentSettings), events, community: profileCommunity()
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

/** Under the timeline: what's coming up next, and the printable Shabbat sheet. */
function renderDayFooter(container, date, events) {
  const prep = nextPrepInfo(events, date);
  const next = nextHoliday(events, date);
  let line = null;
  let days = null;
  if (prep && prep.ready) {
    days = prep.daysUntil;
    line = { title: `Coming up: ${prep.name}`, sub: "Its get-ready guide is open — the story, what it means and how to prepare." };
  } else if (next) {
    days = daysBetween(date, next.start);
    const opens = prep && prep.name === next.name && prep.opensIn > 0 ? ` Its get-ready guide opens ${inDays(prep.opensIn)}.` : "";
    line = { title: `Coming up: ${next.name}`, sub: `${inDays(days).replace(/^./, c => c.toUpperCase())}.${opens}` };
  }
  if (line) {
    const btn = el("button", "tl-coming");
    btn.type = "button";
    const big = el("span", "tl-coming-days", String(days));
    big.appendChild(el("small", null, days === 1 ? "day" : "days"));
    btn.appendChild(big);
    const text = el("span", "tl-coming-text");
    text.appendChild(el("strong", null, line.title));
    text.appendChild(el("span", null, line.sub));
    btn.appendChild(text);
    btn.appendChild(el("span", "ts-chevron", "›"));
    btn.addEventListener("click", () => goToSection("prep-section"));
    container.appendChild(btn);
  }

  const block = findRestBlock(events, date);
  if (block) {
    const holidays = blockHolidayNames(events, block);
    const name = holidays.length ? holidays.join(" & ") : "Shabbat";
    const btn = el("button", "ts-print");
    btn.type = "button";
    btn.innerHTML = PRINTER_SVG;
    btn.appendChild(el("span", null, `Print for ${name} · ${shortDate(block.days[0])}`));
    btn.addEventListener("click", () => openPrintPreview(date));
    const wrap = el("div", "tl-print");
    wrap.appendChild(btn);
    container.appendChild(wrap);
  }
}

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
  const [hebTomorrow, times] = await Promise.all([
    getHebrewDateCached(addDays(date, 1)),
    getZmanimCached(date)
  ]);
  if (!pcSameDay(viewingDate, date)) return; // the visitor moved to another day meanwhile
  const { changes, textCtx } = computePrayerChanges(date, hebrewInfo, hebTomorrow, events);

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
    // Nothing to prepare yet: say what's next and when its guide opens.
    const info = nextPrepInfo(events, date);
    const next = nextHoliday(events, date);
    const fmtDay = (d) => d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    const parts = [];
    if (next && (!info || daysBetween(date, next.start) < info.daysUntil) && (!info || next.name !== info.name)) {
      parts.push(`Next on the calendar: ${next.name}, ${inDays(daysBetween(date, next.start))}.`);
    }
    if (info) {
      parts.push(`${parts.length ? "Then" : "Next up"}: ${info.name}, ${inDays(info.daysUntil)}. Its get-ready guide — the story, what it means and how to prepare — opens on ${fmtDay(addDays(date, Math.max(info.opensIn, 0)))}.`);
    }
    if (!parts.length) parts.push("Nothing special on the calendar in the next few weeks — a good time to settle into the daily practices.");
    prepContainer.appendChild(el("p", "prep-empty", parts.join(" ")));
  }

  const todaysMitzvah = getMitzvahForDate(date);
  const guide = computeDailyGuide(date, hebrewInfo, events);
  const timelineContainer = document.getElementById("timeline-container");
  renderTimeline({
    container: timelineContainer,
    nowContainer: document.getElementById("now-container"),
    date, isToday: daysBetween(realToday, date) === 0, times, events,
    guide, changes: changes || { today: [], tonight: [], season: [] }, textCtx, mitzvah: todaysMitzvah,
    community: pcCommunityKey(profileCommunity()), info: pcDayInfo(events, date)
  });
  renderDayFooter(timelineContainer, date, events);
  renderZmanimCard(document.getElementById("zmanim-container"), date).catch(e => console.error(e));

  const torahContainer = document.getElementById("torah-container");
  torahContainer.innerHTML = "";
  const portion = await loadTorahPortion(events, date).catch(e => { console.error(e); return null; });
  renderTorahPortion(torahContainer, portion);
  updateTorahSummary(portion);

  renderQuizCard(document.getElementById("quiz-container"), occasions, portion, todaysMitzvah);
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

  renderDateNav(document.getElementById("date-nav-container"));

  const aboutCard = document.querySelector(".about-card");
  if (aboutCard) makeCollapsible(aboutCard, 1, false);

  // The way into the Everyday Mitzvot page.
  const teaserIcon = document.querySelector(".mz-teaser-icon");
  if (teaserIcon) teaserIcon.innerHTML = getIcon("hand");
  const mitzvotCount = document.getElementById("mitzvot-count");
  if (mitzvotCount) mitzvotCount.textContent = `all ${MITZVOT.length}`;

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
  // Sections that belong to each tab: everything above the Torah card counts as "Today".
  const extra = {
    top: ["countdown-container", "timeline-container", "zmanim-container", "occasion-container"]
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
