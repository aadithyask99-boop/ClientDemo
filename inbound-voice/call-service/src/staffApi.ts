import { z } from "zod";
import { bookAppointment, bookInput, labelFor, type BookingDeps } from "./booking.js";
import { BookingNotFoundError, DEFAULT_BOOKING, SlotUnavailableError, STAFF, toLocalIso } from "./localScheduler.js";
import type { Tenant } from "./types.js";

/**
 * What the staff screens do to bookings. They use the same schedulers and slot rules as the phone agent
 * (hours, breaks, days off, no double booking, the client's own calendar), so a booking made by hand can never clash with one made on a call.
 */
export type StaffResult = { ok: true; body: Record<string, unknown> } | { ok: false; status: 400 | 404 | 409 | 502; body: Record<string, unknown> };

const tzOf = (tenant: Tenant) => tenant.booking?.timeZone ?? DEFAULT_BOOKING.timeZone;

export const staffBookInput = z.object({
  start: z.string().min(10),
  name: z.string().min(1).max(200),
  phone: z.string().max(50).optional(),
  email: z.string().max(200).optional(),
  reason: z.string().max(1000).optional(),
});

export const staffMoveInput = z.object({ start: z.string().min(10) });

export async function staffBook(deps: BookingDeps, tenant: Tenant, input: z.infer<typeof staffBookInput>): Promise<StaffResult> {
  const r = await bookAppointment(deps, tenant, bookInput.parse(input));
  return r.ok ? { ok: true, body: { ...r.body } } : { ok: false, status: r.status, body: { ...r.body } };
}

export async function staffCancel(deps: BookingDeps, tenant: Tenant, uid: string): Promise<StaffResult> {
  try {
    const gone = await deps.scheduler(tenant).cancel(tenant, { uid, phone: STAFF });
    return { ok: true, body: { cancelled: true, label: labelFor(gone.start, tzOf(tenant)), name: gone.name } };
  } catch (err) {
    if (err instanceof BookingNotFoundError) return { ok: false, status: 404, body: { error: "not_found", message: "That booking no longer exists, or it has already started." } };
    return { ok: false, status: 502, body: { error: "scheduler_error", message: "The calendar could not be reached, so nothing was changed." } };
  }
}

export async function staffMove(deps: BookingDeps, tenant: Tenant, uid: string, start: string): Promise<StaffResult> {
  try {
    const moved = await deps.scheduler(tenant).reschedule(tenant, { uid, phone: STAFF, newStart: start });
    const tz = tzOf(tenant);
    return { ok: true, body: { rescheduled: true, uid: moved.bookingUid, start: toLocalIso(Date.parse(moved.start), tz), label: labelFor(moved.start, tz) } };
  } catch (err) {
    if (err instanceof BookingNotFoundError) return { ok: false, status: 404, body: { error: "not_found", message: "That booking no longer exists, or it has already started." } };
    if (err instanceof SlotUnavailableError) return { ok: false, status: 409, body: { error: "slot_unavailable", message: "That time is not available. The booking is unchanged." } };
    return { ok: false, status: 502, body: { error: "scheduler_error", message: "The calendar could not be reached, so nothing was changed." } };
  }
}

export async function staffSlots(deps: BookingDeps, tenant: Tenant, day: string): Promise<StaffResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { ok: false, status: 400, body: { error: "bad_day", message: "day must look like 2026-10-20" } };
  const tz = tzOf(tenant);
  try {
    const slots = await deps.scheduler(tenant).availableSlots(tenant, { start: day, end: day, timeZone: tz });
    return { ok: true, body: { day, timeZone: tz, slots: slots.map((s) => ({ start: toLocalIso(Date.parse(s.start), tz), label: labelFor(s.start, tz) })) } };
  } catch {
    return { ok: false, status: 502, body: { error: "scheduler_error", message: "The calendar could not be reached." } };
  }
}
