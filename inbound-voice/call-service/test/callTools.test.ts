import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";
import { InMemoryCallFactStore } from "../src/facts.js";
import { LocalScheduler } from "../src/localScheduler.js";
import { InMemoryTenantRegistry } from "../src/tenants.js";
import type { CallRecord, Tenant } from "../src/types.js";

const NOW = Date.parse("2026-10-15T10:00:00Z");
const tenant: Tenant = {
  id: "t1",
  name: "Acme Dental",
  defaultRegion: "GB",
  twenty: { baseUrl: "https://acme.crm.example.com", apiKey: "k", ingestSecret: "s" },

  numbers: [],
  dograhWebhookToken: "tok_acme",
};
const registry = new InMemoryTenantRegistry([tenant]);

function setup() {
  const written: CallRecord[] = [];
  const scheduler = new LocalScheduler(() => NOW);
  const { app, queue } = buildServer({
    registry,
    crm: { writeCall: async (_t, r) => void written.push(r) },
    providerSecret: "p",
    facts: new InMemoryCallFactStore(),
    scheduler: () => scheduler,
  });
  const post = (url: string, body: unknown, token = "tok_acme") =>
    app.inject({ method: "POST", url, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, payload: JSON.stringify(body) });
  const finish = async (runId: string, extra: Record<string, unknown> = {}) => {
    const r = await post("/webhooks/dograh", { run_id: runId, disposition: "end_call", ...extra });
    expect(r.statusCode).toBe(202);
    await queue.idle();
    return written.find((w) => w.providerCallId === `dograh:${runId}`)!;
  };
  return { post, finish, written };
}

describe("take_message and record_outcome tools", () => {
  it("require the tenant token and valid input", async () => {
    const { post } = setup();
    expect((await post("/tools/message", { message: "hi" }, "wrong")).statusCode).toBe(401);
    expect((await post("/tools/message", {})).statusCode).toBe(400);
    expect((await post("/tools/outcome", { outcome: "opted_out" }, "wrong")).statusCode).toBe(401);
  });

  it("only accept outcomes that have no tool of their own, so booked and message_taken cannot be claimed", async () => {
    const { post } = setup();
    expect((await post("/tools/outcome", { outcome: "booked", workflow_run_id: 1 })).statusCode).toBe(400);
    expect((await post("/tools/outcome", { outcome: "message_taken", workflow_run_id: 1 })).statusCode).toBe(400);
    expect((await post("/tools/outcome", { outcome: "opted_out", workflow_run_id: 1 })).statusCode).toBe(200);
  });

  it("a message taken on the call becomes MESSAGE_TAKEN with the message attached", async () => {
    const { post, finish } = setup();
    expect((await post("/tools/message", { message: "Please ring about my crown", name: "Sam", callback_number: "07400 123456", urgent: "true", workflow_run_id: 11 })).statusCode).toBe(200);
    const rec = await finish("11");
    expect(rec.outcome).toBe("MESSAGE_TAKEN");
    expect(rec.message).toEqual({ body: "Sam: Please ring about my crown", callbackNumber: "07400 123456", urgent: true });
  });

  it("an opt-out stated by the agent wins over the classifier, even when the platform only sent an end reason", async () => {
    const { post, finish } = setup();
    await post("/tools/outcome", { outcome: "opted_out", note: "Caller asked to be removed.", workflow_run_id: 12 });
    const rec = await finish("12", { outcome_hint: "info_given" });
    expect(rec.outcome).toBe("OPTED_OUT");
    expect(rec.summary).toContain("Caller asked to be removed.");
  });

  it("a callback with a time is recorded, and a booking outranks everything else on the call", async () => {
    const { post, finish } = setup();
    await post("/tools/outcome", { outcome: "callback_requested", note: "Call back tomorrow at 3pm.", workflow_run_id: 13 });
    expect((await finish("13")).outcome).toBe("CALLBACK_REQUESTED");

    const slots = (await post("/tools/availability", { date: "2026-10-20" })).json().slots as Array<{ start: string }>;
    await post("/tools/outcome", { outcome: "info_given", workflow_run_id: 14 });
    await post("/tools/book", { start: slots[0]!.start, name: "Sam", workflow_run_id: 14 });
    expect((await finish("14")).outcome).toBe("BOOKED");
  });

  it("an opt-out outranks a booking made earlier on the same call, whether the agent or the classifier reports it", async () => {
    const { post, finish } = setup();
    const slots = (await post("/tools/availability", { date: "2026-10-20" })).json().slots as Array<{ start: string }>;
    await post("/tools/book", { start: slots[0]!.start, name: "Auguste", workflow_run_id: 30 });
    await post("/tools/outcome", { outcome: "opted_out", workflow_run_id: 30 });
    const byAgent = await finish("30");
    expect(byAgent.outcome).toBe("OPTED_OUT");
    expect(byAgent.followUp).toBeUndefined();

    await post("/tools/book", { start: slots[1]!.start, name: "Auguste", workflow_run_id: 31 });
    const byClassifier = await finish("31", { disposition: "opted_out" });
    expect(byClassifier.outcome).toBe("OPTED_OUT");
  });

  it("calls with no tool activity keep the classifier or hint outcome", async () => {
    const { finish } = setup();
    expect((await finish("20", { outcome_hint: "callback_requested" })).outcome).toBe("CALLBACK_REQUESTED");
    expect((await finish("21")).outcome).toBe("NO_OUTCOME");
  });

  it("facts are per tenant: another tenant's token cannot change this call's record", async () => {
    const other: Tenant = { ...tenant, id: "t2", dograhWebhookToken: "tok_other" };
    const written: CallRecord[] = [];
    const { app, queue } = buildServer({
      registry: new InMemoryTenantRegistry([tenant, other]),
      crm: { writeCall: async (_t, r) => void written.push(r) },
      providerSecret: "p",
    });
    const post = (url: string, body: unknown, token: string) =>
      app.inject({ method: "POST", url, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, payload: JSON.stringify(body) });
    await post("/tools/outcome", { outcome: "opted_out", workflow_run_id: 99 }, "tok_other");
    await post("/webhooks/dograh", { run_id: "99", disposition: "end_call" }, "tok_acme");
    await queue.idle();
    expect(written[0]!.outcome).toBe("NO_OUTCOME");
  });
});

describe("message wording", () => {
  it("does not repeat the caller's name when the message already starts with it", async () => {
    const { takeMessage } = await import("../src/callTools.js");
    const { InMemoryCallFactStore } = await import("../src/facts.js");
    const facts = new InMemoryCallFactStore();
    const tenant = { id: "t1" } as never;
    await takeMessage(facts, tenant, { message: "Joseph needs a callback as soon as possible.", name: "Joseph", workflow_run_id: "1" });
    await takeMessage(facts, tenant, { message: "Leak under the sink", name: "Alex", workflow_run_id: "2" });
    expect((await facts.get("t1", "dograh:1"))?.message?.body).toBe("Joseph needs a callback as soon as possible.");
    expect((await facts.get("t1", "dograh:2"))?.message?.body).toBe("Alex: Leak under the sink");
  });
});
