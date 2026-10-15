import { describe, expect, it } from "vitest";
import { ArtifactCopyingWriter, type ArtifactStore } from "../src/artifacts.js";
import { callerLines, detectOptOut } from "../src/signals.js";
import type { CallRecord, Tenant } from "../src/types.js";

const t = (lines: string[]) => lines.join("\n");

describe("opt-out detection", () => {
  it("only looks at what the caller said", () => {
    const text = t(["[2026-10-15T15:05:14+00:00] assistant: I can remove my number from the list if you like", "[2026-10-15T15:05:20+00:00] user: What are your opening hours?"]);
    expect(callerLines(text)).toEqual(["What are your opening hours?"]);
    expect(detectOptOut(text)).toBe(false); // the agent's wording must never count
  });

  it("recognises clear opt-out requests", () => {
    for (const line of [
      "Please remove my number from your list. Do not contact me again.",
      "Don't call me again",
      "stop calling me anymore",
      "take me off your list",
      "I want to unsubscribe",
      "Please opt me out",
      "remove my details from your records",
    ]) {
      expect(detectOptOut(`[x] user: ${line}`), line).toBe(true);
    }
  });

  it("does not flag ordinary requests", () => {
    for (const line of ["Please don't call me before 9am", "Can you call me back tomorrow?", "I'd like to book an appointment", "Remove the 3pm slot, make it 4pm", "I opted for the cheaper plan"]) {
      expect(detectOptOut(`[x] user: ${line}`), line).toBe(false);
    }
  });
});

describe("opt-out safety net in the writer", () => {
  const tenant = { id: "t1" } as Tenant;
  const base: CallRecord = {
    providerCallId: "dograh:5",
    tenantId: "t1",
    direction: "INBOUND",
    callerNumber: "+447400123456",
    startedAt: "2026-10-15T10:00:00Z",
    endedAt: "2026-10-15T10:01:00Z",
    durationSeconds: 60,
    outcome: "INFO_GIVEN",
    summary: "Asked about opening hours.",
    sourceArtifacts: { transcriptUrl: "https://files.example.com/tr/5.txt" },
  };
  const storeWith = (text: string): ArtifactStore => ({
    save: async (_t, id, kind) => ({ ref: `artifact://t1/${id}.${kind}`, ...(kind === "transcript" ? { text } : {}) }),
  });

  it("overrides the outcome when the caller asked not to be contacted again", async () => {
    let seen: CallRecord | undefined;
    const w = new ArtifactCopyingWriter({ writeCall: async (_t, r) => void (seen = r) }, storeWith("[x] user: Please remove my number from your list. Do not contact me again."));
    await w.writeCall(tenant, base);
    expect(seen?.outcome).toBe("OPTED_OUT");
    expect(seen?.summary).toContain("opt-out");
    expect(seen?.summary).toContain("Asked about opening hours.");
  });

  it("leaves the outcome alone when the transcript has no opt-out", async () => {
    let seen: CallRecord | undefined;
    const w = new ArtifactCopyingWriter({ writeCall: async (_t, r) => void (seen = r) }, storeWith("[x] user: What time do you open?"));
    await w.writeCall(tenant, base);
    expect(seen?.outcome).toBe("INFO_GIVEN");
  });
});
