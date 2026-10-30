// Phone motion for the thread: tilt (gravity), rotating quickly, and shaking. Also says so when the sensors are not
// reaching the page, because embedded viewers and some browser settings block them without any error.
import { toast, askMotionPermission } from './eggs';

export const tilt = {
  x: 0, // steady sideways tilt, -1 (left) to 1 (right): where gravity pulls the string
  y: 0, // steady front/back tilt, small effect
  jerk: 0, // how fast the phone is being rotated side to side (ripples the string either way)
  shake: 0, // how hard the phone is being moved (devicemotion)
  live: false, // true once real sensor readings have arrived
  events: 0,
};

let lastG = 0;
let lastT = 0;
let hinted = false;

function onOrientation(e: DeviceOrientationEvent): void {
  if (e.gamma == null || e.beta == null) return;
  tilt.live = true;
  tilt.events++;
  const ang = (screen.orientation && screen.orientation.angle) || 0;
  // gamma: left/right tilt, beta: front/back tilt; swap them when the phone is turned on its side
  let gx = e.gamma, gy = e.beta - 55;
  if (ang === 90) { gx = e.beta - 55; gy = -e.gamma; }
  else if (ang === 270 || ang === -90) { gx = -(e.beta - 55); gy = e.gamma; }
  else if (ang === 180) { gx = -e.gamma; gy = -(e.beta - 55); }
  tilt.x = Math.max(-1, Math.min(1, gx / 20)); // 20 degrees is already a full lean
  tilt.y = Math.max(-1, Math.min(1, gy / 35)) * 0.5;
  const now = performance.now();
  if (lastT) {
    const dt = Math.max(0.008, (now - lastT) / 1000);
    const rate = (gx - lastG) / dt; // degrees per second
    tilt.jerk = Math.max(-2.5, Math.min(2.5, tilt.jerk * 0.7 + (rate / 90) * 0.3));
  }
  lastG = gx;
  lastT = now;
  if (!hinted && Math.abs(tilt.x) > 0.2) {
    hinted = true;
    try { if (!localStorage.getItem('garden-tilt-hint')) { localStorage.setItem('garden-tilt-hint', '1'); toast('Tilt your phone. The thread swings with it.'); } } catch { /* ignore */ }
  }
}

function onMotion(e: DeviceMotionEvent): void {
  const a = e.acceleration;
  if (!a || a.x == null) return;
  tilt.live = true;
  tilt.shake = Math.max(-2.5, Math.min(2.5, tilt.shake * 0.5 + (a.x / 3) * 0.5));
}

export function initSensors(): void {
  addEventListener('deviceorientation', onOrientation, { passive: true });
  addEventListener('devicemotion', onMotion, { passive: true });

  const touch = matchMedia('(pointer: coarse)').matches;
  const dock = document.getElementById('dock');

  // ?tilt=debug shows the raw readings, to check a phone
  if (/[?&]tilt=debug/.test(location.search)) {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:8px;top:8px;z-index:200;padding:6px 10px;border-radius:12px;background:rgba(0,0,0,.72);color:#fff;font:12px/1.3 monospace;pointer-events:none';
    document.body.appendChild(box);
    setInterval(() => {
      box.textContent = tilt.live
        ? `sensors OK  events ${tilt.events}  tilt ${tilt.x.toFixed(2)}  rotate ${tilt.jerk.toFixed(2)}  shake ${tilt.shake.toFixed(2)}`
        : 'no sensor events yet';
    }, 200);
  }

  if (!touch || !dock) return;
  // On a phone with no readings after a few seconds, offer a button: iOS needs a fresh tap to ask for permission again.
  setTimeout(() => {
    if (tilt.live) return;
    const b = document.createElement('button');
    b.className = 'round';
    b.id = 'tiltbtn';
    b.type = 'button';
    b.setAttribute('aria-label', 'Let the thread feel your phone’s tilt');
    b.innerHTML = '<svg viewBox="0 0 48 48" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="15" y="6" width="18" height="36" rx="5" transform="rotate(18 24 24)"/><path d="M8 38c4 4 10 6 16 6M40 10c-4-4-10-6-16-6"/></svg>';
    dock.prepend(b);
    const stop = window.setInterval(() => { if (tilt.live) { b.remove(); clearInterval(stop); } }, 500);
    b.addEventListener('click', async () => {
      const r = await askMotionPermission();
      setTimeout(() => {
        if (tilt.live) { b.remove(); toast('Motion is on. Tilt your phone.'); }
        else toast(
          r === 'denied'
            ? 'Motion access was declined. Allow “Motion & Orientation” for this site in your browser settings, then tap again.'
            : 'No motion data is reaching this page. Embedded viewers and some browser settings block it: open the page directly in Safari or Chrome.',
          7000,
        );
      }, 1500);
    });
  }, 3500);
}
