// Depth. Pictures inside their arched windows drift against the scroll, the dividers slide slower than the page, the
// finale landscape separates into layers, and the pointer (or the phone's tilt) nudges the pictures a little. Every
// scroll link is scrubbed with a lag (1.4 to 1.8 s) so it all moves slowly and calmly rather than tracking the finger.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { tilt } from './sensors';

export function initParallax(reduce: boolean): void {
  // Phones skip the scroll-driven picture drift entirely: it re-draws big images every frame, which a phone cannot afford, and
  // a calmer page is the goal anyway. Mouse devices keep it.
  if (reduce || !matchMedia('(pointer: fine)').matches) return;
  const scrub = (trigger: Element, extra: Partial<ScrollTrigger.Vars> = {}): ScrollTrigger.Vars => ({
    trigger, start: 'top bottom', end: 'bottom top', scrub: 1.6, ...extra,
  });

  // pictures in windows: the image is a little larger than its frame and slides the other way
  const windows = [...document.querySelectorAll<HTMLElement>('.vignette img, .vista img')];
  windows.forEach((img) => {
    gsap.set(img, { scale: 1.22 });
    gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: scrub(img.parentElement!) });
  });

  // dividers
  document.querySelectorAll<HTMLElement>('.divider').forEach((d) => {
    const img = d.querySelector('img');
    if (!img) return;
    const flip = d.classList.contains('flip');
    gsap.set(img, { scaleX: 1.14, scaleY: flip ? -1.14 : 1.14 });
    gsap.fromTo(img, { yPercent: -9 }, { yPercent: 9, ease: 'none', scrollTrigger: scrub(d) });
  });

  // the finale landscape: far hills move least, the chapel, oak and bench more
  const scene = document.getElementById('scene');
  if (scene) {
    const st = (): ScrollTrigger.Vars => scrub(scene, { start: 'top bottom', end: 'bottom bottom' });
    const hills = scene.querySelector('.hills');
    if (hills) { gsap.set(hills, { scale: 1.08, transformOrigin: '50% 100%' }); gsap.fromTo(hills, { yPercent: -4 }, { yPercent: 3, ease: 'none', scrollTrigger: st() }); }
    scene.querySelectorAll<HTMLElement>('.church img, .tree img, .bench img').forEach((img, i) => {
      gsap.fromTo(img, { y: 34 + i * 8 }, { y: -22 - i * 6, ease: 'none', scrollTrigger: st() });
    });
  }

  // the pointer, or the phone's tilt, gives the windows a slight drift (smoothed, so it is never jumpy)
  const fine = matchMedia('(pointer: fine)').matches;
  let mx = 0, my = 0;
  addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; mx = (e.clientX / innerWidth - 0.5) * 2; my = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  const movers = windows.map((el) => ({ x: gsap.quickTo(el, 'x', { duration: 1.6, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 1.6, ease: 'power3.out' }) }));
  let lx = 9, ly = 9;
  gsap.ticker.add(() => {
    const tx = fine ? mx : tilt.x, ty = fine ? my : tilt.y * 2;
    if (Math.abs(tx - lx) < 0.01 && Math.abs(ty - ly) < 0.01) return;
    lx = tx; ly = ty;
    movers.forEach((m) => { m.x(-tx * 12); m.y(-ty * 9); });
  });

  // lazy images change the page height as they arrive, so re-measure once things settle
  let t = 0;
  new ResizeObserver(() => { clearTimeout(t); t = window.setTimeout(() => ScrollTrigger.refresh(), 250); }).observe(document.body);
}
