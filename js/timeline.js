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

/** Short notes for the Shema before sleep: when its closing blessing, Hamapil, is
 *  said, by community (community key from pcCommunityKey, or null = show both). The
 *  Shema itself has no clock deadline. `midnight` is halachic midnight ("11:43 PM"),
 *  or "" when the city isn't set. */
function tlBedtimeNotes(community, midnight) {
  const mid = midnight ? `halachic midnight (${midnight})` : "halachic midnight";
  const ashk = "Hamapil, the closing blessing, is said with Hashem's name at any hour of the night, until dawn.";
  const seph = `Going to sleep after ${mid}? Many Sephardim say Hamapil without Hashem's name.`;
  const notes = [];
  if (community === "ashkenazi") notes.push(ashk + " After dawn, it isn't said.");
  else if (community === "sephardi") notes.push(seph + " After dawn, Hamapil isn't said.");
  else notes.push(`Hamapil, the closing blessing: Ashkenazim say it with Hashem's name at any hour of the night, until dawn. After ${mid}, many Sephardim say it without Hashem's name. After dawn, it isn't said.`);
  notes.push(`Missed the evening Shema at Maariv? Have it in mind with the first paragraph — ideally before ${mid}.`);
  notes.push("Ask your rabbi which applies to you.");
  return notes;
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

  // Time-bound items (prayers, the Shema, tefillin) show "From" at the top of the
  // time column and "By / Until / Latest" at the bottom; the Now marker moves between.
  const win = (start, end, endWord) => approx ? {} : { window: true, timeSmall: "from", timeLabel: fmt(start), endSmall: endWord, endLabel: fmt(end) };

  // 1. Waking up — the morning practices from the mitzvot list. They are said on
  // waking and have no countdown (noDeadline); their "end" (Shacharit's latest time)
  // only decides when this part of the day folds away.
  add({ id: "modeh-ani", part: "waking", kind: "mitzvah", noDeadline: true, neverFocus: true, mitzvah: "modeh-ani", soft: true, start: z.alot, end: z.tfilla, timeLabel: "on waking",
    title: "Modeh Ani", why: "Your first words of the day: thank you for waking up." });
  add({ id: "netilat-yadayim", part: "waking", kind: "mitzvah", noDeadline: true, neverFocus: true, mitzvah: "netilat-yadayim", soft: true, start: z.alot, end: z.tfilla,
    title: "Wash your hands (netilat yadayim)", why: "A fresh, clean start: water over each hand, three times, then the blessing al netilat yadayim." });
  // Its own box: Asher Yatzar is said after using the bathroom — in the morning, after washing.
  add({ id: "asher-yatzar", part: "waking", kind: "texts", texts: [{ key: "asherYatzar" }], noDeadline: true, neverFocus: true, soft: true, start: z.alot, end: z.tfilla,
    title: "Asher Yatzar", why: "Thanking God for a body that works as it should — said after using the bathroom, and in the morning right after washing." });
  add({ id: "shoes", part: "waking", kind: "mitzvah", noDeadline: true, neverFocus: true, mitzvah: "shoes", soft: true, start: z.alot, end: z.tfilla,
    title: "Getting dressed", why: "Even putting on shoes has a gentle order — right first, then left." });
  add({ id: "birchot", part: "waking", kind: "texts", noDeadline: true, neverFocus: true, texts: [{ key: "elokaiNeshama" }, { key: "morningTorahBlessings" }, { key: "morningBlessings" }], soft: true, start: z.alot, end: z.tfilla,
    title: "Morning blessings (Birchot HaShachar)", why: "Short thank-yous for everyday gifts — seeing, standing, getting dressed. They open Shacharit in the siddur; if you missed them, many say them until midday — ask your rabbi." });

  // 2. Morning
  if (restDay) {
    add({ id: "no-tefillin", part: "morning", kind: "simple", soft: true, start: z.misheyakir, end: z.tfilla, sortAt: minus(z.misheyakir, 1),
      title: "No tefillin today", tag: shabbat ? "Shabbat" : "Yom Tov",
      why: shabbat ? "Shabbat is itself the sign between God and the Jewish people, so tefillin aren't worn." : "Like Shabbat, the festival is its own sign, so tefillin aren't worn." });
  } else if (info.tishaBav) {
    add({ id: "tefillin", part: "afternoon", kind: "mitzvah", mitzvah: "tefillin", soft: true, skippable: true, missedNote: "The time for tallit and tefillin passed today — they're worn by day.", start: z.minchaG, end: z.sunset, sortAt: minus(z.minchaG, 1),
      timeLabel: fmt(z.minchaG), timeSmall: approx ? "" : "from", ...win(z.minchaG, z.sunset, "latest"), title: "Tallit and tefillin — at Mincha today", tag: "Tisha B'Av",
      why: "On Tisha B'Av they're worn at Mincha instead of the morning. Traditionally a men's mitzvah; customs vary." });
  } else {
    // Open until sunset (the latest time); if not done by the end of the morning it
    // follows you through the day (carry), and "Not for me" puts it aside (skippable).
    // Ideally put on before Shacharit and worn during it (idealEnd): until then it sits
    // above Shacharit with the same bright "Now" box.
    add({ id: "tefillin", part: "morning", kind: "mitzvah", mitzvah: "tefillin", soft: true, carry: true, skippable: true, start: z.misheyakir, end: z.sunset,
      idealEnd: z.tfilla, idealNote: "ideally before Shacharit",
      missedNote: "The time for tallit and tefillin passed today — they're worn by day.",
      timeLabel: fmt(z.misheyakir), timeSmall: approx ? "" : "from", ...win(z.misheyakir, z.sunset, "latest"), title: "Tallit and tefillin", tag: info.cholHamoed ? "Chol HaMoed" : null,
      why: (info.cholHamoed ? "Customs differ about tefillin on Chol HaMoed — follow your community. " : "") +
        (approx ? "Ideally put on before Shacharit and worn during it; the latest is sunset." : "Ideally put on before Shacharit and worn during it.") + " Traditionally a men's mitzvah; customs vary — learn with your rabbi." });
  }
  // The Shema: the label shows the latest time it can still be said (with its blessings,
  // until Shacharit's latest time); the best time (due) is a gentle note on the card.
  add({ id: "shema", part: "morning", kind: "mitzvah", mitzvah: "shema", start: z.alot, due: z.shma, end: z.tfilla, sortAt: new Date(z.misheyakir.getTime() + 1),
    timeLabel: fmt(z.tfilla), timeSmall: approx ? "" : "latest", ...win(z.alot, z.tfilla, "latest"), title: "Say the morning Shema",
    why: approx ? "In the first part of the morning — it's inside Shacharit. Set your city for the exact times."
      : "It's inside Shacharit — if you'll pray later, say it on its own first.",
    bestNote: approx ? "" : `Best by ${fmt(z.shma)} — the time for the mitzvah of the Shema (stricter opinion: ${fmt(z.shmaMGA)}).`,
    lateNote: approx ? "The best time has passed — you can still say it with its blessings until the latest time shown."
      : `The best time (${fmt(z.shma)}) has passed — you can still say it with its blessings until ${fmt(z.tfilla)}.`,
    lateShort: "best time passed, still open",
    missedNote: "The time for the Shema passed today. It's still good to say it (without its blessings) — ask your rabbi." });
  // Shacharit: the label shows the latest time (midday); the best time for the Amidah
  // (due) is a gentle note. Missed, it's made up at Mincha (see the note there).
  add({ id: "shacharit", part: "morning", kind: "prayer", prayer: "shacharit", start: z.alot, due: z.tfilla, end: z.chatzot,
    bestNote: approx ? "" : `Best: finish the Amidah by ${fmt(z.tfilla)}.`,
    lateNote: approx ? "The best time has passed — you can still pray Shacharit until midday." : `The best time (${fmt(z.tfilla)}) has passed — you can still pray until ${fmt(z.chatzot)}.`,
    lateShort: "best time passed, still open",
    missedNote: "The time for Shacharit passed today. Many make it up at Mincha — see the note there.", sortAt: new Date(z.misheyakir.getTime() + 2),
    timeLabel: fmt(z.chatzot), timeSmall: approx ? "" : "latest", ...win(z.alot, z.chatzot, "latest"),
    title: shabbat && !festival ? "Shabbat morning prayers" : festival ? "Festival morning prayers" : "Shacharit (morning prayer)",
    why: approx ? "In the morning, ideally soon after sunrise." : `Ideally from sunrise (${fmt(z.sunrise)}).`,
    changes: changes.today, season: changes.season,
    changesLabel: "Changes today" });

  // 3. Midday — anytime practices
  add({ id: "daily-mitzvah", part: "midday", kind: "daily-mitzvah", anytime: true, skippable: true, start: z.alot, end: z.midnight, sortAt: z.chatzot,
    timeLabel: "anytime", title: "Mitzvah of the day", why: "" });
  add({ id: "torah", part: "midday", kind: "torah", anytime: true, skippable: true, start: z.alot, end: z.midnight, sortAt: new Date(z.chatzot.getTime() + 1),
    timeLabel: "anytime", title: "Learn this week's Torah portion", why: "A few minutes with today's part of the parasha." });
  // The quiz, after the two it asks about (app.js fills it in).
  add({ id: "quiz", part: "midday", kind: "quiz", anytime: true, skippable: true, start: z.alot, end: z.midnight, sortAt: new Date(z.chatzot.getTime() + 2),
    timeLabel: "anytime", title: "🏆 Test yourself", why: "A few quick questions on today's mitzvah and Torah portion — just for fun." });

  // 4. Afternoon
  add({ id: "mincha", part: "afternoon", kind: "prayer", prayer: "mincha", start: z.minchaG, end: z.sunset,
    makeupFor: "shacharit", makeupNote: "Missed Shacharit today? Many make it up now: say the Amidah of Mincha twice — ask your rabbi.",
    missedNote: "The time for Mincha passed today. Many make it up at Maariv — see the note there.",
    timeLabel: fmt(z.minchaG), timeSmall: approx ? "" : "from", ...win(z.minchaG, z.sunset, "until"), title: "Mincha (afternoon prayer)",
    why: approx ? "In the afternoon, before sunset." : `Any time until sunset — many wait until ${fmt(z.minchaK)}.`,
    changes: [], sameAs: changes.today.map(i => i.title) });

  // 5. Evening
  add({ id: "maariv", part: "evening", kind: "prayer", prayer: "maariv", start: z.tzeit, due: z.midnight, end: new Date(z.alot.getTime() + 24 * TL_HOUR),
    bestNote: approx ? "" : `Best before halachic midnight (${fmt(z.midnight)}).`,
    lateNote: approx ? "The best time (before midnight) has passed — you can still say Maariv until dawn." : `The best time (before ${fmt(z.midnight)}) has passed — you can still say Maariv until dawn.`,
    lateShort: "best time passed, still open",
    makeupFor: "mincha", makeupNote: "Missed Mincha today? Many make it up now: say the Amidah of Maariv twice — ask your rabbi.",
    timeLabel: fmt(z.tzeit), timeSmall: approx ? "" : "from", ...win(z.tzeit, new Date(z.alot.getTime() + 24 * TL_HOUR), "until dawn"),
    title: dow === 5 ? "Maariv for Shabbat" : "Maariv (evening prayer)",
    why: "After nightfall, with the evening Shema.",
    changes: changes.tonight, changesLabel: "Changes tonight" });

  // 6. Bedtime. The Shema itself has no clock deadline: it is said whenever you go
  // to sleep, so it shows no countdown (noDeadline) and stays open until dawn. Its
  // closing blessing, Hamapil, does depend on the time, by community (see the note).
  add({ id: "bedtime-shema", part: "bedtime", kind: "texts", texts: [{ key: "bedtimeShema" }], soft: true, noDeadline: true, nowLabel: "Before you sleep",
    start: z.tzeit, end: new Date(z.alot.getTime() + 24 * TL_HOUR),
    timeLabel: "before sleep", title: "Shema before sleep",
    why: "End the day as it began: the first paragraph of the Shema, and letting go of the day's hurts.",
    notes: tlBedtimeNotes(community, approx ? "" : fmt(z.midnight)) });

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

  tlApplyTone(items, allDay, opts.profile || null);
  tlApplyNusach(items, allDay, opts.profile || null, info);
  tlApplyGender(items, allDay, opts.profile || null);
  tlApplyFamily(items, allDay, opts.profile || null);

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

// ---------------------------------------------------------------------
// Men's and women's practices
// ---------------------------------------------------------------------

/** Practices that are traditionally men's (by timeline id). */
const TL_FOR_MEN = new Set(["tefillin", "no-tefillin"]);

/** Notes for women, by timeline id. Exempt-but-welcome practices say so warmly;
 *  practices women are fully obligated in say that too — many people don't know. */
const TL_WOMEN_NOTES = {
  shema: "For women: the morning Shema is tied to a set time, so women aren't obligated — but many say it, and saying at least the first verse (Shema Yisrael…) is widely encouraged.",
  shacharit: "For women: women pray every day too. Many say Shacharit and Mincha; at the least, a short prayer in your own words — praise, a request and thanks. Customs differ, so ask your rabbi.",
  mincha: "For women: many women say Mincha as well as Shacharit — customs differ, so ask your rabbi.",
  maariv: "For women: Maariv was traditionally not taken on by women as an obligation — it's welcome if you'd like to say it.",
  "guide-shofar": "For women: hearing the shofar is tied to a set time, so women are exempt — but almost all women come to hear it, and it's a cherished custom. Can't get to synagogue? Many communities arrange a blowing nearby.",
  "guide-lulav": "For women: exempt (it's tied to a set time), but many take the lulav. Ashkenazi women usually say the blessing; Sephardi women usually take it without the blessing.",
  "guide-sukkah-night": "For women: exempt from eating in the sukkah, but very welcome to — many do, with the blessing (Ashkenazi custom) or without it (Sephardi custom).",
  "guide-sukkah-day": "For women: exempt from eating in the sukkah, but very welcome to — many do, with the blessing (Ashkenazi custom) or without it (Sephardi custom).",
  "guide-count-omer": "For women: exempt (it's tied to a set time). Many women count anyway, and some count without the blessing — ask your rabbi.",
  "guide-chanukah-lights": "For women: this one is fully yours too — women are obligated in the Chanukah lights, because women were part of the miracle.",
  "guide-megillah-night": "For women: fully yours too — women are obligated to hear the Megillah, because women were part of the miracle (Esther above all).",
  "guide-purim-day": "For women: the Megillah, gifts of food, gifts to the poor and the festive meal are all fully women's mitzvot too.",
  "guide-kiddush": "For women: women are fully obligated in Kiddush, just like men — and can say it for the whole table.",
  "guide-seder": "For women: every mitzvah of the Seder — matzah, four cups, maror, telling the story — is fully women's too, because women were part of the Exodus."
};

/** Candle lighting, by who's reading. */
const TL_CANDLE_NOTES = {
  female: "A special mitzvah given to women — bringing light and peace (shalom bayit) into the home. Many add a personal prayer for their family right after lighting.",
  male: "Usually lit by the woman of the home. If you live alone (or she's away), you light yourself — and anyone can help by setting up the candles.",
  both: "Traditionally lit by the woman of the home — a special mitzvah given to women. Anyone living alone lights for themselves."
};

// ---------------------------------------------------------------------
// Tone, by "what brings you here"
// ---------------------------------------------------------------------

/** "What is this?" — one line for those who are curious (nothing assumed). */
const TL_WHAT_IS = {
  "modeh-ani": "A one-line thank-you said the moment you wake up, before anything else.",
  "netilat-yadayim": "Washing your hands in a set way to start the day fresh — a cup, water, and a short blessing.",
  "asher-yatzar": "A blessing of thanks for a healthy body, said after using the bathroom.",
  shoes: "Even getting dressed has small Jewish customs — a way of noticing everyday things.",
  birchot: "A string of short thank-yous for everyday gifts: seeing, standing, waking up free.",
  tefillin: "Two small black boxes with Torah verses, bound on the arm and head during weekday morning prayer.",
  shema: "The central Jewish declaration of faith — \"Hear, Israel: the Lord is our God, the Lord is One.\"",
  shacharit: "The morning prayer — the first of three daily prayers, at the heart of a Jewish day.",
  mincha: "The short afternoon prayer — a few quiet minutes with God in the middle of the day.",
  maariv: "The evening prayer, said after dark.",
  "daily-mitzvah": "A mitzvah is a commandment — and also, people say, a good deed. Here's one to learn today.",
  torah: "Each week, Jews everywhere read the same part of the Torah (the Five Books of Moses). Here's today's piece.",
  "bedtime-shema": "A short prayer before sleep: the first line of the Shema, and letting go of the day."
};

/** Changes how items are worded, by the visitor's reason (the content stays the same). */
function tlApplyTone(items, allDay, profile) {
  const tone = typeof toneOf === "function" ? toneOf(profile) : null;
  if (!tone) return;
  items.forEach(it => {
    if (tone === "jewish-reminders") {
      // Short: what to do, and when — the background stays in the drop-down.
      if (!["daily-mitzvah", "torah", "quiz"].includes(it.kind)) it.why = "";
    }
    if (tone === "jewish-reconnecting") {
      if (it.missedNote) it.missedNote = "No worries — the time for this passed today. Tomorrow is a new day, whenever you're ready.";
      if (it.lateNote) it.lateNote = it.lateNote.replace(/^The best time[^—]*— you can still/, "There's still time — you can");
      if (!it.anytime) it.skippable = true;
    }
    if (tone === "converting" && it.id === "tefillin") {
      it.notes = [...(it.notes || []), "While converting: tallit and tefillin are usually begun after the conversion — ask your rabbi when to start. Learning how now is a great step."];
      it.skippable = true;
    }
    if (tone === "converted" && it.id === "shacharit") {
      it.notes = [...(it.notes || []), "\"God of our fathers\" — Abraham, Isaac and Jacob are your ancestors too. As the Rambam wrote to Ovadia the convert, say it just as every Jew does."];
    }
    if (tone === "curious" && TL_WHAT_IS[it.id]) it.whatIs = TL_WHAT_IS[it.id];
  });
  if (tone === "converting") {
    [...items, ...allDay].filter(it => it.id === "guide-candles" || it.id === "guide-shabbat-day").forEach(it => {
      it.notes = [...(it.notes || []), "While converting: Shabbat is a beautiful thing to begin now. Many rabbis also ask those in the process to keep one small part of it differently until the conversion — ask yours what that should be."];
    });
  }
}

/** Days in a row (up to a week) with at least one thing ticked, ending today. */
function tlStreak() {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const done = tlDoneFor(toISO(addDays(new Date(), -i)));
    if (Object.keys(done).length) n++; else break;
  }
  return n;
}

/** The cheer for finishing a part of the day, in the visitor's tone. */
function tlCheerLine(key) {
  const tone = typeof toneOf === "function" ? toneOf(currentProfile) : null;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  if (tone === "jewish-reminders") {
    return ({ waking: "Waking up", morning: "Morning", midday: "Midday", afternoon: "Afternoon", evening: "Evening", bedtime: "Bedtime" }[key] || "This part") + " — done ✓";
  }
  if (tone === "jewish-reconnecting") return pick(["Beautiful — one step is plenty ✨", "That was a real step. Well done 🌱", "Lovely. Little by little is how it's done 🌿"]);
  if (tone === "curious") return pick(["You tried something new today ✨", "A little Jewish practice — done 🌟", "Look at you, learning by doing ✨"]);
  const line = pick(TL_CHEERS[key] || TL_CHEERS.default);
  if (tone === "jewish-growing") {
    const n = tlStreak();
    if (n >= 2) return `${line} · ${n === 7 ? "A full week in a row!" : `That's ${n} days in a row!`}`;
  }
  return line;
}

// ---------------------------------------------------------------------
// Prayer tradition (nusach): your custom, on the timeline
// ---------------------------------------------------------------------

/** Where communities differ, by timeline id. Each entry: the nusachs it's for,
 *  the text, and `women` for notes only shown with women's practices. */
const TL_NUSACH_NOTES = {
  "guide-candles": [
    { for: ["ashkenaz", "sefard", "chabad"], text: "Light first, then cover your eyes and say the blessing — then uncover them and look at the lights." },
    { for: ["sephardi"], text: "Many Sephardim say the blessing first and then light (some families light first, as Ashkenazim do) — follow your family's way." }
  ],
  "guide-chanukah-lights": [
    { for: ["ashkenaz", "sefard"], text: "Each person in the home — often each child — lights their own menorah; a wife is usually included in her husband's lighting." },
    { for: ["sephardi"], text: "One menorah for the whole household, lit by the head of the home, adding a light each night." },
    { for: ["chabad"], text: "Every male, even young boys, lights his own menorah; women and girls are included in the household's lighting. The menorah stands indoors, by a doorway, opposite the mezuzah." }
  ],
  "guide-count-omer": [
    { for: ["ashkenaz"], text: "Said \"…ba'Omer\" (בעמר), as in most Ashkenazi siddurim." },
    { for: ["sefard", "sephardi", "chabad"], text: "Said \"…la'Omer\" (לעמר), following the Arizal." }
  ],
  "guide-lulav": [
    { women: true, for: ["ashkenaz", "sefard", "chabad"], text: "Women who take the lulav usually say the blessing too." },
    { women: true, for: ["sephardi"], text: "Women who take the lulav usually do so without the blessing." }
  ],
  "guide-sukkah-night": [
    { women: true, for: ["ashkenaz", "sefard", "chabad"], text: "Women who eat in the sukkah usually say \"leishev basukkah\" too." },
    { women: true, for: ["sephardi"], text: "Women who eat in the sukkah usually do so without the blessing." }
  ]
};
const TL_PESACH_NOTES = [
  { for: ["ashkenaz"], text: "No kitniyot (rice, corn, beans, lentils and similar) all Pesach." },
  { for: ["sefard"], text: "No kitniyot all Pesach; many Chassidim also avoid gebrochts — matzah that has touched liquid (so no matzah balls)." },
  { for: ["chabad"], text: "No kitniyot, and no gebrochts — matzah is kept away from liquid — until the last day outside Israel, when it's eaten on purpose." },
  { for: ["sephardi"], text: "Many Sephardim eat kitniyot (rice, legumes) on Pesach — customs differ by family (many Moroccans avoid rice, for example). Check them carefully for chametz first." }
];
TL_NUSACH_NOTES["guide-erev-pesach-day"] = TL_PESACH_NOTES;
TL_NUSACH_NOTES["guide-pesach-chm"] = TL_PESACH_NOTES;
TL_NUSACH_NOTES["guide-sukkah-day"] = TL_NUSACH_NOTES["guide-sukkah-night"];

const TL_NUSACHS = ["ashkenaz", "sefard", "sephardi", "chabad"];

/** Which custom notes to show: the visitor's own, or all side by side
 *  ("Not sure" / "Other" / "Show me everything"), or none (no answer). */
function tlNusachPick(entries, profile) {
  const n = profile && profile.nusach;
  if (TL_NUSACHS.includes(n) && !(profile && profile.showAll)) return entries.filter(e => e.for.includes(n));
  if (n || (profile && profile.showAll)) return entries;
  return [];
}

/** No tefillin on Chol HaMoed: everyone in Israel, and Chassidim, Sephardim
 *  and Chabad everywhere. (Many Ashkenazim outside Israel do wear them.) */
function tlNoTefillinOnCholHamoed(profile, israel) {
  const n = profile && profile.nusach;
  return !!israel || ["sefard", "sephardi", "chabad"].includes(n);
}

function tlApplyNusach(items, allDay, profile, info) {
  if (typeof COMMUNITY_LABELS === "undefined") return; // community-days.js not loaded (tests)
  const israel = typeof isInIsrael === "function" && typeof currentSettings !== "undefined" ? isInIsrael(currentSettings) : false;
  const n = profile && profile.nusach;
  const label = (e) => e.for.map(k => COMMUNITY_LABELS[k]).join(", ").replace(/, ([^,]*)$/, " & $1") + " custom";
  const women = typeof genderShow === "function" ? genderShow("female", profile) : "label";

  // Tefillin on Chol HaMoed.
  const ti = items.findIndex(it => it.id === "tefillin");
  if (ti >= 0 && info && info.cholHamoed) {
    const it = items[ti];
    if (tlNoTefillinOnCholHamoed(profile, israel)) {
      items[ti] = { id: "no-tefillin", part: "morning", kind: "simple", soft: true, start: it.start, end: it.idealEnd || it.end,
        sortAt: new Date(it.start.getTime() - 60000), order: it.order, title: "No tefillin today", tag: "Chol HaMoed",
        why: israel ? "In Israel, tefillin aren't worn on Chol HaMoed — the festival itself is the sign." : "Your community doesn't wear tefillin on Chol HaMoed — the festival itself is the sign.",
        notes: israel || !TL_NUSACHS.includes(n) ? [] : [{ nusach: [n], label: COMMUNITY_LABELS[n] + " custom", text: "Many Ashkenazim outside Israel do wear them — a difference of custom, not of right and wrong." }] };
    } else {
      it.why = it.why.replace("Customs differ about tefillin on Chol HaMoed — follow your community. ", "");
      const picks = tlNusachPick([
        { for: ["ashkenaz"], text: "Many Ashkenazim outside Israel wear tefillin on Chol HaMoed — some without the blessing, some saying it quietly — and many don't. Follow your family or shul." },
        { for: ["sefard", "sephardi", "chabad"], text: "Not worn on Chol HaMoed (nor by anyone in Israel)." }
      ], profile);
      it.notes = [...(it.notes || []), ...picks.map(e => ({ nusach: e.for, label: label(e), text: e.text }))];
    }
  }

  [...items, ...allDay].forEach(it => {
    const entries = TL_NUSACH_NOTES[it.id];
    if (!entries) return;
    const picks = tlNusachPick(entries.filter(e => !e.women || women), profile);
    if (!picks.length) return;
    it.notes = [...(it.notes || []), ...picks.map(e => ({ nusach: e.for, label: label(e), text: e.text }))];
  });
}

/** The candle-lighting note, by gender and (when given) marriage. */
function tlCandleNote(profile) {
  const view = genderView(profile);
  const married = profile ? profile.married : null;
  if (married === true && view === "female") return { family: "married", text: "You light for the whole household — a special mitzvah given to women. Many add one candle for each child." };
  if (married === true && view === "male") return { family: "married", text: "Your wife's lighting includes you. If she's away, you light, with the blessing — and you can help by setting up the candles." };
  if (married === false && view === "female") return "A mitzvah of your own: living on your own, you light for yourself, with the blessing. (At your parents', many include daughters in their mother's lighting.)";
  if (married === false && view === "male") return "Living on your own, you light yourself, with the blessing. (At your parents', your mother's lighting includes you.)";
  return TL_CANDLE_NOTES[view];
}

/** Holiday tips for families with children (by timeline id). */
const TL_KIDS_TIPS = {
  "guide-candles": "Some families have girls light a candle of their own (the Chabad custom, from age 3); others include daughters in their mother's lighting. Either way, let the kids watch and answer \"Amen\".",
  "guide-chanukah-lights": "Let each child light their own menorah (or help light yours), then play dreidel with chocolate gelt and sing Maoz Tzur together.",
  "guide-megillah-night": "Costumes on! Give the kids a noisemaker (grogger) to drown out Haman's name every time it's read.",
  "guide-purim-day": "Let the kids deliver the gifts of food (mishloach manot) to friends and neighbors, and put the coins for the poor in the box themselves.",
  "guide-seder": "The youngest asks the Four Questions; hide the afikoman for the kids to find (and \"ransom\"); hand out small treats for good questions to keep them awake.",
  "guide-sukkah-night": "Let the kids decorate the sukkah — paper chains, drawings, fruit — and tell stories in it after dinner.",
  "guide-shofar": "Many synagogues hold a short children's shofar blowing in the afternoon — easier for little ones than the long service.",
  "guide-havdalah": "Let a child hold the braided candle up high, and pass the spices around for everyone to smell.",
  "guide-count-omer": "Make a counting chart for the fridge and let the kids cross off each day after the count."
};

/** Adds married and children content (see familyShow): Eishet Chayil, blessing the
 *  children, a shalom bayit thought, and holiday tips for families with kids. */
function tlApplyFamily(items, allDay, profile) {
  if (typeof familyShow !== "function") return; // personalize.js not loaded (tests)
  const married = familyShow("married", profile);
  const kids = familyShow("kids", profile);
  const grown = familyShow("grown", profile);
  [...items, ...allDay].forEach(it => {
    const add = (n) => { it.notes = [...(it.notes || []), n]; };
    if (it.id === "guide-kiddush" && it.guide) {
      const texts = [...(it.guide.texts || [])];
      const shabbat = texts.some(t => t.key === "shalomAleichem");
      let at = shabbat ? 1 : 0;
      if (shabbat && married) {
        texts.splice(at++, 0, { key: "eishetChayil" });
        add({ family: "married", text: "After Shalom Aleichem, many husbands sing Eishet Chayil (\"A woman of valor\") to their wives — a weekly thank-you. The words are below." });
      }
      if (kids || grown) texts.splice(at, 0, { key: "blessingChildren" });
      if (kids) add({ family: "kids", text: "Before Kiddush, bless each child with your hands on their head — the words are below. Many add a few words of their own about the child's week." });
      if (grown) add({ family: "grown", text: "Many parents bless their grown children by phone before Shabbat or the festival — the same words, below." });
      if (shabbat && married) add({ family: "married", text: "A thought for the table: Shabbat candles are lit for shalom bayit, peace in the home. Tonight, tell each other one thing you appreciated this week." });
      it.guide = { ...it.guide, texts };
    }
    if (kids && TL_KIDS_TIPS[it.id]) add({ family: "kids", text: TL_KIDS_TIPS[it.id] });
  });
}

/** A card note: plain text, or { family, text } with its "Married" / "With children" label. */
function tlNoteEl(n) {
  if (typeof n === "string") return el("p", null, n);
  const p = el("p", "tl-note-family");
  p.appendChild(n.nusach ? communityTag(n.label, n.nusach, currentProfile) : familyTag(n.family, currentProfile));
  p.appendChild(document.createTextNode(n.text));
  return p;
}

/** Hides, labels or adds notes to items by the visitor's gender (see genderShow). */
function tlApplyGender(items, allDay, profile) {
  if (typeof genderView !== "function") return; // personalize.js not loaded (tests)
  const view = genderView(profile);
  const women = genderShow("female", profile);
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (TL_FOR_MEN.has(it.id)) {
      const show = genderShow("male", profile);
      if (!show) { items.splice(i, 1); continue; }
      if (show === "label") it.genderTag = "For men";
      if (view === "male" && it.why) it.why = it.why.replace(/ ?Traditionally a men's mitzvah; customs vary( — learn with your rabbi)?\./, " Learn how with your rabbi — it takes a few minutes.");
    }
  }
  [...items, ...allDay].forEach(it => {
    const add = (n) => { it.notes = [...(it.notes || []), n]; };
    if (it.id === "guide-candles") add(tlCandleNote(profile));
    if (women && TL_WOMEN_NOTES[it.id]) add(TL_WOMEN_NOTES[it.id]);
    if (view === "female") {
      if (it.id === "shema") {
        it.tag = "Encouraged";
        it.missedNote = "The time for the morning Shema has passed — no worries. You can still say the first verse now.";
      }
      if (it.id === "maariv") { it.tag = "Optional"; it.skippable = true; it.soft = true; }
    }
  });
}

/** Where an item stands at `now`: "past", "current", "upcoming" or "anytime". */
function tlStatus(item, now) {
  if (item.anytime) return now < item.end ? "anytime" : "past";
  if (item.point) return item.start <= now ? "past" : "upcoming";
  if (item.end <= now) return "past";
  if (item.start <= now) return "current";
  return "upcoming";
}

/** The time that counts now: the best time ("due") until it passes, then the end. */
function tlDue(item, now) { return item.due && now < item.due ? item.due : item.end; }
/** Past its best time but still open (e.g. the Shema after its "By" time). */
function tlLate(item, now) { return !!item.due && now >= item.due && now < item.end; }

/** The one thing to do now (the most urgent open item), and what comes next. */
function tlFocus(items, now, done) {
  // (The waking steps are never "Now": they belong to the moment you wake up.)
  const timed = items.filter(i => !i.anytime && !i.neverFocus);
  // Things with no clock (the waking steps, the bedtime Shema) come last, so they
  // are "Now" only when nothing with a deadline is open.
  const current = timed.filter(i => tlStatus(i, now) === "current" && !done[i.id])
    .sort((a, b) => ((a.noDeadline ? 1 : 0) - (b.noDeadline ? 1 : 0)) ||
      ((a.soft ? 1 : 0) - (b.soft ? 1 : 0)) || (tlDue(a, now) - tlDue(b, now)));
  const upcoming = timed.filter(i => tlStatus(i, now) === "upcoming")
    .sort((a, b) => (a.start - b.start) || ((a.soft ? 1 : 0) - (b.soft ? 1 : 0)));
  const focus = current[0] || null;
  const target = focus || upcoming[0] || null;
  // Next: another open prayer still due today (e.g. Shacharit after the Shema), else the next to start.
  const next = current.find(i => i !== focus && !i.soft) || upcoming.find(i => i !== target && (!target || i.start > target.start)) || null;
  // Everything else that's open right now (shown as "Also now"), most urgent first.
  // (Small steps like Modeh Ani stay plain: only prayers and things that follow you.)
  const also = current.filter(i => i !== focus && !i.noDeadline && (!i.soft || i.carry));
  // The next thing to start, for "Then:" when the open ones are listed as "Also now".
  const nextUp = upcoming.find(i => !target || i !== target) || null;
  return { focus, target, next, also, nextUp };
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

/** A small per-day store in localStorage (done ticks, "Not for me", folded parts),
 *  keeping only the last week. */
function tlDayStore(key) {
  const all = () => { try { return JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (e) { return {}; } };
  return {
    get: (dateISO) => all()[dateISO] || {},
    set: (dateISO, id, value) => {
      const data = all();
      Object.keys(data).forEach(k => { if (k < toISO(addDays(new Date(), -7))) delete data[k]; });
      data[dateISO] = data[dateISO] || {};
      if (value === undefined || value === false && key === TL_SKIP_KEY) delete data[dateISO][id];
      else data[dateISO][id] = value;
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }
  };
}
const TL_SKIP_KEY = "omad_timeline_skip_v1"; // "Not for me" today
const TL_FOLD_KEY = "omad_timeline_fold_v1"; // parts the visitor opened (true) or folded (false)
const tlSkips = tlDayStore(TL_SKIP_KEY);
const tlFolds = tlDayStore(TL_FOLD_KEY);
const tlCheers = tlDayStore("omad_timeline_cheer_v1"); // parts already celebrated today

/** A few warm words for finishing a part of the day (one is picked at random). */
const TL_CHEERS = {
  waking: ["Good morning! What a beautiful way to start the day ✨", "You opened the day with gratitude — Modeh Ani! 🌅"],
  morning: ["Morning done — the day is off to a strong start ✨", "Your morning prayers are done — beautifully done 🙌"],
  midday: ["A mitzvah and some Torah — the day just got brighter 📖", "Midday done — a little more light in the world ✨"],
  afternoon: ["Afternoon done — a pause with God in the middle of a busy day 🌤️"],
  evening: ["Evening done — a lovely way to close the day 🌙"],
  bedtime: ["All done for today. Layla tov — good night 🌙"],
  default: ["All done here — well done ✨"]
};

/** The little bubble that pops up from the bottom (one at a time; it goes away by itself). */
function tlShowCheer(title, sub) {
  const old = document.getElementById("tl-cheer");
  if (old) old.remove();
  const box = el("div", "tl-cheer");
  box.id = "tl-cheer";
  box.setAttribute("role", "status");
  box.appendChild(el("span", "tl-cheer-icon", "🎉"));
  const text = el("div", "tl-cheer-text");
  text.appendChild(el("strong", null, title));
  if (sub) text.appendChild(el("span", null, sub));
  box.appendChild(text);
  const close = el("button", "tl-cheer-close", "✕");
  close.type = "button";
  close.setAttribute("aria-label", "Close");
  close.addEventListener("click", () => box.remove());
  box.appendChild(close);
  document.body.appendChild(box);
  requestAnimationFrame(() => box.classList.add("is-in"));
  setTimeout(() => { box.classList.remove("is-in"); setTimeout(() => box.remove(), 400); }, 7000);
}

function tlLeft(ms) {
  const m = Math.max(1, Math.round(ms / TL_MIN));
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** The "How to pray" content for Shacharit, Mincha and Maariv. */
/** Which siddur fits each nusach — shown on the prayer cards. */
const TL_SIDDURS = {
  ashkenaz: "Nusach Ashkenaz — for example the Koren or ArtScroll Ashkenaz siddur.",
  sefard: "Nusach Sefard — for example the ArtScroll or Metsudah Siddur Sefard.",
  sephardi: "Edot HaMizrach — for example Siddur Kol Sasson, Kol Yaakov or Avot Ubanim.",
  chabad: "Nusach Ari — Siddur Tehillat Hashem.",
  other: "Pray from the siddur of your community or synagogue.",
  unsure: "Any siddur is a fine start — ideally the one your synagogue uses. Any nusach prayed sincerely is right; what matters is keeping to one."
};

function tlPrayerBody(item, ctx, used) {
  const box = el("div", "tl-body");
  const n = currentProfile && currentProfile.nusach;
  if (TL_SIDDURS[n]) {
    const p = el("p", "tl-siddur");
    p.appendChild(el("b", null, "Your siddur: "));
    p.appendChild(document.createTextNode(TL_SIDDURS[n]));
    box.appendChild(p);
  }
  // How your community's order differs (shown open, not inside "About").
  const ex = PRAYER_EXTRAS[item.prayer];
  const order = ex ? renderMinhagBox(ex.minhagim, currentProfile) : null;
  if (order) box.appendChild(order);
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
  if (item.kind === "quiz") {
    const box = el("div", "tl-body");
    box.id = "tl-quiz-box"; // app.js renders the questions here
    return box;
  }
  if (item.kind === "readings") {
    const box = el("div", "tl-body");
    item.read.forEach(r => box.appendChild(tlGuideBody(r, used, item.read.length > 1)));
    return box;
  }
  return null;
}

function tlHowLabel(item) {
  if (item.kind === "quiz") return "Start the quiz";
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
  // Time-bound items: the latest time sits at the bottom of the time column.
  if (item.endLabel) {
    const end = el("div", "tl-end");
    end.appendChild(el("small", null, item.endSmall || "until"));
    end.appendChild(document.createTextNode(item.endLabel));
    li.appendChild(end);
  }
  li.appendChild(el("div", "tl-dot"));

  const card = el("div", "tl-card");
  const row = el("div", "tl-row");
  const main = el("div", "tl-main");
  const h = el("h3", "tl-title", item.title);
  if (item.tag) h.appendChild(el("span", "tl-tag", item.tag));
  if (item.genderTag) h.appendChild(genderTag(item.genderTag, currentProfile));
  h.appendChild(el("span", "tl-tag tl-tag--now", "Now"));
  h.appendChild(el("span", "tl-tag tl-tag--also", "Also now"));
  main.appendChild(h);
  if (item.whatIs) {
    const w = el("p", "tl-whatis");
    w.appendChild(el("b", null, "What is this? "));
    w.appendChild(document.createTextNode(item.whatIs));
    main.appendChild(w);
  }
  // Shown when the item has followed you past its own part of the day.
  main.appendChild(el("p", "tl-carried", ""));
  // Shown when its best time has passed (or it was missed): what to do now.
  main.appendChild(el("p", "tl-late", ""));
  // On Mincha / Maariv: how to make up the prayer before, if it was missed.
  main.appendChild(el("p", "tl-makeup", ""));

  let why = item.why;
  if (item.kind === "daily-mitzvah" && ctx.mitzvah) why = `${ctx.mitzvah.title} — ${ctx.mitzvah.subtitle}`;
  const whyEl = el("p", "tl-why", why || "");
  if (item.kind === "torah") whyEl.id = "tl-torah-why";
  if (why || item.kind === "torah") main.appendChild(whyEl);
  // Short halachic notes (e.g. when Hamapil is said), shown on the card itself.
  if (item.notes && item.notes.length) {
    const note = el("div", "tl-note");
    item.notes.forEach(n => note.appendChild(tlNoteEl(n)));
    main.appendChild(note);
  }
  // Something to share with the kids about today's mitzvah.
  if (item.kind === "daily-mitzvah" && ctx.mitzvah && typeof familyShow === "function") {
    const young = familyShow("young", currentProfile), teens = familyShow("teens", currentProfile);
    if (young || teens) {
      const note = el("div", "tl-note");
      note.appendChild(tlNoteEl(young
        ? { family: "young", text: `Share with your kids: tell them about ${ctx.mitzvah.title} in one sentence, then ask — when could we do this together tomorrow?` }
        : { family: "teens", text: `Talk with your teens: why might ${ctx.mitzvah.title} matter? Is it easy or hard to keep — and what would make it easier?` }));
      main.appendChild(note);
    }
  }

  // Prayer changes stay visible on the card itself, not hidden in the drop-down.
  const changeTitles = item.kind === "prayer" ? (item.changes || []).map(c => c.title) : [];
  // "Atah Chonantanu tonight" reads better as "Tonight: Atah Chonantanu".
  const shortChange = (t) => (item.id === "maariv" ? t.replace(/\s*(from )?tonight$/i, "") : t);
  if (changeTitles.length) main.appendChild(el("p", "tl-changes", `${item.id === "maariv" ? "Tonight" : "Today"}: ${changeTitles.map(shortChange).join(" · ")}`));
  if (item.sameAs && item.sameAs.length) main.appendChild(el("p", "tl-changes", `Today's prayer changes (explained under Shacharit): ${item.sameAs.join(" · ")}`));

  row.appendChild(main);

  if (ctx.isToday) {
    // For the curious, the tick says what it means: "I tried this".
    const curious = typeof toneOf === "function" && toneOf(currentProfile) === "curious";
    const chk = el("button", "tl-check" + (curious ? " tl-check--text" : ""), curious ? "Tried it ✓" : "✓");
    chk.type = "button";
    chk.addEventListener("click", () => {
      const isDone = li.classList.contains("is-done");
      tlSetDone(ctx.dateISO, item.id, !isDone);
      ctx.paint();
      if (!isDone && ctx.onSettle) ctx.onSettle(item);
    });
    row.appendChild(chk);
  }
  card.appendChild(row);

  // "Not for me": put it aside for today without saying it was done.
  if (ctx.isToday && item.skippable) {
    const skip = el("div", "tl-skip");
    const btn = el("button", "tl-skip-btn", "Not for me today");
    btn.type = "button";
    btn.addEventListener("click", () => { tlSkips.set(ctx.dateISO, item.id, true); ctx.paint(); if (ctx.onSettle) ctx.onSettle(item); });
    const note = el("span", "tl-skip-note", "Set aside for today · ");
    const undo = el("button", "tl-skip-undo", "Undo");
    undo.type = "button";
    undo.addEventListener("click", () => { tlSkips.set(ctx.dateISO, item.id, false); ctx.paint(); });
    note.appendChild(undo);
    skip.appendChild(btn);
    skip.appendChild(note);
    card.appendChild(skip);
  }

  // The drop-down spans the card's full width (under the tick button too),
  // so the Hebrew has room on a phone.
  // The Torah portion is read on its own page (torah.html).
  if (item.kind === "torah") {
    const a = el("a", "tl-how-link", "Read today's aliyah →");
    a.href = `torah.html?date=${ctx.dateISO}`;
    card.appendChild(a);
  }
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
function renderTimeline({ container, nowContainer, date, isToday, times, events, guide, changes, textCtx, mitzvah, community, info, hebDay, hebNight }) {
  if (tlTimer) { clearInterval(tlTimer); tlTimer = null; }
  container.innerHTML = "";
  nowContainer.innerHTML = "";
  const fmt = tlCityFormatter(times);
  const day = buildDayTimeline({
    date, times, community, info, guide, changes, fmt, profile: currentProfile,
    timed: (events || []).filter(e => e.at && daysBetween(e.date, date) === 0)
  });
  const used = new Set();
  const ctx = { isToday, dateISO: toISO(date), textCtx, mitzvah, paint: () => paint() };
  const all = day.parts.flatMap(p => p.items);
  const itemEls = new Map();

  // A note at the top, in the visitor's tone: for those converting (blessings come
  // up every day, from the morning ones on), and a gentle word for those reconnecting.
  const tone = typeof toneOf === "function" ? toneOf(currentProfile) : null;
  document.body.classList.toggle("tone-gentle", tone === "jewish-reconnecting");
  document.body.classList.toggle("tone-short", tone === "jewish-reminders");
  if (tone === "converting") {
    container.appendChild(el("p", "dg-convert", "While converting: for blessings that say \"who has commanded us\", ask your rabbi whether to say them now — many advise saying them without God's name until the conversion. Doing the practices themselves is always welcome."));
  } else if (tone === "jewish-reconnecting" && isToday) {
    container.appendChild(el("p", "dg-convert tone-gentle-note", "🌱 There's no test here. Pick one thing that speaks to you today — that's a real step, and it's plenty."));
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
      if (item.notes && item.notes.length) {
        const note = el("div", "tl-note");
        item.notes.forEach(n => note.appendChild(tlNoteEl(n)));
        card.appendChild(note);
      }
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

  // Inside the window of the "Right now" item, the marker slides down beside its
  // card instead: as far down as the time is through that window.
  const nowMark = el("div", "tl-now-mark");
  nowMark.setAttribute("aria-hidden", "true");
  const markLabel = el("span", "tl-now-mark-label");
  markLabel.appendChild(el("span", "tl-now-mark-time"));
  markLabel.appendChild(el("span", "tl-now-mark-left"));
  nowMark.appendChild(markLabel);
  nowMark.appendChild(el("i"));
  nowMark.appendChild(el("b"));
  const nowFill = el("div", "tl-now-fill");
  nowFill.setAttribute("aria-hidden", "true");

  // One link to open or fold every part at once.
  const tools = el("div", "tl-tools");
  const allBtn = el("button", "tl-all-btn", "Collapse all");
  allBtn.type = "button";
  allBtn.addEventListener("click", () => {
    const open = allBtn.textContent === "Expand all";
    partEls.forEach(({ part }) => tlFolds.set(ctx.dateISO, part.key, open));
    paint();
  });
  tools.appendChild(allBtn);
  container.appendChild(tools);

  const partEls = [];
  day.parts.forEach(p => {
    const sec = el("section", "tl-part");
    sec.dataset.part = p.key;
    const head = el("div", "tl-part-head");
    // The whole heading opens or folds the part (what's in it is saved for today).
    const h = el("h2", "tl-part-title");
    const toggle = el("button", "tl-part-toggle");
    toggle.type = "button";
    toggle.appendChild(el("span", "tl-part-name", `${p.icon} ${p.title}`));
    const meta = el("span", "tl-part-meta", p.range || "");
    toggle.appendChild(meta);
    // Which Hebrew date this part of the day falls on: the Jewish day begins at
    // sunset, so the evening already belongs to the next date.
    const night = p.key === "evening" || p.key === "bedtime";
    const heb = night ? hebNight : hebDay;
    if (heb) toggle.appendChild(el("span", "tl-part-heb" + (night ? " tl-part-heb--night" : ""), heb));
    toggle.appendChild(el("span", "tl-part-caret", "▾"));
    toggle.addEventListener("click", () => {
      tlFolds.set(ctx.dateISO, p.key, sec.classList.contains("is-folded"));
      paint();
    });
    h.appendChild(toggle);
    head.appendChild(h);
    sec.appendChild(head);
    if (p.key === "evening" && hebNight) {
      const sunset = day.z && day.z.sunset && !day.approx ? ` (${fmt(day.z.sunset)})` : "";
      sec.appendChild(el("p", "tl-sunset", `🌇 The Hebrew date changes at sunset${sunset}: ${hebDay ? hebDay + " ends and " : ""}${hebNight} begins. Tonight's prayers already belong to ${hebNight}.`));
    }
    const ul = el("ul", "tl-list");
    p.items.forEach(item => {
      const li = tlRenderItem(item, ctx, used);
      itemEls.set(item, li);
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    partEls.push({ part: p, sec, ul, meta, toggle });
    container.appendChild(sec);
  });

  container.appendChild(el("p", "pc-review", day.approx
    ? "Times depend on your city — set it in settings for exact times. Customs differ, so check the details with your rabbi."
    : `Times for ${currentSettings.location ? currentSettings.location.name : "your city"}, calculated by Hebcal. Customs differ — check the details with your rabbi.`));
  // All of the day's times are on their own page.
  const zLink = el("a", "tl-zmanim-link", isToday ? "All of today's times →" : "All of this day's times →");
  zLink.href = isToday ? "zmanim.html" : `zmanim.html?date=${toISO(date)}`;
  container.appendChild(zLink);
  container.appendChild(reportLink(`timeline:${toISO(date)}`));

  function showMe(item) {
    const li = itemEls.get(item);
    if (!li) return;
    // Open its part first if it was folded.
    const sec = li.closest(".tl-part");
    if (sec && sec.classList.contains("is-folded")) { tlFolds.set(ctx.dateISO, sec.dataset.part, true); paint(); }
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
    const { focus, target, next, also, nextUp } = tlFocus(all, now, done);
    if (focus) {
      card.appendChild(el("div", "now-label", focus.noDeadline ? (focus.nowLabel || "Before you sleep") : "Right now"));
      card.appendChild(el("div", "now-title", focus.title));
      if (!day.approx && !focus.noDeadline) card.appendChild(el("div", "now-time", `Until ${fmt(focus.end)} · ${tlLeft(focus.end - now)} left`));
      if (!day.approx && focus.due && now < focus.due) card.appendChild(el("div", "now-best", `Best by ${fmt(focus.due)}`));
      if (tlLate(focus, now)) card.appendChild(el("div", "now-best", day.approx ? "The best time has passed — still open." : `The best time (${fmt(focus.due)}) has passed — still open`));
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
      b.addEventListener("click", () => { tlSetDone(ctx.dateISO, focus.id, true); paint(); onSettle(focus); });
      actions.appendChild(b);
    }
    if (day.approx) {
      const city = el("button", "now-btn", "Set your city for exact times");
      city.type = "button";
      city.addEventListener("click", openSettings);
      actions.appendChild(city);
    }
    if (actions.children.length) card.appendChild(actions);
    if (focus && also.length) {
      // Everything else open right now, then what starts next.
      also.forEach(i => card.appendChild(el("div", "now-next now-also", `Also now: ${i.title}${tlLate(i, now) && i.lateShort ? ` · ${i.lateShort}` : i.idealNote && i.idealEnd && now < i.idealEnd ? ` · ${i.idealNote}` : day.approx ? "" : ` · until ${fmt(i.end)}`}`)));
      if (nextUp) card.appendChild(el("div", "now-next", `Then: ${nextUp.title}${day.approx || nextUp.noDeadline ? "" : ` · ${fmt(nextUp.start)}`}`));
    } else if (next) card.appendChild(el("div", "now-next", `Then: ${next.title}${day.approx ? "" : next.noDeadline ? "" : next.start <= now ? ` · by ${fmt(next.end)}` : ` · ${fmt(next.start)}`}`));
    nowContainer.appendChild(card);
  }

  function paint() {
    const now = tlNow();
    const done = isToday ? tlDoneFor(ctx.dateISO) : {};
    const skipped = isToday ? tlSkips.get(ctx.dateISO) : {};
    const settled = Object.assign({}, done, skipped); // done, or set aside for today
    const { focus } = isToday ? tlFocus(all, now, settled) : { focus: null };
    nowLine.remove();
    nowMark.remove();
    nowFill.remove();
    let placed = false;
    if (focus && !day.approx && !focus.noDeadline) {
      const li = itemEls.get(focus);
      const due = focus.end; // the marker runs to the latest time
      const span = due - focus.start;
      const share = span > 0 ? Math.min(1, Math.max(0, (now - focus.start) / span)) : 0;
      const left = due - now;
      nowMark.querySelector(".tl-now-mark-time").textContent = fmt(now);
      nowMark.querySelector(".tl-now-mark-left").textContent = `${tlLeft(left)} left`;
      nowMark.classList.toggle("is-urgent", left <= 30 * TL_MIN);
      li.style.setProperty("--tl-now", share.toFixed(3));
      li.appendChild(nowFill);
      li.appendChild(nowMark);
      placed = true;
    }
    // Every item back in its own part, in its own order…
    const homeIdx = new Map();
    partEls.forEach(({ part, ul }, idx) => part.items.forEach(item => {
      homeIdx.set(item, idx);
      ul.appendChild(itemEls.get(item));
    }));
    const z = day.z;
    const partEnd = { waking: z.tfilla, morning: z.chatzot, midday: z.minchaG, afternoon: z.sunset, evening: z.midnight };
    const isOpenNow = (i) => !settled[i.id] && tlStatus(i, now) === "current";

    // The part of the day you're in: where the most urgent open prayer or practice
    // is (or the next one to start). Things that follow you don't count.
    let nowIdx = -1;
    lastNowIdx = -1;
    const moved = new Set();
    if (isToday) {
      const core = all.filter(i => !i.anytime && !i.carry && !i.noDeadline && !settled[i.id]);
      const cur = core.filter(i => tlStatus(i, now) === "current")
        .sort((a, b) => ((a.soft ? 1 : 0) - (b.soft ? 1 : 0)) || (a.end - b.end));
      const up = core.filter(i => tlStatus(i, now) === "upcoming").sort((a, b) => a.start - b.start);
      // (If nothing else is open, the "Now" item itself — e.g. tefillin late morning.)
      const anchor = cur[0] || (focus && !focus.anytime ? focus : null) || up[0];
      nowIdx = anchor ? homeIdx.get(anchor) : partEls.length - 1;
      lastNowIdx = nowIdx;
      // …then what isn't done yet follows the day: "anytime" practices once their
      // part is over, and things like tefillin once the morning is over (until
      // their latest time). Done or set aside, they stay home.
      // The "anytime" practices stay with the part of the day you're in, ticked or not,
      // so ticking one never moves anything; tefillin follows you only while not done.
      const movers = all.filter(i => homeIdx.get(i) < nowIdx && tlStatus(i, now) !== "past" &&
        (i.anytime ||
         (!settled[i.id] && i.carry && partEnd[partEls[homeIdx.get(i)].part.key] && now >= partEnd[partEls[homeIdx.get(i)].part.key])));
      const target = partEls[nowIdx].ul;
      movers.slice().reverse().forEach(i => { target.insertBefore(itemEls.get(i), target.firstChild); moved.add(i); });
    }
    const itemOf = new Map([...itemEls].map(([item, li]) => [li, item]));
    const folds = tlFolds.get(ctx.dateISO);
    let anyFolded = false;

    partEls.forEach(({ part, sec, ul, meta, toggle }, idx) => {
      let here = [...ul.children].map(li => itemOf.get(li)).filter(Boolean);
      sec.style.display = here.length ? "" : "none";
      if (!here.length) return;

      // In today's parts: what's done (or over) first, then what's open — the most
      // urgent first — then what's still to come. So an unticked item sits by "now".
      if (isToday) {
        const group = (i) => (settled[i.id] || tlStatus(i, now) === "past") ? 0 : tlStatus(i, now) === "upcoming" ? 2 : 1;
        here = here.map((i, n) => ({ i, n })).sort((a, b) => {
          const ga = group(a.i), gb = group(b.i);
          if (ga !== gb) return ga - gb;
          if (ga === 1 && !!a.i.anytime !== !!b.i.anytime) return a.i.anytime ? 1 : -1; // "anytime" after the timed ones
          const dueA = a.i.idealEnd && now < a.i.idealEnd ? a.i.idealEnd : tlDue(a.i, now);
          const dueB = b.i.idealEnd && now < b.i.idealEnd ? b.i.idealEnd : tlDue(b.i, now);
          if (ga === 1 && dueA - dueB) return dueA - dueB;
          return a.n - b.n;
        }).map(x => x.i);
        here.forEach(i => ul.appendChild(itemEls.get(i)));
      }

      let finishedCount = 0;
      let missedHere = false;
      here.forEach(item => {
        const li = itemEls.get(item);
        let st = isToday ? tlStatus(item, now) : "plain";
        if (st === "current" && item !== focus) {
          if (settled[item.id] || item.anytime || item.noDeadline || (item.soft && !item.carry)) st = "open";
          else st = item.idealEnd && now < item.idealEnd ? "current" : "also"; // e.g. tefillin with Shacharit
        }
        if (settled[item.id] || st === "past") finishedCount++;
        li.className = `tl-item tl-item--${st}${done[item.id] ? " is-done" : ""}${skipped[item.id] ? " is-skipped" : ""}${item.anytime ? " tl-item--any" : ""}`;
        const chk = li.querySelector(".tl-check");
        if (chk) {
          chk.setAttribute("aria-pressed", done[item.id] ? "true" : "false");
          // Not before its time: you can't have said the bedtime Shema in the morning.
          const notYet = isToday && !done[item.id] && !item.anytime && tlStatus(item, now) === "upcoming";
          chk.disabled = notYet;
          chk.title = notYet ? (day.approx ? "Not yet" : `Available from ${fmt(item.start)}`) : "";
          chk.setAttribute("aria-label", notYet ? `${item.title}: not yet` : `${done[item.id] ? "Mark not done" : "Mark done"}: ${item.title}`);
        }
        const carried = li.querySelector(".tl-carried");
        if (carried) carried.textContent = moved.has(item) && item.carry && !day.approx ? `Still open — latest ${fmt(item.end)}` : "";
        // Past its best time, or missed altogether: say so, and what to do.
        const late = isToday && !settled[item.id] && tlLate(item, now);
        const missed = isToday && !settled[item.id] && st === "past" && !!item.missedNote;
        li.classList.toggle("is-late", late);
        li.classList.toggle("is-missed", missed);
        if (missed) missedHere = true;
        const lateEl = li.querySelector(".tl-late");
        if (lateEl) {
          // Before the best time: a gentle "Best by …". After it: still open until the
          // latest time. Missed altogether: what to do.
          const best = !late && !missed && !!item.bestNote && !settled[item.id] && (!isToday || now < item.due);
          lateEl.textContent = late ? (item.lateNote || "") : missed ? item.missedNote : best ? item.bestNote : "";
          lateEl.className = `tl-late${late ? " tl-late--late" : missed ? " tl-late--missed" : best ? " tl-late--best" : ""}`;
        }
        const makeupEl = li.querySelector(".tl-makeup");
        if (makeupEl) {
          const prev = item.makeupFor && all.find(i => i.id === item.makeupFor);
          const needed = isToday && prev && !settled[prev.id] && tlStatus(prev, now) === "past" && !settled[item.id] && st !== "past";
          makeupEl.textContent = needed ? item.makeupNote : "";
        }
        if (isToday && !placed && (st === "current" || st === "upcoming")) {
          nowLine.querySelector(".tl-now-time").textContent = day.approx ? "" : fmt(now);
          ul.insertBefore(nowLine, li);
          placed = true;
        }
      });

      // Open or folded: what the visitor chose today, otherwise only the part of the
      // day you're in (and an earlier one with something still open before its end).
      const byDefault = !isToday || idx === nowIdx || (focus && here.includes(focus)) ||
        (missedHere && partEnd[part.key] && now < partEnd[part.key]) ||
        (idx < nowIdx && here.some(i => isOpenNow(i) && !i.anytime && !i.carry) && partEnd[part.key] && now < partEnd[part.key]);
      const open = folds[part.key] !== undefined ? folds[part.key] : byDefault;
      sec.classList.toggle("is-folded", !open);
      if (!open) anyFolded = true;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      const earlier = isToday && idx < nowIdx;
      sec.classList.toggle("tl-part--past", earlier && finishedCount === here.length);
      if (open) meta.textContent = part.range || "";
      else if (earlier) meta.textContent = `${finishedCount === here.length ? "Earlier today" : "Still open"} · ${here.filter(i => settled[i.id]).length} of ${here.length} done`;
      else {
        const titles = here.map(i => i.title.replace(/\s*\(.*?\)\s*/g, " ").trim());
        meta.textContent = titles.slice(0, 3).join(" · ") + (titles.length > 3 ? ` · +${titles.length - 3}` : "");
      }
    });
    allBtn.textContent = anyFolded ? "Expand all" : "Collapse all";
    renderNow(now, settled);
  }

  let lastNowIdx = -1; // the part of the day you're in, as of the last paint

  // When the last thing in a part of the day is ticked (or set aside): a little
  // celebration, then that part folds and the next one with something to do opens.
  // Once per part per day, and only when the visitor ticks — never on load.
  function onSettle(item) {
    if (!isToday) return;
    const li = itemEls.get(item);
    const sec = li && li.closest(".tl-part");
    if (!sec) return;
    const key = sec.dataset.part;
    const now = tlNow();
    const settled = Object.assign({}, tlDoneFor(ctx.dateISO), tlSkips.get(ctx.dateISO));
    const byLi = new Map([...itemEls].map(([it, l]) => [l, it]));
    const here = [...sec.querySelectorAll(".tl-list > li.tl-item")].map(l => byLi.get(l)).filter(Boolean);
    if (!here.length || !here.every(i => settled[i.id] || tlStatus(i, now) === "past")) return;
    if (tlCheers.get(ctx.dateISO)[key]) return;
    // Only for a part of the day that has started.
    if (partEls.findIndex(p => p.sec === sec) > lastNowIdx) return;
    tlCheers.set(ctx.dateISO, key, true);

    tlFolds.set(ctx.dateISO, key, false);
    const idx = partEls.findIndex(p => p.sec === sec);
    const next = partEls.slice(idx + 1).find(({ sec: s, ul }) => s.style.display !== "none" &&
      [...ul.querySelectorAll(":scope > li.tl-item")].some(l => { const it = byLi.get(l); return it && !settled[it.id] && tlStatus(it, now) !== "past"; }));
    if (next) tlFolds.set(ctx.dateISO, next.part.key, true);
    paint();

    const { focus: f, target } = tlFocus(all, now, settled);
    const nextLine = f
      ? `Next: ${f.title}${f.noDeadline || day.approx ? "" : ` · until ${fmt(f.end)}`}`
      : target ? `Next: ${target.title}${day.approx ? "" : ` · from ${fmt(target.start)}`}`
      : "That's everything for today — layla tov.";
    tlShowCheer(tlCheerLine(key), nextLine);
    if (next) setTimeout(() => next.sec.scrollIntoView({ behavior: "smooth", block: "nearest" }), 150);
  }
  ctx.onSettle = onSettle;

  paint();
  if (isToday) tlTimer = setInterval(paint, 60000);
}
