/**
 * timeline.js — the day as a timeline, built on the zmanim for the visitor's city.
 *
 *   buildDayTimeline(opts)  — pure: turns the day's zmanim, the daily guide and the
 *                             prayer changes into parts of the day (Waking up,
 *                             Morning, Midday, Afternoon, Evening, Bedtime), each
 *                             with timed items. No DOM, so tests.html can run it.
 *   renderTimeline(opts)    — draws the "Right now" card and the timeline, reusing
 *                             the app's existing content (prayer texts, prayer
 *                             changes, mitzvot, guide steps). Needs app.js.
 *
 * Nothing here is a date that changes from year to year: every time comes from
 * Hebcal's zmanim and timed events for the day being viewed.
 */

const TL_PARTS = [
  { key: "waking", title: "Waking up", icon: "🌅" },
  { key: "morning", title: "Morning", icon: "☀️" },
  { key: "midday", title: "Midday", icon: "🕛" },
  { key: "afternoon", title: "Afternoon", icon: "🌤️" },
  { key: "evening", title: "Evening", icon: "🌙" },
  { key: "bedtime", title: "Bedtime", icon: "🛏️" }
];

/** Where each daily-guide item goes on the timeline (by its id). Anything not
 *  listed: "today" items go in the all-day box, "tonight" items after nightfall. */
const TL_GUIDE_PLACE = {
  "chanukah-lights": "lights",
  candles: "candles",
  "eruv-tavshilin": "before-candles",
  "kabbalat-shabbat": "sunset",
  havdalah: "havdalah",
  "tisha-bav-night": "fast-night",
  "weekday-torah": "morning",
  "chanukah-day": "morning",
  shofar: "morning",
  lulav: "morning",
  "no-lulav": "morning",
  "hoshana-rabba": "morning",
  yizkor: "morning",
  "erev-pesach-day": "morning",
  tashlich: "afternoon",
  "half-shekel": "afternoon"
};

const TL_HOUR = 3600000;
const TL_MIN = 60000;

/** The day's key times as Dates. Without a city, rough clock times stand in
 *  (only to order the day and pick "now"; they're never shown as times). */
function tlZmanim(date, times, community) {
  if (times && times.sunrise && times.chatzot && times.sunset) {
    const d = (s) => (s ? new Date(s) : null);
    const chabad = community === "chabad";
    const z = {
      alot: d((chabad && times.alosBaalHatanya) || times.alotHaShachar),
      misheyakir: d(times.misheyakir),
      sunrise: d(times.sunrise),
      shma: d((chabad && times.sofZmanShmaBaalHatanya) || times.sofZmanShma),
      shmaMGA: d(times.sofZmanShmaMGA),
      tfilla: d((chabad && times.sofZmanTfilaBaalHatanya) || times.sofZmanTfilla),
      chatzot: d(times.chatzot),
      minchaG: d(times.minchaGedola),
      minchaK: d(times.minchaKetana),
      plag: d(times.plagHaMincha),
      sunset: d(times.sunset),
      tzeit: d(times.tzeit85deg || times.dusk),
      approx: false
    };
    // Halachic midnight tonight ≈ today's midday + 12 hours.
    z.midnight = new Date(z.chatzot.getTime() + 12 * TL_HOUR);
    return z;
  }
  const at = (h, m) => { const x = new Date(date); x.setHours(h, m, 0, 0); return x; };
  return {
    alot: at(5, 0), misheyakir: at(5, 30), sunrise: at(6, 30), shmaMGA: at(8, 40), shma: at(9, 15),
    tfilla: at(10, 30), chatzot: at(12, 30), minchaG: at(13, 0), minchaK: at(15, 45), plag: at(17, 0),
    sunset: at(18, 0), tzeit: at(18, 45), midnight: new Date(at(12, 30).getTime() + 12 * TL_HOUR), approx: true
  };
}

/** Formats a Date as wall-clock time in the city's own time zone (taken from the
 *  offset on Hebcal's times), so it matches the rest of the app. */
function tlCityFormatter(times) {
  const m = times && /([+-])(\d{2}):(\d{2})$/.exec(times.sunrise || "");
  return (d) => {
    if (!d) return "";
    if (!m) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const off = (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
    return new Date(d.getTime() + off * TL_MIN).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  };
}

/**
 * Builds the day.
 *  opts: { date, times, community, info (pcDayInfo), guide ({tonight,today,read}),
 *          changes ({today,tonight,season}), timed (timed Hebcal events: candles,
 *          havdalah, fast begins/ends — each with .at), fmt (Date → "7:02 AM") }
 * Returns { z, approx, allDay: [items], parts: [{key,title,icon,range,items}] }.
 */
function buildDayTimeline(opts) {
  const { date, community } = opts;
  const info = opts.info || {};
  const guide = opts.guide || { tonight: [], today: [], read: [] };
  const changes = opts.changes || { today: [], tonight: [], season: [] };
  const timed = opts.timed || [];
  const z = tlZmanim(date, opts.times, community);
  const approx = z.approx;
  const fmt = (d) => (approx || !d ? "" : opts.fmt(d));
  const minus = (d, m) => new Date(d.getTime() - m * TL_MIN);
  const dow = date.getDay();
  const shabbat = dow === 6;
  const festival = !!(info.yomTov || info.yomKippur);
  const restDay = shabbat || festival;
  const byTitle = (re) => timed.find(e => re.test(e.title || "") && e.at);
  const candleEvt = timed.find(e => e.category === "candles" && e.at);
  const havdalahEvt = timed.find(e => e.category === "havdalah" && e.at);
  const fastBegins = byTitle(/^Fast begins/);
  const fastEnds = byTitle(/^Fast ends/);

  const items = [];
  const allDay = [];
  const add = (o) => { items.push(Object.assign({ sortAt: o.start, order: items.length }, o)); };

  function partFor(t) {
    if (t < z.sunrise) return "waking";
    if (t < z.chatzot) return "morning";
    if (t < z.sunset) return "afternoon";
    return "evening";
  }

  // 1. Waking up — the morning practices from the mitzvot list.
  add({ id: "modeh-ani", part: "waking", kind: "mitzvah", mitzvah: "modeh-ani", soft: true, start: z.alot, end: z.tfilla, timeLabel: "on waking",
    title: "Modeh Ani", why: "Your first words of the day: thank you for waking up." });
  add({ id: "netilat-yadayim", part: "waking", kind: "mitzvah", mitzvah: "netilat-yadayim", soft: true, start: z.alot, end: z.tfilla,
    texts: [{ key: "asherYatzar" }],
    title: "Wash your hands (netilat yadayim)", why: "A fresh, clean start: water over each hand, three times, then the blessing al netilat yadayim — and Asher Yatzar." });
  add({ id: "shoes", part: "waking", kind: "mitzvah", mitzvah: "shoes", soft: true, start: z.alot, end: z.tfilla,
    title: "Getting dressed", why: "Even putting on shoes has a gentle order — right first, then left." });
  add({ id: "birchot", part: "waking", kind: "texts", texts: [{ key: "elokaiNeshama" }, { key: "morningTorahBlessings" }, { key: "morningBlessings" }], soft: true, start: z.alot, end: z.tfilla,
    title: "Morning blessings (Birchot HaShachar)", why: "Short thank-yous for everyday gifts — seeing, standing, getting dressed. They open Shacharit in the siddur." });

  // 2. Morning
  if (restDay) {
    add({ id: "no-tefillin", part: "morning", kind: "simple", soft: true, start: z.misheyakir, end: z.tfilla, sortAt: minus(z.misheyakir, 1),
      title: "No tefillin today", tag: shabbat ? "Shabbat" : "Yom Tov",
      why: shabbat ? "Shabbat is itself the sign between God and the Jewish people, so tefillin aren't worn." : "Like Shabbat, the festival is its own sign, so tefillin aren't worn." });
  } else if (info.tishaBav) {
    add({ id: "tefillin", part: "afternoon", kind: "mitzvah", mitzvah: "tefillin", soft: true, start: z.minchaG, end: z.sunset, sortAt: minus(z.minchaG, 1),
      timeLabel: fmt(z.minchaG), timeSmall: approx ? "" : "from", title: "Tallit and tefillin — at Mincha today", tag: "Tisha B'Av",
      why: `On Tisha B'Av they're worn at Mincha instead of the morning${approx ? "" : ` — latest: sunset (${fmt(z.sunset)})`}. Traditionally a men's mitzvah; customs vary.` });
  } else {
    add({ id: "tefillin", part: "morning", kind: "mitzvah", mitzvah: "tefillin", soft: true, start: z.misheyakir, end: z.chatzot,
      timeLabel: fmt(z.misheyakir), timeSmall: approx ? "" : "from", title: "Tallit and tefillin", tag: info.cholHamoed ? "Chol HaMoed" : null,
      why: (info.cholHamoed ? "Customs differ about tefillin on Chol HaMoed — follow your community. " : "") +
        (approx ? "Worn during Shacharit; the latest is sunset." : `From ${fmt(z.misheyakir)}, ideally during Shacharit — latest: sunset (${fmt(z.sunset)}).`) + " Traditionally a men's mitzvah; customs vary — learn with your rabbi." });
  }
  add({ id: "shema", part: "morning", kind: "mitzvah", mitzvah: "shema", start: z.alot, end: z.shma, sortAt: new Date(z.misheyakir.getTime() + 1),
    timeLabel: fmt(z.shma), timeSmall: approx ? "" : "by", title: "Say the morning Shema",
    why: approx ? "In the first part of the morning — it's inside Shacharit. Set your city for the exact deadline."
      : `By ${fmt(z.shma)} (stricter opinion: ${fmt(z.shmaMGA)}). It's inside Shacharit — if you'll pray later, say it on its own first.` });
  add({ id: "shacharit", part: "morning", kind: "prayer", prayer: "shacharit", start: z.alot, end: z.tfilla, sortAt: new Date(z.misheyakir.getTime() + 2),
    timeLabel: fmt(z.tfilla), timeSmall: approx ? "" : "by",
    title: shabbat && !festival ? "Shabbat morning prayers" : festival ? "Festival morning prayers" : "Shacharit (morning prayer)",
    why: approx ? "In the morning, ideally soon after sunrise." : `Ideally from sunrise (${fmt(z.sunrise)}); finish the Amidah by ${fmt(z.tfilla)}.`,
    changes: changes.today, season: changes.season,
    changesLabel: "Changes today" });

  // 3. Midday — anytime practices
  add({ id: "daily-mitzvah", part: "midday", kind: "daily-mitzvah", anytime: true, start: z.alot, end: z.midnight, sortAt: z.chatzot,
    timeLabel: "anytime", title: "Mitzvah of the day", why: "" });
  add({ id: "torah", part: "midday", kind: "torah", anytime: true, start: z.alot, end: z.midnight, sortAt: new Date(z.chatzot.getTime() + 1),
    timeLabel: "anytime", title: "Learn this week's Torah portion", why: "A few minutes with today's part of the parasha." });

  // 4. Afternoon
  add({ id: "mincha", part: "afternoon", kind: "prayer", prayer: "mincha", start: z.minchaG, end: z.sunset,
    timeLabel: fmt(z.minchaG), timeSmall: approx ? "" : "from", title: "Mincha (afternoon prayer)",
    why: approx ? "In the afternoon, before sunset." : `Any time from ${fmt(z.minchaG)} until sunset at ${fmt(z.sunset)} — many wait until ${fmt(z.minchaK)}.`,
    changes: [], sameAs: changes.today.map(i => i.title) });

  // 5. Evening
  add({ id: "maariv", part: "evening", kind: "prayer", prayer: "maariv", start: z.tzeit, end: z.midnight,
    timeLabel: fmt(z.tzeit), timeSmall: approx ? "" : "from",
    title: dow === 5 ? "Maariv for Shabbat" : "Maariv (evening prayer)",
    why: approx ? "After nightfall, with the evening Shema." : `After nightfall (${fmt(z.tzeit)}), with the evening Shema — ideally before ${fmt(z.midnight)}.`,
    changes: changes.tonight, changesLabel: "Changes tonight" });

  // 6. Bedtime
  add({ id: "bedtime-shema", part: "bedtime", kind: "texts", texts: [{ key: "bedtimeShema" }], soft: true, start: z.tzeit, end: new Date(z.midnight.getTime() + 2 * TL_HOUR),
    timeLabel: "before sleep", title: "Shema before sleep",
    why: "End the day as it began: the first paragraph of the Shema, and letting go of the day's hurts." });

  // The daily guide's items, each at its time.
  const candleAt = candleEvt ? candleEvt.at : minus(z.sunset, 18);
  function placeGuide(item, when) {
    const place = TL_GUIDE_PLACE[item.id] || (when === "today" ? "allday" : "night");
    const base = { id: "guide-" + item.id, kind: "guide", guide: item, title: item.title.split(" — ")[0], fullTitle: item.title, why: item.when || "" };
    if (place === "allday") { allDay.push(base); return; }
    if (place === "morning") {
      add(Object.assign(base, { part: "morning", soft: true, start: z.sunrise, end: z.chatzot, sortAt: new Date(z.tfilla.getTime() - TL_MIN) }));
    } else if (place === "afternoon") {
      add(Object.assign(base, { part: "afternoon", soft: true, start: z.minchaG, end: z.sunset, sortAt: new Date(z.minchaG.getTime() + 1) }));
    } else if (place === "candles") {
      const before = !candleEvt || candleEvt.at <= z.sunset;
      add(Object.assign(base, before
        ? { part: "afternoon", start: minus(candleAt, 60), end: candleAt, sortAt: candleAt, timeLabel: candleEvt ? fmt(candleAt) : "before sunset", timeSmall: candleEvt && !approx ? "by" : "" }
        : { part: "evening", start: candleEvt.at, end: z.midnight, sortAt: candleEvt.at, timeLabel: fmt(candleEvt.at), timeSmall: approx ? "" : "after" }));
    } else if (place === "before-candles") {
      add(Object.assign(base, { part: "afternoon", start: minus(candleAt, 120), end: candleAt, sortAt: minus(candleAt, 2), timeLabel: "before candles" }));
    } else if (place === "lights") {
      if (dow === 5) {
        add(Object.assign(base, { part: "afternoon", start: minus(candleAt, 60), end: candleAt, sortAt: minus(candleAt, 1), timeLabel: "before Shabbat candles" }));
      } else {
        const from = dow === 6 && havdalahEvt ? havdalahEvt.at : (community === "chabad" ? z.sunset : z.tzeit);
        add(Object.assign(base, { part: "evening", start: from, end: z.midnight, sortAt: new Date(from.getTime() + 1), timeLabel: fmt(from), timeSmall: approx ? "" : "from" }));
      }
    } else if (place === "sunset") {
      const from = candleEvt && candleEvt.at <= z.sunset ? candleEvt.at : z.sunset;
      add(Object.assign(base, { part: "evening", start: from, end: z.tzeit, sortAt: from, timeLabel: fmt(z.sunset) }));
    } else if (place === "havdalah") {
      const from = havdalahEvt ? havdalahEvt.at : z.tzeit;
      add(Object.assign(base, { part: "evening", start: from, end: z.midnight, sortAt: from, timeLabel: fmt(from), timeSmall: approx ? "" : "after" }));
    } else if (place === "fast-night") {
      const from = fastBegins ? fastBegins.at : z.sunset;
      add(Object.assign(base, { part: "evening", start: from, end: z.midnight, sortAt: from, timeLabel: fmt(from), tag: "Fast" }));
    } else {
      add(Object.assign(base, { part: "evening", start: z.tzeit, end: z.midnight, sortAt: new Date(z.tzeit.getTime() + 1) }));
    }
  }
  guide.today.forEach(i => placeGuide(i, "today"));
  guide.tonight.forEach(i => placeGuide(i, "tonight"));

  if (guide.read && guide.read.length) {
    add({ id: "readings", part: "morning", kind: "readings", read: guide.read, soft: true, start: z.sunrise, end: z.chatzot,
      sortAt: new Date(z.tfilla.getTime() - 2 * TL_MIN), title: guide.read.length === 1 ? guide.read[0].title : "Today's readings",
      why: guide.read.length === 1 ? (guide.read[0].steps || [])[0] || "" : guide.read.map(r => r.title.replace(/^Read: /, "")).join(" · ") });
  }

  // Fast start and end times (a fast that begins tonight is covered by the guide's
  // Tisha B'Av item or, before Yom Kippur, by candle lighting).
  const coveredNight = guide.tonight.some(i => i.id === "tisha-bav-night" || i.id === "candles");
  if (fastBegins && !(coveredNight && fastBegins.at >= z.chatzot)) {
    add({ id: "fast-begins", part: partFor(fastBegins.at), kind: "simple", start: fastBegins.at, end: fastBegins.at, point: true, sortAt: minus(fastBegins.at, 1),
      timeLabel: fmt(fastBegins.at), title: "The fast begins", tag: "Fast",
      why: "No eating or drinking from now until the fast ends. If you're unwell, pregnant or nursing, ask your rabbi — health comes first." });
  }
  if (fastEnds) {
    add({ id: "fast-ends", part: partFor(fastEnds.at), kind: "simple", start: fastEnds.at, end: fastEnds.at, point: true, sortAt: minus(fastEnds.at, 0),
      timeLabel: fmt(fastEnds.at), title: "The fast ends", tag: "Fast", why: "Pray Maariv, then break the fast gently — a drink of water first." });
  }

  const parts = TL_PARTS.map(p => {
    const list = items.filter(i => i.part === p.key).sort((a, b) => (a.sortAt - b.sortAt) || (a.order - b.order));
    let range = "";
    if (!approx) {
      if (p.key === "morning") range = `${fmt(z.misheyakir)} – ${fmt(z.chatzot)}`;
      if (p.key === "midday") range = fmt(z.chatzot);
      if (p.key === "afternoon") range = `${fmt(z.chatzot)} – ${fmt(z.sunset)}`;
      if (p.key === "evening") range = `from ${fmt(z.sunset)}`;
    }
    return Object.assign({}, p, { range, items: list });
  }).filter(p => p.items.length);

  return { z, approx, allDay, parts };
}

/** Where an item stands at `now`: "past", "current", "upcoming" or "anytime". */
function tlStatus(item, now) {
  if (item.anytime) return now < item.end ? "anytime" : "past";
  if (item.point) return item.start <= now ? "past" : "upcoming";
  if (item.end <= now) return "past";
  if (item.start <= now) return "current";
  return "upcoming";
}

/** The one thing to do now (the most urgent open item), and what comes next. */
function tlFocus(items, now, done) {
  const timed = items.filter(i => !i.anytime);
  const current = timed.filter(i => tlStatus(i, now) === "current" && !done[i.id])
    .sort((a, b) => ((a.soft ? 1 : 0) - (b.soft ? 1 : 0)) || (a.end - b.end));
  const upcoming = timed.filter(i => tlStatus(i, now) === "upcoming")
    .sort((a, b) => (a.start - b.start) || ((a.soft ? 1 : 0) - (b.soft ? 1 : 0)));
  const focus = current[0] || null;
  const target = focus || upcoming[0] || null;
  // Next: another open prayer still due today (e.g. Shacharit after the Shema), else the next to start.
  const next = current.find(i => i !== focus && !i.soft) || upcoming.find(i => i !== target && (!target || i.start > target.start)) || null;
  return { focus, target, next };
}

// ---------------------------------------------------------------------------
// Rendering (uses app.js helpers: el, renderGuideItem, renderPrayerChangeItem,
// appendMitzvahDetail, richEl, PRAYERS, goToSection, openSettings…)
// ---------------------------------------------------------------------------

const TL_DONE_KEY = "omad_timeline_done_v1";
let tlTimer = null;

/** The current time. For checking the page, "?now=2026-12-04T16:30-05:00" (with the
 *  city's UTC offset) pretends it is that moment; nothing is saved. */
function tlNow() {
  const p = typeof location !== "undefined" && new URLSearchParams(location.search).get("now");
  const d = p ? new Date(p) : null;
  return d && !isNaN(d) ? d : new Date();
}

function tlDoneAll() {
  try { return JSON.parse(localStorage.getItem(TL_DONE_KEY) || "{}") || {}; } catch (e) { return {}; }
}
function tlDoneFor(dateISO) { return tlDoneAll()[dateISO] || {}; }
function tlSetDone(dateISO, id, value) {
  const all = tlDoneAll();
  // Keep only the last week, so the list never grows.
  Object.keys(all).forEach(k => { if (k < toISO(addDays(new Date(), -7))) delete all[k]; });
  all[dateISO] = all[dateISO] || {};
  if (value) all[dateISO][id] = true; else delete all[dateISO][id];
  try { localStorage.setItem(TL_DONE_KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
}

function tlLeft(ms) {
  const m = Math.max(1, Math.round(ms / TL_MIN));
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** The "How to pray" content for Shacharit, Mincha and Maariv. */
function tlPrayerBody(item, ctx, used) {
  const box = el("div", "tl-body");
  if (item.changes && item.changes.length) {
    box.appendChild(el("h4", "section-label", item.changesLabel || "Changes today"));
    const ul = el("ul", "pc-list");
    item.changes.forEach(c => ul.appendChild(renderPrayerChangeItem(c, used, ctx.textCtx)));
    box.appendChild(ul);
  }
  if (item.season && item.season.length) {
    const d = el("details", "pc-season");
    d.appendChild(el("summary", null, "This season (said every day for now)"));
    const ul = el("ul", "pc-list");
    item.season.forEach(c => ul.appendChild(renderPrayerChangeItem(c, used, ctx.textCtx)));
    d.appendChild(ul);
    box.appendChild(d);
  }
  const prayer = PRAYERS[item.prayer];
  if (prayer) {
    const about = el("details", "tl-about");
    about.appendChild(el("summary", null, `About ${prayer.title.split(" — ")[0]}`));
    // The intros were written for "it's that time right now"; drop that opening line.
    const intro = prayer.content.intro.replace(/^It's [^.—]*(—|\.)\s*/, "");
    about.appendChild(richEl("p", "intro", intro.charAt(0).toUpperCase() + intro.slice(1), currentProfile, used));
    const ul = el("ul", "halacha-list");
    prayer.content.halacha.forEach(h => ul.appendChild(richEl("li", null, h, currentProfile, used)));
    about.appendChild(ul);
    const extras = PRAYER_EXTRAS[item.prayer] || {};
    const minhagBox = renderMinhagBox(extras.minhagim, currentProfile);
    if (minhagBox) about.appendChild(minhagBox);
    const takingOnBox = renderTakingOnBox(extras.takingOn, currentProfile, used);
    if (takingOnBox) about.appendChild(takingOnBox);
    about.appendChild(el("h4", "section-label", "For Reflection"));
    about.appendChild(richEl("p", "inspiration", prayer.content.inspiration, currentProfile, used));
    const src = sourcesEl(prayer.sources);
    if (src) about.appendChild(src);
    box.appendChild(about);
  }
  return box;
}

function tlGuideBody(guideItem, used, keepTitle) {
  const w = renderGuideItem(guideItem, used);
  if (!keepTitle) {
    const t = w.querySelector(".dg-title");
    if (t) t.remove();
    const wh = w.querySelector(".dg-when");
    if (wh) wh.remove();
  }
  return w;
}

/** The expandable part of an item, or null when it has nothing more to show. */
function tlBody(item, ctx, used) {
  if (item.kind === "prayer") return tlPrayerBody(item, ctx, used);
  if (item.kind === "texts") {
    const box = el("div", "tl-body");
    renderWords(box, item.blessings, item.texts, null);
    return box;
  }
  if (item.kind === "mitzvah") {
    const m = MITZVOT.find(x => x.id === item.mitzvah);
    if (!m) return null;
    const box = el("div", "tl-body");
    appendMitzvahDetail(box, m);
    // Extra words for this moment of the day (e.g. Asher Yatzar after washing).
    if (item.texts || item.blessings) renderWords(box, item.blessings, item.texts, "Also said now");
    return box;
  }
  if (item.kind === "daily-mitzvah" && ctx.mitzvah) {
    const box = el("div", "tl-body");
    appendMitzvahDetail(box, ctx.mitzvah);
    const more = el("a", "tl-mz-link", "More everyday mitzvot →");
    more.href = `mitzvot.html#${ctx.mitzvah.id}`;
    box.appendChild(more);
    return box;
  }
  if (item.kind === "guide") {
    const box = el("div", "tl-body");
    if (item.fullTitle !== item.title) box.appendChild(el("p", "tl-fulltitle", item.fullTitle));
    box.appendChild(tlGuideBody(item.guide, used, false));
    return box;
  }
  if (item.kind === "readings") {
    const box = el("div", "tl-body");
    item.read.forEach(r => box.appendChild(tlGuideBody(r, used, item.read.length > 1)));
    return box;
  }
  if (item.kind === "torah") {
    const box = el("div", "tl-body");
    const btn = el("button", "settings-link-btn", "Open this week's portion");
    btn.type = "button";
    btn.addEventListener("click", () => goToSection("torah-container"));
    box.appendChild(btn);
    return box;
  }
  return null;
}

function tlHowLabel(item) {
  if (item.kind === "prayer") return item.changes && item.changes.length ? "What changes today · how to pray" : "How to pray";
  if (item.kind === "torah") return "Read it";
  if (item.kind === "texts") return "The words";
  if (item.kind === "mitzvah" && MITZVOT.some(m => m.id === item.mitzvah && (m.blessings || m.texts))) return "How to do it · the words";
  const g = item.guide;
  if (g && ((g.blessings && g.blessings.length) || (g.texts && g.texts.length))) return "How to do it · the words";
  return "How to do it";
}

function tlRenderItem(item, ctx, used) {
  const li = el("li", "tl-item");
  li.id = "tl-" + item.id;
  const time = el("div", "tl-time");
  if (item.timeSmall) time.appendChild(el("small", null, item.timeSmall));
  time.appendChild(document.createTextNode(item.timeLabel || ""));
  li.appendChild(time);
  li.appendChild(el("div", "tl-dot"));

  const card = el("div", "tl-card");
  const row = el("div", "tl-row");
  const main = el("div", "tl-main");
  const h = el("h3", "tl-title", item.title);
  if (item.tag) h.appendChild(el("span", "tl-tag", item.tag));
  h.appendChild(el("span", "tl-tag tl-tag--now", "Now"));
  main.appendChild(h);

  let why = item.why;
  if (item.kind === "daily-mitzvah" && ctx.mitzvah) why = `${ctx.mitzvah.title} — ${ctx.mitzvah.subtitle}`;
  const whyEl = el("p", "tl-why", why || "");
  if (item.kind === "torah") whyEl.id = "tl-torah-why";
  if (why || item.kind === "torah") main.appendChild(whyEl);

  // Prayer changes stay visible on the card itself, not hidden in the drop-down.
  const changeTitles = item.kind === "prayer" ? (item.changes || []).map(c => c.title) : [];
  // "Atah Chonantanu tonight" reads better as "Tonight: Atah Chonantanu".
  const shortChange = (t) => (item.id === "maariv" ? t.replace(/\s*(from )?tonight$/i, "") : t);
  if (changeTitles.length) main.appendChild(el("p", "tl-changes", `${item.id === "maariv" ? "Tonight" : "Today"}: ${changeTitles.map(shortChange).join(" · ")}`));
  if (item.sameAs && item.sameAs.length) main.appendChild(el("p", "tl-changes", `Today's prayer changes (explained under Shacharit): ${item.sameAs.join(" · ")}`));

  row.appendChild(main);

  if (ctx.isToday) {
    const chk = el("button", "tl-check", "✓");
    chk.type = "button";
    chk.addEventListener("click", () => {
      const isDone = li.classList.contains("is-done");
      tlSetDone(ctx.dateISO, item.id, !isDone);
      ctx.paint();
    });
    row.appendChild(chk);
  }
  card.appendChild(row);

  // The drop-down spans the card's full width (under the tick button too),
  // so the Hebrew has room on a phone.
  const body = tlBody(item, ctx, used);
  if (body) {
    const d = el("details", "tl-how");
    d.appendChild(el("summary", null, tlHowLabel(item)));
    d.appendChild(body);
    card.appendChild(d);
  }
  li.appendChild(card);
  return li;
}

/** Draws the "Right now" card into `nowContainer` and the timeline into `container`. */
function renderTimeline({ container, nowContainer, date, isToday, times, events, guide, changes, textCtx, mitzvah, community, info }) {
  if (tlTimer) { clearInterval(tlTimer); tlTimer = null; }
  container.innerHTML = "";
  nowContainer.innerHTML = "";
  const fmt = tlCityFormatter(times);
  const day = buildDayTimeline({
    date, times, community, info, guide, changes, fmt,
    timed: (events || []).filter(e => e.at && daysBetween(e.date, date) === 0)
  });
  const used = new Set();
  const ctx = { isToday, dateISO: toISO(date), textCtx, mitzvah, paint: () => paint() };
  const all = day.parts.flatMap(p => p.items);
  const itemEls = new Map();

  // A note for those converting, as the old guide card had it.
  const blessingsShown = [...(guide ? guide.tonight : []), ...(guide ? guide.today : [])].some(i => i.blessings && i.blessings.length);
  if (blessingsShown && isConverting(currentProfile)) {
    container.appendChild(el("p", "dg-convert", "Blessings that say \"who has commanded us\": ask your rabbi whether to say them before your conversion — doing the practice itself is always welcome."));
  }

  // All-day items (Shabbat, a fast, a festival…) sit above the timeline.
  if (day.allDay.length) {
    const box = el("section", "tl-allday");
    box.appendChild(el("h2", "tl-part-title", isToday ? "☀️ All day today" : "☀️ All day"));
    day.allDay.forEach(item => {
      const card = el("div", "tl-allday-item");
      const h = el("h3", "tl-title", item.title);
      card.appendChild(h);
      if (item.why) card.appendChild(el("p", "tl-why", item.why));
      const body = tlBody(item, ctx, used);
      if (body) {
        const d = el("details", "tl-how");
        d.appendChild(el("summary", null, tlHowLabel(item)));
        d.appendChild(body);
        card.appendChild(d);
      }
      box.appendChild(card);
    });
    container.appendChild(box);
  }

  const nowLine = el("li", "tl-now-line");
  nowLine.setAttribute("aria-hidden", "true");
  nowLine.appendChild(el("span", "tl-now-time"));
  nowLine.appendChild(el("i"));
  nowLine.appendChild(el("b"));

  const partEls = [];
  day.parts.forEach(p => {
    const sec = el("section", "tl-part");
    sec.dataset.part = p.key;
    const head = el("div", "tl-part-head");
    head.appendChild(el("h2", "tl-part-title", `${p.icon} ${p.title}`));
    if (p.range) head.appendChild(el("span", "tl-part-range", p.range));
    // Once a part of the day is over it folds away, so "now" is near the top.
    const toggle = el("button", "tl-part-toggle", "Show");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      const open = sec.classList.toggle("is-expanded");
      toggle.textContent = open ? "Hide" : "Show";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    head.appendChild(toggle);
    sec.appendChild(head);
    const ul = el("ul", "tl-list");
    p.items.forEach(item => {
      const li = tlRenderItem(item, ctx, used);
      itemEls.set(item, li);
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    partEls.push({ part: p, sec, ul });
    container.appendChild(sec);
  });

  container.appendChild(el("p", "pc-review", day.approx
    ? "Times depend on your city — set it in settings for exact times. Customs differ, so check the details with your rabbi."
    : `Times for ${currentSettings.location ? currentSettings.location.name : "your city"}, calculated by Hebcal. Customs differ — check the details with your rabbi.`));
  container.appendChild(reportLink(`timeline:${toISO(date)}`));

  function showMe(item) {
    const li = itemEls.get(item);
    if (!li) return;
    const d = li.querySelector("details.tl-how");
    if (d) d.open = true;
    li.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderNow(now, done) {
    nowContainer.innerHTML = "";
    const card = el("div", "now-card");
    card.setAttribute("aria-live", "polite");
    if (!isToday) {
      card.classList.add("now-card--plain");
      const ahead = daysBetween(realToday, date) > 0;
      card.appendChild(el("div", "now-label", ahead ? "Looking ahead" : "Looking back"));
      card.appendChild(el("div", "now-title", `The plan for ${date.toLocaleDateString(undefined, { weekday: "long" })}`));
      card.appendChild(el("div", "now-time", day.approx ? "Set your city to see the exact times." : `Times for ${currentSettings.location.name}`));
      nowContainer.appendChild(card);
      return;
    }
    const { focus, target, next } = tlFocus(all, now, done);
    if (focus) {
      card.appendChild(el("div", "now-label", "Right now"));
      card.appendChild(el("div", "now-title", focus.title));
      if (!day.approx) card.appendChild(el("div", "now-time", `Until ${fmt(focus.end)} · ${tlLeft(focus.end - now)} left`));
    } else if (target) {
      card.appendChild(el("div", "now-label", "Nothing due right now"));
      card.appendChild(el("div", "now-title", `Next: ${target.title}`));
      if (!day.approx) card.appendChild(el("div", "now-time", `At ${fmt(target.start)} · in ${tlLeft(target.start - now)}`));
    } else {
      card.appendChild(el("div", "now-label", "The day is done"));
      card.appendChild(el("div", "now-title", "Good night — layla tov"));
    }
    const actions = el("div", "now-actions");
    if (target) {
      const show = el("button", "now-btn now-btn--primary", "Show me how");
      show.type = "button";
      show.addEventListener("click", () => showMe(target));
      actions.appendChild(show);
    }
    if (focus) {
      const b = el("button", "now-btn", "✓ Done");
      b.type = "button";
      b.addEventListener("click", () => { tlSetDone(ctx.dateISO, focus.id, true); paint(); });
      actions.appendChild(b);
    }
    if (day.approx) {
      const city = el("button", "now-btn", "Set your city for exact times");
      city.type = "button";
      city.addEventListener("click", openSettings);
      actions.appendChild(city);
    }
    if (actions.children.length) card.appendChild(actions);
    if (next) card.appendChild(el("div", "now-next", `Then: ${next.title}${day.approx ? "" : next.start <= now ? ` · by ${fmt(next.end)}` : ` · ${fmt(next.start)}`}`));
    nowContainer.appendChild(card);
  }

  function paint() {
    const now = tlNow();
    const done = isToday ? tlDoneFor(ctx.dateISO) : {};
    const { focus } = isToday ? tlFocus(all, now, done) : { focus: null };
    nowLine.remove();
    let placed = false;
    partEls.forEach(({ part, sec, ul }) => {
      let allPast = isToday;
      part.items.forEach(item => {
        const li = itemEls.get(item);
        let st = isToday ? tlStatus(item, now) : "plain";
        if (st === "current" && item !== focus) st = "open";
        if (st !== "past") allPast = false;
        li.className = `tl-item tl-item--${st}${done[item.id] ? " is-done" : ""}${item.anytime ? " tl-item--any" : ""}`;
        const chk = li.querySelector(".tl-check");
        if (chk) {
          chk.setAttribute("aria-pressed", done[item.id] ? "true" : "false");
          chk.setAttribute("aria-label", `${done[item.id] ? "Mark not done" : "Mark done"}: ${item.title}`);
        }
        if (isToday && !placed && (st === "current" || st === "upcoming")) {
          nowLine.querySelector(".tl-now-time").textContent = day.approx ? "" : fmt(now);
          ul.insertBefore(nowLine, li);
          placed = true;
        }
      });
      sec.classList.toggle("tl-part--past", allPast);
    });
    renderNow(now, done);
  }

  paint();
  if (isToday) tlTimer = setInterval(paint, 60000);
}
