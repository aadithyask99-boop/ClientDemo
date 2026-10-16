import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { CrmWriter } from "./crm.js";
import { RetryQueue, type JobQueue } from "./queue.js";
import { verify } from "./signing.js";
import type { TenantRegistry } from "./tenants.js";
import { OUTCOMES, type CallRecord } from "./types.js";
import { toE164 } from "./phone.js";
import { dograhPayload, toCallRecord } from "./dograh.js";
import { availabilityInput, bookAppointment, bookInput, cancelAppointment, cancelInput, checkAvailability, findAppointments, findInput, rescheduleAppointment, rescheduleInput, type ManageResult } from "./booking.js";
import { InMemoryCallFactStore, type CallFactStore } from "./facts.js";
import { messageInput, outcomeInput, recordOutcome, takeMessage } from "./callTools.js";
import { LocalScheduler } from "./localScheduler.js";
import type { Scheduler } from "./scheduler.js";
import type { Tenant } from "./types.js";

const callEnded = z.object({
  providerCallId: z.string().min(1),
  dialedNumber: z.string().min(1),
  callerNumber: z.string().min(1),
  startedAt: z.string(),
  endedAt: z.string(),
  durationSeconds: z.number().nonnegative(),
  outcome: z.enum(OUTCOMES),
  summary: z.string().default(""),
  recordingUrl: z.string().url().optional(),
  transcriptUrl: z.string().url().optional(),
  message: z.object({ body: z.string(), callbackNumber: z.string().optional(), urgent: z.boolean() }).optional(),
});

export interface ServerDeps {
  registry: TenantRegistry;
  crm: CrmWriter;
  /** Shared secret with the voice runtime for call-ended events. */
  providerSecret: string;
  queue?: JobQueue<CallRecord>;
  /** Optional line logger for operations (webhook received, write retried, dead-lettered). */
  log?: (line: string) => void;
  /** Facts recorded by our tools during calls (bookings, messages). Defaults to an in-memory store. */
  facts?: CallFactStore;
  /** Which scheduler serves a tenant. Defaults to the built-in LocalScheduler for everyone. */
  scheduler?: (tenant: Tenant) => Scheduler;
}

/** The queue handler: write one finished call to the tenant's CRM. Shared by the default queue and the durable one in main.ts. */
export function makeCrmHandler(registry: TenantRegistry, crm: CrmWriter): (record: CallRecord) => Promise<void> {
  return async (record) => {
    const tenant = registry.byId(record.tenantId);
    if (!tenant) throw new Error(`Unknown tenant ${record.tenantId}`);
    await crm.writeCall(tenant, record);
  };
}

export function buildServer(deps: ServerDeps): { app: FastifyInstance; queue: JobQueue<CallRecord> } {
  const app = Fastify({ logger: false });

  // Keep the raw body: signatures are verified over the exact bytes received.
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    done(null, body);
  });

  const facts = deps.facts ?? new InMemoryCallFactStore();
  const local = new LocalScheduler();
  const bookingDeps = { scheduler: deps.scheduler ?? (() => local), facts };

  /** Tools are called by Dograh with the tenant's bearer token (the same one its webhook uses). */
  const toolTenant = (header: string | undefined): Tenant | undefined => {
    const token = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    return token ? deps.registry.byDograhToken(token) : undefined;
  };
  const parseBody = (raw: unknown): unknown => {
    try {
      return JSON.parse(typeof raw === "string" && raw !== "" ? raw : "{}");
    } catch {
      return undefined;
    }
  };

  const queue =
    deps.queue ??
    new RetryQueue<CallRecord>(
      makeCrmHandler(deps.registry, deps.crm),
      {
        onEvent: (e) =>
          deps.log?.(`crm-write ${e.type} id=${e.id} attempts=${e.attempts}${e.error ? ` error=${e.error}` : ""}`),
      },
    );

  /** Hands the call to the queue. False means it was NOT stored, so the caller must not acknowledge it: the provider retries. */
  const store = async (record: CallRecord): Promise<boolean> => {
    try {
      // Keyed per tenant so two tenants' provider IDs can never collide.
      await queue.enqueue(`${record.tenantId}:${record.providerCallId}`, record);
      return true;
    } catch (err) {
      deps.log?.(`enqueue failed tenant=${record.tenantId} id=${record.providerCallId} error=${(err as Error).message}`);
      return false;
    }
  };

  app.get("/healthz", async () => ({ ok: true }));

  app.post("/webhooks/call-ended", async (req, reply) => {
    const rawBody = req.body as string;
    const check = verify({
      secret: deps.providerSecret,
      timestamp: req.headers["x-callservice-timestamp"] as string | undefined,
      signature: req.headers["x-callservice-signature"] as string | undefined,
      rawBody,
    });
    if (!check.ok) return reply.code(401).send({ error: check.reason });

    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return reply.code(400).send({ error: "invalid json" });
    }
    const parsed = callEnded.safeParse(json);
    if (!parsed.success) return reply.code(400).send({ error: "invalid payload", issues: parsed.error.issues });

    const e = parsed.data;
    const dialed = toE164(e.dialedNumber);
    const tenant = dialed ? deps.registry.byDialedNumber(dialed) : undefined;
    if (!tenant) return reply.code(404).send({ error: "no tenant for dialed number" });

    const caller = toE164(e.callerNumber, tenant.defaultRegion as never);
    const record: CallRecord = {
      providerCallId: e.providerCallId,
      tenantId: tenant.id,
      direction: "INBOUND",
      // Withheld or unparsable caller IDs are kept as given so the call is still recorded.
      callerNumber: caller ?? e.callerNumber,
      startedAt: e.startedAt,
      endedAt: e.endedAt,
      durationSeconds: e.durationSeconds,
      outcome: e.outcome,
      summary: e.summary,
      ...(e.recordingUrl || e.transcriptUrl
        ? { sourceArtifacts: { ...(e.recordingUrl ? { recordingUrl: e.recordingUrl } : {}), ...(e.transcriptUrl ? { transcriptUrl: e.transcriptUrl } : {}) } }
        : {}),
      ...(e.message ? { message: e.message } : {}),
    };

    // Acknowledge fast; the Twenty write happens off the request path.
    if (!(await store(record))) return reply.code(500).send({ error: "could not store the call; retry" });
    return reply.code(202).send({ accepted: true });
  });

  app.post("/tools/availability", async (req, reply) => {
    const tenant = toolTenant(req.headers.authorization);
    if (!tenant) return reply.code(401).send({ error: "unauthorized" });
    const parsed = availabilityInput.safeParse(parseBody(req.body));
    if (!parsed.success) return reply.code(400).send({ error: "invalid input", message: parsed.error.issues.map((i) => i.message).join("; ") });
    return reply.code(200).send(await checkAvailability(bookingDeps, tenant, parsed.data));
  });

  app.post("/tools/book", async (req, reply) => {
    const tenant = toolTenant(req.headers.authorization);
    if (!tenant) return reply.code(401).send({ error: "unauthorized" });
    const parsed = bookInput.safeParse(parseBody(req.body));
    if (!parsed.success) return reply.code(400).send({ error: "invalid input", message: parsed.error.issues.map((i) => i.message).join("; ") });
    const result = await bookAppointment(bookingDeps, tenant, parsed.data);
    deps.log?.(`book tenant=${tenant.id} ok=${result.ok} ${result.ok ? result.body.label : result.body.error}`);
    return reply.code(result.ok ? 200 : result.status).send(result.body);
  });

  /** find / cancel / reschedule share one shape: authenticate, validate, run, log, answer. */
  const manage = <S extends z.ZodTypeAny>(path: string, name: string, schema: S, run: (tenant: Tenant, input: z.infer<S>) => Promise<ManageResult>) =>
    app.post(path, async (req, reply) => {
      const tenant = toolTenant(req.headers.authorization);
      if (!tenant) return reply.code(401).send({ error: "unauthorized" });
      const parsed = schema.safeParse(parseBody(req.body));
      if (!parsed.success) return reply.code(400).send({ error: "invalid input", message: parsed.error.issues.map((i) => i.message).join("; ") });
      const result = await run(tenant, parsed.data);
      deps.log?.(`${name} tenant=${tenant.id} ok=${result.ok}${result.ok ? "" : ` ${String(result.body.error)}`}`);
      return reply.code(result.ok ? 200 : result.status).send(result.body);
    });
  manage("/tools/find-appointment", "find", findInput, (t, i) => findAppointments(bookingDeps, t, i));
  manage("/tools/cancel", "cancel", cancelInput, (t, i) => cancelAppointment(bookingDeps, t, i));
  manage("/tools/reschedule", "reschedule", rescheduleInput, (t, i) => rescheduleAppointment(bookingDeps, t, i));

  app.post("/tools/message", async (req, reply) => {
    const tenant = toolTenant(req.headers.authorization);
    if (!tenant) return reply.code(401).send({ error: "unauthorized" });
    const parsed = messageInput.safeParse(parseBody(req.body));
    if (!parsed.success) return reply.code(400).send({ error: "invalid input", message: parsed.error.issues.map((i) => i.message).join("; ") });
    deps.log?.(`message tenant=${tenant.id}`);
    return reply.code(200).send(await takeMessage(facts, tenant, parsed.data));
  });

  app.post("/tools/outcome", async (req, reply) => {
    const tenant = toolTenant(req.headers.authorization);
    if (!tenant) return reply.code(401).send({ error: "unauthorized" });
    const parsed = outcomeInput.safeParse(parseBody(req.body));
    if (!parsed.success) return reply.code(400).send({ error: "invalid input", message: parsed.error.issues.map((i) => i.message).join("; ") });
    deps.log?.(`outcome tenant=${tenant.id} ${parsed.data.outcome}`);
    return reply.code(200).send(await recordOutcome(facts, tenant, parsed.data));
  });

  /** Dograh webhook node: authenticated by a per-tenant bearer token (Dograh does not sign webhooks). */
  app.post("/webhooks/dograh", async (req, reply) => {
    const header = req.headers.authorization;
    const token = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const tenant = token ? deps.registry.byDograhToken(token) : undefined;
    if (!tenant) return reply.code(401).send({ error: "unauthorized" });

    let json: unknown;
    try {
      json = JSON.parse(req.body as string);
    } catch {
      return reply.code(400).send({ error: "invalid json" });
    }
    const parsed = dograhPayload.safeParse(json);
    if (!parsed.success) return reply.code(400).send({ error: "invalid payload", issues: parsed.error.issues });

    const record = toCallRecord(tenant, parsed.data);
    // What our own tools did on this call outranks any classifier guess: booking, then an outcome the agent stated, then a message.
    const known = await facts.get(tenant.id, record.providerCallId);
    // "info given" and "no outcome" are weak statements: a message that was really taken outranks them (the agent often adds one after take_message).
    const weakOutcome = known?.outcome?.code === "INFO_GIVEN" || known?.outcome?.code === "NO_OUTCOME";
    // A booking made and then cancelled on the same call is not a booking.
    const stillBooked = known?.booking && known.cancelled?.uid !== known.booking.uid;
    if (known?.rescheduled) record.summary = `${record.summary} Moved ${known.rescheduled.name}'s appointment from ${known.rescheduled.from} to ${known.rescheduled.to}.`.trim();
    if (known?.cancelled) record.summary = `${record.summary} Cancelled ${known.cancelled.name}'s appointment on ${known.cancelled.label}.`.trim();
    if (stillBooked && known?.booking) {
      record.outcome = "BOOKED";
      if (!known.rescheduled) record.summary = `${record.summary} Booked ${known.booking.label} for ${known.booking.name}.`.trim();
    } else if (known?.cancelled && !known.outcome) {
      record.outcome = "INFO_GIVEN";
    } else if (known?.outcome && !(weakOutcome && known.message)) {
      record.outcome = known.outcome.code;
      if (known.outcome.note) record.summary = `${record.summary} ${known.outcome.note}`.trim();
    }
    const callerName = known?.booking?.name ?? known?.cancelled?.name ?? known?.message?.name;
    if (callerName) record.callerName = callerName;
    if (known?.message) {
      const { name: _name, ...message } = known.message;
      record.message ??= message;
      if (!stillBooked && (!known.outcome || weakOutcome)) record.outcome = "MESSAGE_TAKEN";
    }
    deps.log?.(`dograh webhook accepted id=${record.providerCallId} tenant=${tenant.id} outcome=${record.outcome}`);
    // Dograh retries failed deliveries and may deliver twice; the queue key and Twenty's upsert on providerCallId absorb that.
    if (!(await store(record))) return reply.code(500).send({ error: "could not store the call; retry" });
    return reply.code(202).send({ accepted: true });
  });

  return { app, queue };
}
