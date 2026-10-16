import { describe, expect, it } from "vitest";
import { InMemoryBookingStore } from "../src/bookingStore.js";
import { LocalScheduler } from "../src/localScheduler.js";
import { buildServer } from "../src/server.js";
import { InMemoryTenantRegistry } from "../src/tenants.js";
import type { CrmWriter } from "../src/crm.js";
import type { Tenant } from "../src/types.js";

const mk = (id: string, token: string, number: string): Tenant => ({
  id,
  name: id,
  defaultRegion: "GB",
  twenty: { baseUrl: "http://x", apiKey: "k", ingestSecret: "s" },
  numbers: [number],
  dograhWebhookToken: token,
  booking: { timeZone: "Europe/London", days: [1, 2, 3, 4, 5], open: "09:00", close: "17:00", slotMinutes: 30 },
});
const crm: CrmWriter = { writeCall: async () => {} };
const NOW = Date.parse("2030-01-01T12:00:00Z");
const a = { authorization: "Bearer tok_a" };
const b = { authorization: "Bearer tok_b" };
const MON = "2030-01-07";
const TUE = "2030-01-08";

function setup() {
  const store = new InMemoryBookingStore();
  const local = new LocalScheduler(() => NOW, store);
  const registry = new InMemoryTenantRegistry([mk("a", "tok_a", "+442070000001"), mk("b", "tok_b", "+442070000002")]);
  const app = buildServer({ registry, crm, providerSecret: "p", bookings: store, scheduler: () => local }).app;
  const post = (url: string, headers: Record<string, string>, payload?: unknown) =>
    app.inject({ method: "POST", url, headers: { ...headers, "content-type": "application/json" }, payload: JSON.stringify(payload ?? {}) });
  const list = async (headers = a) => (await app.inject({ method: "GET", url: "/api/bookings?from=2030-01-01T00:00:00Z&to=2030-02-01T00:00:00Z", headers })).json().bookings as Array<{ uid: string; start: string; name: string }>;
  return { app, post, list };
}

describe("staff booking API", () => {
  it("needs the token", async () => {
    const { app, post } = setup();
    expect((await app.inject({ method: "GET", url: `/api/slots?day=${TUE}` })).statusCode).toBe(401);
    expect((await post("/api/bookings", {}, { start: `${TUE}T09:00:00+00:00`, name: "X" })).statusCode).toBe(401);
  });

  it("lists free times for a day and rejects a bad day", async () => {
    const { app } = setup();
    const ok = await app.inject({ method: "GET", url: `/api/slots?day=${TUE}`, headers: a });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().slots[0].start).toBe(`${TUE}T09:00:00+00:00`);
    expect(ok.json().slots.length).toBe(16);
    expect((await app.inject({ method: "GET", url: "/api/slots?day=tuesday", headers: a })).statusCode).toBe(400);
  });

  it("books by hand, applies the same rules, and refuses a double booking", async () => {
    const { post, list } = setup();
    const first = await post("/api/bookings", a, { start: `${TUE}T09:00:00+00:00`, name: "Walk In", reason: "boiler" });
    expect(first.statusCode).toBe(200);
    expect(first.json().booked).toBe(true);
    expect((await list()).map((x) => x.name)).toEqual(["Walk In"]);
    expect((await post("/api/bookings", a, { start: `${TUE}T09:00:00+00:00`, name: "Other" })).statusCode).toBe(409);
    expect((await post("/api/bookings", a, { start: `${TUE}T20:00:00+00:00`, name: "Late" })).statusCode).toBe(409); // after closing
    expect((await post("/api/bookings", a, { start: "2030-01-12T10:00:00+00:00", name: "Sat" })).statusCode).toBe(409); // Saturday
    expect((await post("/api/bookings", a, { name: "No time" })).statusCode).toBe(400);
  });

  it("moves a booking, and leaves it alone if the new time is taken", async () => {
    const { post, list } = setup();
    const x = (await post("/api/bookings", a, { start: `${TUE}T09:00:00+00:00`, name: "Ann" })).json().confirmation as string;
    await post("/api/bookings", a, { start: `${TUE}T10:00:00+00:00`, name: "Bob" });
    const taken = await post(`/api/bookings/${x}/move`, a, { start: `${TUE}T10:00:00+00:00` });
    expect(taken.statusCode).toBe(409);
    expect((await list()).map((r) => `${r.name}@${r.start}`)).toContain(`Ann@${TUE}T09:00:00.000Z`);
    const moved = await post(`/api/bookings/${x}/move`, a, { start: `${TUE}T11:00:00+00:00` });
    expect(moved.statusCode).toBe(200);
    expect((await list()).map((r) => `${r.name}@${r.start}`)).toEqual([`Bob@${TUE}T10:00:00.000Z`, `Ann@${TUE}T11:00:00.000Z`]);
  });

  it("cancels, and cannot cancel twice", async () => {
    const { post, list } = setup();
    const uid = (await post("/api/bookings", a, { start: `${MON}T09:00:00+00:00`, name: "Cat" })).json().confirmation as string;
    expect((await post(`/api/bookings/${uid}/cancel`, a)).statusCode).toBe(200);
    expect(await list()).toEqual([]);
    expect((await post(`/api/bookings/${uid}/cancel`, a)).statusCode).toBe(404);
  });

  it("keeps clients apart", async () => {
    const { post, list } = setup();
    const uid = (await post("/api/bookings", a, { start: `${MON}T09:00:00+00:00`, name: "Dee" })).json().confirmation as string;
    expect((await post(`/api/bookings/${uid}/cancel`, b)).statusCode).toBe(404);
    expect((await post(`/api/bookings/${uid}/move`, b, { start: `${MON}T10:00:00+00:00` })).statusCode).toBe(404);
    expect(await list(a)).toHaveLength(1);
    expect(await list(b)).toHaveLength(0);
  });

  it("a caller on the phone cannot use the staff override", async () => {
    const { post } = setup();
    const uid = (await post("/api/bookings", a, { start: `${MON}T09:00:00+00:00`, name: "Eve" })).json().confirmation as string;
    const r = await post("/tools/cancel", a, { appointment_id: uid, caller_number: "staff:*" });
    expect(r.statusCode).toBe(422);
  });
});
