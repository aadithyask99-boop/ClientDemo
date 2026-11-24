// The quote sentence: tappable chips open a menu of big options; submit shows a confirmation (no backend in the concept)
// and offers a mailto fallback. Fires a "quote:sent" event on window for the purchase-order stamp easter egg.
import { site } from '../data/site';

type QData = { products: string[]; quantities: string[]; whens: string[]; defaults: Record<string, string> };
const lists: Record<string, keyof QData> = { product: 'products', quantity: 'quantities', when: 'whens' };

export default function initQuoteForms() {
  document.querySelectorAll<HTMLFormElement>('[data-qs]').forEach((form) => {
    const data: QData = JSON.parse(form.dataset.qsData || '{}');
    const menu = form.querySelector<HTMLElement>('[data-menu]')!;
    const state: Record<string, string> = { ...data.defaults };
    let open: HTMLElement | null = null;

    const close = () => { menu.hidden = true; open?.setAttribute('aria-expanded', 'false'); open = null; };
    const sentence = () => `I need ${state.product} (${state.quantity}) by ${state.when}.`;
    const set = (field: string, value: string, chip: HTMLElement) => {
      state[field] = value;
      chip.querySelector('[data-val]')!.textContent = value;
      chip.classList.remove('is-set'); void chip.offsetWidth; chip.classList.add('is-set');
    };

    form.querySelectorAll<HTMLElement>('.qs-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (open === chip) return close();
        close();
        const field = chip.dataset.field!;
        const opts = data[lists[field]] as string[];
        menu.innerHTML = '';
        opts.forEach((o) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'qs-opt'; b.role = 'option'; b.textContent = o;
          b.setAttribute('aria-selected', String(state[field] === o));
          b.addEventListener('click', () => { set(field, o, chip); close(); chip.focus(); });
          menu.appendChild(b);
        });
        if (field === 'quantity') {
          const own = document.createElement('div'); own.className = 'qs-own';
          own.innerHTML = '<input type="text" inputmode="numeric" placeholder="Or type a number" aria-label="Type a quantity">';
          const inp = own.querySelector('input')!;
          inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); const v = inp.value.replace(/\D/g, ''); if (v) { set(field, v, chip); close(); chip.focus(); } } });
          menu.appendChild(own);
        }
        // Position under the chip, kept inside the form
        const fr = form.getBoundingClientRect(), cr = chip.getBoundingClientRect();
        menu.hidden = false;
        const w = menu.offsetWidth;
        menu.style.left = `${Math.max(0, Math.min(cr.left - fr.left, fr.width - w))}px`;
        menu.style.top = `${cr.bottom - fr.top + 10}px`;
        chip.setAttribute('aria-expanded', 'true'); open = chip;
        (menu.querySelector('[aria-selected="true"]') as HTMLElement | null)?.focus({ preventScroll: true });
      });
    });
    document.addEventListener('click', (e) => { if (open && !menu.contains(e.target as Node)) close(); });
    form.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape' && open) { const c = open; close(); c.focus(); } });
    menu.addEventListener('keydown', (e) => {
      const items = [...menu.querySelectorAll<HTMLElement>('.qs-opt')]; const i = items.indexOf(document.activeElement as HTMLElement);
      if ((e as KeyboardEvent).key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
      if ((e as KeyboardEvent).key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const reply = form.querySelector<HTMLInputElement>('[data-reply]')!;
      const err = form.querySelector<HTMLElement>('[data-error]')!;
      if (!reply.value.trim()) { err.hidden = false; reply.focus(); return; }
      err.hidden = true; close();
      const done = form.querySelector<HTMLElement>('[data-done]')!;
      form.querySelector('[data-done-title]')!.textContent = site.quote.confirm;
      form.querySelector('[data-done-sentence]')!.textContent = sentence();
      const body = `${sentence()}\n\nReply to: ${reply.value.trim()}`;
      (form.querySelector('[data-mail]') as HTMLAnchorElement).href = `mailto:${site.contact.email}?subject=${encodeURIComponent('Quote request')}&body=${encodeURIComponent(body)}`;
      form.classList.add('is-sent'); done.hidden = false; done.focus();
      window.dispatchEvent(new CustomEvent('quote:sent', { detail: { ...state, reply: reply.value.trim() } }));
    });
  });
}
