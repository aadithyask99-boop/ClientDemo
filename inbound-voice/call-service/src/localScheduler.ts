import { randomBytes } from "node:crypto";
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
 * Scaffold: bookings are held in memory. Persist them (and sync to the client's calendar) before real use.
 */
export class LocalScheduler implements Scheduler {
  private readonly booked = new Map<string, Set<string>>();

  constructor(private readonly now: () => number = Date.now) {}

  private cfg(tenant: Tenant) {
    return { ...DEFAULT_BOOKING, ...(tenant.booking ?? {}) };
  }

  async availableSlots(tenant: Tenant, range: { start: string; end: string }): Promise<Slot[]> {
    const c = this.cfg(tenant);
    const taken = this.booked.get(tenant.id) ?? new Set<string>();
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
    req: { start: string; attendee: { name: string; email?: string; timeZone: string; phoneNumber?: string } },
  ): Promise<{ bookingUid: string }> {
    const start = new Date(req.start);
    if (Number.isNaN(start.getTime())) throw new SlotUnavailableError("Not a valid start time");
    const iso = start.toISOString();
    const c = this.cfg(tenant);
    // The start must be one of the slots we would actually offer, on the tenant's calendar day.
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: c.timeZone }).format(start);
    const offered = await this.availableSlots(tenant, { start: day, end: day });
    if (!offered.some((s) => s.start === iso)) throw new SlotUnavailableError("That time is not available");
    const set = this.booked.get(tenant.id) ?? new Set<string>();
    set.add(iso);
    this.booked.set(tenant.id, set);
    return { bookingUid: `loc_${randomBytes(6).toString("hex")}` };
  }
}
