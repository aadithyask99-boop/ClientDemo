import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { q, qa, fine, reduced } from './util';

/* Each project plays as a short looping video in a black frame. At rest the picture is pixels (the video, still moving, as big blocks);
   hover it and the blocks shrink away until it is the real site; move off and it pixelates again. On touch there is no hover, so the picture
   resolves while the row is in the middle of the screen. Videos only load when close to the screen and only play while visible. */
const BLOCK_MAX = 24; // CSS pixels per block when fully pixelated

export function initWork() {
  const items = qa('[data-wi]');
  if (!items.length) return;
  gsap.registerPlugin(ScrollTrigger);

  items.forEach((item) => {
    const link = q('.wi__link', item)!;
    const frame = q('[data-frame]', item)!;
    const media = q('[data-media]', item)!;
    const video = q<HTMLVideoElement>('video', media)!;
    const poster = q<HTMLImageElement>('.wi__poster', media)!;
    const cv = q<HTMLCanvasElement>('.wi__px', media)!;
    const ctx = cv.getContext('2d')!;
    const off = document.createElement('canvas');
    const octx = off.getContext('2d')!;
    const st = { level: reduced ? 0 : 1 }; // 1 = fully pixelated, 0 = sharp
    let visible = false;
    let raf = 0;
    let dpr = 1;

    const fit = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      cv.width = Math.max(2, Math.round(media.clientWidth * dpr));
      cv.height = Math.max(2, Math.round(media.clientHeight * dpr));
    };

    function draw() {
      raf = 0;
      if (!visible) return;
      if (st.level <= 0.02) { cv.style.visibility = 'hidden'; return; } // sharp: the video itself shows
      const useVideo = video.readyState >= 2 && video.videoWidth > 0;
      const sw0 = useVideo ? video.videoWidth : poster.naturalWidth;
      const sh0 = useVideo ? video.videoHeight : poster.naturalHeight;
      if (!sw0 || !sh0) { raf = requestAnimationFrame(draw); return; }
      const block = 1 + Math.pow(st.level, 1.3) * (BLOCK_MAX - 1);
      const bw = Math.max(2, Math.round(cv.width / (block * dpr)));
      const bh = Math.max(2, Math.round(cv.height / (block * dpr)));
      if (off.width !== bw || off.height !== bh) { off.width = bw; off.height = bh; }
      // crop the picture to the frame the way object-fit: cover does
      const fr = cv.width / cv.height;
      let sx = 0, sy = 0, sw = sw0, sh = sh0;
      if (sw0 / sh0 > fr) { sw = sh0 * fr; sx = (sw0 - sw) / 2; } else { sh = sw0 / fr; sy = (sh0 - sh) / 2; }
      octx.drawImage(useVideo ? video : poster, sx, sy, sw, sh, 0, 0, bw, bh);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, bw, bh, 0, 0, cv.width, cv.height);
      cv.style.visibility = 'visible';
      raf = requestAnimationFrame(draw); // keep going while pixelated so the mosaic moves with the video
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const setLevel = (to: number, dur: number) => {
      if (reduced) return;
      gsap.to(st, { level: to, duration: dur, ease: to === 0 ? 'power2.out' : 'power2.inOut', overwrite: true, onUpdate: schedule, onStart: schedule });
    };

    fit();
    new ResizeObserver(() => { fit(); schedule(); }).observe(media);
    video.addEventListener('playing', () => video.classList.add('is-playing'));

    // This runs after the headline has painted (main.ts), so none of this competes with it. The picture and then the video are fetched when the
    // row is near the screen; the video plays only while the row is on screen.
    new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      if (!poster.getAttribute('src') && poster.dataset.src) {
        poster.src = poster.dataset.src;
        poster.addEventListener('load', schedule, { once: true });
      }
      if (!video.getAttribute('src') && video.dataset.video && !reduced) { video.src = video.dataset.video; video.load(); }
    }), { rootMargin: '900px 0px' }).observe(item);
    new IntersectionObserver((es) => es.forEach((e) => {
      visible = e.isIntersecting;
      if (visible) { if (!reduced) void video.play().catch(() => undefined); schedule(); } else video.pause();
    }), { threshold: 0.15 }).observe(item);

    // what drives the pixels to sharp: the pointer on a mouse; the row reaching the middle of the screen on touch
    if (fine) {
      link.addEventListener('pointerenter', () => setLevel(0, 0.8));
      link.addEventListener('pointerleave', () => setLevel(1, 0.6));
      link.addEventListener('focusin', () => setLevel(0, 0.8));
      link.addEventListener('focusout', () => setLevel(1, 0.6));
      if (!reduced) gsap.fromTo(frame, { scale: 0.9, y: 50 }, { scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: item, start: 'top 92%', end: 'top 45%', scrub: true } });
    } else {
      new IntersectionObserver((es) => es.forEach((e) => setLevel(e.isIntersecting ? 0 : 1, 0.7)), { rootMargin: '-30% 0px -30% 0px' }).observe(item);
    }
    schedule();
  });
}
