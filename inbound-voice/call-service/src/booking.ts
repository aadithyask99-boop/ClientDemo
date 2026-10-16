import { z } from "zod";
import type { CallFactStore } from "./facts.js";
import { BookingNotFoundError, SlotUnavailableError, addDays, weekdayOf, DEFAULT_BOOKING } from "./localScheduler.js";
import { toE164 } from "./phone.js";
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
  /** The number the caller is ringing from, filled in by the telephony platform (not by the model). Identifies whose appointment it is. */
  caller_number: z.string().optional(),
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

/** The number that identifies the caller: the line they rang from, else a number they gave. Always E.164, or undefined. */
function identity(tenant: Tenant, ...candidates: Array<string | undefined>): string | undefined {
  for (const c of candidates) {
    const e = c ? toE164(c, tenant.defaultRegion as never) : null;
    if (e) return e;
  }
  return undefined;
}

export async function bookAppointment(deps: BookingDeps, tenant: Tenant, input: z.infer<typeof bookInput>): Promise<BookResult> {
  const tz = tenant.booking?.timeZone ?? DEFAULT_BOOKING.timeZone;
  const phone = identity(tenant, input.caller_number, input.phone);
  // A number the caller gave that differs from the line they rang from is kept in the notes, so staff can still ring it.
  const given = input.phone ? identity(tenant, input.phone) : undefined;
  const reason = [input.reason, given && given !== phone ? `Contact number: ${given}` : undefined].filter(Boolean).join(". ") || undefined;
  try {
    const { bookingUid } = await deps.scheduler(tenant).book(tenant, {
      start: input.start,
      attendee: { name: input.name, timeZone: tz, ...(input.email ? { email: input.email } : {}), ...(phone ? { phoneNumber: phone } : {}) },
      ...(reason ? { reason } : {}),
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

// ---- Looking up, cancelling and moving an existing appointment ----------------------------------------------------

const runId = z.union([z.string(), z.number()]).transform(String).optional();

/** `caller_number` is set by the telephony platform from the call, never by the model, so a caller can only reach their own appointments. */
export const findInput = z.object({ caller_number: z.string().optional(), workflow_run_id: runId });
export const cancelInput = z.object({ appointment_id: z.string().optional(), caller_number: z.string().optional(), workflow_run_id: runId });
export const rescheduleInput = z.object({ appointment_id: z.string().optional(), new_start: z.string().min(10), caller_number: z.string().optional(), workflow_run_id: runId });

export type ManageResult = { ok: true; body: Record<string, unknown> } | { ok: false; status: 404 | 409 | 422 | 502; body: Record<string, unknown> };

const noCaller: ManageResult = {
  ok: false,
  status: 422,
  body: { error: "caller_unknown", message: "The caller's number is not available, so their appointments cannot be found safely. Take a message so the team can sort it out." },
};
const notFound: ManageResult = { ok: false, status: 404, body: { error: "not_found", message: "There is no upcoming appointment for this caller. Check what they said, or take a message." } };
const down: ManageResult = { ok: false, status: 502, body: { error: "scheduler_error", message: "The calendar could not be reached, so nothing was changed. Take a message instead." } };

async function listFor(deps: BookingDeps, tenant: Tenant, phone: string) {
  const tz = tenant.booking?.timeZone ?? DEFAULT_BOOKING.timeZone;
  return (await deps.scheduler(tenant).findBookings(tenant, phone)).map((b) => ({ appointment_id: b.uid, start: b.start, label: labelFor(b.start, tz), name: b.name, ...(b.reason ? { reason: b.reason } : {}) }));
}

export async function findAppointments(deps: BookingDeps, tenant: Tenant, input: z.infer<typeof findInput>): Promise<ManageResult> {
  const phone = identity(tenant, input.caller_number);
  if (!phone) return noCaller;
  try {
    const appointments = await listFor(deps, tenant, phone);
    return { ok: true, body: { appointments, ...(appointments.length ? {} : { message: "This caller has no upcoming appointments." }) } };
  } catch {
    return down;
  }
}

/** The appointment the caller means: the one they named, or their only one. Never guesses between several. */
async function pick(deps: BookingDeps, tenant: Tenant, phone: string, id: string | undefined): Promise<{ id: string } | ManageResult> {
  if (id) return { id };
  const all = await listFor(deps, tenant, phone);
  if (all.length === 0) return notFound;
  if (all.length > 1) return { ok: false, status: 409, body: { error: "which_one", message: "The caller has more than one appointment. Ask which one, then use its appointment_id.", appointments: all } };
  return { id: all[0]!.appointment_id };
}

export async function cancelAppointment(deps: BookingDeps, tenant: Tenant, input: z.infer<typeof cancelInput>): Promise<ManageResult> {
  const phone = identity(tenant, input.caller_number);
  if (!phone) return noCaller;
  const tz = tenant.booking?.timeZone ?? DEFAULT_BOOKING.timeZone;
  try {
    const chosen = await pick(deps, tenant, phone, input.appointment_id);
    if (!("id" in chosen)) return chosen;
    const gone = await deps.scheduler(tenant).cancel(tenant, { uid: chosen.id, phone });
    const label = labelFor(gone.start, tz);
    if (input.workflow_run_id) await deps.facts.record(tenant.id, `dograh:${input.workflow_run_id}`, { cancelled: { uid: gone.uid, label, name: gone.name } });
    return { ok: true, body: { cancelled: true, label, message: `The appointment on ${label} is cancelled.` } };
  } catch (err) {
    return err instanceof BookingNotFoundError ? notFound : down;
  }
}

export async function rescheduleAppointment(deps: BookingDeps, tenant: Tenant, input: z.infer<typeof rescheduleInput>): Promise<ManageResult> {
  const phone = identity(tenant, input.caller_number);
  if (!phone) return noCaller;
  const tz = tenant.booking?.timeZone ?? DEFAULT_BOOKING.timeZone;
  try {
    const chosen = await pick(deps, tenant, phone, input.appointment_id);
    if (!("id" in chosen)) return chosen;
    const before = (await listFor(deps, tenant, phone)).find((a) => a.appointment_id === chosen.id);
    const moved = await deps.scheduler(tenant).reschedule(tenant, { uid: chosen.id, phone, newStart: input.new_start });
    const label = labelFor(moved.start, tz);
    if (input.workflow_run_id && before) {
      await deps.facts.record(tenant.id, `dograh:${input.workflow_run_id}`, {
        booking: { uid: moved.bookingUid, start: moved.start, label, name: before.name },
        rescheduled: { from: before.label, to: label, name: before.name },
      });
    }
    return { ok: true, body: { rescheduled: true, start: moved.start, label, message: `The appointment is now on ${label}.` } };
  } catch (err) {
    if (err instanceof BookingNotFoundError) return notFound;
    if (err instanceof SlotUnavailableError) {
      return { ok: false, status: 409, body: { error: "slot_unavailable", message: "That time is not available, and the original appointment is unchanged. Offer another time after checking availability." } };
    }
    return down;
  }
}
