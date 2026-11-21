/**
 * mitzvot.js — a reference library of everyday mitzvot and practices that
 * aren't tied to any date on the calendar: the things that come up daily
 * (or every meal, or every time you get dressed) rather than once a year.
 * Rendered as a grid of compact, collapsible cards.
 */

const MITZVOT = [
  {
    id: "modeh-ani",
    icon: "sunrise",
    timeGate: "morning",
    title: "Modeh Ani",
    subtitle: "The first words of the day, said the moment you open your eyes",
    intro: "Before your feet hit the floor, before you've washed up or even fully woken — Modeh Ani is meant to be the very first thing out of your mouth. It doesn't contain God's name, which is exactly why it can be said immediately, even with unwashed hands, before anything else.",
    steps: [
      "Traditional text: \"Modeh ani lefanecha, melech chai v'kayam, shehechezarta bi nishmati b'chemla, rabah emunatecha\" — \"I gratefully thank You, living and eternal King, for You have returned my soul within me with compassion; great is Your faithfulness.\"",
      "Said lying in bed, right upon waking, before getting up.",
      "No specific posture or preparation needed — it's meant to be immediate and unguarded."
    ],
    inspiration: "Notice what it doesn't say: nothing about the day ahead, nothing about plans or worries. Just gratitude that you woke up at all. Whatever today holds, it starts from a baseline of thank-you — try it tomorrow morning before you reach for your phone."
  },
  {
    id: "netilat-yadayim",
    icon: "wash-cup",
    timeGate: "morning",
    title: "Netilat Yadayim (Morning Hand-Washing)",
    subtitle: "Washing away sleep before touching the day",
    intro: "Shortly after waking, hands are ritually washed with a cup — not for hygiene (though it doesn't hurt), but as a formal transition: leaving the unconscious, undefined state of sleep and stepping into a day of intention.",
    steps: [
      "Using a cup, pour water over the right hand, then the left, alternating — most common custom is three times per hand, though some communities use two.",
      "The blessing 'al netilat yadayim' is said after drying the hands (some say it right after washing, before drying — customs vary).",
      "This same hand-washing (without the blessing, if it's not the specific morning context) is also done before eating bread, for the same reason: a small, deliberate pause before something meaningful."
    ],
    inspiration: "Sleep is described in Jewish thought as a minor form of the soul stepping back — you wake up, in a sense, freshly made. Washing hands first thing is a small physical ritual for a real inner event: today's version of you hasn't done anything yet. It's a clean start, literally in your hands."
  },
  {
    id: "shoes",
    icon: "shoe",
    timeGate: "morning",
    title: "Getting Dressed: Right Shoe First, Left Tied First",
    subtitle: "A small, specific order most people never think to ask about",
    intro: "Jewish law actually specifies an order for putting on shoes — a small, easy-to-learn custom that surprises a lot of people the first time they hear it.",
    steps: [
      "Put on the right shoe first, but don't tie it yet.",
      "Put on the left shoe, and tie it.",
      "Then go back and tie the right shoe.",
      "(For clothing in general, the custom is to dress the right side of the body first — a right shoe going on before the left follows that same pattern.)"
    ],
    inspiration: "The reasoning traditionally given: the right side represents chesed (kindness) and is given a kind of precedence throughout Jewish practice, but the left shoe gets tied first so as not to leave the right foot's lace undone and vulnerable — a small built-in lesson that 'goes first' and 'gets finished first' aren't always the same thing."
  },
  {
    id: "food-blessings",
    icon: "bread",
    title: "Blessings Before Eating",
    subtitle: "A different short blessing depending on what's actually on your plate",
    intro: "Before eating almost anything, a short blessing is said first — not a generic one, but one specific to the category of food, which means learning to recognize which bucket something falls into.",
    steps: [
      "HaMotzi — bread (the main blessing; it also covers the rest of a bread-based meal).",
      "Mezonot — grain products that aren't bread in the halachic sense (pasta, cake, cereal, most crackers).",
      "HaGafen — wine or grape juice.",
      "HaEtz — fruit that grows on a tree (apples, dates, olives, etc.).",
      "HaAdama — produce that grows from the ground (vegetables, legumes, peanuts, bananas).",
      "Shehakol — the catch-all for everything else: meat, fish, eggs, most drinks, candy, mushrooms.",
      "After eating, a closing blessing is said too — Birkat Hamazon after bread (see below), or one of two shorter after-blessings for everything else."
    ],
    inspiration: "Sorting your food into the right category before every meal sounds fussy at first, but it does something subtle: it makes you actually look at what you're about to eat instead of eating on autopilot. A moment of attention before consumption is most of what a blessing is trying to build into you."
  },
  {
    id: "asher-yatzar",
    icon: "droplet",
    title: "Asher Yatzar",
    subtitle: "A blessing said after using the bathroom, thanking God for a body that works",
    intro: "It might be the least glamorous mitzvah on this list, and also one of the most quietly profound: a formal thank-you, every single time, for the mundane miracle of a body with plumbing that functions correctly.",
    steps: [
      "Said after using the bathroom, hands washed, typically before other blessings if it happens to be first thing in the morning.",
      "The blessing describes the body as formed with wisdom, full of channels and openings, and notes that if even one of them were blocked or ruptured that shouldn't be, a person couldn't survive.",
      "It closes by blessing God as the healer of all flesh who does wondrously."
    ],
    inspiration: "Nobody thinks to be grateful for their digestive system until something goes wrong with it. This blessing insists on gratitude before that point — for ordinary, unglamorous, unnoticed things working correctly. It's a good model for noticing the rest of what's quietly going right in your life, too."
  },
  {
    id: "birkat-hamazon",
    icon: "goblet",
    title: "Birkat Hamazon (Grace After Meals)",
    subtitle: "A fuller thank-you after any meal that included bread",
    intro: "Where the blessing before eating is one short line, the blessing after a bread meal is a whole structured piece — four blessings covering food, the Land of Israel, Jerusalem, and God's goodness in general.",
    steps: [
      "Obligatory (by most opinions, at a Torah level) after eating bread in an amount roughly the size of an olive or more.",
      "Can be said individually or, with three or more people who ate together, introduced with a short communal call-and-response (zimun).",
      "Many have the custom of saying it from a printed text (a bencher) rather than by heart, at least at first — completely normal, no shame in reading it."
    ],
    inspiration: "Most cultures say thank you before a meal and consider the job done. Judaism insists on a second, longer thank-you after — precisely because gratitude is easiest to feel when you're hungry and staring at food, and easiest to forget once you're full and already thinking about what's next. The harder gratitude is the one that counts."
  },
  {
    id: "mezuzah",
    icon: "mezuzah",
    title: "The Mezuzah",
    subtitle: "A small scroll on the doorpost, carrying a big idea about the home",
    intro: "A mezuzah is a small case containing a handwritten parchment scroll with the Shema and the paragraph following it, affixed to the doorposts of a Jewish home — on nearly every doorway except bathrooms.",
    steps: [
      "The scroll inside must be written by a qualified scribe (sofer) on parchment — the case itself can be simple or decorative, that part isn't what matters halachically.",
      "Affixed on the right side of the doorway (as you enter) in the upper third, tilted with the top leaning inward.",
      "Many have the custom of touching the mezuzah and then kissing their fingers when passing through the doorway, as a small, physical moment of acknowledgment."
    ],
    inspiration: "A mezuzah sits exactly at the threshold — not inside the home, not outside it, but at the boundary between the two. It's a small, literal reminder that walking through your own front door is itself a kind of transition worth noticing, every single time, not just the first time you move in."
  },
  {
    id: "tzitzit",
    icon: "tzitzit",
    title: "Tzitzit",
    subtitle: "Fringes tied with intention, worn to remember",
    intro: "Tzitzit are the knotted fringes attached to the four corners of a specific garment (a tallit katan, worn under clothing, or a tallit, worn during prayer) — traditionally worn by men, with practices around women wearing them varying by community and movement.",
    steps: [
      "The commandment traces to Numbers 15:37-41, which explicitly states the purpose: looking at the fringes is meant to remind the wearer of all of God's commandments.",
      "Each corner's fringe involves a specific pattern of winding and knotting, rich with numerical and symbolic meaning that different commentators explain differently.",
      "A tallit katan is often worn under a shirt all day; a full tallit is typically worn only during morning prayers."
    ],
    inspiration: "The Torah's own reasoning for tzitzit is almost startlingly practical: you will forget, so wear something that catches your eye. It's not a mystical claim, it's a design insight — good intentions fade fast without a physical trigger. What's your version of tzitzit, the small object that pulls your mind back to what actually matters to you?"
  },
  {
    id: "tzedakah-daily",
    icon: "coin",
    title: "Tzedakah — Giving a Little, Often",
    subtitle: "A coin in the box, a habit built one small act at a time",
    intro: "Tzedakah is often translated 'charity,' but the root word means 'justice' — giving isn't framed as generosity so much as simply doing right by the world. Many have the custom of giving something small every single day, not just in a crisis or on a holiday.",
    steps: [
      "A tzedakah box (pushke) at home is a common, simple way to build the daily habit — even loose change adds up, and the point is the repetition as much as the amount.",
      "Maimonides famously ranked forms of giving, with anonymous giving that lets the recipient become self-sufficient near the top — worth reading about if you want to think more deeply on how you give, not just how much.",
      "Giving before praying is a widespread custom, on the theory that an act of kindness is a fitting way to walk into a conversation with God."
    ],
    inspiration: "A little, often, beats a lot, rarely — not just financially, but as a way of shaping who you are. Tzedakah given as a daily habit isn't really about the dollar amount; it's about not letting a single day go by where you didn't do something for someone else."
  },
  {
    id: "sacred-texts",
    icon: "book-star",
    title: "Handling Sacred Texts",
    subtitle: "A little physical reverence for something you believe matters",
    intro: "Jewish practice includes a set of customs around how sacred books and objects are physically treated — small habits that keep respect for holy things from staying purely abstract.",
    steps: [
      "Sacred texts (a Chumash, siddur, Tanach) generally shouldn't have other objects placed directly on top of them, and shouldn't be left open-and-unattended or face-down.",
      "If a sacred text is accidentally dropped, many have the custom of kissing it upon picking it up.",
      "Worn-out sacred texts that can no longer be used aren't simply thrown away — they're buried or placed in a genizah (a repository for damaged sacred writings), often through a synagogue."
    ],
    inspiration: "These are small, almost old-fashioned gestures, and that's rather the point: respect that only ever stays in your head tends to stay theoretical. A body that physically practices reverence — even in tiny, easy-to-miss ways — tends to actually feel it more, not less."
  },

  // ---------------------------------------------------------------
  // Batch 1 (Phase 8)
  // ---------------------------------------------------------------
  {
    id: "shema",
    icon: "star",
    title: "The Shema",
    subtitle: "Six words at the heart of Jewish belief, said morning and night",
    intro: "\"Shema Yisrael, Adonai Eloheinu, Adonai Echad\" — \"Hear, O Israel: the Lord is our God, the Lord is One.\" The Torah asks for these words to be said \"when you lie down and when you rise up,\" so they're part of the morning and evening prayers, and many say them again at bedtime.",
    steps: [
      "The first line is said slowly, often with the right hand covering the eyes, to focus completely on its meaning.",
      "It's followed by a quiet line, \"Baruch shem kevod malchuto l'olam va'ed\" (\"Blessed is the name of His glorious kingdom forever\"), then three Torah paragraphs.",
      "The morning Shema has a time limit — roughly the first quarter of the day — so it's worth checking the exact time where you live.",
      "Starting out? Saying just the first line, with attention, morning and night, is a genuine and meaningful beginning."
    ],
    sources: ["Deuteronomy 6:4–9", "Mishnah Berakhot 1:1–2", "Shulchan Aruch, Orach Chaim 58–61"],
    inspiration: "The Shema doesn't begin with \"believe\" — it begins with \"listen.\" Before any statement about God, it asks for attention. Try saying the first line once today with your eyes closed, slowly enough that you actually hear it."
  },
  {
    id: "lashon-hara",
    icon: "heart",
    title: "Guarding Your Speech",
    subtitle: "Not speaking badly about others — even when it's true",
    intro: "Lashon hara (\"evil speech\") means saying something negative about another person, even when it's completely true. Jewish law treats careless words as seriously as careless actions: words can't be taken back, and they shape how others see someone long after the conversation ends.",
    steps: [
      "Before sharing something about someone who isn't there, ask: is it true, is it necessary, and would it hurt them if they heard it?",
      "Listening to gossip and believing it is part of the prohibition too — changing the subject is a quiet, practical way out.",
      "There are real exceptions — for example, warning someone to protect them from harm. These are nuanced, and worth learning with a teacher.",
      "Many people learn a little each day from \"Chafetz Chaim\" (a classic book on the laws of speech) or one of its modern, daily-portion versions."
    ],
    sources: ["Leviticus 19:16", "Talmud, Arakhin 15b", "Chafetz Chaim (Rabbi Yisrael Meir Kagan, 1873)"],
    inspiration: "The Sages compared lashon hara to an arrow: once it leaves the bow, you can't call it back. Try a single day of noticing — not judging yourself, just noticing — how often conversation drifts toward other people's faults. Awareness is most of the work."
  },
  {
    id: "honoring-parents",
    icon: "heart",
    title: "Honoring Parents",
    subtitle: "One of the Ten Commandments — and a lifelong practice",
    intro: "\"Honor your father and your mother\" is the fifth of the Ten Commandments. The Talmud spells it out in concrete, everyday terms: helping them with food, clothing and getting around, and treating them with respect in how you speak and act — not just feeling grateful in your heart.",
    steps: [
      "Honor (kavod) is practical care: helping, visiting, calling, making sure their needs are met.",
      "Reverence (yirah) is respect: not contradicting them in a dismissive way, not sitting in their regular seat, not calling them by their first name.",
      "Tradition recognizes that family relationships can be painful or complicated. How to honor a difficult or harmful parent is a real question to bring to a rabbi — not something you have to work out alone.",
      "This applies to everyone, including people who convert: Jewish tradition is clear that converts should keep honoring and caring for their parents."
    ],
    sources: ["Exodus 20:12", "Leviticus 19:3", "Talmud, Kiddushin 31b", "Rambam, Hilchot Mamrim 5:11"],
    inspiration: "Of all the Ten Commandments, this is one of only two that come with a promised reward — \"that your days may be long.\" Maybe because honoring the people who came before us is how anything lasts. If you can, call a parent or parent-figure today — not about anything, just to talk."
  },
  {
    id: "hachnasat-orchim",
    icon: "bread",
    title: "Welcoming Guests",
    subtitle: "Hachnasat orchim — an open door, modeled on Abraham's tent",
    intro: "Abraham, the Torah tells us, ran from his tent in the heat of the day to welcome three strangers — and served them a feast. The Talmud draws a striking lesson: welcoming guests is even greater than receiving the Divine Presence. Hospitality is one of the most loved Jewish values.",
    steps: [
      "Invite people who might be alone — newcomers, students, someone far from family — especially for a Shabbat or holiday meal.",
      "Make guests feel at ease: greet them warmly, offer food and drink early, and include them in the conversation.",
      "Tradition adds walking a guest a few steps out when they leave (levayah), a small sign that you're sorry to see them go.",
      "If you're the one who's new, accepting an invitation is also a gift — it lets someone else do this mitzvah."
    ],
    sources: ["Genesis 18:1–8", "Talmud, Shabbat 127a", "Talmud, Sotah 46b"],
    inspiration: "Abraham's tent, the Midrash says, had doors on all four sides, so no traveler would have to search for the entrance. You don't need a big home to be like that — just a habit of noticing who might need a seat at your table this week."
  },
  {
    id: "bikur-cholim",
    icon: "hand",
    title: "Visiting the Sick",
    subtitle: "Bikur cholim — showing up for someone who's unwell",
    intro: "The Torah describes God visiting Abraham as he recovered — and the Sages taught that we should walk in God's ways by doing the same. Visiting someone who is sick is a mitzvah for anyone to do, and the Talmud says a visit lifts a small part of the person's suffering.",
    steps: [
      "Ask first what's welcome — a short visit, a call, a message or a meal may help more than a long visit.",
      "Keep visits brief and focused on them: listen more than you talk, and help with practical needs.",
      "Pray for their recovery. Many synagogues say a \"Mi Sheberach\" prayer for the sick, using the person's Hebrew name and their mother's name.",
      "Look after yourself too — when you're sick, a call is better than spreading an illness."
    ],
    sources: ["Genesis 18:1", "Talmud, Sotah 14a", "Talmud, Nedarim 39b–40a", "Shulchan Aruch, Yoreh De'ah 335"],
    inspiration: "Being sick is lonely in a way that's hard to explain until it happens to you. You don't have to say anything wise — the mitzvah is mostly in showing up. Is there someone you've been meaning to check on?"
  },
  {
    id: "hashavat-aveidah",
    icon: "hand",
    title: "Returning Lost Things",
    subtitle: "Hashavat aveidah — you can't just look away",
    intro: "If you find something someone has lost, the Torah says, \"you may not hide yourself\" — you have to make a real effort to return it. It sounds simple, but it's a whole way of seeing other people's property as something you're partly responsible for.",
    steps: [
      "If an item has an identifying mark or was clearly lost (not left on purpose), take care of it and try to find the owner.",
      "Let people know what you found without giving every detail, so the real owner can describe it.",
      "Some things can be kept — for example, small change with no identifying sign that the owner has surely given up on. The details are worth learning.",
      "The same spirit applies more widely: pointing out someone's dropped glove, or warning a neighbor that their car lights are on."
    ],
    sources: ["Deuteronomy 22:1–3", "Talmud, Bava Metzia 21a–33b", "Shulchan Aruch, Choshen Mishpat 259–271"],
    inspiration: "\"You may not hide yourself\" is a remarkable phrase. The Torah knows the easiest response is to pretend you didn't notice. This mitzvah asks for the opposite: to notice, and to care about something that isn't yours."
  },
  {
    id: "meat-and-milk",
    icon: "goblet",
    title: "Keeping Meat and Milk Apart",
    subtitle: "One of the most recognizable parts of keeping kosher",
    intro: "Three times the Torah says, \"Do not cook a young goat in its mother's milk.\" From this, Jewish law teaches that meat and dairy aren't cooked or eaten together — a practice that shapes kosher kitchens, recipes and even the time between meals.",
    steps: [
      "Meat (including poultry) and dairy aren't eaten together; \"pareve\" foods — like fish, eggs, fruit, vegetables and grains — go with either.",
      "Kosher kitchens keep separate dishes, pots and utensils for meat and for dairy.",
      "After eating meat, people wait before eating dairy. How long depends on family custom — commonly one, three or six hours.",
      "Starting out? Many begin by simply not mixing meat and cheese in one meal, then learn the rest step by step with a rabbi or teacher."
    ],
    sources: ["Exodus 23:19, 34:26", "Deuteronomy 14:21", "Talmud, Chullin 104b–105a", "Shulchan Aruch, Yoreh De'ah 87–89"],
    inspiration: "Kashrut turns the most ordinary act — eating — into something you pay attention to several times a day. Before your next meal, notice the small pause of asking, \"meat, dairy or neither?\" That pause is the point."
  },
  {
    id: "shehecheyanu",
    icon: "sunrise",
    title: "Shehecheyanu",
    subtitle: "A blessing for firsts and for new seasons",
    intro: "Shehecheyanu thanks God \"who has kept us alive, sustained us, and brought us to this moment.\" It's said at moments of newness and joy — the first night of a holiday, the first taste of a fruit this season, or wearing an important new piece of clothing for the first time.",
    steps: [
      "Text: \"Baruch atah Adonai, Eloheinu melech ha'olam, shehecheyanu v'kiyemanu v'higiyanu lazman hazeh.\"",
      "Common times: the first night of most holidays, lighting the first Chanukah candle, and eating a seasonal fruit for the first time this year.",
      "It's also said on significant new purchases, like new clothes or a new home — customs vary on what counts.",
      "If you're unsure whether to say it, ask — and remember the feeling behind it is always welcome."
    ],
    sources: ["Talmud, Berakhot 54a", "Talmud, Eruvin 40b", "Shulchan Aruch, Orach Chaim 223–225"],
    inspiration: "Most of our lives are spent rushing toward the next thing. Shehecheyanu does the opposite: it stops at the threshold and says, \"I made it here, and that's a gift.\" What's something new in your life this season worth pausing for?"
  },
  {
    id: "bal-tashchit",
    icon: "tree",
    title: "Not Wasting",
    subtitle: "Bal tashchit — treating the world as something entrusted to us",
    intro: "Even in wartime, the Torah forbids cutting down fruit trees around a besieged city. The Sages saw a broader principle in it: needlessly destroying or wasting anything useful — food, clothing, resources — is wrong. Bal tashchit, \"do not destroy,\" is an ancient Jewish environmental ethic.",
    steps: [
      "Avoid throwing away food or things that are still usable; share, donate or repurpose them where you can.",
      "Use resources like water and energy thoughtfully — not out of guilt, but out of respect.",
      "The principle is about needless waste; using things for a real purpose, including enjoyment, is fine.",
      "A simple start: plan meals to waste less, and give away clothes you no longer wear."
    ],
    sources: ["Deuteronomy 20:19–20", "Talmud, Shabbat 129a", "Rambam, Hilchot Melachim 6:10"],
    inspiration: "A Midrash imagines God showing Adam the Garden and saying: \"Everything I created, I created for you — be careful not to ruin My world, because there will be no one to repair it after you.\" Small choices add up. What's one thing you could waste less of this week?"
  },
  {
    id: "tefillat-haderech",
    icon: "star",
    title: "The Traveler's Prayer",
    subtitle: "Tefillat HaDerech — a short prayer for a safe journey",
    intro: "Before setting out on a trip, Jewish tradition offers a short prayer asking for a safe journey and a peaceful arrival. It's said once you're on the road and out of your town — whether you're driving, flying or taking a long train ride.",
    steps: [
      "Say it once you've left the built-up area of your town, at the start of a longer trip (commonly a few kilometers or more).",
      "Say it once per day of travel; on a multi-day journey, it's said each day you set out.",
      "It begins \"Yehi ratzon…\" — \"May it be Your will… that You lead us in peace\" — and is printed in most siddurim and on small cards.",
      "Many keep a copy in the car or travel bag, or a printed card in their wallet."
    ],
    sources: ["Talmud, Berakhot 29b–30a", "Shulchan Aruch, Orach Chaim 110:4–7"],
    inspiration: "Tradition doesn't only pray for arriving safely — it prays for the road itself, \"in peace.\" Every journey has an in-between part. This prayer asks for that part to be held, too."
  },

  // ---------------------------------------------------------------
  // Batch 2 (Phase 8)
  // ---------------------------------------------------------------
  {
    id: "tefillin",
    icon: "tzitzit",
    title: "Tefillin",
    subtitle: "Binding words of Torah on the arm and head each weekday morning",
    intro: "Tefillin are two small black leather boxes holding handwritten passages from the Torah, including the Shema. The Torah says, \"Bind them as a sign on your hand, and they shall be a reminder between your eyes\" — so one is wrapped on the arm, facing the heart, and one is worn on the head.",
    steps: [
      "Traditionally worn by men from bar mitzvah during weekday morning prayers — not on Shabbat or major festivals. Practices for women vary by community and movement.",
      "The arm tefillin goes on first — on the weaker arm (the left for right-handed people) — with a blessing, then the head tefillin.",
      "Taking them off goes in reverse: head first, then arm. The exact wrapping differs between communities.",
      "Many synagogues and Chabad centers will happily show you how and lend a pair. If you're in the process of conversion, ask your rabbi when and whether to start."
    ],
    sources: ["Deuteronomy 6:8", "Exodus 13:9, 13:16", "Talmud, Menachot 34b–36a", "Shulchan Aruch, Orach Chaim 25–27"],
    inspiration: "Tefillin tie the mind and the heart together, literally — one box near each. The idea is that what we think and what we feel shouldn't drift apart. For a few minutes each morning, the body itself becomes a reminder of what matters."
  },
  {
    id: "shabbat-candles",
    icon: "candles-shabbat",
    title: "Lighting Shabbat Candles",
    subtitle: "Two flames that turn Friday evening into Shabbat",
    intro: "Shortly before sunset on Friday, candles are lit to welcome Shabbat — traditionally at least two, for the Torah's two commands to \"remember\" and \"guard\" the day. It's often the moment a home shifts from the rush of the week into rest.",
    steps: [
      "Light before sunset — commonly 18 minutes before (40 in Jerusalem). Check the time for your city.",
      "Traditionally the woman of the home lights; anyone living alone lights for themselves, and others can light too.",
      "Many light first, cover their eyes and then say the blessing \"…l'hadlik ner shel Shabbat\"; some say the blessing first. Follow your community.",
      "It's a lovely moment for a quiet personal prayer for family and loved ones. Ask your rabbi whether to say the blessing before conversion."
    ],
    sources: ["Talmud, Shabbat 25b", "Rambam, Hilchot Shabbat 5:1", "Shulchan Aruch, Orach Chaim 263"],
    inspiration: "The Sages said Shabbat candles bring shalom bayit — peace in the home — because no one wants to eat their Friday dinner in the dark. Light is a kind of welcome. Even if nothing else about this Friday is different, try lighting two candles and watching them for a minute."
  },
  {
    id: "havdalah",
    icon: "goblet",
    title: "Havdalah",
    subtitle: "Saying goodbye to Shabbat with wine, spices and flame",
    intro: "Havdalah (\"separation\") is the short ceremony that ends Shabbat on Saturday night, once three stars are out. It uses all the senses — wine to taste, sweet spices to smell, a braided candle to see — to mark the line between holy time and the week ahead.",
    steps: [
      "Wait until Shabbat has ended (check the Havdalah time for your city).",
      "Blessings are said over wine (or grape juice), fragrant spices and the flame of a braided candle with several wicks.",
      "Many hold their fingers up to the candle to see the light reflected on their nails, then say the final blessing separating holy and ordinary.",
      "A common custom is to put out the candle in a little of the leftover wine, and to wish everyone \"Shavua tov\" — a good week."
    ],
    sources: ["Exodus 20:8", "Talmud, Pesachim 103a–106a", "Talmud, Berakhot 33a", "Shulchan Aruch, Orach Chaim 296–299"],
    inspiration: "Tradition says we receive an \"extra soul\" on Shabbat, and the spices at Havdalah comfort us as it leaves. It's a gentle idea: endings deserve attention too. Next Saturday night, try marking the moment instead of letting the week rush back in."
  },
  {
    id: "blessings-for-news",
    icon: "book-star",
    title: "Blessings for Good and Hard News",
    subtitle: "Short blessings for the moments that change a day",
    intro: "Judaism has a blessing ready for the big moments of life — not only for food. Hearing good news, or news that's painful, both have their own short blessing, so that even the most emotional moments can be met with words.",
    steps: [
      "Good news that benefits you and others (like the birth of a child): \"HaTov v'HaMeitiv\" — \"Who is good and does good.\"",
      "Good news that's mainly yours: Shehecheyanu (see that mitzvah).",
      "On hearing of a death or very hard news: \"Baruch Dayan HaEmet\" — \"Blessed is the true Judge\" — an acceptance, not a celebration.",
      "Many say just the closing words in English or Hebrew. There's no wrong way to start."
    ],
    sources: ["Mishnah Berakhot 9:2–3", "Talmud, Berakhot 59b–60a", "Shulchan Aruch, Orach Chaim 222–223"],
    inspiration: "The Mishnah says we bless for the bad just as we bless for the good. That's not pretending pain is fine — it's refusing to face it alone. Words like \"Baruch Dayan HaEmet\" give people something to hold on to when there's nothing else to say."
  },
  {
    id: "onaat-devarim",
    icon: "heart",
    title: "Kind Words",
    subtitle: "Not hurting or embarrassing anyone with what you say",
    intro: "The Torah forbids \"wronging one another\" — and the Sages read this as being about words. Hurting someone's feelings, humiliating them, or reminding them of a past they've moved on from is treated as a serious wrong. Embarrassing someone in public, the Talmud says, is like shedding blood.",
    steps: [
      "Don't remind people of past mistakes they've worked to leave behind — or remind a convert of the life they lived before.",
      "Never shame someone in front of others; if you need to correct someone, do it privately and gently.",
      "Avoid teasing that stings, nicknames people dislike, and questions meant to make someone feel small.",
      "The same rule even covers asking a shopkeeper the price of something you have no intention of buying, just to waste their time."
    ],
    sources: ["Leviticus 25:17", "Talmud, Bava Metzia 58b–59a", "Shulchan Aruch, Choshen Mishpat 228"],
    inspiration: "The Talmud notices that when someone is embarrassed, their face goes pale — as if the blood drained out. That's why it compares shaming to harm. Kindness in speech is something you can practice dozens of times a day."
  },
  {
    id: "ahavat-hager",
    icon: "heart",
    title: "Loving the Convert",
    subtitle: "\"You shall love the stranger, for you were strangers in Egypt\"",
    intro: "The Torah repeats its call to love and protect the ger — the stranger, and in rabbinic reading, the person who joins the Jewish people — more often than almost any other command. Converts are full members of the Jewish people, and welcoming them is a mitzvah for everyone.",
    steps: [
      "Welcome converts and people exploring conversion warmly — invite them for Shabbat, introduce them, include them.",
      "Never treat a convert as less Jewish, or keep bringing up their background in a way that singles them out.",
      "Answer questions patiently; every Jew was once a beginner at something.",
      "If you're converting yourself: this mitzvah is about you. Tradition calls converts \"children of Abraham and Sarah.\""
    ],
    sources: ["Deuteronomy 10:19", "Leviticus 19:33–34", "Talmud, Bava Metzia 59b", "Rambam, Letter to Ovadiah the Convert"],
    inspiration: "When a convert named Ovadiah asked whether he could say \"God of our fathers\" in prayer, Maimonides answered: yes — Abraham is your father. Belonging isn't measured by ancestry. Who in your community might be waiting for someone to make them feel at home?"
  },
  {
    id: "honest-business",
    icon: "coin",
    title: "Honest Business",
    subtitle: "Fair weights, fair prices, and paying people on time",
    intro: "The Torah commands honest weights and measures, and forbids holding back a worker's wages overnight. The Talmud says that one of the first questions a person is asked after this life is simply: \"Did you deal honestly in business?\" Holiness, in Judaism, includes how you earn and spend.",
    steps: [
      "Be truthful about what you sell and what it costs; don't create false impressions.",
      "Pay workers and freelancers promptly — the Torah specifically says not to make them wait.",
      "Keep promises and agreements, even small, informal ones.",
      "Returning extra change, or pointing out a billing mistake in your favor, is the same mitzvah in everyday form."
    ],
    sources: ["Leviticus 19:13, 19:35–36", "Deuteronomy 25:13–16", "Talmud, Shabbat 31a", "Shulchan Aruch, Choshen Mishpat 231, 339"],
    inspiration: "It's easy to treat business as a separate world from spiritual life. The Torah insists otherwise: the same chapter that says \"be holy\" talks about honest scales and paying wages. Where in your working week could honesty become a quiet daily practice?"
  },
  {
    id: "torah-study",
    icon: "book-star",
    title: "Learning Torah Every Day",
    subtitle: "Even a few minutes, at a set time, counts",
    intro: "Studying Torah is one of the central mitzvot — the Mishnah lists it alongside kindness and honoring parents, and says it's \"equal to them all\" because it leads to all of them. The goal isn't to become a scholar overnight, but to make learning a regular part of every day.",
    steps: [
      "Pick a set time, even five or ten minutes — the Sages taught \"make your Torah study a fixed habit.\"",
      "Start with something accessible: the weekly Torah portion (on this site), a page of Pirkei Avot, or a short daily-learning app or book.",
      "Learning with a partner (a chavruta) or in a class makes it more alive and helps you keep going.",
      "Questions are a good sign. In Jewish learning, asking well is part of understanding."
    ],
    sources: ["Deuteronomy 6:7", "Mishnah Peah 1:1", "Pirkei Avot 1:15", "Talmud, Shabbat 31a"],
    inspiration: "Hillel was once too poor to pay for entry to the study hall, so the story goes, he climbed onto the roof to listen through the skylight — in the snow. You don't need anything that dramatic. Just a few minutes today, at a time you'll keep."
  },
  {
    id: "asking-forgiveness",
    icon: "hand",
    title: "Asking Forgiveness",
    subtitle: "Making things right with people, not only with God",
    intro: "Jewish tradition teaches that Yom Kippur atones for wrongs between a person and God — but wrongs against other people are only forgiven once you've made peace with them. Asking forgiveness, and granting it, is an everyday mitzvah, not only a once-a-year one.",
    steps: [
      "Acknowledge what you did specifically and sincerely, and fix any harm you can (for example, returning money or correcting a false story).",
      "If someone doesn't forgive you at first, tradition says to try again respectfully — up to three times.",
      "When someone asks you for forgiveness, try to be easy to appease and not to hold on to grudges.",
      "In situations of abuse or serious harm, there's no obligation to forgive or reconcile — a rabbi or counselor can help you think it through."
    ],
    sources: ["Mishnah Yoma 8:9", "Rambam, Hilchot Teshuvah 2:9–10", "Shulchan Aruch, Orach Chaim 606"],
    inspiration: "Saying \"I'm sorry\" well is one of the hardest and bravest things a person can do. Rambam said that someone who forgives easily shows the character of the Jewish people. Is there one conversation you've been putting off?"
  },
  {
    id: "kindness-to-animals",
    icon: "tree",
    title: "Kindness to Animals",
    subtitle: "Tza'ar ba'alei chayim — not causing animals needless pain",
    intro: "The Torah tells us to help an overburdened donkey even if it belongs to someone we dislike, and to let animals rest on Shabbat. From verses like these, the Sages derived a general principle: causing animals unnecessary suffering is forbidden, and caring for them is a mitzvah.",
    steps: [
      "If you have pets or animals, feed them before you eat yourself — the Talmud learns this from the order of a verse in the Shema.",
      "Don't cause needless pain — in how animals are kept, handled, worked or played with.",
      "Help an animal in distress when you safely can.",
      "Kosher slaughter itself is designed to be quick, and is one reason tradition takes animal welfare seriously."
    ],
    sources: ["Exodus 23:5, 23:12", "Deuteronomy 11:15, 22:4", "Talmud, Berakhot 40a", "Talmud, Bava Metzia 32b"],
    inspiration: "The Midrash says Moses and King David were chosen to lead because of how gently they cared for their flocks. How someone treats those who can't speak for themselves says a lot about them. If you have a pet, try feeding it first today — a small daily reminder."
  },

  // ---------------------------------------------------------------
  // Batch 3 (Phase 8)
  // ---------------------------------------------------------------
  {
    id: "blessings-of-wonder",
    icon: "sunrise",
    title: "Blessings for Sights and Smells",
    subtitle: "A rainbow, thunder, the ocean, a sweet fragrance — each has a blessing",
    intro: "Jewish tradition has short blessings for moments of wonder in the natural world. Seeing a rainbow, hearing thunder, smelling fragrant spices or seeing the ocean after a long time — each gets its own line of praise, turning a passing moment into a conscious one.",
    steps: [
      "Rainbow: \"…zocher habrit\" — \"who remembers the covenant\" (and, tradition says, look but don't stare).",
      "Thunder: \"…shekocho u'gevurato malei olam\" — \"whose strength and power fill the world.\" Lightning: \"…oseh ma'aseh bereishit\" — \"who makes the work of creation.\"",
      "Fragrant spices or plants: \"…borei minei besamim\" or \"…borei atzei besamim\" — the blessing depends on the source of the smell.",
      "Each begins \"Baruch atah Adonai, Eloheinu melech ha'olam…\" — a small card or app with the list makes it easy to start."
    ],
    sources: ["Mishnah Berakhot 9:2", "Talmud, Berakhot 43a–43b, 59a", "Shulchan Aruch, Orach Chaim 216–229"],
    inspiration: "The Talmud says a person should say a hundred blessings a day. That sounds like a lot, until you realize how much there is to notice. Next time the sky does something remarkable, try stopping to say one line about it."
  },
  {
    id: "kosher-animals",
    icon: "bread",
    title: "Which Foods Are Kosher",
    subtitle: "Animals, fish and birds the Torah permits — and how to tell",
    intro: "The Torah lists which animals may be eaten: land animals that both have split hooves and chew their cud (like cows and sheep), fish with both fins and scales, and certain birds. Most insects and shellfish aren't kosher. Kosher meat also has to be slaughtered and prepared in a specific way.",
    steps: [
      "Meat and poultry must come from a kosher animal, be slaughtered by a trained shochet, and have the blood removed (traditionally by soaking and salting).",
      "Fish need fins and scales — salmon and tuna are kosher; shellfish, shark and catfish aren't.",
      "In packaged foods, look for a hechsher (a kosher certification symbol) — ingredients can be surprising.",
      "Keeping kosher is often taken on step by step. Ask a rabbi or teacher which steps to start with."
    ],
    sources: ["Leviticus 11", "Deuteronomy 14:3–21", "Talmud, Chullin 59a–66a", "Shulchan Aruch, Yoreh De'ah 79–85"],
    inspiration: "The Torah doesn't give one reason for kashrut — and that's part of the point. Choosing what you eat is a daily act of commitment, made three times a day. Some find it builds discipline; others find it makes every meal feel a little bit holy."
  },
  {
    id: "tzniut",
    icon: "heart",
    title: "Dignity and Modesty",
    subtitle: "Tzniut — carrying yourself with quiet dignity",
    intro: "Tzniut is often translated \"modesty,\" but it's broader than clothing: it's about dignity, humility and privacy in how a person dresses, speaks and acts. The prophet Micah sums up what God asks as \"to do justice, love kindness, and walk humbly.\"",
    steps: [
      "It applies to everyone: not showing off, not drawing attention to yourself, giving quiet help rather than public displays.",
      "Speech counts too — talking about others and about yourself with discretion.",
      "Standards of dress vary widely between communities. If you're joining a particular community, ask your rabbi or a friend there what's customary.",
      "The heart of it isn't judging others — it's how you carry yourself."
    ],
    sources: ["Micah 6:8", "Talmud, Sukkah 49b", "Talmud, Makkot 24a"],
    inspiration: "The Sages noticed the Torah's most important moments often happen in private. Dignity isn't the same as hiding — it's knowing that your worth doesn't depend on being seen. What would it look like to do one good thing today that nobody knows about?"
  },
  {
    id: "praying-for-others",
    icon: "hand",
    title: "Praying for Others",
    subtitle: "Including other people's needs in your own prayers",
    intro: "When his sister Miriam was ill, Moses prayed the shortest prayer in the Torah: \"El na, refa na lah\" — \"Please, God, heal her, please.\" Jewish tradition encourages praying for other people — the sick, those in trouble, friends and strangers — in your own words or with traditional texts.",
    steps: [
      "Anyone can pray for someone else, in any language, at any time.",
      "In synagogue, a \"Mi Sheberach\" prayer for healing is often said during the Torah reading — using the person's Hebrew name and their mother's name, if known.",
      "Tehillim (Psalms) are often said for people who are sick or in danger.",
      "The Talmud teaches that when you pray for someone else while needing the same thing yourself, you're answered first."
    ],
    sources: ["Numbers 12:13", "Talmud, Bava Kamma 92a", "Talmud, Berakhot 12b"],
    inspiration: "Moses' prayer for Miriam is just five Hebrew words. Prayer doesn't need to be long or eloquent to be real. Who could you hold in mind, even for one sentence, today?"
  },
  {
    id: "head-covering",
    icon: "star",
    title: "Covering the Head",
    subtitle: "The kippah and other head coverings — a sign of awareness",
    intro: "Many Jewish men wear a kippah (yarmulke), either always or during prayer and meals, as a reminder that there is Someone above. It's a long-standing custom rather than a Torah commandment. Practices for women vary: in many traditional communities, married women cover their hair.",
    steps: [
      "Common practice: men cover their heads during prayer, Torah study and when saying blessings; many wear a kippah all day.",
      "The Talmud tells of a mother who told her son to cover his head \"so that the fear of Heaven will be upon you.\"",
      "Customs for women differ a lot between communities — from no covering to scarves, hats or wigs after marriage. There's no single right answer for everyone.",
      "Visiting a synagogue? Kippot are usually available at the door, and anyone is welcome to wear one."
    ],
    sources: ["Talmud, Shabbat 156b", "Talmud, Kiddushin 31a", "Shulchan Aruch, Orach Chaim 2:6"],
    inspiration: "A kippah doesn't do anything practical — and that's its strength. It's a small, constant reminder that you're not the highest thing in the room. Many people find that wearing something on purpose changes how they act, a little."
  },
  {
    id: "giving-with-dignity",
    icon: "coin",
    title: "Giving with Dignity",
    subtitle: "Maimonides' eight levels of tzedakah",
    intro: "Maimonides ranked giving in eight levels — from giving grudgingly at the bottom, to helping someone become self-sufficient at the top. In between, giving anonymously, so neither side knows the other, protects the dignity of the person receiving help.",
    steps: [
      "Highest: helping someone stand on their own — a loan, a job, a partnership.",
      "Next: giving so that neither the giver nor the receiver knows the other's identity (for example, through a trusted fund).",
      "Lower levels include giving before being asked, after being asked, too little but kindly — and, at the bottom, grudgingly. Every level still counts.",
      "Many have a custom of setting aside a tenth of their income (ma'aser) for tzedakah. Ask a rabbi or teacher how it might work for you."
    ],
    sources: ["Deuteronomy 15:7–11", "Rambam, Hilchot Matanot Aniyim 10:7–14", "Shulchan Aruch, Yoreh De'ah 249"],
    inspiration: "Even the lowest rung of Maimonides' ladder — giving grudgingly — is still on the ladder. That's encouraging: you don't need perfect motives to start. Give, and let the giving shape the heart over time."
  },
  {
    id: "comforting-mourners",
    icon: "candle-memorial",
    title: "Comforting Mourners",
    subtitle: "Nichum aveilim — sitting with someone in their loss",
    intro: "After a close relative's funeral, Jewish mourners \"sit shiva\" for seven days, usually at home, while friends and community come to comfort them. Visiting a shiva house is a mitzvah for anyone — and it's mostly about being present, not about finding the right words.",
    steps: [
      "Let the mourner speak first. Often the best thing is to listen, or to share a memory of the person who died.",
      "Avoid cheerful greetings and attempts to explain the loss; simple presence means more.",
      "A traditional phrase on leaving is \"HaMakom yenachem etchem…\" — \"May God comfort you among the mourners of Zion and Jerusalem.\"",
      "Practical help — meals, errands, joining a minyan so the mourner can say Kaddish — is a real comfort."
    ],
    sources: ["Genesis 25:11", "Talmud, Sotah 14a", "Talmud, Moed Katan 28b", "Shulchan Aruch, Yoreh De'ah 376"],
    inspiration: "Job's friends did best in the first seven days, when they simply sat with him in silence. Comfort isn't about fixing grief. Showing up, and staying a while, is the mitzvah."
  },
  {
    id: "saying-amen",
    icon: "book-star",
    title: "Saying Amen",
    subtitle: "Joining in someone else's blessing",
    intro: "\"Amen\" means \"it is true\" or \"so be it.\" When someone says a blessing within your hearing, answering amen joins you to it. The Talmud goes so far as to say that answering amen can be even greater than saying the blessing yourself.",
    steps: [
      "Answer \"amen\" after hearing someone finish a blessing — at the table, in synagogue, anywhere.",
      "Say it clearly but not too fast, and only after the blessing has ended.",
      "During Kaddish, the congregation answers \"Amen, yehei shmei rabba…\" — \"Amen, may His great name be blessed…\" — one of the most important responses in the service.",
      "It's a beautiful way for beginners to participate in prayer before knowing all the words."
    ],
    sources: ["Talmud, Berakhot 53b", "Talmud, Shabbat 119b", "Shulchan Aruch, Orach Chaim 124, 215"],
    inspiration: "Amen is one of the few Hebrew words that's traveled into almost every language. It's a word of agreement — of saying \"me too.\" In prayer, it means nobody has to stand alone."
  },
  {
    id: "respecting-elders",
    icon: "hand",
    title: "Respecting Elders and Teachers",
    subtitle: "\"Rise before the aged, and honor the face of the old\"",
    intro: "The Torah tells us to stand up for older people and to honor them. The Talmud describes great sages standing up for any elderly person — Jewish or not — out of respect for a life full of experience. Teachers, too, are owed special honor for what they give.",
    steps: [
      "Stand when an elderly person or your teacher enters the room, or offer your seat.",
      "Speak respectfully and patiently, and value their experience.",
      "Thank the people who have taught you — tradition says even someone who taught you a single word deserves honor.",
      "Visiting or calling an older relative or neighbor is this mitzvah in action."
    ],
    sources: ["Leviticus 19:32", "Talmud, Kiddushin 32b–33a", "Pirkei Avot 4:12", "Shulchan Aruch, Yoreh De'ah 244"],
    inspiration: "The Talmud says Rabbi Yochanan would stand for elderly non-Jews, saying, \"How many troubles have passed over them!\" Respect for age is respect for everything a person has carried. Who is an older person in your life you could honor this week?"
  },
  {
    id: "making-peace",
    icon: "heart",
    title: "Making Peace Between People",
    subtitle: "Following Aaron: \"love peace and pursue peace\"",
    intro: "The Mishnah lists bringing peace between people among the deeds whose reward is felt even in this life. Aaron, Moses' brother, was famous for it: when two people quarreled, he would quietly go to each one and help them find their way back to the other.",
    steps: [
      "When friends or family are in conflict, look for ways to help each one see the other's side — gently, and without taking over.",
      "Speak well of each person to the other; don't carry hurtful remarks back and forth.",
      "Make the first move in your own disagreements — a call, a note, an invitation.",
      "Peace doesn't mean ignoring real harm; it means not letting pride keep people apart."
    ],
    sources: ["Mishnah Peah 1:1", "Pirkei Avot 1:12", "Avot de-Rabbi Natan 12", "Talmud, Yevamot 65b"],
    inspiration: "Hillel said: \"Be like the students of Aaron — love peace and pursue it.\" Pursue is an active word: peace usually doesn't arrive by waiting. Is there a small bridge you could help build today?"
  },

  // ---------------------------------------------------------------
  // Batch 4 (Phase 8)
  // ---------------------------------------------------------------
  {
    id: "washing-for-bread",
    icon: "wash-cup",
    title: "Washing Before Bread",
    subtitle: "A ritual hand-washing that turns a meal into something special",
    intro: "Before eating bread, hands are washed with a cup and a blessing — not for hygiene (hands should already be clean), but as a reminder of the priests who washed before eating holy food in the Temple. It turns an ordinary meal into a small ceremony.",
    steps: [
      "Fill a cup, remove rings, and pour water over the right hand, then the left — commonly twice or three times each, depending on custom.",
      "Say the blessing \"…al netilat yadayim\" and dry your hands.",
      "Many try not to talk between washing and saying HaMotzi over the bread.",
      "It's only for a meal with bread; other foods don't need it."
    ],
    sources: ["Talmud, Chullin 105a–106a", "Talmud, Berakhot 52b", "Shulchan Aruch, Orach Chaim 158–165"],
    inspiration: "The Sages said that, since the Temple was destroyed, the family table takes the place of the altar. Washing before bread is a way of treating your own kitchen table as something holy. Even one meal a week like this changes how it feels."
  },
  {
    id: "separating-challah",
    icon: "bread",
    title: "Separating Challah",
    subtitle: "Setting aside a piece of dough when baking bread",
    intro: "When baking bread from a large enough batch of flour, a small piece of the dough is separated and set aside, recalling the portion once given to the priests. It's traditionally a mitzvah associated with women, and many use the moment for personal prayer — though anyone who bakes can do it.",
    steps: [
      "It applies to dough made from wheat, barley, spelt, rye or oats in a large enough quantity — roughly 1.2 kg (about 2.5 lb) of flour or more for the blessing. Rabbis differ on exact amounts.",
      "Pull off a small piece (about the size of an olive) and say \"…l'hafrish challah.\"",
      "The piece isn't eaten: it's wrapped and discarded, or burned, according to custom.",
      "Many gather for \"challah bakes\" before Shabbat — a warm, welcoming way to try it with others."
    ],
    sources: ["Numbers 15:17–21", "Mishnah Challah", "Shulchan Aruch, Yoreh De'ah 322–330"],
    inspiration: "Separating challah says: not everything I make is only for me. Before enjoying the bread, a piece goes back to God. Many women see it as an especially powerful moment to pray for the people they love."
  },
  {
    id: "after-blessings",
    icon: "goblet",
    title: "Blessings After Snacks",
    subtitle: "Al HaMichya and Borei Nefashot — a short thank-you after eating",
    intro: "Birkat Hamazon is said after a meal with bread. For other foods, there are two short after-blessings: Al HaMichya, after cake, wine or certain fruits of the Land of Israel, and Borei Nefashot, after almost everything else.",
    steps: [
      "Al HaMichya: after grain foods (like cake or pasta), wine or grape juice, and grapes, figs, pomegranates, olives or dates.",
      "Borei Nefashot: after other foods and drinks — vegetables, most fruits, meat, fish, water and more. It's just a few lines.",
      "They're said after eating at least a small, set amount (about the size of an olive) — and, for drinks, a cheekful. Customs differ on details.",
      "Many keep a small card with both texts at home or in a bag."
    ],
    sources: ["Talmud, Berakhot 37a, 44a–44b", "Shulchan Aruch, Orach Chaim 207–210"],
    inspiration: "The blessing before food is easy to remember — you're hungry. The blessing after is harder, because you're full and moving on. That's exactly why it matters: gratitude after the need is gone is the more honest kind."
  },
  {
    id: "love-of-the-land",
    icon: "flag-star",
    title: "Loving the Land of Israel",
    subtitle: "A connection that runs through prayer, food and the calendar",
    intro: "The Land of Israel is woven through Jewish life: prayers face Jerusalem, the holidays follow its harvests, and several mitzvot can only be done there. Whatever someone's politics, a deep connection to the Land is a long-standing part of Jewish identity.",
    steps: [
      "Face toward Jerusalem when you pray the Amidah — and toward the Temple Mount if you're in Jerusalem.",
      "Learn about the Land: its places, its history, and the mitzvot tied to it, like the Shmita (sabbatical) year.",
      "If you can, visit — many programs welcome people who are learning or converting.",
      "Many try to buy produce from Israel, especially fruits of the Seven Species around Tu BiShvat."
    ],
    sources: ["Genesis 12:1–7", "Deuteronomy 11:10–12", "Talmud, Ketubot 110b–111a", "Ramban on Numbers 33:53"],
    inspiration: "For two thousand years, Jews ended the Seder and Yom Kippur with \"Next year in Jerusalem\" — long before most could ever go. Love for the Land was kept alive in words first. What's one thing you could learn about it this week?"
  },
  {
    id: "benefit-of-the-doubt",
    icon: "heart",
    title: "Giving the Benefit of the Doubt",
    subtitle: "Dan l'chaf zechut — judging others favorably",
    intro: "\"Judge every person favorably,\" teaches Pirkei Avot. When someone's actions could be read as either good or bad, Jewish tradition asks us to lean toward the generous reading — especially with people we know to be decent.",
    steps: [
      "When someone is late, short with you or doesn't reply, imagine an innocent reason before assuming the worst.",
      "Check the facts before acting on a bad impression — and ask directly when it matters.",
      "Judging favorably doesn't mean ignoring real harm or putting yourself at risk; it's about not jumping to conclusions.",
      "A Talmudic story tells of a worker whose employer seemed to treat him unfairly — he assumed good reasons each time, and was right."
    ],
    sources: ["Leviticus 19:15", "Pirkei Avot 1:6", "Talmud, Shabbat 127b"],
    inspiration: "The Talmud says that whoever judges others favorably will be judged favorably in return. It's a generous way to live — and it usually turns out to be more accurate, too. Who could you give the benefit of the doubt to today?"
  },
  {
    id: "no-grudges",
    icon: "hand",
    title: "Not Holding a Grudge",
    subtitle: "No revenge, no keeping score — \"love your neighbor as yourself\"",
    intro: "Right before the famous line \"love your neighbor as yourself,\" the Torah forbids taking revenge or bearing a grudge. The Talmud gives a simple example: if someone refused to lend you something, you shouldn't refuse them in return — or even say \"I'll lend it to you, unlike you.\"",
    steps: [
      "Don't pay back unkindness with unkindness, even in small ways.",
      "Notice the subtle version too: helping someone while reminding them of what they did.",
      "If something is really bothering you, the Torah prefers that you speak to the person directly and respectfully, rather than holding it inside.",
      "Letting go doesn't mean pretending harm didn't happen — it means not letting it rule your actions."
    ],
    sources: ["Leviticus 19:17–18", "Talmud, Yoma 23a", "Rambam, Hilchot De'ot 7:7–8"],
    inspiration: "Grudges are heavy to carry, and usually heaviest for the person carrying them. The Torah puts this mitzvah right next to loving your neighbor — perhaps because you can't really do one without the other."
  },
  {
    id: "praying-with-a-minyan",
    icon: "book-star",
    title: "Praying with a Community",
    subtitle: "The minyan — prayer is stronger together",
    intro: "Jewish prayer can be said alone, but tradition gives special weight to praying with a minyan — a group of ten. Certain prayers, like Kaddish, Barchu and the public Torah reading, are only said with a minyan, and the Talmud says communal prayer is especially heard.",
    steps: [
      "Find a local synagogue's prayer times — many have weekday morning and evening services, and all have Shabbat services.",
      "Try to arrive on time, especially for the main parts of the service.",
      "Who counts toward a minyan differs between communities and movements; ask locally.",
      "As a newcomer, it's fine to follow along quietly, answer \"amen,\" and ask someone to show you where they are in the siddur."
    ],
    sources: ["Talmud, Berakhot 6a, 8a", "Talmud, Megillah 23b", "Shulchan Aruch, Orach Chaim 90"],
    inspiration: "There's a reason the most powerful prayers need a group. Some things aren't meant to be said alone. Even one visit to a weekday minyan can feel different from praying by yourself."
  },
  {
    id: "jewish-home-first-things",
    icon: "candles-shabbat",
    title: "A Jewish Home's First Things",
    subtitle: "The few items that help a home become a Jewish home",
    intro: "Many people building a Jewish home start with a small set of items: a siddur, a Chumash, Shabbat candlesticks, a Kiddush cup, a tzedakah box and a mezuzah. They aren't decoration — each one is used for a mitzvah, and having them close at hand makes the mitzvot easier to keep.",
    steps: [
      "A siddur (prayer book) and a Chumash with an English translation are the most useful places to start.",
      "Shabbat candlesticks and a Kiddush cup make Friday night feel like Friday night.",
      "Tradition says owning and using Jewish books is a modern way of fulfilling the mitzvah of writing a Torah scroll.",
      "No need to buy everything at once — many people receive these as gifts at meaningful moments."
    ],
    sources: ["Deuteronomy 31:19", "Shulchan Aruch, Yoreh De'ah 270:2", "Shulchan Aruch, Orach Chaim 263, 271"],
    inspiration: "A home becomes Jewish less by how it looks and more by what happens in it. These few objects are invitations to do something. Which one would make the biggest difference in your home this month?"
  },
  {
    id: "blessing-children",
    icon: "hand",
    title: "Blessing Your Children",
    subtitle: "A Friday-night blessing with hands on their heads",
    intro: "On Friday night, many parents place their hands on their children's heads and bless them, often whispering a personal word too. Boys are blessed to be like Ephraim and Menashe, girls to be like Sarah, Rebecca, Rachel and Leah — followed by the ancient Priestly Blessing.",
    steps: [
      "For a son: \"Yesimcha Elohim k'Efraim v'chi-Menashe\" — \"May God make you like Ephraim and Menashe.\"",
      "For a daughter: \"Yesimech Elohim k'Sarah, Rivka, Rachel v'Leah\" — \"May God make you like Sarah, Rebecca, Rachel and Leah.\"",
      "Then: \"May God bless you and guard you; may God's face shine on you and be gracious to you; may God turn toward you and give you peace.\"",
      "Grandparents, teachers and others bless children too — and adults can bless one another."
    ],
    sources: ["Genesis 48:20", "Numbers 6:24–26", "Siddur, Friday night table customs"],
    inspiration: "Once a week, a child hears that someone is praying for them, with hands on their head. Whatever else happened that week, this moment says: you're loved and you're blessed. It's never too late to start."
  },
  {
    id: "gratitude",
    icon: "sunrise",
    title: "Gratitude",
    subtitle: "Hakarat hatov — recognizing the good you've received",
    intro: "Hakarat hatov means \"recognizing the good.\" The very word for Jew — Yehudi — comes from Judah, whose name means \"I will thank.\" Gratitude runs through Jewish prayer, from Modeh Ani in the morning to Modim in the Amidah, and it extends to people, not only to God.",
    steps: [
      "Thank people specifically — not just \"thanks,\" but what they did and why it mattered.",
      "Remember those who helped you long ago: teachers, mentors, people who were kind at a hard time.",
      "Rashi notes that Moses didn't strike the Nile himself in the plagues, because the river had once protected him — gratitude even to water.",
      "Try ending each day by naming three good things that happened."
    ],
    sources: ["Genesis 29:35", "Rashi on Exodus 7:19", "Talmud, Berakhot 58a", "Pirkei Avot 4:1"],
    inspiration: "\"Who is rich?\" asks Pirkei Avot. \"The one who is happy with what they have.\" Gratitude doesn't change what you have — it changes how you see it. What's one thing you've been taking for granted that deserves a thank-you?"
  }
];
