import { z } from "zod";
import { OUTCOMES, type CallRecord, type Outcome, type Tenant } from "./types.js";
import { toE164 } from "./phone.js";

/**
 * The JSON our Dograh webhook node sends. We control the node's payload_template, so this is our own contract;
 * Dograh renders every value as a string. Template (also in SPIKES.md):
 *   { "run_id": "{{workflow_run_id}}", "called_at": "{{call_time}}", "caller": "{{initial_context.caller_number}}",
 *     "duration": "{{cost_info.call_duration_seconds}}", "disposition": "{{gathered_context.call_disposition}}",
 *     "summary": "{{gathered_context.summary}}", "recording_url": "{{recording_url}}", "transcript_url": "{{transcript_url}}" }
 * Verified (text chat): a text-chat run fires the webhook. The caller comes from initial_context.caller_number, which Dograh telephony sets for inbound calls (per its docs); with a simulated initial_context it was checked in e2e-outcomes.mjs.
 */
export const dograhPayload = z
  .object({
    run_id: z.union([z.string(), z.number()]).transform(String),
    called_at: z.string().optional(),
    caller: z.string().optional(),
    duration: z.union([z.string(), z.number()]).optional(),
    disposition: z.string().optional(),
    summary: z.string().optional(),
    recording_url: z.string().optional(),
    transcript_url: z.string().optional(),
    message_body: z.string().optional(),
    callback_number: z.string().optional(),
    urgent: z.union([z.string(), z.boolean()]).optional(),
  })
  .passthrough();
export type DograhPayload = z.infer<typeof dograhPayload>;

/** Dograh dispositions we have no direct code for. Unknown codes fall back to NO_OUTCOME rather than failing the call write. */
const ALIASES: Record<string, Outcome> = {
  APPOINTMENT_BOOKED: "BOOKED",
  QUALIFIED: "BOOKED",
  DO_NOT_CALL: "OPTED_OUT",
  VOICEMAIL_DETECTED: "NO_OUTCOME",
  USER_HANGUP: "NO_OUTCOME",
  WRONG_NUMBER: "NO_OUTCOME",
  NOT_INTERESTED: "INFO_GIVEN",
};

export function mapDisposition(raw: string | undefined): Outcome {
  const key = (raw ?? "").trim().replace(/[\s-]+/g, "_").toUpperCase();
  if ((OUTCOMES as readonly string[]).includes(key)) return key as Outcome;
  return ALIASES[key] ?? "NO_OUTCOME";
}

/** Dograh leaves unresolved variables as empty strings; treat those and raw `{{...}}` leftovers as missing. */
const present = (v: string | undefined): string | undefined =>
  v && v.trim() !== "" && !/^\{\{.*\}\}$/.test(v.trim()) ? v.trim() : undefined;

export function toCallRecord(tenant: Tenant, p: DograhPayload): CallRecord {
  const durationSeconds = Math.max(0, Math.round(Number(p.duration ?? 0)) || 0);
  const startedAtMs = Date.parse(p.called_at ?? "");
  const startedAt = Number.isFinite(startedAtMs) ? new Date(startedAtMs).toISOString() : new Date().toISOString();
  const endedAt = new Date(Date.parse(startedAt) + durationSeconds * 1000).toISOString();

  const rawCaller = present(p.caller);
  const caller = rawCaller ? (toE164(rawCaller, tenant.defaultRegion as never) ?? rawCaller) : "unknown";

  const recordingUrl = present(p.recording_url);
  const transcriptUrl = present(p.transcript_url);
  const body = present(p.message_body);
  const cb = present(p.callback_number);

  return {
    providerCallId: `dograh:${p.run_id}`,
    tenantId: tenant.id,
    direction: "INBOUND",
    callerNumber: caller,
    startedAt,
    endedAt,
    durationSeconds,
    outcome: mapDisposition(p.disposition),
    summary: present(p.summary) ?? "",
    ...(body ? { message: { body, ...(cb ? { callbackNumber: cb } : {}), urgent: p.urgent === true || p.urgent === "true" } } : {}),
    ...(recordingUrl || transcriptUrl
      ? { sourceArtifacts: { ...(recordingUrl ? { recordingUrl } : {}), ...(transcriptUrl ? { transcriptUrl } : {}) } }
      : {}),
  };
}
