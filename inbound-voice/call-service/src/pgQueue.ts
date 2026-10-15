import { PermanentError } from "./crm.js";
import type { Sql } from "./db.js";
import type { JobQueue } from "./queue.js";

interface Claimed<T> {
  id: number;
  job_key: string;
  payload: T;
  attempts: number;
  version: number;
}

export interface PgQueueOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  /** How often to look for due jobs (retries that have waited long enough, jobs left by a crashed process). */
  pollMs?: number;
  /** How long a worker may hold a job before another process may take it over. */
  lockMs?: number;
  onEvent?: (e: { type: "ok" | "retry" | "dead"; id: string; attempts: number; error?: string }) => void;
  onError?: (err: unknown) => void;
  /** Start work as soon as a job is stored (default true). Tests turn it off to simulate a process that stores a job and dies. */
  runOnEnqueue?: boolean;
}

/**
 * Durable queue in Postgres (the "outbox" pattern). `enqueue` resolves only after the job is stored, so the caller can
 * acknowledge a webhook knowing the work survives a crash. Several processes may run workers: claiming uses
 * FOR UPDATE SKIP LOCKED, so a job is handled by one worker at a time. Delivery is at least once: a handler that
 * finishes just as its process dies runs again, so handlers must be idempotent (the Twenty write upserts on providerCallId).
 */
export class PgOutboxQueue<T> implements JobQueue<T> {
  private timer: NodeJS.Timeout | undefined;
  private current: Promise<void> = Promise.resolve();
  private draining = false;
  private again = false;

  constructor(
    private readonly sql: Sql,
    private readonly handler: (payload: T) => Promise<void>,
    private readonly opts: PgQueueOptions = {},
  ) {}

  /** Starts polling. Call once after construction. */
  start(): void {
    this.timer = setInterval(() => void this.kick(), this.opts.pollMs ?? 2000);
    this.timer.unref();
    void this.kick();
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.current;
  }

  async enqueue(key: string, payload: T): Promise<void> {
    await this.sql.query(
      `INSERT INTO outbox (job_key, payload) VALUES ($1, $2::jsonb)
       ON CONFLICT (job_key) DO UPDATE
         SET payload = EXCLUDED.payload, version = outbox.version + 1, status = 'pending', attempts = 0,
             next_attempt_at = now(), locked_until = NULL, last_error = NULL, updated_at = now()`,
      [key, JSON.stringify(payload)],
    );
    if (this.opts.runOnEnqueue !== false) void this.kick();
  }

  async idle(): Promise<void> {
    for (;;) {
      await this.current;
      const { rows } = await this.sql.query<{ n: string | number }>(`SELECT count(*) AS n FROM outbox WHERE status IN ('pending', 'running')`);
      if (Number(rows[0]?.n ?? 0) === 0) return;
      await new Promise((r) => setTimeout(r, 5));
    }
  }

  async deadLetters(): Promise<Array<{ key: string; attempts: number; error: string }>> {
    const { rows } = await this.sql.query<{ job_key: string; attempts: number; last_error: string | null }>(
      `SELECT job_key, attempts, last_error FROM outbox WHERE status = 'dead' ORDER BY id`,
    );
    return rows.map((r) => ({ key: r.job_key, attempts: r.attempts, error: r.last_error ?? "" }));
  }

  /** Finished jobs keep no payload (call summaries and messages are personal data); this removes the empty rows too. */
  async purgeDone(olderThanMs: number): Promise<void> {
    await this.sql.query(`DELETE FROM outbox WHERE status = 'done' AND updated_at < now() - $1::int * interval '1 millisecond'`, [olderThanMs]);
  }

  private kick(): Promise<void> {
    if (this.draining) {
      this.again = true;
      return this.current;
    }
    this.draining = true;
    this.current = this.drain().finally(() => {
      this.draining = false;
    });
    return this.current;
  }

  private async drain(): Promise<void> {
    try {
      do {
        this.again = false;
        for (;;) {
          const job = await this.claim();
          if (!job) break;
          await this.process(job);
        }
      } while (this.again);
    } catch (err) {
      this.opts.onError?.(err); // e.g. database unreachable: the poll timer tries again
    }
  }

  private async claim(): Promise<Claimed<T> | undefined> {
    const { rows } = await this.sql.query<Claimed<T>>(
      `UPDATE outbox SET status = 'running', attempts = attempts + 1,
              locked_until = now() + $1::int * interval '1 millisecond', updated_at = now()
       WHERE id = (
         SELECT id FROM outbox
         WHERE (status = 'pending' AND next_attempt_at <= now()) OR (status = 'running' AND locked_until < now())
         ORDER BY next_attempt_at LIMIT 1 FOR UPDATE SKIP LOCKED)
       RETURNING id, job_key, payload, attempts, version`,
      [this.opts.lockMs ?? 120_000],
    );
    return rows[0];
  }

  private async process(job: Claimed<T>): Promise<void> {
    const max = this.opts.maxAttempts ?? 12;
    const base = this.opts.baseDelayMs ?? 5000;
    try {
      await this.handler(job.payload);
      // Version-guarded: if the call was delivered again meanwhile, that newer job stays pending.
      await this.sql.query(`UPDATE outbox SET status = 'done', payload = '{}'::jsonb, locked_until = NULL, last_error = NULL, updated_at = now() WHERE id = $1 AND version = $2`, [job.id, job.version]);
      this.opts.onEvent?.({ type: "ok", id: job.job_key, attempts: job.attempts });
    } catch (err) {
      const message = (err as Error).message;
      if (err instanceof PermanentError || job.attempts >= max) {
        await this.sql.query(`UPDATE outbox SET status = 'dead', locked_until = NULL, last_error = $3, updated_at = now() WHERE id = $1 AND version = $2`, [job.id, job.version, message]);
        this.opts.onEvent?.({ type: "dead", id: job.job_key, attempts: job.attempts, error: message });
      } else {
        const delay = base * 2 ** (job.attempts - 1);
        await this.sql.query(
          `UPDATE outbox SET status = 'pending', locked_until = NULL, last_error = $3, next_attempt_at = now() + $4::int * interval '1 millisecond', updated_at = now()
           WHERE id = $1 AND version = $2`,
          [job.id, job.version, message, Math.min(delay, 3_600_000)],
        );
        this.opts.onEvent?.({ type: "retry", id: job.job_key, attempts: job.attempts, error: message });
      }
    }
  }
}
