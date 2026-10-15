import { PermanentError } from "./crm.js";

export interface Job<T> {
  id: string;
  payload: T;
  attempts: number;
}

export interface DeadLetter<T> {
  job: Job<T>;
  error: string;
}

/**
 * In-process queue with exponential backoff and a dead-letter list.
 * Scaffold only: it loses jobs on restart. Swap for BullMQ (Redis) before Phase 1 acceptance;
 * the handler contract (throw to retry, PermanentError to dead-letter) stays the same.
 */
export class RetryQueue<T> {
  readonly deadLetters: DeadLetter<T>[] = [];
  private pending = 0;

  constructor(
    private readonly handler: (payload: T) => Promise<void>,
    private readonly opts: {
      maxAttempts?: number;
      baseDelayMs?: number;
      /** Observability hook: called after each failed attempt ("retry"), on dead-lettering ("dead") and on success ("ok"). */
      onEvent?: (e: { type: "ok" | "retry" | "dead"; id: string; attempts: number; error?: string }) => void;
    } = {},
  ) {}

  enqueue(id: string, payload: T): void {
    this.pending++;
    void this.run({ id, payload, attempts: 0 });
  }

  /** Resolves when no jobs are in flight. Used by tests and graceful shutdown. */
  async idle(): Promise<void> {
    while (this.pending > 0) await new Promise((r) => setTimeout(r, 5));
  }

  private async run(job: Job<T>): Promise<void> {
    const max = this.opts.maxAttempts ?? 6;
    const base = this.opts.baseDelayMs ?? 1000;
    for (;;) {
      job.attempts++;
      try {
        await this.handler(job.payload);
        this.opts.onEvent?.({ type: "ok", id: job.id, attempts: job.attempts });
        break;
      } catch (err) {
        const permanent = err instanceof PermanentError;
        const message = (err as Error).message;
        if (permanent || job.attempts >= max) {
          this.deadLetters.push({ job, error: message });
          this.opts.onEvent?.({ type: "dead", id: job.id, attempts: job.attempts, error: message });
          break;
        }
        this.opts.onEvent?.({ type: "retry", id: job.id, attempts: job.attempts, error: message });
        await new Promise((r) => setTimeout(r, base * 2 ** (job.attempts - 1)));
      }
    }
    this.pending--;
  }
}
