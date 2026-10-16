import { NextRequest, NextResponse } from "next/server";

// Server-side proxy for the staff screens (add, move, cancel a booking; free times for a day).
// The tenant token stays on the server and only these exact call-service paths are reachable.
// Dograh's middleware already requires a signed-in session for this path.
const ALLOWED = [/^slots$/, /^bookings$/, /^bookings\/[A-Za-z0-9_-]+\/(cancel|move)$/];

async function forward(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const base = process.env.CALL_SERVICE_URL;
  const token = process.env.CALL_SERVICE_TOKEN;
  if (!base || !token) return NextResponse.json({ error: "CALL_SERVICE_URL and CALL_SERVICE_TOKEN are not set on the UI server" }, { status: 503 });

  const path = (await params).path.join("/");
  if (!ALLOWED.some((re) => re.test(path))) return NextResponse.json({ error: "not found" }, { status: 404 });

  const search = request.nextUrl.search;
  const body = request.method === "POST" ? await request.text() : undefined;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/${path}${search}`, {
      method: request.method,
      headers: { authorization: `Bearer ${token}`, ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      ...(body !== undefined ? { body: body || "{}" } : {}),
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "The booking service is not reachable" }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
