# Images and video: quality when the media is not the client's own

Stock and open-licence media is where pixelation comes from: a small source stretched to fill the screen, or a good source squeezed to a very low bitrate. Measured on the EVM build (2026-11-03): the full-width hero film is 1440 x 810 and is enlarged to cover a 1440 x 900 screen (scale 1.11), at about 750 kbps. That is the pixelation the owner saw. The full-bleed photographs are fine on normal screens (scale 0.7 to 0.8) but soft on retina screens.

## Minimums
- **Full-width video:** a source of at least 1920 x 1080, ideally larger, encoded at 3 to 4 Mbps or better for 1080p (about 2 Mbps for a 720p phone version). A short loop (10 to 20 s) lets you keep the bitrate high at a small file size. Never take a 720p clip and stretch it, and never squeeze a good clip to under about 1.5 Mbps for full width.
- **Full-bleed photographs:** natural width at least the width they are drawn at (scale 1.0 or below) and, for retina sharpness, about twice that (2880 px for a 1440 px full-bleed). WebP or AVIF at quality 80 or higher, with `srcset` for phones.
- **Tiles and thumbnails:** scale 0.5 or below is sharp everywhere; usually no problem.
- **Overlays:** a heavy dark or coloured wash hides quality but also makes the photo look cheap; keep it light.

## Where to get better media
- Take the **original**, not the preview: Wikimedia Commons "original file", the Pexels, Pixabay or Unsplash download at the highest size (often 4K), Openverse results followed back to the source page. A thumbnail or a 720p tier is where softness starts.
- This cloud environment may block the best stock sites (Pexels and Pixabay returned 403 for the EVM chat; Coverr and Openverse worked, but Coverr offered only 720p). If the best source is blocked, say so and ask the owner either to supply the file or to add the domain under Allowed domains in the environment's network settings.
- Prefer the client's own footage and photography whenever it exists; ask once.
- If good video is not available, use a high-quality still with a slow push in, or a single sharp poster frame. A sharp still beats pixelated film.

## Licences and credit
- CC0 and public domain need no credit; CC-BY needs credit; check each file. Record every source and licence in the site README. Brand marks belong to their owners; say when an authorised dealer's logos are used.

## The check
Run `node .claude/skills/design-craft/scripts/media-quality.mjs <url>` on the finished page. It lists every image, background image and video with the size it is drawn at, its natural size, the scale, and for video the bitrate. Fix every UPSCALED and LOW BITRATE line, replace a full-width clip below 1080p, then look at a frame at 100% (`ffmpeg -ss 5 -i hero.mp4 -frames:v 1 frame.png`). The handover lists any media that is still weaker than it should be.
