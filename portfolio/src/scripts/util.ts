export const q = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
export const qa = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Phones and touch tablets get the light page; anything with a mouse or trackpad gets the full pointer effects */
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Pause and resume smooth scrolling while an overlay is open (scroll.ts listens) */
export const lockScroll = (on: boolean) => window.dispatchEvent(new CustomEvent('aadi:lock', { detail: on }));

/* Which easter eggs this visitor has found. Kept in the browser (so it survives a reload), and every new find announces itself so the counter in the footer
   (scripts/eggcount.ts) can update. The ids are the twelve below; hints.ts stops mentioning the ones already found. */
export const EGGS = ['seo', 'crawler', 'terminal', 'leads', 'shift', 'menu', 'hello', 'hire', 'rocket', 'globe', 'sleepy', 'fast'] as const;
const FOUND_KEY = 'aadi-eggs';
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(FOUND_KEY) ?? '[]'); } catch { return []; } };
export const found = (id: string) => read().includes(id);
export const foundCount = () => read().filter((id) => (EGGS as readonly string[]).includes(id)).length;
export const markFound = (id: string) => {
  const f = read();
  if (f.includes(id)) return;
  try { localStorage.setItem(FOUND_KEY, JSON.stringify([...f, id])); } catch { /* storage can be blocked: the find still counts for this visit */ memory.add(id); }
  window.dispatchEvent(new CustomEvent('aadi:egg', { detail: { id, count: Math.max(foundCount(), memory.size) } }));
};
const memory = new Set<string>();
