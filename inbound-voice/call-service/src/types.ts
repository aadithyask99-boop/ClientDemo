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
  calDiy: { baseUrl: string; apiKey: string; eventTypeId: number } | null;
  numbers: string[]; // E.164 numbers routed to this tenant
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
  recordingUrl?: string;
  transcriptUrl?: string;
  message?: { body: string; callbackNumber?: string; urgent: boolean };
}
