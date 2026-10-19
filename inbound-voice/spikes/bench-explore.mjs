// Read-only: prints the shape of Dograh's named model configurations and provider connections (secrets masked).
//   DG_API=http://localhost:8000/api/v1 DG_EMAIL=... DG_PASSWORD=... node spikes/bench-explore.mjs
const base = process.env.DG_API;
let tok = "";
async function api(method, path, body) {
  const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch {}
  return { s: r.status, j };
}
const li = await api("POST", "/auth/login", { email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD });
if (li.s >= 400) { console.log("login failed", li.s); process.exit(1); }
tok = li.j.token;
const mask = (v) => JSON.stringify(v, (k, x) => (/key|secret|token|password|credential/i.test(k) ? "***" : x));
const cfgs = await api("GET", "/model-connections/model-configurations");
const conns = await api("GET", "/model-connections/provider-connections");
const list = Array.isArray(cfgs.j) ? cfgs.j : (cfgs.j?.configurations ?? cfgs.j?.items ?? []);
for (const c of list) console.log("CONFIG", c.uuid, c.name, mask(c.configuration));
const cl = Array.isArray(conns.j) ? conns.j : (conns.j?.connections ?? conns.j?.items ?? []);
for (const c of cl) console.log("CONN", c.uuid, c.name, c.provider, c.is_active, mask(c.connection_settings));
