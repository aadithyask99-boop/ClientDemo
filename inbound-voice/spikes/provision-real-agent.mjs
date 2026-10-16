// Rebuilds the generated Dograh receptionist so it can be used on real calls: it stops hanging up on "Hi", gets the
// call-service tools and call-ended webhook, and a British voice. Run from anywhere that can reach Dograh's public API
// (Dograh calls the tools and webhook from inside the Codespace, so they point at http://localhost:3100).
//
//   DG_API=https://<codespace>-8000.app.github.dev/api/v1 DG_EMAIL=... DG_PASSWORD=... WEBHOOK_TOKEN=whk_... \
//   WORKFLOW_ID=1 BACKUP=./agent-backup.json node provision-real-agent.mjs
//
// The webhook token must match `dograhWebhookToken` of the tenant in the call-service's tenants file.
import fs from "node:fs";

const base = process.env.DG_API;
const callService = process.env.CALLSERVICE_URL ?? "http://localhost:3100";
const workflowId = process.env.WORKFLOW_ID ?? "1";
const voiceId = process.env.VOICE_ID ?? "dg_voice_299092d9e90ab2b05c47"; // Lucy - Capable Coordinator (British, female)
const webhookToken = process.env.WEBHOOK_TOKEN;
if (!base || !process.env.DG_EMAIL || !process.env.DG_PASSWORD || !webhookToken) throw new Error("DG_API, DG_EMAIL, DG_PASSWORD and WEBHOOK_TOKEN are required");

let tok = "";
async function api(method, path, body) {
  const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch {}
  return { s: r.status, j };
}
const step = (label, r, extra = "") => console.log(label.padEnd(28), r.s, r.s >= 400 ? JSON.stringify(r.j).slice(0, 300) : "ok " + extra);

const li = await api("POST", "/auth/login", { email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD });
step("login", li);
if (li.s >= 400) process.exit(1);
tok = li.j.token;

// 0. Back up what is there so this can be undone.
const cur = await api("GET", "/workflow/fetch/" + workflowId);
step("fetch agent", cur);
if (cur.s >= 400) process.exit(1);
const backupPath = process.env.BACKUP ?? "./agent-backup.json";
if (!fs.existsSync(backupPath)) fs.writeFileSync(backupPath, JSON.stringify({ workflow_definition: cur.j.workflow_definition, workflow_configurations: cur.j.workflow_configurations }, null, 2));
// Re-runs start from the saved original, so the prompt additions never stack.
const baseDefinition = JSON.parse(fs.readFileSync(backupPath, "utf8")).workflow_definition;

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

const OPENING_RULES = `# HOW THIS CALL STARTS
Whatever the caller first says ("hi", "hello", "what is this about?", a question, or nothing clear), they are NOT ending the call. If they ask what this is about, say you are Sam from Acme Plumbing and ask how you can help. Do not call yourself automated, an AI, a bot or an automated caller unless the caller sincerely asks whether you are a real person. Say your name once at the start of the call and never repeat your introduction. Never end the call in this stage unless the caller clearly says it is a wrong number or asks you to hang up.

`;

const AGENT_RULES = `

## Booking and taking messages
You are the receptionist for Acme Plumbing (Monday to Friday, 9am to 5pm, UK time). Today is {{current_weekday_Europe/London}}, {{current_time_Europe/London}} (UK time).
To book: find out what the caller needs and roughly when. Call check_availability with the day exactly as the caller said it, for example day "next tuesday" (never work out dates yourself). Say the full day and date from the slot label back to the caller before you book, for example "Tuesday 20 October at 9". Offer at most three of the returned times, using each slot's label. When the caller picks one, make sure you have their name, then call book_appointment with that slot's exact start value copied from the results. Never say an appointment is booked unless book_appointment returned booked true. If it fails or the time is gone, offer another time or take a message. If check_availability says the calendar cannot be reached, apologise and take a message instead. Keep replies short and natural, one or two sentences.

## Every call must end with a recorded result
Before you say goodbye you MUST have called at least one of: book_appointment, reschedule_appointment, cancel_appointment, take_message or record_outcome. Never finish a call without one of them.
- The caller wants to leave a message: call take_message with the message, their name and a callback number if given.
- The caller asks to be called back: agree a time or period, then in that same turn call record_outcome with outcome callback_requested and the agreed time in note.
- The caller says anything like "remove my number", "don't contact me again" or "stop calling": in that same turn call record_outcome with outcome opted_out, then confirm briefly.
- You only answered questions: call record_outcome with outcome info_given.
- None of the above applies: call record_outcome with outcome no_outcome.
Call the tool first, then speak. Do not end the call until the caller has said goodbye or has nothing more to ask.

## Cancelling or changing an appointment
If the caller wants to cancel, move or check an appointment they already have, call find_appointment first and read the date and time back to them. Cancel only after they clearly say so, then call cancel_appointment. To move one, call check_availability for the new day, then reschedule_appointment with the exact start value of the time they pick. Never say it is cancelled or moved unless the tool said so. If a tool says the caller's number is not available, or that nothing was found, apologise and use take_message so the team can sort it out. Never read out or discuss appointments of anyone other than the caller.

## Availability honesty
Only say times are limited to a certain period if check_availability actually returned nothing sooner. If the caller asks for tomorrow or another specific day, call check_availability with that day exactly and offer what it returns. Never tell the caller "only next week" without having checked the day they asked for.

## Never lose what the caller tells you
Anything the caller says about their problem (for example dripping taps, a leak, an address, a second issue) must be stored, not just acknowledged. Put the job details in the "reason" of book_appointment. If the caller gives more details or a second issue after you have already booked, or after any tool call, call take_message with those details before saying goodbye. Use record_outcome with info_given or no_outcome only when the caller gave no details worth keeping. A callback request or an opt-out always goes through record_outcome (callback_requested, opted_out), and any details they gave also go to take_message. Only say "I've noted that" after a tool call has actually stored it.`;

// 1. Credential and the four tools.
const cred = await api("POST", "/credentials/", { name: "call-service " + Date.now(), credential_type: "bearer_token", credential_data: { token: webhookToken } });
step("credential", cred);
const credUuid = cred.j?.uuid;
if (!credUuid) process.exit(1);

const existing = await api("GET", "/tools/");
const existingList = Array.isArray(existing.j) ? existing.j : (existing.j?.tools ?? []);
const mkTool = async (name, description, path, parameters, preset) => {
  const body = {
    name,
    description,
    category: "http_api",
    definition: { schema_version: 1, type: "http_api", config: { method: "POST", url: callService + path, credential_uuid: credUuid, parameters, ...(preset ? { preset_parameters: preset } : {}), timeout_ms: 8000 }, messages: [] },
  };
  const found = existingList.find((t) => t.name === name);
  if (!found) return api("POST", "/tools/", body);
  const r = await api("PUT", "/tools/" + (found.tool_uuid ?? found.uuid), body);
  return r.s < 400 ? { s: r.s, j: { tool_uuid: found.tool_uuid ?? found.uuid } } : r;
};
const run = [{ name: "workflow_run_id", type: "number", value_template: "{{initial_context.workflow_run_id}}", required: true }];
// The number the caller rang from comes from the telephony platform, never from the model: it decides whose appointments can be seen.
const caller = { name: "caller_number", type: "string", value_template: "{{initial_context.caller_number}}", required: false };
const tools = [
  await mkTool("check_availability", "Look up free appointment times. Use this as soon as the caller says when they would like to come in, before offering any time. Returns up to six slots with a label to read out and an exact start value.", "/tools/availability", [
    { name: "day", type: "string", description: "The day exactly as the caller said it, for example 'tomorrow', 'tuesday' or 'next friday'. The system works out the date, so do not calculate one yourself.", required: false },
    { name: "date", type: "string", description: "Only if the caller gave an exact calendar date: that date as YYYY-MM-DD. Otherwise leave it out.", required: false },
    { name: "part_of_day", type: "string", description: "morning or afternoon, only if the caller asked for one. Otherwise leave it out.", required: false },
  ]),
  await mkTool("book_appointment", "Book the appointment the caller chose. Only call this after the caller has picked one of the times returned by check_availability and you have their name.", "/tools/book", [
    { name: "start", type: "string", description: "The exact start value of the chosen slot, copied unchanged from the check_availability result.", required: true },
    { name: "name", type: "string", description: "The caller's full name.", required: true },
    { name: "phone", type: "string", description: "The caller's phone number if they gave one.", required: false },
    { name: "reason", type: "string", description: "What the job is, if they said.", required: false },
  ], [...run, caller]),
  await mkTool("find_appointment", "Look up the caller's upcoming appointments. Use this first when the caller wants to cancel, change or check an appointment they already have.", "/tools/find-appointment", [], [...run, caller]),
  await mkTool("cancel_appointment", "Cancel one of the caller's appointments after they have clearly said they want it cancelled. If they have only one, appointment_id can be left out.", "/tools/cancel", [
    { name: "appointment_id", type: "string", description: "The appointment_id from find_appointment. Leave out if the caller has only one appointment.", required: false },
  ], [...run, caller]),
  await mkTool("reschedule_appointment", "Move one of the caller's appointments to a new time. Call check_availability first and use the exact start value of the time the caller chose.", "/tools/reschedule", [
    { name: "new_start", type: "string", description: "The exact start value of the new slot, copied unchanged from the check_availability result.", required: true },
    { name: "appointment_id", type: "string", description: "The appointment_id from find_appointment. Leave out if the caller has only one appointment.", required: false },
  ], [...run, caller]),
  await mkTool("take_message", "Record a message from the caller for the team. Use this when the caller wants to leave a message, or when you cannot help and they want someone to follow up.", "/tools/message", [
    { name: "message", type: "string", description: "What the caller wants the team to know, in their own words, briefly.", required: true },
    { name: "name", type: "string", description: "The caller's name if they gave it.", required: false },
    { name: "callback_number", type: "string", description: "A number to reach them on, if they gave one.", required: false },
    { name: "urgent", type: "boolean", description: "True only if the caller says it is urgent or an emergency.", required: false },
  ], run),
  await mkTool("record_outcome", "State how the call ended when it is not a booking or a message: the caller asked for a callback, asked not to be contacted again, or only wanted information. Call it once, before saying goodbye.", "/tools/outcome", [
    { name: "outcome", type: "string", description: "Exactly one of: callback_requested, opted_out, info_given, no_outcome.", required: true },
    { name: "note", type: "string", description: "For callback_requested, the agreed time or period. Otherwise a short note, or leave out.", required: false },
  ], run),
];
tools.forEach((t, i) => step("tool " + i, t));
const toolIds = tools.map((t) => t.j?.tool_uuid ?? t.j?.uuid);
if (toolIds.some((x) => !x)) process.exit(1);

// 2. Edit the agent.
const def = structuredClone(baseDefinition);
const start = def.nodes.find((n) => n.type === "startCall");
const agent = def.nodes.find((n) => n.type === "agentNode");
if (!start || !agent) throw new Error("unexpected agent structure: " + def.nodes.map((n) => n.type).join(","));
if (!String(start.data.prompt).startsWith("# HOW THIS CALL STARTS")) start.data.prompt = OPENING_RULES + start.data.prompt;
agent.data.prompt = String(agent.data.prompt ?? "") + AGENT_RULES;
agent.data.tool_uuids = toolIds;
agent.data.extraction_enabled = true;
agent.data.extraction_prompt = "Decide how the call ended and report it.";
agent.data.extraction_variables = [{ name: "outcome", type: "string", prompt: "Exactly one of: booked, message_taken, transferred, transfer_failed, info_given, callback_requested, opted_out, no_outcome. Use booked only if book_appointment returned booked true." }];
for (const e of def.edges) {
  if (e.id === "1-4") e.data.condition = "Choose this pathway ONLY if the caller clearly says it is a wrong number, or explicitly asks you to end the call. A greeting such as 'hi', a question such as 'what is this about?', or a short or unclear reply is NOT a reason to end the call.";
  if (e.id === "2-4") e.data.condition = "Choose this pathway ONLY after the caller has said goodbye or confirmed they need nothing else, AND you have already recorded the result by calling one of book_appointment, reschedule_appointment, cancel_appointment, take_message or record_outcome. Never choose it just because the caller paused, said 'hi', or asked a question.";
}
if (!def.nodes.some((n) => n.id === "webhook-call-service")) {
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
}
// In this Dograh version (1.49) the voice is a per-agent override; the organisation-wide user configuration ignores a changed voice.
const cfg = {
  ...(cur.j.workflow_configurations ?? {}),
  call_dispositions: DISPOSITIONS,
  model_configuration_override: { ...(cur.j.workflow_configurations?.model_configuration_override ?? {}), tts: { settings: { voice: voiceId } } },
};
step("update agent + webhook", await api("PUT", "/workflow/" + workflowId, { workflow_definition: def, workflow_configurations: cfg }));
step("publish", await api("POST", `/workflow/${workflowId}/publish`));

const back = await api("GET", "/workflow/fetch/" + workflowId);
console.log("voice override stored:", JSON.stringify(back.j?.workflow_configurations?.model_configuration_override));
console.log("done. tool ids:", toolIds.length, "backup:", process.env.BACKUP ?? "./agent-backup.json");
