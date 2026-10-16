import type { Sql } from "./db.js";
import type { Outcome } from "./types.js";

/**
 * Things we know for certain about a call because one of OUR tools did them (a booking made, a message taken).
 * They outrank any classifier guess when we decide the call outcome.
 */
export interface Booking {
  uid: string;
  start: string; // ISO instant
  label: string; // human-readable, in the client's time zone
  name: string;
}

export interface CallFacts {
  booking?: Booking;
  /** An appointment cancelled on this call. If it is the one booked on the same call, the call is not BOOKED. */
  cancelled?: { uid: string; label: string; name: string };
  /** An appointment moved on this call. `booking` is replaced by the new one. */
  rescheduled?: { from: string; to: string; name: string };
  /** An outcome the agent stated explicitly through the record_outcome tool (opt-out, callback, and so on). */
  outcome?: { code: Outcome; note?: string };
  message?: { body: string; callbackNumber?: string; urgent: boolean; name?: string };
}

export interface CallFactStore {
  /** Merges `facts` into what is already known about the call (a later fact of the same kind replaces the earlier one). */
  record(tenantId: string, providerCallId: string, facts: CallFacts): Promise<void>;
  get(tenantId: string, providerCallId: string): Promise<CallFacts | undefined>;
}

export class InMemoryCallFactStore implements CallFactStore {
  private readonly facts = new Map<string, CallFacts>();
  private key = (t: string, c: string) => `${t}|${c}`;

  async record(tenantId: string, providerCallId: string, facts: CallFacts): Promise<void> {
    const k = this.key(tenantId, providerCallId);
    this.facts.set(k, { ...(this.facts.get(k) ?? {}), ...facts });
  }

  async get(tenantId: string, providerCallId: string): Promise<CallFacts | undefined> {
    return this.facts.get(this.key(tenantId, providerCallId));
  }
}

/** Survives restarts and is shared by every call-service process. `||` on jsonb is the same shallow merge as above. */
export class PgCallFactStore implements CallFactStore {
  constructor(private readonly sql: Sql) {}

  async record(tenantId: string, providerCallId: string, facts: CallFacts): Promise<void> {
    await this.sql.query(
      `INSERT INTO call_facts (tenant_id, provider_call_id, facts) VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (tenant_id, provider_call_id)
       DO UPDATE SET facts = call_facts.facts || EXCLUDED.facts, updated_at = now()`,
      [tenantId, providerCallId, JSON.stringify(facts)],
    );
  }

  async get(tenantId: string, providerCallId: string): Promise<CallFacts | undefined> {
    const { rows } = await this.sql.query<{ facts: CallFacts }>(`SELECT facts FROM call_facts WHERE tenant_id = $1 AND provider_call_id = $2`, [tenantId, providerCallId]);
    return rows[0]?.facts;
  }
}
