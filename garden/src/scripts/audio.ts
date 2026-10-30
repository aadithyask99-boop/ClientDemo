// Gentle synthesised chimes (no audio files, so nothing to license) plus optional looping music.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = true;
let music: HTMLAudioElement | null = null;
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]; // C major pentatonic

try { on = localStorage.getItem('garden-sound') !== 'off'; } catch { /* private mode */ }

export const soundOn = () => on;

export function unlock(): void {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.32;
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.24;
    const fb = ctx.createGain();
    fb.gain.value = 0.3;
    delay.connect(fb);
    fb.connect(delay);
    master.connect(ctx.destination);
    master.connect(delay);
    delay.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

export function chime(step = 0, velocity = 1): void {
  if (!on || !ctx || !master) return;
  const f = SCALE[((step % SCALE.length) + SCALE.length) % SCALE.length];
  const t = ctx.currentTime;
  [1, 2.01, 3.02].forEach((m, k) => {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.type = 'sine';
    o.frequency.value = f * m;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime((0.24 / (k + 1)) * velocity, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8 - k * 0.35);
    o.connect(g);
    g.connect(master!);
    o.start(t);
    o.stop(t + 1.9);
  });
}

export function arpeggio(start = 0): void {
  [0, 2, 4, 7].forEach((s, i) => window.setTimeout(() => chime(start + s, 0.8), i * 120));
}

export function startMusic(src: string): void {
  if (!src) return;
  if (!music) { music = new Audio(src); music.loop = true; music.volume = 0.5; }
  if (on) void music.play().catch(() => {});
}

export function setSound(next: boolean): void {
  on = next;
  try { localStorage.setItem('garden-sound', next ? 'on' : 'off'); } catch { /* ignore */ }
  if (music) { if (next) void music.play().catch(() => {}); else music.pause(); }
  if (next) unlock();
}

/** A church bell: inharmonic partials with a long decay, struck a few times. */
export function bell(strikes = 3): void {
  if (!on || !ctx || !master) return;
  for (let n = 0; n < strikes; n++) {
    const t = ctx.currentTime + n * 1.1;
    [1, 2.0, 2.76, 5.4].forEach((m, k) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = 'sine';
      o.frequency.value = 196 * m;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.26 / (k + 1), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2 - k * 0.5);
      o.connect(g);
      g.connect(master!);
      o.start(t);
      o.stop(t + 3.3);
    });
  }
}
