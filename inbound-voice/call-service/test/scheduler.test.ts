import { describe, expect, it } from "vitest";
import { lookupPersonByPhone } from "../src/crm.js";
import type { Tenant } from "../src/types.js";

const tenant: Tenant = {
  id: "t1",
  name: "Acme",
  defaultRegion: "GB",
  twenty: { baseUrl: "https://acme.crm.example.com", apiKey: "twk", ingestSecret: "x" },
  numbers: [],
};

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
