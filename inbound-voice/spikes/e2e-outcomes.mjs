// End-to-end spike 2: outcomes and caller number. Same setup as e2e-dograh-webhook.mjs (Dograh :8000, call-service :3100,
// Twenty dev server :2020). Enables Dograh disposition extraction with OUR outcome codes, simulates inbound telephony
// variables through initial_context, runs scenarios, and compares the outcome that lands in Twenty with the expected one.
// Usage: node e2e-outcomes.mjs <work-dir>
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
const step = (label, r, extra = "") => console.log(label.padEnd(26), r.s, r.s >= 400 ? JSON.stringify(r.j).slice(0, 220) : "ok " + extra);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Our outcome codes as Dograh dispositions. The code is stored verbatim; the description tells the classifier when to pick it.
const DISPOSITIONS = [
  { code: "booked", description: "The caller agreed to a specific appointment date and time and the agent confirmed it." },
  { code: "message_taken", description: "The caller left a message for staff, and no callback time was discussed and no booking was made." },
  { code: "transferred", description: "The call was handed to a human and connected." },
  { code: "transfer_failed", description: "A handoff to a human was attempted or promised but did not connect." },
  { code: "info_given", description: "The caller asked for information and the agent answered it, with no booking, message or callback." },
  { code: "callback_requested", description: "The caller asked to be called back and a time or period for the callback was discussed." },
  { code: "opted_out", description: "The caller explicitly asked not to be contacted again or to be removed from calling lists." },
  { code: "no_outcome", description: "None of the other outcomes applies, or the caller did not speak." },
];

const CALLER = "+447400123456"; // simulated inbound caller, passed the way Dograh telephony would
const CALLED = "+442071234567";
const SCENARIOS = [
  { name: "callback", expect: "CALLBACK_REQUESTED", turns: ["Hi, I'm Sam Rivera. Could someone call me back tomorrow afternoon about my crown?", "Three o'clock works. Please call me then. Thanks, goodbye."] },
  { name: "opt-out", expect: "OPTED_OUT", turns: ["Please remove my number from your list. Do not contact me again."] },
  { name: "info (informational)", expect: null, turns: ["What time do you open on Saturdays?", "Thanks, that's all I needed."] },
];

// 1. Account, credential, agent.
const pw = randomBytes(18).toString("base64url");
const email = `client-${randomBytes(3).toString("hex")}@spike-inbound.dev`;
const su = await api("POST", "/auth/signup", { email, password: pw, name: "Client A" });
step("signup", su);
if (su.s >= 400) process.exit(1);
tok = su.j.token;
fs.writeFileSync(dir + "/dograh-e2e-admin.txt", `email=${email}\npassword=${pw}\n`, { mode: 0o600 });
const cred = await api("POST", "/credentials/", { name: "call-service", credential_type: "bearer_token", credential_data: { token: webhookToken } });
step("credential", cred);
const wf = await api("POST", "/workflow/create/template", { call_type: "inbound", use_case: "Appointment booking receptionist", activity_description: "Answer inbound calls for a dental clinic and book appointments" });
step("template workflow", wf);
const id = wf.j?.id;
if (!id || !cred.j?.uuid) process.exit(1);

// 2. Webhook node (payload uses the real telephony variables) and disposition extraction with our codes.
// Also: the agent extracts its own `outcome` variable. On text chats the platform keeps only the end reason as the
// disposition, but extracted variables are kept, so this is how the outcome reaches the webhook there.
const cur = await api("GET", "/workflow/fetch/" + id);
const def = cur.j.workflow_definition;
const agentNode = def.nodes.find((n) => n.type === "agentNode");
agentNode.data.extraction_enabled = true;
agentNode.data.extraction_prompt = "Decide how the call ended and report it.";
agentNode.data.extraction_variables = [
  { name: "outcome", type: "string", prompt: "Exactly one of: booked, message_taken, transferred, transfer_failed, info_given, callback_requested, opted_out, no_outcome. callback_requested means the caller asked to be called back. opted_out means the caller asked not to be contacted again." },
];
def.nodes.push({
  id: "webhook-call-service",
  type: "webhook",
  position: { x: 900, y: 0 },
  data: {
    name: "Send call to call-service",
    enabled: true,
    http_method: "POST",
    endpoint_url: callService + "/webhooks/dograh",
    credential_uuid: cred.j.uuid,
    custom_headers: [],
    payload_template: {
      run_id: "{{workflow_run_id}}",
      called_at: "{{call_time}}",
      caller: "{{initial_context.caller_number}}",
      called: "{{initial_context.called_number}}",
      duration: "{{cost_info.call_duration_seconds}}",
      disposition: "{{gathered_context.call_disposition}}",
      outcome_hint: "{{gathered_context.outcome}}",
      call_status: "{{gathered_context.call_status}}",
      summary: "{{gathered_context.summary}}",
      recording_url: "{{recording_url}}",
      transcript_url: "{{transcript_url}}",
    },
  },
});
const cfg = { ...(cur.j.workflow_configurations ?? {}), call_dispositions: DISPOSITIONS };
const upd = await api("PUT", "/workflow/" + id, { workflow_definition: def, workflow_configurations: cfg });
step("webhook + dispositions", upd);
const pub = await api("POST", `/workflow/${id}/publish`);
step("publish", pub);
const back = await api("GET", "/workflow/fetch/" + id);
console.log("  stored dispositions:".padEnd(26), (back.j?.workflow_configurations?.call_dispositions ?? []).map((d) => d.code).join(",") || "NONE");

// 3. Twenty reader (dev server; the API key from the CLI config is never printed).
const conf = fs.readFileSync(os.homedir() + "/.twenty/config.json", "utf8");
const key = (conf.match(/"(?:apiKey|token|accessToken)"\s*:\s*"([^"]+)"/) ?? [])[1] ?? "";
async function twentyCall(providerCallId) {
  const r = await fetch("http://localhost:2020/graphql", {
    method: "POST",
    headers: { authorization: "Bearer " + key, "content-type": "application/json" },
    body: JSON.stringify({ query: `{calls(first:1, filter:{providerCallId:{eq:"${providerCallId}"}}){edges{node{providerCallId outcome callerNumber durationSeconds summary}}}}` }),
  });
  return (await r.json()).data?.calls?.edges?.[0]?.node ?? null;
}

// 4. Scenarios.
const results = [];
for (const sc of SCENARIOS) {
  const s = await api("POST", `/workflow/${id}/text-chat/sessions`, { name: sc.name, initial_context: { caller_number: CALLER, called_number: CALLED } });
  const run = s.j?.workflow_run_id;
  if (!run) { console.log(sc.name, "could not start", JSON.stringify(s.j).slice(0, 150)); continue; }
  for (const text of sc.turns) await api("POST", `/workflow/${id}/text-chat/sessions/${run}/messages`, { text });
  await api("POST", `/workflow/${id}/text-chat/sessions/${run}/end`, {});
  let node = null;
  for (let i = 0; i < 25 && !node; i++) { await sleep(3000); node = await twentyCall(`dograh:${run}`); }
  results.push({ name: sc.name, expect: sc.expect, node });
}

console.log("\nSCENARIO".padEnd(24), "EXPECTED".padEnd(20), "GOT".padEnd(20), "CALLER".padEnd(16), "VERDICT");
for (const r of results) {
  const got = r.node?.outcome ?? "(no record)";
  const verdict = !r.node ? "FAIL: nothing reached Twenty" : r.expect === null ? "info" : got === r.expect ? "PASS" : "FAIL";
  console.log(r.name.padEnd(24), String(r.expect).padEnd(20), got.padEnd(20), String(r.node?.callerNumber ?? "").padEnd(16), verdict);
}
