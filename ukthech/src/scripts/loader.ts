// Loader: letters of the wordmark rise, hold, then the screen fades. One second, skippable by click or any key.
import { gsap, reduced } from './core';

export default function init() {
  const el = document.querySelector<HTMLElement>('[data-loader]');
  if (!el) return;
  const html = document.documentElement;
  const finish = () => {
    el.dataset.state = 'done';
    html.classList.add('no-loader');
    el.remove();
    window.dispatchEvent(new CustomEvent('loader:done'));
  };
  if (reduced || html.classList.contains('no-loader')) { el.dataset.state = 'off'; finish(); return; }

  el.dataset.state = 'active';
  el.classList.add('is-run');
  const chars = el.querySelectorAll('.loader-ch');
  let leaving = false;
  const leave = (d = 0.45) => {
    if (leaving) return; leaving = true;
    tl.kill();
    gsap.to(el, { opacity: 0, duration: d, ease: 'power2.out', onComplete: finish });
  };
  const tl = gsap.timeline({ onComplete: () => leave() });
  tl.fromTo(chars, { yPercent: 115 }, { yPercent: 0, duration: 0.55, ease: 'expo.out', stagger: 0.035 })
    .to({}, { duration: 0.35 });
  const skip = () => leave(0.25);
  el.addEventListener('pointerdown', skip, { once: true });
  window.addEventListener('keydown', skip, { once: true });
}
