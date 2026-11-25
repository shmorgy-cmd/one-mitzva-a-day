/**
 * daily-guide.js — "What to do today": the concrete, day-specific instructions
 * a daily companion needs. For a given civil day it returns what to do TONIGHT
 * (the evening that starts the next Jewish day) and TODAY (daytime), with the
 * exact blessings, counts, order and times, plus what's READ in synagogue.
 *
 *   getDailyGuide({ date, heb, israel, events, community, fmt })
 *     date      – JS Date (local midnight) for the civil day
 *     heb       – Hebrew date of that day ({ hd, hm, hy }) from Hebcal's converter
 *     israel    – true for the Israel calendar
 *     events    – Hebcal events (local-midnight `date`, `time` "HH:MM" for timed ones)
 *     community – "ashkenazi" | "sephardi" | "chabad" | "litvish" | "other" | null
 *     fmt       – optional "HH:MM" → display time formatter
 *
 *   returns { tonight: [item], today: [item], read: [item] }
 *   item = { id, title, when?, steps?: [string], blessings?: [key],
 *            texts?: [{ key, opts? }] (full prayers, see prayer-texts.js), customs? }
 *
 * Everything comes from Hebcal's events for that year — nothing date-specific
 * is hard-coded. Uses pcDayInfo / pcAddDays / pcSameDay from prayer-changes.js.
 * Like the rest of the site, this is a learning aid to check with a rabbi.
 */

// --- Blessings ---------------------------------------------------------------

const BLESSING_OPEN = {
  he: "ברוך אתה ה׳ אלהינו מלך העולם",
  tr: "Baruch atah Adonai, Eloheinu melech ha'olam,",
  en: "Blessed are You, Lord our God, King of the universe,"
};
const MITZVAH_OPEN = {
  he: "אשר קדשנו במצותיו וצונו",
  tr: "asher kid'shanu b'mitzvotav v'tzivanu",
  en: "who has made us holy with His commandments and commanded us"
};

/** Each blessing: the ending after the standard opening. `mitzvah` adds
 *  "who has made us holy… and commanded us". */
const BLESSINGS = {
  chanukahLight: { name: "Lighting the Chanukah lights", mitzvah: true, he: "להדליק נר חנוכה", tr: "l'hadlik ner Chanukah.", en: "to light the Chanukah light." },
  chanukahMiracles: { name: "For the miracles", he: "שעשה נסים לאבותינו בימים ההם בזמן הזה", tr: "she'asah nisim la'avoteinu bayamim hahem bazman hazeh.", en: "who performed miracles for our ancestors in those days, at this season." },
  shehecheyanu: { name: "Shehecheyanu", he: "שהחיינו וקימנו והגיענו לזמן הזה", tr: "shehecheyanu v'kiy'manu v'higianu lazman hazeh.", en: "who has kept us alive, sustained us, and brought us to this season." },
  shabbatCandles: { name: "Shabbat candles", mitzvah: true, he: "להדליק נר של שבת", tr: "l'hadlik ner shel Shabbat.", en: "to light the Shabbat light." },
  yomTovCandles: { name: "Yom Tov candles", mitzvah: true, he: "להדליק נר של יום טוב", tr: "l'hadlik ner shel Yom Tov.", en: "to light the festival light." },
  shabbatYomTovCandles: { name: "Shabbat and Yom Tov candles", mitzvah: true, he: "להדליק נר של שבת ושל יום טוב", tr: "l'hadlik ner shel Shabbat v'shel Yom Tov.", en: "to light the Shabbat and festival light." },
  yomKippurCandles: { name: "Yom Kippur candles", mitzvah: true, he: "להדליק נר של יום הכפורים", tr: "l'hadlik ner shel Yom HaKippurim.", en: "to light the Yom Kippur light." },
  shabbatYomKippurCandles: { name: "Shabbat and Yom Kippur candles", mitzvah: true, he: "להדליק נר של שבת ושל יום הכפורים", tr: "l'hadlik ner shel Shabbat v'shel Yom HaKippurim.", en: "to light the Shabbat and Yom Kippur light." },
  sukkah: { name: "Sitting in the sukkah", mitzvah: true, he: "לישב בסכה", tr: "leishev basukkah.", en: "to dwell in the sukkah." },
  lulav: { name: "Taking the lulav", mitzvah: true, he: "על נטילת לולב", tr: "al netilat lulav.", en: "concerning taking the lulav." },
  shofar: { name: "Hearing the shofar (said by the one blowing)", mitzvah: true, he: "לשמוע קול שופר", tr: "lishmoa kol shofar.", en: "to hear the sound of the shofar." },
  megillah: { name: "Reading the Megillah", mitzvah: true, he: "על מקרא מגלה", tr: "al mikra Megillah.", en: "concerning reading the Megillah." },
  bedikah: { name: "Searching for chametz", mitzvah: true, he: "על ביעור חמץ", tr: "al bi'ur chametz.", en: "concerning removing chametz." },
  eruv: { name: "Eruv Tavshilin", mitzvah: true, he: "על מצות ערוב", tr: "al mitzvat eruv.", en: "concerning the mitzvah of eruv." },
  omer: { name: "Counting the Omer", mitzvah: true, he: "על ספירת העמר", tr: "al sefirat ha'omer.", en: "concerning counting the Omer." },
  haetz: { name: "Fruit from a tree", he: "בורא פרי העץ", tr: "borei p'ri ha'etz.", en: "who creates the fruit of the tree." },
  hagafen: { name: "Over wine or grape juice", he: "בורא פרי הגפן", tr: "borei p'ri hagafen.", en: "who creates the fruit of the vine." },
  netilatYadayim: { name: "Washing hands before bread", mitzvah: true, he: "על נטילת ידים", tr: "al n'tilat yadayim.", en: "concerning washing the hands." },
  hamotzi: { name: "HaMotzi — over the challah", he: "המוציא לחם מן הארץ", tr: "hamotzi lechem min ha'aretz.", en: "who brings forth bread from the earth." },
  besamim: { name: "Over the spices", he: "בורא מיני בשמים", tr: "borei minei v'samim.", en: "who creates the different kinds of spices." },
  fire: { name: "Over the flame", he: "בורא מאורי האש", tr: "borei m'orei ha'eish.", en: "who creates the lights of fire." },
  hallel: { name: "Before Hallel", mitzvah: true, he: "לגמור את ההלל", tr: "lig'mor et haHallel.", en: "to complete the Hallel." }
};

// The Torah reading on each day of Chanukah: the gifts of that day's tribal
// leader in Numbers 7 (Ashkenazi custom shown; Sephardi custom is similar).
const CHANUKAH_READINGS = [null,
  "Numbers 7:1–17", "Numbers 7:18–29", "Numbers 7:24–35", "Numbers 7:30–41",
  "Numbers 7:36–47", "Numbers 7:42–47", "Numbers 7:48–53", "Numbers 7:54–8:4"];

// The Ushpizin ("guests") welcomed into the sukkah, one for each night.
const USHPIZIN = [null, "Abraham", "Isaac", "Jacob", "Moses", "Aaron", "Joseph", "David"];

const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };

function dgTime(events, day, test) {
  const e = events.find(ev => ev.time && pcSameDay(ev.date, day) && test(ev));
  return e ? e.time : null;
}

function dgRomanDay(events, day, prefix) {
  const e = events.find(ev => pcSameDay(ev.date, day) && ev.title.startsWith(prefix + " "));
  if (!e) return null;
  const m = new RegExp(`^${prefix} ([IVX]+)`).exec(e.title);
  return m ? ROMAN[m[1]] : null;
}

function getDailyGuide({ date, heb, israel, events, community, fmt }) {
  const show = (t) => (t ? (fmt ? fmt(t) : t) : null);
  const tonight = [];
  const today = [];
  const read = [];
  const dow = date.getDay();
  const tomorrow = pcAddDays(date, 1);
  const info = pcDayInfo(events, date);
  const next = pcDayInfo(events, tomorrow);
  const nextIsShabbat = dow === 5;
  const isShabbat = dow === 6;
  const comm = pcCommunityKey(community);
  const evToday = pcEventsOn(events, date);
  const evTomorrow = pcEventsOn(events, tomorrow);
  const has = (list, re) => list.some(e => re.test(e.title));

  const candleTime = show(dgTime(events, date, e => e.category === "candles"));
  const havdalahTime = show(dgTime(events, date, e => e.category === "havdalah"));

  // =====================================================================
  // TONIGHT
  // =====================================================================

  // --- Chanukah lights --------------------------------------------------
  const chanukahEvt = evToday.find(e => /^Chanukah: \d+ Candles?$/.test(e.title));
  if (chanukahEvt) {
    const n = Number(/(\d+)/.exec(chanukahEvt.title)[1]);
    const t = show(chanukahEvt.time);
    let when;
    if (dow === 5) when = `Before the Shabbat candles${t ? ` — by ${t}` : ""}`;
    else if (dow === 6) when = `After Shabbat ends${t ? ` (${t})` : ""} — never before`;
    else when = t ? `At nightfall — about ${t}` : "At nightfall (some light at sunset — follow your community)";
    const steps = [
      `Set up ${n} candle${n > 1 ? "s" : ""} in the menorah, plus the shamash (the helper candle), placing them from right to left.`,
      n > 1 ? "Light the shamash, say the blessings, then light the newest candle (the one on the far left) first and move to the right." : "Light the shamash, say the blessings, then light the candle with the shamash.",
      n === 1 ? "Say three blessings tonight — including Shehecheyanu, because it's the first night." : "Say two blessings — Shehecheyanu is only said on the first night.",
      "After lighting, sing \"HaNerot Halalu\" and a Chanukah song.",
      dow === 5
        ? "Use candles big enough to burn until at least 30 minutes after nightfall — they're lit early because of Shabbat."
        : "Let the candles burn at least 30 minutes after nightfall, and don't use their light for reading or work.",
      "Place the menorah by a window or doorway, so the light can be seen from outside."
    ];
    if (dow === 5) steps.push("Then light the Shabbat candles.");
    if (dow === 6) steps.unshift("Wait until Shabbat is over. Many make Havdalah first and then light; some light first — follow your family or synagogue.");
    tonight.push({
      id: "chanukah-lights",
      title: `Light ${n} Chanukah candle${n > 1 ? "s" : ""} — night ${n} of 8`,
      when,
      steps,
      blessings: n === 1 ? ["chanukahLight", "chanukahMiracles", "shehecheyanu"] : ["chanukahLight", "chanukahMiracles"],
      texts: [{ key: "haneirotHalalu" }, { key: "maozTzur" }],
      customs: {
        ashkenazi: "Each member of the family lights their own menorah; Maoz Tzur is sung afterwards.",
        sephardi: "One menorah for the household; Psalm 30 is said afterwards. Some say the first blessing as \"…l'hadlik ner shel Chanukah.\"",
        chabad: "The menorah is placed in a doorway, opposite the mezuzah; each boy and man lights his own."
      }
    });
  }

  // --- Candle lighting for Shabbat / Yom Tov ----------------------------
  const nextYT = next.yomTov || next.roshHashana || next.yomKippur;
  const lastDaysPesachNext = has(evTomorrow, /^Pesach (VII|VIII)$/);
  if (candleTime || nextIsShabbat || nextYT) {
    const isSecondNight = (info.yomTov || info.roshHashana) && nextYT;
    let blessing, title;
    if (next.yomKippur) {
      blessing = nextIsShabbat ? "shabbatYomKippurCandles" : "yomKippurCandles";
      title = "Light candles before Yom Kippur begins";
    } else if (nextYT && nextIsShabbat) {
      blessing = "shabbatYomTovCandles";
      title = "Light Shabbat and Yom Tov candles";
    } else if (nextYT) {
      blessing = "yomTovCandles";
      title = isSecondNight ? "Light Yom Tov candles for the second night" : "Light Yom Tov candles";
    } else if (nextIsShabbat) {
      blessing = "shabbatCandles";
      title = "Light Shabbat candles";
    }
    if (blessing) {
      const blessings = [blessing];
      const sayShehecheyanu = nextYT && !lastDaysPesachNext;
      if (sayShehecheyanu) blessings.push("shehecheyanu");
      const steps = [];
      if (isSecondNight) {
        steps.push("Wait until after nightfall, then light from a flame that has been burning since before the holiday began (like a memorial candle) — don't strike a new match.");
      } else {
        if (info.yomTov || info.roshHashana) steps.push("It's Yom Tov now, so light from a flame that's already burning — don't strike a new match.");
        steps.push("Light at least two candles before sunset — once they're lit, the day has begun for you.");
        steps.push(blessing === "shabbatCandles" ? "Many light first, cover their eyes, then say the blessing; Sephardim often say the blessing first. Follow your community." : "Say the blessing, then light (on Shabbat, many light first and then bless).");
      }
      if (sayShehecheyanu) steps.push(info.roshHashana ? "On the second night of Rosh Hashanah, have a new fruit or new clothing in mind for Shehecheyanu." : "Shehecheyanu is said tonight because it's a festival night.");
      if (nextYT && lastDaysPesachNext) steps.push("No Shehecheyanu on the last days of Pesach.");
      if (next.yomKippur) steps.push("Finish the pre-fast meal first — the fast begins with candle lighting.");
      tonight.push({
        id: "candles",
        title,
        when: candleTime ? (isSecondNight ? `After ${candleTime}` : `By ${candleTime}`) : "Before sunset (set your city for the exact time)",
        steps,
        blessings
      });
    }
  }

  // --- Eruv Tavshilin (Yom Tov on Thursday–Friday, running into Shabbat)
  if (nextYT && !info.yomTov && tomorrow.getDay() === 4) {
    tonight.push({
      id: "eruv-tavshilin",
      title: "Make Eruv Tavshilin before the holiday",
      when: "Before candle lighting",
      steps: [
        "Because the holiday runs straight into Shabbat, set aside a cooked food (like an egg) and a baked food (like challah or matzah) for Shabbat.",
        "Hold them, say the blessing and the short declaration in the siddur. This lets you cook on Friday (Yom Tov) for Shabbat.",
        "Keep them until Shabbat — many eat them at a Shabbat meal."
      ],
      blessings: ["eruv"]
    });
  }

  // --- Friday night: Kabbalat Shabbat -----------------------------------------
  if (nextIsShabbat && !next.yomKippur) {
    tonight.push({
      id: "kabbalat-shabbat",
      title: nextYT ? "Evening prayers: Shabbat and the festival" : "Kabbalat Shabbat — welcoming Shabbat",
      when: "Around candle-lighting time, at synagogue or at home",
      steps: nextYT
        ? ["Kabbalat Shabbat is shortened tonight (many start from Psalm 92), followed by the festival Maariv with Shabbat additions."]
        : [
          "Kabbalat Shabbat: six psalms (one for each weekday), then the song Lecha Dodi, then Psalm 92 (\"Mizmor shir l'yom haShabbat\").",
          "Then Maariv for Shabbat: the Amidah has seven blessings, and everyone says \"Vay'chulu\" together afterwards.",
          "Praying at home is fine — even just Lecha Dodi and the Shabbat Amidah is a beautiful start."
        ],
      texts: nextYT ? [] : [{ key: "lechaDodi" }]
    });
  }

  // --- Kiddush tonight ------------------------------------------------------
  if (nextIsShabbat || nextYT) {
    if (!next.yomKippur) {
      const yaknehaz = isShabbat && nextYT;
      const festKey = ptFestivalKey(next);
      const kiddushText = nextYT
        ? { key: "kiddushYomTov", opts: { festival: festKey, shehecheyanu: !lastDaysPesachNext, shabbat: nextIsShabbat, havdalah: yaknehaz } }
        : { key: "kiddushShabbatNight" };
      const shabbatOnly = nextIsShabbat && !nextYT;
      tonight.push({
        id: "kiddush",
        title: yaknehaz ? "Kiddush with Havdalah tonight (YaKNeHaZ)" : `${nextYT ? "Festival" : "Shabbat"} dinner: Kiddush, washing, HaMotzi`,
        steps: yaknehaz
          ? ["Shabbat ends and the festival begins tonight, so Kiddush also does Havdalah: wine, Kiddush, the blessing over light (looking at existing candles), Havdalah ending \"bein kodesh l'kodesh\", and Shehecheyanu.", "No spices, and don't light a new flame.", "Then wash hands and say HaMotzi over two loaves."]
          : [
            shabbatOnly ? "At the table, sing Shalom Aleichem (welcoming the Shabbat angels). Many also sing Eishet Chayil and bless their children." : "Use the festival Kiddush from the siddur or machzor.",
            "Kiddush over a full cup of wine or grape juice — the words are below.",
            "Wash your hands with a cup (twice on the right, twice on the left, or three times each, by custom), say \"al n'tilat yadayim\", and don't talk until after HaMotzi.",
            "Uncover the two challot, say HaMotzi, then dip or sprinkle the bread with salt and share it.",
            ...(next.roshHashana ? ["Rosh Hashanah night: dip the challah in honey, and eat an apple dipped in honey with \"Yehi ratzon…\" — may it be a good and sweet year."] : []),
            "After the meal, say Birkat HaMazon (Grace After Meals) — from a siddur or a small bencher."
          ],
        // In the order they're said: (Shalom Aleichem), Kiddush, washing, HaMotzi.
        texts: [
          ...(shabbatOnly ? [{ key: "shalomAleichem" }] : []),
          kiddushText,
          { key: "blessing", opts: { key: "netilatYadayim" } },
          { key: "blessing", opts: { key: "hamotzi" } }
        ]
      });
    }
  }

  // --- Havdalah tonight ------------------------------------------------------
  // Shabbat or a holiday ends tonight (and isn't followed by Shabbat or another holy day).
  const holyToday = isShabbat || info.yomTov || info.roshHashana || info.yomKippur;
  if (holyToday && !nextYT && !nextIsShabbat) {
    const afterShabbat = isShabbat;
    tonight.push({
      id: "havdalah",
      title: afterShabbat ? "Havdalah — Shabbat ends" : "Havdalah — the holiday ends",
      when: havdalahTime ? `After ${havdalahTime}` : "After nightfall, when three stars appear (set your city for the exact time)",
      steps: afterShabbat
        ? ["Say \"Baruch hamavdil bein kodesh l'chol\" or pray Maariv (with Atah Chonantanu) before doing any work.", "Havdalah: blessings over wine, fragrant spices, and the flame of a braided candle, then the Havdalah blessing."]
        : ["After a holiday that ends on a weekday: Havdalah over wine with just the Havdalah blessing — no spices or candle.", ...(info.yomKippur ? ["After Yom Kippur, the Havdalah candle is lit from a flame that burned all through the fast; there are no spices (unless it's also Shabbat)."] : [])],
      texts: [
        ...(afterShabbat ? [{ key: "hamavdil" }] : []),
        { key: "havdalah", opts: { afterShabbat, afterYomKippur: info.yomKippur } }
      ]
    });
  }

  // --- Erev Pesach / Seder / chametz search ---------------------------------
  // The search is on the night before Erev Pesach — or Thursday night when
  // Erev Pesach falls on Shabbat.
  const erevPesachEvt = events.find(e => e.title === "Erev Pesach");
  const searchNight = erevPesachEvt
    ? pcAddDays(erevPesachEvt.date, erevPesachEvt.date.getDay() === 6 ? -2 : -1)
    : null;
  if (searchNight && pcSameDay(searchNight, date)) {
    tonight.push({
      id: "bedikat-chametz",
      title: "Search for chametz tonight (Bedikat Chametz)",
      when: "After nightfall",
      steps: [
        "Say the blessing, then search the home by the light of a candle or flashlight for any leftover chametz.",
        "Many hide ten small wrapped pieces of bread beforehand so the search finds something.",
        "Afterwards, say the \"Kol Chamira\" declaration (in the Haggadah or siddur), and put aside what you found to burn in the morning."
      ],
      blessings: ["bedikah"]
    });
  }
  const sederTonight = has(evToday, /^Erev Pesach$/) || (!israel && has(evToday, /^Pesach I$/));
  if (sederTonight) {
    tonight.push({
      id: "seder",
      title: has(evToday, /^Erev Pesach$/) ? "The first Seder tonight" : "The second Seder tonight",
      when: has(evToday, /^Erev Pesach$/) ? "After nightfall" : `After nightfall${candleTime ? ` (from ${candleTime})` : ""}`,
      steps: [
        "Follow the 15 steps of the Haggadah, from Kadesh (Kiddush) to Nirtzah.",
        "Four cups of wine or grape juice, leaning to the left.",
        "Eat matzah (at least a set amount, about a third of a handmade matzah) and maror (bitter herbs).",
        "Tell the story of the Exodus — answering the Four Questions is the heart of the night.",
        ...(has(evToday, /^Pesach I$/) ? ["After the second Seder begins, count the first night of the Omer (see below)."] : [])
      ]
    });
  }

  // --- Sukkot evenings --------------------------------------------------------
  if (has(evToday, /^Erev Sukkot$/) || (info.sukkot && next.sukkot)) {
    const nightNum = has(evToday, /^Erev Sukkot$/) ? 1 : (dgRomanDay(events, date, "Sukkot") || 0) + 1;
    const guest = USHPIZIN[nightNum];
    const steps = [
      "Eat the evening meal in the sukkah; say \"leishev basukkah\" after Kiddush (or after HaMotzi on other nights).",
      ...(nightNum === 1 ? ["Tonight's Kiddush includes Shehecheyanu — said in the sukkah."] : []),
      ...(guest ? [`Tonight's Ushpizin guest: ${guest}. Many say the short welcome from the siddur before the meal.`] : [])
    ];
    tonight.push({
      id: "sukkah-night",
      title: `Sukkot night ${nightNum}: meal in the sukkah`,
      steps,
      blessings: ["sukkah"]
    });
  }

  // --- Purim / Tisha B'Av evenings ---------------------------------------------
  if (next.purim) {
    tonight.push({
      id: "megillah-night",
      title: "Hear the Megillah tonight",
      when: "After nightfall, at synagogue",
      steps: [
        "Listen to every word of the Book of Esther, read from a scroll.",
        "Make noise at Haman's name, as is the custom.",
        "Al HaNissim is added to Maariv and Grace After Meals from tonight."
      ],
      blessings: ["megillah", "chanukahMiracles", "shehecheyanu"]
    });
  }
  if (next.tishaBav && !info.tishaBav) {
    const fastStart = show(dgTime(events, date, e => /^Fast begins/.test(e.title)));
    tonight.push({
      id: "tisha-bav-night",
      title: "Tisha B'Av begins tonight",
      when: fastStart ? `The fast begins at ${fastStart}` : "At sunset",
      steps: [
        "Eat the last meal (seudah hamafseket) before sunset — traditionally simple, with a hard-boiled egg dipped in ashes.",
        "From sunset: no eating or drinking, washing for pleasure, leather shoes, or marital relations.",
        "Eichah (Lamentations) is read after Maariv, sitting on the floor or low seats."
      ]
    });
  }

  // --- Counting the Omer tonight -------------------------------------------------
  if (next.omerDay) {
    tonight.push({
      id: "count-omer",
      title: `Count the Omer tonight: day ${next.omerDay}`,
      when: "After nightfall (usually at the end of Maariv)",
      steps: [
        "Stand, say the blessing, then the count for tonight.",
        "If you forget tonight, count tomorrow during the day without the blessing — then keep counting with the blessing on the following nights."
      ],
      texts: [{ key: "omerCount", opts: { day: next.omerDay, community: comm } }]
    });
  }

  // =====================================================================
  // TODAY (daytime)
  // =====================================================================

  // --- Monday and Thursday: the Torah is read at Shacharit ----------------------
  // Only on these two days (and only when the day has no special reading of its
  // own — Rosh Chodesh, Chanukah, a fast…, whose readings come from Hebcal below).
  const ownReading = evToday.some(e => e.leyning && e.leyning.torah && e.category !== "parashat");
  if ((dow === 1 || dow === 4) && !ownReading && !info.yomTov && !info.roshHashana && !info.yomKippur) {
    const parsha = events
      .filter(e => e.category === "parashat" && e.date > date && e.leyning && e.leyning["1"])
      .sort((a, b) => a.date - b.date)[0];
    const noTachanun = noTachanunReason(heb, info, comm);
    const steps = [];
    if (parsha) {
      steps.push(`The first part of this Shabbat's portion, ${parsha.title}, is read — the opening section (${parsha.leyning["1"].replace(/(\d+):(\d+)-\1:/, "$1:$2–")}), divided among three people: a Kohen, a Levi and a Yisrael.`);
    } else {
      steps.push("The opening of the coming Shabbat's Torah portion is read, divided among three people: a Kohen, a Levi and a Yisrael.");
    }
    steps.push(noTachanun
      ? `No Tachanun today (${noTachanun}), so the longer Monday/Thursday prayers before the reading are left out too.`
      : "Before the reading: the longer Monday and Thursday Tachanun (starting \"V'hu Rachum\"), and \"El Erech Apayim\" as the Ark is opened.");
    steps.push("After the reading: the Torah is lifted (Hagbah) and dressed, and on Mondays and Thursdays a few short \"Yehi Ratzon\" prayers are said for the community before it's returned to the Ark.");
    steps.push("No minyan? Read the section on your own from a Chumash — without the blessings.");
    today.push({
      id: "weekday-torah",
      title: `${dow === 1 ? "Monday" : "Thursday"}: the Torah is read at Shacharit`,
      when: "Morning prayers, after the Amidah",
      steps,
      texts: [{ key: "torahBlessings" }],
      customs: {
        sephardi: "The Sephardi order of Tachanun and of taking out the Torah is different (the Torah is often raised before the reading) — follow your siddur.",
        chabad: "Follow the order in the Chabad siddur (Tehillat Hashem) — the wording differs a little."
      }
    });
  }

  if (info.chanukahDay) {
    const eighth = has(evToday, /^Chanukah: 8th Day$/);
    const dayNum = eighth ? 8 : Number((/(\d+) Candles?/.exec((evToday.find(e => /^Chanukah/.test(e.title)) || {}).title || "") || [])[1]) - 1;
    today.push({
      id: "chanukah-day",
      title: eighth ? "The eighth day of Chanukah (\"Zot Chanukah\") — no candles tonight" : `Day ${dayNum} of Chanukah`,
      steps: [
        "Full Hallel after the Amidah at Shacharit.",
        "Add Al HaNissim to every Amidah and to Grace After Meals.",
        ...(eighth ? ["Chanukah ends tonight — there's no lighting this evening."] : [])
      ],
      texts: [{ key: "alHanissim", opts: { occasion: "chanukah" } }, { key: "hallel", opts: { community: comm } }]
    });
    if (CHANUKAH_READINGS[dayNum] && !isShabbat) {
      read.push({ id: "chanukah-reading", title: `Torah reading: ${CHANUKAH_READINGS[dayNum]}`, steps: [`The gifts of the tribal leader for day ${dayNum} of the Temple's dedication.${info.roshChodesh ? " Today it's read together with the Rosh Chodesh reading." : ""}`] });
    }
  }

  if (isShabbat && !info.yomTov) {
    today.push({
      id: "shabbat-day",
      title: "Shabbat",
      when: havdalahTime ? `Until ${havdalahTime}` : "Until three stars appear tonight",
      steps: [
        "Shabbat morning prayers with the Torah reading, then Kiddush (V'shamru and the blessing over wine) before lunch.",
        "Eat three meals over Shabbat — the third (Seudah Shlishit) in the late afternoon.",
        "Rest: no melacha (creative work) until Shabbat ends."
      ],
      texts: [{ key: "kiddushShabbatDay" }]
    });
  }

  if (info.roshHashana) {
    const firstDay = has(evToday, /^Rosh Hashana \d{3,4}$/);
    const tashlichToday = (firstDay && !isShabbat) || (!firstDay && pcAddDays(date, -1).getDay() === 6);
    today.push({
      id: "shofar",
      title: isShabbat ? "No shofar today (Shabbat)" : "Hear the shofar",
      steps: isShabbat
        ? ["When the first day of Rosh Hashanah is Shabbat, the shofar is not blown; it's heard on the second day."]
        : ["Listen to all 100 blasts during the morning service (tekiah, shevarim, teruah).", "The person blowing says the blessings; listeners answer amen and don't talk until the end of the blasts."],
      blessings: isShabbat ? [] : ["shofar", "shehecheyanu"],
      customs: { sephardi: "Many Sephardi congregations also sound the shofar during the silent Musaf Amidah." }
    });
    if (tashlichToday) {
      today.push({ id: "tashlich", title: "Tashlich this afternoon", steps: ["Walk to a body of flowing water (a river, lake or the sea) and say the Tashlich prayers, including verses from Micah.", "It's a symbolic \"casting away\" of sins — many shake out their pockets."] });
    }
  }

  if (info.yomKippur) {
    today.push({
      id: "yom-kippur-day",
      title: "Yom Kippur — the fast continues all day",
      when: havdalahTime ? `Until ${havdalahTime}` : "Until nightfall",
      steps: [
        "No eating or drinking, washing for pleasure, lotions, leather shoes, or marital relations.",
        "Prayers: Shacharit, Yizkor (in Ashkenazi communities), Musaf, Mincha and Ne'ilah, ending with one long shofar blast.",
        "If you need to eat for health reasons, that's what Jewish law requires — ask your rabbi beforehand."
      ]
    });
  }

  if (info.sukkot) {
    const dayNum = dgRomanDay(events, date, "Sukkot");
    const lulavToday = !isShabbat;
    const prevDays = [];
    for (let i = 1; dayNum && i < dayNum; i++) prevDays.push(pcAddDays(date, -i));
    const firstLulav = lulavToday && !prevDays.some(d => d.getDay() !== 6);
    if (lulavToday) {
      today.push({
        id: "lulav",
        title: firstLulav ? "Take the lulav and etrog — the first time this Sukkot" : "Take the lulav and etrog",
        when: "In the morning, usually during prayers before Hallel",
        steps: [
          "Hold the lulav (with the myrtle and willow bound to it) in your right hand and the etrog in your left — left-handed people often reverse this.",
          "Say the blessing, then bring them together and wave them in six directions.",
          ...(firstLulav ? ["Add Shehecheyanu, since it's the first time this year."] : [])
        ],
        blessings: firstLulav ? ["lulav", "shehecheyanu"] : ["lulav"],
        customs: {
          ashkenazi: "Wave east, south, west, north, up, down.",
          sephardi: "Wave south, north, east, up, down, west (the Arizal's order).",
          chabad: "Wave south, north, east, up, down, west (the Arizal's order)."
        }
      });
    } else {
      today.push({ id: "no-lulav", title: "No lulav today (Shabbat)", steps: ["The lulav and etrog aren't taken on Shabbat."] });
    }
    today.push({ id: "sukkah-day", title: "Eat your meals in the sukkah", steps: ["Say \"leishev basukkah\" when eating bread or cake in the sukkah."], blessings: ["sukkah"] });
    if (info.hoshanaRabba) {
      today.push({ id: "hoshana-rabba", title: "Hoshana Rabbah: seven circuits and the willows", steps: ["The congregation circles the synagogue seven times with the lulav, saying Hoshanot.", "Afterwards, a bundle of five willow branches is beaten on the ground."] });
    }
  }

  if (info.shminiAtzeret) {
    today.push({
      id: "shmini-atzeret-day",
      title: "Shmini Atzeret",
      steps: [
        "The prayer for rain (Geshem) is said at Musaf; from today, add \"Mashiv haruach u'morid hageshem\".",
        ...(israel ? ["In Israel, today is also Simchat Torah — hakafot (dancing with the Torah)."] : ["Outside Israel, many still eat in the sukkah today, without its blessing."]),
        "Yizkor is said after the Torah reading (in Ashkenazi communities)."
      ]
    });
  }
  if (info.simchatTorah) {
    today.push({ id: "simchat-torah-day", title: "Simchat Torah: dance with the Torah", steps: ["Hakafot — seven joyful circuits with the Torah scrolls.", "The Torah is finished and started again; everyone is called up for an aliyah."] });
  }

  if (info.purim || (info.shushanPurim && israel)) {
    today.push({
      id: "purim-day",
      title: "The four mitzvot of Purim",
      steps: [
        "Hear the Megillah again this morning.",
        "Give gifts (usually money) to at least two people in need — Matanot La'evyonim.",
        "Send at least two ready-to-eat foods to at least one friend — Mishloach Manot.",
        "Eat a festive meal in the afternoon.",
        "Al HaNissim in the Amidah and Grace After Meals."
      ],
      blessings: ["megillah", "chanukahMiracles"],
      texts: [{ key: "alHanissim", opts: { occasion: "purim" } }],
      customs: { ashkenazi: "Shehecheyanu is said again before the morning reading.", sephardi: "Shehecheyanu is said only at the night reading.", chabad: "Shehecheyanu is said again before the morning reading." }
    });
  }

  if (info.fast && !info.yomKippur) {
    const begins = show(dgTime(events, date, e => /^Fast begins/.test(e.title)));
    const ends = show(dgTime(events, date, e => /^Fast ends/.test(e.title)));
    today.push({
      id: "fast",
      title: `${info.tishaBav ? "Tisha B'Av" : "Fast day"} — no eating or drinking`,
      when: [begins && `from ${begins}`, ends && `until ${ends}`].filter(Boolean).join(" ") || (info.tishaBav ? "Until nightfall" : "From dawn until nightfall"),
      steps: info.tishaBav
        ? ["Also no washing for pleasure, lotions, leather shoes or marital relations.", "Sit on the floor or a low seat until midday (chatzot); Kinot are said in the morning.", "Tallit and tefillin are worn at Mincha, not in the morning."]
        : ["Pregnant or nursing women, and anyone who is unwell, are generally exempt — ask your rabbi.", "Aneinu is added to the Amidah, and the Torah is read at Shacharit and Mincha."],
      texts: [{ key: "aneinu" }]
    });
    if (has(evToday, /^Ta.anit Esther/)) {
      today.push({ id: "half-shekel", title: "Give the Half-Shekel (Machatzit HaShekel)", when: "Before Mincha", steps: ["Give three half-units of your currency (for example, three half-dollar coins) to charity, recalling the Temple's half-shekel."] });
    }
  }

  const finishChametz = show(dgTime(events, date, e => /Finish eating chametz/i.test(e.title)));
  const burnChametz = show(dgTime(events, date, e => /Biur Chametz/i.test(e.title)));
  if (has(evToday, /^Erev Pesach$/)) {
    today.push({
      id: "erev-pesach-day",
      title: "Erev Pesach: the chametz deadlines",
      steps: [
        `Finish eating chametz by ${finishChametz || "mid-morning (set your city for the exact time)"}.`,
        `Burn the leftover chametz and say \"Kol Chamira\" by ${burnChametz || "late morning (set your city for the exact time)"}.`,
        "Firstborn males fast today, or attend a siyum (a celebration of finishing a Torah text) to be exempt.",
        "Prepare the Seder plate and table for tonight."
      ]
    });
  }

  if (info.cholHamoed && info.pesach) {
    today.push({ id: "pesach-chm", title: "Pesach — Chol HaMoed", steps: ["No chametz all week; eat matzah or kosher-for-Pesach food.", "Half Hallel and Musaf are added to the prayers."] });
  }

  const yizkor = (!israel && (has(evToday, /^Pesach VIII$/) || has(evToday, /^Shavuot II$/) || info.shminiAtzeret)) ||
    (israel && (has(evToday, /^Pesach VII$/) || has(evToday, /^Shavuot$/) || info.shminiAtzeret)) || info.yomKippur;
  if (yizkor && !info.yomKippur && !info.shminiAtzeret) {
    today.push({ id: "yizkor", title: "Yizkor today", steps: ["A memorial prayer for departed relatives, said after the Torah reading in Ashkenazi synagogues. Many give tzedakah in their memory."], customs: { sephardi: "Hashkavah prayers are said for the departed instead." } });
  }

  if (info.shavuot) {
    today.push({ id: "shavuot-day", title: "Shavuot", steps: ["The Ten Commandments are read — it's customary to stand.", "The Book of Ruth is read.", "Many eat a dairy meal."] });
    read.push({ id: "ruth", title: "Read: the Book of Ruth", steps: ["Four short chapters — the story of Ruth choosing the Jewish people."] });
  }
  if (info.purim) read.push({ id: "esther", title: "Read: the Book of Esther (the Megillah)", steps: ["Read twice — tonight and in the morning — from a handwritten scroll."] });
  if (info.tishaBav) read.push({ id: "eichah", title: "Read: Eichah (Lamentations) and Kinot", steps: ["Eichah was read last night; Kinot (elegies) are said this morning."] });

  if (info.tuBishvat) {
    today.push({ id: "tu-bishvat-day", title: "Eat fruits of the Land of Israel", steps: ["Try the Seven Species: wheat, barley, grapes, figs, pomegranates, olives and dates.", "Say \"borei p'ri ha'etz\" before tree fruit — and Shehecheyanu on a fruit you haven't eaten yet this season."], blessings: ["haetz", "shehecheyanu"] });
  }

  if (info.yomHaatzmaut || info.yomYerushalayim) {
    today.push({ id: "modern-day", title: info.yomHaatzmaut ? "Yom HaAtzma'ut" : "Yom Yerushalayim", steps: ["Practice varies by community — see the prayer changes and \"Your custom\" notes."] });
  }
  if (has(evToday, /^Yom HaShoah/)) {
    today.push({ id: "yom-hashoah-day", title: "Remember the six million", steps: ["Light a memorial candle; in Israel, a siren sounds at 10 a.m. and people stand in silence.", "Listen to or read a survivor's testimony."] });
  }

  // Torah readings for holidays and Shabbat (from Hebcal's own leyning data)
  evToday.filter(e => e.leyning && e.leyning.torah).forEach(e => {
    const title = e.category === "parashat" ? `Torah reading: ${e.title}` : `Torah reading for ${e.title}`;
    if (read.some(r => r.title === title)) return;
    const steps = [e.leyning.torah];
    if (e.leyning.haftarah) steps.push(`Haftarah: ${e.leyning.haftarah}`);
    read.push({ id: `leyning-${e.title}`, title, steps });
  });

  // On Seder night, Kiddush is part of the Seder itself.
  let finalTonight = sederTonight ? tonight.filter(i => i.id !== "kiddush") : tonight;
  // Saturday night: Shabbat ends (Havdalah) before anything else happens.
  const hv = finalTonight.find(i => i.id === "havdalah");
  if (hv) finalTonight = [hv, ...finalTonight.filter(i => i !== hv)];
  return { tonight: finalTonight, today, read, community: comm };
}

/** Full text of a blessing for display: { name, he, tr, en }. */
function blessingText(key) {
  const b = BLESSINGS[key];
  if (!b) return null;
  return {
    name: b.name,
    he: `${BLESSING_OPEN.he} ${b.mitzvah ? MITZVAH_OPEN.he + " " : ""}${b.he}`,
    tr: `${BLESSING_OPEN.tr} ${b.mitzvah ? MITZVAH_OPEN.tr + " " : ""}${b.tr}`,
    en: `${BLESSING_OPEN.en} ${b.mitzvah ? MITZVAH_OPEN.en + " " : ""}${b.en}`
  };
}
