import gsap from 'gsap';

const q = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const qa = <T extends Element>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/** Resolve once the poses are decoded, or after a short wait so a slow network never blocks the page. */
async function ready(imgs: HTMLImageElement[]) {
  const decoded = Promise.all(imgs.map((i) => i.decode().catch(() => {})));
  await Promise.race([decoded, new Promise((r) => setTimeout(r, 3500))]);
}

export async function playIntro() {
  const root = document.documentElement;
  const hero = q<HTMLElement>('[data-hero]');
  const flyer = q<HTMLElement>('[data-flyer]');
  const flutter = q<HTMLElement>('[data-flutter]');
  const portrait = q<HTMLElement>('[data-portrait]');
  const portraitImg = q<HTMLElement>('[data-portrait-img]');
  const drift = q<HTMLElement>('[data-portrait-drift]');
  const glow = q<HTMLElement>('[data-glow]');
  const pose = (n: string) => q<HTMLElement>(`[data-pose="${n}"]`);
  const nav = qa('[data-nav] [data-reveal]');
  const lines = qa('.hero__line');
  const rest = qa('.hero__lede, .hero__actions');
  const proof = qa('.proof');
  const cards = qa('.card');

  await ready([...qa<HTMLImageElement>('[data-pose]'), q<HTMLImageElement>('[data-portrait-img]')]);

  // Layout is read once, after the images are in. The portrait's CSS position is where the bird ends up.
  const hr = hero.getBoundingClientRect();
  const pr = portrait.getBoundingClientRect();
  const W = hr.width;
  const H = hr.height;
  const cx = pr.left - hr.left + pr.width * 0.5;
  const cy = pr.top - hr.top + pr.height * 0.42;
  const narrow = W < 1000;

  gsap.set(flyer, { xPercent: -50, yPercent: -50, x: -0.28 * W, y: (narrow ? 0.2 : 0.26) * H, scale: 0.8, rotation: -3, autoAlpha: 1, filter: 'blur(16px)' });
  gsap.set(pose('fly'), { autoAlpha: 1 });
  gsap.set(lines, { y: 34 });
  gsap.set([...rest, ...proof, ...cards], { y: 26 });
  gsap.set(nav, { y: -10 });

  const swap = (tl: gsap.core.Timeline, from: string, to: string, at: number) => {
    tl.to(pose(from), { autoAlpha: 0, duration: 0.18, ease: 'none' }, at).to(pose(to), { autoAlpha: 1, duration: 0.18, ease: 'none' }, at);
  };

  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: settle });

  // Wing beat: a quick vertical flutter on top of the path, only while the bird is in flight
  tl.to(flutter, { y: -7, duration: 0.07, yoyo: true, repeat: 27, ease: 'sine.inOut' }, 0.1);

  // 1. In from the left, fast and blurred
  tl.to(flyer, { x: 0.6 * W, y: (narrow ? 0.18 : 0.2) * H, scale: 1, rotation: 5, filter: 'blur(7px)', duration: 1.1, ease: 'power2.out' }, 0);

  // 2. Swoops to the right and banks
  swap(tl, 'fly', 'bank', 1.05);
  tl.to(flyer, { x: 0.86 * W, y: (narrow ? 0.3 : 0.34) * H, rotation: 9, filter: 'blur(9px)', duration: 0.85 }, 1.1);

  // 3. Turns back and dives toward the middle
  swap(tl, 'bank', 'dive', 1.95);
  tl.to(flyer, { x: cx, y: cy + 0.2 * H, rotation: 0, scale: 1.04, duration: 0.8 }, 1.95)
    .to(flyer, { filter: 'blur(15px)', duration: 0.35, ease: 'power1.in' }, 1.95)
    .to(flyer, { filter: 'blur(6px)', duration: 0.45, ease: 'power1.out' }, 2.3);

  // 4. Lands: the diving pose blurs out while the portrait resolves in the centre
  tl.to(flyer, { x: cx, y: cy, scale: 1.25, filter: 'blur(20px)', duration: 0.6, ease: 'power2.out' }, 2.75)
    .to(flyer, { autoAlpha: 0, duration: 0.3, ease: 'none' }, 2.95)
    .fromTo(portrait, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'none' }, 2.9)
    .fromTo(portraitImg, { scale: 0.84, filter: 'blur(14px)', transformOrigin: '50% 100%' }, { scale: 1, filter: 'blur(0px)', duration: 0.95, ease: 'power3.out' }, 2.9);

  // Interface settles in around the bird
  tl.to(nav, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.05, ease: 'power3.out' }, 0.5)
    .to(lines, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 3.05)
    .to(rest, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, 3.3)
    .to(cards, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 3.2)
    .to(proof, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 3.7);

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
