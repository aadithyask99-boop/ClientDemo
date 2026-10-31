// Gentle synthesised chimes (no audio files, so nothing to license), a synthesised ambient music loop, and optional licensed music.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = true;
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

// ---------- music ----------
// Plays the licensed track in `music.src` if there is one. With no file it plays a quiet, royalty-free ambient loop that
// is synthesised here (soft pads and a sparse bell line over a simple four-chord progression), so the player always works.
const MUSIC_KEY = 'garden-music';
let musicEl: HTMLAudioElement | null = null;
let musicGain: GainNode | null = null;
let musicWant = false; // whether the music is meant to be playing
let musicVol = 0.2;
let ambientTimer = 0;
let chordIx = 0;

const CHORDS = [ // D, A, Bm, G (I, V, vi, IV): pad voices, then bell notes an octave or two up
  { pad: [146.83, 185.0, 220.0], bell: [293.66, 369.99, 440.0, 587.33] },
  { pad: [110.0, 138.59, 164.81], bell: [220.0, 277.18, 329.63, 440.0] },
  { pad: [123.47, 146.83, 185.0], bell: [246.94, 293.66, 369.99, 493.88] },
  { pad: [98.0, 123.47, 146.83], bell: [196.0, 246.94, 293.66, 392.0] },
];

function ambientChord(): void {
  if (!ctx || !musicGain || !musicWant) return;
  const c = CHORDS[chordIx++ % CHORDS.length];
  const t = ctx.currentTime;
  c.pad.forEach((f) => {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 2.2);
    g.gain.linearRampToValueAtTime(0, t + 6.4);
    o.connect(g);
    g.connect(musicGain!);
    o.start(t);
    o.stop(t + 6.6);
  });
  [0, 1.4, 2.8, 4.2].forEach((dt, k) => {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.type = 'sine';
    o.frequency.value = c.bell[(k * 2 + chordIx) % c.bell.length];
    const at = t + dt + 0.3;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.07, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.2);
    o.connect(g);
    g.connect(musicGain!);
    o.start(at);
    o.stop(at + 2.3);
  });
}

function ambientStart(): void {
  if (!ctx) return;
  if (!musicGain) { musicGain = ctx.createGain(); musicGain.connect(ctx.destination); }
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.setTargetAtTime(musicVol, ctx.currentTime, 0.4);
  if (!ambientTimer) { ambientChord(); ambientTimer = window.setInterval(ambientChord, 5600); }
}
function ambientStop(): void {
  if (ctx && musicGain) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
  clearInterval(ambientTimer);
  ambientTimer = 0;
}

export const musicPlaying = () => musicWant;

/** Start the music. Call it inside the user's tap, which is the only moment phones allow audio to begin. */
export function startMusic(src: string, volume = 0.2): void {
  musicVol = volume;
  try { if (localStorage.getItem(MUSIC_KEY) === 'off') return; } catch { /* ignore */ }
  musicWant = true;
  applyMusic();
}

export function toggleMusic(): boolean {
  musicWant = !musicWant;
  try { localStorage.setItem(MUSIC_KEY, musicWant ? 'on' : 'off'); } catch { /* ignore */ }
  applyMusic();
  return musicWant;
}

let musicSrc = '';
export function setMusicSource(src: string): void { musicSrc = src; }

function applyMusic(): void {
  if (musicSrc) {
    if (!musicEl) { musicEl = new Audio(musicSrc); musicEl.loop = true; }
    musicEl.volume = musicVol;
    if (musicWant) void musicEl.play().catch(() => {}); else musicEl.pause();
  } else {
    unlock();
    if (musicWant) ambientStart(); else ambientStop();
  }
}

/** Sound effects (chimes, the bell, the thread slipping free) can be muted without touching the music. */
export function setSound(next: boolean): void {
  on = next;
  try { localStorage.setItem('garden-sound', next ? 'on' : 'off'); } catch { /* ignore */ }
  if (next) unlock();
}

/** A thread slipping free: a soft breath of filtered noise sweeping downward. Quiet and short, nothing sharp. */
export function swish(): void {
  if (!on || !ctx || !master) return;
  const t = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * 0.9);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) { const e = Math.sin((Math.PI * i) / len); d[i] = (Math.random() * 2 - 1) * e * e; }
  const n = ctx.createBufferSource();
  n.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(3200, t);
  bp.frequency.exponentialRampToValueAtTime(700, t + 0.9);
  const g = ctx.createGain();
  g.gain.value = 0.16;
  n.connect(bp); bp.connect(g); g.connect(master);
  n.start(t);
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
