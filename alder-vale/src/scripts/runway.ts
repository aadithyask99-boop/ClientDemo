// @ts-nocheck
// Try the look: a 3D ring of people (a diagonal line on phones), a popup with pins, and a panel that shops the pieces.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const TAU = Math.PI * 2;
const pad = (i) => String(i + 1).padStart(2, '0');
const money = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

export function initRunway() {
  const root = $('#runway'); if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = $('[data-rw-stage]', root), actors = $('[data-rw-actors]', root);
  const heroes = $$('[data-rw-hero]', root), panels = $$('[data-rw-panel]', root), ticks = $$('[data-rw-tick]', root);
  const live = $('[data-rw-live]', root), piecesLabel = $('[data-rw-pieces]', root);
  const lb = $('[data-rw-lb]', root), lbStage = $('[data-rw-lb-stage]', root), autoBtn = $('[data-rw-auto]', root);
  const n = heroes.length, speed = Number(root.dataset.speed) || 5000, bundlePct = Number(root.dataset.bundle) || 10;
  root.style.setProperty('--rw-speed', speed + 'ms');
  root.classList.add('rw--js');

  /* ---------- bodies: the originals plus clones so the ring is full ---------- */
  const orig = $$('.rw__model', actors);
  for (let r = 1; r < Math.ceil(8 / n); r++) orig.forEach((b, i) => {
    const c = b.cloneNode(true); c.dataset.index = String(r * n + i); c.setAttribute('data-rw-clone', '');
    $$('img', c).forEach((im) => (im.loading = 'lazy')); actors.append(c);
  });
  const bodies = $$('.rw__model', actors), N = bodies.length;
  const sizes = bodies.map(() => ({ w: 0 })), blurs = bodies.map(() => -1);
  const glow = document.createElement('span'); glow.className = 'rw__glow'; glow.setAttribute('aria-hidden', 'true'); stage.append(glow);

  /* ---------- state ---------- */
  let W = 0, H = 0, mobile = false, fs = 1.08, modelH = 560, hx = 0, hy = 34;
  let index = 0, target = 0, cur = 0, vel = 0, still = false, visible = false, dragging = false;
  let playing = false, panelHover = false, zoomed = false, engaged = false, raf = 0, last = 0, timer = 0;
  const entrance = reduce ? 0 : 1.15;
  const wrapN = (v) => ((v % N) + N) % N;
  const cs = bodies.map((_, a) => ({ x: 0, g: 0, v: 0, goal: 0, pg: wrapN(a), trip: false, from: 0 }));
  cur = -entrance;
  cs.forEach((s, a) => { s.goal = wrapN(a); s.pg = s.goal; s.x = s.g = s.goal + entrance; });

  /* ---------- measure ---------- */
  function measure() {
    mobile = innerWidth < 750;
    if (!mobile) root.style.setProperty('--rw-frame-h', Math.max(640, innerHeight) + 'px'); else root.style.removeProperty('--rw-frame-h');
    const r = stage.getBoundingClientRect(); W = r.width; H = r.height;
    fs = mobile ? 1 : 1.08;
    modelH = mobile ? Math.max(200, Math.round(H - 24 - 18)) : Math.max(200, Math.round((H - 34 - 18) / 1.08));
    if (!mobile) modelH = Math.min(modelH, Math.round(W * 1.1));
    hx = mobile ? W * 0.3 : W * 0.5; hy = mobile ? 22 : 34;
    stage.style.setProperty('--rw-model-h', modelH + 'px');
    stage.style.setProperty('--rw-hx', hx + 'px'); stage.style.setProperty('--rw-hy', hy + 'px'); stage.style.setProperty('--rw-fs', fs);
    bodies.forEach((b, i) => (sizes[i].w = b.offsetWidth));
    kick();
  }

  /* ---------- placement ---------- */
  function put(i, x, bottom, scale, opacity, blur, z) {
    const b = bodies[i], w = sizes[i].w;
    if (x + (w * scale) / 2 < -4 || x - (w * scale) / 2 > W + 4) opacity = 0;
    b.style.transform = `translate3d(${x.toFixed(2)}px, ${(-bottom).toFixed(2)}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
    b.style.opacity = opacity.toFixed(3); b.style.zIndex = z;
    b.style.visibility = opacity < 0.01 ? 'hidden' : 'visible'; b.style.pointerEvents = opacity < 0.5 ? 'none' : 'auto';
    const bl = Math.round(blur * 10) / 10;
    if (blurs[i] !== bl) { blurs[i] = bl; b.style.filter = bl > 0.05 ? `blur(${bl}px)` : ''; }
  }
  function renderRing() {
    const cx = W * 0.5, R = W * 0.62, P = W * 1.65, floor = H - 34, horizon = H * 0.36, step = TAU / N;
    for (let a = 0; a < N; a++) {
      let phi = ((((a - cur) * step) % TAU) + TAU) % TAU; if (phi > Math.PI) phi -= TAU;
      const z = R * (1 - Math.cos(phi)), persp = P / (P + z), sl = Math.abs(phi) / step;
      const scale = persp * (1 + (fs - 1) * clamp(1 - sl, 0, 1));
      const x = cx + R * Math.sin(phi) * persp, feet = horizon + (floor - horizon) * persp;
      const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
      let op = clamp((Math.cos(phi) + 0.55) / 0.3, 0, 1);
      if (still && sl < 0.02) op = 0;
      put(a, x, H - feet, scale, op, blur, Math.round(scale * 1000));
    }
  }
  function renderClassic() {
    const ax = 0.3, ay = 22, sx = 0.32, sy = 22, sr = 0.76, ex = 0.55, d = 4;
    for (let a = 0; a < N; a++) {
      const s = cs[a]; let k = s.x, e = -1;
      if (s.trip) {
        const u = clamp(Math.abs(s.x - s.from) / (Math.abs(s.goal - s.from) || 1), 0, 1);
        if (s.goal > s.from) { if (u < 0.5) e = 2 * u * 1.4; else k = s.goal + 2 * (1 - u); }
        else { if (u < 0.5) k = s.from + 2 * u; else e = 2 * (1 - u) * 1.4; }
      } else if (k < 0) e = Math.min(-k, 1.4);
      if (e >= 0) put(a, W * (ax - ex * e), ay - 22 * e, 1 + 0.14 * e, Math.max(0, 1 - 1.05 * e), 4 * Math.min(e, 1), 1100);
      else {
        let op = k <= d - 1 ? 1 - 0.13 * k : Math.max(0, 0.61 * (d - k));
        if (still && k < 0.02) op = 0;
        put(a, W * (ax + sx * k), ay + sy * k, Math.pow(sr, k), op, Math.min(0.9 * k, 3.2), 1000 - Math.round(10 * k));
      }
    }
  }

  /* ---------- the loop ---------- */
  const K = 95, C = 2 * Math.sqrt(K);
  function frame(t) {
    raf = 0;
    if (!visible || document.hidden) { last = 0; return; }
    const dt = last ? Math.min(0.034, (t - last) / 1000) : 1 / 60; last = t;
    let moving = false;
    if (reduce) {
      cur = target; vel = 0;
      cs.forEach((s, a) => { s.goal = wrapN(a - target); s.x = s.g = s.goal; s.v = 0; s.trip = false; s.pg = s.goal; });
    } else if (!mobile) {
      const h = dt / 3;
      for (let i = 0; i < 3; i++) { const acc = -K * (cur - target) - C * vel; vel += acc * h; cur += vel * h; }
      if (Math.abs(cur - target) <= 0.0005 && Math.abs(vel) <= 0.0005) { cur = target; vel = 0; } else moving = true;
    } else {
      cs.forEach((s, a) => {
        const goal = wrapN(a - target);
        if (Math.abs(goal - s.pg) > N / 2) { s.trip = true; s.from = s.x; }
        s.pg = goal; s.goal = goal;
        const tau = dragging ? 0.016 : s.trip ? 0.1 : 0.03 + 0.04 * Math.min(goal, 4);
        s.g += (goal - s.g) * (1 - Math.exp(-dt / tau));
        const h = dt / 3;
        for (let i = 0; i < 3; i++) { const acc = -K * (s.x - s.g) - C * s.v; s.v += acc * h; s.x += s.v * h; }
        if (s.trip && Math.abs(s.x - goal) < 0.02) s.trip = false;
        if (!s.trip && Math.abs(s.x - goal) < 0.0006 && Math.abs(s.v) < 0.0006 && Math.abs(s.g - goal) < 0.0006) { s.x = s.g = goal; s.v = 0; } else moving = true;
      });
    }
    still = !moving && !dragging;
    root.classList.toggle('rw--still', still);
    mobile ? renderClassic() : renderRing();
    if (moving || dragging) raf = requestAnimationFrame(frame); else last = 0;
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  /* ---------- index, navigation ---------- */
  const signedRank = (a) => { let d = wrapN(a - Math.round(target)); if (d > N / 2) d -= N; return d; };
  function setIndex(i, silent) {
    const changed = i !== index || silent;
    index = i; kick();
    bodies.forEach((b, a) => {
      const k = signedRank(a), ok = mobile ? k > 0 && k <= 3 : k !== 0 && Math.abs(k) <= 2, hit = $('.rw__hit', b);
      if (ok) b.removeAttribute('aria-hidden'); else b.setAttribute('aria-hidden', 'true');
      hit.tabIndex = ok ? 0 : -1;
    });
    if (!changed) return;
    if (!silent) { closeZoom(true); closeAllPickers(); }
    root.style.setProperty('--rw-progress', ((i + 1) / n).toFixed(3));
    heroes.forEach((h, j) => {
      const on = j === i, was = h.classList.contains('is-on');
      h.classList.toggle('is-on', on); h.classList.toggle('was', was && !on); h.setAttribute('aria-hidden', on ? 'false' : 'true');
      $('[data-rw-zoom]', h).tabIndex = on ? 0 : -1;
    });
    root.classList.toggle('rw--glow', i === n - 1);
    if (!silent && !reduce) { root.classList.remove('is-sweep'); void root.offsetWidth; root.classList.add('is-sweep'); }
    if (!silent) live.textContent = `Look ${i + 1}: ${heroes[i].dataset.name}`;
    ticks.forEach((t, j) => { t.setAttribute('aria-current', j === i ? 'true' : 'false'); t.classList.toggle('is-past', j < i); });
    panels.forEach((p) => { p.hidden = j(p) !== i; p.classList.remove('is-in'); });
    function j(p) { return Number(p.dataset.rwPanel); }
    void root.offsetWidth;
    if (!silent) panels[i].classList.add('is-in'); else panels[i].classList.add('is-in');
    const label = panels[i].querySelector('.rw__label'); piecesLabel.textContent = label ? label.textContent : '';
    piecesLabel.classList.remove('is-swap'); void piecesLabel.offsetWidth; if (!silent) piecesLabel.classList.add('is-swap');
    unhot(); restartBar(); schedule();
  }
  function moveTo(T) { target = T; still = false; root.classList.remove('rw--still'); setIndex(wrapN(T) % n); kick(); }
  const next = () => moveTo(Math.round(target) + 1), prev = () => moveTo(Math.round(target) - 1);
  function go(i) { let d = (((i - index) % n) + n) % n; if (d > n / 2) d -= n; moveTo(Math.round(target) + d); }

  /* ---------- autoplay ---------- */
  function restartBar() { ticks.forEach((t) => t.classList.remove('is-run')); void root.offsetWidth; if (playing) ticks[index].classList.add('is-run'); }
  function schedule() {
    clearTimeout(timer); if (!playing) return;
    timer = setTimeout(() => {
      if (visible && !dragging && !document.hidden && !panelHover && !zoomed && !engaged) next(); else { restartBar(); schedule(); }
    }, speed);
  }
  function play(on) { playing = on; root.classList.toggle('is-playing', on); autoBtn.setAttribute('aria-pressed', String(on)); restartBar(); schedule(); }
  function engage() { engaged = true; if (playing) play(false); }

  /* ---------- drag, swipe, wheel, keys ---------- */
  let drag = null, lastDrag = 0, wheelAcc = 0, wheelLock = 0;
  const unit = () => (mobile ? Math.max(90, W * 0.32 * 1.6) : Math.max(120, W * 0.3));
  stage.addEventListener('pointerdown', (e) => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || zoomed) return;
    drag = { x: e.clientX, y: e.clientY, t: target, id: e.pointerId, s: [{ x: e.clientX, t: performance.now() }], on: false };
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { endDrag(e); return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) { drag.on = true; dragging = true; root.classList.add('rw--dragging'); try { stage.setPointerCapture(e.pointerId); } catch (_) {} }
      else return;
    }
    drag.s.push({ x: e.clientX, t: performance.now() }); if (drag.s.length > 6) drag.s.shift();
    target = drag.t - dx / unit(); kick();
  });
  function endDrag(e) {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.on) return;
    dragging = false; root.classList.remove('rw--dragging'); lastDrag = performance.now();
    const dx = e.clientX - d.x, a = d.s[0], b = d.s[d.s.length - 1];
    const vx = b.t > a.t ? (b.x - a.x) / (b.t - a.t) : 0, from = Math.round(d.t);
    if (mobile) {
      if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) moveTo(from + (dx > 0 ? -1 : 1)); else moveTo(from);
    } else {
      let i = Math.round(target - (vx * 160) / unit());
      if (i === from && Math.abs(vx) > 0.3) i = from + (vx < 0 ? 1 : -1);
      moveTo(clamp(i, from - 2, from + 2));
    }
  }
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('click', (e) => { if (performance.now() - lastDrag < 60) { e.stopPropagation(); e.preventDefault(); } }, true);
  stage.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || zoomed) return;
    e.preventDefault();
    if (performance.now() < wheelLock) return;
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 45) { wheelAcc > 0 ? next() : prev(); wheelAcc = 0; wheelLock = performance.now() + 520; }
  }, { passive: false });
  stage.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); next(); } else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); } });

  /* ---------- popup: view look ---------- */
  let snowStop = null;
  function openZoom() {
    if (zoomed) return; engage();
    const hero = heroes[index], fig = $('.rw__figure', hero), a = fig.getBoundingClientRect();
    lbStage.innerHTML = '';
    const wrap = document.createElement('div'); wrap.className = 'rw__lb-model';
    wrap.append($('.rw__shadow', hero).cloneNode(true), fig.cloneNode(true));
    $('[data-rw-zoom]', wrap)?.remove();
    $$('.rw__pin', wrap).forEach((p) => (p.tabIndex = 0));
    lbStage.append(wrap);
    $('[data-rw-lb-kicker]', root).textContent = `Look ${pad(index)} \u00b7 ${hero.dataset.alt}`;
    $('[data-rw-lb-name]', root).textContent = hero.dataset.name;
    const sr = lbStage.getBoundingClientRect(), h = Math.max(160, Math.min(sr.height, sr.width / 0.5625));
    wrap.style.setProperty('--rw-model-h', h + 'px');
    $$('img', wrap).forEach((im) => (im.sizes = Math.round(h * 0.5625) + 'px'));
    const b = $('.rw__figure', wrap).getBoundingClientRect();
    if (!reduce) {
      wrap.style.transformOrigin = '0 100%'; wrap.style.transition = 'none';
      wrap.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;
      void wrap.offsetWidth; wrap.style.transition = ''; wrap.style.transform = '';
    }
    zoomed = true; root.classList.add('rw--zoom'); lb.setAttribute('aria-hidden', 'false');
    $('[data-rw-zoom-close]', root).focus({ preventScroll: true });
    snowStop = startSnow();
  }
  function closeZoom(instant) {
    if (!zoomed) return;
    zoomed = false;
    const wrap = $('.rw__lb-model', lbStage), hero = heroes[index];
    if (wrap && !reduce && !instant) {
      const a = $('.rw__figure', hero).getBoundingClientRect(), b = $('.rw__figure', wrap).getBoundingClientRect();
      wrap.style.transformOrigin = '0 100%';
      wrap.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;
    }
    root.classList.remove('rw--zoom'); lb.setAttribute('aria-hidden', 'true'); unhot();
    if (snowStop) { snowStop(); snowStop = null; }
    if (lb.contains(document.activeElement)) stage.focus({ preventScroll: true });
    setTimeout(() => { if (!zoomed) lbStage.innerHTML = ''; }, instant ? 0 : 950);
  }
  function startSnow() {
    if (reduce) return null;
    let cv = $('.rw__snow', lb);
    if (!cv) { cv = document.createElement('canvas'); cv.className = 'rw__snow'; cv.setAttribute('aria-hidden', 'true'); lb.insertBefore(cv, lbStage); }
    const ctx = cv.getContext('2d'); let on = true, id = 0;
    const dpr = Math.min(devicePixelRatio || 1, 1.5), w = lb.clientWidth, h = lb.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mk = (any) => ({ x: Math.random() * w, y: any ? Math.random() * h : -8, r: 1 + Math.random() * 2.4, v: 0.5 + Math.random() * 1.1, s: Math.random() * 6 });
    const ps = Array.from({ length: mobile ? 34 : 70 }, () => mk(true));
    const tick = () => {
      if (!on) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) { p.y += p.v; p.s += 0.012; p.x += Math.sin(p.s) * 0.4; if (p.y > h + 8) Object.assign(p, mk(false)); ctx.globalAlpha = 0.92; ctx.shadowColor = 'rgba(15,28,51,0.28)'; ctx.shadowBlur = 3; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => { on = false; cancelAnimationFrame(id); setTimeout(() => ctx.clearRect(0, 0, w, h), 600); };
  }

  /* ---------- hot linking between pins and rows ---------- */
  function unhot() { $$('.is-hot', root).forEach((e) => e.classList.remove('is-hot')); }
  function hot(num, scroll) {
    unhot();
    const pinScope = zoomed ? lbStage : heroes[index];
    $(`[data-rw-pin="${num}"]`, pinScope)?.classList.add('is-hot');
    const card = $(`[data-rw-card="${num}"]`, panels[index]); if (!card) return;
    card.classList.add('is-hot');
    if (!scroll) return;
    const list = card.parentElement, beh = reduce ? 'auto' : 'smooth';
    if (list.scrollWidth > list.clientWidth + 2) list.scrollTo({ left: card.offsetLeft - list.offsetLeft - 20, behavior: beh });
    else if (list.scrollHeight > list.clientHeight + 2) list.scrollTo({ top: card.offsetTop - list.offsetTop - 12, behavior: beh });
    else { const r = card.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight - 140) scrollBy({ top: r.top - innerHeight * 0.3, behavior: beh }); }
  }
  panels.forEach((p) => {
    p.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const c = e.target.closest('[data-rw-card]'); if (c) hot(Number(c.dataset.rwCard)); });
    p.addEventListener('pointerout', (e) => { if (e.pointerType !== 'mouse') return; if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-rw-card]')) unhot(); });
  });
  const panelEl = $('.rw__panel', root);
  panelEl.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') panelHover = true; });
  panelEl.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { panelHover = false; restartBar(); schedule(); } });

  /* ---------- shopping: pickers, single adds, the full look ---------- */
  const toastEl = document.createElement('div'); toastEl.className = 'rw__toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.append(toastEl);
  let toastT = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2500); }
  const cardsOf = (panel) => $$('[data-rw-card]', panel);
  const picker = (card) => $('[data-rw-picker]', card);
  function openPicker(card, quiet) {
    const p = picker(card); if (!p) return;
    if (mobile) closeAllPickers();
    p.hidden = false; card.classList.add('is-picking'); $('[data-rw-add]', card).setAttribute('aria-expanded', 'true');
    if (mobile) root.classList.add('rw--picking');
    else if (!quiet) setTimeout(() => p.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }), 60);
    $('input:checked', p)?.focus({ preventScroll: true });
  }
  function closePicker(card) {
    const p = picker(card); if (!p || p.hidden) return;
    p.hidden = true; card.classList.remove('is-picking'); $('[data-rw-add]', card)?.setAttribute('aria-expanded', 'false');
    if (!$$('[data-rw-picker]:not([hidden])', root).length) root.classList.remove('rw--picking');
  }
  function closeAllPickers() { $$('[data-rw-card]', root).forEach(closePicker); root.classList.remove('rw--picking'); }
  const absUrl = (p) => new URL(p, document.baseURI).href;
  const itemOf = (card) => {
    const size = $('input:checked', card)?.value || '', pid = card.dataset.pid;
    return { key: `rw-${pid}-${size}`, name: card.dataset.title, sub: size === 'One size' ? size : `Size ${size}`, price: Number(card.dataset.price), img: absUrl(card.dataset.img) };
  };
  let cartKeys = [];
  const inBag = (pid) => cartKeys.some((k) => k.startsWith(`rw-${pid}-`));
  const ready = (card) => $$('input[data-rw-option]', card).length === 1 || card.dataset.touched === '1';
  function addCards(cards, panel, done) {
    cards.forEach((c) => c.classList.add('is-loading'));
    const items = cards.map(itemOf);
    setTimeout(() => {
      cards.forEach((c) => { c.classList.remove('is-loading'); closePicker(c); });
      document.dispatchEvent(new CustomEvent('av:add', { detail: { items } }));
      if (done) done();
      if (navigator.vibrate && mobile && !reduce) navigator.vibrate(12);
    }, reduce ? 0 : 520);
  }
  function syncFromCart(keys) {
    cartKeys = keys;
    panels.forEach((panel, i) => {
      const cards = cardsOf(panel); let all = cards.length > 1;
      cards.forEach((c) => {
        const has = inBag(c.dataset.pid) && !c.classList.contains('is-loading');
        c.classList.toggle('is-added', has);
        const add = $('[data-rw-add]', c); add.setAttribute('aria-label', (has ? 'Added to bag: ' : 'Add to bag: ') + c.dataset.title);
        if (!has) all = false;
      });
      panel.classList.toggle('is-complete', all);
      if (all && !keys.includes(`rw-bundle-${i}`)) {
        const needs = cards.map((c) => keys.find((k) => k.startsWith(`rw-${c.dataset.pid}-`)));
        const total = cards.reduce((s, c) => s + Number(c.dataset.price), 0), save = Math.round(total * bundlePct) / 100;
        document.dispatchEvent(new CustomEvent('av:add', { detail: { items: [], discount: { key: `rw-bundle-${i}`, name: `${heroes[i].dataset.name} bundle`, sub: `${bundlePct}% off the full look`, price: -save, img: absUrl(`img/rw-${i + 1}-640.webp`), fixed: true, needs } } }));
        toast('Full look in your bag. Bundle saving applied.');
      }
    });
  }
  document.addEventListener('av:cart', (e) => syncFromCart(e.detail.keys));

  function addFullLook(btn) {
    const panel = btn.closest('[data-rw-panel]'); if (panel.classList.contains('is-complete') || btn.classList.contains('is-loading')) return;
    const msg = $('[data-rw-msg]', panel); msg.textContent = '';
    const todo = cardsOf(panel).filter((c) => !inBag(c.dataset.pid)), rdy = todo.filter(ready), pending = todo.filter((c) => !ready(c));
    if (rdy.length) {
      btn.classList.add('is-loading');
      addCards(rdy, panel, () => { btn.classList.remove('is-loading'); if (!pending.length) toast('Look added to your bag'); });
    }
    if (pending.length) {
      (mobile ? [pending[0]] : pending).forEach((c) => openPicker(c, true));
      msg.textContent = `Pick a size for: ${pending.map((c) => c.dataset.title).join(', ')}`;
      if (!mobile) { const list = pending[0].parentElement; setTimeout(() => list.scrollTo({ top: pending[0].offsetTop - list.offsetTop - 12, behavior: reduce ? 'auto' : 'smooth' }), 60); }
    }
  }

  /* ---------- clicks ---------- */
  root.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-rw-pick-close]')) { closeAllPickers(); return; }
    if (t.closest('[data-rw-zoom-close]')) { closeZoom(); return; }
    if (zoomed && t.closest('[data-rw-lb-stage]') && !t.closest('.rw__lb-model')) { closeZoom(); return; }
    if (t.closest('[data-rw-zoom]')) { openZoom(); return; }
    if (t.closest('[data-rw-next]')) { next(); return; }
    if (t.closest('[data-rw-prev]')) { prev(); return; }
    const tk = t.closest('[data-rw-tick]'); if (tk) { go(Number(tk.dataset.rwTick)); return; }
    if (t.closest('[data-rw-auto]')) { if (!playing) engaged = false; play(!playing); return; }
    const pin = t.closest('[data-rw-pin]'); if (pin) { engage(); hot(Number(pin.dataset.rwPin), true); return; }
    const hit = t.closest('.rw__hit');
    if (hit) { const a = Number(hit.closest('.rw__model').dataset.index), k = signedRank(a); if (k !== 0 && Math.abs(k) < N / 2) moveTo(Math.round(target) + k); else openZoom(); return; }
    const conf = t.closest('[data-rw-confirm]');
    if (conf) { const card = conf.closest('[data-rw-card]'); card.dataset.touched = '1'; engage(); addCards([card], card.closest('[data-rw-panel]'), () => toast(`${card.dataset.title} added to your bag`)); return; }
    const add = t.closest('[data-rw-add]');
    if (add) { const card = add.closest('[data-rw-card]'); engage(); if (card.classList.contains('is-added')) return; picker(card).hidden ? openPicker(card) : closePicker(card); return; }
    const all = t.closest('[data-rw-all]'); if (all) { engage(); addFullLook(all); }
  });
  root.addEventListener('change', (e) => {
    if (e.target.matches('[data-rw-option]')) { engage(); const card = e.target.closest('[data-rw-card]'); card.dataset.touched = '1'; }
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (root.classList.contains('rw--picking')) closeAllPickers(); else closeZoom(); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && zoomed) closeZoom(); });

  /* ---------- observers, resize, start ---------- */
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0 }).observe(root);
  if (reduce) root.classList.add('is-revealed');
  else {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-revealed'))); io.disconnect(); } }, { rootMargin: '0px 0px -22% 0px' });
    io.observe(root);
  }
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(measure, 120); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(measure, 60); }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  measure();
  setIndex(0, true);
  if (root.dataset.autoplay === 'true' && !reduce) play(true);
}
