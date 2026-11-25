/**
 * prep.js — "get ready" guides, each keyed to the Hebcal title of the day it
 * prepares for, opening `leadDays` before it:
 *  • the major Yom Tovs ("get ready before you go offline" — observant visitors
 *    won't be checking this site once the chag starts), and
 *  • other holidays, fasts and special days (`kind: "day"`, 7 days ahead), with
 *    their history, meaning and ways to prepare.
 */

const PREP_GUIDES = [
  {
    key: "rosh-hashana",
    matchTitle: (title) => /^Rosh Hashana \d{3,4}$/.test(title),
    name: "Rosh Hashanah",
    icon: "apple-honey",
    leadDays: 10,
    shopping: [
      "Apples and honey (for dipping)",
      "Round challah — plain or with raisins",
      "Pomegranate, dates, and other simanim (leek, beets/chard, gourd, black-eyed peas) if you keep the symbolic-foods seder",
      "A new fruit you haven't eaten this season, for the second night's Shehecheyanu",
      "Wine or grape juice for Kiddush, both nights",
      "Candles — enough for both nights, plus a way to carry over an existing flame to light the second night",
      "Festive-meal groceries for two (or more, with Shabbat) days of Yom Tov meals",
      "Tzedakah (charity) cash set aside to give before the holiday begins"
    ],
    prep: [
      "If a rabbi/community arranges it, check whether Eruv Tavshilin is needed this year (the page flags this automatically when it applies) — it must be done before the holiday starts.",
      "Let people who might contact you know you'll be offline for the holiday.",
      "Plan Tashlich — a walk to a body of flowing water on the first afternoon (or later in the Ten Days if that's not possible).",
      "Prepare or review machzor (the special holiday prayer book) if you're not familiar with the service.",
      "Set candle-lighting reminders / timers if you use them, since you won't have your phone to check times once the day begins."
    ],
    expectNote: "Rosh Hashanah is a full Yom Tov: no phone, driving, writing, or cooking from scratch (only reheating/moving existing flame) for its duration — most people who keep it fully are offline the entire time."
  },
  {
    key: "yom-kippur",
    matchTitle: (title) => title === "Yom Kippur",
    name: "Yom Kippur",
    icon: "gates",
    leadDays: 6,
    shopping: [
      "Ingredients for a substantial pre-fast meal (the meal before the fast is itself considered a mitzvah)",
      "Break-fast meal ingredients, ready to go for the moment the fast ends",
      "White clothing and/or a kittel, if that's your custom",
      "Non-leather shoes",
      "A memorial (Yahrzeit) candle, if you're observing a Yizkor remembrance",
      "Tzedakah cash to give before the fast begins"
    ],
    prep: [
      "Reach out to anyone you need to ask forgiveness from now — you won't have your phone once the fast starts.",
      "Arrange Kapparot in advance if that's your custom.",
      "Fill water bottles and prep meals in advance for any household members who aren't fasting (children, etc.).",
      "Charge any medical devices you'll need — questions about fasting with a medical condition should go to a doctor and a rabbi beforehand, not decided in the moment.",
      "Set out white clothing / kittel / non-leather shoes the night before so there's nothing to think about that morning."
    ],
    expectNote: "Yom Kippur is a single 25-hour fast day, offline from before sunset until nightfall the next day — no eating, drinking, bathing, leather shoes, or the usual daily conveniences."
  },
  {
    key: "sukkot",
    matchTitle: (title) => title === "Sukkot I",
    name: "Sukkot",
    icon: "sukkah",
    leadDays: 12,
    shopping: [
      "Sukkah materials (or a pre-made kit) if you're building your own — lumber/frame plus schach (roof covering)",
      "A lulav and etrog set — order these early, good sets sell out as the holiday approaches",
      "Decorations for the sukkah, if that's your custom",
      "Festive-meal groceries for several days of meals eaten in the sukkah",
      "Candles for the first two nights (and the closing two of Shmini Atzeret/Simchat Torah)"
    ],
    prep: [
      "Build and check the sukkah before the holiday starts — it needs to be structurally sound with proper schach coverage before Yom Tov, since building isn't permitted once it begins.",
      "Check the weather and have a plan (tarps, extra weighting) if rain or wind is expected.",
      "Check whether Eruv Tavshilin is needed this year (the page flags this automatically).",
      "If you're inviting guests (Ushpizin-style or otherwise), send invitations now.",
      "The middle days (Chol HaMoed) are more relaxed than the first two and last two — plan your offline stretches accordingly."
    ],
    expectNote: "The first two days and the closing two days (Shmini Atzeret and Simchat Torah) are full Yom Tov and offline; the middle days (Chol HaMoed) have lighter restrictions, though meals are still eaten in the sukkah."
  },
  {
    key: "pesach",
    matchTitle: (title) => title === "Pesach I",
    name: "Pesach (Passover)",
    icon: "matzah",
    leadDays: 21,
    shopping: [
      "Kosher-for-Passover food for the full eight days, plus matzah",
      "Wine or grape juice — four cups per person, for each Seder night",
      "Seder plate items: a shank bone, a roasted egg, maror (bitter herbs), charoset ingredients, karpas (a green vegetable), salt water",
      "Enough Haggadahs for everyone at your Seder table",
      "Cleaning supplies for the chametz clean-out, and foil/covers if you're koshering counters or a stovetop"
    ],
    prep: [
      "Arrange the sale of chametz (mechirat chametz) through a rabbi well in advance — this can't be done at the last minute.",
      "Deep-clean the home for chametz over the days before; do the formal search (Bedikat Chametz) the night before Erev Pesach, and burn it (Biur Chametz) the next morning.",
      "Plan your Seder: who's leading, who's reading which parts, seating for reclining.",
      "Check whether Eruv Tavshilin is needed this year for the seventh/eighth day (the page flags this automatically).",
      "Let people know you'll be offline for the first two and last two days — the four days in between (Chol HaMoed) are more relaxed."
    ],
    expectNote: "The first two days and the last two days are full Yom Tov and offline; the four days in between (Chol HaMoed) are lighter, though chametz stays off-limits for all eight days."
  },
  {
    key: "shavuot",
    matchTitle: (title) => title === "Shavuot I" || title === "Shavuot",
    name: "Shavuot",
    icon: "tablets",
    leadDays: 8,
    shopping: [
      "Dairy foods for the holiday meals — cheesecake is the classic, but any dairy spread works",
      "Flowers or greenery, if you keep the custom of decorating for the holiday",
      "Coffee or other ways to stay up, if you're doing all-night Torah study (Tikkun Leil Shavuot)",
      "Candles for both nights"
    ],
    prep: [
      "If you're joining an all-night learning session, plan what you'll study or which shiurim (classes) to attend.",
      "Check whether Eruv Tavshilin is needed this year (the page flags this automatically).",
      "Let people know you'll be offline — this holiday tends to sneak up since it's a single day after Pesach's long buildup."
    ],
    expectNote: "Shavuot is a two-day Yom Tov (in the diaspora), offline for its duration, capped off by many staying up the whole first night to learn."
  },

  // --- Days that aren't Yom Tov (no "offline" stretch) ------------------------
  // `kind: "day"` guides open 7 days ahead and teach the background:
  //   history: [paragraphs], meaning, practices (preparing yourself),
  //   prep (practical checklist), shopping?, expectNote, sources.
  // `when(date, fmt)` says when it starts, from the Hebcal event's date.

  {
    key: "chanukah",
    kind: "day",
    matchTitle: (title) => title === "Chanukah: 1 Candle",
    // Hebcal's "Chanukah: 1 Candle" is dated the day whose evening has the first lighting.
    when: (d, fmt) => `First candle: the evening of ${fmt(d)}`,
    name: "Chanukah",
    icon: "menorah",
    leadDays: 7,
    history: [
      "In the 2nd century BCE the Land of Israel was ruled by the Seleucid Greek empire. King Antiochus IV banned Shabbat, circumcision and Torah study, and turned the Temple in Jerusalem into a shrine to Greek gods.",
      "A family of priests — Mattathias and his sons, the Maccabees (also called the Hasmoneans) — led a revolt. Against much larger armies they retook Jerusalem in 164 BCE, cleaned the Temple and dedicated it again. \"Chanukah\" means \"dedication\".",
      "The Talmud tells that they found only one sealed jar of pure oil, enough to light the Temple's Menorah for a single day — and it burned for eight days, until new oil could be made. So the Sages set eight days of lighting, praise and thanks."
    ],
    meaning: "Chanukah celebrates light that refuses to go out: a small group that kept its identity when the surrounding culture pushed it to blend in, and a little oil that lasted far longer than expected. The lights go in a window, to \"publicize the miracle\" — Judaism lived in the open. And we add one more light each night, because in holiness we always go up.",
    practices: [
      "Pick one small way to add light each night — a kind call, a few minutes of learning, a coin in the tzedakah box — growing night by night like the candles.",
      "Learn the blessings now, so the first night feels natural (they appear each night in \"What to do today\", in Hebrew, transliteration and English).",
      "Read the story — or Al HaNissim, the prayer added during Chanukah — and tell it in your own words to someone else.",
      "Invite someone to light with you, especially someone who'd otherwise be alone."
    ],
    prep: [
      "Get a menorah (chanukiah): eight lights in a straight row, plus a ninth helper light (the shamash) set apart. Candles or oil both work; olive oil recalls the Temple.",
      "Count your candles: 44 for all eight nights (36 plus a shamash each night). Friday's candles must be big enough to burn until 30 minutes after nightfall, since they're lit before Shabbat.",
      "Choose your spot: a window facing the street, or by the front door opposite the mezuzah — safely away from curtains.",
      "Note Friday and Saturday nights: on Friday the menorah is lit before the Shabbat candles; on Saturday night, only after Shabbat ends.",
      "Plan some food fried in oil — latkes or sufganiyot (jelly doughnuts) — and a dreidel game."
    ],
    shopping: [
      "A menorah, if you don't have one",
      "Chanukah candles (a box of 44) — or olive oil and wicks",
      "Potatoes and oil for latkes, or doughnuts",
      "A dreidel and some chocolate coins (gelt)"
    ],
    expectNote: "Chanukah isn't a Yom Tov: work, phones and driving are all fine. The main mitzvah is lighting each evening; Hallel and Al HaNissim are added to the prayers for all eight days.",
    sources: ["Talmud, Shabbat 21b–23a", "1 Maccabees 4", "Shulchan Aruch, Orach Chaim 670–684"]
  },
  {
    key: "asara-btevet",
    kind: "day",
    matchTitle: (title) => /^Asara B.Tevet$/.test(title),
    when: (d, fmt) => `Fast day: ${fmt(d)}, from dawn to nightfall`,
    name: "Asara B'Tevet (the Fast of the Tenth of Tevet)",
    icon: "broken-tablets",
    leadDays: 7,
    history: [
      "On the tenth of Tevet, about 2,600 years ago, Nebuchadnezzar king of Babylon laid siege to Jerusalem (2 Kings 25:1). The siege ended two and a half years later with the city's fall, the destruction of the First Temple and the exile to Babylon.",
      "It's one of four fasts that mourn the Temple. The prophet Zechariah already calls it \"the fast of the tenth month\" — and promises that one day these fasts will become days of joy.",
      "Since 1949, Israel's Chief Rabbinate has also made it a general Kaddish day for Holocaust victims whose date of death isn't known."
    ],
    meaning: "This fast marks the beginning of a tragedy, not its end — the moment when things could still have turned around. That makes it a day for teshuvah (returning): looking honestly at what in our own lives is \"under siege\" and could still change.",
    practices: [
      "Choose one thing you'd like to repair — a habit, a relationship — and take one concrete step on the day.",
      "Give tzedakah; a custom is to give the cost of the meals you won't eat.",
      "Learn a little about the First Temple's destruction — 2 Kings 25 or a chapter of Jeremiah.",
      "Light a candle or say Kaddish (with a minyan) for Holocaust victims whose date of death is unknown."
    ],
    prep: [
      "It's a minor fast: no eating or drinking from dawn until nightfall. The exact times for your city appear that day in \"What to do today\" and the Zmanim card.",
      "Drink plenty and eat well the evening before. If you want to eat before dawn, decide so before you go to sleep.",
      "Pregnant or nursing women, anyone who is ill, and many others are exempt — and if you're in the conversion process, ask your rabbi what's right for you.",
      "If you drink coffee, cut down a few days before to avoid a headache.",
      "Unlike the other minor fasts, Asara B'Tevet is kept even when it falls on a Friday."
    ],
    expectNote: "Work, phones and travel are all fine. At Shacharit, Selichot and Avinu Malkeinu are added; Aneinu is added to the Amidah, and the Torah is read at Shacharit and Mincha.",
    sources: ["2 Kings 25:1", "Zechariah 8:19", "Shulchan Aruch, Orach Chaim 549–550"]
  },
  {
    key: "tu-bishvat",
    kind: "day",
    matchTitle: (title) => title === "Tu BiShvat",
    when: (d, fmt) => `${fmt(d)} (it begins the evening before)`,
    name: "Tu BiShvat",
    icon: "tree",
    leadDays: 7,
    history: [
      "The Mishnah lists the fifteenth of Shevat as \"the New Year for trees\". It was a practical date: fruit that blossomed before it counted toward the previous year's tithes, fruit after it toward the new year.",
      "In the 1500s, the mystics of Safed created a Tu BiShvat seder: a meal of fruits and four cups of wine, moving from white to red, with readings about growth and blessing.",
      "In modern Israel it became a day for planting trees — the Jewish National Fund has planted hundreds of millions since the early 1900s."
    ],
    meaning: "In mid-winter in Israel the trees still look bare, but the sap is already rising. The Torah compares a person to a tree of the field: growth often starts quietly, under the surface. Tu BiShvat asks what is quietly growing in you.",
    practices: [
      "Hold a simple Tu BiShvat seder: taste different fruits, say the right blessing over each, and share what each one means to you.",
      "Learn the blessings before fruit (borei p'ri ha'etz) and after eating (borei nefashot, or al ha'etz after the special fruits of Israel).",
      "Plant something — a tree, or even a herb on a windowsill — or give to tree-planting in Israel.",
      "Say Shehecheyanu on a fruit you haven't tasted yet this season."
    ],
    prep: [
      "Gather the Seven Species of the Land of Israel (Deuteronomy 8:8): wheat, barley, grapes, figs, pomegranates, olives and dates.",
      "Find a fruit you haven't eaten this season, for Shehecheyanu.",
      "If you're hosting a seder, print or borrow a Tu BiShvat Haggadah — many free ones are online."
    ],
    shopping: [
      "Figs, dates, olives, grapes or raisins, and a pomegranate",
      "Something made of wheat and barley (bread, crackers, barley soup)",
      "A new seasonal fruit",
      "White and red wine or grape juice, if you're doing a seder",
      "Carob (bokser), a traditional Tu BiShvat treat"
    ],
    expectNote: "Tu BiShvat is a happy day with no restrictions; Tachanun is left out of the prayers.",
    sources: ["Mishnah Rosh Hashanah 1:1", "Deuteronomy 8:8", "Deuteronomy 20:19", "Pri Etz Hadar (the Safed Tu BiShvat seder)"]
  },
  {
    key: "purim",
    kind: "day",
    matchTitle: (title) => title === "Purim",
    when: (d, fmt) => `Megillah reading: the evening of ${fmt(addDays(d, -1))} · Purim day: ${fmt(d)}`,
    name: "Purim",
    icon: "mask",
    leadDays: 7,
    history: [
      "The Book of Esther is set in the Persian empire, about 2,400 years ago. The king's chief minister, Haman, plotted to kill all the Jews on one day — the thirteenth of Adar, chosen by lot (\"pur\", which gives Purim its name).",
      "Queen Esther, who had kept her Jewish identity secret, decided to risk her life by going to the king uninvited. First she asked all the Jews of Shushan to fast for three days with her. Her cousin Mordechai urged her on: \"Who knows if it wasn't for a moment like this that you became queen?\"",
      "The plot was overturned. The Jews defended themselves on the 13th and celebrated on the 14th — and in the walled capital, Shushan, on the 15th. That's why Jerusalem still celebrates a day later, on Shushan Purim."
    ],
    meaning: "God's name never appears in the Book of Esther: the story looks like palace politics and lucky timing. Purim teaches us to look for the hidden hand in ordinary events. And the rescue came through unity — so every mitzvah of the day is about other people: sharing food, giving to the poor, and celebrating together.",
    practices: [
      "Read the Book of Esther in English before Purim, so the Hebrew reading makes sense when you hear it.",
      "Think about who to send Mishloach Manot to — maybe someone you've lost touch with, or someone new in your community.",
      "Set aside money for Matanot La'evyonim, gifts to at least two people in need; many synagogues collect and distribute it on the day.",
      "Find out where you'll hear the Megillah — at night and again in the morning."
    ],
    prep: [
      "The Fast of Esther (Ta'anit Esther) is the day before Purim — or the Thursday before, when Purim falls on Sunday: no eating or drinking from dawn to nightfall, remembering Esther's fast.",
      "Machatzit HaShekel: before Purim, give three half-units of your currency (for example, three half-dollar coins) to charity, recalling the Temple's half-shekel.",
      "Plan Mishloach Manot: at least two kinds of ready-to-eat food, sent to at least one friend.",
      "Plan the Purim feast (seudah) for the afternoon of Purim day.",
      "Many dress up in costume — a reminder that the miracle was \"hidden\"."
    ],
    shopping: [
      "A noisemaker (gra'ager) for Haman's name",
      "Food and drink for Mishloach Manot packages",
      "Hamantaschen, or the ingredients to bake them",
      "Cash for gifts to the poor and the half-shekel",
      "A costume, if you'd like one"
    ],
    expectNote: "Purim isn't a Yom Tov — work is allowed, though many take the day off. The Megillah is read at night and in the morning, Al HaNissim is added to the prayers, and Tachanun is left out.",
    sources: ["The Book of Esther", "Talmud, Megillah 7a–7b", "Shulchan Aruch, Orach Chaim 686–695"]
  }
];

/** Count consecutive "offline" days (Yom Tov days plus any Shabbat that directly
 *  adjoins them) starting from a chag's first day, using this year's actual calendar. */
function computeOfflineSpan(events, startDate) {
  let d = new Date(startDate);
  let count = 0;
  while (true) {
    const dow = d.getDay();
    const isYomTovDay = events.some(e => daysBetween(e.date, d) === 0 && e.yomtov);
    if (isYomTovDay || dow === 6) {
      count++;
      d = addDays(d, 1);
    } else break;
  }
  return count;
}

function findUpcomingPrepGuide(events, today) {
  let best = null;
  for (const guide of PREP_GUIDES) {
    const evt = events.find(e => guide.matchTitle(e.title));
    if (!evt) continue;
    const daysUntil = daysBetween(today, evt.date);
    if (daysUntil < 0 || daysUntil > guide.leadDays) continue;
    if (!best || evt.date < best.date) best = { guide, date: evt.date, daysUntil };
  }
  if (!best) return null;
  const offlineDays = best.guide.kind === "day" ? 0 : computeOfflineSpan(events, best.date);
  return { ...best, offlineDays };
}
