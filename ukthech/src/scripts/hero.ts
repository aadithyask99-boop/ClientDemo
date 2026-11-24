// Hero: four places that crossfade on a 5.3 s timer (the thumbnail's progress bar is the timer), the scene word swaps,
// the image answers the cursor and a soft warm light follows it. Reduced motion: no auto-advance, thumbnails still work.
import { site } from '../data/site';
import { gsap, ScrollTrigger, reduced, finePointer } from './core';

export default function init() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const film = hero.querySelector<HTMLElement>('.hero-film')!;
  const scenes = [...hero.querySelectorAll<HTMLElement>('[data-scene]')];
  const words = [...hero.querySelectorAll<HTMLElement>('.hero-word')];
  const thumbs = [...hero.querySelectorAll<HTMLButtonElement>('[data-thumb]')];
  const layer = hero.querySelector<HTMLElement>('[data-layer]')!;
  const glow = hero.querySelector<HTMLElement>('[data-glow]')!;
  const copy = hero.querySelector<HTMLElement>('.hero-copy')!;
  const ins = [...hero.querySelectorAll<HTMLElement>('.hero-in')];
  hero.style.setProperty('--iv', `${site.hero.interval}ms`);
  let cur = 0;

  function show(i: number) {
    i = (i + scenes.length) % scenes.length;
    scenes.forEach((s, k) => s.classList.toggle('is-active', k === i));
    words.forEach((w, k) => { w.classList.toggle('is-active', k === i); w.setAttribute('aria-hidden', String(k !== i)); });
    thumbs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-pressed', String(on));
      if (on) { t.classList.remove('is-active'); void t.offsetWidth; t.classList.add('is-active'); } // restarts the bar
      else t.classList.remove('is-active');
    });
    cur = i;
  }

  thumbs.forEach((t, i) => t.addEventListener('click', () => show(i)));

  if (reduced) {
    hero.classList.add('is-static');
  } else {
    // The bar's animation is the timer: when it ends, move on
    hero.addEventListener('animationend', (e) => { if ((e as AnimationEvent).animationName === 'hero-fill') show(cur + 1); });
    document.addEventListener('visibilitychange', () => hero.classList.toggle('is-paused', document.hidden));
  }

  // Intro after the loader
  const intro = () => {
    if (reduced) { hero.classList.add('is-ready'); return; }
    gsap.set(ins, { opacity: 0, y: 32 });
    hero.classList.add('is-ready');
    gsap.to(ins, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.12, clearProps: 'transform' });
  };
  const ld = document.querySelector<HTMLElement>('[data-loader]');
  if (ld && ld.dataset.state === 'active') {
    let done = false;
    const go = () => { if (done) return; done = true; intro(); };
    window.addEventListener('loader:done', go, { once: true });
    setTimeout(go, 3000);
  } else intro();

  // The scene answers the cursor: the picture drifts against it, a warm light follows it
  if (finePointer && !reduced) {
    const qx = gsap.quickTo(layer, 'x', { duration: 1, ease: 'power3.out' });
    const qy = gsap.quickTo(layer, 'y', { duration: 1, ease: 'power3.out' });
    const gx = gsap.quickTo(glow, 'x', { duration: 0.55, ease: 'power3.out' });
    const gy = gsap.quickTo(glow, 'y', { duration: 0.55, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = film.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      qx(-nx * 12); qy(-ny * 8);
      gx(e.clientX - r.left); gy(e.clientY - r.top);
      glow.classList.add('is-on');
    });
    hero.addEventListener('pointerleave', () => { qx(0); qy(0); glow.classList.remove('is-on'); });
  }

  // Scrolling away: the film settles back from the frame and the words lift
  if (!reduced) {
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(film, { scale: 0.955, borderRadius: 44, transformOrigin: '50% 0%', ease: 'none', scrollTrigger: st });
    gsap.to(copy, { y: -70, opacity: 0.2, ease: 'none', scrollTrigger: st });
    ScrollTrigger.refresh();
  }
}
