import { NextRequest, NextResponse } from "next/server";

// Server-side proxy to the call-service bookings list. The tenant token never reaches the browser.
// Dograh's middleware already requires a signed-in session for this path.
export async function GET(request: NextRequest) {
  const base = process.env.CALL_SERVICE_URL;
  const token = process.env.CALL_SERVICE_TOKEN;
  if (!base || !token) {
    return NextResponse.json({ error: "CALL_SERVICE_URL and CALL_SERVICE_TOKEN are not set on the UI server" }, { status: 503 });
  }

  const query = new URLSearchParams();
  for (const key of ["from", "to"]) {
    const v = request.nextUrl.searchParams.get(key);
    if (v) query.set(key, v);
  }

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/bookings?${query}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "The booking service is not reachable" }, { status: 502 });
  }
}
