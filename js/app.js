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
  const url = `${HEBCAL_BASE}?v=1&cfg=json&start=${start}&end=${end}&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on&leyning=on`;
  const data = await fetchJSON(url);
  return (data.items || []).map(e => ({ ...e, date: startOfDay(parseLocalDate(e.date)) }));
}

async function loadHebrewDate(today) {
  const url = `${CONVERTER_BASE}?cfg=json&date=${toISO(today)}&g2h=1`;
  return fetchJSON(url);
}

function buildContext(today, events, hebrewDateInfo) {
  const findEvent = (fn) => events.find(fn);

  // Rosh Hashana day 1 is titled "Rosh Hashana <year>" (e.g. "Rosh Hashana 5787"),
  // distinct from "Erev Rosh Hashana", "Rosh Hashana II", and "Rosh Hashana LaBehemot".
  const rhFirst = findEvent(e => /^Rosh Hashana \d{3,4}$/.test(e.title));

  const ykEvent = findEvent(e => e.title === "Yom Kippur");
  const tishaBavEvent = findEvent(e => /^Tish.a B.Av/.test(e.title));
  const t17Event = findEvent(e => /^Tzom Tammuz$/.test(e.title));

  const leilSelichotEvent = findEvent(e => e.title === "Leil Selichot");
  const selichotStart = leilSelichotEvent ? leilSelichotEvent.date : (rhFirst ? computeSelichotStart(rhFirst.date) : null);

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
  const pesachII = findEvent(e => e.title === "Pesach II" || e.title === "Pesach II (CH''M)");
  let omerDay = -1;
  if (pesachII) {
    const diff = daysBetween(pesachII.date, today) + 1;
    if (diff >= 1 && diff <= 49) omerDay = diff;
  }
  if (omerDay === -1) {
    // Fallback: derive from a prior-year Pesach if window doesn't include it (rare, near year boundary)
    const anyOmerEvt = events.find(e => /Omer/.test(e.title || ""));
    if (anyOmerEvt) {
      const m = /(\d+)/.exec(anyOmerEvt.title);
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

function renderOccasionCard(container, occ, ctx) {
  const card = el("article", "occasion-card");
  const h = el("h3", null, occ.title);
  card.appendChild(h);

  const intro = occ.content.intro.replace("{{OMER_DAY}}", ctx.omerDay > 0 ? ctx.omerDay : "");
  card.appendChild(el("p", "intro", intro));

  if (occ.content.halacha && occ.content.halacha.length) {
    card.appendChild(el("h4", "section-label", "Halacha & Practice"));
    const ul = el("ul", "halacha-list");
    occ.content.halacha.forEach(h => ul.appendChild(el("li", null, h)));
    card.appendChild(ul);
  }

  if (occ.content.customs && occ.content.customs.length) {
    card.appendChild(el("h4", "section-label", "Customs"));
    const ul = el("ul", "customs-list");
    occ.content.customs.forEach(c => ul.appendChild(el("li", null, c)));
    card.appendChild(ul);
  }

  if (occ.content.inspiration) {
    card.appendChild(el("h4", "section-label", "For Reflection"));
    card.appendChild(el("p", "inspiration", occ.content.inspiration));
  }

  container.appendChild(card);
}

function renderCountdownStrip(container, ctx) {
  const upcoming = ctx.events
    .filter(e => e.category === "holiday" || e.category === "roshchodesh")
    .filter(e => daysBetween(ctx.today, e.date) >= 0 && daysBetween(ctx.today, e.date) <= 30)
    .filter(e => !/^Erev /.test(e.title) && !/^Mevarchim/.test(e.title));
  const seen = new Set();
  const strip = el("div", "countdown-strip");
  for (const e of upcoming) {
    if (seen.has(e.title.replace(/ I{1,2}$/, ""))) continue;
    seen.add(e.title.replace(/ I{1,2}$/, ""));
    const d = daysBetween(ctx.today, e.date);
    const chip = el("div", "countdown-chip");
    chip.appendChild(el("span", "countdown-days", d === 0 ? "Today" : `${d}d`));
    chip.appendChild(el("span", "countdown-title", e.title));
    strip.appendChild(chip);
    if (strip.children.length >= 6) break;
  }
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

function stripHtml(s) {
  const d = document.createElement("div");
  d.innerHTML = s;
  return d.textContent || "";
}

function renderTorahPortion(container, portion) {
  const card = el("article", "torah-card");
  if (!portion) {
    card.appendChild(el("h3", null, "This Week's Torah Portion"));
    card.appendChild(el("p", "intro", "Couldn't load this week's Torah portion right now — try refreshing the page in a moment."));
    container.appendChild(card);
    return;
  }

  const dayLabel = DOW_NAMES[new Date().getDay()];
  card.appendChild(el("h3", null, `Parshat ${portion.parashaName}`));
  card.appendChild(el("p", "torah-meta", `${portion.hebrewName || ""} · ${portion.carriedOver ? "Most recently read on Shabbat, " : "Read this Shabbat, "}${fmtDate(portion.shabbatDate)}`));

  const chitasNote = el("p", "intro");
  if (portion.carriedOver) {
    chitasNote.innerHTML = `A Yom Tov falls on this coming Shabbat, so the regular weekly reading is set aside this week. Here's the most recently completed portion to continue learning from — the day-by-day cycle picks back up next week.`;
  } else {
    chitasNote.innerHTML = `Following the daily custom of dividing the week's Torah reading into seven parts — one per day — <strong>today (${dayLabel})</strong> is the day for the <strong>${ordinal(portion.aliyaNum)} aliyah</strong>${portion.aliyaRef ? ` (${portion.aliyaRef})` : ""}.`;
  }
  card.appendChild(chitasNote);

  if (portion.text) {
    const eng = flattenSefaria(portion.text.english).map(stripHtml);
    if (eng.length) {
      card.appendChild(el("h4", "section-label", "Today's Portion (English)"));
      const p = el("p", "torah-text");
      p.textContent = eng.join(" ");
      card.appendChild(p);
    }
  }

  const link = el("a", "torah-link", "Read the full portion on Sefaria →");
  link.href = portion.text && portion.text.sefariaPath ? `https://www.sefaria.org/${portion.text.sefariaPath}` : "https://www.sefaria.org/";
  link.target = "_blank";
  link.rel = "noopener";
  card.appendChild(link);

  container.appendChild(card);
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

async function init() {
  const today = startOfDay(new Date());
  document.getElementById("gregorian-date").textContent = fmtDate(today);

  try {
    const [events, hebrewDateInfo] = await Promise.all([
      loadCalendarWindow(today),
      loadHebrewDate(today).catch(() => null)
    ]);

    if (hebrewDateInfo) {
      document.getElementById("hebrew-date").textContent = hebrewDateInfo.hebrew || "";
    }

    const ctx = buildContext(today, events, hebrewDateInfo);
    const occasions = pickOccasions(ctx);

    const occContainer = document.getElementById("occasion-container");
    occContainer.innerHTML = "";
    occasions.forEach(o => renderOccasionCard(occContainer, o, ctx));

    if (ctx.erevTavshilin && ctx.isToday(ctx.erevTavshilin)) {
      const notice = el("div", "tavshilin-banner");
      notice.textContent = "Reminder: prepare Eruv Tavshilin before the holiday begins tonight, since this Yom Tov runs directly into Shabbat.";
      occContainer.prepend(notice);
    }

    const countdownContainer = document.getElementById("countdown-container");
    countdownContainer.innerHTML = "";
    renderCountdownStrip(countdownContainer, ctx);

    const torahContainer = document.getElementById("torah-container");
    torahContainer.innerHTML = "";
    const portion = await loadTorahPortion(events, today).catch(e => { console.error(e); return null; });
    renderTorahPortion(torahContainer, portion);

  } catch (err) {
    console.error(err);
    document.getElementById("occasion-container").innerHTML =
      '<p class="error">Something went wrong loading today\'s calendar data. Please check your connection and refresh.</p>';
  }
}

document.addEventListener("DOMContentLoaded", init);
