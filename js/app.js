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

/** Content fields may be a plain value or a function(ctx) => value, so a handful of
 *  entries (Selichot timing, Elul framing) can adapt to the visitor's profile. */
function resolve(field, ctx) {
  return typeof field === "function" ? field(ctx) : field;
}

function renderOccasionCard(container, occ, ctx, index) {
  const card = el("article", "occasion-card");
  card.style.animationDelay = `${index * 90}ms`;

  const headRow = el("div", "card-head");
  headRow.appendChild(iconBadge(occ.icon));
  headRow.appendChild(el("h3", null, occ.title));
  card.appendChild(headRow);

  const intro = resolve(occ.content.intro, ctx).replace("{{OMER_DAY}}", ctx.omerDay > 0 ? ctx.omerDay : "");
  card.appendChild(el("p", "intro", intro));

  const halacha = resolve(occ.content.halacha, ctx);
  if (halacha && halacha.length) {
    card.appendChild(el("h4", "section-label", "Halacha & Practice"));
    const ul = el("ul", "halacha-list");
    halacha.forEach(h => ul.appendChild(el("li", null, h)));
    card.appendChild(ul);
  }

  const customs = resolve(occ.content.customs, ctx);
  if (customs && customs.length) {
    card.appendChild(el("h4", "section-label", "Customs"));
    const ul = el("ul", "customs-list");
    customs.forEach(c => ul.appendChild(el("li", null, c)));
    card.appendChild(ul);
  }

  const beginnerNote = resolve(occ.content.beginnerNote, ctx);
  if (beginnerNote && (ctx.profile.reason === "curious" || ctx.profile.reason === "converting")) {
    const box = el("div", "beginner-note");
    box.appendChild(el("span", "beginner-note-label", "New to this? "));
    box.appendChild(el("span", null, beginnerNote));
    card.appendChild(box);
  }

  const inspiration = resolve(occ.content.inspiration, ctx);
  if (inspiration) {
    card.appendChild(el("h4", "section-label", "For Reflection"));
    card.appendChild(el("p", "inspiration", inspiration));
  }

  container.appendChild(card);
}

function renderCountdownStrip(container, today, events, onSelect) {
  const upcoming = events
    .filter(e => e.category === "holiday" || e.category === "roshchodesh")
    .filter(e => daysBetween(today, e.date) >= 0 && daysBetween(today, e.date) <= 30)
    .filter(e => !/^Erev /.test(e.title) && !/^Mevarchim/.test(e.title));
  const seen = new Set();
  const strip = el("div", "countdown-strip");
  let i = 0;
  for (const e of upcoming) {
    if (seen.has(e.title.replace(/ I{1,2}$/, ""))) continue;
    seen.add(e.title.replace(/ I{1,2}$/, ""));
    const d = daysBetween(today, e.date);
    const chip = el("button", "countdown-chip");
    chip.type = "button";
    chip.style.animationDelay = `${i * 60}ms`;
    if (d === 0) chip.classList.add("countdown-chip--today");
    chip.appendChild(el("span", "countdown-days", d === 0 ? "Today" : `${d}d`));
    chip.appendChild(el("span", "countdown-title", e.title));
    chip.title = `See the details for ${e.title}`;
    chip.addEventListener("click", () => onSelect(e.date));
    strip.appendChild(chip);
    i++;
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

  const eng = portion.text ? flattenSefaria(portion.text.english).map(stripHtml) : [];
  const heb = portion.text ? flattenSefaria(portion.text.hebrew).map(stripHtml) : [];

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
    textBox.textContent = eng.length ? eng.join(" ") : heb.join(" ");
    if (!eng.length) textBox.classList.add("torah-text--hebrew");
    card.appendChild(textBox);

    if (eng.length && heb.length) {
      engBtn.addEventListener("click", () => {
        textBox.textContent = eng.join(" ");
        textBox.classList.remove("torah-text--hebrew");
        engBtn.classList.add("lang-btn--active");
        hebBtn.classList.remove("lang-btn--active");
      });
      hebBtn.addEventListener("click", () => {
        textBox.textContent = heb.join(" ");
        textBox.classList.add("torah-text--hebrew");
        hebBtn.classList.add("lang-btn--active");
        engBtn.classList.remove("lang-btn--active");
      });
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
  titleWrap.appendChild(el("p", "torah-meta", `Right now (${prayer.window}${precise ? ", based on your location" : ", approximate — set your location for exact times"})`));
  headRow.appendChild(titleWrap);
  card.appendChild(headRow);

  card.appendChild(el("p", "intro", prayer.content.intro));

  card.appendChild(el("h4", "section-label", "Halacha & Practice"));
  const ul = el("ul", "halacha-list");
  prayer.content.halacha.forEach(h => ul.appendChild(el("li", null, h)));
  card.appendChild(ul);

  card.appendChild(el("h4", "section-label", "For Reflection"));
  card.appendChild(el("p", "inspiration", prayer.content.inspiration));

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

  card.appendChild(el("h4", "section-label", "Shopping List"));
  const shopUl = el("ul", "halacha-list");
  guide.shopping.forEach(s => shopUl.appendChild(el("li", null, s)));
  card.appendChild(shopUl);

  card.appendChild(el("h4", "section-label", "Before It Begins"));
  const prepUl = el("ul", "halacha-list");
  guide.prep.forEach(p => prepUl.appendChild(el("li", null, p)));
  card.appendChild(prepUl);

  card.appendChild(el("h4", "section-label", "What to Expect"));
  card.appendChild(el("p", "intro", guide.expectNote));

  container.appendChild(card);
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function renderProfilePill(profile) {
  const existing = document.getElementById("profile-pill");
  if (existing) existing.remove();

  const pill = el("button", "profile-pill");
  pill.id = "profile-pill";
  pill.type = "button";
  const label = profile && profile.reason
    ? `${reasonLabel(profile.reason)}${profile.community ? " · " + communityLabel(profile.community) : ""}`
    : "Personalize this page";
  pill.innerHTML = `${getIcon("book-star")}<span>${label}</span>`;
  pill.addEventListener("click", () => {
    openOnboarding((newProfile) => {
      currentProfile = newProfile;
      renderProfilePill(newProfile);
      setViewingDate(viewingDate);
    });
  });
  document.querySelector(".date-nav").insertAdjacentElement("afterend", pill);
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
  document.querySelector(".date-banner").insertAdjacentElement("afterend", banner);
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

  const torahContainer = document.getElementById("torah-container");
  torahContainer.innerHTML = "";
  const portion = await loadTorahPortion(events, date).catch(e => { console.error(e); return null; });
  renderTorahPortion(torahContainer, portion);

  const prayerContainer = document.getElementById("prayer-container");
  prayerContainer.innerHTML = "";
  if (daysBetween(realToday, date) === 0) {
    const prayerInfo = await loadPrayerCard(date).catch(e => { console.error(e); return null; });
    renderPrayerCard(prayerContainer, prayerInfo);
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

  } catch (err) {
    console.error(err);
    document.getElementById("occasion-container").innerHTML =
      '<p class="error">Something went wrong loading today\'s calendar data. Please check your connection and refresh.</p>';
  }
}

document.addEventListener("DOMContentLoaded", init);
