// Posts a signed record straight to the Twenty ingest route and prints status and body. Debug helper.
// Usage: node ingest-direct.mjs [baseUrl] [secret]   (defaults: http://localhost:2020, spike-test-secret)
import { createHmac } from "node:crypto";

const base = process.argv[2] ?? "http://localhost:2020";
const secret = process.argv[3] ?? "spike-test-secret";
const stamp = Date.now();
// Shaped like what call-service builds from a Dograh webhook with no caller number and no recording.
const records = {
  "dograh-like (empty summary, 0s)": { providerCallId: `dograh:debug-${stamp}-a`, tenantId: "client-a", direction: "INBOUND", callerNumber: "unknown", startedAt: "2026-10-15T14:52:21.000Z", endedAt: "2026-10-15T14:52:21.000Z", durationSeconds: 0, outcome: "NO_OUTCOME", summary: "" },
  "with summary and duration": { providerCallId: `dograh:debug-${stamp}-b`, tenantId: "client-a", direction: "INBOUND", callerNumber: "+447400123456", startedAt: "2026-10-15T14:52:21.000Z", endedAt: "2026-10-15T14:53:21.000Z", durationSeconds: 60, outcome: "BOOKED", summary: "ok" },
};
for (const [name, rec] of Object.entries(records)) {
  const body = JSON.stringify(rec);
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
  const r = await fetch(`${base}/s/ingest-call`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-callservice-timestamp": ts, "x-callservice-signature": sig },
    body,
  });
  console.log(name.padEnd(34), r.status, (await r.text()).replace(/\s+/g, " ").slice(0, 300));
}
