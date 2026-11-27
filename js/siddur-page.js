/**
 * siddur-page.js — an online siddur in each nusach (siddur.html), from Sefaria.
 *
 *   Ashkenaz  → Siddur Ashkenaz          Sefard (Chassidic) → Siddur Sefard
 *   Sephardi  → Siddur Edot HaMizrach    Chabad → Weekday Siddur Chabad, with
 *                                         Shabbat and festivals from Siddur Sefard
 *
 * The contents come live from each book's Sefaria index, grouped into Weekday,
 * Shabbat, festivals, blessings and night. A section opens its text in Hebrew,
 * English or both. "Now" jumps to the prayer for this time of day, with today's
 * prayer changes above it. Opened sections are saved for reading offline.
 *
 * Links: siddur.html#n=<nusach>&r=<Sefaria ref> opens a section;
 *        siddur.html#p=shacharit|mincha|maariv opens that prayer in your nusach.
 */

const SD_NUSACH_KEY = "omad_siddur_nusach";
const SD_LANG_KEY = "omad_siddur_lang";
const SD_CACHE = "omad-siddur-v1";
const SD_API = "https://www.sefaria.org/api";

const SD_BOOKS = {
  ashkenaz: { book: "Siddur Ashkenaz", label: "Ashkenaz" },
  sefard: { book: "Siddur Sefard", label: "Sefard (Chassidic)" },
  sephardi: { book: "Siddur Edot HaMizrach", label: "Sephardi / Edot HaMizrach" },
  chabad: { book: "Weekday Siddur Chabad", label: "Chabad (Nusach Ari)", shabbatFrom: "Siddur Sefard" }
};

/** Groups for the contents, by the section's name (first match wins). */
const SD_GROUPS = [
  { key: "shabbat", title: "Shabbat", icon: "candles-shabbat", re: /Shabbat|Kabbalat|Havdal|Motzaei|Third Meal|Song of Songs|Daytime Meal|Mishna Study|Candle/i },
  { key: "festivals", title: "Rosh Chodesh & festivals", icon: "menorah", re: /Rosh Chodesh|Rosh Hodesh|Festival|Holiday|Sukkot|Lulav|Pesach|Haggadah|Shavuot|Simchat|Chanukah|Hanukkah|Purim|Nissan|Fast|Hallel|Omer|Yotzerot|Kapparot|Vows|Torah Readings|Nassi|Lag BaOmer|Priestly/i },
  { key: "night", title: "Bedtime & night", icon: "moon", re: /Bedtime|Kiddush Levan|Moon|Midnight/i },
  { key: "blessings", title: "Blessings & meals", icon: "goblet", re: /Berachot|Blessing|Birkat|Birchat|Mealtime|Hamihya|Enjoyments|Eruv/i },
  { key: "weekday", title: "Weekday prayers", icon: "sunrise", re: /Weekday|Arising|Preparatory|Shacharit|Additional|Additions|Mincha|Minchah|Maariv|Arvit|Tachnun|Remembrances|Rabbenu Tam|Kaddish/i },
  { key: "other", title: "More prayers", icon: "book-star", re: /.*/ }
];

/** Where "Now" (and siddur.html#p=…) goes, by group and section name. */
const SD_PRAYERS = {
  shacharit: { group: "weekday", re: /Shacharit|Morning Prayer/i, title: "Shacharit" },
  mincha: { group: "weekday", re: /Minch/i, title: "Mincha" },
  maariv: { group: "weekday", re: /Maariv|Arvit/i, title: "Maariv" },
  kabbalat: { group: "shabbat", re: /Kabbalat/i, title: "Kabbalat Shabbat" },
  "shabbat-shacharit": { group: "shabbat", re: /Shacharit|Morning/i, title: "Shabbat morning prayers" },
  "shabbat-mincha": { group: "shabbat", re: /Minch/i, title: "Shabbat Mincha" },
  bedtime: { group: "night", re: /Bedtime/i, title: "Shema before sleep" }
};

let sdState = { nusach: null, tree: null, flat: [], lang: "both" };

function sdGet(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; } }
function sdSet(key, v) { try { localStorage.setItem(key, v); } catch (e) { /* ignore */ } }
const sdRefUrl = (ref) => encodeURIComponent(ref.replace(/ /g, "_")).replace(/%2C/g, ",");

/** Fetch JSON from Sefaria, saving it for offline; falls back to the saved copy. */
async function sdFetch(url) {
  let cache = null;
  try { cache = await caches.open(SD_CACHE); } catch (e) { /* no Cache API */ }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    if (cache) cache.put(url, res.clone()).catch(() => {});
    return await res.json();
  } catch (e) {
    const saved = cache ? await cache.match(url) : null;
    if (saved) return saved.json();
    throw e;
  }
}

/** The nusach to show: the one picked on this page, else the profile's, else Ashkenaz. */
function sdDefaultNusach() {
  const picked = sdGet(SD_NUSACH_KEY, null);
  if (picked && SD_BOOKS[picked]) return picked;
  const p = getProfile();
  return p && SD_BOOKS[p.nusach] ? p.nusach : "ashkenaz";
}

// ---------------------------------------------------------------------
// Contents
// ---------------------------------------------------------------------

function sdNodeTitle(n) {
  const t = (n.titles || []).filter(x => x.lang === "en");
  return ((t.find(x => x.primary) || t[0] || {}).text || n.title || n.key || "").trim();
}

/** Sefaria's schema → { title, ref?, children[] }. Leaves have a ref; a "default"
 *  child is its parent's own text. */
function sdBuildTree(node, book, path) {
  const title = sdNodeTitle(node);
  const here = node.default ? path : (title ? [...path, title] : path);
  if (!node.nodes || !node.nodes.length) return { title, ref: [book, ...here].join(", "), children: [] };
  return { title, children: node.nodes.map(c => sdBuildTree(c, book, here)).filter(c => c.ref || c.children.length) };
}

async function sdLoadBook(book, from) {
  const idx = await sdFetch(`${SD_API}/v2/raw/index/${sdRefUrl(book)}`);
  const top = idx.schema && idx.schema.nodes ? idx.schema.nodes : [];
  return top.map(n => Object.assign(sdBuildTree(n, idx.title || book, []), from ? { from } : {}));
}

/** Top-level sections into groups. For Chabad, Shabbat and festivals come from
 *  Siddur Sefard (the weekday Chabad siddur on Sefaria has no Shabbat). */
async function sdLoadTree(nusach) {
  const b = SD_BOOKS[nusach];
  const own = await sdLoadBook(b.book);
  let sections = own;
  if (b.shabbatFrom) {
    const extra = await sdLoadBook(b.shabbatFrom, b.shabbatFrom);
    const wanted = (s) => /Shabbat|Kabbalat|Havdal|Motzaei|Third Meal|Candle|Rosh Chodesh|Holiday|Sukkot|Pesach|Shavuot|Simchat|Chanukah|Purim|Fast/i.test(s.title);
    sections = [...own, ...extra.filter(wanted)];
  }
  // Ashkenaz nests everything under Weekday / Shabbat / Festivals: open those up.
  const flatTop = [];
  sections.forEach(s => {
    if (/^(Weekday|Shabbat|Festivals)$/i.test(s.title) && s.children.length) s.children.forEach(c => flatTop.push(Object.assign(c, { parent: s.title, from: s.from })));
    else flatTop.push(s);
  });
  const groups = SD_GROUPS.map(g => ({ ...g, sections: [] }));
  flatTop.forEach(s => {
    const name = (s.parent ? s.parent + " " : "") + s.title;
    const g = groups.find(x => x.re.test(name));
    g.sections.push(s);
  });
  return groups.filter(g => g.sections.length);
}

/** Every leaf in reading order (for previous / next). */
function sdFlatten(groups) {
  const out = [];
  const walk = (n, trail) => {
    if (n.ref) out.push({ ref: n.ref, title: n.title, trail, from: n.from });
    n.children.forEach(c => walk(c, [...trail, n.title]));
  };
  groups.forEach(g => g.sections.forEach(s => walk(Object.assign(s, { from: s.from }), [g.title])));
  return out;
}

function sdFirstLeaf(node) {
  if (node.ref) return node;
  for (const c of node.children) { const l = sdFirstLeaf(c); if (l) return l; }
  return null;
}

/** The leaf for a prayer key ("shacharit"…), searching its group's sections. */
function sdFindPrayer(groups, key) {
  const p = SD_PRAYERS[key];
  if (!p) return null;
  const g = groups.find(x => x.key === p.group) || groups[0];
  const find = (nodes) => {
    for (const n of nodes) {
      if (p.re.test(n.title)) return sdFirstLeaf(n);
      const deeper = find(n.children);
      if (deeper) return deeper;
    }
    return null;
  };
  return find(g ? g.sections : []);
}

// ---------------------------------------------------------------------
// Now: which prayer, and what changes today
// ---------------------------------------------------------------------

/** The prayer for this moment: Shabbat-aware, from today's zmanim when there's a city. */
async function sdNowPrayer() {
  const now = new Date();
  const dow = now.getDay();
  let sunrise = null, chatzot = null, sunset = null;
  const settings = getSettings();
  if (settings.location && typeof fetchZmanim === "function") {
    try {
      const t = await fetchZmanim(settings.location, sdIso(now));
      if (t) { sunrise = new Date(t.sunrise); chatzot = new Date(t.chatzot); sunset = new Date(t.sunset); }
    } catch (e) { /* use the clock */ }
  }
  const h = now.getHours();
  const beforeNoon = chatzot ? now < chatzot : h < 12;
  const beforeSunset = sunset ? now < sunset : h < 17;
  const late = h < 4; // after midnight, it's still last night
  if (dow === 6) return beforeNoon && !late ? "shabbat-shacharit" : beforeSunset ? "shabbat-mincha" : "maariv";
  if (dow === 5 && !beforeSunset) return "kabbalat";
  if (late || h >= 22) return "bedtime";
  if (beforeNoon) return "shacharit";
  if (beforeSunset) return "mincha";
  return "maariv";
}

function sdIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today's prayer changes (Hallel, Ya'aleh v'Yavo, no Tachanun…) from the same engine as the home page. */
async function sdTodayChanges() {
  const day = await sdDay();
  return day ? day.changes.today.map(c => c.title) : [];
}

/** Everything the day notes need, loaded once: the changes for today and tonight,
 *  the day's info, and why Tachanun is left out (if it is). */
let sdDayPromise = null;
function sdDay() {
  if (!sdDayPromise) sdDayPromise = sdLoadDay().catch(() => null);
  return sdDayPromise;
}

async function sdLoadDay(on) {
  if (typeof getPrayerChanges !== "function") return null;
  const settings = getSettings();
  const today = on ? new Date(on) : new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const israel = isInIsrael(settings);
  const [cal, heb, hebT] = await Promise.all([
    fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&start=${sdIso(today)}&end=${sdIso(tomorrow)}&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on&o=on${hebcalCalendarQuery(settings)}`).then(r => r.json()),
    fetch(`https://www.hebcal.com/converter?cfg=json&date=${sdIso(today)}&g2h=1`).then(r => r.json()),
    fetch(`https://www.hebcal.com/converter?cfg=json&date=${sdIso(tomorrow)}&g2h=1`).then(r => r.json())
  ]);
  const events = (cal.items || []).map(e => {
    const [y, m, d] = e.date.slice(0, 10).split("-").map(Number);
    return Object.assign({}, e, { date: new Date(y, m - 1, d) });
  });
  const p = getProfile();
  const community = p && p.community ? pcCommunityKey(p.community) : null;
  const nusach = p && p.nusach;
  const changes = getPrayerChanges({ date: today, heb, hebTomorrow: hebT, israel, events, community, nusach });
  const info = pcDayInfo(events, today);
  const dow = today.getDay();
  const restDay = dow === 6 || info.yomTov || info.roshHashana || info.yomKippur;
  const reason = restDay ? "it's Shabbat or a festival" : noTachanunReason(heb, info, community, nusach);
  const next = pcDayInfo(events, tomorrow);
  const reasonNext = noTachanunReason(hebT, next, community, nusach);
  return {
    date: today, dow, heb, hebT, info, changes, restDay,
    noTach: reason,                                   // Shacharit and Mincha
    noTachMincha: reason || (dow === 5 ? "it's Friday afternoon, before Shabbat" : (reasonNext || next.yomTov) ? "tomorrow is a day without Tachanun" : null),
    has: (id) => [...changes.today, ...changes.season, ...(changes.weekly || [])].some(c => c.id === id),
    hasTonight: (id) => [...changes.tonight, ...changes.season].some(c => c.id === id)
  };
}

// ---------------------------------------------------------------------
// The siddur, for today: what to skip, add or say in each section
// ---------------------------------------------------------------------

const SD_DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Shabbat"];
const SD_SONG_OF_DAY = [24, 48, 82, 94, 81, 93, 92];

/** Which service a section belongs to, from its place in the siddur. */
function sdService(ref) {
  if (/Shabbat|Festival|Holiday|Kabbalat/i.test(ref)) return null; // the weekday notes don't apply
  if (/Maariv|Arvit/i.test(ref)) return "maariv";
  if (/Minch/i.test(ref)) return "mincha";
  if (/Mazon/i.test(ref)) return "meal";
  if (/Shacharit|Upon Arising|Preparatory|Morning/i.test(ref)) return "shacharit";
  return "other";
}

/** Amidah blessings, by section name → the changes that go in them. */
const SD_AMIDAH_SPOTS = [
  { re: /Patriarchs|Avot/i, ids: ["aseret-changes"] },
  { re: /Divine Might|Gevurot/i, ids: ["mashiv-haruach", "morid-hatal", "geshem", "tal"] },
  { re: /Holiness/i, ids: ["aseret-changes"] },
  { re: /Knowledge|Atah Chonen/i, ids: ["atah-chonantanu"] },
  { re: /Prosperity|Barech/i, ids: ["tal-umatar", "tal-umatar-start", "tal-umatar-end", "vten-beracha"] },
  { re: /Rebuilding Jerusalem/i, ids: ["tisha-bav"] },
  { re: /Response to Prayer|Shema Kolenu|Shema Koleinu/i, ids: ["aneinu"] },
  { re: /Temple Service|Retzei|R'tzei/i, ids: ["yaaleh-vyavo", "yaaleh-tonight"] },
  { re: /Thanksgiving|Modim/i, ids: ["al-hanissim", "al-hanissim-tonight", "aseret-changes"] },
  { re: /Peace|Concluding/i, ids: ["aseret-changes"] }
];
const SD_AMIDAH_IDS = [...new Set(SD_AMIDAH_SPOTS.flatMap(s => s.ids))];

/**
 * The notes for one section today: [{ kind: "skip" | "add" | "say" | "info", text }].
 * Built from the same prayer-changes engine as the home page, so the siddur and
 * the timeline always agree.
 */
function sdDayNotes(leaf, day) {
  if (!day) return [];
  const ref = leaf.ref;
  const title = leaf.title || "";
  const svc = sdService(ref);
  const notes = [];
  const add = (kind, text) => notes.push({ kind, text });
  const night = svc === "maariv";
  const list = night ? [...day.changes.tonight, ...day.changes.season] : [...day.changes.today, ...day.changes.season];
  const find = (id) => list.find(c => c.id === id);
  const monThu = day.dow === 1 || day.dow === 4;
  const tach = svc === "mincha" ? day.noTachMincha : day.noTach;

  // The Amidah: what to add today, in the right blessing.
  // (Only the Amidah itself — not "Post Amidah".)
  if (/(^|, )(The |Weekday )?Amid(ah|a)?(, |$)/i.test(ref) && svc && svc !== "other" && svc !== "meal") {
    const spot = SD_AMIDAH_SPOTS.find(s => s.re.test(title));
    const ids = spot ? spot.ids : SD_AMIDAH_IDS; // a whole-Amidah section gets them all
    ids.map(find).filter(Boolean).forEach(c => {
      if (c.id === "aneinu" && svc !== "mincha" && svc !== "shacharit") return;
      add("add", `${c.title}${spot ? "" : ` — ${c.where}`}`);
    });
  }

  // Tachanun and what goes with it (Vidui, Nefilat Apayim, Shomer Yisrael…).
  // (The Kaddish after Tachanun is still said; Maariv's opening "V'hu Rachum" isn't Tachanun.)
  const isTach = /Tachanun|Tachnun|Tahanun|Nefilat|Vidui|Shomer Yisrael|God of Israel/i.test(title + " " + ref) && !/Vehu Rachum|Kaddish/i.test(title);
  const isMonThu = /Monday/i.test(title + " " + ref);
  if ((isTach || isMonThu) && (svc === "shacharit" || svc === "mincha")) {
    if (tach) add("skip", `Not said today — ${tach}.`);
    else if (isMonThu && !monThu) add("skip", "Only on Mondays and Thursdays.");
    else if (isMonThu) add("say", `Said today — it's ${SD_DOW[day.dow]}: the longer Tachanun (V'hu Rachum).`);
    else if (svc === "shacharit" && monThu && /Nefilat|^Tachanun$|^Tachnun$|^Vidui/i.test(title)) add("info", `Today is ${SD_DOW[day.dow]}: start with the longer V'hu Rachum ("For Monday and Thursday").`);
  }
  if (/Erech Ap/i.test(title) && svc === "shacharit") {
    if (!monThu) add("skip", "Only on Mondays and Thursdays, before the Torah is taken out.");
    else if (day.noTach) add("skip", `Not said today — ${day.noTach}.`);
    else add("say", `Said today — it's ${SD_DOW[day.dow]}.`);
  }
  if (/Lamenatze|Lamnatze|LaMenatze/i.test(title) && day.noTach) add("skip", `Not said today — ${day.noTach}.`);

  // Avinu Malkeinu, Selichot.
  if (/Avinu Malk/i.test(title)) {
    if (find("avinu-malkeinu") || find("avinu-malkeinu-erev-yk") || find("fast-selichot")) add("say", "Said today.");
    else add("skip", "Not said today — only on fast days and the Ten Days of Repentance.");
  }
  if (/Selichot|Slichot/i.test(title)) {
    if (find("selichot") || find("selichot-first") || find("fast-selichot")) add("say", "Said today.");
    else add("skip", "Not said today.");
  }

  // The Torah reading (weekday Shacharit) and fast-day readings.
  const readsToday = monThu || day.info.roshChodesh || day.info.chanukahDay || day.info.purim || day.info.fast || day.info.cholHamoed || find("fast-torah");
  if (/Torah Reading|Reading from Sefer|Removing the Torah|Returning Sefer/i.test(ref) && svc === "shacharit" && !/Fast/i.test(ref) && !/Erech Ap/i.test(title)) {
    if (readsToday) add("say", "The Torah is read today.");
    else add("skip", "No Torah reading today — it's read on Mondays, Thursdays, Rosh Chodesh, fasts and festivals.");
  }
  if (/Fast Day/i.test(title + " " + ref)) {
    if (day.info.fast || find("fast-torah")) add("say", "Said today — it's a fast day.");
    else add("skip", "Only on fast days.");
  }

  // Hallel, Musaf, Rosh Chodesh, Barchi Nafshi, L'David.
  if (/Hallel/i.test(title + " " + ref) && !/Haggadah|Pesach/i.test(ref)) {
    if (find("hallel-full")) add("say", "Full Hallel today.");
    else if (find("hallel-half")) add("say", "Half Hallel today — the two paragraphs \"Lo lanu\" and \"Ahavti\" are left out.");
    else add("skip", "Not said today.");
  }
  if (/Musaf|Mussaf/i.test(title) && !/Shabbat|Festival/i.test(ref)) {
    if (find("musaf")) add("say", "Said today.");
    else add("skip", "Not said today — Musaf is for Shabbat, Rosh Chodesh and festivals.");
  }
  if (/Rosh Chodesh|Rosh Hodesh/i.test(ref)) {
    if (day.info.roshChodesh) add("say", "Today is Rosh Chodesh.");
    else add("info", "For Rosh Chodesh.");
  }
  if (/Barchi Nafshi/i.test(title)) {
    if (day.info.roshChodesh) add("say", "Said today — it's Rosh Chodesh.");
    else add("skip", "Only on Rosh Chodesh.");
  }
  if (/L'?David|LeDavid/i.test(title) && !/Mizmor/i.test(title)) {
    if (find("ldavid")) add("say", "Said today — from Rosh Chodesh Elul until after Sukkot.");
    else add("skip", "Only from Rosh Chodesh Elul until after Sukkot.");
  }

  // Chanukah, Purim, the Omer.
  if (/Chanukah|Hanukkah/i.test(ref)) add(day.info.chanukahDay ? "say" : "info", day.info.chanukahDay ? "Today is Chanukah." : "For Chanukah.");
  if (/Purim/i.test(ref)) add(day.info.purim || day.info.shushanPurim ? "say" : "info", day.info.purim ? "Today is Purim." : "For Purim.");
  if (/\bOmer\b|Sefirat/i.test(title + " " + ref)) { // (not "Shomer Yisrael")
    const o = day.changes.tonight.find(c => c.id === "omer-tonight");
    if (o) add("say", `Tonight: ${o.title}.`);
    else add("skip", "Only between Pesach and Shavuot.");
  }

  // The psalm of the day.
  if (/Song of the Day|Shir Shel Yom/i.test(title)) {
    add("info", `Today is ${SD_DOW[day.dow]}: say the psalm for ${SD_DOW[day.dow]} — Psalm ${SD_SONG_OF_DAY[day.dow]}.`);
  }

  // Birkat HaMazon: Ya'aleh v'Yavo, Al HaNissim, R'tzei on Shabbat.
  if (svc === "meal" && /Mazon/i.test(title + " " + ref)) {
    day.changes.today.filter(c => /Grace After Meals/i.test(c.where || "")).forEach(c => add("add", c.title));
    if (day.dow === 6) add("add", "R'tzei — the Shabbat paragraph");
  }
  return notes;
}

/** The short label shown beside a section in the contents. */
function sdTocBadge(notes) {
  if (notes.some(n => n.kind === "skip") && !notes.some(n => n.kind !== "skip")) return { cls: "skip", text: "skip today" };
  if (notes.some(n => n.kind === "add")) return { cls: "add", text: "+ today" };
  if (notes.some(n => n.kind === "say")) return { cls: "say", text: "today" };
  return null;
}

// ---------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------

function sdParseHash() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  return { n: h.get("n"), r: h.get("r"), p: h.get("p") };
}

function sdSetHash(ref) {
  const h = new URLSearchParams();
  h.set("n", sdState.nusach);
  if (ref) h.set("r", ref);
  history.replaceState(null, "", "#" + h.toString());
}

async function initSiddurPage() {
  const app = document.getElementById("sd-app");
  const hash = sdParseHash();
  sdState.nusach = SD_BOOKS[hash.n] ? hash.n : sdDefaultNusach();
  sdState.lang = sdGet(SD_LANG_KEY, "both");
  await sdRender(app, hash);
  window.onSettingsChanged = () => { sdState.nusach = sdDefaultNusach(); sdRender(app, {}); };
}

async function sdRender(app, hash) {
  app.innerHTML = "";
  const top = el("section", "sd-top");
  top.appendChild(el("h1", "mz-title", "Siddur"));
  top.appendChild(el("p", "mz-sub", "The prayer book, in your tradition — Hebrew and English, from Sefaria."));

  // Nusach switcher (starts on yours).
  const picker = el("div", "pill-group sd-nusach");
  picker.setAttribute("role", "radiogroup");
  picker.setAttribute("aria-label", "Nusach");
  Object.entries(SD_BOOKS).forEach(([k, b]) => {
    const btn = el("button", "pill" + (k === sdState.nusach ? " is-on" : ""), b.label);
    btn.type = "button";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(k === sdState.nusach));
    btn.addEventListener("click", () => { sdState.nusach = k; sdSet(SD_NUSACH_KEY, k); sdSetHash(null); sdRender(app, {}); });
    picker.appendChild(btn);
  });
  top.appendChild(picker);
  const p = getProfile();
  if (!p || !p.nusach || p.nusach === "unsure" || p.nusach === "other") {
    top.appendChild(el("p", "pill-note", "Not sure which to use? Pick the one your synagogue uses — or set your tradition in Settings."));
  }
  app.appendChild(top);

  const layout = el("div", "sd-layout");
  const toc = el("aside", "sd-toc");
  toc.setAttribute("aria-label", "Contents");
  const reader = el("article", "sd-reader");
  layout.appendChild(toc);
  layout.appendChild(reader);
  app.appendChild(layout);

  toc.appendChild(el("p", "intro", "Loading the contents…"));
  let groups;
  try {
    groups = await sdLoadTree(sdState.nusach);
  } catch (e) {
    toc.innerHTML = "";
    toc.appendChild(el("p", "intro", "Couldn't load the siddur right now — check your connection and try again."));
    return;
  }
  sdState.tree = groups;
  sdState.flat = sdFlatten(groups);
  sdRenderToc(toc, groups, reader);

  // Open a section: from the link, a prayer key, or "Now".
  let target = null;
  if (hash.r) target = sdState.flat.find(l => l.ref === hash.r) || { ref: hash.r, title: hash.r.split(", ").pop(), trail: [] };
  else if (hash.p) {
    const leaf = sdFindPrayer(groups, hash.p) || sdFindPrayer(groups, hash.p.replace(/^shabbat-/, ""));
    if (leaf) target = sdState.flat.find(l => l.ref === leaf.ref) || { ref: leaf.ref, title: leaf.title, trail: [] };
  }
  if (target) sdOpen(reader, target);
  else sdRenderNow(reader, groups);
}

function sdRenderToc(toc, groups, reader) {
  toc.innerHTML = "";
  const b = SD_BOOKS[sdState.nusach];
  toc.appendChild(el("p", "sd-toc-title", b.book));
  groups.forEach(g => {
    const d = el("details", "sd-group");
    const s = el("summary");
    const ic = el("span", "sd-group-ic");
    ic.innerHTML = getIcon(g.icon);
    s.appendChild(ic);
    s.appendChild(el("span", null, g.title));
    d.appendChild(s);
    g.sections.forEach(sec => d.appendChild(sdTocNode(sec, reader, 0)));
    toc.appendChild(d);
  });
  // Once today's changes are in: mark what to skip today, and what has additions.
  sdDay().then(day => {
    if (!day) return;
    toc.querySelectorAll(".sd-leaf").forEach(b => {
      const badge = sdTocBadge(sdDayNotes({ ref: b.dataset.ref, title: b.dataset.title }, day));
      if (!badge) return;
      b.classList.add("sd-leaf--" + badge.cls);
      b.appendChild(el("span", "sd-badge sd-badge--" + badge.cls, badge.text));
    });
  });
}

function sdTocNode(node, reader, depth) {
  if (node.ref) {
    const a = el("button", "sd-leaf");
    a.appendChild(el("span", null, node.title || "…"));
    a.type = "button";
    a.dataset.ref = node.ref;
    a.dataset.title = node.title || "";
    a.addEventListener("click", () => {
      const leaf = sdState.flat.find(l => l.ref === node.ref) || { ref: node.ref, title: node.title, trail: [] };
      sdOpen(reader, leaf);
    });
    return a;
  }
  const d = el("details", "sd-node");
  d.style.setProperty("--depth", depth);
  const s = el("summary", null, node.title + (node.from ? " ·" : ""));
  if (node.from) s.appendChild(el("small", "sd-from", ` from ${node.from}`));
  d.appendChild(s);
  node.children.forEach(c => d.appendChild(sdTocNode(c, reader, depth + 1)));
  return d;
}

/** The start screen: "Now: Mincha" and today's changes. */
async function sdRenderNow(reader, groups) {
  reader.innerHTML = "";
  const card = el("div", "sd-now");
  card.appendChild(el("p", "fc-kicker", "Right now"));
  const title = el("h2", "sd-now-title", "…");
  card.appendChild(title);
  const changes = el("p", "sd-now-changes");
  card.appendChild(changes);
  const go = el("button", "settings-done", "Open it →");
  go.type = "button";
  card.appendChild(go);
  reader.appendChild(card);
  reader.appendChild(el("p", "pill-note", "Or pick any prayer from the contents."));

  const key = await sdNowPrayer();
  const leaf = sdFindPrayer(groups, key) || sdFindPrayer(groups, key.replace(/^shabbat-/, ""));
  title.textContent = SD_PRAYERS[key] ? SD_PRAYERS[key].title : "Prayers";
  if (leaf) {
    const target = sdState.flat.find(l => l.ref === leaf.ref) || { ref: leaf.ref, title: leaf.title, trail: [] };
    go.addEventListener("click", () => sdOpen(reader, target));
  } else go.hidden = true;
  try {
    const list = await sdTodayChanges();
    changes.textContent = list.length ? `Today: ${list.join(" · ")}` : "A regular day — no changes to the prayers.";
  } catch (e) { changes.textContent = ""; }
}

/** Open one section: Hebrew / English / both, credits, previous and next. */
async function sdOpen(reader, leaf) {
  sdSetHash(leaf.ref);
  document.querySelectorAll(".sd-leaf.is-on").forEach(x => x.classList.remove("is-on"));
  const btn = document.querySelector(`.sd-leaf[data-ref="${CSS.escape(leaf.ref)}"]`);
  if (btn) {
    btn.classList.add("is-on");
    for (let d = btn.parentElement; d && d.tagName === "DETAILS"; d = d.parentElement) d.open = true;
  }
  document.body.classList.add("sd-reading");

  reader.innerHTML = "";
  const back = el("button", "sd-back", "← Contents");
  back.type = "button";
  back.addEventListener("click", () => { document.body.classList.remove("sd-reading"); sdSetHash(null); window.scrollTo(0, 0); });
  reader.appendChild(back);
  if (leaf.trail && leaf.trail.length) reader.appendChild(el("p", "sd-trail", leaf.trail.filter(Boolean).join(" › ")));
  reader.appendChild(el("h2", "sd-title", leaf.title));
  if (leaf.from) reader.appendChild(el("p", "dg-convert", `From ${leaf.from} — the closest siddur on Sefaria for Shabbat and festivals; Siddur Tehillat Hashem differs in places.`));

  // For today: what to skip, add or say in this section.
  const todayBox = el("div", "sd-today");
  reader.appendChild(todayBox);
  sdDay().then(day => {
    const notes = sdDayNotes(leaf, day);
    if (!notes.length) { todayBox.remove(); return; }
    const night = sdService(leaf.ref) === "maariv";
    const heb = night ? day.hebT : day.heb;
    todayBox.appendChild(el("p", "sd-today-title", `${night ? "For tonight" : "For today"} · ${SD_DOW[night ? (day.dow + 1) % 7 : day.dow]}, ${heb ? `${heb.hd} ${heb.hm}` : ""}`));
    const icons = { skip: "⛔", add: "➕", say: "✅", info: "ℹ️" };
    notes.forEach(n => {
      const p = el("p", "sd-note sd-note--" + n.kind);
      p.appendChild(el("b", null, icons[n.kind] + " "));
      p.appendChild(document.createTextNode(n.text));
      todayBox.appendChild(p);
    });
    if (notes.some(n => n.kind === "skip") && !notes.some(n => n.kind !== "skip")) textBox.classList.add("sd-text--skip");
  });

  const langRow = el("div", "lang-toggle");
  const textBox = el("div", "sd-text");
  [["both", "Both"], ["he", "עברית"], ["en", "English"]].forEach(([v, label]) => {
    const b = el("button", "lang-btn", label);
    b.type = "button";
    b.dataset.lang = v;
    b.addEventListener("click", () => { sdState.lang = v; sdSet(SD_LANG_KEY, v); applyLang(); });
    langRow.appendChild(b);
  });
  function applyLang() {
    textBox.dataset.lang = sdState.lang;
    langRow.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("lang-btn--active", b.dataset.lang === sdState.lang));
  }
  reader.appendChild(langRow);
  reader.appendChild(textBox);
  applyLang();
  textBox.appendChild(el("p", "intro", "Loading the text…"));
  window.scrollTo({ top: reader.getBoundingClientRect().top + window.scrollY - 90 });

  let data;
  try {
    data = await sdFetch(`${SD_API}/texts/${sdRefUrl(leaf.ref)}?context=0&commentary=0`);
    if (data.error) throw new Error(data.error);
  } catch (e) {
    textBox.innerHTML = "";
    textBox.appendChild(el("p", "intro", "Couldn't load this section right now — check your connection, or open it on Sefaria below."));
    reader.appendChild(sdSourceLink(leaf.ref));
    return;
  }
  const he = flattenSefaria(data.he);
  const en = flattenSefaria(data.text);
  textBox.innerHTML = "";
  if (!he.length && !en.length) textBox.appendChild(el("p", "intro", "This section has no text on Sefaria yet."));
  const notes = [];
  for (let i = 0; i < Math.max(he.length, en.length); i++) {
    const row = el("div", "sd-seg");
    if (he[i]) {
      const p = el("p", "sd-he", sefariaHebrew(he[i]));
      p.lang = "he";
      p.dir = "rtl";
      row.appendChild(p);
    }
    if (en[i]) {
      const p = el("p", "sd-en");
      renderVerses(p, [cleanSefariaVerse(en[i], notes)]);
      row.appendChild(p);
    }
    textBox.appendChild(row);
  }
  if (he.length && !en.length) {
    textBox.dataset.noEnglish = "true";
    textBox.insertBefore(el("p", "pill-note", "Sefaria doesn't have an English translation of this section yet — the Hebrew is shown."), textBox.firstChild);
  }

  // Previous / next section.
  const i = sdState.flat.findIndex(l => l.ref === leaf.ref);
  const nav = el("div", "sd-pager");
  [[i - 1, "← "], [i + 1, ""]].forEach(([j, pre], k) => {
    const l = sdState.flat[j];
    if (!l) { nav.appendChild(el("span")); return; }
    const b = el("button", "sd-page-btn", k === 0 ? `${pre}${l.title}` : `${l.title} →`);
    b.type = "button";
    b.addEventListener("click", () => sdOpen(reader, l));
    nav.appendChild(b);
  });
  reader.appendChild(nav);

  // Credits: which edition, and its license, as Sefaria gives them.
  const credit = el("p", "sd-credit");
  const parts = [];
  if (data.heVersionTitle) parts.push(`Hebrew: ${data.heVersionTitle}${data.heLicense ? ` (${data.heLicense})` : ""}`);
  if (data.versionTitle && en.length) parts.push(`English: ${data.versionTitle}${data.license ? ` (${data.license})` : ""}`);
  credit.textContent = parts.join(" · ");
  reader.appendChild(credit);
  reader.appendChild(sdSourceLink(leaf.ref));
}

function sdSourceLink(ref) {
  const a = el("a", "pt-source", "Open on Sefaria");
  a.href = `https://www.sefaria.org/${sdRefUrl(ref)}`;
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSiddurPage);
else initSiddurPage();
