import gsap from 'gsap';

export type CartItem = { key: string; name: string; desc?: string; price: number; thumb?: string };
type Line = CartItem & { qty: number };
const lines: Line[] = [];
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const money = (n: number) => '&pound;' + n.toFixed(2);
let reduceMotion = false;
let panel: HTMLElement, list: HTMLElement, badge: HTMLElement, totalEl: HTMLElement, btn: HTMLElement, msg: HTMLElement;
let open = false;

function render() {
  const count = lines.reduce((a, l) => a + l.qty, 0);
  badge.textContent = String(count);
  badge.classList.toggle('is-on', count > 0);
  const total = lines.reduce((a, l) => a + l.qty * l.price, 0);
  totalEl.innerHTML = money(total);
  list.innerHTML = lines.length ? '' : '<li class="cart__empty">Your cart is empty. Add a burger from the menu or build your own.</li>';
  lines.forEach((l, i) => {
    const li = document.createElement('li'); li.className = 'cart__line';
    li.innerHTML = `${l.thumb ? `<img src="${l.thumb}" alt="" width="64" height="48">` : ''}<div class="cart__t"><b>${l.name}</b>${l.desc ? `<span>${l.desc}</span>` : ''}</div><div class="cart__q"><button type="button" aria-label="One less" data-d="-1" data-i="${i}">&minus;</button><b>${l.qty}</b><button type="button" aria-label="One more" data-d="1" data-i="${i}">+</button></div><span class="cart__p">${money(l.qty * l.price)}</span>`;
    list.appendChild(li);
  });
}
export function toggleCart(force?: boolean) {
  open = force ?? !open;
  panel.classList.toggle('is-open', open);
  panel.setAttribute('aria-hidden', String(!open));
  btn.setAttribute('aria-expanded', String(open));
  if (open) { msg.textContent = ''; if (!reduceMotion) gsap.fromTo(panel, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }); }
}
export function addToCart(item: CartItem, from?: HTMLElement) {
  const hit = lines.find((l) => l.key === item.key);
  hit ? (hit.qty += 1) : lines.push({ ...item, qty: 1 });
  render();
  // a copy of the thing flies into the cart button
  if (from && !reduceMotion) {
    const r = from.getBoundingClientRect(), t = btn.getBoundingClientRect();
    const fly = document.createElement('div'); fly.className = 'cart__fly';
    fly.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;${item.thumb ? `background-image:url(${item.thumb})` : ''}`;
    document.body.appendChild(fly);
    gsap.to(fly, { x: t.left + t.width / 2 - (r.left + r.width / 2), y: t.top + t.height / 2 - (r.top + r.height / 2), scale: 0.25, rotation: 200, duration: 0.8, ease: 'power3.in', onComplete: () => { fly.remove(); gsap.fromTo(btn, { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }); } });
  } else if (!reduceMotion) gsap.fromTo(btn, { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
}
export function initCart(reduce: boolean) {
  reduceMotion = reduce;
  panel = $('[data-cart]')!; list = $('[data-cart-list]')!; badge = $('[data-cart-count]')!; totalEl = $('[data-cart-total]')!; btn = $('[data-cart-btn]')!; msg = $('[data-cart-msg]')!;
  btn.addEventListener('click', () => toggleCart());
  $('[data-cart-close]')!.addEventListener('click', () => toggleCart(false));
  list.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button'); if (!b) return;
    const i = Number(b.dataset.i), d = Number(b.dataset.d);
    lines[i].qty += d; if (lines[i].qty <= 0) lines.splice(i, 1); render();
  });
  $('[data-cart-go]')!.addEventListener('click', () => { msg.textContent = lines.length ? 'This is a concept, so nothing is charged. Thank you!' : 'Add something first.'; if (lines.length) { lines.length = 0; render(); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleCart(false); });
  // any "Add" button on the menu cards
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('[data-add]') as HTMLElement | null; if (!a) return;
    addToCart({ key: 'menu:' + a.dataset.name, name: a.dataset.name!, price: Number(a.dataset.price), thumb: a.dataset.thumb }, (a.closest('.card')?.querySelector('.card__stage img') as HTMLElement) || a);
  });
  render();
}
