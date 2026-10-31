import gsap from 'gsap';
import { arpeggio, swish, unlock } from './audio';

const q = <T extends Element>(s: string) => document.querySelector<T>(s)!;

/** Pre-pose the hero layers so that when the doors open the camera appears to push through them. */
export function prepareCover(reduce: boolean): void {
  if (reduce) return;
  gsap.set('.garland', { y: -70, scale: 1.32, transformOrigin: '50% 0%' });
  gsap.set('.window', { scale: 1.3, transformOrigin: '50% 72%' });
  gsap.set('.roses', { y: 90, scale: 1.4, transformOrigin: '50% 100%' });
  gsap.set('.f-curtain', { y: -70 });
  gsap.set('.f-vine', { y: -90, scale: 1.18, transformOrigin: '50% 0%' });
  gsap.set('.names, .getting', { autoAlpha: 0, y: 24 });
}

export function openCover(reduce: boolean, ready: Promise<void> = Promise.resolve()): Promise<void> {
  return new Promise((resolve) => {
    unlock();
    arpeggio(0);
    const cover = q<HTMLElement>('#cover');
    const seal = q<HTMLElement>('#seal');
    const hint = q<HTMLElement>('.cover-hint');
    seal.style.animation = 'none';
    seal.style.pointerEvents = 'none';
    const finish = () => {
      cover.style.display = 'none';
      resolve();
    };
    if (reduce) {
      gsap.to(cover, { autoAlpha: 0, duration: 0.5, onComplete: finish });
      gsap.set('.names, .getting', { autoAlpha: 1, y: 0 });
      return;
    }
    // 1. the thread unties: the seal is pressed, the bow loosens and its tails are drawn in, then the thread unwinds from
    //    the middle outwards and sags away. It always starts at once, even if the garden behind the doors is still arriving,
    //    so a tap never feels ignored.
    gsap.timeline()
      .to(hint, { autoAlpha: 0, duration: 0.3 }, 0)
      .to(seal, { scale: 0.92, duration: 0.18, ease: 'power2.out' }, 0)
      .add(() => swish(), 0.2)
      .to('.tail', { strokeDashoffset: 100, duration: 0.95, ease: 'power2.inOut', stagger: 0.1 }, 0.3)
      .to('.loop', { scale: 0.12, rotation: (i: number) => (i ? 28 : -28), autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }, 0.5)
      .to(seal, { rotation: -3, y: 10, duration: 1.0, ease: 'power2.inOut' }, 0.5)
      .to('.cord path', { strokeDashoffset: -100, duration: 1.4, ease: 'power1.inOut' }, 0.8)
      .to('.cord', { y: 30, duration: 1.4, ease: 'power1.in' }, 0.8)
      .to(seal, { autoAlpha: 0, scale: 0.95, duration: 0.9, ease: 'power2.inOut' }, 1.15)
      .to('.knot-svg', { autoAlpha: 0, duration: 0.5 }, 1.4);

    // 2. the doors swing and the garden pushes forward, but only once its art is decoded (never before the thread has come loose)
    let waiting = true;
    const note = window.setTimeout(() => { if (waiting) { hint.textContent = 'one moment'; gsap.to(hint, { autoAlpha: 0.9, duration: 0.8 }); } }, 1700);
    Promise.all([ready, new Promise((r) => window.setTimeout(r, 1500))]).then(() => {
      waiting = false;
      clearTimeout(note);
      gsap.to(hint, { autoAlpha: 0, duration: 0.3 });
      gsap.timeline({ onComplete: finish })
        .to('.door-l', { rotationY: -112, duration: 2.7, ease: 'power2.inOut' }, 0)
        .to('.door-r', { rotationY: 112, duration: 2.7, ease: 'power2.inOut' }, 0.05)
        .to('.window', { scale: 1, duration: 2.8, ease: 'expo.out' }, 0.25)
        .to('.garland', { y: 0, scale: 1, duration: 2.7, ease: 'expo.out' }, 0.35)
        .to('.roses', { y: 0, scale: 1, duration: 2.7, ease: 'expo.out' }, 0.45)
        .to('.f-curtain', { y: 0, duration: 2.6, ease: 'expo.out' }, 0.3)
        .to('.f-vine', { y: 0, scale: 1, duration: 2.8, ease: 'expo.out' }, 0.4)
        .to(cover, { autoAlpha: 0, duration: 0.6, ease: 'power1.inOut' }, 2.25)
        .to('.names', { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 2.05)
        .to('.getting', { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' }, 2.35);
    });
  });
}

/** Depth: the stage tilts toward the pointer (or the phone's tilt) and each layer slides by its own amount. */
export function initTilt(): void {
  const stage = q<HTMLElement>('#stage');
  const layers = [...document.querySelectorAll<HTMLElement>('.hero .layer')].map((el) => ({
    inner: el.firstElementChild as HTMLElement,
    depth: Number(el.dataset.depth || 0),
  }));
  const rx = gsap.quickTo(stage, 'rotationX', { duration: 0.9, ease: 'power3.out' });
  const ry = gsap.quickTo(stage, 'rotationY', { duration: 0.9, ease: 'power3.out' });
  const moves = layers.map((l) => ({
    x: gsap.quickTo(l.inner, 'x', { duration: 0.9, ease: 'power3.out' }),
    y: gsap.quickTo(l.inner, 'y', { duration: 0.9, ease: 'power3.out' }),
    d: l.depth,
  }));
  const apply = (nx: number, ny: number) => {
    rx(-ny * 3);
    ry(nx * 4);
    moves.forEach((m) => { m.x(-nx * m.d); m.y(-ny * m.d * 0.6); });
  };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    apply((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2);
  }, { passive: true });
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    apply(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, (e.beta - 50) / 25)));
  }, { passive: true });
}
