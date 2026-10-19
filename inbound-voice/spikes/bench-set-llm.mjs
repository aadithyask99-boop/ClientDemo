// Switch the LLM of a named model configuration (default: "Gemini and Deepgram"), keeping everything else. Backs up the old
// llm block to /tmp first.   node spikes/bench-set-llm.mjs <model> <providerConnectionUuid> [providerOrder,comma,separated]
//   Haiku via OpenRouter:  anthropic/claude-haiku-5.5  679de698-839b-4812-b9d5-32d272663671  anthropic
//   Gemini on Google:      gemini-3.5-flash-lite       63b53c85-5af8-44f7-863f-4f562b6431ba
import fs from "node:fs";

const base = process.env.DG_API;
const CFG = process.env.CONFIG_UUID ?? "4092195d-1714-408b-8d97-57f907bcfde0";
const [model, conn, order] = process.argv.slice(2);
if (!model || !conn) throw new Error("usage: bench-set-llm.mjs <model> <providerConnectionUuid> [providerOrder]");
let tok = "";
async function api(method, path, body) {
  const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch {}
  return { s: r.status, j };
}
const li = await api("POST", "/auth/login", { email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD });
tok = li.j.token;
const cur = await api("GET", "/model-connections/model-configurations/" + CFG);
if (cur.s >= 400) { console.log("fetch failed", cur.s, JSON.stringify(cur.j).slice(0, 200)); process.exit(1); }
const spec = structuredClone(cur.j.configuration);
fs.writeFileSync("/tmp/llm-before-" + Date.now() + ".json", JSON.stringify(spec.llm));
console.log("before:", JSON.stringify(spec.llm).replace(/"provider_connection_uuid":"[^"]{8}[^"]*"/, '"conn":"..."'));
spec.llm = { ...spec.llm, provider_connection_uuid: conn, settings: { ...spec.llm.settings, model } };
if (order) spec.llm.settings.provider_order = order.split(",");
else delete spec.llm.settings.provider_order;
const up = await api("PATCH", "/model-connections/model-configurations/" + CFG, { name: cur.j.name, configuration: spec });
console.log("PATCH", up.s, up.s >= 400 ? JSON.stringify(up.j).slice(0, 300) : "ok");
const after = await api("GET", "/model-connections/model-configurations/" + CFG);
console.log("after: ", JSON.stringify(after.j?.configuration?.llm).replace(/"provider_connection_uuid":"[^"]{8}[^"]*"/, '"conn":"..."'));
