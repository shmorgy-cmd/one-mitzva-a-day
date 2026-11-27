/**
 * prayer-texts.js — the actual words of the prayers the site mentions, in
 * Hebrew, transliteration and English, so nobody is told "say Al HaNissim"
 * without being shown what it says.
 *
 *   getPrayerText(key, opts) → { name, note?, long?, lines: [{ label?, he, tr, en }], sefaria? }
 *
 * Some texts change with the day (Ya'aleh v'Yavo names the festival, the Omer
 * count names the day); those take `opts`. `long: true` texts start collapsed.
 * `sefaria` texts (Hallel) are loaded live from Sefaria instead of stored here.
 *
 * Hebrew follows the common Ashkenazi siddur, with ה׳ for God's name (as in the
 * blessings in daily-guide.js). Blessings — and the texts that are blessings,
 * like Asher Yatzar or Kiddush — have vowels (nikud); the longer prayers and
 * songs (Al HaNissim, Ya'aleh v'Yavo, Lecha Dodi…) don't have them yet. The
 * English is our own plain translation. Wording differs slightly between
 * siddurim — the page says so.
 */

const PT_OPEN = BLESSING_OPEN; // "Baruch atah Adonai, Eloheinu melech ha'olam,"

/** The festival's name as it appears inside Ya'aleh v'Yavo and the festival
 *  Kiddush (`heN`: with vowels, for the Kiddush blessing). */
const PT_FESTIVAL_NAMES = {
  roshChodesh: { he: "ראש החדש הזה", tr: "Rosh Chodesh hazeh", en: "this Rosh Chodesh (New Month)" },
  roshHashana: { he: "הזכרון הזה", tr: "hazikaron hazeh", en: "this Day of Remembrance" },
  pesach: { he: "חג המצות הזה", heN: "חַג הַמַּצּוֹת הַזֶּה", tr: "Chag hamatzot hazeh", en: "this Festival of Matzot", season: { he: "זמן חרותנו", heN: "זְמַן חֵרוּתֵנוּ", tr: "z'man cheiruteinu", en: "the season of our freedom" } },
  shavuot: { he: "חג השבעות הזה", heN: "חַג הַשָּׁבֻעוֹת הַזֶּה", tr: "Chag hashavuot hazeh", en: "this Festival of Shavuot", season: { he: "זמן מתן תורתנו", heN: "זְמַן מַתַּן תּוֹרָתֵנוּ", tr: "z'man matan Torateinu", en: "the season of the giving of our Torah" } },
  sukkot: { he: "חג הסכות הזה", heN: "חַג הַסֻּכּוֹת הַזֶּה", tr: "Chag hasukkot hazeh", en: "this Festival of Sukkot", season: { he: "זמן שמחתנו", heN: "זְמַן שִׂמְחָתֵנוּ", tr: "z'man simchateinu", en: "the season of our joy" } },
  shminiAtzeret: { he: "השמיני חג העצרת הזה", heN: "הַשְּׁמִינִי חַג הָעֲצֶרֶת הַזֶּה", tr: "hash'mini chag ha'atzeret hazeh", en: "this Eighth Day, the Festival of Assembly", season: { he: "זמן שמחתנו", heN: "זְמַן שִׂמְחָתֵנוּ", tr: "z'man simchateinu", en: "the season of our joy" } }
};

/** A full blessing line from an ending (with vowels), using the standard opening. */
function ptFull(label, heEnd, trEnd, enEnd) {
  return { label, he: `${BLESSING_OPEN.he}, ${heEnd}`, tr: `${BLESSING_OPEN.tr} ${trEnd}`, en: `${BLESSING_OPEN.en} ${enEnd}` };
}

/** Which festival a day is, from pcDayInfo() — for the texts above. */
function ptFestivalKey(info) {
  if (!info) return null;
  if (info.roshHashana) return "roshHashana";
  if (info.pesach) return "pesach";
  if (info.shavuot) return "shavuot";
  if (info.shminiAtzeret || info.simchatTorah) return "shminiAtzeret";
  if (info.sukkot) return "sukkot";
  if (info.roshChodesh) return "roshChodesh";
  return null;
}

/** A blessing line from the short endings in BLESSINGS (daily-guide.js). */
function ptBlessingLine(key, label) {
  const b = blessingText(key);
  return b ? { label: label || b.name, he: b.he, tr: b.tr, en: b.en, audio: `b-${key}` } : null;
}

// --- The Omer count ------------------------------------------------------------

const OMER_UNITS_HE = [null, "אחד", "שנים", "שלשה", "ארבעה", "חמשה", "ששה", "שבעה", "שמונה", "תשעה"];
const OMER_UNITS_TR = [null, "echad", "sh'nayim", "sh'loshah", "arba'ah", "chamishah", "shishah", "shiv'ah", "sh'monah", "tish'ah"];
const OMER_TENS_HE = { 10: "עשרה", 20: "עשרים", 30: "שלשים", 40: "ארבעים" };
const OMER_TENS_TR = { 10: "asarah", 20: "esrim", 30: "sh'loshim", 40: "arba'im" };
const OMER_WEEKS_HE = [null, "שבוע אחד", "שני שבועות", "שלשה שבועות", "ארבעה שבועות", "חמשה שבועות", "ששה שבועות", "שבעה שבועות"];
const OMER_WEEKS_TR = [null, "shavua echad", "sh'nei shavuot", "sh'loshah shavuot", "arba'ah shavuot", "chamishah shavuot", "shishah shavuot", "shiv'ah shavuot"];
const OMER_DAYS_HE = [null, "ויום אחד", "ושני ימים", "ושלשה ימים", "וארבעה ימים", "וחמשה ימים", "וששה ימים"];
const OMER_DAYS_TR = [null, "v'yom echad", "ush'nei yamim", "ush'loshah yamim", "v'arba'ah yamim", "vachamishah yamim", "v'shishah yamim"];

/** "Today is N days…" in Hebrew and transliteration, for day 1–49. */
function omerCountWords(n) {
  let he, tr;
  if (n === 1) { he = "יום אחד"; tr = "yom echad"; }
  else if (n === 2) { he = "שני ימים"; tr = "sh'nei yamim"; }
  else if (n < 10) { he = `${OMER_UNITS_HE[n]} ימים`; tr = `${OMER_UNITS_TR[n]} yamim`; }
  else if (n === 10) { he = "עשרה ימים"; tr = "asarah yamim"; }
  else if (n < 20) {
    const u = n - 10;
    he = `${u === 2 ? "שנים" : OMER_UNITS_HE[u]} עשר יום`;
    tr = `${u === 1 ? "achad" : u === 2 ? "sh'neim" : OMER_UNITS_TR[u]} asar yom`;
  } else {
    const t = Math.floor(n / 10) * 10, u = n % 10;
    he = u ? `${OMER_UNITS_HE[u]} ו${OMER_TENS_HE[t]} יום` : `${OMER_TENS_HE[t]} יום`;
    tr = u ? `${OMER_UNITS_TR[u]} v'${OMER_TENS_TR[t]} yom` : `${OMER_TENS_TR[t]} yom`;
  }
  const w = Math.floor(n / 7), d = n % 7;
  if (w) {
    he += `, שהם ${OMER_WEEKS_HE[w]}${d ? " " + OMER_DAYS_HE[d] : ""}`;
    tr += `, shehem ${OMER_WEEKS_TR[w]}${d ? " " + OMER_DAYS_TR[d] : ""}`;
  }
  const en = `Today is ${n} day${n > 1 ? "s" : ""}${w ? `, which ${n > 1 ? "are" : "is"} ${w} week${w > 1 ? "s" : ""}${d ? ` and ${d} day${d > 1 ? "s" : ""}` : ""}` : ""}`;
  return { he, tr, en };
}

// --- The texts -----------------------------------------------------------------

const PRAYER_TEXTS = {
  // Any single blessing from BLESSINGS, so it can sit in order among other texts.
  blessing: (opts = {}) => {
    const line = ptBlessingLine(opts.key);
    return line ? { name: line.label, lines: [{ he: line.he, tr: line.tr, en: line.en, audio: line.audio }] } : null;
  },

  haneirotHalalu: {
    name: "HaNerot Halalu (after lighting)",
    lines: [{
      he: "הנרות הללו אנחנו מדליקין על הנסים ועל הנפלאות ועל התשועות ועל המלחמות שעשית לאבותינו בימים ההם בזמן הזה, על ידי כהניך הקדושים. וכל שמונת ימי חנכה הנרות הללו קדש הם, ואין לנו רשות להשתמש בהם, אלא לראותם בלבד, כדי להודות ולהלל לשמך הגדול על נסיך ועל נפלאותיך ועל ישועתך.",
      tr: "Haneirot halalu anachnu madlikin al hanisim v'al haniflaot v'al hat'shu'ot v'al hamilchamot she'asita la'avoteinu bayamim hahem bazman hazeh, al y'dei kohanecha hak'doshim. V'chol sh'monat y'mei Chanukah haneirot halalu kodesh heim, v'ein lanu r'shut l'hishtamesh bahem, ela lir'otam bilvad, k'dei l'hodot ul'hallel l'shimcha hagadol al nisecha v'al nifl'otecha v'al y'shuatecha.",
      en: "We light these lights for the miracles and the wonders, for the rescues and the battles that You performed for our ancestors in those days at this season, through Your holy priests. Throughout the eight days of Chanukah these lights are holy. We may not use them for anything — only look at them — so that we give thanks and praise to Your great name for Your miracles, Your wonders and Your rescues."
    }]
  },

  maozTzur: {
    name: "Ma'oz Tzur (first verse)",
    long: true,
    note: "The song has six verses — the siddur has the rest.",
    lines: [{
      he: "מעוז צור ישועתי, לך נאה לשבח. תכון בית תפלתי, ושם תודה נזבח. לעת תכין מטבח, מצר המנבח, אז אגמור בשיר מזמור חנכת המזבח.",
      tr: "Ma'oz tzur y'shuati, l'cha na'eh l'shabei'ach. Tikon beit t'filati, v'sham todah n'zabei'ach. L'eit tachin matbei'ach mitzar ham'nabei'ach, az egmor b'shir mizmor chanukat hamizbei'ach.",
      en: "Mighty Rock of my salvation, it is right to praise You. Restore my house of prayer, and there we will bring an offering of thanks. When You have silenced the barking enemy, then I will finish, with song and psalm, the dedication of the altar."
    }]
  },

  alHanissim: (opts = {}) => {
    const purim = opts.occasion === "purim";
    const open = {
      he: "על הנסים ועל הפרקן ועל הגבורות ועל התשועות ועל המלחמות שעשית לאבותינו בימים ההם בזמן הזה.",
      tr: "Al hanisim v'al hapurkan v'al hag'vurot v'al hat'shu'ot v'al hamilchamot she'asita la'avoteinu bayamim hahem bazman hazeh.",
      en: "For the miracles, the redemption, the mighty acts, the rescues and the battles that You performed for our ancestors in those days, at this season."
    };
    const story = purim ? {
      he: "בימי מרדכי ואסתר בשושן הבירה, כשעמד עליהם המן הרשע, בקש להשמיד להרג ולאבד את כל היהודים, מנער ועד זקן, טף ונשים, ביום אחד, בשלושה עשר לחדש שנים עשר, הוא חדש אדר, ושללם לבוז. ואתה ברחמיך הרבים הפרת את עצתו, וקלקלת את מחשבתו, והשבות לו גמולו בראשו, ותלו אותו ואת בניו על העץ.",
      tr: "Bimei Mord'chai v'Ester b'Shushan habirah, k'she'amad aleihem Haman harasha, bikesh l'hashmid laharog ul'abeid et kol hay'hudim, mina'ar v'ad zakein, taf v'nashim, b'yom echad, bishloshah asar l'chodesh sh'neim asar, hu chodesh Adar, ush'lalam lavoz. V'atah b'rachamecha harabim heifarta et atzato, v'kilkalta et machashavto, vahasheivota lo g'mulo b'rosho, v'talu oto v'et banav al ha'etz.",
      en: "In the days of Mordechai and Esther, in Shushan the capital, when the wicked Haman rose up against them, he tried to destroy, kill and wipe out all the Jews, young and old, children and women, on one day — the thirteenth of the twelfth month, the month of Adar — and to take their belongings as plunder. But You, in Your great compassion, ruined his plan, upset his scheme and turned his own deeds back on his head, and they hanged him and his sons on the gallows."
    } : {
      he: "בימי מתתיהו בן יוחנן כהן גדול, חשמונאי ובניו, כשעמדה מלכות יון הרשעה על עמך ישראל, להשכיחם תורתך ולהעבירם מחקי רצונך. ואתה ברחמיך הרבים עמדת להם בעת צרתם, רבת את ריבם, דנת את דינם, נקמת את נקמתם, מסרת גבורים ביד חלשים, ורבים ביד מעטים, וטמאים ביד טהורים, ורשעים ביד צדיקים, וזדים ביד עוסקי תורתך. ולך עשית שם גדול וקדוש בעולמך, ולעמך ישראל עשית תשועה גדולה ופרקן כהיום הזה. ואחר כן באו בניך לדביר ביתך, ופנו את היכלך, וטהרו את מקדשך, והדליקו נרות בחצרות קדשך, וקבעו שמונת ימי חנכה אלו, להודות ולהלל לשמך הגדול.",
      tr: "Bimei Matityahu ben Yochanan kohen gadol, Chashmona'i uvanav, k'she'amdah malchut Yavan har'sha'ah al amcha Yisrael, l'hashkicham Toratecha ul'ha'aviram mechukei r'tzonecha. V'atah b'rachamecha harabim amadta lahem b'eit tzaratam, ravta et rivam, danta et dinam, nakamta et nikmatam, masarta giborim b'yad chalashim, v'rabim b'yad m'atim, ut'mei'im b'yad t'horim, ur'sha'im b'yad tzadikim, v'zeidim b'yad oskei Toratecha. Ul'cha asita shem gadol v'kadosh b'olamecha, ul'amcha Yisrael asita t'shu'ah g'dolah ufurkan k'hayom hazeh. V'achar kein ba'u vanecha lidvir beitecha, ufinu et heichalecha, v'tiharu et mikdashecha, v'hidliku neirot b'chatzrot kodshecha, v'kav'u sh'monat y'mei Chanukah eilu, l'hodot ul'hallel l'shimcha hagadol.",
      en: "In the days of Mattathias son of Yochanan, the High Priest, the Hasmonean, and his sons, the wicked Greek kingdom rose up against Your people Israel to make them forget Your Torah and turn them away from the laws You desire. But You, in Your great compassion, stood by them in their time of trouble. You took up their cause, judged their case and avenged them. You handed the strong to the weak, the many to the few, the impure to the pure, the wicked to the righteous, and the arrogant to those who study Your Torah. You made Your name great and holy in Your world, and for Your people Israel You brought a great rescue and redemption, as on this very day. Then Your children came into the inner room of Your House, cleared Your Temple, purified Your holy place, lit lights in Your holy courtyards, and set these eight days of Chanukah for giving thanks and praise to Your great name."
    };
    return {
      name: `Al HaNissim (${purim ? "Purim" : "Chanukah"})`,
      long: true,
      note: "Said in the Amidah, in Modim, and in Grace After Meals. Wording differs slightly between siddurim.",
      lines: [open, story]
    };
  },

  yaalehVyavo: (opts = {}) => {
    const f = PT_FESTIVAL_NAMES[opts.festival] || null;
    const day = f || { he: "[…]", tr: "[name of the day]", en: "[name of the day]" };
    return {
      name: "Ya'aleh v'Yavo",
      long: true,
      note: f ? `Today's wording: "${f.tr}" — ${f.en}.` : "The words in brackets name the day (Rosh Chodesh, or the festival).",
      lines: [{
        he: `אלהינו ואלהי אבותינו, יעלה ויבא ויגיע ויראה וירצה וישמע ויפקד ויזכר זכרוננו ופקדוננו, וזכרון אבותינו, וזכרון משיח בן דוד עבדך, וזכרון ירושלים עיר קדשך, וזכרון כל עמך בית ישראל לפניך, לפליטה לטובה, לחן ולחסד ולרחמים, לחיים ולשלום, ביום ${day.he}. זכרנו ה׳ אלהינו בו לטובה, ופקדנו בו לברכה, והושיענו בו לחיים. ובדבר ישועה ורחמים חוס וחננו ורחם עלינו והושיענו, כי אליך עינינו, כי אל מלך חנון ורחום אתה.`,
        tr: `Eloheinu velohei avoteinu, ya'aleh v'yavo v'yagia v'yera'eh v'yeratzeh v'yishama v'yipaked v'yizacher zichroneinu ufikdoneinu, v'zichron avoteinu, v'zichron mashiach ben David avdecha, v'zichron Yerushalayim ir kodshecha, v'zichron kol amcha beit Yisrael l'fanecha, lifleitah l'tovah, l'chein ul'chesed ul'rachamim, l'chayim ul'shalom, b'yom ${day.tr}. Zochreinu Adonai Eloheinu bo l'tovah, ufokdeinu vo livrachah, v'hoshi'einu vo l'chayim. Uvidvar y'shuah v'rachamim chus v'chaneinu v'racheim aleinu v'hoshi'einu, ki eilecha eineinu, ki El melech chanun v'rachum atah.`,
        en: `Our God and God of our ancestors, may the remembrance of us rise, come, reach You, be seen, accepted, heard and recalled before You — with the remembrance of our ancestors, of the Messiah son of David Your servant, of Jerusalem Your holy city, and of all Your people, the House of Israel — for rescue and goodness, for grace, kindness and compassion, for life and for peace, on ${day.en}. Remember us on it, Lord our God, for good; recall us on it for blessing; save us on it for life. With words of rescue and compassion, spare us and be gracious to us, have compassion on us and save us — our eyes look to You, for You are God, a gracious and compassionate King.`
      }]
    };
  },

  aneinu: {
    name: "Aneinu (fast days)",
    long: true,
    note: "On your own, it's said in the Amidah's blessing Shema Koleinu (Ashkenazim: only at Mincha). The prayer leader says it aloud as its own blessing.",
    lines: [{
      he: "עננו ה׳ עננו ביום צום תעניתנו, כי בצרה גדולה אנחנו. אל תפן אל רשענו, ואל תסתר פניך ממנו, ואל תתעלם מתחנתנו. היה נא קרוב לשועתנו, יהי נא חסדך לנחמנו. טרם נקרא אליך ענה, כדבר שנאמר: והיה טרם יקראו ואני אענה, עוד הם מדברים ואני אשמע. כי אתה ה׳ העונה בעת צרה, פודה ומציל בכל עת צרה וצוקה.",
      tr: "Aneinu Adonai aneinu b'yom tzom ta'aniteinu, ki v'tzarah g'dolah anachnu. Al tefen el rish'einu, v'al taster panecha mimenu, v'al tit'alam mit'chinateinu. Heyeh na karov l'shav'ateinu, y'hi na chasd'cha l'nachameinu. Terem nikra eilecha aneih, kadavar shene'emar: v'hayah terem yikra'u va'ani e'eneh, od heim m'dabrim va'ani eshma. Ki atah Adonai ha'oneh b'eit tzarah, podeh umatzil b'chol eit tzarah v'tzukah.",
      en: "Answer us, Lord, answer us on this day of our fast, for we are in great distress. Don't look at our wrongdoing, don't hide Your face from us, and don't ignore our plea. Please be close to our cry; let Your kindness comfort us. Answer us even before we call, as it is said: \"Before they call, I will answer; while they are still speaking, I will hear.\" For You, Lord, answer in times of trouble, and redeem and rescue in every time of trouble and distress."
    }]
  },

  atahChonantanu: {
    name: "Atah Chonantanu (Saturday night)",
    long: true,
    note: "Added to the 4th blessing of the Maariv Amidah, then the blessing continues as usual.",
    lines: [{
      he: "אתה חוננתנו למדע תורתך, ותלמדנו לעשות חקי רצונך, ותבדל ה׳ אלהינו בין קדש לחול, בין אור לחשך, בין ישראל לעמים, בין יום השביעי לששת ימי המעשה. אבינו מלכנו, החל עלינו הימים הבאים לקראתנו לשלום, חשוכים מכל חטא, ומנקים מכל עון, ומדבקים ביראתך.",
      tr: "Atah chonantanu l'mada Toratecha, vat'lam'deinu la'asot chukei r'tzonecha, vatavdeil Adonai Eloheinu bein kodesh l'chol, bein or l'choshech, bein Yisrael la'amim, bein yom hash'vi'i l'sheshet y'mei hama'aseh. Avinu malkeinu, hacheil aleinu hayamim haba'im likrateinu l'shalom, chasuchim mikol cheit, um'nukim mikol avon, um'dubakim b'yiratecha.",
      en: "You have graciously given us knowledge of Your Torah and taught us to keep the laws You desire. Lord our God, You have separated holy from everyday, light from darkness, Israel from the nations, and the seventh day from the six working days. Our Father, our King, let the days coming toward us begin in peace — kept from all sin, cleansed of all wrongdoing, and close to reverence for You."
    }]
  },

  hamavdil: {
    name: "Before doing any work after Shabbat",
    lines: [{
      he: "בָּרוּךְ הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחוֹל.",
      tr: "Baruch hamavdil bein kodesh l'chol.",
      en: "Blessed is the One who separates the holy from the everyday."
    }]
  },

  mashivHaruach: {
    name: "The winter phrase (2nd blessing of the Amidah)",
    lines: [{ he: "מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם.", tr: "Mashiv haruach umorid hagashem.", en: "Who makes the wind blow and the rain fall." }]
  },
  moridHatal: {
    name: "The summer phrase (2nd blessing of the Amidah)",
    note: "Ashkenazim outside Israel say nothing here in the summer; Sephardim, Chabad and everyone in Israel say \"morid hatal\".",
    lines: [{ he: "מוֹרִיד הַטָּל.", tr: "Morid hatal.", en: "Who brings down the dew." }]
  },
  talUmatar: {
    name: "The winter request (9th blessing of the Amidah)",
    note: "Sephardim say a longer winter version of the whole blessing (\"Bareich aleinu\") instead.",
    lines: [{ he: "וְתֵן טַל וּמָטָר לִבְרָכָה.", tr: "V'ten tal umatar livrachah.", en: "And give dew and rain for a blessing." }]
  },
  vtenBeracha: {
    name: "The summer request (9th blessing of the Amidah)",
    note: "Sephardim say the summer version of the whole blessing (\"Bar'cheinu\") instead.",
    lines: [{ he: "וְתֵן בְּרָכָה.", tr: "V'ten b'rachah.", en: "And give blessing." }]
  },

  aseret: {
    name: "The Ten Days additions",
    long: true,
    lines: [
      { label: "Blessing 1", he: "זָכְרֵנוּ לְחַיִּים, מֶלֶךְ חָפֵץ בַּחַיִּים, וְכָתְבֵנוּ בְּסֵפֶר הַחַיִּים, לְמַעַנְךָ אֱלֹהִים חַיִּים.", tr: "Zochreinu l'chayim, melech chafeitz bachayim, v'chotveinu b'sefer hachayim, l'ma'ancha Elohim chayim.", en: "Remember us for life, King who desires life, and write us in the book of life — for Your sake, living God." },
      { label: "Blessing 2", he: "מִי כָמוֹךָ אַב הָרַחֲמִים, זוֹכֵר יְצוּרָיו לְחַיִּים בְּרַחֲמִים.", tr: "Mi chamocha av harachamim, zocher y'tzurav l'chayim b'rachamim.", en: "Who is like You, compassionate Father, who remembers His creatures for life, with compassion?" },
      { label: "Blessing 3 — ending", he: "בָּרוּךְ אַתָּה ה׳, הַמֶּלֶךְ הַקָּדוֹשׁ.", tr: "Baruch atah Adonai, hamelech hakadosh.", en: "Blessed are You, Lord, the holy King." },
      { label: "Blessing 11 — ending (weekdays)", he: "בָּרוּךְ אַתָּה ה׳, הַמֶּלֶךְ הַמִּשְׁפָּט.", tr: "Baruch atah Adonai, hamelech hamishpat.", en: "Blessed are You, Lord, the King of justice." },
      { label: "Blessing 18", he: "וּכְתֹב לְחַיִּים טוֹבִים כָּל בְּנֵי בְרִיתֶךָ.", tr: "Uchtov l'chayim tovim kol b'nei v'ritecha.", en: "And write all the children of Your covenant for a good life." },
      { label: "Blessing 19", he: "בְּסֵפֶר חַיִּים בְּרָכָה וְשָׁלוֹם וּפַרְנָסָה טוֹבָה, נִזָּכֵר וְנִכָּתֵב לְפָנֶיךָ, אֲנַחְנוּ וְכָל עַמְּךָ בֵּית יִשְׂרָאֵל, לְחַיִּים טוֹבִים וּלְשָׁלוֹם.", tr: "B'sefer chayim, b'rachah v'shalom ufarnasah tovah, nizacheir v'nikateiv l'fanecha, anachnu v'chol amcha beit Yisrael, l'chayim tovim ul'shalom.", en: "In the book of life, blessing, peace and good livelihood, may we be remembered and written before You — we and all Your people, the House of Israel — for a good life and for peace." }
    ]
  },

  omerCount: (opts = {}) => {
    const n = opts.day;
    if (!n) return null;
    const w = omerCountWords(n);
    // Nusach Sefard (Chassidic) counts "la'omer", like Sephardim and Chabad.
    const sefard = typeof currentProfile !== "undefined" && currentProfile && currentProfile.nusach === "sefard";
    const ba = opts.community === "ashkenazi" && !sefard;
    return {
      name: `Counting the Omer — day ${n}`,
      note: ba ? "Shown with \"ba'omer\" (בעמר), as in most Ashkenazi siddurim; others say \"la'omer\" (לעמר)." : "Shown with \"la'omer\" (לעמר); many Ashkenazim say \"ba'omer\" (בעמר). Follow your siddur.",
      lines: [
        ptBlessingLine("omer", "First, the blessing"),
        {
          label: "Then the count",
          he: `היום ${w.he} ${ba ? "בעמר" : "לעמר"}.`,
          tr: `Hayom ${w.tr} ${ba ? "ba'omer" : "la'omer"}.`,
          en: `${w.en} of the Omer.`
        }
      ]
    };
  },

  lechaDodi: {
    name: "Lecha Dodi (the refrain)",
    note: "Sung at Kabbalat Shabbat, between each of its nine verses. At the last verse everyone turns to face the door to welcome Shabbat.",
    lines: [{
      he: "לְכָה דוֹדִי לִקְרַאת כַּלָּה, פְּנֵי שַׁבָּת נְקַבְּלָה.",
      tr: "L'chah dodi likrat kallah, p'nei Shabbat n'kab'lah.",
      en: "Come, my beloved, to meet the bride — let us welcome the Shabbat."
    }]
  },

  shalomAleichem: {
    name: "Shalom Aleichem",
    long: true,
    note: "Sung at the table before Kiddush; many sing each verse three times.",
    lines: [
      { he: "שלום עליכם מלאכי השרת מלאכי עליון, ממלך מלכי המלכים הקדוש ברוך הוא.", tr: "Shalom aleichem, malachei hashareit, malachei elyon, mimelech malchei ham'lachim, HaKadosh Baruch Hu.", en: "Peace be with you, ministering angels, angels of the Most High — from the King of kings, the Holy One, blessed be He." },
      { he: "בואכם לשלום מלאכי השלום מלאכי עליון, ממלך מלכי המלכים הקדוש ברוך הוא.", tr: "Bo'achem l'shalom, malachei hashalom, malachei elyon, mimelech malchei ham'lachim, HaKadosh Baruch Hu.", en: "Come in peace, angels of peace…" },
      { he: "ברכוני לשלום מלאכי השלום מלאכי עליון, ממלך מלכי המלכים הקדוש ברוך הוא.", tr: "Bar'chuni l'shalom, malachei hashalom, malachei elyon, mimelech malchei ham'lachim, HaKadosh Baruch Hu.", en: "Bless me with peace, angels of peace…" },
      { he: "צאתכם לשלום מלאכי השלום מלאכי עליון, ממלך מלכי המלכים הקדוש ברוך הוא.", tr: "Tzeit'chem l'shalom, malachei hashalom, malachei elyon, mimelech malchei ham'lachim, HaKadosh Baruch Hu.", en: "Go in peace, angels of peace…" }
    ]
  },

  kiddushShabbatNight: {
    name: "Friday-night Kiddush",
    long: true,
    note: "Stand or sit according to your family's custom, holding a full cup of wine or grape juice. Wording differs slightly between siddurim.",
    lines: [
      {
        label: "Genesis 2:1–3",
        he: "יום הששי. ויכלו השמים והארץ וכל צבאם. ויכל אלהים ביום השביעי מלאכתו אשר עשה, וישבת ביום השביעי מכל מלאכתו אשר עשה. ויברך אלהים את יום השביעי ויקדש אתו, כי בו שבת מכל מלאכתו אשר ברא אלהים לעשות.",
        tr: "Yom hashishi. Vay'chulu hashamayim v'ha'aretz v'chol tz'va'am. Vay'chal Elohim bayom hash'vi'i m'lachto asher asah, vayishbot bayom hash'vi'i mikol m'lachto asher asah. Vay'varech Elohim et yom hash'vi'i vay'kadeish oto, ki vo shavat mikol m'lachto asher bara Elohim la'asot.",
        en: "The sixth day. The heavens and the earth were finished, with everything in them. On the seventh day God finished the work He had done, and on the seventh day He rested from all the work He had done. God blessed the seventh day and made it holy, because on it He rested from all His work of creation."
      },
      { label: "Over the wine", he: "סַבְרִי מָרָנָן. בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן.", tr: "Savri maranan. Baruch atah Adonai, Eloheinu melech ha'olam, borei p'ri hagafen.", en: "With your permission: Blessed are You, Lord our God, King of the universe, who creates the fruit of the vine." },
      {
        label: "The Kiddush blessing",
        he: "בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְרָצָה בָנוּ, וְשַׁבַּת קָדְשׁוֹ בְּאַהֲבָה וּבְרָצוֹן הִנְחִילָנוּ, זִכָּרוֹן לְמַעֲשֵׂה בְרֵאשִׁית. כִּי הוּא יוֹם תְּחִלָּה לְמִקְרָאֵי קֹדֶשׁ, זֵכֶר לִיצִיאַת מִצְרָיִם. כִּי בָנוּ בָחַרְתָּ וְאוֹתָנוּ קִדַּשְׁתָּ מִכָּל הָעַמִּים, וְשַׁבַּת קָדְשְׁךָ בְּאַהֲבָה וּבְרָצוֹן הִנְחַלְתָּנוּ. בָּרוּךְ אַתָּה ה׳, מְקַדֵּשׁ הַשַּׁבָּת.",
        tr: "Baruch atah Adonai, Eloheinu melech ha'olam, asher kid'shanu b'mitzvotav v'ratzah vanu, v'Shabbat kodsho b'ahavah uv'ratzon hinchilanu, zikaron l'ma'aseh v'reishit. Ki hu yom t'chilah l'mikra'ei kodesh, zecher litziat Mitzrayim. Ki vanu vacharta v'otanu kidashta mikol ha'amim, v'Shabbat kodsh'cha b'ahavah uv'ratzon hinchaltanu. Baruch atah Adonai, m'kadeish haShabbat.",
        en: "Blessed are You, Lord our God, King of the universe, who has made us holy with His commandments and delighted in us, and lovingly and willingly gave us His holy Shabbat as an inheritance — a reminder of the work of creation. It is the first of the holy days, a reminder of the Exodus from Egypt. For You chose us and made us holy among all peoples, and lovingly and willingly gave us Your holy Shabbat as an inheritance. Blessed are You, Lord, who makes Shabbat holy."
      }
    ]
  },

  kiddushShabbatDay: {
    name: "Shabbat-morning Kiddush",
    long: true,
    note: "Before lunch, over wine or grape juice. Many say more verses first — follow your siddur.",
    lines: [
      {
        label: "Exodus 31:16–17",
        he: "ושמרו בני ישראל את השבת, לעשות את השבת לדרתם ברית עולם. ביני ובין בני ישראל אות היא לעלם, כי ששת ימים עשה ה׳ את השמים ואת הארץ, וביום השביעי שבת וינפש.",
        tr: "V'shamru v'nei Yisrael et haShabbat, la'asot et haShabbat l'dorotam b'rit olam. Beini uvein b'nei Yisrael ot hi l'olam, ki sheshet yamim asah Adonai et hashamayim v'et ha'aretz, uvayom hash'vi'i shavat vayinafash.",
        en: "The children of Israel shall keep Shabbat, making Shabbat throughout their generations an everlasting covenant. It is a sign between Me and the children of Israel forever, for in six days the Lord made the heavens and the earth, and on the seventh day He rested and was refreshed."
      },
      { he: "על כן ברך ה׳ את יום השבת ויקדשהו.", tr: "Al kein beirach Adonai et yom haShabbat vay'kad'sheihu.", en: "That is why the Lord blessed the Shabbat day and made it holy." },
      { label: "Over the wine", he: "סַבְרִי מָרָנָן. בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן.", tr: "Savri maranan. Baruch atah Adonai, Eloheinu melech ha'olam, borei p'ri hagafen.", en: "With your permission: Blessed are You, Lord our God, King of the universe, who creates the fruit of the vine." }
    ]
  },

  kiddushYomTov: (opts = {}) => {
    const f = PT_FESTIVAL_NAMES[opts.festival];
    const lines = [ptBlessingLine("hagafen", "Over the wine")];
    let note = "Wording differs slightly between siddurim.";
    if (opts.festival === "roshHashana") {
      note = "Rosh Hashanah has its own Kiddush, ending \"m'kadeish Yisrael v'yom hazikaron\" — it's in the machzor. The blessing over wine and Shehecheyanu are the same.";
    } else if (f && f.season) {
      lines.push({
        label: "The Kiddush blessing",
        he: `בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בָּחַר בָּנוּ מִכָּל עָם, וְרוֹמְמָנוּ מִכָּל לָשׁוֹן, וְקִדְּשָׁנוּ בְּמִצְוֹתָיו. וַתִּתֶּן לָנוּ ה׳ אֱלֹהֵינוּ בְּאַהֲבָה מוֹעֲדִים לְשִׂמְחָה, חַגִּים וּזְמַנִּים לְשָׂשׂוֹן, אֶת יוֹם ${f.heN}, ${f.season.heN}, מִקְרָא קֹדֶשׁ, זֵכֶר לִיצִיאַת מִצְרָיִם. כִּי בָנוּ בָחַרְתָּ וְאוֹתָנוּ קִדַּשְׁתָּ מִכָּל הָעַמִּים, וּמוֹעֲדֵי קָדְשְׁךָ בְּשִׂמְחָה וּבְשָׂשׂוֹן הִנְחַלְתָּנוּ. בָּרוּךְ אַתָּה ה׳, מְקַדֵּשׁ יִשְׂרָאֵל וְהַזְּמַנִּים.`,
        tr: `Baruch atah Adonai, Eloheinu melech ha'olam, asher bachar banu mikol am, v'rom'manu mikol lashon, v'kid'shanu b'mitzvotav. Vatiten lanu Adonai Eloheinu b'ahavah mo'adim l'simchah, chagim uz'manim l'sason, et yom ${f.tr}, ${f.season.tr}, mikra kodesh, zecher litziat Mitzrayim. Ki vanu vacharta v'otanu kidashta mikol ha'amim, umo'adei kodsh'cha b'simchah uv'sason hinchaltanu. Baruch atah Adonai, m'kadeish Yisrael v'haz'manim.`,
        en: `Blessed are You, Lord our God, King of the universe, who chose us from every people, raised us above every language, and made us holy with His commandments. Lovingly, Lord our God, You gave us times for gladness, festivals and seasons for joy — ${f.en}, ${f.season.en}, a holy gathering, a reminder of the Exodus from Egypt. For You chose us and made us holy among all peoples, and gave us Your holy festivals as an inheritance, with gladness and joy. Blessed are You, Lord, who makes Israel and the seasons holy.`
      });
    }
    if (opts.shabbat) note = "Tonight is also Shabbat: the Kiddush starts with \"Vay'chulu\" and adds Shabbat words throughout — follow your siddur. " + note;
    if (opts.havdalah) note = "Tonight Shabbat ends as the festival begins, so Havdalah is woven in (\"YaKNeHaZ\"): after the Kiddush, the blessing over light (\"borei m'orei ha'eish\", over the existing candles) and Havdalah ending \"hamavdil bein kodesh l'kodesh\". " + note;
    if (opts.festival === "sukkot") lines.push(ptBlessingLine("sukkah", "In the sukkah"));
    if (opts.shehecheyanu) lines.push(ptBlessingLine("shehecheyanu", "Shehecheyanu"));
    return { name: "Festival Kiddush", long: true, note, lines: lines.filter(Boolean) };
  },

  havdalah: (opts = {}) => {
    const full = opts.afterShabbat;
    const lines = [];
    if (full) {
      lines.push({
        label: "Opening verses",
        he: "הנה אל ישועתי אבטח ולא אפחד, כי עזי וזמרת יה ה׳, ויהי לי לישועה. ושאבתם מים בששון ממעיני הישועה. לה׳ הישועה, על עמך ברכתך סלה. ה׳ צבאות עמנו, משגב לנו אלהי יעקב סלה. ה׳ צבאות, אשרי אדם בטח בך. ה׳ הושיעה, המלך יעננו ביום קראנו. ליהודים היתה אורה ושמחה וששן ויקר — כן תהיה לנו. כוס ישועות אשא, ובשם ה׳ אקרא.",
        tr: "Hinei El y'shu'ati, evtach v'lo efchad, ki azi v'zimrat Yah Adonai, vay'hi li lishu'ah. Ush'avtem mayim b'sason mima'ainei hay'shu'ah. LaAdonai hay'shu'ah, al amcha virchatecha selah. Adonai tz'va'ot imanu, misgav lanu Elohei Ya'akov selah. Adonai tz'va'ot, ashrei adam botei'ach bach. Adonai hoshi'ah, hamelech ya'aneinu v'yom kor'einu. LaY'hudim hay'tah orah v'simchah v'sason vikar — kein tihyeh lanu. Kos y'shu'ot esa, uv'sheim Adonai ekra.",
        en: "Here is God, my salvation; I will trust and not be afraid, for the Lord is my strength and my song, and He has become my salvation. With joy you will draw water from the wells of salvation. Salvation belongs to the Lord; may Your blessing be on Your people. The Lord of hosts is with us; the God of Jacob is our stronghold. Lord of hosts, happy is the one who trusts in You. Lord, save us; may the King answer us on the day we call. The Jews had light and gladness, joy and honor — so may it be for us. I will raise the cup of salvation and call on the name of the Lord."
      });
    }
    lines.push(ptBlessingLine("hagafen", "Over the wine"));
    if (full) {
      lines.push(ptBlessingLine("besamim", "Over the spices — then smell them"));
      lines.push(ptBlessingLine("fire", "Over the flame — then look at your fingernails in its light"));
    }
    lines.push({
      label: "Havdalah",
      he: `${PT_OPEN.he}, הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחוֹל, בֵּין אוֹר לְחֹשֶׁךְ, בֵּין יִשְׂרָאֵל לָעַמִּים, בֵּין יוֹם הַשְּׁבִיעִי לְשֵׁשֶׁת יְמֵי הַמַּעֲשֶׂה. בָּרוּךְ אַתָּה ה׳, הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחוֹל.`,
      tr: `${PT_OPEN.tr} hamavdil bein kodesh l'chol, bein or l'choshech, bein Yisrael la'amim, bein yom hash'vi'i l'sheshet y'mei hama'aseh. Baruch atah Adonai, hamavdil bein kodesh l'chol.`,
      en: `${PT_OPEN.en} who separates holy from everyday, light from darkness, Israel from the nations, and the seventh day from the six working days. Blessed are You, Lord, who separates holy from everyday.`
    });
    return {
      name: full ? "Havdalah" : "Havdalah after the festival",
      long: true,
      note: full
        ? "Hold the cup in your right hand. After the last blessing, drink the wine and put out the candle in a little spilled wine. Sephardim begin with different verses."
        : (opts.afterYomKippur ? "After Yom Kippur, the blessing over a flame (lit before the fast) is added, but no spices." : "After a festival that ends on a weekday: just the wine and the Havdalah blessing."),
      lines: (opts.afterYomKippur && !full)
        ? [lines[0], ptBlessingLine("fire", "Over the flame"), lines[1]].filter(Boolean)
        : lines.filter(Boolean)
    };
  },

  torahBlessings: {
    name: "The blessings when called up to the Torah (aliyah)",
    long: true,
    note: "Said by the person called up for each aliyah, before and after the reader chants that section. Your community will guide you when you're called up.",
    lines: [
      { label: "The person called up", he: "בָּרְכוּ אֶת ה׳ הַמְבֹרָךְ.", tr: "Bar'chu et Adonai ham'vorach.", en: "Bless the Lord, the blessed One." },
      { label: "Everyone answers, then the person called up repeats", he: "בָּרוּךְ ה׳ הַמְבֹרָךְ לְעוֹלָם וָעֶד.", tr: "Baruch Adonai ham'vorach l'olam va'ed.", en: "Blessed is the Lord, the blessed One, forever and ever." },
      { label: "Before the reading", he: `${PT_OPEN.he}, אֲשֶׁר בָּחַר בָּנוּ מִכָּל הָעַמִּים, וְנָתַן לָנוּ אֶת תּוֹרָתוֹ. בָּרוּךְ אַתָּה ה׳, נוֹתֵן הַתּוֹרָה.`, tr: `${PT_OPEN.tr} asher bachar banu mikol ha'amim, v'natan lanu et Torato. Baruch atah Adonai, notein haTorah.`, en: `${PT_OPEN.en} who chose us from all peoples and gave us His Torah. Blessed are You, Lord, who gives the Torah.` },
      { label: "After the reading", he: `${PT_OPEN.he}, אֲשֶׁר נָתַן לָנוּ תּוֹרַת אֱמֶת, וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵנוּ. בָּרוּךְ אַתָּה ה׳, נוֹתֵן הַתּוֹרָה.`, tr: `${PT_OPEN.tr} asher natan lanu Torat emet, v'chayei olam nata b'tocheinu. Baruch atah Adonai, notein haTorah.`, en: `${PT_OPEN.en} who gave us a Torah of truth and planted everlasting life within us. Blessed are You, Lord, who gives the Torah.` }
    ]
  },

  hallel: (opts = {}) => {
    const half = opts.half;
    return {
      name: half ? "Half Hallel (Psalms 113–118, shortened)" : "Hallel (Psalms 113–118)",
      long: true,
      note: half
        ? "In half Hallel, the first 11 verses of Psalms 115 and 116 are skipped. Ashkenazim and Chabad say the blessing before it; Sephardim say half Hallel without a blessing."
        : "Said standing, right after the Shacharit Amidah. Sephardim say the blessing as \"likro et haHallel\".",
      lines: (half && opts.community === "sephardi") ? [] : [ptBlessingLine("hallel", "The blessing before Hallel")].filter(Boolean),
      sefaria: half
        ? ["Psalms.113", "Psalms.114", "Psalms.115.12-18", "Psalms.116.12-19", "Psalms.117", "Psalms.118"]
        : ["Psalms.113", "Psalms.114", "Psalms.115", "Psalms.116", "Psalms.117", "Psalms.118"]
    };
  },

  // --- Waking up and the morning --------------------------------------------

  modehAni: {
    name: "Modeh Ani",
    note: "Said lying in bed, as soon as you wake. A woman says \"modah\" (מוֹדָה). It has no name of God, so it's said even before washing.",
    lines: [{
      he: "מוֹדֶה אֲנִי לְפָנֶיךָ, מֶלֶךְ חַי וְקַיָּם, שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה, רַבָּה אֱמוּנָתֶךָ.",
      tr: "Modeh (women: modah) ani l'fanecha, melech chai v'kayam, shehechezarta bi nishmati b'chemlah, rabah emunatecha.",
      en: "I thank You, living and eternal King, for You have returned my soul to me with compassion. Great is Your faithfulness."
    }]
  },

  asherYatzar: {
    name: "Asher Yatzar (after using the bathroom)",
    long: true,
    note: "Said after using the bathroom and washing your hands — and each morning as part of the morning blessings. Sephardim add \"afilu sha'ah achat\" (even for one hour).",
    lines: [{
      he: "בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר יָצַר אֶת הָאָדָם בְּחָכְמָה, וּבָרָא בוֹ נְקָבִים נְקָבִים, חֲלוּלִים חֲלוּלִים. גָּלוּי וְיָדוּעַ לִפְנֵי כִסֵּא כְבוֹדֶךָ, שֶׁאִם יִפָּתֵחַ אֶחָד מֵהֶם, אוֹ יִסָּתֵם אֶחָד מֵהֶם, אִי אֶפְשַׁר לְהִתְקַיֵּם וְלַעֲמוֹד לְפָנֶיךָ. בָּרוּךְ אַתָּה ה׳, רוֹפֵא כָל בָּשָׂר וּמַפְלִיא לַעֲשׂוֹת.",
      tr: "Baruch atah Adonai, Eloheinu melech ha'olam, asher yatzar et ha'adam b'chochmah, uvara vo n'kavim n'kavim, chalulim chalulim. Galui v'yadua lifnei chisei ch'vodecha, she'im yipatei'ach echad meihem, o yisateim echad meihem, i efshar l'hitkayeim v'la'amod l'fanecha. Baruch atah Adonai, rofei chol basar umafli la'asot.",
      en: "Blessed are You, Lord our God, King of the universe, who formed the human body with wisdom, and created in it many openings and many hollows. It is clear and known before Your throne of glory that if one of them were opened, or one of them were blocked, it would be impossible to survive and stand before You. Blessed are You, Lord, who heals all flesh and does wonders."
    }]
  },

  elokaiNeshama: {
    name: "Elohai Neshamah (the soul You gave me)",
    long: true,
    note: "Said right after Asher Yatzar in the morning blessings.",
    lines: [{
      he: "אֱלֹהַי, נְשָׁמָה שֶׁנָּתַתָּ בִּי טְהוֹרָה הִיא. אַתָּה בְרָאתָהּ, אַתָּה יְצַרְתָּהּ, אַתָּה נְפַחְתָּהּ בִּי, וְאַתָּה מְשַׁמְּרָהּ בְּקִרְבִּי, וְאַתָּה עָתִיד לִטְּלָהּ מִמֶּנִּי, וּלְהַחֲזִירָהּ בִּי לֶעָתִיד לָבוֹא. כָּל זְמַן שֶׁהַנְּשָׁמָה בְקִרְבִּי, מוֹדֶה אֲנִי לְפָנֶיךָ, ה׳ אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי, רִבּוֹן כָּל הַמַּעֲשִׂים, אֲדוֹן כָּל הַנְּשָׁמוֹת. בָּרוּךְ אַתָּה ה׳, הַמַּחֲזִיר נְשָׁמוֹת לִפְגָרִים מֵתִים.",
      tr: "Elohai, n'shamah shenatata bi t'horah hi. Atah v'ratah, atah y'tzartah, atah n'fachtah bi, v'atah m'sham'rah b'kirbi, v'atah atid lit'lah mimeni, ul'hachazirah bi le'atid lavo. Kol z'man shehan'shamah v'kirbi, modeh ani l'fanecha, Adonai Elohai vEilohei avotai, ribon kol hama'asim, adon kol han'shamot. Baruch atah Adonai, hamachazir n'shamot lifgarim meitim.",
      en: "My God, the soul You placed in me is pure. You created it, You formed it, You breathed it into me, and You guard it within me. One day You will take it from me, and return it to me in the time to come. As long as the soul is within me, I thank You, Lord my God and God of my ancestors, Master of all creation, Lord of all souls. Blessed are You, Lord, who restores souls to lifeless bodies."
    }]
  },

  morningTorahBlessings: {
    name: "The Torah blessings (each morning)",
    long: true,
    note: "Said once each morning, before learning any Torah. Sephardim end the first one \"al divrei Torah\".",
    lines: [
      { label: "1", he: `${BLESSING_OPEN.he}, ${MITZVAH_OPEN.he} לַעֲסֹק בְּדִבְרֵי תוֹרָה.`, tr: `${BLESSING_OPEN.tr} ${MITZVAH_OPEN.tr} la'asok b'divrei Torah.`, en: `${BLESSING_OPEN.en} ${MITZVAH_OPEN.en} to engage in the words of Torah.` },
      {
        label: "2",
        he: "וְהַעֲרֶב נָא ה׳ אֱלֹהֵינוּ אֶת דִּבְרֵי תוֹרָתְךָ בְּפִינוּ וּבְפִי עַמְּךָ בֵּית יִשְׂרָאֵל, וְנִהְיֶה אֲנַחְנוּ וְצֶאֱצָאֵינוּ וְצֶאֱצָאֵי עַמְּךָ בֵּית יִשְׂרָאֵל, כֻּלָּנוּ יוֹדְעֵי שְׁמֶךָ וְלוֹמְדֵי תוֹרָתְךָ לִשְׁמָהּ. בָּרוּךְ אַתָּה ה׳, הַמְלַמֵּד תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל.",
        tr: "V'ha'arev na Adonai Eloheinu et divrei Torat'cha b'finu uv'fi am'cha beit Yisrael, v'nihyeh anachnu v'tze'etza'einu v'tze'etza'ei am'cha beit Yisrael, kulanu yod'ei sh'mecha v'lom'dei Toratecha lishmah. Baruch atah Adonai, ham'lameid Torah l'amo Yisrael.",
        en: "Lord our God, make the words of Your Torah sweet in our mouths and in the mouths of Your people, the House of Israel, so that we, our children and the children of Your people may all know Your name and learn Your Torah for its own sake. Blessed are You, Lord, who teaches Torah to His people Israel."
      },
      ptFull("3", "אֲשֶׁר בָּחַר בָּנוּ מִכָּל הָעַמִּים וְנָתַן לָנוּ אֶת תּוֹרָתוֹ. בָּרוּךְ אַתָּה ה׳, נוֹתֵן הַתּוֹרָה.", "asher bachar banu mikol ha'amim v'natan lanu et Torato. Baruch atah Adonai, notein haTorah.", "who chose us from all peoples and gave us His Torah. Blessed are You, Lord, who gives the Torah.")
    ]
  },

  morningBlessings: {
    name: "Birchot HaShachar — the morning blessings",
    long: true,
    note: "Short thank-yous for waking into a new day, said each morning. Most siddurim also have three blessings about who we are, right after the first one — their wording differs for men, women and converts, so learn those with your rabbi. The order varies a little between communities.",
    lines: [
      ptFull(null, "אֲשֶׁר נָתַן לַשֶּׂכְוִי בִינָה לְהַבְחִין בֵּין יוֹם וּבֵין לָיְלָה.", "asher natan lasechvi vinah l'havchin bein yom uvein lailah.", "who gave the rooster understanding to tell day from night."),
      ptFull(null, "פּוֹקֵחַ עִוְרִים.", "pokei'ach ivrim.", "who opens the eyes of the blind."),
      ptFull(null, "מַלְבִּישׁ עֲרֻמִּים.", "malbish arumim.", "who clothes the naked."),
      ptFull(null, "מַתִּיר אֲסוּרִים.", "matir asurim.", "who frees the bound."),
      ptFull(null, "זוֹקֵף כְּפוּפִים.", "zokeif k'fufim.", "who raises up those bent low."),
      ptFull(null, "רוֹקַע הָאָרֶץ עַל הַמָּיִם.", "roka ha'aretz al hamayim.", "who spreads the earth over the waters."),
      ptFull(null, "שֶׁעָשָׂה לִי כָּל צָרְכִּי.", "she'asah li kol tzorki.", "who has provided for all my needs."),
      ptFull(null, "הַמֵּכִין מִצְעֲדֵי גָבֶר.", "hameichin mitz'adei gaver.", "who makes a person's steps firm."),
      ptFull(null, "אוֹזֵר יִשְׂרָאֵל בִּגְבוּרָה.", "ozeir Yisrael bigvurah.", "who girds Israel with strength."),
      ptFull(null, "עוֹטֵר יִשְׂרָאֵל בְּתִפְאָרָה.", "oteir Yisrael b'tifarah.", "who crowns Israel with glory."),
      ptFull(null, "הַנּוֹתֵן לַיָּעֵף כֹּחַ.", "hanotein laya'eif ko'ach.", "who gives strength to the weary."),
      ptFull(null,
        "הַמַּעֲבִיר שֵׁנָה מֵעֵינָי וּתְנוּמָה מֵעַפְעַפָּי. וִיהִי רָצוֹן מִלְּפָנֶיךָ ה׳ אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתַּרְגִּילֵנוּ בְּתוֹרָתֶךָ, וְדַבְּקֵנוּ בְּמִצְוֹתֶיךָ, וְאַל תְּבִיאֵנוּ לֹא לִידֵי חֵטְא, וְלֹא לִידֵי עֲבֵרָה וְעָוֹן, וְלֹא לִידֵי נִסָּיוֹן, וְלֹא לִידֵי בִזָּיוֹן, וְאַל תַּשְׁלֶט בָּנוּ יֵצֶר הָרָע, וְהַרְחִיקֵנוּ מֵאָדָם רָע וּמֵחָבֵר רָע, וְדַבְּקֵנוּ בְּיֵצֶר הַטּוֹב וּבְמַעֲשִׂים טוֹבִים, וְכֹף אֶת יִצְרֵנוּ לְהִשְׁתַּעְבֶּד לָךְ, וּתְנֵנוּ הַיּוֹם וּבְכָל יוֹם לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל רוֹאֵינוּ, וְתִגְמְלֵנוּ חֲסָדִים טוֹבִים. בָּרוּךְ אַתָּה ה׳, הַגּוֹמֵל חֲסָדִים טוֹבִים לְעַמּוֹ יִשְׂרָאֵל.",
        "hama'avir sheinah mei'einai ut'numah mei'af'apai. Vihi ratzon mil'fanecha, Adonai Eloheinu vEilohei avoteinu, shetargileinu b'Toratecha, v'dab'keinu b'mitzvotecha, v'al t'vi'einu lo lidei cheit, v'lo lidei aveirah v'avon, v'lo lidei nisayon, v'lo lidei vizayon, v'al tashlet banu yeitzer hara, v'harchikeinu mei'adam ra umeichaver ra, v'dab'keinu b'yeitzer hatov uv'ma'asim tovim, v'chof et yitzreinu l'hishta'bed lach, ut'neinu hayom uv'chol yom l'chein ul'chesed ul'rachamim b'einecha uv'einei chol ro'einu, v'tigm'leinu chasadim tovim. Baruch atah Adonai, hagomeil chasadim tovim l'amo Yisrael.",
        "who removes sleep from my eyes and slumber from my eyelids. May it be Your will, Lord our God and God of our ancestors, to make us at home in Your Torah and attach us to Your commandments. Don't bring us to sin or wrongdoing, to temptation or to shame; don't let our bad inclination rule us; keep us far from bad people and bad company. Attach us to our good inclination and to good deeds, and bend our will to serve You. Today and every day, let us find grace, kindness and compassion in Your eyes and in the eyes of all who see us, and repay us with loving kindness. Blessed are You, Lord, who gives loving kindness to His people Israel.")
    ]
  },

  tallitTefillin: (opts = {}) => {
    const oneBlessing = opts.community === "sephardi" || opts.community === "chabad";
    const lines = [
      ptBlessingLine("tallit", "Tallit — hold it, then say this before wrapping yourself in it"),
      ptBlessingLine("tefillinHand", "Hand tefillin — once it's on the arm, before tightening")
    ];
    if (!oneBlessing) {
      lines.push(ptBlessingLine("tefillinHead", "Head tefillin — before tightening (Ashkenazi custom)"));
      lines.push({ label: "Then, quietly", he: "בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד.", tr: "Baruch shem k'vod malchuto l'olam va'ed.", en: "Blessed be the name of His glorious kingdom forever and ever." });
    }
    return {
      name: "The blessings for tallit and tefillin",
      note: oneBlessing
        ? "Sephardim and Chabad say one blessing (\"l'hani'ach t'filin\") for both hand and head tefillin. Don't talk between putting on the hand and the head tefillin."
        : "Ashkenazim say a second blessing on the head tefillin; Sephardim and Chabad say only the first. Don't talk between putting on the hand and the head tefillin. Wearing a tallit katan instead? Its blessing is \"al mitzvat tzitzit\".",
      lines: lines.filter(Boolean)
    };
  },

  shema: {
    name: "The Shema",
    long: true,
    note: "Cover your eyes with your right hand for the first line, then say the next line quietly. The three paragraphs that follow load from Sefaria.",
    lines: [
      { he: "שְׁמַע יִשְׂרָאֵל, ה׳ אֱלֹהֵינוּ, ה׳ אֶחָד.", tr: "Sh'ma Yisrael, Adonai Eloheinu, Adonai echad.", en: "Hear, Israel: the Lord is our God, the Lord is One." },
      { label: "Quietly", he: "בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד.", tr: "Baruch shem k'vod malchuto l'olam va'ed.", en: "Blessed be the name of His glorious kingdom forever and ever." }
    ],
    sefaria: ["Deuteronomy.6.5-9", "Deuteronomy.11.13-21", "Numbers.15.37-41"],
    sefariaLabels: ["V'ahavta — Deuteronomy 6:5–9", "V'hayah — Deuteronomy 11:13–21", "Vayomer — Numbers 15:37–41"],
    sefariaLink: "https://www.sefaria.org/Deuteronomy.6.4-9",
    sefariaFail: "Couldn't load the paragraphs right now — they're Deuteronomy 6:5–9, 11:13–21 and Numbers 15:37–41, in any siddur."
  },

  bedtimeShema: {
    name: "The Shema before sleep",
    long: true,
    note: "Many first say a short prayer forgiving anyone who hurt them that day. Customs differ on whether Hamapil comes first or last, right before sleep. The siddur has the full bedtime Shema.",
    lines: [
      {
        label: "Hamapil",
        he: "בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמַּפִּיל חֶבְלֵי שֵׁנָה עַל עֵינָי, וּתְנוּמָה עַל עַפְעַפָּי. וִיהִי רָצוֹן מִלְּפָנֶיךָ ה׳ אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי, שֶׁתַּשְׁכִּיבֵנִי לְשָׁלוֹם וְתַעֲמִידֵנִי לְשָׁלוֹם, וְאַל יְבַהֲלוּנִי רַעְיוֹנַי וַחֲלוֹמוֹת רָעִים וְהִרְהוּרִים רָעִים, וּתְהֵא מִטָּתִי שְׁלֵמָה לְפָנֶיךָ, וְהָאֵר עֵינַי פֶּן אִישַׁן הַמָּוֶת, כִּי אַתָּה הַמֵּאִיר לְאִישׁוֹן בַּת עָיִן. בָּרוּךְ אַתָּה ה׳, הַמֵּאִיר לָעוֹלָם כֻּלּוֹ בִּכְבוֹדוֹ.",
        tr: "Baruch atah Adonai, Eloheinu melech ha'olam, hamapil chevlei sheinah al einai, ut'numah al af'apai. Vihi ratzon mil'fanecha, Adonai Elohai vEilohei avotai, shetashkiveini l'shalom v'ta'amideini l'shalom, v'al y'vahaluni ra'yonai vachalomot ra'im v'hirhurim ra'im, ut'hei mitati sh'leimah l'fanecha, v'ha'eir einai pen ishan hamavet, ki atah hamei'ir l'ishon bat ayin. Baruch atah Adonai, hamei'ir la'olam kulo bichvodo.",
        en: "Blessed are You, Lord our God, King of the universe, who lays the bonds of sleep on my eyes and slumber on my eyelids. May it be Your will, Lord my God and God of my ancestors, to let me lie down in peace and rise up in peace. Let no troubling thoughts, bad dreams or bad imaginings disturb me; may my bed be whole before You. Give light to my eyes, so I don't sleep the sleep of death, for You give light to the pupil of the eye. Blessed are You, Lord, who gives light to the whole world in His glory."
      },
      { label: "The Shema", he: "שְׁמַע יִשְׂרָאֵל, ה׳ אֱלֹהֵינוּ, ה׳ אֶחָד.", tr: "Sh'ma Yisrael, Adonai Eloheinu, Adonai echad.", en: "Hear, Israel: the Lord is our God, the Lord is One." },
      { label: "Quietly", he: "בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד.", tr: "Baruch shem k'vod malchuto l'olam va'ed.", en: "Blessed be the name of His glorious kingdom forever and ever." }
    ]
  },

  // --- Food ------------------------------------------------------------------

  alHamichya: {
    name: "Al HaMichyah (after cake, crackers or pasta)",
    long: true,
    note: "This is the version after grain foods. After wine, or after grapes, figs, pomegranates, olives or dates, a few words change — and on Shabbat, Rosh Chodesh and festivals a line is added. A siddur or bencher shows every version.",
    lines: [{
      he: "בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עַל הַמִּחְיָה וְעַל הַכַּלְכָּלָה, וְעַל תְּנוּבַת הַשָּׂדֶה, וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה, שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ, לֶאֱכוֹל מִפִּרְיָהּ וְלִשְׂבּוֹעַ מִטּוּבָהּ. רַחֶם נָא ה׳ אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ, וְעַל יְרוּשָׁלַיִם עִירֶךָ, וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ, וְעַל מִזְבְּחֶךָ וְעַל הֵיכָלֶךָ. וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ, וְהַעֲלֵנוּ לְתוֹכָהּ, וְשַׂמְּחֵנוּ בְּבִנְיָנָהּ, וְנֹאכַל מִפִּרְיָהּ וְנִשְׂבַּע מִטּוּבָהּ, וּנְבָרֶכְךָ עָלֶיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה. כִּי אַתָּה ה׳ טוֹב וּמֵטִיב לַכֹּל, וְנוֹדֶה לְּךָ עַל הָאָרֶץ וְעַל הַמִּחְיָה. בָּרוּךְ אַתָּה ה׳, עַל הָאָרֶץ וְעַל הַמִּחְיָה.",
      tr: "Baruch atah Adonai, Eloheinu melech ha'olam, al hamichyah v'al hakalkalah, v'al t'nuvat hasadeh, v'al eretz chemdah tovah ur'chavah, sheratzita v'hinchalta la'avoteinu, le'echol mipiryah v'lisbo'a mituvah. Racheim na Adonai Eloheinu al Yisrael amecha, v'al Y'rushalayim irecha, v'al Tziyon mishkan k'vodecha, v'al mizb'checha v'al heichalecha. Uv'neih Y'rushalayim ir hakodesh bimheirah v'yameinu, v'ha'aleinu l'tochah, v'sam'cheinu b'vinyanah, v'nochal mipiryah v'nisba mituvah, unvarech'cha aleha bikdushah uv'taharah. Ki atah Adonai tov umeitiv lakol, v'nodeh l'cha al ha'aretz v'al hamichyah. Baruch atah Adonai, al ha'aretz v'al hamichyah.",
      en: "Blessed are You, Lord our God, King of the universe, for the nourishment and the sustenance, for the produce of the field, and for the lovely, good and spacious land that You gave our ancestors as a heritage, to eat of its fruit and be satisfied with its goodness. Have compassion, Lord our God, on Israel Your people, on Jerusalem Your city, on Zion where Your glory dwells, on Your altar and on Your Temple. Rebuild Jerusalem, the holy city, soon in our days; bring us up into it and let us rejoice in its rebuilding, eat of its fruit and be satisfied with its goodness, and bless You for it in holiness and purity. For You, Lord, are good and do good to all, and we thank You for the land and for the nourishment. Blessed are You, Lord, for the land and for the nourishment."
    }]
  },

  birkatHamazon: {
    name: "Birkat HaMazon (Grace After Meals)",
    long: true,
    note: "Said after a meal with bread. With three or more adults, it opens with an invitation (zimun). The full text loads from Sefaria (Siddur Ashkenaz), with the extra lines for Shabbat and holidays marked.",
    lines: [],
    sefaria: ["Siddur_Ashkenaz,_Berachot,_Birkat_HaMazon"],
    sefariaLabels: [""],
    sefariaParagraphs: true,
    sefariaLink: "https://www.sefaria.org/Siddur_Ashkenaz,_Berachot,_Birkat_HaMazon",
    sefariaFail: "Couldn't load it right now — Birkat HaMazon is in any siddur or bencher (a small booklet many homes keep by the table)."
  },

  yehiRatzonApple: {
    name: "The apple in honey (Rosh Hashanah)",
    note: "After HaMotzi over the challah: say the blessing over the apple, then the short prayer, then eat.",
    lines: [
      ptBlessingLine("haetz", "Over the apple"),
      {
        label: "Then",
        he: "יְהִי רָצוֹן מִלְּפָנֶיךָ ה׳ אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתְּחַדֵּשׁ עָלֵינוּ שָׁנָה טוֹבָה וּמְתוּקָה.",
        tr: "Y'hi ratzon mil'fanecha, Adonai Eloheinu vEilohei avoteinu, shet'chadeish aleinu shanah tovah um'tukah.",
        en: "May it be Your will, Lord our God and God of our ancestors, to renew for us a good and sweet year."
      }
    ]
  },

  // --- Home, family and travel -------------------------------------------------

  eishetChayil: {
    name: "Eishet Chayil — A woman of valor",
    long: true,
    note: "Sung on Friday night after Shalom Aleichem, before Kiddush — traditionally by the husband, honoring his wife (and, many say, the Shabbat and the Torah too). It's the closing poem of Proverbs, loaded from Sefaria.",
    lines: [],
    sefaria: ["Proverbs.31.10-31"],
    sefariaLabels: ["Proverbs 31:10–31"],
    sefariaLink: "https://www.sefaria.org/Proverbs.31.10-31",
    sefariaFail: "Couldn't load it right now — Eishet Chayil is Proverbs 31:10–31, printed in most benchers and siddurim before Kiddush."
  },

  blessingChildren: {
    name: "Blessing the children (Friday night)",
    note: "Parents rest their hands on each child's head. Some add a few words of their own afterwards.",
    lines: [
      { label: "For a boy", he: "יְשִׂמְךָ אֱלֹהִים כְּאֶפְרַיִם וְכִמְנַשֶּׁה.", tr: "Y'simcha Elohim k'Efrayim v'chi'Menasheh.", en: "May God make you like Ephraim and Menashe." },
      { label: "For a girl", he: "יְשִׂמֵךְ אֱלֹהִים כְּשָׂרָה רִבְקָה רָחֵל וְלֵאָה.", tr: "Y'simeich Elohim k'Sarah, Rivkah, Rachel v'Lei'ah.", en: "May God make you like Sarah, Rebecca, Rachel and Leah." },
      { label: "Then, for every child — the Priestly Blessing", he: "יְבָרֶכְךָ ה׳ וְיִשְׁמְרֶךָ. יָאֵר ה׳ פָּנָיו אֵלֶיךָ וִיחֻנֶּךָּ. יִשָּׂא ה׳ פָּנָיו אֵלֶיךָ וְיָשֵׂם לְךָ שָׁלוֹם.", tr: "Y'varech'cha Adonai v'yishm'recha. Ya'eir Adonai panav eilecha vichuneka. Yisa Adonai panav eilecha v'yaseim l'cha shalom.", en: "May the Lord bless you and keep you. May the Lord shine His face on you and be gracious to you. May the Lord turn His face toward you and give you peace." }
    ]
  },

  tefillatHaderech: {
    name: "Tefillat HaDerech (the traveler's prayer)",
    long: true,
    note: "Said once you're on your way, outside your city, on a trip of a few miles or more — once a day. The words in parentheses are said if you plan to be home the same day.",
    lines: [{
      he: "יְהִי רָצוֹן מִלְּפָנֶיךָ ה׳ אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתּוֹלִיכֵנוּ לְשָׁלוֹם וְתַצְעִידֵנוּ לְשָׁלוֹם וְתַדְרִיכֵנוּ לְשָׁלוֹם, וְתַגִּיעֵנוּ לִמְחוֹז חֶפְצֵנוּ לְחַיִּים וּלְשִׂמְחָה וּלְשָׁלוֹם (וְתַחֲזִירֵנוּ לְשָׁלוֹם), וְתַצִּילֵנוּ מִכַּף כָּל אוֹיֵב וְאוֹרֵב וְלִסְטִים וְחַיּוֹת רָעוֹת בַּדֶּרֶךְ, וּמִכָּל מִינֵי פֻּרְעָנֻיּוֹת הַמִּתְרַגְּשׁוֹת לָבוֹא לָעוֹלָם, וְתִשְׁלַח בְּרָכָה בְּכָל מַעֲשֵׂה יָדֵינוּ, וְתִתְּנֵנוּ לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל רוֹאֵינוּ, וְתִשְׁמַע קוֹל תַּחֲנוּנֵינוּ, כִּי אֵל שׁוֹמֵעַ תְּפִלָּה וְתַחֲנוּן אָתָּה. בָּרוּךְ אַתָּה ה׳, שׁוֹמֵעַ תְּפִלָּה.",
      tr: "Y'hi ratzon mil'fanecha, Adonai Eloheinu vEilohei avoteinu, shetolicheinu l'shalom v'tatz'ideinu l'shalom v'tadricheinu l'shalom, v'tagi'einu limchoz cheftzeinu l'chayim ul'simchah ul'shalom (v'tachazireinu l'shalom), v'tatzileinu mikaf kol oyeiv v'oreiv v'listim v'chayot ra'ot baderech, umikol minei pur'aniyot hamitrag'shot lavo la'olam, v'tishlach b'rachah b'chol ma'aseih yadeinu, v'tit'neinu l'chein ul'chesed ul'rachamim b'einecha uv'einei chol ro'einu, v'tishma kol tachanuneinu, ki El shomei'a t'filah v'tachanun atah. Baruch atah Adonai, shomei'a t'filah.",
      en: "May it be Your will, Lord our God and God of our ancestors, to lead us in peace, guide our steps in peace and direct us in peace; to bring us to our destination in life, joy and peace (and to bring us home in peace). Save us from every enemy and ambush, from robbers and wild animals on the way, and from every kind of trouble that comes into the world. Send blessing on the work of our hands, and let us find grace, kindness and compassion in Your eyes and in the eyes of all who see us. Hear our pleading, for You are God who hears prayer and pleading. Blessed are You, Lord, who hears prayer."
    }]
  },

  kiddushLevana: {
    name: "Kiddush Levana — the blessing over the new moon",
    long: true,
    note: "Said outdoors, looking at the moon, usually on a Saturday night between the 3rd (or 7th) and the 15th of the Hebrew month. The siddur has the verses said before and after.",
    lines: [ptFull(null,
      "אֲשֶׁר בְּמַאֲמָרוֹ בָּרָא שְׁחָקִים, וּבְרוּחַ פִּיו כָּל צְבָאָם, חֹק וּזְמַן נָתַן לָהֶם שֶׁלֹּא יְשַׁנּוּ אֶת תַּפְקִידָם. שָׂשִׂים וּשְׂמֵחִים לַעֲשׂוֹת רְצוֹן קוֹנָם, פּוֹעֵל אֱמֶת שֶׁפְּעֻלָּתוֹ אֱמֶת. וְלַלְּבָנָה אָמַר שֶׁתִּתְחַדֵּשׁ, עֲטֶרֶת תִּפְאֶרֶת לַעֲמוּסֵי בָטֶן, שֶׁהֵם עֲתִידִים לְהִתְחַדֵּשׁ כְּמוֹתָהּ, וּלְפָאֵר לְיוֹצְרָם עַל שֵׁם כְּבוֹד מַלְכוּתוֹ. בָּרוּךְ אַתָּה ה׳, מְחַדֵּשׁ חֳדָשִׁים.",
      "asher b'ma'amaro bara sh'chakim, uv'ru'ach piv kol tz'va'am. Chok uz'man natan lahem shelo y'shanu et tafkidam. Sasim us'meichim la'asot r'tzon konam, po'eil emet shep'ulato emet. V'lal'vanah amar shetitchadeish, ateret tiferet la'amusei vaten, sheheim atidim l'hitchadeish k'motah, ul'fa'eir l'yotzram al sheim k'vod malchuto. Baruch atah Adonai, m'chadeish chodashim.",
      "who created the heavens with His word, and all their hosts with the breath of His mouth. He gave them a law and a time, so they would not change their roles. They are glad and joyful to do the will of their Owner, the true Maker whose work is true. To the moon He said to renew itself — a crown of beauty for those He carried from birth, who will one day be renewed like it and praise their Creator for the glory of His kingdom. Blessed are You, Lord, who renews the months.")]
  }
};

/** A prayer text by key; returns null for unknown keys. */
function getPrayerText(key, opts) {
  const t = PRAYER_TEXTS[key];
  if (!t) return null;
  const out = typeof t === "function" ? t(opts || {}) : t;
  return key === "birkatHamazon" ? ptBirkatHamazonFor(out) : out;
}

/** Birkat HaMazon in the visitor's nusach, from Sefaria's siddur for it. */
const PT_BIRKAT_BY_NUSACH = {
  sefard: { ref: "Siddur_Sefard,_Birchat_HaMazon,_Birchat_HaMazon", name: "Siddur Sefard" },
  chabad: { ref: "Siddur_Sefard,_Birchat_HaMazon,_Birchat_HaMazon", name: "Siddur Sefard", note: "Chabad's own bencher (from Siddur Tehillat Hashem) differs from it in a few words." },
  sephardi: { ref: "Siddur_Edot_HaMizrach,_Post_Meal_Blessing", name: "Siddur Edot HaMizrach" }
};
function ptBirkatHamazonFor(t) {
  const n = typeof currentProfile !== "undefined" && currentProfile ? currentProfile.nusach : null;
  const v = PT_BIRKAT_BY_NUSACH[n];
  if (!v) return t;
  return Object.assign({}, t, {
    note: `Said after a meal with bread. With three or more adults, it opens with an invitation (zimun). The full text loads from Sefaria (${v.name}), with the extra lines for Shabbat and holidays marked.${v.note ? " " + v.note : ""}`,
    sefaria: [v.ref],
    sefariaLink: "https://www.sefaria.org/" + v.ref
  });
}

/**
 * The words for each prayer-changes item (prayer-changes.js ids). Each entry
 * returns a list of { key, opts } given { info, next, community } — `info` is
 * the day's pcDayInfo, `next` is tomorrow's (for "tonight" items).
 */
const PRAYER_CHANGE_TEXTS = {
  "yaaleh-vyavo": c => [{ key: "yaalehVyavo", opts: { festival: ptFestivalKey(c.info) } }],
  "yaaleh-tonight": c => [{ key: "yaalehVyavo", opts: { festival: ptFestivalKey(c.next) || "roshChodesh" } }],
  "hallel-full": c => [{ key: "hallel", opts: { community: c.community } }],
  "hallel-half": c => [{ key: "hallel", opts: { half: true, community: c.community } }],
  "al-hanissim": c => [{ key: "alHanissim", opts: { occasion: c.info && c.info.chanukahDay ? "chanukah" : "purim" } }],
  "al-hanissim-tonight": () => [{ key: "alHanissim", opts: { occasion: "chanukah" } }],
  "aneinu": () => [{ key: "aneinu" }],
  "atah-chonantanu": () => [{ key: "atahChonantanu" }, { key: "hamavdil" }],
  "geshem": () => [{ key: "mashivHaruach" }],
  "mashiv-haruach": () => [{ key: "mashivHaruach" }],
  "tal": () => [{ key: "moridHatal" }],
  "morid-hatal": () => [{ key: "moridHatal" }],
  "tal-umatar-start": () => [{ key: "talUmatar" }],
  "tal-umatar": () => [{ key: "talUmatar" }],
  "tal-umatar-end": () => [{ key: "vtenBeracha" }],
  "vten-beracha": () => [{ key: "vtenBeracha" }],
  "aseret-changes": () => [{ key: "aseret" }],
  "omer-tonight": c => [{ key: "omerCount", opts: { day: c.next && c.next.omerDay, community: c.community } }]
};

function prayerChangeTexts(id, ctx) {
  const f = PRAYER_CHANGE_TEXTS[id];
  return f ? f(ctx) : [];
}
