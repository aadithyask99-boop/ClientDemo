import { readFileSync } from "node:fs";
import { ArtifactCopyingWriter, LocalArtifactStore } from "./artifacts.js";
import { TwentyIngestWriter } from "./crm.js";
import { buildServer } from "./server.js";
import { LocalScheduler } from "./localScheduler.js";
import { CalDiyScheduler } from "./scheduler.js";
import { InMemoryTenantRegistry } from "./tenants.js";
import type { Tenant } from "./types.js";

const providerSecret = process.env.PROVIDER_WEBHOOK_SECRET;
if (!providerSecret) throw new Error("PROVIDER_WEBHOOK_SECRET is required");

// Scaffold: tenants come from a JSON file (array of Tenant) until the Postgres-backed registry exists.
const tenants: Tenant[] = process.env.TENANTS_FILE ? JSON.parse(readFileSync(process.env.TENANTS_FILE, "utf8")) : [];
const registry = new InMemoryTenantRegistry(tenants);

const artifactDir = process.env.ARTIFACT_DIR;
const allowedHosts = process.env.ARTIFACT_ALLOWED_HOSTS?.split(",").map((h) => h.trim()).filter(Boolean);
const store = artifactDir ? new LocalArtifactStore(artifactDir, allowedHosts ? { allowedHosts } : {}) : null;

const local = new LocalScheduler();
const calDiy = new CalDiyScheduler();

const { app } = buildServer({
  registry,
  // Tenants with a Cal.diy configuration use it; everyone else gets the built-in scheduler.
  scheduler: (tenant) => (tenant.calDiy ? calDiy : local),
  crm: new ArtifactCopyingWriter(new TwentyIngestWriter(), store),
  providerSecret,
  log: (line) => console.log(new Date().toISOString(), line),
});
const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
console.log(`call-service listening on ${port} with ${tenants.length} tenant(s)`);
