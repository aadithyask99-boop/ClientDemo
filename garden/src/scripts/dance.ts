// The first dance. Scrolling through the section scrubs a 60-frame waltz that loops seamlessly (the video's first and
// last frames were the same still). Pressing and holding plays it in real time; letting go hands it back to the scroll.
import { chime } from './audio';
import { hearts } from './eggs';
import type { Atmosphere } from './atmosphere';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const N = 60;
const FPS = 12;
const CYCLES = 2; // dances this many full loops over the length of the section

export function initDance(reduce: boolean, atmo: Atmosphere): void {
  const sec = document.getElementById('dance')!;
  const stage = document.getElementById('hoop')!;
  const canvas = document.getElementById('dance-canvas') as HTMLCanvasElement;
  const hint = document.getElementById('dance-hint')!;
  const ctx = canvas.getContext('2d');
  if (!ctx || reduce) return; // the still image stays, nothing moves

  stage.addEventListener('contextmenu', (e) => e.preventDefault());

  const frames: HTMLImageElement[] = [];
  let ready = false;
  let loading = false;
  const load = () => {
    if (loading) return;
    loading = true;
    let done = 0;
    for (let i = 0; i < N; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => { if (++done === N) { ready = true; stage.classList.add('live'); } };
      img.src = `${base}/art/dance/d-${String(i).padStart(2, '0')}.webp`;
      frames.push(img);
    }
  };

  let near = false;
  new IntersectionObserver((es) => {
    near = es[0].isIntersecting;
    if (near) { load(); requestAnimationFrame(tick); }
  }, { rootMargin: '150% 0px 150% 0px' }).observe(sec);

  let held = false;
  let offset = 0; // frames added by holding, so letting go never jumps
  let shown = 0;
  let timer = 0;
  let beat = 0;
  const hold = (on: boolean) => {
    held = on;
    hint.textContent = on ? stage.dataset.hold! : hint.dataset.rest!;
    stage.classList.toggle('held', on);
  };
  stage.addEventListener('pointerdown', () => { timer = window.setTimeout(() => hold(true), 260); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => stage.addEventListener(ev, () => { clearTimeout(timer); if (held) hold(false); }));

  let lastT = performance.now();
  let lastScroll = scrollY;
  function tick(t: number) {
    if (!near) return;
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    const r = sec.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)));
    if (held) {
      offset += dt * FPS;
      beat += dt;
      if (beat > 0.9) {
        beat = 0;
        const b = stage.getBoundingClientRect();
        hearts(b.left + b.width / 2, b.top + b.height * 0.25, 3);
        atmo.spawn(b.left + b.width / 2, b.top + b.height * 0.5, 3);
        atmo.gust(0.5);
        chime(Math.floor(Math.random() * 6), 0.6);
      }
    }
    const desired = p * CYCLES * N + offset;
    shown += (desired - shown) * (1 - Math.exp(-dt * 9));
    const speed = Math.abs(scrollY - lastScroll);
    lastScroll = scrollY;
    if (speed > 12 && r.top < innerHeight && r.bottom > 0) atmo.gust(Math.min(0.35, speed * 0.004));
    if (ready) {
      const img = frames[((Math.floor(shown) % N) + N) % N];
      if (img.naturalWidth) {
        if (canvas.width !== img.naturalWidth) { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; }
        ctx!.drawImage(img, 0, 0);
      }
    }
    requestAnimationFrame(tick);
  }
}
