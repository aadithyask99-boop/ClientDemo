import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CrmWriter } from "./crm.js";
import type { CallRecord, Tenant } from "./types.js";

export type ArtifactKind = "recording" | "transcript";

export interface ArtifactStore {
  /** Copies the remote file into private storage and returns a stable reference, or null if it could not be copied. */
  save(tenantId: string, callId: string, kind: ArtifactKind, sourceUrl: string): Promise<string | null>;
}

/**
 * Scaffold store: writes to a local directory. Swap for S3 or MinIO with private ACLs.
 * `allowedHosts` limits where we fetch from (the URL comes from a webhook body, so do not fetch arbitrary hosts).
 */
export class LocalArtifactStore implements ArtifactStore {
  constructor(
    private readonly dir: string,
    private readonly opts: { allowedHosts?: string[]; fetchImpl?: typeof fetch } = {},
  ) {}

  async save(tenantId: string, callId: string, kind: ArtifactKind, sourceUrl: string): Promise<string | null> {
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
    await writeFile(full, Buffer.from(await res.arrayBuffer()));
    return `artifact://${rel.split(path.sep).join("/")}`;
  }
}

/**
 * Wraps a CrmWriter: copies provider-hosted recording and transcript links into private storage first, so the CRM
 * never stores a public provider link. If the store is missing or a copy fails, the link is dropped, not forwarded.
 */
export class ArtifactCopyingWriter implements CrmWriter {
  constructor(
    private readonly inner: CrmWriter,
    private readonly store: ArtifactStore | null,
  ) {}

  async writeCall(tenant: Tenant, record: CallRecord): Promise<void> {
    const { sourceArtifacts, ...rest } = record;
    const out: CallRecord = { ...rest };
    if (sourceArtifacts && this.store) {
      for (const kind of ["recording", "transcript"] as const) {
        const src = sourceArtifacts[`${kind}Url` as const];
        if (!src) continue;
        let ref: string | null = null;
        try {
          ref = await this.store.save(tenant.id, record.providerCallId, kind, src);
        } catch {
          ref = null; // The call record must still be written; the copy can be retried from the provider later.
        }
        if (ref) out[`${kind}Ref` as const] = ref;
      }
    }
    await this.inner.writeCall(tenant, out);
  }
}
