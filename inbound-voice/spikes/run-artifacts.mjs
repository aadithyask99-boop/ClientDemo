// Shows whether a Dograh run has a recording and transcript link, and whether each link can be fetched (status only, never the link).
//
//   DG_API=http://localhost:8000/api/v1 DG_EMAIL=... DG_PASSWORD=... node run-artifacts.mjs <run id>
const base = process.env.DG_API;
const run = process.argv[2];
if (!base || !process.env.DG_EMAIL || !process.env.DG_PASSWORD || !run) throw new Error("DG_API, DG_EMAIL, DG_PASSWORD and a run id are required");

const login = await (await fetch(base + "/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD }) })).json();
const res = await fetch(`${base}/workflow/1/runs/${run}`, { headers: { authorization: "Bearer " + login.token } });
const body = await res.json();
console.log("run", run, "status", res.status, "is_completed", body.is_completed, "state", body.state ?? body.status ?? "?");

const found = [];
const walk = (v, path) => {
  if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  else if (typeof v === "string" && /^https?:\/\//.test(v) && /transcript|recording|audio|url/i.test(path)) found.push([path, v]);
};
walk(body, "run");
if (!found.length) console.log("no recording or transcript links on this run");
for (const [path, url] of found) {
  let status;
  try {
    status = (await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) })).status;
  } catch (err) {
    status = "unreachable: " + (err.cause?.code ?? err.message);
  }
  console.log(path.padEnd(48), "->", status);
}
console.log("keys with storage hints:", Object.keys(body).filter((k) => /storage|transcript|recording|artifact/i.test(k)).join(", ") || "(none)");
