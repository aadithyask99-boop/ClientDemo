import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { InMemoryCallLog, PgCallLog, type CallLogStore } from "../src/callLog.js";
import { migrate } from "../src/db.js";
import type { CallRecord, Tenant } from "../src/types.js";
import { fromPglite } from "./pgliteSql.js";

const a = { id: "a" } as Tenant;
const b = { id: "b" } as Tenant;

const call = (over: Partial<CallRecord> = {}): CallRecord => ({
  providerCallId: "dograh:1",
  tenantId: "a",
  direction: "INBOUND",
  callerNumber: "+447400123456",
  startedAt: "2030-01-07T10:00:00.000Z",
  endedAt: "2030-01-07T10:02:00.000Z",
  durationSeconds: 120,
  outcome: "MESSAGE_TAKEN",
  summary: "Left a message",
  callerName: "Sam Rivera",
  followUp: { kind: "message", title: "Return message from Sam Rivera", body: "Leak under the sink", dueAt: "2030-01-08T09:00:00.000Z", urgent: true },
  ...over,
});

// The same behaviour must hold in memory (no database) and on real Postgres (PGlite runs the same SQL production runs).
const stores: Array<[string, () => Promise<CallLogStore>]> = [
  ["in memory", async () => new InMemoryCallLog()],
  [
    "postgres",
    async () => {
      const sql = fromPglite(new PGlite());
      await migrate(sql);
      return new PgCallLog(sql);
    },
  ],
];

describe.each(stores)("call log (%s)", (_name, make) => {
  it("stores a call, makes the caller a customer, and keeps the follow-up", async () => {
    const log = await make();
    await log.recordCall(a, call());
    expect(await log.listCalls("a")).toEqual([{ id: "dograh:1", startedAt: "2030-01-07T10:00:00.000Z", callerNumber: "+447400123456", callerName: "Sam Rivera", outcome: "MESSAGE_TAKEN", summary: "Left a message", durationSeconds: 120 }]);
    expect((await log.listCustomers("a")).map((c) => [c.name, c.phone])).toEqual([["Sam Rivera", "+447400123456"]]);
    const f = await log.listFollowUps("a", false);
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ kind: "message", status: "todo", urgent: true, title: "Return message from Sam Rivera" });
  });

  it("writing the same call again changes nothing and does not bring back a finished follow-up", async () => {
    const log = await make();
    await log.recordCall(a, call());
    const id = (await log.listFollowUps("a", false))[0]!.id;
    expect(await log.markFollowUpDone("a", id)).toBe(true);
    await log.recordCall(a, call({ summary: "Left a message (updated)" }));
    expect(await log.listCalls("a")).toHaveLength(1);
    expect((await log.listCalls("a"))[0]!.summary).toBe("Left a message (updated)");
    expect(await log.listCustomers("a")).toHaveLength(1);
    expect(await log.listFollowUps("a", false)).toHaveLength(0); // still done
    expect(await log.listFollowUps("a", true)).toHaveLength(1);
  });

  it("a later call from the same number is the same customer, and a name heard later fills an empty one without overwriting", async () => {
    const log = await make();
    await log.recordCall(a, call({ providerCallId: "c1", callerName: undefined, followUp: undefined }));
    await log.recordCall(a, call({ providerCallId: "c2", callerName: "Sam Rivera", followUp: undefined }));
    await log.recordCall(a, call({ providerCallId: "c3", callerName: "Someone Else", followUp: undefined }));
    expect((await log.listCustomers("a")).map((c) => c.name)).toEqual(["Sam Rivera"]);
    expect(await log.listCalls("a")).toHaveLength(3);
  });

  it("lists newest calls first, and open follow-ups before finished ones", async () => {
    const log = await make();
    await log.recordCall(a, call({ providerCallId: "old", startedAt: "2030-01-07T09:00:00.000Z", callerNumber: "+447400000001" }));
    await log.recordCall(a, call({ providerCallId: "new", startedAt: "2030-01-07T11:00:00.000Z", callerNumber: "+447400000002" }));
    expect((await log.listCalls("a")).map((c) => c.id)).toEqual(["new", "old"]);
    const all = await log.listFollowUps("a", true);
    await log.markFollowUpDone("a", all.find((f) => f.id)!.id);
    const after = await log.listFollowUps("a", true);
    expect(after.map((f) => f.status)).toEqual(["todo", "done"]);
  });

  it("a call with no follow-up creates none", async () => {
    const log = await make();
    await log.recordCall(a, call({ outcome: "BOOKED", followUp: undefined }));
    expect(await log.listFollowUps("a", true)).toEqual([]);
  });

  it("adds a customer by hand, refuses a second one with the same number, and allows several with no number", async () => {
    const log = await make();
    const first = await log.addCustomer("a", { name: "Dee", phone: "+447700900123", email: "dee@example.com" });
    expect(first.ok).toBe(true);
    const again = await log.addCustomer("a", { name: "Dee Again", phone: "+447700900123" });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.customer.name).toBe("Dee");
    expect((await log.addCustomer("a", { name: "No Phone One" })).ok).toBe(true);
    expect((await log.addCustomer("a", { name: "No Phone Two" })).ok).toBe(true);
    expect(await log.listCustomers("a")).toHaveLength(3);
  });

  it("a customer added by hand is the one a later call from that number reaches", async () => {
    const log = await make();
    await log.addCustomer("a", { name: "Dee Walker", phone: "+447700900123" });
    await log.recordCall(a, call({ callerNumber: "+447700900123", callerName: "Dee", followUp: undefined }));
    expect((await log.listCustomers("a")).map((c) => c.name)).toEqual(["Dee Walker"]);
    expect((await log.listCalls("a"))[0]!.callerName).toBe("Dee Walker");
  });

  it("keeps clients apart", async () => {
    const log = await make();
    await log.recordCall(a, call());
    await log.recordCall(b, call({ tenantId: "b", callerName: "Other" }));
    expect(await log.listCalls("a")).toHaveLength(1);
    expect(await log.listCalls("b")).toHaveLength(1);
    const fa = (await log.listFollowUps("a", false))[0]!;
    expect(await log.markFollowUpDone("b", fa.id)).toBe(false);
    expect((await log.listCustomers("b")).map((c) => c.name)).toEqual(["Other"]);
  });

  it("marking an unknown follow-up done says so", async () => {
    const log = await make();
    expect(await log.markFollowUpDone("a", "fu_nope")).toBe(false);
  });
});
