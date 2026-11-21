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
  }
];
