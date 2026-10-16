import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CrmWriter } from "./crm.js";
import { planFollowUp, splitPhone } from "./followUp.js";
import { detectOptOut } from "./signals.js";
import type { CallRecord, Tenant } from "./types.js";

export type ArtifactKind = "recording" | "transcript";

export interface ArtifactStore {
  /**
   * Copies the remote file into private storage and returns a stable reference, or null if it could not be copied.
   * Transcripts also come back as text so deterministic checks (opt-outs) can run on them.
   */
  save(tenantId: string, callId: string, kind: ArtifactKind, sourceUrl: string): Promise<{ ref: string; text?: string } | null>;
}

/**
 * Scaffold store: writes to a local directory. Swap for S3 or MinIO with private ACLs.
 * `allowedHosts` limits where we fetch from (the URL comes from a webhook body, so do not fetch arbitrary hosts).
 */
export class LocalArtifactStore implements ArtifactStore {
  constructor(
    private readonly dir: string,
    /**
     * `rewrite` maps the start of a link to another address before fetching, for example the voice platform's public
     * address to its local one: the files then come from inside the server and need no public port.
     */
    private readonly opts: { allowedHosts?: string[]; fetchImpl?: typeof fetch; rewrite?: Array<[string, string]> } = {},
  ) {}

  async save(tenantId: string, callId: string, kind: ArtifactKind, sourceUrl: string): Promise<{ ref: string; text?: string } | null> {
    for (const [from, to] of this.opts.rewrite ?? []) {
      if (sourceUrl.startsWith(from)) {
        sourceUrl = to + sourceUrl.slice(from.length);
        break;
      }
    }
    let url: URL;
    try {
      url = new URL(sourceUrl);
    } catch {
      return null;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (this.opts.allowedHosts && !this.opts.allowedHosts.includes(url.host)) return null;

    const res = await (this.opts.fetchImpl ?? fetch)(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`artifact fetch ${res.status}`);
    const safe = (v: string) => v.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const rel = path.join(safe(tenantId), `${safe(callId)}.${kind}`);
    const full = path.join(this.dir, rel);
    await mkdir(path.dirname(full), { recursive: true });
    const bytes = Buffer.from(await res.arrayBuffer());
    await writeFile(full, bytes);
    const ref = `artifact://${rel.split(path.sep).join("/")}`;
    return kind === "transcript" && bytes.length < 1_000_000 ? { ref, text: bytes.toString("utf8") } : { ref };
  }
}

/**
 * Wraps a CrmWriter: copies provider-hosted recording and transcript links into private storage first, so the CRM
 * never stores a public provider link. If the store is missing or a copy fails, the link is dropped, not forwarded.
 * Also runs the opt-out safety net on the transcript text.
 */
export class ArtifactCopyingWriter implements CrmWriter {
  constructor(
    private readonly inner: CrmWriter,
    private readonly store: ArtifactStore | null,
    private readonly now: () => number = Date.now,
  ) {}

  async writeCall(tenant: Tenant, record: CallRecord): Promise<void> {
    const { sourceArtifacts, ...rest } = record;
    const out: CallRecord = { ...rest };
    if (sourceArtifacts && this.store) {
      for (const kind of ["recording", "transcript"] as const) {
        const src = sourceArtifacts[`${kind}Url` as const];
        if (!src) continue;
        let saved: { ref: string; text?: string } | null = null;
        try {
          saved = await this.store.save(tenant.id, record.providerCallId, kind, src);
        } catch {
          saved = null; // The call record must still be written; the copy can be retried from the provider later.
        }
        if (saved) out[`${kind}Ref` as const] = saved.ref;
        // Safety net: a clear opt-out in the caller's own words overrides every other outcome, even if the agent forgot its tool.
        if (saved?.text && detectOptOut(saved.text)) {
          out.outcome = "OPTED_OUT";
          if (!out.summary.includes("opt-out")) {
            out.summary = `${out.summary} Caller asked not to be contacted again (opt-out heard in the transcript).`.trim();
          }
        }
      }
    }
    // Last, after every override above: a call the transcript shows to be an opt-out must not leave a task behind.
    const followUp = planFollowUp(tenant, out, this.now());
    if (followUp) out.followUp = followUp;
    if (out.message && !out.summary.includes(out.message.body)) out.summary = `${out.summary} Message: ${out.message.body}`.trim();
    const phone = splitPhone(out.callerNumber);
    if (phone) out.callerPhone = phone;
    await this.inner.writeCall(tenant, out);
  }
}
