/**
 * torah-page.js — the Torah reading page (torah.html): this week's portion, one
 * aliyah per day (Sunday = 1st … Shabbat = 7th), Hebrew then English, verse by verse.
 *
 * torah.html?date=2026-11-26            → that day's aliyah
 * torah.html?date=2026-11-26&aliyah=3   → another aliyah of the same week
 */

// The visitor's profile (reportLink in integrations.js reads it), as on the other pages.
let currentProfile = getProfile();

const TR_LANG_KEY = "omad_torah_lang";
const TR_DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Shabbat"];

function trParseDate(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || "");
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d) ? null : d;
}

function trAddDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** The same Hebcal window the home page loads, so a day opened there works offline here. */
async function trLoadEvents(date) {
  const settings = getSettings();
  const start = trISO(trAddDays(date, -25));
  const end = trISO(trAddDays(date, 40));
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&start=${start}&end=${end}&maj=on&min=on&mod=on&nx=on&mf=on&ss=on&s=on&o=on&leyning=on${hebcalCalendarQuery(settings)}`;
  const data = await fetchJSON(url);
  return (data.items || []).map(e => {
    const [y, m, d] = e.date.slice(0, 10).split("-").map(Number);
    return Object.assign({}, e, { date: new Date(y, m - 1, d) });
  });
}

function trGetLang() {
  try { return localStorage.getItem(TR_LANG_KEY) || "both"; } catch (e) { return "both"; }
}
function trSetLang(v) {
  try { localStorage.setItem(TR_LANG_KEY, v); } catch (e) { /* ignore */ }
}

/** Sefaria Hebrew without cantillation, and without the open/closed section marks. */
function trHebrew(s) {
  return sefariaHebrew(s).replace(/\{[פס]\}/g, "").replace(/\s+/g, " ").trim();
}

/** Pair Sefaria's verses with their chapter:verse numbers. A range across chapters
 *  comes back as one array per chapter. */
function trVerses(text, ref) {
  const m = /\s(\d+):(\d+)-/.exec(ref || "");
  const c1 = m ? Number(m[1]) : 1;
  const v1 = m ? Number(m[2]) : 1;
  const out = [];
  const add = (arr, chapter, firstVerse, lang) => (arr || []).forEach((v, i) => {
    const key = `${chapter}:${firstVerse + i}`;
    let row = out.find(r => r.key === key);
    if (!row) { row = { key, he: "", en: "" }; out.push(row); }
    row[lang] = v || "";
  });
  ["en", "he"].forEach(lang => {
    const t = lang === "en" ? text.english : text.hebrew;
    if (!t) return;
    if (Array.isArray(t) && Array.isArray(t[0])) t.forEach((ch, i) => add(ch, c1 + i, i === 0 ? v1 : 1, lang));
    else add(Array.isArray(t) ? t : [t], c1, v1, lang);
  });
  return out;
}

function trRenderText(box, text, ref) {
  box.innerHTML = "";
  const rows = trVerses(text, ref);
  if (!rows.length) {
    box.appendChild(el("p", "intro", "Couldn't load the text right now — check your connection and try again, or read it on Sefaria below."));
    return;
  }
  const notes = [];
  const list = el("div", "tr-verses");
  rows.forEach(r => {
    const v = el("div", "tr-verse");
    v.appendChild(el("span", "tr-num", r.key));
    const body = el("div", "tr-verse-body");
    if (r.he) {
      const he = el("p", "tr-he", trHebrew(r.he));
      he.lang = "he";
      he.dir = "rtl";
      body.appendChild(he);
    }
    if (r.en) {
      const en = el("p", "tr-en");
      renderVerses(en, [cleanSefariaVerse(r.en, notes)]);
      body.appendChild(en);
    }
    v.appendChild(body);
    list.appendChild(v);
  });
  box.appendChild(list);

  if (notes.length) {
    const d = el("details", "torah-notes");
    d.appendChild(el("summary", null, `Translator's notes (${notes.length})`));
    const ol = el("ol");
    notes.forEach(n => {
      const li = el("li");
      if (n.term) li.appendChild(el("strong", null, n.term + " "));
      li.appendChild(document.createTextNode(n.text));
      ol.appendChild(li);
    });
    d.appendChild(ol);
    box.appendChild(d);
  }
}

async function initTorahPage() {
  const app = document.getElementById("tr-app");
  const params = new URLSearchParams(location.search);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = trParseDate(params.get("date")) || today;

  app.innerHTML = "";
  const top = el("section", "mz-top tr-top");
  app.appendChild(top);
  top.appendChild(el("p", "intro", "Loading this week's Torah portion…"));

  let events;
  try {
    events = await trLoadEvents(date);
  } catch (e) {
    console.error(e);
    top.innerHTML = "";
    top.appendChild(el("h1", "mz-title", "This Week's Torah"));
    top.appendChild(el("p", "intro", "Couldn't load this week's portion right now — check your connection and try again."));
    return;
  }
  const p = findParasha(events, date);
  top.innerHTML = "";
  if (!p) {
    top.appendChild(el("h1", "mz-title", "This Week's Torah"));
    top.appendChild(el("p", "intro", "There's no weekly portion listed around this date."));
    return;
  }

  // Header: the parsha, its Hebrew name, and the Shabbat it's read on.
  const head = el("div", "tr-head");
  head.appendChild(iconBadge(bookIconFromRef(p.aliyaRef || (p.leyning && p.leyning.torah)), "icon-badge--gold"));
  const titles = el("div");
  titles.appendChild(el("h1", "mz-title", `Parshat ${p.parashaName}`));
  if (p.hebrewName) {
    const he = el("p", "tr-he-name", p.hebrewName);
    he.lang = "he";
    he.dir = "rtl";
    titles.appendChild(he);
  }
  const shabbat = p.shabbatDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  titles.appendChild(el("p", "mz-sub", `${p.carriedOver ? "Most recently read on" : "Read this Shabbat,"} ${shabbat}`));
  head.appendChild(titles);
  top.appendChild(head);

  top.appendChild(el("p", "tr-intro", p.carriedOver
    ? "A Yom Tov falls on this coming Shabbat, so the regular weekly reading is set aside this week. Here's the most recent portion to keep learning from — the day-by-day cycle picks back up next week."
    : "The week's reading is split into seven parts, called aliyot — one for each day, from Sunday to Shabbat. A few minutes a day, and you've read the whole portion by Shabbat."));

  // One button per day of the week.
  const sunday = trAddDays(p.shabbatDate, -6);
  const chosen = Math.min(7, Math.max(1, Number(params.get("aliyah")) || p.aliyaNum));
  const days = el("div", "tr-days");
  days.setAttribute("role", "tablist");
  days.setAttribute("aria-label", "Choose a day's aliyah");
  top.appendChild(days);

  const reading = el("section", "tr-reading");
  app.appendChild(reading);

  const buttons = [];
  for (let n = 1; n <= 7; n++) {
    const d = trAddDays(sunday, n - 1);
    const b = el("button", "tr-day");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.appendChild(el("span", "tr-day-name", trDays(today, d) === 0 ? "Today" : TR_DOW_SHORT[n - 1]));
    b.appendChild(el("span", "tr-day-aliyah", trOrdinal(n)));
    b.appendChild(el("span", "tr-day-date", d.toLocaleDateString(undefined, { month: "short", day: "numeric" })));
    if (trDays(today, d) === 0) b.classList.add("is-today");
    b.addEventListener("click", () => show(n, true));
    buttons.push(b);
    days.appendChild(b);
  }

  let showing = 0;
  async function show(n, fromClick) {
    if (n === showing) return;
    showing = n;
    buttons.forEach((b, i) => {
      const on = i + 1 === n;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (fromClick) history.replaceState(null, "", torahPageHref(date, n === p.aliyaNum ? 0 : n));
    // On a phone the days scroll sideways: keep the chosen one in view.
    const b = buttons[n - 1];
    days.scrollLeft = Math.max(0, b.offsetLeft - days.offsetLeft - (days.clientWidth - b.offsetWidth) / 2);

    const ref = p.leyning[String(n)];
    reading.innerHTML = "";
    const card = el("article", "torah-card tr-card");
    const book = ref ? ref.split(/\s\d/)[0] : null;
    if (book) card.classList.add("book-" + book);
    const dayName = n === 7 ? "Shabbat" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][n - 1];
    card.appendChild(el("h2", "tr-card-title", `${trOrdinal(n)} aliyah · ${dayName}`));
    if (ref) card.appendChild(el("p", "torah-meta", trPrettyRef(ref)));

    // Hebrew and English, or just one.
    const langRow = el("div", "lang-toggle");
    const opts = [["both", "Both"], ["en", "English"], ["he", "עברית"]];
    const textBox = el("div", "tr-text");
    opts.forEach(([v, label]) => {
      const lb = el("button", "lang-btn", label);
      lb.type = "button";
      lb.addEventListener("click", () => { trSetLang(v); applyLang(); });
      lb.dataset.lang = v;
      langRow.appendChild(lb);
    });
    function applyLang() {
      const lang = trGetLang();
      textBox.dataset.lang = lang;
      langRow.querySelectorAll(".lang-btn").forEach(b => b.classList.toggle("lang-btn--active", b.dataset.lang === lang));
    }
    card.appendChild(langRow);
    card.appendChild(textBox);
    applyLang();
    reading.appendChild(card);

    if (!ref) {
      textBox.appendChild(el("p", "intro", "No reading is listed for this day."));
      return;
    }
    textBox.appendChild(el("p", "intro", "Loading the text…"));
    const text = await loadAliyahText(ref);
    if (showing !== n) return; // another day was picked meanwhile
    trRenderText(textBox, text || {}, ref);

    const links = el("div", "tr-links");
    const path = text && text.sefariaPath;
    if (path) {
      const a = el("a", "torah-link", "This aliyah on Sefaria →");
      a.href = `https://www.sefaria.org/${path}`;
      a.target = "_blank";
      a.rel = "noopener";
      links.appendChild(a);
    }
    const whole = p.leyning && leyningToSefariaPath(p.leyning.torah);
    if (whole) {
      const a = el("a", "torah-link", "The whole parsha on Sefaria →");
      a.href = `https://www.sefaria.org/${whole}`;
      a.target = "_blank";
      a.rel = "noopener";
      links.appendChild(a);
    }
    card.appendChild(links);
    card.appendChild(reportLink(`torah:${p.parashaName}:${ref}`));
  }

  show(chosen, false);

  const back = el("p", "about-back");
  const a = el("a", null, "← Back to today");
  a.href = "./";
  back.appendChild(a);
  app.appendChild(back);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#tab-bar a").forEach(a => {
    const label = a.textContent;
    a.innerHTML = `<span class="tab-icon" aria-hidden="true">${getIcon(a.dataset.icon)}</span><span>${label}</span>`;
  });
  if (typeof applyTransliterationPref === "function") applyTransliterationPref();
  initTorahPage();
});
