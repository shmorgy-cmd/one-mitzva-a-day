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
    blessings: ["chanukahLight", "chanukahMiracles", "shehecheyanu"],
    texts: [{ key: "haneirotHalalu" }],
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
      "Learn the blessings now, so the first night feels natural — they're below, and each night's timeline shows them too.",
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
    blessings: ["haetz", "shehecheyanu", "boreiNefashot"],
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
  },

  // --- Batch 2: the Omer season's special days ------------------------------------
  {
    key: "yom-hashoah",
    kind: "day",
    matchTitle: (title) => title === "Yom HaShoah",
    when: (d, fmt) => `${fmt(d)} (it begins the evening before)`,
    name: "Yom HaShoah (Holocaust Remembrance Day)",
    icon: "candle-memorial",
    leadDays: 7,
    history: [
      "Between 1933 and 1945, Nazi Germany and its collaborators murdered six million Jews — about one and a half million of them children. Whole communities, with centuries of Jewish life, learning and culture, were destroyed.",
      "In 1951 Israel's Knesset set the 27th of Nisan as Yom HaShoah VeHaGevurah — the Day of the Holocaust and Heroism — close to the anniversary of the Warsaw Ghetto Uprising, which began on the eve of Pesach 1943. The date shifts by a day when it would touch Shabbat.",
      "In Israel, a siren sounds for two minutes at 10 a.m. and the whole country stops and stands in silence. The national ceremony at Yad Vashem, in Jerusalem, opens the evening before."
    ],
    meaning: "Remembering is itself a Jewish command — \"Zachor\", remember. On this day we remember people, not numbers, and we honor both those who were murdered and those who resisted, rescued, survived and rebuilt Jewish life afterwards.",
    practices: [
      "Choose one name to remember. Yad Vashem's online database holds millions of victims' names, many with photos and stories.",
      "Listen to or read a survivor's testimony — Yad Vashem and the USC Shoah Foundation have thousands online.",
      "Light a memorial candle the evening before.",
      "Say a chapter of Psalms or the memorial prayer El Malei Rachamim; with a minyan, Kaddish is said."
    ],
    prep: [
      "Find a ceremony near you — synagogues, Jewish community centers and schools often hold one the evening before or on the day.",
      "Get a 24-hour memorial (yahrzeit) candle.",
      "If you have children, think ahead about age-appropriate ways to talk about the Holocaust.",
      "Some communities remember the Holocaust mainly on Asara B'Tevet or Tisha B'Av instead — follow your community."
    ],
    shopping: ["A 24-hour memorial candle"],
    expectNote: "It's a national day of remembrance rather than a religious holiday: most siddurim have no prayer changes, and work is allowed. In Israel, places of entertainment close from the evening before.",
    sources: ["Deuteronomy 25:17 (\"Remember\")", "Knesset resolution, 1951; Yom HaShoah law, 1959", "Yad Vashem (yadvashem.org)"]
  },
  {
    key: "yom-hazikaron",
    kind: "day",
    matchTitle: (title) => title === "Yom HaZikaron",
    when: (d, fmt) => `Yom HaZikaron: ${fmt(d)} · Yom HaAtzma'ut: ${fmt(addDays(d, 1))} (each begins the evening before)`,
    name: "Yom HaZikaron and Yom HaAtzma'ut",
    icon: "flag-star",
    leadDays: 7,
    history: [
      "On the 5th of Iyar 5708 — May 14, 1948 — David Ben-Gurion read Israel's Declaration of Independence in Tel Aviv. The next day, the armies of five Arab states invaded, and the War of Independence cost about 6,000 Israeli lives.",
      "The day before Independence Day is Yom HaZikaron, Israel's Memorial Day for fallen soldiers — and, since 1997, for victims of terror too. In Israel, sirens sound at 8 p.m. as it begins and at 11 a.m. the next morning, and everything stops.",
      "The two days sit back to back on purpose: the joy of independence is bound up with what it cost. The switch from mourning to celebration happens at nightfall, at a ceremony on Mount Herzl in Jerusalem. The dates move by a day or two when they would touch Shabbat."
    ],
    meaning: "For many, these two days hold a whole people's story in one evening: grief for those who gave their lives, and gratitude for a Jewish state after nearly 2,000 years of exile. Jewish communities relate to the religious side differently — some say Hallel with a blessing, some without, and many Haredi communities don't mark the day religiously. Every one of these views deserves respect.",
    practices: [
      "Learn about one fallen soldier or victim of terror — Israel's official Yizkor site tells each of their stories.",
      "Stand for a minute of silence when the siren sounds in Israel, wherever you are.",
      "Read Israel's Declaration of Independence, or learn the words of Hatikvah.",
      "On Yom HaAtzma'ut, celebrate: Israeli food and music, or a call to friends and family in Israel."
    ],
    prep: [
      "Find a ceremony near you — many communities hold a combined Yom HaZikaron–Yom HaAtzma'ut event.",
      "Ask your synagogue what it adds to the prayers (some say Hallel) — the \"In prayer\" card shows the customs on the day.",
      "Plan a festive meal for Yom HaAtzma'ut — in Israel, a barbecue (\"mangal\") is the classic.",
      "Get an Israeli flag to hang."
    ],
    shopping: [
      "An Israeli flag",
      "Israeli food: hummus, pita, falafel, Israeli salad",
      "A memorial candle for Yom HaZikaron, if you'd like"
    ],
    expectNote: "Both are national days, not Yom Tov: work and phones are fine. Prayer customs differ by community. Since these days fall during the Omer, many who keep its mourning customs lift them for Yom HaAtzma'ut.",
    sources: ["Israel's Declaration of Independence (1948)", "Memorial Day law (1963)", "Israel's Yizkor site (izkor.gov.il)"]
  },
  {
    key: "lag-baomer",
    kind: "day",
    matchTitle: (title) => title === "Lag BaOmer",
    when: (d, fmt) => `${fmt(d)} (it begins the evening before)`,
    name: "Lag BaOmer",
    icon: "sun-high",
    leadDays: 7,
    history: [
      "Lag BaOmer is the 33rd day of the Omer count — \"Lag\" is how 33 is written in Hebrew letters (ל״ג). It falls on the 18th of Iyar.",
      "The Talmud tells that 24,000 students of Rabbi Akiva died in a plague between Pesach and Shavuot \"because they didn't treat each other with respect\". By tradition, the dying stopped on Lag BaOmer — so the Omer's mourning customs are lifted on this day (for some, from now on; for others, just for the day).",
      "It's also the yahrzeit (anniversary of death) of Rabbi Shimon bar Yochai, the 2nd-century sage whom tradition links to the Zohar, the central book of Kabbalah. He asked that his day be one of joy, and hundreds of thousands gather at his grave in Meron, in northern Israel."
    ],
    meaning: "A day about respect and about light. Rabbi Akiva's students were great scholars who failed at the basics of how they treated one another; Rabbi Shimon's teachings are about the hidden light of the Torah. The bonfires lit on Lag BaOmer stand for that light.",
    practices: [
      "Strengthen one relationship — reach out to someone you've been short with.",
      "Learn Rabbi Akiva's teaching: \"Love your neighbor as yourself — this is a great principle of the Torah.\"",
      "Join a community bonfire, picnic or parade.",
      "Count the Omer the night before: day 33."
    ],
    prep: [
      "Find a local bonfire, picnic or Lag BaOmer parade — Chabad centers host many.",
      "If you keep the Omer mourning customs, Lag BaOmer is when many schedule haircuts, weddings and live music — check your community's custom.",
      "Some families hold a boy's first haircut (upsherin) at age three on this day.",
      "Pack outdoor food; children traditionally play with bows and arrows."
    ],
    shopping: ["Food for a picnic or barbecue", "Marshmallows for the bonfire"],
    expectNote: "A joyful day with no work restrictions; Tachanun is left out of the prayers.",
    sources: ["Talmud, Yevamot 62b", "Leviticus 19:18", "Shulchan Aruch, Orach Chaim 493"]
  },
  {
    key: "yom-yerushalayim",
    kind: "day",
    matchTitle: (title) => title === "Yom Yerushalayim",
    when: (d, fmt) => `${fmt(d)} (it begins the evening before)`,
    name: "Yom Yerushalayim (Jerusalem Day)",
    icon: "gates",
    leadDays: 7,
    history: [
      "Jerusalem has been the center of Jewish prayer for 3,000 years, since King David made it his capital and King Solomon built the Temple there. Jews face it in every Amidah, and the Seder ends with \"Next year in Jerusalem\".",
      "From 1948 to 1967, the Old City was under Jordanian rule and Jews couldn't pray at the Western Wall. On the 28th of Iyar 5727 — June 7, 1967 — during the Six-Day War, Israeli paratroopers reached the Old City and the Wall.",
      "Israel's Chief Rabbinate declared the day one of thanksgiving in 1968, and in 1998 the Knesset made it a national holiday."
    ],
    meaning: "A day of thanks for being able to return to the places Jews prayed toward for centuries — and of prayer for the city's peace: \"Pray for the peace of Jerusalem\" (Psalm 122). As with Yom HaAtzma'ut, communities mark it in different ways.",
    practices: [
      "Read Psalm 122 or Psalm 126 (\"When God returned the exiles of Zion, we were like dreamers\").",
      "Take a virtual tour of the Old City or the Western Wall, or learn about the Temple's history.",
      "Say the blessing for Jerusalem in Grace After Meals (\"Uvnei Yerushalayim\") with extra attention.",
      "Pray for peace in Jerusalem, for everyone who lives there."
    ],
    prep: [
      "Find a community event or celebration near you.",
      "Ask your synagogue about its prayer customs — some say Hallel.",
      "It falls during the Omer; many who keep the Omer's mourning customs lift them for the day."
    ],
    expectNote: "A national day rather than a Yom Tov: work and phones are fine.",
    sources: ["Psalm 122", "Psalm 137:5–6", "Chief Rabbinate of Israel (1968)"]
  },

  // --- Batch 3: summer mourning, Tu B'Av and the fast after Rosh Hashanah ---------
  {
    key: "tzom-tammuz",
    kind: "day",
    matchTitle: (title) => /^Tzom Tammuz/.test(title),
    when: (d, fmt) => `Fast day: ${fmt(d)}, from dawn to nightfall · it opens the Three Weeks`,
    name: "The 17th of Tammuz and the Three Weeks",
    icon: "broken-tablets",
    leadDays: 7,
    history: [
      "The Mishnah lists five tragedies on the 17th of Tammuz. Among them: Moses broke the first Tablets of the Law when he saw the Golden Calf, the daily offering in the Temple stopped, and — in the year 70 CE — the Romans broke through the walls of Jerusalem.",
      "Three weeks after the walls fell, on the 9th of Av, the Second Temple was destroyed. So this fast opens the Three Weeks (\"Bein HaMetzarim\", \"between the narrow straits\"), a period of growing mourning that ends on Tisha B'Av.",
      "The prophet Zechariah already calls it \"the fast of the fourth month\" — Tammuz is the fourth month counting from Nisan."
    ],
    meaning: "The breach in the wall came weeks before the destruction. The Three Weeks ask us to notice the small cracks — in our communities and in ourselves — before they grow. The Sages say the Second Temple fell because of baseless hatred; the answer they teach is baseless love.",
    practices: [
      "Take on one extra act of kindness each day of the Three Weeks — \"baseless love\" in practice.",
      "Learn a little each day about the Temple and why it matters.",
      "Give tzedakah; a custom on fast days is to give the cost of the meals you skip.",
      "Mend one relationship that has cracked."
    ],
    prep: [
      "It's a minor fast: no eating or drinking from dawn until nightfall. Your city's exact times appear that day in \"What to do today\" and the Zmanim card.",
      "Drink plenty the evening before (summer fasts are long and hot). If you want to eat before dawn, decide so before you go to sleep.",
      "Pregnant or nursing women, anyone who is ill, and others are often exempt — and if you're in the conversion process, ask your rabbi what's right for you.",
      "From the fast until Tisha B'Av, Ashkenazim don't hold weddings, get haircuts or listen to live music; many Sephardim start these customs later, from Rosh Chodesh Av or the week of Tisha B'Av. Ask your rabbi.",
      "Many avoid saying Shehecheyanu during the Three Weeks — so wear that new outfit or taste that new fruit before the fast (or on Shabbat)."
    ],
    expectNote: "Work and phones are fine. Selichot and Avinu Malkeinu are added at Shacharit, Aneinu in the Amidah, and the Torah is read at Shacharit and Mincha.",
    sources: ["Mishnah Ta'anit 4:6", "Zechariah 8:19", "Talmud, Yoma 9b", "Shulchan Aruch, Orach Chaim 549–551"]
  },
  {
    key: "tisha-bav",
    kind: "day",
    matchTitle: (title) => /^Tish.a B.Av( \(observed\))?$/.test(title),
    when: (d, fmt) => `The fast: from sunset on ${fmt(addDays(d, -1))} until nightfall on ${fmt(d)}`,
    name: "Tisha B'Av and the Nine Days",
    icon: "candle-memorial",
    // Opens with the Nine Days, which begin on Rosh Chodesh Av, 8 days before
    // (a day later in years when the fast is postponed from Shabbat to Sunday).
    leadDays: 8,
    history: [
      "On the 9th of Av, both Temples in Jerusalem were destroyed: the First by the Babylonians in 586 BCE, the Second by the Romans in 70 CE. The Mishnah adds more: the spies' discouraging report in the desert, the fall of the fortress of Betar at the end of the Bar Kochba revolt (135 CE), and Jerusalem being plowed over.",
      "Later tragedies became linked to the day too — the expulsion of the Jews from Spain in 1492 is traditionally connected to it, and the First World War, which led toward so much Jewish suffering, broke out on the 9th of Av, 1914.",
      "It's the saddest day of the Jewish year: a full fast from sunset to nightfall, like Yom Kippur, closing the Three Weeks of mourning."
    ],
    meaning: "Tisha B'Av is about loss and exile, but not about despair. The Sages say the Messiah is born on Tisha B'Av, and by the afternoon the mood begins to lift. Mourning together keeps alive both the memory of what was lost and the hope of rebuilding.",
    practices: [
      "Read Eichah (Lamentations) in English before the fast, so you can follow it when it's chanted at night.",
      "Learn the Talmud's story of Kamtza and Bar Kamtza — how one public humiliation helped bring down the Temple.",
      "In the afternoon, many watch a film or lecture about Jewish history and loss.",
      "Choose one way to bring more \"baseless love\" into your life after the fast."
    ],
    prep: [
      "The Nine Days begin on Rosh Chodesh Av. Many don't eat meat or drink wine (except on Shabbat), don't do laundry or buy new clothes, and avoid swimming and pleasure trips. Customs vary — ask your rabbi.",
      "The fast begins at sunset: no eating or drinking, washing for pleasure, lotions, leather shoes or marital relations, until nightfall the next day.",
      "The last meal before the fast (seudah hamafseket) is simple — traditionally bread and a hard-boiled egg dipped in ashes, eaten sitting low. When Tisha B'Av falls on Shabbat, the fast moves to Sunday and Shabbat's meals stay festive.",
      "Get non-leather shoes ready (canvas or rubber).",
      "Find out where Eichah is read at night and Kinot (elegies) in the morning."
    ],
    shopping: [
      "Non-leather shoes",
      "Simple food for the meal before the fast, and something light to break it",
      "A copy of Eichah and the Kinot with translation"
    ],
    expectNote: "Synagogues dim the lights, and people sit on the floor or low seats until midday. Many avoid work and greetings until midday. Tallit and tefillin are worn at Mincha instead of in the morning.",
    sources: ["Mishnah Ta'anit 4:6", "Talmud, Gittin 55b–58a", "The Book of Eichah (Lamentations)", "Shulchan Aruch, Orach Chaim 549–559"]
  },
  {
    key: "tu-bav",
    kind: "day",
    matchTitle: (title) => /^Tu B.Av$/.test(title),
    when: (d, fmt) => `${fmt(d)} (it begins the evening before)`,
    name: "Tu B'Av",
    icon: "heart",
    leadDays: 7,
    history: [
      "The Mishnah says there were no happier days for Israel than Yom Kippur and the 15th of Av. The young women of Jerusalem would go out in borrowed white clothes — so that no one would be embarrassed for not owning one — and dance in the vineyards, where young men came to find a match.",
      "The Talmud gives several reasons for the joy: on this day the tribes of Israel were allowed to marry one another again, the tribe of Benjamin was welcomed back, and the generation in the desert stopped dying.",
      "In modern Israel, Tu B'Av has become a day of love, popular for weddings."
    ],
    meaning: "Just six days after Tisha B'Av, Tu B'Av shows that after mourning comes joy. And the borrowed white clothes carry the deeper lesson: real celebration is when no one feels left out.",
    practices: [
      "Bring people together — host a meal, or introduce two people who should meet.",
      "Lend or give something so someone else won't feel embarrassed.",
      "Tell someone you love or appreciate them.",
      "From Tu B'Av the nights grow longer; the Talmud says to use the extra hours for Torah study."
    ],
    prep: [
      "Plan a date, a family celebration or a gathering with friends.",
      "Wear white, recalling the borrowed dresses, if you like.",
      "Weddings are common this week — the Three Weeks are over."
    ],
    expectNote: "A happy day with no restrictions; Tachanun is left out of the prayers.",
    sources: ["Mishnah Ta'anit 4:8", "Talmud, Ta'anit 30b–31a"]
  },
  {
    key: "tzom-gedaliah",
    kind: "day",
    matchTitle: (title) => /^Tzom Gedaliah/.test(title),
    when: (d, fmt) => `Fast day: ${fmt(d)}, from dawn to nightfall`,
    name: "Tzom Gedaliah (the Fast of Gedaliah)",
    icon: "candle-memorial",
    leadDays: 7,
    history: [
      "After the Babylonians destroyed the First Temple, they appointed Gedaliah ben Achikam, a Jew, as governor over the people who remained in the land. He was murdered by a fellow Jew, Yishmael ben Netaniah (Jeremiah 40–41).",
      "Fearing Babylon's revenge, the remaining Jews fled to Egypt — ending Jewish life in the land for a time after the destruction.",
      "It's Zechariah's \"fast of the seventh month\", kept on the 3rd of Tishrei, right after Rosh Hashanah (or on the 4th, when the 3rd is Shabbat)."
    ],
    meaning: "The Sages say the death of a righteous person is as great a loss as the burning of the Temple itself — and this tragedy came from Jews turning against Jews. Falling in the Ten Days of Repentance, it's a call to teshuvah, especially in how we treat each other.",
    practices: [
      "Continue the Ten Days' work: one honest look at something you'd like to change this year.",
      "Ask someone's forgiveness, or offer yours.",
      "Read Jeremiah 40–41, the story behind the fast.",
      "Give tzedakah."
    ],
    prep: [
      "It's a minor fast: no eating or drinking from dawn until nightfall. Your city's exact times appear that day in \"What to do today\" and the Zmanim card.",
      "Because it comes right after Rosh Hashanah, eat and drink well at the last holiday meal. If you want to eat before dawn, decide so before you go to sleep.",
      "Pregnant or nursing women, anyone who is ill, and others are often exempt — and if you're in the conversion process, ask your rabbi what's right for you."
    ],
    expectNote: "Work and phones are fine. Selichot, Avinu Malkeinu and Aneinu are added, the Torah is read at Shacharit and Mincha, and the Ten Days' changes to the Amidah continue.",
    sources: ["Jeremiah 40–41", "Zechariah 8:19", "Talmud, Rosh Hashanah 18b"]
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
