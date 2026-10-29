import { gsap } from 'gsap';
import { q, qa, reduced } from './util';

/* The menu: a paper tab hanging from the top-right edge, labelled "Pull me". Pull it down (or just press it) and a cream panel unrolls from the top; the tab rides
   along to the panel's left edge, the links stagger in. Escape, a click elsewhere, or choosing a link rolls it back up. Markup is a <details> (works without
   JavaScript); this only adds the unrolling and the drag. The tab gives a small tug a few seconds in, as if to say it can be pulled. */
export function initMenu() {
  const menu = q<HTMLDetailsElement>('[data-menu]');
  const panel = q('[data-menu-panel]');
  const tab = q<HTMLElement>('summary', menu ?? document);
  if (!menu || !panel || !tab) return;
  const links = qa('.menu__link', panel);
  const open = { on: false };
  let tween: gsap.core.Tween | null = null;

  const shut = 'inset(0 0 100% 0 round 0 0 0 1.5rem)';
  const wide = 'inset(0 0 0% 0 round 0 0 0 1.5rem)';
  // the tab travels left until it sits against the panel's left edge
  const openX = () => -(panel.offsetWidth - parseFloat(getComputedStyle(tab).right));

  // left alone for 4 seconds it rolls itself back up (any movement, press or key on it starts the count again)
  let idle = 0;
  const arm = () => {
    window.clearTimeout(idle);
    if (!open.on) return;
    idle = window.setTimeout(() => set(false), 4000);
  };

  const set = (on: boolean) => {
    if (on === open.on) return;
    open.on = on;
    arm();
    menu.dataset.state = on ? 'open' : 'closed';
    tab.setAttribute('aria-expanded', String(on));
    tween?.kill();
    if (on) {
      menu.open = true;
      const x = openX();
      if (reduced) { gsap.set(tab, { x }); return; }
      gsap.to(tab, { x, duration: 0.6, ease: 'power3.out' });
      tween = gsap.fromTo(panel, { clipPath: shut }, { clipPath: wide, duration: 0.6, ease: 'power3.out' });
      gsap.fromTo(links, { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.06, delay: 0.12, overwrite: true });
    } else if (reduced) {
      gsap.set(tab, { x: 0 });
      menu.open = false;
    } else {
      gsap.to(tab, { x: 0, duration: 0.4, ease: 'power3.inOut' });
      tween = gsap.to(panel, { clipPath: shut, duration: 0.4, ease: 'power3.in', onComplete: () => { menu.open = false; } });
    }
  };
  set(false);
  menu.open = false;

  // pulling: drag the tab down (or, when open, up) and let go; a plain press toggles it too
  let startY = 0;
  let dragging = false;
  let moved = 0;
  tab.addEventListener('pointerdown', (e) => {
    startY = e.clientY;
    dragging = true;
    moved = 0;
    tab.setPointerCapture(e.pointerId);
    menu.classList.add('is-dragging');
  });
  tab.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    moved = e.clientY - startY;
    gsap.set(tab, { y: Math.max(-10, Math.min(26, moved * 0.5)) });
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    menu.classList.remove('is-dragging');
    gsap.to(tab, { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    if (!open.on && moved > 28) set(true);
    else if (open.on && moved < -28) set(false);
    else if (Math.abs(moved) <= 6) set(!open.on);
  };
  tab.addEventListener('pointerup', end);
  tab.addEventListener('pointercancel', end);
  tab.addEventListener('click', (e) => e.preventDefault()); // <details> would toggle by itself; the pointer code above decides
  tab.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!open.on); } });

  ['pointermove', 'pointerdown', 'focusin', 'keydown', 'touchstart'].forEach((ev) => menu.addEventListener(ev, arm, { passive: true }));
  links.forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('pointerdown', (e) => { if (open.on && !menu.contains(e.target as Node)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open.on) { set(false); tab.focus(); } });
  window.addEventListener('resize', () => {
    if (!open.on) return;
    gsap.set(tab, { x: openX() });
  }, { passive: true });

  if (!reduced) {
    gsap.delayedCall(9, () => { if (!open.on) gsap.fromTo(tab, { y: 0 }, { y: 12, duration: 0.22, yoyo: true, repeat: 3, ease: 'power2.inOut' }); });
  }
}
