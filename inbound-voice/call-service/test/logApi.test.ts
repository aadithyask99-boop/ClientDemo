import { describe, expect, it } from "vitest";
import { InMemoryCallLog } from "../src/callLog.js";
import { buildServer } from "../src/server.js";
import { InMemoryTenantRegistry } from "../src/tenants.js";
import type { CrmWriter } from "../src/crm.js";
import type { CallRecord, Tenant } from "../src/types.js";

const mk = (id: string, token: string, number: string): Tenant => ({
  id,
  name: id,
  defaultRegion: "GB",
  numbers: [number],
  dograhWebhookToken: token,
  booking: { timeZone: "Europe/London", days: [1, 2, 3, 4, 5], open: "09:00", close: "17:00", slotMinutes: 30 },
});
const crm: CrmWriter = { writeCall: async () => {} };
const a = { authorization: "Bearer tok_a" };
const b = { authorization: "Bearer tok_b" };

const record: CallRecord = {
  providerCallId: "dograh:1",
  tenantId: "a",
  direction: "INBOUND",
  callerNumber: "+447400123456",
  startedAt: "2030-01-07T10:00:00.000Z",
  endedAt: "2030-01-07T10:02:00.000Z",
  durationSeconds: 120,
  outcome: "CALLBACK_REQUESTED",
  summary: "Wants a callback",
  callerName: "Sam Rivera",
  followUp: { kind: "callback", title: "Call back Sam Rivera", body: "Number: +447400123456", dueAt: "2030-01-08T09:00:00.000Z", urgent: false },
};

async function setup() {
  const callLog = new InMemoryCallLog();
  const tenantA = mk("a", "tok_a", "+442070000001");
  await callLog.recordCall(tenantA, record);
  const registry = new InMemoryTenantRegistry([tenantA, mk("b", "tok_b", "+442070000002")]);
  const app = buildServer({ registry, crm, providerSecret: "p", callLog }).app;
  const get = (url: string, headers: Record<string, string> = a) => app.inject({ method: "GET", url, headers });
  const post = (url: string, headers: Record<string, string>, payload?: unknown) => app.inject({ method: "POST", url, headers: { ...headers, "content-type": "application/json" }, payload: JSON.stringify(payload ?? {}) });
  return { app, get, post };
}

describe("call log API", () => {
  it("needs the token", async () => {
    const { app, post } = await setup();
    for (const url of ["/api/calls", "/api/customers", "/api/follow-ups"]) expect((await app.inject({ method: "GET", url })).statusCode).toBe(401);
    expect((await post("/api/customers", {}, { name: "X" })).statusCode).toBe(401);
  });

  it("lists calls, customers and follow-ups for the client", async () => {
    const { get } = await setup();
    expect((await get("/api/calls")).json().calls[0]).toMatchObject({ id: "dograh:1", outcome: "CALLBACK_REQUESTED", callerName: "Sam Rivera" });
    expect((await get("/api/customers")).json().customers.map((c: { name: string }) => c.name)).toEqual(["Sam Rivera"]);
    expect((await get("/api/follow-ups")).json().followUps[0]).toMatchObject({ title: "Call back Sam Rivera", status: "todo" });
  });

  it("marks a follow-up done, hides it unless asked, and cannot touch another client's", async () => {
    const { get, post } = await setup();
    const id = (await get("/api/follow-ups")).json().followUps[0].id as string;
    expect((await post(`/api/follow-ups/${id}/done`, b)).statusCode).toBe(404);
    expect((await post(`/api/follow-ups/${id}/done`, a)).statusCode).toBe(200);
    expect((await get("/api/follow-ups")).json().followUps).toHaveLength(0);
    expect((await get("/api/follow-ups?include=done")).json().followUps[0].status).toBe("done");
    expect((await post("/api/follow-ups/fu_nope/done", a)).statusCode).toBe(404);
  });

  it("adds a customer, turning a UK number into the standard form", async () => {
    const { get, post } = await setup();
    const r = await post("/api/customers", a, { name: "  Dee Walker ", phone: "07911 123456", email: "dee@example.com" });
    expect(r.statusCode).toBe(200);
    expect(r.json().customer).toMatchObject({ name: "Dee Walker", phone: "+447911123456", email: "dee@example.com" });
    expect((await get("/api/customers")).json().customers).toHaveLength(2);
  });

  it("refuses a duplicate number, a bad number and a missing name", async () => {
    const { post } = await setup();
    const dup = await post("/api/customers", a, { name: "Someone", phone: "07400 123456" }); // Sam's number, written the local way
    expect(dup.statusCode).toBe(409);
    expect(dup.json().customer.name).toBe("Sam Rivera");
    expect((await post("/api/customers", a, { name: "X", phone: "banana" })).statusCode).toBe(400);
    expect((await post("/api/customers", a, { phone: "07911 123456" })).statusCode).toBe(400);
  });

  it("keeps clients apart", async () => {
    const { get } = await setup();
    expect((await get("/api/calls", b)).json().calls).toEqual([]);
    expect((await get("/api/customers", b)).json().customers).toEqual([]);
    expect((await get("/api/follow-ups", b)).json().followUps).toEqual([]);
  });

  it("says so when the call log is not configured", async () => {
    const registry = new InMemoryTenantRegistry([mk("a", "tok_a", "+442070000001")]);
    const app = buildServer({ registry, crm, providerSecret: "p" }).app;
    expect((await app.inject({ method: "GET", url: "/api/calls", headers: a })).statusCode).toBe(501);
  });
});
