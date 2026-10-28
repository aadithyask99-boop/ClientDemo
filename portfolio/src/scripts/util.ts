export const q = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
export const qa = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Phones and touch tablets get the light page; anything with a mouse or trackpad gets the full pointer effects */
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Pause and resume smooth scrolling while an overlay is open (scroll.ts listens) */
export const lockScroll = (on: boolean) => window.dispatchEvent(new CustomEvent('aadi:lock', { detail: on }));
