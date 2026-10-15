import type { BookingStore } from "./bookingStore.js";
import type { CalendarClient } from "./calendar.js";
import { LocalScheduler, SlotUnavailableError, addDays, bookingConfig, zonedToUtc } from "./localScheduler.js";
import type { Scheduler, Slot } from "./scheduler.js";
import type { Tenant } from "./types.js";

/**
 * Our slot rules (hours, notice, no double booking) checked against the client's own calendar.
 *  - Offered slots are LocalScheduler's slots minus anything that overlaps something busy in their calendar.
 *  - A booking is reserved in our database first (the atomic guard against two callers), then written to their calendar.
 *    If the calendar write fails the reservation is released and the error propagates, so a caller is never told
 *    "booked" for something the client cannot see.
 *  - If the calendar cannot be read, availability fails rather than offering slots that might be taken.
 */
export class CalendarScheduler implements Scheduler {
  constructor(
    private readonly local: LocalScheduler,
    private readonly store: BookingStore,
    private readonly calendar: CalendarClient,
  ) {}

  async availableSlots(tenant: Tenant, range: { start: string; end: string; timeZone: string }): Promise<Slot[]> {
    const c = bookingConfig(tenant);
    const slots = await this.local.availableSlots(tenant, range);
    if (slots.length === 0) return slots;
    const busy = await this.calendar.busy(
      tenant,
      new Date(zonedToUtc(range.start, "00:00", c.timeZone)).toISOString(),
      new Date(zonedToUtc(addDays(range.end, 1), "00:00", c.timeZone)).toISOString(),
    );
    const lengthMs = c.slotMinutes * 60_000;
    return slots.filter((s) => {
      const start = Date.parse(s.start);
      return !busy.some((b) => start < Date.parse(b.end) && Date.parse(b.start) < start + lengthMs);
    });
  }

  async book(
    tenant: Tenant,
    req: { start: string; attendee: { name: string; email?: string; timeZone: string; phoneNumber?: string }; reason?: string },
  ): Promise<{ bookingUid: string }> {
    const c = bookingConfig(tenant);
    const start = new Date(req.start);
    if (Number.isNaN(start.getTime())) throw new SlotUnavailableError("Not a valid start time");
    const iso = start.toISOString();
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: c.timeZone }).format(start);
    // Must be offered now, including what is busy in their calendar.
    const offered = await this.availableSlots(tenant, { start: day, end: day, timeZone: c.timeZone });
    if (!offered.some((s) => s.start === iso)) throw new SlotUnavailableError("That time is not available");

    const booked = await this.local.book(tenant, req); // atomic reservation in our database
    try {
      const description = [`Booked by the phone assistant.`, req.attendee.phoneNumber && `Phone: ${req.attendee.phoneNumber}`, req.attendee.email && `Email: ${req.attendee.email}`, req.reason && `Reason: ${req.reason}`]
        .filter(Boolean)
        .join("\n");
      await this.calendar.createEvent(tenant, {
        start: iso,
        end: new Date(start.getTime() + c.slotMinutes * 60_000).toISOString(),
        title: `Appointment: ${req.attendee.name}`,
        description,
      });
    } catch (err) {
      await this.store.release(tenant.id, iso).catch(() => {});
      throw err;
    }
    return booked;
  }
}

/**
 * Picks the scheduler for each tenant: the client's calendar when they have connected one, otherwise our own slots.
 * Fails at start-up (not on a live call) if a tenant has a calendar but the platform has no OAuth app for its provider:
 * quietly falling back would double-book against appointments the client already has.
 */
export function schedulerSelector(
  tenants: Tenant[],
  local: LocalScheduler,
  store: BookingStore,
  clients: Partial<Record<"google" | "microsoft", CalendarClient>>,
): (tenant: Tenant) => Scheduler {
  const bound = new Map<string, Scheduler>();
  for (const t of tenants) {
    if (!t.calendar) continue;
    const client = clients[t.calendar.provider];
    if (!client) throw new Error(`Tenant ${t.id} uses a ${t.calendar.provider} calendar but no ${t.calendar.provider} OAuth app is configured`);
    bound.set(t.id, new CalendarScheduler(local, store, client));
  }
  return (tenant) => bound.get(tenant.id) ?? local;
}
