/**
 * ui.js — small display helpers shared by the home page (app.js) and the
 * Everyday Mitzvot page (mitzvot-page.js): element helpers, Sefaria text
 * cleanup, and the blessing display (Hebrew first, transliteration on hover or
 * tap, English, the speaker button from audio.js).
 */

const SEFARIA_BASE = "https://www.sefaria.org/api/texts";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url} (${res.status})`);
  return res.json();
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

// --- Blessings and prayers: Hebrew, transliteration on hover, English -------

const SHOW_TR_KEY = "omad_show_transliteration";

function showAllTransliteration() {
  try { return localStorage.getItem(SHOW_TR_KEY) === "1"; } catch (e) { return false; }
}

/** The "always show transliteration" choice applies to the whole page. */
function applyTransliterationPref() {
  const on = showAllTransliteration();
  document.body.classList.toggle("show-tr", on);
  document.querySelectorAll(".hb-toggle").forEach(b => {
    b.textContent = on ? "Hide all transliterations" : "Always show transliteration";
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

/** "Hover (or tap) the Hebrew…" plus the switch to always show transliteration. */
function transliterationHint() {
  const p = el("p", "hb-hint");
  const canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;
  p.appendChild(document.createTextNode(canHover ? "Hover over the Hebrew to see it in English letters. " : "Tap the Hebrew to see it in English letters. "));
  const btn = el("button", "hb-toggle");
  btn.type = "button";
  btn.addEventListener("click", () => {
    try { localStorage.setItem(SHOW_TR_KEY, showAllTransliteration() ? "0" : "1"); } catch (e) { /* ignore */ }
    applyTransliterationPref();
  });
  p.appendChild(btn);
  const on = showAllTransliteration();
  btn.textContent = on ? "Hide all transliterations" : "Always show transliteration";
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  return p;
}

/** One line of a blessing or prayer: the Hebrew first; its transliteration shows
 *  on hover (computers) or when the Hebrew is tapped (phones); then the English. */
function renderHebrewLine(line, audioId) {
  const wrap = el("div", "hb");
  const he = el("p", "hb-he", line.he);
  he.lang = "he";
  he.dir = "rtl";
  // The Hebrew with its speaker button (audio.js); the transliteration follows
  // the row so hovering the Hebrew still reveals it.
  const row = el("div", "hb-row");
  row.appendChild(he);
  row.appendChild(speakerButton(audioId, line.he));
  wrap.appendChild(row);
  if (line.tr) {
    const tr = el("p", "hb-tr", line.tr);
    tr.lang = "en";
    he.tabIndex = 0;
    he.setAttribute("role", "button");
    he.setAttribute("aria-expanded", "false");
    he.setAttribute("aria-label", `${line.he} — show the transliteration`);
    const toggle = () => {
      const on = wrap.classList.toggle("is-tr");
      he.setAttribute("aria-expanded", on ? "true" : "false");
    };
    he.addEventListener("click", toggle);
    he.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
    wrap.appendChild(tr);
  }
  if (line.en) wrap.appendChild(el("p", "hb-en", line.en));
  return wrap;
}

/** A single blessing by its BLESSINGS key (name, then the line). */
function renderBlessing(key) {
  const b = blessingText(key);
  if (!b) return null;
  const box = el("div", "dg-blessing");
  box.appendChild(el("p", "dg-blessing-name", b.name));
  box.appendChild(renderHebrewLine(b, `b-${key}`));
  return box;
}

/** Several blessings under one hint line. */
function renderBlessingGroup(keys) {
  const items = (keys || []).map(renderBlessing).filter(Boolean);
  if (!items.length) return null;
  const group = el("div", "bl-group");
  group.appendChild(transliterationHint());
  items.forEach(b => group.appendChild(b));
  return group;
}

/** A prayer-text line's recording id (see audio.js): its blessing's id when it's
 *  one of the BLESSINGS, "t-<key>-<n>" in a fixed text, none in texts that change
 *  with the day (those use the device's voice). */
function prayerLineAudioId(key, line, i) {
  if (line.audio) return line.audio;
  return typeof PRAYER_TEXTS[key] === "function" ? null : `t-${key}-${i}`;
}

/** Sefaria's Hebrew without its cantillation marks (the vowels stay). */
function sefariaHebrew(s) {
  return stripHtml(s).replace(/[֑-ֽ֯׀]/g, "").replace(/\s+/g, " ").trim();
}

/** One prayer in Hebrew, transliteration and English. Short ones are shown open;
 *  long ones (and everything when `collapsed`) start closed behind "Show the words". */
function renderPrayerText(ref, collapsed) {
  const t = getPrayerText(ref.key, ref.opts);
  if (!t) return null;
  const box = el("details", "pt-box");
  if (!t.long && !collapsed) box.open = true;
  const summary = el("summary", "pt-summary");
  summary.appendChild(el("span", "pt-name", t.name));
  summary.appendChild(el("span", "pt-hint", "Show the words — Hebrew and English"));
  box.appendChild(summary);
  if (t.note) box.appendChild(el("p", "pt-note", t.note));
  if (t.lines.some(l => l && l.tr)) box.appendChild(transliterationHint());
  t.lines.forEach((line, i) => {
    const part = el("div", "pt-line");
    if (line.label) part.appendChild(el("p", "pt-label", line.label));
    part.appendChild(renderHebrewLine(line, prayerLineAudioId(ref.key, line, i)));
    box.appendChild(part);
  });
  if (t.sefaria) {
    const holder = el("div", "pt-sefaria");
    holder.appendChild(el("p", "pt-note", "Loading the text from Sefaria…"));
    box.appendChild(holder);
    let loaded = false;
    const load = async () => {
      if (loaded) return;
      loaded = true;
      try {
        const parts = await Promise.all(t.sefaria.map(r => fetchJSON(`${SEFARIA_BASE}/${r}?context=0&commentary=0`)));
        holder.innerHTML = "";
        parts.forEach((data, i) => {
          const part = el("div", "pt-line");
          const label = t.sefariaLabels ? t.sefariaLabels[i] : t.sefaria[i].replace(/^Psalms\./, "Psalm ").replace(/\.(\d)/, ":$1");
          if (label) part.appendChild(el("p", "pt-label", label));
          const heParts = flattenSefaria(data.he);
          const enParts = flattenSefaria(data.text);
          if (t.sefariaParagraphs) {
            // Paragraph by paragraph: each Hebrew paragraph, then its English.
            heParts.forEach((h, k) => {
              const notes = [];
              const en = enParts[k] ? cleanSefariaVerse(enParts[k], notes).filter(x => typeof x === "string").join("").replace(/\s+/g, " ").trim() : "";
              const line = renderHebrewLine({ he: sefariaHebrew(h), en });
              line.classList.add("hb--para");
              part.appendChild(line);
            });
          } else {
            const heText = heParts.map(sefariaHebrew).join(" ");
            const he = el("p", "hb-he", heText);
            he.lang = "he";
            he.dir = "rtl";
            const row = el("div", "hb-row");
            row.appendChild(he);
            row.appendChild(speakerButton(null, heText));
            part.appendChild(row);
            const notes = [];
            const en = el("p", "hb-en");
            renderVerses(en, enParts.map(v => cleanSefariaVerse(v, notes)));
            part.appendChild(en);
          }
          holder.appendChild(part);
        });
        const link = el("a", "pt-source", "Text and translation from Sefaria");
        link.href = t.sefariaLink || "https://www.sefaria.org/Psalms.113";
        link.target = "_blank";
        link.rel = "noopener";
        holder.appendChild(link);
      } catch (e) {
        loaded = false;
        holder.innerHTML = "";
        holder.appendChild(el("p", "pt-note", t.sefariaFail || "Couldn't load the psalms right now — they're Psalms 113–118 in any siddur or Bible."));
      }
    };
    box.addEventListener("toggle", () => { if (box.open) load(); });
    if (box.open) load();
  }
  return box;
}

/** A blessing list and prayer texts, for any card (mitzvot, holidays, guides). */
function renderWords(container, blessings, texts, heading) {
  const group = renderBlessingGroup(blessings);
  const textEls = (texts || []).map(ref => renderPrayerText(ref, false)).filter(Boolean);
  if (!group && !textEls.length) return;
  if (heading) container.appendChild(el("h4", "section-label", heading));
  if (group) container.appendChild(group);
  textEls.forEach(t => container.appendChild(t));
}


/** Like el(), but runs the text through the glossary so curious/converting
 *  visitors get tap-to-explain terms. `used` keeps each term to one link per card. */
function richEl(tag, cls, text, profile, used) {
  const e = el(tag, cls);
  e.innerHTML = glossify(text, profile, used);
  return e;
}

