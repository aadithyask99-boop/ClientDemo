// Shared animation core: GSAP + ScrollTrigger, Lenis smooth scroll on fine pointers only, and the reduced-motion flag.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const desktop = () => matchMedia('(min-width: 900px)').matches;
export const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'; // 108's hover curve
export const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
export const media = (name: string) => `${base}media/${name}.webp`;

let lenis: Lenis | null = null;
export function startSmooth() {
  if (reduced || !finePointer) return null;
  // One wheel notch should move about 157 px at 60 ms and about 370 px by 360 ms (measured on the reference)
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1.05, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
export const getLenis = () => lenis;
export function scrollToEl(el: Element | string, offset = 0) {
  if (lenis) lenis.scrollTo(el as any, { offset, duration: 1.2 });
  else (typeof el === 'string' ? document.querySelector(el) : el)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}
export { gsap, ScrollTrigger };
