export const OUTCOMES = [
  "BOOKED",
  "MESSAGE_TAKEN",
  "TRANSFERRED",
  "TRANSFER_FAILED",
  "INFO_GIVEN",
  "CALLBACK_REQUESTED",
  "OPTED_OUT",
  "NO_OUTCOME",
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export interface Tenant {
  id: string;
  name: string;
  defaultRegion: string; // ISO country code, used to parse local-format numbers
  twenty: {
    baseUrl: string; // https://<workspace>.your-domain
    apiKey: string; // read access (caller lookup)
    ingestSecret: string; // HMAC secret shared with the app's ingest-call function
  };
  /**
   * The client's own calendar. When set, offered slots exclude what is already busy there and bookings are written to it.
   * `refreshToken` comes from the client's one-time consent (Google or Microsoft); the OAuth app itself is platform-wide.
   */
  calendar?: { provider: "google" | "microsoft"; refreshToken: string; calendarId?: string } | null;
  numbers: string[]; // E.164 numbers routed to this tenant
  /** Bearer token this tenant's Dograh webhook node sends. Dograh does not sign webhooks, so this token is the only authentication. */
  dograhWebhookToken?: string;
  /** Working hours for the built-in scheduler (also the time zone used when talking about times). */
  booking?: {
    timeZone: string;
    days: number[];
    open: string;
    close: string;
    slotMinutes: number;
    minNoticeMinutes?: number;
    /** Calendar dates (YYYY-MM-DD, in `timeZone`) with no appointments: bank holidays, holidays. */
    daysOff?: string[];
    /** Times of day with no appointments on every working day, for example lunch: { start: "12:00", end: "13:00" }. */
    breaks?: Array<{ start: string; end: string }>;
    /** How far ahead appointments can be booked. Default 90 days. */
    maxAdvanceDays?: number;
  };
}

/** What a person at the client should do after a call. Made by planFollowUp; the CRM turns it into a Task. */
export interface FollowUp {
  kind: "message" | "callback";
  title: string;
  body: string;
  dueAt: string; // ISO, the next time the team is open
  urgent: boolean;
}

/** What the voice runtime reports when a call ends. Provider-specific adapters map into this shape. */
export interface CallRecord {
  providerCallId: string; // idempotency key
  tenantId: string;
  direction: "INBOUND";
  callerNumber: string; // E.164
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationSeconds: number;
  outcome: Outcome;
  summary: string;
  /** Private storage reference (for example artifact://tenant/call.recording), never a public provider link. */
  recordingRef?: string;
  transcriptRef?: string;
  message?: { body: string; callbackNumber?: string; urgent: boolean };
  /** Name the caller gave on this call (from the booking or message), used to find or create their Person in the CRM. */
  callerName?: string;
  /** The caller's number split the way the CRM stores it. Added by the CRM writer; not part of the provider's report. */
  callerPhone?: { country?: string; callingCode: string; nationalNumber: string };
  followUp?: FollowUp;
  /** Provider-hosted links to copy into private storage before the record is written. Never forwarded to the CRM as-is. */
  sourceArtifacts?: { recordingUrl?: string; transcriptUrl?: string };
}
