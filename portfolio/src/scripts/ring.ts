import { q, qa, fine, reduced } from './util';

/* The tick ring of Site Chemistry: the ticks nearest the pointer grow toward the centre, like a fisheye on a dial.
   The pointer matters most when it is on the ring and less when it is far off, so nothing twitches while you read. */
export function initRing() {
  const svg = q<SVGSVGElement>('[data-ring]');
  if (!svg || !fine || reduced) return;
  const lines = qa<SVGLineElement>('line', svg);
  const C = 338;
  const R = 330;
  const base = 9;
  const gain = 30;
  const ang = lines.map((l) => parseFloat(l.dataset.a ?? '0'));
  const len = lines.map(() => base);
  let px = -1e4;
  let py = -1e4;
  let running = false;

  function tick() {
    const r = svg!.getBoundingClientRect();
    const k = r.width / 676;
    const dx = px - (r.left + r.width / 2);
    const dy = py - (r.top + r.height / 2);
    const pa = Math.atan2(dx, -dy);
    const dist = Math.hypot(dx, dy) / (R * k);
    const prox = Math.exp(-(((dist - 1) / 0.5) ** 2));
    let moving = false;
    for (let i = 0; i < lines.length; i++) {
      let d = ang[i] - pa;
      d = Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
      const target = base + gain * prox * Math.exp(-((d / 0.2) ** 2));
      len[i] += (target - len[i]) * 0.16;
      if (Math.abs(target - len[i]) > 0.05) moving = true;
      lines[i].setAttribute('x2', String(C + (R - len[i]) * Math.sin(ang[i])));
      lines[i].setAttribute('y2', String(C - (R - len[i]) * Math.cos(ang[i])));
    }
    if (moving) requestAnimationFrame(tick);
    else running = false;
  }

  window.addEventListener('pointermove', (e) => {
    px = e.clientX;
    py = e.clientY;
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }, { passive: true });
}
