# One Mitzva a Day

A daily companion site for learning Judaism, keyed to the Jewish calendar. Each day it shows:

- Today's Hebrew and Gregorian date
- A day strip ([`js/daystrip.js`](js/daystrip.js)): today and the next 7 days as tiles (weekday, date, Hebrew date from the browser's own Hebrew calendar). Special days — festivals, fasts, Rosh Chodesh, Shabbat — get a small icon and their name; days with a get-ready guide (`PREP_GUIDES` in [`js/prep.js`](js/prep.js)) get a "Get ready" button the whole week they're in the strip, which opens the guide in a panel that slides up, with jump buttons to each part. ‹ › move a week, "Other date" opens a calendar, and a "Later" line of chips shows what's further off
- Halacha, customs, and a spiritual reflection for whatever the day actually is (Selichot, Rosh Hashanah, Erev Tavshilin, Sukkot, Chanukah, Purim, Pesach, the Omer, Tisha B'Av, an ordinary Tuesday, etc.) — content lives in [`js/content.js`](js/content.js)
- This week's Torah portion: a line in the date card ("Parshat Vayishlach · Today: 5th aliyah") opens the reading page ([`torah.html`](torah.html), [`js/torah-page.js`](js/torah-page.js)) — the week's seven aliyot, one per day (Sunday = 1st ... Shabbat = 7th), Hebrew without cantillation then English, verse by verse, live from Sefaria. Shared helpers are in [`js/torah.js`](js/torah.js)

It's plain HTML/CSS/JS — no build step, no dependencies to install. It fetches live data client-side from the [Hebcal](https://www.hebcal.com/home/developer-apis) and [Sefaria](https://developers.sefaria.org/) public APIs, so it needs to be served over `http(s)://`, not opened directly as a `file://` page (the browser blocks the fetches otherwise).

## Running it locally

Any static file server works. If you have Node or Python installed:

```bash
npx serve .
```

```bash
python -m http.server 8420
```

Then open the printed local URL.

## Deploying

Since it's just static files, you can drop the whole folder onto GitHub Pages, Netlify, Vercel, or any static host — no build step required.

## Extending the content

Add new occasions to the `OCCASIONS` array in [`js/content.js`](js/content.js). Each entry needs a `match(ctx)` function (see the comment at the top of that file for what's available on `ctx`) and a `content` object with `intro`, `halacha`, `customs`, and `inspiration`. Higher `priority` wins when multiple occasions match the same day. Add the occasion's classic sources to `OCCASION_SOURCES` at the bottom of `content.js`; mitzvot carry a `sources` array inline. Sources show at the bottom of every card.

## Menu bar

Every page has the same banner at the top ([`js/nav.js`](js/nav.js)): the logo (home) with the tagline ("A daily companion for learning, living, and loving Jewish tradition — one day at a time."), the four pages — Today, Torah, Everyday Mitzvot, About — and a **Settings** button with the saved city under it. The banner stays at the top; once the page scrolls it shrinks to a slim bar and the tagline hides. On phones the pages move to a bottom bar with the same four buttons, and the top keeps the logo and Settings. Each page names itself with `<body data-page="…">` so the bar can mark it; a page can set `window.onSettingsChanged` to refresh after a settings change (the Today page does), otherwise it reloads.

## Settings and location

The Settings panel, opened from the menu bar on any page, ([`js/settings.js`](js/settings.js)) stores the visitor's city, Israel/outside-Israel calendar choice and profile in `localStorage` only. The city is passed to every Hebcal call (calendar + Torah readings with `i=on`/`c=on`, and zmanim) for candle-lighting, Havdalah, fast and prayer times. City search uses [Open-Meteo's free geocoder](https://open-meteo.com/en/docs/geocoding-api) because Hebcal's own autocomplete doesn't allow cross-site requests; it returns the same GeoNames ids Hebcal uses.

## Prayer changes engine

[`js/prayer-changes.js`](js/prayer-changes.js) works out what changes in the prayers for a given day (Ya'aleh v'Yavo, Hallel, Tachanun, Al HaNissim, fast-day additions, the Omer, Avinu Malkeinu, Selichot, the Ten Days changes, and the seasonal rain/dew wording) from the Hebrew date, the Israel setting and Hebcal's events. It's a pure function with no page code. Open [`tests.html`](tests.html) on the local server to check it against about 25 known dates (it fetches live Hebcal data). **The halachic content still needs rabbinic review.**

## "What to do today" guide

[`js/daily-guide.js`](js/daily-guide.js) turns each day into concrete instructions — **tonight** (the evening that starts the next Jewish day) and **today**: how many Chanukah candles and in what order, which blessings (written out in Hebrew, transliteration and English — e.g. Shehecheyanu only on the first night), Shabbat/Yom Tov candles with the right blessing, Kiddush and Havdalah variants, the Seder, the chametz search and deadlines, Eruv Tavshilin, the shofar and Tashlich, the lulav (not on Shabbat), the sukkah and Ushpizin, the Purim mitzvot, fast times, and the day's readings. Times come from Hebcal's events for the saved city. `tests.html` checks it on known dates. On Mondays and Thursdays (only) it adds the Shacharit Torah reading — the opening section of the coming Shabbat's parsha, from Hebcal's leyning data — unless the day has its own reading. Fridays get the full evening: candles, Kabbalat Shabbat, Shalom Aleichem, Kiddush, washing, HaMotzi and Birkat HaMazon.

## Prayer texts

[`js/prayer-texts.js`](js/prayer-texts.js) holds the actual words of the prayers the site mentions — Hebrew, transliteration and our own English — so the guide and the prayer-changes card can show them: HaNerot Halalu, Ma'oz Tzur, Al HaNissim (Chanukah/Purim), Ya'aleh v'Yavo (naming the day), Aneinu, Atah Chonantanu, the rain and dew phrases, the Ten Days additions, the Omer count (worded for each of the 49 days), Lecha Dodi, Shalom Aleichem, the Shabbat and festival Kiddush, Havdalah and the Torah blessings. Hallel (Psalms 113–118) loads live from Sefaria. `PRAYER_CHANGE_TEXTS` maps each prayer-change id to its texts. Wording follows the common Ashkenazi siddur and still needs review.

**How blessings are shown.** Everywhere a blessing or prayer appears, the Hebrew comes first, then the English. Hovering over the Hebrew (or tapping it on a phone) shows the transliteration; an "Always show transliteration" link turns it on for the whole site (saved in this browser), and printed pages always include it. Every blessing has vowels (nikud) — the short ones in `BLESSINGS` ([`js/daily-guide.js`](js/daily-guide.js)) and the full texts in `prayer-texts.js`: Modeh Ani, Asher Yatzar, Elohai Neshamah, the morning Torah blessings and Birchot HaShachar, the tallit and tefillin blessings (by community), the Shema, the bedtime Shema with Hamapil, the food blessings with Borei Nefashot and Al HaMichyah, the apple on Rosh Hashanah, blessing the children, Tefillat HaDerech and Kiddush Levana. Birkat HaMazon and the Shema paragraphs load from Sefaria. Mitzvot, holiday cards and get-ready guides list theirs in `blessings` / `texts` fields, and `tests.html` checks that every one exists and is complete. The longer prayers and songs (Al HaNissim, Ya'aleh v'Yavo, Shalom Aleichem…) don't have vowels yet.

**Listening.** A speaker button sits next to each line of Hebrew ([`js/audio.js`](js/audio.js)). It plays the real recording when there is one; until then it reads the line with the device's own Hebrew voice (and is hidden on devices that have none). God's name is spoken as "Adoshem", and "Eloheinu" (and its forms) as "Elokeinu". Recordings live in `audio/` as `<id>.m4a` (or `.mp3`) and are listed in `AUDIO_RECORDINGS`; [`recordings.html`](recordings.html) is the checklist of every line to record, with its file name and words. Recordings are saved for offline use (and kept across app updates).

## The day timeline

Under the date, one line says what today is (e.g. "Shabbat · Chanukah"), followed by the "Right now" card, "A thought for today" (the occasion's reflection, three lines with "Read more") and, on holidays, fasts and seasons, a closed "More about today" with the halacha, customs, blessings and notes ([`renderTodayContext`](js/app.js)). Below that, the page is the day as a timeline ([`js/timeline.js`](js/timeline.js)), built on the zmanim for the saved city: **Waking up** (Modeh Ani, hand-washing, morning blessings), **Morning** (tallit and tefillin, the Shema with its deadline, Shacharit), **Midday** (the mitzvah of the day, this week's Torah portion), **Afternoon** (Mincha), **Evening** (Maariv) and **Bedtime**. The daily guide's items slot in at their times — candles before sunset, Kabbalat Shabbat, Havdalah, the menorah, the Omer, fast start and end — and whole-day ones (Shabbat, a fast, a festival) sit in an "All day" box above. Each prayer shows the day's changes on its card and, behind "How to pray", the full changes with their words plus what the prayer is. A "Right now" card under the date says the one thing to do now, how long is left and what's next; the timeline updates every minute, finished parts of the day fold away, and items can be ticked off (saved for a week, in this browser only). Other dates show the plan without "now". Without a city the day keeps its order but shows no clock times. `buildDayTimeline` has no DOM, so `tests.html` checks it; adding `?now=2026-12-04T16:30-05:00` to the URL pretends it's that moment, for checking.

**What's open now, and what follows you.** In today's timeline the most urgent open prayer is "Now" (solid blue, with the sliding marker); other open prayers and things like tallit and tefillin are "Also now" (lighter blue), and the "Right now" card lists them. Tallit and tefillin are ideally put on before Shacharit, so until Shacharit's time ends they sit above it with the same bright "Now" box. Small steps (Modeh Ani, getting dressed) stay plain and never become "Now" — they belong to the moment you wake up and have no countdown. Time-bound items (the Shema, Shacharit, tallit and tefillin, Mincha, Maariv) show "From" at the top of the time column and "By / Latest / Until" at the bottom, and the Now marker moves between the two. Within the part of the day you're in, done items go to the top and open ones sit by "now", most urgent first. Things not done yet follow the day: "anytime" practices once their part is over, and tefillin (open until sunset) once the morning is over, with "Still open — latest …". "Not for me today" sets an item aside without marking it done (saved for the day, Undo brings it back). Only the part of the day you're in is open (plus an earlier one with something still open — e.g. Waking up stays open until its steps are ticked or Shacharit's latest time passes, about 10 AM); the others fold to one line — "Earlier today · 3 of 4 done", or a preview of what's coming — and each has a ▾ / ▸ button, with "Expand all / Collapse all" above. What you open or fold is remembered for the day. When the last item in a part is ticked (or set aside), a small bubble celebrates it and says what's next, then that part folds and the next one opens — once per part per day. The morning Shema has a best time (its "By") and, after it, stays open with "The best time has passed — say it now" (with its blessings until Shacharit's latest time); if it was missed altogether, it stays visible in the morning with what to do.

## Everyday Mitzvot page

[`mitzvot.html`](mitzvot.html) ([`js/mitzvot-page.js`](js/mitzvot-page.js)) is the library of everyday mitzvot, linked from the top menu and the Mitzvot tab (and from the "Mitzvah of the day" in the timeline). It opens with today's mitzvah and a "Start here" row of first steps chosen by the visitor's profile, then shows each theme (`MITZVA_CATEGORIES` in [`js/mitzvot.js`](js/mitzvot.js)) with a few mitzvot and "See all". A search box and theme chips narrow the list. Each mitzvah opens at `mitzvot.html#<id>` (shareable, and Back works) with why it matters, numbered steps, the words (blessings with transliteration and the speaker), the visitor's community custom, a thought to take along, sources, related mitzvot and previous/next. "I'm learning this" / "I do this" are saved only in the browser and add a "My mitzvot" filter. Display helpers shared with the home page live in [`js/ui.js`](js/ui.js).

## About page

[`about.html`](about.html) tells why the site exists (a convert's story: knowing what to do each day, learning something new, a spiritual thought — without always being able to get to a shiur or ask), who it's for, the "learn with a rabbi" note, and the privacy summary. The home page links to it with a small card, and "About" in the top menu opens it.
## Zmanim

Below the timeline, the "All of the day's times" card shows the viewed day's times for the saved city from Hebcal's `/zmanim`, grouped by what you're doing, with earliest and latest: tallit and tefillin, Shacharit, the morning Shema (Magen Avraham and Gra), Mincha and Maariv. Chabad profiles get the Alter Rebbe's times. Without a city it asks for one instead of guessing.

## Printable Shabbat / Yom Tov sheet

The "Print for…" button under the timeline ([`js/print.js`](js/print.js)) builds a black-and-white sheet for the next Shabbat or Yom Tov stretch (every day until it ends, from Hebcal's data): times for the saved city, the parsha with Sefaria's summary or the holiday readings, prayer changes per day and night, Kiddush and Havdalah outlines, the week's mitzvah, and the quiz with an answer key. A link ending in `#print` opens it directly.

## Installable app, offline and reminders

- [`manifest.json`](manifest.json) + [`icons/`](icons/) make the site installable ("Add to Home Screen").
- [`sw.js`](sw.js) is the service worker: app files are saved for offline use; Hebcal/Sefaria data is network-first with a saved fallback. **Bump `CACHE_VERSION` in `sw.js` whenever you change any app file**, so visitors get the new version.
- [`js/offline.js`](js/offline.js) prefetches the next 14 days of data once a day, shows the offline notice and the install hint (Android prompt / iOS "Share → Add to Home Screen"), and runs the opt-in local reminders from Settings (only while the app is open).

## Optional outside services ([`js/config.js`](js/config.js))

Each one stays off while its value in `js/config.js` is empty:

- **`oneSignalAppId`** — weekly/holiday push messages. Create a free OneSignal account → New App → Web; site URL `https://shmorgy-cmd.github.io`; choose "Custom code"; under advanced settings set the service worker path to `/one-mitzva-a-day/`, the main and updater worker filename to `sw.js`, and the scope to `/one-mitzva-a-day/`. Paste the App ID here. The OneSignal script only loads for visitors who turn on "Weekly & holiday messages" in Settings. Send messages from the OneSignal dashboard.
- **`kitFormId`** — the weekly email sign-up card. In Kit, create a form, then Publish → HTML and copy the number from `action="https://app.kit.com/forms/<ID>/subscriptions"`. The card is a plain HTML form posted to Kit (no Kit script loads); it stays hidden while this is empty.
- **`goatCounterCode`** — cookie-free visit counts. Create a site at goatcounter.com and paste its code (the part before `.goatcounter.com`).
- **`reportEmail`** — where "Report an error" links go. Empty = a prefilled GitHub issue on this repo.

## Personalization

The welcome box (`js/profile.js`) changes the page through [`js/personalize.js`](js/personalize.js):

- **I'm Jewish + a community**: a "Your custom" box on each card with only that community's minhagim ("Other / not sure" shows all communities side by side).
- **Just curious**: Hebrew terms become tap-to-explain (from `GLOSSARY`), plus a "Why today?" note on each day.
- **Exploring conversion**: everything above, plus a "Taking this on" note with a practical first step.

The extra content is keyed by id in `OCCASION_EXTRAS`, `MITZVA_EXTRAS`, `PRAYER_EXTRAS` and `PREP_EXTRAS` — when adding a new occasion, add a matching entry there too. Minhagim vary widely, so new entries should be checked by someone knowledgeable.
