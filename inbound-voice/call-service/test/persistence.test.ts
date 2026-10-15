import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PgBookingStore } from "../src/bookingStore.js";
import { fromPg, migrate, type Sql } from "../src/db.js";
import { PgCallFactStore } from "../src/facts.js";
import { LocalScheduler, SlotUnavailableError } from "../src/localScheduler.js";
import type { Tenant } from "../src/types.js";

// PGlite is real Postgres compiled to WASM, so these tests run the same SQL production runs.
const NOW = Date.parse("2026-10-15T10:00:00Z");
const tenant = { id: "t1" } as Tenant;
const other = { id: "t2" } as Tenant;
const START = "2026-10-20T09:00:00.000Z"; // Tuesday 09:00 in London (BST ends 25 Oct)
const attendee = { name: "Sam Rivera", timeZone: "Europe/London", phoneNumber: "+447400123456" };

// By default the suite runs on PGlite (one in-process connection). With TEST_DATABASE_URL set it runs the same tests
// through the `pg` driver against a real server, where simultaneous bookings really are separate connections.
const realUrl = process.env.TEST_DATABASE_URL;
let pool: pg.Pool | undefined;
let sql: Sql;
beforeEach(async () => {
  if (realUrl) {
    pool ??= new pg.Pool({ connectionString: realUrl, max: 8 });
    sql = fromPg(pool);
    await sql.query("DROP TABLE IF EXISTS bookings, call_facts");
  } else {
    const db = new PGlite();
    sql = { query: async (text, params) => ({ rows: (await db.query(text, params as unknown[])).rows as never[] }) };
  }
  await migrate(sql);
});
afterAll(async () => {
  await pool?.end();
});

describe("migrate", () => {
  it("can run twice", async () => {
    await migrate(sql);
    await migrate(sql);
  });
});

describe("PgCallFactStore", () => {
  it("returns nothing for an unknown call", async () => {
    expect(await new PgCallFactStore(sql).get("t1", "dograh:1")).toBeUndefined();
  });

  it("merges facts the way the in-memory store does, and survives a new store instance (a restart)", async () => {
    await new PgCallFactStore(sql).record("t1", "dograh:1", { message: { body: "Call me", urgent: true, callbackNumber: "+447400123456" } });
    await new PgCallFactStore(sql).record("t1", "dograh:1", { outcome: { code: "CALLBACK_REQUESTED", note: "after 4pm" } });
    const got = await new PgCallFactStore(sql).get("t1", "dograh:1");
    expect(got?.message).toEqual({ body: "Call me", urgent: true, callbackNumber: "+447400123456" });
    expect(got?.outcome).toEqual({ code: "CALLBACK_REQUESTED", note: "after 4pm" });
  });

  it("a later fact of the same kind replaces the earlier one", async () => {
    const s = new PgCallFactStore(sql);
    await s.record("t1", "dograh:1", { outcome: { code: "INFO_GIVEN" } });
    await s.record("t1", "dograh:1", { outcome: { code: "OPTED_OUT" } });
    expect((await s.get("t1", "dograh:1"))?.outcome?.code).toBe("OPTED_OUT");
  });

  it("keeps tenants apart even when the call IDs match", async () => {
    const s = new PgCallFactStore(sql);
    await s.record("t1", "dograh:1", { outcome: { code: "OPTED_OUT" } });
    expect(await s.get("t2", "dograh:1")).toBeUndefined();
  });
});

describe("LocalScheduler on Postgres", () => {
  const scheduler = () => new LocalScheduler(() => NOW, new PgBookingStore(sql));
  const hasSlot = async (s: LocalScheduler, t: Tenant) => (await s.availableSlots(t, { start: "2026-10-20", end: "2026-10-20" })).some((x) => x.start === START);

  it("a booking removes the slot, and still does after a restart", async () => {
    expect(await hasSlot(scheduler(), tenant)).toBe(true);
    await scheduler().book(tenant, { start: START, attendee });
    expect(await hasSlot(scheduler(), tenant)).toBe(false); // a brand new scheduler, as after a restart
    expect(await hasSlot(scheduler(), other)).toBe(true); // other tenants are unaffected
  });

  it("stores the booking with the attendee details", async () => {
    await scheduler().book(tenant, { start: START, attendee });
    const { rows } = await sql.query<{ attendee_name: string; attendee_phone: string; uid: string }>(`SELECT attendee_name, attendee_phone, uid FROM bookings`);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ attendee_name: "Sam Rivera", attendee_phone: "+447400123456" });
    expect(rows[0]!.uid).toMatch(/^loc_/);
  });

  it("two simultaneous callers for the same slot: exactly one wins", async () => {
    // Separate scheduler instances stand in for separate call-service processes sharing one database.
    const results = await Promise.allSettled([
      scheduler().book(tenant, { start: START, attendee: { ...attendee, name: "A" } }),
      scheduler().book(tenant, { start: START, attendee: { ...attendee, name: "B" } }),
      scheduler().book(tenant, { start: START, attendee: { ...attendee, name: "C" } }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results) if (r.status === "rejected") expect(r.reason).toBeInstanceOf(SlotUnavailableError);
    const { rows } = await sql.query(`SELECT 1 FROM bookings`);
    expect(rows).toHaveLength(1);
  });

  it("a taken slot is rejected even if the booker did not see the availability first", async () => {
    await scheduler().book(tenant, { start: START, attendee });
    await expect(scheduler().book(tenant, { start: START, attendee })).rejects.toBeInstanceOf(SlotUnavailableError);
  });
});
