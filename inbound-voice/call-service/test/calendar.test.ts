import { describe, expect, it } from "vitest";
import { GoogleCalendarClient, MicrosoftCalendarClient, type CalendarClient } from "../src/calendar.js";
import { CalendarScheduler, schedulerSelector } from "../src/calendarScheduler.js";
import { InMemoryBookingStore } from "../src/bookingStore.js";
import { LocalScheduler, SlotUnavailableError } from "../src/localScheduler.js";
import { checkAvailability } from "../src/booking.js";
import { InMemoryCallFactStore } from "../src/facts.js";
import type { Tenant } from "../src/types.js";

// Request shapes follow Google's and Microsoft's published APIs. They have NOT been run against live accounts.
const google = { id: "t1", calendar: { provider: "google", refreshToken: "rt-g" } } as Tenant;
const ms = { id: "t2", calendar: { provider: "microsoft", refreshToken: "rt-m" } } as Tenant;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

interface Call {
  url: string;
  init: RequestInit;
}
function recorder(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetchImpl = (async (u: string | URL, init: RequestInit = {}) => {
    calls.push({ url: String(u), init });
    return handler(String(u), init);
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}
const header = (c: Call, name: string) => (c.init.headers as Record<string, string>)[name];

describe("GoogleCalendarClient", () => {
  const app = { clientId: "cid", clientSecret: "sec" };
  const handler = (url: string) => {
    if (url.includes("oauth2.googleapis.com")) return json({ access_token: "at-1", expires_in: 3600 });
    if (url.endsWith("/freeBusy")) return json({ calendars: { primary: { busy: [{ start: "2026-10-20T09:00:00Z", end: "2026-10-20T10:00:00Z" }] } } });
    return json({ id: "ev_1" });
  };

  it("refreshes a token, then asks free/busy for the primary calendar", async () => {
    const r = recorder(handler);
    const busy = await new GoogleCalendarClient(app, r.fetchImpl).busy(google, "2026-10-20T00:00:00.000Z", "2026-10-21T00:00:00.000Z");
    expect(busy).toEqual([{ start: "2026-10-20T09:00:00.000Z", end: "2026-10-20T10:00:00.000Z" }]);
    const refresh = r.calls[0]!;
    expect(String(refresh.init.body)).toContain("grant_type=refresh_token");
    expect(String(refresh.init.body)).toContain("refresh_token=rt-g");
    const fb = r.calls[1]!;
    expect(header(fb, "authorization")).toBe("Bearer at-1");
    expect(JSON.parse(String(fb.init.body))).toEqual({ timeMin: "2026-10-20T00:00:00.000Z", timeMax: "2026-10-21T00:00:00.000Z", items: [{ id: "primary" }] });
  });

  it("reuses the access token until it expires", async () => {
    let now = 0;
    const r = recorder(handler);
    const c = new GoogleCalendarClient(app, r.fetchImpl, () => now);
    await c.busy(google, "a", "b");
    await c.busy(google, "a", "b");
    expect(r.calls.filter((x) => x.url.includes("oauth2")).length).toBe(1);
    now = 3_600_000; // past expiry
    await c.busy(google, "a", "b");
    expect(r.calls.filter((x) => x.url.includes("oauth2")).length).toBe(2);
  });

  it("never reports a calendar it could not read as empty", async () => {
    const r = recorder((url) => (url.includes("oauth2") ? json({ access_token: "x" }) : json({ calendars: { primary: { errors: [{ reason: "notFound" }] } } })));
    await expect(new GoogleCalendarClient(app, r.fetchImpl).busy(google, "a", "b")).rejects.toThrow(/notFound/);
    const r2 = recorder((url) => (url.includes("oauth2") ? json({ access_token: "x" }) : json({ calendars: {} })));
    await expect(new GoogleCalendarClient(app, r2.fetchImpl).busy(google, "a", "b")).rejects.toThrow(/could not read/);
  });

  it("creates an event in UTC and returns its id", async () => {
    const r = recorder(handler);
    const out = await new GoogleCalendarClient(app, r.fetchImpl).createEvent({ ...google, calendar: { provider: "google", refreshToken: "rt-g", calendarId: "team@acme.com" } }, { start: "2026-10-20T09:00:00.000Z", end: "2026-10-20T09:30:00.000Z", title: "Appointment: Sam", description: "Phone: +4474" });
    expect(out).toEqual({ eventId: "ev_1" });
    const ev = r.calls[1]!;
    expect(ev.url).toContain("/calendars/team%40acme.com/events");
    expect(JSON.parse(String(ev.init.body))).toEqual({ summary: "Appointment: Sam", description: "Phone: +4474", start: { dateTime: "2026-10-20T09:00:00.000Z", timeZone: "UTC" }, end: { dateTime: "2026-10-20T09:30:00.000Z", timeZone: "UTC" } });
  });

  it("explains a revoked connection and does not leak secrets in the error", async () => {
    const r = recorder(() => json({ error: "invalid_grant" }, 400));
    const err = await new GoogleCalendarClient(app, r.fetchImpl).busy(google, "a", "b").catch((e: Error) => e);
    expect((err as Error).message).toMatch(/reconnect.*400 invalid_grant/);
    expect((err as Error).message).not.toContain("rt-g");
    expect((err as Error).message).not.toContain("sec");
  });

  it("refuses a tenant that has no Google calendar", async () => {
    await expect(new GoogleCalendarClient(app, recorder(handler).fetchImpl).busy(ms, "a", "b")).rejects.toThrow(/no google calendar/);
  });
});

describe("MicrosoftCalendarClient", () => {
  const app = { clientId: "cid", clientSecret: "sec" };
  it("reads calendarView in UTC, skips free and cancelled events, and follows pages", async () => {
    const r = recorder((url) => {
      if (url.includes("login.microsoftonline.com")) return json({ access_token: "at-m", expires_in: 3600 });
      if (url.includes("page2")) return json({ value: [{ start: { dateTime: "2026-10-20T14:00:00.0000000" }, end: { dateTime: "2026-10-20T15:00:00.0000000" }, showAs: "tentative" }] });
      return json({
        value: [
          { start: { dateTime: "2026-10-20T09:00:00.0000000" }, end: { dateTime: "2026-10-20T10:00:00.0000000" }, showAs: "busy" },
          { start: { dateTime: "2026-10-20T11:00:00.0000000" }, end: { dateTime: "2026-10-20T12:00:00.0000000" }, showAs: "free" },
          { start: { dateTime: "2026-10-20T12:00:00.0000000" }, end: { dateTime: "2026-10-20T13:00:00.0000000" }, showAs: "busy", isCancelled: true },
        ],
        "@odata.nextLink": "https://graph.microsoft.com/v1.0/me/calendar/calendarView?page2",
      });
    });
    const busy = await new MicrosoftCalendarClient(app, r.fetchImpl).busy(ms, "2026-10-20T00:00:00.000Z", "2026-10-21T00:00:00.000Z");
    expect(busy).toEqual([
      { start: "2026-10-20T09:00:00.000Z", end: "2026-10-20T10:00:00.000Z" },
      { start: "2026-10-20T14:00:00.000Z", end: "2026-10-20T15:00:00.000Z" },
    ]);
    expect(r.calls[0]!.url).toContain("/common/oauth2/v2.0/token");
    expect(String(r.calls[0]!.init.body)).toContain("Calendars.ReadWrite");
    expect(r.calls[1]!.url).toContain("/me/calendar/calendarView?");
    expect(r.calls[1]!.url).toContain("startDateTime=2026-10-20T00%3A00%3A00.000Z");
    expect(header(r.calls[1]!, "prefer")).toBe('outlook.timezone="UTC"');
  });

  it("creates an event in UTC and returns its id", async () => {
    const r = recorder((url) => (url.includes("login.") ? json({ access_token: "at-m" }) : json({ id: "AAMk1" })));
    const out = await new MicrosoftCalendarClient(app, r.fetchImpl).createEvent(ms, { start: "2026-10-20T09:00:00.000Z", end: "2026-10-20T09:30:00.000Z", title: "Appointment: Sam", description: "Phone: +4474" });
    expect(out).toEqual({ eventId: "AAMk1" });
    expect(r.calls[1]!.url).toBe("https://graph.microsoft.com/v1.0/me/calendar/events");
    expect(JSON.parse(String(r.calls[1]!.init.body))).toEqual({
      subject: "Appointment: Sam",
      body: { contentType: "text", content: "Phone: +4474" },
      start: { dateTime: "2026-10-20T09:00:00.000", timeZone: "UTC" },
      end: { dateTime: "2026-10-20T09:30:00.000", timeZone: "UTC" },
    });
  });

  it("fails on an API error instead of returning an empty calendar", async () => {
    const r = recorder((url) => (url.includes("login.") ? json({ access_token: "x" }) : json({ error: { message: "Forbidden" } }, 403)));
    await expect(new MicrosoftCalendarClient(app, r.fetchImpl).busy(ms, "a", "b")).rejects.toThrow(/403 Forbidden/);
  });
});

describe("CalendarScheduler", () => {
  const NOW = Date.parse("2026-10-15T10:00:00Z");
  const tenant = { id: "t1", booking: { timeZone: "Europe/London", days: [1, 2, 3, 4, 5], open: "09:00", close: "12:00", slotMinutes: 30, minNoticeMinutes: 60 }, calendar: { provider: "google", refreshToken: "x" } } as Tenant;
  const range = { start: "2026-10-20", end: "2026-10-20", timeZone: "Europe/London" }; // BST: 09:00 local is 08:00Z

  function setup(opts: { busy?: Array<{ start: string; end: string }>; busyError?: Error; createError?: Error; deleteError?: Error } = {}) {
    const store = new InMemoryBookingStore();
    const local = new LocalScheduler(() => NOW, store);
    const created: unknown[] = [];
    const deleted: string[] = [];
    const client: CalendarClient = {
      busy: async () => {
        if (opts.busyError) throw opts.busyError;
        return opts.busy ?? [];
      },
      createEvent: async (_t, ev) => {
        if (opts.createError) throw opts.createError;
        created.push(ev);
        return { eventId: `ev${created.length}` };
      },
      deleteEvent: async (_t, id) => {
        if (opts.deleteError) throw opts.deleteError;
        deleted.push(id);
      },
    };
    return { store, scheduler: new CalendarScheduler(local, store, client), created, deleted, local };
  }

  it("removes slots that overlap busy time in the client's calendar", async () => {
    // Busy 09:15-10:15 local (08:15Z-09:15Z) overlaps the 09:00, 09:30 and 10:00 slots.
    const { scheduler } = setup({ busy: [{ start: "2026-10-20T08:15:00Z", end: "2026-10-20T09:15:00Z" }] });
    const slots = (await scheduler.availableSlots(tenant, range)).map((s) => s.start);
    // 08:00Z, 08:30Z and 09:00Z overlap the busy block; 09:30Z onwards is free.
    expect(slots).toEqual(["2026-10-20T09:30:00.000Z", "2026-10-20T10:00:00.000Z", "2026-10-20T10:30:00.000Z"]);
  });

  it("a slot that merely touches busy time stays free", async () => {
    const { scheduler } = setup({ busy: [{ start: "2026-10-20T08:00:00Z", end: "2026-10-20T08:30:00Z" }] }); // exactly the 09:00 local slot
    const slots = (await scheduler.availableSlots(tenant, range)).map((s) => s.start);
    expect(slots).not.toContain("2026-10-20T08:00:00.000Z");
    expect(slots).toContain("2026-10-20T08:30:00.000Z");
  });

  it("books: reserves our slot and writes the event with the end time, phone and reason", async () => {
    const { scheduler, created, store } = setup();
    const out = await scheduler.book(tenant, { start: "2026-10-20T08:00:00.000Z", attendee: { name: "Sam Rivera", timeZone: "Europe/London", phoneNumber: "+447400123456" }, reason: "Boiler service" });
    expect(out.bookingUid).toMatch(/^loc_/);
    expect(created).toEqual([{ start: "2026-10-20T08:00:00.000Z", end: "2026-10-20T08:30:00.000Z", title: "Appointment: Sam Rivera", description: "Booked by the phone assistant.\nPhone: +447400123456\nReason: Boiler service" }]);
    expect(await store.taken("t1", "2026-10-20T00:00:00Z", "2026-10-21T00:00:00Z")).toEqual(new Set(["2026-10-20T08:00:00.000Z"]));
  });

  it("refuses a time the client's calendar says is busy, even though our own slots allow it", async () => {
    const { scheduler, created } = setup({ busy: [{ start: "2026-10-20T08:00:00Z", end: "2026-10-20T09:00:00Z" }] });
    await expect(scheduler.book(tenant, { start: "2026-10-20T08:00:00.000Z", attendee: { name: "Sam", timeZone: "Europe/London" } })).rejects.toBeInstanceOf(SlotUnavailableError);
    expect(created).toHaveLength(0);
  });

  it("releases the slot and fails when the calendar write fails, so the caller is never told 'booked'", async () => {
    const { scheduler, store } = setup({ createError: new Error("Google event creation failed: 500") });
    await expect(scheduler.book(tenant, { start: "2026-10-20T08:00:00.000Z", attendee: { name: "Sam", timeZone: "Europe/London" } })).rejects.toThrow(/500/);
    expect((await store.taken("t1", "2026-10-20T00:00:00Z", "2026-10-21T00:00:00Z")).size).toBe(0);
  });

  it("fails availability when the calendar cannot be read, rather than offering slots", async () => {
    const { scheduler } = setup({ busyError: new Error("Google free/busy failed: 503") });
    await expect(scheduler.availableSlots(tenant, range)).rejects.toThrow(/503/);
  });

  it("the check_availability tool then tells the agent to take a message", async () => {
    const { scheduler } = setup({ busyError: new Error("down") });
    const r = await checkAvailability({ scheduler: () => scheduler, facts: new InMemoryCallFactStore() }, tenant, { date: "2026-10-20" });
    expect(r.slots).toEqual([]);
    expect(r.calendarUnavailable).toBe(true);
    expect(r.message).toMatch(/take a message/);
  });
});

describe("schedulerSelector", () => {
  const local = new LocalScheduler();
  const store = new InMemoryBookingStore();
  const client = {} as CalendarClient;
  it("gives calendar tenants a CalendarScheduler and everyone else the local one", () => {
    const plain = { id: "p" } as Tenant;
    const pick = schedulerSelector([google, plain], local, store, { google: client });
    expect(pick(google)).toBeInstanceOf(CalendarScheduler);
    expect(pick(plain)).toBe(local);
  });
  it("refuses to start when a tenant's calendar provider has no OAuth app, instead of silently double-booking", () => {
    expect(() => schedulerSelector([ms], local, store, { google: client })).toThrow(/no microsoft OAuth app/);
  });
});

describe("deleting events", () => {
  const app = { clientId: "cid", clientSecret: "sec" };
  const tokenThen = (status: number) => (url: string) => (url.includes("oauth2") || url.includes("login.") ? json({ access_token: "at" }) : new Response(null, { status }));

  it("Google: DELETE on the event, and an event that is already gone counts as deleted", async () => {
    const r = recorder(tokenThen(204));
    await new GoogleCalendarClient(app, r.fetchImpl).deleteEvent({ ...google, calendar: { provider: "google", refreshToken: "rt-g", calendarId: "team@acme.com" } }, "ev 1");
    expect(r.calls[1]!.init.method).toBe("DELETE");
    expect(r.calls[1]!.url).toBe("https://www.googleapis.com/calendar/v3/calendars/team%40acme.com/events/ev%201");
    await new GoogleCalendarClient(app, recorder(tokenThen(410)).fetchImpl).deleteEvent(google, "gone");
    await new GoogleCalendarClient(app, recorder(tokenThen(404)).fetchImpl).deleteEvent(google, "gone");
  });

  it("Google: any other failure is an error, so the booking is not cancelled behind the calendar's back", async () => {
    await expect(new GoogleCalendarClient(app, recorder(tokenThen(503)).fetchImpl).deleteEvent(google, "e")).rejects.toThrow(/deletion failed: 503/);
  });

  it("Microsoft: DELETE on the event in the right calendar, 404 is fine, 403 is an error", async () => {
    const r = recorder(tokenThen(204));
    await new MicrosoftCalendarClient(app, r.fetchImpl).deleteEvent(ms, "AAMk1");
    expect(r.calls[1]!.init.method).toBe("DELETE");
    expect(r.calls[1]!.url).toBe("https://graph.microsoft.com/v1.0/me/calendar/events/AAMk1");
    await new MicrosoftCalendarClient(app, recorder(tokenThen(404)).fetchImpl).deleteEvent(ms, "gone");
    await expect(new MicrosoftCalendarClient(app, recorder(tokenThen(403)).fetchImpl).deleteEvent(ms, "e")).rejects.toThrow(/deletion failed: 403/);
  });
});
