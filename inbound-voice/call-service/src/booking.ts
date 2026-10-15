import { z } from "zod";
import type { CallFactStore } from "./facts.js";
import { SlotUnavailableError, addDays, weekdayOf, DEFAULT_BOOKING } from "./localScheduler.js";
import type { Scheduler } from "./scheduler.js";
import type { Tenant } from "./types.js";

/**
 * Input of the `check_availability` tool. The caller's words go in `day` ("tomorrow", "next tuesday") and the service
 * works out the date from the real clock: a language model that does its own date arithmetic gets weekdays wrong.
 * `date` (YYYY-MM-DD) is for when the caller named an exact date.
 */
export const availabilityInput = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD").optional(),
    day: z.string().min(2).optional(),
    part_of_day: z.enum(["morning", "afternoon", "any"]).optional(),
  })
  .refine((v) => v.date || v.day, { message: "give either day (for example 'next tuesday') or date (YYYY-MM-DD)" });

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * Turns "today", "tomorrow", "tuesday", "next tuesday" or "this friday" into a calendar date in the tenant's time zone,
 * or null if it cannot. "next X" and a bare weekday both mean the coming one; only "this X"/"today" can mean today.
 */
export function resolveDay(text: string, nowMs: number, timeZone: string): string | null {
  const t = text.toLowerCase().trim();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(nowMs));
  if (/\btoday\b/.test(t)) return today;
  if (/\bday after tomorrow\b/.test(t)) return addDays(today, 2);
  if (/\btomorrow\b/.test(t)) return addDays(today, 1);
  const target = WEEKDAYS.findIndex((d) => t.includes(d) || t.includes(d.slice(0, 3) + " ") || t === d.slice(0, 3));
  if (target < 0) return null;
  const current = weekdayOf(today);
  let ahead = (target - current + 7) % 7;
  if (ahead === 0 && !/\bthis\b/.test(t)) ahead = 7;
  return addDays(today, ahead);
}

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
  calendarUnavailable?: boolean;
  nextAvailable?: Array<{ start: string; label: string }>;
}

/** The client's calendar could not be read. Offering slots anyway could double-book them, so offer none. */
function calendarDown(date: string, timeZone: string): AvailabilityResult {
  return { date, timeZone, slots: [], calendarUnavailable: true, message: "The calendar cannot be reached right now, so no times can be offered. Offer to take a message and say the team will call back to arrange a time." };
}

export async function checkAvailability(
  deps: BookingDeps,
  tenant: Tenant,
  rawInput: z.infer<typeof availabilityInput>,
  now: () => number = Date.now,
): Promise<AvailabilityResult> {
  const tz = tenant.booking?.timeZone ?? DEFAULT_BOOKING.timeZone;
  // A named day wins over a date: the model is good at hearing "tuesday" and bad at calendars.
  const resolved = rawInput.day ? resolveDay(rawInput.day, now(), tz) : null;
  const date = resolved ?? rawInput.date;
  if (!date) {
    return { date: "", timeZone: tz, slots: [], message: "I could not tell which day that is. Ask the caller for a day of the week or a date." };
  }
  const input = { ...rawInput, date };
  const scheduler = deps.scheduler(tenant);
  const part = input.part_of_day ?? "any";
  const keep = (iso: string) => part === "any" || (part === "morning" ? localHour(iso, tz) < 12 : localHour(iso, tz) >= 12);

  const shape = (s: { start: string }) => ({ start: s.start, label: labelFor(s.start, tz) });
  try {
    const onDay = (await scheduler.availableSlots(tenant, { start: input.date, end: input.date, timeZone: tz })).filter((s) => keep(s.start));
    if (onDay.length > 0) return { date: input.date, timeZone: tz, slots: onDay.slice(0, 6).map(shape) };
  } catch {
    return calendarDown(input.date, tz);
  }

  // Nothing that day: look ahead a week so the agent can offer alternatives in the same turn.
  let ahead: Array<{ start: string }>;
  try {
    ahead = (await scheduler.availableSlots(tenant, { start: addDays(input.date, 1), end: addDays(input.date, 7), timeZone: tz })).filter((s) => keep(s.start));
  } catch {
    return calendarDown(input.date, tz);
  }
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
      ...(input.reason ? { reason: input.reason } : {}),
    });
    const iso = new Date(input.start).toISOString();
    const label = labelFor(iso, tz);
    if (input.workflow_run_id) await deps.facts.record(tenant.id, `dograh:${input.workflow_run_id}`, { booking: { uid: bookingUid, start: iso, label, name: input.name } });
    return { ok: true, body: { booked: true, start: iso, label, confirmation: bookingUid } };
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return { ok: false, status: 409, body: { booked: false, error: "slot_unavailable", message: "That time is no longer available. Ask for another time and check availability again." } };
    }
    // Calendar service problems must not be reported to the caller as a booking.
    return { ok: false, status: 502, body: { booked: false, error: "scheduler_error", message: "The calendar could not be reached. Take a message instead." } };
  }
}
