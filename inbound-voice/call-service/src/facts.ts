import type { Outcome } from "./types.js";

/**
 * Things we know for certain about a call because one of OUR tools did them (a booking made, a message taken).
 * They outrank any classifier guess when we decide the call outcome. Scaffold: in memory; persist before real use.
 */
export interface Booking {
  uid: string;
  start: string; // ISO instant
  label: string; // human-readable, in the client's time zone
  name: string;
}

export interface CallFacts {
  booking?: Booking;
  /** An outcome the agent stated explicitly through the record_outcome tool (opt-out, callback, and so on). */
  outcome?: { code: Outcome; note?: string };
  message?: { body: string; callbackNumber?: string; urgent: boolean };
}

export interface CallFactStore {
  record(tenantId: string, providerCallId: string, facts: CallFacts): void;
  get(tenantId: string, providerCallId: string): CallFacts | undefined;
}

export class InMemoryCallFactStore implements CallFactStore {
  private readonly facts = new Map<string, CallFacts>();
  private key = (t: string, c: string) => `${t}|${c}`;

  record(tenantId: string, providerCallId: string, facts: CallFacts): void {
    const k = this.key(tenantId, providerCallId);
    this.facts.set(k, { ...(this.facts.get(k) ?? {}), ...facts });
  }

  get(tenantId: string, providerCallId: string): CallFacts | undefined {
    return this.facts.get(this.key(tenantId, providerCallId));
  }
}
