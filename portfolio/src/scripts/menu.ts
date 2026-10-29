import { gsap } from 'gsap';
import { q, qa, reduced } from './util';

/* The menu: a tab hanging from the top edge, in the middle. Press it and a frosted-glass panel unrolls beneath it; the links stagger in. Escape, a click elsewhere,
   or choosing a link rolls it back up. Markup is a <details> (works without JavaScript); this only adds the unrolling. The tab gives one small tug a few seconds in,
   as if to say it can be pulled. */
export function initMenu() {
  const menu = q<HTMLDetailsElement>('[data-menu]');
  const panel = q('[data-menu-panel]');
  const tab = q('summary', menu ?? document);
  if (!menu || !panel || !tab) return;
  const links = qa('.menu__link', panel);
  const open = { on: false };
  let tween: gsap.core.Tween | null = null;

  const shut = 'inset(0 0 100% 0 round 0 0 1.1rem 1.1rem)';
  const wide = 'inset(0 0 0% 0 round 0 0 1.1rem 1.1rem)';
  const set = (on: boolean) => {
    if (on === open.on) return;
    open.on = on;
    menu.dataset.state = on ? 'open' : 'closed';
    tab.setAttribute('aria-expanded', String(on));
    tween?.kill();
    if (on) {
      menu.open = true;
      if (reduced) return;
      tween = gsap.fromTo(panel, { clipPath: shut }, { clipPath: wide, duration: 0.6, ease: 'power3.out' });
      gsap.fromTo(links, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', stagger: 0.06, delay: 0.1, overwrite: true });
    } else if (reduced) {
      menu.open = false;
    } else {
      tween = gsap.to(panel, { clipPath: shut, duration: 0.35, ease: 'power3.in', onComplete: () => { menu.open = false; } });
    }
  };
  set(false);
  menu.open = false;

  tab.addEventListener('click', (e) => { e.preventDefault(); set(!open.on); });
  links.forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('pointerdown', (e) => { if (open.on && !menu.contains(e.target as Node)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open.on) { set(false); (tab as HTMLElement).focus(); } });

  if (!reduced) {
    gsap.delayedCall(9, () => { if (!open.on) gsap.fromTo(tab, { y: 0 }, { y: 9, duration: 0.22, yoyo: true, repeat: 3, ease: 'power2.inOut', clearProps: 'transform' }); });
  }
}
