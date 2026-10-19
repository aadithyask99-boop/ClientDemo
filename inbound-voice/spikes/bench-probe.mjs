// Read-only: finds where a finished run stores its per-reply delay numbers.   node spikes/bench-probe.mjs <runId>
const base = process.env.DG_API;
let tok = "";
async function api(method, path, body) {
  const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch {}
  return { s: r.status, j };
}
const li = await api("POST", "/auth/login", { email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD });
tok = li.j.token;
const run = await api("GET", "/workflow/" + (process.env.WORKFLOW_ID ?? "1") + "/runs/" + process.argv[2]);
console.log("status", run.s, "top keys:", Object.keys(run.j ?? {}).join(","));
const hits = [];
(function walk(v, path) {
  if (Array.isArray(v)) v.slice(0, 40).forEach((x, i) => walk(x, path + "[" + i + "]"));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, path + "." + k);
  else if (/delay|latenc|ttfb|reason|duration_ms|_ms$/i.test(path)) hits.push(path + " = " + String(v).slice(0, 60));
})(run.j, "");
console.log(hits.slice(0, 25).join("\n"));
