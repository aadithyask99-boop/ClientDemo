import { NextRequest, NextResponse } from "next/server";

// Server-side access to the CRM data (Twenty) for our own Customers, Calls and Follow-ups pages.
// The Twenty key stays on the server, only these exact operations exist, and the pages never talk to Twenty directly.
// Dograh's middleware already requires a signed-in session for this path.
//
//   GET  calls | tasks | people          newest first, simple shapes
//   POST people                          { name, phone?, email? } adds a customer
//   POST tasks/<id>/done                 marks a follow-up done

const base = () => process.env.TWENTY_URL?.replace(/\/$/, "");
const key = () => process.env.TWENTY_API_KEY;

async function twenty(method: string, path: string, body?: unknown) {
  const res = await fetch(`${base()}/rest/${path}`, {
    method,
    headers: { authorization: `Bearer ${key()}`, "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

/** Twenty wraps lists as { data: { <plural>: [...] } }. */
const rows = (json: { data?: Record<string, unknown> }): Record<string, any>[] => (Object.values(json.data ?? {}).find(Array.isArray) as Record<string, any>[] | undefined) ?? [];

/** UK numbers are stored the way the call recorder stores them (national digits, GB, +44) so a customer added here is matched by later calls. */
function phoneFields(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\+44\d{9,10}$/.test(digits)) return { primaryPhoneNumber: digits.slice(3), primaryPhoneCountryCode: "GB", primaryPhoneCallingCode: "+44" };
  if (/^0\d{9,10}$/.test(digits)) return { primaryPhoneNumber: digits.slice(1), primaryPhoneCountryCode: "GB", primaryPhoneCallingCode: "+44" };
  return null;
}

async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!base() || !key()) return NextResponse.json({ error: "TWENTY_URL and TWENTY_API_KEY are not set on the UI server" }, { status: 503 });
  const path = (await params).path.join("/");
  try {
    if (request.method === "GET" && path === "calls") {
      const r = await twenty("GET", "calls?limit=100&order_by=startedAt%5BDescNullsLast%5D");
      return NextResponse.json({ calls: rows(r.json).map((c) => ({ id: c.id, startedAt: c.startedAt, callerNumber: c.callerNumber, outcome: c.outcome, summary: c.summary, durationSeconds: c.durationSeconds })) }, { status: r.ok ? 200 : r.status });
    }
    if (request.method === "GET" && path === "tasks") {
      const r = await twenty("GET", "tasks?limit=100&order_by=createdAt%5BDescNullsLast%5D");
      return NextResponse.json({ tasks: rows(r.json).filter((t) => !t.deletedAt).map((t) => ({ id: t.id, title: t.title, status: t.status, dueAt: t.dueAt, body: t.bodyV2?.markdown ?? t.body ?? "", createdAt: t.createdAt })) }, { status: r.ok ? 200 : r.status });
    }
    if (request.method === "GET" && path === "people") {
      const r = await twenty("GET", "people?limit=200&order_by=createdAt%5BDescNullsLast%5D");
      const phone = (p: Record<string, any>) => (p.phones?.primaryPhoneNumber ? `${p.phones.primaryPhoneCallingCode ?? ""}${p.phones.primaryPhoneNumber}` : "");
      return NextResponse.json({ people: rows(r.json).filter((p) => !p.deletedAt).map((p) => ({ id: p.id, name: [p.name?.firstName, p.name?.lastName].filter(Boolean).join(" "), phone: phone(p), email: p.emails?.primaryEmail ?? "", createdAt: p.createdAt })) }, { status: r.ok ? 200 : r.status });
    }
    if (request.method === "POST" && path === "people") {
      const b = (await request.json().catch(() => ({}))) as { name?: string; phone?: string; email?: string };
      const name = String(b.name ?? "").trim();
      if (!name) return NextResponse.json({ error: "A name is required" }, { status: 400 });
      const [firstName, ...rest] = name.split(/\s+/);
      const phones = b.phone ? phoneFields(b.phone) : null;
      if (b.phone && !phones) return NextResponse.json({ error: "Enter a UK number, for example 07400 123456 or +44 7400 123456" }, { status: 400 });
      const r = await twenty("POST", "people", {
        name: { firstName, lastName: rest.join(" ") },
        ...(phones ? { phones } : {}),
        ...(b.email?.trim() ? { emails: { primaryEmail: b.email.trim() } } : {}),
      });
      return NextResponse.json(r.ok ? { ok: true } : { error: "The CRM refused the new customer", detail: r.json }, { status: r.ok ? 200 : 502 });
    }
    const done = /^tasks\/([A-Za-z0-9-]+)\/done$/.exec(path);
    if (request.method === "POST" && done) {
      const r = await twenty("PATCH", `tasks/${done[1]}`, { status: "DONE" });
      return NextResponse.json(r.ok ? { ok: true } : { error: "The CRM refused the change" }, { status: r.ok ? 200 : 502 });
    }
    return NextResponse.json({ error: "not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "The CRM is not reachable" }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
