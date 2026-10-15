import { describe, expect, it } from "vitest";
import { bookAppointment, checkAvailability } from "../src/booking.js";
import { chooseOutcome, dograhPayload, toCallRecord } from "../src/dograh.js";
import { InMemoryCallFactStore } from "../src/facts.js";
import { LocalScheduler, SlotUnavailableError, addDays, weekdayOf, zonedToUtc } from "../src/localScheduler.js";
import type { Scheduler } from "../src/scheduler.js";
import { buildServer } from "../src/server.js";
import { InMemoryTenantRegistry } from "../src/tenants.js";
import type { CallRecord, Tenant } from "../src/types.js";

const NOW = Date.parse("2026-10-15T10:00:00Z"); // a Thursday
const tenant: Tenant = {
  id: "t1",
  name: "Acme Dental",
  defaultRegion: "GB",
  twenty: { baseUrl: "https://acme.crm.example.com", apiKey: "k", ingestSecret: "s" },
  calDiy: null,
  numbers: [],
  dograhWebhookToken: "tok_acme",
  booking: { timeZone: "Europe/London", days: [1, 2, 3, 4, 5], open: "09:00", close: "17:00", slotMinutes: 30, minNoticeMinutes: 60 },
};

describe("time zone helpers", () => {
  it("converts local wall-clock time to UTC across the autumn clock change", () => {
    // 20 Oct 2026 is BST (UTC+1); 26 Oct is GMT (UTC+0) because clocks went back on 25 Oct.
    expect(new Date(zonedToUtc("2026-10-20", "10:00", "Europe/London")).toISOString()).toBe("2026-10-20T09:00:00.000Z");
    expect(new Date(zonedToUtc("2026-10-26", "10:00", "Europe/London")).toISOString()).toBe("2026-10-26T10:00:00.000Z");
    expect(new Date(zonedToUtc("2026-10-20", "09:00", "America/New_York")).toISOString()).toBe("2026-10-20T13:00:00.000Z");
  });
  it("knows weekdays and adds days across month ends", () => {
    expect(weekdayOf("2026-10-20")).toBe(2); // Tuesday
    expect(weekdayOf("2026-10-17")).toBe(6); // Saturday
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });
});

describe("LocalScheduler", () => {
  it("offers working-hours slots on working days only", async () => {
    const s = new LocalScheduler(() => NOW);
    const tue = await s.availableSlots(tenant, { start: "2026-10-20", end: "2026-10-20" });
    expect(tue).toHaveLength(16); // 09:00 to 17:00 in 30-minute slots
    expect(tue[0]!.start).toBe("2026-10-20T08:00:00.000Z"); // 09:00 BST
    expect(tue.at(-1)!.start).toBe("2026-10-20T15:30:00.000Z"); // 16:30 BST
    expect(await s.availableSlots(tenant, { start: "2026-10-17", end: "2026-10-18" })).toEqual([]); // weekend
  });

  it("respects minimum notice", async () => {
    // 15 Oct 10:00Z with 60 minutes notice: the earliest bookable slot that day is 11:00Z.
    const s = new LocalScheduler(() => NOW);
    const today = await s.availableSlots(tenant, { start: "2026-10-15", end: "2026-10-15" });
    expect(today[0]!.start >= "2026-10-15T11:00:00.000Z").toBe(true);
  });

  it("books a slot, hides it afterwards, and refuses a double booking", async () => {
    const s = new LocalScheduler(() => NOW);
    const start = "2026-10-20T09:00:00.000Z";
    const { bookingUid } = await s.book(tenant, { start, attendee: { name: "Sam", timeZone: "Europe/London" } });
    expect(bookingUid).toMatch(/^loc_/);
    const left = await s.availableSlots(tenant, { start: "2026-10-20", end: "2026-10-20" });
    expect(left.some((x) => x.start === start)).toBe(false);
    await expect(s.book(tenant, { start, attendee: { name: "Alex", timeZone: "Europe/London" } })).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("refuses times that were never offered", async () => {
    const s = new LocalScheduler(() => NOW);
    await expect(s.book(tenant, { start: "2026-10-20T09:10:00.000Z", attendee: { name: "Sam", timeZone: "Europe/London" } })).rejects.toBeInstanceOf(SlotUnavailableError); // not on a slot boundary
    await expect(s.book(tenant, { start: "2026-10-17T10:00:00.000Z", attendee: { name: "Sam", timeZone: "Europe/London" } })).rejects.toBeInstanceOf(SlotUnavailableError); // Saturday
    await expect(s.book(tenant, { start: "garbage", attendee: { name: "Sam", timeZone: "Europe/London" } })).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("keeps tenants separate", async () => {
    const s = new LocalScheduler(() => NOW);
    const other = { ...tenant, id: "t2" };
    const start = "2026-10-20T09:00:00.000Z";
    await s.book(tenant, { start, attendee: { name: "Sam", timeZone: "Europe/London" } });
    expect((await s.availableSlots(other, { start: "2026-10-20", end: "2026-10-20" })).some((x) => x.start === start)).toBe(true);
  });
});

describe("booking tools", () => {
  // One scheduler instance per test so bookings persist between calls, as they do in the running service.
  const deps = () => {
    const scheduler = new LocalScheduler(() => NOW) as Scheduler;
    return { scheduler: () => scheduler, facts: new InMemoryCallFactStore() };
  };

  it("returns labelled slots and filters by part of day", async () => {
    const d = deps();
    const all = await checkAvailability(d, tenant, { date: "2026-10-20" });
    expect(all.slots.length).toBe(6);
    expect(all.slots[0]!.label).toBe("Tuesday 20 October at 09:00");
    const afternoon = await checkAvailability(d, tenant, { date: "2026-10-20", part_of_day: "afternoon" });
    expect(afternoon.slots.every((s) => Number(s.label.slice(-5, -3)) >= 12)).toBe(true);
  });

  it("suggests the next available days when the date is closed", async () => {
    const r = await checkAvailability(deps(), tenant, { date: "2026-10-17" }); // Saturday
    expect(r.slots).toEqual([]);
    expect(r.nextAvailable?.length).toBe(4);
    expect(r.nextAvailable?.[0]?.label).toContain("Monday 19 October");
  });

  it("books, records the fact against the call, and reports a clash as 409", async () => {
    const d = deps();
    const first = await bookAppointment(d, tenant, { start: "2026-10-20T09:00:00.000Z", name: "Sam Rivera", workflow_run_id: "7" });
    expect(first.ok).toBe(true);
    expect((await d.facts.get("t1", "dograh:7"))?.booking?.name).toBe("Sam Rivera");
    const clash = await bookAppointment(d, tenant, { start: "2026-10-20T09:00:00.000Z", name: "Alex", workflow_run_id: "8" });
    expect(clash.ok).toBe(false);
    expect(!clash.ok && clash.status).toBe(409);
    expect(await d.facts.get("t1", "dograh:8")).toBeUndefined(); // a failed booking is never recorded
  });

  it("does not report a booking when the scheduler itself fails", async () => {
    const broken: Scheduler = { availableSlots: async () => [], book: async () => { throw new Error("calendar down"); } };
    const d = { scheduler: () => broken, facts: new InMemoryCallFactStore() };
    const r = await bookAppointment(d, tenant, { start: "2026-10-20T09:00:00.000Z", name: "Sam", workflow_run_id: "9" });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.status).toBe(502);
    expect(await d.facts.get("t1", "dograh:9")).toBeUndefined();
  });
});

describe("outcome choice", () => {
  it("uses the platform disposition when it is a real outcome, else the agent's hint, else NO_OUTCOME", () => {
    expect(chooseOutcome("callback_requested", "opted_out")).toBe("CALLBACK_REQUESTED");
    expect(chooseOutcome("end_call", "callback_requested")).toBe("CALLBACK_REQUESTED"); // text chat: only the end reason arrives
    expect(chooseOutcome("user_hangup", undefined)).toBe("NO_OUTCOME");
    expect(chooseOutcome(undefined, "nonsense")).toBe("NO_OUTCOME");
    expect(chooseOutcome("", "")).toBe("NO_OUTCOME");
  });
  it("feeds the record", () => {
    const r = toCallRecord(tenant, dograhPayload.parse({ run_id: "1", disposition: "end_call", outcome_hint: "info_given" }));
    expect(r.outcome).toBe("INFO_GIVEN");
  });
});

describe("tool routes and webhook", () => {
  const registry = new InMemoryTenantRegistry([tenant]);
  const post = (app: ReturnType<typeof buildServer>["app"], url: string, body: unknown, token = "tok_acme") =>
    app.inject({ method: "POST", url, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, payload: JSON.stringify(body) });

  function setup() {
    const written: CallRecord[] = [];
    const facts = new InMemoryCallFactStore();
    const { app, queue } = buildServer({
      registry,
      crm: { writeCall: async (_t, r) => void written.push(r) },
      providerSecret: "p",
      facts,
      scheduler: () => scheduler,
    });
    const scheduler = new LocalScheduler(() => NOW);
    return { app, queue, written };
  }

  it("rejects tool calls without a valid tenant token or valid input", async () => {
    const { app } = setup();
    expect((await post(app, "/tools/availability", { date: "2026-10-20" }, "wrong")).statusCode).toBe(401);
    expect((await post(app, "/tools/availability", { date: "next tuesday" })).statusCode).toBe(400);
    expect((await post(app, "/tools/book", { name: "Sam" })).statusCode).toBe(400);
  });

  it("books through the tool, refuses a second booking of the same slot, and marks the call BOOKED when its webhook arrives", async () => {
    const { app, queue, written } = setup();
    const avail = await post(app, "/tools/availability", { date: "2026-10-20", part_of_day: "morning" });
    expect(avail.statusCode).toBe(200);
    const slot = avail.json().slots[0].start as string;

    const book = await post(app, "/tools/book", { start: slot, name: "Sam Rivera", phone: "07400 123456", workflow_run_id: 42 });
    expect(book.statusCode).toBe(200);
    expect(book.json()).toMatchObject({ booked: true });
    expect((await post(app, "/tools/book", { start: slot, name: "Alex", workflow_run_id: 43 })).statusCode).toBe(409);

    // Dograh's webhook for run 42 carries only an end reason, as on text chats. Our own booking fact decides the outcome.
    const hook = await post(app, "/webhooks/dograh", { run_id: "42", disposition: "end_call", duration: "30" });
    expect(hook.statusCode).toBe(202);
    await queue.idle();
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ providerCallId: "dograh:42", outcome: "BOOKED" });
    expect(written[0]!.summary).toContain("Sam Rivera");
  });

  it("leaves other calls alone: no booking fact means the classifier outcome stands", async () => {
    const { app, queue, written } = setup();
    await post(app, "/webhooks/dograh", { run_id: "50", disposition: "opted_out" });
    await queue.idle();
    expect(written[0]).toMatchObject({ providerCallId: "dograh:50", outcome: "OPTED_OUT" });
  });
});
