# Twenty gateway (written, not yet run)

Small proxy in front of Twenty. For a visitor without a Twenty session it signs in as one configured Twenty user (`LOGIN_EMAIL`, `LOGIN_PASSWORD`) and forwards the `twenty-session` cookie Twenty issues, so the client never sees Twenty's login. It also removes `X-Frame-Options` and sets CSP `frame-ancestors` to `FRAME_ANCESTORS`, so Twenty can be shown inside our app's CRM page. Twenty's code is not modified.

Verified on 2026-10-16 against the running Twenty dev server: the two sign-in calls (`getLoginTokenFromCredentials`, `getAuthTokensFromLoginToken` on `/metadata`) succeed and the second returns an HttpOnly `twenty-session` cookie. The gateway itself has only been syntax-checked.

Security: anyone who can reach this port is signed in as that user, with no password. It must only be reachable through our app's own sign-in (same domain, internal network or an authenticated proxy). Never expose it on its own.

Run: `LOGIN_EMAIL=... LOGIN_PASSWORD=... FRAME_ANCESTORS="https://app.example.com" node server.mjs` (default port 2021, upstream `http://localhost:2020`).
