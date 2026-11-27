/**
 * community-days.js — days kept by particular communities (Chabad, Chassidic,
 * Sephardi, Ashkenazi), added to the calendar for visitors of that nusach.
 *
 * Every date is computed from the Hebrew calendar (the browser's own Intl
 * "hebrew" calendar) — nothing is tied to a Gregorian date, so it works for any
 * year. The days are added to the Hebcal event list as category "community";
 * what's shown is decided at display time by communityDayShown(), so changing
 * the nusach in Settings needs no reload.
 *
 * Who sees what: only your own community's days; "Not sure" / "Other" and "Show me
 * everything" see them all, side by side and labeled. The "Later" chips list only your own.
 */

const COMMUNITY_LABELS = { ashkenaz: "Ashkenazi", sefard: "Chassidic", sephardi: "Sephardi", chabad: "Chabad" };

/** Fixed Hebrew dates. `noTachanun`: the nusachs that skip Tachanun that day. */
const COMMUNITY_DAYS = [
  // Chabad and Chassidic
  { id: "yud-kislev", month: "Kislev", day: 10, title: "Yud Kislev", for: ["chabad"],
    blurb: "The Mitteler Rebbe (Rabbi DovBer, the second Chabad Rebbe) was freed from prison on this day in 1826. Marked with a farbrengen — a joyful gathering with stories, songs and resolutions." },
  { id: "yud-tes-kislev", month: "Kislev", day: 19, title: "Yud-Tes Kislev", for: ["chabad", "sefard"], noTachanun: ["chabad", "sefard"],
    blurb: "The \"Rosh Hashanah of Chassidut\": the Alter Rebbe, founder of Chabad, was freed from prison in 1798. It's also the yahrzeit of the Maggid of Mezeritch. Celebrated with farbrengens; many sign up to learn a part of the Talmud in the year ahead. No Tachanun." },
  { id: "alter-rebbe-yahrzeit", month: "Tevet", day: 24, title: "Yahrzeit of the Alter Rebbe", for: ["chabad"],
    blurb: "Rabbi Schneur Zalman of Liadi, founder of Chabad and author of the Tanya and the Shulchan Aruch HaRav, passed away in 1812. Many learn Tanya and give extra tzedakah." },
  { id: "yud-shvat", month: "Shevat", day: 10, title: "Yud Shevat", for: ["chabad"],
    blurb: "Yahrzeit of the Previous Rebbe, Rabbi Yosef Yitzchak Schneersohn (1950) — and the day, a year later, that the Rebbe accepted the leadership of Chabad. A day of farbrengens and good resolutions." },
  { id: "yud-alef-nissan", month: "Nisan", day: 11, title: "Yud-Alef Nissan", for: ["chabad"],
    blurb: "The Rebbe's birthday (1902). Chabad custom is to start saying the chapter of Tehillim for the Rebbe's new year, and to add in acts of kindness." },
  { id: "gimmel-tammuz", month: "Tamuz", day: 3, title: "Gimmel Tammuz", for: ["chabad"],
    blurb: "Yahrzeit of the Rebbe, Rabbi Menachem Mendel Schneerson (1994). Many visit the Ohel, learn his teachings, and take on a new good deed." },
  { id: "yud-beis-tammuz", month: "Tamuz", day: 12, title: "Yud-Beis Tammuz", for: ["chabad"], noTachanun: ["chabad"],
    blurb: "\"Chag HaGeulah\" — the Previous Rebbe was freed from Soviet imprisonment in 1927, for teaching Torah. Celebrated with farbrengens on the 12th and 13th of Tammuz. No Tachanun." },
  { id: "yud-gimmel-tammuz", month: "Tamuz", day: 13, title: "Yud-Gimmel Tammuz", for: ["chabad"], noTachanun: ["chabad"], quiet: true,
    blurb: "The second day of Chag HaGeulah, when the Previous Rebbe's release took full effect. No Tachanun." },
  { id: "chof-av", month: "Av", day: 20, title: "Chof Av", for: ["chabad"],
    blurb: "Yahrzeit of Rabbi Levi Yitzchak Schneerson, the Rebbe's father, who died in exile in 1944 after being arrested for teaching Torah under Soviet rule." },
  { id: "chai-elul", month: "Elul", day: 18, title: "Chai Elul", for: ["chabad", "sefard"],
    blurb: "Birthday of the Baal Shem Tov, founder of Chassidut (1698), and of the Alter Rebbe (1745). \"Chai\" means life: the day brings new life into the Elul preparations for Rosh Hashanah." },
  { id: "besht-yahrzeit", month: "Sivan", day: 6, title: "Yahrzeit of the Baal Shem Tov", for: ["chabad", "sefard"], quiet: true,
    blurb: "The Baal Shem Tov, founder of Chassidut, passed away on Shavuot in 1760. Many share his stories and teachings at the holiday table." },

  // Sephardi and Edot HaMizrach
  { id: "rav-ovadia", month: "Heshvan", day: 3, title: "Yahrzeit of Rav Ovadia Yosef", for: ["sephardi"],
    blurb: "The Sephardi Chief Rabbi of Israel and author of Yabia Omer and Yechaveh Daat (2013), whose rulings shape Sephardi practice today. Many learn his halachot in his memory." },
  { id: "rambam-yahrzeit", month: "Tevet", day: 20, title: "Yahrzeit of the Rambam", for: ["sephardi"],
    blurb: "Maimonides (1204) — doctor, philosopher and author of the Mishneh Torah, a pillar of Sephardi law and of every Jew's learning." },
  { id: "baba-sali", month: "Shevat", day: 4, title: "Hillula of the Baba Sali", for: ["sephardi"],
    blurb: "Rabbi Yisrael Abuhatzeira (1984), the beloved Moroccan tzaddik. A hillula celebrates a righteous person's life: many gather at his resting place in Netivot, light candles and give tzedakah." },
  { id: "ben-ish-chai", month: "Elul", day: 13, title: "Yahrzeit of the Ben Ish Chai", for: ["sephardi"],
    blurb: "Rabbi Yosef Chaim of Baghdad (1909), whose Ben Ish Chai guides the customs of Iraqi and many other Sephardi families." },
  { id: "rh-seder", month: "Elul", day: 29, title: "Tonight: the Rosh Hashanah seder", for: ["sephardi"], quiet: true,
    blurb: "Many Sephardi families open the new year with a seder of simanim — dates, pomegranate, leek, beets, gourd, black-eyed peas and a fish head — each with a short \"Yehi Ratzon\" blessing for the year ahead. (Ashkenazim keep the apple in honey.)" },
  { id: "tu-bishvat-seder", month: "Shevat", day: 14, title: "Tonight: the Tu BiShvat seder", for: ["sephardi"], quiet: true,
    blurb: "Sephardi and kabbalist families hold a Tu BiShvat seder the night it begins: fruits of the Land of Israel, four cups of wine from white to red, and a blessing over each new fruit." },

  // Ashkenazi
  { id: "vilna-gaon", month: "Tishri", day: 19, title: "Yahrzeit of the Vilna Gaon", for: ["ashkenaz"],
    blurb: "Rabbi Eliyahu of Vilna (1797), the towering Lithuanian scholar whose customs many Ashkenazim follow — from the order of prayers to Torah learning on Chol HaMoed." },
  { id: "chafetz-chaim", month: "Elul", day: 24, title: "Yahrzeit of the Chafetz Chaim", for: ["ashkenaz"],
    blurb: "Rabbi Yisrael Meir Kagan (1933), author of the Mishnah Berurah — the everyday guide to Ashkenazi halacha — and of the classic work on guarding your speech." }
];

const cdHebFmt = (() => {
  try { return new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", month: "long" }); }
  catch (e) { return null; }
})();

/** { day, month } in the Hebrew calendar, e.g. { day: 19, month: "Kislev" }. */
function cdHeb(date) {
  if (!cdHebFmt) return null;
  try {
    const parts = cdHebFmt.formatToParts(date);
    return { day: Number(parts.find(p => p.type === "day").value), month: parts.find(p => p.type === "month").value };
  } catch (e) { return null; }
}

function cdAddDays(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; }

/** Every community day between `start` and `end` (inclusive), as calendar events. */
function communityDaysBetween(start, end, israel) {
  const out = [];
  const make = (date, o) => out.push({
    title: o.title, date, category: "community", subcat: "community",
    cid: o.id, for: o.for, blurb: o.blurb, noTachanun: o.noTachanun || [], quiet: !!o.quiet, time: null, at: null
  });
  // Look a little past both ends so moved days (Yom Kippur Katan) are caught.
  for (let d = cdAddDays(start, -3); d <= cdAddDays(end, 3); d = cdAddDays(d, 1)) {
    const h = cdHeb(d);
    if (!h) return out;
    const inRange = d >= start && d <= end;
    COMMUNITY_DAYS.forEach(o => { if (inRange && o.month === h.month && o.day === h.day) make(d, o); });

    // Mimouna: the evening Pesach ends (21 Nisan in Israel, 22 outside).
    if (inRange && h.month === "Nisan" && h.day === (israel ? 21 : 22)) {
      make(d, { id: "mimouna", title: "Mimouna tonight", for: ["sephardi"],
        blurb: "When Pesach ends, Moroccan and many North African families open their homes for Mimouna: sweet mufleta pancakes with honey, and the greeting \"Terbhu u-tsa'du\" — may you prosper and succeed. In Israel it's become a celebration for everyone." });
    }

    // Yom Kippur Katan: the day before Rosh Chodesh (moved back to Thursday from
    // Friday or Shabbat). Not kept before Rosh Chodesh Tishrei, Cheshvan, Tevet
    // (Chanukah) or Iyar (Nisan has no fasting).
    const t = cdHeb(cdAddDays(d, 1));
    const rcFirst = t && (t.day === 30 || (t.day === 1 && h.day === 29));
    if (rcFirst) {
      const rcMonth = t.day === 30 ? (cdHeb(cdAddDays(d, 2)) || {}).month : t.month;
      if (!["Tishri", "Heshvan", "Tevet", "Iyar"].includes(rcMonth)) {
        const dow = d.getDay();
        const kept = dow === 5 ? cdAddDays(d, -1) : dow === 6 ? cdAddDays(d, -2) : d;
        if (kept >= start && kept <= end) {
          make(kept, { id: "yom-kippur-katan", title: "Yom Kippur Katan", for: ["ashkenaz", "sefard"],
            blurb: `Erev Rosh Chodesh ${cdMonthName(rcMonth)}: many Ashkenazim and Chassidim say special Selichot at Mincha — a \"small Yom Kippur\", a fresh start before the new month. Some also fast until midday.` });
        }
      }
    }

    // BeHaB: Monday, Thursday and Monday after the first Shabbat of Cheshvan and
    // of Iyar — a short Ashkenazi fast after the long festival season.
    if ((h.month === "Heshvan" || h.month === "Iyar") && d.getDay() === 6 && h.day >= 2 && h.day <= 8) {
      [2, 5, 9].forEach((n, i) => {
        const fd = cdAddDays(d, n);
        if (fd >= start && fd <= end) {
          make(fd, { id: "behab-" + i, title: `BeHaB ${["Monday", "Thursday", "Monday"][i]}`, for: ["ashkenaz"],
            blurb: `${["The first", "The second", "The last"][i]} of three days (Monday, Thursday, Monday) after ${h.month === "Iyar" ? "Pesach" : "Sukkot"}: many Ashkenazi communities add Selichot and Avinu Malkeinu, and some fast — asking forgiveness for anything said or done carelessly in the long festival. Optional; ask your rabbi.` });
        }
      });
    }
  }
  return out;
}

/** "Heshvan" → "Cheshvan", "Tamuz" → "Tammuz" — the spellings used on this site. */
function cdMonthName(m) {
  return { Heshvan: "Cheshvan", Tishri: "Tishrei", Tamuz: "Tammuz", Shevat: "Sh'vat" }[m] || m || "";
}

/** The visitor's nusach, as the community days know it ("ashkenaz", "sefard"…). */
function cdNusach(profile) {
  return profile && profile.nusach ? profile.nusach : null;
}

/** "plain" (your community's day), "label" (shown side by side for "Not sure" /
 *  "Other" or with "Show me everything"), or null (another community's — hidden). */
function communityDayShown(e, profile) {
  if (!e || e.category !== "community") return null;
  const n = cdNusach(profile);
  if (n && e.for.includes(n)) return "plain";
  if (n === "unsure" || n === "other" || (profile && profile.showAll)) return "label";
  return null;
}

/** The label for a community day: "Chabad", "Chassidic & Chabad"… */
function communityDayLabel(e) {
  return e.for.map(n => COMMUNITY_LABELS[n]).filter(Boolean).join(" & ");
}

/** The why-text behind a community label (for a day, or for a custom of `forNusachs`). */
function communityWhy(forNusachs, profile) {
  const n = cdNusach(profile);
  const name = typeof nusachLabel === "function" ? nusachLabel(n) : n;
  return (n && forNusachs.includes(n)
    ? `Shown because you chose ${name} as your prayer tradition in Settings.`
    : n === "unsure" || n === "other" || !n
      ? "Shown side by side because your prayer tradition is set to \"Not sure\" or \"Other\" (or not set) in Settings."
      : "Shown because \"Show me everything\" is on in Settings.") + " You can change this in Settings (⚙ at the top).";
}

/** A gold "Chabad" / "Sephardi custom" label that explains itself. */
function communityTag(text, forNusachs, profile) {
  return infoTag(text, communityWhy(forNusachs, profile), "g-tag--nusach");
}
