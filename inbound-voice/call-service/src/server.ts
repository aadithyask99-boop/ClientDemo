import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { CrmWriter } from "./crm.js";
import { RetryQueue } from "./queue.js";
import { verify } from "./signing.js";
import type { TenantRegistry } from "./tenants.js";
import { OUTCOMES, type CallRecord } from "./types.js";
import { toE164 } from "./phone.js";
import { dograhPayload, toCallRecord } from "./dograh.js";

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
  queue?: RetryQueue<CallRecord>;
  /** Optional line logger for operations (webhook received, write retried, dead-lettered). */
  log?: (line: string) => void;
}

export function buildServer(deps: ServerDeps): { app: FastifyInstance; queue: RetryQueue<CallRecord> } {
  const app = Fastify({ logger: false });

  // Keep the raw body: signatures are verified over the exact bytes received.
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    done(null, body);
  });

  const queue =
    deps.queue ??
    new RetryQueue<CallRecord>(
      async (record) => {
        const tenant = deps.registry.byId(record.tenantId);
        if (!tenant) throw new Error(`Unknown tenant ${record.tenantId}`);
        await deps.crm.writeCall(tenant, record);
      },
      {
        onEvent: (e) =>
          deps.log?.(`crm-write ${e.type} id=${e.id} attempts=${e.attempts}${e.error ? ` error=${e.error}` : ""}`),
      },
    );

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
    queue.enqueue(record.providerCallId, record);
    return reply.code(202).send({ accepted: true });
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
    deps.log?.(`dograh webhook accepted id=${record.providerCallId} tenant=${tenant.id} outcome=${record.outcome}`);
    // Dograh retries failed deliveries and may deliver twice; the queue key and Twenty's upsert on providerCallId absorb that.
    queue.enqueue(record.providerCallId, record);
    return reply.code(202).send({ accepted: true });
  });

  return { app, queue };
}
