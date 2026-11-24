// Statement: every word starts at 18 percent ink and is scrubbed to full ink across the sentence as the section passes.
// The blue underlines on the sector words stay at full strength, so the four sectors show before the sentence is read.
import { gsap, reduced } from './core';

export default function init() {
  const root = document.querySelector<HTMLElement>('[data-statement]');
  if (!root || reduced) return;
  const words = root.querySelectorAll<HTMLElement>('[data-w]');
  if (!words.length) return;
  const dim = 'rgba(22,24,27,0.18)';
  gsap.set(words, { color: dim });
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: root, start: 'top 62%', end: 'top -22%', scrub: 0.6 },
  }).to(words, { color: '#16181b', duration: 1, stagger: { each: 0.07 } });
}
