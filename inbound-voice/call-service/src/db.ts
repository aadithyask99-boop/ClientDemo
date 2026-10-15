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
  `CREATE TABLE IF NOT EXISTS call_facts (
     tenant_id        text        NOT NULL,
     provider_call_id text        NOT NULL,
     facts            jsonb       NOT NULL,
     updated_at       timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (tenant_id, provider_call_id)
   )`,
];

export async function migrate(sql: Sql): Promise<void> {
  for (const stmt of SCHEMA) await sql.query(stmt);
}
