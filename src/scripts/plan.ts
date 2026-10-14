// Doves Global Plan: the family video loads only when the section is near, plays while it is
// on screen and pauses off screen. Poster only for reduced motion, Save-Data or a refused play.

const plan = document.querySelector<HTMLElement>('[data-plan]');
const video = document.querySelector<HTMLVideoElement>('[data-video]');

if (plan && video) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  const saveData = !!conn?.saveData;

  if (!reduce && !saveData) {
    let loaded = false;
    const narrow = window.matchMedia('(max-width: 899px)');

    const ensureLoaded = () => {
      if (loaded) return;
      loaded = true;
      video.src = narrow.matches ? video.dataset.sd! : video.dataset.hd!;
      video.load();
    };

    const play = () => {
      ensureLoaded();
      const p = video.play();
      if (p) p.catch(() => undefined);
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) play();
          else video.pause();
        },
        { rootMargin: '200px 0px' },
      ).observe(plan);
    } else {
      play();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause();
      else if (loaded) {
        const r = plan.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) play();
      }
    });
  }
}

export {};
