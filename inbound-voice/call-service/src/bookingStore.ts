import type { Sql } from "./db.js";

export interface BookingEntry {
  uid: string;
  name: string;
  phone?: string;
  email?: string;
  reason?: string;
}

/** A booking as stored: the entry plus when it starts and the id of its event in the client's calendar, if one was written. */
export interface StoredBooking extends BookingEntry {
  start: string; // ISO, UTC
  eventId?: string;
}

/** Where LocalScheduler keeps what is booked. `reserve` must be atomic: of two callers taking the same slot, exactly one wins. */
export interface BookingStore {
  /** Start times (ISO, UTC) already booked for the tenant in [fromIso, toIso). */
  taken(tenantId: string, fromIso: string, toIso: string): Promise<Set<string>>;
  /** Books the slot. Returns false if it is already booked. */
  reserve(tenantId: string, startIso: string, entry: BookingEntry): Promise<boolean>;
  /** Frees a slot again (used when the booking could not be written to the client's calendar). */
  release(tenantId: string, startIso: string): Promise<void>;
  /** One booking by its uid, or undefined. */
  get(tenantId: string, uid: string): Promise<StoredBooking | undefined>;
  /** Bookings starting at or after `fromIso` made with this phone number (E.164), soonest first. */
  upcomingForPhone(tenantId: string, phone: string, fromIso: string): Promise<StoredBooking[]>;
  /** Removes a booking by uid and returns what was removed, or undefined if there was none. */
  cancel(tenantId: string, uid: string): Promise<StoredBooking | undefined>;
  /** Bookings starting in [fromIso, toIso) for the tenant, soonest first. Read-only view for the Calendar screen. */
  list(tenantId: string, fromIso: string, toIso: string): Promise<StoredBooking[]>;
  /** Remembers the calendar event written for a booking, so cancelling can delete it. */
  setEventId(tenantId: string, uid: string, eventId: string): Promise<void>;
}

export class InMemoryBookingStore implements BookingStore {
  private readonly booked = new Map<string, Map<string, StoredBooking>>(); // tenant -> start -> booking

  private forTenant(tenantId: string): Map<string, StoredBooking> {
    let m = this.booked.get(tenantId);
    if (!m) this.booked.set(tenantId, (m = new Map()));
    return m;
  }

  async taken(tenantId: string, fromIso: string, toIso: string): Promise<Set<string>> {
    return new Set([...this.forTenant(tenantId).keys()].filter((s) => s >= fromIso && s < toIso));
  }

  async reserve(tenantId: string, startIso: string, entry: BookingEntry): Promise<boolean> {
    const m = this.forTenant(tenantId);
    if (m.has(startIso)) return false;
    m.set(startIso, { ...entry, start: startIso });
    return true;
  }

  async release(tenantId: string, startIso: string): Promise<void> {
    this.forTenant(tenantId).delete(startIso);
  }

  async get(tenantId: string, uid: string): Promise<StoredBooking | undefined> {
    return [...this.forTenant(tenantId).values()].find((b) => b.uid === uid);
  }

  async upcomingForPhone(tenantId: string, phone: string, fromIso: string): Promise<StoredBooking[]> {
    return [...this.forTenant(tenantId).values()].filter((b) => b.phone === phone && b.start >= fromIso).sort((a, b) => a.start.localeCompare(b.start));
  }

  async cancel(tenantId: string, uid: string): Promise<StoredBooking | undefined> {
    const b = await this.get(tenantId, uid);
    if (b) this.forTenant(tenantId).delete(b.start);
    return b;
  }

  async list(tenantId: string, fromIso: string, toIso: string): Promise<StoredBooking[]> {
    return [...this.forTenant(tenantId).values()].filter((b) => b.start >= fromIso && b.start < toIso).sort((a, b) => a.start.localeCompare(b.start));
  }

  async setEventId(tenantId: string, uid: string, eventId: string): Promise<void> {
    const b = await this.get(tenantId, uid);
    if (b) b.eventId = eventId;
  }
}

interface Row {
  start_at: Date | string;
  uid: string;
  attendee_name: string;
  attendee_phone: string | null;
  attendee_email: string | null;
  attendee_reason: string | null;
  event_id: string | null;
}

const COLUMNS = `start_at, uid, attendee_name, attendee_phone, attendee_email, attendee_reason, event_id`;

function fromRow(r: Row): StoredBooking {
  return {
    start: new Date(r.start_at).toISOString(),
    uid: r.uid,
    name: r.attendee_name,
    ...(r.attendee_phone ? { phone: r.attendee_phone } : {}),
    ...(r.attendee_email ? { email: r.attendee_email } : {}),
    ...(r.attendee_reason ? { reason: r.attendee_reason } : {}),
    ...(r.event_id ? { eventId: r.event_id } : {}),
  };
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
      `INSERT INTO bookings (tenant_id, start_at, uid, attendee_name, attendee_phone, attendee_email, attendee_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (tenant_id, start_at) DO NOTHING RETURNING uid`,
      [tenantId, startIso, e.uid, e.name, e.phone ?? null, e.email ?? null, e.reason ?? null],
    );
    return rows.length === 1;
  }

  async release(tenantId: string, startIso: string): Promise<void> {
    await this.sql.query(`DELETE FROM bookings WHERE tenant_id = $1 AND start_at = $2`, [tenantId, startIso]);
  }

  async get(tenantId: string, uid: string): Promise<StoredBooking | undefined> {
    const { rows } = await this.sql.query<Row>(`SELECT ${COLUMNS} FROM bookings WHERE tenant_id = $1 AND uid = $2`, [tenantId, uid]);
    return rows[0] ? fromRow(rows[0]) : undefined;
  }

  async upcomingForPhone(tenantId: string, phone: string, fromIso: string): Promise<StoredBooking[]> {
    const { rows } = await this.sql.query<Row>(
      `SELECT ${COLUMNS} FROM bookings WHERE tenant_id = $1 AND attendee_phone = $2 AND start_at >= $3 ORDER BY start_at`,
      [tenantId, phone, fromIso],
    );
    return rows.map(fromRow);
  }

  async cancel(tenantId: string, uid: string): Promise<StoredBooking | undefined> {
    const { rows } = await this.sql.query<Row>(`DELETE FROM bookings WHERE tenant_id = $1 AND uid = $2 RETURNING ${COLUMNS}`, [tenantId, uid]);
    return rows[0] ? fromRow(rows[0]) : undefined;
  }

  async list(tenantId: string, fromIso: string, toIso: string): Promise<StoredBooking[]> {
    const { rows } = await this.sql.query<Row>(
      `SELECT ${COLUMNS} FROM bookings WHERE tenant_id = $1 AND start_at >= $2 AND start_at < $3 ORDER BY start_at`,
      [tenantId, fromIso, toIso],
    );
    return rows.map(fromRow);
  }

  async setEventId(tenantId: string, uid: string, eventId: string): Promise<void> {
    await this.sql.query(`UPDATE bookings SET event_id = $3 WHERE tenant_id = $1 AND uid = $2`, [tenantId, uid, eventId]);
  }
}
