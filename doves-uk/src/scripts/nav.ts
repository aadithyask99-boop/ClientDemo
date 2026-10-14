// Nav capsule: a sliding highlight follows the pointer or keyboard focus, and rests on the
// section currently in view. Hides itself when no nav section is in view.

const nav = document.querySelector<HTMLElement>('[data-nav]');
const ind = document.querySelector<HTMLElement>('[data-ind]');

if (nav && ind) {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[data-target]')];
  let active: HTMLAnchorElement | null = null;
  let hovered: HTMLAnchorElement | null = null;

  const place = () => {
    const target = hovered ?? active;
    if (!target) {
      ind.style.opacity = '0';
      return;
    }
    ind.style.width = `${target.offsetWidth}px`;
    ind.style.transform = `translateX(${target.offsetLeft}px)`;
    ind.style.opacity = '1';
  };

  const spy = () => {
    const mid = window.innerHeight * 0.45;
    let found: HTMLAnchorElement | null = null;
    for (const a of links) {
      const el = document.querySelector<HTMLElement>(a.dataset.target!);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) found = a;
    }
    if (found !== active) {
      active = found;
      links.forEach((a) => a.toggleAttribute('aria-current', a === active));
      place();
    }
  };

  links.forEach((a) => {
    a.addEventListener('pointerenter', () => {
      hovered = a;
      place();
    });
    a.addEventListener('focus', () => {
      hovered = a;
      place();
    });
    a.addEventListener('blur', () => {
      hovered = null;
      place();
    });
  });
  nav.addEventListener('pointerleave', () => {
    hovered = null;
    place();
  });

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          spy();
          ticking = false;
        });
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', () => {
    place();
    spy();
  });
  document.fonts?.ready.then(() => {
    place();
    spy();
  });
  spy();
}

export {};
