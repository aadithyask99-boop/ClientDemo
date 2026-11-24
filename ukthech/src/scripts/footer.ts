// Footer: a soft light follows the cursor over the wordmark and the ground (a gentle ambient drift on touch),
// and the phone number types on when the footer enters.
import { gsap, ScrollTrigger, reduced, finePointer } from './core';

export default function init() {
  const root = document.querySelector<HTMLElement>('[data-footer]');
  if (!root) return;
  const mark = root.querySelector<HTMLElement>('[data-foot-mark]')!;
  const type = root.querySelector<HTMLElement>('[data-ph-type]');
  const radius = () => Math.round(Math.max(260, Math.min(520, mark.clientWidth * 0.26)));

  // Placeholder links stay on the page
  root.querySelectorAll<HTMLAnchorElement>('a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  // Light position (px, relative to the footer); lerped each frame while the footer is on screen
  const tgt = { x: root.clientWidth * 0.5, y: root.clientHeight * 0.7 };
  const cur = { ...tgt };
  let visible = false;
  let touchTime = 0;
  const paint = () => {
    const fr = root.getBoundingClientRect(), mr = mark.getBoundingClientRect();
    root.style.setProperty('--mx', `${cur.x.toFixed(1)}px`);
    root.style.setProperty('--my', `${cur.y.toFixed(1)}px`);
    root.style.setProperty('--lx', `${(cur.x - (mr.left - fr.left)).toFixed(1)}px`);
    root.style.setProperty('--ly', `${(cur.y - (mr.top - fr.top)).toFixed(1)}px`);
  };
  root.style.setProperty('--lr', `${radius()}px`);
  window.addEventListener('resize', () => root.style.setProperty('--lr', `${radius()}px`));

  if (reduced) {
    // A still, calm light across the middle of the wordmark
    cur.x = root.clientWidth * 0.5; cur.y = mark.offsetTop + mark.clientHeight * 0.5;
    root.classList.add('is-lit'); paint();
  } else {
    if (finePointer) {
      root.addEventListener('pointermove', (e) => {
        const r = root.getBoundingClientRect();
        tgt.x = e.clientX - r.left; tgt.y = e.clientY - r.top;
        root.classList.add('is-lit');
      });
    }
    const tick = (_t: number, dt: number) => {
      if (!visible) return;
      if (!finePointer) {
        // Ambient drift for touch: the light wanders slowly along the wordmark
        touchTime += dt / 1000;
        tgt.x = root.clientWidth * (0.5 + 0.38 * Math.sin(touchTime * 0.42));
        tgt.y = mark.offsetTop + mark.clientHeight * (0.5 + 0.18 * Math.sin(touchTime * 0.61 + 1));
        root.classList.add('is-lit');
      }
      cur.x += (tgt.x - cur.x) * 0.1; cur.y += (tgt.y - cur.y) * 0.1;
      paint();
    };
    gsap.ticker.add(tick);
    ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onToggle: (s) => { visible = s.isActive; } });
  }

  // The phone number types on when the footer enters
  if (type && !reduced) {
    const full = type.textContent || '';
    type.textContent = '';
    const n = { v: 0 };
    ScrollTrigger.create({
      trigger: root, start: 'top 72%', once: true,
      onEnter: () => gsap.to(n, { v: full.length, duration: 1.1, ease: 'none', delay: 0.15, onUpdate: () => { type.textContent = full.slice(0, Math.round(n.v)); } }),
    });
  }
}
