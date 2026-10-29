export const q = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
export const qa = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Phones and touch tablets get the light page; anything with a mouse or trackpad gets the full pointer effects */
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Pause and resume smooth scrolling while an overlay is open (scroll.ts listens) */
export const lockScroll = (on: boolean) => window.dispatchEvent(new CustomEvent('aadi:lock', { detail: on }));

/* Which easter eggs this visitor has found, kept in the browser. Only the hints use it: they stop mentioning an egg once it has been found. */
const FOUND_KEY = 'aadi-eggs';
const memory = new Set<string>();
const read = (): string[] => { try { return [...JSON.parse(localStorage.getItem(FOUND_KEY) ?? '[]'), ...memory]; } catch { return [...memory]; } };
export const found = (id: string) => read().includes(id);
export const markFound = (id: string) => {
  if (found(id)) return;
  try { localStorage.setItem(FOUND_KEY, JSON.stringify([...read(), id])); } catch { memory.add(id); } // storage can be blocked: the find still counts for this visit
};
