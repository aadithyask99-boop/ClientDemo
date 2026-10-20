// Conversational enquiry. One question at a time, then validates, optionally posts to a
// form endpoint (PUBLIC_FORM_ENDPOINT) and hands the message to WhatsApp, matching the
// existing Doves flow. Without JavaScript the same fields show together as a normal form.

const form = document.querySelector<HTMLFormElement>('[data-enquiry]');

if (form) {
  const steps = [...form.querySelectorAll<HTMLElement>('[data-q]')];
  const dots = [...form.querySelectorAll<HTMLElement>('[data-dots] li')];
  const errorEl = form.querySelector<HTMLElement>('[data-error]')!;
  const back = form.querySelector<HTMLButtonElement>('[data-back]')!;
  const next = form.querySelector<HTMLButtonElement>('[data-next]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const sent = document.querySelector<HTMLElement>('[data-sent]')!;
  const waLink = document.querySelector<HTMLAnchorElement>('[data-wa-link]')!;
  const wa = form.dataset.wa ?? '';
  let i = 0;

  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | RadioNodeList;
  const val = (name: string) => String(new FormData(form).get(name) ?? '').trim();

  const rules: Record<string, () => string | null> = {
    // Either choosing a topic or writing a few words is enough to continue
    service: () => (val('service') || val('message') ? null : 'Please choose what you are asking about, or write a few words.'),
    name: () => (val('name') ? null : 'Please enter your full name.'),
    phone: () => (val('phone') ? null : 'Please enter a phone number we can reach you on.'),
    email: () => (!val('email') || /^\S+@\S+\.\S+$/.test(val('email')) ? null : 'That email address does not look right.'),
    message: () => null,
  };

  const clearError = () => {
    errorEl.hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid'));
  };

  const fail = (key: string, msg: string) => {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    const f = field(key);
    if (f instanceof HTMLInputElement) {
      f.setAttribute('aria-invalid', 'true');
      f.focus();
    }
  };

  function show(n: number, focus = true) {
    i = Math.max(0, Math.min(steps.length - 1, n));
    steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
    dots.forEach((d, k) => {
      d.classList.toggle('on', k < i);
      d.classList.toggle('now', k === i);
    });
    const last = i === steps.length - 1;
    back.hidden = i === 0;
    next.hidden = last;
    submit.hidden = !last;
    if (!last) {
      const optional = steps[i].hasAttribute('data-optional');
      const empty = !(steps[i].querySelector<HTMLInputElement>('input,textarea')?.value ?? '').trim();
      next.firstChild!.textContent = optional && empty ? 'Skip ' : 'Next ';
    }
    clearError();
    if (focus) steps[i].querySelector<HTMLElement>('input:not([type=radio]),textarea')?.focus();
  }

  function advance() {
    const key = steps[i].dataset.q!;
    const msg = rules[key]?.();
    if (msg) return fail(key, msg);
    show(i + 1);
  }

  form.classList.add('is-chat');
  show(0, false);

  next.addEventListener('click', advance);
  back.addEventListener('click', () => show(i - 1));

  steps.forEach((s) => {
    s.addEventListener('input', () => {
      clearError();
      if (steps[i].hasAttribute('data-optional') && i < steps.length - 1) {
        const empty = !(steps[i].querySelector<HTMLInputElement>('input,textarea')?.value ?? '').trim();
        next.firstChild!.textContent = empty ? 'Skip ' : 'Next ';
      }
    });
  });

  // The message box grows with what is typed, so no scroll bar appears
  const box = form.querySelector<HTMLTextAreaElement>('textarea');
  if (box) {
    const grow = () => {
      box.style.height = 'auto';
      box.style.height = `${box.scrollHeight}px`;
    };
    box.addEventListener('input', grow);
    grow();
  }

  form.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.key === 'Enter' && t instanceof HTMLInputElement && t.type !== 'radio' && i < steps.length - 1) {
      e.preventDefault();
      advance();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    for (let k = 0; k < steps.length; k++) {
      const key = steps[k].dataset.q!;
      const msg = rules[key]?.();
      if (msg) {
        show(k, false);
        return fail(key, msg);
      }
    }

    const service = val('service');
    const name = val('name');
    const phone = val('phone');
    const email = val('email');
    const message = val('message');

    const endpoint = form.dataset.endpoint ?? '';
    let emailed = false;
    if (endpoint) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: `Doves UK website enquiry: ${service || 'General'}`,
            ...(email ? { _replyto: email } : {}),
            name,
            phone,
            email,
            about: service,
            message,
          }),
        });
        emailed = res.ok;
      } catch {
        // The WhatsApp hand-off below still lets the person reach Doves.
      }
    }

    const lines = [
      'Hello Doves, I would like to make an enquiry.',
      `Name: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : '',
      service ? `About: ${service}` : '',
      message ? `Message: ${message}` : '',
    ].filter(Boolean);
    waLink.href = `${wa}?text=${encodeURIComponent(lines.join('\n'))}`;

    const note = sent.querySelector<HTMLElement>('[data-emailed]');
    if (note) note.hidden = !emailed;
    form.hidden = true;
    sent.hidden = false;
    const h = sent.querySelector<HTMLElement>('h3');
    h?.setAttribute('tabindex', '-1');
    h?.focus();
  });
}

export {};
