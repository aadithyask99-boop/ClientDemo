import { describe, expect, it } from "vitest";
import { ArtifactCopyingWriter, type ArtifactStore } from "../src/artifacts.js";
import { TwentyIngestWriter } from "../src/crm.js";
import { nextOpening, planFollowUp, splitPhone } from "../src/followUp.js";
import { InMemoryCallFactStore } from "../src/facts.js";
import { LocalScheduler } from "../src/localScheduler.js";
import { buildServer } from "../src/server.js";
import { InMemoryTenantRegistry } from "../src/tenants.js";
import type { CallRecord, Tenant } from "../src/types.js";

const tenant: Tenant = {
  id: "t1",
  name: "Acme",
  defaultRegion: "GB",
  twenty: { baseUrl: "https://acme.crm.example.com", apiKey: "k", ingestSecret: "s" },
  numbers: [],
  dograhWebhookToken: "tok",
  booking: { timeZone: "Europe/London", days: [1, 2, 3, 4, 5], open: "09:00", close: "17:00", slotMinutes: 30 },
};
const at = (iso: string) => Date.parse(iso);
const THU_11 = at("2026-10-15T10:00:00Z"); // 11:00 London (BST), open
const base: CallRecord = {
  providerCallId: "dograh:1",
  tenantId: "t1",
  direction: "INBOUND",
  callerNumber: "+447400123456",
  startedAt: "2026-10-15T10:00:00.000Z",
  endedAt: "2026-10-15T10:02:00.000Z",
  durationSeconds: 120,
  outcome: "NO_OUTCOME",
  summary: "",
};

describe("nextOpening", () => {
  it("is now while the team is open", () => {
    expect(nextOpening(tenant, THU_11)).toBe(THU_11);
  });
  it("waits for the morning when it is early or the team has gone home", () => {
    expect(new Date(nextOpening(tenant, at("2026-10-15T06:00:00Z"))).toISOString()).toBe("2026-10-15T08:00:00.000Z"); // 07:00 -> 09:00 BST
    expect(new Date(nextOpening(tenant, at("2026-10-15T17:00:00Z"))).toISOString()).toBe("2026-10-16T08:00:00.000Z"); // 18:00 -> Friday 09:00
  });
  it("skips the weekend, and the clocks changing on the way", () => {
    // Friday 23 Oct 18:00 BST. Monday 26 Oct is GMT, so 09:00 is 09:00Z.
    expect(new Date(nextOpening(tenant, at("2026-10-23T17:00:00Z"))).toISOString()).toBe("2026-10-26T09:00:00.000Z");
  });
  it("skips days off", () => {
    const t = { ...tenant, booking: { ...tenant.booking!, daysOff: ["2026-10-16"] } };
    expect(new Date(nextOpening(t, at("2026-10-15T17:00:00Z"))).toISOString()).toBe("2026-10-19T08:00:00.000Z"); // Friday off -> Monday
  });
});

describe("planFollowUp", () => {
  const msg = (extra: Partial<CallRecord["message"]> = {}) => ({ body: "Boiler is leaking", urgent: false, ...extra });

  it("a message becomes a task to return it, naming the caller and the number to ring", () => {
    const f = planFollowUp(tenant, { ...base, outcome: "MESSAGE_TAKEN", callerName: "Sam Rivera", message: msg({ callbackNumber: "+447911123456" }) }, THU_11)!;
    expect(f.kind).toBe("message");
    expect(f.title).toBe("Return message from Sam Rivera");
    expect(f.body).toContain("Boiler is leaking");
    expect(f.body).toContain("Number: +447911123456");
    expect(f.urgent).toBe(false);
    expect(f.dueAt).toBe("2026-10-15T12:00:00.000Z"); // two hours on, still inside opening hours
  });

  it("an urgent message is due now when open, and at opening time when closed", () => {
    const urgent = { ...base, outcome: "MESSAGE_TAKEN" as const, message: msg({ urgent: true }) };
    const open = planFollowUp(tenant, urgent, THU_11)!;
    expect(open.urgent).toBe(true);
    expect(open.title).toBe("URGENT: Return message from +447400123456"); // no name given: use the number
    expect(open.dueAt).toBe("2026-10-15T10:00:00.000Z");
    expect(planFollowUp(tenant, urgent, at("2026-10-15T20:00:00Z"))!.dueAt).toBe("2026-10-16T08:00:00.000Z");
  });

  it("a non-urgent message left at 4:30pm is not due after closing", () => {
    expect(planFollowUp(tenant, { ...base, outcome: "MESSAGE_TAKEN", message: msg() }, at("2026-10-15T15:30:00Z"))!.dueAt).toBe("2026-10-16T08:00:00.000Z");
  });

  it("a callback request becomes a call-back task and keeps the agreed time in the summary", () => {
    const f = planFollowUp(tenant, { ...base, outcome: "CALLBACK_REQUESTED", summary: "Call back tomorrow after 2pm." }, THU_11)!;
    expect(f.kind).toBe("callback");
    expect(f.title).toBe("Call back +447400123456");
    expect(f.body).toContain("tomorrow after 2pm");
  });

  it("a callback request with a message is still a call-back, with the message in the task", () => {
    const f = planFollowUp(tenant, { ...base, outcome: "CALLBACK_REQUESTED", callerName: "Sam", message: msg() }, THU_11)!;
    expect(f.title).toBe("Call back Sam");
    expect(f.body).toContain("Message: Boiler is leaking");
  });

  it("a failed transfer is an urgent call-back", () => {
    const f = planFollowUp(tenant, { ...base, outcome: "TRANSFER_FAILED" }, THU_11)!;
    expect(f).toMatchObject({ kind: "callback", urgent: true });
    expect(f.title).toContain("transfer failed");
  });

  it("a booking with a note attached still gets the note read by a person", () => {
    const f = planFollowUp(tenant, { ...base, outcome: "BOOKED", callerName: "Sam", message: msg() }, THU_11)!;
    expect(f.title).toBe("Read note from Sam (appointment booked)");
  });

  it("nothing for bookings, information, cancellations or empty calls", () => {
    for (const outcome of ["BOOKED", "INFO_GIVEN", "NO_OUTCOME", "TRANSFERRED"] as const) expect(planFollowUp(tenant, { ...base, outcome }, THU_11)).toBeUndefined();
  });

  it("never a task for someone who asked not to be contacted, even if they left a message", () => {
    expect(planFollowUp(tenant, { ...base, outcome: "OPTED_OUT", message: msg({ urgent: true }) }, THU_11)).toBeUndefined();
  });
});

describe("the writer applies it last", () => {
  const writer = () => {
    const seen: CallRecord[] = [];
    return { seen, w: (store: ArtifactStore | null) => new ArtifactCopyingWriter({ writeCall: async (_t, r) => void seen.push(r) }, store, () => THU_11) };
  };
  const transcript = (text: string): ArtifactStore => ({ save: async (_t, _c, kind) => (kind === "transcript" ? { ref: "artifact://t1/x.transcript", text } : { ref: "artifact://t1/x.recording" }) });
  const withArtifacts = { sourceArtifacts: { recordingUrl: "https://f/r", transcriptUrl: "https://f/t" } };

  it("adds the task, the split phone number and the message to the summary", async () => {
    const { seen, w } = writer();
    await w(null).writeCall(tenant, { ...base, outcome: "MESSAGE_TAKEN", callerName: "Sam", message: { body: "Call me about the quote", urgent: false } });
    expect(seen[0]!.followUp?.title).toBe("Return message from Sam");
    expect(seen[0]!.callerPhone).toEqual({ country: "GB", callingCode: "+44", nationalNumber: "7400123456" });
    expect(seen[0]!.summary).toContain("Message: Call me about the quote");
  });

  it("a callback request that the transcript shows to be an opt-out leaves NO task", async () => {
    const { seen, w } = writer();
    const store = transcript("[2026-10-15T10:00:00+00:00] assistant: Shall we call you back?\n[2026-10-15T10:00:05+00:00] user: Actually, please don't contact me again.");
    await w(store).writeCall(tenant, { ...base, outcome: "CALLBACK_REQUESTED", summary: "Call back tomorrow.", ...withArtifacts });
    expect(seen[0]!.outcome).toBe("OPTED_OUT");
    expect(seen[0]!.followUp).toBeUndefined();
  });

  it("an urgent message plus a transcript opt-out also leaves no task, but the message is kept in the summary", async () => {
    const { seen, w } = writer();
    const store = transcript("[2026-10-15T10:00:05+00:00] user: Take me off your list.");
    await w(store).writeCall(tenant, { ...base, outcome: "MESSAGE_TAKEN", message: { body: "Stop calling", urgent: true }, ...withArtifacts });
    expect(seen[0]!.outcome).toBe("OPTED_OUT");
    expect(seen[0]!.followUp).toBeUndefined();
    expect(seen[0]!.summary).toContain("Stop calling");
  });

  it("a normal transcript does not disturb the task", async () => {
    const { seen, w } = writer();
    await w(transcript("[2026-10-15T10:00:05+00:00] user: Please call me back.")).writeCall(tenant, { ...base, outcome: "CALLBACK_REQUESTED", ...withArtifacts });
    expect(seen[0]!.followUp?.kind).toBe("callback");
  });

  it("an unparsable caller ID still writes the call, without a phone split", async () => {
    const { seen, w } = writer();
    await w(null).writeCall(tenant, { ...base, callerNumber: "unknown", outcome: "CALLBACK_REQUESTED" });
    expect(seen[0]!.callerPhone).toBeUndefined();
    expect(seen[0]!.followUp?.title).toBe("Call back unknown");
  });
});

describe("splitPhone", () => {
  it("splits the way the CRM stores numbers", () => {
    expect(splitPhone("+14155552671")).toEqual({ country: "US", callingCode: "+1", nationalNumber: "4155552671" });
    expect(splitPhone("garbage")).toBeUndefined();
  });
});

describe("the whole path, webhook to CRM request", () => {
  it("the name given on the call, the message and the task all reach Twenty's ingest request", async () => {
    const sent: Array<{ url: string; body: CallRecord }> = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      sent.push({ url, body: JSON.parse(String(init.body)) });
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const crm = new ArtifactCopyingWriter(new TwentyIngestWriter(fetchImpl), null, () => THU_11);
    const scheduler = new LocalScheduler(() => THU_11);
    const { app, queue } = buildServer({ registry: new InMemoryTenantRegistry([tenant]), crm, providerSecret: "p", facts: new InMemoryCallFactStore(), scheduler: () => scheduler });
    const post = (url: string, body: unknown) => app.inject({ method: "POST", url, headers: { "content-type": "application/json", authorization: "Bearer tok" }, payload: JSON.stringify(body) });

    await post("/tools/message", { message: "Leak under the sink", name: "Sam Rivera", urgent: true, workflow_run_id: 9 });
    await post("/webhooks/dograh", { run_id: "9", caller: "07400 123456", disposition: "end_call" });
    await queue.idle();

    expect(sent).toHaveLength(1);
    expect(sent[0]!.url).toBe("https://acme.crm.example.com/s/ingest-call");
    expect(sent[0]!.body).toMatchObject({
      providerCallId: "dograh:9",
      outcome: "MESSAGE_TAKEN",
      callerName: "Sam Rivera",
      callerPhone: { nationalNumber: "7400123456" },
      followUp: { kind: "message", urgent: true, title: "URGENT: Return message from Sam Rivera" },
    });
    expect(sent[0]!.body.message).toEqual({ body: "Sam Rivera: Leak under the sink", urgent: true }); // the name is not duplicated into the message object
  });
});

describe("warnings from the Twenty app", () => {
  it("a 200 reply with warnings is a success that is logged, not retried", async () => {
    const lines: string[] = [];
    const fetchImpl = (async () => new Response(JSON.stringify({ ok: true, warnings: ["taskTarget: Object taskTarget does not exist"] }), { status: 200 })) as unknown as typeof fetch;
    await new TwentyIngestWriter(fetchImpl, (l) => lines.push(l)).writeCall(tenant, base);
    expect(lines).toEqual(["crm-write warning id=dograh:1 taskTarget: Object taskTarget does not exist"]);
  });
  it("a plain 200 says nothing, and an empty body is fine", async () => {
    const lines: string[] = [];
    for (const body of ['{"ok":true}', ""]) await new TwentyIngestWriter((async () => new Response(body, { status: 200 })) as unknown as typeof fetch, (l) => lines.push(l)).writeCall(tenant, base);
    expect(lines).toEqual([]);
  });
});
