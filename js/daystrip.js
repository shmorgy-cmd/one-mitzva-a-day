/**
 * daystrip.js — the day strip on the Today page: today and the next 7 days as
 * tiles (weekday, date, Hebrew date), special days with a small icon and their
 * name, a "Get ready" button on days that have a guide, and a "Later" line of
 * chips for what's further off. "Get ready" opens the guide in a panel that
 * slides up over the page.
 *
 * Uses app.js (setViewingDate, ensureEventsCover, realToday, viewingDate,
 * groupCountdownEvents, renderPrepCard) and prep.js (PREP_GUIDES,
 * computeOfflineSpan); those load after this file and are only called later.
 */

const DS_DAYS = 8;
let dsStart = null; // first day shown in the strip

/** What to call a Hebcal event on a tile: "Chanukah: 3 Candles" → "Chanukah". */
function dsShortName(title) {
  if (/^Rosh Chodesh/.test(title)) return "Rosh Chodesh";
  if (/^Rosh Hashana/.test(title)) return "Rosh Hashanah";
  return title
    .replace(/:.*$/, "")
    .replace(/\s*\(CH''M\)/, "")
    .replace(/\s+(I{1,3}|IV|V|VI{0,3})$/, "")
    .replace(/\s+\d{4}$/, "")
    .trim();
}

function dsIconFor(name, isFast) {
  const rules = [
    [/Chanukah/, "menorah"], [/Rosh Chodesh/, "moon"], [/Rosh Hashanah/, "apple-honey"],
    [/Yom Kippur/, "gates"], [/Simchat Torah/, "torah-dance"], [/Sukkot|Shmini Atzeret|Hoshana/, "sukkah"],
    [/Pesach/, "matzah"], [/Shavuot/, "wheat"], [/Purim/, "mask"], [/Tu BiShvat/, "tree"],
    [/Tu B.Av|Chag HaBanot/, "heart"], [/Lag BaOmer/, "sun-high"], [/Tish.a B.Av/, "broken-tablets"],
    [/Yom HaShoah|Yom HaZikaron/, "candle-memorial"], [/Yom HaAtzma|Yom Yerushalayim/, "flag-star"],
    [/Selichot/, "shofar"], [/Shabbat/, "candles-shabbat"]
  ];
  const hit = rules.find(([re]) => re.test(name));
  if (hit) return hit[1];
  return isFast ? "broken-tablets" : "star";
}

/** What a day is, for its tile: { name, icon, special, guide } (DOM-free). */
function dsDayInfo(events, date) {
  const todays = (events || []).filter(e => daysBetween(e.date, date) === 0);
  // When a day has several, the bigger one names it: a festival over a fast over
  // a minor day, and smaller customs (Chag HaBanot on Chanukah) last.
  const rank = (e) => ({ major: 0, fast: 1, minor: 2, modern: 3 }[e.subcat] ?? 2) + (/Chag HaBanot/.test(e.title) ? 5 : 0);
  const holidays = todays.filter(e => e.category === "holiday" && e.subcat !== "shabbat")
    .sort((a, b) => (/^Erev /.test(a.title) - /^Erev /.test(b.title)) || (rank(a) - rank(b)));
  const holiday = holidays[0];
  const roshChodesh = todays.find(e => e.category === "roshchodesh");
  const specialShabbat = todays.find(e => e.category === "holiday" && e.subcat === "shabbat");
  let name = "";
  let isFast = false;
  if (holiday) { name = dsShortName(holiday.title); isFast = holiday.subcat === "fast"; }
  else if (roshChodesh) name = "Rosh Chodesh";
  else if (date.getDay() === 6) name = specialShabbat ? specialShabbat.title : "Shabbat";
  else if (date.getDay() === 5) name = "Erev Shabbat";
  // Otherwise, a day your community keeps (Yud-Tes Kislev, a hillula…).
  const prof = typeof currentProfile !== "undefined" ? currentProfile : null;
  if (!name && typeof communityDayShown === "function") {
    // Your community's day first, then another community's.
    const cds = todays.filter(e => e.category === "community" && !e.quiet && communityDayShown(e, prof))
      .sort((a, b) => (communityDayShown(a, prof) === "plain" ? 0 : 1) - (communityDayShown(b, prof) === "plain" ? 0 : 1));
    if (cds[0]) name = cds[0].title.replace(/^Tonight: /, "").replace(/^Yahrzeit of (the )?/, "");
  }
  const guide = typeof PREP_GUIDES !== "undefined"
    ? PREP_GUIDES.find(g => todays.some(e => g.matchTitle(e.title))) || null
    : null;
  return { name, icon: name ? dsIconFor(name, isFast) : null, special: !!name, fast: isFast, guide, noTachanun: dsNoTachanun(events, date, prof) };
}

/** Intl's Hebrew month names, in Hebcal's spelling (what prayer-changes.js expects). */
const DS_HEBCAL_MONTHS = { Tishri: "Tishrei", Heshvan: "Cheshvan", Iyar: "Iyyar", Shevat: "Sh'vat" };

/** Is Tachanun left out on this weekday (by your community's custom)? Not marked on
 *  Shabbat, when it's never said. Computed from the browser's Hebrew calendar. */
function dsNoTachanun(events, date, profile) {
  if (date.getDay() === 6 || typeof noTachanunReason !== "function" || typeof cdHeb !== "function") return false;
  const h = cdHeb(date);
  if (!h) return false;
  const heb = { hd: h.day, hm: DS_HEBCAL_MONTHS[h.month] || h.month };
  const info = pcDayInfo(events, date);
  const community = typeof profileCommunity === "function" ? pcCommunityKey(profileCommunity()) : null;
  return !!noTachanunReason(heb, info, community, profile && profile.nusach);
}

const dsHebFmt = (() => {
  try { return new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long" }); }
  catch (e) { return null; }
})();

/** "17 Kislev" from the browser's own Hebrew calendar (no network needed). */
function dsHebrewDate(date) {
  if (!dsHebFmt) return "";
  try { return dsHebFmt.format(date).replace(/\s+\d{4}$/, ""); } catch (e) { return ""; }
}

/** Keep the viewed day inside the strip (called by setViewingDate). */
function dsFollow(date) {
  if (!dsStart || daysBetween(dsStart, date) < 0 || daysBetween(dsStart, date) >= DS_DAYS) {
    dsStart = daysBetween(realToday, date) >= 0 && daysBetween(realToday, date) < DS_DAYS ? realToday : date;
  }
  renderDayStrip();
}

async function renderDayStrip() {
  const box = document.getElementById("day-strip");
  if (!box || !dsStart) return;
  const start = dsStart;
  let events = [];
  try { events = await ensureEventsCover(start); } catch (e) { console.error(e); }
  if (start !== dsStart) return; // moved again meanwhile

  box.innerHTML = "";
  const head = el("div", "ds-head");
  const isThisWeek = daysBetween(realToday, start) === 0;
  head.appendChild(el("h2", "ds-title", isThisWeek ? "This week" : `From ${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`));

  const btn = (label, aria, onClick, cls) => {
    const b = el("button", "ds-btn" + (cls ? " " + cls : ""), label);
    b.type = "button";
    if (aria) b.setAttribute("aria-label", aria);
    b.addEventListener("click", onClick);
    return b;
  };
  if (!isThisWeek || daysBetween(realToday, viewingDate) !== 0) {
    head.appendChild(btn("Today", "Back to today", () => { dsStart = realToday; setViewingDate(realToday); }, "ds-btn--today"));
  }
  head.appendChild(btn("‹", "Previous week", () => { dsStart = addDays(dsStart, -7); renderDayStrip(); }));
  head.appendChild(btn("›", "Next week", () => { dsStart = addDays(dsStart, 7); renderDayStrip(); }));

  // The printable sheet for the next Shabbat / Yom Tov, right by the arrows.
  const block = findRestBlock(events, viewingDate);
  if (block) {
    const holidays = blockHolidayNames(events, block);
    const name = holidays.length ? holidays.join(" & ") : "Shabbat";
    const p = el("button", "ds-btn ds-print");
    p.type = "button";
    p.innerHTML = PRINTER_SVG;
    p.appendChild(el("span", "ds-print-text", `Print for ${name}`));
    p.setAttribute("aria-label", `Print for ${name} · ${shortDate(block.days[0])}`);
    p.title = `Print for ${name} · ${shortDate(block.days[0])}`;
    p.addEventListener("click", () => openPrintPreview(viewingDate));
    head.appendChild(p);
  }

  // "Other date": a real date input laid over the button, so a tap opens the
  // phone's own calendar.
  const other = el("label", "ds-btn ds-other");
  other.appendChild(el("span", "ds-other-ic", "📅"));
  other.appendChild(el("span", "ds-other-text", "Other date"));
  const input = el("input", "ds-date-input");
  input.type = "date";
  input.id = "date-input";
  input.value = toISO(viewingDate);
  input.setAttribute("aria-label", "Choose any date");
  input.addEventListener("change", () => { if (input.value) setViewingDate(parseLocalDate(input.value)); });
  other.appendChild(input);
  head.appendChild(other);
  box.appendChild(head);

  // The tiles.
  const row = el("div", "ds-row");
  row.setAttribute("role", "list");
  for (let i = 0; i < DS_DAYS; i++) {
    const d = addDays(start, i);
    const info = dsDayInfo(events, d);
    const isToday = daysBetween(realToday, d) === 0;
    const isOn = daysBetween(viewingDate, d) === 0;
    const tile = el("div", "ds-day");
    tile.setAttribute("role", "listitem");
    if (isToday) tile.classList.add("is-today");
    if (isOn) tile.classList.add("is-on");
    if (info.special) tile.classList.add("is-special");
    if (info.fast) tile.classList.add("is-fast");

    const pick = el("button", "ds-pick");
    pick.type = "button";
    const firstOfMonth = i === 0 || d.getDate() === 1;
    pick.appendChild(el("span", "ds-dow", isToday ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" })));
    const num = el("span", "ds-num", String(d.getDate()));
    if (firstOfMonth) num.appendChild(el("small", null, d.toLocaleDateString(undefined, { month: "short" })));
    pick.appendChild(num);
    pick.appendChild(el("span", "ds-sub", info.special ? info.name : dsHebrewDate(d)));
    if (info.noTachanun) pick.appendChild(el("span", "ds-flag", "no Tachanun"));
    pick.setAttribute("aria-label", `${d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${info.special ? ", " + info.name : ""}`);
    if (isOn) pick.setAttribute("aria-current", "date");
    pick.title = `${dsHebrewDate(d)}${info.special ? " · " + info.name : ""}`;
    pick.addEventListener("click", () => setViewingDate(d));
    tile.appendChild(pick);

    if (info.icon) {
      const ic = el("span", "ds-ic");
      ic.setAttribute("aria-hidden", "true");
      ic.innerHTML = getIcon(info.icon);
      tile.appendChild(ic);
    }
    // "Get ready" is there for the whole week the day is in the strip.
    if (info.guide && daysBetween(realToday, d) >= 0) {
      const ready = el("button", "ds-ready", "Get ready →");
      ready.type = "button";
      ready.setAttribute("aria-label", `Get ready for ${info.guide.name}`);
      ready.addEventListener("click", () => openPrepSheet(info.guide, d, events));
      tile.appendChild(ready);
      tile.classList.add("has-ready");
    }
    row.appendChild(tile);
  }
  box.appendChild(row);

  // Further off: one line of chips.
  const end = addDays(start, DS_DAYS - 1);
  const later = groupCountdownEvents(events)
    .filter(g => g.key !== "omer" && daysBetween(end, g.start) > 0 && daysBetween(start, g.start) <= 40)
    .slice(0, 6);
  if (later.length) {
    const line = el("div", "ds-later");
    line.appendChild(el("span", "ds-later-label", "Later"));
    later.forEach(g => {
      const isFast = g.events.some(e => e.subcat === "fast");
      const chip = el("button", "ds-chip");
      chip.type = "button";
      const ic = el("i");
      ic.setAttribute("aria-hidden", "true");
      ic.innerHTML = getIcon(dsIconFor(g.name, isFast));
      chip.appendChild(ic);
      chip.appendChild(el("span", null, g.name));
      const n = daysBetween(realToday, g.start);
      chip.appendChild(el("em", null, n > 1 ? `in ${n} days` : g.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })));
      if (isFast) chip.appendChild(el("span", "ds-fast", "fast"));
      chip.addEventListener("click", () => setViewingDate(g.start));
      line.appendChild(chip);
    });
    box.appendChild(line);
  }

  // On a phone the strip scrolls sideways: keep the viewed day in sight.
  const on = row.querySelector(".is-on");
  if (on) row.scrollLeft = Math.max(0, on.offsetLeft - row.offsetLeft - 8);
}

// ---------------------------------------------------------------------------
// The "Get ready" guide, in a panel that slides up over the page.
// ---------------------------------------------------------------------------

function openPrepSheet(guide, date, events) {
  closePrepSheet();
  const opener = document.activeElement;
  const overlay = el("div", "ds-sheet-overlay");
  overlay.id = "prep-sheet";
  const sheet = el("div", "ds-sheet");
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-label", `Get ready: ${guide.name}`);
  overlay.appendChild(sheet);

  sheet.appendChild(el("div", "ds-sheet-grip"));
  const close = el("button", "ds-sheet-close", "✕");
  close.type = "button";
  close.setAttribute("aria-label", "Close");
  sheet.appendChild(close);

  const body = el("div", "ds-sheet-body");
  sheet.appendChild(body);
  const daysUntil = daysBetween(realToday, date);
  const upcoming = {
    guide, date, daysUntil,
    offlineDays: guide.kind === "day" ? 0 : computeOfflineSpan(events || [], date)
  };
  renderPrepCard(body, upcoming, false, true);

  // Jump buttons to each part of the guide (the story, getting ready, shopping…).
  const labels = [...body.querySelectorAll("h4.section-label")];
  if (labels.length > 1) {
    const jumps = el("div", "ds-sheet-jumps");
    labels.forEach(h => {
      const j = el("button", "ds-jump", h.textContent);
      j.type = "button";
      j.addEventListener("click", () => {
        const offset = jumps.offsetHeight + 8; // the jump buttons stay on top
        const top = body.scrollTop + h.getBoundingClientRect().top - body.getBoundingClientRect().top - offset;
        body.scrollTo({ top, behavior: "smooth" });
      });
      jumps.appendChild(j);
    });
    const head = body.querySelector(".card-head");
    if (head) head.insertAdjacentElement("afterend", jumps);
  }

  function onKey(e) { if (e.key === "Escape") closePrepSheet(); }
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closePrepSheet(); });
  close.addEventListener("click", closePrepSheet);
  document.addEventListener("keydown", onKey);
  overlay._cleanup = () => {
    document.removeEventListener("keydown", onKey);
    document.body.classList.remove("has-sheet");
    if (opener && opener.focus) opener.focus();
  };
  document.body.appendChild(overlay);
  document.body.classList.add("has-sheet");
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  close.focus();
}

function closePrepSheet() {
  const overlay = document.getElementById("prep-sheet");
  if (!overlay) return;
  if (overlay._cleanup) overlay._cleanup();
  overlay.remove();
}
