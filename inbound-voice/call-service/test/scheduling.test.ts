import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { cancelAppointment, findAppointments, rescheduleAppointment, bookAppointment, checkAvailability } from "../src/booking.js";
import { InMemoryBookingStore, PgBookingStore } from "../src/bookingStore.js";
import type { CalendarClient } from "../src/calendar.js";
import { CalendarScheduler } from "../src/calendarScheduler.js";
import { migrate } from "../src/db.js";
import { InMemoryCallFactStore } from "../src/facts.js";
import { BookingNotFoundError, LocalScheduler, SlotUnavailableError } from "../src/localScheduler.js";
import type { Scheduler } from "../src/scheduler.js";
import { buildServer } from "../src/server.js";
import { InMemoryTenantRegistry } from "../src/tenants.js";
import type { CallRecord, Tenant } from "../src/types.js";
import { fromPglite } from "./pgliteSql.js";

const NOW = Date.parse("2026-10-15T10:00:00Z"); // Thursday; London is on BST (UTC+1) until 25 October
const PHONE = "+447400123456";
const OTHER_PHONE = "+447400999888";
const TUE = "2026-10-20"; // 09:00 local = 08:00Z
const at = (hhmmZ: string, day = TUE) => `${day}T${hhmmZ}:00.000Z`;

const base: Tenant["booking"] = { timeZone: "Europe/London", days: [1, 2, 3, 4, 5], open: "09:00", close: "12:00", slotMinutes: 30, minNoticeMinutes: 60 };
const mk = (booking: Tenant["booking"] = base, id = "t1"): Tenant => ({
  id,
  name: "Acme",
  defaultRegion: "GB",
  twenty: { baseUrl: "https://x", apiKey: "k", ingestSecret: "s" },
  numbers: [],
  dograhWebhookToken: `tok_${id}`,
  booking,
});
const tenant = mk();
const attendee = (name = "Sam Rivera", phoneNumber = PHONE) => ({ name, timeZone: "Europe/London", phoneNumber });
const day = (s: LocalScheduler, t: Tenant, date = TUE) => s.availableSlots(t, { start: date, end: date }).then((x) => x.map((y) => y.start));

describe("opening rules", () => {
  it("offers nothing on a day off, but the next day is normal", async () => {
    const t = mk({ ...base, daysOff: [TUE] });
    const s = new LocalScheduler(() => NOW);
    expect(await day(s, t, TUE)).toEqual([]);
    expect((await day(s, t, "2026-10-21")).length).toBe(6);
  });

  it("leaves out breaks, including a slot that only partly overlaps one", async () => {
    // Break 10:15-10:45 local (09:15Z-09:45Z) overlaps the 10:00 and 10:30 local slots.
    const t = mk({ ...base, breaks: [{ start: "10:15", end: "10:45" }] });
    const slots = await day(new LocalScheduler(() => NOW), t);
    expect(slots).toEqual([at("08:00"), at("08:30"), at("10:00"), at("10:30")]);
  });

  it("does not offer dates beyond the booking horizon", async () => {
    const t = mk({ ...base, maxAdvanceDays: 5 }); // today is 15 Oct, so 20 Oct is the last day
    const s = new LocalScheduler(() => NOW);
    expect((await day(s, t, TUE)).length).toBe(6);
    expect(await day(s, t, "2026-10-21")).toEqual([]);
    await expect(s.book(t, { start: at("08:00", "2026-10-21"), attendee: attendee() })).rejects.toBeInstanceOf(SlotUnavailableError);
  });

  it("a booking blocks every slot it overlaps, even after the slot length changes", async () => {
    const store = new InMemoryBookingStore();
    await new LocalScheduler(() => NOW, store).book(tenant, { start: at("08:30"), attendee: attendee() }); // 09:30 local, 30 minutes
    const hourly = mk({ ...base, slotMinutes: 60 });
    const slots = await day(new LocalScheduler(() => NOW, store), hourly);
    // Old bookings are treated as taking a whole current slot (conservative): 09:30 blocks the 09:00 and 10:00 local hours.
    expect(slots).toEqual([at("10:00")]);
  });

  it("copes with the clocks changing: slots on 25 October (clocks go back) stay on the hour", async () => {
    // Sunday 25 Oct is a day off for this tenant, so check Monday 26 Oct (GMT, UTC+0) and Friday 23 Oct (BST).
    const s = new LocalScheduler(() => NOW);
    expect((await day(s, tenant, "2026-10-23"))[0]).toBe("2026-10-23T08:00:00.000Z");
    expect((await day(s, tenant, "2026-10-26"))[0]).toBe("2026-10-26T09:00:00.000Z");
  });
});

describe("cancel", () => {
  it("frees the slot for someone else", async () => {
    const s = new LocalScheduler(() => NOW);
    const { bookingUid } = await s.book(tenant, { start: at("08:00"), attendee: attendee() });
    expect(await day(s, tenant)).not.toContain(at("08:00"));
    const gone = await s.cancel(tenant, { uid: bookingUid, phone: PHONE });
    expect(gone.start).toBe(at("08:00"));
    expect(await day(s, tenant)).toContain(at("08:00"));
    await s.book(tenant, { start: at("08:00"), attendee: attendee("Alex", OTHER_PHONE) });
  });

  it("only the number that booked can cancel, and a wrong attempt changes nothing", async () => {
    const s = new LocalScheduler(() => NOW);
    const { bookingUid } = await s.book(tenant, { start: at("08:00"), attendee: attendee() });
    await expect(s.cancel(tenant, { uid: bookingUid, phone: OTHER_PHONE })).rejects.toBeInstanceOf(BookingNotFoundError);
    await expect(s.cancel(tenant, { uid: bookingUid, phone: "" })).rejects.toBeInstanceOf(BookingNotFoundError);
    await expect(s.cancel(tenant, { uid: "loc_nope", phone: PHONE })).rejects.toBeInstanceOf(BookingNotFoundError);
    expect(await day(s, tenant)).not.toContain(at("08:00"));
  });

  it("another client cannot cancel it even with the right uid and number", async () => {
    const store = new InMemoryBookingStore();
    const s = new LocalScheduler(() => NOW, store);
    const { bookingUid } = await s.book(tenant, { start: at("08:00"), attendee: attendee() });
    await expect(s.cancel(mk(base, "t2"), { uid: bookingUid, phone: PHONE })).rejects.toBeInstanceOf(BookingNotFoundError);
  });

  it("an appointment that has already started cannot be cancelled", async () => {
    const store = new InMemoryBookingStore();
    const { bookingUid } = await new LocalScheduler(() => NOW, store).book(tenant, { start: at("08:00"), attendee: attendee() });
    const later = new LocalScheduler(() => Date.parse(at("08:10")), store);
    await expect(later.cancel(tenant, { uid: bookingUid, phone: PHONE })).rejects.toBeInstanceOf(BookingNotFoundError);
  });

  it("cancelling twice: the second attempt finds nothing", async () => {
    const s = new LocalScheduler(() => NOW);
    const { bookingUid } = await s.book(tenant, { start: at("08:00"), attendee: attendee() });
    await s.cancel(tenant, { uid: bookingUid, phone: PHONE });
    await expect(s.cancel(tenant, { uid: bookingUid, phone: PHONE })).rejects.toBeInstanceOf(BookingNotFoundError);
  });
});

describe("reschedule", () => {
  it("moves the appointment, keeping name and reason, and frees the old time", async () => {
    const s = new LocalScheduler(() => NOW);
    const { bookingUid } = await s.book(tenant, { start: at("08:00"), attendee: attendee(), reason: "Dripping taps" });
    const moved = await s.reschedule(tenant, { uid: bookingUid, phone: PHONE, newStart: at("09:00") });
    expect(moved.start).toBe(at("09:00"));
    expect(await day(s, tenant)).toContain(at("08:00"));
    expect(await day(s, tenant)).not.toContain(at("09:00"));
    const mine = await s.findBookings(tenant, PHONE);
    expect(mine).toEqual([{ uid: moved.bookingUid, start: at("09:00"), name: "Sam Rivera", reason: "Dripping taps" }]);
  });

  it("a taken new time leaves the original appointment exactly as it was", async () => {
    const s = new LocalScheduler(() => NOW);
    const mineBooking = await s.book(tenant, { start: at("08:00"), attendee: attendee() });
    await s.book(tenant, { start: at("09:00"), attendee: attendee("Alex", OTHER_PHONE) });
    await expect(s.reschedule(tenant, { uid: mineBooking.bookingUid, phone: PHONE, newStart: at("09:00") })).rejects.toBeInstanceOf(SlotUnavailableError);
    expect((await s.findBookings(tenant, PHONE)).map((b) => b.start)).toEqual([at("08:00")]);
  });

  it("refuses a closed time, the same time, and someone else's appointment", async () => {
    const s = new LocalScheduler(() => NOW);
    const { bookingUid } = await s.book(tenant, { start: at("08:00"), attendee: attendee() });
    await expect(s.reschedule(tenant, { uid: bookingUid, phone: PHONE, newStart: at("08:00") })).rejects.toBeInstanceOf(SlotUnavailableError);
    await expect(s.reschedule(tenant, { uid: bookingUid, phone: PHONE, newStart: "2026-10-17T09:00:00.000Z" })).rejects.toBeInstanceOf(SlotUnavailableError); // Saturday
    await expect(s.reschedule(tenant, { uid: bookingUid, phone: PHONE, newStart: "nonsense" })).rejects.toBeInstanceOf(SlotUnavailableError);
    await expect(s.reschedule(tenant, { uid: bookingUid, phone: OTHER_PHONE, newStart: at("09:00") })).rejects.toBeInstanceOf(BookingNotFoundError);
    expect((await s.findBookings(tenant, PHONE)).map((b) => b.start)).toEqual([at("08:00")]);
  });

  it("two people moving into the same slot at once: one wins, the other keeps their old time", async () => {
    const s = new LocalScheduler(() => NOW);
    const a = await s.book(tenant, { start: at("08:00"), attendee: attendee("Sam", PHONE) });
    const b = await s.book(tenant, { start: at("08:30"), attendee: attendee("Alex", OTHER_PHONE) });
    const results = await Promise.allSettled([
      s.reschedule(tenant, { uid: a.bookingUid, phone: PHONE, newStart: at("10:00") }),
      s.reschedule(tenant, { uid: b.bookingUid, phone: OTHER_PHONE, newStart: at("10:00") }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const all = [...(await s.findBookings(tenant, PHONE)), ...(await s.findBookings(tenant, OTHER_PHONE))].map((x) => x.start).sort();
    expect(all).toHaveLength(2);
    expect(new Set(all).size).toBe(2);
    expect(all).toContain(at("10:00"));
  });
});

describe("no double booking under pressure", () => {
  it("40 callers racing for one slot: exactly one gets it", async () => {
    const s = new LocalScheduler(() => NOW);
    const results = await Promise.allSettled(Array.from({ length: 40 }, (_, i) => s.book(tenant, { start: at("08:00"), attendee: attendee(`Caller ${i}`, `+4474001${String(i).padStart(5, "0")}`) })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });

  it("a random mix of book, cancel and move never leaves two bookings on one slot or loses a slot", async () => {
    // Small seeded generator so a failure can be replayed.
    let seed = 12345;
    const rnd = (n: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed % n);
    const store = new InMemoryBookingStore();
    const s = new LocalScheduler(() => NOW, store);
    const dates = [TUE, "2026-10-21", "2026-10-22"];
    const phones = Array.from({ length: 6 }, (_, i) => `+4474000000${i}0`);
    const mine = new Map<string, string[]>(); // phone -> uids we believe exist
    for (let step = 0; step < 400; step++) {
      const phone = phones[rnd(phones.length)]!;
      const slots = await day(s, tenant, dates[rnd(dates.length)]!);
      const uids = mine.get(phone) ?? [];
      const action = rnd(3);
      try {
        if (action === 0 && slots.length) {
          const { bookingUid } = await s.book(tenant, { start: slots[rnd(slots.length)]!, attendee: attendee(`P${phone}`, phone) });
          mine.set(phone, [...uids, bookingUid]);
        } else if (action === 1 && uids.length) {
          const uid = uids[rnd(uids.length)]!;
          await s.cancel(tenant, { uid, phone });
          mine.set(phone, uids.filter((u) => u !== uid));
        } else if (action === 2 && uids.length && slots.length) {
          const uid = uids[rnd(uids.length)]!;
          const moved = await s.reschedule(tenant, { uid, phone, newStart: slots[rnd(slots.length)]! });
          mine.set(phone, [...uids.filter((u) => u !== uid), moved.bookingUid]);
        }
      } catch (e) {
        if (!(e instanceof SlotUnavailableError) && !(e instanceof BookingNotFoundError)) throw e;
      }
    }
    // What the store holds is exactly what we think we did, with no overlaps.
    const stored = (await Promise.all(phones.map((p) => s.findBookings(tenant, p)))).flat();
    expect(stored.map((b) => b.uid).sort()).toEqual([...mine.values()].flat().sort());
    const starts = stored.map((b) => Date.parse(b.start)).sort((a, b) => a - b);
    for (let i = 1; i < starts.length; i++) expect(starts[i]! - starts[i - 1]!).toBeGreaterThanOrEqual(30 * 60_000);
  });
});

describe("tools: find, cancel, move", () => {
  const deps = () => {
    const scheduler = new LocalScheduler(() => NOW) as Scheduler;
    return { scheduler: () => scheduler, facts: new InMemoryCallFactStore() };
  };
  const book = (d: ReturnType<typeof deps>, start: string, extra: Record<string, unknown> = {}) =>
    bookAppointment(d, tenant, { start, name: "Sam Rivera", caller_number: "07400 123456", workflow_run_id: "1", ...extra });

  it("books under the number the caller rang from, and keeps a different contact number in the notes", async () => {
    const d = deps();
    await book(d, at("08:00"), { phone: "07911 123456", reason: "Dripping taps" });
    const found = await findAppointments(d, tenant, { caller_number: PHONE });
    expect(found.ok && found.body.appointments).toEqual([
      { appointment_id: expect.stringMatching(/^loc_/), start: "2026-10-20T09:00:00+01:00", label: "Tuesday 20 October at 09:00", name: "Sam Rivera", reason: "Dripping taps. Contact number: +447911123456" },
    ]);
  });

  it("saves the job details given at booking time", async () => {
    const d = deps();
    await book(d, at("08:00"), { reason: "Dripping taps and a leak under the sink" });
    const found = await findAppointments(d, tenant, { caller_number: PHONE });
    expect(JSON.stringify(found)).toContain("leak under the sink");
  });

  it("cancels the caller's only appointment without needing an id, and says which one", async () => {
    const d = deps();
    await book(d, at("08:00"));
    const r = await cancelAppointment(d, tenant, { caller_number: PHONE, workflow_run_id: "2" });
    expect(r.ok && r.body.label).toBe("Tuesday 20 October at 09:00");
    expect((await findAppointments(d, tenant, { caller_number: PHONE })).ok).toBe(true);
    const again = await cancelAppointment(d, tenant, { caller_number: PHONE });
    expect(!again.ok && again.status).toBe(404);
  });

  it("with two appointments it asks which one rather than guessing", async () => {
    const d = deps();
    await book(d, at("08:00"));
    await book(d, at("09:00"));
    const r = await cancelAppointment(d, tenant, { caller_number: PHONE });
    expect(!r.ok && r.status).toBe(409);
    expect(!r.ok && (r.body.appointments as unknown[]).length).toBe(2);
    const listed = await findAppointments(d, tenant, { caller_number: PHONE });
    expect(listed.ok && listed.body.appointments).toHaveLength(2);
  });

  it("will not touch appointments when the caller's number is withheld, and never shows another number's", async () => {
    const d = deps();
    await book(d, at("08:00"));
    for (const r of [await findAppointments(d, tenant, {}), await cancelAppointment(d, tenant, {}), await rescheduleAppointment(d, tenant, { new_start: at("09:00") })]) {
      expect(!r.ok && r.status).toBe(422);
    }
    const other = await findAppointments(d, tenant, { caller_number: OTHER_PHONE });
    expect(other.ok && other.body.appointments).toEqual([]);
  });

  it("moves an appointment and reports a taken time without changing anything", async () => {
    const d = deps();
    await book(d, at("08:00"));
    await bookAppointment(d, tenant, { start: at("09:00"), name: "Alex", caller_number: OTHER_PHONE });
    const clash = await rescheduleAppointment(d, tenant, { caller_number: PHONE, new_start: at("09:00") });
    expect(!clash.ok && clash.status).toBe(409);
    const ok = await rescheduleAppointment(d, tenant, { caller_number: PHONE, new_start: at("10:00") });
    expect(ok.ok && ok.body.label).toBe("Tuesday 20 October at 11:00");
  });

  it("a scheduler failure is reported as 'nothing changed', never as success", async () => {
    const fail = async () => {
      throw new Error("down");
    };
    const broken: Scheduler = { availableSlots: fail, book: fail, findBookings: fail, cancel: fail, reschedule: fail };
    const d = { scheduler: () => broken, facts: new InMemoryCallFactStore() };
    for (const r of [await findAppointments(d, tenant, { caller_number: PHONE }), await cancelAppointment(d, tenant, { caller_number: PHONE, appointment_id: "x" }), await rescheduleAppointment(d, tenant, { caller_number: PHONE, appointment_id: "x", new_start: at("09:00") })]) {
      expect(!r.ok && r.status).toBe(502);
    }
  });

  it("check_availability honours a day off and says nothing is free that day", async () => {
    const t = mk({ ...base, daysOff: [TUE] });
    const d = { scheduler: () => new LocalScheduler(() => NOW) as Scheduler, facts: new InMemoryCallFactStore() };
    const r = await checkAvailability(d, t, { date: TUE });
    expect(r.slots).toEqual([]);
    expect(r.nextAvailable?.[0]?.label).toContain("Wednesday 21 October");
  });
});

describe("call outcome after changes", () => {
  const registry = new InMemoryTenantRegistry([tenant]);
  const post = (app: ReturnType<typeof buildServer>["app"], url: string, body: unknown) =>
    app.inject({ method: "POST", url, headers: { "content-type": "application/json", authorization: "Bearer tok_t1" }, payload: JSON.stringify(body) });
  function setup() {
    const written: CallRecord[] = [];
    const scheduler = new LocalScheduler(() => NOW);
    const { app, queue } = buildServer({ registry, crm: { writeCall: async (_t, r) => void written.push(r) }, providerSecret: "p", facts: new InMemoryCallFactStore(), scheduler: () => scheduler });
    return { app, queue, written };
  }

  it("book then cancel on the same call is not BOOKED", async () => {
    const { app, queue, written } = setup();
    await post(app, "/tools/book", { start: at("08:00"), name: "Sam Rivera", caller_number: PHONE, workflow_run_id: 1 });
    const c = await post(app, "/tools/cancel", { caller_number: PHONE, workflow_run_id: 1 });
    expect(c.statusCode).toBe(200);
    await post(app, "/webhooks/dograh", { run_id: "1", disposition: "end_call" });
    await queue.idle();
    expect(written[0]!.outcome).not.toBe("BOOKED");
    expect(written[0]!.summary).toContain("Cancelled Sam Rivera's appointment");
  });

  it("a cancellation on its own call is recorded in the summary", async () => {
    const { app, queue, written } = setup();
    await post(app, "/tools/book", { start: at("08:00"), name: "Sam Rivera", caller_number: PHONE, workflow_run_id: 1 });
    await post(app, "/tools/cancel", { caller_number: PHONE, workflow_run_id: 2 });
    await post(app, "/webhooks/dograh", { run_id: "2", disposition: "end_call" });
    await queue.idle();
    expect(written[0]).toMatchObject({ providerCallId: "dograh:2", outcome: "INFO_GIVEN" });
    expect(written[0]!.summary).toContain("Cancelled Sam Rivera's appointment on Tuesday 20 October at 09:00");
  });

  it("a move is BOOKED with the old and new times in the summary", async () => {
    const { app, queue, written } = setup();
    await post(app, "/tools/book", { start: at("08:00"), name: "Sam Rivera", caller_number: PHONE, workflow_run_id: 1 });
    const m = await post(app, "/tools/reschedule", { caller_number: PHONE, new_start: at("09:00"), workflow_run_id: 3 });
    expect(m.statusCode).toBe(200);
    await post(app, "/webhooks/dograh", { run_id: "3", disposition: "end_call" });
    await queue.idle();
    expect(written[0]).toMatchObject({ providerCallId: "dograh:3", outcome: "BOOKED" });
    expect(written[0]!.summary).toContain("from Tuesday 20 October at 09:00 to Tuesday 20 October at 10:00");
  });

  it("a message that was taken is not turned into INFO_GIVEN by a later record_outcome info_given, but a callback request still wins", async () => {
    const { app, queue, written } = setup();
    await post(app, "/tools/message", { message: "Leak", name: "Alex", workflow_run_id: 31 });
    await post(app, "/tools/outcome", { outcome: "info_given", workflow_run_id: 31 });
    await post(app, "/webhooks/dograh", { run_id: "31", disposition: "end_call" });
    await post(app, "/tools/message", { message: "Boiler quote", name: "Priya", workflow_run_id: 32 });
    await post(app, "/tools/outcome", { outcome: "callback_requested", note: "tomorrow pm", workflow_run_id: 32 });
    await post(app, "/webhooks/dograh", { run_id: "32", disposition: "end_call" });
    await queue.idle();
    expect(written.find((w) => w.providerCallId === "dograh:31")!.outcome).toBe("MESSAGE_TAKEN");
    expect(written.find((w) => w.providerCallId === "dograh:32")!.outcome).toBe("CALLBACK_REQUESTED");
  });

  it("the new routes reject a wrong token and bad input", async () => {
    const { app } = setup();
    const bad = await app.inject({ method: "POST", url: "/tools/cancel", headers: { "content-type": "application/json", authorization: "Bearer nope" }, payload: "{}" });
    expect(bad.statusCode).toBe(401);
    expect((await post(app, "/tools/reschedule", { caller_number: PHONE })).statusCode).toBe(400); // new_start missing
  });
});

describe("with a client calendar", () => {
  const cal = { ...tenant, calendar: { provider: "google", refreshToken: "x" } } as Tenant;
  function setup(opts: { deleteError?: Error; createFailsAfter?: number } = {}) {
    const store = new InMemoryBookingStore();
    const local = new LocalScheduler(() => NOW, store);
    const events = new Map<string, { start: string }>();
    let n = 0;
    const client: CalendarClient = {
      busy: async () => [...events.values()].map((e) => ({ start: e.start, end: new Date(Date.parse(e.start) + 30 * 60_000).toISOString() })).filter(() => false), // our own events are already excluded by the store
      createEvent: async (_t, ev) => {
        if (opts.createFailsAfter !== undefined && n >= opts.createFailsAfter) throw new Error("Google event creation failed: 500");
        const id = `ev${++n}`;
        events.set(id, { start: ev.start });
        return { eventId: id };
      },
      deleteEvent: async (_t, id) => {
        if (opts.deleteError) throw opts.deleteError;
        events.delete(id);
      },
    };
    return { scheduler: new CalendarScheduler(local, store, client), events, store };
  }

  it("cancelling deletes the event from their calendar and frees the slot", async () => {
    const { scheduler, events } = setup();
    const { bookingUid } = await scheduler.book(cal, { start: at("08:00"), attendee: attendee() });
    expect(events.size).toBe(1);
    await scheduler.cancel(cal, { uid: bookingUid, phone: PHONE });
    expect(events.size).toBe(0);
    expect(await scheduler.findBookings(cal, PHONE)).toEqual([]);
  });

  it("if the calendar will not delete the event, the booking stays so the two never disagree", async () => {
    const { scheduler, events } = setup({ deleteError: new Error("Google event deletion failed: 503") });
    const { bookingUid } = await scheduler.book(cal, { start: at("08:00"), attendee: attendee() });
    await expect(scheduler.cancel(cal, { uid: bookingUid, phone: PHONE })).rejects.toThrow(/503/);
    expect(events.size).toBe(1);
    expect(await scheduler.findBookings(cal, PHONE)).toHaveLength(1);
  });

  it("moving writes the new event first, then removes the old one", async () => {
    const { scheduler, events } = setup();
    const { bookingUid } = await scheduler.book(cal, { start: at("08:00"), attendee: attendee(), reason: "Leak" });
    const moved = await scheduler.reschedule(cal, { uid: bookingUid, phone: PHONE, newStart: at("09:00") });
    expect([...events.values()].map((e) => e.start)).toEqual([at("09:00")]);
    expect((await scheduler.findBookings(cal, PHONE)).map((b) => b.uid)).toEqual([moved.bookingUid]);
  });

  it("if the new event cannot be written, the old appointment and its event stay", async () => {
    const { scheduler, events } = setup({ createFailsAfter: 1 });
    const { bookingUid } = await scheduler.book(cal, { start: at("08:00"), attendee: attendee() });
    await expect(scheduler.reschedule(cal, { uid: bookingUid, phone: PHONE, newStart: at("09:00") })).rejects.toThrow(/500/);
    expect([...events.values()].map((e) => e.start)).toEqual([at("08:00")]);
    expect((await scheduler.findBookings(cal, PHONE)).map((b) => b.start)).toEqual([at("08:00")]);
  });

  it("if the old event cannot be deleted after moving, the move is undone and nothing is doubled", async () => {
    const store = new InMemoryBookingStore();
    const local = new LocalScheduler(() => NOW, store);
    const events = new Set<string>();
    let failDelete = false;
    let n = 0;
    const client: CalendarClient = {
      busy: async () => [],
      createEvent: async () => {
        const id = `ev${++n}`;
        events.add(id);
        return { eventId: id };
      },
      deleteEvent: async (_t, id) => {
        if (failDelete && id === "ev1") throw new Error("Google event deletion failed: 503");
        events.delete(id);
      },
    };
    const scheduler = new CalendarScheduler(local, store, client);
    const { bookingUid } = await scheduler.book(cal, { start: at("08:00"), attendee: attendee() });
    failDelete = true;
    await expect(scheduler.reschedule(cal, { uid: bookingUid, phone: PHONE, newStart: at("09:00") })).rejects.toThrow(/503/);
    expect([...events]).toEqual(["ev1"]); // the new event was removed again
    expect((await scheduler.findBookings(cal, PHONE)).map((b) => b.start)).toEqual([at("08:00")]);
  });
});

describe("on Postgres", () => {
  async function pg() {
    const sql = fromPglite(new PGlite());
    await migrate(sql);
    return { sql, store: new PgBookingStore(sql) };
  }

  it("stores the job details and finds, cancels and moves by phone number", async () => {
    const { store } = await pg();
    const s = new LocalScheduler(() => NOW, store);
    const { bookingUid } = await s.book(tenant, { start: at("08:00"), attendee: attendee(), reason: "Dripping taps" });
    expect(await s.findBookings(tenant, PHONE)).toEqual([{ uid: bookingUid, start: at("08:00"), name: "Sam Rivera", reason: "Dripping taps" }]);
    const moved = await s.reschedule(tenant, { uid: bookingUid, phone: PHONE, newStart: at("09:00") });
    expect((await s.findBookings(tenant, PHONE)).map((b) => b.uid)).toEqual([moved.bookingUid]);
    await s.cancel(tenant, { uid: moved.bookingUid, phone: PHONE });
    expect(await s.findBookings(tenant, PHONE)).toEqual([]);
    expect(await day(s, tenant)).toContain(at("09:00"));
  });

  it("remembers the calendar event id, and a cancelled slot can be booked again", async () => {
    const { store } = await pg();
    await store.reserve("t1", at("08:00"), { uid: "u1", name: "Sam", phone: PHONE });
    await store.setEventId("t1", "u1", "ev9");
    expect(await store.get("t1", "u1")).toMatchObject({ uid: "u1", eventId: "ev9", start: at("08:00") });
    expect(await store.cancel("t1", "u1")).toMatchObject({ uid: "u1" });
    expect(await store.cancel("t1", "u1")).toBeUndefined();
    expect(await store.reserve("t1", at("08:00"), { uid: "u2", name: "Alex" })).toBe(true);
  });

  it("migration can be applied on top of a database from before these columns existed", async () => {
    const sql = fromPglite(new PGlite());
    await sql.query(`CREATE TABLE bookings (tenant_id text NOT NULL, start_at timestamptz NOT NULL, uid text NOT NULL, attendee_name text NOT NULL, attendee_phone text, attendee_email text, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (tenant_id, start_at))`);
    await sql.query(`INSERT INTO bookings (tenant_id, start_at, uid, attendee_name) VALUES ('t1', '${at("08:00")}', 'old1', 'Early customer')`);
    await migrate(sql);
    expect(await new PgBookingStore(sql).get("t1", "old1")).toMatchObject({ uid: "old1", name: "Early customer" });
  });
});

describe("times given to the agent are local, so label and value agree", () => {
  it("toLocalIso writes the wall clock with its offset, in summer and winter", async () => {
    const m = await import("../src/localScheduler.js");
    expect(m.toLocalIso(Date.parse("2026-10-16T13:30:00Z"), "Europe/London")).toBe("2026-10-16T14:30:00+01:00");
    expect(m.toLocalIso(Date.parse("2026-10-26T09:00:00Z"), "Europe/London")).toBe("2026-10-26T09:00:00+00:00");
    expect(m.toLocalIso(Date.parse("2026-10-20T13:00:00Z"), "America/New_York")).toBe("2026-10-20T09:00:00-04:00");
    expect(m.toLocalIso(Date.parse("2026-10-20T00:00:00Z"), "Asia/Kolkata")).toBe("2026-10-20T05:30:00+05:30");
  });

  it("every offered start has the same clock digits as its label, and copying it back books exactly that slot (the call 11 bug)", async () => {
    const one = new LocalScheduler(() => NOW) as Scheduler; // one instance, so bookings persist between the calls below
    const d = { scheduler: () => one, facts: new InMemoryCallFactStore() };
    const r = await checkAvailability(d, tenant, { date: TUE });
    for (const s of r.slots) expect(s.label.slice(-5)).toBe(s.start.slice(11, 16));
    const pick = r.slots[3]!; // 10:30 on the clock
    const booked = await bookAppointment(d, tenant, { start: pick.start, name: "Sam", caller_number: PHONE });
    expect(booked.ok && booked.body.label).toBe(pick.label);
    expect(booked.ok && booked.body.start).toBe(pick.start);
    // The same value moves it, too.
    const other = r.slots[5]!;
    const moved = await rescheduleAppointment(d, tenant, { caller_number: PHONE, new_start: other.start });
        expect(moved.ok && moved.body.label).toBe(other.label);
  });

  it("an agent that wrongly adds a Z to the clock digits gets a DIFFERENT slot, and the label in the answer shows it", async () => {
    const d = { scheduler: () => new LocalScheduler(() => NOW) as Scheduler, facts: new InMemoryCallFactStore() };
    const wrong = await bookAppointment(d, tenant, { start: "2026-10-20T10:30:00Z", name: "Sam", caller_number: PHONE });
    expect(wrong.ok && wrong.body.label).toBe("Tuesday 20 October at 11:30"); // not what "10:30" meant: the answer exposes it
  });
});
