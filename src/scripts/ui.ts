// Header state, mobile menu and quiet scroll reveal.

const header = document.querySelector<HTMLElement>('[data-header]');
const btn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
const menu = document.querySelector<HTMLElement>('[data-menu]');

// The capsules float over the hero, then turn to white glass once the page has scrolled.
// The bare logo is white over dark sections (hero, plan video) and blue over light ones.
if (header) {
  let ticking = false;
  const brand = header.querySelector<HTMLElement>('.brand');
  const dark = [...document.querySelectorAll<HTMLElement>('[data-tone="dark"]')];
  const update = () => {
    header.classList.toggle('is-solid', window.scrollY > 40);
    if (brand) {
      // Split the logo at the section edge: white where a dark section is under it, blue elsewhere
      const b = brand.querySelector<HTMLElement>('.logo--w')!.getBoundingClientRect();
      let a0 = 0;
      let a1 = 0;
      for (const d of dark) {
        const r = d.getBoundingClientRect();
        const s = Math.max(0, r.top - b.top);
        const e = Math.min(b.height, r.bottom - b.top);
        if (e - s > a1 - a0) {
          a0 = s;
          a1 = e;
        }
      }
      const h = b.height;
      let w = 'inset(100% 0 0 0)';
      let bl = 'inset(0)';
      if (a1 - a0 >= h - 0.5) {
        w = 'inset(0)';
        bl = 'inset(100% 0 0 0)';
      } else if (a1 > a0 && a0 <= 0.5) {
        w = `inset(0 0 ${(h - a1).toFixed(1)}px 0)`;
        bl = `inset(${a1.toFixed(1)}px 0 0 0)`;
      } else if (a1 > a0) {
        w = `inset(${a0.toFixed(1)}px 0 0 0)`;
        bl = `inset(0 0 ${(h - a0).toFixed(1)}px 0)`;
      }
      brand.style.setProperty('--clip-w', w);
      brand.style.setProperty('--clip-b', bl);
    }
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

if (btn && menu) {
  const setOpen = (open: boolean) => {
    btn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    header?.classList.toggle('menu-open', open);
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
  window.matchMedia('(min-width: 1000px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

// One-shot "draw" trigger for the map line
const draws = document.querySelectorAll<HTMLElement>('[data-draw]');
if ('IntersectionObserver' in window) {
  const dio = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('drawn');
          dio.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.35 },
  );
  draws.forEach((d) => dio.observe(d));
} else {
  draws.forEach((d) => d.classList.add('drawn'));
}

const items = document.querySelectorAll<HTMLElement>('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
  );
  items.forEach((item) => io.observe(item));
} else {
  items.forEach((item) => item.classList.add('in'));
}

export {};
