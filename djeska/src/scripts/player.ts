import { gsap } from 'gsap';
import { tracks, soundcloud, type Track } from '../data/site';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const audio = new Audio();
audio.preload = 'none';

/* SoundCloud widget, loaded only when a SoundCloud track is first played */
let scw: any = null;
let scReady: Promise<void> | null = null;
let scTime = 0;
let scDur = 0;
let scPaused = true;
const vol = { v: 0 };
// Master volume, deliberately low so nothing blasts on first play. The bar has a slider to change it.
let master = 0.2;

function loadScript(src: string) {
  return new Promise<void>((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error('script'));
    document.head.appendChild(s);
  });
}
function ensureSC() {
  if (scReady) return scReady;
  scReady = (async () => {
    await loadScript('https://w.soundcloud.com/player/api.js');
    const f = document.createElement('iframe');
    f.title = 'SoundCloud';
    f.allow = 'autoplay';
    f.setAttribute('aria-hidden', 'true');
    f.tabIndex = -1;
    f.style.cssText = 'position:fixed;left:-9999px;top:0;width:300px;height:166px;border:0';
    f.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloud.playlist)}&visual=false&show_comments=false`;
    document.body.appendChild(f);
    const SC = (window as any).SC;
    scw = SC.Widget(f);
    await new Promise<void>((res) => scw.bind(SC.Widget.Events.READY, () => res()));
    scw.bind(SC.Widget.Events.PLAY, () => { scPaused = false; setPlaying(true); });
    scw.bind(SC.Widget.Events.PAUSE, () => { scPaused = true; if (isSC()) setPlaying(false); });
    scw.bind(SC.Widget.Events.PLAY_PROGRESS, (e: any) => { scTime = e.currentPosition / 1000; paint(); });
    scw.bind(SC.Widget.Events.FINISH, () => { scw.pause(); scPaused = true; next(); });
  })();
  return scReady;
}

/* Web Audio analyser for the equaliser. Works for the local files; SoundCloud audio lives in another
   origin and cannot be analysed, so the equaliser animates from the beat instead. */
let actx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
function ensureAnalyser() {
  if (analyser) { actx?.resume(); return; }
  try {
    actx = new AudioContext();
    const src = actx.createMediaElementSource(audio);
    analyser = actx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.74;
    src.connect(analyser);
    analyser.connect(actx.destination);
  } catch {
    analyser = null;
  }
}

let idx = 0;
let dismissed = false;
const cur = (): Track => tracks[idx];
const isSC = (t: Track = cur()) => t.sc !== undefined;

const mixes = [...document.querySelectorAll<HTMLElement>('[data-mix]')];
const playBtns = [...document.querySelectorAll<HTMLElement>('[data-play]')];
const seeks = [...document.querySelectorAll<HTMLInputElement>('[data-seek], [data-seek-bar]')];
const times = [...document.querySelectorAll<HTMLElement>('[data-time]')];
const titles = [...document.querySelectorAll<HTMLElement>('[data-track-title]')];
const numbers = [...document.querySelectorAll<HTMLElement>('[data-track-no]')];
const bar = document.querySelector<HTMLElement>('[data-bar]');
const barSub = document.querySelector<HTMLElement>('[data-bar-sub]');
const volumeEls = [...document.querySelectorAll<HTMLInputElement>('[data-volume]')];
const flagged = [...document.querySelectorAll<HTMLElement>('[data-player], [data-bar]')];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const time = () => (isSC() ? scTime : audio.currentTime);
const dur = () => (isSC() ? scDur || cur().dur : audio.duration || cur().dur);
const paused = () => (isSC() ? scPaused : audio.paused);

function label() {
  titles.forEach((t) => (t.textContent = cur().title));
  numbers.forEach((n) => (n.textContent = String(idx + 1).padStart(2, '0')));
  mixes.forEach((m, k) => m.classList.toggle('is-current', k === idx));
  document.querySelectorAll('[data-cover-img]').forEach((im, k) => im.classList.toggle('is-on', k === idx));
}

function paint() {
  const d = dur();
  const p = d ? Math.min(1, time() / d) : 0;
  seeks.forEach((s) => {
    if (document.activeElement !== s) s.value = String(Math.round(p * 1000));
    s.style.setProperty('--p', `${p * 100}%`);
  });
  times.forEach((t) => (t.textContent = fmt(time())));
  mixes[idx]?.style.setProperty('--p', `${p * 100}%`);
}

function setPlaying(on: boolean) {
  flagged.forEach((el) => el.classList.toggle('is-playing', on));
  mixes.forEach((m, k) => m.classList.toggle('is-playing', on && k === idx));
  playBtns.forEach((b) => b.setAttribute('aria-label', on ? 'Pause' : 'Play'));
  if (barSub) barSub.textContent = on ? 'Now playing' : time() > 0 ? 'Paused' : 'Ready';
  updateBar();
}

function applyVolume() {
  if (isSC()) scw?.setVolume(Math.round(vol.v * 100));
  else audio.volume = vol.v;
}
function fadeTo(v: number, d = 1.2) {
  if (reduce) { vol.v = v; applyVolume(); return; }
  gsap.to(vol, { v, duration: d, ease: 'power1.out', overwrite: true, onUpdate: applyVolume });
}

function stopAll() {
  audio.pause();
  if (scw && !scPaused) scw.pause();
}

function select(i: number) {
  stopAll();
  idx = (i + tracks.length) % tracks.length;
  scTime = 0;
  scDur = 0;
  if (!isSC()) {
    audio.src = `${base}/${cur().src}`;
    audio.currentTime = 0;
  }
  label();
  paint();
}

async function play() {
  try {
    vol.v = 0;
    if (isSC()) {
      await ensureSC();
      scw.setVolume(0);
      scw.skip(cur().sc);
      scw.play();
      scw.getDuration((ms: number) => { scDur = ms / 1000; });
    } else {
      if (!audio.src) audio.src = `${base}/${cur().src}`;
      ensureAnalyser();
      audio.volume = 0;
      await audio.play();
      setPlaying(true);
    }
    fadeTo(master);
  } catch {
    setPlaying(false);
  }
}
function pause() {
  fadeTo(0, 0.35);
  window.setTimeout(() => {
    if (isSC()) scw?.pause();
    else audio.pause();
    setPlaying(false);
  }, reduce ? 0 : 380);
}
const toggle = () => (paused() ? play() : pause());
function next() { select(idx + 1); play(); }

label();
paint();

playBtns.forEach((b) => b.addEventListener('click', toggle));
mixes.forEach((m, k) => {
  m.querySelector('[data-mix-play]')?.addEventListener('click', () => {
    if (k === idx && !paused()) { pause(); return; }
    if (k !== idx) select(k);
    play();
  });
});
audio.addEventListener('timeupdate', () => { if (!isSC()) paint(); });
audio.addEventListener('loadedmetadata', () => { if (!isSC()) paint(); });
audio.addEventListener('ended', next);
seeks.forEach((s) =>
  s.addEventListener('input', () => {
    const f = Number(s.value) / 1000;
    if (isSC()) { if (scw) { scw.seekTo(f * dur() * 1000); scTime = f * dur(); } }
    else if (audio.duration) audio.currentTime = f * audio.duration;
    paint();
  }),
);

volumeEls.forEach((v) => {
  v.value = String(Math.round(master * 100));
  v.style.setProperty('--p', `${master * 100}%`);
  v.addEventListener('input', () => {
    master = Number(v.value) / 100;
    v.style.setProperty('--p', `${v.value}%`);
    if (!paused()) { gsap.killTweensOf(vol); vol.v = master; applyVolume(); }
  });
});

/* Sticky bar: there from the moment the gate opens, so the music can always be paused. The cross closes it. */
let entered = !document.documentElement.classList.contains('gated');
function updateBar() {
  const on = entered && !dismissed;
  document.documentElement.classList.toggle('has-bar', on);
  bar?.classList.toggle('is-on', on);
  bar?.setAttribute('aria-hidden', String(!on));
  bar?.toggleAttribute('inert', !on);
}
document.querySelector('[data-bar-close]')?.addEventListener('click', () => {
  dismissed = true;
  if (!paused()) pause();
  updateBar();
});
updateBar();

/* The gate click is the user gesture that lets the music start */
document.addEventListener('djeska:enter', (e) => {
  entered = true;
  updateBar();
  if ((e as CustomEvent).detail?.sound) { select(0); play(); }
});

/* Read by the equaliser */
export const eqSource = {
  playing: () => !paused(),
  bins: (buf: Uint8Array) => {
    if (isSC() || !analyser) return false;
    analyser.getByteFrequencyData(buf);
    return true;
  },
  size: () => analyser?.frequencyBinCount ?? 0,
};
