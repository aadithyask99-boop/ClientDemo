import { TwentyIngestWriter } from "./crm.js";
import { buildServer } from "./server.js";
import { InMemoryTenantRegistry } from "./tenants.js";

const providerSecret = process.env.PROVIDER_WEBHOOK_SECRET;
if (!providerSecret) throw new Error("PROVIDER_WEBHOOK_SECRET is required");

// Scaffold: no tenants until the Postgres-backed registry exists. Add one in code to try the flow locally.
const registry = new InMemoryTenantRegistry([]);

const { app } = buildServer({ registry, crm: new TwentyIngestWriter(), providerSecret });
const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
console.log(`call-service listening on ${port}`);
