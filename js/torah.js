/**
 * torah.js — the week's Torah portion, shared by the home page (the line in the
 * date card) and the reading page (torah.html).
 *
 * The week's reading is split into seven parts (aliyot), one per day: Sunday is
 * the 1st aliyah … Shabbat the 7th (the Chabad "Chitas" custom). Hebcal gives the
 * verse ranges; Sefaria gives the text.
 */

/** Convert a Hebcal leyning string like "Deuteronomy 16:18-17:13" (or "...16:18-20" same-chapter)
 *  into a Sefaria API ref path like "Deuteronomy.16.18-17.13". */
function leyningToSefariaPath(str) {
  const m = /^(.+?)\s(\d+):(\d+)-(?:(\d+):)?(\d+)$/.exec(str || "");
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

function trOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** "Genesis 34:1-34:31" → "Genesis 34:1–31"; "Genesis 34:1-35:11" → "Genesis 34:1–35:11". */
function trPrettyRef(ref) {
  return (ref || "").replace(/(\d+):(\d+)-\1:/, "$1:$2-").replace(/-/g, "–");
}

function trDays(a, b) {
  const day = (d) => { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; };
  return Math.round((day(b) - day(a)) / 86400000);
}

function trISO(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/** Link to the reading page for a day (and, optionally, another aliyah that week). */
function torahPageHref(date, aliya) {
  const iso = typeof date === "string" ? date : trISO(date);
  return `torah.html?date=${iso}${aliya ? `&aliyah=${aliya}` : ""}`;
}

/**
 * The week's portion for `date`, from Hebcal events whose `date` is a local Date.
 * Returns { parashaName, hebrewName, shabbatDate, aliyaNum, aliyaRef, leyning, carriedOver }
 * or null. DOM-free.
 */
function findParasha(events, date) {
  const parashatEvents = (events || []).filter(e => e.category === "parashat" && e.leyning);

  // Normal case: the upcoming (or current) Shabbat has its own weekly portion.
  let evt = parashatEvents
    .filter(e => trDays(date, e.date) >= 0 && trDays(date, e.date) <= 10)
    .sort((a, b) => a.date - b.date)[0];

  // Some years a Yom Tov falls on Shabbat and displaces the regular weekly reading
  // for that week entirely (no "parashat" event appears). Fall back to the most
  // recently completed portion so there's still something meaningful to learn.
  let carriedOver = false;
  if (!evt) {
    evt = parashatEvents
      .filter(e => trDays(e.date, date) >= 0 && trDays(e.date, date) <= 10)
      .sort((a, b) => b.date - a.date)[0];
    carriedOver = true;
  }
  if (!evt) return null;

  const aliyaNum = date.getDay() + 1; // Sunday = 1st … Shabbat = 7th
  return {
    parashaName: evt.title.replace(/^Parashat\s+/, ""),
    hebrewName: evt.hebrew,
    shabbatDate: evt.date,
    aliyaNum,
    aliyaRef: evt.leyning[String(aliyaNum)] || null,
    leyning: evt.leyning,
    carriedOver
  };
}

/** One aliyah's text from Sefaria: { ref, sefariaPath, english, hebrew } (null texts on failure). */
async function loadAliyahText(ref) {
  const path = leyningToSefariaPath(ref);
  if (!path) return null;
  try {
    const data = await fetchJSON(`${SEFARIA_BASE}/${path}?context=0&commentary=0`);
    return { ref, sefariaPath: path, english: data.text, hebrew: data.he };
  } catch (e) {
    console.warn("Sefaria fetch failed", e);
    return { ref, sefariaPath: path, english: null, hebrew: null };
  }
}
