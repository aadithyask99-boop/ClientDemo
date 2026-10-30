// The first dance, played once. Scrolling through the section scrubs a spin that ends in a dip; the dip lands near the
// end of the section and holds, then the page moves on. Nothing loops. Pressing and holding lets them dance on by
// themselves (forward, to the dip); letting go hands the dance back to the scroll.
import { chime } from './audio';
import { hearts } from './eggs';
import type { Atmosphere } from './atmosphere';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const END = 0.86; // the dip is reached after 86% of the section's scroll; the rest is a held pause before the page moves on

export function initDance(reduce: boolean, atmo: Atmosphere): void {
  const sec = document.getElementById('dance')!;
  const stage = document.getElementById('hoop')!;
  const canvas = document.getElementById('dance-canvas') as HTMLCanvasElement;
  const hint = document.getElementById('dance-hint')!;
  const ctx = canvas.getContext('2d');
  const N = Number(stage.dataset.frames || 60);
  const FPS = Number(stage.dataset.fps || 12);
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
      img.src = `${base}/art/dance/d-${String(i).padStart(3, '0')}.webp`;
      // decode up front so the first loop never hitches on image decoding
      img.decode().catch(() => {}).then(() => { if (++done === N) { ready = true; stage.classList.add('live'); } });
      frames.push(img);
    }
  };

  let near = false;
  new IntersectionObserver((es) => {
    near = es[0].isIntersecting;
    if (near) { load(); requestAnimationFrame(tick); } else offset = 0; // a fresh dance each time it comes back into view
  }, { rootMargin: '150% 0px 150% 0px' }).observe(sec);

  let held = false;
  let offset = 0; // frames gained by holding, so letting go never jumps
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

  let lastDrawn = -1;
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
    const last = N - 1;
    const desired = Math.min(last, Math.min(1, p / END) * last + offset);
    shown += (desired - shown) * (1 - Math.exp(-dt * 9));
    const speed = Math.abs(scrollY - lastScroll);
    lastScroll = scrollY;
    if (speed > 12 && r.top < innerHeight && r.bottom > 0) atmo.gust(Math.min(0.35, speed * 0.004));
    if (ready) {
      const f = Math.max(0, Math.min(last, shown));
      if (Math.abs(f - lastDrawn) > 0.03) {
        lastDrawn = f;
        const i = Math.floor(f);
        const a = frames[i];
        if (a.naturalWidth) {
          if (canvas.width !== a.naturalWidth) { canvas.width = a.naturalWidth; canvas.height = a.naturalHeight; }
          ctx!.globalAlpha = 1;
          ctx!.drawImage(a, 0, 0);
          // blend toward the next frame so slow scrolling glides instead of stepping
          const frac = f - i;
          const nb = frames[Math.min(last, i + 1)];
          if (frac > 0.03 && nb.naturalWidth) { ctx!.globalAlpha = frac; ctx!.drawImage(nb, 0, 0); ctx!.globalAlpha = 1; }
        }
      }
    }
    requestAnimationFrame(tick);
  }
}
