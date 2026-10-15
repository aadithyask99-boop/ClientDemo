import type { Tenant } from "./types.js";

export interface Slot {
  start: string; // ISO 8601
}

export interface Scheduler {
  availableSlots(tenant: Tenant, range: { start: string; end: string; timeZone: string }): Promise<Slot[]>;
  book(
    tenant: Tenant,
    req: { start: string; attendee: { name: string; email: string; timeZone: string; phoneNumber?: string } },
  ): Promise<{ bookingUid: string }>;
}

/**
 * Cal.diy v2 API adapter.
 * Endpoints and version headers come from reading the Cal.diy source (apps/api/v2): GET /v2/slots with
 * cal-api-version 2024-09-04, POST /v2/bookings with cal-api-version 2024-08-13.
 * UNVERIFIED: request and response bodies below, and whether the Docker image serves API v2.
 * Parsing is deliberately defensive; replace with generated types after the first live call.
 */
export class CalDiyScheduler implements Scheduler {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async availableSlots(tenant: Tenant, range: { start: string; end: string; timeZone: string }): Promise<Slot[]> {
    const cfg = this.requireCfg(tenant);
    const url = new URL("/v2/slots", cfg.baseUrl);
    url.searchParams.set("eventTypeId", String(cfg.eventTypeId));
    url.searchParams.set("start", range.start);
    url.searchParams.set("end", range.end);
    url.searchParams.set("timeZone", range.timeZone);

    const res = await this.fetchImpl(url, {
      headers: { authorization: `Bearer ${cfg.apiKey}`, "cal-api-version": "2024-09-04" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`Cal.diy slots error ${res.status}`);
    const body = (await res.json()) as { data?: Record<string, Array<{ start: string }>> };
    // Slots are keyed by date: { "2026-10-20": [{ start: "..." }] }
    return Object.values(body.data ?? {}).flat().map((s) => ({ start: s.start }));
  }

  async book(
    tenant: Tenant,
    req: { start: string; attendee: { name: string; email: string; timeZone: string; phoneNumber?: string } },
  ): Promise<{ bookingUid: string }> {
    const cfg = this.requireCfg(tenant);
    const res = await this.fetchImpl(new URL("/v2/bookings", cfg.baseUrl), {
      method: "POST",
      headers: {
        authorization: `Bearer ${cfg.apiKey}`,
        "cal-api-version": "2024-08-13",
        "content-type": "application/json",
      },
      body: JSON.stringify({ eventTypeId: cfg.eventTypeId, start: req.start, attendee: req.attendee }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`Cal.diy booking error ${res.status}`);
    const body = (await res.json()) as { data?: { uid?: string } };
    if (!body.data?.uid) throw new Error("Cal.diy booking response had no uid");
    return { bookingUid: body.data.uid };
  }

  private requireCfg(tenant: Tenant) {
    if (!tenant.calDiy) throw new Error(`Tenant ${tenant.id} has no Cal.diy configuration`);
    return tenant.calDiy;
  }
}
