import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** The date is written in ink that blooms outward as it scrolls into view. */
export function initInk(reduce: boolean): void {
  const drops = gsap.utils.toArray<SVGCircleElement>('.drop');
  const radii = [330, 340, 350, 320, 340];
  if (reduce) { drops.forEach((d, i) => d.setAttribute('r', String(radii[i] + 60))); return; }
  gsap.set(drops, { attr: { r: 0 } });
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '#ink', start: 'top 82%', end: 'bottom 38%', scrub: 0.7 },
  });
  drops.forEach((d, i) => tl.to(d, { attr: { r: radii[i] + 40 }, ease: 'power1.out', duration: 1 }, i * 0.18));
  void ScrollTrigger;
}
