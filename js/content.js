/**
 * content.js
 *
 * The heart of the site: a hand-written library of "occasions" tied to the
 * Jewish calendar. Each occasion knows how to test whether it applies to a
 * given day (via `match`) and carries halacha, custom, and inspirational
 * content written for someone learning Judaism from the inside — including
 * people considering conversion, so language avoids assuming the reader
 * already keeps everything, and gently notes where a rabbi/teacher should
 * be consulted for personal practice.
 *
 * `match(ctx)` receives a context object (built in app.js) with:
 *   ctx.today          - JS Date (local, midnight) for today
 *   ctx.events         - array of Hebcal events in the fetched window
 *   ctx.findEvent(fn)  - helper to find an event by predicate
 *   ctx.daysUntil(date)- integer days from today to date (can be negative)
 *   ctx.isToday(date)  - true if date is today
 *   ctx.dow            - today's day of week, 0=Sun..6=Sat
 *   ctx.selichotStart  - Date, Ashkenazi Selichot start (Motzei Shabbat)
 *   ctx.erevTavshilin  - Date|null, next date Erev Tavshilin should be made
 *   ctx.hebrewToday     - today's Hebrew date string, e.g. "3 Tishrei 5787"
 */

const OCCASIONS = [

  // ---------------------------------------------------------------
  // ELUL / SELICHOT / TESHUVA SEASON
  // ---------------------------------------------------------------
  {
    id: "elul-general",
    icon: "shofar",
    title: "Elul — The King Is in the Field",
    priority: 10,
    match: (ctx) => ctx.hebrewMonth === "Elul" && !ctx.isToday(ctx.selichotStart) && ctx.daysUntilRoshHashana > 0,
    content: {
      intro: "We are in the month of Elul, the run-up to Rosh Hashanah. Tradition compares this month to a king who leaves his palace and walks out among his people in the field — approachable, near, wanting to be found even by those who would never dare visit the throne room.",
      halacha: [
        "It is customary to blow the shofar every weekday morning after prayers throughout Elul, as a wake-up call (this stops a day or two before Rosh Hashanah).",
        "Many add Psalm 27 (\"L'David, Hashem Ori\") to the daily prayers, morning and evening, from the start of Elul through Hoshana Rabbah.",
        "It's customary to review one's deeds, set aside extra time for charity, and — if there is anything unresolved between you and another person — to begin making it right before the Days of Awe arrive."
      ],
      customs: [
        "Some have the custom of visiting a mikveh (ritual bath) more frequently during Elul as a physical expression of spiritual renewal.",
        "Elul is spelled in Hebrew א-ל-ו-ל, read by tradition as an acronym for \"Ani L'Dodi V'Dodi Li\" — \"I am my Beloved's and my Beloved is mine,\" from Song of Songs. It sets the tone: this season isn't about dread, it's about a relationship being renewed."
      ],
      inspiration: "The work of Elul isn't self-flagellation, it's homecoming. Nothing you've done places you outside the field the King is walking through. Pick one thing — really one — that you'd like to be different by Rosh Hashanah, and start today."
    }
  },
  {
    id: "selichot-start",
    icon: "shofar",
    title: "Selichot Begins Tonight",
    priority: 60,
    match: (ctx) => ctx.isToday(ctx.selichotStart),
    content: {
      intro: "Tonight begins Selichot — the special penitential prayers recited in the lead-up to Rosh Hashanah. Ashkenazi custom starts Selichot on the Saturday night (Motzei Shabbat) before Rosh Hashanah, timed so there are at least four days of Selichot before the new year begins; Sephardim begin reciting them from the very start of Elul.",
      halacha: [
        "The first night's Selichot service is typically held late at night (often around or after midnight), with a distinct, more elaborate liturgy than the shorter Selichot said on the following mornings before dawn.",
        "Selichot are usually said before the morning prayers each remaining weekday of Elul (and continue through the Ten Days of Repentance, aside from Shabbat).",
        "If you can't make it to a minyan for Selichot, the private recitation loses some elements (like the Thirteen Attributes said communally), but the spirit of the practice — an honest accounting before God — is available to anyone, anywhere."
      ],
      customs: [
        "It's customary to dress a little more formally for the first night of Selichot, and in many communities it doubles as a communal gathering point before the intensity of the coming weeks."
      ],
      inspiration: "Selichot literally means 'forgivenesses.' Notice the plural — it isn't asking for one clean slate, it's opening a conversation that repeats, night after night, because teshuva (return) is a process, not an event. You're allowed to come back more than once."
    }
  },
  {
    id: "erev-rosh-hashana",
    icon: "apple-honey",
    title: "Erev Rosh Hashanah",
    priority: 80,
    match: (ctx) => ctx.findEvent(e => /^Erev Rosh Hashana/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Erev Rosh Hashanah — the last day of the year 5786 (or whichever year is ending), and the final stretch before the Days of Awe begin at nightfall.",
      halacha: [
        "It's customary to visit a cemetery (if one has departed loved ones, or a Rebbe's resting place) before Rosh Hashanah, and to give extra charity today.",
        "Many have the custom of immersing in a mikveh before the holiday begins.",
        "Prepare an eruv tavshilin only if this year's calendar requires it (check today's card above) — this lets food be cooked on Yom Tov for Shabbat if Rosh Hashanah runs directly into Shabbat.",
        "Candle lighting begins the holiday at sundown; from a pre-existing flame, a new one may be lit on the second night of Rosh Hashanah after nightfall.",
        "A festive, but not overly heavy, final meal before the fast-paced holiday meals begin is traditional; some have a light custom similar to erev Yom Kippur, though Rosh Hashanah itself is not a fast."
      ],
      customs: [
        "Round challahs are often baked today for the Rosh Hashanah table, symbolizing the cyclical, crowning nature of the year and of kingship.",
        "Apples, honey, pomegranates, and other simanim (symbolic foods) are often prepared today for tomorrow night's meal."
      ],
      inspiration: "Every erev — every 'eve of' — in Jewish time is an act of preparation, and preparation is itself a spiritual act: it says the coming moment matters enough to get ready for. Whatever this year held, you get to walk into the new one having chosen, today, to show up for it."
    }
  },
  {
    id: "rosh-hashana",
    icon: "apple-honey",
    title: "Rosh Hashanah",
    priority: 100,
    match: (ctx) => ctx.findEvent(e => /^Rosh Hashana( \d{3,4}| II)$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Rosh Hashanah, the Jewish New Year — the anniversary of the creation of humanity, and the day tradition calls Yom HaDin, the Day of Judgment, as well as Yom Hazikaron, the Day of Remembrance. It is celebrated for two days, even in Israel.",
      halacha: [
        "The central mitzvah of the day is hearing the shofar (ram's horn) blown — a set of 100 blasts is customary over the course of the service. (The shofar is not blown when the first day falls on Shabbat.)",
        "It is customary to eat apple dipped in honey after making the blessing on bread, asking for a sweet new year — often with the short prayer 'Yehi ratzon... shetechadesh aleinu shana tova u'metuka.'",
        "Many communities perform Tashlich on the first afternoon (or during the Ten Days if that's not possible) — going to a body of flowing water and symbolically casting off sins, reciting verses from Micah.",
        "The Amidah and Torah readings are expanded with themes of God's kingship, remembrance, and the shofar itself.",
        "It is not customary to say Tachanun (the penitential prayer) or to fast on Rosh Hashanah — despite the day's solemnity, it is treated as a Yom Tov, celebrated with festive meals."
      ],
      customs: [
        "Simanim — a seder of symbolic foods eaten on the first night (apple in honey, pomegranate, the head of a fish or ram, dates, leeks, beets, gourd) — each paired with a wordplay wish for the year ahead. It's a wonderfully tangible way to set intentions.",
        "Round challah, sometimes with raisins, is eaten instead of the usual braided loaf.",
        "It's customary to greet people with 'Shanah Tovah' (a good year) or the fuller 'Ketivah VaChatimah Tovah' (may you be inscribed and sealed for good)."
      ],
      inspiration: "Rosh Hashanah is judgment, yes — but the Chassidic teaching is that we don't come before the King as a defendant fearing a verdict so much as a citizen renewing an oath of loyalty. The blast of the shofar is wordless because some truths — I want to come back, I want to matter, I want this year to count — are too close to the bone for sentences. Let the sound do the talking today."
    }
  },
  {
    id: "tzom-gedaliah",
    icon: "candle-memorial",
    title: "Tzom Gedaliah (Fast of Gedaliah)",
    priority: 55,
    match: (ctx) => ctx.findEvent(e => /Tzom Gedaliah/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is the Fast of Gedaliah, a minor fast (dawn to nightfall) commemorating the assassination of Gedaliah ben Achikam, the Babylonian-appointed governor of Judea after the destruction of the First Temple — an act that extinguished the last flicker of Jewish self-governance in the land and deepened the exile.",
      halacha: [
        "The fast runs from dawn (alot hashachar) to nightfall — eating and drinking are withheld, but it is otherwise a normal day (work, bathing, and leather shoes are all permitted, unlike Yom Kippur or Tisha B'Av).",
        "Selichot are added to the morning prayers, and Avinu Malkeinu is recited.",
        "Pregnant, nursing, or unwell individuals are generally exempt — this, like all fast questions, is worth a quick conversation with a rabbi if you're unsure."
      ],
      customs: [],
      inspiration: "It's a striking teaching that a Jew murdered by another Jew gets his own fast day, layered right into the joy of the New Year season. The lesson tradition draws: baseless hatred between Jews is treated with the same gravity as a national catastrophe, because it is one. Today's a good day to think of one relationship worth mending."
    }
  },
  {
    id: "aseret-yemei-teshuva",
    icon: "heart",
    title: "The Ten Days of Repentance",
    priority: 20,
    match: (ctx) => ctx.daysUntilYomKippur > 0 && ctx.daysUntilYomKippur <= 9 && ctx.daysSinceRoshHashana >= 0,
    content: {
      intro: "We're in the Aseret Yemei Teshuva, the Ten Days of Repentance stretching from Rosh Hashanah to Yom Kippur — the most intensive stretch of the Jewish year for honest self-examination.",
      halacha: [
        "Small changes are made to daily prayers during this period (added lines in the Amidah, 'HaMelech HaKadosh' replacing 'HaKel HaKadosh').",
        "It's customary to be extra careful in mitzvot between now and Yom Kippur — many take on one small extra stringency or good habit for these ten days specifically.",
        "This is the time to seek forgiveness directly from people you may have wronged this year — Yom Kippur atones for sins against God, but not for unresolved wrongs against another person until you've made peace with them."
      ],
      customs: ["The Shabbat during this period is called Shabbat Shuva ('Sabbath of Return'), named for the Haftarah's opening word — many communities have a rabbi deliver a special address."],
      inspiration: "Ten days is a strange unit — long enough that willpower alone won't carry you, short enough that you can't put it off. Tradition doesn't ask for a finished person by Yom Kippur, just an honest one. Progress, not perfection, is the whole game right now."
    }
  },
  {
    id: "erev-yom-kippur",
    icon: "gates",
    title: "Erev Yom Kippur",
    priority: 85,
    match: (ctx) => ctx.findEvent(e => /^Erev Yom Kippur$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Erev Yom Kippur — the final preparations before the holiest day of the Jewish year begins at sundown.",
      halacha: [
        "It is a mitzvah to eat well today — in fact, eating on Erev Yom Kippur is considered by the Sages as praiseworthy as fasting on Yom Kippur itself, since the meal is preparation to serve God through the fast.",
        "The custom of Kapparot (symbolically transferring one's sins, traditionally using a live chicken or, very commonly today, money later given to charity) is done today or in the days prior.",
        "It is customary to ask forgiveness from anyone you may have wronged, and to give extra charity before the fast begins.",
        "Candle lighting and the fast both begin before sunset — check local candle-lighting times, since Yom Kippur, unlike a weekday fast, starts early, before the actual sunset.",
        "Many have the custom of blessing their children before heading to synagogue for Kol Nidrei.",
        "The final pre-fast meal (seudah hamafseket) should end well before candle lighting to leave time to prepare."
      ],
      customs: ["Wearing white and, among some, a kittel (the simple white garment also used for burial) to the Yom Kippur prayers — a reminder of mortality that, far from being morbid, tends to clarify what actually matters."],
      inspiration: "The Sages' insistence on feasting before the fast is itself a teaching: repentance is not self-punishment. You're not being sent to Yom Kippur to suffer — you're being fed and dressed for an audience with a King who has been waiting for you all along."
    }
  },
  {
    id: "yom-kippur",
    icon: "gates",
    title: "Yom Kippur",
    priority: 100,
    match: (ctx) => ctx.findEvent(e => /^Yom Kippur$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Yom Kippur, the Day of Atonement — the holiest day of the Jewish year, on which, tradition teaches, even the angels are jealous of the Jewish people's chance to reach a closeness to God that they cannot.",
      halacha: [
        "Five afflictions are traditionally observed: no eating or drinking, no washing/bathing (for pleasure), no anointing with oils/lotions, no wearing leather shoes, and no marital relations.",
        "The day is spent largely in synagogue, moving through five prayer services: Kol Nidrei (the evening before), Shacharit, Musaf, Mincha, and finally Ne'ilah as the gates are described as closing at dusk.",
        "The Vidui (confession) is recited communally, in the plural ('we have sinned') — even the most private sin is confessed as part of a shared human condition, not a solitary shame.",
        "Fasting exemptions exist for those who are pregnant, nursing, ill, elderly, or otherwise medically at risk — this is a serious halachic question, not a personal call, and should be discussed with both a doctor and a rabbi in advance if there's any doubt.",
        "The fast ends with the blowing of a single, long shofar blast (tekiah gedolah) at the close of Ne'ilah."
      ],
      customs: ["Many spend the entire day in the synagogue if they are able, and it's customary to stand for extended portions of the prayers."],
      inspiration: "Yom Kippur isn't a court date to dread, it's the one day of the year the Torah describes God as being closest — near enough that tradition says teshuva offered today is accepted before it's even fully spoken. Whatever the year held, you are not disqualified from today. Show up as you are."
    }
  },

  // ---------------------------------------------------------------
  // SUKKOT / SIMCHAT TORAH
  // ---------------------------------------------------------------
  {
    id: "erev-sukkot",
    icon: "sukkah",
    title: "Erev Sukkot",
    priority: 80,
    match: (ctx) => ctx.findEvent(e => /^Erev Sukkot$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Erev Sukkot, the final day to build and ready the sukkah before the Festival of Booths begins tonight — just five days after the intensity of Yom Kippur.",
      halacha: [
        "The sukkah (temporary booth) should be completed today if it hasn't been already; it needs at least two-and-a-half walls and a roof (schach) of plant material that provides more shade than sun while still allowing the stars to be seen through it.",
        "The Four Species — lulav (palm), etrog (citron), hadassim (myrtle), and aravot (willow) — should be obtained and checked for kashrut (validity) before the holiday, ideally with guidance from someone experienced in selecting them.",
        "Prepare eruv tavshilin if it's needed this year (check today's card above)."
      ],
      customs: [],
      inspiration: "From the solemnity of Yom Kippur straight into the joy of Sukkot — tradition calls it Zman Simchateinu, 'the time of our joy.' A flimsy hut, open to the weather, becomes the fullest expression of trust: we just spent ten days examining our lives, and the response isn't to build thicker walls, it's to sit under a roof you can see the sky through."
    }
  },
  {
    id: "sukkot",
    icon: "sukkah",
    title: "Sukkot",
    priority: 90,
    match: (ctx) => ctx.findEvent(e => /^Sukkot/.test(e.title) && !/Shmini|Simchat/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Sukkot, the Festival of Booths, commemorating the clouds of glory that sheltered the Israelites in the desert — and, more broadly, the fragility and trust of that journey.",
      halacha: [
        "Meals are eaten in the sukkah for the full seven days (weather-permitting exemptions apply — this is a genuinely case-by-case halacha worth asking a rabbi about if conditions are rough).",
        "The Four Species (lulav, etrog, hadassim, aravot) are taken and waved (na'anuim) each morning of the holiday, except Shabbat, with a blessing.",
        "Hallel (psalms of praise) is recited in full each day.",
        "On the first day(s) — the Yom Tov days — the regular restrictions of a festival apply (similar to Shabbat, with cooking permitted for the day's needs); the intermediate days (Chol HaMoed) have a more relaxed status."
      ],
      customs: ["Ushpizin — a custom of symbolically inviting one of the seven biblical 'guests' (Avraham, Yitzchak, Yaakov, Moshe, Aharon, Yosef, David) into the sukkah each night, and reflecting on the quality each represents."],
      inspiration: "The sukkah's roof has to let the stars in — that's not a design flaw, it's the entire point. Security doesn't come from thicker walls; it comes from knowing Who is actually holding the roof up. Sit in one if you can, even for a few minutes, and notice what it's like to feel sheltered without feeling closed in."
    }
  },
  {
    id: "hoshana-rabbah",
    icon: "sukkah",
    title: "Hoshana Rabbah",
    priority: 92,
    match: (ctx) => ctx.findEvent(e => /Hoshana Raba/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Hoshana Rabbah, the seventh and last day of Sukkot, traditionally understood as the final close of the judgment process that began on Rosh Hashanah.",
      halacha: [
        "A special, extended set of Hoshanot (processions circling with the lulav and etrog) is recited, circling the synagogue seven times rather than the single circuit of the earlier days.",
        "A bundle of five willow branches (hoshanot) is beaten on the ground toward the end of the service, an ancient custom with several layered explanations."
      ],
      customs: [],
      inspiration: "Some call this day the last echo of Yom Kippur — a final chance to tie a bow on the season of return before the calendar turns fully toward joy. Nothing wraps up neatly forever, and that's alright; there's always another Elul."
    }
  },
  {
    id: "shmini-atzeret",
    icon: "torah-dance",
    title: "Shmini Atzeret",
    priority: 90,
    match: (ctx) => ctx.findEvent(e => /^Shmini Atzeret/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Shmini Atzeret, the 'Eighth Day of Assembly' — technically its own holiday tacked onto the end of Sukkot, expressing God's wish, as the Midrash puts it, for one more day alone together after the seven-day festival, 'like a king who asks his children to stay just one day longer.'",
      halacha: [
        "The Four Species are no longer taken and meals are no longer required in the sukkah (though many still eat there without the blessing, reluctant to let go).",
        "The prayer for rain (Tefillat Geshem) is added to the Musaf service, marking the start of the rainy season's mention in prayer.",
        "In Israel, Shmini Atzeret and Simchat Torah are the same day; outside Israel they are two consecutive days, with Simchat Torah on the second."
      ],
      customs: [],
      inspiration: "'Stay one more day' is one of the most tender lines in the whole calendar. After all the mitzvot of Sukkot — the sukkah, the lulav, the structure — today asks for nothing but your presence. Not every act of love needs a task attached to it."
    }
  },
  {
    id: "simchat-torah",
    icon: "torah-dance",
    title: "Simchat Torah",
    priority: 95,
    match: (ctx) => ctx.findEvent(e => /Simchat Torah/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Simchat Torah, 'Rejoicing with the Torah' — the day we finish the annual Torah reading cycle (the last portion of Deuteronomy) and immediately begin again from Bereishit/Genesis 1:1, without a moment's pause.",
      halacha: [
        "Hakafot — joyous dancing circuits around the synagogue holding Torah scrolls — are held, often repeated seven times, both at night and again the next morning.",
        "Every congregant, including children, is traditionally called up for an aliyah to the Torah at some point during the day's readings, reflecting the idea that the Torah belongs to the whole people, not only scholars."
      ],
      customs: ["Children are often given flags, candies, or small treats and included directly in the dancing — this is very much a day built for joy without pretense."],
      inspiration: "Ending the Torah and starting it again in the same breath is the boldest statement the Jewish calendar makes all year: there is no such thing as finishing your relationship with the Torah. Every ending is just the doorway to reading it again — a little differently, because you're a little different than you were last year."
    }
  },

  // ---------------------------------------------------------------
  // CHANUKAH
  // ---------------------------------------------------------------
  {
    id: "chanukah",
    icon: "menorah",
    title: "Chanukah",
    priority: 85,
    match: (ctx) => ctx.findEvent(e => /^Chanukah/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is a day of Chanukah, the eight-day Festival of Lights commemorating the Maccabees' military victory over the Seleucid Greek empire and the rededication of the Temple — and the small jar of oil, enough for one day, that miraculously burned for eight.",
      halacha: [
        "The Chanukah menorah (chanukiah) is lit each night after nightfall (before, on Friday, ahead of Shabbat candles), adding one more flame each night, ideally placed where it can be seen from the street or a window to publicize the miracle.",
        "The blessings are recited before lighting: 'l'hadlik ner shel Chanukah,' 'she'asah nisim,' and, on the first night, Shehecheyanu.",
        "Hallel (full) is recited each morning, and a paragraph (Al HaNissim) is added to the daily prayers and Grace After Meals."
      ],
      customs: ["Fried foods (latkes, sufganiyot/donuts) commemorate the oil; dreidel is played, often for gelt (chocolate coins or real small change)."],
      inspiration: "The military victory made the history books, but the holiday is named for the light, not the war. Judaism, offered a choice of what to memorialize, chose the miracle that was almost too small to notice — one day's oil, stretched to eight. You don't need a dramatic victory to add light to your own life; a small, honest flame, lit consistently, is the whole idea."
    }
  },

  // ---------------------------------------------------------------
  // TU BISHVAT
  // ---------------------------------------------------------------
  {
    id: "tu-bishvat",
    icon: "tree",
    title: "Tu BiShvat — The New Year for Trees",
    priority: 60,
    match: (ctx) => ctx.findEvent(e => /Tu BiShvat/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Tu BiShvat, the 15th of Shevat, the 'New Year for Trees' — a date used halachically to mark the age of fruit trees for tithing purposes, and celebrated today as a kind of Jewish Earth Day with deep spiritual layers.",
      halacha: [
        "Historically significant for calculating orlah (the prohibition on fruit from a tree's first three years) and tithes — mostly relevant in the Land of Israel with produce grown there.",
        "It is customary to eat fruits, especially from the Seven Species associated with the Land of Israel (wheat, barley, grapes, figs, pomegranates, olives, dates), and particularly fruit not yet tasted that season, to say Shehecheyanu."
      ],
      customs: ["A Tu BiShvat seder, modeled loosely on the Passover seder, developed among 16th-century Kabbalists in Tzfat, moving through four 'worlds' represented by different categories of fruit and increasingly diluted wine (white to red)."],
      inspiration: "A tree's roots are doing all the real work while nothing visible seems to be happening above ground. Tu BiShvat, tucked into the dead of winter, is a vote of confidence: growth you can't yet see is still growth. Plant something today — literally or otherwise — that you won't get to enjoy for a while."
    }
  },

  // ---------------------------------------------------------------
  // PURIM
  // ---------------------------------------------------------------
  {
    id: "taanit-esther",
    icon: "mask",
    title: "Ta'anit Esther (Fast of Esther)",
    priority: 55,
    match: (ctx) => ctx.findEvent(e => /Ta.?anit Esther/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Ta'anit Esther, a minor dawn-to-nightfall fast on the day before Purim, recalling the three days Esther and the Jews of Shushan fasted before she approached the king to plead for her people.",
      halacha: ["A standard minor fast — no eating or drinking from dawn to nightfall, but otherwise a regular day; the usual exemptions for health, pregnancy, and nursing apply."],
      customs: ["The Half-Shekel (Machatzit HaShekel) is customarily given to charity before Purim, recalling the ancient Temple donation and used today to fund Purim needs for those less fortunate."],
      inspiration: "Esther didn't fast because she was certain it would work — she fasted because she'd decided to act regardless of the odds ('and if I perish, I perish'). Courage in Judaism isn't the absence of fear; it's showing up anyway."
    }
  },
  {
    id: "purim",
    icon: "mask",
    title: "Purim",
    priority: 95,
    match: (ctx) => ctx.findEvent(e => /^Purim$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Purim, celebrating the salvation of the Jews of the Persian Empire from Haman's plot to destroy them, as told in the Scroll (Megillat) of Esther — the only biblical book where God's name never appears, and a whole holiday built to notice Him anyway.",
      halacha: [
        "The Megillah (Book of Esther) is read publicly, once at night and again the next morning, and it's a mitzvah to hear every word.",
        "Matanot La'evyonim — giving gifts (traditionally money) to at least two poor people, is a mitzvah of the day, as is Mishloach Manot — sending at least two ready-to-eat food items to at least one friend.",
        "A festive Purim meal (Seudah) is eaten during the day.",
        "There is a well-known custom, sourced in the Talmud, of drinking on Purim — though many later authorities significantly limit this to a token amount, and it should never come at the cost of safety, health, or genuinely losing control; ask a rabbi about what's appropriate for you."
      ],
      customs: ["Costumes and dressing up — the hiddenness of the disguise mirrors the hiddenness of God's hand throughout the Purim story."],
      inspiration: "Purim's whole message is that coincidence, examined closely enough, turns out to be providence wearing a costume. Nothing in the Purim story looks miraculous while it's happening — a beauty pageant, a sleepless king, a forgotten favor. Look for the hidden hand in your own ordinary week; it's there more often than it looks."
    }
  },

  // ---------------------------------------------------------------
  // PESACH
  // ---------------------------------------------------------------
  {
    id: "erev-pesach",
    icon: "matzah",
    title: "Erev Pesach",
    priority: 80,
    match: (ctx) => ctx.findEvent(e => /^Erev Pesach$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Erev Pesach — the final day of chametz (leavened grain products), and the last stretch of preparation before the Seder tonight.",
      halacha: [
        "All chametz should be removed, sold, or sealed away by the halachic deadline this morning (times are location-specific — check a local Jewish calendar), and the formal search for chametz (Bedikat Chametz) is performed the night before, with the leftover chametz burned this morning (Biur Chametz).",
        "A firstborn son (or his father, on his behalf, or by proxy through a siyum) traditionally fasts today, or more commonly attends a siyum (completion of a Torah tractate) to be exempted through the celebratory meal that follows.",
        "Prepare the Seder plate items — matzah, maror, charoset, karpas, a roasted bone and egg — and set the table for tonight.",
        "Prepare eruv tavshilin if needed this year (check today's card above)."
      ],
      customs: [],
      inspiration: "Cleaning out chametz is famously exhausting — and famously more than a chore. Chametz, puffed up with air, is the classic symbol of ego. The search through every drawer and coat pocket is also, if you let it be, a search through the corners of the year for the small puffed-up moments worth letting go of before you sit down as a free person tonight."
    }
  },
  {
    id: "pesach-seder-nights",
    icon: "matzah",
    title: "Pesach — Seder Night",
    priority: 100,
    match: (ctx) => ctx.findEvent(e => /^Pesach I$/.test(e.title) && ctx.isToday(e.date)) || ctx.findEvent(e => /^Pesach II$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Tonight is a Seder night of Pesach (Passover), commemorating the Exodus from Egyptian slavery — arguably the founding story of the Jewish people, and the event the Torah invokes more than any other as the reason for its commandments.",
      halacha: [
        "The Seder follows the fifteen-step order in the Haggadah: from Kadesh (the first cup of wine) through Nirtzah (the Seder's conclusion), including four cups of wine, matzah, maror (bitter herbs), and the retelling of the Exodus story.",
        "Telling the story to others — especially children — is the central mitzvah of the night; the Haggadah is built around questions (the Mah Nishtanah) specifically to prompt it.",
        "Chametz is fully avoided for all eight days (seven in Israel); only kosher-for-Pesach food and matzah are eaten."
      ],
      customs: ["Leaning to the left while drinking the four cups and eating matzah, as free people once reclined at meals; a cup for Elijah the Prophet, and in many homes today, a cup for Miriam as well."],
      inspiration: "The Haggadah insists that in every generation, a person is obligated to see themselves as if they personally left Egypt — not to have merely heard about it. Whatever your personal 'Egypt' is — a narrow place, a habit, a fear, an old story about who you are — tonight's not just history. It's an invitation to leave it."
    }
  },
  {
    id: "pesach-chol-hamoed",
    icon: "matzah",
    title: "Pesach — Chol HaMoed",
    priority: 60,
    match: (ctx) => ctx.findEvent(e => /^Pesach (III|IV|V|VI)(\s|$)/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is one of the intermediate days (Chol HaMoed) of Pesach — a middle status between the fuller restrictions of the first days and an ordinary weekday.",
      halacha: [
        "Chametz remains forbidden for the full holiday.",
        "Work restrictions are more relaxed than the first and last days, though many still avoid unnecessary labor and treat the days with festive character — customs on exactly what's permitted vary by community, worth checking locally.",
        "A partial Hallel is recited in the morning prayers on these days."
      ],
      customs: [],
      inspiration: "Chol HaMoed — 'the ordinary of the appointed time' — is a beautiful contradiction: a stretch of days that are both regular life and sacred time at once. Most of life happens in that in-between zone, not on the mountaintop days. Pesach makes room for it deliberately."
    }
  },
  {
    id: "pesach-last-days",
    icon: "matzah",
    title: "Pesach — Final Days",
    priority: 90,
    match: (ctx) => ctx.findEvent(e => /^Pesach (VII|VIII)/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is one of the final days of Pesach, commemorating the splitting of the Sea of Reeds (Yam Suf) — the moment the Exodus was sealed and Pharaoh's army could no longer follow.",
      halacha: ["Full Yom Tov restrictions apply, similar to Shabbat, with cooking permitted for the day's needs; in the diaspora, the eighth day includes a Yizkor memorial service."],
      customs: ["Many Chassidic communities hold a 'Moshiach's Seudah' (Messiah's Meal) on the afternoon of the last day, a custom instituted by the Baal Shem Tov, focused on themes of ultimate redemption."],
      inspiration: "Leaving Egypt was step one; the sea splitting was the moment there was no going back. Redemption in Jewish thought is rarely a single instant — it's a process with thresholds. Ask yourself what your own 'sea' might be: the point past which you stop being tempted to return to what was familiar but small."
    }
  },

  // ---------------------------------------------------------------
  // OMER / LAG BAOMER / SHAVUOT
  // ---------------------------------------------------------------
  {
    id: "sefirat-haomer",
    icon: "wheat",
    title: "Counting the Omer",
    priority: 15,
    match: (ctx) => ctx.omerDay > 0 && ctx.omerDay < 49 && ctx.omerDay !== 33,
    content: {
      intro: `Today is day ${'{{OMER_DAY}}'} of the Omer — the 49-day count linking Pesach (freedom from slavery) to Shavuot (receiving the Torah), a nightly count that turns the calendar itself into a countdown of anticipation.`,
      halacha: [
        "The Omer is counted each night after nightfall, with a blessing, stating both the day number and the number of complete weeks (e.g., 'today is twelve days, which is one week and five days, of the Omer').",
        "If a night's count is missed entirely (not remembered until the next night or later), the count continues without the blessing for the rest of the 49 days, per most opinions — this is worth double-checking with a rabbi the first time it happens.",
        "Many communities observe partial mourning customs during much of this period (commemorating the plague that struck Rabbi Akiva's students) — no weddings, haircuts, or live music for much of the count, with the exact windows varying by community tradition."
      ],
      customs: ["Kabbalistic tradition maps each of the seven weeks to one of the seven sefirot (divine attributes — kindness, discipline, harmony, endurance, humility, bonding, sovereignty), and each day within the week to a sub-quality, offering 49 days of structured character reflection."],
      inspiration: "Freedom on its own isn't the destination — Pesach without Shavuot is just an escape. The 49-day count insists that liberation only becomes meaningful once it's aimed at something: in this case, standing at Sinai and receiving purpose. What are you counting toward right now?"
    }
  },
  {
    id: "lag-baomer",
    icon: "wheat",
    title: "Lag BaOmer",
    priority: 65,
    match: (ctx) => ctx.omerDay === 33,
    content: {
      intro: "Today is Lag BaOmer, the 33rd day of the Omer — a joyous break in the semi-mourning period, traditionally marked as the day the plague among Rabbi Akiva's students ceased, and the yahrzeit of Rabbi Shimon Bar Yochai, author of the Zohar, foundational text of Jewish mysticism.",
      halacha: ["Weddings, haircuts, and live music — restricted during much of the Omer — are permitted today; many take the opportunity to schedule celebrations."],
      customs: ["Bonfires are lit, especially in Israel (most famously at Rabbi Shimon Bar Yochai's tomb in Meron); children often have their first haircut (upsherin) at age three on this day; outdoor archery and picnics are common."],
      inspiration: "Rabbi Shimon Bar Yochai taught in hiding, in a cave, for years — and produced from that constriction the Zohar, a text about how infinite light fills even the smallest vessel. The bonfires tonight aren't just fun: they're a reminder that the brightest light often comes from the tightest, most difficult places."
    }
  },
  {
    id: "erev-shavuot",
    icon: "tablets",
    title: "Erev Shavuot",
    priority: 75,
    match: (ctx) => ctx.findEvent(e => /^Erev Shavuot$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Erev Shavuot — the eve of the holiday commemorating the giving of the Torah at Mount Sinai, arriving exactly 49 days (7 complete weeks) after Pesach.",
      halacha: ["Prepare eruv tavshilin if this year requires it (check today's card above)."],
      customs: ["Many stay up all night learning Torah (Tikkun Leil Shavuot), a custom traced to the idea that the Israelites overslept on the original morning of the giving of the Torah, and we correct for it by staying awake in anticipation instead."],
      inspiration: "There's something moving about an entire people choosing to lose sleep out of eagerness rather than obligation. Whatever you're eager to learn more about in Judaism — tonight is historically the night for exactly that impulse."
    }
  },
  {
    id: "shavuot",
    icon: "tablets",
    title: "Shavuot",
    priority: 95,
    match: (ctx) => ctx.findEvent(e => /^Shavuot/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Shavuot, the Festival of Weeks, commemorating the moment the entire Jewish people stood together at Mount Sinai and received the Torah — described by the Sages as a moment when 'all of Israel stood as one person, with one heart.'",
      halacha: [
        "The Ten Commandments are read publicly from the Torah, and it is customary to stand for this reading.",
        "The Book of Ruth is read, telling the story of a Moabite woman who chose to join the Jewish people out of loyalty and conviction rather than birth — read on Shavuot in part because her acceptance of the Torah, as a choice, echoes the day itself.",
        "Full Yom Tov restrictions apply, similar to Shabbat."
      ],
      customs: ["Dairy foods are widely eaten on Shavuot (cheesecake is the famous example) — among the reasons offered: before receiving the Torah's laws of kosher slaughter, the Israelites had only dairy available to eat that first day."],
      inspiration: "The Torah wasn't given to Moses alone, or to the scholars alone — the Midrash insists every soul that would ever be Jewish, including converts yet to come, stood at that mountain. If you are exploring Judaism now, in whatever way, tradition holds that Sinai was, in some sense, already for you too. Ruth's story exists in the Torah specifically to say so."
    }
  },

  // ---------------------------------------------------------------
  // THE THREE WEEKS / TISHA B'AV
  // ---------------------------------------------------------------
  {
    id: "shiva-asar-btammuz",
    icon: "broken-tablets",
    title: "Shivah Asar B'Tammuz (17th of Tammuz)",
    priority: 55,
    match: (ctx) => ctx.findEvent(e => /^Tzom Tammuz$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is the 17th of Tammuz, a minor fast day marking the breach of Jerusalem's walls by the Romans before the destruction of the Second Temple (and, by tradition, several other calamities on this date, including the shattering of the first set of tablets by Moses). It opens the Three Weeks leading to Tisha B'Av.",
      halacha: ["A standard dawn-to-nightfall fast; the usual health, pregnancy, and nursing exemptions apply."],
      customs: [],
      inspiration: "Moses broke the tablets on this date out of anger at the Golden Calf — and the Sages count that, too, among the tragedies mourned today, alongside the walls of Jerusalem. It's a striking idea: even a broken relationship with God is treated as a loss worth grieving, not a door slammed shut. What feels broken doesn't have to be seen as beyond repair."
    }
  },
  {
    id: "three-weeks",
    icon: "broken-tablets",
    title: "The Three Weeks",
    priority: 15,
    match: (ctx) => ctx.daysUntilTishaBav > 0 && ctx.daysUntilTishaBav <= 21 && ctx.daysSince17Tammuz >= 0,
    content: {
      intro: "We're within the Three Weeks (Bein HaMetzarim, 'between the straits'), a national mourning period between the 17th of Tammuz and Tisha B'Av, recalling the siege and eventual destruction of both Temples in Jerusalem.",
      halacha: ["Customs of restraint intensify as the period goes on (many avoid weddings and live music throughout; haircuts, and for many, meat and wine, are set aside during the more intense final 'Nine Days' immediately before Tisha B'Av) — practice varies meaningfully by community, so it's worth checking local custom."],
      customs: [],
      inspiration: "Judaism doesn't rush past grief, even grief over something that happened two thousand years ago. There's a teaching that comfort can only be authentic once loss has been fully felt — that's why the calendar builds in these weeks before the joy of the fall holidays can mean anything. Feeling something fully is often the fastest way through it, not around it."
    }
  },
  {
    id: "tisha-bav",
    icon: "broken-tablets",
    title: "Tisha B'Av",
    priority: 90,
    match: (ctx) => ctx.findEvent(e => /^Tish.a B.Av/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Tisha B'Av, the Ninth of Av, the saddest day on the Jewish calendar — marking the destruction of both the First and Second Temples in Jerusalem (astonishingly, on the same date, centuries apart), along with a long list of other tragedies tradition associates with this day.",
      halacha: [
        "A full 25-hour fast from sunset to nightfall the next day, with the same five afflictions as Yom Kippur (no eating/drinking, washing for pleasure, anointing, leather shoes, marital relations) — though the tone is mourning, not atonement.",
        "The Book of Eichah (Lamentations) is read at night, often by dim light, sitting on low stools or the floor as mourners do.",
        "Torah study is restricted to sadder texts for most of the day, since Torah study is normally considered joyful.",
        "Restrictions ease somewhat after midday, and the fast itself ends at nightfall."
      ],
      customs: [],
      inspiration: "There's a well-known teaching that Mashiach (the Messiah) will be born on Tisha B'Av — that the deepest point of exile carries within it the seed of the deepest redemption. Jewish mourning is never mourning without hope sitting quietly right beside it. Sit with whatever this day brings up, and know the sitting itself is understood as part of the healing."
    }
  },

  // ---------------------------------------------------------------
  // OTHER FASTS & MODERN / MINOR OBSERVANCES
  // ---------------------------------------------------------------
  {
    id: "asara-btevet",
    icon: "candle-memorial",
    title: "Asara B'Tevet (Fast of the 10th of Tevet)",
    priority: 55,
    match: (ctx) => ctx.findEvent(e => /^Asara B.Tevet$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Asara B'Tevet, a minor fast marking the start of the Babylonian siege of Jerusalem that would, two and a half years later, end in the destruction of the First Temple.",
      halacha: ["A standard dawn-to-nightfall fast; usual exemptions for health, pregnancy, and nursing apply."],
      customs: [],
      inspiration: "This fast marks a beginning, not an end — the first crack, not the final collapse. Tradition asks us to take early warning signs seriously, in the Jewish story and in our own lives, rather than waiting for a crisis that's already unfolding to notice."
    }
  },
  {
    id: "pesach-sheni",
    icon: "matzah",
    title: "Pesach Sheni — The Second Chance",
    priority: 60,
    match: (ctx) => ctx.findEvent(e => /^Pesach Sheni$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Pesach Sheni, the 'Second Passover' — a one-time make-up date the Torah itself provides for anyone who was ritually impure or too far away to bring the Passover offering at its proper time a month earlier.",
      halacha: ["No longer practically observed with an offering since the Temple's destruction; today it's marked mainly by eating a piece of matzah and noting the day's significance."],
      customs: [],
      inspiration: "Of everything the Torah could have legislated a do-over for, it chose this: missing the chance to be close to God. The Chassidic teaching drawn from Pesach Sheni is bold — it's never too late for a second chance. No door, spiritually, is ever fully and finally closed."
    }
  },
  {
    id: "yom-hashoah",
    icon: "candle-memorial",
    title: "Yom HaShoah — Holocaust Remembrance Day",
    priority: 75,
    match: (ctx) => ctx.findEvent(e => /^Yom HaShoah/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Yom HaShoah, Israel's and the Jewish world's day of remembrance for the six million Jews murdered in the Holocaust.",
      halacha: ["Not a traditional halachic fast day, but widely marked with memorial ceremonies, the lighting of memorial candles, and reciting Kaddish or El Malei Rachamim for the victims; in Israel, a siren is sounded and public life pauses."],
      customs: [],
      inspiration: "Remembering isn't only an act of mourning — it's an act of refusing to let a life, or six million lives, be erased twice. If you have a story to learn today — a survivor's testimony, a family history — that act of listening is itself a form of Kaddish."
    }
  },
  {
    id: "yom-hazikaron",
    icon: "candle-memorial",
    title: "Yom HaZikaron — Israel's Memorial Day",
    priority: 75,
    match: (ctx) => ctx.findEvent(e => /^Yom HaZikaron/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Yom HaZikaron, Israel's memorial day for fallen soldiers and victims of terror — observed the day immediately before Yom HaAtzma'ut, Israel's Independence Day, by deliberate design.",
      halacha: ["Not a traditional halachic observance, but marked nationally with sirens, ceremonies, and a somber public tone."],
      customs: [],
      inspiration: "Placing the saddest day directly before the most celebratory one isn't an accident of scheduling — it's a statement that the joy of the next day is understood, consciously, to have been paid for. Gratitude and grief are allowed to sit right next to each other."
    }
  },
  {
    id: "yom-haatzmaut",
    icon: "flag-star",
    title: "Yom HaAtzma'ut — Israel's Independence Day",
    priority: 80,
    match: (ctx) => ctx.findEvent(e => /^Yom HaAtzma.ut/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Yom HaAtzma'ut, marking the 1948 establishment of the modern State of Israel and the return of Jewish sovereignty in the Land of Israel after nearly two thousand years.",
      halacha: ["Many communities recite Hallel (with varying customs on the blessing) and add special prayers; treated by many as a day of religious as well as national significance, though practice varies across Jewish communities."],
      customs: ["Celebrated in Israel with fireworks, barbecues, and public gatherings; many diaspora communities hold parades and celebrations as well."],
      inspiration: "For a people that spent two millennia praying toward Jerusalem without a state to call their own, sovereignty is never just politics — it's a theological event. Whatever one's views on the state's policies, the underlying fact — a Jewish home in the Jewish homeland, after that long — is worth pausing on today."
    }
  },
  {
    id: "yom-yerushalayim",
    icon: "flag-star",
    title: "Yom Yerushalayim — Jerusalem Day",
    priority: 70,
    match: (ctx) => ctx.findEvent(e => /^Yom Yerushalayim$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Yom Yerushalayim, marking the reunification of Jerusalem in June 1967 and the return of Jewish access to the Old City and the Western Wall for the first time since 1948.",
      halacha: ["Many recite Hallel; a day of thanksgiving in much of the religious Zionist world in particular."],
      customs: [],
      inspiration: "'Next year in Jerusalem' closes the Passover Seder and Yom Kippur every single year, for a city most Jews, for most of history, would never actually see. Today marks the point that line stopped being only a hope. Whatever your own 'Jerusalem' is — the thing you keep saying 'next year' about — today's a fair day to ask what one small step toward it might look like."
    }
  },
  {
    id: "tu-bav",
    icon: "heart",
    title: "Tu B'Av — The Day of Love",
    priority: 60,
    match: (ctx) => ctx.findEvent(e => /^Tu B.Av$/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Tu B'Av, the 15th of Av, described by the Mishnah as one of the two happiest days of the Jewish year (alongside Yom Kippur) — historically a day when unmarried women would dance in the vineyards, and today sometimes called the Jewish 'day of love.'",
      halacha: ["Tachanun (the penitential prayer) is omitted; otherwise not marked by specific mitzvot."],
      customs: ["In modern Israel, often treated similarly to Valentine's Day, with an emphasis on romance and relationships."],
      inspiration: "That Yom Kippur and Tu B'Av are named as the two joy-filled peaks of the year is a striking pair — one about standing utterly exposed before God, the other about human love and connection. Tradition seems to be saying they're not as different as they look: both are about closing the distance between two who care about each other."
    }
  },

  // ---------------------------------------------------------------
  // WEEKLY / GENERIC FALLBACKS
  // ---------------------------------------------------------------
  {
    id: "erev-shabbat",
    icon: "candles-shabbat",
    title: "Erev Shabbat",
    priority: 40,
    match: (ctx) => ctx.dow === 5,
    content: {
      intro: "Today is Erev Shabbat — the sixth day, and the run-up to Shabbat, the weekly Day of Rest that Judaism treats as the single most distinctive practice of the entire tradition.",
      halacha: [
        "Candle lighting marks the start of Shabbat before sunset — check local candle-lighting times, since Shabbat begins earlier than sunset itself, not at it.",
        "The 39 categories of creative work (melacha) — things like cooking, writing, carrying in a public domain, and using electricity in the traditional understanding — are set aside from before candle lighting until Shabbat ends Saturday night.",
        "It's customary to prepare festive meals in advance, since new cooking isn't done once Shabbat begins."
      ],
      customs: ["Many have a custom of giving extra charity before lighting candles, and of blessing children on Friday night."],
      inspiration: "The Sages call Shabbat a foretaste of the World to Come — a weekly rehearsal for a world where you are not defined by what you produce. Whatever your relationship to full observance right now, even one small act — lighting a candle, having a meal without a screen nearby — is a genuine taste of it."
    }
  },
  {
    id: "shabbat",
    icon: "candles-shabbat",
    title: "Shabbat",
    priority: 45,
    match: (ctx) => ctx.dow === 6,
    content: {
      intro: "Today is Shabbat, the seventh day — set apart, tradition teaches, from the very moment of creation itself, when God rested not because He was tired, but to build rest into the fabric of time.",
      halacha: [
        "The 39 categories of melacha (creative work) are refrained from for the full day, from Friday's candle lighting until Shabbat ends Saturday night (identifiable by nightfall/three stars, or a fixed time from a local calendar).",
        "Three festive meals are customary: Friday night, Shabbat day, and a third meal (Seudah Shlishit) in the late afternoon.",
        "Kiddush (sanctifying the day over wine) is recited before the Friday night and Shabbat day meals; Havdalah marks the close of Shabbat Saturday night."
      ],
      customs: ["Many spend extra time in synagogue, in study, in unhurried meals with family and guests, or simply resting — the details vary widely, but the throughline is presence without production."],
      inspiration: "For one day a week, you're not asked to build, fix, produce, or optimize anything — including yourself. That's not a loophole in a demanding religion, it's the point of the whole thing. Whatever this week held, Shabbat says it's enough, right now, simply to be."
    }
  },
  {
    id: "rosh-chodesh",
    icon: "moon",
    title: "Rosh Chodesh — New Month",
    priority: 50,
    match: (ctx) => ctx.findEvent(e => /^Rosh Chodesh/.test(e.title) && ctx.isToday(e.date)),
    content: {
      intro: "Today is Rosh Chodesh, marking the start of a new Hebrew month, tied historically to the first sighting of the new moon.",
      halacha: ["A partial Hallel is recited, an additional Musaf service is added, and a Torah reading specific to Rosh Chodesh is read; Tachanun (the penitential prayer) is omitted."],
      customs: ["Traditionally treated as a slightly festive day, historically observed with special significance for Jewish women, who were rewarded with this day as a mini-holiday for not participating in the sin of the Golden Calf."],
      inspiration: "Unlike the sun, the moon disappears completely and returns, sliver by sliver, every month — a built-in monthly metaphor for renewal after eclipse. Whatever felt like it 'went dark' this past month, the calendar itself insists that return is not just possible, it's the normal rhythm of things."
    }
  },
  {
    id: "generic-weekday",
    icon: "book-star",
    title: "Today in the Jewish Calendar",
    priority: 1,
    match: () => true,
    content: {
      intro: "There's no major date-specific observance today — which is exactly where most of Jewish life actually happens: in the ordinary weekdays between the holidays.",
      halacha: [
        "The classic daily structure includes the three prayer services (Shacharit, Mincha, Ma'ariv), and blessings woven through the day — before and after eating, upon waking, and at many other small moments.",
        "A traditional day includes set times for Torah study, however brief — even a few minutes counts."
      ],
      customs: [],
      inspiration: "Judaism isn't only built for its dramatic days — Sinai, the Exodus, Yom Kippur. It's built, day to day, on small, repeated, unglamorous acts: a blessing before eating, a few honest minutes of study, a kindness that costs you nothing to give. Today's a perfectly good day for one of those."
    }
  }
];
