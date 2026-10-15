import { readFileSync } from "node:fs";
import { ArtifactCopyingWriter, LocalArtifactStore } from "./artifacts.js";
import { TwentyIngestWriter } from "./crm.js";
import { buildServer } from "./server.js";
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

const { app } = buildServer({ registry, crm: new ArtifactCopyingWriter(new TwentyIngestWriter(), store), providerSecret });
const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
console.log(`call-service listening on ${port} with ${tenants.length} tenant(s)`);
