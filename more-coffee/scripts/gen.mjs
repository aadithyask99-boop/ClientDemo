// Seedream via OpenRouter. Usage: node scripts/gen.mjs jobs.json
// jobs.json: [{ "name":"hero-a", "prompt":"...", "refs":["path.png"], "aspect":"1:1" }]
// Reads OPENROUTER_API_KEY / SEEDREAM_MODEL / ASSET_OUT_DIR / MAX_IMAGES_PER_RUN from env, falling back to .env.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

if (existsSync(".env")) for (const l of readFileSync(".env", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
}
const { OPENROUTER_API_KEY: KEY, SEEDREAM_MODEL: MODEL = "bytedance-seed/seedream-5-0-flash" } = process.env;
const OUT = process.env.ASSET_OUT_DIR || "public/img";
const MAX = +(process.env.MAX_IMAGES_PER_RUN || 20);
if (!KEY) { console.error("OPENROUTER_API_KEY missing"); process.exit(1); }

const jobs = JSON.parse(readFileSync(process.argv[2], "utf8"));
if (jobs.length > MAX) { console.error(`${jobs.length} jobs > MAX_IMAGES_PER_RUN=${MAX}`); process.exit(1); }
const dataUri = (p) => `data:image/${p.endsWith(".png") ? "png" : "jpeg"};base64,${readFileSync(p).toString("base64")}`;

const run = async (j) => {
  const content = [{ type: "text", text: j.prompt }, ...(j.refs || []).map((p) => ({ type: "image_url", image_url: { url: dataUri(p) } }))];
  const body = { model: MODEL, modalities: ["image"], messages: [{ role: "user", content }] };
  if (j.aspect) body.image_config = { aspect_ratio: j.aspect };
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json();
  const url = d.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error(JSON.stringify(d.error || d).slice(0, 300));
  const file = resolve(OUT, j.name + ".png"); mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
  console.log(`ok  ${j.name}  $${d.usage?.cost ?? "?"}  -> ${file}`);
  return d.usage?.cost || 0;
};
const costs = await Promise.allSettled(jobs.map(run));
costs.filter((c) => c.status === "rejected").forEach((c) => console.error("FAIL", c.reason.message));
console.log("total $", costs.reduce((a, c) => a + (c.value || 0), 0).toFixed(3));
