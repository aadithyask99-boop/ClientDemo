// Usage: DG_API=https://<codespace>-8000.app.github.dev/api/v1 DG_EMAIL=... DG_PASSWORD=... [TURNS="a|b|c"] node dograh-chat-test.mjs
// Drives the agent (workflow 1) through Dograh text chat and prints what each tool returned. Text chat does not test voice or latency.
const base = process.env.DG_API;
let tok = "";
async function api(method, path, body) {
  const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j };
}
tok = (await api("POST", "/auth/login", { email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD })).j.token;
const turns = (process.env.TURNS ?? "Hi.|What is this about?|I'd like a plumber to look at a leaking tap next Tuesday morning.|The first one is fine. My name is Sam Rivera.|Great, thanks. Goodbye.").split("|");
const s = await api("POST", "/workflow/1/text-chat/sessions", { name: "rebuild check", initial_context: { caller_number: "+447824678418", called_number: "+442030972037" } });
console.log("session", s.s, JSON.stringify(s.j).slice(0, 300));
const run = s.j?.workflow_run_id;
if (!run) process.exit(1);
for (const text of turns) {
  const m = await api("POST", `/workflow/1/text-chat/sessions/${run}/messages`, { text });
  console.log("\nCALLER:", text);
  console.log("AGENT :", m.s, JSON.stringify(m.j).slice(0, 900));
}
const end = await api("POST", `/workflow/1/text-chat/sessions/${run}/end`, {});
console.log("\nend", end.s);
await new Promise((r) => setTimeout(r, 8000));
const info = await api("GET", `/workflow/1/runs/${run}`);
const gc = info.j?.gathered_context ?? {};
console.log("run", info.s, "keys", Object.keys(info.j ?? {}).join(","));
console.log("nodes_visited", JSON.stringify(gc.nodes_visited), "disposition", gc.call_disposition, "outcome", gc.outcome);
console.log("tool_results", JSON.stringify(gc.tool_results ?? null).slice(0, 1500));
