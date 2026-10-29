import { gsap } from 'gsap';
import { q, qa, clamp, lockScroll } from './util';

/* The local-time panel. Loaded the first time the clock in the header is pressed.
   - An analogue clock and a digital readout, both in the time zone set in .env.
   - The hands can be dragged (the nearer of hour and minute takes the grab) and spring back to the real time when let go.
   - Sound is a synthesised tick (no audio file). It is off until the toggle is pressed; once on it is quieter the further the pointer is from the
     clock, and dragging a hand clicks every three minutes of travel, like a real crown. */

const tz = q('[data-clock]')?.dataset.tz;
let pointer = { x: -999, y: -999 };
window.addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });

let fmt: Intl.DateTimeFormat;
try {
  fmt = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23', timeZone: tz });
} catch {
  fmt = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
}
const now = () => {
  const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, +x.value]));
  return { h: p.hour % 24, m: p.minute, s: p.second };
};
const angles = () => {
  const t = now();
  return { h: (t.h % 12) * 30 + t.m * 0.5, m: t.m * 6 + t.s * 0.1, s: t.s * 6 };
};

/* One working clock inside any block that has the clock markup (the face, the digital readout, the sound button). The header's panel and the pricing sheet each have one. */
export function mountClock(scope: HTMLElement) {
  const face = q<SVGSVGElement>('[data-clock-face]', scope)!;
  const digital = q('[data-clock-digital]', scope)!;
  const hands = { h: q('[data-hand="h"]', face)!, m: q('[data-hand="m"]', face)!, s: q('[data-hand="s"]', face)! };
  let timer = 0;
  let ctx: AudioContext | null = null;
  let soundOn = false;
  const rot = { h: 0, m: 0, s: 0 };
  const dragging = { h: false, m: false };
  const apply = (k: 'h' | 'm' | 's') => gsap.set(hands[k], { rotation: rot[k], svgOrigin: '0 0' });

  /* ---------- sound ---------- */
  function tick(strength = 1, pitch = 1) {
    if (!soundOn || !ctx) return;
    const r = face.getBoundingClientRect();
    const dist = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
    const vol = Math.pow(1 - clamp((dist - 90) / 370), 2) * 0.5 * strength;
    if (vol < 0.004) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(1900 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(700 * pitch, t + 0.03);
    g.gain.setValueAtTime(vol * 0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.06);
  }

  /* ---------- running ---------- */
  function paint(first = false) {
    const a = angles();
    const t = now();
    digital.textContent = [t.h, t.m, t.s].map((n) => String(n).padStart(2, '0')).join(':');
    (['h', 'm', 's'] as const).forEach((k) => {
      if (k !== 's' && dragging[k]) return;
      // keep the turn count continuous so a hand never spins backwards at 60
      const target = a[k] + 360 * Math.round((rot[k] - a[k]) / 360);
      if (first) rot[k] = a[k];
      else if (k === 's') {
        gsap.to(rot, { s: target, duration: 0.35, ease: 'back.out(3)', onUpdate: () => apply('s'), overwrite: 'auto' });
        return;
      } else rot[k] = target;
      apply(k);
    });
    if (!first) tick();
  }

  q<HTMLButtonElement>('[data-clock-sound]', scope)!.addEventListener('click', (e) => {
    const b = e.currentTarget as HTMLButtonElement;
    soundOn = !soundOn;
    if (soundOn) {
      ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      void ctx.resume();
    }
    b.textContent = soundOn ? 'Sound on' : 'Sound off';
    b.setAttribute('aria-pressed', String(soundOn));
    tick(2);
  });

  /* ---------- dragging the hands ---------- */
  let grab: 'h' | 'm' | null = null;
  let lastStep = 0;
  const pointerAngle = (e: PointerEvent) => {
    const r = face.getBoundingClientRect();
    return (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
  };
  const near = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
  face.addEventListener('pointerdown', (e) => {
    const r = face.getBoundingClientRect();
    const rad = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) / (r.width / 2);
    const p = pointerAngle(e);
    const dh = near(p, rot.h);
    const dm = near(p, rot.m);
    grab = rad < 0.62 && dh < dm ? 'h' : 'm';
    gsap.killTweensOf(rot);
    dragging[grab] = true;
    lastStep = Math.round(rot[grab] / 18);
    face.setPointerCapture(e.pointerId);
    face.classList.add('is-drag');
  });
  face.addEventListener('pointermove', (e) => {
    if (!grab) return;
    const p = pointerAngle(e);
    rot[grab] += ((p - rot[grab] + 540) % 360) - 180; // follow the pointer by the shortest way round
    apply(grab);
    const step = Math.round(rot[grab] / 18);
    if (step !== lastStep) { lastStep = step; tick(1, 1.3); }
  });
  const release = () => {
    if (!grab) return;
    const k = grab;
    grab = null;
    dragging[k] = false;
    face.classList.remove('is-drag');
    const a = angles()[k];
    const turns = Math.round((rot[k] - a) / 360);
    gsap.to(rot, { [k]: a + turns * 360, duration: 1.1, ease: 'elastic.out(1, 0.45)', onUpdate: () => apply(k) });
    tick(1.6, 0.7);
  };
  face.addEventListener('pointerup', release);
  face.addEventListener('pointercancel', release);

  return {
    start() { paint(true); window.clearInterval(timer); timer = window.setInterval(() => paint(), 1000); },
    stop() { window.clearInterval(timer); },
  };
}

const panel = q('[data-clock-panel]')!;
const card = q('.clk__card', panel)!;
let opener: HTMLElement | null = null;
const clock = mountClock(panel);

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
  if (e.key !== 'Tab') return;
  const f = qa<HTMLElement>('button, a[href]', card).filter((el) => !el.hasAttribute('disabled'));
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

export function open(from?: HTMLElement | null) {
  opener = from ?? (document.activeElement as HTMLElement | null);
  panel.hidden = false;
  lockScroll(true);
  clock.start();
  gsap.fromTo(card, { y: 24, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: true });
  gsap.fromTo(q('.clk__veil', panel), { opacity: 0 }, { opacity: 1, duration: 0.4, overwrite: true });
  document.addEventListener('keydown', onKey);
  card.focus();
}

export function close() {
  if (panel.hidden) return;
  clock.stop();
  document.removeEventListener('keydown', onKey);
  gsap.to(card, { y: 16, opacity: 0, duration: 0.25, ease: 'power2.in', overwrite: true });
  gsap.to(q('.clk__veil', panel), { opacity: 0, duration: 0.25, overwrite: true, onComplete: () => { panel.hidden = true; } });
  lockScroll(false);
  opener?.focus();
}

qa('[data-clock-close]', panel).forEach((el) => el.addEventListener('click', close));
