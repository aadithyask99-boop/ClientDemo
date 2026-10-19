// Set the TTS model (and optionally voice) of a named model configuration, keeping everything else. Backs up the old tts block.
//   CONFIG_UUID=<uuid> node spikes/bench-set-tts.mjs <model> [voice]
//   e.g. CONFIG_UUID=59217dde-aa22-4bef-b083-2805a2e3a3ff node spikes/bench-set-tts.mjs elevenlabs/eleven-v4-turbo george
import fs from "node:fs";

const base = process.env.DG_API;
const CFG = process.env.CONFIG_UUID;
const [model, voice] = process.argv.slice(2);
if (!CFG || !model) throw new Error("usage: CONFIG_UUID=<uuid> bench-set-tts.mjs <model> [voice]");
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
if (cur.s >= 400) { console.log("fetch failed", cur.s); process.exit(1); }
const spec = structuredClone(cur.j.configuration);
fs.writeFileSync("/tmp/tts-before-" + Date.now() + ".json", JSON.stringify(spec.tts));
const mask = (v) => JSON.stringify(v).replace(/"provider_connection_uuid":"[^"]{8}[^"]*"/, '"conn":"..."');
console.log("before:", mask(spec.tts));
spec.tts = { ...spec.tts, settings: { ...spec.tts.settings, model, ...(voice ? { voice } : {}) } };
const up = await api("PATCH", "/model-connections/model-configurations/" + CFG, { name: cur.j.name, configuration: spec });
console.log("PATCH", up.s, up.s >= 400 ? JSON.stringify(up.j).slice(0, 300) : "ok");
const after = await api("GET", "/model-connections/model-configurations/" + CFG);
console.log("after: ", mask(after.j?.configuration?.tts));
