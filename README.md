# One Mitzva a Day

A daily companion site for learning Judaism, keyed to the Jewish calendar. Each day it shows:

- Today's Hebrew and Gregorian date
- Upcoming holidays (countdown strip)
- Halacha, customs, and a spiritual reflection for whatever the day actually is (Selichot, Rosh Hashanah, Erev Tavshilin, Sukkot, Chanukah, Purim, Pesach, the Omer, Tisha B'Av, an ordinary Tuesday, etc.) — content lives in [`js/content.js`](js/content.js)
- This week's Torah portion, showing the specific one-seventh "daily aliyah" for today (Sunday = 1st aliyah ... Shabbat = 7th), with the actual text pulled live from Sefaria

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

Add new occasions to the `OCCASIONS` array in [`js/content.js`](js/content.js). Each entry needs a `match(ctx)` function (see the comment at the top of that file for what's available on `ctx`) and a `content` object with `intro`, `halacha`, `customs`, and `inspiration`. Higher `priority` wins when multiple occasions match the same day.

## Settings and location

The Settings panel ([`js/settings.js`](js/settings.js)) stores the visitor's city, Israel/outside-Israel calendar choice and profile in `localStorage` only. The city is passed to every Hebcal call (calendar + Torah readings with `i=on`/`c=on`, and zmanim) for candle-lighting, Havdalah, fast and prayer times. City search uses [Open-Meteo's free geocoder](https://open-meteo.com/en/docs/geocoding-api) because Hebcal's own autocomplete doesn't allow cross-site requests; it returns the same GeoNames ids Hebcal uses.

## Prayer changes engine

[`js/prayer-changes.js`](js/prayer-changes.js) works out what changes in the prayers for a given day (Ya'aleh v'Yavo, Hallel, Tachanun, Al HaNissim, fast-day additions, the Omer, Avinu Malkeinu, Selichot, the Ten Days changes, and the seasonal rain/dew wording) from the Hebrew date, the Israel setting and Hebcal's events. It's a pure function with no page code. Open [`tests.html`](tests.html) on the local server to check it against about 25 known dates (it fetches live Hebcal data). **The halachic content still needs rabbinic review.**

## Personalization

The welcome box (`js/profile.js`) changes the page through [`js/personalize.js`](js/personalize.js):

- **I'm Jewish + a community**: a "Your custom" box on each card with only that community's minhagim ("Other / not sure" shows all communities side by side).
- **Just curious**: Hebrew terms become tap-to-explain (from `GLOSSARY`), plus a "Why today?" note on each day.
- **Exploring conversion**: everything above, plus a "Taking this on" note with a practical first step.

The extra content is keyed by id in `OCCASION_EXTRAS`, `MITZVA_EXTRAS`, `PRAYER_EXTRAS` and `PREP_EXTRAS` — when adding a new occasion, add a matching entry there too. Minhagim vary widely, so new entries should be checked by someone knowledgeable.
