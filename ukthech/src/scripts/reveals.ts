// Scrubbed reveals and drifts for the quieter parts of the page, so no section sits still.
// Animates wrappers (li, headline spans), never links or buttons, so CSS hover transforms keep working.
import { gsap, reduced, desktop } from './core';

export default function init() {
  if (reduced) return;
  const rise = (sel: string, y: number, start = 'top 97%', end = 'top 68%') => {
    gsap.utils.toArray<HTMLElement>(sel).forEach((el) => {
      gsap.fromTo(el, { y, opacity: 0 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start, end, scrub: 0.5 } });
    });
  };
  rise('.p-line span', 70);
  rise('.foot-list li', 36);
  rise('.foot-meta > *', 24, 'top 100%', 'top 80%');
  rise('.foot-person', 30);
  rise('.foot-mail', 30);
  rise('.foot-ph', 20);

  if (!desktop()) return;

  // Hero: as you scroll out, each piece drifts at its own speed (thumbnails, lead line, scene word, button)
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    const drift = (sel: string, y: number, extra: gsap.TweenVars = {}) => gsap.utils.toArray<HTMLElement>(sel, hero).forEach((el, i) => gsap.to(el, { y: y - i * 6, ease: 'none', ...extra, scrollTrigger: st }));
    drift('.hero-thumbs > *', 46, { opacity: 0.25 });
    drift('.hero-lead', -38);
    drift('.hero-words', -84);
    drift('.hero-cta', -26);
  }

  // Order scene: dust turning in the sunbeam, drifting with the scroll (light from the left, so it drifts right and up)
  const scene = document.querySelector<HTMLElement>('[data-order] .o-scene');
  if (scene) {
    const layer = document.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2';
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 20; i++) {
      const d = document.createElement('i');
      const s = 3 + rnd() * 5;
      d.style.cssText = `position:absolute;left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 100).toFixed(1)}%;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;border-radius:50%;background:rgba(140,108,76,0.7);filter:blur(${(0.5 + rnd() * 1.1).toFixed(1)}px);opacity:${(0.28 + rnd() * 0.4).toFixed(2)}`;
      layer.appendChild(d);
      gsap.to(d, { x: 40 + rnd() * 90, y: -(50 + rnd() * 120), ease: 'none', scrollTrigger: { trigger: '[data-order]', start: 'top bottom', end: 'bottom top', scrub: 0.8 + rnd() } });
    }
    scene.appendChild(layer);
  }
}
