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
  }
];
