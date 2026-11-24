// Easter eggs, loaded last and lazily. All three work with a keyboard or mouse and on touch.
// 1 Type "chromebook" (touch: long-press anything marked data-egg="chromebook"): a charging trolley rolls across the bottom, its laptops light one by one.
// 2 A rubber stamp slams "RECEIVED" when a quote is sent, or when the pointer rests on the send button for two seconds (sound only after a deliberate click).
// 3 Keep pushing at the very bottom (touch: overscroll): a van crosses the footer strip and leaves a parcel by the wordmark.
// Under reduced motion only the stamp appears (without movement). The cut-outs below are traced outlines of the studio photographs, drawn as clip paths.
import { gsap, reduced, media } from './core';
import { site } from '../data/site';

const SHAPES: Record<string, { x: number; y: number; w: number; h: number; d: string }> = {
  van: { x: 242, y: 212, w: 933, h: 387, d: 'M39 10 35 26 31 56 29 61 23 121 21 124 21 132 18 135 17 140 17 155 16 156 17 180 14 183 15 185 14 216 17 220 16 234 0 282 1 305 14 314 28 319 34 318 45 322 50 321 56 323 58 326 58 332 72 333 85 358 99 372 118 382 141 386 142 385 152 385 164 382 177 376 183 372 197 358 205 344 208 335 213 332 704 332 709 335 712 344 720 358 734 372 753 382 776 386 796 383 818 372 832 358 845 332 848 331 852 332 932 332 932 328 926 327 924 324 924 321 930 308 925 281 921 217 918 212 920 207 915 199 909 193 908 190 903 187 901 179 897 174 897 170 894 163 885 153 881 152 878 148 870 146 863 142 860 142 832 132 825 131 823 128 818 125 812 127 802 125 795 122 789 121 784 122 779 120 772 113 768 115 760 113 754 107 752 107 747 102 745 102 742 98 738 97 732 93 729 89 717 83 716 81 692 66 689 62 682 59 680 56 669 51 658 44 657 42 655 42 654 40 649 39 648 37 642 35 640 32 631 29 627 25 621 24 619 21 614 20 612 16 610 17 603 16 601 12 593 13 589 11 573 8 535 4 514 4 501 2 405 1 404 0 194 0 193 1 146 1 145 2 90 2 81 4 64 4 59 1Z' },
  trolley: { x: 232, y: 74, w: 789, h: 644, d: 'M774 39 768 36 734 29 729 26 727 27 721 26 718 24 717 25 695 19 686 18 676 14 674 15 670 13 666 13 662 11 662 1 649 0 639 6 612 5 603 7 588 7 575 9 536 11 525 13 512 13 460 18 396 22 385 24 318 28 296 32 280 31 269 34 268 33 252 33 246 34 243 36 226 35 206 37 203 39 191 39 190 40 189 39 179 39 177 40 177 56 176 57 156 57 139 55 108 56 107 55 60 55 59 54 3 54 1 55 1 513 0 519 7 521 24 519 32 520 36 519 75 519 76 518 111 519 124 517 163 518 168 516 173 516 174 517 173 518 173 530 204 533 208 538 207 540 196 541 193 539 183 541 184 546 190 547 192 550 196 552 195 557 193 558 193 560 195 561 193 562 191 567 191 581 194 590 201 599 212 605 232 605 234 604 234 602 232 601 236 598 241 591 244 582 244 570 241 562 242 560 319 560 323 570 330 578 335 581 343 583 356 582 356 580 365 572 370 560 586 560 599 562 613 562 620 563 621 564 619 565 619 567 622 569 618 571 617 574 614 576 614 613 609 618 605 618 600 614 593 600 589 595 587 594 585 595 583 600 582 599 585 591 583 582 581 581 580 582 577 579 564 579 563 578 556 579 525 578 518 580 515 578 500 578 499 579 493 577 476 577 467 579 467 581 469 582 498 582 499 581 501 583 497 585 486 586 466 591 415 599 348 598 338 600 248 601 246 602 246 604 248 605 420 604 421 607 423 608 486 608 487 609 579 616 583 618 587 628 596 637 608 642 631 642 633 643 635 642 635 638 632 636 639 629 644 619 645 605 640 590 633 582 625 577 625 570 622 568 626 564 635 563 638 560 641 562 644 560 645 563 651 567 661 566 663 560 703 560 704 561 702 562 702 567 701 568 699 567 696 569 693 578 693 586 696 596 706 608 706 610 708 611 712 611 717 614 724 615 736 613 736 611 743 607 751 598 753 590 753 578 751 571 741 558 735 555 734 546 739 543 751 540 753 543 756 544 761 538 769 537 774 534 773 486 774 479 776 477 779 466 783 463 785 457 784 441 786 433 786 410 787 409 787 386 788 385 788 334 786 318 781 298 779 297 780 288 773 287 773 162 774 161 773 58 774 57Z' },
  parcel: { x: 302, y: 144, w: 769, h: 506, d: 'M0 89 486 0 769 89 769 364 760 372 254 506 5 369Z' },
};


const TROLLEY_LEDS = Array.from({ length: 10 }, (_, i) => ({ x: 464 + i * 38.5, y: 578 + i * 2 }));
let styled = false;
let busy = { trolley: false, stamp: false, van: false };
let vanDone = false;

function injectCss() {
  if (styled) return; styled = true;
  const s = document.createElement('style');
  s.textContent = `
  .egg-trolley { position: fixed; left: 0; bottom: 10px; width: clamp(190px, 17vw, 300px); z-index: 40; pointer-events: none; will-change: transform; }
  .egg-trolley .egg-bob { position: relative; filter: drop-shadow(0 12px 10px rgba(0,0,0,0.38)); }
  .egg-trolley svg, .egg-van svg, .egg-parcel svg { display: block; width: 100%; height: auto; overflow: visible; }
  .egg-led { position: absolute; width: 2.5%; aspect-ratio: 1; margin: -1.25% 0 0 -1.25%; border-radius: 50%; background: #8dffa8; opacity: 0; box-shadow: 0 0 6px 3px rgba(80,255,130,0.85), 0 0 18px 6px rgba(80,255,130,0.4); }
  .egg-van { position: absolute; bottom: 4px; left: 0; width: clamp(250px, 26vw, 440px); will-change: transform; }
  .egg-van .egg-flip { transform: scaleX(-1); filter: drop-shadow(0 10px 8px rgba(0,0,0,0.5)); }
  .egg-parcel { position: absolute; bottom: 6px; width: clamp(64px, 6.4vw, 110px); filter: drop-shadow(0 8px 6px rgba(0,0,0,0.45)); pointer-events: none; }
  .egg-stamp-wrap { position: fixed; inset: 0; z-index: 250; display: grid; place-items: center; pointer-events: none; }
  .egg-stamp { font-family: 'Host Grotesk Variable', 'Host Grotesk', system-ui, sans-serif; font-size: clamp(40px, 7.4vw, 96px); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; line-height: 1;
    color: var(--b); background: rgba(242,240,235,0.985); padding: 0.26em 0.5em 0.3em; border: 0.1em solid var(--b); border-radius: 0.2em;
    box-shadow: inset 0 0 0 0.06em rgba(242,240,235,0.985), inset 0 0 0 0.1em var(--b), 0 30px 60px -24px rgba(0,0,0,0.55); transform: rotate(-8deg); opacity: 0; }
  .foot-ping.is-on { opacity: 1; }
  `;
  document.head.appendChild(s);
}

const cutout = (key: string, img: string) => {
  const s = SHAPES[key], id = `eg-clip-${key}`;
  return `<svg viewBox="0 0 ${s.w} ${s.h}" aria-hidden="true" focusable="false"><defs><clipPath id="${id}"><path d="${s.d}"/></clipPath></defs><g clip-path="url(#${id})"><image href="${media(img)}" x="${-s.x}" y="${-s.y}" width="1376" height="768"/></g></svg>`;
};

// 1. The charging trolley
function trolley() {
  if (reduced || busy.trolley) return;
  busy.trolley = true; injectCss();
  const s = SHAPES.trolley;
  const el = document.createElement('div');
  el.className = 'egg-trolley'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="egg-bob">${cutout('trolley', 'obj-trolley')}${TROLLEY_LEDS.map((l) => `<i class="egg-led" style="left:${(((l.x - s.x) / s.w) * 100).toFixed(2)}%;top:${(((l.y - s.y) / s.h) * 100).toFixed(2)}%"></i>`).join('')}</div>`;
  document.body.appendChild(el);
  const w = el.offsetWidth;
  const bob = el.querySelector('.egg-bob')!;
  const leds = el.querySelectorAll('.egg-led');
  const tl = gsap.timeline({ onComplete: () => { el.remove(); busy.trolley = false; } });
  tl.fromTo(el, { x: -w * 1.15 }, { x: innerWidth + w * 0.15, duration: 4, ease: 'sine.inOut' }, 0)
    .to(bob, { y: -2.5, duration: 0.12, yoyo: true, repeat: 32, ease: 'sine.inOut' }, 0)
    .to(leds, { opacity: 1, duration: 0.18, stagger: 0.27 }, 0.6);
}

// 2. The rubber stamp
let audio: AudioContext | null = null;
let clickedAt = -1e9;
function arm() {
  clickedAt = performance.now();
  try {
    if (!audio) audio = new (window.AudioContext || (window as any).webkitAudioContext)();
    audio.resume();
  } catch { audio = null; }
}
function thud() {
  if (!audio || performance.now() - clickedAt > 3000) return;
  try {
    const t = audio.currentTime;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(g).connect(audio.destination); o.start(t); o.stop(t + 0.26);
    const n = audio.createBufferSource(), nb = audio.createBuffer(1, audio.sampleRate * 0.08, audio.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const lp = audio.createBiquadFilter(), ng = audio.createGain(); lp.type = 'lowpass'; lp.frequency.value = 600; ng.gain.value = 0.07;
    n.buffer = nb; n.connect(lp).connect(ng).connect(audio.destination); n.start(t);
  } catch { /* sound is a bonus */ }
}
function stamp(withSound: boolean) {
  if (busy.stamp) return;
  busy.stamp = true; injectCss();
  const wrap = document.createElement('div'); wrap.className = 'egg-stamp-wrap'; wrap.setAttribute('aria-hidden', 'true');
  const st = document.createElement('div'); st.className = 'egg-stamp'; st.textContent = site.uiC.stamp;
  wrap.appendChild(st); document.body.appendChild(wrap);
  const done = () => { wrap.remove(); busy.stamp = false; };
  if (reduced) { st.style.opacity = '1'; setTimeout(done, 1600); return; }
  gsap.timeline({ onComplete: done })
    .fromTo(st, { scale: 1.6, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: -8, duration: 0.25, ease: 'back.out(2.4)', onComplete: () => { if (withSound) thud(); } })
    .fromTo(wrap, { y: 0 }, { y: 5, duration: 0.05, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.2)
    .to(st, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 1.85);
}

// 3. The van at the bottom of the page
function van() {
  if (reduced || busy.van || vanDone) return;
  const strip = document.querySelector<HTMLElement>('[data-van]');
  if (!strip) return;
  busy.van = true; vanDone = true; injectCss();
  const el = document.createElement('div'); el.className = 'egg-van'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="egg-flip">${cutout('van', 'obj-van')}</div>`;
  const parcel = document.createElement('div'); parcel.className = 'egg-parcel'; parcel.setAttribute('aria-hidden', 'true');
  parcel.innerHTML = cutout('parcel', 'obj-parcel');
  strip.append(parcel, el);
  const sw = strip.clientWidth, vw = el.offsetWidth;
  const dropX = sw * 0.7; // the parcel is left by the right-hand end of the wordmark
  parcel.style.left = `${dropX - parcel.offsetWidth / 2}px`;
  gsap.set(parcel, { opacity: 0 });
  const tl = gsap.timeline({ onComplete: () => { el.remove(); busy.van = false; } });
  tl.fromTo(el, { x: sw + vw * 0.1 }, { x: -vw * 1.15, duration: 3.6, ease: 'power1.inOut' }, 0)
    .to(el, { y: -2, duration: 0.14, yoyo: true, repeat: 24, ease: 'sine.inOut' }, 0)
    .fromTo(parcel, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'bounce.out' }, 1.0);
  document.querySelector('[data-ping]')?.classList.remove('is-on');
}

export default function init() {
  injectCss();

  // 1. type "chromebook", or long-press an element marked data-egg="chromebook"
  let buf = '';
  window.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.matches('input, textarea, select') || t.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-10);
    if (buf === 'chromebook') { buf = ''; trolley(); }
  });
  let press: number | undefined, px = 0, py = 0, fired = false;
  document.addEventListener('pointerdown', (e) => {
    const t = (e.target as HTMLElement).closest('[data-egg="chromebook"]');
    if (!t) return;
    px = e.clientX; py = e.clientY; fired = false;
    press = window.setTimeout(() => { fired = true; trolley(); }, 700);
  });
  const cancel = () => { if (press) clearTimeout(press); press = undefined; };
  document.addEventListener('pointerup', cancel);
  document.addEventListener('pointercancel', cancel);
  document.addEventListener('pointermove', (e) => { if (press && Math.hypot(e.clientX - px, e.clientY - py) > 12) cancel(); });
  document.addEventListener('contextmenu', (e) => { if (fired && (e.target as HTMLElement).closest('[data-egg="chromebook"]')) e.preventDefault(); });

  // 2. the stamp: on a sent quote, or after resting on the send button for two seconds
  document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('.qs [data-send]')) arm(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.target as HTMLElement).closest?.('.qs')) arm(); }, true);
  window.addEventListener('quote:sent', () => stamp(true));
  let rest: number | undefined;
  document.addEventListener('pointerover', (e) => {
    const b = (e.target as HTMLElement).closest('.qs [data-send]');
    if (!b || (e as PointerEvent).pointerType === 'touch') return;
    clearTimeout(rest); rest = window.setTimeout(() => stamp(false), 2000);
  });
  document.addEventListener('pointerout', (e) => { if ((e.target as HTMLElement).closest('.qs [data-send]')) clearTimeout(rest); });

  // 3. keep pushing at the very bottom
  const atBottom = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 3;
  let pushFrom = 0, lastPush = 0;
  const push = () => {
    const now = performance.now();
    if (!atBottom()) { pushFrom = 0; return; }
    if (!pushFrom || now - lastPush > 520) pushFrom = now;
    lastPush = now;
    if (now - pushFrom >= 1200) { pushFrom = 0; van(); }
  };
  window.addEventListener('wheel', (e) => { if (e.deltaY > 0) push(); else pushFrom = 0; }, { passive: true });
  let ty = 0;
  window.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; pushFrom = 0; }, { passive: true });
  window.addEventListener('touchmove', (e) => { const y = e.touches[0].clientY; if (y < ty - 2) push(); ty = y; }, { passive: true });
  window.addEventListener('touchend', () => { pushFrom = 0; }, { passive: true });
  window.addEventListener('keydown', (e) => { if ((e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') && atBottom()) push(); });

  // One quiet hint per visit: a small pulse by the phone number after 8 s of stillness with the footer in view
  let seen = false; try { seen = sessionStorage.getItem('ukt-hint') === '1'; } catch { /* private mode */ }
  const ping = document.querySelector<HTMLElement>('[data-ping]');
  const footer = document.querySelector('[data-footer]');
  if (ping && footer && !seen && !reduced) {
    let inView = false, idle: number | undefined, shown = false;
    const arm2 = () => {
      clearTimeout(idle);
      if (!inView || shown) return;
      idle = window.setTimeout(() => {
        if (!inView || shown || vanDone) return;
        shown = true; ping.classList.add('is-on');
        try { sessionStorage.setItem('ukt-hint', '1'); } catch { /* ignore */ }
        setTimeout(() => ping.classList.remove('is-on'), 9000);
      }, 8000);
    };
    new IntersectionObserver((en) => { inView = en[0].isIntersecting; arm2(); }, { threshold: 0.4 }).observe(footer);
    ['pointermove', 'wheel', 'keydown', 'touchstart', 'scroll'].forEach((t) => window.addEventListener(t, arm2, { passive: true }));
  }
}
