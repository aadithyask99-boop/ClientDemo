import type { Pool } from "pg";

/** The one thing the stores need from a database. Satisfied by `pg` in production and by PGlite (real Postgres in WASM) in tests. */
export interface Sql {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export function fromPg(pool: Pool): Sql {
  return { query: async (text, params) => ({ rows: (await pool.query(text, params as unknown[])).rows }) };
}

/**
 * Idempotent schema. The unique key on bookings is what makes double booking impossible even with several
 * call-service processes: the second insert for the same tenant and start time fails, whoever gets there first wins.
 */
export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS bookings (
     tenant_id      text        NOT NULL,
     start_at       timestamptz NOT NULL,
     uid            text        NOT NULL,
     attendee_name  text        NOT NULL,
     attendee_phone text,
     attendee_email text,
     created_at     timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (tenant_id, start_at)
   )`,
  // Added after the first release: what the job is, and the id of the event written to the client's calendar.
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS attendee_reason text`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_id text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS bookings_uid ON bookings (tenant_id, uid)`,
  `CREATE INDEX IF NOT EXISTS bookings_phone ON bookings (tenant_id, attendee_phone, start_at)`,
  `CREATE TABLE IF NOT EXISTS call_facts (
     tenant_id        text        NOT NULL,
     provider_call_id text        NOT NULL,
     facts            jsonb       NOT NULL,
     updated_at       timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (tenant_id, provider_call_id)
   )`,
  // Post-call writes to the CRM. A row exists before the provider is told 202, so a crash cannot lose a call.
  // status: pending -> running -> done | dead. A running row whose lock has expired is taken over (worker crashed).
  // version bumps when the same call is delivered again, so a worker finishing the old payload cannot mark the new one done.
  `CREATE TABLE IF NOT EXISTS outbox (
     id              serial      PRIMARY KEY,
     job_key         text        NOT NULL UNIQUE,
     payload         jsonb       NOT NULL,
     status          text        NOT NULL DEFAULT 'pending',
     attempts        integer     NOT NULL DEFAULT 0,
     version         integer     NOT NULL DEFAULT 1,
     next_attempt_at timestamptz NOT NULL DEFAULT now(),
     locked_until    timestamptz,
     last_error      text,
     created_at      timestamptz NOT NULL DEFAULT now(),
     updated_at      timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS outbox_due ON outbox (status, next_attempt_at)`,
  // The call log: what came out of phone calls. Customers are the people who called or were added by hand; a phone number is
  // unique per client, so the same caller is never two customers. follow_ups has one row per call and keeps its done state.
  `CREATE TABLE IF NOT EXISTS customers (
     id         text        PRIMARY KEY,
     tenant_id  text        NOT NULL,
     name       text        NOT NULL DEFAULT '',
     phone      text,
     email      text,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS customers_phone ON customers (tenant_id, phone) WHERE phone IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS calls (
     tenant_id        text        NOT NULL,
     provider_call_id text        NOT NULL,
     customer_id      text,
     caller_number    text        NOT NULL,
     started_at       timestamptz NOT NULL,
     ended_at         timestamptz NOT NULL,
     duration_seconds integer     NOT NULL DEFAULT 0,
     outcome          text        NOT NULL,
     summary          text        NOT NULL DEFAULT '',
     recording_ref    text,
     transcript_ref   text,
     created_at       timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (tenant_id, provider_call_id)
   )`,
  // The name this caller gave on this call. The customer row keeps the first name heard for a number, so a shared line (a family,
  // an office) would otherwise show that first name on every call.
  `ALTER TABLE calls ADD COLUMN IF NOT EXISTS caller_name text`,
  `CREATE INDEX IF NOT EXISTS calls_recent ON calls (tenant_id, started_at DESC)`,
  `CREATE TABLE IF NOT EXISTS follow_ups (
     id               text        PRIMARY KEY,
     tenant_id        text        NOT NULL,
     provider_call_id text        NOT NULL,
     customer_id      text,
     kind             text        NOT NULL,
     title            text        NOT NULL,
     body             text        NOT NULL DEFAULT '',
     due_at           timestamptz NOT NULL,
     urgent           boolean     NOT NULL DEFAULT false,
     status           text        NOT NULL DEFAULT 'todo',
     done_at          timestamptz,
     created_at       timestamptz NOT NULL DEFAULT now(),
     UNIQUE (tenant_id, provider_call_id)
   )`,
  `CREATE INDEX IF NOT EXISTS follow_ups_open ON follow_ups (tenant_id, status, created_at DESC)`,
];

const MIGRATION_LOCK = 727301;

/**
 * Safe to run from several processes at once. All statements go in one string, which Postgres runs as a single
 * implicit transaction, so the transaction-level advisory lock is held until the last one finishes. Run one by one,
 * two processes starting together collide inside CREATE TABLE IF NOT EXISTS ("duplicate key ... pg_type_typname_nsp_index").
 */
export async function migrate(sql: Sql): Promise<void> {
  await sql.query(`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK});\n${SCHEMA.join(";\n")}`);
}
