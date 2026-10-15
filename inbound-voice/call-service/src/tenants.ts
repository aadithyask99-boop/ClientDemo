import { createHash } from "node:crypto";
import type { Tenant } from "./types.js";

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

export interface TenantRegistry {
  byDialedNumber(e164: string): Tenant | undefined;
  byId(id: string): Tenant | undefined;
  byDograhToken(token: string): Tenant | undefined;
}

/** In-memory registry for the scaffold. Replace with Postgres plus a short-lived cache; the interface stays. */
export class InMemoryTenantRegistry implements TenantRegistry {
  private readonly tenants = new Map<string, Tenant>();
  private readonly byNumber = new Map<string, string>();
  private readonly byTokenHash = new Map<string, string>();

  constructor(tenants: Tenant[]) {
    for (const t of tenants) {
      this.tenants.set(t.id, t);
      if (t.dograhWebhookToken) {
        const h = sha(t.dograhWebhookToken);
        const existing = this.byTokenHash.get(h);
        if (existing && existing !== t.id) throw new Error("A Dograh webhook token is shared by two tenants");
        this.byTokenHash.set(h, t.id);
      }
      for (const n of t.numbers) {
        const existing = this.byNumber.get(n);
        if (existing && existing !== t.id) throw new Error(`Number ${n} is assigned to two tenants`);
        this.byNumber.set(n, t.id);
      }
    }
  }

  byDialedNumber(e164: string): Tenant | undefined {
    const id = this.byNumber.get(e164);
    return id ? this.tenants.get(id) : undefined;
  }

  byId(id: string): Tenant | undefined {
    return this.tenants.get(id);
  }

  /** Looks up by hash so the comparison does not leak token prefixes through timing. */
  byDograhToken(token: string): Tenant | undefined {
    const id = this.byTokenHash.get(sha(token));
    return id ? this.tenants.get(id) : undefined;
  }
}
