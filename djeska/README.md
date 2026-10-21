# DJ ESKA demo site

One-page concept for DJ ESKA aka Mr Good Vibes (@djeska_mrgoodvibes, Hampshire UK). Astro 7 + GSAP (ScrollTrigger, SplitText).
Staged next to the other demos at `/djeska`. Built to show the client before his friend's site exists.

## Run

```bash
npm install
npm run dev          # http://localhost:4333 (launch.json entry djeska-dev at the workspace root)
npm run build
node scripts/stage.mjs   # builds with BASE_PATH=/djeska into ../site/djeska
```

The root `wrangler.jsonc` builds all three sites, then copies `demo-index/index.html` to `site/index.html`.

## Design

- Reference: Soundform (Framer) template, "Noa Rive". Vinyl gate, edge to edge wordmark over a full-bleed photo, hairline
  lists, a sticky mini player.
- Palette: black #0a0a09, ink #f2eee6, gold #d6ae52 (taken from his logo). Gold only for the wordmark, pills and small accents.
- Type: Archivo Variable (width axis, 125% on the wordmark only, weight 800 only there; section titles 700) and Figtree body.
  No italics, no em dashes, no labels above titles, no card grids (hairline rows; packages are three columns split by lines).
- Gate: his logo as the sleeve, a record that slides out on hover and on click. "Click to open" is the only way in and starts the music (the click is
  the user gesture). The sticky player bar is there from that moment, with a volume slider that defaults to 20%. Seen once per session (`sessionStorage djeska-gate`), skipped
  for reduced motion and without JS.
- Music section follows the reference: photo left, title and current mix right, then four mix covers. The covers are
  placeholder artwork drawn in CSS (a record with a coloured label), swap for real art or generated images.
- SoundCloud: his profile (soundcloud.com/kristian-eskalade-dennis) has no public tracks, only a playlist "something new" with two
  tracks by other artists. Those two play through a hidden SoundCloud widget as mixes 1 and 2; set `sc` on a track in
  `src/data/site.ts` (position in the playlist) or point `soundcloud.playlist` at a playlist of his own mixes.
- Player: one `<audio>` plus the widget, four tracks from `tracks` in `src/data/site.ts`, a current-mix control, the covers, and a full width
  sticky bar that appears once the hero is behind you (cross closes it). Tracks play on to the next one.
- Video: placeholder Pexels clip in the "Your event deserves more than just music" section (`public/video/decks.mp4`,
  poster `src/assets/photos/decks-poster.jpg`). Click plays and pauses it in place.
- Ticker: infinite loop of what he plays for, pauses on hover, static with reduced motion.
- "More than music": portfolio row of four event photos with captions, then the giant footer wordmark.
- Rooms list: a photo follows the cursor (desktop only). Package names preselect the package in the form.
- Enquiry: sentence form that opens a prefilled WhatsApp message (wa.me/447453321902), with a prefilled mailto link too.
  No backend.
- Phone: wordmark stacks to two lines, nav hides, tap targets 44px, no horizontal overflow.

## Placeholders to replace before it is shown as final

- Hero photo: `src/assets/photos/hero-placeholder.jpg` is a Pexels stock DJ (greyscale), a different person. Brief for the
  real one: landscape, 2400px wide or more, him mid-mix or facing camera, dark room with warm light, empty space across the
  bottom third for the wordmark, no flyers or logos in frame. His smiling shot (`pointing.jpg`) is the best asset he has.
- Music: mixes 3 and 4 are Pixabay tracks and the titles are placeholders (research/SOURCES.md).
  Swap in his mixes and update `tracks` in `src/data/site.ts`. The SoundCloud and Apple Music rows point to his Linktree until the real URLs are known.
- Photos are 800 to 1400px Instagram files. Ask for originals.
- Packages: Gold, Platinum and Diamond are his names, but what each includes and the prices are not published, so the page
  shows names only and says dates are quoted individually. Fill in at the meeting.
- Copy is first person, taken from his captions and flyer. He should approve it.
- Video: Pexels stock footage, replace with his own.
- Portfolio and ticker reuse five photos. Ask him for more event photos.
