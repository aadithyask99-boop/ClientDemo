import { parsePhoneNumberFromString } from "libphonenumber-js";
import { addDays, bookingConfig, weekdayOf, zonedToUtc } from "./localScheduler.js";
import type { CallRecord, FollowUp, Tenant } from "./types.js";

/**
 * The next moment the client's team is at work: now if they are open, otherwise the next opening. Uses the same hours,
 * working days and days off as booking. Looks two weeks ahead, then gives up and returns `fromMs` (a task is still created).
 */
export function nextOpening(tenant: Tenant, fromMs: number): number {
  const c = bookingConfig(tenant);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: c.timeZone }).format(new Date(fromMs));
  for (let i = 0; i < 15; i++) {
    const date = addDays(today, i);
    if (!c.days.includes(weekdayOf(date)) || c.daysOff.includes(date)) continue;
    const open = zonedToUtc(date, c.open, c.timeZone);
    const close = zonedToUtc(date, c.close, c.timeZone);
    if (fromMs < open) return open;
    if (fromMs < close) return fromMs;
  }
  return fromMs;
}

const HOUR = 3_600_000;

/**
 * Decides what a person at the client should do after a call, from the finished record. Pure and deterministic.
 * Call it LAST, after every override (booking facts, transcript opt-out), because an opt-out must never leave a task behind.
 *  - Caller asked not to be contacted again: nothing, even if they also left a message.
 *  - Callback requested or transfer failed: ring them back (a message they also left goes in the task body).
 *  - Message left: return the message (urgent ones are due as soon as the team is open).
 *  - Anything else (booked, information given, cancelled, moved): nothing to do.
 */
export function planFollowUp(tenant: Tenant, record: CallRecord, nowMs: number): FollowUp | undefined {
  if (record.outcome === "OPTED_OUT") return undefined;
  const who = record.callerName ?? record.callerNumber;
  const reach = record.message?.callbackNumber ?? record.callerNumber;
  const due = (afterMs: number) => new Date(nextOpening(tenant, nowMs + afterMs)).toISOString();

  const note = record.message ? `Message: ${record.message.body}` : undefined;
  if (record.message && record.outcome !== "CALLBACK_REQUESTED" && record.outcome !== "TRANSFER_FAILED") {
    const urgent = record.message.urgent;
    const booked = record.outcome === "BOOKED";
    return {
      kind: "message",
      title: booked ? `Read note from ${who} (appointment booked)` : `${urgent ? "URGENT: " : ""}Return message from ${who}`,
      body: [`Message: ${record.message.body}`, `Number: ${reach}`, record.summary && `Call summary: ${record.summary}`].filter(Boolean).join("\n"),
      dueAt: due(urgent ? 0 : 2 * HOUR),
      urgent,
    };
  }
  if (record.outcome === "CALLBACK_REQUESTED") {
    return {
      kind: "callback",
      title: `Call back ${who}`,
      body: [`The caller asked for a call back. Agreed time, in their words, is in the summary.`, note, `Number: ${reach}`, record.summary && `Call summary: ${record.summary}`].filter(Boolean).join("\n"),
      dueAt: due(HOUR),
      urgent: false,
    };
  }
  if (record.outcome === "TRANSFER_FAILED") {
    return {
      kind: "callback",
      title: `URGENT: call back ${who} (transfer failed)`,
      body: [`The caller asked for a person and nobody picked up.`, note, `Number: ${reach}`, record.summary && `Call summary: ${record.summary}`].filter(Boolean).join("\n"),
      dueAt: due(0),
      urgent: true,
    };
  }
  return undefined;
}

/** Splits an E.164 number the way the CRM stores it (country, calling code, national digits). Undefined if it cannot be parsed. */
export function splitPhone(e164: string): { country?: string; callingCode: string; nationalNumber: string } | undefined {
  const p = parsePhoneNumberFromString(e164);
  if (!p) return undefined;
  return { ...(p.country ? { country: p.country } : {}), callingCode: `+${p.countryCallingCode}`, nationalNumber: p.nationalNumber };
}
