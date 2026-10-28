import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, qa, fine, reduced } from './util';

/* Selected work, after the reference. The frames scroll past in a column and only the project that has crossed the middle of the screen shows its
   name, arrow and "View". When the next one crosses, the first flies out and the next flies in. Measured from the reference's code:
     titles fly in sideways from 80px out (compact 40px) while growing from nothing, 350ms, 17ms between words; they leave the same way, shrinking
     the arrow comes from 100px on the left, "View" from 80px on the right
     name and arrow/View drift against the frames: translateY -50% to +40% of their own height, linear, in step with the scroll
     the arrow nudges 40px right and back, looping, while the pointer is on the project (on touch: while it is in the middle of the screen)
   Only the active project is clickable. Tabbing to a project scrolls it to the middle. Under 700px wide, with reduced motion, or without JS,
   every project simply shows its name. */
export interface HeroHandle {
  show(): void;
  hide(): void;
}

const EASE = 'power3.out';
const STEP = 0.017;
const compact = () => window.matchMedia('(max-width: 999px)').matches;

function splitWords(el: HTMLElement) {
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const parts = text.split(/\s+/).filter(Boolean);
  return parts.map((w, i) => {
    const s = document.createElement('span');
    s.className = 'wd2';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = w + (i < parts.length - 1 ? ' ' : '');
    el.appendChild(s);
    return s;
  });
}

/* Words fly in from the side, growing from nothing (and leave the same way, shrinking). The word is visible the moment it starts. */
function flyIn(els: HTMLElement[], x: number, origin: string) {
  els.forEach((w, k) => {
    gsap.set(w, { transformOrigin: origin, opacity: 1, delay: k * STEP });
    gsap.fromTo(w, { x }, { x: 0, duration: 0.35, ease: EASE, delay: k * STEP, overwrite: 'auto' });
    gsap.fromTo(w, { scale: 0 }, { scale: 1, duration: 0.1, ease: 'power2.out', delay: k * STEP, overwrite: 'auto' });
  });
}
function flyOut(els: HTMLElement[], x: number, origin: string) {
  els.forEach((w, k) => {
    gsap.set(w, { transformOrigin: origin });
    gsap.to(w, { x, duration: 0.35, ease: EASE, delay: k * STEP, overwrite: 'auto' });
    gsap.to(w, { scale: 0, duration: 0.1, ease: 'power2.in', delay: k * STEP, overwrite: 'auto' });
    gsap.set(w, { opacity: 0, delay: 0.35 + k * STEP });
  });
}

export function initWork(hero: HeroHandle) {
  const list = q('[data-work-list]');
  const items = qa('[data-wi]');
  if (!list || !items.length) return;
  const section = q('.work')!;
  gsap.registerPlugin(ScrollTrigger);
  const live = !reduced && window.matchMedia('(min-width: 700px)').matches;
  const dx = () => (compact() ? { title: -40, view: 40, icon: -48 } : { title: -80, view: 80, icon: -100 });

  /* ---------- video loading and playing (no effects on the picture: it is simply the site) ---------- */
  items.forEach((item) => {
    const video = q<HTMLVideoElement>('video', item)!;
    const poster = q<HTMLImageElement>('.wi__poster', item)!;
    // initWork runs after the headline has painted (main.ts), so none of this competes with it
    new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      if (!poster.getAttribute('src') && poster.dataset.src) poster.src = poster.dataset.src;
      if (!video.getAttribute('src') && video.dataset.video && !reduced) { video.src = video.dataset.video; video.load(); }
    }), { rootMargin: '900px 0px' }).observe(item);
    video.addEventListener('playing', () => video.classList.add('is-playing'));
    new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { if (!reduced) void video.play().catch(() => undefined); } else video.pause();
    }), { threshold: 0.15 }).observe(item);
  });

  /* ---------- the arrow nudge, per project ---------- */
  const nudges = items.map((item) => {
    const arrow = q('[data-wi-arrow]', item)!;
    let tl: gsap.core.Timeline | null = null;
    return {
      start(delay = 0.1) {
        tl?.kill();
        tl = gsap.timeline({ repeat: -1, delay }).to(arrow, { x: compact() ? 20 : 40, duration: 0.36, ease: 'power3.in' }).to(arrow, { x: 0, duration: 0.34, ease: EASE });
      },
      stop() {
        tl?.kill();
        tl = null;
        gsap.to(arrow, { x: 0, duration: 0.32, ease: EASE, overwrite: true });
      },
    };
  });

  if (!live) {
    // small screens and reduced motion: everything shows; on touch the arrow nudges while its project is in the middle of the screen
    if (!reduced) {
      items.forEach((item, i) => new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? nudges[i].start(0.2) : nudges[i].stop())), { rootMargin: '-35% 0px -35% 0px' }).observe(item));
    }
    return;
  }

  section.classList.add('is-live');

  /* ---------- the active project's name, arrow and View ---------- */
  const ctl = items.map((item) => {
    const title = q('[data-wi-title]', item)!;
    const tw = splitWords(title);
    const icon = q('[data-wi-icon]', item)!;
    const vw = splitWords(q('[data-wi-view]', item)!);
    const small = qa('[data-wi-small]', item);
    const link = q('.wi__link', item)!;
    let shown = false;
    const hideNow = () => {
      gsap.set(tw, { opacity: 0, x: dx().title, scale: 0, transformOrigin: 'left top' });
      gsap.set(icon, { opacity: 0, x: dx().icon, scale: 0, transformOrigin: 'left center' });
      gsap.set(vw, { opacity: 0, x: dx().view, scale: 0, transformOrigin: 'right top' });
      gsap.set(small, { opacity: 0, y: 10 });
    };
    hideNow();
    return {
      link,
      show() {
        if (shown) return;
        shown = true;
        link.classList.add('is-active');
        flyIn(tw, dx().title, 'left top');
        flyIn([icon], dx().icon, 'left center');
        flyIn(vw, dx().view, 'right top');
        gsap.to(small, { opacity: 1, y: 0, duration: 0.4, ease: EASE, stagger: 0.06, delay: 0.1, overwrite: 'auto' });
      },
      hide() {
        if (!shown) return;
        shown = false;
        link.classList.remove('is-active');
        flyOut(tw, dx().title, 'left bottom');
        flyOut([icon], dx().icon, 'left center');
        flyOut(vw, dx().view, 'right bottom');
        gsap.to(small, { opacity: 0, y: -8, duration: 0.25, ease: 'power2.in', overwrite: 'auto' });
      },
    };
  });

  /* name and arrow/View drift against the frames (linear, in step with the scroll) */
  items.forEach((item) => {
    const drift = [q('[data-wi-heading]', item)!, q('[data-wi-cta]', item)!];
    gsap.fromTo(drift, { yPercent: -50 }, { yPercent: 40, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* which project is active: the last one whose top has passed the middle of the screen (-1 before the first) */
  let active = -2;
  const update = () => {
    const mid = window.innerHeight / 2;
    let idx = -1;
    items.forEach((it, i) => { if (it.getBoundingClientRect().top <= mid) idx = i; });
    if (idx === active) return;
    const prev = active;
    active = idx;
    ctl.forEach((c, i) => (i === idx ? c.show() : c.hide()));
    nudges.forEach((n, i) => { if (i !== idx) n.stop(); });
    if (idx >= 0 && prev < 0 && prev !== -2) hero.hide();
    if (idx < 0 && prev >= 0) hero.show();
    if (idx >= 0 && prev === -2) hero.hide();
  };
  ScrollTrigger.create({ trigger: list, start: 'top bottom', end: 'bottom top', onUpdate: update, onToggle: update, onRefresh: update });
  update();

  /* arrow nudge while the pointer is on the active project, and the keyboard rule: tabbing to a project brings it to the middle */
  items.forEach((item, i) => {
    const link = ctl[i].link;
    link.addEventListener('pointerenter', () => { if (active === i) nudges[i].start(0.1); });
    link.addEventListener('pointerleave', () => nudges[i].stop());
    link.addEventListener('focusin', (e) => {
      if (!(e.target as Element).matches(':focus-visible')) return;
      const r = item.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('aadi:scrollto', { detail: r.top + window.scrollY - (window.innerHeight - r.height) / 2 }));
    });
    if (!fine) {
      // touch at 700px and wider: the arrow nudges for as long as the project is active
      new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && active === i) nudges[i].start(0.2); else if (!e.isIntersecting) nudges[i].stop(); }), { rootMargin: '-35% 0px -35% 0px' }).observe(item);
    }
  });
}
