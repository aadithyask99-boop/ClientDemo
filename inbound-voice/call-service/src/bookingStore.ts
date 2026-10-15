import type { Sql } from "./db.js";

export interface BookingEntry {
  uid: string;
  name: string;
  phone?: string;
  email?: string;
}

/** Where LocalScheduler keeps what is booked. `reserve` must be atomic: of two callers taking the same slot, exactly one wins. */
export interface BookingStore {
  /** Start times (ISO, UTC) already booked for the tenant in [fromIso, toIso). */
  taken(tenantId: string, fromIso: string, toIso: string): Promise<Set<string>>;
  /** Books the slot. Returns false if it is already booked. */
  reserve(tenantId: string, startIso: string, entry: BookingEntry): Promise<boolean>;
  /** Frees a slot again (used when the booking could not be written to the client's calendar). */
  release(tenantId: string, startIso: string): Promise<void>;
}

export class InMemoryBookingStore implements BookingStore {
  private readonly booked = new Map<string, Set<string>>();

  async taken(tenantId: string, fromIso: string, toIso: string): Promise<Set<string>> {
    const all = this.booked.get(tenantId) ?? new Set<string>();
    return new Set([...all].filter((s) => s >= fromIso && s < toIso));
  }

  async reserve(tenantId: string, startIso: string): Promise<boolean> {
    const set = this.booked.get(tenantId) ?? new Set<string>();
    if (set.has(startIso)) return false;
    set.add(startIso);
    this.booked.set(tenantId, set);
    return true;
  }

  async release(tenantId: string, startIso: string): Promise<void> {
    this.booked.get(tenantId)?.delete(startIso);
  }
}

export class PgBookingStore implements BookingStore {
  constructor(private readonly sql: Sql) {}

  async taken(tenantId: string, fromIso: string, toIso: string): Promise<Set<string>> {
    const { rows } = await this.sql.query<{ start_at: Date | string }>(
      `SELECT start_at FROM bookings WHERE tenant_id = $1 AND start_at >= $2 AND start_at < $3`,
      [tenantId, fromIso, toIso],
    );
    return new Set(rows.map((r) => new Date(r.start_at).toISOString()));
  }

  async reserve(tenantId: string, startIso: string, e: BookingEntry): Promise<boolean> {
    const { rows } = await this.sql.query(
      `INSERT INTO bookings (tenant_id, start_at, uid, attendee_name, attendee_phone, attendee_email)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (tenant_id, start_at) DO NOTHING RETURNING uid`,
      [tenantId, startIso, e.uid, e.name, e.phone ?? null, e.email ?? null],
    );
    return rows.length === 1;
  }

  async release(tenantId: string, startIso: string): Promise<void> {
    await this.sql.query(`DELETE FROM bookings WHERE tenant_id = $1 AND start_at = $2`, [tenantId, startIso]);
  }
}
