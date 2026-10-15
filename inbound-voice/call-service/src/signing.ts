import { createHmac, timingSafeEqual } from "node:crypto";

export const SIGNATURE_HEADER = "x-callservice-signature";
export const TIMESTAMP_HEADER = "x-callservice-timestamp";

/** HMAC-SHA256 over `${timestamp}:${rawBody}`, hex encoded. Always sign the raw bytes, never a re-serialized object. */
export function sign(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}:${rawBody}`).digest("hex");
}

export type VerifyResult = { ok: true } | { ok: false; reason: "missing" | "stale" | "mismatch" };

export function verify(opts: {
  secret: string;
  timestamp: string | undefined;
  signature: string | undefined;
  rawBody: string;
  now?: number;
  toleranceSeconds?: number;
}): VerifyResult {
  const { secret, timestamp, signature, rawBody } = opts;
  if (!timestamp || !signature) return { ok: false, reason: "missing" };

  const ts = Number(timestamp);
  const now = opts.now ?? Date.now();
  const tolerance = (opts.toleranceSeconds ?? 300) * 1000;
  // Timestamp is unix seconds or milliseconds; accept both.
  const tsMs = ts < 1e12 ? ts * 1000 : ts;
  if (!Number.isFinite(tsMs) || Math.abs(now - tsMs) > tolerance) return { ok: false, reason: "stale" };

  const expected = Buffer.from(sign(secret, timestamp, rawBody), "hex");
  let received: Buffer;
  try {
    received = Buffer.from(signature, "hex");
  } catch {
    return { ok: false, reason: "mismatch" };
  }
  if (expected.length !== received.length) return { ok: false, reason: "mismatch" };
  return timingSafeEqual(expected, received) ? { ok: true } : { ok: false, reason: "mismatch" };
}
