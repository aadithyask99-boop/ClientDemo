# The Garden (wedding invitation)

Folder: `garden/`. Mode: **inspiration** (inferred from the README, not confirmed). The README says it is "modelled on what makes the reference invitations feel immersive: art at scale, colour blocking and painted content, not text on flat paper." The owner's original reference inputs are not in the repo.

## Signature idea

An embroidered garden you walk into. A cover of two linen doors tied with a gold thread under a wax seal; touching the seal unties the thread and the doors swing open. The same gold thread then runs down the whole page as a real physics rope, pinned at each section like string between hooks.

## Through-line

Stitching and thread. Dashed "stitch" outlines on buttons, knots, hoops and the rope; a needle rides the rope; the preloader stitches a ring around the couple's initials; the first dance sits inside an embroidery hoop.

## Type and colour

- Fraunces (display, italic, soft), Newsreader (body), Pinyon Script (accents). **No sans-serif at all.**
- Paper `#f5efe4`, ink `#2f3a2c`, sage, thread gold `#b0822f`, rose, lilac. A night mode swaps to deep green with brighter gold.

## Rules this site set (carried into the skill)

- No sans-serif, no eyebrow labels above headings, nothing boxy: arches, ovals, pills and stitched underlines instead.
- Colour-blocked bands (deep green, blush) with scalloped edges so the page changes colour as you scroll.
- Painted art at scale: arched garden gateway, pearl and wisteria dividers, a painted scene per story step, embroidered icons, ivy in wide margins and rose vines at mid widths.
- Calm motion: 1.4 to 1.8 s scrub lag, 1.5 s reveals, slowed smooth scroll.
- Sound only for things the guest deliberately touches. Music starts at 20% volume from the seal tap.
- Everything for a couple lives in `src/data/invitation.ts`.

## What worked

- Interaction as story: hold the hoop to let the couple dance on, ring the chapel bell, find five hidden rings, long-press the seal for a secret.
- Personal guest links (`?g=Sarah Jones,Tom Jones`) and a working RSVP to a Google Sheet.
- Performance diagnosis written down: a full-screen `mix-blend-mode` over a live blur cost about ten times the frame time.

## Weaker / watch

- A lot of simultaneous motion (petals, butterflies, fireflies, rope, parallax). It stays calm only because each is slowed and each can switch off; a new site should add fewer layers.
- Art is generated (Seedream) and usually cannot be copyrighted, so a client does not get exclusivity. Say so.
- The sensor and rope work took many iterations on real phones. Test on a real device early.

## Seen on the live page (screenshots, desktop 1280 and phone 390)

Checked from `https://clientdemo.maximusmediascape.workers.dev/garden/`. The page is about 14,700 px tall on desktop and 12,000 px on phone. The seal must be clicked (`#seal`) before the page unlocks; a script that does not click it only ever sees the cover.

- **Cover:** sage linen doors, gold thread in a bow under a cream cameo seal marked "I&T". Quiet and tactile; nothing else on screen.
- **Hero:** an embroidered arched window of a stone villa and lavender, a wisteria curtain across the top, ivy down both margins, and very large italic names ("Imogen & Theo") with a gold script ampersand. The gold thread starts at the top-left. On the phone the arch fills the width and the names stack. This is the standard to match: art at scale, large type, almost no UI.
- **Journey:** one painted arch scene per story step, alternating sides, with the thread passing through round knot icons.
- **Venue:** a green linen band with scalloped edge, the conservatory in an oval arch on the left, white serif text and a pill button on the right. Strong colour change from the cream pages.
- **Finale:** a stitched countryside (chapel, oak, bench on a winding path) with roses in both corners and the date in gold script above it.
- **First dance (phone):** the couple in an oval embroidery hoop on plain paper, a hint line below.

### Defects seen (fix before showing a client)

1. **Cover hint is partly hidden (desktop).** "Touch the seal to open" collides with the thread's bow tails: the first letter is covered and the end is clipped ("ouch the seal to oper"). Move the hint below the tails or shorten the tails.
2. **Dance hint is clipped by the dock buttons (phone).** The script line "scroll to spin them into the dip, or press and hold…" runs under the round buttons on the right and is cut off ("or pr"). Add right padding on small screens or lift the line above the dock.
3. **Butterflies land on text.** A butterfly sat on a story date ("Winter 2025"), hiding it. Keep text clear of the wandering layer, for example by raising the text above it.
4. **Large empty paper between journey steps on desktop.** Some stretches are bare; consider tightening the spacing or filling with the existing ivy and petals.
5. **Low contrast on the finale date.** Gold script on a peach sky is hard to read; darken it.
