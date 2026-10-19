// Read-only: where does the delay in a call come from? Per run: median / worst time-to-first-output of each stage
// (stt = hearing, llm = the model, tts = the voice) and the measured gap between the caller stopping and the agent speaking.
//   DG_API=http://localhost:8000/api/v1 DG_EMAIL=... DG_PASSWORD=... node spikes/bench-latency.mjs 344 396 397 ...
const base = process.env.DG_API;
const wf = process.env.WORKFLOW_ID ?? "1";
const login = await (await fetch(base + "/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD }) })).json();
const get = async (p) => (await fetch(base + p, { headers: { authorization: "Bearer " + login.token } })).json();
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) / 2)] : NaN);
const mx = (a) => (a.length ? Math.max(...a) : NaN);
const f = (n) => (Number.isNaN(n) ? "  -  " : n.toFixed(2).padStart(5));
console.log("run   model                          voice            | llm med/max | tts med/max | stt med/max | gap med/max (n)");
for (const id of process.argv.slice(2)) {
  const r = await get(`/workflow/${wf}/runs/${id}`);
  const ev = r.logs?.realtime_feedback_events ?? [];
  const by = { llm: [], tts: [], stt: [] };
  const gap = [];
  let llmName = "", ttsName = "";
  for (const e of ev) {
    const p = e.payload ?? {};
    if (e.type === "rtf-ttfb-metric" && by[p.kind]) {
      by[p.kind].push(p.ttfb_seconds);
      if (p.kind === "llm") llmName = p.model ?? llmName;
      if (p.kind === "tts") ttsName = p.model ?? ttsName;
    }
    if (e.type === "rtf-latency-measured") gap.push(p.latency_seconds);
  }
  console.log(String(id).padEnd(5), llmName.slice(0, 30).padEnd(30), ttsName.slice(0, 16).padEnd(16), "|",
    f(med(by.llm)), f(mx(by.llm)), "|", f(med(by.tts)), f(mx(by.tts)), "|", f(med(by.stt)), f(mx(by.stt)), "|", f(med(gap)), f(mx(gap)), `(${gap.length})`);
}
