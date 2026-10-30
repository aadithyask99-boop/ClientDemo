import gsap from 'gsap';
import { invitation as inv } from '../data/invitation';
import { arpeggio } from './audio';
import { hearts } from './eggs';

export interface Party { names: string[]; count: number }

/** Personal links: ?g=Sarah Jones,Tom Jones fills the names and greets them. ?n=3 just sets the party size. */
export function readParty(): Party {
  const p = new URLSearchParams(location.search);
  const names = (p.get('g') || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8);
  const n = Math.max(names.length, Math.min(8, parseInt(p.get('n') || '1', 10) || 1), 1);
  return { names, count: n };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function initRsvp(party: Party): void {
  const guests = document.getElementById('guests')!;
  const form = document.getElementById('rsvp-form') as HTMLFormElement;
  const err = document.getElementById('rsvp-error')!;
  const thanks = document.getElementById('thanks')!;
  const meals = inv.rsvp.meals;

  for (let i = 0; i < party.count; i++) {
    const div = document.createElement('div');
    div.className = 'guest';
    div.innerHTML = `
      <div class="field"><label for="g${i}">${party.count > 1 ? `Guest ${i + 1}` : 'Your name'}</label>
        <input type="text" id="g${i}" name="g${i}-name" autocomplete="${i ? 'off' : 'name'}" value="${esc(party.names[i] || '')}" /></div>
      <div class="chips" role="radiogroup" aria-label="Will they be there?">
        <label class="chip"><input type="radio" name="g${i}-att" value="yes" /><span>Joyfully accepts</span></label>
        <label class="chip"><input type="radio" name="g${i}-att" value="no" /><span>Regretfully declines</span></label>
      </div>
      <div class="field meal" hidden><span class="lab">Supper</span>
        <div class="chips" role="radiogroup" aria-label="Supper choice">${meals.map((m) => `<label class="chip"><input type="radio" name="g${i}-meal" value="${esc(m)}" /><span>${esc(m)}</span></label>`).join('')}</div></div>`;
    guests.appendChild(div);
    div.addEventListener('change', () => {
      const yes = (div.querySelector(`input[name="g${i}-att"]:checked`) as HTMLInputElement | null)?.value === 'yes';
      (div.querySelector('.meal') as HTMLElement).hidden = !yes;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const data = new FormData(form);
    const list = [];
    for (let i = 0; i < party.count; i++) {
      const name = String(data.get(`g${i}-name`) || '').trim();
      const att = String(data.get(`g${i}-att`) || '');
      const meal = String(data.get(`g${i}-meal`) || '');
      if (!name) return fail(`Please add a name for guest ${i + 1}.`);
      if (!att) return fail(`Is ${name} able to come?`);
      if (att === 'yes' && meals.length && !meal) return fail(`Please choose a supper for ${name}.`);
      list.push({ name, attending: att === 'yes', meal: att === 'yes' ? meal : '' });
    }
    const extras: Record<string, string> = {};
    inv.rsvp.extra.forEach((x) => (extras[x.id] = String(data.get(x.id) || '')));
    const payload = { couple: `${inv.a} & ${inv.b}`, sentAt: new Date().toISOString(), link: location.search, guests: list, note: String(data.get('note') || ''), ...extras };

    const btn = document.getElementById('rsvp-send') as HTMLButtonElement;
    btn.disabled = true;
    try {
      if (inv.rsvp.endpoint) {
        // Apps Script web apps do not send CORS headers; a no-cors text/plain POST still arrives intact.
        await fetch(inv.rsvp.endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      } else {
        localStorage.setItem('garden-rsvp-demo', JSON.stringify(payload));
      }
    } catch {
      btn.disabled = false;
      return fail('That did not send. Please check your connection and try again.');
    }
    celebrate(list);
  });

  function fail(msg: string) { err.textContent = msg; err.hidden = false; }

  function celebrate(list: { name: string; attending: boolean }[]) {
    const first = list[0].name.split(' ')[0];
    const anyYes = list.some((g) => g.attending);
    (document.getElementById('thanks-title') as HTMLElement).textContent = anyYes ? `See you there, ${first}` : `We will miss you, ${first}`;
    (document.getElementById('thanks-text') as HTMLElement).textContent = anyYes
      ? `Your reply is with ${inv.a} and ${inv.b}. They are very happy, and the dog has been told.`
      : 'Thank you for letting us know. We will raise a glass to you on the day.';
    form.hidden = true;
    thanks.hidden = false;
    const flap = thanks.querySelector('.env-flap')!;
    gsap.set(flap, { attr: { d: 'M18 38Q110 -34 202 38' } });
    gsap.set('.env-seal, .env-heart', { scale: 0, transformOrigin: '110px 78px' });
    gsap.timeline()
      .to(flap, { attr: { d: 'M18 38Q110 108 202 38' }, duration: 0.9, ease: 'power2.inOut' })
      .to('.env-seal', { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.55)' }, '>-0.1')
      .to('.env-heart', { scale: 1, duration: 0.5, ease: 'back.out(2)' }, '>-0.3')
      .add(() => { arpeggio(2); const r = thanks.getBoundingClientRect(); hearts(r.left + r.width / 2, r.top + 80, 14); });
    thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
