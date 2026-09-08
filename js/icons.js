/**
 * icons.js — a small hand-drawn-style SVG icon set for the site. Kept as
 * inline markup (no external image requests) so the page stays fast and
 * self-contained. Every icon uses `currentColor` for its main color so it
 * inherits the badge's color via CSS, plus a couple of fixed gold accents.
 */

const ICON_VIEWBOX = "0 0 64 64";

function svg(inner, extra = "") {
  return `<svg viewBox="${ICON_VIEWBOX}" xmlns="http://www.w3.org/2000/svg" ${extra}>${inner}</svg>`;
}

const ICONS = {
  star: svg(`
    <polygon points="32,10 51.05,43 12.95,43" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <polygon points="32,54 12.95,21 51.05,21" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
  `),

  "flag-star": svg(`
    <rect x="8" y="14" width="48" height="36" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="8" y="19" width="48" height="5" fill="currentColor"/>
    <rect x="8" y="40" width="48" height="5" fill="currentColor"/>
    <polygon points="32,25 38.93,37 25.07,37" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <polygon points="32,41 25.07,29 38.93,29" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
  `),

  shofar: svg(`
    <path d="M14 40 C14 24, 30 12, 50 14 C46 18, 44 22, 46 26 C48 24, 52 24, 54 26
      C50 30, 42 32, 34 32 C24 32, 16 36, 12 46 C11 48, 12 50, 14 49 C18 47, 16 43, 14 40 Z"
      fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
    <circle cx="47" cy="19" r="1.6" fill="currentColor"/>
  `),

  "apple-honey": svg(`
    <path d="M32 24 C24 24, 18 30, 18 38 C18 48, 25 54, 32 54 C39 54, 46 48, 46 38 C46 30, 40 24, 32 24 Z"
      fill="none" stroke="currentColor" stroke-width="2.8"/>
    <path d="M32 24 C31 19, 33 16, 37 14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M32 17 C35 16, 38 17, 39 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <circle class="accent-gold" cx="46" cy="46" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/>
    <path d="M46 42 L46 50 M43 46 L49 46" stroke="currentColor" stroke-width="1.6"/>
  `),

  gates: svg(`
    <path d="M14 54 V22 Q14 12 32 12 Q50 12 50 22 V54" fill="none" stroke="currentColor" stroke-width="3"/>
    <path d="M14 54 V30 M50 54 V30" stroke="currentColor" stroke-width="3"/>
    <path d="M20 54 V34 Q20 26 32 26 Q44 26 44 34 V54" fill="none" stroke="currentColor" stroke-width="2.2"/>
  `),

  sukkah: svg(`
    <path d="M10 30 L32 14 L54 30" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14 30 V52 H50 V30" fill="none" stroke="currentColor" stroke-width="2.6"/>
    <path d="M16 22 L20 30 M24 18 L28 30 M32 16 L32 30 M40 18 L36 30 M48 22 L44 30" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="20" cy="20" r="1.3" fill="currentColor"/>
    <circle cx="32" cy="12" r="1.3" fill="currentColor"/>
    <circle cx="44" cy="20" r="1.3" fill="currentColor"/>
  `),

  "torah-dance": svg(`
    <rect x="16" y="14" width="6" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <rect x="42" y="14" width="6" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <path d="M22 18 H42 V46 H22 Z" fill="none" stroke="currentColor" stroke-width="2.2"/>
    <path d="M26 26 H38 M26 32 H38 M26 38 H34" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M8 22 Q4 32 8 42 M56 22 Q60 32 56 42" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `),

  menorah: svg(`
    <path d="M32 18 V44 M32 44 H16 M32 44 H48 M20 26 V44 M26 20 V44 M38 20 V44 M44 26 V44"
      fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M12 52 H52" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 52 V46 H46 V52" fill="none" stroke="currentColor" stroke-width="2.2"/>
    <g class="accent-gold">
      <path d="M32 12 C34 15 34 17 32 19 C30 17 30 15 32 12 Z" fill="currentColor"/>
      <path d="M20 20 C22 23 22 25 20 27 C18 25 18 23 20 20 Z" fill="currentColor"/>
      <path d="M26 15 C28 18 28 20 26 22 C24 20 24 18 26 15 Z" fill="currentColor"/>
      <path d="M38 15 C40 18 40 20 38 22 C36 20 36 18 38 15 Z" fill="currentColor"/>
      <path d="M44 20 C46 23 46 25 44 27 C42 25 42 23 44 20 Z" fill="currentColor"/>
    </g>
  `),

  tree: svg(`
    <path d="M32 30 V54" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="32" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="2.6"/>
    <circle class="accent-gold" cx="26" cy="18" r="1.6" fill="currentColor"/>
    <circle class="accent-gold" cx="36" cy="24" r="1.6" fill="currentColor"/>
    <circle class="accent-gold" cx="32" cy="14" r="1.6" fill="currentColor"/>
    <path d="M32 54 Q24 54 20 50 M32 54 Q40 54 44 50" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `),

  mask: svg(`
    <path d="M8 26 Q32 14 56 26 Q56 40 44 44 Q38 46 32 42 Q26 46 20 44 Q8 40 8 26 Z"
      fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
    <circle cx="21" cy="27" r="3.4" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="43" cy="27" r="3.4" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M26 35 Q32 39 38 35" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle class="accent-gold" cx="14" cy="18" r="1.6" fill="currentColor"/>
    <circle class="accent-gold" cx="32" cy="12" r="1.6" fill="currentColor"/>
    <circle class="accent-gold" cx="50" cy="18" r="1.6" fill="currentColor"/>
  `),

  matzah: svg(`
    <rect x="12" y="12" width="40" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="2.8"/>
    <g stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
      <path d="M18 18 L22 22 M26 18 L30 22 M34 18 L38 22 M42 18 L46 22"/>
      <path d="M18 26 L22 30 M26 26 L30 30 M34 26 L38 30 M42 26 L46 30"/>
      <path d="M18 34 L22 38 M26 34 L30 38 M34 34 L38 38 M42 34 L46 38"/>
      <path d="M18 42 L22 46 M26 42 L30 46 M34 42 L38 46 M42 42 L46 46"/>
    </g>
  `),

  wheat: svg(`
    <path d="M32 12 V52" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M32 18 Q24 16 22 10 M32 18 Q40 16 42 10"/>
      <path d="M32 26 Q24 24 22 18 M32 26 Q40 24 42 18"/>
      <path d="M32 34 Q24 32 22 26 M32 34 Q40 32 42 26"/>
      <path d="M32 42 Q24 40 22 34 M32 42 Q40 40 42 34"/>
    </g>
  `),

  tablets: svg(`
    <path d="M14 54 V24 Q14 14 24 14 H26 Q24 14 24 20 V54 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M50 54 V24 Q50 14 40 14 H38 Q40 14 40 20 V54 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M18 26 H21 M18 32 H21 M18 38 H21 M43 26 H46 M43 32 H46 M43 38 H46" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  `),

  "broken-tablets": svg(`
    <path d="M14 54 V24 Q14 14 24 14 L20 32 L26 36 L22 54 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M50 54 V24 Q50 14 40 14 L44 32 L38 36 L42 54 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
  `),

  "candle-memorial": svg(`
    <path d="M32 20 C34 24 34 27 32 30 C30 27 30 24 32 20 Z" class="accent-gold" fill="currentColor"/>
    <rect x="27" y="30" width="10" height="24" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <path d="M16 54 H48" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
  `),

  heart: svg(`
    <path d="M32 46 C18 36 12 28 12 20 C12 13 18 9 23 12 C27 14 30 18 32 22 C34 18 37 14 41 12 C46 9 52 13 52 20 C52 28 46 36 32 46 Z"
      fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/>
  `),

  "candles-shabbat": svg(`
    <rect x="18" y="26" width="8" height="26" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <rect x="38" y="26" width="8" height="26" rx="1.5" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <path d="M22 18 C24 21 24 24 22 26 C20 24 20 21 22 18 Z" class="accent-gold" fill="currentColor"/>
    <path d="M42 18 C44 21 44 24 42 26 C40 24 40 21 42 18 Z" class="accent-gold" fill="currentColor"/>
    <path d="M12 52 H52" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
  `),

  moon: svg(`
    <path d="M38 14 C28 16 22 24 22 33 C22 43 30 51 40 51 C44 51 48 49 51 46 C43 47 34 41 34 31 C34 24 37 18 38 14 Z"
      fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
    <polygon class="accent-gold" points="16,20 17.6,24 22,24 18.6,26.6 20,31 16,28.2 12,31 13.4,26.6 10,24 14.4,24"
      fill="currentColor"/>
  `),

  "book-star": svg(`
    <path d="M32 18 C28 15 20 14 14 16 V46 C20 44 28 45 32 48 C36 45 44 44 50 46 V16 C44 14 36 15 32 18 Z"
      fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M32 18 V48" stroke="currentColor" stroke-width="2"/>
    <polygon class="accent-gold" points="32,4 34.5,9.5 40,9.5 35.7,12.8 37.3,18.3 32,15 26.7,18.3 28.3,12.8 24,9.5 29.5,9.5"
      fill="currentColor"/>
  `),

  sunrise: svg(`
    <circle cx="32" cy="38" r="10" fill="none" stroke="currentColor" stroke-width="2.6"/>
    <path d="M8 38 H56" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M32 16 V22 M16 24 L20 28 M48 24 L44 28" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" class="accent-gold"/>
    <path d="M14 46 H50 M18 52 H46" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.6"/>
  `),

  "sun-high": svg(`
    <circle cx="32" cy="30" r="11" fill="none" stroke="currentColor" stroke-width="2.6"/>
    <g stroke="currentColor" stroke-width="2.2" stroke-linecap="round" class="accent-gold">
      <path d="M32 10 V15 M32 45 V50 M12 30 H17 M47 30 H52"/>
      <path d="M17.5 15.5 L21 19 M46.5 15.5 L43 19 M17.5 44.5 L21 41 M46.5 44.5 L43 41"/>
    </g>
  `),

  "wash-cup": svg(`
    <path d="M20 20 L44 20 L40 38 Q32 42 24 38 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M24 20 L20 14 M40 20 L44 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M28 44 C28 48 28 50 26 52 M36 44 C36 48 36 50 38 52" class="accent-gold" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  `),

  shoe: svg(`
    <path d="M10 46 H50 Q54 46 54 42 Q54 38 48 36 L40 30 Q34 24 26 24 L20 24 Q16 24 16 30 V40 L10 42 Q8 43 8 44 Q8 46 10 46 Z"
      fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M22 28 L26 33 M28 26 L32 32" class="accent-gold" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  `),

  bread: svg(`
    <path d="M12 34 C12 22 22 16 32 16 C42 16 52 22 52 34 C52 42 44 46 32 46 C20 46 12 42 12 34 Z"
      fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M22 22 L26 30 M32 20 L34 30 M42 22 L38 30" class="accent-gold" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  `),

  droplet: svg(`
    <path d="M32 12 C40 24 46 32 46 40 C46 48.8 39.7 54 32 54 C24.3 54 18 48.8 18 40 C18 32 24 24 32 12 Z"
      fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
    <circle class="accent-gold" cx="26" cy="42" r="2" fill="currentColor"/>
  `),

  goblet: svg(`
    <path d="M20 14 H44 L40 30 Q32 34 24 30 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M32 34 V46 M22 50 H42" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M26 50 L32 46 L38 50" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" class="accent-gold"/>
  `),

  mezuzah: svg(`
    <line x1="12" y1="8" x2="12" y2="56" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M18 22 L40 18 Q46 17 46 23 Q46 29 40 30 L18 34 Q14 34 14 28 Q14 23 18 22 Z"
      fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>
    <circle class="accent-gold" cx="22" cy="27" r="1.4" fill="currentColor"/>
  `),

  tzitzit: svg(`
    <path d="M18 30 H46" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M20 10 V30 M28 10 V30 M36 10 V30 M44 10 V30" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M20 34 V54 M24 34 V50 M28 34 V54 M32 34 V48 M36 34 V54 M40 34 V50 M44 34 V54"
      class="accent-gold" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  `),

  coin: svg(`
    <circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" stroke-width="2.6"/>
    <path d="M32 22 V42 M26 26 Q26 22 32 22 Q38 22 38 26 Q38 30 32 30 Q26 30 26 34 Q26 38 32 38 Q38 38 38 34"
      class="accent-gold" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  `),

  hand: svg(`
    <path d="M32 54 C20 54 16 46 16 38 V20 Q16 16 20 16 Q24 16 24 20 V30 M24 20 V14 Q24 10 28 10 Q32 10 32 14 V30
      M32 14 V12 Q32 8 36 8 Q40 8 40 12 V30 M40 20 Q40 16 44 16 Q48 16 48 20 V38 C48 46 44 54 32 54 Z"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  `),

  // --- Torah-book icons (for the weekly-portion card) ---
  "book-genesis": svg(`
    <path d="M20 34 C18 26 22 20 30 20 C29 24 30 28 33 30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M33 30 C40 27 46 30 47 37 C42 35 37 36 33 40 C30 43 24 44 20 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="accent-gold" cx="45" cy="20" r="1.6" fill="currentColor"/>
    <circle class="accent-gold" cx="14" cy="24" r="1.4" fill="currentColor"/>
  `),
  "book-exodus": svg(`
    <path d="M8 40 Q16 32 24 40 T40 40 T56 40" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M8 48 Q16 40 24 48 T40 48 T56 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M30 34 V16 M24 22 L30 16 L36 22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  `),
  "book-leviticus": svg(`
    <path d="M32 14 V40 M32 40 H20 M32 40 H44 M24 24 V40 M40 24 V40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M14 50 H50" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M20 50 V44 H44 V50" fill="none" stroke="currentColor" stroke-width="2"/>
    <path class="accent-gold" d="M32 8 C34 11 34 13 32 15 C30 13 30 11 32 8 Z" fill="currentColor"/>
  `),
  "book-numbers": svg(`
    <path d="M12 46 L24 26 L32 38 L40 22 L52 46 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M8 46 H56" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
    <polygon class="accent-gold" points="40,10 41.6,14 46,14 42.6,16.6 44,21 40,18.2 36,21 37.4,16.6 34,14 38.4,14" fill="currentColor"/>
  `),
  "book-deuteronomy": svg(`
    <path d="M10 50 L32 16 L54 50 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M25 42 V30 Q25 24 30 24 H32 Q30 24 30 28 V42 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M39 42 V30 Q39 24 34 24 H32 Q34 24 34 28 V42 Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
  `)
};

function getIcon(name) {
  return ICONS[name] || ICONS.star;
}
