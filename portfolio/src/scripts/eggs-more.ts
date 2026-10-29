import { gsap } from 'gsap';
import { PATTERNS, type PatternName } from './patterns';
import { lockScroll, reduced, q } from './util';

/* The rest of the easter eggs. Loaded only when one of them is found (scripts/eggs.ts listens for the triggers):
     type "404"          a fake error page, with a lost pixel icon wandering over it, then the page comes back
     type "hello"/"hire" the contact section opens
     scroll past the bottom   a pixel rocket carries you back to the top
     right-click the headline a one-item menu: "Say hello"
   (Holding Shift over the headline is handled in hero.ts, because it has to drive the headline's own word.) */

function pixelIcon(name: PatternName, size = 12) {
  const el = document.createElement('span');
  el.className = 'pixel';
  el.setAttribute('aria-hidden', 'true');
  el.style.setProperty('--px', `${size}px`);
  PATTERNS[name].forEach((row) => [...row].forEach((c) => { const i = document.createElement('i'); if (c === '#') i.dataset.on = ''; else i.style.opacity = '0'; el.append(i); }));
  return el;
}

/* ---------- type "404" ---------- */
let nfOpen = false;
export function notFound() {
  if (nfOpen) return;
  nfOpen = true;
  const prevFocus = document.activeElement as HTMLElement | null;
  const el = document.createElement('div');
  el.className = 'nf';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'A joke error page. Press Escape to close it.');
  el.tabIndex = -1;
  el.innerHTML = '<p class="nf__code">404</p><p class="nf__msg">This page could not be found.</p><p class="nf__sub">It may have been moved, renamed, or never existed.</p>';
  const lost = pixelIcon('search', 14);
  lost.classList.add('nf__lost');
  const q1 = document.createElement('span');
  q1.className = 'nf__q';
  q1.textContent = '?';
  el.append(lost, q1);
  document.body.append(el);
  lockScroll(true);
  el.focus();
  const dur = reduced ? 0 : 1;
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.15 * dur });
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;
  gsap.set([lost, q1], { x: W() * 0.2, y: H() * 0.7 });
  // the icon wanders, looking for the page
  const wander = gsap.timeline({ repeat: -1 });
  for (let k = 0; k < 5; k++) {
    wander.to(lost, { x: () => gsap.utils.random(40, W() - 120), y: () => gsap.utils.random(H() * 0.45, H() - 90), rotation: () => gsap.utils.random(-25, 25), duration: 0.9 * dur + 0.01, ease: 'power1.inOut' });
  }
  gsap.ticker.add(follow);
  function follow() { gsap.set(q1, { x: (gsap.getProperty(lost, 'x') as number) + 22, y: (gsap.getProperty(lost, 'y') as number) - 28 }); }
  const msg = el.querySelector<HTMLElement>('.nf__msg')!;
  const sub = el.querySelector<HTMLElement>('.nf__sub')!;
  const end = () => {
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    document.removeEventListener('keydown', onKey, true);
    wander.kill();
    gsap.ticker.remove(follow);
    gsap.to(el, { opacity: 0, duration: 0.35 * dur, onComplete: () => { el.remove(); lockScroll(false); nfOpen = false; prevFocus?.focus?.(); } });
  };
  const t1 = window.setTimeout(() => {
    msg.textContent = 'Just kidding. Nothing here is lost.';
    sub.textContent = 'Everything on this site is exactly where it should be.';
    q1.textContent = '!';
    wander.kill();
    gsap.to(lost, { x: W() / 2 - 50, y: H() / 2 + 60, rotation: 0, duration: 0.8 * dur, ease: 'power3.out' });
  }, 4200 * (reduced ? 0.4 : 1));
  const t2 = window.setTimeout(end, 6600 * (reduced ? 0.4 : 1));
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); end(); } else if (e.key === 'Tab') e.preventDefault(); };
  document.addEventListener('keydown', onKey, true);
  el.addEventListener('click', end);
}

/* ---------- type "hello" or "hire" ---------- */
export function hello() {
  const target = q('#connect');
  if (!target) return;
  window.dispatchEvent(new CustomEvent('aadi:scrollto', { detail: { y: target.getBoundingClientRect().top + window.scrollY, duration: 1.8 } }));
  const toast = document.createElement('p');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = 'Hello! Yes, you can just type that.';
  document.body.append(toast);
  gsap.fromTo(toast, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: reduced ? 0 : 0.35, ease: 'power3.out' });
  gsap.to(toast, { opacity: 0, y: -10, duration: reduced ? 0 : 0.35, delay: 2.6, onComplete: () => toast.remove() });
}

/* ---------- scroll past the bottom: a rocket ---------- */
const ROCKET = ['...#...', '..###..', '..#.#..', '..###..', '..###..', '.#####.', '.#.#.#.', '...#...'];
let rocket: HTMLElement | null = null;
let launching = false;
export function rocketPull(pull: number) {
  if (launching) return;
  if (!rocket) {
    rocket = document.createElement('div');
    rocket.className = 'rocket';
    rocket.setAttribute('aria-hidden', 'true');
    rocket.innerHTML = '<span class="rocket__hint">keep going</span>';
    const grid = document.createElement('span');
    grid.className = 'pixel rocket__px';
    ROCKET.forEach((row, y) => [...row].forEach((c) => { const i = document.createElement('i'); if (c === '#') { i.dataset.on = ''; if (y >= 6) i.className = 'is-flame'; } else i.style.opacity = '0'; grid.append(i); }));
    rocket.prepend(grid);
    document.body.append(rocket);
  }
  const t = Math.min(1, pull / 900);
  gsap.to(rocket, { y: -t * 46, opacity: Math.min(1, pull / 120), duration: 0.2, overwrite: true });
}
export function rocketRelease() {
  if (!rocket || launching) return;
  const r = rocket;
  rocket = null;
  gsap.to(r, { opacity: 0, y: 20, duration: 0.3, onComplete: () => r.remove() });
}
export function rocketLaunch() {
  if (!rocket || launching) return;
  launching = true;
  const r = rocket;
  const hint = r.querySelector<HTMLElement>('.rocket__hint');
  if (hint) hint.textContent = 'to the top';
  window.dispatchEvent(new CustomEvent('aadi:scrollto', { detail: { y: 0, duration: 2.6, lock: true } }));
  gsap.to(r, { y: -window.innerHeight - 160, duration: reduced ? 0.1 : 2.4, ease: 'power2.in', onComplete: () => { r.remove(); rocket = null; launching = false; } });
  r.classList.add('is-flying');
}

/* ---------- right-click the headline ---------- */
/* the headline's own menu: a single item */
const ITEMS: [string, () => void][] = [['Say hello', hello]];
let menu: HTMLElement | null = null;
export function headlineMenu(x: number, y: number) {
  closeMenu();
  const m = document.createElement('div');
  m.className = 'ctx';
  m.setAttribute('role', 'menu');
  ITEMS.forEach(([text, act]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'menuitem');
    b.className = 'ctx__item ctx__item--act';
    b.textContent = text;
    b.addEventListener('click', () => { closeMenu(); act(); });
    m.append(b);
  });
  document.body.append(m);
  const w = m.offsetWidth;
  const h = m.offsetHeight;
  m.style.left = `${Math.max(8, Math.min(x, window.innerWidth - w - 8))}px`;
  m.style.top = `${Math.max(8, Math.min(y, window.innerHeight - h - 8))}px`;
  gsap.from(m, { opacity: 0, scale: 0.96, transformOrigin: '0 0', duration: reduced ? 0 : 0.14 });
  menu = m;
  (m.querySelector('button') as HTMLElement | null)?.focus();
  const away = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !m.contains(e.target as Node)) closeMenu(); };
  const off = () => { document.removeEventListener('pointerdown', away, true); document.removeEventListener('keydown', away, true); window.removeEventListener('scroll', closeMenu); };
  document.addEventListener('pointerdown', away, true);
  document.addEventListener('keydown', away, true);
  window.addEventListener('scroll', closeMenu, { once: true });
  m.addEventListener('remove-menu', off);
}
export function closeMenu() {
  if (!menu) return;
  menu.dispatchEvent(new Event('remove-menu'));
  menu.remove();
  menu = null;
}
