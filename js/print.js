/**
 * print.js — "Print for Shabbat / Yom Tov": builds a warm, colorful two-page sheet
 * (it still prints well in black and white) for the next stretch of rest days (Shabbat, Yom Tov, or both back to
 * back), so people who keep Shabbat offline have the week's essentials on paper.
 *
 * The sheet covers the eve before plus every rest day until the stretch ends,
 * computed from this year's Hebcal events (nothing hard-coded). It opens as an
 * on-screen preview; @media print hides everything except the sheet.
 */

const SEFARIA_CALENDAR = "https://www.sefaria.org/api/calendars";

function isRestDay(events, d) {
  return d.getDay() === 6 || events.some(e => e.yomtov && daysBetween(e.date, d) === 0);
}

/** The next rest stretch after `from` within two weeks: { erev, days: [Date...] }
 *  where days are the consecutive Shabbat/Yom Tov days. If `from` is already a
 *  rest day, that stretch is skipped — people print *before* Shabbat. */
function findRestBlock(events, from) {
  let i = 0;
  while (i <= 14 && isRestDay(events, addDays(from, i))) i++;
  let start = null;
  for (; i <= 21; i++) {
    const d = addDays(from, i);
    if (isRestDay(events, d)) { start = d; break; }
  }
  if (!start) return null;
  const days = [start];
  while (isRestDay(events, addDays(days[days.length - 1], 1))) days.push(addDays(days[days.length - 1], 1));
  return { erev: addDays(start, -1), days };
}

function shortDate(d) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** Holiday names in the block, one per holiday ("Sukkot", "Rosh Hashanah"…). */
function blockHolidayNames(events, block) {
  const names = [];
  groupCountdownEvents(events).forEach(g => {
    const hit = g.events.some(e => e.yomtov && block.days.some(d => daysBetween(e.date, d) === 0));
    if (hit && !names.includes(g.name)) names.push(g.name);
  });
  return names;
}

async function loadParshaSummary(saturday, israel) {
  const url = `${SEFARIA_CALENDAR}?year=${saturday.getFullYear()}&month=${saturday.getMonth() + 1}&day=${saturday.getDate()}&diaspora=${israel ? 0 : 1}`;
  try {
    const data = await fetchJSON(url);
    const item = (data.calendar_items || []).find(i => i.title && i.title.en === "Parashat Hashavua");
    if (!item) return null;
    return {
      name: item.displayValue && item.displayValue.en,
      ref: item.ref,
      summary: item.description && item.description.en
    };
  } catch (e) {
    console.warn("Sefaria calendar failed", e);
    return null;
  }
}

// --- Kiddush & Havdalah outlines --------------------------------------------

function kiddushHavdalahOutlines(events, block) {
  const out = [];
  const firstNightIsShabbat = block.days[0].getDay() === 6;
  const yomTovDays = block.days.filter(d => events.some(e => e.yomtov && daysBetween(e.date, d) === 0));
  const isYT = (d) => yomTovDays.some(y => daysBetween(y, d) === 0);
  const isPesachLastDays = events.some(e => /^Pesach (VII|VIII)$/.test(e.title) && block.days.some(d => daysBetween(e.date, d) === 0));
  const isRH = events.some(e => /^Rosh Hashana/.test(e.title) && block.days.some(d => daysBetween(e.date, d) === 0));
  const isYK = events.some(e => /^Yom Kippur$/.test(e.title) && block.days.some(d => daysBetween(e.date, d) === 0));

  block.days.forEach((d, i) => {
    const label = `${shortDate(addDays(d, -1))} night`;
    const prev = i > 0 ? block.days[i - 1] : null;
    if (isYK && isYT(d) && events.some(e => /^Yom Kippur$/.test(e.title) && daysBetween(e.date, d) === 0)) return; // no Kiddush on Yom Kippur
    if (d.getDay() === 6 && !isYT(d)) {
      out.push({ label: `${label} — Shabbat Kiddush`, steps: ["Vayechulu (Genesis 2:1–3)", "Blessing over wine: borei pri hagafen", "Kiddush blessing: '…mekadesh haShabbat'"] });
    } else if (isYT(d) && prev && prev.getDay() === 6) {
      // Yom Tov beginning on Saturday night: Kiddush also does Havdalah for Shabbat.
      out.push({ label: `${label} — Yom Tov Kiddush with Havdalah`, steps: ["Wine, then the festival Kiddush", "Blessing over a flame (look at two candles' light — don't light a new one)", "Havdalah blessing ending 'bein kodesh l'kodesh'", isPesachLastDays ? "No Shehecheyanu on the last days of Pesach" : "Shehecheyanu", "Remembered as 'YaKNeHaZ': Yayin, Kiddush, Ner, Havdalah, Zman"] });
    } else if (isYT(d)) {
      out.push({ label: `${label} — Yom Tov Kiddush`, steps: [
        d.getDay() === 6 ? "Vayechulu, then the festival Kiddush with Shabbat added" : "Blessing over wine, then the festival Kiddush",
        isPesachLastDays ? "No Shehecheyanu on the last days of Pesach" : "Shehecheyanu",
        ...(isRH ? ["Apple dipped in honey after HaMotzi (first night)"] : [])
      ] });
    }
  });

  const daytime = block.days.filter(d => !(isYK && events.some(e => /^Yom Kippur$/.test(e.title) && daysBetween(e.date, d) === 0)));
  if (daytime.length) {
    out.push({ label: "Daytime Kiddush (before the lunch meal)", steps: [
      "Shabbat: V'shamru (Exodus 31:16–17), then borei pri hagafen",
      ...(yomTovDays.length ? ["Yom Tov: a few verses about the festivals, then borei pri hagafen"] : [])
    ] });
  }

  const last = block.days[block.days.length - 1];
  const endsSat = last.getDay() === 6;
  const nextIsYT = events.some(e => e.yomtov && daysBetween(e.date, addDays(last, 1)) === 0);
  if (!nextIsYT) {
    out.push({
      label: `${shortDate(last)} night — Havdalah`,
      steps: endsSat
        ? ["Blessing over wine (borei pri hagafen)", "Blessing over fragrant spices (borei minei v'samim)", "Blessing over the braided candle's flame (borei me'orei ha'esh)", "Havdalah blessing: '…hamavdil bein kodesh l'chol'"]
        : ["After a Yom Tov that ends on a weekday: wine and the Havdalah blessing only — no spices or candle"]
    });
  }
  return out;
}

// --- Building the sheet -------------------------------------------------------

function pEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** A colored box with an icon and a title. */
function ppBox(icon, title, tone, full) {
  const box = pEl("section", `pp-box pp-${tone}${full ? " pp-full" : ""}`);
  const h = pEl("h2");
  h.appendChild(pEl("span", "pp-ic", icon));
  h.appendChild(document.createTextNode(title));
  box.appendChild(h);
  return box;
}

/** A blessing in Hebrew, transliteration and English. */
function ppBlessing(key, label) {
  const b = blessingText(key);
  if (!b) return null;
  const wrap = pEl("div", "pp-bless");
  if (label) wrap.appendChild(pEl("div", "pp-when", label));
  const he = pEl("div", "pp-heb", b.he);
  he.lang = "he";
  he.dir = "rtl";
  wrap.appendChild(he);
  wrap.appendChild(pEl("div", "pp-tr", b.tr));
  wrap.appendChild(pEl("div", "pp-en", b.en));
  return wrap;
}

const PP_TIME_ICONS = { candles: "🕯️", havdalah: "✨" };

async function buildPrintSheet(from) {
  const events = await ensureEventsCover(from);
  const block = findRestBlock(events, from);
  if (!block) return null;
  const israel = isInIsrael(currentSettings);
  const holidays = blockHolidayNames(events, block);
  const saturday = block.days.find(d => d.getDay() === 6);
  const parashatEvt = saturday && events.find(e => e.category === "parashat" && daysBetween(e.date, saturday) === 0);
  const parshaName = parashatEvt ? parashatEvt.title.replace(/^Parashat /, "") : null;
  const content = parshaName ? parshaContent(parshaName) : null;
  const isYomTov = holidays.length > 0;

  const titleParts = [...holidays];
  if (saturday && !titleParts.length) titleParts.push(parshaName ? `Shabbat ${parshaName}` : "Shabbat");
  else if (saturday) titleParts.push("Shabbat");
  const title = titleParts.join(" & ");

  const heb = await Promise.all([block.erev, ...block.days].map(d => getHebrewDateCached(d)));
  const sheet = document.createDocumentFragment();

  // ---------------------------------------------------------------- page 1
  const p1 = pEl("article", "pp-page");
  const head = pEl("header", "pp-hd");
  const hLeft = pEl("div");
  hLeft.appendChild(pEl("div", "pp-kicker", isYomTov ? "Chag Sameach ✨" : "Shabbat Shalom ✨"));
  hLeft.appendChild(pEl("h1", null, title));
  const hebLine = [parashatEvt && parashatEvt.hebrew, heb[1] ? `${heb[1].hebrew || ""}` : ""].filter(Boolean).join(" · ");
  if (hebLine) { const he = pEl("div", "pp-he", hebLine); he.lang = "he"; he.dir = "rtl"; hLeft.appendChild(he); }
  const last = block.days[block.days.length - 1];
  const nightOf = (d) => `${d.toLocaleDateString(undefined, { weekday: "long" })} night, ${d.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`;
  hLeft.appendChild(pEl("div", "pp-dates", `${nightOf(block.erev)} – ${nightOf(last)}`));
  head.appendChild(hLeft);

  const timesBox = pEl("div", "pp-times");
  timesBox.appendChild(pEl("div", "pp-city", currentSettings.location ? currentSettings.location.name : "Set your city for times"));
  const timed = [block.erev, ...block.days].flatMap(d => timedEventsOn(events, d).map(e => ({ d, e })));
  timed.slice(0, 5).forEach(({ d, e }) => {
    const row = pEl("div", "pp-trow");
    row.appendChild(pEl("span", "pp-tic", PP_TIME_ICONS[e.category] || "⏳"));
    const txt = pEl("div");
    txt.appendChild(pEl("small", null, `${timedEventLabel(e)} · ${d.toLocaleDateString(undefined, { weekday: "short" })}`));
    txt.appendChild(pEl("b", null, fmtClock(e.time)));
    row.appendChild(txt);
    timesBox.appendChild(row);
  });
  if (!timed.length) timesBox.appendChild(pEl("div", "pp-tnone", "Set your city in Settings to print candle-lighting and Havdalah times."));
  head.appendChild(timesBox);
  p1.appendChild(head);

  const grid1 = pEl("div", "pp-grid");
  p1.appendChild(grid1);

  // Candles
  const firstNight = block.days[0];
  const ytFirst = events.some(e => e.yomtov && daysBetween(e.date, firstNight) === 0);
  const candleKey = ytFirst ? (firstNight.getDay() === 6 ? "shabbatYomTovCandles" : "yomTovCandles") : "shabbatCandles";
  const candles = ppBox("🕯️", "Lighting the candles", "gold");
  candles.appendChild(pEl("p", null, "Light the candles before the time above, then cover your eyes and say:"));
  const cb = ppBlessing(candleKey);
  if (cb) candles.appendChild(cb);
  candles.appendChild(pEl("p", "pp-soft", "A quiet moment to add your own prayer — for family, health and peace."));
  grid1.appendChild(candles);

  // Kiddush, washing, challah
  const outlines = kiddushHavdalahOutlines(events, block);
  const meal = ppBox("🍷", "Kiddush, washing & challah", "sky");
  outlines.filter(o => !/Havdalah$/.test(o.label)).forEach(o => {
    const b = pEl("div", "pp-bless");
    b.appendChild(pEl("div", "pp-when", o.label));
    b.appendChild(pEl("div", "pp-en", o.steps.join(" → ")));
    meal.appendChild(b);
  });
  const wash = ppBlessing("netilatYadayim", "Washing the hands");
  if (wash) meal.appendChild(wash);
  const motzi = ppBlessing("hamotzi", "Over the challah");
  if (motzi) meal.appendChild(motzi);
  grid1.appendChild(meal);

  // At the table
  const table = ppBox("📖", parshaName ? `At the table: ${parshaName} in a few lines` : "At the table", "gold", true);
  let sefaria = null;
  if (content) {
    (content.parts || [content]).forEach(c => table.appendChild(pEl("p", null, c.summary)));
    const q = pEl("div", "pp-quote", `"${content.quote.text}" — ${content.quote.ref}`);
    table.appendChild(q);
    const t = pEl("p");
    t.appendChild(pEl("b", null, "A thought: "));
    t.appendChild(document.createTextNode(content.thought));
    table.appendChild(t);
    const ol = pEl("ol", "pp-qs");
    content.questions.forEach(x => ol.appendChild(pEl("li", null, x)));
    table.appendChild(ol);
  } else {
    if (saturday) sefaria = await loadParshaSummary(saturday, israel);
    const mitzvahT = getMitzvahForDate(block.days[0], currentProfile);
    if (sefaria && sefaria.summary) table.appendChild(pEl("p", null, sefaria.summary));
    table.appendChild(pEl("p", "pp-quote", mitzvahT.inspiration));
    const ol = pEl("ol", "pp-qs");
    ["What was the best moment of your week?", "What are you grateful for at this table?", `What does ${isYomTov ? "this holiday" : "Shabbat"} mean to you?`].forEach(x => ol.appendChild(pEl("li", null, x)));
    table.appendChild(ol);
  }
  grid1.appendChild(table);

  // Prayers and the Torah reading
  const prayers = ppBox("🙏", "In the prayers", "mint");
  const plist = pEl("ul");
  const community = (currentProfile && currentProfile.community) || null;
  const allDays = [block.erev, ...block.days];
  for (let i = 0; i < allDays.length; i++) {
    if (!heb[i]) continue;
    const r = getPrayerChanges({ date: allDays[i], heb: heb[i], hebTomorrow: heb[i + 1] || null, israel, events, community });
    const day = allDays[i].toLocaleDateString(undefined, { weekday: "short" });
    if (i > 0) r.today.forEach(it => plist.appendChild(pEl("li", null, `${day}: ${it.title}`)));
    r.tonight.forEach(it => plist.appendChild(pEl("li", null, `${day} night: ${it.title}`)));
  }
  if (!block.days.some(d => d.getDay() !== 6 && !events.some(e => e.yomtov && daysBetween(e.date, d) === 0))) {
    plist.insertBefore(pEl("li", null, `${isYomTov ? "Yom Tov" : "Shabbat"} prayers — no tefillin`), plist.firstChild);
  }
  const torahRef = parashatEvt && parashatEvt.leyning && parashatEvt.leyning.torah;
  if (parshaName) plist.appendChild(pEl("li", null, `Torah reading: ${parshaName}${torahRef ? ` (${torahRef})` : ""}`));
  block.days.forEach(d => events.filter(e => e.yomtov && e.leyning && e.leyning.torah && daysBetween(e.date, d) === 0)
    .forEach(e => plist.appendChild(pEl("li", null, `${e.title}: ${e.leyning.torah}`))));
  prayers.appendChild(plist);
  grid1.appendChild(prayers);

  // Havdalah
  const hav = outlines.find(o => /Havdalah$/.test(o.label));
  if (hav) {
    const havEvt = timed.find(t => t.e.category === "havdalah");
    const hb = ppBox("✨", `Havdalah${havEvt ? ` · ${fmtClock(havEvt.e.time)}` : ""}`, "sky");
    const ol = pEl("ol");
    hav.steps.forEach(s => ol.appendChild(pEl("li", null, s)));
    hb.appendChild(ol);
    grid1.appendChild(hb);
  }
  p1.appendChild(ppFooter("a starting point for learning — ask your rabbi", 1));
  sheet.appendChild(p1);

  // ---------------------------------------------------------------- page 2: kids
  const kids = content && content.kids;
  const mitzvah = getMitzvahForDate(block.days[0], currentProfile);
  const p2 = pEl("article", "pp-page");
  const kh = pEl("header", "pp-hd");
  const kLeft = pEl("div");
  kLeft.appendChild(pEl("div", "pp-kicker", "Kids' corner 🎈"));
  kLeft.appendChild(pEl("h1", null, kids ? kids.title : (isYomTov ? `Happy ${holidays[0]}!` : "Shabbat is here!")));
  kLeft.appendChild(pEl("div", "pp-dates", `For the ${isYomTov ? "holiday" : "Shabbat"} table${parshaName ? ` · Parshat ${parshaName}` : ""}`));
  kh.appendChild(kLeft);
  if (kids) {
    const w = pEl("div", "pp-times pp-word");
    w.appendChild(pEl("div", "pp-city", "This week's word"));
    const row = pEl("div", "pp-trow");
    row.appendChild(pEl("span", "pp-tic", kids.word.emoji));
    const txt = pEl("div");
    txt.appendChild(pEl("b", null, kids.word.word));
    txt.appendChild(pEl("small", null, kids.word.meaning));
    row.appendChild(txt);
    w.appendChild(row);
    kh.appendChild(w);
  }
  p2.appendChild(kh);

  const grid2 = pEl("div", "pp-grid");
  p2.appendChild(grid2);
  if (kids) {
    const story = ppBox("📚", "The story", "rose", true);
    story.appendChild(pEl("p", "pp-story", kids.story));
    grid2.appendChild(story);
    const qs = ppBox("❓", "Can you answer?", "rose");
    [...kids.questions, "What was your favorite part of this week?"].slice(0, 4).forEach((q, i) => {
      const r = pEl("div", "pp-riddle");
      r.appendChild(pEl("b", null, String(i + 1)));
      r.appendChild(pEl("span", null, q));
      qs.appendChild(r);
    });
    grid2.appendChild(qs);
  }
  const check = ppBox("✅", `My ${isYomTov ? "holiday" : "Shabbat"} checklist`, "gold", !kids);
  const cl = pEl("div", "pp-check");
  ["🕯️ Candles", "🍞 Challah", "🍇 Grape juice", "🌸 Flowers", "🍽️ Set the table", "🪙 Tzedakah"].forEach(x => {
    const s = pEl("span");
    s.appendChild(pEl("i"));
    s.appendChild(document.createTextNode(x));
    cl.appendChild(s);
  });
  check.appendChild(cl);
  check.appendChild(pEl("p", "pp-soft", "Before Shabbat, many families put a coin in the tzedakah box — a little kindness to start the day of rest."));
  grid2.appendChild(check);

  const draw = ppBox("🖍️", "Draw it!", "sky", true);
  draw.appendChild(pEl("p", null, kids ? kids.draw : `Draw your family's ${isYomTov ? "holiday" : "Shabbat"} table.`));
  draw.appendChild(pEl("div", "pp-draw", "Your drawing here"));
  grid2.appendChild(draw);

  const mz = ppBox("🌟", `This week's mitzvah: ${mitzvah.title}`, "mint", true);
  mz.appendChild(pEl("p", null, mitzvah.intro));
  grid2.appendChild(mz);
  p2.appendChild(ppFooter(isYomTov ? "Chag Sameach!" : "Shabbat Shalom!", 2));
  sheet.appendChild(p2);

  return { sheet, title };
}

function ppFooter(text, n) {
  const f = pEl("footer", "pp-ft");
  const l = pEl("span");
  l.appendChild(pEl("b", null, "One Mitzva a Day"));
  l.appendChild(document.createTextNode(` · ${text}`));
  f.appendChild(l);
  f.appendChild(pEl("span", null, `Page ${n} of 2`));
  return f;
}

// --- Preview + print ------------------------------------------------------------

async function openPrintPreview(from) {
  const existing = document.getElementById("print-sheet");
  if (existing) existing.remove();

  const wrap = pEl("div", "print-sheet");
  wrap.id = "print-sheet";
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.setAttribute("aria-label", "Printable sheet preview");
  const bar = pEl("div", "print-toolbar");
  const printBtn = pEl("button", "print-btn", "Print");
  printBtn.type = "button";
  const closeBtn = pEl("button", "print-close", "Close");
  closeBtn.type = "button";
  bar.appendChild(pEl("span", "print-toolbar-title", "Printable sheet"));
  bar.appendChild(printBtn);
  bar.appendChild(closeBtn);
  wrap.appendChild(bar);
  const page = pEl("div", "print-page");
  page.appendChild(pEl("p", "print-loading", "Preparing your sheet…"));
  wrap.appendChild(page);
  document.body.appendChild(wrap);
  document.body.classList.add("print-mode", "no-scroll");

  function close() {
    wrap.remove();
    document.body.classList.remove("print-mode", "no-scroll");
    document.removeEventListener("keydown", onKey);
  }
  function onKey(e) { if (e.key === "Escape") close(); }
  closeBtn.addEventListener("click", close);
  printBtn.addEventListener("click", () => window.print());
  document.addEventListener("keydown", onKey);
  closeBtn.focus();

  try {
    const built = await buildPrintSheet(from);
    page.innerHTML = "";
    if (!built) {
      page.appendChild(pEl("p", null, "No Shabbat or Yom Tov found in the next two weeks."));
      printBtn.disabled = true;
      return;
    }
    page.appendChild(built.sheet);
    bar.firstChild.textContent = `Printable sheet · ${built.title}`;
  } catch (e) {
    console.error(e);
    page.innerHTML = "";
    page.appendChild(pEl("p", null, "Couldn't build the sheet right now — please check your connection and try again."));
    printBtn.disabled = true;
  }
}
