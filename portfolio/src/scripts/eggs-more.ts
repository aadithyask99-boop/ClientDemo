import { gsap } from 'gsap';
import { reduced, q, fine } from './util';

/* The rest of the easter eggs. Loaded only when one of them is found (scripts/eggs.ts listens for the triggers):
     type "hello"/"hire" the contact section opens
     scroll past the bottom   a pixel rocket carries you back to the top
     right-click the headline a one-item menu: "Say hello"
   (Holding Shift over the headline is handled in hero.ts, because it has to drive the headline's own word.) */

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
export function rocketPull(pull: number, launchAt = 560) {
  if (launching) return;
  if (!rocket) {
    rocket = document.createElement('div');
    rocket.className = 'rocket';
    rocket.setAttribute('aria-hidden', 'true');
    rocket.innerHTML = '<span class="rocket__hint"></span>';
    const grid = document.createElement('span');
    grid.className = 'pixel rocket__px';
    ROCKET.forEach((row, y) => [...row].forEach((c) => { const i = document.createElement('i'); if (c === '#') { i.dataset.on = ''; if (y >= 6) i.className = 'is-flame'; } else i.style.opacity = '0'; grid.append(i); }));
    rocket.prepend(grid);
    document.body.append(rocket);
  }
  const t = Math.min(1, pull / launchAt);
  const hint = rocket.querySelector<HTMLElement>('.rocket__hint');
  if (hint) hint.textContent = pull > 0 ? 'keep going' : fine ? 'scroll again for a lift' : 'swipe up for a lift';
  if (!rocket.classList.contains('is-ready')) { rocket.classList.add('is-ready'); gsap.fromTo(rocket, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }); }
  else gsap.to(rocket, { y: -t * 46, opacity: 1, duration: 0.2, overwrite: true });
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
