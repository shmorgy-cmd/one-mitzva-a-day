/**
 * print.js — "Print for Shabbat / Yom Tov": builds a clean, black-and-white
 * sheet for the next stretch of rest days (Shabbat, Yom Tov, or both back to
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

function printSection(title) {
  const s = pEl("section", "ps-section");
  s.appendChild(pEl("h2", "ps-h", title));
  return s;
}

async function buildPrintSheet(from) {
  const events = await ensureEventsCover(from);
  const block = findRestBlock(events, from);
  if (!block) return null;
  const israel = isInIsrael(currentSettings);
  const holidays = blockHolidayNames(events, block);
  const saturday = block.days.find(d => d.getDay() === 6);
  const parashatEvt = saturday && events.find(e => e.category === "parashat" && daysBetween(e.date, saturday) === 0);

  const titleParts = [...holidays];
  if (saturday && !titleParts.length) titleParts.push(parashatEvt ? `Shabbat ${parashatEvt.title.replace(/^Parashat /, "Parshat ")}` : "Shabbat");
  else if (saturday) titleParts.push("Shabbat");

  const heb = await Promise.all([block.erev, ...block.days].map(d => getHebrewDateCached(d)));

  const sheet = pEl("article", "print-sheet-inner");
  const head = pEl("header", "ps-header");
  head.appendChild(pEl("h1", "ps-title", titleParts.join(" & ")));
  const range = block.days.length === 1 ? shortDate(block.days[0]) : `${shortDate(block.days[0])} – ${shortDate(block.days[block.days.length - 1])}`;
  const hebRange = heb[1] ? `${heb[1].hd} ${heb[1].hm}${heb.length > 2 ? ` – ${heb[heb.length - 1].hd} ${heb[heb.length - 1].hm}` : ""} ${heb[1].hy}` : "";
  head.appendChild(pEl("p", "ps-sub", `${range}${hebRange ? " · " + hebRange : ""}${currentSettings.location ? " · " + currentSettings.location.name : ""} · ${israel ? "Israel" : "outside Israel"} calendar`));
  sheet.appendChild(head);

  // Times
  const times = printSection("Times");
  const timed = [block.erev, ...block.days].flatMap(d => timedEventsOn(events, d).map(e => ({ d, e })));
  if (timed.length) {
    const table = pEl("table", "ps-times");
    timed.forEach(({ d, e }) => {
      const tr = pEl("tr");
      tr.appendChild(pEl("td", null, shortDate(d)));
      tr.appendChild(pEl("td", null, timedEventLabel(e)));
      tr.appendChild(pEl("td", "ps-time", fmtClock(e.time)));
      table.appendChild(tr);
    });
    times.appendChild(table);
  } else {
    times.appendChild(pEl("p", null, "Set your city in Settings to print candle-lighting and Havdalah times — or check a local Jewish calendar."));
  }
  sheet.appendChild(times);

  // Torah reading
  const torah = printSection("Torah reading");
  let parsha = null;
  if (parashatEvt) {
    parsha = await loadParshaSummary(saturday, israel);
    torah.appendChild(pEl("p", "ps-strong", `${parashatEvt.title.replace(/^Parashat /, "Parshat ")}${parsha && parsha.ref ? ` (${parsha.ref})` : ""}`));
    if (parsha && parsha.summary) torah.appendChild(pEl("p", null, parsha.summary));
  }
  block.days.forEach(d => {
    events.filter(e => e.yomtov && e.leyning && e.leyning.torah && daysBetween(e.date, d) === 0).forEach(e => {
      torah.appendChild(pEl("p", null, `${shortDate(d)} · ${e.title}: ${e.leyning.torah}`));
    });
  });
  if (torah.children.length > 1) sheet.appendChild(torah);

  // Prayer changes, night by night and day by day
  const prayers = printSection("Prayer changes");
  const community = currentProfile && currentProfile.reason === "jewish" ? currentProfile.community : null;
  const allDays = [block.erev, ...block.days];
  for (let i = 0; i < allDays.length; i++) {
    const d = allDays[i];
    if (!heb[i]) continue;
    const r = getPrayerChanges({ date: d, heb: heb[i], hebTomorrow: heb[i + 1] || null, israel, events, community });
    const dayItems = i === 0 ? [] : r.today; // the eve itself is an ordinary day
    const nightItems = r.tonight;            // each night's Maariv
    if (dayItems.length) {
      prayers.appendChild(pEl("p", "ps-day", `${shortDate(d)} — day`));
      const ul = pEl("ul", "ps-list");
      dayItems.forEach(it => ul.appendChild(pEl("li", null, `${it.title}${it.where && it.where !== "—" ? ` — ${it.where}` : ""}`)));
      prayers.appendChild(ul);
    }
    if (nightItems.length) {
      prayers.appendChild(pEl("p", "ps-day", `${shortDate(d)} — night (Maariv)`));
      const ul = pEl("ul", "ps-list");
      nightItems.forEach(it => ul.appendChild(pEl("li", null, `${it.title}${it.where && it.where !== "—" ? ` — ${it.where}` : ""}`)));
      prayers.appendChild(ul);
    }
  }
  prayers.appendChild(pEl("p", "ps-note", "A learning aid that still needs rabbinic review — customs differ, so follow your rabbi and community."));
  sheet.appendChild(prayers);

  // Kiddush & Havdalah
  const kh = printSection("Kiddush & Havdalah — outline");
  kiddushHavdalahOutlines(events, block).forEach(o => {
    kh.appendChild(pEl("p", "ps-day", o.label));
    const ol = pEl("ol", "ps-list");
    o.steps.forEach(s => ol.appendChild(pEl("li", null, s)));
    kh.appendChild(ol);
  });
  kh.appendChild(pEl("p", "ps-note", "An outline only — use a siddur or bencher for the full text."));
  sheet.appendChild(kh);

  // Mitzvah & reflection
  const mitzvah = getMitzvahForDate(block.days[0]);
  const mz = printSection(`This week's mitzvah: ${mitzvah.title}`);
  mz.appendChild(pEl("p", null, mitzvah.intro));
  mz.appendChild(pEl("p", "ps-reflect", mitzvah.inspiration));
  if (mitzvah.sources && mitzvah.sources.length) mz.appendChild(pEl("p", "ps-note", `Sources: ${mitzvah.sources.join("; ")}`));
  sheet.appendChild(mz);

  // Quiz + answer key
  const ctx = buildContext(block.days[0], events, heb[1], currentProfile);
  const occasions = pickOccasions(ctx);
  const portion = parashatEvt && parsha ? { parashaName: parashatEvt.title.replace(/^Parashat /, ""), aliyaRef: parsha.ref } : null;
  const questions = buildTodaysQuiz(occasions, portion, mitzvah);
  if (questions.length) {
    const quiz = printSection("Test yourself");
    const ol = pEl("ol", "ps-quiz");
    const letters = "abcd";
    questions.forEach(q => {
      const li = pEl("li");
      li.appendChild(pEl("p", "ps-q", q.question));
      const opts = pEl("p", "ps-opts", q.options.map((o, i) => `(${letters[i]}) ${o}`).join("   "));
      li.appendChild(opts);
      ol.appendChild(li);
    });
    quiz.appendChild(ol);
    sheet.appendChild(quiz);
    const key = pEl("footer", "ps-key");
    key.textContent = "Answer key: " + questions.map((q, i) => `${i + 1}${letters[q.correctIndex]}`).join("  ·  ");
    sheet.appendChild(key);
  }

  sheet.appendChild(pEl("p", "ps-foot", "One Mitzva a Day · shmorgy-cmd.github.io/one-mitzva-a-day · An introduction, not a halachic ruling — learn with a rabbi."));
  return { sheet, title: titleParts.join(" & ") };
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
