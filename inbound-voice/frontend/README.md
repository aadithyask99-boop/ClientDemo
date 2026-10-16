# Front-end overlay for Dograh's UI

Adds the client-facing screens to Dograh's left sidebar without forking its code. Everything we own is in `overlay/src`; `apply-overlay.mjs` copies it into a checkout of `dograh-hq/dograh` and patches `AppSidebar.tsx` (adds Calendar, Customers, Calls and Follow-ups, removes the old CRM item). If Dograh changes that file the script stops with a clear message instead of guessing.

```
git clone --depth 1 https://github.com/dograh-hq/dograh.git
node apply-overlay.mjs ./dograh
```

Screens:
- **Calendar** (`calendar/page.tsx`): week grid. Click a free cell to add a booking, click a booking to move or cancel it. Uses the same hours and free times as the phone assistant.
- **Customers** (`customers/page.tsx`): everyone who called or was added by hand, search, add.
- **Calls** (`calls/page.tsx`): every call with outcome and summary.
- **Follow-ups** (`follow-ups/page.tsx`): messages and callback requests waiting for a reply, with "Mark done".

All of them talk to the call-service through one server-side proxy, `api/staff/[...path]/route.ts` (only whitelisted paths), and `api/calendar/route.ts` for the booking list. The client's token stays on the UI server.

UI server settings: `CALL_SERVICE_URL` (e.g. `http://localhost:3100`) and `CALL_SERVICE_TOKEN` (the client's `dograhWebhookToken`). Nothing is needed at build time.

There is no CRM: calls, customers and follow-ups are stored by the call-service in its own Postgres next to the bookings (`call-service/src/callLog.ts`). Twenty was used earlier and has been retired; it is no longer part of the call path.

Dograh's middleware only checks that a session cookie exists, which is what protects `/api/staff` and `/api/calendar`. Type-checks against Dograh `main`.
