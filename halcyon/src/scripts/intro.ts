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

  gsap.set(lines, { y: 30 });
  gsap.set(lede, { x: -90 });
  gsap.set(actions, { x: -150 });
  gsap.set(cards, { y: 90 });
  gsap.set(proof, { x: 140 });
  gsap.set(nav, { y: -10 });

  const ui = (at: number, speed = 1) => {
    const tl = gsap.timeline({ delay: at });
    tl.to(nav, { autoAlpha: 1, y: 0, duration: 0.8 * speed, stagger: 0.05, ease: 'power3.out' }, 0)
      .to(actions, { autoAlpha: 1, x: 0, duration: 1.4 * speed, ease: 'power2.out' }, 2.45 * speed)
      .to(lede, { autoAlpha: 1, x: 0, duration: 1.4 * speed, ease: 'power2.out' }, 2.55 * speed)
      .to(lines, { autoAlpha: 1, y: 0, duration: 1.3 * speed, stagger: 0.12, ease: 'power2.out' }, 2.6 * speed)
      .to(cards, { autoAlpha: 1, y: 0, duration: 1.3 * speed, stagger: 0.12, ease: 'power2.out' }, 2.75 * speed)
      .to(proof, { autoAlpha: 1, x: 0, duration: 1.3 * speed, ease: 'power2.out' }, 2.8 * speed);
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
