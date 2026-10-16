import { readFileSync } from "node:fs";
import pg from "pg";
import { InMemoryBookingStore, PgBookingStore, type BookingStore } from "./bookingStore.js";
import { fromPg, migrate } from "./db.js";
import { InMemoryCallFactStore, PgCallFactStore, type CallFactStore } from "./facts.js";
import { ArtifactCopyingWriter, LocalArtifactStore } from "./artifacts.js";
import { TwentyIngestWriter } from "./crm.js";
import { buildServer, makeCrmHandler } from "./server.js";
import { PgOutboxQueue } from "./pgQueue.js";
import { GoogleCalendarClient, MicrosoftCalendarClient, type CalendarClient } from "./calendar.js";
import { schedulerSelector } from "./calendarScheduler.js";
import { LocalScheduler } from "./localScheduler.js";
import { InMemoryTenantRegistry } from "./tenants.js";
import type { CallRecord, Tenant } from "./types.js";

const providerSecret = process.env.PROVIDER_WEBHOOK_SECRET;
if (!providerSecret) throw new Error("PROVIDER_WEBHOOK_SECRET is required");

// Scaffold: tenants come from a JSON file (array of Tenant) until the Postgres-backed registry exists.
const tenants: Tenant[] = process.env.TENANTS_FILE ? JSON.parse(readFileSync(process.env.TENANTS_FILE, "utf8")) : [];
const registry = new InMemoryTenantRegistry(tenants);

const artifactDir = process.env.ARTIFACT_DIR;
const allowedHosts = process.env.ARTIFACT_ALLOWED_HOSTS?.split(",").map((h) => h.trim()).filter(Boolean);
const store = artifactDir ? new LocalArtifactStore(artifactDir, allowedHosts ? { allowedHosts } : {}) : null;

// With DATABASE_URL, bookings and call facts live in Postgres (restart-safe, shared by every process).
// Without it everything is held in memory and lost on restart: fine for a demo, not for a client.
let bookings: BookingStore = new InMemoryBookingStore();
let facts: CallFactStore = new InMemoryCallFactStore();
let durableQueue: PgOutboxQueue<CallRecord> | undefined;
const log = (line: string) => console.log(new Date().toISOString(), line);
const crm = new ArtifactCopyingWriter(new TwentyIngestWriter(fetch, log), store);
if (process.env.DATABASE_URL) {
  const sql = fromPg(new pg.Pool({ connectionString: process.env.DATABASE_URL }));
  await migrate(sql);
  bookings = new PgBookingStore(sql);
  facts = new PgCallFactStore(sql);
  // Calls are stored before the provider is told 202, and retried for hours if Twenty is down.
  durableQueue = new PgOutboxQueue<CallRecord>(sql, makeCrmHandler(registry, crm), {
    onEvent: (e) => log(`crm-write ${e.type} id=${e.id} attempts=${e.attempts}${e.error ? ` error=${e.error}` : ""}`),
    onError: (err) => log(`queue error: ${(err as Error).message}`),
  });
  durableQueue.start();
  setInterval(() => void durableQueue?.purgeDone(7 * 86_400_000).catch(() => {}), 3_600_000).unref();
  console.log("storage: postgres (bookings, call facts, post-call queue)");
} else {
  console.warn("storage: IN MEMORY (set DATABASE_URL to keep bookings, call facts and unwritten calls across restarts)");
}

const local = new LocalScheduler(Date.now, bookings);
// Platform-wide OAuth apps (one per provider); each client only supplies a refresh token from their one-time consent.
const calendars: Partial<Record<"google" | "microsoft", CalendarClient>> = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  calendars.google = new GoogleCalendarClient({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET });
}
if (process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET) {
  calendars.microsoft = new MicrosoftCalendarClient({ clientId: process.env.MS_CLIENT_ID, clientSecret: process.env.MS_CLIENT_SECRET, ...(process.env.MS_AUTHORITY ? { authority: process.env.MS_AUTHORITY } : {}) });
}

const { app } = buildServer({
  registry,
  facts,
  bookings,
  ...(durableQueue ? { queue: durableQueue } : {}),
  // Tenants with a connected calendar check and write it; everyone else gets the built-in slots only.
  scheduler: schedulerSelector(tenants, local, bookings, calendars),
  crm,
  providerSecret,
  log,
});
const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
console.log(`call-service listening on ${port} with ${tenants.length} tenant(s)`);
