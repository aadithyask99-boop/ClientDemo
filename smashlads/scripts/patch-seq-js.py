"""Replace the hero sequence block in src/scripts/main.ts with the non-pinned version."""
p = '/home/user/ClientDemo/smashlads/src/scripts/main.ts'
s = open(p).read()
a = s.index('/* ---------------- hero: the cheese melts as you scroll')
b = s.index('/* ---------------- in-page links')
new = r'''/* ---------------- hero: the cheese melts as you scroll (a frame sequence on a canvas) ----------------
   The page scrolls normally. The first frame puts the burger exactly where the old hero had it; as you scroll the cheese
   melts and its strands lengthen down toward the next headline. */
const cv = $('[data-seqcv]') as HTMLCanvasElement | null;
if (cv) {
  const ctx = cv.getContext('2d')!;
  const probe = (document.querySelector('[data-sprite]') as HTMLImageElement).src; // an image that already loads shows the art folder
  const dir = probe.slice(0, probe.lastIndexOf('/') + 1) + 'seq/';
  const seqEl = $('[data-seq]')!;
  const cropD = (cv.dataset.cropD || '0,1').split(',').map(Number); // the desktop frames keep only the middle band
  let set = small() ? 'm' : 'd';
  let N = Number(cv.dataset[set === 'm' ? 'nm' : 'nd']);
  const frames: (HTMLImageElement | null)[] = [];
  let want = 0, shown = -1, dpr = 1, vw = 0, fwS = 0, fhS = 0, dyS = 0, canvasH = 0;
  const url = (i: number) => `${dir}${set}-${String(i + 1).padStart(3, '0')}.webp`;
  // where the burger sits inside its frame (fractions measured on the source frames)
  const geo = () => set === 'm'
    ? { bw: 0.889, bt: 0.117, aspect: 9 / 16, wb: Math.min(innerWidth * 1.12, innerHeight * 0.58), top: 0.34 }
    : { bw: 0.406, bt: 0.0648, aspect: 16 / 9, wb: Math.min(innerWidth * 0.52, innerHeight * 0.8), top: 0.26 };
  function size() {
    const g = geo(), H = innerHeight;
    vw = innerWidth; dpr = Math.min(2, devicePixelRatio || 1);
    fwS = g.wb / g.bw; fhS = fwS / g.aspect;
    dyS = g.top * H - g.bt * fhS;
    canvasH = Math.round(dyS + fhS);
    seqEl.style.setProperty('--seq-h', canvasH + 'px');
    cv!.width = Math.round(vw * dpr); cv!.height = Math.round(canvasH * dpr); shown = -1; draw();
  }
  function draw() {
    // the nearest frame at or before the wanted one that has loaded
    let i = Math.min(N - 1, Math.max(0, want));
    while (i > 0 && !frames[i]) i--;
    const im = frames[i];
    if (!im || i === shown) return;
    shown = i;
    const c0 = set === 'd' ? cropD[0] : 0, wFrac = im.naturalWidth / (im.naturalHeight * geo().aspect); // width of this frame as a share of the full frame
    ctx.clearRect(0, 0, cv!.width, cv!.height);
    ctx.drawImage(im, ((vw - fwS) / 2 + c0 * fwS) * dpr, dyS * dpr, wFrac * fwS * dpr, fhS * dpr);
  }
  function load() {
    frames.length = 0; N = Number(cv!.dataset[set === 'm' ? 'nm' : 'nd']);
    const order: number[] = [0, N - 1]; // the first and last frames first, then every fourth, then the rest, so scrubbing works early
    for (let k = 4; k < N - 1; k += 4) order.push(k);
    for (let k = 1; k < N - 1; k++) if (k % 4) order.push(k);
    let n = 0;
    const next = () => {
      if (n >= order.length) return;
      const i = order[n++]; const im = new Image(); im.decoding = 'async';
      im.onload = () => { frames[i] = im; if (i === want || i === 0) draw(); next(); };
      im.onerror = () => next();
      im.src = url(i);
    };
    for (let w = 0; w < 4; w++) next();
  }
  size(); load();
  addEventListener('resize', () => { const ns = small() ? 'm' : 'd'; if (ns !== set) { set = ns; load(); } size(); });
  const range = () => innerHeight * 0.8; // the melt plays over the first 80% of a screen of scrolling, then the strands simply hang
  if (reduce) { want = N - 1; draw(); }
  else ScrollTrigger.create({ trigger: document.body, start: 0, end: () => range(), onUpdate: (self) => { want = Math.round(self.progress * (N - 1)); draw(); } });
}

'''
s = s[:a] + new + s[b:]
open(p, 'w').write(s)
print('patched')
