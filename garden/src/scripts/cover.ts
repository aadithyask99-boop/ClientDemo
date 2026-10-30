import gsap from 'gsap';
import { arpeggio, crack, unlock } from './audio';

const q = <T extends Element>(s: string) => document.querySelector<T>(s)!;

/** Pre-pose the hero layers so that when the doors open the camera appears to push through them. */
export function prepareCover(reduce: boolean): void {
  if (reduce) return;
  gsap.set('.garland', { y: -70, scale: 1.32, transformOrigin: '50% 0%' });
  gsap.set('.window', { scale: 1.3, transformOrigin: '50% 72%' });
  gsap.set('.roses', { y: 90, scale: 1.4, transformOrigin: '50% 100%' });
  gsap.set('.names, .getting', { autoAlpha: 0, y: 24 });
}

/** Little chips of wax that fly off when the seal cracks and fall under gravity. */
function crumbs(seal: HTMLElement): void {
  const r = seal.getBoundingClientRect();
  const host = document.getElementById('cover')!;
  for (let i = 0; i < 11; i++) {
    const c = document.createElement('i');
    c.className = 'wax-crumb';
    const sz = 4 + Math.random() * 7;
    c.style.cssText = `width:${sz}px;height:${sz * 0.8}px;left:${r.left + r.width * (0.38 + Math.random() * 0.24)}px;top:${r.top + r.height * (0.2 + Math.random() * 0.6)}px`;
    host.appendChild(c);
    gsap.to(c, { x: (Math.random() - 0.5) * 120, y: 280 + Math.random() * 200, rotation: (Math.random() - 0.5) * 400, duration: 0.9 + Math.random() * 0.6, ease: 'power2.in', onComplete: () => c.remove() });
    gsap.to(c, { autoAlpha: 0, duration: 0.3, delay: 0.7 + Math.random() * 0.4 });
  }
}

export function openCover(reduce: boolean): Promise<void> {
  return new Promise((resolve) => {
    unlock();
    arpeggio(0);
    const cover = q<HTMLElement>('#cover');
    const seal = q<HTMLElement>('#seal');
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
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(seal, { scale: 0.9, duration: 0.16, ease: 'power2.out' }) // pressed in
      .to('.crack path', { strokeDashoffset: 0, duration: 0.22, ease: 'none' }) // the crack runs through the wax
      .add(() => { crack(); crumbs(seal); })
      .to('.hl', { x: -30, y: 160, rotation: -17, duration: 1.0, ease: 'power2.in' }, '>')
      .to('.hr', { x: 38, y: 210, rotation: 24, duration: 1.05, ease: 'power2.in' }, '<')
      .to(seal, { autoAlpha: 0, duration: 0.3 }, '>-0.3')
      .to('.cover-hint', { autoAlpha: 0, duration: 0.3 }, 0)
      .to('.door-l', { rotationY: -112, duration: 2.7, ease: 'power2.inOut' }, 0.85)
      .to('.door-r', { rotationY: 112, duration: 2.7, ease: 'power2.inOut' }, 0.9)
      .to('.window', { scale: 1, duration: 2.8, ease: 'expo.out' }, 1.1)
      .to('.garland', { y: 0, scale: 1, duration: 2.7, ease: 'expo.out' }, 1.2)
      .to('.roses', { y: 0, scale: 1, duration: 2.7, ease: 'expo.out' }, 1.3)
      .to(cover, { autoAlpha: 0, duration: 0.6, ease: 'power1.inOut' }, 3.1)
      .to('.names', { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 2.9)
      .to('.getting', { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' }, 3.2);
  });
}

/** Depth: the stage tilts toward the pointer (or the phone's tilt) and each layer slides by its own amount. */
export function initTilt(): void {
  const stage = q<HTMLElement>('#stage');
  const layers = [...stage.querySelectorAll<HTMLElement>('.layer')].map((el) => ({
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
