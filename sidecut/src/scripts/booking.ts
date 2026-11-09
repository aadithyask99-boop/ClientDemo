import gsap from 'gsap';
import type Lenis from 'lenis';

type Service = { n: number; name: string; min: number; price: number };
type Shop = { id: string; name: string };
type Barber = { id: string; name: string; shop: string; shopName: string; does: string };
type Opts = { data: { services: Service[]; shops: Shop[]; barbers: Barber[] }; lenis: Lenis | null; say: (m: string) => void; reduce: boolean };

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];

// The four-step booking flow: service, barber, time, hold the chair. Everything is local and invented.
export function initBooking({ data, lenis, say, reduce }: Opts) {
  const drawer = $('[data-drawer]')!;
  const body = $('[data-body]')!;
  const { services, shops, barbers } = data;
  const st = { step: 1, service: null as Service | null, shop: shops[0].id, barber: 'any', day: 0, slot: '' };
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  const dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const times: string[] = [];
  for (let h = 10; h < 19; h++) for (const m of [0, 20, 40]) times.push(`${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`);
  // a fixed pattern of taken slots so a day always looks busy but never empty
  const taken = (day: number, idx: number) => (idx * 7 + day * 5 + (st.barber === 'any' ? 1 : st.barber.length)) % 4 === 0 || (day === 0 && idx < 6);
  const html = (s: string) => { body.innerHTML = s; if (!reduce) gsap.fromTo(body.firstElementChild, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' }); };
  const prog = (n: number) => `style="--p:${n * 25}%"`;
  const when = () => { const d = days[st.day]; return `${dn[d.getDay()]} ${d.getDate()} ${d.toLocaleString('en-GB', { month: 'long' })}, ${st.slot}`; };
  const barberName = () => (st.barber === 'any' ? 'First free chair' : barbers.find((b) => b.id === st.barber)!.name);

  function s1() {
    st.step = 1;
    html(`<div class="step"><p class="step__no">Step 1 of 4</p><h3 class="step__title" ${prog(1)}>Pick a service</h3>
      ${services.map((s) => `<button class="opt${st.service?.n === s.n ? ' is-on' : ''}" data-s="${s.n}"><strong>#${s.n} ${s.name}</strong><small>${s.min} min</small><span>£${s.price}</span></button>`).join('')}</div>`);
    $$('[data-s]', body).forEach((b) => b.addEventListener('click', () => { st.service = services[+b.dataset.s!]; s2(); }));
  }
  function s2() {
    st.step = 2;
    const list = barbers.filter((b) => b.shop === st.shop);
    html(`<div class="step"><p class="step__no">Step 2 of 4</p><h3 class="step__title" ${prog(2)}>Pick your barber</h3>
      <div class="chair-tabs" role="group" aria-label="Shop">${shops.map((s) => `<button class="chip${s.id === st.shop ? ' is-on' : ''}" data-shop="${s.id}">${s.name}</button>`).join('')}</div>
      <button class="opt${st.barber === 'any' ? ' is-on' : ''}" data-b="any"><strong>First free chair</strong><small>Whoever is free first</small><span>→</span></button>
      ${list.map((b) => `<button class="opt${st.barber === b.id ? ' is-on' : ''}" data-b="${b.id}"><strong>${b.name}</strong><small>${b.does}</small><span>→</span></button>`).join('')}
      <button class="link" data-back>Back</button></div>`);
    $$('[data-shop]', body).forEach((b) => b.addEventListener('click', () => { st.shop = b.dataset.shop!; st.barber = 'any'; s2(); }));
    $$('[data-b]', body).forEach((b) => b.addEventListener('click', () => { st.barber = b.dataset.b!; s3(); }));
    $('[data-back]', body)!.addEventListener('click', s1);
  }
  function s3() {
    st.step = 3;
    html(`<div class="step"><p class="step__no">Step 3 of 4</p><h3 class="step__title" ${prog(3)}>Pick a time</h3>
      <div class="days">${days.map((d, i) => `<button class="day${i === st.day ? ' is-on' : ''}" data-d="${i}"><small>${i === 0 ? 'Today' : dn[d.getDay()]}</small>${d.getDate()}</button>`).join('')}</div>
      <div class="slots">${times.map((t, i) => `<button class="slot${t === st.slot ? ' is-on' : ''}" data-t="${t}" ${taken(st.day, i) ? 'disabled' : ''}>${t}</button>`).join('')}</div>
      <button class="link" data-back>Back</button></div>`);
    $$('[data-d]', body).forEach((b) => b.addEventListener('click', () => { st.day = +b.dataset.d!; st.slot = ''; s3(); }));
    $$('[data-t]', body).forEach((b) => b.addEventListener('click', () => { st.slot = b.dataset.t!; s4(); }));
    $('[data-back]', body)!.addEventListener('click', s2);
  }
  function s4() {
    st.step = 4;
    const sh = shops.find((x) => x.id === st.shop)!.name;
    html(`<form class="step" novalidate><p class="step__no">Step 4 of 4</p><h3 class="step__title" ${prog(4)}>Hold the chair</h3>
      <p class="drawer__fine">${st.service!.name}, ${sh}, ${barberName()}, ${when()}</p>
      <label class="field">Name<input name="n" autocomplete="name" required></label>
      <label class="field">Mobile, for the reminder text<input name="m" inputmode="tel" autocomplete="tel" placeholder="07700 900123" required></label>
      <p class="drawer__fine">A £10 deposit holds the chair and comes off your bill. This is a concept: nothing is charged and nothing is sent.</p>
      <button class="pill pill--light" type="submit" disabled>Hold the chair, £10</button>
      <button type="button" class="link" data-back>Back</button></form>`);
    const form = $<HTMLFormElement>('form', body)!, go = $<HTMLButtonElement>('button[type=submit]', form)!;
    const check = () => { go.disabled = !(form.n.value.trim().length > 1 && form.m.value.replace(/\D/g, '').length >= 8); };
    form.addEventListener('input', check);
    form.addEventListener('submit', (e) => { e.preventDefault(); if (!go.disabled) done(form.n.value.trim()); });
    $('[data-back]', form)!.addEventListener('click', s3);
  }
  function done(name: string) {
    const sh = shops.find((x) => x.id === st.shop)!.name;
    html(`<div class="step"><p class="step__no">Confirmed</p><h3 class="step__title" style="--p:100%">Your chair is held</h3>
      <svg class="swoosh" width="86" height="40" viewBox="0 0 86 40" fill="none" aria-hidden="true"><path d="M4 30 C26 8 56 4 82 12" stroke="#efeeea" stroke-width="4" stroke-linecap="round"/></svg>
      <dl class="sum"><div><dt>Name</dt><dd>${name.replace(/[<>&]/g, '')}</dd></div><div><dt>Service</dt><dd>${st.service!.name}, ${st.service!.min} min</dd></div>
      <div><dt>Barber</dt><dd>${barberName()}</dd></div><div><dt>Shop</dt><dd>${sh}</dd></div><div><dt>When</dt><dd>${when()}</dd></div></dl>
      <p class="drawer__fine">A reminder text would arrive the day before. Concept only.</p>
      <button class="pill pill--light" data-close>Done</button></div>`);
    $$('[data-close]', body).forEach((b) => b.addEventListener('click', close));
  }

  let last: HTMLElement | null = null;
  function open(pre?: string) {
    last = document.activeElement as HTMLElement;
    st.step = 1; st.slot = ''; st.day = 0;
    if (pre) {
      const [k, v] = pre.split(':');
      if (k === 'service') st.service = services[+v];
      if (k === 'shop') { st.shop = v; st.barber = 'any'; }
      if (k === 'barber') { const b = barbers.find((x) => x.id === v)!; st.shop = b.shop; st.barber = b.id; }
    }
    // jump to the first step that is still missing
    if (!st.service) s1();
    else if (pre && pre.startsWith('service')) s2();
    else s1();
    drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false');
    lenis?.stop(); document.documentElement.style.overflow = 'hidden';
    $<HTMLElement>('.drawer__x', drawer)!.focus();
  }
  function close() {
    drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true');
    lenis?.start(); document.documentElement.style.overflow = '';
    last?.focus?.();
  }
  $$('[data-book]').forEach((b) => b.addEventListener('click', () => open(b.dataset.book || undefined)));
  $$('[data-close]', drawer).forEach((b) => b.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) close(); });
}
