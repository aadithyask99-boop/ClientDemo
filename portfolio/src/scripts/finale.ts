import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, qa, reduced } from './util';
import { initPixel } from './pixel';
import { pixelWords } from './pixelreveal';

/* The last stretch of the page: pixel-built headings, the rotating words under "Start your next website today", the swapping arrow, the stack of
   project tiles in the footer and the little pixel icon next to "Crafted by". All of it is set up after the first screen has painted. */
export function initFinale() {
  const js = document.documentElement.classList.contains('js');

  /* ----- headings built from pixels ----- */
  ['.about__title', '.next__title', '.connect__title'].forEach((s) => {
    const el = q(s);
    if (el) pixelWords(el, { start: 'top 85%', stagger: s === '.next__title' ? 0.12 : 0.07 });
  });

  /* ----- two slots that roll through words, each at its own pace ----- */
  qa('[data-slot]').forEach((slot, k) => {
    const words = qa('.slot__w', slot);
    let i = 0;
    if (reduced || words.length < 2) return;
    gsap.set(words.slice(1), { yPercent: 110 });
    window.setInterval(() => {
      if (document.hidden) return;
      const out = words[i];
      i = (i + 1) % words.length;
      const next = words[i];
      gsap.fromTo(next, { yPercent: 110, opacity: 1 }, { yPercent: 0, duration: 0.55, ease: 'power3.out', overwrite: true });
      gsap.to(out, { yPercent: -110, duration: 0.55, ease: 'power3.out', overwrite: true, onComplete: () => { gsap.set(out, { opacity: 0 }); } });
      words.forEach((w) => w.classList.toggle('is-on', w === next));
      next.removeAttribute('aria-hidden');
      out.setAttribute('aria-hidden', 'true');
    }, 2100 + k * 700);
  });

  /* ----- the call to action: the arrow and the last word swap places ----- */
  const cta = q('.next__cta');
  const word = q('.next__word');
  if (cta && word) {
    const measure = () => cta.style.setProperty('--w', `${word.offsetWidth}px`);
    measure();
    window.addEventListener('resize', measure, { passive: true });
    document.fonts?.ready.then(measure);
  }

  /* ----- the stack of project tiles ----- */
  const stack = q('[data-thumbs]');
  const tiles = stack ? qa('.thumb', stack) : [];
  if (stack && tiles.length && js) {
    const n = tiles.length;
    const pose = (k: number) => ({ x: k * 22 - 40, y: k * -7, rotation: -4 + k * 2.4, scale: 1 - k * 0.045, zIndex: n - k });
    let order = tiles.slice();
    const place = (dur: number, ease = 'power3.inOut') => order.forEach((t, k) => gsap.to(t, { ...pose(k), duration: dur, ease, overwrite: true }));
    if (reduced) order.forEach((t, k) => gsap.set(t, pose(k)));
    else {
      gsap.set(tiles, { x: 0, y: 60, rotation: 0, scale: 0.5, opacity: 0 });
      ScrollTrigger.create({
        trigger: stack,
        start: 'top 92%',
        once: true,
        onEnter: () => {
          order.forEach((t, k) => gsap.to(t, { ...pose(k), opacity: 1, duration: 0.9, ease: 'back.out(1.3)', delay: k * 0.08, overwrite: true }));
          window.setInterval(() => {
            if (document.hidden) return;
            const front = order.shift()!;
            order.push(front);
            // the front tile leaves sideways, drops behind the others and the rest step forward
            gsap.to(front, { x: pose(n - 1).x + 120, y: -26, rotation: 9, duration: 0.45, ease: 'power2.in', onComplete: () => place(0.6) });
            order.slice(0, -1).forEach((t, k) => gsap.to(t, { ...pose(k), duration: 0.6, ease: 'power3.inOut', overwrite: true }));
            gsap.set(front, { zIndex: 0, delay: 0.45 });
          }, 2300);
        },
      });
    }
  }

  /* ----- the pixel icon beside "Crafted by" changes shape every few seconds ----- */
  const mini = q('.pixel--mini');
  if (mini) {
    const p = initPixel(mini);
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? p.start(2600) : p.stop()))).observe(mini);
  }
}
