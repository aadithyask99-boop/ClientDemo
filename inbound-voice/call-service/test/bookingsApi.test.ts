import { describe, expect, it } from "vitest";
import { InMemoryBookingStore } from "../src/bookingStore.js";
import { buildServer } from "../src/server.js";
import { InMemoryTenantRegistry } from "../src/tenants.js";
import type { CrmWriter } from "../src/crm.js";
import type { Tenant } from "../src/types.js";

const mk = (id: string, token: string): Tenant => ({
  id,
  name: id,
  defaultRegion: "GB",
  twenty: { baseUrl: "http://x", apiKey: "k", ingestSecret: "s" },
  numbers: [`+44207000${id === "a" ? "001" : "002"}`],
  dograhWebhookToken: token,
  booking: { timeZone: "Europe/London", days: [1, 2, 3, 4, 5], open: "09:00", close: "17:00", slotMinutes: 30 },
});
const crm: CrmWriter = { writeCall: async () => {} };

async function setup() {
  const bookings = new InMemoryBookingStore();
  await bookings.reserve("a", "2030-01-07T09:00:00.000Z", { uid: "u1", name: "Nim", phone: "+447000000001", reason: "dripping tap" });
  await bookings.reserve("a", "2030-01-08T10:00:00.000Z", { uid: "u2", name: "Joe" });
  await bookings.reserve("b", "2030-01-07T09:00:00.000Z", { uid: "u3", name: "Other tenant" });
  const registry = new InMemoryTenantRegistry([mk("a", "tok_a"), mk("b", "tok_b")]);
  return buildServer({ registry, crm, providerSecret: "p", bookings }).app;
}

describe("GET /api/bookings", () => {
  it("rejects a missing or wrong token", async () => {
    const app = await setup();
    expect((await app.inject({ method: "GET", url: "/api/bookings" })).statusCode).toBe(401);
    expect((await app.inject({ method: "GET", url: "/api/bookings", headers: { authorization: "Bearer nope" } })).statusCode).toBe(401);
  });

  it("lists only the calling tenant's bookings in range, soonest first", async () => {
    const app = await setup();
    const res = await app.inject({ method: "GET", url: "/api/bookings?from=2030-01-01T00:00:00Z&to=2030-02-01T00:00:00Z", headers: { authorization: "Bearer tok_a" } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.timeZone).toBe("Europe/London");
    expect(body.bookings.map((b: { uid: string }) => b.uid)).toEqual(["u1", "u2"]);
    expect(body.bookings[0].reason).toBe("dripping tap");
  });

  it("applies the range and rejects bad dates", async () => {
    const app = await setup();
    const h = { authorization: "Bearer tok_a" };
    const narrow = await app.inject({ method: "GET", url: "/api/bookings?from=2030-01-08T00:00:00Z&to=2030-01-09T00:00:00Z", headers: h });
    expect(narrow.json().bookings.map((b: { uid: string }) => b.uid)).toEqual(["u2"]);
    expect((await app.inject({ method: "GET", url: "/api/bookings?from=banana", headers: h })).statusCode).toBe(400);
  });
});
