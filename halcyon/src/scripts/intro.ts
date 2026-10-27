import gsap from 'gsap';

const q = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const qa = <T extends Element>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/** Resolve once the poses are decoded, or after a short wait so a slow network never blocks the page. */
async function ready(imgs: HTMLImageElement[]) {
  const decoded = Promise.all(imgs.map((i) => i.decode().catch(() => {})));
  await Promise.race([decoded, new Promise((r) => setTimeout(r, 3500))]);
}

type Pose = 'hover_up' | 'hover_out' | 'fly' | 'fly_l' | 'bank' | 'swoop';

/**
 * One keyframe of the flight. x and y are fractions of the hero (the bird's centre), h is the bird's
 * height as a fraction of the screen height, blur is in px. Times are seconds from the start.
 * The path was read off the reference frame by frame: it drops in at the top left and hovers,
 * crosses to the right and hovers, passes back close to the camera heading left, shrinks to a
 * small hover, drifts right and banks, then swings left and flies at the camera with its wings wide.
 */
const PATH: { t: number; pose: Pose; x: number; y: number; h: number; blur: number }[] = [
  { t: 0.0, pose: 'hover_up', x: 0.35, y: -0.05, h: 0.08, blur: 14 },
  { t: 0.17, pose: 'hover_up', x: 0.35, y: 0.06, h: 0.1, blur: 12 },
  { t: 0.33, pose: 'hover_up', x: 0.16, y: 0.22, h: 0.4, blur: 3 },
  { t: 0.5, pose: 'hover_out', x: 0.14, y: 0.2, h: 0.46, blur: 2 },
  { t: 0.67, pose: 'hover_up', x: 0.1, y: 0.22, h: 0.46, blur: 3 },
  { t: 0.83, pose: 'hover_out', x: 0.09, y: 0.2, h: 0.38, blur: 6 },
  { t: 1.0, pose: 'fly', x: 0.47, y: 0.46, h: 0.54, blur: 9 },
  { t: 1.17, pose: 'hover_up', x: 0.84, y: 0.39, h: 0.44, blur: 4 },
  { t: 1.33, pose: 'hover_out', x: 0.86, y: 0.44, h: 0.49, blur: 2 },
  { t: 1.5, pose: 'hover_up', x: 0.82, y: 0.44, h: 0.53, blur: 3 },
  { t: 1.67, pose: 'fly_l', x: 0.71, y: 0.42, h: 0.8, blur: 12 },
  { t: 1.83, pose: 'fly_l', x: 0.29, y: 0.4, h: 0.42, blur: 10 },
  { t: 2.0, pose: 'fly_l', x: 0.21, y: 0.47, h: 0.28, blur: 8 },
  { t: 2.17, pose: 'fly', x: 0.47, y: 0.45, h: 0.3, blur: 7 },
  { t: 2.33, pose: 'hover_up', x: 0.75, y: 0.51, h: 0.24, blur: 3 },
  { t: 2.47, pose: 'hover_up', x: 0.79, y: 0.53, h: 0.33, blur: 2 },
  { t: 2.63, pose: 'hover_out', x: 0.81, y: 0.53, h: 0.33, blur: 1 },
  { t: 2.8, pose: 'hover_up', x: 0.81, y: 0.53, h: 0.38, blur: 2 },
  { t: 2.97, pose: 'bank', x: 0.75, y: 0.41, h: 0.42, blur: 4 },
  { t: 3.13, pose: 'fly_l', x: 0.34, y: 0.35, h: 0.36, blur: 10 },
  { t: 3.3, pose: 'fly', x: 0.21, y: 0.37, h: 0.55, blur: 6 },
  { t: 3.47, pose: 'swoop', x: 0.5, y: 0.5, h: 0.95, blur: 2 },
  { t: 3.63, pose: 'swoop', x: 0.47, y: 0.5, h: 1.1, blur: 0 },
  { t: 3.8, pose: 'swoop', x: 0.45, y: 0.5, h: 1.18, blur: 0 },
];
const LAND = 4.2; // the portrait is fully resolved by here

// Hover poses are two images that swap quickly to read as wingbeats
const group = (p: Pose) => (p === 'hover_up' || p === 'hover_out' ? 'hover' : p);

export async function playIntro() {
  const root = document.documentElement;
  const hero = q<HTMLElement>('[data-hero]');
  const flyer = q<HTMLElement>('[data-flyer]');
  const portrait = q<HTMLElement>('[data-portrait]');
  const portraitImg = q<HTMLElement>('[data-portrait-img]');
  const drift = q<HTMLElement>('[data-portrait-drift]');
  const glow = q<HTMLElement>('[data-glow]');
  const poses = Object.fromEntries(qa<HTMLImageElement>('[data-pose]').map((el) => [el.dataset.pose!, el])) as Record<Pose, HTMLImageElement>;
  const nav = qa('[data-nav] [data-reveal]');
  const lines = qa('.hero__line');
  const lede = qa('.hero__lede');
  const actions = qa('.hero__actions');
  const proof = qa('.proof');
  const cards = qa('.card');

  await ready([...Object.values(poses), q<HTMLImageElement>('[data-portrait-img]')]);

  // Layout is read once, after the images are in. The portrait's CSS position is where the bird ends up.
  const hr = hero.getBoundingClientRect();
  const pr = portrait.getBoundingClientRect();
  const W = hr.width;
  const H = Math.min(hr.height, window.innerHeight); // keyframes are relative to what is on screen
  const cx = pr.left - hr.left + pr.width * 0.5;
  const cy = pr.top - hr.top + pr.height * 0.45;
  // Each pose's drawn height at flyer scale 1, so a keyframe's h can be turned into a scale
  const drawn = Object.fromEntries((Object.keys(poses) as Pose[]).map((k) => [k, poses[k].getBoundingClientRect().height])) as Record<Pose, number>;
  const drawnW = Object.fromEntries((Object.keys(poses) as Pose[]).map((k) => [k, poses[k].getBoundingClientRect().width])) as Record<Pose, number>;
  // Height sets the size on wide screens. On narrow ones the bird's width is capped so it stays on screen.
  const fit = (pose: Pose, px: number) => Math.min(px / drawn[pose], ((pose === 'swoop' ? 1.15 : 0.8) * W) / drawnW[pose]);
  const at = (k: (typeof PATH)[number]) => ({ x: k.x * W, y: k.y * H, scale: fit(k.pose, k.h * H) });

  // Motion blur is an SVG blur stretched along the direction of travel. It is applied in the flyer's own
  // units, so the strength is divided by the flyer's scale to stay the same size on screen.
  const motion = q<SVGFEGaussianBlurElement>('[data-motion]');
  const mb = { sx: 0, sy: 0 };
  const paint = () => motion.setAttribute('stdDeviation', `${mb.sx.toFixed(2)} ${mb.sy.toFixed(2)}`);
  const blurFor = (k: (typeof PATH)[number], dx: number, dy: number) => {
    const len = Math.hypot(dx, dy) || 1;
    const s = fit(k.pose, k.h * H);
    return { sx: (k.blur * (0.45 + 2.4 * Math.abs(dx / len))) / s, sy: (k.blur * (0.45 + 2.4 * Math.abs(dy / len))) / s };
  };

  gsap.set(flyer, { autoAlpha: 1, xPercent: -50, transformOrigin: '50% 0%', ...at(PATH[0]) });
  Object.assign(mb, blurFor(PATH[0], 0, 1));
  paint();
  gsap.set(Object.values(poses), { autoAlpha: 0 });
  gsap.set(lines, { y: 30 });
  gsap.set(lede, { x: -90 });
  gsap.set(actions, { x: -150 });
  gsap.set(cards, { y: 90 });
  gsap.set(proof, { x: 140 });
  gsap.set(nav, { y: -10 });

  const tl = gsap.timeline({ onComplete: settle });

  // Flight: one tween per segment between keyframes. Crossing the page is quick, hovering is slow.
  for (let i = 1; i < PATH.length; i++) {
    const a = PATH[i - 1];
    const b = PATH[i];
    const crossing = Math.abs(b.x - a.x) > 0.3;
    const ease = crossing ? 'power2.inOut' : 'sine.inOut';
    tl.to(flyer, { ...at(b), duration: b.t - a.t, ease }, a.t);
    tl.to(mb, { ...blurFor(b, (b.x - a.x) * W, (b.y - a.y) * H), duration: b.t - a.t, ease, onUpdate: paint }, a.t);
  }
  // Land: aim the wide-winged approach so its head ends exactly on the portrait's head, which is already in
  // its final place. Head positions are measured on the images: the swoop's head sits at (0.55, 0.35) of
  // its picture and the portrait's at (0.44, 0.26) of its picture.
  const last = PATH[PATH.length - 1];
  const landScale = fit('swoop', 1.0 * H);
  const hs = landScale * drawn.swoop; // the swoop's drawn height when it lands
  const headX = pr.left - hr.left + 0.44 * pr.width;
  const headY = pr.top - hr.top + 0.26 * pr.height;
  const swoopW = landScale * drawnW.swoop;
  tl.to(flyer, { x: headX - 0.05 * swoopW, y: headY + 0.15 * hs, scale: landScale, duration: LAND - last.t, ease: 'power2.out' }, last.t);
  tl.to(mb, { sx: 1.5, sy: 1.5, duration: LAND - last.t, ease: 'power2.out', onUpdate: paint }, last.t);

  // Poses: show each one over the span its keyframes cover, with a short crossfade at the edges
  const spans: { g: string; from: number; to: number }[] = [];
  for (const k of PATH) {
    const g = group(k.pose);
    const s = spans[spans.length - 1];
    if (s && s.g === g) s.to = k.t;
    else spans.push({ g, from: k.t, to: k.t });
  }
  spans.forEach((s, i) => {
    const el = s.g === 'hover' ? poses.hover_up : poses[s.g as Pose];
    const from = i === 0 ? 0 : s.from - 0.06;
    const to = i === spans.length - 1 ? 4.25 : s.to + 0.06;
    tl.set(el, { autoAlpha: 1 }, from).set(el, { autoAlpha: 0 }, to);
    if (s.g === 'hover') {
      // Wingbeat: the second hover image blinks over the first
      const beats = Math.max(1, Math.floor((to - from) / 0.085));
      tl.fromTo(poses.hover_out, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001, ease: 'none', repeat: beats, repeatDelay: 0.085, yoyo: true }, from)
        .set(poses.hover_out, { autoAlpha: 0 }, to);
    }
  });
  // The swoop dissolves into the portrait
  tl.to(poses.swoop, { autoAlpha: 0, duration: 0.3, ease: 'none' }, 3.9)
    .fromTo(portrait, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'none' }, 3.9)
    .fromTo(portraitImg, { scale: 1.03, filter: 'blur(3px)', transformOrigin: '50% 100%' }, { scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }, 3.9)
    .to(flyer, { autoAlpha: 0, duration: 0.1, ease: 'none' }, 4.2);

  // Interface: nav early, then the copy slides in from the left, the cards rise and the chip comes from the right
  tl.to(nav, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.05, ease: 'power3.out' }, 0.3)
    .to(actions, { autoAlpha: 1, x: 0, duration: 1.4, ease: 'power2.out' }, 2.45)
    .to(lede, { autoAlpha: 1, x: 0, duration: 1.4, ease: 'power2.out' }, 2.55)
    .to(lines, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.12, ease: 'power2.out' }, 2.6)
    .to(cards, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.12, ease: 'power2.out' }, 2.75)
    .to(proof, { autoAlpha: 1, x: 0, duration: 1.3, ease: 'power2.out' }, 2.8);

  function settle() {
    gsap.set(flyer, { display: 'none' });
    root.classList.add('is-settled');
    idle();
  }

  // After landing the bird stays put. It breathes a little and follows the pointer.
  function idle() {
    gsap.to(drift, { scale: 1.015, duration: 4.5, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 100%' });
    if (!window.matchMedia('(hover: hover)').matches) return;
    const mx = gsap.quickTo(portrait, 'x', { duration: 1.4, ease: 'power3.out' });
    const my = gsap.quickTo(portrait, 'y', { duration: 1.4, ease: 'power3.out' });
    const gx = gsap.quickTo(glow, 'x', { duration: 2, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      mx(nx * -14);
      my(ny * -8);
      gx(nx * 28);
    });
  }
}
