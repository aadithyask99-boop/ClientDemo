type Scores = Partial<Record<string, number>>;
type Data = {
  questions: { q: string; a: { t: string; s: Scores }[] }[];
  personas: Record<string, { name: string; line: string }>;
  treatments: { id: string; name: string; price: string; for: string }[];
  book: string;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

// One question at a time. Answers add weight to the four facials, the highest total wins.
export function initQuiz() {
  const root = document.querySelector<HTMLElement>('[data-quiz]');
  const stage = root?.querySelector<HTMLElement>('[data-stage]');
  const dots = [...(root?.querySelectorAll<HTMLElement>('[data-dots] i') ?? [])];
  if (!root || !stage) return;
  const data: Data = JSON.parse(root.dataset.quizData ?? '{}');
  const first = stage.innerHTML;

  let step = 0;
  const total: Scores = {};
  let firstPick: Scores = {};

  const swap = (html: string, after?: () => void) => {
    stage.classList.add('swap');
    window.setTimeout(() => {
      stage.innerHTML = html;
      stage.classList.remove('swap');
      after?.();
    }, 520);
  };

  const paintDots = (n: number) => dots.forEach((d, i) => d.classList.toggle('done', i < n));

  const question = (i: number) => {
    const q = data.questions[i];
    return `
      <h3 class="quiz__q">${esc(q.q)}</h3>
      <div class="quiz__a">
        ${q.a.map((a, k) => `<button class="opt" type="button" data-k="${k}"><span>${esc(a.t)}</span></button>`).join('')}
      </div>`;
  };

  const result = () => {
    const ids = data.treatments.map((t) => t.id);
    const best = ids.slice().sort((a, b) => (total[b] ?? 0) - (total[a] ?? 0) || (firstPick[b] ?? 0) - (firstPick[a] ?? 0))[0];
    const persona = data.personas[best];
    const tx = data.treatments.find((t) => t.id === best)!;
    return `
      <div class="quiz__result" style="display:grid;gap:1.6rem;justify-items:center">
        <h3 class="h2">${esc(persona.name)}</h3>
        <p class="lede">${esc(persona.line)} We would suggest the <span class="ac">${esc(tx.name)}</span>, ${esc(tx.price.toLowerCase())}, for ${esc(tx.for.toLowerCase())}.</p>
        <div style="display:flex;flex-wrap:wrap;gap:1rem 1.4rem;justify-content:center;align-items:center">
          <a class="btn btn--lg" href="#book" data-facial="${esc(best)}" data-magnet><span class="lbl">Request ${esc(tx.name)}</span><span class="arr" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M5 13 13 5M6 5h7v7" /></svg></span></a>
          <button class="quiz__restart link" type="button" data-restart>Start again</button>
        </div>
      </div>`;
  };

  const go = () => {
    if (step < data.questions.length) {
      paintDots(step);
      swap(question(step));
    } else {
      paintDots(data.questions.length);
      swap(result());
    }
  };

  root.addEventListener('click', (e) => {
    const el = e.target as Element;
    if (el.closest('[data-start]')) {
      step = 0;
      Object.keys(total).forEach((k) => delete total[k]);
      firstPick = {};
      go();
      return;
    }
    const opt = el.closest<HTMLElement>('.opt');
    if (opt) {
      const a = data.questions[step].a[Number(opt.dataset.k)];
      Object.entries(a.s).forEach(([k, v]) => (total[k] = (total[k] ?? 0) + (v ?? 0)));
      if (step === 0) firstPick = { ...a.s };
      step += 1;
      go();
      return;
    }
    if (el.closest('[data-restart]')) {
      paintDots(0);
      swap(first);
    }
  });
}
