// End-to-end spike (run in a Codespace with Dograh on :8000, call-service on :3100, Twenty dev server on :2020).
// Provisions a client in Dograh over its API, runs a text-chat call, and checks the call lands in Twenty exactly once.
// Usage: node e2e-dograh-webhook.mjs <work-dir>   (the work dir holds tenants.json, written by e2e-dograh-webhook.sh)
import fs from "node:fs";
import os from "node:os";
import { randomBytes } from "node:crypto";

const dir = process.argv[2];
const tenants = JSON.parse(fs.readFileSync(dir + "/tenants.json", "utf8"));
const webhookToken = tenants[0].dograhWebhookToken;
const dograh = "http://localhost:8000/api/v1";
const callService = "http://localhost:3100";
let tok = "";

async function api(method, path, body) {
  const r = await fetch(dograh + path, {
    method,
    headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null;
  try { j = await r.json(); } catch {}
  return { s: r.status, j };
}
const step = (label, r, extra = "") => console.log(label.padEnd(26), r.s, r.s >= 400 ? JSON.stringify(r.j).slice(0, 200) : "ok " + extra);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. A Dograh account for this client (generated password, kept in a gitignored file, never printed).
const pw = randomBytes(18).toString("base64url");
const su = await api("POST", "/auth/signup", { email: "client-a@spike-inbound.dev", password: pw, name: "Client A" });
step("signup", su);
if (su.s >= 400) process.exit(1);
tok = su.j.token;
fs.writeFileSync(dir + "/dograh-e2e-admin.txt", `email=client-a@spike-inbound.dev\npassword=${pw}\n`, { mode: 0o600 });

// 2. The bearer credential Dograh will send to our webhook.
const cred = await api("POST", "/credentials/", { name: "call-service", credential_type: "bearer_token", credential_data: { token: webhookToken } });
step("credential", cred);
const credUuid = cred.j?.uuid;
if (!credUuid) process.exit(1);

// 3. An inbound agent from the template, then a webhook node added to its definition.
const wf = await api("POST", "/workflow/create/template", { call_type: "inbound", use_case: "Appointment booking receptionist", activity_description: "Answer inbound calls for a dental clinic and book appointments" });
step("template workflow", wf);
const id = wf.j?.id;
if (!id) process.exit(1);
const cur = await api("GET", "/workflow/fetch/" + id);
const def = cur.j.workflow_definition;
def.nodes.push({
  id: "webhook-call-service",
  type: "webhook",
  position: { x: 900, y: 0 },
  data: {
    name: "Send call to call-service",
    enabled: true,
    http_method: "POST",
    endpoint_url: callService + "/webhooks/dograh",
    credential_uuid: credUuid,
    custom_headers: [],
    payload_template: {
      run_id: "{{workflow_run_id}}",
      called_at: "{{call_time}}",
      caller: "{{initial_context.phone_number}}",
      duration: "{{cost_info.call_duration_seconds}}",
      disposition: "{{gathered_context.call_disposition}}",
      summary: "{{gathered_context.summary}}",
      recording_url: "{{recording_url}}",
      transcript_url: "{{transcript_url}}",
    },
  },
});
const upd = await api("PUT", "/workflow/" + id, { workflow_definition: def });
step("add webhook node", upd);
const pub = await api("POST", `/workflow/${id}/publish`);
step("publish", pub);

// 4. Twenty baseline (dev server, API key from the CLI config; the key is never printed).
const cfg = fs.readFileSync(os.homedir() + "/.twenty/config.json", "utf8");
const key = (cfg.match(/"(?:apiKey|token|accessToken)"\s*:\s*"([^"]+)"/) ?? [])[1] ?? "";
async function twentyCalls() {
  const r = await fetch("http://localhost:2020/graphql", {
    method: "POST",
    headers: { authorization: "Bearer " + key, "content-type": "application/json" },
    body: JSON.stringify({ query: "{calls(first:50){totalCount edges{node{providerCallId outcome durationSeconds}}}}" }),
  });
  return (await r.json()).data?.calls;
}
const before = await twentyCalls();
console.log("twenty calls before".padEnd(26), before?.totalCount);

// 5. A text-chat call: two caller turns, then end the session.
const s = await api("POST", `/workflow/${id}/text-chat/sessions`, { name: "e2e" });
step("start chat", s);
const run = s.j?.workflow_run_id;
for (const text of ["Hi, I'd like to book a cleaning next Tuesday morning.", "My name is Sam Rivera. Thanks, that's all."]) {
  const m = await api("POST", `/workflow/${id}/text-chat/sessions/${run}/messages`, { text });
  step("message", m, "state " + m.j?.state);
}
const end = await api("POST", `/workflow/${id}/text-chat/sessions/${run}/end`);
step("end chat", end, "state " + end.j?.state);

// 6. Wait for the webhook, the queue and Twenty.
let found = null;
for (let i = 0; i < 20 && !found; i++) {
  await sleep(3000);
  const now = await twentyCalls();
  found = now?.edges?.map((e) => e.node).find((n) => n.providerCallId === `dograh:${run}`) ?? null;
}
const after = await twentyCalls();
console.log("twenty calls after".padEnd(26), after?.totalCount);
console.log("RESULT:", found ? "FOUND " + JSON.stringify(found) : "NOT FOUND (webhook did not arrive or write failed)");
