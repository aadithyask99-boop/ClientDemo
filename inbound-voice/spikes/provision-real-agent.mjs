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
// The voice is chosen on Dograh's Models page (organisation default) so there is ONE place to look. Set VOICE_ID only to force a
// voice for this agent alone: that creates a per-agent override which then beats the Models page.
const forcedVoice = process.env.VOICE_ID;
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
// The base is the LIVE definition, so changes made in Dograh's editor (for example attached knowledge base documents) survive
// a re-run. Our prompt additions are cut off before being added again, so they never stack. The backup file is only a safety copy.
const baseDefinition = cur.j.workflow_definition;

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
Whatever the caller first says ("hi", "hello", "what is this about?", a question, or nothing clear), they are NOT ending the call. If they ask what this is about, say you are Sam from Acme Plumbing and ask how you can help. Do not call yourself automated, an AI, a bot or an automated caller unless the caller sincerely asks whether you are a real person. Say your name once at the start of the call and never repeat your introduction. If the caller gives or corrects their name, say it back once, correctly, and carry on with what they need. Never say the same sentence twice in a row: if the caller said something new, answer it, and if you did not understand them, ask them to say it again. Take names as you hear them. If you cannot make one out, ask once for it to be repeated, never more than once, and do not read letters back unless the caller asks. Open the call with one friendly line: you are Sam from Acme Plumbing, and how can you help? Do not ask for their name now. As soon as the caller says what they need (a booking, a change, a question, a message or a callback), move to the main stage straight away without asking more questions first; the main stage asks for a name when one is needed. Sound like a warm, relaxed person on the phone, not someone reading a script: short simple sentences, contractions, and small natural reactions such as Mm-hm, Right, Okay, Sure, Of course. If you cannot make out what the caller said, say once, simply, Sorry, I missed that, could you say it again? and never guess or invent names, places or details the caller did not clearly say. Never end the call in this stage unless the caller clearly says it is a wrong number or asks you to hang up. If the caller asks not to be contacted again, to be taken off your list or to stop calls, do NOT say goodbye and do NOT end the call in this stage: move on to the main stage straight away so that request can be recorded. Do that by moving to the main stage as your very first action, before saying anything. Never answer with words alone, and never say it is noted or that they will not be contacted again in this stage, because nothing has been recorded yet.

`;

const AGENT_RULES = `

## Booking and taking messages
You are the receptionist for Acme Plumbing (Monday to Friday, 9am to 5pm, UK time). Today is {{current_weekday_Europe/London}}, {{current_time_Europe/London}} (UK time).
To book: find out what the caller needs and roughly when. Call check_availability with the day exactly as the caller said it, for example day "next tuesday" (never work out dates yourself). Say the full day and date from the slot label back to the caller before you book, for example "Tuesday 20 October at 9". Offer at most three of the returned times, using each slot's label. When the caller picks one, make sure you have their name, then call book_appointment with that slot's exact start value copied from the results. Never say an appointment is booked unless book_appointment returned booked true. If it fails or the time is gone, offer another time or take a message. If check_availability says the calendar cannot be reached, apologise and take a message instead. Keep replies short and natural, one or two sentences.

## Every call must end with a recorded result
Before you say goodbye you MUST have called at least one of: book_appointment, reschedule_appointment, cancel_appointment, take_message or record_outcome. Never finish a call without one of them.
- The caller wants to leave a message: call take_message with the message, their name and a callback number if given.
- The caller asks to be called back: agree a time or period, then in that same turn call record_outcome with outcome callback_requested and the agreed time in note.
- The caller says anything like "remove my number", "take me off your list", "don't contact me again" or "stop calling", at any point in the call, even as their very first sentence: this comes before everything else. In that same turn call record_outcome with outcome opted_out BEFORE you speak, then confirm briefly that they will not be contacted again. If you realise later that you have not recorded it, call record_outcome with opted_out before saying goodbye.
- You only answered questions: call record_outcome with outcome info_given.
- None of the above applies: call record_outcome with outcome no_outcome.
Call the tool first, then speak. Do not end the call until the caller has said goodbye or has nothing more to ask.

## Getting times and names right
When the caller picks a time, copy that slot's start value exactly as given (it already includes the UK offset); never convert it. After book_appointment or reschedule_appointment, say the time from the "label" in the tool's answer. If that label is not the time you told the caller, say so plainly and offer to fix it. Take the name as you heard it; only if you truly cannot make it out, ask once for it to be repeated or spelled, never more than once. If the caller asks you to spell their name, spell it back letter by letter from what you have (for example A-U-G-U-S-T-E) and ask whether that is right; never say you cannot do that. If the caller corrects you, use the corrected name from then on, including in the booking. Never say the same sentence twice in a row: answer what the caller just said, and if you did not understand, ask them to repeat it.

## Callbacks
You already have the caller's number from the phone line. When a caller asks for a callback: ask for their name and what it is about, agree when suits them, then call take_message with their name, the time they want and the reason, and then record_outcome with callback_requested and the agreed time in note. Say you will ring the number they are calling from; only ask for a different number if they say so. Do not ask for a number they have not offered.

## Cancelling or changing an appointment
If the caller wants to cancel, move or check an appointment they already have, call find_appointment first and read the date and time back to them. Cancel only after they clearly say so, then call cancel_appointment. To move one, call check_availability for the new day, then reschedule_appointment with the exact start value of the time they pick. Never say it is cancelled or moved unless the tool said so. If a tool says the caller's number is not available, or that nothing was found, apologise and use take_message so the team can sort it out. Never read out or discuss appointments of anyone other than the caller.

## Availability honesty
Only say times are limited to a certain period if check_availability actually returned nothing sooner. If the caller asks for tomorrow or another specific day, call check_availability with that day exactly and offer what it returns. Never tell the caller "only next week" without having checked the day they asked for.

## Questions about the business
For any question about prices, fees, guarantees, payment, areas covered, services or opening hours, call retrieve_from_knowledge_base first, in that same turn, and answer only from what it returns. Never guess or round a figure and never use a number you did not just get from it. If it returns nothing relevant, say you are not sure and offer to take a message.

## Never lose what the caller tells you
Anything the caller says about their problem (for example dripping taps, a leak, an address, a second issue) must be stored, not just acknowledged. Put the job details in the "reason" of book_appointment. If the caller gives more details or a second issue after you have already booked, or after any tool call, call take_message with those details before saying goodbye. Use record_outcome with info_given or no_outcome only when the caller gave no details worth keeping. A callback request or an opt-out always goes through record_outcome (callback_requested, opted_out), and any details they gave also go to take_message. Only say "I've noted that" after a tool call has actually stored it.

## How you sound
You are a warm, relaxed receptionist on a phone call, not someone reading a script. Talk the way people really talk: short simple sentences, contractions (I'll, that's, we've), and small natural reactions and fillers such as "Mm-hm", "Right", "Okay", "Ah, okay", "Sure", "Of course". Begin most replies with a tiny reaction to what the caller just said, then get to the point. Use a comma or an ellipsis where a person would pause. Vary your wording and do not reuse the same phrase twice in one call. Sound a little warmer and gentler if the caller is worried or has a leak, and brisker if they are in a hurry. No lists, symbols or long sentences. Say times the way a person would, like "half twelve" or "nine o'clock". One or two sentences, then let the caller speak. When you need to look something up, book, cancel, move or record something, call the tool straight away without saying anything first, and speak only after the result comes back. If you cannot make out what the caller said, say once, simply, "Sorry, I missed that, could you say it again?" and never guess or invent names, places or details the caller did not clearly say.`;

// 1. Credential and the four tools.
const cred = await api("POST", "/credentials/", { name: "call-service " + Date.now(), credential_type: "bearer_token", credential_data: { token: webhookToken } });
step("credential", cred);
const credUuid = cred.j?.uuid;
if (!credUuid) process.exit(1);

const existing = await api("GET", "/tools/");
const existingList = Array.isArray(existing.j) ? existing.j : (existing.j?.tools ?? []);
// Spoken by the platform, not the model, the moment a tool starts, so a lookup never sounds like dead air. Needs the tool-messages
// patch on the Dograh container (spikes/patches/dograh-tool-messages.sh). Not used for record_outcome: nobody wants "one moment" before goodbye.
const START_MESSAGES = {
  check_availability: ["Okay, let me just have a look for you...", "Right, one second, checking that now...", "Mm-hm, bear with me a moment..."],
  find_appointment: ["Okay, let me pull up your booking...", "One sec, just finding that for you...", "Right, bear with me a moment..."],
  book_appointment: ["Right, booking that in now...", "Okay, let me get that down for you...", "One moment while I put that in..."],
  reschedule_appointment: ["Okay, moving that for you now...", "Right, one second while I change that...", "Mm-hm, let me sort that out..."],
  cancel_appointment: ["Okay, let me take care of that...", "Right, one moment..."],
  take_message: ["Okay, let me note that down...", "Right, getting that written down..."],
};
const mkTool = async (name, description, path, parameters, preset) => {
  const body = {
    name,
    description,
    category: "http_api",
    definition: { schema_version: 1, type: "http_api", config: { method: "POST", url: callService + path, credential_uuid: credUuid, parameters, ...(preset ? { preset_parameters: preset } : {}), timeout_ms: 8000 }, messages: (START_MESSAGES[name] ?? []).map((text) => ({ type: "text", text, event: "start" })) },
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
// Safe on an agent that was already provisioned: our earlier additions are cut off first, so they never stack.
start.data.prompt = OPENING_RULES + String(start.data.prompt).replace(/^# HOW THIS CALL STARTS\n[^\n]*\n\n/, "")
  .replace("ask for their name, and ask how you can help them today", "ask how you can help them today")
  .replace("Use the first 1 to 3 user turns to understand who is calling and what they need.", "Use the first user turn to understand what they need.");
// With FAQ_FILE set, the business facts go into the prompt and the knowledge base is detached. Use this when the model setup has no
// embedding provider (a BYOK setup cannot search a knowledge base without one). Without FAQ_FILE nothing changes.
let agentRules = AGENT_RULES;
if (process.env.FAQ_FILE) {
  const faq = fs.readFileSync(process.env.FAQ_FILE, "utf8").trim();
  const i = agentRules.indexOf("## Questions about the business");
  const j = agentRules.indexOf("## Never lose what the caller tells you");
  if (i < 0 || j < 0) throw new Error("FAQ_FILE: prompt sections not found");
  agentRules = agentRules.slice(0, i) + "## Questions about the business\nAnswer questions about prices, fees, guarantees, payment, areas covered, services or opening hours only from the business facts below, and quote figures exactly as written. Never guess or round a figure. If the answer is not in the facts, say you are not sure and offer to take a message.\n\n### Business facts\n" + faq + "\n\n" + agentRules.slice(j);
  const clearDocs = (v) => {
    if (Array.isArray(v)) v.forEach(clearDocs);
    else if (v && typeof v === "object") for (const [k, val] of Object.entries(v)) {
      if (/document/i.test(k) && Array.isArray(val) && val.every((x) => typeof x === "string")) v[k] = [];
      else clearDocs(val);
    }
  };
  clearDocs(def);
  // The caller can ask a factual question before the agent moves on from the opening stage, so the facts live there too.
  // The marker is cut off first, so re-running does not stack copies.
  start.data.prompt = String(start.data.prompt).split("\n\n## Business facts (opening stage)")[0] +
    "\n\n## Business facts (opening stage)\nIf the caller asks about prices, fees, guarantees, payment, areas covered, services or opening hours, answer only from these facts and quote figures exactly as written. Never guess.\n\n" + faq;
}
agent.data.prompt = String(agent.data.prompt ?? "").split("\n\n## Booking and taking messages")[0] + agentRules;
agent.data.tool_uuids = toolIds;
agent.data.extraction_enabled = true;
agent.data.extraction_prompt = "Decide how the call ended and report it.";
agent.data.extraction_variables = [{ name: "outcome", type: "string", prompt: "Exactly one of: booked, message_taken, transferred, transfer_failed, info_given, callback_requested, opted_out, no_outcome. Use booked only if book_appointment returned booked true." }];
for (const e of def.edges) {
  if (e.id === "1-4") e.data.condition = "Choose this pathway ONLY if the caller clearly says it is a wrong number, or explicitly asks you to end the call. A greeting such as 'hi', a question such as 'what is this about?', or a short or unclear reply is NOT a reason to end the call. Asking not to be contacted again is also NOT a reason to end the call here: the result must be recorded first.";
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
// Without VOICE_ID any earlier per-agent voice override is removed, so the agent follows the Models page.
const { model_configuration_override: oldOverride, ...restCfg } = cur.j.workflow_configurations ?? {};
const { tts: _oldTts, ...otherOverrides } = oldOverride ?? {};
const override = forcedVoice ? { tts: { settings: { voice: forcedVoice } } } : undefined; // stale empty llm/stt overrides are dropped so the agent follows the Models page
const cfg = { ...restCfg, call_dispositions: DISPOSITIONS, ...(override ? { model_configuration_override: override } : {}) };
step("update agent + webhook", await api("PUT", "/workflow/" + workflowId, { workflow_definition: def, workflow_configurations: cfg }));
if (!process.env.NO_PUBLISH) step("publish", await api("POST", `/workflow/${workflowId}/publish`));

const back = await api("GET", "/workflow/fetch/" + workflowId);
console.log("per-agent override now:", JSON.stringify(back.j?.workflow_configurations?.model_configuration_override ?? null));
console.log("done. tool ids:", toolIds.length, "backup:", process.env.BACKUP ?? "./agent-backup.json");
