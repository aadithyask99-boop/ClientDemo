import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PermanentError } from "../src/crm.js";
import { fromPg, migrate, type Sql } from "../src/db.js";
import { fromPglite } from "./pgliteSql.js";
import { PgOutboxQueue } from "../src/pgQueue.js";
import { buildServer } from "../src/server.js";
import { InMemoryTenantRegistry } from "../src/tenants.js";
import type { CallRecord, Tenant } from "../src/types.js";

// Same switch as persistence.test.ts: PGlite by default, a real server through `pg` when TEST_DATABASE_URL is set.
const realUrl = process.env.TEST_DATABASE_URL;
let pool: pg.Pool | undefined;
let sql: Sql;
beforeEach(async () => {
  if (realUrl) {
    pool ??= new pg.Pool({ connectionString: realUrl, max: 8 });
    sql = fromPg(pool);
    await sql.query("DROP TABLE IF EXISTS outbox");
  } else {
    sql = fromPglite(new PGlite());
  }
  await migrate(sql);
});
afterAll(async () => {
  await pool?.end();
});

const fast = { baseDelayMs: 1, pollMs: 20 };
const stored = { ...fast, runOnEnqueue: false }; // stores jobs but does not run them until start()
const status = async (key: string) => (await sql.query<{ status: string; attempts: number; payload: unknown }>(`SELECT status, attempts, payload FROM outbox WHERE job_key = $1`, [key])).rows[0];

describe("PgOutboxQueue", () => {
  it("runs a job and scrubs its payload once done", async () => {
    const seen: unknown[] = [];
    const q = new PgOutboxQueue<{ n: number }>(sql, async (p) => void seen.push(p), fast);
    await q.enqueue("t1:a", { n: 1 });
    q.start();
    await q.idle();
    await q.stop();
    expect(seen).toEqual([{ n: 1 }]);
    expect(await status("t1:a")).toMatchObject({ status: "done", payload: {} }); // personal data is not kept after success
  });

  it("a job stored before a crash is run by the next process", async () => {
    // Process 1 stores the job and dies before running anything (no start()).
    await new PgOutboxQueue<{ n: number }>(sql, async () => {}, stored).enqueue("t1:a", { n: 7 });
    expect((await status("t1:a"))?.status).toBe("pending");
    const seen: unknown[] = [];
    const next = new PgOutboxQueue<{ n: number }>(sql, async (p) => void seen.push(p), fast);
    next.start();
    await next.idle();
    await next.stop();
    expect(seen).toEqual([{ n: 7 }]);
  });

  it("a job whose worker died mid-run is taken over once its lock expires", async () => {
    await new PgOutboxQueue<number>(sql, async () => {}, stored).enqueue("t1:a", 1);
    await sql.query(`UPDATE outbox SET status = 'running', attempts = 1, locked_until = now() - interval '1 second'`); // as left by a crashed worker
    const seen: number[] = [];
    const q = new PgOutboxQueue<number>(sql, async (p) => void seen.push(p), fast);
    q.start();
    await q.idle();
    await q.stop();
    expect(seen).toEqual([1]);
  });

  it("a live lock is respected: a second process does not run a job that is in progress", async () => {
    await new PgOutboxQueue<number>(sql, async () => {}, stored).enqueue("t1:a", 1);
    await sql.query(`UPDATE outbox SET status = 'running', attempts = 1, locked_until = now() + interval '1 minute'`);
    const seen: number[] = [];
    const q = new PgOutboxQueue<number>(sql, async (p) => void seen.push(p), fast);
    q.start();
    await new Promise((r) => setTimeout(r, 150));
    await q.stop();
    expect(seen).toEqual([]);
  });

  it("retries with backoff, then succeeds", async () => {
    let calls = 0;
    const events: string[] = [];
    const q = new PgOutboxQueue<number>(sql, async () => { if (++calls < 3) throw new Error("twenty is down"); }, { ...fast, onEvent: (e) => events.push(e.type) });
    await q.enqueue("t1:a", 1);
    q.start();
    await q.idle();
    await q.stop();
    expect(events).toEqual(["retry", "retry", "ok"]);
    expect((await status("t1:a"))?.status).toBe("done");
  });

  it("dead-letters after the maximum attempts and keeps the payload for a manual retry", async () => {
    const q = new PgOutboxQueue<{ n: number }>(sql, async () => { throw new Error("nope"); }, { ...fast, maxAttempts: 3 });
    await q.enqueue("t1:a", { n: 9 });
    q.start();
    await q.idle();
    await q.stop();
    expect(await q.deadLetters()).toEqual([{ key: "t1:a", attempts: 3, error: "nope" }]);
    expect((await status("t1:a"))?.payload).toEqual({ n: 9 });
  });

  it("dead-letters at once on a permanent error", async () => {
    const q = new PgOutboxQueue<number>(sql, async () => { throw new PermanentError("rejected"); }, fast);
    await q.enqueue("t1:a", 1);
    q.start();
    await q.idle();
    await q.stop();
    expect((await q.deadLetters())[0]).toMatchObject({ attempts: 1, error: "rejected" });
  });

  it("the same call delivered twice is one job, and the newer payload wins", async () => {
    const seen: number[] = [];
    const q = new PgOutboxQueue<number>(sql, async (p) => void seen.push(p), stored);
    await q.enqueue("t1:a", 1);
    await q.enqueue("t1:a", 2); // provider redelivery before the first ran
    q.start();
    await q.idle();
    await q.stop();
    expect(seen).toEqual([2]);
    const { rows } = await sql.query(`SELECT 1 FROM outbox`);
    expect(rows).toHaveLength(1);
  });

  it("a redelivery during a run is not lost when the older run finishes", async () => {
    const seen: number[] = [];
    let q!: PgOutboxQueue<number>;
    q = new PgOutboxQueue<number>(
      sql,
      async (p) => {
        seen.push(p);
        if (p === 1) await q.enqueue("t1:a", 2); // newer delivery arrives while version 1 is running
      },
      fast,
    );
    await q.enqueue("t1:a", 1);
    q.start();
    await q.idle();
    await q.stop();
    expect(seen).toEqual([1, 2]);
    expect((await status("t1:a"))?.status).toBe("done");
  });

  it("purges finished rows but never pending or dead ones", async () => {
    const q = new PgOutboxQueue<number>(sql, async (p) => { if (p === 2) throw new PermanentError("x"); }, fast);
    await q.enqueue("t1:done", 1);
    await q.enqueue("t1:dead", 2);
    q.start();
    await q.idle();
    await q.stop();
    await sql.query(`UPDATE outbox SET updated_at = now() - interval '10 days'`);
    await q.purgeDone(86_400_000);
    const { rows } = await sql.query<{ job_key: string }>(`SELECT job_key FROM outbox`);
    expect(rows.map((r) => r.job_key)).toEqual(["t1:dead"]);
  });

  it("two workers share the load without running any job twice", async () => {
    const seen: number[] = [];
    const handler = async (p: number) => { await new Promise((r) => setTimeout(r, 5)); seen.push(p); };
    const a = new PgOutboxQueue<number>(sql, handler, fast);
    const b = new PgOutboxQueue<number>(sql, handler, fast);
    for (let i = 0; i < 20; i++) await a.enqueue(`t1:${i}`, i);
    a.start();
    b.start();
    await a.idle();
    await Promise.all([a.stop(), b.stop()]);
    expect(seen.sort((x, y) => x - y)).toEqual(Array.from({ length: 20 }, (_, i) => i));
  });
});

describe("server with the durable queue", () => {
  const tenant = { id: "t1", dograhWebhookToken: "tok", numbers: ["+441234567890"], twenty: { baseUrl: "http://x", apiKey: "k", ingestSecret: "s" } } as unknown as Tenant;
  const payload = { run_id: 42, caller: "+447400123456", called_at: "2026-10-15T10:00:00Z", duration: 60, disposition: "XFER" };

  it("acknowledges only after the call is stored, and the stored call is written to the CRM", async () => {
    const written: CallRecord[] = [];
    const q = new PgOutboxQueue<CallRecord>(sql, async (r) => void written.push(r), stored);
    const { app } = buildServer({ registry: new InMemoryTenantRegistry([tenant]), crm: { writeCall: async () => {} }, providerSecret: "p", queue: q });
    const res = await app.inject({ method: "POST", url: "/webhooks/dograh", headers: { authorization: "Bearer tok", "content-type": "application/json" }, payload: JSON.stringify(payload) });
    expect(res.statusCode).toBe(202);
    expect((await status("t1:dograh:42"))?.status).toBe("pending"); // already in the database when the 202 was sent
    q.start();
    await q.idle();
    await q.stop();
    expect(written).toHaveLength(1);
    expect(written[0]?.providerCallId).toBe("dograh:42");
  });

  it("answers 500, not 202, when the call could not be stored, so the provider retries", async () => {
    const broken = { enqueue: async () => { throw new Error("db down"); }, idle: async () => {} };
    const lines: string[] = [];
    const { app } = buildServer({ registry: new InMemoryTenantRegistry([tenant]), crm: { writeCall: async () => {} }, providerSecret: "p", queue: broken, log: (l) => lines.push(l) });
    const res = await app.inject({ method: "POST", url: "/webhooks/dograh", headers: { authorization: "Bearer tok", "content-type": "application/json" }, payload: JSON.stringify(payload) });
    expect(res.statusCode).toBe(500);
    expect(lines.some((l) => l.includes("enqueue failed"))).toBe(true);
  });
});
