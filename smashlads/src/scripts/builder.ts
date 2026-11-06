import gsap from 'gsap';
import { addToCart } from './cart';

type Tog = { id: string; name: string; price: number; kcal: number; per: 'patty' | 'once' };
type Side = { id: string; name: string; price: number; kcal: number; img?: string };
type Cfg = { bld: { base: { price: number; kcal: number }; toggles: Tog[]; patty: { price: number; kcal: number }; sides: Side[] } };

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];

// Build your own: every combination is a finished photograph of that burger; changing a choice crossfades to the next photo.
export function initBuilder(reduce: boolean, celebrate: () => void) {
  const root = $('[data-build]');
  if (!root) return;
  const cfg = JSON.parse($('#parts')!.textContent || '{}') as Cfg;
  const B = cfg.bld;
  const probe = (document.querySelector('[data-sprite]') as HTMLImageElement).src; // an image that already loads shows the art folder
  const dir = probe.slice(0, probe.lastIndexOf('/') + 1);
  const burger = $('[data-bburger]', root)!;
  const imgs = $$('.bimg', burger) as HTMLImageElement[];
  const sidepic = $('[data-sidepic]', root)!;
  const msg = $('[data-msg]', root)!;
  const state = { patties: 2, cheese: true, bacon: false, salad: true, side: 'none' };
  let front = 0, shownKey = '', pops = 0;
  const key = () => `p${state.patties}c${state.cheese ? 1 : 0}b${state.bacon ? 1 : 0}s${state.salad ? 1 : 0}`;
  const url = (k: string) => `${dir}b/${k}.webp`;
  const side = () => B.sides.find((s) => s.id === state.side)!;
  const cache = new Set<string>();
  const warm = (k: string) => { if (cache.has(k)) return; cache.add(k); const i = new Image(); i.src = url(k); };

  function totals() {
    let price = B.base.price + state.patties * B.patty.price, kcal = B.base.kcal + state.patties * B.patty.kcal, n = 1 + state.patties;
    B.toggles.forEach((t) => {
      if (!(state as unknown as Record<string, boolean>)[t.id]) return;
      const m = t.per === 'patty' ? state.patties : 1;
      price += t.price * m; kcal += t.kcal * m; n += m;
    });
    price += side().price; kcal += side().kcal;
    return { price, kcal, n };
  }
  function show(animate: boolean) {
    const k = key();
    const t = totals();
    $('[data-n]', root)!.textContent = String(t.n);
    $('[data-kcal]', root)!.textContent = `${t.kcal} kcal`;
    $('[data-total]', root)!.innerHTML = `&pound;${t.price.toFixed(2)}`;
    if (k === shownKey) return;
    shownKey = k;
    const next = imgs[1 - front], cur = imgs[front];
    const go = () => {
      front = 1 - front;
      if (reduce || !animate) { gsap.set(next, { opacity: 1 }); gsap.set(cur, { opacity: 0 }); return; }
      gsap.fromTo(next, { opacity: 0, y: -14, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power2.out' });
      gsap.to(cur, { opacity: 0, duration: 0.45, ease: 'power2.out' });
      gsap.fromTo(burger, { scaleY: 1 }, { scaleY: 0.975, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: '50% 100%' });
    };
    next.onload = go; next.src = url(k);
    if (next.complete && next.naturalWidth) go();
    [`p${state.patties}c${state.cheese ? 0 : 1}b${state.bacon ? 1 : 0}s${state.salad ? 1 : 0}`, `p${state.patties}c${state.cheese ? 1 : 0}b${state.bacon ? 0 : 1}s${state.salad ? 1 : 0}`, `p${state.patties}c${state.cheese ? 1 : 0}b${state.bacon ? 1 : 0}s${state.salad ? 0 : 1}`, `p${3 - state.patties}c${state.cheese ? 1 : 0}b${state.bacon ? 1 : 0}s${state.salad ? 1 : 0}`].forEach(warm);
    if (t.n >= 10 && !pops) { pops = 1; msg.textContent = 'Fully loaded! Absolute tower.'; celebrate(); }
  }
  function setSide() {
    const s = side();
    sidepic.innerHTML = s.img ? `<img src="${dir}${s.img}.webp" alt="" draggable="false">` : '';
    sidepic.classList.toggle('is-on', !!s.img);
    if (s.img && !reduce) gsap.fromTo(sidepic, { y: -80, opacity: 0, rotation: -8 }, { y: 0, opacity: 1, rotation: 0, duration: 0.6, ease: 'power3.out' });
  }
  const mark = (els: HTMLElement[], on: HTMLElement) => els.forEach((x) => { const is = x === on; x.classList.toggle('is-on', is); x.setAttribute('aria-pressed', String(is)); });

  $$('[data-bp]', root).forEach((b) => b.addEventListener('click', () => { state.patties = Number(b.dataset.bp); mark($$('[data-bp]', root), b); msg.textContent = ''; show(true); }));
  $$('[data-bt]', root).forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.bt as 'cheese' | 'bacon' | 'salad';
    state[id] = !state[id]; b.classList.toggle('is-on', state[id]); b.setAttribute('aria-pressed', String(state[id])); msg.textContent = ''; show(true);
  }));
  $$('[data-side]', root).forEach((b) => b.addEventListener('click', () => { state.side = b.dataset.side!; mark($$('[data-side]', root), b); setSide(); show(true); }));
  $('[data-clear]', root)!.addEventListener('click', () => {
    Object.assign(state, { patties: 2, cheese: true, bacon: false, salad: true, side: 'none' });
    $$('[data-bp]', root).forEach((x) => { const on = x.dataset.bp === '2'; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    $$('[data-bt]', root).forEach((x) => { const on = x.dataset.bt !== 'bacon'; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    $$('[data-side]', root).forEach((x) => { const on = x.dataset.side === 'none'; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    setSide(); msg.textContent = ''; pops = 0; show(true);
  });
  $('[data-send]', root)!.addEventListener('click', () => {
    const t = totals(); const s = side();
    const bits = [state.patties === 1 ? 'Single' : 'Double', state.cheese ? 'cheese' : 'no cheese', state.bacon ? 'bacon' : '', state.salad ? 'lettuce and pickles' : 'no salad'].filter(Boolean);
    const desc = bits.join(', ') + (s.img ? ` + ${s.name.toLowerCase()}` : '');
    addToCart({ key: 'build:' + desc, name: 'Your smash', desc, price: t.price, thumb: url(key()) }, burger);
    msg.textContent = 'Added to your cart.';
  });

  // first picture, no animation
  imgs[0].src = url(key()); imgs[0].style.opacity = '1'; imgs[1].style.opacity = '0'; shownKey = key();
  setSide(); show(false);
  [`p2c0b0s1`, `p1c1b0s1`, `p2c1b1s1`, `p2c1b0s0`].forEach(warm);
}
