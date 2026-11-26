/**
 * prayers.js — the three daily prayers (Shacharit, Mincha, Maariv): what each one
 * is, its halacha and a thought for reflection, plus the zmanim (halachic times)
 * from Hebcal for the saved city. The timeline (timeline.js) shows them in place.
 */

const ZMANIM_BASE = "https://www.hebcal.com/zmanim";

const PRAYERS = {
  shacharit: {
    title: "Shacharit — the Morning Prayer",
    icon: "sunrise",
    window: "from dawn until midday",
    sources: ["Genesis 19:27", "Talmud, Berakhot 26b", "Shulchan Aruch, Orach Chaim 89"],
    content: {
      intro: "It's the morning prayer window right now. Shacharit is the day's first conversation with God — traditionally said standing, facing Jerusalem, opening the day by setting its direction before the day sets yours.",
      halacha: [
        "The ideal time is within the first few halachic hours after sunrise; if that's missed, Shacharit can still be said until chatzot (halachic midday).",
        "The core structure: blessings on waking, Pesukei D'Zimra (verses of praise), the Shema and its blessings, and the silent standing Amidah — with the Shema's timing actually a bit stricter than the rest, ideally within the first quarter of the day.",
        "On Mondays and Thursdays, Rosh Chodesh, and festivals, a Torah reading or added prayers are worked into Shacharit."
      ],
      inspiration: "The Sages default assumption is that a day started without first checking in loses something no amount of productivity later recovers. Even three unhurried minutes this morning — gratitude for waking up, one honest request, one thank-you — counts as the real thing."
    }
  },
  mincha: {
    title: "Mincha — the Afternoon Prayer",
    icon: "sun-high",
    window: "from early afternoon until sunset",
    sources: ["Genesis 24:63", "I Kings 18:36", "Talmud, Berakhot 6b, 26b", "Shulchan Aruch, Orach Chaim 232–234"],
    content: {
      intro: "It's Mincha time — the afternoon prayer, tucked into the busiest part of the day on purpose. Of the three daily prayers, the Sages considered Mincha the quiet proof of real commitment: nobody has to remind you God exists at sunrise, when the day is fresh, or after dark, when it's finally still. Stopping in the middle of a workday is different.",
      halacha: [
        "Mincha can be said from chatzot (halachic midday) onward, though most have the custom of waiting for Mincha Ketana (roughly two and a half halachic hours before sunset) as the preferred start.",
        "It must be completed before sunset (some extend slightly into twilight in pressing circumstances) — it's a genuinely time-boxed prayer.",
        "Structurally it's shorter than Shacharit: Ashrei, the silent Amidah, and (with a minyan) some communal additions — brief by design, so it fits into a real afternoon."
      ],
      inspiration: "Elijah the Prophet's showdown on Mount Carmel — fire from heaven, the whole nation watching — happened, the text specifies, at the time of the afternoon offering. The lesson the Sages drew: the prayer squeezed into the middle of an ordinary, busy day is not the lesser one. Step away for a minute, even now."
    }
  },
  maariv: {
    title: "Maariv (Arvit) — the Evening Prayer",
    icon: "moon",
    window: "from nightfall onward",
    sources: ["Genesis 28:11", "Talmud, Berakhot 26b–27b", "Shulchan Aruch, Orach Chaim 235–237"],
    content: {
      intro: "It's Maariv time — the evening prayer, said after dark to close the day the way it opened, in conversation. Unlike Shacharit and Mincha, Maariv was originally optional in the Talmud before the Jewish people took it on as an unshakeable communal obligation — it's prayer chosen out of love, not just duty.",
      halacha: [
        "Said after nightfall (tzeit hakochavim, when stars are out); some communities have the custom of starting slightly before full dark and are lenient after the fact, but the ideal time is after true nightfall.",
        "Structure: the evening Shema and its blessings, followed by the silent Amidah — no Torah reading, kept relatively brief.",
        "On Motzei Shabbat and festival endings, Maariv is followed by Havdalah, formally closing out the holy day."
      ],
      inspiration: "That the Jewish people adopted Maariv as obligatory even though the law didn't strictly require it says something worth sitting with: sometimes the most meaningful commitments are the ones nobody can force you into. Closing today in words, even briefly, is worth choosing on purpose."
    }
  }
};

async function fetchZmanim(loc, dateISO) {
  const url = `${ZMANIM_BASE}?cfg=json&date=${dateISO}${hebcalLocationQuery(loc)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("zmanim request failed");
  const data = await res.json();
  return data.times || null;
}

function fmtZman(iso) {
  // Hebcal zmanim are ISO strings in the city's own time zone; show that wall-clock time.
  const m = /T(\d{2}):(\d{2})/.exec(iso || "");
  if (!m) return null;
  return new Date(2000, 0, 1, Number(m[1]), Number(m[2])).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
