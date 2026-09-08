/**
 * prep.js — "get ready before you go offline" guides for the major
 * multi-day Yom Tovs (the ones with real no-phone/no-driving/no-cooking-
 * from-scratch restrictions), since observant visitors won't be checking
 * this site once the chag actually starts. Each guide is keyed to the
 * Hebcal title of the chag's first day.
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
  const offlineDays = computeOfflineSpan(events, best.date);
  return { ...best, offlineDays };
}
