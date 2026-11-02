# Portfolio: notes for working in this folder

Astro site, GSAP, Lenis, plain CSS. README.md describes the site; this file is the things that are easy to get wrong.

## Recording the Work clips (`scripts/record-demo.mjs`)

Re-records `public/work/<slug>.mp4` (60 fps, 720 px wide, no audio) and `<slug>.webp` (poster) for one project:

```
node scripts/record-demo.mjs <slug> <url> [--length 18] [--start 6] [--scroll 4200] [--gate "click to open"] [--sync-video] [--fps 60]
```

Needs Playwright (set `PLAYWRIGHT_DIR` if it is not importable) and ffmpeg. Frames are kept in `/tmp/record-<slug>/`.

- It does not screen-record. It pauses the browser's clock and steps it 1/60 s at a time, drawing every frame in full, so a clip is exactly 60 fps. A clip takes
  5 to 15 minutes; 3D-heavy sites (orra, halcyon) are the slowest. Run it in the background and watch for "Wrote ..." in its output.
- The clip starts at navigation, so the site's own loader is in it. `--start` is how many seconds the loader/intro gets before the scroll begins: look at the first
  frames in `/tmp/record-<slug>/` and set it to when the first screen has settled.
- A site with an "enter" screen needs `--gate "<button text>"` (djeska: `"click to open"`).
- A site whose intro is a `<video>` needs `--sync-video` (halcyon). Headless frame capture does not paint video layers and a video's own clock is not the paused one,
  so the script cuts the video into pictures with ffmpeg and shows one per frame in a canvas over the hidden video.
- Settings used for the current clips: doves-uk `--start 3.5 --scroll 4800`; ileife `--start 4 --scroll 4800`; orra `--start 5 --scroll 5200`; more-coffee
  `--start 4 --scroll 5200`; djeska `--start 4 --gate "click to open" --scroll 4800`; halcyon `--length 20 --start 8 --scroll 5200 --sync-video`.
- Look at a contact sheet of the result before committing it (a gap in the frame numbering once cut an encode down to one frame; the script now fills gaps).
- Do not stop a recording with `pkill -f record-demo`: the pattern matches your own shell and kills it. Kill by PID.
- The demo sites are at `https://clientdemo.maximusmediascape.workers.dev/<slug>/`.

## Performance rules (largest contentful paint must stay under 2.5 s; it is about 1 s now)

- The headline's longest word must stay the largest paint. Do not put a picture inside the first screen (the hero is a full screen tall; the first Work frame sits
  below it), and keep everything below the fold set up in `setUpBelowFold` in `src/scripts/main.ts`, after the headline has painted.
- The loader is the headline (`play(speed, true)` in `src/scripts/hero.ts`). "SEO-friendly" must first appear near full size (scale 0.9), or LCP jumps to the late "cool" word (3.6 s).
- Do not put `will-change` on repeated small things (the pixel squares), and do not draw big SVGs live many times (the card back is an image). Check smoothness with a
  scripted wheel scroll and long-animation-frame entries, not by eye.
- Measure with a production build (`npx astro build`, then `npx astro preview --port 4399`), desktop and a throttled phone (4x CPU, slow 4G). Last measured: about
  1.0 s desktop, 1.7 s phone, layout shift about 0.

## The single-file artifact

`node scripts/single-file.mjs <out.html>` bundles the site, its pictures and its clips into one HTML file (about 6 MB) for hosts that show one file.

- A viewer's page may only allow `data:` images, not `blob:`: never load pictures through a `blob:` URL.
- Test in Firefox and Safari terms too, not only Chromium: Chromium forgives invalid XML in an SVG image that other browsers reject (that once switched the
  portrait effect off silently).
- Check a scroll effect works when scrolled with the mouse wheel as well as by script, and that it reverses.

## Secrets

`.env` is gitignored and holds a real API key. Never commit it; before committing, check the staged diff for `sk-or-v1`.
