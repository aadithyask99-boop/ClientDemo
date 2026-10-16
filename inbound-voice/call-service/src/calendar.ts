import { createHash } from "node:crypto";
import type { Tenant } from "./types.js";

export interface Interval {
  start: string; // ISO instant (UTC)
  end: string;
}

export interface CalendarEventInput {
  start: string;
  end: string;
  title: string;
  description?: string;
}

/** A client's own calendar (Google or Microsoft). Reads what is busy and writes the appointments we book. */
export interface CalendarClient {
  busy(tenant: Tenant, fromIso: string, toIso: string): Promise<Interval[]>;
  createEvent(tenant: Tenant, event: CalendarEventInput): Promise<{ eventId: string }>;
  /** Deletes an event we created. An event that is already gone counts as deleted. */
  deleteEvent(tenant: Tenant, eventId: string): Promise<void>;
}

export interface OAuthApp {
  clientId: string;
  clientSecret: string;
}

/** Caches access tokens (they last about an hour) per tenant; a refresh token is long-lived and comes from the client's one-time consent. */
class TokenCache {
  private readonly tokens = new Map<string, { value: string; expiresAt: number }>();
  constructor(private readonly now: () => number) {}

  async get(key: string, refresh: () => Promise<{ access_token?: string; expires_in?: number }>): Promise<string> {
    const hit = this.tokens.get(key);
    if (hit && hit.expiresAt > this.now()) return hit.value;
    const res = await refresh();
    if (!res.access_token) throw new Error("token refresh returned no access token");
    this.tokens.set(key, { value: res.access_token, expiresAt: this.now() + Math.max(0, (res.expires_in ?? 3600) - 60) * 1000 });
    return res.access_token;
  }
}

const tokenKey = (tenant: Tenant) => `${tenant.id}:${createHash("sha256").update(tenant.calendar?.refreshToken ?? "").digest("hex").slice(0, 16)}`;

function requireCalendar(tenant: Tenant, provider: "google" | "microsoft") {
  const c = tenant.calendar;
  if (!c || c.provider !== provider) throw new Error(`Tenant ${tenant.id} has no ${provider} calendar configured`);
  return c;
}

/** Errors never include request bodies or tokens: they end up in logs. */
async function failure(what: string, res: Response): Promise<Error> {
  let detail = "";
  try {
    const body = (await res.json()) as { error?: unknown; error_description?: unknown };
    const e = body.error;
    detail = typeof e === "string" ? e : typeof (e as { message?: unknown })?.message === "string" ? (e as { message: string }).message : "";
    if (!detail && typeof body.error_description === "string") detail = body.error_description.slice(0, 120);
  } catch {
    /* no JSON body */
  }
  return new Error(`${what} failed: ${res.status}${detail ? ` ${detail}` : ""}`);
}

/**
 * Google Calendar over REST. Scopes the client grants once: calendar.freebusy and calendar.events.
 * Request shapes follow Google's published API (freeBusy.query, events.insert); NOT yet run against a live Google account.
 */
export class GoogleCalendarClient implements CalendarClient {
  private readonly cache: TokenCache;
  constructor(
    private readonly app: OAuthApp,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {
    this.cache = new TokenCache(now);
  }

  private token(tenant: Tenant): Promise<string> {
    const cal = requireCalendar(tenant, "google");
    return this.cache.get(tokenKey(tenant), async () => {
      const res = await this.fetchImpl("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: this.app.clientId, client_secret: this.app.clientSecret, refresh_token: cal.refreshToken, grant_type: "refresh_token" }),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) throw await failure("Google token refresh (the client may need to reconnect their calendar)", res);
      return (await res.json()) as { access_token?: string; expires_in?: number };
    });
  }

  async busy(tenant: Tenant, fromIso: string, toIso: string): Promise<Interval[]> {
    const calendarId = requireCalendar(tenant, "google").calendarId ?? "primary";
    const res = await this.fetchImpl("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: { authorization: `Bearer ${await this.token(tenant)}`, "content-type": "application/json" },
      body: JSON.stringify({ timeMin: fromIso, timeMax: toIso, items: [{ id: calendarId }] }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw await failure("Google free/busy", res);
    const body = (await res.json()) as { calendars?: Record<string, { busy?: Interval[]; errors?: Array<{ reason?: string }> }> };
    const entry = body.calendars?.[calendarId];
    // A calendar Google could not read must never look empty: that would offer slots that are really taken.
    if (!entry || entry.errors?.length) throw new Error(`Google free/busy could not read the calendar${entry?.errors?.[0]?.reason ? `: ${entry.errors[0].reason}` : ""}`);
    return (entry.busy ?? []).map((b) => ({ start: new Date(b.start).toISOString(), end: new Date(b.end).toISOString() }));
  }

  async createEvent(tenant: Tenant, ev: CalendarEventInput): Promise<{ eventId: string }> {
    const calendarId = requireCalendar(tenant, "google").calendarId ?? "primary";
    const res = await this.fetchImpl(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      headers: { authorization: `Bearer ${await this.token(tenant)}`, "content-type": "application/json" },
      body: JSON.stringify({
        summary: ev.title,
        ...(ev.description ? { description: ev.description } : {}),
        start: { dateTime: ev.start, timeZone: "UTC" },
        end: { dateTime: ev.end, timeZone: "UTC" },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw await failure("Google event creation", res);
    const body = (await res.json()) as { id?: string };
    if (!body.id) throw new Error("Google event creation returned no event id");
    return { eventId: body.id };
  }

  async deleteEvent(tenant: Tenant, eventId: string): Promise<void> {
    const calendarId = requireCalendar(tenant, "google").calendarId ?? "primary";
    const res = await this.fetchImpl(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${await this.token(tenant)}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok && res.status !== 404 && res.status !== 410) throw await failure("Google event deletion", res);
  }
}

/**
 * Microsoft 365 / Outlook calendars through Microsoft Graph. Scope the client grants once: Calendars.ReadWrite (and offline_access).
 * Busy time comes from calendarView; anything not marked "free" counts as busy. Request shapes follow Microsoft's published API;
 * NOT yet run against a live Microsoft account.
 */
export class MicrosoftCalendarClient implements CalendarClient {
  private readonly cache: TokenCache;
  constructor(
    private readonly app: OAuthApp & { authority?: string },
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {
    this.cache = new TokenCache(now);
  }

  private token(tenant: Tenant): Promise<string> {
    const cal = requireCalendar(tenant, "microsoft");
    return this.cache.get(tokenKey(tenant), async () => {
      const res = await this.fetchImpl(`https://login.microsoftonline.com/${this.app.authority ?? "common"}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: this.app.clientId,
          client_secret: this.app.clientSecret,
          refresh_token: cal.refreshToken,
          grant_type: "refresh_token",
          scope: "https://graph.microsoft.com/Calendars.ReadWrite offline_access",
        }),
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) throw await failure("Microsoft token refresh (the client may need to reconnect their calendar)", res);
      return (await res.json()) as { access_token?: string; expires_in?: number };
    });
  }

  private base(tenant: Tenant): string {
    const id = requireCalendar(tenant, "microsoft").calendarId;
    return id ? `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(id)}` : "https://graph.microsoft.com/v1.0/me/calendar";
  }

  async busy(tenant: Tenant, fromIso: string, toIso: string): Promise<Interval[]> {
    const token = await this.token(tenant);
    const out: Interval[] = [];
    let url: string | undefined = `${this.base(tenant)}/calendarView?${new URLSearchParams({ startDateTime: fromIso, endDateTime: toIso, $select: "start,end,showAs,isCancelled", $top: "100" })}`;
    for (let page = 0; url && page < 10; page++) {
      const res: Response = await this.fetchImpl(url, {
        headers: { authorization: `Bearer ${token}`, prefer: 'outlook.timezone="UTC"' },
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) throw await failure("Microsoft calendar read", res);
      const body = (await res.json()) as {
        value?: Array<{ start: { dateTime: string }; end: { dateTime: string }; showAs?: string; isCancelled?: boolean }>;
        "@odata.nextLink"?: string;
      };
      for (const e of body.value ?? []) {
        if (e.isCancelled || e.showAs === "free") continue;
        // Graph returns UTC wall-clock strings without a zone marker when asked for UTC.
        const utc = (s: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(s) ? s : `${s}Z`).toISOString();
        out.push({ start: utc(e.start.dateTime), end: utc(e.end.dateTime) });
      }
      url = body["@odata.nextLink"];
      if (url && page === 9) throw new Error("Microsoft calendar read: too many pages"); // never treat a partial read as complete
    }
    return out;
  }

  async createEvent(tenant: Tenant, ev: CalendarEventInput): Promise<{ eventId: string }> {
    const res = await this.fetchImpl(`${this.base(tenant)}/events`, {
      method: "POST",
      headers: { authorization: `Bearer ${await this.token(tenant)}`, "content-type": "application/json" },
      body: JSON.stringify({
        subject: ev.title,
        ...(ev.description ? { body: { contentType: "text", content: ev.description } } : {}),
        start: { dateTime: ev.start.replace(/Z$/, ""), timeZone: "UTC" },
        end: { dateTime: ev.end.replace(/Z$/, ""), timeZone: "UTC" },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw await failure("Microsoft event creation", res);
    const body = (await res.json()) as { id?: string };
    if (!body.id) throw new Error("Microsoft event creation returned no event id");
    return { eventId: body.id };
  }

  async deleteEvent(tenant: Tenant, eventId: string): Promise<void> {
    const res = await this.fetchImpl(`${this.base(tenant)}/events/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${await this.token(tenant)}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok && res.status !== 404 && res.status !== 410) throw await failure("Microsoft event deletion", res);
  }
}
