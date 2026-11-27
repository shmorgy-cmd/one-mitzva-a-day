/**
 * zmanim.js — the day's halachic times for the saved city, grouped by what you're
 * doing, each with its earliest and latest time. Built from Hebcal's /zmanim.
 * Used by the Times page (zmanim.html, js/zmanim-page.js).
 */

/** Halachic midnight tonight ≈ today's midday + 12 hours (within a minute or two). */
function zmanPlus12h(iso) {
  const m = /^(.*T)(\d{2}):(\d{2})(.*)$/.exec(iso || "");
  if (!m) return null;
  const d = new Date(iso);
  d.setHours(d.getHours() + 12);
  const h = (Number(m[2]) + 12) % 24;
  return { iso: `${m[1]}${String(h).padStart(2, "0")}:${m[3]}${m[4]}`, at: d };
}

/** The groups shown on the Times page. `community` is a pcCommunityKey value. */
function buildZmanimGroups(t, community) {
  const midnight = zmanPlus12h(t.chatzot);
  const chabad = community === "chabad";
  return [
    {
      title: "The day",
      icon: "sunrise",
      rows: [
        { label: "Dawn (alot hashachar)", iso: chabad ? t.alosBaalHatanya : t.alotHaShachar },
        { label: "Sunrise (netz)", iso: t.sunrise },
        { label: "Midday (chatzot)", iso: t.chatzot },
        { label: "Sunset (shkiah)", iso: t.sunset },
        { label: "Nightfall (three stars)", iso: t.tzeit85deg || t.dusk }
      ]
    },
    {
      title: "Tallit and tefillin",
      icon: "tzitzit",
      rows: [
        { label: "Earliest (misheyakir — light enough to recognize someone)", iso: t.misheyakir },
        { label: "Latest: before sunset (ideally worn for Shacharit)", iso: t.sunset }
      ]
    },
    {
      title: "Shacharit (morning prayer)",
      icon: "sunrise",
      rows: [
        { label: "Earliest, after the fact (dawn, alot hashachar)", iso: chabad ? t.alosBaalHatanya : t.alotHaShachar },
        { label: "Ideal start (sunrise, netz)", iso: t.sunrise },
        { label: "Latest for the Amidah (Magen Avraham — earlier, stricter)", iso: t.sofZmanTfillaMGA },
        { label: "Latest for the Amidah (Gra)", iso: chabad ? t.sofZmanTfilaBaalHatanya : t.sofZmanTfilla, note: chabad ? "Alter Rebbe's time (Chabad)" : null },
        { label: "Latest after the fact (midday, chatzot)", iso: t.chatzot }
      ]
    },
    {
      title: "Morning Shema",
      icon: "book-star",
      rows: [
        { label: "Latest (Magen Avraham — earlier, stricter)", iso: t.sofZmanShmaMGA },
        { label: "Latest (Gra)", iso: chabad ? t.sofZmanShmaBaalHatanya : t.sofZmanShma, note: chabad ? "Alter Rebbe's time (Chabad)" : null }
      ]
    },
    {
      title: "Mincha (afternoon prayer)",
      icon: "sun-high",
      rows: [
        { label: "Earliest (Mincha Gedolah)", iso: t.minchaGedola },
        { label: "Preferred from (Mincha Ketanah)", iso: t.minchaKetana },
        { label: "Plag HaMincha", iso: t.plagHaMincha, note: "Some may pray Maariv from here, and light Shabbat candles early" },
        { label: "Latest (sunset)", iso: t.sunset }
      ]
    },
    {
      title: "Maariv (evening prayer) and the evening Shema",
      icon: "moon",
      rows: [
        { label: "Earliest (nightfall — three stars)", iso: t.tzeit85deg || t.dusk },
        { label: "Ideally before (halachic midnight, about)", iso: midnight && midnight.iso, at: midnight && midnight.at },
        { label: "Latest after the fact: dawn", iso: null, text: "Until dawn tomorrow" }
      ]
    }
  ];
}

/** The next time still to come today: { row, at, group } or null. */
function nextZman(groups, now) {
  let next = null;
  groups.forEach(g => g.rows.forEach(r => {
    if (!r.iso) return;
    const at = r.at || new Date(r.iso);
    if (at > now && (!next || at < next.at)) next = { row: r, at, group: g };
  }));
  return next;
}
