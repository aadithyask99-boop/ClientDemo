import gsap from 'gsap';

const q = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const qa = <T extends Element>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/** Resolves true once the clip can play through, false if it cannot be played at all. */
function clipReady(video: HTMLVideoElement): Promise<boolean> {
  return new Promise((resolve) => {
    const done = (ok: boolean) => { clearTimeout(timer); resolve(ok); };
    const timer = setTimeout(() => done(false), 5000);
    if (video.readyState >= 3) return done(true);
    video.addEventListener('canplay', () => done(true), { once: true });
    video.addEventListener('error', () => done(false), { once: true });
    // With no playable source, the last <source> reports the failure
    video.querySelector('source:last-of-type')?.addEventListener('error', () => done(false), { once: true });
    video.load();
  });
}

/**
 * The intro is a single pre-rendered clip (5 s): the kingfisher flies in over empty sky, swoops toward the
 * camera and settles into the portrait, which is the clip's last frame and stays on screen. The interface
 * is timed to it: the copy slides in from the left while the bird is still in flight, the cards rise, and
 * the proof chip comes in from the right.
 */
export async function playIntro(): Promise<void> {
  const root = document.documentElement;
  const hero = q<HTMLElement>('[data-hero]');
  const video = q<HTMLVideoElement>('[data-video]');
  const nav = qa('[data-nav] [data-reveal]');
  const lines = qa('.hero__line');
  const lede = qa('.hero__lede');
  const actions = qa('.hero__actions');
  const proof = qa('.proof');
  const cards = qa('.card');

  // The nav's logo is on screen from the first frame. Everything else waits for its moment.
  const navItems = nav.filter((el) => !el.classList.contains('nav__brand'));
  const inner = (els: Element[]) => els.flatMap((el) => [...el.children]);
  const cardInner = inner(cards);
  const proofInner = inner(proof);
  const BLUR = 'blur(12px)';
  const SOFT = 'blur(7px)';

  gsap.set(navItems, { y: 0 });
  gsap.set(lines, { y: 16, filter: BLUR });
  gsap.set(lede, { x: -24, filter: SOFT });
  gsap.set(actions, { x: -36, filter: SOFT });
  gsap.set(cards, { y: 34 });
  gsap.set(cardInner, { autoAlpha: 0 });
  gsap.set(proof, { x: 44 });
  gsap.set(proofInner, { autoAlpha: 0 });

  // Times are seconds into the clip. The bird starts its approach to the camera at about 3.3 s, so the
  // interface eases in slowly as it lands: the copy fades up out of a soft blur, and card text lags its card.
  const ui = (at: number, speed = 1) => {
    const T = 3.3 * speed;
    const d = (n: number) => n * speed;
    const sharp = { filter: 'blur(0px)', clearProps: 'filter' };
    const tl = gsap.timeline({ delay: at });
    tl.to(navItems, { autoAlpha: 1, duration: d(1.1), stagger: 0.05, ease: 'power1.out' }, d(0.45))
      .to(lines, { autoAlpha: 1, y: 0, ...sharp, duration: d(1.6), stagger: 0.16, ease: 'power2.out' }, T)
      .to(lede, { autoAlpha: 1, x: 0, ...sharp, duration: d(1.5), ease: 'power2.out' }, T + d(0.3))
      .to(actions, { autoAlpha: 1, x: 0, ...sharp, duration: d(1.5), ease: 'power2.out' }, T + d(0.4))
      .to(cards, { autoAlpha: 1, y: 0, duration: d(1.5), stagger: 0.14, ease: 'power2.out' }, T + d(0.45))
      .to(cardInner, { autoAlpha: 1, duration: d(1.3), stagger: 0.04, ease: 'power1.out' }, T + d(0.85))
      .to(proof, { autoAlpha: 1, x: 0, duration: d(1.4), ease: 'power2.out' }, T + d(0.9))
      .to(proofInner, { autoAlpha: 1, duration: d(1.2), stagger: 0.05, ease: 'power1.out' }, T + d(1.25));
    return tl;
  };

  const ok = (await clipReady(video)) && (await video.play().then(() => true, () => false));
  if (!ok) {
    // No clip: show the still portrait and bring the interface in quickly
    root.classList.add('no-video');
    ui(0.1, 0.35);
    return new Promise((r) => setTimeout(r, 1800));
  }

  ui(0.05);
  // Resolves when the clip has finished, so heavy work (the 3D objects) waits until nothing is animating
  const finished = new Promise<void>((r) => video.addEventListener('ended', () => setTimeout(r, 300), { once: true }));

  // After the clip the scene stays put. It follows the pointer a little.
  if (!window.matchMedia('(hover: hover)').matches) return finished;
  gsap.set(video, { scale: 1.03, transformOrigin: '50% 100%' });
  const mx = gsap.quickTo(video, 'x', { duration: 1.4, ease: 'power3.out' });
  const my = gsap.quickTo(video, 'y', { duration: 1.4, ease: 'power3.out' });
  hero.addEventListener('pointermove', (e) => {
    mx((e.clientX / window.innerWidth - 0.5) * -14);
    my((e.clientY / window.innerHeight - 0.5) * -8);
  });
  return finished;
}
