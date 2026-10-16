// Runs the receptionist through a set of scripted caller scenarios using Dograh's text chat, then checks what the tools did and,
// when run inside the Codespace, what arrived in Twenty. Text chat tests the instructions, tools, booking rules, call-service and
// CRM end to end. It does NOT test voice, speed or phone lines.
//
//   DG_API=http://localhost:8000/api/v1 DG_EMAIL=... DG_PASSWORD=... node scenario-test.mjs [only-scenario-name ...]
//
// The language model is not deterministic, so a failure may be the agent having a bad day: read the transcript line before
// changing anything, and rerun that scenario by name. Prints one line per check and writes a full report to /tmp/scenario-report.json.
import fs from "node:fs";
import os from "node:os";

const base = process.env.DG_API;
if (!base || !process.env.DG_EMAIL || !process.env.DG_PASSWORD) throw new Error("DG_API, DG_EMAIL and DG_PASSWORD are required");
const only = process.argv.slice(2);

let tok = "";
async function api(method, p, body) {
  const r = await fetch(base + p, { method, headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch {}
  return { s: r.status, j };
}
tok = (await api("POST", "/auth/login", { email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD })).j.token;

// Twenty is only reachable from inside the Codespace; the CLI keeps a working key in ~/.twenty/config.json.
let twentyKey;
try { twentyKey = JSON.parse(fs.readFileSync(os.homedir() + "/.twenty/config.json", "utf8")).remotes.local.apiKey; } catch {}
const twenty = async (p) => (twentyKey ? (await fetch("http://localhost:2020" + p, { headers: { authorization: "Bearer " + twentyKey } })).json() : null);

const strings = (v, out = []) => (typeof v === "string" ? out.push(v) : v && typeof v === "object" ? Object.values(v).forEach((x) => strings(x, out)) : 0, out);
const has = (text, re) => re.test(text);
// The text-chat message call only returns session state. The conversation itself is inside the finished run: collect every
// assistant message found anywhere in it.
function assistantTexts(v, out = []) {
  if (Array.isArray(v)) v.forEach((x) => assistantTexts(x, out));
  else if (v && typeof v === "object") {
    if (v.role === "assistant" && typeof v.content === "string" && v.content.trim()) out.push(v.content.trim());
    Object.values(v).forEach((x) => assistantTexts(x, out));
  }
  return out;
}

// Each caller gets their own fake number so scenarios cannot see each other's appointments, except where one is deliberately reused.
const N = (n) => `+4479111234${String(n).padStart(2, "0")}`;
const jamie = N(1);

const scenarios = [
  {
    name: "faq",
    caller: N(2),
    turns: ["Hi. Before I book anything, how much is a call-out?", "And do you guarantee your work?", "Can I pay by cash?", "Thanks, that's all. Goodbye."],
    expect: [
      ["answered the call-out price from the FAQ (60 pounds)", (r) => has(r.agent, /\b60\b|sixty/i)],
      ["answered the guarantee (12 months)", (r) => has(r.agent, /12 months|twelve months|a year/i)],
      ["said cash is not taken", (r) => has(r.agent, /no cash|do not take cash|don't take cash|card or bank/i)],
      ["booked nothing", (r) => !r.tool("book_appointment")],
    ],
  },
  {
    name: "book",
    caller: jamie,
    turns: ["Hi, I'd like to book a plumber for next Tuesday morning. My name is Jamie Fox and I have dripping taps in the kitchen.", "The first time you offered is fine.", "Yes, please book it.", "No, that's everything. Goodbye."],
    expect: [
      ["book_appointment returned booked", (r) => r.tool("book_appointment")?.result?.data?.booked === true],
      ["the job details were saved in the booking reason", (r) => /tap/i.test(r.tool("book_appointment")?.arguments?.reason ?? "")],
      ["offered start value has local offset (same clock digits as the label)", (r) => { const d = r.tool("check_availability")?.result?.data?.slots?.[0]; return !!d && d.label.slice(-5) === d.start.slice(11, 16); }],
    ],
  },
  {
    name: "move",
    caller: jamie,
    turns: ["Hi, I'd like to move my appointment to next Tuesday at 10 in the morning.", "Yes, that's the one. Please move it.", "No, that's all. Goodbye."],
    expect: [
      ["found the caller's own appointment", (r) => (r.tool("find_appointment")?.result?.data?.appointments ?? []).length >= 1],
      ["reschedule_appointment returned rescheduled", (r) => r.tool("reschedule_appointment")?.result?.data?.rescheduled === true],
    ],
  },
  {
    name: "cancel",
    caller: jamie,
    turns: ["Hi, I need to cancel my appointment, please.", "Yes, cancel it.", "No, that's all. Goodbye."],
    expect: [
      ["cancel_appointment returned cancelled", (r) => r.tool("cancel_appointment")?.result?.data?.cancelled === true],
    ],
  },
  {
    name: "cancel-nothing",
    caller: N(3),
    turns: ["Hi, I want to cancel my appointment.", "Oh. In that case never mind. Goodbye."],
    expect: [
      ["did not claim anything was cancelled", (r) => !r.tool("cancel_appointment")?.result?.data?.cancelled],
      ["did not book anything", (r) => !r.tool("book_appointment")],
    ],
  },
  {
    name: "message",
    caller: N(4),
    turns: ["Hi, I'd like to leave a message. My toilet is leaking badly and it's urgent. My name is Alex Morgan.", "Yes, this number is fine for a call back.", "No, thanks. Goodbye."],
    expect: [
      ["take_message recorded", (r) => r.tool("take_message")?.result?.data?.recorded === true],
      ["marked urgent", (r) => String(r.tool("take_message")?.arguments?.urgent) === "true"],
    ],
    twenty: { outcome: "MESSAGE_TAKEN", task: true },
  },
  {
    name: "callback",
    caller: N(5),
    turns: ["Hi, I'd like someone to call me back tomorrow afternoon about a boiler quote. My name is Priya Shah.", "This number is fine.", "No, that's all. Goodbye."],
    expect: [
      ["record_outcome callback_requested", (r) => r.tools("record_outcome").some((t) => t.arguments?.outcome === "callback_requested")],
      ["name saved (take_message or the note)", (r) => /priya/i.test(JSON.stringify(r.tools("take_message").concat(r.tools("record_outcome")).map((t) => t.arguments)))],
      ["did not ask for a phone number the line already gives", (r) => !has(r.agent, /what('s| is) (your|the) (callback |phone |contact )?number|best number/i)],
    ],
    twenty: { outcome: "CALLBACK_REQUESTED", task: true },
  },
  {
    name: "opt-out",
    caller: N(6),
    turns: ["Hi. Please don't contact me again and take me off your list.", "Thanks. Goodbye."],
    expect: [["record_outcome opted_out", (r) => r.tools("record_outcome").some((t) => t.arguments?.outcome === "opted_out")]],
    twenty: { outcome: "OPTED_OUT", task: false },
  },
  {
    name: "info",
    caller: N(7),
    turns: ["Hi, what are your opening hours?", "Great, thank you. Goodbye."],
    expect: [
      ["said Monday to Friday 9 to 5", (r) => has(r.agent, /monday/i) && has(r.agent, /9/) && has(r.agent, /5|17/)],
      ["booked nothing", (r) => !r.tool("book_appointment")],
    ],
    twenty: { task: false },
  },
  {
    name: "closed-day",
    caller: N(8),
    turns: ["Hi, can I book a plumber for this Saturday?", "No, never mind. Goodbye."],
    expect: [
      ["did not book a Saturday", (r) => !r.tool("book_appointment")],
      ["said they are closed or offered another day", (r) => has(r.agent, /closed|not open|monday|next available|other day|weekday/i)],
    ],
  },
];

const results = [];
let failed = 0;
for (const sc of scenarios) {
  if (only.length && !only.includes(sc.name)) continue;
  const s = await api("POST", "/workflow/1/text-chat/sessions", { name: "scenario " + sc.name, initial_context: { caller_number: sc.caller, called_number: "+442030972037" } });
  const run = s.j?.workflow_run_id;
  if (!run) { console.log(`FAIL  ${sc.name}: could not start a text chat (${s.s})`); failed++; continue; }
  const transcript = [];
  for (const text of sc.turns) {
    const m = await api("POST", `/workflow/1/text-chat/sessions/${run}/messages`, { text });
    transcript.push({ caller: text, agent: "" });
  }
  await api("POST", `/workflow/1/text-chat/sessions/${run}/end`, {});
  await new Promise((r) => setTimeout(r, 9000));
  const info = await api("GET", `/workflow/1/runs/${run}`);
  const calls = info.j?.gathered_context?.tool_results ?? [];
  const ctx = {
    agent: transcript.map((t) => t.agent).join(" \n "),
    tool: (n) => calls.find((c) => c.function_name === n),
    tools: (n) => calls.filter((c) => c.function_name === n),
  };
  const checks = sc.expect.map(([label, fn]) => { let ok = false; try { ok = !!fn(ctx); } catch {} return { label, ok }; });

  // Twenty (Codespace only): did the call arrive with the right outcome, and a follow-up task only when one is due?
  if (sc.twenty && twentyKey) {
    const rows = Object.values((await twenty("/rest/calls?limit=200"))?.data ?? {})[0] ?? [];
    const row = rows.find((c) => c.providerCallId === `dograh:${run}`);
    if (sc.twenty.outcome) checks.push({ label: `Twenty has the call as ${sc.twenty.outcome}`, ok: row?.outcome === sc.twenty.outcome });
    if (sc.twenty.task !== undefined) checks.push({ label: sc.twenty.task ? "Twenty has a follow-up task" : "Twenty has NO follow-up task", ok: !!row?.followUpTaskId === sc.twenty.task });
  }

  const bad = checks.filter((c) => !c.ok);
  failed += bad.length;
  console.log(`${bad.length ? "FAIL" : "PASS"}  ${sc.name} (run ${run}): ${checks.length - bad.length}/${checks.length}`);
  for (const c of bad) console.log(`        x ${c.label}`);
  results.push({ scenario: sc.name, run, checks, said: said.map((t) => t.slice(0, 300)), tools: calls.map((c) => ({ name: c.function_name, args: c.arguments, result: c.result?.data })) });
}
fs.writeFileSync("/tmp/scenario-report.json", JSON.stringify(results, null, 1));
console.log(failed ? `\n${failed} check(s) failed. Details: /tmp/scenario-report.json` : "\nAll checks passed.");
