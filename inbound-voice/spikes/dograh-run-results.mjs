// Usage: DG_API=... DG_EMAIL=... DG_PASSWORD=... RUN=<run id> node dograh-run-results.mjs   (prints the tool calls and their results for one run)
const base = process.env.DG_API;
let tok = "";
async function api(method, path, body) {
  const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { s: r.status, j };
}
tok = (await api("POST", "/auth/login", { email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD })).j.token;
const run = process.env.RUN;
const info = await api("GET", `/workflow/1/runs/${run}`);
for (const t of info.j?.gathered_context?.tool_results ?? []) console.log(t.function_name, JSON.stringify(t.arguments), "=>", JSON.stringify(t.result).slice(0, 600));
