type Facial = { v: string; t: string; concern: string };

// The appointment request: a sentence the visitor completes. The quiz result and every Book link
// fill it in and scroll here. With PUBLIC_FORM_ENDPOINT set at build time it posts there as JSON,
// otherwise it runs in preview mode and sends nothing.
export function initRequest() {
  const root = document.querySelector<HTMLElement>('[data-req]');
  const form = root?.querySelector<HTMLFormElement>('[data-form]');
  if (!root || !form) return;
  const { facials } = JSON.parse(root.dataset.reqData ?? '{"facials":[]}') as { facials: Facial[] };
  const endpoint = root.dataset.endpoint ?? '';
  const section = root.closest<HTMLElement>('.req');
  const err = root.querySelector<HTMLElement>('[data-err]');
  const done = root.querySelector<HTMLElement>('[data-done]');

  const fits = [...form.querySelectorAll<HTMLElement>('.fit')];
  const size = (fit: HTMLElement) => {
    const el = fit.firstElementChild as HTMLInputElement | HTMLSelectElement | null;
    if (!el) return;
    const text = el instanceof HTMLSelectElement ? (el.selectedOptions[0]?.textContent ?? '') : el.value || el.placeholder;
    fit.dataset.v = text;
  };
  fits.forEach((fit) => {
    size(fit);
    fit.firstElementChild?.addEventListener('input', () => {
      size(fit);
      fit.classList.remove('bad');
    });
    fit.firstElementChild?.addEventListener('change', () => size(fit));
  });

  const field = (n: string) => form.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement;

  // Replace the browser's plain dropdowns with a styled list. The real <select> stays in place
  // (hidden) so the value, the form and no-JS behaviour all keep working.
  const back = document.createElement('div');
  back.className = 'menu-back';
  document.body.append(back);
  let openFit: HTMLElement | null = null;

  const close = () => {
    if (!openFit) return;
    openFit.classList.remove('open');
    openFit.querySelector('.pick')?.setAttribute('aria-expanded', 'false');
    back.classList.remove('on');
    openFit = null;
  };

  fits
    .filter((f) => f.classList.contains('sel'))
    .forEach((fit) => {
      const sel = fit.querySelector('select') as HTMLSelectElement;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pick';
      btn.setAttribute('aria-haspopup', 'listbox');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', sel.getAttribute('aria-label') ?? '');
      const menu = document.createElement('ul');
      menu.className = 'menu';
      menu.setAttribute('role', 'listbox');
      menu.setAttribute('aria-label', sel.getAttribute('aria-label') ?? '');

      const paint = () => {
        btn.textContent = sel.selectedOptions[0]?.textContent ?? '';
        [...menu.children].forEach((li, i) => {
          const on = i === sel.selectedIndex;
          li.setAttribute('aria-selected', String(on));
          li.classList.toggle('sel', on);
        });
        size(fit);
      };

      [...sel.options].forEach((o, i) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.tabIndex = -1;
        li.innerHTML = `<span class="menu__n">0${i + 1}</span><span>${o.textContent}</span>`;
        li.addEventListener('click', () => {
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          close();
          btn.focus();
        });
        menu.append(li);
      });

      sel.tabIndex = -1;
      sel.setAttribute('aria-hidden', 'true');
      fit.classList.add('enh');
      fit.append(btn, menu);
      sel.addEventListener('change', paint);
      paint();

      const focusItem = (i: number) => {
        const items = [...menu.children] as HTMLElement[];
        items[(i + items.length) % items.length]?.focus();
      };

      btn.addEventListener('click', () => {
        const wasOpen = openFit === fit;
        close();
        if (wasOpen) return;
        openFit = fit;
        fit.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        if (window.matchMedia('(max-width: 880px)').matches) back.classList.add('on');
        window.setTimeout(() => focusItem(sel.selectedIndex), 60);
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          btn.click();
        }
      });
      menu.addEventListener('keydown', (e) => {
        const items = [...menu.children] as HTMLElement[];
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          focusItem(i + 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          focusItem(i - 1);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          (document.activeElement as HTMLElement).click();
        } else if (e.key === 'Escape' || e.key === 'Tab') {
          close();
          if (e.key === 'Escape') btn.focus();
        }
      });
    });

  document.addEventListener('click', (e) => {
    if (openFit && !(e.target as Element).closest('.fit.open')) close();
  });
  back.addEventListener('click', close);

  // Choosing a facial also suggests the matching skin concern
  field('facial').addEventListener('change', () => {
    const f = facials.find((x) => x.v === field('facial').value);
    if (f) {
      field('concern').value = f.concern;
      field('concern').dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  const prefill = (id: string) => {
    const f = facials.find((x) => x.v === id);
    if (!f) return;
    field('facial').value = f.v;
    field('concern').value = f.concern;
    field('facial').dispatchEvent(new Event('change', { bubbles: true }));
    field('concern').dispatchEvent(new Event('change', { bubbles: true }));
    fits.forEach(size);
    section?.classList.remove('sent');
  };

  // Links and buttons that carry data-facial fill the sentence, then the page glides down to it
  document.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('[data-facial]');
    if (!t) return;
    prefill(t.dataset.facial ?? '');
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.addEventListener('ileife:request', (e) => {
    prefill((e as CustomEvent<{ facial: string }>).detail.facial);
    section?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = field('name').value.trim();
    const contact = field('contact').value.trim();
    fits.forEach((f) => f.classList.remove('bad'));
    if (!name || !contact) {
      if (!name) field('name').parentElement?.classList.add('bad');
      if (!contact) field('contact').parentElement?.classList.add('bad');
      if (err) err.textContent = 'Please add your name and a phone number or email so Princess can reply.';
      (name ? field('contact') : field('name')).focus();
      return;
    }
    if (err) err.textContent = '';

    const facial = facials.find((x) => x.v === field('facial').value)?.t ?? '';
    const concern = field('concern').value;
    const time = field('time').value;
    const note = (form.elements.namedItem('note') as HTMLTextAreaElement).value.trim();
    const message = `Hello Princess, I would like to book ${facial} for ${concern}. I am usually free ${time}. My name is ${name} and the best way to reach me is ${contact}.${note ? ` ${note}` : ''}`;

    let ok = true;
    if (endpoint) {
      try {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ name, contact, facial, concern, time, note, message }),
        });
        ok = r.ok;
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      if (err) err.textContent = 'That did not send. Please try again, or message ILÉ IFÉ on Instagram.';
      return;
    }

    const thanks = root.querySelector<HTMLElement>('[data-thanks]');
    const summary = root.querySelector<HTMLElement>('[data-summary]');
    const demo = root.querySelector<HTMLElement>('[data-demo]');
    if (thanks) thanks.textContent = `Thank you, ${name.split(' ')[0]}.`;
    if (summary) summary.textContent = `Princess will reply to ${contact} to confirm a time for ${facial}.`;
    if (demo) demo.hidden = Boolean(endpoint);
    section?.classList.add('sent');
  });

  done?.querySelector('[data-again]')?.addEventListener('click', () => section?.classList.remove('sent'));
}
