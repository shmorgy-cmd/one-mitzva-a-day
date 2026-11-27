/**
 * personalize.js — everything that makes the page respond to the visitor's
 * answers in the welcome box (see profile.js):
 *
 *   • "I'm Jewish" + a community → a "Your custom" box on each card showing
 *     only that community's minhagim. "Other / not sure" shows all of them.
 *   • "Just curious" → Hebrew terms become tappable (short definition pops
 *     up) and each day gets a "Why today?" note explaining the date.
 *   • "Exploring conversion" → everything "curious" gets, plus a "Taking this
 *     on" note with a practical first step and what to ask a sponsoring rabbi.
 *
 * Content lives in plain objects keyed by the same ids used in content.js,
 * mitzvot.js, prayers.js and prep.js, so adding a new occasion just means
 * adding a matching entry here.
 *
 * NOTE: minhagim genuinely vary — even within one community, by family and
 * by rabbi. These notes describe common practice and should be reviewed by
 * someone knowledgeable before being relied on.
 */

const COMMUNITY_KEYS = ["ashkenazi", "sephardi", "chabad", "litvish"];

const COMMUNITY_NAMES = {
  ashkenazi: "Ashkenazi",
  sephardi: "Sephardi / Mizrahi",
  chabad: "Chabad",
  litvish: "Litvish / Yeshivish"
};

// ---------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------

function wantsExplanations(profile) {
  return !!profile && !!profile.reason && profile.reason !== "jewish-reminders";
}

function isConverting(profile) {
  return !!profile && profile.reason === "converting";
}

/** Whose practices to show: "male", "female", or "both" (prefer not to say / not set). */
function genderView(profile) {
  const g = profile && profile.gender;
  return g === "male" || g === "female" ? g : "both";
}

/**
 * How to show a practice that belongs to `forGender` ("male" / "female"):
 * "plain" (it's yours), "label" (shown, marked whose it is), or null (hidden).
 * "Show me everything" turns every null into "label".
 */
function genderShow(forGender, profile) {
  const v = genderView(profile);
  if (v === forGender) return "plain";
  if (v === "both") return "label";
  return profile && profile.showAll ? "label" : null;
}

/** "Why am I seeing this?" for a gender label. */
function genderWhy(profile) {
  const g = profile && profile.gender;
  const base = profile && profile.showAll && (g === "male" || g === "female")
    ? "Shown because \"Show me everything\" is on in Settings."
    : g === "unspecified"
      ? "Shown because you chose \"Prefer not to say\" in Settings, so you see practices for everyone."
      : "Shown with a label because you haven't chosen male or female in Settings.";
  return base + " You can change this in Settings (⚙ at the top).";
}

// Tapping anywhere else closes an open label explanation.
document.addEventListener("click", () => {
  document.querySelectorAll(".g-tag-why:not([hidden])").forEach(w => {
    w.hidden = true;
    w.previousElementSibling.setAttribute("aria-expanded", "false");
  });
});

/** A small label ("For men", "For women"…) that explains itself when tapped. */
function genderTag(text, profile) {
  const wrap = pzEl("span", "g-tag-wrap");
  const btn = pzEl("button", "g-tag", text);
  btn.type = "button";
  btn.setAttribute("aria-expanded", "false");
  const why = pzEl("span", "g-tag-why", genderWhy(profile));
  why.hidden = true;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    why.hidden = !why.hidden;
    btn.setAttribute("aria-expanded", String(!why.hidden));
  });
  wrap.appendChild(btn);
  wrap.appendChild(why);
  return wrap;
}

function isJewishProfile(profile) {
  return !!profile && (String(profile.reason).startsWith("jewish-") || profile.reason === "converted");
}

// ---------------------------------------------------------------------
// Glossary — tap-to-explain terms for "curious" and "converting" visitors
// ---------------------------------------------------------------------

const GLOSSARY = [
  // Core concepts
  { terms: ["halacha", "halachic", "halachically"], he: "הלכה", def: "Jewish law — the practical rules for living out the Torah's commandments." },
  { terms: ["minhag", "minhagim"], he: "מנהג", def: "A custom a community has kept for generations. Not strictly law, but taken seriously — and often different between communities." },
  { terms: ["mitzvah", "mitzvot", "mitzva"], he: "מצוה", def: "A commandment — and, more loosely, any good deed. Tradition counts 613 in the Torah." },
  { terms: ["Torah"], he: "תורה", def: "Narrowly, the Five Books of Moses; more broadly, all of Jewish teaching built on them." },
  { terms: ["Tanach"], he: "תנ״ך", def: "The Hebrew Bible: Torah (teaching), Nevi'im (Prophets) and Ketuvim (Writings)." },
  { terms: ["Talmud"], he: "תלמוד", def: "The great compilation of rabbinic debate on Jewish law and lore, completed around 500 CE." },
  { terms: ["Mishnah"], he: "משנה", def: "The first written code of the Oral Torah (around 200 CE); the Talmud is built around it." },
  { terms: ["Midrash"], he: "מדרש", def: "Rabbinic stories and interpretations that fill in and explain the Bible's text." },
  { terms: ["the Sages", "Sages"], def: "The rabbis of the Mishnah and Talmud era, whose teachings shape Jewish law and thought." },
  { terms: ["teshuva", "teshuvah"], he: "תשובה", def: "'Return' — repentance: recognizing a wrong, regretting it, and committing to change." },
  { terms: ["tzedakah"], he: "צדקה", def: "Giving to those in need. The word comes from 'tzedek' — justice." },
  { terms: ["kashrut", "kosher"], he: "כשרות", def: "The Jewish dietary laws. 'Kosher' means fit or valid — for food, and also for ritual objects." },
  { terms: ["melacha"], he: "מלאכה", def: "Creative work. The 39 categories of melacha are set aside on Shabbat and Yom Tov." },
  { terms: ["Mashiach", "Moshiach"], he: "משיח", def: "The Messiah — a future king from King David's line who will bring the final redemption." },
  { terms: ["Beit HaMikdash"], he: "בית המקדש", def: "The Holy Temple in Jerusalem. The First was destroyed in 586 BCE, the Second in 70 CE." },
  { terms: ["Kabbalah", "Kabbalistic", "Kabbalists"], he: "קבלה", def: "Jewish mysticism — teachings about God's inner workings and the soul." },
  { terms: ["sefirot"], he: "ספירות", def: "In Kabbalah, the ten attributes (like kindness and discipline) through which God relates to the world." },
  { terms: ["Zohar"], he: "זוהר", def: "The central text of Kabbalah, attributed to Rabbi Shimon bar Yochai." },

  // Calendar
  { terms: ["Erev"], he: "ערב", def: "'Eve' — the day before a holiday. Jewish days begin at sundown, so the holiday itself starts that evening." },
  { terms: ["Motzei Shabbat"], he: "מוצאי שבת", def: "Saturday night, after Shabbat has ended." },
  { terms: ["Rosh Chodesh"], he: "ראש חודש", def: "The 'head of the month' — the start of each Hebrew month, at the new moon." },
  { terms: ["Yom Tov"], he: "יום טוב", def: "A biblical festival day. Rest is like Shabbat, except cooking for that day's needs is allowed." },
  { terms: ["Chol HaMoed"], he: "חול המועד", def: "The intermediate days of Sukkot and Pesach — still festive, with fewer restrictions." },
  { terms: ["Nisan"], he: "ניסן", def: "The first month of the Hebrew calendar (March–April), when Pesach falls." },
  { terms: ["Iyar"], he: "אייר", def: "The second Hebrew month (April–May)." },
  { terms: ["Sivan"], he: "סיון", def: "The third Hebrew month (May–June), when Shavuot falls." },
  { terms: ["Tammuz"], he: "תמוז", def: "The fourth Hebrew month (June–July)." },
  { terms: ["Elul"], he: "אלול", def: "The sixth Hebrew month (August–September), a month of reflection before Rosh Hashanah." },
  { terms: ["Tishrei"], he: "תשרי", def: "The seventh Hebrew month (September–October), home to Rosh Hashanah, Yom Kippur and Sukkot." },
  { terms: ["Kislev"], he: "כסלו", def: "The ninth Hebrew month (November–December), when Chanukah begins." },
  { terms: ["Tevet"], he: "טבת", def: "The tenth Hebrew month (December–January)." },
  { terms: ["Shevat"], he: "שבט", def: "The eleventh Hebrew month (January–February)." },
  { terms: ["Adar"], he: "אדר", def: "The twelfth Hebrew month (February–March), when Purim falls. Leap years have two Adars." },

  // Holidays
  { terms: ["Shabbat"], he: "שבת", def: "The Sabbath — from Friday sunset until Saturday nightfall, a day of rest from creative work." },
  { terms: ["Rosh Hashanah", "Rosh Hashana"], he: "ראש השנה", def: "The Jewish New Year (1–2 Tishrei): a day of judgment, and of crowning God as King." },
  { terms: ["Yom Kippur"], he: "יום כפור", def: "The Day of Atonement (10 Tishrei): a 25-hour fast of prayer and repentance." },
  { terms: ["Sukkot"], he: "סוכות", def: "The autumn Festival of Booths (15–21 Tishrei), when meals are eaten in a sukkah." },
  { terms: ["Hoshana Rabbah"], he: "הושענא רבה", def: "The seventh day of Sukkot, seen as the final sealing of the year's judgment." },
  { terms: ["Shmini Atzeret"], he: "שמיני עצרת", def: "The 'Eighth Day of Assembly', a separate holiday right after Sukkot." },
  { terms: ["Simchat Torah"], he: "שמחת תורה", def: "'Rejoicing of the Torah' — the day the yearly Torah reading ends and starts again." },
  { terms: ["Chanukah"], he: "חנוכה", def: "The eight-day winter Festival of Lights, from 25 Kislev." },
  { terms: ["Purim"], he: "פורים", def: "The festival of the Book of Esther (14 Adar), celebrating the Jews' rescue from Haman's plot." },
  { terms: ["Pesach"], he: "פסח", def: "Passover — the spring festival of the Exodus from Egypt (15 Nisan)." },
  { terms: ["Shavuot"], he: "שבועות", def: "The festival of the giving of the Torah (6 Sivan), seven weeks after Pesach." },
  { terms: ["Tisha B'Av"], he: "תשעה באב", def: "The 9th of Av — the fast day mourning the destruction of both Temples." },
  { terms: ["Tu B'Av"], he: "ט״ו באב", def: "The 15th of Av, a day of joy and love." },
  { terms: ["Lag BaOmer"], he: "ל״ג בעומר", def: "The 33rd day of the Omer count — a break from mourning, with bonfires and celebrations." },
  { terms: ["Three Weeks"], def: "The mourning period from 17 Tammuz to Tisha B'Av." },
  { terms: ["Nine Days"], def: "The first nine days of Av — the most intense part of the mourning before Tisha B'Av." },
  { terms: ["Bein HaMetzarim"], he: "בין המצרים", def: "'Between the straits' — another name for the Three Weeks." },
  { terms: ["Ta'anit"], he: "תענית", def: "A fast day." },
  { terms: ["Shabbat Mevarchim"], def: "The Shabbat before Rosh Chodesh, when the coming month is announced in synagogue." },

  // High Holidays
  { terms: ["Selichot"], he: "סליחות", def: "'Forgivenesses' — penitential prayers said before and during the High Holidays." },
  { terms: ["shofar"], he: "שופר", def: "A ram's horn, blown like a trumpet on Rosh Hashanah and through the month of Elul." },
  { terms: ["Tashlich"], he: "תשליך", def: "A Rosh Hashanah ceremony at flowing water, symbolically 'casting away' sins." },
  { terms: ["simanim"], he: "סימנים", def: "Symbolic foods eaten on Rosh Hashanah, each paired with a wish for the new year." },
  { terms: ["Yehi Ratzon"], he: "יהי רצון", def: "'May it be Your will' — the opening words of the wish said over each Rosh Hashanah symbolic food." },
  { terms: ["Avinu Malkeinu"], he: "אבינו מלכנו", def: "'Our Father, our King' — a litany of requests said on fast days and the High Holidays." },
  { terms: ["hatarat nedarim"], he: "התרת נדרים", def: "Annulment of vows before the new year, said before three men acting as a court." },
  { terms: ["Kapparot"], he: "כפרות", def: "A pre-Yom Kippur custom: a chicken or money is circled overhead and then given to charity." },
  { terms: ["malkot"], he: "מלקות", def: "Symbolic light lashes given before Yom Kippur, as a prompt to repent." },
  { terms: ["Kol Nidrei"], he: "כל נדרי", def: "The solemn opening prayer of Yom Kippur eve, annulling vows." },
  { terms: ["kittel"], def: "A plain white robe worn on Yom Kippur (and by some at the Seder)." },
  { terms: ["Vidui"], he: "וידוי", def: "Confession — a list of wrongs said aloud, in the plural, on Yom Kippur." },
  { terms: ["Ne'ilah"], he: "נעילה", def: "'Closing' — the final prayer of Yom Kippur, as the gates of heaven are pictured closing." },
  { terms: ["Yizkor"], he: "יזכור", def: "A memorial prayer for departed relatives, said on certain holidays." },
  { terms: ["Hashkavah"], he: "השכבה", def: "A Sephardi memorial prayer for the departed." },
  { terms: ["machzor"], he: "מחזור", def: "The special prayer book for the High Holidays and festivals." },
  { terms: ["pat Yisrael"], def: "Bread baked with a Jew's involvement — some are careful to eat only this during the Ten Days." },

  // Sukkot
  { terms: ["sukkah"], he: "סוכה", def: "A temporary hut with a leafy roof, where meals are eaten during Sukkot." },
  { terms: ["schach"], he: "סכך", def: "The roof covering of a sukkah — cut plant material like branches or bamboo." },
  { terms: ["Four Species"], def: "Lulav (palm), etrog (citron), hadassim (myrtle) and aravot (willow), held together and waved on Sukkot." },
  { terms: ["lulav"], he: "לולב", def: "A palm branch — the biggest of the Four Species; often used to mean the whole bundle." },
  { terms: ["etrog"], he: "אתרוג", def: "A citron — a fragrant citrus fruit, one of the Four Species." },
  { terms: ["Ushpizin"], he: "אושפיזין", def: "'Guests' — seven biblical figures symbolically welcomed into the sukkah, one each night." },
  { terms: ["Hoshanot"], he: "הושענות", def: "Prayers for salvation said while circling the synagogue with the lulav on Sukkot." },
  { terms: ["Hakafot"], he: "הקפות", def: "Joyful circuits around the synagogue — with the Torah scrolls on Simchat Torah." },
  { terms: ["Geshem", "Tefillat Geshem"], he: "גשם", def: "The prayer for rain, first said on Shmini Atzeret." },

  // Chanukah / Purim
  { terms: ["chanukiah", "menorah"], he: "חנוכיה", def: "The Chanukah lamp: eight lights plus a helper light (the shamash)." },
  { terms: ["shamash"], he: "שמש", def: "The 'helper' candle used to light the other Chanukah lights." },
  { terms: ["Al HaNissim"], he: "על הניסים", def: "'For the miracles' — a paragraph added to prayers and Grace After Meals on Chanukah and Purim." },
  { terms: ["Megillah", "Megillat"], he: "מגילה", def: "A scroll — usually the Book of Esther, read aloud on Purim." },
  { terms: ["Mishloach Manot"], he: "משלוח מנות", def: "Gifts of ready-to-eat food sent to friends on Purim." },
  { terms: ["Matanot La'evyonim"], he: "מתנות לאביונים", def: "Gifts to the poor — at least two people — on Purim." },
  { terms: ["Machatzit HaShekel", "Half-Shekel"], he: "מחצית השקל", def: "A pre-Purim donation recalling the half-shekel each Israelite gave to the Temple." },
  { terms: ["hamantaschen"], def: "Triangular filled cookies eaten on Purim." },

  // Pesach / Omer / Shavuot
  { terms: ["chametz"], he: "חמץ", def: "Leavened grain products — bread, pasta, beer and the like — forbidden on Pesach." },
  { terms: ["shmurah matzah"], he: "מצה שמורה", def: "Matzah 'guarded' from any contact with water from harvest on, often baked by hand." },
  { terms: ["matzah"], he: "מצה", def: "Unleavened bread, eaten on Pesach." },
  { terms: ["maror"], he: "מרור", def: "Bitter herbs at the Seder, recalling the bitterness of slavery." },
  { terms: ["charoset"], he: "חרוסת", def: "A sweet paste of fruit, nuts and wine at the Seder, recalling the mortar of slavery." },
  { terms: ["karpas"], he: "כרפס", def: "A vegetable dipped in salt water near the start of the Seder." },
  { terms: ["Seder"], he: "סדר", def: "'Order' — the ritual Pesach meal retelling the Exodus." },
  { terms: ["Haggadah"], he: "הגדה", def: "The book that guides the Pesach Seder." },
  { terms: ["Bedikat Chametz"], he: "בדיקת חמץ", def: "The search for chametz by candlelight on the night before Pesach." },
  { terms: ["Biur Chametz"], he: "ביעור חמץ", def: "Burning the last chametz on the morning before Pesach." },
  { terms: ["mechirat chametz"], he: "מכירת חמץ", def: "Selling one's chametz to a non-Jew, through a rabbi, for the length of Pesach." },
  { terms: ["kitniyot"], he: "קטניות", def: "Rice, corn, beans and similar foods — avoided on Pesach by Ashkenazim, eaten by most Sephardim." },
  { terms: ["gebrochts"], def: "Matzah that has touched liquid — avoided on Pesach in Chabad and many Chassidic homes." },
  { terms: ["siyum"], he: "סיום", def: "A celebration on finishing a tractate of Talmud or another major text." },
  { terms: ["Mimouna"], def: "A North African celebration on the night Pesach ends, with open houses and sweets." },
  { terms: ["Omer"], he: "עומר", def: "A barley offering. 'Counting the Omer' is the 49-day count from Pesach to Shavuot." },
  { terms: ["upsherin", "chalakah"], def: "A three-year-old boy's first haircut, a festive milestone." },
  { terms: ["Tikkun Leil Shavuot"], he: "תיקון ליל שבועות", def: "All-night Torah study on the first night of Shavuot." },
  { terms: ["Akdamut"], def: "An Aramaic poem sung before the Torah reading on Shavuot in Ashkenazi synagogues." },
  { terms: ["Azharot"], def: "Poems listing the 613 commandments, read by Sephardim on Shavuot." },
  { terms: ["Ketubah"], he: "כתובה", def: "A Jewish marriage contract." },

  // Mourning
  { terms: ["Eichah"], he: "איכה", def: "The Book of Lamentations, read on Tisha B'Av." },
  { terms: ["Kinot"], he: "קינות", def: "Elegies recited on the morning of Tisha B'Av." },
  { terms: ["Kaddish"], he: "קדיש", def: "A prayer praising God, said by mourners and to mark sections of the service." },
  { terms: ["yahrzeit"], def: "The yearly anniversary of a death, marked with a candle and Kaddish." },
  { terms: ["Vayechal"], def: "The Torah reading for public fast days (Exodus 32 and 34)." },

  // Prayer
  { terms: ["siddur"], he: "סידור", def: "The everyday prayer book." },
  { terms: ["minyan"], he: "מנין", def: "A prayer quorum of ten adult Jewish men, needed for some prayers." },
  { terms: ["chazzan"], he: "חזן", def: "The cantor or prayer leader." },
  { terms: ["Nusach"], he: "נוסח", def: "A version of the prayer text — Ashkenaz, Sefard, Edot HaMizrach, or Ari (Chabad)." },
  { terms: ["Edot HaMizrach"], def: "The prayer rite of Sephardi and Mizrahi communities." },
  { terms: ["Shacharit"], he: "שחרית", def: "The morning prayer." },
  { terms: ["Mincha"], he: "מנחה", def: "The afternoon prayer." },
  { terms: ["Maariv", "Ma'ariv", "Arvit"], he: "מעריב", def: "The evening prayer." },
  { terms: ["Musaf"], he: "מוסף", def: "The 'additional' prayer service on Shabbat, festivals and Rosh Chodesh." },
  { terms: ["Amidah"], he: "עמידה", def: "The 'standing prayer' — the central silent prayer of every service, said facing Jerusalem." },
  { terms: ["Shema"], he: "שמע", def: "'Hear, O Israel' — the declaration of God's oneness, said morning and night." },
  { terms: ["Pesukei D'Zimra"], he: "פסוקי דזמרה", def: "Psalms and verses of praise that open the morning service." },
  { terms: ["Ashrei"], he: "אשרי", def: "Psalm 145 with a few added verses, said three times a day." },
  { terms: ["Korbanot"], he: "קרבנות", def: "Passages about the Temple offerings, said in place of the sacrifices." },
  { terms: ["Tachanun"], he: "תחנון", def: "A short prayer of supplication after the Amidah, left out on happy days." },
  { terms: ["Hallel"], he: "הלל", def: "Psalms 113–118, sung as praise on festivals and Rosh Chodesh." },
  { terms: ["Haftarah"], he: "הפטרה", def: "A reading from the Prophets that follows the Torah reading." },
  { terms: ["aliyah", "aliyot"], he: "עליה", def: "Being called up to the Torah to bless the reading. (It also means moving to Israel.)" },
  { terms: ["Kiddush"], he: "קידוש", def: "The blessing over wine that sanctifies Shabbat or a festival." },
  { terms: ["Havdalah"], he: "הבדלה", def: "The ceremony with wine, spices and a braided candle that ends Shabbat." },
  { terms: ["Kabbalat Shabbat"], he: "קבלת שבת", def: "Psalms and songs welcoming Shabbat on Friday evening." },
  { terms: ["Shehecheyanu"], he: "שהחיינו", def: "The blessing thanking God 'who has kept us alive' to reach a new season or experience." },
  { terms: ["Thirteen Attributes"], def: "God's thirteen attributes of mercy (Exodus 34:6–7), the heart of Selichot." },
  { terms: ["piyyutim", "piyyut"], he: "פיוט", def: "Liturgical poems added to the prayers on special days." },
  { terms: ["zmanim"], he: "זמנים", def: "Halachic times of day, calculated from sunrise and sunset where you are." },
  { terms: ["chatzot"], he: "חצות", def: "Halachic midday — exactly halfway between sunrise and sunset." },
  { terms: ["alot hashachar"], he: "עלות השחר", def: "Dawn — the first light, well before sunrise." },
  { terms: ["tzeit hakochavim"], he: "צאת הכוכבים", def: "Nightfall — when three medium stars are visible." },
  { terms: ["Shnayim Mikra"], def: "Reviewing the week's Torah portion twice, plus its Aramaic translation, before Shabbat." },

  // Objects & everyday practice
  { terms: ["tefillin"], he: "תפילין", def: "Black leather boxes holding Torah passages, worn on the arm and head during weekday morning prayers." },
  { terms: ["tallit katan"], he: "טלית קטן", def: "A small four-cornered garment with tzitzit, worn under or over a shirt all day." },
  { terms: ["tallit"], he: "טלית", def: "A prayer shawl with tzitzit on its four corners." },
  { terms: ["tzitzit"], he: "ציצית", def: "Knotted fringes on the corners of a four-cornered garment." },
  { terms: ["mezuzah", "mezuzot"], he: "מזוזה", def: "A parchment scroll with the Shema, fixed to the doorposts of a Jewish home." },
  { terms: ["sofer"], he: "סופר", def: "A scribe trained to write Torah scrolls, tefillin and mezuzot." },
  { terms: ["mikveh"], he: "מקוה", def: "A pool of natural water used for ritual immersion — including as the final step of conversion." },
  { terms: ["challah"], he: "חלה", def: "Braided (round on Rosh Hashanah) bread for Shabbat and holidays." },
  { terms: ["Birkat Hamazon"], he: "ברכת המזון", def: "Grace after a meal with bread." },
  { terms: ["zimun"], he: "זימון", def: "The short call-and-response that opens Grace After Meals when three or more ate together." },
  { terms: ["bencher"], def: "A small booklet with Grace After Meals and Shabbat songs." },
  { terms: ["HaMotzi"], he: "המוציא", def: "The blessing over bread." },
  { terms: ["negel vasser"], def: "Yiddish for 'nail water' — washing hands from a cup right on waking." },
  { terms: ["genizah"], he: "גניזה", def: "A storage place for worn-out sacred texts until they're buried." },
  { terms: ["Chumash"], he: "חומש", def: "A printed Torah (the Five Books of Moses), usually with commentary." },
  { terms: ["Tehillim"], he: "תהילים", def: "The Book of Psalms." },
  { terms: ["Kiddush cup"], def: "The cup used for the blessing over wine." },
  { terms: ["cholent", "hamin", "dafina"], def: "A stew slow-cooked from Friday afternoon until Shabbat lunch." },
  { terms: ["kreplach"], def: "Meat-filled dumplings, traditional on a few days of the year." },
  { terms: ["lekach"], def: "Yiddish for honey cake." },

  // Communities & people
  { terms: ["Ashkenazi", "Ashkenazim"], def: "Jews whose ancestors lived in Central and Eastern Europe." },
  { terms: ["Sephardi", "Sephardim", "Mizrahi"], def: "Jews of Spanish/Portuguese origin (Sephardi) and of the Middle East and North Africa (Mizrahi); they share many customs." },
  { terms: ["Chabad"], def: "A Chassidic movement known for outreach, led until 1994 by the Lubavitcher Rebbe." },
  { terms: ["Chassidic", "Chassidim", "Chassidut"], def: "Of Chassidism — the joyful, mystical movement founded by the Baal Shem Tov in the 1700s." },
  { terms: ["Rebbe"], def: "A Chassidic leader. In Chabad, 'the Rebbe' means Rabbi Menachem Mendel Schneerson (1902–1994)." },
  { terms: ["Baal Shem Tov"], def: "Rabbi Israel ben Eliezer (1698–1760), founder of Chassidism." },
  { terms: ["Arizal"], def: "Rabbi Isaac Luria (1534–1572), the great Kabbalist of Safed, whose customs shape Sephardi and Chassidic practice." },
  { terms: ["Shulchan Aruch"], def: "The classic code of Jewish law by Rabbi Yosef Karo (1565) — the main authority for Sephardim." },
  { terms: ["Rema"], def: "Rabbi Moshe Isserles (1530–1572), whose notes on the Shulchan Aruch record Ashkenazi practice." },
  { terms: ["Mishnah Berurah"], def: "A commentary by the Chafetz Chaim (early 1900s), the main guide to daily Ashkenazi practice." },
  { terms: ["Vilna Gaon"], def: "Rabbi Eliyahu of Vilna (1720–1797), the towering Lithuanian scholar whose customs many Litvish Jews follow." },
  { terms: ["farbrengen"], def: "A Chassidic gathering of stories, songs, teachings and l'chaim." },
  { terms: ["Chitas"], def: "Chabad's daily study of Chumash, Tehillim and Tanya." },
  { terms: ["Tanya"], def: "The foundational book of Chabad thought, by the Alter Rebbe (1745–1812)." },
  { terms: ["Ohel"], def: "The Lubavitcher Rebbe's resting place in Queens, New York." },
  { terms: ["Mussar"], he: "מוסר", def: "The study and practice of Jewish ethics and character improvement." },
  { terms: ["Daf Yomi"], def: "Learning one page of Talmud a day, finishing the whole Talmud in about seven and a half years." },
  { terms: ["beit midrash"], he: "בית מדרש", def: "A study hall." },
  { terms: ["Rabbeinu Tam"], def: "A 12th-century scholar. 'Rabbeinu Tam tefillin' hold the same passages in a different order." }
];

let GLOSS_RE = null;
const GLOSS_LOOKUP = new Map();

function reEscape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildGlossary() {
  const all = [];
  GLOSSARY.forEach((g, i) => g.terms.forEach(t => {
    GLOSS_LOOKUP.set(t.toLowerCase(), i);
    all.push(t);
  }));
  all.sort((a, b) => b.length - a.length); // longest first, so "Lag BaOmer" wins over "Omer"
  GLOSS_RE = new RegExp(`(^|[^A-Za-z])(${all.map(reEscape).join("|")})(?![A-Za-z])`, "gi");
}

/** Returns safe HTML for `text`. For curious/converting visitors, the first
 *  occurrence (per card — tracked in `used`) of each glossary term becomes a
 *  tappable button that opens a short definition. */
function glossify(text, profile, used) {
  const safe = escapeHtml(text == null ? "" : text);
  if (!wantsExplanations(profile)) return safe;
  if (!GLOSS_RE) buildGlossary();
  return safe.replace(GLOSS_RE, (whole, pre, term) => {
    const idx = GLOSS_LOOKUP.get(term.toLowerCase());
    if (idx === undefined || (used && used.has(idx))) return whole;
    if (used) used.add(idx);
    return `${pre}<button type="button" class="term" data-term="${idx}" aria-haspopup="dialog">${term}</button>`;
  });
}

// --- Definition popover ------------------------------------------------

let termPopover = null;
let termPopoverAnchor = null;

function closeTermPopover() {
  if (termPopover) termPopover.remove();
  if (termPopoverAnchor) termPopoverAnchor.setAttribute("aria-expanded", "false");
  termPopover = null;
  termPopoverAnchor = null;
}

function openTermPopover(btn) {
  const entry = GLOSSARY[parseInt(btn.dataset.term, 10)];
  if (!entry) return;
  if (termPopoverAnchor === btn) { closeTermPopover(); return; }
  closeTermPopover();

  const pop = document.createElement("div");
  pop.className = "term-popover";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", entry.terms[0]);

  const head = document.createElement("div");
  head.className = "term-popover-head";
  const name = document.createElement("strong");
  name.textContent = entry.terms[0].charAt(0).toUpperCase() + entry.terms[0].slice(1);
  head.appendChild(name);
  if (entry.he) {
    const he = document.createElement("span");
    he.className = "term-popover-he";
    he.lang = "he";
    he.dir = "rtl";
    he.textContent = entry.he;
    head.appendChild(he);
  }
  pop.appendChild(head);

  const def = document.createElement("p");
  def.textContent = entry.def;
  pop.appendChild(def);

  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect();
  const w = pop.offsetWidth;
  const left = Math.max(12, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - w - 12));
  pop.style.left = `${left}px`;
  pop.style.top = `${r.bottom + window.scrollY + 8}px`;

  btn.setAttribute("aria-expanded", "true");
  termPopover = pop;
  termPopoverAnchor = btn;
}

function initTermPopover() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".term");
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      openTermPopover(btn);
      return;
    }
    if (termPopover && !termPopover.contains(e.target)) closeTermPopover();
  }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeTermPopover(); });
  window.addEventListener("resize", closeTermPopover);
}

document.addEventListener("DOMContentLoaded", initTermPopover);

// ---------------------------------------------------------------------
// Box renderers
// ---------------------------------------------------------------------

function pzEl(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/** "Your custom" box for "I'm Jewish" visitors. With a specific community,
 *  shows only that community; with "Other / not sure", shows each one. */
function renderMinhagBox(minhagim, profile) {
  if (!minhagim || !profile || !profile.community) return null;
  const c = profile.community;
  const box = pzEl("div", "minhag-box");

  if (c && COMMUNITY_KEYS.includes(c)) {
    const items = minhagim[c];
    if (!items || !items.length) return null;
    box.appendChild(pzEl("p", "minhag-box-label", `Your custom · ${escapeHtml(COMMUNITY_NAMES[c])}`));
    const ul = pzEl("ul", "minhag-list");
    items.forEach(i => ul.appendChild(pzEl("li", null, escapeHtml(i))));
    box.appendChild(ul);
  } else {
    const present = COMMUNITY_KEYS.filter(k => minhagim[k] && minhagim[k].length);
    if (!present.length) return null;
    box.appendChild(pzEl("p", "minhag-box-label", "How different communities do it"));
    present.forEach(k => {
      box.appendChild(pzEl("p", "minhag-community", escapeHtml(COMMUNITY_NAMES[k])));
      const ul = pzEl("ul", "minhag-list");
      minhagim[k].forEach(i => ul.appendChild(pzEl("li", null, escapeHtml(i))));
      box.appendChild(ul);
    });
  }
  box.appendChild(pzEl("p", "minhag-box-foot", "Customs vary even within a community — your family's tradition and your rabbi's guidance come first."));
  return box;
}

/** "Why today?" box for curious/converting visitors. */
function renderWhyBox(text, profile, used, hebrewToday) {
  if (!text || !wantsExplanations(profile)) return null;
  const box = pzEl("div", "why-box");
  box.appendChild(pzEl("p", "why-box-label", "Why today?"));
  if (hebrewToday) {
    box.appendChild(pzEl("p", "why-box-date", `On the Hebrew calendar this is <strong>${escapeHtml(hebrewToday)}</strong>. Jewish days run from sundown to sundown, so each date — and each holiday — begins the evening before.`));
  }
  box.appendChild(pzEl("p", null, glossify(text, profile, used)));
  return box;
}

/** "Taking this on" box — practical first steps, conversion visitors only. */
function renderTakingOnBox(text, profile, used) {
  if (!text || !isConverting(profile)) return null;
  const box = pzEl("div", "takingon-box");
  box.appendChild(pzEl("p", "takingon-box-label", "Taking this on"));
  box.appendChild(pzEl("p", null, glossify(text, profile, used)));
  return box;
}

// ---------------------------------------------------------------------
// Occasion content (keyed by content.js ids)
// ---------------------------------------------------------------------

/** Shared Torah-reading notes for the minor public fasts. */
function fastMinhagim(extra) {
  const base = {
    ashkenazi: ["Selichot and Avinu Malkeinu are added to the prayers; Vayechal is read from the Torah at Shacharit and Mincha, with a Haftarah at Mincha."],
    sephardi: ["Selichot are said in the morning; Vayechal is read at Shacharit and Mincha, but most Sephardi communities read no Haftarah at Mincha."],
    chabad: ["Selichot are added, and Vayechal is read at Shacharit and Mincha, with a Haftarah at Mincha."],
    litvish: ["Selichot and Avinu Malkeinu are added; Vayechal is read at Shacharit and Mincha, with a Haftarah at Mincha, per the Mishnah Berurah."]
  };
  const out = {};
  COMMUNITY_KEYS.forEach(k => { out[k] = [...base[k], ...((extra && extra[k]) || [])]; });
  return out;
}

const FAST_TAKING_ON = "Ask your rabbi when to start keeping the minor fasts. Many people begin by fasting part of the day, or by simply learning the story behind the fast and giving a little extra tzedakah.";

const OCCASION_EXTRAS = {
  "elul-general": {
    why: "Elul is the last month of the Jewish year, the month before Rosh Hashanah. The Hebrew calendar follows the moon, with a leap month added seven times every 19 years to keep it in step with the seasons — so Elul always lands around August–September, but on different secular dates each year.",
    takingOn: "Choose one small practice for the month — hearing the shofar at a weekday morning service, or reading Psalm 27 once a day, even in English. If you have a sponsoring rabbi, Elul is a natural time to ask what they'd like you to focus on before the High Holidays.",
    minhagim: {
      ashkenazi: [
        "The shofar is blown after Shacharit every weekday from Rosh Chodesh Elul until the day before Rosh Hashanah (not on Erev Rosh Hashanah itself).",
        "Psalm 27 (L'David Hashem Ori) is added after Shacharit and again at Mincha or Maariv, depending on your siddur.",
        "Selichot don't begin until the Motzei Shabbat before Rosh Hashanah."
      ],
      sephardi: [
        "Selichot are said every weekday from the start of Elul until Yom Kippur — usually before dawn, before Shacharit.",
        "The shofar is generally sounded during the Selichot service itself, rather than as a separate blast after Shacharit."
      ],
      chabad: [
        "The shofar after Shacharit and Psalm 27 at Shacharit and Mincha, as in Ashkenazi practice.",
        "From Chai Elul (the 18th), three extra chapters of Tehillim are said each day, finishing all 150 by Yom Kippur.",
        "Chai Elul is the birthday of the Baal Shem Tov and of the Alter Rebbe, marked with a farbrengen.",
        "It's customary to have tefillin and mezuzot checked by a sofer this month."
      ],
      litvish: [
        "Elul is treated as a time of intense learning and self-examination — in yeshivos, 'Elul zman' is the most serious term of the year.",
        "Mussar study is emphasized, in the tradition of Rabbi Yisrael Salanter.",
        "Shofar after Shacharit and Psalm 27 follow standard Ashkenazi practice; Selichot begin the Motzei Shabbat before Rosh Hashanah."
      ]
    }
  },
  "selichot-start": {
    why: "Ashkenazi custom wants at least four days of Selichot before Rosh Hashanah, so they start on the Saturday night before it. If Rosh Hashanah falls on a Monday or Tuesday, that wouldn't leave four days, so Selichot start a week earlier.",
    takingOn: "Go to the first-night Selichot at a local synagogue. It's usually well attended and atmospheric, and nobody expects you to follow the Hebrew — an English translation is fine.",
    minhagim: {
      ashkenazi: ["The first service is held after midnight on Motzei Shabbat; after that, Selichot are said each weekday morning before Shacharit."],
      chabad: ["The first Selichot is held after midnight on Motzei Shabbat, then each morning before Shacharit, using the Nusach Ari text."],
      litvish: ["The first Selichot after midnight on Motzei Shabbat is a central gathering in many yeshivos; afterwards they're said each morning before Shacharit."],
      sephardi: ["Sephardim have already been saying Selichot since the start of Elul."]
    }
  },
  "selichot-start-sephardi": {
    why: "Sephardi custom starts Selichot right after Rosh Chodesh Elul. The 40 days from then until Yom Kippur mirror the 40 days Moses spent on Mount Sinai before bringing down the second tablets — a time of forgiveness.",
    takingOn: "Try attending Selichot once this week — many Sephardi synagogues sing well-known melodies, which makes it easy to join in even before you know the words.",
    minhagim: {
      sephardi: ["Selichot are sung with beloved melodies such as 'Adon HaSelichot' and 'Anshei Emunah', usually before dawn."]
    }
  },
  "erev-rosh-hashana": {
    why: "Rosh Hashanah is on 1 Tishrei. Because Jewish days start at sundown, the holiday begins this evening — 'Erev' just means 'eve'.",
    takingOn: "Help prepare a plate of simanim, or ask a friend whether you can join their first-night meal. Blessings that say 'who has commanded us' are a question to ask your rabbi about before conversion.",
    minhagim: {
      ashkenazi: [
        "Hatarat nedarim (annulment of vows) after Shacharit, in front of three men.",
        "Extended early-morning Selichot ('Zechor Brit'), but no shofar today — to separate Elul's custom from the holiday's commandment."
      ],
      sephardi: [
        "Hatarat nedarim after Shacharit is widespread.",
        "Families prepare the Seder Yehi Ratzon foods for both nights: dates, pomegranate, black-eyed peas, leeks, beets or chard, gourd, and a head of a fish or lamb."
      ],
      chabad: [
        "Hatarat nedarim after Shacharit, and no shofar today.",
        "Many write a 'pan' — a letter asking for a blessing — to be read at the Ohel before the new year."
      ],
      litvish: ["Hatarat nedarim after Shacharit, Zechor Brit Selichot, and no shofar today, per the Mishnah Berurah."]
    }
  },
  "rosh-hashana": {
    why: "Rosh Hashanah is on 1 and 2 Tishrei. It's two days everywhere, even in Israel: in ancient times the new moon that starts the month couldn't be confirmed in time, so both days were kept — and they're treated as one long holy day.",
    takingOn: "Hear the shofar in person. Many synagogues offer free or low-cost seats to newcomers — tell them you're exploring Judaism and they'll usually help you find a seat and a machzor with English.",
    minhagim: {
      ashkenazi: [
        "Apple dipped in honey after HaMotzi on the first night; many avoid nuts, because the Hebrew word for nut ('egoz') has nearly the same numerical value as the word for sin.",
        "Tashlich on the first afternoon — or the second, if the first day is Shabbat.",
        "Challah is dipped in honey instead of salt from now until Hoshana Rabbah."
      ],
      sephardi: [
        "The full Seder Yehi Ratzon on both nights, with a short wish over each symbolic food.",
        "Many congregations sound the shofar during the silent Musaf Amidah as well, following the Arizal."
      ],
      chabad: [
        "Apple in honey, pomegranate and the head of a fish or ram on the first night; nuts are avoided.",
        "Many say the whole Book of Tehillim over the two days, try not to sleep in the daytime, and avoid idle talk.",
        "Tashlich is moved to the second day if the first is Shabbat."
      ],
      litvish: [
        "Apple in honey and simanim on the first night, no nuts, and Tashlich on the first afternoon — per the Mishnah Berurah.",
        "Many avoid sleeping during the day and keep conversation to a minimum."
      ]
    }
  },
  "tzom-gedaliah": {
    why: "Tradition places Gedaliah's murder around Rosh Hashanah. Since you can't fast on a holiday, the fast is held on 3 Tishrei — the first ordinary day after it — and moves to Sunday when that date falls on Shabbat.",
    takingOn: FAST_TAKING_ON + " The story is in Jeremiah 40–41.",
    minhagim: fastMinhagim()
  },
  "aseret-yemei-teshuva": {
    why: "These are the ten days from Rosh Hashanah (1 Tishrei) to Yom Kippur (10 Tishrei). Tradition describes the year's judgment as written on Rosh Hashanah and sealed on Yom Kippur, with these days as the window in between.",
    takingOn: "Choose one person to apologize to or reconcile with this week. That's the heart of these days, and it needs no Hebrew and no synagogue.",
    minhagim: {
      ashkenazi: [
        "Avinu Malkeinu after the Amidah at Shacharit and Mincha on most weekdays, and Selichot each morning.",
        "Many are careful to eat only pat Yisrael bread during these days."
      ],
      sephardi: [
        "Selichot continue every morning until Yom Kippur, and Avinu Malkeinu is said.",
        "The Shulchan Aruch records the custom of eating only pat Yisrael bread during these days."
      ],
      chabad: ["Selichot each morning, Avinu Malkeinu, and taking on extra care in mitzvot — like eating only pat Yisrael — for the ten days."],
      litvish: ["Avinu Malkeinu and Selichot daily; in yeshivos these days are the peak of the Elul learning term."]
    }
  },
  "erev-yom-kippur": {
    why: "Yom Kippur is 10 Tishrei. Like every Jewish day it begins at sundown — so the fast starts this evening, a little before sunset.",
    takingOn: "Eat a good meal before the fast, and if you can, go to Kol Nidrei tonight. Ask your rabbi beforehand whether and how you should fast this year.",
    minhagim: {
      ashkenazi: [
        "Kapparot — with a chicken or, very often, with money — early this morning or in the days before.",
        "Many receive symbolic malkot before Mincha, and Vidui is added to Mincha.",
        "Kreplach are traditional at the pre-fast meal."
      ],
      sephardi: [
        "Many communities do Kapparot following the Arizal, often with money — though the Shulchan Aruch itself discouraged it, so practice varies.",
        "Kol Nidrei night opens with the piyyut 'Lecha Eli' in many Sephardi congregations."
      ],
      chabad: [
        "Kapparot with a chicken before dawn is a strong Chabad custom.",
        "It's customary to ask for and receive lekach (honey cake), as a sign of a sweet year.",
        "Parents bless their children before leaving for Kol Nidrei."
      ],
      litvish: [
        "Kapparot (often with money), malkot before Mincha, and Vidui at Mincha, per the Mishnah Berurah.",
        "Many make a point of asking forgiveness in person from family and friends before the fast."
      ]
    }
  },
  "yom-kippur": {
    why: "10 Tishrei, ten days after Rosh Hashanah. It's the only fast that overrides Shabbat — when Yom Kippur falls on a Saturday, the fast is still kept.",
    takingOn: "Stay for Ne'ilah, the closing service, and hear the final shofar blast. If you can't fast the whole day, ask your rabbi in advance what's right for you.",
    minhagim: {
      ashkenazi: [
        "Married men wear a kittel, and the tallit is put on before sunset for Kol Nidrei.",
        "Yizkor is said after the Torah reading."
      ],
      sephardi: [
        "White clothing is common, though the kittel itself is an Ashkenazi custom.",
        "Ne'ilah opens with the piyyut 'El Nora Alila'.",
        "Hashkavah prayers are said for departed relatives, in place of the Ashkenazi Yizkor."
      ],
      chabad: [
        "Men wear a kittel; Yizkor is said.",
        "Ne'ilah ends with the singing of the 'Napoleon's March' melody before the final shofar blast."
      ],
      litvish: ["A kittel and tallit for Kol Nidrei, Yizkor after the Torah reading, and many stand for long stretches of the prayers."]
    }
  },
  "erev-sukkot": {
    why: "Sukkot begins on 15 Tishrei — the full moon, five days after Yom Kippur — at sundown tonight.",
    takingOn: "No sukkah of your own? Ask a local synagogue or Chabad house — they almost always have one and welcome guests.",
    minhagim: {
      ashkenazi: ["Decorating the sukkah — fruit, paper chains, children's pictures — is a beloved custom."],
      sephardi: ["Many homes decorate the sukkah generously with fruit, greenery and hangings."],
      chabad: ["The sukkah is left undecorated — the mitzvah itself is considered its beauty."],
      litvish: ["The sukkah is built with careful attention to its halachic measurements, and many have it checked by someone knowledgeable."]
    }
  },
  "sukkot": {
    why: "Sukkot runs 15–21 Tishrei. Outside Israel the first two days are Yom Tov (in Israel, just the first), and the rest are Chol HaMoed.",
    takingOn: "Shake a lulav and etrog at least once — synagogues and Chabad houses often have a set you can use, and someone will happily show you how.",
    minhagim: {
      ashkenazi: [
        "The lulav is waved east, south, west, north, up and down, as recorded by the Rema.",
        "Whether to wear tefillin on Chol HaMoed depends on family custom — many Ashkenazim outside Israel do, following the Rema; many don't."
      ],
      sephardi: [
        "The lulav is waved south, north, east, up, down and west — the order of the Arizal, recorded in the Shulchan Aruch.",
        "Tefillin are not worn on Chol HaMoed."
      ],
      chabad: [
        "The lulav is waved in the Arizal's order (south, north, east, up, down, west).",
        "Nothing is eaten or drunk outside the sukkah all Sukkot — not even water.",
        "Alongside the biblical Ushpizin, the 'Chassidic Ushpizin' (the Baal Shem Tov, the Maggid and the Chabad Rebbes) are recalled each night.",
        "No tefillin on Chol HaMoed."
      ],
      litvish: [
        "The lulav is waved east, south, west, north, up and down, per the Mishnah Berurah.",
        "No tefillin on Chol HaMoed in Israel; outside Israel it varies by family and yeshiva."
      ]
    }
  },
  "hoshana-rabbah": {
    why: "21 Tishrei, the seventh and last day of Sukkot.",
    takingOn: "Ask for a small bundle of willows (aravot) and join in striking them on the ground — simple and memorable.",
    minhagim: {
      ashkenazi: [
        "Many stay up the night before reading Deuteronomy and Psalms (Tikkun Leil Hoshana Rabbah).",
        "The chazzan wears a kittel, and some prayers take on High Holiday melodies.",
        "Kreplach are traditional today."
      ],
      sephardi: ["Many stay up through the night reading the Tikkun — Deuteronomy, Psalms and more — before the morning's seven circuits with the lulav."],
      chabad: [
        "The night is spent reading Deuteronomy and the whole Book of Tehillim, and people wish each other 'a gut kvitl' — a good final sealing.",
        "Challah is dipped in honey for the last time this season."
      ],
      litvish: ["Tikkun Leil Hoshana Rabbah and the willow ceremony follow standard Ashkenazi practice; many yeshivos treat the day with High Holiday seriousness."]
    }
  },
  "shmini-atzeret": {
    why: "22 Tishrei, the day after Sukkot's seven days end. In Israel it's also Simchat Torah; outside Israel, Simchat Torah is the following day.",
    takingOn: "Be there for Geshem, the prayer for rain at Musaf — a short, beautiful moment that marks the start of winter in the Jewish year.",
    minhagim: {
      ashkenazi: [
        "Outside Israel, many still eat in the sukkah today, without its blessing.",
        "Yizkor is said, and the chazzan wears a kittel for Geshem."
      ],
      sephardi: [
        "Outside Israel, meals are eaten in the sukkah without its blessing.",
        "In Israel, many join 'hakafot shniyot' — a second round of dancing — on the night after the holiday."
      ],
      chabad: [
        "Outside Israel, all meals are eaten in the sukkah today, without its blessing.",
        "Hakafot are held on the night of Shmini Atzeret as well as on Simchat Torah."
      ],
      litvish: ["Outside Israel, meals in the sukkah without its blessing; Yizkor; and Geshem with the chazzan in a kittel."]
    }
  },
  "simchat-torah": {
    why: "Outside Israel it's 23 Tishrei, the day after Shmini Atzeret; in Israel it's celebrated on the same day as Shmini Atzeret.",
    takingOn: "Come and dance, or just watch — no knowledge needed. It's one of the warmest, most welcoming days to visit a synagogue.",
    minhagim: {
      ashkenazi: ["Seven Hakafot at night and again in the morning; every man is called for an aliyah, and the children are called up together under a tallit ('Kol HaNe'arim')."],
      sephardi: ["The Torah scrolls, in their upright cases (tikim), are carried in the Hakafot, with special piyyutim for each circuit."],
      chabad: ["Hakafot run long into the night with intense dancing, and many walk to other synagogues to add to their joy ('Tahalucha')."],
      litvish: ["Hakafot with every man receiving an aliyah; in yeshivos, the dancing often lasts for hours."]
    }
  },
  "chanukah": {
    why: "Chanukah begins on 25 Kislev and lasts eight days, into Tevet — usually in December. The lights are lit after dark, when the next day of Chanukah has begun.",
    takingOn: "Light a menorah at home each night — one of the easiest mitzvot to start with. Ask your rabbi whether to say the blessings yet.",
    minhagim: {
      ashkenazi: [
        "Each member of the household, children included, lights their own menorah, following the Rema.",
        "Maoz Tzur is sung after lighting."
      ],
      sephardi: [
        "One menorah is lit for the whole household, following the Shulchan Aruch.",
        "Psalm 30 ('Mizmor Shir Chanukat HaBayit') is said after lighting."
      ],
      chabad: [
        "The menorah is placed in a doorway, opposite the mezuzah, so you're 'surrounded by mitzvot'.",
        "Each boy and man lights his own; the shamash sits higher than the other lights.",
        "Public menorah lightings share the miracle as widely as possible."
      ],
      litvish: [
        "Each member of the household lights, per the Rema and Mishnah Berurah — ideally at a window facing the street.",
        "Maoz Tzur after lighting."
      ]
    }
  },
  "tu-bishvat": {
    why: "15 Shevat. The Talmud chose this date as the trees' new year because by mid-winter in Israel most of the year's rain has fallen and new growth begins.",
    takingOn: "Eat a few of the Seven Species and learn which blessing goes with each — a great way to practice the food blessings.",
    minhagim: {
      ashkenazi: ["Eat fruits of the Land of Israel, especially a new fruit with Shehecheyanu; some pray today for a beautiful etrog next Sukkot."],
      sephardi: ["A Tu BiShvat seder, from the book 'Pri Etz Hadar', is widespread — with readings, songs and blessings over many fruits."],
      chabad: ["Fruits of the Seven Species are eaten, with emphasis on their blessings and their meaning."],
      litvish: ["Fruits of Israel are eaten; the day is marked mostly by leaving out Tachanun rather than by special ceremonies."]
    }
  },
  "taanit-esther": {
    why: "13 Adar, the day before Purim. When Purim falls on a Sunday, the fast moves back to Thursday, since it can't be held on Shabbat.",
    takingOn: FAST_TAKING_ON + " Giving the Half-Shekel is a simple, concrete thing to do today.",
    minhagim: fastMinhagim({
      ashkenazi: ["Machatzit HaShekel: three half-coins (like half-dollars) are given to charity before Mincha."],
      sephardi: ["Many give the value of a half-shekel of silver to charity before Purim."],
      chabad: ["Machatzit HaShekel is given — three coins — for each member of the family, including children."],
      litvish: ["Machatzit HaShekel: three half-coins given before Mincha."]
    })
  },
  "purim": {
    why: "14 Adar — the day the Jews of Persia rested after defeating their enemies. Walled cities like Jerusalem celebrate a day later, on 'Shushan Purim'. In a leap year, Purim is in the second Adar.",
    takingOn: "All four Purim mitzvot are very doable on day one: hear the Megillah, give to two people in need, send a food gift to a friend, and enjoy a festive meal.",
    minhagim: {
      ashkenazi: [
        "Hamantaschen, and noise-makers ('graggers') whenever Haman's name is read.",
        "Shehecheyanu is said before both the night and the morning Megillah readings."
      ],
      sephardi: [
        "Shehecheyanu is said only before the night reading, not again in the morning.",
        "Many communities have their own Purim sweets, like fried 'orejas de Haman' (Haman's ears)."
      ],
      chabad: [
        "Chabad goes out to read the Megillah for anyone who can't get to a synagogue, and shares Mishloach Manot widely.",
        "A Purim farbrengen is held in the afternoon."
      ],
      litvish: ["The Megillah is read twice, with Shehecheyanu each time, per the Mishnah Berurah; yeshivos are known for 'Purim Torah' — playful mock-scholarship."]
    }
  },
  "erev-pesach": {
    why: "14 Nisan. Chametz must be gone by mid-morning, and the exact deadline depends on your location — check a local Jewish calendar.",
    takingOn: "Even if you're not koshering a kitchen yet, try going the whole week without chametz, and ask your rabbi which parts of Pesach preparation to start with.",
    minhagim: {
      ashkenazi: [
        "Firstborn males attend a siyum after Shacharit, so they may eat instead of fasting.",
        "Chametz is sold through the rabbi; the sale must be arranged in advance."
      ],
      sephardi: [
        "Firstborns attend a siyum too. The Shulchan Aruch mentions a view that firstborn daughters also fast — ask your rabbi.",
        "Many check rice for stray grains of wheat three times before Pesach, if the family eats rice."
      ],
      chabad: [
        "Only hand-made shmurah matzah is used, and gebrochts is avoided all Pesach except the last day.",
        "Chametz is sold through a rabbi using a signed authorization."
      ],
      litvish: ["The firstborns' siyum, Biur Chametz and the sale of chametz all follow the Mishnah Berurah; many use only hand-made shmurah matzah for the Seder."]
    }
  },
  "pesach-seder-nights": {
    why: "15 Nisan, the full moon of spring. Outside Israel there are two Seders, on the 15th and 16th; in Israel, one.",
    takingOn: "Go to a Seder — and if you can, read through the Haggadah in English beforehand so you know what's coming.",
    minhagim: {
      ashkenazi: [
        "No kitniyot (rice, corn, beans and similar) all Pesach.",
        "The Seder leader often wears a kittel; maror is usually romaine lettuce and/or horseradish."
      ],
      sephardi: [
        "Kitniyot are generally eaten, though some families — for example, many Moroccans — avoid rice. Follow your family's custom.",
        "In many homes the Seder plate is passed over everyone's head while singing 'Bivhilu yatzanu mi-Mitzrayim'.",
        "Romaine lettuce is the usual maror."
      ],
      chabad: [
        "The Seder plate is arranged per the Arizal, with both horseradish and romaine.",
        "Only hand-made shmurah matzah; no gebrochts; no kitniyot."
      ],
      litvish: [
        "No kitniyot; matzah and wine amounts are carefully measured, often by the Chazon Ish's larger amounts.",
        "Hand-made shmurah matzah is common, and many do eat gebrochts."
      ]
    }
  },
  "pesach-chol-hamoed": {
    why: "The middle days of Pesach: 17–20 Nisan outside Israel (16–20 in Israel).",
    takingOn: "Use these days for a family outing — 'Chol HaMoed trips' are a well-loved tradition — while keeping the week chametz-free.",
    minhagim: {
      ashkenazi: ["Tefillin practice varies: many Ashkenazim outside Israel wear them on Chol HaMoed (following the Rema), many don't — follow your family or synagogue."],
      sephardi: ["No tefillin on Chol HaMoed; kitniyot continue, per family custom."],
      chabad: ["No tefillin on Chol HaMoed, and still no gebrochts."],
      litvish: ["No tefillin in Israel; outside Israel it varies by yeshiva and family."]
    }
  },
  "pesach-last-days": {
    why: "21 Nisan (and 22 outside Israel). Tradition dates the splitting of the sea to the seventh day after the Israelites left Egypt.",
    takingOn: "Join the festive meal, and if you've lost a loved one, consider attending Yizkor.",
    minhagim: {
      ashkenazi: ["Yizkor on the last day (the eighth, outside Israel)."],
      sephardi: ["Moroccan and other North African communities celebrate Mimouna the night Pesach ends, with open houses and sweets like mufleta."],
      chabad: ["On the last day, gebrochts is eaten, and the day ends with Moshiach's Seudah, including four cups of wine."],
      litvish: ["Yizkor on the last day outside Israel."]
    }
  },
  "sefirat-haomer": {
    why: "The count starts on the second night of Pesach (16 Nisan) and runs 49 nights to Shavuot. Jewish days begin at nightfall, so each night's count is for the date that's just beginning.",
    takingOn: "Set a nightly phone reminder to count. Ask your rabbi whether to say the blessing before your conversion — counting without it is still meaningful.",
    minhagim: {
      ashkenazi: [
        "The count is most commonly said 'ba'Omer'.",
        "Mourning customs (no weddings, haircuts or live music) are usually kept from Pesach until Lag BaOmer, though some keep a later window instead."
      ],
      sephardi: [
        "The count is said 'la'Omer'.",
        "Mourning customs last until the morning of the 34th day, per the Shulchan Aruch."
      ],
      chabad: [
        "The count is said 'la'Omer', following the Arizal.",
        "Haircuts are avoided all the way until Erev Shavuot, with Lag BaOmer itself a day of celebration."
      ],
      litvish: ["The count is said 'ba'Omer', with mourning customs from Pesach until Lag BaOmer."]
    }
  },
  "lag-baomer": {
    why: "18 Iyar — the 33rd day of the Omer. 'Lag' is how 33 is written in Hebrew letters: lamed (30) + gimel (3).",
    takingOn: "Join a community bonfire or picnic — a joyful, easy day to take part in.",
    minhagim: {
      ashkenazi: ["Haircuts and weddings resume for those keeping the earlier mourning window; children go on outings, traditionally with bows and arrows."],
      sephardi: ["Celebrations (hillulot) for Rabbi Shimon bar Yochai, with candles, festive meals and songs like 'Bar Yochai'; many three-year-old boys have their first haircut, especially at Meron."],
      chabad: ["Children's Lag BaOmer parades, a tradition the Rebbe started, and upsherins for three-year-old boys."],
      litvish: ["Weddings and haircuts resume; the day is marked more quietly than in Chassidic or Sephardi communities."]
    }
  },
  "erev-shavuot": {
    why: "Shavuot falls on 6 Sivan (6–7 outside Israel), the day after the 49-day Omer count ends — so it has no date of its own in the Torah, only a count.",
    takingOn: "Join a night of learning tonight — many communities run all-night classes open to everyone, beginners included.",
    minhagim: {
      ashkenazi: ["Homes and synagogues are decorated with flowers and greenery."],
      sephardi: ["Many read the Tikkun Leil Shavuot — selections from every book of the Torah and the Mishnah — through the night."],
      chabad: ["The night is spent reading the Tikkun Leil Shavuot together."],
      litvish: ["Many follow the Vilna Gaon, who didn't decorate with greenery; the night is spent learning in the beit midrash."]
    }
  },
  "shavuot": {
    why: "6 Sivan (6–7 outside Israel). Tradition dates the giving of the Torah at Sinai to this day, the fiftieth after the Exodus.",
    takingOn: "Read the Book of Ruth — it's short, and it speaks directly to the experience of choosing Judaism.",
    minhagim: {
      ashkenazi: [
        "Akdamut is sung before the Torah reading on the first day, and Yizkor is said on the second (outside Israel).",
        "Dairy meals — blintzes and cheesecake are classics."
      ],
      sephardi: [
        "Before the Torah reading, many read a poetic Ketubah between God and Israel.",
        "Azharot, poems listing the 613 commandments, are recited."
      ],
      chabad: [
        "It's the yahrzeit of the Baal Shem Tov.",
        "Even young children are brought to synagogue to hear the Ten Commandments; a dairy meal is followed later by a meat meal."
      ],
      litvish: ["Akdamut and Yizkor as in Ashkenazi practice; the all-night learning in yeshivos is a highlight of the year."]
    }
  },
  "shiva-asar-btammuz": {
    why: "17 Tammuz. When it falls on Shabbat, the fast is pushed to Sunday.",
    takingOn: FAST_TAKING_ON,
    minhagim: fastMinhagim()
  },
  "three-weeks": {
    why: "From 17 Tammuz to 9 Av — the three weeks from the breach of Jerusalem's walls to the destruction of the Temple.",
    takingOn: "Spend a little time learning about the Temple or Jerusalem's history during these weeks, and ask your rabbi which mourning customs to take on.",
    minhagim: {
      ashkenazi: [
        "No haircuts, weddings or music for all three weeks.",
        "From Rosh Chodesh Av (the Nine Days), no meat or wine except on Shabbat, and no laundry or new clothes."
      ],
      sephardi: [
        "Haircuts and laundry are restricted mainly in the week of Tisha B'Av itself, per the Shulchan Aruch.",
        "Many avoid meat and wine from Rosh Chodesh Av; some only in the week of Tisha B'Av."
      ],
      chabad: [
        "Ashkenazi restrictions, plus extra Torah study about the Beit HaMikdash and extra tzedakah.",
        "A siyum is held on each of the Nine Days, so meat can be eaten at the celebration."
      ],
      litvish: [
        "No haircuts or music for the three weeks, and no meat, wine or laundry in the Nine Days, per the Mishnah Berurah.",
        "No Shehecheyanu on new fruit or clothes during the Three Weeks."
      ]
    }
  },
  "tisha-bav": {
    why: "9 Av. When it falls on Shabbat, the fast is pushed to Sunday — Shabbat is a day of joy that mourning can't override.",
    takingOn: "Attend the evening reading of Eichah, and ask your rabbi how much of the fast to keep.",
    minhagim: {
      ashkenazi: ["Kinot are recited for much of the morning; tallit and tefillin are worn at Mincha rather than Shacharit."],
      sephardi: ["Sephardi Kinot are recited, many read the Book of Job, and people sit on the floor or low stools as mourners."],
      chabad: ["Tallit and tefillin at Mincha; after midday, the focus begins to turn toward consolation and redemption."],
      litvish: ["Kinot until close to midday, often with the rabbi's explanations; tallit and tefillin at Mincha."]
    }
  },
  "asara-btevet": {
    why: "10 Tevet. It's the only minor fast that's kept even when it falls on a Friday.",
    takingOn: FAST_TAKING_ON,
    minhagim: fastMinhagim({
      ashkenazi: ["Israel's Chief Rabbinate set this day as a general day of Kaddish for Holocaust victims whose date of death is unknown."],
      litvish: ["Many Litvish communities mark Holocaust remembrance today, within the traditional calendar of mourning."]
    })
  },
  "pesach-sheni": {
    why: "14 Iyar — exactly one month after the Passover offering was originally brought.",
    takingOn: "Eat a piece of matzah today and think about something you'd like a second chance at.",
    minhagim: {
      ashkenazi: ["Many eat a piece of matzah; Tachanun is omitted."],
      sephardi: ["Tachanun is omitted."],
      chabad: ["Matzah is eaten, and the Rebbe's teaching 'it's never too late' is a favorite theme."],
      litvish: ["Tachanun is omitted; some eat matzah."]
    }
  },
  "yom-hashoah": {
    why: "27 Nisan, chosen by Israel's Knesset in 1951 — between the anniversary of the Warsaw Ghetto uprising and Israel's Independence Day.",
    takingOn: "Light a memorial candle, or listen to a survivor's testimony."
  },
  "yom-hazikaron": {
    why: "4 Iyar, the day before Independence Day (moved by a day or two when it would clash with Shabbat).",
    takingOn: "Pause during the siren (8pm and 11am Israel time), or read the story of one fallen soldier."
  },
  "yom-haatzmaut": {
    why: "5 Iyar, the Hebrew date of Israel's declaration of independence in 1948 — moved by a day or two when it would conflict with Shabbat.",
    takingOn: "Join a local celebration, or learn one thing about modern Israel's history.",
    minhagim: {
      ashkenazi: ["Religious Zionist synagogues hold a festive Maariv and say Hallel, many with a blessing."],
      sephardi: ["Many Sephardi synagogues say Hallel without a blessing, following Rav Ovadia Yosef."],
      chabad: ["Chabad doesn't add Hallel or special prayers for the day."],
      litvish: ["Most Litvish/Haredi communities don't mark the day in their prayers."]
    }
  },
  "yom-yerushalayim": {
    why: "28 Iyar, the Hebrew date of Jerusalem's reunification in 1967.",
    takingOn: "Learn about one place in Jerusalem — the Western Wall, or the City of David.",
    minhagim: {
      ashkenazi: ["Religious Zionist synagogues say Hallel, many with a blessing."],
      sephardi: ["Many say Hallel without a blessing."],
      chabad: ["No special prayers are added."],
      litvish: ["Generally not marked in the prayers."]
    }
  },
  "tu-bav": {
    why: "15 Av, six days after Tisha B'Av, under the full moon.",
    takingOn: "Do something kind for someone you love today."
  },
  "erev-shabbat": {
    why: "Shabbat begins at sundown on Friday. Candles are lit shortly before sunset — commonly 18 minutes before (40 in Jerusalem) — so check local times.",
    takingOn: "Light Shabbat candles this week, even if you do nothing else yet. Ask your rabbi whether to say the blessing for now.",
    minhagim: {
      ashkenazi: ["Candles are lit first, then the blessing is said with the eyes covered."],
      sephardi: [
        "Many say the blessing first and then light, following Rav Ovadia Yosef.",
        "Song of Songs (Shir HaShirim) is read before Kabbalat Shabbat in many communities."
      ],
      chabad: [
        "Girls from age three light their own Shabbat candle, before their mother.",
        "Many men go to the mikveh on Friday afternoon."
      ],
      litvish: ["Candles are lit before the blessing, per the Mishnah Berurah, and many complete Shnayim Mikra before Shabbat."]
    }
  },
  "shabbat": {
    why: "The seventh day — from Friday's sunset until three stars appear on Saturday night.",
    takingOn: "Try a Friday-night dinner with Kiddush and challah, or ask to join a family for Shabbat lunch — many communities have hosting programs for newcomers.",
    minhagim: {
      ashkenazi: ["Shalom Aleichem and Eishet Chayil before Kiddush on Friday night, and cholent at Shabbat lunch."],
      sephardi: [
        "Hamin or dafina, slow-cooked overnight, at lunch.",
        "Many smell fragrant myrtle (hadassim), with its blessing, before Friday-night Kiddush."
      ],
      chabad: [
        "On Shabbat Mevarchim, the whole Book of Tehillim is said before Shacharit.",
        "The Arizal's 'Askinu Seudata' songs are sung at each meal."
      ],
      litvish: ["Cholent and kugel; Shabbat afternoon is a favorite time for Torah study."]
    }
  },
  "rosh-chodesh": {
    why: "The first of each Hebrew month, at the new moon. When the previous month had 30 days, Rosh Chodesh lasts two days: the 30th and the 1st.",
    takingOn: "Women have a special connection to this day — many lighten their chores or meet to learn. It's a nice monthly moment to set an intention.",
    minhagim: {
      ashkenazi: ["Half-Hallel is said with a blessing."],
      sephardi: ["Half-Hallel is said without a blessing, per the Shulchan Aruch."],
      chabad: ["Half-Hallel with a blessing; the whole Book of Tehillim is said on the Shabbat before."],
      litvish: ["Half-Hallel with a blessing."]
    }
  },
  "generic-weekday": {
    why: "There's no holiday on today's Hebrew date. Hebrew dates shift against the secular calendar each year, which is why holidays seem to 'move' — they're actually fixed to the moon.",
    takingOn: "Pick one blessing — like the one before eating bread — and say it every day this week. Small and consistent is the best way to build.",
    minhagim: {
      ashkenazi: ["Prayers follow Nusach Ashkenaz; Tachanun is said on ordinary weekdays."],
      sephardi: ["Prayers follow Edot HaMizrach, often with the rulings of Rav Ovadia Yosef or the Ben Ish Chai."],
      chabad: ["Daily Chitas — the day's portion of Chumash with Rashi, Tehillim and Tanya — plus Rambam study. Prayers follow Nusach Ari."],
      litvish: ["Nusach Ashkenaz, often as practiced by the Vilna Gaon's followers; many keep a fixed daily learning slot, like Daf Yomi."]
    }
  }
};

// ---------------------------------------------------------------------
// "If you're converting" notes — shown only for the conversion profile, on
// the occasions where someone in the process most often has questions about
// their status, what to do (or not yet do), or how it feels.
// ---------------------------------------------------------------------

const CONVERT_NOTES = {
  "shabbat": "Many rabbis ask people who haven't yet converted to keep Shabbat warmly but not completely — often by doing one small, deliberate act of \"work\" — because full Shabbat observance is described as a sign of the covenant itself, which you enter at conversion. Other rabbis guide this differently. It isn't a test of commitment; ask your sponsoring rabbi what they'd like you to do.",
  "erev-shabbat": "Candle lighting is often one of the first practices people take on. Some rabbis suggest lighting without the blessing, or saying it without God's name, until you've converted, because the blessing says God \"commanded us.\" Your rabbi will tell you which — either way, the light and the pause are fully yours to enjoy.",
  "rosh-hashana": "You're welcome at High Holiday services, and many synagogues set aside seats for people who are learning. It's very normal to feel like an outsider the first time — the liturgy is long and unfamiliar. Many converts remember hearing the shofar as the moment something clicked. Just listening is enough.",
  "yom-kippur": "Before conversion, you aren't obligated to fast, though many people choose to as a way of practicing — partly or fully, if their health allows. Talk to your rabbi (and your doctor, if needed) beforehand. Teshuva — returning and starting over — is open to every human being, and today it's yours too.",
  "sukkot": "Sukkot has a universal side: in Temple times, seventy offerings were brought on Sukkot for the seventy nations of the world. Sitting in a sukkah as a guest — the Ushpizin tradition is all about guests — is a beautiful way to experience the holiday before conversion. You'll be welcomed in almost any community sukkah.",
  "simchat-torah": "Simchat Torah celebrates the Torah you're choosing to take on. Join the dancing — no one is checking your status at the door. Ask your rabbi about community customs on holding a Torah scroll; in any case, watching the scrolls carried in joy is a powerful way to feel part of it.",
  "chanukah": "Chanukah is a story about choosing Jewish identity when the surrounding culture pulled the other way — something many converts feel deeply. If your family celebrates Christmas, it can be a tender season. Many converts find warm ways to honor their family while keeping their own practice; it's a good conversation to have with your rabbi.",
  "purim": "Purim is the story of Esther, who kept her Jewish identity hidden until the moment she chose to stand with her people. The day's mitzvot — giving to the poor, sending food to friends, hearing the Megillah — are easy to take part in right now, and a joyful way to connect with a community.",
  "pesach-seder-nights": "You're warmly welcome at a Seder. The Haggadah asks everyone to see themselves as having left Egypt — and Maimonides told a convert that he, too, may say \"who brought our fathers out of Egypt,\" because Abraham is the father of everyone who joins. Ask your rabbi how to approach chametz in your own home before conversion.",
  "shavuot": "Shavuot belongs to converts in a special way. The Book of Ruth, read today, tells of a woman who chose the Jewish people: \"Your people shall be my people, and your God my God.\" The Talmud teaches that the souls of all future converts stood at Sinai — tradition holds you were already there.",
  "tisha-bav": "Joining the Jewish people means joining its memory, the sorrow as well as the joy. Ruth's \"your people shall be my people\" includes days like this one. Before conversion, fasting is a personal choice — ask your rabbi. Sitting with the readings, even for a while, is a meaningful way to take part.",
  "yom-hashoah": "Many people in the conversion process wonder whether this grief is \"theirs.\" Joining the Jewish people means carrying its memory, and being present today matters. Some converts also have family histories connected to the war in other, complicated ways; that can be hard, and it's worth talking through with your rabbi or someone you trust.",
  "rosh-chodesh": "Living by the Hebrew calendar is a quiet but real part of becoming Jewish — noticing the new moon, knowing what month it is, feeling the year's rhythm. Many people use Rosh Chodesh as a monthly check-in: what have I learned, what's next? It's a natural time for a conversation with your rabbi.",
  "sefirat-haomer": "The Omer is a journey from freedom to Sinai, counted one day at a time — a fitting picture of conversion itself. Many rabbis suggest counting each night without the blessing before conversion. Either way, the steady, daily counting is the point: growth happens a day at a time.",
  "generic-weekday": "Ordinary days are where conversion really happens. A beit din (rabbinic court) usually cares less about how much you know than about steady, sincere commitment: regular prayer, learning, Shabbat, and belonging to a community. One small practice, kept consistently, is worth more than many tried once."
};

/** "If you're converting" box — conversion profile only. */
function renderConvertNoteBox(occasionId, profile, used) {
  const text = CONVERT_NOTES[occasionId];
  if (!text || !isConverting(profile)) return null;
  const box = pzEl("div", "convert-box");
  box.appendChild(pzEl("p", "convert-box-label", "If you're converting"));
  box.appendChild(pzEl("p", null, glossify(text, profile, used)));
  return box;
}

// ---------------------------------------------------------------------
// Everyday mitzvot (keyed by mitzvot.js ids)
// ---------------------------------------------------------------------

const MITZVA_EXTRAS = {
  "modeh-ani": {
    takingOn: "Keep a card with the words by your bed until you know them by heart. Women say 'Modah ani'. Modeh Ani has no 'who commanded us' wording, so it's a perfect first daily practice."
  },
  "netilat-yadayim": {
    takingOn: "Keep a cup and a small bowl by your bed for a week and try it first thing. Ask your rabbi whether to say the blessing yet.",
    minhagim: {
      ashkenazi: ["Many keep a cup and basin by the bed (negel vasser) and wash three times on each hand, alternating."],
      sephardi: ["Three times on each hand, alternating, before walking more than four steps if possible."],
      chabad: ["Negel vasser by the bed, three times on each hand alternating, before getting up."],
      litvish: ["Negel vasser by the bed, three times alternating, per the Mishnah Berurah."]
    }
  },
  "shoes": {
    takingOn: "This one needs no blessing and no Hebrew — try it tomorrow morning."
  },
  "food-blessings": {
    takingOn: "Start with one category — say, Shehakol before drinks — and add another each week. A pocket blessings card helps.",
    minhagim: {
      ashkenazi: ["Ashkenazi rulings on borderline foods generally follow the Mishnah Berurah."],
      sephardi: ["Sephardi practice often follows Rav Ovadia Yosef's rulings, and a few foods get a different blessing than in Ashkenazi practice — a Sephardi blessings guide is worth having."],
      chabad: ["Chabad follows the rulings in the Alter Rebbe's Seder Birkat HaNehenin."],
      litvish: ["Rulings follow the Mishnah Berurah; many learn the laws of blessings in depth."]
    }
  },
  "asher-yatzar": {
    takingOn: "Print the text and hang it near the bathroom door — that's how many people learn it."
  },
  "birkat-hamazon": {
    takingOn: "Start with the short first paragraph after a bread meal, from a bencher with transliteration, and build up from there.",
    minhagim: {
      ashkenazi: ["On weekdays, Psalm 137 ('Al Naharot Bavel') is said beforehand; on Shabbat and holidays, Psalm 126 ('Shir HaMaalot')."],
      sephardi: ["Many say Psalm 67 ('Lamnatzeach Binginot') before Birkat Hamazon, and the text follows Edot HaMizrach."],
      chabad: ["Al Naharot on weekdays and Shir HaMaalot on Shabbat, in the Nusach Ari text."],
      litvish: ["Al Naharot on weekdays and Shir HaMaalot on Shabbat and holidays."]
    }
  },
  "mezuzah": {
    takingOn: "Ask your rabbi about putting up a mezuzah — some suggest waiting until after conversion, others recommend one without a blessing beforehand.",
    minhagim: {
      ashkenazi: ["Placed at a slant, top toward the room — a compromise between the opinions of Rashi and Rabbeinu Tam."],
      sephardi: ["Many Sephardim place it vertically, following the Shulchan Aruch."],
      chabad: ["Slanted; checked by a sofer twice every seven years, and many check them in Elul."],
      litvish: ["Slanted, per the Rema."]
    }
  },
  "tzitzit": {
    takingOn: "This is a question for your rabbi — practices for people in the conversion process vary.",
    minhagim: {
      ashkenazi: ["Married men wear a tallit for Shacharit; most unmarried men don't (German Jews are an exception)."],
      sephardi: ["Boys and men wear a tallit from bar mitzvah, and many tuck the tzitzit strings inside their clothing."],
      chabad: ["Men wear a tallit after marriage; tzitzit strings are worn out, where they can be seen."],
      litvish: ["Men wear a tallit after marriage; tzitzit strings are worn out."]
    }
  },
  "tzedakah-daily": {
    takingOn: "Put a tzedakah box in your kitchen and drop in a coin each weekday — tzedakah needs no blessing, so you can start today.",
    minhagim: {
      chabad: ["The Rebbe encouraged a tzedakah box in every home and in every child's room, and giving each weekday — especially before praying and before women light Shabbat candles."]
    }
  },
  "sacred-texts": {
    takingOn: "Ask your synagogue where they keep their genizah box for worn-out sacred texts."
  }
};

// ---------------------------------------------------------------------
// Prayer card (keyed by prayers.js keys)
// ---------------------------------------------------------------------

const PRAYER_EXTRAS = {
  shacharit: {
    takingOn: "Start with Modeh Ani and the first line of the Shema — even in English, that's a real beginning. A siddur with transliteration helps a lot.",
    minhagim: {
      ashkenazi: [
        "Nusach Ashkenaz: Baruch She'amar comes before Hodu.",
        "The tefillin strap is wound around the arm outward, away from the body."
      ],
      sephardi: [
        "Edot HaMizrach: Hodu comes before Baruch She'amar.",
        "The tefillin strap is wound inward, toward the body; many also put on Rabbeinu Tam tefillin."
      ],
      chabad: [
        "Nusach Ari; men wear both Rashi and Rabbeinu Tam tefillin.",
        "The strap is wound inward, toward the body; daily Chitas follows prayers."
      ],
      litvish: [
        "Nusach Ashkenaz as practiced by the Vilna Gaon's followers.",
        "The tefillin strap is wound outward, away from the body."
      ]
    }
  },
  mincha: {
    takingOn: "Try saying Ashrei once in the afternoon this week — it takes about two minutes.",
    minhagim: {
      ashkenazi: ["Mincha begins with Ashrei."],
      sephardi: ["Mincha begins with Korbanot — the passage about the daily offering — before Ashrei."],
      chabad: ["Mincha begins with the Korbanot passage, then Ashrei."],
      litvish: ["Mincha begins with Ashrei."]
    }
  },
  maariv: {
    takingOn: "Say the first paragraph of the Shema before going to sleep — the 'bedtime Shema' is a gentle way to end the day.",
    minhagim: {
      ashkenazi: ["Outside Israel, 'Baruch Hashem L'olam' is said before the weekday Amidah; in Israel it's left out."],
      sephardi: ["Arvit doesn't include 'Baruch Hashem L'olam'."],
      chabad: ["Nusach Ari doesn't include 'Baruch Hashem L'olam'."],
      litvish: ["Outside Israel many say 'Baruch Hashem L'olam'; in Israel it's left out."]
    }
  }
};

// ---------------------------------------------------------------------
// Prep guides (keyed by prep.js keys)
// ---------------------------------------------------------------------

const PREP_EXTRAS = {
  "rosh-hashana": {
    takingOn: "Reserve a seat for services early — many synagogues offer free or reduced-price seats to people exploring Judaism — and ask for a machzor with English.",
    minhagim: {
      ashkenazi: ["Honey cake and tzimmes (sweet carrots) are traditional; skip anything with nuts."],
      sephardi: ["Buy the full set of Yehi Ratzon foods: dates, pomegranate, black-eyed peas, leeks, beets or chard, gourd, and a fish or lamb head."],
      chabad: ["Write your 'pan' for the Ohel, and plan to say Tehillim through the holiday."],
      litvish: ["Simanim per the Mishnah Berurah, no nuts, and a machzor you're comfortable with for the long services."]
    }
  },
  "yom-kippur": {
    takingOn: "Talk to your rabbi before the day about fasting, and plan where you'll be for Kol Nidrei and Ne'ilah.",
    minhagim: {
      ashkenazi: ["A kittel for married men, and a chicken or money for Kapparot."],
      sephardi: ["White clothing; arrange Kapparot with money if your community does it."],
      chabad: ["Arrange Kapparot with a chicken before dawn on Erev Yom Kippur, and get lekach (honey cake)."],
      litvish: ["A kittel, and Kapparot — usually with money."]
    }
  },
  "sukkot": {
    takingOn: "Find a sukkah you can visit, and ask whether someone can show you how to hold the Four Species.",
    minhagim: {
      ashkenazi: ["Decorations for the sukkah, especially with children."],
      sephardi: ["Fruit and hangings for decorating the sukkah."],
      chabad: ["Leave the sukkah undecorated, and plan to eat and drink everything in it — even water. Get a woven palm holder (koishiklach) for the hadassim and aravot."],
      litvish: ["Have someone knowledgeable check your sukkah and your Four Species."]
    }
  },
  "pesach": {
    takingOn: "Find a Seder to attend — ask your rabbi or a local Chabad house — and try a week without chametz, even if your kitchen isn't kosher for Pesach yet.",
    minhagim: {
      ashkenazi: ["Only kitniyot-free products — check labels."],
      sephardi: ["Kitniyot are fine if your family eats them, but check rice by hand three times for stray grains of wheat."],
      chabad: ["Hand-made shmurah matzah for all of Pesach, and no gebrochts — plan recipes without matzah meal."],
      litvish: ["Hand-made shmurah matzah for the Seder; measure the matzah and wine amounts in advance."]
    }
  },
  "shavuot": {
    takingOn: "Look up your community's all-night learning program, and read the Book of Ruth before the holiday.",
    minhagim: {
      ashkenazi: ["Flowers and greenery for the home and synagogue."],
      sephardi: ["A copy of the Tikkun Leil Shavuot and the Azharot."],
      chabad: ["Plan to bring the children to synagogue to hear the Ten Commandments."],
      litvish: ["Skip the greenery if you follow the Vilna Gaon, and plan your night-learning schedule."]
    }
  },
  "chanukah": {
    takingOn: "Lighting the menorah is one of the most welcoming practices to start with: there's no restriction on work, and the whole family can join. Ask your rabbi whether to say the blessings before your conversion — lighting itself is always welcome.",
    minhagim: {
      ashkenazi: ["Each family member often has their own menorah; Maoz Tzur is sung after lighting."],
      sephardi: ["One menorah for the household, lit by the head of the family; Psalm 30 is said afterwards."],
      chabad: ["Buy a menorah with straight, even branches, and place it in the doorway opposite the mezuzah."]
    }
  },
  "asara-btevet": {
    takingOn: "Fasting is a serious commitment — talk to your rabbi before taking it on. A gentle first step is to give tzedakah and spend a few minutes learning about the day."
  },
  "tu-bishvat": {
    takingOn: "A Tu BiShvat seder with friends is a relaxed, joyful way to practice the blessings over food — no Hebrew needed to start."
  },
  "purim": {
    takingOn: "Hearing the Megillah at a synagogue is a great first Purim experience — it's loud, joyful and welcoming. Mishloach Manot is a lovely way to connect with your new community.",
    minhagim: {
      ashkenazi: ["Hamantaschen are the classic Purim pastry."],
      sephardi: ["Traditional treats include orejas de Haman (fried \"Haman's ears\") and ma'amoul."]
    }
  },
  "yom-hashoah": {
    takingOn: "Attending a community Yom HaShoah ceremony is a meaningful way to stand with the Jewish people — everyone is welcome."
  },
  "yom-hazikaron": {
    takingOn: "A community Yom HaZikaron–Yom HaAtzma'ut ceremony is a moving way to feel the connection between the Jewish people and Israel — everyone is welcome."
  },
  "lag-baomer": {
    takingOn: "A Lag BaOmer bonfire or picnic is one of the friendliest community events of the year — a great place to meet people."
  },
  "yom-yerushalayim": {
    takingOn: "Reading Psalm 122 slowly, in English or Hebrew, is a simple way to connect with the day."
  },
  "tzom-tammuz": {
    takingOn: "Before taking on a fast, talk to your rabbi. The Three Weeks' focus on kindness is something anyone can start right away."
  },
  "tisha-bav": {
    takingOn: "Hearing Eichah read on Tisha B'Av night, sitting on the floor in a darkened synagogue, is one of the most powerful experiences of the Jewish year — and newcomers are welcome. Ask your rabbi about fasting before you take it on."
  },
  "tu-bav": {
    takingOn: "Tu B'Av is a gentle, joyful day — bringing people together is the whole idea."
  },
  "tzom-gedaliah": {
    takingOn: "Before taking on a fast, talk to your rabbi. Asking someone's forgiveness during the Ten Days is a meaningful step anyone can take."
  }
};
