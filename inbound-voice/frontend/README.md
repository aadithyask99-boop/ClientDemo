# Front-end overlay for Dograh's UI

Adds two items to Dograh's left sidebar, without forking its code: **CRM** (Twenty inside an iframe, tabs for Calls, Tasks, People, plus a new-tab link) and **Calendar** (upcoming bookings from the call-service, grouped by day in the client's time zone).

Everything we own is in `overlay/src` (three new files). `apply-overlay.mjs` copies them into a checkout of `dograh-hq/dograh` and patches `AppSidebar.tsx` once (two icon imports and two list entries). If Dograh changes that file the script stops with a clear message instead of guessing.

```
git clone --depth 1 https://github.com/dograh-hq/dograh.git
node apply-overlay.mjs ./dograh
```

Settings for the UI server: `CALL_SERVICE_URL` (e.g. `http://localhost:3100`), `CALL_SERVICE_TOKEN` (the tenant's `dograhWebhookToken`; stays on the server, the browser only calls `/api/calendar`), and at build time `NEXT_PUBLIC_TWENTY_URL` (Twenty's address as the browser sees it). The Calendar page needs the call-service endpoint `GET /api/bookings?from=&to=` (tested in `call-service/test/bookingsApi.test.ts`).

Status: type-checks against Dograh `main` (2026-10-16). **Not yet built into the `dograh-ui` container or looked at in a browser.** Twenty may refuse to be framed (X-Frame-Options / CSP); the page says so and offers the new-tab link. Dograh's middleware only checks that a session cookie exists, which is what protects `/api/calendar`.
