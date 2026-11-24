// Statement: every word rises a little and brightens from 16 percent to full ink across the sentence as the section passes.
// The four sector words (the ones with the blue underline) keep full strength and only rise, so the sectors show before the sentence is read.
import { gsap, reduced } from './core';

export default function init() {
  const root = document.querySelector<HTMLElement>('[data-statement]');
  if (!root || reduced) return;
  const words = [...root.querySelectorAll<HTMLElement>('[data-w]')];
  if (!words.length) return;
  const plain = words.filter((w) => !w.querySelector('.st-sec'));
  const sectors = words.filter((w) => w.querySelector('.st-sec'));
  gsap.set(plain, { opacity: 0.16, yPercent: 16 });
  gsap.set(sectors, { yPercent: 16 });
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: root, start: 'top 66%', end: 'top -24%', scrub: 0.6 },
  });
  tl.to(words, { yPercent: 0, duration: 1, stagger: { each: 0.06 } }, 0);
  tl.to(plain, { opacity: 1, duration: 1, stagger: { each: 0.06 } }, 0);
}
