# Halcyon (cyber security landing page)

Folder: `halcyon/`. Mode: **original hero, referenced sections** (inferred). The lower "night" sections are "in the style of a studio-site reference, with Halcyon's own content, visuals and code." Owner confirmation pending.

## Signature idea

The hero is a single pre-rendered 5 second video: empty sky, a kingfisher flies in, swoops toward the camera and lands as the page's portrait. The video's last frame is the finished page. The interface eases in out of blur as the bird approaches.

## How it was made (reusable method)

- Screenshots of the page's own CSS (empty sky, and sky plus landed bird, with interface hidden) became the **first and last frames** of an image-to-video model, so the clip starts and ends on exactly what the page shows. Desktop 16:9 and phone 9:16, MP4 and WebM.
- An earlier version stitched separate bird photos with blur filters and dropped frames. Lesson: a video decoded by the browser beats filtered stills.
- This is the only place "screenshots of the page" feed generation. A recording script was not found in the repo; the method is described in `halcyon/README.md`.

## Through-line

Sky turning to night. A fixed layer changes the sky to dusk then night as you scroll, with no visible edge, run by CSS `animation-timeline: scroll()` where supported so a fast flick cannot outrun it.

## Sections worth remembering

- Statement words that light up as you scroll.
- Work tiles that are **live canvas toys** (radar, infection network, cloud-layer scan, threat feed) with fallbacks.
- A dot-matrix manifesto the pointer pushes through.
- Services words that light under the pointer while a photo trails it.
- Contact footer where 3D keycaps spelling the name fall with simple physics.

## Rules and craft

- Condensed all-caps display type for statements, glass props (padlock, shield, key, orb) on transparent backgrounds made from images on pure black.
- Heavy WebGL loads only after the intro and renders only while on screen.
- All figures, client names and the firm are placeholders.

## Weaker / watch

- A lot of bespoke interaction per section; phones needed re-spacing so no screen is empty (about 2,700 px shorter).

## Seen in the portfolio clip (18 to 20 s, 8 frames)

- Pale sky, the kingfisher flies in, fills the frame, and the page settles into a light blue hero: "Foresight & security" on the left with the bird on the right, a pill nav, three glass cards bottom right (one with a large "42%").
- The headline runs behind the bird's head, so the bird reads as part of the layout, not a sticker. The card body text is very small at this size; check legibility on phones.
- Scrolling turns the sky to deep navy. Condensed all-caps statement ("WE DON'T JUST MONITOR. WE RESPOND TOO. NETWORKS. CLOUD. PEOPLE.") lights word by word.
- Work tiles glow in different hues (teal radar, orange layered cloud, violet feed) against near-black. Each tile has one colour, which keeps four live toys from feeling noisy.
