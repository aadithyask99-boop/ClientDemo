import type { Tenant } from "./types.js";

export interface Slot {
  start: string; // ISO 8601
}

export interface Scheduler {
  availableSlots(tenant: Tenant, range: { start: string; end: string; timeZone: string }): Promise<Slot[]>;
  book(
    tenant: Tenant,
    req: { start: string; attendee: { name: string; email?: string; timeZone: string; phoneNumber?: string }; reason?: string },
  ): Promise<{ bookingUid: string }>;
}
