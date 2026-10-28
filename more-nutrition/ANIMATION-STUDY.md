# More Nutrition "Matcha meets Protein": animation and interaction study

Source material: the screen recording (`More Nutrition - Matcha meets Protein.mp4`, 93 s, 1280x720, 30 fps) and the live page `https://more-nutrition.webflow.io/`.

## How this was studied

- **Video**: every 0.5 s across all 93 s (186 frames, read as labelled contact sheets). The fast moments were re-sampled at 8-15 fps: the page load (0-3 s), the Buy now hover (3.8-5.8 s), the nav hovers (5.6-9.2 s), the sequence handoff (32-35 s), the jar zoom into the title (42-45 s) and the payment pills (81-86 s).
- **Page**: the HTML, the Webflow CSS, the site's own `main.css` and `app.js`. The custom animation layer is the last ~20 KB of `app.js` and is fully readable. Every number below is a value from that code, not an estimate. The page was also loaded in headless Chromium at 1440x900 to measure real section heights.
- Where the video and the code disagree, the video shows what a visitor saw. Section 12 lists the things in the video that are *not* site behaviour.

Stack found: **GSAP 3.15** (ScrollTrigger, SplitText, CustomEase, DrawSVG, Inertia), **Lenis** smooth scroll, **Swiper** (creative effect) for the flavour slider, a **custom slider class** for the reviews, **lottie** for the logo, and two **canvas image sequences**. Plain CSS handles every hover.

---

## 1. Global system (this is most of the "feel")

### Fluid scaling (Osmo scaling system)
All sizes are in `em`. `body { font-size: clamp(992px, 100vw, 2560px) / (1440 / 16) }`, so 1em = 16 px at a 1440 px viewport and the whole layout scales with the window. Tablet and mobile breakpoints use design widths of 640 / 550 / 390. Grid: 12 columns, 2.5em margin (6 columns, 1.25em margin below 991 px).

### Palette and type
| token | value |
|---|---|
| `--bg-light` (hero) | `#b6cba5` |
| `--bg-pale` (page) | `#e8efe4` |
| `--dark-green` | `#335c30` (marquee ribbon `#214a1e`) |
| `--light-green` | `#90b96d` |
| `--white` | `#fff` |

Type: **Founders Grotesk Condensed** (400 / 500 / 600), tight tracking, uppercase for the big claims. Hand-written notes are SVGs, not a font. `::selection` is dark-green with pale text.

### Easing tokens (used everywhere, consistently)
```
--default-ease : cubic-bezier(0.72, 0.17, 0.17, 1)
--smooth-ease  : cubic-bezier(0.32, 0.72, 0, 1)      (also GSAP's default ease, "smooth-ease")
--bouncy-ease  : cubic-bezier(0.34, 1.42, 0.64, 1)
--elastic-ease-out : linear(0, .5737 7.6%, .8382 11.87%, .9463 14.19%, 1.0292 16.54%, 1.0886 18.97%,
    1.1258 21.53%, 1.137 22.97%, 1.1424 24.48%, 1.1423 26.1%, 1.1366 27.86%, 1.1165 31.01%,
    1.0507 38.62%, 1.0219 42.57%, .9995 46.99%, .9872 51.63%, .9842 58.77%, 1.0011 81.26%, 1)
GSAP CustomEase "elastic-ease-out"      M0,0 L0.076,0.5737 L0.1187,0.8382 L0.1419,0.9463 L0.1654,1.0292 ...
GSAP CustomEase "elastic-ease-out-soft" M0,0 L0.017,0.029 L0.036,0.113 L0.111,0.604 L0.15,0.809 L0.191,0.949 ... L0.293,1.049 L0.435,1.01 L0.512,1 L1,1
```
The "soft" elastic overshoots about 5 % and settles in one wobble. It drives all text reveals. The full elastic overshoots 14 %. It drives buttons, pills and stickers.

### Smooth scroll
`new Lenis({ lerp: 0.18, autoRaf: true })`. Lerp 0.18 is on the snappy side of Lenis: it trails the wheel by roughly 8-10 frames, so scroll feels weighted but not floaty. It is **stopped during the intro** and restarted about 1 s before the intro timeline ends (1.25 s on mobile). `history.scrollRestoration = "manual"` and ScrollTrigger scroll memory is cleared, so a reload always starts at the top. `html, body { overscroll-behavior: none }`.

### The "boil" on hand-drawn notes
Every handwritten SVG (signatures, arrows, underlines, scribbled circles) is **two stacked copies**; the second has `.is-wiggle`:
```css
@media (prefers-reduced-motion: no-preference) {
  .is-wiggle { animation: wiggle .8s steps(7, end) infinite; animation-delay: var(--animation-delay); }
}
/* 0% translateY(1px) · 20% (-1px,-1px) · 32% 0 · 48% 0 · 64% translateX(1px) · 80% translateY(-1px) · 100% 0 */
```
Stepped (7 steps) 1 px jitters give the "hand-drawn, never perfectly still" look. Delays are staggered per element (`--animation-delay: .05s / .15s / .2s ...`) so the notes do not move in sync.

### The jelly hover (the signature micro-interaction)
Nearly every interactive element (buttons, nav pills, social circles, arrows, rating stars, footer cards, links) uses one recipe. On hover:
```css
translate: <small x/y lift> ;  rotate: <small tilt>;
scale: .945 .915;                       /* squash */
transform: scale(1.0582, 1.0929);       /* exact inverse of the squash */
transition:
  translate .725s .1s var(--elastic-ease-out),
  rotate    .725s .1s var(--elastic-ease-out),
  scale     .15s  .1s var(--default-ease),
  transform .35s  .25s var(--bouncy-ease);
```
The trick: `scale` and `transform: scale()` multiply to exactly 1, so the element ends at its normal size. But they transition with *different durations and delays*, so in between the product is not 1: the element squashes, then springs back with overshoot (bouncy ease) while it slides and tilts on the long elastic curve. The un-hover path has no delays, so it returns quickly. This produces the jelly "squish, lean, settle" feel and is the single most recognisable detail in the video. It is pure CSS and only active under `(hover: hover) and (pointer: fine)`.

Per-element lean (so neighbours move differently, never as a block):
| element | translate | rotate |
|---|---|---|
| nav link 1 / 2 / 3 | -0.125em,-0.325em / -0.0675em,-0.4em / 0.125em,-0.325em | -4deg / -1deg / 3deg |
| social icon 1 / 2 / 3 | same values as the nav links | -4 / -1 / 3 |
| slider arrow left / right | -0.375em, 0 / 0.375em, 0 | -4deg / 4deg |
| rating stars 1..5 | y -0.4 / -0.75 / -0.4 / -0.625 / -0.4em, x -0.125 / -0.0675 / 0 / 0.0675 / 0.125em | -3 / -1 / -2 / 1 / 1deg; each star +5 ms later (a wave) |
| "3158 Reviews" text | 0.125em, -0.25em | 3deg |
| footer link text | 0.0675em, -0.125em, scale .955 .925 | 2deg |
| footer cards 1 / 2 | -0.25em,-1.5em / 0.375em,-1.25em, scale .95 | -1deg / 3deg |
| footer product card | -0.375em, -3em, scale .975 | -2deg |

Underlines are a `::after` bar (2 % tall) that drops 0.125em on hover (`translate .45s smooth`). Large hit areas use an `::after` that counter-translates, so the pointer target does not run away from the cursor. Keyboard focus shows a 3 px dark-green ring (`:focus-visible`).

### Pointer inertia ("push the bubbles")
Containers with `[data-inertia]` (hero, the polaroid section, the flavour section) track the mouse delta (one rAF read per frame). On `mouseenter` of any `[data-inertia-item]`:
```js
// dx, dy = pointer velocity (px since last frame); rotation from the cross product of (cursor - item centre) and velocity
gsap.to(child, { inertia: { x:{velocity: clamp(30*dx, ±1080), end:0},
                            y:{velocity: clamp(30*dy, ±1080), end:0},
                            rotation:{velocity: clamp(15*cross, ±60), end:0},
                            resistance: 180 }});
```
Entering an item with speed flings it away from the cursor, with a spin that depends on which side you hit it, then it decays back to rest (`end: 0`). In the video (9.0-10.5 s) the "95%" bubble is knocked out of its slot and glides home. It is off on touch devices.

---

## 2. Video timeline, with the code behind each beat

(Video time. Everything before 1.0 s and the reload are recording artefacts: the page was already loaded when recording started.)

| t | what happens | mechanism |
|---|---|---|
| 0.0-1.0 | Hero idle: jar floats, notes boil | idle loops (section 3) |
| ~1.0 | Page reload (cursor-to-refresh) | |
| 1.1-1.4 | Flat green screen, tiny ring spinner bottom-right | `.loader` (fixed, `rgba(182,203,165,.99)`, multiply paper-grain pattern, 1.25em ring, `rotation 1s linear infinite`) |
| ~1.4 | Loader cut (no fade) when sequence images are decoded; logo strokes draw in: the "M" loop first, then "ore" wiped on | `html.has-seq-ready.fonts-loaded.is-ready` hides the loader; Lottie `more-logo-animation.json` (2000x700, 50 fps) plays. The logo is held at the centre of the screen |
| ~2.4 | Logo glides up to its header position; page assembles in one overlapping timeline | see section 3 |
| ~3.4 | Settled, Lenis starts | `kt.start()` at `-=1` |
| 4.0-5.8 | Buy now hover (cursor drifts on, then off) | section 4 |
| 6.0-7.5 | Nav pills tilt one by one as the cursor sweeps Nutrition, Benefits, Reviews | jelly hover |
| 7.8-8.8 | "Shop all" hover (white button variant) | button mechanics |
| ~9.0 | YouTube icon hover | social jelly hover |
| 9.0-10.5 | Cursor knocks the "95%" bubble | inertia |
| 10.5-18 | Scroll #1: hero lifts, text-on-curve ribbon "IT'S A MATCH(A)" rises from the bottom | marquee, section 5 |
| 14.5-17 | Dark-green boxes appear behind "MEETS PROTEIN" and the paragraph | **text selection** (`::selection`), not an animation |
| ~18.5 | Scroll jumps back to the very top, then scrolls down again | user scrubbing |
| 19-32 | "You deserve the best..." and three tilted video polaroids | section 6 |
| 32.5-47 | Pinned "nutrition" sequence: cards, jar, white curves | section 7 |
| 47-56.5 | Comparison table over the sequence | section 8 |
| 56.5-65 | "Clean. Green. Goodness." and the reviews slider | section 9 |
| 65-82 | Chunky Flavour slider (clicks through 7 slides) | section 10 |
| 82-86 | "Don't just crave it. Get it." with payment pills | section 11 |
| 86-93 | Footer: product cards, giant "More" wordmark, credits | section 11 |

---

## 3. Hero / intro (`yo()`, desktop >= 992 px)

Initial states (set before the loader leaves):
- logo `y` = distance from its place to the screen centre; nav `opacity 0`; CTA `opacity 0, y 60`
- underline path `drawSVG: "50% 50%"` (nothing drawn)
- facts `opacity 0, y 100, x -40, rotate -35, scale .6`
- jar canvas `yPercent 100, xPercent -50, rotate -35, scale .9, opacity 0` with `transformPerspective 1000`, origin `60% 50%`
- note text `opacity 0, rotate -18, scale 1.25, yPercent -65, xPercent -25`; note arrow `rotate -6, scale 1.25, xPercent -125`
- headline lines (SplitText `lines`) `yPercent 60, xPercent 25, opacity 0, scale .6`, origin `100% 100%`
- paragraph lines `yPercent 125, opacity 0`; underline `opacity 0, yPercent 45`

One GSAP timeline, default ease `smooth-ease`, each step overlapping the previous (`<` = start of previous):
```
logo       y -> 0                                  0.60  (delay 1)
nav        opacity -> 1                            0.25  at <+.125
CTA        y -> 0, opacity -> 1                    0.50  at <+.05
underline  drawSVG 50%/50% -> 150%/50%             1.40  power2.out, at <+.005   (draws outward from the middle)
facts x3   opacity,y,x,rotate,scale -> rest        0.80  elastic-ease-out, stagger -0.048 (last bubble lands first)
note text  -> rotate -7                            0.45
note arrow -> rotate 9, yPercent 10                0.45
jar        -> yPercent -1, rotate -11, opacity 1   0.85  (a rise from below-left with a roll)
sprite     frame 0 -> 22 (23 webp frames)          0.85  sine.out, snapped, in parallel with the jar
headline   lines -> rest                           0.95  elastic-ease-out-soft, stagger .039
paragraph  lines -> rest                           0.50  stagger .039
underline  -> rest                                 0.45  at <+.15
```
After the jar lands, a ScrollTrigger (`top bottom` to `bottom top`) starts two **idle loops** (and pauses them when the hero is off-screen):
- sprite scrub `frame 22 -> 0`, `sine.inOut`, 1.38 s, yoyo forever (23-frame jar sprite, drawn on a 2D canvas, DPR-aware)
- jar float `yPercent -1 -> 2, rotate -11 -> -13, rotateX 0 -> -4, rotateY 0 -> -5`, 1.38 s, `sine.inOut`, yoyo

The two loops share a period, so the jar's sprite angle and its tilt breathe together.

Mobile (< 992 px): same order but no note text/arrow, the jar enters from `yPercent 150, scale 1.1`, the float is only `yPercent -1 -> 1`, `rotate -11 -> -13`.

`Buy now` and `Shop all` are the same component (section 4). The hero background `.stage` is `#b6cba5`. The ribbon (section 5) sits at the bottom of the hero.

---

## 4. Button: "the arrow hops across the pill"

Markup: `.button` = `[first circle + arrow] [pill background + label] [second circle + arrow]`. At rest the first circle (with arrow) sits on the left of the pill and the second is hidden (`scale 0, opacity 0`, arrow `translate(-.75em, .75em) blur(.5rem) opacity 0 scale .625`).

Hover (`.button-bg` is the pill; all easing tokens from section 1):
- pill: `translate -2.5em -0.325em; rotate -4deg;` plus the squash pair. It slides left and tilts, as if pushed.
- first circle: `scale 0, opacity 0` (scale .35 s, opacity .15 s after .15 s); its arrow flies out `translate(-.75em,.75em) blur(.5rem) opacity 0` (.75 s elastic)
- second circle (right side): `scale 1, opacity 1` over .75 s elastic after .1 s; its arrow arrives `translate 0 0 blur 0 opacity 1` (.3 s bouncy after .2 s)

So on hover the pill pops left with a tilt and a squash while a new circle blooms on the right with the arrow landing inside it. In the video (4.7-5.8 s) the label "Buy now" visibly leans and the dark disc moves from one side to the other. The white version (nav "Shop all") uses `--bg-pale` discs.

In the flavour slider the button itself reveals per slide: inactive `opacity 0, translate 0 1em, scale .85` (.5 s smooth), active `opacity 1, translate 0, scale 1` (.85 s elastic). It pops in each time a slide becomes active.

---

## 5. Ribbon: text on a curve (`vo()`)

`[data-marquee]` is an SVG with `<textPath>` along a big arc: "IT'S A MATCH(A) - IT'S A MATCH(A) ..." in 11rem uppercase 600, tracking -0.03em, `--bg-light` on `#214a1e`, with a `clip-path: polygon(66% 10%, 100% 53%, 100% 100%, 0 100%, 0 79%)` overlay in `--bg-pale` that carves the hero's lower edge into the next section.
Scroll-scrubbed with `scrub: true` from `top bottom` to `bottom top`: `textPath startOffset  -30%  ->  -60%`. The words travel along the arc as you scroll; they are never autoplaying. In the video (10.5-19 s) the ribbon rises like a hill and the text rolls over its crest.

---

## 6. "You deserve the best" and the video polaroids

- Heading is three lines; the last ("Iced Matcha Latte.") is a static `--light-green` span.
- Three white polaroid cards, each holding a muted looping `<video>`: tilts `-12deg / -2.5deg / 5.5deg`, staggered tops/lefts, `border-radius .375em`, `padding .875em`. They are `[data-inertia-item]`, so they get shoved by the cursor (section 1).
- Videos: paused until the card enters the viewport (`ScrollTrigger top bottom / bottom top`, play on enter and enter-back, pause on leave). Each card has a **sound button** (bottom-right): click toggles `muted`. The two speaker icons cross-fade/rotate: first icon `opacity 0, scale .5, rotate -30deg` (.35 s smooth); second icon in at `scale 1, rotate 0` (.75 s elastic). Button hover darkens the disc (`color-mix(dark-green, transparent 35%)` over .25 s); `:active` is `scale .9`.
- The paragraph block has a Buy now button and five stars (half star at the end) with the wave hover (section 1).

---

## 7. The pinned sequence (`mo()`): the centrepiece

Layout: `.sequence-section` contains `.sequence-scroll-wrap` of **720 lvh** (6480 px on a 900 px-high screen) holding a `position: sticky; height: 100lvh` stage. Everything below happens inside that pin. Measured at 1440x900: section top 2598, height 6480.

### The jar: a 200-frame image sequence on canvas
- `seq_0_0 ... seq_0_199.webp`: 200 frames, preloaded up front. Sampled sizes: frame 0 is a 516 B blank image (the jar is absent at the start), frame 100 is 57 KB, frame 199 is 100 KB.
- Drawn on a `<canvas>` (DPR capped at 2): `ctx.drawImage` centred, full-height on desktop, 80 % height anchored to the bottom on mobile.
- Frame index is a number tweened with `snap: "frame"`:
  `gsap.to({frame:0}, { frame:199, ease:"none", scrollTrigger:{ trigger, start:"top 20%", end:"bottom bottom", scrub: 0.7 } })`.
  `scrub: 0.7` adds a 0.7 s catch-up lag on top of Lenis, which is why the jar spins with a soft, filmic inertia and keeps turning for a beat after you stop.
- Canvas transform (separate scrub, `scrub: true`, origin `center bottom`): from `top top` to `bottom bottom`, `75% scale 1`, `100% scale .85, yPercent 3.5` (desktop). Mobile: `10% scale 1`, `15% yPercent -10 scale .95`, `70% scale .95`, `75% scale 1`, `100% yPercent 5`.
- What this looks like in the video (42.5-44 s): the jar tumbles so the label turns away from the camera, swings to the centre, and the title rises behind it. The end of the sequence shows three jars (45.5 s).

### The four statement cards (one scrubbed timeline)
`gsap.timeline({ scrollTrigger:{ trigger, start:"top 60%", end:"bottom bottom+=25%", scrub:true } })`
- Cards are absolutely placed, 5 grid columns wide, alternating right (More Taste, More weight loss) and left (More Caffeine, No added sugar).
- Start state: `yPercent 50, y 0.6*vh` (below the screen), `xPercent +4` for left cards / `-4` for right cards.
- Tween: `yPercent -50, y -0.6*vh, xPercent 0, duration 1, stagger .85`, ease = custom S-curve `M0,0 C0,0.201 0.098,0.459 0.5,0.5 0.904,0.541 1,0.805 1,1` (accelerates into the middle of the screen, slows through the centre, accelerates away). `rotate` random per card: left cards -5..-2deg, right cards +2..+5deg, so each card is slightly off-axis (the "pinned note" look).
- Smiley stickers on each card: `rotate` random `8..13deg` (left cards) or `-13..-8deg` (right), `stagger .85, duration 1`. The sticker is also `[data-smiley]`, which pops in elastically (`opacity 0, scale .5, rotate 80, origin left bottom` -> rest, 0.95 s `elastic-ease-out`) the first time it reaches 95 % of the viewport.
- "More for Coffee Lovers" signature: `opacity` keyframes `10% -> 1, 70% -> 1, 90% -> 0`, 1.5 s, at `step+=.75`.
- **White ribbons**: three SVG paths with `drawSVG: "100% 100%"`, then keyframes `0% 100%` (0.5, draw in) then `0% 0%` (0.5, wipe out the tail), `stagger 1.35`. Each curve is drawn and then erased like a brush stroke passing across the screen; in the video (33.5-37 s, 40-43 s) a white swoosh arrives and trails off as each card passes.
- The cards' inner scribbles (circle round "Finest matcha.", lightning bolt, arrow, circle round "95%") use the same boil.

### The finale (triggered, not scrubbed)
A paused timeline fires when scroll progress passes **0.85 going down** and rewinds when it falls back below **0.675 going up** (the gap prevents flicker):
1. **Title** "Matcha, just the way you like it." is pre-set `y = viewport height, scale .7` and scrubbed up to `y 0, scale .9`, 1.5 s, ease `expoScale(0.5,7,power2.out)`, placed behind the jar (`z-index -1`), so the jar passes in front of the words (video 44-45 s).
2. **"What's your flavour?"** (SplitText words): each word starts `opacity 0, scale 0` and displaced horizontally by `60 * (middleIndex - i) %` (so the words burst out from the centre), `Expo.easeOut`, stagger .039, then settle vertically (`yPercent 150 -> 0`, `elastic-ease-out-soft`).
3. **Cookies and strawberries** pop in and spin (`elastic-ease-out-soft`, .8-1.15 s):
   - cookie 1 `xPercent 75, yPercent 80, scale .5, rotate -140 -> -90`
   - strawberry 1 `xPercent -50, yPercent 90, rotate 40 -> -6`
   - cookie 2 (big, left) `rotate -75 -> 0`, with `blur(3px)` (depth of field)
   - strawberry 2 (big, right) `rotate -75 -> -23`, with `blur(4px)`
   - the "Vanilla Crumble" and "Strawberry Cheesecake" signatures and their arrows fade in first (0.2 s, linear).
   Their positions are pre-offset by `y = viewport height` and also slide in on the scrubbed timeline (1.25-1.5 s, `power1.inOut`), so they rise as the three jars appear.
4. The video's 47 s moment: the comparison section slides up over the pinned stage.

Mobile (< 992 px): the four cards become a normal stacked list (`.sequence-cards-mobile`), the canvas sits at the bottom at 80 % height, and the decorative finale is hidden.

---

## 8. Comparison table (`xo()`, `Po()`, `Eo()`)

- White rounded panel that overlaps the end of the pinned section (top smiley sticker half-overlapping its top edge, `translate: 0 -50%`).
- Rows (`[data-benefit-table-line]`) are hairlines that **draw from the left**: `scaleX 0 -> 1`, origin left, `.85 s`, `stagger .076`, when the table reaches `top 90%` (once).
- Each tick (`[data-benefit-table-check]`) **stamps** whenever it crosses the middle of the screen (`start: top 49%`, `end: bottom 51%`, `toggleActions: "restart none restart none"`, so it re-fires in both scroll directions):
  `0%: scaleX 1, yPercent 0, rotate 0 -> 20%: scaleX .65, yPercent 25, rotate 25 (power2.in) -> 100%: back to rest, elastic.out(1, .4)`, 0.85 s. The tick dips and tilts, then rebounds. In the video (52-55 s) the ticks ripple as the cursor and scroll pass.
- Left photograph (scoop of matcha) carries a white curved line drawn with DrawSVG (`drawSVG: "0% 0%" -> "100% 0%"`, .75 s linear, `top 70%`, once).
- The x marks are static.

---

## 9. "Clean. Green. Goodness." and the reviews slider (`Co()`, `Mo()`, class `ji`)

- Background photograph has a slow parallax: every `[data-testimonial-parallax-item]` moves `yPercent +5`, `scrub: true`, across the section's whole pass. A top image and a base image give a layered look.
- The big title and the "Premium Matcha Taste" signature (boil) sit over the photo.
- Reviews slider: a **custom** slider (not Swiper):
  - Infinite loop, **snap** to nearest card, `lerpFactor .3` (exponential smoothing `1 - e^(-dt/0.3)`), `snapStrength .1` (pulls toward the nearest integer every frame), `speedDecay .9`, `scrollSensitivity 1.5`, `touchMultiplier 8.5`, `dragSensitivity .005`.
  - Inputs: wheel/trackpad horizontal delta, mouse drag (cursor `grab` / `grabbing`), touch (horizontal only; vertical scroll is left alone), arrow buttons (`goToPrev` / `goToNext`), keyboard (Left / Right, **Space** = next, digits jump to an index) when the slider is on screen.
  - **Inner parallax shear**: each card's content translates `parallaxValue * |smoothedSpeed| * 20 %` on X. When you fling the slider the text inside lags and smears; at rest it returns to zero. In the video (59-63 s) this is visible as overlapping "Best matcha ever!" / "Super delicious!" text mid-flick.
  - The active card is white with dark-green text; the others are glass (1 px white border, translucent, white text). The colour change is a 0.2 s ease-out.
  - On first reaching `top 75%` of the viewport the slider auto-advances **once** (`goToNext()`), showing that it moves (the card slide at 58.5-60 s while the cursor is still elsewhere).
  - The slider only runs its rAF update while it is intersecting the viewport (IntersectionObserver with 50 px margin).
- Arrow buttons use the jelly hover (-4 / +4 deg, +/- 0.375em) and a pressed arrow nudge (`:active` arrow `translate +/-0.25em`).

---

## 10. Chunky Flavour (`_o()`): linked Swiper pair

- Title "Chunky Flavour" and subline "New Taste, Low Sugar". The subline is `[data-highlight-text]`: SplitText words enter `yPercent 25, xPercent 75, opacity 0, scale .6` (origin bottom right) -> rest, `elastic-ease-out-soft`, 1 s, stagger .039, then a colour sweep to `--light-green` (0.15 s each, stagger .039) starting 0.1 s later. Starts at `top 96%`, once. Mobile: colour sweep only.
- Left side (static, inertia-pushable): the matcha jar, two sachets and a big "+" in white.
- Right side is **two Swiper instances kept in sync**: the visual slider (jars and sachets) and the text slider (flavour name and button). `controller.control` links them both ways. Both use `effect: "creative"`, `loop: true`, `initialSlide: 4`:
  - visual: prev slide `translate -60%, 15%, scale .35, rotate -15deg, opacity 0`; next slide `translate 50%, 15%, scale .6, rotate 35deg, opacity 0`
  - text: prev/next `translate -/+40%, 15%, scale .5, opacity 0`
  - (mobile: -/+80% and -/+75%, and touch drag is enabled; desktop is arrows only)
- Active slide content animates in with CSS transitions:
  - the tub: `scale .75 -> 1`, `rotate -5.5deg`, `.95 s elastic` (leaving: `.6 s smooth`, opacity `.25 s`)
  - the sachets: `scale .75 -> 1`, `rotate 8deg` and `28deg`, `.95 s elastic`
  - slide text `opacity 0 -> 1` in `.25 s`; the Buy now button pops as in section 4
- When the section reaches `top 65%` (once): a white ring draws round the visual (`drawSVG "65% 65%" -> "165% 65%"`, 1.4 s `power2.out`) and, 0.1 s later, the slider auto-advances one slide (`slideNext()`), moving Vanilla Perfection -> Strawberry Perfection. That is the unprompted flavour change at the start of the section in the video.
- Click-through (1:08-1:21): Strawberry, Fudge Brownie, Vanilla Choc Chip, Salted Caramel, Vanilla Perfection, Strawberry... Each click the outgoing set shrinks to the left with a -15 deg roll while it fades, and the new set swells in from the right with a +35 deg roll that elastically settles. The mid-fade frames at 1:20 show the ghosting, with both slides partly transparent.

---

## 11. Payment pills and footer

- "Don't just crave It. Get It." (second line light green). Pills: Visa, Klarna, PayPal, Apple Pay, Google Pay, Mastercard, Amex, 100 px bubbles with brand marks.
- `[data-payment]` at `top 96%` (once): pills `opacity 0, y 100, x -40, rotate -35, scale .6` -> rest, `elastic-ease-out`, 0.8 s, **stagger -0.048**, so they pop from right to left (the same recipe as the hero facts, which makes the page feel coherent). Handwritten "3-5 Days Delivery" and "Free Shipping over £40.00" notes boil nearby; big white curves draw behind (video 84-86 s).
- Footer: two product cards ("Shop all products", "Samples & singles") that tilt and lift on hover (jelly, section 1), a large product tile ("Matcha meets protein" with a mini Buy now), "Shipping and Delivery" / "Returns and Exchanges" text links with the underline-drop hover, a giant clipped "More" wordmark across the bottom, and "Site Credits" which opens a small popover (`translate .5em 1.5em rotate 2deg opacity 0` -> rest with `scale .95` squash, visible on hover of either the toggle or the popover).

---

## 12. Things in the video that are not the website

- The recorder's tool strip, bottom-left (blue/red buttons and timer), is the screen-capture app.
- The dark-green boxes behind "MEETS PROTEIN" and the paragraph (14.5-17 s) are the user selecting text; the site styles `::selection` as dark green with pale text.
- The recording is 1280x720 with the captured browser window letterboxed to about 2.17:1 inside black bars, so the viewport in the video is very wide and short. Because the site scales by width only, proportions and timings are the same, but vertical room is tighter than on a normal laptop screen.
- 0-1 s and the 1.0 s reload: the video starts on an already-loaded page.

---

## 13. Smoothness: what makes it feel premium (and the cost controls)

1. **One easing language.** Four CSS tokens and two GSAP CustomEases cover the whole site. Nothing uses the browser's default `ease`.
2. **Overlap everywhere.** Timelines use `<`, `<+=x` and negative staggers so nothing waits; the intro is ~2 s of overlapping tweens.
3. **Two-layer smoothing on scroll.** Lenis (lerp .18) smooths input; `scrub: 0.7` on the image sequence adds another ease. DOM transforms use `scrub: true` because Lenis has already smoothed them.
4. **Squash and stretch on hover** (section 1) instead of colour changes.
5. **Randomised rotation** on cards, stickers and sachets, so no two things sit on the same axis.
6. **Elastic for objects, expo/soft-elastic for text.** Objects overshoot 14 %, words only 5 %.
7. **Hysteresis** (0.85 / 0.675) on the finale trigger; **once: true** for reveals so scrolling back never re-animates text, but ticks use `restart` so they feel alive.
8. **Performance**: images decoded up front (`createImageBitmap` for the hero sprite), DPR capped at 2, canvas redrawn only when the rounded frame changes, idle loops and videos paused when off-screen (ScrollTrigger), the review slider's rAF gated by IntersectionObserver, resize handlers debounced at 60 ms, `will-change: transform` only on split words and facts, `backface-visibility: hidden` on the ribbon. The loader waits for fonts, the sprite and the first frame, so there is no flash of unstyled content; the page is `cursor: wait; pointer-events: none` until ready.
9. **Resilience**: hover effects only under `(hover: hover) and (pointer: fine)`; the boil only under `prefers-reduced-motion: no-preference`; the page **reloads** if reduced-motion, the 992 px breakpoint or orientation change, to rebuild the correct timelines.

---

## 14. Layout facts measured at 1440x900 (headless Chromium)

| section | top (px) | height (px) |
|---|---|---|
| hero `.stage` | 0 | 1441 |
| insider (polaroids) | 1381 | 1217 |
| sequence `#nutrition` | 2598 | 6480 (= 7.2 x viewport) |
| benefit table `#benefits` | 9078 | 896 |
| reviews `#reviews` | 9934 | 1251 |
| flavour | 11185 | 1143 |
| payment | 12328 | 1147 |
| footer | 13315 | 977 |
| **document** | | **14291** |

Hero sprite canvas: 1466x1722 backing store (23 frames). Sequence canvas: 1440x900 (200 frames).

---

## 15. If this is rebuilt as a demo

- GSAP 3.15 and all its plugins (SplitText, DrawSVG, Inertia, CustomEase) are free to use now, so the same approach is available. Lenis and Swiper are MIT. The stack in this repo's other demos (Astro + GSAP + Lenis) fits.
- The **assets are the brand's** (photographed cans, the 200-frame jar render, hand-lettered SVGs, the Founders Grotesk font, their Dropbox-hosted videos). A demo should use its own generated imagery, its own jar render sequence and a licensed or open condensed grotesk (for example Anton, Oswald or Bebas Neue as stand-ins), keeping the mechanics, timings and eases above.
- Build order I would use: tokens and fluid em scaling, jelly hover component, hero intro timeline with idle loops, Lenis, ribbon, pinned canvas sequence with card timeline, table stamps, custom review slider, linked flavour sliders, payment pop, footer.
