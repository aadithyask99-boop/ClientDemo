import { z } from "zod";
import type { CallFactStore } from "./facts.js";
import { SlotUnavailableError, addDays, DEFAULT_BOOKING } from "./localScheduler.js";
import type { Scheduler } from "./scheduler.js";
import type { Tenant } from "./types.js";

/** Input of the `check_availability` tool. The agent turns "next Tuesday" into a date using the current date in its prompt. */
export const availabilityInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  part_of_day: z.enum(["morning", "afternoon", "any"]).optional(),
});

/** Input of the `book_appointment` tool. `start` must be copied exactly from a slot returned by check_availability. */
export const bookInput = z.object({
  start: z.string().min(10),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  reason: z.string().optional(),
  workflow_run_id: z.union([z.string(), z.number()]).transform(String).optional(),
});

function labelFor(startIso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(startIso),
  );
}

function localHour(startIso: string, timeZone: string): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(new Date(startIso)));
}

export interface BookingDeps {
  scheduler: (tenant: Tenant) => Scheduler;
  facts: CallFactStore;
}

export interface AvailabilityResult {
  date: string;
  timeZone: string;
  slots: Array<{ start: string; label: string }>;
  message?: string;
  nextAvailable?: Array<{ start: string; label: string }>;
}

export async function checkAvailability(deps: BookingDeps, tenant: Tenant, input: z.infer<typeof availabilityInput>): Promise<AvailabilityResult> {
  const tz = tenant.booking?.timeZone ?? DEFAULT_BOOKING.timeZone;
  const scheduler = deps.scheduler(tenant);
  const part = input.part_of_day ?? "any";
  const keep = (iso: string) => part === "any" || (part === "morning" ? localHour(iso, tz) < 12 : localHour(iso, tz) >= 12);

  const onDay = (await scheduler.availableSlots(tenant, { start: input.date, end: input.date, timeZone: tz })).filter((s) => keep(s.start));
  const shape = (s: { start: string }) => ({ start: s.start, label: labelFor(s.start, tz) });
  if (onDay.length > 0) return { date: input.date, timeZone: tz, slots: onDay.slice(0, 6).map(shape) };

  // Nothing that day: look ahead a week so the agent can offer alternatives in the same turn.
  const ahead = (await scheduler.availableSlots(tenant, { start: addDays(input.date, 1), end: addDays(input.date, 7), timeZone: tz })).filter((s) => keep(s.start));
  return {
    date: input.date,
    timeZone: tz,
    slots: [],
    message: "No availability on that date.",
    nextAvailable: ahead.slice(0, 4).map(shape),
  };
}

export type BookResult =
  | { ok: true; body: { booked: true; start: string; label: string; confirmation: string } }
  | { ok: false; status: 409 | 502; body: { booked: false; error: string; message: string } };

export async function bookAppointment(deps: BookingDeps, tenant: Tenant, input: z.infer<typeof bookInput>): Promise<BookResult> {
  const tz = tenant.booking?.timeZone ?? DEFAULT_BOOKING.timeZone;
  try {
    const { bookingUid } = await deps.scheduler(tenant).book(tenant, {
      start: input.start,
      attendee: { name: input.name, timeZone: tz, ...(input.email ? { email: input.email } : {}), ...(input.phone ? { phoneNumber: input.phone } : {}) },
    });
    const iso = new Date(input.start).toISOString();
    const label = labelFor(iso, tz);
    if (input.workflow_run_id) deps.facts.record(tenant.id, `dograh:${input.workflow_run_id}`, { booking: { uid: bookingUid, start: iso, label, name: input.name } });
    return { ok: true, body: { booked: true, start: iso, label, confirmation: bookingUid } };
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return { ok: false, status: 409, body: { booked: false, error: "slot_unavailable", message: "That time is no longer available. Ask for another time and check availability again." } };
    }
    // Calendar service problems must not be reported to the caller as a booking.
    return { ok: false, status: 502, body: { booked: false, error: "scheduler_error", message: "The calendar could not be reached. Take a message instead." } };
  }
}
