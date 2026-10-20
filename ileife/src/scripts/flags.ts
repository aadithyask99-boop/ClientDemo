// Cursor-driven effects are individually switchable so each can be judged on its own.
//   ?fx=off            turns them all off
//   ?fx=glow,peek      turns on only those named
//   ?panel             shows a small panel to toggle them live

export type Fx = 'glow' | 'peek' | 'magnet';
const all: Fx[] = ['glow', 'peek', 'magnet'];

const params = new URLSearchParams(location.search);
const fx = params.get('fx');
const start: Fx[] = fx === 'off' ? [] : fx ? (fx.split(',').filter((f): f is Fx => (all as string[]).includes(f))) : all;

export const flags = new Set<Fx>(start);

export const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initPanel() {
  if (!params.has('panel') || !fine) return;
  const el = document.createElement('div');
  el.className = 'fxpanel';
  const labels: Record<Fx, string> = {
    glow: 'Cursor glow (dark sections)',
    peek: 'Facial image follows cursor',
    magnet: 'Magnetic Book buttons',
  };
  all.forEach((k) => {
    const l = document.createElement('label');
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.checked = flags.has(k);
    c.addEventListener('change', () => (c.checked ? flags.add(k) : flags.delete(k)));
    l.append(c, ` ${labels[k]}`);
    el.append(l);
  });
  document.body.append(el);
}
