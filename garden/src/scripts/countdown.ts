import { invitation as inv } from '../data/invitation';

export function initCountdown(): void {
  const q = new URLSearchParams(location.search).get('now'); // ?now=2027-06-19T10:00 previews the day itself
  const skew = q ? new Date(q).getTime() - Date.now() : 0;
  const target = new Date(`${inv.date}T${inv.ceremonyTime}:00`).getTime();
  const els = {
    d: document.querySelector<HTMLElement>('[data-u="d"]')!,
    h: document.querySelector<HTMLElement>('[data-u="h"]')!,
    m: document.querySelector<HTMLElement>('[data-u="m"]')!,
    s: document.querySelector<HTMLElement>('[data-u="s"]')!,
  };
  const note = document.getElementById('count-note')!;
  const pad = (n: number) => String(n);
  const tick = () => {
    const now = Date.now() + skew;
    const ms = target - now;
    if (ms <= 0) {
      Object.values(els).forEach((e) => (e.textContent = '0'));
      note.textContent = now - target < 36e5 * 6 ? 'We are doing it right now.' : 'We did it. Thank you for being part of it.';
      return;
    }
    const s = Math.floor(ms / 1000);
    els.d.textContent = pad(Math.floor(s / 86400));
    els.h.textContent = pad(Math.floor((s % 86400) / 3600));
    els.m.textContent = pad(Math.floor((s % 3600) / 60));
    els.s.textContent = pad(s % 60);
    const days = Math.floor(s / 86400);
    note.textContent = s < 86400 ? 'Today is the day.' : days === 1 ? 'One more sleep.' : `${days} sleeps until we say I do`;
  };
  tick();
  window.setInterval(tick, 1000);
}
