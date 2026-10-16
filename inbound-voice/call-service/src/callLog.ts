import { randomBytes } from "node:crypto";
import type { CrmWriter } from "./crm.js";
import type { Sql } from "./db.js";
import type { CallRecord, Tenant } from "./types.js";

/**
 * Our own record of what came out of phone calls: the call list, the people who called or were added by hand,
 * and the follow-ups (messages and callback requests) waiting for someone at the client. Stored next to the bookings,
 * so there is no separate CRM to run. Every write is idempotent on the provider's call id, so the post-call queue can retry freely.
 */
export interface CallRow {
  id: string;
  startedAt: string;
  callerNumber: string;
  callerName: string;
  outcome: string;
  summary: string;
  durationSeconds: number;
}

export interface FollowUpRow {
  id: string;
  /** The call this came from. */
  callId: string;
  kind: string;
  title: string;
  body: string;
  dueAt: string;
  urgent: boolean;
  status: "todo" | "done";
  createdAt: string;
}

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
}

export type AddCustomerResult = { ok: true; customer: CustomerRow } | { ok: false; reason: "exists"; customer: CustomerRow };

export interface CallLogStore {
  /** Stores the finished call, finds or creates the caller as a customer, and keeps the follow-up it planned. Safe to repeat. */
  recordCall(tenant: Tenant, record: CallRecord): Promise<void>;
  listCalls(tenantId: string, limit?: number): Promise<CallRow[]>;
  listFollowUps(tenantId: string, includeDone: boolean): Promise<FollowUpRow[]>;
  /** False if there is no such follow-up for this client. */
  markFollowUpDone(tenantId: string, id: string): Promise<boolean>;
  listCustomers(tenantId: string, limit?: number): Promise<CustomerRow[]>;
  /** `phone` must already be E.164. A second customer with the same number is refused and the existing one is returned. */
  addCustomer(tenantId: string, input: { name: string; phone?: string; email?: string }): Promise<AddCustomerResult>;
}

/** Lets the post-call queue write into the call log the way it used to write into the CRM. */
export class CallLogWriter implements CrmWriter {
  /** A function lets start-up build the writer before it knows which store (memory or Postgres) it will use. */
  constructor(private readonly log: CallLogStore | (() => CallLogStore)) {}
  writeCall(tenant: Tenant, record: CallRecord): Promise<void> {
    return (typeof this.log === "function" ? this.log() : this.log).recordCall(tenant, record);
  }
}

const id = (prefix: string) => `${prefix}_${randomBytes(6).toString("hex")}`;

export class InMemoryCallLog implements CallLogStore {
  private readonly calls = new Map<string, CallRow & { tenantId: string }>();
  private readonly followUps = new Map<string, FollowUpRow & { tenantId: string; callId: string }>();
  private readonly customers = new Map<string, CustomerRow & { tenantId: string }>();

  private customerByPhone(tenantId: string, phone: string) {
    return [...this.customers.values()].find((c) => c.tenantId === tenantId && c.phone === phone);
  }

  async recordCall(tenant: Tenant, r: CallRecord): Promise<void> {
    const name = r.callerName ?? "";
    let c = this.customerByPhone(tenant.id, r.callerNumber);
    if (!c) {
      c = { id: id("cus"), tenantId: tenant.id, name, phone: r.callerNumber, email: "", createdAt: new Date().toISOString() };
      this.customers.set(c.id, c);
    } else if (!c.name && name) c.name = name;
    this.calls.set(`${tenant.id}:${r.providerCallId}`, {
      id: r.providerCallId,
      tenantId: tenant.id,
      startedAt: r.startedAt,
      callerNumber: r.callerNumber,
      callerName: c.name,
      outcome: r.outcome,
      summary: r.summary,
      durationSeconds: r.durationSeconds,
    });
    const key = `${tenant.id}:${r.providerCallId}`;
    if (r.followUp && ![...this.followUps.values()].some((f) => `${f.tenantId}:${f.callId}` === key)) {
      const f = r.followUp;
      const fid = id("fu");
      this.followUps.set(fid, { id: fid, tenantId: tenant.id, callId: r.providerCallId, kind: f.kind, title: f.title, body: f.body, dueAt: f.dueAt, urgent: f.urgent, status: "todo", createdAt: new Date().toISOString() });
    }
  }

  async listCalls(tenantId: string, limit = 100): Promise<CallRow[]> {
    return [...this.calls.values()].filter((c) => c.tenantId === tenantId).sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit).map(({ tenantId: _t, ...c }) => c);
  }

  async listFollowUps(tenantId: string, includeDone: boolean): Promise<FollowUpRow[]> {
    return [...this.followUps.values()]
      .filter((f) => f.tenantId === tenantId && (includeDone || f.status === "todo"))
      .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || b.createdAt.localeCompare(a.createdAt))
      .map(({ tenantId: _t, ...f }) => f);
  }

  async markFollowUpDone(tenantId: string, fid: string): Promise<boolean> {
    const f = this.followUps.get(fid);
    if (!f || f.tenantId !== tenantId) return false;
    f.status = "done";
    return true;
  }

  async listCustomers(tenantId: string, limit = 500): Promise<CustomerRow[]> {
    return [...this.customers.values()].filter((c) => c.tenantId === tenantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit).map(({ tenantId: _t, ...c }) => c);
  }

  async addCustomer(tenantId: string, input: { name: string; phone?: string; email?: string }): Promise<AddCustomerResult> {
    if (input.phone) {
      const existing = this.customerByPhone(tenantId, input.phone);
      if (existing) {
        const { tenantId: _t, ...c } = existing;
        return { ok: false, reason: "exists", customer: c };
      }
    }
    const c = { id: id("cus"), tenantId, name: input.name, phone: input.phone ?? "", email: input.email ?? "", createdAt: new Date().toISOString() };
    this.customers.set(c.id, c);
    const { tenantId: _t, ...out } = c;
    return { ok: true, customer: out };
  }
}

interface CallDbRow {
  provider_call_id: string;
  started_at: Date | string;
  caller_number: string;
  customer_name: string | null;
  outcome: string;
  summary: string;
  duration_seconds: number;
}
interface FollowUpDbRow {
  id: string;
  provider_call_id: string;
  kind: string;
  title: string;
  body: string;
  due_at: Date | string;
  urgent: boolean;
  status: "todo" | "done";
  created_at: Date | string;
}
interface CustomerDbRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: Date | string;
}

const iso = (v: Date | string) => new Date(v).toISOString();
const toCustomer = (r: CustomerDbRow): CustomerRow => ({ id: r.id, name: r.name, phone: r.phone ?? "", email: r.email ?? "", createdAt: iso(r.created_at) });

export class PgCallLog implements CallLogStore {
  constructor(private readonly sql: Sql) {}

  async recordCall(tenant: Tenant, r: CallRecord): Promise<void> {
    // The caller becomes a customer on their first call; a name heard later fills in an empty one but never overwrites.
    const cust = await this.sql.query<{ id: string }>(
      `INSERT INTO customers (id, tenant_id, name, phone) VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, phone) WHERE phone IS NOT NULL
       DO UPDATE SET name = CASE WHEN customers.name = '' THEN EXCLUDED.name ELSE customers.name END
       RETURNING id`,
      [id("cus"), tenant.id, r.callerName ?? "", r.callerNumber],
    );
    const customerId = cust.rows[0]?.id ?? null;
    await this.sql.query(
      `INSERT INTO calls (tenant_id, provider_call_id, customer_id, caller_number, started_at, ended_at, duration_seconds, outcome, summary, recording_ref, transcript_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (tenant_id, provider_call_id) DO UPDATE SET
         customer_id = EXCLUDED.customer_id, ended_at = EXCLUDED.ended_at, duration_seconds = EXCLUDED.duration_seconds,
         outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, recording_ref = EXCLUDED.recording_ref, transcript_ref = EXCLUDED.transcript_ref`,
      [tenant.id, r.providerCallId, customerId, r.callerNumber, r.startedAt, r.endedAt, r.durationSeconds, r.outcome, r.summary, r.recordingRef ?? null, r.transcriptRef ?? null],
    );
    if (r.followUp) {
      const f = r.followUp;
      // DO NOTHING on a repeat: a follow-up someone already marked done must not come back.
      await this.sql.query(
        `INSERT INTO follow_ups (id, tenant_id, provider_call_id, customer_id, kind, title, body, due_at, urgent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (tenant_id, provider_call_id) DO NOTHING`,
        [id("fu"), tenant.id, r.providerCallId, customerId, f.kind, f.title, f.body, f.dueAt, f.urgent],
      );
    }
  }

  async listCalls(tenantId: string, limit = 100): Promise<CallRow[]> {
    const { rows } = await this.sql.query<CallDbRow>(
      `SELECT c.provider_call_id, c.started_at, c.caller_number, cu.name AS customer_name, c.outcome, c.summary, c.duration_seconds
       FROM calls c LEFT JOIN customers cu ON cu.id = c.customer_id
       WHERE c.tenant_id = $1 ORDER BY c.started_at DESC LIMIT $2`,
      [tenantId, limit],
    );
    return rows.map((r) => ({ id: r.provider_call_id, startedAt: iso(r.started_at), callerNumber: r.caller_number, callerName: r.customer_name ?? "", outcome: r.outcome, summary: r.summary, durationSeconds: r.duration_seconds }));
  }

  async listFollowUps(tenantId: string, includeDone: boolean): Promise<FollowUpRow[]> {
    const { rows } = await this.sql.query<FollowUpDbRow>(
      `SELECT id, provider_call_id, kind, title, body, due_at, urgent, status, created_at FROM follow_ups
       WHERE tenant_id = $1 AND ($2 OR status = 'todo')
       ORDER BY (status = 'done'), created_at DESC LIMIT 500`,
      [tenantId, includeDone],
    );
    return rows.map((r) => ({ id: r.id, callId: r.provider_call_id, kind: r.kind, title: r.title, body: r.body, dueAt: iso(r.due_at), urgent: r.urgent, status: r.status, createdAt: iso(r.created_at) }));
  }

  async markFollowUpDone(tenantId: string, fid: string): Promise<boolean> {
    const { rows } = await this.sql.query(`UPDATE follow_ups SET status = 'done', done_at = now() WHERE tenant_id = $1 AND id = $2 RETURNING id`, [tenantId, fid]);
    return rows.length === 1;
  }

  async listCustomers(tenantId: string, limit = 500): Promise<CustomerRow[]> {
    const { rows } = await this.sql.query<CustomerDbRow>(`SELECT id, name, phone, email, created_at FROM customers WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`, [tenantId, limit]);
    return rows.map(toCustomer);
  }

  async addCustomer(tenantId: string, input: { name: string; phone?: string; email?: string }): Promise<AddCustomerResult> {
    const { rows } = await this.sql.query<CustomerDbRow>(
      `INSERT INTO customers (id, tenant_id, name, phone, email) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, phone) WHERE phone IS NOT NULL DO NOTHING RETURNING id, name, phone, email, created_at`,
      [id("cus"), tenantId, input.name, input.phone ?? null, input.email ?? null],
    );
    if (rows[0]) return { ok: true, customer: toCustomer(rows[0]) };
    const existing = await this.sql.query<CustomerDbRow>(`SELECT id, name, phone, email, created_at FROM customers WHERE tenant_id = $1 AND phone = $2`, [tenantId, input.phone ?? null]);
    return { ok: false, reason: "exists", customer: toCustomer(existing.rows[0]!) };
  }
}
