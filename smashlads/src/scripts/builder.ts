import gsap from 'gsap';

// Burger layers drawn in code, so every layer fits the stack and works at any size.
const O = '#14162B'; // outline
const sv = (h: number, inner: string) => `<svg viewBox="0 0 300 ${h}" preserveAspectRatio="xMidYMid meet" stroke="${O}" stroke-width="3" stroke-linejoin="round">${inner}</svg>`;
export const ART: Record<string, { h: number; svg: string }> = {
  botbun: { h: 56, svg: sv(56, '<path d="M10 8 H290 V28 Q290 50 262 50 H38 Q10 50 10 28 Z" fill="#F0A94A"/><path d="M30 18 H270" stroke="#FFD08A" stroke-width="5" stroke-linecap="round"/>') },
  top: { h: 96, svg: sv(96, '<path d="M8 90 Q8 8 150 8 Q292 8 292 90 Z" fill="#F0A94A"/><path d="M40 60 Q70 24 120 20" stroke="#FFD08A" stroke-width="7" fill="none" stroke-linecap="round"/><g fill="#F3ECDD" stroke="none"><ellipse cx="96" cy="42" rx="9" ry="5" transform="rotate(-20 96 42)"/><ellipse cx="150" cy="26" rx="9" ry="5"/><ellipse cx="204" cy="42" rx="9" ry="5" transform="rotate(20 204 42)"/><ellipse cx="130" cy="58" rx="9" ry="5" transform="rotate(-10 130 58)"/><ellipse cx="178" cy="58" rx="9" ry="5" transform="rotate(10 178 58)"/></g>') },
  patty: { h: 42, svg: sv(42, '<path d="M12 8 Q150 2 288 8 Q298 22 288 36 Q150 42 12 36 Q2 22 12 8Z" fill="#5A2A1E"/><g stroke="none" fill="#7B3F2C"><circle cx="60" cy="20" r="4"/><circle cx="120" cy="26" r="4"/><circle cx="180" cy="16" r="4"/><circle cx="240" cy="24" r="4"/></g>') },
  cheese: { h: 34, svg: sv(34, '<path d="M6 6 H294 L282 20 L240 20 L226 32 L212 20 H18 Z" fill="#FFB400"/>') },
  bacon: { h: 28, svg: sv(28, '<path d="M8 10 Q38 0 68 10 T128 10 T188 10 T248 10 T292 10 V22 Q262 32 232 22 T172 22 T112 22 T52 22 T8 22 Z" fill="#D9473F"/><path d="M20 16 Q50 8 80 16 T140 16 T200 16 T260 16" stroke="#F4A59A" stroke-width="4" fill="none" stroke-linecap="round"/>') },
  lettuce: { h: 34, svg: sv(34, '<path d="M6 20 Q20 2 36 20 T66 20 T96 20 T126 20 T156 20 T186 20 T216 20 T246 20 T276 20 T294 20 V26 Q150 40 6 26 Z" fill="#67B346"/>') },
  tomato: { h: 28, svg: sv(28, '<path d="M14 6 H286 Q296 16 286 24 H14 Q4 16 14 6Z" fill="#E23B2E"/><g fill="#F58E80" stroke="none"><ellipse cx="60" cy="15" rx="12" ry="4"/><ellipse cx="120" cy="15" rx="12" ry="4"/><ellipse cx="180" cy="15" rx="12" ry="4"/><ellipse cx="240" cy="15" rx="12" ry="4"/></g>') },
  onion: { h: 26, svg: sv(26, '<path d="M10 6 H290 Q298 13 290 20 H10 Q2 13 10 6Z" fill="#EADCF5"/><path d="M30 13 H270" stroke="#B79AD6" stroke-width="4" stroke-linecap="round" stroke-dasharray="40 14"/>') },
  pickle: { h: 24, svg: sv(24, '<g fill="#7BA43A"><circle cx="44" cy="12" r="10"/><circle cx="104" cy="12" r="10"/><circle cx="164" cy="12" r="10"/><circle cx="224" cy="12" r="10"/><circle cx="266" cy="12" r="10"/></g>') },
  sauce: { h: 22, svg: sv(22, '<path d="M8 6 H292 Q296 12 288 14 L270 14 L262 21 L254 14 H40 L32 20 L26 14 H12 Q4 12 8 6Z" fill="#FF5A1F"/>') },
};

type Part = { id: string; name: string; price: number; kcal: number };
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];

export function initBuilder(reduce: boolean, celebrate: () => void) {
  const root = $('[data-build]');
  if (!root) return;
  const cfg = JSON.parse($('#parts')!.textContent || '{}') as { parts: Part[]; builder: { baseBun: { price: number; kcal: number }; maxLayers: number } };
  const parts = Object.fromEntries(cfg.parts.map((p) => [p.id, p]));
  const stack = $('[data-stack]', root)!;
  const drop = $('[data-drop]', root)!;
  const msg = $('[data-msg]', root)!;
  const state: string[] = [];
  let topOn = false;
  let celebrated = false;

  // chips show the layer art
  $$('[data-art]', root).forEach((el) => { el.innerHTML = ART[el.dataset.art!]?.svg || ''; });

  const mk = (id: string) => { const el = document.createElement('div'); el.className = 'layer'; el.dataset.id = id; el.innerHTML = ART[id].svg; el.style.aspectRatio = `300 / ${ART[id].h}`; return el; };
  const bun = mk('botbun'); bun.classList.add('is-base'); stack.appendChild(bun);

  function totals() {
    let price = cfg.builder.baseBun.price, kcal = cfg.builder.baseBun.kcal;
    state.forEach((id) => { price += parts[id].price; kcal += parts[id].kcal; });
    if (topOn) { price += parts.top.price; kcal += parts.top.kcal; }
    return { price, kcal, n: state.length + (topOn ? 1 : 0) };
  }
  function refresh() {
    const t = totals();
    $('[data-n]', root)!.textContent = String(t.n);
    $('[data-kcal]', root)!.textContent = `${t.kcal} kcal`;
    $('[data-price]', root)!.innerHTML = `&pound;${t.price.toFixed(2)}`;
    drop.classList.toggle('has-layers', t.n > 0);
    $('[data-part="top"]', root)?.classList.toggle('is-used', topOn);
    if (t.n >= 10 && !celebrated) { celebrated = true; msg.textContent = 'Ten layers! Absolute tower.'; celebrate(); }
  }
  function drip() { /* a small squash of the whole stack on landing */
    if (reduce) return;
    gsap.fromTo(stack, { scaleY: 1 }, { scaleY: 0.97, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: '50% 100%', ease: 'power1.out' });
  }
  function add(id: string) {
    msg.textContent = '';
    if (id === 'top') {
      if (topOn) return;
      topOn = true; const el = mk('top'); el.dataset.top = '1'; stack.appendChild(el); land(el); refresh(); return;
    }
    if (state.length >= cfg.builder.maxLayers) { msg.textContent = 'That is plenty! Take a layer off or send it.'; return; }
    state.push(id);
    const el = mk(id);
    const topEl = $('[data-top]', stack);
    topEl ? stack.insertBefore(el, topEl) : stack.appendChild(el);
    land(el); refresh();
  }
  function land(el: HTMLElement) {
    if (reduce) return;
    gsap.fromTo(el, { y: -(stack.getBoundingClientRect().height + 160), opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.in', onComplete: drip });
  }
  function removeLayer(el: HTMLElement) {
    if (el.classList.contains('is-base')) return;
    const done = () => {
      if (el.dataset.top) topOn = false;
      else { const nodes = $$('.layer', stack).filter((n) => !n.classList.contains('is-base') && !n.dataset.top); const i = nodes.indexOf(el); if (i > -1) state.splice(i, 1); }
      el.remove(); celebrated = state.length + (topOn ? 1 : 0) >= 10 ? celebrated : false; refresh();
    };
    reduce ? done() : gsap.to(el, { x: 160, opacity: 0, rotation: 10, duration: 0.35, ease: 'power2.in', onComplete: done });
  }
  stack.addEventListener('click', (e) => { const l = (e.target as HTMLElement).closest('.layer') as HTMLElement | null; if (l) removeLayer(l); });
  $('[data-clear]', root)!.addEventListener('click', () => { $$('.layer', stack).filter((n) => !n.classList.contains('is-base')).forEach((n) => n.remove()); state.length = 0; topOn = false; celebrated = false; msg.textContent = ''; refresh(); });
  $('[data-send]', root)!.addEventListener('click', () => { const t = totals(); msg.innerHTML = t.n < 2 ? 'Add a few layers first.' : `Order sent to the kitchen (concept): ${t.n} layers, &pound;${t.price.toFixed(2)}.`; });

  // drag a chip onto the stack, or tap it
  $$('.chip', root).forEach((chip) => {
    let sx = 0, sy = 0, ghost: HTMLElement | null = null, moved = false, id = chip.dataset.part!;
    chip.addEventListener('pointerdown', (e) => {
      chip.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; moved = false;
    });
    chip.addEventListener('pointermove', (e) => {
      if (!chip.hasPointerCapture(e.pointerId)) return;
      if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        moved = true; ghost = document.createElement('div'); ghost.className = 'is-ghost'; ghost.innerHTML = ART[id].svg; document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
        const r = drop.getBoundingClientRect();
        drop.classList.toggle('is-over', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 40 && e.clientY < r.bottom + 40);
      }
    });
    const end = (e: PointerEvent) => {
      if (!chip.hasPointerCapture(e.pointerId)) return;
      chip.releasePointerCapture(e.pointerId);
      const r = drop.getBoundingClientRect();
      const over = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 40 && e.clientY < r.bottom + 40;
      if (ghost) { ghost.remove(); ghost = null; drop.classList.remove('is-over'); if (over) add(id); }
      else add(id); // a tap
    };
    chip.addEventListener('pointerup', end);
    chip.addEventListener('pointercancel', () => { ghost?.remove(); ghost = null; drop.classList.remove('is-over'); });
    chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(id); } });
  });
  refresh();
}
