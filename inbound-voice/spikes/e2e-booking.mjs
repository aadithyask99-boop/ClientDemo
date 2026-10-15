// End-to-end spike 3: booking tools. Gives a Dograh agent two HTTP tools (check_availability, book_appointment) served by
// call-service, runs text-chat conversations, and checks what reached Twenty. Also adds an `outcome` variable the agent
// extracts itself, as a fix for text chats where the platform stores only the end reason as the disposition.
// Same setup as the other e2e scripts. Usage: node e2e-booking.mjs <work-dir>
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
const step = (label, r, extra = "") => console.log(label.padEnd(26), r.s, r.s >= 400 ? JSON.stringify(r.j).slice(0, 260) : "ok " + extra);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

const BOOKING_PROMPT = `

## Booking appointments
You are the virtual receptionist for Acme Dental. Today is {{current_weekday_Europe/London}}, {{current_time_Europe/London}} (UK time).
To book: find out what the caller wants and roughly when. Call check_availability with the date as YYYY-MM-DD (work it out from today's date, for example "next Tuesday"). Offer at most three of the returned times, using each slot's label. When the caller picks one, ask for their name if you do not have it, then call book_appointment with that slot's exact start value copied from the results. Never say an appointment is booked unless book_appointment returned booked true. If it fails or the time is gone, offer another time or take a message. Keep replies short.

## Every call must end with a recorded result
Before you say goodbye you MUST have called exactly one of: book_appointment, take_message or record_outcome. Never finish a call without one of them.
- The caller wants to leave a message: call take_message with the message, their name and a callback number if given.
- The caller asks to be called back: agree a time or period, then in that same turn call record_outcome with outcome callback_requested and the agreed time in note.
- The caller says anything like "remove my number", "don't contact me again" or "stop calling": in that same turn call record_outcome with outcome opted_out, then confirm briefly.
- You only answered questions: call record_outcome with outcome info_given.
- None of the above applies: call record_outcome with outcome no_outcome.
Call the tool first, then speak.`;

const CALLER = "+447400123456";
const CALLED = "+442071234567";
const SCENARIOS = [
  { name: "book a slot", expect: "BOOKED", turns: ["Hi, I'd like to book a teeth cleaning next Tuesday morning.", "The first one works for me. My name is Sam Rivera.", "Great, thank you. Goodbye."] },
  { name: "closed day, no booking", expect: null, turns: ["Can I book a check-up this Sunday?", "No, that's all right. I'll think about it. Thanks, bye."] },
  { name: "opt-out (one message)", expect: "OPTED_OUT", turns: ["Please remove my number from your list. Do not contact me again."] },
  { name: "leave a message", expect: "MESSAGE_TAKEN", turns: ["I'd like to leave a message for the dentist please.", "It's Sam Rivera. Please ring me about my crown, my number is 07400 123456.", "That's everything, thanks. Bye."] },
  { name: "callback", expect: "CALLBACK_REQUESTED", turns: ["Could someone call me back tomorrow afternoon about my crown?", "Three o'clock works. Thanks, goodbye."] },
];

// 1. Account, credential, tools, agent.
const pw = randomBytes(18).toString("base64url");
const email = `client-${randomBytes(3).toString("hex")}@spike-inbound.dev`;
const su = await api("POST", "/auth/signup", { email, password: pw, name: "Client A" });
step("signup", su);
if (su.s >= 400) process.exit(1);
tok = su.j.token;
fs.writeFileSync(dir + "/dograh-e2e-admin.txt", `email=${email}\npassword=${pw}\n`, { mode: 0o600 });
const cred = await api("POST", "/credentials/", { name: "call-service", credential_type: "bearer_token", credential_data: { token: webhookToken } });
step("credential", cred);
const credUuid = cred.j?.uuid;
if (!credUuid) process.exit(1);

const mkTool = (name, description, path, parameters, preset) =>
  api("POST", "/tools/", {
    name,
    description,
    category: "http_api",
    definition: {
      schema_version: 1,
      type: "http_api",
      config: { method: "POST", url: callService + path, credential_uuid: credUuid, parameters, ...(preset ? { preset_parameters: preset } : {}), timeout_ms: 8000 },
      messages: [],
    },
  });
const t1 = await mkTool(
  "check_availability",
  "Look up free appointment times on a given date. Use this as soon as the caller says when they would like to come in, before offering any time. Returns up to six slots with a label to read out and an exact start value.",
  "/tools/availability",
  [
    { name: "date", type: "string", description: "The date to check, formatted YYYY-MM-DD. Work it out from today's date and what the caller said.", required: true },
    { name: "part_of_day", type: "string", description: "morning or afternoon, only if the caller asked for one. Otherwise leave it out.", required: false },
  ],
);
step("tool check_availability", t1);
const t2 = await mkTool(
  "book_appointment",
  "Book the appointment the caller chose. Only call this after the caller has picked one of the times returned by check_availability and you have their name.",
  "/tools/book",
  [
    { name: "start", type: "string", description: "The exact start value of the chosen slot, copied unchanged from the check_availability result.", required: true },
    { name: "name", type: "string", description: "The caller's full name.", required: true },
    { name: "phone", type: "string", description: "The caller's phone number if they gave one.", required: false },
    { name: "reason", type: "string", description: "Why they are coming in, if they said.", required: false },
  ],
  [{ name: "workflow_run_id", type: "number", value_template: "{{initial_context.workflow_run_id}}", required: true }],
);
step("tool book_appointment", t2);
const t3 = await mkTool(
  "take_message",
  "Record a message from the caller for the team. Use this when the caller wants to leave a message, or when you cannot help and they want someone to follow up.",
  "/tools/message",
  [
    { name: "message", type: "string", description: "What the caller wants the team to know, in their own words, briefly.", required: true },
    { name: "name", type: "string", description: "The caller's name if they gave it.", required: false },
    { name: "callback_number", type: "string", description: "A number to reach them on, if they gave one.", required: false },
    { name: "urgent", type: "boolean", description: "True only if the caller says it is urgent or an emergency.", required: false },
  ],
  [{ name: "workflow_run_id", type: "number", value_template: "{{initial_context.workflow_run_id}}", required: true }],
);
step("tool take_message", t3);
const t4 = await mkTool(
  "record_outcome",
  "State how the call ended when it is not a booking or a message: the caller asked for a callback, asked not to be contacted again, or only wanted information. Call it once, before saying goodbye.",
  "/tools/outcome",
  [
    { name: "outcome", type: "string", description: "Exactly one of: callback_requested, opted_out, info_given, no_outcome.", required: true },
    { name: "note", type: "string", description: "For callback_requested, the agreed time or period. Otherwise a short note, or leave out.", required: false },
  ],
  [{ name: "workflow_run_id", type: "number", value_template: "{{initial_context.workflow_run_id}}", required: true }],
);
step("tool record_outcome", t4);
const toolIds = [t1, t2, t3, t4].map((t) => t.j?.tool_uuid ?? t.j?.uuid);
console.log("  tool ids:".padEnd(26), toolIds.map((x) => (x ? "yes" : "MISSING")).join(","));
if (toolIds.some((x) => !x)) { console.log("  tool response keys:", Object.keys(t1.j ?? {}).join(",")); process.exit(1); }

const wf = await api("POST", "/workflow/create/template", { call_type: "inbound", use_case: "Appointment booking receptionist", activity_description: "Answer inbound calls for a dental clinic and book appointments" });
step("template workflow", wf);
const id = wf.j?.id;
if (!id) process.exit(1);

// 2. Edit the agent node (tools, prompt, outcome variable) and add the webhook node.
const cur = await api("GET", "/workflow/fetch/" + id);
const def = cur.j.workflow_definition;
const agent = def.nodes.find((n) => n.type === "agentNode");
agent.data.prompt = String(agent.data.prompt ?? "") + BOOKING_PROMPT;
agent.data.tool_uuids = toolIds;
agent.data.extraction_enabled = true;
agent.data.extraction_prompt = "Decide how the call ended and report it.";
agent.data.extraction_variables = [
  { name: "outcome", type: "string", prompt: "Exactly one of: booked, message_taken, transferred, transfer_failed, info_given, callback_requested, opted_out, no_outcome. Use booked only if book_appointment returned booked true." },
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
    credential_uuid: credUuid,
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
step("agent + webhook update", await api("PUT", "/workflow/" + id, { workflow_definition: def, workflow_configurations: cfg }));
step("publish", await api("POST", `/workflow/${id}/publish`));

// 3. Twenty reader.
const conf = fs.readFileSync(os.homedir() + "/.twenty/config.json", "utf8");
const key = (conf.match(/"(?:apiKey|token|accessToken)"\s*:\s*"([^"]+)"/) ?? [])[1] ?? "";
async function twentyCall(providerCallId) {
  const r = await fetch("http://localhost:2020/graphql", {
    method: "POST",
    headers: { authorization: "Bearer " + key, "content-type": "application/json" },
    body: JSON.stringify({ query: `{calls(first:1, filter:{providerCallId:{eq:"${providerCallId}"}}){edges{node{providerCallId outcome callerNumber summary}}}}` }),
  });
  return (await r.json()).data?.calls?.edges?.[0]?.node ?? null;
}

// 4. Conversations.
const results = [];
const only = process.env.ONLY ? process.env.ONLY.split(",").map((x) => x.trim()) : null;
for (const sc of SCENARIOS.filter((x) => !only || only.some((o) => x.name.includes(o)))) {
  const s = await api("POST", `/workflow/${id}/text-chat/sessions`, { name: sc.name, initial_context: { caller_number: CALLER, called_number: CALLED } });
  const run = s.j?.workflow_run_id;
  if (!run) { console.log(sc.name, "could not start", JSON.stringify(s.j).slice(0, 160)); continue; }
  for (const text of sc.turns) {
    const m = await api("POST", `/workflow/${id}/text-chat/sessions/${run}/messages`, { text });
    if (m.s >= 400) console.log("  message error", m.s, JSON.stringify(m.j).slice(0, 160));
  }
  await api("POST", `/workflow/${id}/text-chat/sessions/${run}/end`, {});
  let node = null;
  for (let i = 0; i < 25 && !node; i++) { await sleep(3000); node = await twentyCall(`dograh:${run}`); }
  results.push({ name: sc.name, expect: sc.expect, run, node });
}

console.log("\nSCENARIO".padEnd(26), "EXPECTED".padEnd(12), "GOT".padEnd(18), "VERDICT");
for (const r of results) {
  const got = r.node?.outcome ?? "(no record)";
  const verdict = !r.node ? "FAIL: nothing reached Twenty" : r.expect === null ? "info" : got === r.expect ? "PASS" : "FAIL";
  console.log(r.name.padEnd(26), String(r.expect).padEnd(12), got.padEnd(18), verdict);
  if (r.node?.summary) console.log("   summary:", r.node.summary.slice(0, 140));
}
