import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { invitation as inv } from '../data/invitation';
import { prepareCover, openCover, initTilt } from './cover';
import { initThread } from './thread';
import { initInk } from './ink';
import { initCountdown } from './countdown';
import { initRsvp, readParty } from './rsvp';
import { initEggs, sealSecret, askMotionPermission, toast } from './eggs';
import { initFireflies } from './fireflies';
import { initSensors } from './sensors';
import { initParallax } from './parallax';
import { initAtmosphere } from './atmosphere';
import { initDance } from './dance';
import { initScene } from './scene';
import { setSound, soundOn, startMusic, setMusicSource, toggleMusic, musicPlaying, unlock } from './audio';

declare global { interface Window { __garden?: boolean } }
window.__garden = true;
gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const q = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;

// ----- Personal link: greeting + RSVP names -----
const party = readParty();
if (party.names.length) {
  const firsts = party.names.map((n) => n.split(' ')[0]);
  const who = firsts.length > 1 ? `${firsts.slice(0, -1).join(', ')} & ${firsts[firsts.length - 1]}` : firsts[0];
  q('#hello').textContent = `Dear ${who}`;
  q('#seat').textContent = party.names.length > 1 ? 'we saved you seats' : 'we saved you a seat';
}
initRsvp(party);
initCountdown();
initInk(reduce);
initFireflies(reduce);
initEggs();

// ----- Add to calendar (.ics built in the browser) -----
q('#ics').addEventListener('click', () => {
  const start = `${inv.date.replace(/-/g, '')}T${inv.ceremonyTime.replace(':', '')}00`;
  const [h, m] = inv.ceremonyTime.split(':').map(Number);
  const endH = h + 9;
  const end = `${inv.date.replace(/-/g, '')}T${String(Math.min(endH, 23)).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Garden//EN', 'BEGIN:VEVENT', `UID:${start}@garden`, `DTSTAMP:${start}`,
    `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${inv.a} & ${inv.b}'s wedding`, `LOCATION:${inv.venue.address}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'wedding.ics';
  a.click();
  toast('Saved to your calendar.');
});

// ----- Scroll reveal -----
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// ----- Day / night and sound buttons -----
const nightBtn = q<HTMLButtonElement>('#nightbtn');
const soundBtn = q<HTMLButtonElement>('#sound');
const syncNight = () => { nightBtn.setAttribute('aria-pressed', String(root.classList.contains('night'))); };
syncNight();
nightBtn.addEventListener('click', () => {
  root.classList.toggle('night');
  syncNight();
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', root.classList.contains('night') ? '#18211d' : '#8a9a6b');
  if (root.classList.contains('night')) toast('Night has fallen. Look for fireflies.');
});
const syncSound = () => { soundBtn.setAttribute('aria-pressed', String(soundOn())); soundBtn.setAttribute('aria-label', soundOn() ? 'Turn sound off' : 'Turn sound on'); };
syncSound();
soundBtn.addEventListener('click', () => { setSound(!soundOn()); syncSound(); });

// music: starts at 20% volume when the seal is pressed, and can be paused here
const musicBtn = q<HTMLButtonElement>('#music');
const syncMusic = () => { musicBtn.setAttribute('aria-pressed', String(musicPlaying())); musicBtn.setAttribute('aria-label', musicPlaying() ? 'Pause the music' : 'Play the music'); };
syncMusic();
musicBtn.addEventListener('click', () => { toggleMusic(); syncMusic(); });

// ----- Cover -----
prepareCover(reduce);
const seal = q<HTMLButtonElement>('#seal');
const sealPress = sealSecret(seal);
// pressing dents the wax before it lets go
seal.addEventListener('pointerdown', () => seal.classList.add('pressed'));
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => seal.addEventListener(ev, () => seal.classList.remove('pressed')));
let opening = false;
seal.addEventListener('click', async () => {
  if (sealPress.fired() || opening) return;
  opening = true;
  // audio may only begin inside this tap, so the music starts here (volume comes from the config)
  setMusicSource(inv.music.src);
  startMusic(inv.music.src, inv.music.volume);
  syncMusic();
  void askMotionPermission();
  await openCover(reduce);
  afterOpen();
});

function afterOpen(): void {
  root.classList.remove('locked');
  root.classList.add('opened');
  window.scrollTo(0, 0);
  unlock();
  initTilt();
  const atmo = initAtmosphere(reduce);
  initDance(reduce, atmo);
  initScene(reduce, atmo);
  initParallax(reduce);

  if (!reduce && matchMedia('(pointer: fine)').matches) {
    root.style.scrollBehavior = 'auto';
    const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
      a.addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo(a.getAttribute('href')!); }));
  }

  // The hero layers drift apart as you scroll away
  if (!reduce) {
    gsap.to('.garland', { yPercent: -16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.window', { yPercent: -5, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.roses', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }
  initSensors();
  initThread(reduce);
  ScrollTrigger.refresh();
}
