# Portfolio

Aadi's freelance site: "Hi, I'm Aadi and I make cool, SEO-friendly websites." Astro 7, GSAP, Lenis, plain CSS. No UI framework.
Staged next to the other demos at `/portfolio` (the shared deploy runs `scripts/stage.mjs`). Meant to move to its own domain later.

## Run

```bash
cp .env.example .env     # then edit .env: your email, links, timezone, API keys
npm install
npm run dev              # http://localhost:4321
npm run build            # static site in dist/
npm run check            # type-check the scripts
node scripts/stage.mjs   # builds with BASE_PATH=/portfolio into ../site/portfolio (what Cloudflare runs)
npm run build:single     # the whole site as ONE self-contained HTML file in dist-single/index.html
```

## Things you will want to change

- **Your email, links, timezone, names:** `.env` (see `.env.example`; every value is commented). `PUBLIC_*` values reach the browser, the rest never do.
  `PUBLIC_LOCATION_LABEL` ("Based in the UK") is shown in the header just before the clock; `PUBLIC_TIMEZONE` drives the clock and the clock panel.
- **Your photo:** put it at `public/portrait.jpg` (or `.jpeg`, `.webp`, `.png`, `.avif`, portrait orientation, about 800x1000). It replaces the pixel-art
  stand-in in two places: the little face that follows the cursor over your name (your photo reduced to a 22 x 22 grid of pixels) and the portrait section,
  which resolves from a few huge blocks to the real picture as you scroll it up the screen, and breaks back into blocks as you scroll down past it (scripts/portrait.ts).
  Until then a smooth illustration stands in (not pixel art, so there is something to resolve).
- **Copy:** the headline words and the "nothing generic" line are in `Hero.astro`, the four points and the verdict in `Chemistry.astro`, the service cards in
  `Deck.astro`, the about text in `About.astro`, the project list (every project is a "Concept build") in `src/data/site.ts`.
- **Work clips:** each project needs `public/work/<slug>.mp4` (18 seconds at 60 fps, 720 px wide, no audio), a smaller `<slug>-m.mp4` for phones (same clip at 480 px wide: `ffmpeg -i x.mp4 -vf scale=480:-2 -c:v libx264 -crf 30 -pix_fmt yuv420p -an x-m.mp4`) and `<slug>.webp` (its poster). The clip starts at
  navigation, so the site's own loader is in it, then the first screen, then one smooth scroll through the page.
  `node scripts/record-demo.mjs <slug> <url> [--length 18] [--start 6] [--scroll 4200] [--gate "click to open"]` records both for a live site (needs Playwright and
  ffmpeg). It does not screen-record (that tops out near 15 to 25 fps on a laptop and stutters): it pauses the browser's clock and steps it 1/60 s at a time,
  drawing every frame in full, so a clip takes 5 to 15 minutes to make but is exactly 60 fps.
- **Launch:** set `PUBLIC_SITE_URL` and `PUBLIC_NOINDEX=false`. While `PUBLIC_NOINDEX=true` the site tells search engines to stay away.

## Design language

- **Two worlds.** Cream (`hsl(39 50% 95%)`) and black. The header changes colour with whichever is under it (`data-world` on `<html>`; not `data-theme`, which some hosts use).
- **One accent, orange.** `--accent #ff5a1f` for fills and anything on black. `--accent-ink #f5501a` for big text on cream (3.2:1; plain orange is 2.85:1 and fails).
- **Type.** Geist at weight 600, very tight tracking (`-0.065em`), line-height 1. Geist Mono for small labels.
- **Pixels** are the signature: a 7x7 icon that scatters and reforms as design, build, SEO and marketing in turn; the card backs; the portrait.
- **Motion rules.** Transform and opacity only. The headline never reflows (that is what keeps layout shift at 0): words that are not shown yet are offset, not removed.
- **Progressive.** A mouse gets the full page (`.fx`): pinned scene, drag physics, cursor labels, previews. Touch gets the same content with native scrolling and taps.
  No JavaScript, or reduced motion: everything is simply there, finished.

## The page, top to bottom

The order follows what a client asks: who is this, show me, why would it work for my business, what do I get, who am I hiring, how do I reach them.

1. **Loader and hero:** the loader is the headline. It builds big, in the middle of the empty screen ("Hi, I'm Aadi and I make SEO-friendly websites."), holds a moment, then zooms into its place in the hero as the rest of the page fades in, and "cool" joins the sentence (`play()` in `src/scripts/hero.ts`; reduced motion and no JS skip it). The hero fills the first screen. At its foot: on desktop a short note on the left and "Remote worldwide" with a globe on the right (press it for the time somewhere else); on a phone only the globe, the note being kept in the page for search engines but not drawn. After the sentence has built, "cool" keeps changing (amazing, sexy, stunning, slick, bold, brilliant; shorter words on phones) and the line re-centres around each new word without shifting the layout (the word list is in `src/scripts/hero.ts`). The sentence builds, "cool" gives way to "SEO-friendly", then both sit together. Hover the name for a pixel face.
2. **Selected work:** built on the mechanism of the reference. The frames (just the clip, no border) scroll past in a tight column; only the project that has
   crossed the middle of the screen shows its name, arrow and "View", the previous one flies out as the next flies in, and the hero text steps aside and
   returns when you scroll back above the first project. Name and arrow drift against the frames; only the active project is clickable; tabbing to a project
   scrolls it to the middle. Under 700px wide, with reduced motion, or without JS, every project shows its name. Every project is a "Concept build".
3. **Site Chemistry** (pinned, scrubbed by scroll; on phones too, in a narrower frame with a shorter scroll): the four things a site needs arrive one circle at a time, each with a plain-language caption. Where all four
   meet is the orange core, ENQUIRIES. The view zooms into it until the whole screen is orange with ENQUIRIES standing on it, which holds; the next scroll
   gives way to the verdict.
4. **Services:** three cards you can drag and flick. They are dealt face down (a symmetric pattern of bevelled pixels) and turned over as the section arrives.
   On a phone the row is a carousel that keeps moving: it glides to the next card every few seconds (touch it and it waits), and each card is turned over as it comes into view. Three small tabs under the sentence bring a card forward (on a phone: scroll it to the middle); the words in the sentence follow the card you are on.
5. **Every detail, one designer:** the portrait goes from a few huge blocks to the real picture as the scroll carries it up the screen, and back again
   in reverse (a few blocks flash orange on the way). The title is built from pixels.
6. **Next chapter:** "Start your next website today" in huge type, built from pixels as it scrolls in. Two small slots roll through words
   ("Make it Fast and Clear"). Point at "today" and the arrow swaps sides with the word.
7. **Connect:** click-to-copy email (the hint text rolls to "Copied"), a stack of tinted project tiles that fly in and then cycle, a sitemap and channels
   list (hovered links become white pills), and "Crafted by Aadi" with a pixel icon that keeps changing shape.

Always there: the **menu** is a paper pull-tab hanging from the top-right edge, labelled "Pull me" (drag it down or just press it); a cream panel unrolls from the top with big Work, Services, About and Connect rows and the tab rides to its left edge. "Based in the UK" and the clock sit at the top-left (`src/scripts/menu.ts`; a `<details>`, so it works without JavaScript too). Once you scroll the "Based in the UK" label folds to a thin
line that opens again on hover. Pressing the clock opens the **local-time panel**: an analogue and digital clock in your time zone, hands you can drag (they
spring back), and a sound toggle (off until switched on): a synthesised tick, quieter the further the pointer is from the clock.

## Where things are

| File | What it does |
|---|---|
| `src/pages/index.astro` | Sections in order |
| `src/layouts/Base.astro` | `<head>` (meta, social cards, structured data), loader, scripts |
| `src/data/site.ts` | Reads `.env`; also the Work list |
| `src/styles/global.css` | Tokens, every component, phone layout |
| `src/scripts/hero.ts` | Headline sequence and the name hover |
| `src/scripts/chem.ts`, `ring.ts` | The Site Chemistry scene |
| `src/scripts/deck.ts`, `deck-eggs.ts` | Card dragging, flick physics, the three card scenes |
| `src/scripts/portrait.ts` | The scroll-built portrait (block front, reversible) |
| `src/scripts/work.ts` | Work: one active project at a time, drift, arrow nudge, clip loading |
| `src/scripts/pixelreveal.ts` | Headings built from pixels (real text stays in the page) |
| `src/scripts/finale.ts` | Next-chapter slots, footer tile stack, pixel headings, crafted-by icon |
| `src/scripts/clock-panel.ts` | The local-time panel (loaded the first time the clock is pressed) |
| `src/scripts/pixel.ts`, `patterns.ts` | The pixel icon and its four shapes |
| `src/scripts/scroll.ts` | Lenis smooth scroll, section-aware header |
| `src/scripts/eggs.ts`, `eggs-more.ts`, `serp.ts`, `crawler.ts` | The other easter eggs (the triggers are small; the scenes load only when found) |
| `scripts/single-file.mjs` | Bundles the built site into one HTML file (videos included) |
| `scripts/record-demo.mjs` | Records a Work clip and poster from a live site |

## Easter eggs

- **Flick a card hard** (or tap it, or press Enter on it): Development types a build log, Search Engine Optimisation sends a pixel spider down a checklist (title,
  meta description, structured data, alt text, speed) and counts a score ring up to 100, Marketing pops incoming enquiries.
- **Type `seo`** anywhere (or click the hero pixel icon five times on a phone): a made-up search page opens and the site climbs from 8th to 1st.
- **Type `hello` or `hire`:** the page scrolls to the Connect section.
- **Hold Shift, anywhere on the page** (on a phone: press and hold the headline): the changing word spins through twenty more adjectives; let go and it settles on "cool". A cartoon bubble ("Hold Shift. Anywhere.") pops up 3 seconds after the headline lands and once more a minute later.
- **Right-click the headline:** a small menu with one item, "Say hello", which scrolls to the Connect section, in place of the browser's menu.
- **Click "Remote worldwide":** the globe spins and a bubble gives the time in a city far away ("Tokyo: 23:04. Time zones are no problem.").
- **Hints:** a few seconds in, cartoon bubbles pop up now and then at the side of the screen ("Type hello anywhere", "Right-click the headline"...), only for eggs not yet found, at most six a visit (`src/scripts/hints.ts`).
- **Keep pushing when you are already at the bottom** (mouse wheel, trackpad, a swipe on a phone, or the arrow / space / End keys): a pixel rocket builds up, then carries you back to the top.
- **The cursor** is a cartoon arrow that leans as you move and squashes when you press, and becomes a pointing hand over anything clickable (`src/scripts/cursor.ts`;
  mouse and trackpad only). **Leave it alone for 45 seconds** and it falls asleep (it droops, little z's float up); move it and it wakes with "Oh! Hi."
- **Scroll very fast** (a hard flick): a bubble says "Whoa, slow down." and the cursor sweats.
- **Up late?** Between midnight and 5am by the visitor's own clock a line under the name says "Still up? Same." (and a few other hours get their own).
- **Hover the name** in the hero: a face follows the pointer along the words, the pixel icon bursts, letters under the cursor lift.
- **Press the clock** in the header: drag the hands, switch the sound on, listen for the tick as you move toward the clock.
- **Click the headline** to watch it build again. **Open the console**, **switch tabs**, read `/robots.txt` and `/humans.txt`.

## Performance

Measured on a production build (Chromium, three runs each): largest contentful paint about 1.0 s on desktop and 1.7 to 1.8 s on a throttled phone
(4x CPU, slow 4G), cumulative layout shift about 0. JavaScript is about 63 KB gzipped (the search-page egg, its animation helper, the egg scenes and the clock panel load only
when used), CSS 8 KB. The things that keep it there, all easy to undo by accident:

- The loader is the headline, and the longest word ("SEO-friendly") is the page's largest paint, so it has to appear early and nearly full size (it starts at 90% scale; a
  word that starts tiny is measured as a small paint and the number gets worse).
- Everything below the first screen is set up only after the headline has landed, one piece per idle moment (`setUpBelowFold` in `src/scripts/main.ts`), then one refresh of the
  scroll positions. Doing it as one block was a 100 ms stall while the headline moved.
- The first Work frame starts below the first screen (the hero is a full screen tall). If a frame ever sits inside the first screen, its picture becomes the largest paint.
- Smoothness while scrolling: no `will-change` on the hundreds of pixel squares (each became its own layer); the card backs are an image (`public/card-back.svg`), not 500
  live SVG shapes each; only one Work clip plays at a time; the cursor moves by one frame callback instead of an animation per pointer event.

If you change the intro or add images near the top, re-measure.

## Not built yet

- **A contact form.** The site is static, so a form needs a small server function (the Resend key and addresses are already in `.env`).
  Until then the Connect section copies your email address.
- **A language toggle, and Imprint / Privacy links.** There is no second language and there are no such pages yet.
- **Sound on the rest of the page.** The only sound is the clock panel's tick, and it starts off.
- **The brand name.** The brand falls back to your own name until `PUBLIC_BRAND_NAME` is set.
