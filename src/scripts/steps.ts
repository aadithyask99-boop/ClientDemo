// How it works: starts the automatic 1 to 4 sequence when the section is on screen and pauses
// it when it is not. Reduced motion shows every step complete and still.

const root = document.querySelector<HTMLElement>('[data-steps]');

if (root) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    root.classList.add('static');
  } else {
    new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          root.classList.add('run');
          root.classList.remove('paused');
        } else {
          root.classList.add('paused');
        }
      },
      { threshold: 0.35 },
    ).observe(root);
  }
}

export {};
