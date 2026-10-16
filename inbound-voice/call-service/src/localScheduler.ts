import { randomBytes } from "node:crypto";
import { InMemoryBookingStore, type BookingEntry, type BookingStore, type StoredBooking } from "./bookingStore.js";
import type { BookingInfo, Scheduler, Slot } from "./scheduler.js";
import type { Tenant } from "./types.js";

export class SlotUnavailableError extends Error {}
/** No such appointment for this caller. Deliberately the same for "does not exist" and "belongs to someone else". */
export class BookingNotFoundError extends Error {}

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

export const DEFAULT_BOOKING = {
  timeZone: "Europe/London",
  days: [1, 2, 3, 4, 5],
  open: "09:00",
  close: "17:00",
  slotMinutes: 30,
  minNoticeMinutes: 60,
  maxAdvanceDays: 90,
  daysOff: [] as string[],
  breaks: [] as Array<{ start: string; end: string }>,
};

/**
 * Own slot logic: working hours, days off, breaks, slot length, minimum notice and booking horizon, and no double booking.
 * This is the fallback named in ARCHITECTURE.md for when the calendar service is unavailable, and it is what runs in tests.
 * Bookings live in a BookingStore: in memory by default, Postgres in production. Syncing to the client's own calendar is separate.
 */
export function bookingConfig(tenant: Tenant) {
  return { ...DEFAULT_BOOKING, ...(tenant.booking ?? {}) };
}

const toInfo = (b: StoredBooking): BookingInfo => ({ uid: b.uid, start: b.start, name: b.name, ...(b.reason ? { reason: b.reason } : {}) });

export class LocalScheduler implements Scheduler {
  constructor(
    protected readonly now: () => number = Date.now,
    private readonly store: BookingStore = new InMemoryBookingStore(),
  ) {}

  private cfg(tenant: Tenant) {
    return bookingConfig(tenant);
  }

  async availableSlots(tenant: Tenant, range: { start: string; end: string }): Promise<Slot[]> {
    const c = this.cfg(tenant);
    const slotMs = c.slotMinutes * 60_000;
    // Look a slot length either side, so an existing booking blocks any slot it overlaps (not only one starting at the same minute).
    const taken = [
      ...(await this.store.taken(
        tenant.id,
        new Date(zonedToUtc(range.start, "00:00", c.timeZone) - slotMs).toISOString(),
        new Date(zonedToUtc(addDays(range.end, 1), "00:00", c.timeZone) + slotMs).toISOString(),
      )),
    ].map((s) => Date.parse(s));
    const earliest = this.now() + c.minNoticeMinutes * 60_000;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: c.timeZone }).format(new Date(this.now()));
    const lastDate = addDays(today, c.maxAdvanceDays);
    const out: Slot[] = [];
    for (let date = range.start; date <= range.end; date = addDays(date, 1)) {
      if (date > lastDate || !c.days.includes(weekdayOf(date)) || c.daysOff.includes(date)) continue;
      const openMs = zonedToUtc(date, c.open, c.timeZone);
      const closeMs = zonedToUtc(date, c.close, c.timeZone);
      const breaks = c.breaks.map((b) => [zonedToUtc(date, b.start, c.timeZone), zonedToUtc(date, b.end, c.timeZone)] as const);
      for (let t = openMs; t + slotMs <= closeMs; t += slotMs) {
        if (t < earliest) continue;
        if (breaks.some(([from, to]) => t < to && from < t + slotMs)) continue;
        if (taken.some((s) => t < s + slotMs && s < t + slotMs)) continue;
        out.push({ start: new Date(t).toISOString() });
      }
    }
    return out;
  }

  /** Checks that `iso` is a slot we would offer right now, then reserves it atomically. Throws SlotUnavailableError otherwise. */
  protected async reserveSlot(tenant: Tenant, iso: string, entry: Omit<BookingEntry, "uid">): Promise<string> {
    const c = this.cfg(tenant);
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: c.timeZone }).format(new Date(iso));
    const offered = await this.availableSlots(tenant, { start: day, end: day });
    if (!offered.some((s) => s.start === iso)) throw new SlotUnavailableError("That time is not available");
    // The store's reserve is the real guard: two callers can both see the slot free, only one insert succeeds.
    const uid = `loc_${randomBytes(6).toString("hex")}`;
    if (!(await this.store.reserve(tenant.id, iso, { uid, ...entry }))) throw new SlotUnavailableError("That time is no longer available");
    return uid;
  }

  async book(
    tenant: Tenant,
    req: { start: string; attendee: { name: string; email?: string; timeZone: string; phoneNumber?: string }; reason?: string },
  ): Promise<{ bookingUid: string }> {
    const start = new Date(req.start);
    if (Number.isNaN(start.getTime())) throw new SlotUnavailableError("Not a valid start time");
    const bookingUid = await this.reserveSlot(tenant, start.toISOString(), {
      name: req.attendee.name,
      ...(req.attendee.phoneNumber ? { phone: req.attendee.phoneNumber } : {}),
      ...(req.attendee.email ? { email: req.attendee.email } : {}),
      ...(req.reason ? { reason: req.reason } : {}),
    });
    return { bookingUid };
  }

  /** The caller's own upcoming booking, or BookingNotFoundError. Matching is on the phone number the booking was made from. */
  async ownedBooking(tenant: Tenant, uid: string, phone: string): Promise<StoredBooking> {
    const b = await this.store.get(tenant.id, uid);
    if (!b || !phone || b.phone !== phone || Date.parse(b.start) <= this.now()) throw new BookingNotFoundError("No such appointment");
    return b;
  }

  async findBookings(tenant: Tenant, phone: string): Promise<BookingInfo[]> {
    if (!phone) return [];
    return (await this.store.upcomingForPhone(tenant.id, phone, new Date(this.now()).toISOString())).map(toInfo);
  }

  async cancel(tenant: Tenant, req: { uid: string; phone: string }): Promise<BookingInfo> {
    const b = await this.ownedBooking(tenant, req.uid, req.phone);
    const removed = await this.store.cancel(tenant.id, b.uid);
    if (!removed) throw new BookingNotFoundError("No such appointment"); // cancelled by someone else a moment ago
    return toInfo(removed);
  }

  async reschedule(tenant: Tenant, req: { uid: string; phone: string; newStart: string }): Promise<{ bookingUid: string; start: string }> {
    const old = await this.ownedBooking(tenant, req.uid, req.phone);
    const start = new Date(req.newStart);
    if (Number.isNaN(start.getTime())) throw new SlotUnavailableError("Not a valid start time");
    const iso = start.toISOString();
    if (iso === old.start) throw new SlotUnavailableError("The appointment is already at that time");
    // New time first: if it is taken, the caller keeps the appointment they have.
    const bookingUid = await this.reserveSlot(tenant, iso, {
      name: old.name,
      ...(old.phone ? { phone: old.phone } : {}),
      ...(old.email ? { email: old.email } : {}),
      ...(old.reason ? { reason: old.reason } : {}),
    });
    if (!(await this.store.cancel(tenant.id, old.uid))) {
      await this.store.cancel(tenant.id, bookingUid); // the old one vanished meanwhile: do not leave two
      throw new BookingNotFoundError("No such appointment");
    }
    return { bookingUid, start: iso };
  }
}
