/**
 * quiz.js — a small, fun "test yourself" question bank keyed to each
 * OCCASIONS entry (content.js) by id, so the quiz always matches whatever
 * is actually showing on the page that day. Rendered by app.js.
 */

const QUIZ_BANK = {
  "elul-general": {
    question: "What does the classic Chassidic teaching say Elul is like?",
    options: ["A king walking through the fields, approachable to everyone", "A locked courtroom", "A silent retreat", "A countdown timer"],
    correctIndex: 0
  },
  "selichot-start": {
    question: "By Ashkenazi/Chabad custom, when does Selichot begin?",
    options: ["Rosh Chodesh Elul", "The Motzei Shabbat closest to Rosh Hashanah", "Yom Kippur night", "The first night of Sukkot"],
    correctIndex: 1
  },
  "selichot-start-sephardi": {
    question: "By Sephardi custom, Selichot is recited nightly starting from...",
    options: ["Rosh Chodesh Elul", "Tisha B'Av", "Erev Rosh Hashanah only", "Shavuot"],
    correctIndex: 0
  },
  "erev-rosh-hashana": {
    question: "What's a common custom on Erev Rosh Hashanah?",
    options: ["Fasting all day", "Baking round challah", "Fireworks", "Painting eggs"],
    correctIndex: 1
  },
  "rosh-hashana": {
    question: "What's the central mitzvah of Rosh Hashanah?",
    options: ["Lighting a menorah", "Hearing the shofar", "Eating in a sukkah", "Reading the Megillah"],
    correctIndex: 1
  },
  "tzom-gedaliah": {
    question: "What does the Fast of Gedaliah commemorate?",
    options: ["The splitting of the sea", "The assassination of Gedaliah ben Achikam", "The giving of the Torah", "The dedication of the Second Temple"],
    correctIndex: 1
  },
  "aseret-yemei-teshuva": {
    question: "The Ten Days of Repentance run between which two holidays?",
    options: ["Pesach and Shavuot", "Rosh Hashanah and Yom Kippur", "Sukkot and Chanukah", "Purim and Pesach"],
    correctIndex: 1
  },
  "erev-yom-kippur": {
    question: "What does Jewish tradition say about eating on Erev Yom Kippur?",
    options: ["It's discouraged", "It's considered as praiseworthy as fasting on Yom Kippur", "It's forbidden after noon", "It's optional and rarely done"],
    correctIndex: 1
  },
  "yom-kippur": {
    question: "How many prayer services are traditionally part of Yom Kippur?",
    options: ["Two", "Three", "Five", "Seven"],
    correctIndex: 2
  },
  "erev-sukkot": {
    question: "What do the Four Species need to be checked for before Sukkot?",
    options: ["Their price", "Their kashrut (validity)", "Their age", "Their country of origin"],
    correctIndex: 1
  },
  sukkot: {
    question: "What does the sukkah's roof (schach) need to let through?",
    options: ["Sunlight only", "Rain", "A view of the stars", "Nothing at all"],
    correctIndex: 2
  },
  "hoshana-rabbah": {
    question: "Hoshana Rabbah is traditionally understood as the final close of...",
    options: ["The Omer count", "The judgment process begun on Rosh Hashanah", "The Three Weeks", "The Nine Days"],
    correctIndex: 1
  },
  "shmini-atzeret": {
    question: "What does the Midrash say Shmini Atzeret expresses?",
    options: ["A request to stay one more day together", "A national day of mourning", "A harvest festival for farmers only", "The start of a new Torah cycle"],
    correctIndex: 0
  },
  "simchat-torah": {
    question: "What happens on Simchat Torah right after finishing Deuteronomy?",
    options: ["A year-long break from Torah reading", "Immediately restarting from Genesis 1:1", "Moving on to the Prophets", "Reading only in translation"],
    correctIndex: 1
  },
  chanukah: {
    question: "What does Chanukah commemorate, according to tradition?",
    options: ["A single day's oil burning for eight", "The giving of the Torah", "The Exodus from Egypt", "The building of the sukkah"],
    correctIndex: 0
  },
  "tu-bishvat": {
    question: "What is Tu BiShvat historically used to calculate?",
    options: ["The date of Passover", "The age of fruit trees for tithing", "The start of the lunar month", "The length of a fast day"],
    correctIndex: 1
  },
  "taanit-esther": {
    question: "What does Ta'anit Esther recall?",
    options: ["Esther's three days of fasting before approaching the king", "The fall of Jerusalem", "Moses breaking the tablets", "The Exodus"],
    correctIndex: 0
  },
  purim: {
    question: "What's unique about the Book of Esther among biblical books?",
    options: ["It's written entirely in Aramaic", "God's name never appears in it", "It has no chapters", "It was written by a woman"],
    correctIndex: 1
  },
  "erev-pesach": {
    question: "What's performed the night before Erev Pesach?",
    options: ["Bedikat Chametz, the search for chametz", "The Seder", "Counting the Omer", "Havdalah"],
    correctIndex: 0
  },
  "pesach-seder-nights": {
    question: "How many cups of wine are part of the Seder?",
    options: ["Two", "Three", "Four", "Six"],
    correctIndex: 2
  },
  "pesach-chol-hamoed": {
    question: "What does 'Chol HaMoed' describe?",
    options: ["A fast day", "The intermediate, less-restricted days of a festival", "The first night of Pesach", "A holiday exclusive to Israel"],
    correctIndex: 1
  },
  "pesach-last-days": {
    question: "What do the final days of Pesach commemorate?",
    options: ["The giving of the Torah", "The splitting of the Sea of Reeds", "The building of the Temple", "The start of the Omer count"],
    correctIndex: 1
  },
  "sefirat-haomer": {
    question: "The Omer count links which two holidays?",
    options: ["Purim and Pesach", "Pesach and Shavuot", "Shavuot and Rosh Hashanah", "Sukkot and Chanukah"],
    correctIndex: 1
  },
  "lag-baomer": {
    question: "Lag BaOmer marks the yahrzeit of which sage?",
    options: ["Rabbi Akiva", "Rabbi Shimon Bar Yochai", "Hillel", "Maimonides"],
    correctIndex: 1
  },
  "erev-shavuot": {
    question: "What's the popular custom on the night of Erev Shavuot?",
    options: ["Fasting until midnight", "Staying up all night learning Torah", "Building a sukkah", "Fasting the next day"],
    correctIndex: 1
  },
  shavuot: {
    question: "Which biblical book is read on Shavuot?",
    options: ["Esther", "Ruth", "Jonah", "Lamentations"],
    correctIndex: 1
  },
  "shiva-asar-btammuz": {
    question: "The 17th of Tammuz opens which mourning period?",
    options: ["The Ten Days of Repentance", "The Three Weeks", "The Omer", "Chol HaMoed"],
    correctIndex: 1
  },
  "three-weeks": {
    question: "The Three Weeks run between the 17th of Tammuz and...",
    options: ["Rosh Hashanah", "Tisha B'Av", "Yom Kippur", "Sukkot"],
    correctIndex: 1
  },
  "tisha-bav": {
    question: "What makes Tisha B'Av especially notable historically?",
    options: ["Both Temples were destroyed on that same date", "It's the only two-day fast of the year", "It always falls on Shabbat", "It marks a military victory"],
    correctIndex: 0
  },
  "asara-btevet": {
    question: "What does the Fast of the 10th of Tevet mark the start of?",
    options: ["The Babylonian siege of Jerusalem", "The Exodus", "The building of the sukkah", "The Purim story"],
    correctIndex: 0
  },
  "pesach-sheni": {
    question: "What was Pesach Sheni originally a make-up date for?",
    options: ["Missing the shofar on Rosh Hashanah", "Missing the original Passover offering", "Missing Yom Kippur", "Missing Selichot"],
    correctIndex: 1
  },
  "yom-hashoah": {
    question: "What does Yom HaShoah commemorate?",
    options: ["Israel's independence", "The victims of the Holocaust", "The reunification of Jerusalem", "The destruction of the Temple"],
    correctIndex: 1
  },
  "yom-hazikaron": {
    question: "Yom HaZikaron is deliberately placed right before which day?",
    options: ["Yom Kippur", "Yom HaAtzma'ut (Israel's Independence Day)", "Tisha B'Av", "Shavuot"],
    correctIndex: 1
  },
  "yom-haatzmaut": {
    question: "What does Yom HaAtzma'ut mark?",
    options: ["The 1948 establishment of the State of Israel", "The signing of the Balfour Declaration", "The Six-Day War", "The founding of Jerusalem"],
    correctIndex: 0
  },
  "yom-yerushalayim": {
    question: "Yom Yerushalayim marks the reunification of Jerusalem in which year?",
    options: ["1948", "1956", "1967", "1973"],
    correctIndex: 2
  },
  "tu-bav": {
    question: "Alongside Yom Kippur, what does the Mishnah call the happiest day of the year?",
    options: ["Tu B'Av", "Purim", "Simchat Torah", "Lag BaOmer"],
    correctIndex: 0
  },
  "erev-shabbat": {
    question: "What marks the actual start of Shabbat?",
    options: ["Sunset itself", "Candle lighting before sunset", "Midnight", "The Friday night meal ending"],
    correctIndex: 1
  },
  shabbat: {
    question: "How many categories of creative work (melacha) are set aside on Shabbat?",
    options: ["10", "24", "39", "50"],
    correctIndex: 2
  },
  "rosh-chodesh": {
    question: "What does Rosh Chodesh mark?",
    options: ["The end of a fast", "The start of a new Hebrew month", "The start of a new week", "A national holiday"],
    correctIndex: 1
  },
  "generic-weekday": {
    question: "According to the reflection on ordinary days, what is most of Jewish life actually built on?",
    options: ["Only the major holidays", "Small, repeated, everyday acts", "Fasting", "Public ceremonies"],
    correctIndex: 1
  }
};

/** Auto-generated question about this week's Torah portion, using whichever
 *  book it's from — no manual authoring needed since it's already known. */
function buildTorahQuizQuestion(portion) {
  if (!portion || !portion.aliyaRef) return null;
  const book = portion.aliyaRef.split(/\s\d/)[0];
  const allBooks = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"];
  const wrong = allBooks.filter(b => b !== book).sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [book, ...wrong].sort(() => Math.random() - 0.5);
  return {
    question: `This week's Torah portion, ${portion.parashaName}, comes from which book?`,
    options,
    correctIndex: options.indexOf(book)
  };
}

/** Auto-generated question about today's featured mitzvah. */
function buildMitzvahQuizQuestion(mitzvah, allMitzvot) {
  if (!mitzvah) return null;
  const wrongPool = allMitzvot.filter(m => m.id !== mitzvah.id).sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [mitzvah.title, ...wrongPool.map(m => m.title)].sort(() => Math.random() - 0.5);
  return {
    question: `"${mitzvah.subtitle}" describes which of today's mitzvot?`,
    options,
    correctIndex: options.indexOf(mitzvah.title)
  };
}
