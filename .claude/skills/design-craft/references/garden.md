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
