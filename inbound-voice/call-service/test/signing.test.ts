import { describe, expect, it } from "vitest";
import { sign, verify } from "../src/signing.js";
import { toE164 } from "../src/phone.js";

const secret = "s3cret";
const body = '{"a":1,  "b":"spaced"}'; // deliberately not canonical JSON

describe("signing", () => {
  const now = 1_800_000_000_000;
  const ts = String(Math.floor(now / 1000));

  it("accepts a valid signature over the raw body", () => {
    const signature = sign(secret, ts, body);
    expect(verify({ secret, timestamp: ts, signature, rawBody: body, now })).toEqual({ ok: true });
  });

  it("rejects a body that was re-serialized", () => {
    const signature = sign(secret, ts, body);
    const reserialized = JSON.stringify(JSON.parse(body));
    expect(verify({ secret, timestamp: ts, signature, rawBody: reserialized, now })).toEqual({
      ok: false,
      reason: "mismatch",
    });
  });

  it("rejects stale timestamps", () => {
    const old = String(Math.floor(now / 1000) - 3600);
    const signature = sign(secret, old, body);
    expect(verify({ secret, timestamp: old, signature, rawBody: body, now })).toEqual({ ok: false, reason: "stale" });
  });

  it("rejects missing headers and wrong secrets", () => {
    expect(verify({ secret, timestamp: undefined, signature: undefined, rawBody: body, now })).toEqual({
      ok: false,
      reason: "missing",
    });
    const signature = sign("other", ts, body);
    expect(verify({ secret, timestamp: ts, signature, rawBody: body, now }).ok).toBe(false);
  });

  it("rejects non-hex or wrong-length signatures without throwing", () => {
    expect(verify({ secret, timestamp: ts, signature: "zz", rawBody: body, now }).ok).toBe(false);
  });
});

describe("toE164", () => {
  it("normalizes formatted and local numbers", () => {
    expect(toE164("+44 7400 123456")).toBe("+447400123456");
    expect(toE164("07400 123456", "GB")).toBe("+447400123456");
  });
  it("returns null for junk", () => {
    expect(toE164("anonymous")).toBeNull();
    expect(toE164("12")).toBeNull();
  });
});
