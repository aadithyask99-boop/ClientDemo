// Easter eggs: swans, hidden rings, the wax-seal secret, shake-for-petals, and the colour chimes.
import gsap from 'gsap';
import { invitation as inv } from '../data/invitation';
import { arpeggio, chime } from './audio';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function toast(msg: string, ms = 3200): void {
  const t = document.getElementById('toast')!;
  t.textContent = msg;
  t.hidden = false;
  gsap.killTweensOf(t);
  gsap.fromTo(t, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4 });
  gsap.to(t, { autoAlpha: 0, duration: 0.5, delay: ms / 1000, onComplete: () => { t.hidden = true; } });
}

const HEART = '<svg viewBox="0 0 48 48" width="100%" height="100%" fill="currentColor"><path d="M24 41C8 29 8 14 18 12c4-1 6 2 6 5 0-3 2-6 6-5 10 2 10 17-6 29z"/></svg>';

export function hearts(x: number, y: number, n = 10): void {
  if (reduce) return;
  for (let i = 0; i < n; i++) {
    const h = document.createElement('div');
    h.className = 'heart-burst';
    const s = 14 + Math.random() * 20;
    h.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s}px`;
    h.innerHTML = HEART;
    document.body.appendChild(h);
    gsap.to(h, {
      x: (Math.random() - 0.5) * 220, y: -90 - Math.random() * 190, rotation: (Math.random() - 0.5) * 80, scale: 0.6 + Math.random() * 0.8,
      autoAlpha: 0, duration: 1.4 + Math.random() * 0.9, ease: 'power2.out', onComplete: () => h.remove(),
    });
  }
}

export function petals(n = 46): void {
  if (reduce) return;
  const colours = ['#c98f87', '#e9dcc3', '#9b86b5', '#f3d9d2', '#8a9a6b'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.cssText = `left:${Math.random() * 100}vw;top:-24px;background:${colours[i % colours.length]}`;
    document.body.appendChild(p);
    gsap.to(p, {
      y: innerHeight + 60, x: (Math.random() - 0.5) * 240, rotation: 360 + Math.random() * 360, duration: 2.8 + Math.random() * 2.4,
      delay: Math.random() * 0.9, ease: 'sine.in', onComplete: () => p.remove(),
    });
  }
}

function longPress(el: HTMLElement, onPress: () => void): { fired: () => boolean } {
  let timer = 0;
  let fired = false;
  const start = () => { fired = false; timer = window.setTimeout(() => { fired = true; onPress(); }, 650); };
  const cancel = () => clearTimeout(timer);
  el.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, cancel));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  return { fired: () => fired };
}

function showSecret(id: string): void {
  const s = document.getElementById(id)!;
  s.textContent = inv.secret;
  s.hidden = false;
  arpeggio(1);
  gsap.fromTo(s, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 });
  gsap.to(s, { autoAlpha: 0, duration: 0.6, delay: 7, onComplete: () => { s.hidden = true; } });
}

/** Called by the cover so that a long press on the seal reveals the secret instead of opening the doors. */
export function sealSecret(seal: HTMLElement): { fired: () => boolean } {
  return longPress(seal, () => showSecret('secret'));
}

export function initEggs(): void {
  // Swans form a heart
  const swans = document.getElementById('swans')!;
  swans.addEventListener('click', () => {
    swans.classList.remove('love');
    void swans.offsetWidth;
    swans.classList.add('love');
    const r = swans.getBoundingClientRect();
    hearts(r.left + r.width / 2, r.top + r.height * 0.3, 16);
    arpeggio(3);
  });

  // Seal at the bottom keeps the same secret
  longPress(document.getElementById('mini-seal')!, () => showSecret('secret2'));

  // Colours play notes
  document.querySelectorAll<HTMLElement>('.swatch').forEach((s) =>
    s.addEventListener('click', () => {
      chime(Number(s.dataset.note) + 1);
      s.classList.remove('ping');
      void s.offsetWidth;
      s.classList.add('ping');
    }),
  );

  // Five hidden rings
  const KEY = 'garden-rings';
  let found = new Set<string>();
  try { found = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { /* ignore */ }
  const rings = [...document.querySelectorAll<HTMLElement>('.ring-egg')];
  rings.forEach((r) => { if (found.has(r.dataset.ring!)) r.classList.add('found'); });
  rings.forEach((r) =>
    r.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = r.dataset.ring!;
      if (found.has(id)) return;
      found.add(id);
      try { localStorage.setItem(KEY, JSON.stringify([...found])); } catch { /* ignore */ }
      r.classList.add('found');
      chime(found.size + 2);
      const b = r.getBoundingClientRect();
      hearts(b.left + b.width / 2, b.top, 6);
      if (found.size >= rings.length) { arpeggio(0); petals(60); toast(inv.hunt.found, 7000); }
      else toast(`A ring. That is ${found.size} of ${rings.length}.`);
    }),
  );

  // Shake the phone for petals (iOS needs permission, requested from the seal tap)
  let last = 0;
  let hits = 0;
  window.addEventListener('devicemotion', (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const mag = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
    const now = Date.now();
    if (mag > 38) {
      hits = now - last < 600 ? hits + 1 : 1;
      last = now;
      if (hits >= 3) { hits = 0; petals(40); chime(5); }
    }
  });
}

export async function askMotionPermission(): Promise<void> {
  const D = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
  const O = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  try { await D.requestPermission?.(); await O.requestPermission?.(); } catch { /* user said no, fine */ }
}
