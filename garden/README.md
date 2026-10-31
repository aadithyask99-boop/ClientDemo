# The Garden

A digital wedding invitation: embroidered artwork, a 3D door-opening cover, a gold thread that stitches itself down the page, a scroll-driven first dance, drifting petals on a wind you can feel, ink-reveal date, RSVP and a handful of Easter eggs. Astro, TypeScript, GSAP and Lenis. Served under `/garden` in the shared demo deploy.

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
- **Thread** (`thread.ts`): a real rope, drawn on a fixed canvas. Its route (hero to the swans) is only a loose tether. Every point is a Verlet particle; the rope is **pinned at each section's knot** like string strung between hooks, its links can bunch but cannot stretch more than 8% (so a push becomes a wave that swings and overshoots), gravity makes it hang a little, and it drifts on a slow wind. **A mouse pushes it; touch never does.** On a phone only the tilt sensor moves it. Scrolling stirs a soft gust. Only the points near the screen are simulated. A needle rides the tip (a mouse click on it chimes and flicks the string). Reduced motion draws it still. The route is only rebuilt when the screen's **width** or the page's **height** really changes (lazy pictures arriving), and a rebuild keeps the rope's current swing; a phone's address bar sliding away only refits the canvas. Tilt is measured against the angle the phone is normally held at (a slow baseline plus a small dead zone), so holding it tilted does not leave the rope bowed.

  **Phone sensors** (`sensors.ts`): steady left/right tilt is gravity (a 20 degree lean is a full swing); rotating or shaking the phone ripples the string either way; it never swings off-screen. iOS asks for "Motion & Orientation" access, requested inside the seal tap. If no readings arrive after a few seconds on a touch device, a phone button appears in the dock to ask again, and tapping it explains what is wrong (declined, or an embedded viewer / browser setting blocking sensors). Sensors need HTTPS and are blocked inside sandboxed viewers, so test on the deployed page. Add `?tilt=debug` to the address to see live readings.
- **Ink date** (`ink.ts`, `DateReveal.astro`): circles roughened by SVG turbulence act as a mask over the date, growing with scroll.
- **Sound** (`audio.ts`): chimes are synthesised with the Web Audio API, so there is no audio to license. Set `music.src` for looping music; the sound button in the corner controls both.

## Page structure and why it is not plain

Modelled on what makes the reference invitations feel immersive: art at scale, colour blocking and painted content, not text on flat paper.

- **Welcome** sits inside a grand arched gateway of roses and wisteria (`Welcome.astro`).
- **Dividers** (`Divider.astro`): a full-bleed pearls-and-roses band, and a hanging wisteria curtain above the schedule.
- **Journey**: each story step has its own painted scene (`story-*.webp`, set per step in `invitation.ts`) beside its words, alternating sides on wide screens.
- **Colour bands** (`.band-green`, `.band-blush`): the venue sits on a deep green linen band and the dress code on blush, both with scalloped edges, so the page changes colour as you scroll.
- **Painted details**: embroidered icons on the timeline, a row of illustrated guests for the dress code, a satin bow over the gifts.
- **Margins**: ivy on screens 1280 px and wider, rose vines between 900 and 1279 px.

## Performance notes

The leaf shadows are a pre-blurred image moved with `transform` only. An earlier version used `mix-blend-mode: multiply` over a live SVG blur across the whole screen, which cost about ten times the frame time (measured 351 ms per frame against 30 ms with it off); avoid full-screen blend modes and animated filters. The dance is 144 frames at 24 fps, decoded up front and cross-faded between frames, so slow scrolling glides.

## Preloader (`layouts/Base.astro`)

The cover is held back until its own pieces are ready (the fonts, the linen and seal images, and the script itself), so it appears whole and never paints in piece by piece. **If that takes under 0.4 s, nothing is shown at all.** Otherwise a needle stitches a ring of gold running stitches around the couple's initials, driven by the real loading progress, and the cover fades in when it finishes (the preloader stays at least a second once seen, so it never flashes). Related behaviour:

- The first paint is the paper colour, never white (a small inline stylesheet).
- "touch the seal to open" only fades in once the cover, and so the seal, is there.
- The garden art behind the doors loads at low priority, after the cover's own art.
- Tap the seal early and the thread unties at once; if the garden art is still arriving the doors wait ("one moment") and open as soon as it is ready.
- Reduced motion never shows the preloader. If the script never starts, the page unlocks after 14 s.

## The seal, music and sound

- **The cover** (`Cover.astro`, `cover.ts`): a gold thread is wrapped across both linen doors and tied in a bow under the wax seal. Pressing the seal dents it; letting go unties the thread: the bow's tails are drawn in and its loops shrink away, the thread unwinds from the middle outwards and sags off, the seal fades gently, and the doors part, with a soft thread-slip sound (nothing sharp). Long-press the seal instead for the secret.
- **Music** (`audio.ts`, the music button in the dock): starts inside the seal tap at **20% volume** (`music.volume` in `invitation.ts`) and can be paused or resumed from the dock; the choice is remembered. With no file set it plays a quiet royalty-free ambient loop synthesised in the browser. To use a licensed track, put the audio file in `public/music/` and set `music.src` to `` `${import.meta.env.BASE_URL}music/your-file.mp3` ``. Recordings of commercial songs are copyrighted, so the client needs the rights to use one; the repo does not include any.
- **Sound effects** (the other dock button) are only for things you deliberately touch: the chapel bell, colour swatches, rings, swans, the oak, the seal's thread. Nothing plays from incidental taps (catching a petal, scaring a butterfly).

## Depth and calm (`parallax.ts`)

Pictures inside their arched windows drift against the scroll, the pearl and curtain dividers slide slower than the page, the finale landscape separates into layers (hills, chapel, oak, bench), and the pointer or phone tilt gives the windows a slight drift. Every scroll link is scrubbed with a 1.4 to 1.8 s lag, smooth-scroll on desktop is slowed, reveals fade in over 1.5 s, and petals, butterflies and shadows move more slowly, so the whole page moves calmly.

## Atmosphere (`atmosphere.ts`)

Embroidered petals and leaves drift down on a slow wind. Scrolling fast stirs a gust, moving the pointer pushes them aside, tapping one catches it (it chimes; eight catches earns a wish, sixteen a shower) and tapping empty paper scatters a few. A gust also blows through now and then by itself. Butterflies wander the page, drift toward the pointer (or your last tap) and scatter when touched. The garland and roses sway in the same breeze, and two layers of soft leaf shadow drift across the page (moonlight at night). On screens 1280 px and wider, ivy grows down both margins so the paper beside the content is never empty. Everything stops under `prefers-reduced-motion`, and the petal loop pauses when the tab is hidden.

## The first dance (`dance.ts`, `Dance.astro`)

A 6-second one-shot clip was generated from the couple still: she is twirled under his arm in a full spin, then he lowers her into a deep dip and they hold it. Only the first frame is fixed (`DANCE_LAST=0`), so it ends in the dip. It is trimmed to the useful 4 seconds and stored as 96 WebP frames at 24 fps (about 1.2 MB), drawn to a canvas inside an oval embroidery hoop. **It does not loop.** Scrolling through the section plays the spin and then the dip, which lands after 86% of the section's scroll and holds still while the page moves on; scrolling back up rewinds it. **Press and hold** the hoop to let them dance on by themselves (forward only, to the dip, with hearts and chimes); letting go hands it back to the scroll. With reduced motion the still image stays.

## The finale landscape (`scene.ts`, `Finale.astro`)

The footer is a stitched countryside: rolling hills, a chapel, an old oak and a bench on a winding path, with roses in the corners. As you scroll in, the sky turns to sunset (`--dusk` goes from 0 to 1) and the sun sinks behind the hills; the chapel windows light up and fireflies appear. Touch the chapel to ring its bell and send birds from the spire, shake the oak for falling leaves, or sit the bench. The captions are in `scene` in `invitation.ts`. At night the sky becomes dusk blue with a moon.

## Easter eggs

Swans tap to a heart burst; five hidden rings (they glint now and then and are all findable by touch) unlock a reward; **long-press the wax seal** for a secret message (on the cover and again at the bottom); tap the colour swatches to play notes; open it after 8 pm (or tap the moon) for night mode with fireflies; on the wedding day the countdown becomes "Today is the day". Replies play an envelope that seals itself. Touch-first by design: long-press, tap and drag, no shaking.

## Artwork

Made with `bytedance-seed/seedream-5-0-flash` on OpenRouter, about 2 cents an image. One shared style prompt keeps a set consistent.

```
../scripts/env.sh run -- node scripts/gen-art.mjs [name ...]   # raw images to ./art-raw (gitignored)
python3 -I scripts/key.py art-raw                              # cut out keyed pieces, slice the petal, scenery and butterfly sheets, write public/art/*.webp

# the dance: needs art-raw/couple-small.jpg (the still resized to 720x960)
DANCE_OUT=dance3 DANCE_LAST=0 ../scripts/env.sh run -- node scripts/gen-dance.mjs   # image-to-video; about $0.26 for 6 s on alibaba/wan-3.0 at 480p. DANCE_PROMPT sets the move; omit DANCE_LAST=0 for a looping clip
python3 -I scripts/dance-frames.py art-raw dance3 4.8 0.8    # levelled frames 0.8 s to 4.8 s into public/art/dance (set data-frames in Dance.astro to the count it prints)
```

Pieces that need transparency (seal, garland, roses, swans, wreath, the six petals) are generated on a flat colour and keyed out by sampling the border colour. Names, dates and every other word stay live text, never baked into an image. Generated art usually cannot be copyrighted, so clients do not get exclusivity over a design.

## Accessibility and performance

Everything is skipped under `prefers-reduced-motion`; the cover then simply fades. Interactive pieces have labels and visible focus. The fireflies render only at night and only while the tab is visible. Images are WebP (about 3.3 MB in total, the dance frames load only as you near that section) and below-the-fold art is lazy-loaded.

## Performance notes

- The rope is an in-document SVG (`#thread`), so it scrolls natively with the page instead of lagging behind a fixed canvas. On touch it redraws at most every 33 ms.
- Fireflies use one pre-drawn glow sprite at 30 fps and are never respawned on resize. Petals and butterflies only refit on height-only resizes (the mobile address bar).
- Night mode is a single fixed veil, not per-element filters. No blurred text shadows, no backdrop filters.
- On touch devices the pointer parallax and leaf-shadow layer are off.
- Profiling: `PROFILE=1 OUT_DIR=dist-prof npx astro build` gives an unminified build in `dist-prof/` (git-ignored).
