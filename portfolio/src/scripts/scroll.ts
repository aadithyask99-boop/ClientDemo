import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { qa, fine, reduced } from './util';

const root = document.documentElement;
const ease = (t: number) => 1 - Math.pow(1 - t, 4);

/* Smooth scrolling on devices with a mouse or trackpad (touch screens keep their native momentum), kept in step with GSAP's clock so
   scroll-driven parts stay in sync. Also: anchor links glide, the header changes colour with the section under it, and the nav follows along. */
export function initScroll() {
  gsap.registerPlugin(ScrollTrigger);

  let lenis: Lenis | null = null;
  if (fine && !reduced) {
    lenis = new Lenis({ lerp: 0.07, wheelMultiplier: 0.9 }); // a longer, softer glide than the default (0.1)
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const id = a?.getAttribute('href');
    if (!a || !id || id === '#') return;
    const el = id === '#top' ? null : document.querySelector<HTMLElement>(id);
    if (id !== '#top' && !el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el ?? 0, { duration: 1.7, easing: ease });
    else if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  // other scripts can ask for a smooth scroll to a position (keyboard focus on a project, a button that goes to a section)
  window.addEventListener('aadi:scrollto', (e) => {
    const d = (e as CustomEvent<number | { y: number; duration?: number; lock?: boolean }>).detail;
    const y = typeof d === 'number' ? d : d.y;
    const duration = typeof d === 'number' ? 1.2 : d.duration ?? 1.2;
    // lock: the ride is not interrupted if the wheel is still turning (the rocket)
    if (lenis) lenis.scrollTo(y, { duration, easing: ease, lock: typeof d !== 'number' && !!d.lock });
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  });

  // overlays (the "seo" easter egg) pause the page scroll while they are open
  window.addEventListener('aadi:lock', (e) => {
    const on = (e as CustomEvent<boolean>).detail;
    if (lenis) (on ? lenis.stop() : lenis.start());
    else root.style.overflow = on ? 'hidden' : '';
  });

  // header colour and the active nav link follow the section under the header
  const links = qa<HTMLAnchorElement>('[data-nav]');
  qa('[data-world-section]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 70px', // a little tolerance: a section scrolled to by a link can stop a few pixels short of the line
      end: 'bottom 70px',
      onToggle: (self) => {
        if (!self.isActive) return;
        root.dataset.world = sec.dataset.worldSection === 'dark' ? 'dark' : 'light';
        links.forEach((l) => {
          const on = sec.id !== '' && l.getAttribute('href') === `#${sec.id}`;
          l.classList.toggle('is-active', on);
          if (on) l.setAttribute('aria-current', 'location');
          else l.removeAttribute('aria-current');
        });
      },
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
