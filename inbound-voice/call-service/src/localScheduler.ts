import { randomBytes } from "node:crypto";
import { InMemoryBookingStore, type BookingStore } from "./bookingStore.js";
import type { Scheduler, Slot } from "./scheduler.js";
import type { Tenant } from "./types.js";

export class SlotUnavailableError extends Error {}

/** Offset of `tz` from UTC at the instant `utcMs`, in milliseconds. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(utcMs))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year!, +parts.month! - 1, +parts.day!, +parts.hour!, +parts.minute!, +parts.second!);
  return asUtc - utcMs;
}

/** The UTC instant at which the wall clock in `tz` reads `date` `hhmm`. Handles daylight saving changes. */
export function zonedToUtc(date: string, hhmm: string, tz: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = hhmm.split(":").map(Number) as [number, number];
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = guess - tzOffsetMs(guess, tz);
  return guess - tzOffsetMs(first, tz);
}

/** Weekday (0 = Sunday) of a calendar date, independent of any time zone. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days, 12)).toISOString().slice(0, 10);
}

export const DEFAULT_BOOKING = { timeZone: "Europe/London", days: [1, 2, 3, 4, 5], open: "09:00", close: "17:00", slotMinutes: 30, minNoticeMinutes: 60 };

/**
 * Own slot logic: working hours, slot length, minimum notice, and no double booking. This is the fallback named in
 * ARCHITECTURE.md for when the calendar service is unavailable, and it is what runs in tests.
 * Bookings live in a BookingStore: in memory by default, Postgres in production. Syncing to the client's own calendar is separate.
 */
export function bookingConfig(tenant: Tenant) {
  return { ...DEFAULT_BOOKING, ...(tenant.booking ?? {}) };
}

export class LocalScheduler implements Scheduler {
  constructor(
    private readonly now: () => number = Date.now,
    private readonly store: BookingStore = new InMemoryBookingStore(),
  ) {}

  private cfg(tenant: Tenant) {
    return bookingConfig(tenant);
  }

  async availableSlots(tenant: Tenant, range: { start: string; end: string }): Promise<Slot[]> {
    const c = this.cfg(tenant);
    const taken = await this.store.taken(
      tenant.id,
      new Date(zonedToUtc(range.start, "00:00", c.timeZone)).toISOString(),
      new Date(zonedToUtc(addDays(range.end, 1), "00:00", c.timeZone)).toISOString(),
    );
    const earliest = this.now() + c.minNoticeMinutes * 60_000;
    const out: Slot[] = [];
    for (let date = range.start; date <= range.end; date = addDays(date, 1)) {
      if (!c.days.includes(weekdayOf(date))) continue;
      const openMs = zonedToUtc(date, c.open, c.timeZone);
      const closeMs = zonedToUtc(date, c.close, c.timeZone);
      for (let t = openMs; t + c.slotMinutes * 60_000 <= closeMs; t += c.slotMinutes * 60_000) {
        const iso = new Date(t).toISOString();
        if (t >= earliest && !taken.has(iso)) out.push({ start: iso });
      }
    }
    return out;
  }

  async book(
    tenant: Tenant,
    req: { start: string; attendee: { name: string; email?: string; timeZone: string; phoneNumber?: string }; reason?: string },
  ): Promise<{ bookingUid: string }> {
    const start = new Date(req.start);
    if (Number.isNaN(start.getTime())) throw new SlotUnavailableError("Not a valid start time");
    const iso = start.toISOString();
    const c = this.cfg(tenant);
    // The start must be one of the slots we would actually offer, on the tenant's calendar day.
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: c.timeZone }).format(start);
    const offered = await this.availableSlots(tenant, { start: day, end: day });
    if (!offered.some((s) => s.start === iso)) throw new SlotUnavailableError("That time is not available");
    // The store's reserve is the real guard: two callers can both see the slot free, only one insert succeeds.
    const uid = `loc_${randomBytes(6).toString("hex")}`;
    const won = await this.store.reserve(tenant.id, iso, {
      uid,
      name: req.attendee.name,
      ...(req.attendee.phoneNumber ? { phone: req.attendee.phoneNumber } : {}),
      ...(req.attendee.email ? { email: req.attendee.email } : {}),
    });
    if (!won) throw new SlotUnavailableError("That time is no longer available");
    return { bookingUid: uid };
  }
}
