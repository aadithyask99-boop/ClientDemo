import gsap from 'gsap';
import { addToCart } from './cart';

type Part = { id: string; name: string; price: number; kcal: number; img: string; w: number; h: number; o: number };
type Swap = { id: string; name: string; price: number; kcal: number; img?: string };
type Cfg = { parts: Part[]; swaps: { patty: Swap[]; bun: Swap[]; side: Swap[] }; builder: { baseBun: Part & { price: number; kcal: number }; maxLayers: number }; base: string };

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
const gbp = String.fromCharCode(163);

export function initBuilder(reduce: boolean, celebrate: () => void) {
  const root = $('[data-build]');
  if (!root) return;
  const cfg = JSON.parse($('#parts')!.textContent || '{}') as Cfg;
  const probe = (document.querySelector('[data-sprite]') as HTMLImageElement).src; // an image that already loads shows the art folder
  const dir = probe.slice(0, probe.lastIndexOf('/') + 1);
  const src = (n: string) => `${dir}${n}.webp`;
  const parts = Object.fromEntries(cfg.parts.map((p) => [p.id, p]));
  const stack = $('[data-stack]', root)!;
  const drop = $('[data-drop]', root)!;
  const msg = $('[data-msg]', root)!;
  const sidepic = $('[data-sidepic]', root)!;
  const state: string[] = [];
  let topOn = false, celebrated = false;
  const opt = { patty: 'beef', bun: 'brioche', side: 'none' };
  const swap = <K extends keyof typeof opt>(k: K) => cfg.swaps[k].find((s) => s.id === opt[k])!;

  // chips show the real photo layer
  $$('[data-art]', root).forEach((el) => { const p = parts[el.dataset.art!]; if (p) el.innerHTML = `<img src="${src(p.img)}" alt="" width="200" height="${Math.round(200 * 0.5 * p.h)}" draggable="false">`; });

  function layerEl(id: string, flip = false) {
    const p = parts[id];
    let img = p.img;
    if (id === 'patty') img = (swap('patty') as Swap).img || p.img;
    const wrap = opt.bun === 'wrap' && id === 'top';
    const el = document.createElement('div');
    el.className = 'layer'; el.dataset.id = id;
    el.style.setProperty('--w', p.w + '%'); el.style.setProperty('--o', p.o + '%');
    const im = document.createElement('img'); im.alt = ''; im.draggable = false;
    im.src = src(wrap ? 'layer-lettuce' : img);
    if (flip || wrap) im.style.transform = 'scaleY(-1)';
    // flatten thick cut-outs into slices: the image is stretched to a fraction of its natural height
    im.style.aspectRatio = `${wrap ? 900 / 300 : ''}`;
    el.appendChild(im);
    el.dataset.h = String(wrap ? 0.4 : p.h);
    return el;
  }
  const NAT: Record<string, number> = { 'layer-patty': 419 / 900, 'layer-cheese': 395 / 900, 'layer-bacon': 286 / 900, 'layer-lettuce': 478 / 900, 'layer-tomato': 680 / 900, 'layer-onion': 522 / 750, 'layer-pickle': 266 / 900, 'layer-chicken': 414 / 900, 'layer-plant': 337 / 900, 'layer-buntop': 496 / 900, 'layer-bunbot': 418 / 900 };
  function sizeLayer(el: HTMLElement) {
    const img = el.firstElementChild as HTMLImageElement;
    const key = (img.src.match(/(layer-[a-z]+)\.webp/) || [])[1];
    const ar = (NAT[key] || 0.45) * parseFloat(el.dataset.h || '1');
    el.style.aspectRatio = `1 / ${ar}`;
    img.style.height = '100%';
  }
  const baseBun = () => {
    const el = document.createElement('div'); el.className = 'layer is-base'; el.dataset.id = 'botbun';
    el.style.setProperty('--w', '100%'); el.style.setProperty('--o', '0%');
    const im = document.createElement('img'); im.alt = ''; im.draggable = false;
    im.src = src(opt.bun === 'wrap' ? 'layer-lettuce' : 'layer-bunbot');
    el.appendChild(im);
    el.dataset.h = opt.bun === 'wrap' ? '0.4' : '1';
    return el;
  };
  let bun = baseBun(); stack.appendChild(bun); sizeLayer(bun);

  function totals() {
    let price = cfg.builder.baseBun.price, kcal = cfg.builder.baseBun.kcal;
    state.forEach((id) => { price += parts[id].price; kcal += parts[id].kcal; if (id === 'patty') { price += swap('patty').price; kcal += swap('patty').kcal; } });
    if (topOn) { price += parts.top.price; kcal += parts.top.kcal; }
    price += swap('bun').price + swap('side').price; kcal += swap('bun').kcal + swap('side').kcal;
    return { price, kcal, n: state.length + (topOn ? 1 : 0) };
  }
  function relayout() {
    // the layer straight on the bun tucks deeper into its soft top; then the whole stack scales to fit the drop zone
    const ls = $$('.layer', stack).filter((n) => !n.classList.contains('is-base'));
    ls.forEach((el, i) => { const p = parts[el.dataset.id!]; el.style.setProperty('--o', (p.o + (i === 0 ? 9 : 0)) + '%'); });
    stack.style.setProperty('--fit', '1');
    const room = drop.clientHeight * 0.88, h = stack.offsetHeight;
    stack.style.setProperty('--fit', String(h > room ? room / h : 1));
  }
  function refresh() {
    relayout();
    const t = totals();
    $('[data-n]', root)!.textContent = String(t.n);
    $('[data-kcal]', root)!.textContent = `${Math.max(0, t.kcal)} kcal`;
    $('[data-price]', root)!.innerHTML = `&pound;${t.price.toFixed(2)}`;
    drop.classList.toggle('has-layers', t.n > 0);
    $('[data-part="top"]', root)?.classList.toggle('is-used', topOn);
    if (t.n >= 10 && !celebrated) { celebrated = true; msg.textContent = 'Ten layers! Absolute tower.'; celebrate(); }
  }
  function squash() {
    if (reduce) return;
    gsap.fromTo(stack, { scaleY: 1, scaleX: 1 }, { scaleY: 0.965, scaleX: 1.015, duration: 0.09, yoyo: true, repeat: 1, transformOrigin: '50% 100%', ease: 'power1.out' });
  }
  function land(el: HTMLElement) {
    if (reduce) return;
    const h = stack.getBoundingClientRect().height;
    gsap.fromTo(el, { y: -(h + 180), opacity: 0, rotation: (Math.random() - 0.5) * 8 }, { y: 0, opacity: 1, rotation: 0, duration: 0.5, ease: 'power3.in', onComplete: squash });
  }
  function add(id: string) {
    msg.textContent = '';
    if (id === 'top') { if (topOn) return; topOn = true; const el = layerEl('top'); el.dataset.top = '1'; stack.appendChild(el); sizeLayer(el); land(el); refresh(); return; }
    if (state.length >= cfg.builder.maxLayers) { msg.textContent = 'That is plenty! Take a layer off or add it to the cart.'; return; }
    state.push(id);
    const el = layerEl(id);
    const topEl = $('[data-top]', stack);
    topEl ? stack.insertBefore(el, topEl) : stack.appendChild(el);
    sizeLayer(el); land(el); refresh();
  }
  function removeLayer(el: HTMLElement) {
    if (el.classList.contains('is-base')) return;
    const done = () => {
      if (el.dataset.top) topOn = false;
      else { const nodes = $$('.layer', stack).filter((n) => !n.classList.contains('is-base') && !n.dataset.top); const i = nodes.indexOf(el); if (i > -1) state.splice(i, 1); }
      el.remove(); if (state.length + (topOn ? 1 : 0) < 10) celebrated = false; refresh();
    };
    reduce ? done() : gsap.to(el, { x: 200, opacity: 0, rotation: 12, duration: 0.35, ease: 'power2.in', onComplete: done });
  }
  stack.addEventListener('click', (e) => { const l = (e.target as HTMLElement).closest('.layer') as HTMLElement | null; if (l) removeLayer(l); });

  // swaps: patty, bun, side
  function rebuild() {
    $$('.layer', stack).forEach((el) => {
      if (el.classList.contains('is-base')) return;
      const id = el.dataset.id!; const img = el.firstElementChild as HTMLImageElement;
      if (id === 'patty') { img.src = src(swap('patty').img || 'layer-patty'); sizeLayer(el); }
      if (id === 'top') { const wrap = opt.bun === 'wrap'; img.src = src(wrap ? 'layer-lettuce' : 'layer-buntop'); img.style.transform = wrap ? 'scaleY(-1)' : ''; el.dataset.h = wrap ? '0.4' : '1'; sizeLayer(el); }
    });
    const nb = baseBun(); stack.replaceChild(nb, bun); bun = nb; sizeLayer(bun);
    const s = swap('side');
    sidepic.innerHTML = s.img ? `<img src="${src(s.img)}" alt="" draggable="false">` : '';
    sidepic.classList.toggle('is-on', !!s.img);
    if (s.img && !reduce) gsap.fromTo(sidepic, { y: -80, opacity: 0, rotation: -8 }, { y: 0, opacity: 1, rotation: 0, duration: 0.6, ease: 'bounce.out' });
    refresh();
  }
  $$('[data-opt]', root).forEach((b) => b.addEventListener('click', () => {
    const [k, v] = b.dataset.opt!.split(':') as ['patty' | 'bun' | 'side', string];
    opt[k] = v;
    $$(`[data-opt^="${k}:"]`, root).forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    rebuild();
  }));

  $('[data-clear]', root)!.addEventListener('click', () => { $$('.layer', stack).filter((n) => !n.classList.contains('is-base')).forEach((n) => n.remove()); state.length = 0; topOn = false; celebrated = false; msg.textContent = ''; refresh(); });
  $('[data-send]', root)!.addEventListener('click', (e) => {
    const t = totals();
    if (t.n < 2) { msg.textContent = 'Add a few layers first.'; return; }
    const names = state.map((id) => (id === 'patty' ? swap('patty').name + ' patty' : parts[id].name.toLowerCase()));
    const s = swap('side');
    const desc = [opt.bun === 'wrap' ? 'Lettuce wrap' : 'Brioche', ...names, topOn ? 'top bun' : 'open top'].join(', ') + (s.img ? ` + ${s.name.toLowerCase()}` : '');
    addToCart({ key: 'build:' + desc, name: 'Your smash', desc, price: t.price, thumb: src('burger-og') }, $('[data-drop]', root) as HTMLElement);
    msg.textContent = 'Added to your cart.';
  });

  // drag a chip onto the stack, or tap it
  $$('.chip', root).forEach((chip) => {
    let sx = 0, sy = 0, ghost: HTMLElement | null = null, moved = false;
    const id = chip.dataset.part!;
    const inDrop = (x: number, y: number) => { const r = drop.getBoundingClientRect(); return x > r.left && x < r.right && y > r.top - 40 && y < r.bottom + 40; };
    chip.addEventListener('pointerdown', (e) => { chip.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; moved = false; });
    chip.addEventListener('pointermove', (e) => {
      if (!chip.hasPointerCapture(e.pointerId)) return;
      if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        moved = true; ghost = document.createElement('div'); ghost.className = 'is-ghost';
        ghost.innerHTML = `<img src="${src(parts[id].img)}" alt="" style="width:100%;height:auto;display:block">`; document.body.appendChild(ghost);
      }
      if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; drop.classList.toggle('is-over', inDrop(e.clientX, e.clientY)); }
    });
    chip.addEventListener('pointerup', (e) => {
      if (!chip.hasPointerCapture(e.pointerId)) return;
      chip.releasePointerCapture(e.pointerId);
      if (ghost) { ghost.remove(); ghost = null; drop.classList.remove('is-over'); if (inDrop(e.clientX, e.clientY)) add(id); } else add(id);
    });
    chip.addEventListener('pointercancel', () => { ghost?.remove(); ghost = null; drop.classList.remove('is-over'); });
    chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(id); } });
  });
  void gbp;
  refresh();
}
