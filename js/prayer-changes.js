/**
 * prayer-changes.js — "What changes in prayer today": a small rules engine.
 *
 *   getPrayerChanges({ date, heb, hebTomorrow, israel, events, community })
 *     date        – JS Date (local midnight) for the civil day being viewed
 *     heb         – Hebrew date of that day's daytime, from Hebcal's converter:
 *                   { hd: 11, hm: "Kislev", hy: 5787 }
 *     hebTomorrow – same, for the next civil day (optional; improves "tonight" items)
 *     israel      – true for the Israel calendar
 *     events      – Hebcal events (each with a local-midnight `date`), covering at
 *                   least today and tomorrow
 *     community   – "ashkenazi" | "sephardi" | "chabad" | "litvish" | "other" | null
 *
 *   returns { today: [...], tonight: [...], season: [...] }, each item:
 *     { id, title, detail, where, customs?: { ashkenazi, sephardi, chabad } }
 *
 * A civil day's Shacharit and Mincha belong to that day's Hebrew date; its Maariv
 * already belongs to the next Hebrew date (the Jewish day starts at nightfall),
 * which is why "tonight" items look at tomorrow.
 *
 * This is a learning aid, not a ruling — it needs review by a rabbi, and the
 * page says so wherever these results are shown.
 */

const PC_MONTH_ORDER = {
  "Tishrei": 1, "Cheshvan": 2, "Kislev": 3, "Tevet": 4, "Sh'vat": 5,
  "Adar": 6, "Adar I": 6, "Adar II": 7, "Nisan": 8, "Iyyar": 9,
  "Sivan": 10, "Tamuz": 11, "Av": 12, "Elul": 13
};

function pcMonth(heb) { return PC_MONTH_ORDER[heb.hm] || 0; }

/** Compare a Hebrew date with (month, day) within the same Hebrew year (Tishrei-first). */
function pcCmp(heb, month, day) {
  const a = pcMonth(heb) * 100 + heb.hd;
  const b = PC_MONTH_ORDER[month] * 100 + day;
  return a - b;
}

function pcIs(heb, month, day) { return heb && heb.hm === month && heb.hd === day; }

function pcSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function pcAddDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function pcEventsOn(events, day) {
  return events.filter(e => pcSameDay(e.date, day));
}

function pcIsGregorianLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Outside Israel, V'ten tal umatar starts at Maariv on the evening of Dec 4 —
 *  or Dec 5 when the following February has 29 days. Returns that civil date. */
function talUmatarDiasporaStart(year) {
  return new Date(year, 11, pcIsGregorianLeap(year + 1) ? 5 : 4);
}

/** The Ashkenazi first Selichot: the Saturday night at least four days before Rosh Hashanah. */
function ashkenaziSelichotStart(roshHashanaDate) {
  const d = new Date(roshHashanaDate);
  while (d.getDay() !== 6) d.setDate(d.getDate() - 1);
  if (Math.round((roshHashanaDate - d) / 86400000) < 4) d.setDate(d.getDate() - 7);
  return d; // Selichot begin after midnight on this Saturday night
}

function pcCommunityKey(community) {
  if (community === "litvish") return "ashkenazi";
  if (community === "ashkenazi" || community === "sephardi" || community === "chabad") return community;
  return null; // unknown — show every community's note
}

// ---------------------------------------------------------------------
// Day classification from Hebcal events
// ---------------------------------------------------------------------

function pcDayInfo(events, day) {
  const evs = pcEventsOn(events, day);
  const titles = evs.map(e => e.title);
  const has = (re) => titles.some(t => re.test(t));
  const chanukahEvt = evs.find(e => /^Chanukah/.test(e.title));
  const candles = chanukahEvt ? (/(\d+) Candles?/.exec(chanukahEvt.title) || [])[1] : null;
  const omerEvt = evs.find(e => e.category === "omer");
  return {
    events: evs,
    roshChodesh: evs.some(e => e.category === "roshchodesh"),
    yomTov: evs.some(e => e.yomtov),
    roshHashana: has(/^Rosh Hashana( \d{3,4}| II)$/),
    yomKippur: has(/^Yom Kippur$/),
    cholHamoed: has(/\(CH/) || has(/Hoshana Raba/),
    hoshanaRabba: has(/Hoshana Raba/),
    sukkot: has(/^Sukkot/),
    shminiAtzeret: has(/^Shmini Atzeret/),
    simchatTorah: has(/^Simchat Torah/),
    pesach: has(/^Pesach [IVX]+\b/),
    pesachFirst: has(/^Pesach I$/) || has(/^Pesach II$/),
    shavuot: has(/^Shavuot/),
    // Hebcal's "Chanukah: 1 Candle" is the eve (24 Kislev); the eight days of
    // Chanukah are "2 Candles" … "8 Candles" and "8th Day".
    chanukahEve: candles === "1",
    chanukahDay: !!chanukahEvt && candles !== "1",
    purim: has(/^Purim$/),
    shushanPurim: has(/^Shushan Purim$/),
    purimKatan: has(/^(Shushan )?Purim Katan$/),
    // Also matches "Tish’a B’Av (observed)" when the 9th falls on Shabbat.
    tishaBav: has(/^Tish.a B.Av/),
    erevTishaBav: has(/^Erev Tish.a B.Av/),
    fast: evs.some(e => e.subcat === "fast" && !/Bechorot/.test(e.title)) || has(/^Tish.a B.Av/),
    yomHaatzmaut: has(/^Yom HaAtzma.ut/),
    yomYerushalayim: has(/^Yom Yerushalayim/),
    pesachSheni: has(/^Pesach Sheni$/),
    lagBaomer: has(/^Lag BaOmer$/),
    tuBishvat: has(/^Tu BiShvat$/),
    tuBav: has(/^Tu B.Av$/),
    erevRoshHashana: has(/^Erev Rosh Hashana/),
    omerDay: omerEvt ? Number((/(\d+)/.exec(omerEvt.title) || [])[1]) : null
  };
}

/** Why Tachanun is left out on this Hebrew date, or null when it's said. */
function noTachanunReason(heb, info, community, nusach) {
  if (info.yomTov || info.roshHashana || info.yomKippur) return "it's a festival";
  if (info.roshChodesh) return "it's Rosh Chodesh";
  if (info.chanukahDay) return "it's Chanukah";
  if (info.purim || info.shushanPurim) return "it's Purim";
  if (info.purimKatan) return "it's Purim Katan";
  if (info.tishaBav) return "Tisha B'Av is called a 'festival' (mo'ed) in Lamentations";
  if (info.cholHamoed) return "it's Chol HaMoed";
  if (heb.hm === "Nisan") return "the whole month of Nisan is festive";
  if (pcIs(heb, "Iyyar", 14) || info.pesachSheni) return "it's Pesach Sheni";
  if (pcIs(heb, "Iyyar", 18) || info.lagBaomer) return "it's Lag BaOmer";
  if (heb.hm === "Sivan" && heb.hd <= 12) return "these are the festive days around Shavuot";
  if (pcIs(heb, "Av", 15)) return "it's Tu B'Av";
  if (pcIs(heb, "Sh'vat", 15)) return "it's Tu BiShvat";
  if (pcIs(heb, "Elul", 29)) return "it's Erev Rosh Hashanah";
  if (heb.hm === "Tishrei" && heb.hd >= 9) return "from Erev Yom Kippur to the end of Tishrei is a festive stretch";
  const cd = pcChassidicDay(heb);
  if (cd && community === "chabad" && cd.chabad) return `it's ${cd.name}, a Chabad festive day (Chabad custom)`;
  if (cd && nusach === "sefard" && cd.sefard) return `it's ${cd.name}, a Chassidic festive day (Chassidic custom)`;
  return null;
}

/** Festive days on which Chabad (and on 19 Kislev, many Chassidim) leave out Tachanun. */
function pcChassidicDay(heb) {
  if (pcIs(heb, "Kislev", 19)) return { name: "Yud-Tes Kislev", chabad: true, sefard: true };
  if (pcIs(heb, "Kislev", 20)) return { name: "the day after Yud-Tes Kislev", chabad: true, sefard: false };
  if (pcIs(heb, "Tamuz", 12)) return { name: "Yud-Beis Tammuz", chabad: true, sefard: false };
  if (pcIs(heb, "Tamuz", 13)) return { name: "Yud-Gimmel Tammuz", chabad: true, sefard: false };
  return null;
}

// ---------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------

function getPrayerChanges({ date, heb, hebTomorrow, israel, events, community, nusach }) {
  const today = [];
  const tonight = [];
  const season = [];
  const weekly = []; // every-week additions (Monday & Thursday), shown apart from "what changes today"
  const dow = date.getDay();
  const tomorrowDate = pcAddDays(date, 1);
  const info = pcDayInfo(events, date);
  const next = pcDayInfo(events, tomorrowDate);
  const comm = pcCommunityKey(community);
  const weekday = dow !== 6 && !info.yomTov && !info.roshHashana && !info.yomKippur;

  // --- Shabbat / festivals / High Holidays --------------------------------
  if (info.yomKippur) {
    today.push({
      id: "yom-kippur",
      title: "Yom Kippur prayers",
      detail: "Five services — Maariv with Kol Nidrei, Shacharit, Musaf, Mincha and Ne'ilah — each with the Vidui (confession) and the High Holiday additions.",
      where: "The whole day, from a Yom Kippur machzor"
    });
  } else if (info.roshHashana) {
    today.push({
      id: "rosh-hashana",
      title: "Rosh Hashanah prayers",
      detail: "A special Amidah built around God's kingship, with the shofar blown during Musaf (not when the first day is Shabbat).",
      where: "All services, from a Rosh Hashanah machzor"
    });
  } else if (info.yomTov) {
    today.push({
      id: "yom-tov",
      title: "Festival prayers",
      detail: "The Amidah has a festival middle blessing instead of the weekday requests, and Musaf is added after the Torah reading.",
      where: "Shacharit, Musaf, Mincha"
    });
  } else if (dow === 6) {
    today.push({
      id: "shabbat",
      title: "Shabbat prayers",
      detail: "The Amidah has seven blessings — the weekday requests are left out — and Musaf is added after the Torah reading.",
      where: "Shacharit, Musaf, Mincha"
    });
  }

  // --- Ya'aleh v'Yavo, Musaf on Rosh Chodesh / Chol HaMoed ----------------
  if (info.roshChodesh || info.cholHamoed || info.yomTov || info.roshHashana) {
    const why = info.roshChodesh ? "Rosh Chodesh" : info.cholHamoed ? "Chol HaMoed" : "the festival";
    today.push({
      id: "yaaleh-vyavo",
      title: "Add Ya'aleh v'Yavo",
      detail: `A paragraph asking God to 'remember' us on ${why}.`,
      where: "Amidah (in R'tzei, near the end) and Grace After Meals"
    });
  }
  if ((info.roshChodesh || info.cholHamoed) && !info.yomTov) {
    today.push({
      id: "musaf",
      title: "Torah reading and Musaf",
      detail: `On ${info.roshChodesh ? "Rosh Chodesh" : "Chol HaMoed"} the Torah is read and an extra 'Musaf' Amidah is added, recalling the extra Temple offering.`,
      where: "After Shacharit",
      customs: info.roshChodesh ? { ashkenazi: "Psalm 104 (Barchi Nafshi) is added at the end of Shacharit." } : undefined
    });
  }

  // --- Hallel ----------------------------------------------------------------
  let hallel = null;
  if (info.chanukahDay || info.sukkot || info.shminiAtzeret || info.simchatTorah || info.shavuot || info.pesachFirst) {
    hallel = "full";
  } else if (info.pesach || (info.roshChodesh && !info.chanukahDay)) {
    hallel = "half";
  }
  if (hallel === "full") {
    today.push({
      id: "hallel-full",
      title: "Full Hallel",
      detail: "Psalms 113–118, sung in praise, with a blessing before and after.",
      where: "Shacharit, right after the Amidah"
    });
  } else if (hallel === "half") {
    today.push({
      id: "hallel-half",
      title: "Half Hallel",
      detail: `Hallel with two passages skipped — on ${info.pesach ? "the later days of Pesach, since the Egyptians drowned at the sea" : "Rosh Chodesh, which is a lighter celebration"}.`,
      where: "Shacharit, right after the Amidah",
      customs: {
        ashkenazi: "Said with a blessing.",
        sephardi: "Said without a blessing.",
        chabad: "Said with a blessing."
      }
    });
  }
  if (info.yomHaatzmaut || info.yomYerushalayim) {
    today.push({
      id: "hallel-modern",
      title: "Hallel? Depends on your community",
      detail: "Many Religious Zionist synagogues say Hallel today; others add nothing.",
      where: "Shacharit, after the Amidah",
      customs: {
        ashkenazi: "Religious Zionist synagogues say Hallel, many with a blessing; most Haredi synagogues don't.",
        sephardi: "Many say Hallel without a blessing, following Rav Ovadia Yosef.",
        chabad: "No Hallel; the prayers are unchanged."
      }
    });
  }
  if (info.roshHashana || info.yomKippur || info.purim) {
    today.push({
      id: "no-hallel",
      title: "No Hallel today",
      detail: info.purim
        ? "Reading the Megillah takes the place of Hallel on Purim."
        : "Hallel isn't said on the Days of Awe — the Talmud asks how we could sing while the books of life and death are open.",
      where: "—"
    });
  }

  // --- Tachanun ----------------------------------------------------------------
  if (dow !== 6) {
    const reason = noTachanunReason(heb, info, community, nusach);
    // Monday and Thursday: a longer Tachanun and prayers around the Torah reading —
    // all left out, like Tachanun itself, on days without it.
    if ((dow === 1 || dow === 4) && weekday && !reason) {
      weekly.push({
        id: "mon-thu-additions",
        title: "Longer Tachanun and prayers around the Torah reading",
        detail: "On Mondays and Thursdays, V'hu Rachum — a long plea for mercy — is said before the regular Tachanun, and short prayers are added before and after the Torah reading.",
        where: "Shacharit",
        customs: {
          ashkenazi: "V'hu Rachum (said standing) before Tachanun; Kel Erech Apayim just before the Torah is taken out; and the four Yehi Ratzon prayers after the reading, before it's returned.",
          sephardi: "V'hu Rachum is said with Tachanun. Kel Erech Apayim and the Ashkenazi Yehi Ratzon prayers aren't part of most Sephardi siddurim — follow yours.",
          chabad: "V'hu Rachum before Tachanun, Kel Erech Apayim before the Torah is taken out, and the Yehi Ratzon prayers after the reading, as in Siddur Tehillat Hashem."
        }
      });
    }
    if (reason && weekday) {
      today.push({
        id: "no-tachanun",
        title: "No Tachanun",
        detail: `The short prayer of supplication is left out because ${reason}.`,
        where: "After the Amidah, Shacharit and Mincha"
      });
    } else if (!reason && weekday && dow !== 5) {
      const nextReason = hebTomorrow ? noTachanunReason(hebTomorrow, next, community, nusach) : null;
      if (nextReason || next.yomTov || next.chanukahDay || next.purim) {
        today.push({
          id: "no-tachanun-mincha",
          title: "No Tachanun at Mincha",
          detail: "Tachanun is left out at Mincha on the afternoon before a day without it.",
          where: "Mincha, after the Amidah"
        });
      }
    }
    // A Chassidic festive day, for those whose nusach is "Not sure" / "Other" (or not
    // set): shown side by side. A specific nusach sees only its own custom.
    const cd = pcChassidicDay(heb);
    const sideBySide = !nusach || nusach === "unsure" || nusach === "other";
    if (cd && weekday && !reason && sideBySide) {
      today.push({
        id: "tachanun-community",
        title: "Tachanun: depends on your community",
        detail: `Today is ${cd.name}. ${cd.sefard ? "Chabad and many Chassidim leave" : "Chabad leaves"} out Tachanun; other communities say it as usual.`,
        where: "After the Amidah, Shacharit and Mincha",
        customs: {
          chabad: "Not said — a Chabad festive day.",
          ashkenazi: cd.sefard ? "Said as usual (many Chassidim leave it out)." : "Said as usual.",
          sephardi: "Said as usual."
        }
      });
    }
    if (info.yomHaatzmaut || info.yomYerushalayim) {
      today.push({
        id: "tachanun-modern",
        title: "Tachanun: depends on your community",
        detail: "Many Religious Zionist communities leave it out today; many others say it as usual.",
        where: "After the Amidah"
      });
    }
  }

  // --- Al HaNissim ----------------------------------------------------------------
  if (info.chanukahDay || info.purim || (info.shushanPurim && israel)) {
    today.push({
      id: "al-hanissim",
      title: "Add Al HaNissim",
      detail: `'For the miracles' — a paragraph about ${info.chanukahDay ? "the Chanukah story" : "the Purim story"}.`,
      where: "Amidah (in Modim, the thanksgiving blessing) and Grace After Meals",
      customs: info.shushanPurim ? { ashkenazi: "On Shushan Purim it's said only in Jerusalem (and other ancient walled cities)." } : undefined
    });
  }
  if (info.purim) {
    today.push({
      id: "megillah",
      title: "Megillah reading",
      detail: "The Book of Esther is read aloud tonight and again this morning.",
      where: "After the Amidah at Maariv and Shacharit"
    });
  }

  // --- Fast days -------------------------------------------------------------------
  if (info.fast && !info.yomKippur) {
    const tisha = info.tishaBav;
    today.push({
      id: "aneinu",
      title: "Add Aneinu",
      detail: "'Answer us' — a short plea added on a public fast by those who are fasting.",
      where: "Amidah, in Shema Koleinu (the chazzan says it as its own blessing in the repetition)",
      customs: {
        ashkenazi: "Individuals add it only at Mincha.",
        sephardi: "Individuals add it at Shacharit and Mincha.",
        chabad: "Individuals add it only at Mincha."
      }
    });
    today.push({
      id: "fast-torah",
      title: "Fast-day Torah reading",
      detail: tisha
        ? "In the morning, Deuteronomy 4:25–40; at Mincha, Vayechal (Exodus 32 and 34) with a Haftarah."
        : "Vayechal (Exodus 32 and 34), about Moses pleading for forgiveness, at Shacharit and again at Mincha.",
      where: "After the Amidah",
      customs: tisha ? undefined : {
        ashkenazi: "A Haftarah (Isaiah 55–56) is read at Mincha.",
        sephardi: "Most Sephardi communities read no Haftarah at Mincha.",
        chabad: "A Haftarah is read at Mincha."
      }
    });
    if (tisha) {
      today.push({
        id: "tisha-bav",
        title: "Tisha B'Av changes",
        detail: "Kinot (elegies) after Shacharit; tallit and tefillin are worn at Mincha instead of Shacharit; 'Nachem' (a prayer for comfort) is added at Mincha.",
        where: "Shacharit and Mincha ('Nachem' goes in the Jerusalem blessing of the Amidah)"
      });
    } else if (!(heb.hm === "Tishrei" && heb.hd <= 9)) {
      // (In the Ten Days, Selichot and Avinu Malkeinu are listed separately below.)
      today.push({
        id: "fast-selichot",
        title: "Selichot and Avinu Malkeinu",
        detail: "Penitential prayers are added, as on every public fast.",
        where: "After the Amidah at Shacharit (Avinu Malkeinu also at Mincha)",
        customs: {
          ashkenazi: "Avinu Malkeinu at Shacharit and Mincha.",
          sephardi: "Selichot in the morning; most Sephardim say Avinu Malkeinu only in the Ten Days of Repentance."
        }
      });
    }
  }
  if (next.tishaBav && !info.tishaBav) {
    tonight.push({
      id: "eichah",
      title: "Eichah tonight",
      detail: "The Book of Lamentations is read, often by dim light, sitting on low seats as mourners do.",
      where: "After Maariv"
    });
  }

  // --- High Holiday season ------------------------------------------------------
  const aseret = heb.hm === "Tishrei" && heb.hd >= 3 && heb.hd <= 9;
  if (aseret) {
    today.push({
      id: "aseret-changes",
      title: "Ten Days of Repentance changes",
      detail: "Say 'HaMelech HaKadosh' (the holy King) and, on weekdays, 'HaMelech HaMishpat' (the King of judgment), and add the four short requests to be 'written in the book of life' (Zochreinu, Mi Chamocha, Uchtov, B'sefer Chayim). Forgetting HaMelech HaKadosh is a bigger deal than the others — ask your rabbi what to do if it happens.",
      where: "Amidah: blessings 1, 2, 3, 11, 18 and 19",
      customs: { ashkenazi: "Many also end the Amidah and Kaddish with 'Oseh HaShalom'." }
    });
  }
  if ((aseret && weekday && !pcIs(heb, "Tishrei", 9)) || (info.roshHashana && dow !== 6) || info.yomKippur) {
    today.push({
      id: "avinu-malkeinu",
      title: "Avinu Malkeinu",
      detail: "'Our Father, our King' — a litany of requests for the new year.",
      where: "After the Amidah at Shacharit and Mincha"
    });
  } else if (aseret && weekday && pcIs(heb, "Tishrei", 9)) {
    today.push({
      id: "avinu-malkeinu-erev-yk",
      title: "Avinu Malkeinu on Erev Yom Kippur",
      detail: "Usually left out today because the day is festive — unless Erev Yom Kippur falls on Friday.",
      where: "Shacharit"
    });
  }

  // Selichot (before Shacharit)
  const rhEvt = events.find(e => /^Rosh Hashana \d{3,4}$/.test(e.title) && e.date >= pcAddDays(date, -10));
  const inElulSeason = heb.hm === "Elul" || (heb.hm === "Tishrei" && heb.hd <= 9);
  if (inElulSeason && weekday && !info.roshHashana) {
    const ashStart = rhEvt ? ashkenaziSelichotStart(rhEvt.date) : null;
    const ashkenaziToday = ashStart ? date > ashStart : false;
    const sephardiToday = (heb.hm === "Elul" && heb.hd >= 2) || heb.hm === "Tishrei";
    const notes = {
      ashkenazi: ashkenaziToday ? "Said today, before Shacharit." : "Not yet — Ashkenazi Selichot begin on the Saturday night before Rosh Hashanah.",
      sephardi: sephardiToday ? "Said today, before dawn or before Shacharit." : "Begin on 2 Elul.",
      chabad: ashkenaziToday ? "Said today, before Shacharit." : "Not yet — they begin on the Saturday night before Rosh Hashanah."
    };
    const applies = comm ? (comm === "sephardi" ? sephardiToday : ashkenaziToday) : (ashkenaziToday || sephardiToday);
    if (applies) {
      today.push({
        id: "selichot",
        title: "Selichot",
        detail: "Penitential prayers in the run-up to Yom Kippur, built around the Thirteen Attributes of Mercy.",
        where: "Before Shacharit",
        customs: notes
      });
    }
  }
  if (rhEvt && dow === 6 && pcSameDay(ashkenaziSelichotStart(rhEvt.date), date) && comm !== "sephardi") {
    tonight.push({
      id: "selichot-first",
      title: "First Selichot tonight",
      detail: "The first Ashkenazi Selichot service, usually after midnight.",
      where: "Late tonight, after Shabbat ends"
    });
  }

  // --- Omer ----------------------------------------------------------------------
  if (info.omerDay) {
    today.push({
      id: "omer-today",
      title: `Today is day ${info.omerDay} of the Omer`,
      detail: "It was counted last night. If you forgot, count during the day today without the blessing, then keep counting with the blessing tonight.",
      where: "Any time today"
    });
  }
  if (next.omerDay) {
    const n = next.omerDay;
    const weeks = Math.floor(n / 7);
    const days = n % 7;
    const weekPart = weeks ? `, which is ${weeks} week${weeks > 1 ? "s" : ""}${days ? ` and ${days} day${days > 1 ? "s" : ""}` : ""}` : "";
    tonight.push({
      id: "omer-tonight",
      title: `Count the Omer: day ${n}`,
      detail: `Say the blessing ('…al sefirat ha'omer'), then: 'Today is ${n} day${n > 1 ? "s" : ""}${weekPart} of the Omer.'`,
      where: "After nightfall, usually at the end of Maariv",
      customs: {
        ashkenazi: "Most say 'ba'Omer'.",
        sephardi: "Say 'la'Omer'.",
        chabad: "Say 'la'Omer'."
      }
    });
  }

  // --- Tonight's Maariv additions ------------------------------------------------
  if (next.roshChodesh && !info.roshChodesh) {
    tonight.push({
      id: "yaaleh-tonight",
      title: "Ya'aleh v'Yavo from tonight",
      detail: "Rosh Chodesh begins at nightfall, so start adding it at Maariv.",
      where: "Amidah (in R'tzei)"
    });
  }
  if (info.chanukahEve) {
    tonight.push({
      id: "al-hanissim-tonight",
      title: "Al HaNissim from tonight",
      detail: "Chanukah begins tonight — light the first candle and start adding Al HaNissim at Maariv.",
      where: "Amidah (in Modim) and Grace After Meals"
    });
  }
  if (dow === 6 && !next.yomTov) {
    tonight.push({
      id: "atah-chonantanu",
      title: "Atah Chonantanu tonight",
      detail: "A short Havdalah paragraph marking the end of Shabbat.",
      where: "Maariv Amidah, in the 4th blessing (Atah Chonen)"
    });
  }

  // --- Seasonal: rain and dew ------------------------------------------------------
  const winterRain = pcCmp(heb, "Tishrei", 22) > 0 && pcCmp(heb, "Nisan", 15) < 0;
  if (pcIs(heb, "Tishrei", 22)) {
    today.push({
      id: "geshem",
      title: "Start 'Mashiv haruach u'morid hageshem'",
      detail: "'Who makes the wind blow and the rain fall' — from Musaf today (after the prayer for rain) until Pesach.",
      where: "Amidah, 2nd blessing"
    });
  } else if (pcIs(heb, "Nisan", 15)) {
    today.push({
      id: "tal",
      title: "Stop 'Mashiv haruach' — summer begins",
      detail: "From Musaf today (after the prayer for dew), the rain phrase is dropped until Shmini Atzeret.",
      where: "Amidah, 2nd blessing",
      customs: {
        ashkenazi: israel ? "In Israel, say 'morid hatal' instead." : "Outside Israel, say nothing in its place.",
        sephardi: "Say 'morid hatal' (who brings down the dew).",
        chabad: "Say 'morid hatal'."
      }
    });
  } else if (winterRain) {
    season.push({
      id: "mashiv-haruach",
      title: "Mashiv haruach u'morid hageshem",
      detail: "'Who makes the wind blow and the rain fall' — the winter phrase, said until Pesach.",
      where: "Amidah, 2nd blessing"
    });
  } else {
    season.push({
      id: "morid-hatal",
      title: "Summer: no rain phrase",
      detail: "From Pesach until Shmini Atzeret the rain phrase is left out.",
      where: "Amidah, 2nd blessing",
      customs: {
        ashkenazi: israel ? "In Israel, say 'morid hatal'." : "Outside Israel, say nothing in its place.",
        sephardi: "Say 'morid hatal' (who brings down the dew).",
        chabad: "Say 'morid hatal'."
      }
    });
  }

  // --- Seasonal: V'ten tal umatar ---------------------------------------------------
  const beforePesach = pcCmp(heb, "Nisan", 14) <= 0;
  let talUmatar, startsTonight = false;
  if (israel) {
    talUmatar = pcCmp(heb, "Cheshvan", 7) >= 0 && beforePesach;
    startsTonight = pcIs(heb, "Cheshvan", 6);
  } else {
    // The season runs from the Dec 4/5 evening to Erev Pesach (March–April).
    const month = date.getMonth();
    if (month === 11) {
      const start = talUmatarDiasporaStart(date.getFullYear());
      talUmatar = date > start;
      startsTonight = pcSameDay(date, start);
    } else if (month <= 4) {
      talUmatar = beforePesach;
    } else {
      talUmatar = false;
    }
  }
  const talCustoms = {
    sephardi: "Sephardim switch the whole blessing: 'Barech aleinu' in winter, 'Barchenu' in summer."
  };
  if (startsTonight) {
    tonight.push({
      id: "tal-umatar-start",
      title: "Start 'V'ten tal umatar livracha' tonight",
      detail: `'Give dew and rain for a blessing' — the request for rain begins at Maariv tonight${israel ? " (7 Cheshvan in Israel)" : " outside Israel"}.`,
      where: "Amidah, 9th blessing (Barech Aleinu)",
      customs: talCustoms
    });
  }
  if (pcIs(heb, "Nisan", 14)) {
    today.push({
      id: "tal-umatar-end",
      title: "Last day of 'V'ten tal umatar'",
      detail: "Say it for the last time at Mincha today; from Maariv tonight, switch to 'V'ten beracha'.",
      where: "Amidah, 9th blessing (Barech Aleinu)",
      customs: talCustoms
    });
  }
  if (talUmatar) {
    season.push({
      id: "tal-umatar",
      title: "V'ten tal umatar livracha",
      detail: "The winter request for rain, said until Pesach.",
      where: "Amidah, 9th blessing (Barech Aleinu)",
      customs: talCustoms
    });
  } else {
    season.push({
      id: "vten-beracha",
      title: "V'ten beracha",
      detail: israel
        ? "'Give a blessing' — the request for rain isn't said yet; it starts on 7 Cheshvan."
        : "'Give a blessing' — the request for rain isn't said yet; outside Israel it starts at Maariv on Dec 4 (Dec 5 when the next February has 29 days).",
      where: "Amidah, 9th blessing (Barech Aleinu)",
      customs: talCustoms
    });
  }

  // --- Seasonal: L'David (Psalm 27) ---------------------------------------------
  const ldavid = heb.hm === "Elul" || (pcIs(heb, "Av", 30) && info.roshChodesh) || (heb.hm === "Tishrei" && heb.hd <= 21);
  if (ldavid) {
    season.push({
      id: "ldavid",
      title: "L'David Hashem Ori (Psalm 27)",
      detail: "Added from Rosh Chodesh Elul through Hoshana Rabbah.",
      where: "End of Shacharit, and again at Mincha or Maariv",
      customs: {
        ashkenazi: israel ? "Through Hoshana Rabbah." : "Many continue through Shmini Atzeret.",
        sephardi: "Many Sephardim say it too, often after Arvit.",
        chabad: "Morning and afternoon (Mincha)."
      }
    });
  }

  return { today, tonight, season, weekly };
}

/** Pick which community notes to show: the visitor's own, or all of them. */
function prayerCustomsFor(item, community) {
  if (!item.customs) return [];
  const key = pcCommunityKey(community);
  const names = { ashkenazi: "Ashkenazi", sephardi: "Sephardi", chabad: "Chabad" };
  if (key) return item.customs[key] ? [{ label: `Your custom (${names[key]})`, text: item.customs[key] }] : [];
  return Object.keys(names).filter(k => item.customs[k]).map(k => ({ label: names[k], text: item.customs[k] }));
}
