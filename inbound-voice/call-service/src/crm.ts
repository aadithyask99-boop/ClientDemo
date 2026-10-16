import type { CallRecord, Tenant } from "./types.js";

/** Where a finished call goes after the call. Today that is our own call log (see callLog.ts). */
export interface CrmWriter {
  /** Idempotent on record.providerCallId. Throws on any failure so the queue retries. */
  writeCall(tenant: Tenant, record: CallRecord): Promise<void>;
}

/** A failure worth retrying (the destination was briefly unavailable). */
export class RetryableError extends Error {}
/** A failure that will not succeed on retry; the call goes to the dead-letter list. */
export class PermanentError extends Error {}
