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
