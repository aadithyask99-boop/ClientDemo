# The Garden

A digital wedding invitation: embroidered artwork, a 3D door-opening cover, a gold thread that stitches itself down the page, ink-reveal date, RSVP and a handful of Easter eggs. Astro, TypeScript, GSAP and Lenis. Served under `/garden` in the shared demo deploy.

Design rules: no sans-serif (Fraunces, Newsreader and Pinyon Script only), no eyebrow labels above headings, nothing boxy (arches, ovals, pills, stitched underlines). Fully responsive from 320 px phones to wide desktops.

## Run

```
npm install
npm run dev
```

`node scripts/stage.mjs` builds with `BASE_PATH=/garden` and copies the result to `../site/garden` (the repo's build command runs it).

## One file per couple

Everything on the page comes from `src/data/invitation.ts`: names, date, venue, story milestones, the day's timeline, dress code, RSVP questions, the secret message and the ring-hunt reward. A new client is that file plus (optionally) new artwork in `public/art`.

## Personal guest links

`?g=Sarah Jones,Tom Jones` greets "Dear Sarah & Tom", pre-fills the RSVP names and gives each guest their own row. `?n=3` just sets the party size. Generate one link per household from a spreadsheet.

Preview helpers: `?night=1` forces night mode, `?now=2027-06-19T10:00` previews the countdown on the day itself.

## RSVP to a Google Sheet

With `rsvp.endpoint` empty the form runs in demo mode (the reply is only stored in the browser). To collect real replies:

1. Create a Google Sheet, then Extensions > Apps Script, and paste:

```js
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const sh = SpreadsheetApp.getActiveSheet();
  if (sh.getLastRow() === 0) sh.appendRow(['Sent', 'Name', 'Coming', 'Supper', 'Message', 'Dietary', 'Song', 'Coach', 'Link']);
  d.guests.forEach((g) => sh.appendRow([d.sentAt, g.name, g.attending ? 'Yes' : 'No', g.meal, d.note, d.dietary, d.song, d.coach, d.link]));
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'New RSVP: ' + d.guests.map((g) => g.name).join(', '),
    d.guests.map((g) => g.name + ': ' + (g.attending ? 'coming' : 'declined')).join('\n'));
  return ContentService.createTextOutput('ok');
}
```

2. Deploy > New deployment > Web app, execute as you, access Anyone. Copy the web app URL into `rsvp.endpoint`.

The page posts `text/plain` with `no-cors`, which Apps Script accepts, so there is no CORS setup. Extra RSVP questions added to the config arrive as extra fields on `d` (add a column for each).

## Opening and depth

- **Cover** (`cover.ts`): two linen doors in CSS 3D with a wax seal. Tapping the seal swings the doors open while the hero layers (garland, villa window, roses) push forward by different amounts, so it feels like walking in. The cover is only shown with JavaScript on; without it the page is a plain readable invitation.
- **Tilt**: after opening, the stage tilts with the pointer on desktop and the phone's gyroscope on mobile (iOS permission is asked on the seal tap). Layers also drift apart as you scroll away.
- **Thread** (`thread.ts`): one SVG path built from each section's anchor. A needle follows the scroll position along it. On phones it keeps to the left margin; on wide screens it runs down the margin and weaves through the journey spine. Tap the needle for a chime.
- **Ink date** (`ink.ts`, `DateReveal.astro`): circles roughened by SVG turbulence act as a mask over the date, growing with scroll.
- **Sound** (`audio.ts`): chimes are synthesised with the Web Audio API, so there is no audio to license. Set `music.src` for looping music; the sound button in the corner controls both.

## Easter eggs

Swans tap to a heart burst; five hidden rings (they glint now and then and are all findable by touch) unlock a reward; long-press the wax seal for a secret message (on the cover and again at the bottom); tap the colour swatches to play notes; shake the phone for falling petals; open it after 8 pm (or tap the moon) for night mode with fireflies; on the wedding day the countdown becomes "Today is the day". Replies play an envelope that seals itself.

## Artwork

Made with `bytedance-seed/seedream-5-0-flash` on OpenRouter, about 2 cents an image. One shared style prompt keeps a set consistent.

```
../scripts/env.sh run -- node scripts/gen-art.mjs [name ...]   # raw images to ./art-raw (gitignored)
python3 -I scripts/key.py art-raw                              # cut out the keyed pieces, write public/art/*.webp
```

Pieces that need transparency (seal, garland, roses, swans, wreath) are generated on a flat colour and keyed out by sampling the border colour. Names, dates and every other word stay live text, never baked into an image. Generated art usually cannot be copyrighted, so clients do not get exclusivity over a design.

## Accessibility and performance

Everything is skipped under `prefers-reduced-motion`; the cover then simply fades. Interactive pieces have labels and visible focus. The fireflies render only at night and only while the tab is visible. Images are WebP (about 2.5 MB in total) and below-the-fold art is lazy-loaded.
