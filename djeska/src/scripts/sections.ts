import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { brand } from '../data/site';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Titles slide up line by line, rows and images ease in */
if (!reduce) {
  document.fonts.ready.then(() => {
    document.querySelectorAll<HTMLElement>('[data-title]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.1,
            ease: 'power4.out',
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }),
      });
    });
    ScrollTrigger.refresh();
  });

  document.querySelectorAll<HTMLElement>('[data-reveal-img] img').forEach((img) => {
    gsap.to(img, { scale: 1, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: img, start: 'top 88%', once: true } });
  });
  ScrollTrigger.batch('.rows li, .tiers li, .mix', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }),
  });
} else {
  document.querySelectorAll<HTMLElement>('.rows li, .tiers li, .mix').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
}

/* Current section in the nav */
const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav] a')];
const glide = document.querySelector<HTMLElement>('[data-glide]');
const secs = links.map((a) => document.querySelector<HTMLElement>(a.getAttribute('href') || ''));
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const i = secs.indexOf(e.target as HTMLElement);
      if (i < 0) return;
      links[i].setAttribute('aria-current', 'true');
      if (glide && fine && !document.querySelector('[data-nav]:hover')) {
        glide.style.opacity = '1';
        glide.style.width = `${links[i].offsetWidth}px`;
        glide.style.transform = `translateX(${links[i].offsetLeft}px)`;
      }
    });
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
secs.forEach((s) => s && io.observe(s));
const enq = document.querySelector('#enquire');
if (enq) new IntersectionObserver(([e]) => { if (e.isIntersecting && glide) { glide.style.opacity = '0'; links.forEach((a) => a.removeAttribute('aria-current')); } }, { rootMargin: '-45% 0px -50% 0px' }).observe(enq);
const hero = document.querySelector('[data-hero]');
if (hero) new IntersectionObserver(([e]) => { if (e.isIntersecting && glide) { glide.style.opacity = '0'; links.forEach((a) => a.removeAttribute('aria-current')); } }, { threshold: 0.6 }).observe(hero);

/* Rooms list: a photo follows the cursor */
const list = document.querySelector<HTMLElement>('[data-played]');
const peek = document.querySelector<HTMLElement>('[data-peek]');
if (list && peek && fine && !reduce) {
  const imgs = [...peek.querySelectorAll<HTMLElement>('[data-peek-img]')];
  const xTo = gsap.quickTo(peek, 'x', { duration: 0.6, ease: 'power3.out' });
  const yTo = gsap.quickTo(peek, 'y', { duration: 0.6, ease: 'power3.out' });
  const show = (on: boolean) => gsap.to(peek, { opacity: on ? 1 : 0, scale: on ? 1 : 0.92, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
  list.addEventListener('pointermove', (e) => { xTo(e.clientX + 36); yTo(e.clientY - 130); });
  list.querySelectorAll<HTMLElement>('li').forEach((li) => {
    li.addEventListener('pointerenter', () => {
      imgs.forEach((i) => i.classList.toggle('is-on', i.dataset.peekImg === li.dataset.photo));
      show(true);
    });
  });
  list.addEventListener('pointerleave', () => show(false));
}

/* Package buttons preselect the package in the form */
document.querySelectorAll<HTMLElement>('[data-package]').forEach((a) => {
  a.addEventListener('click', () => {
    const sel = document.querySelector<HTMLSelectElement>('[name="package"]');
    if (sel) { sel.value = a.dataset.package || ''; fitBlanks(); }
  });
});

/* Sentence form: inputs grow with their text, submit builds a WhatsApp message */
const form = document.querySelector<HTMLFormElement>('[data-enquire]');
function fitBlanks() {
  form?.querySelectorAll<HTMLInputElement>('input[type="text"]').forEach((i) => {
    i.style.setProperty('--w', `${Math.max(i.value.length, i.placeholder.length * 0.9, 5) + 1}ch`);
  });
}
function message(f: HTMLFormElement) {
  const v = (n: string) => (f.elements.namedItem(n) as HTMLInputElement).value.trim();
  const pkg = v('package');
  const parts = [
    `Hi, ${v('name') ? `I am ${v('name')} and ` : ''}I am planning a ${v('event')}${v('date') ? ` on ${v('date')}` : ''}${v('place') ? ` at ${v('place')}` : ''}.`,
    pkg ? `I am looking at the ${pkg} package.` : 'I am not sure which package yet.',
    'Is the date free?',
  ];
  return parts.join(' ');
}
if (form) {
  fitBlanks();
  form.addEventListener('input', fitBlanks);
  const mail = form.querySelector<HTMLAnchorElement>('[data-mailto]');
  const refreshMail = () => { if (mail) mail.href = `mailto:${brand.email}?subject=${encodeURIComponent('Date enquiry')}&body=${encodeURIComponent(message(form))}`; };
  form.addEventListener('input', refreshMail);
  refreshMail();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    window.open(`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message(form))}`, '_blank', 'noopener');
  });
}

/* Video: click to play or pause in place */
const reel = document.querySelector<HTMLElement>('[data-reel]');
const vid = reel?.querySelector<HTMLVideoElement>('[data-reel-video]');
reel?.querySelector('[data-reel-play]')?.addEventListener('click', () => {
  if (!vid) return;
  if (vid.paused) { vid.play().then(() => reel.classList.add('is-playing')).catch(() => {}); }
  else { vid.pause(); reel.classList.remove('is-playing'); }
});
