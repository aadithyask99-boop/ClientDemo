import { describe, expect, it } from "vitest";
import { CalDiyScheduler } from "../src/scheduler.js";
import { lookupPersonByPhone } from "../src/crm.js";
import type { Tenant } from "../src/types.js";

const tenant: Tenant = {
  id: "t1",
  name: "Acme",
  defaultRegion: "GB",
  twenty: { baseUrl: "https://acme.crm.example.com", apiKey: "twk", ingestSecret: "x" },
  calDiy: { baseUrl: "https://cal.example.com", apiKey: "cal_key", eventTypeId: 42 },
  numbers: [],
};

describe("CalDiyScheduler (request shape; response shape unverified against a live server)", () => {
  it("requests slots with the pinned version header and flattens by-date results", async () => {
    let url = "";
    let headers: Record<string, string> = {};
    const fetchImpl = (async (u: URL, init: RequestInit) => {
      url = u.toString();
      headers = init.headers as Record<string, string>;
      return new Response(JSON.stringify({ data: { "2026-10-20": [{ start: "a" }, { start: "b" }], "2026-10-21": [{ start: "c" }] } }));
    }) as unknown as typeof fetch;
    const slots = await new CalDiyScheduler(fetchImpl).availableSlots(tenant, {
      start: "2026-10-20",
      end: "2026-10-22",
      timeZone: "Europe/London",
    });
    expect(slots.map((s) => s.start)).toEqual(["a", "b", "c"]);
    expect(url).toContain("/v2/slots");
    expect(url).toContain("eventTypeId=42");
    expect(headers["cal-api-version"]).toBe("2024-09-04");
    expect(headers.authorization).toBe("Bearer cal_key");
  });

  it("books and returns the uid, and fails loudly on errors or a missing uid", async () => {
    const ok = (async () => new Response(JSON.stringify({ data: { uid: "bk_1" } }))) as unknown as typeof fetch;
    const req = { start: "2026-10-20T10:00:00Z", attendee: { name: "A", email: "a@b.co", timeZone: "Europe/London" } };
    expect(await new CalDiyScheduler(ok).book(tenant, req)).toEqual({ bookingUid: "bk_1" });
    const bad = (async () => new Response("", { status: 500 })) as unknown as typeof fetch;
    await expect(new CalDiyScheduler(bad).book(tenant, req)).rejects.toThrow(/500/);
    const noUid = (async () => new Response(JSON.stringify({ data: {} }))) as unknown as typeof fetch;
    await expect(new CalDiyScheduler(noUid).book(tenant, req)).rejects.toThrow(/uid/);
  });

  it("refuses tenants without Cal.diy configured", async () => {
    await expect(
      new CalDiyScheduler().availableSlots({ ...tenant, calDiy: null }, { start: "a", end: "b", timeZone: "UTC" }),
    ).rejects.toThrow(/no Cal.diy/);
  });
});

describe("lookupPersonByPhone", () => {
  it("never throws: timeouts, errors and bad bodies all return null", async () => {
    const boom = (async () => {
      throw new Error("timeout");
    }) as unknown as typeof fetch;
    expect(await lookupPersonByPhone(tenant, "+447400123456", boom)).toBeNull();
    const notOk = (async () => new Response("", { status: 500 })) as unknown as typeof fetch;
    expect(await lookupPersonByPhone(tenant, "+447400123456", notOk)).toBeNull();
    const junk = (async () => new Response("not json")) as unknown as typeof fetch;
    expect(await lookupPersonByPhone(tenant, "+447400123456", junk)).toBeNull();
  });

  it("returns the first match", async () => {
    const hit = (async () => new Response(JSON.stringify({ data: { people: [{ id: "p1" }] } }))) as unknown as typeof fetch;
    expect(await lookupPersonByPhone(tenant, "+447400123456", hit)).toEqual({ id: "p1" });
  });
});
