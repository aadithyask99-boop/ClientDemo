import type { Tenant } from "./types.js";

export interface Slot {
  start: string; // ISO 8601
}

/** What a caller needs to know about an appointment they already have. */
export interface BookingInfo {
  uid: string;
  start: string; // ISO 8601
  name: string;
  reason?: string;
}

export interface Scheduler {
  availableSlots(tenant: Tenant, range: { start: string; end: string; timeZone: string }): Promise<Slot[]>;
  book(
    tenant: Tenant,
    req: { start: string; attendee: { name: string; email?: string; timeZone: string; phoneNumber?: string }; reason?: string },
  ): Promise<{ bookingUid: string }>;
  /** The caller's upcoming appointments, found by the number they are calling from (E.164). */
  findBookings(tenant: Tenant, phone: string): Promise<BookingInfo[]>;
  /** Cancels one of the caller's appointments. Throws BookingNotFoundError if it does not exist or belongs to another number. */
  cancel(tenant: Tenant, req: { uid: string; phone: string }): Promise<BookingInfo>;
  /** Moves one of the caller's appointments. The new time is reserved first, so a failure leaves the old appointment untouched. */
  reschedule(tenant: Tenant, req: { uid: string; phone: string; newStart: string }): Promise<{ bookingUid: string; start: string }>;
}
