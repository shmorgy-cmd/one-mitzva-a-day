/**
 * prayers.js — figures out which of the three daily prayers (Shacharit,
 * Mincha, Maariv) we're currently in the window for, using precise zmanim
 * (halachic times) from Hebcal when the visitor shares their location, and
 * a reasonable clock-based approximation otherwise.
 */

const ZMANIM_BASE = "https://www.hebcal.com/zmanim";

const PRAYERS = {
  shacharit: {
    title: "Shacharit — the Morning Prayer",
    icon: "sunrise",
    window: "from dawn until midday",
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

function pad2(n) { return String(n).padStart(2, "0"); }

/** Try to get the visitor's location for precise zmanim; resolves to null on any failure/denial. */
function tryGeolocate(timeoutMs = 6000) {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    const timer = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }); },
      () => { clearTimeout(timer); resolve(null); },
      { timeout: timeoutMs, maximumAge: 60 * 60 * 1000 }
    );
  });
}

async function fetchZmanim(loc, dateISO) {
  const url = `${ZMANIM_BASE}?cfg=json&latitude=${loc.lat}&longitude=${loc.lon}&date=${dateISO}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("zmanim request failed");
  const data = await res.json();
  return data.times || null;
}

/** Determine today's prayer window (shacharit/mincha/maariv) plus a human time label.
 *  Uses real zmanim if `times` (from Hebcal) is available, else a clock-based estimate. */
function determinePrayerWindow(now, times) {
  if (times) {
    const alot = times.alotHaShachar ? new Date(times.alotHaShachar) : null;
    const chatzot = times.chatzot ? new Date(times.chatzot) : null;
    const sunset = times.sunset ? new Date(times.sunset) : null;
    if (alot && chatzot && sunset) {
      if (now >= alot && now < chatzot) return { key: "shacharit", precise: true };
      if (now >= chatzot && now < sunset) return { key: "mincha", precise: true };
      return { key: "maariv", precise: true };
    }
  }
  const h = now.getHours();
  if (h >= 5 && h < 12) return { key: "shacharit", precise: false };
  if (h >= 12 && h < 18) return { key: "mincha", precise: false };
  return { key: "maariv", precise: false };
}

async function loadPrayerCard(today) {
  const now = new Date();
  let times = null;
  try {
    const loc = await tryGeolocate();
    if (loc) times = await fetchZmanim(loc, toISO(today));
  } catch (e) {
    console.warn("zmanim fetch failed, using clock estimate", e);
  }
  const { key, precise } = determinePrayerWindow(now, times);
  return { prayer: PRAYERS[key], key, precise, times };
}
