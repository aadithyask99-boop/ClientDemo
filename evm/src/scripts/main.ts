import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const doc = document.documentElement;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Header: colour follows the section underneath, and the phone menu.
const header = document.querySelector<HTMLElement>('.header')!;
const menu = document.querySelector<HTMLElement>('#menu')!;
const menuBtn = document.querySelector<HTMLButtonElement>('.header__menu')!;
const themeEls = [...document.querySelectorAll<HTMLElement>('[data-theme]')].filter((e) => e !== header);
const syncTheme = () => {
  const y = 40;
  const hit = themeEls.find((e) => { const r = e.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
  header.dataset.theme = hit?.dataset.theme ?? 'dark';
};
const setMenu = (open: boolean) => {
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Close' : 'Menu';
  header.style.color = open ? '#f5f5f2' : '';
  document.body.style.overflow = open ? 'hidden' : '';
};
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) setMenu(false); });

// Hero film: plays muted, fades out and restarts so the loop has no hard cut.
const film = document.querySelector<HTMLElement>('.hero__film')!;
const video = document.querySelector<HTMLVideoElement>('.hero__video')!;
if (!reduce) {
  const play = () => video.play().catch(() => {});
  play();
  video.addEventListener('timeupdate', () => { if (video.duration - video.currentTime < 0.7) film.dataset.fade = '1'; });
  video.addEventListener('ended', () => { video.currentTime = 0; delete film.dataset.fade; play(); });
}

if (!reduce) {
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', () => { ScrollTrigger.update(); syncTheme(); });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  doc.classList.add('lenis');

  // Anchor links scroll with Lenis.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')!;
      if (a.classList.contains('panel')) return;
      const el = id === '#top' ? document.body : document.querySelector<HTMLElement>(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(id === '#top' ? 0 : el, { duration: 1.4 });
    });
  });

  // Hero scene: film, then three panels rise, hover widens one, scrolling on expands the chosen car.
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const title = hero.querySelector<HTMLElement>('.hero__title')!;
  const row = hero.querySelector<HTMLElement>('.hero__panels')!;
  const panels = [...hero.querySelectorAll<HTMLElement>('.panel')];
  const dims = panels.map((p) => p.querySelector<HTMLElement>('.panel__dim')!);
  const caps = panels.map((p) => p.querySelector<HTMLElement>('.panel__cap')!);
  const canHover = matchMedia('(hover: hover)').matches;
  const grow = panels.map(() => 1);
  let hover = -1;
  let sel = 0;
  let active = true;

  panels.forEach((el, i) => {
    if (canHover) {
      el.addEventListener('pointerenter', () => { hover = i; sel = i; });
      el.addEventListener('pointerleave', () => { if (hover === i) hover = -1; });
    }
    el.addEventListener('click', (e) => {
      e.preventDefault();
      sel = i; hover = i;
      const range = hero.offsetHeight - innerHeight;
      lenis.scrollTo(hero.offsetTop + range * 1.0 + 2, { duration: 1.6 });
    });
  });

  new IntersectionObserver(([e]) => { active = e.isIntersecting; }, { rootMargin: '10% 0px' }).observe(hero);

  const render = () => {
    if (!active) return;
    const range = hero.offsetHeight - innerHeight;
    const p = clamp(-hero.getBoundingClientRect().top / range);
    const rise = clamp((p - 0.16) / 0.26);
    const open = ease(clamp((p - 0.72) / 0.24));
    row.style.transform = `translate3d(0, ${(1 - ease(rise)) * 100}%, 0)`;
    const tp = clamp(p / 0.22);
    title.style.opacity = String(1 - tp);
    title.style.transform = `translate3d(0, ${-tp * 60}px, 0)`;
    panels.forEach((el, i) => {
      const base = hover === i ? 2.4 : 1;
      const end = i === sel ? 30 : 0.0001;
      const target = base + (end - base) * open;
      grow[i] += (target - grow[i]) * 0.16;
      el.style.flexGrow = grow[i].toFixed(4);
      dims[i].style.opacity = hover >= 0 && hover !== i && open < 0.5 ? '0.5' : '0';
      caps[i].style.opacity = String(i === sel ? 1 : 1 - clamp(open * 3));
    });
    syncTheme();
  };
  gsap.ticker.add(render);

  // Statement: words go from grey to ink as you scroll.
  const words = gsap.utils.toArray<HTMLElement>('.statement .w');
  gsap.to(words, {
    color: '#0b0b0c', ease: 'none', stagger: 0.12,
    scrollTrigger: { trigger: '.statement__text', start: 'top 78%', end: 'bottom 45%', scrub: true },
  });
} else {
  syncTheme();
  addEventListener('scroll', syncTheme, { passive: true });
}
syncTheme();
