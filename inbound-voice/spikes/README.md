# Spikes in Codespaces

Open a codespace on branch `inbound-voice` of this repo, choosing the "inbound-voice spikes" dev container configuration (4 cores, 16 GB). Run the scripts from the repo root as `bash inbound-voice/spikes/...`. Prefer **Open in VS Code Desktop**: forwarded ports then appear as `localhost`, which the scripts assume. In the browser version of Codespaces, ports get `*.app.github.dev` URLs and Twenty and Cal.diy will need their URL settings changed to match.

Run one stack at a time (both use port 3000, and memory is tight).

```bash
bash inbound-voice/spikes/twenty-up.sh    # Twenty at http://localhost:3000
bash inbound-voice/spikes/cal-up.sh       # Cal.diy web :3000, API v2 :5555 (long first build)
```

None of these scripts has been run yet. Expect to fix small things on the first run and tell me the error output.

Spike 1 (Twenty): create the first workspace in the browser, build and deploy the app tarball from `twenty-app/`, install it, send a signed call with `call-service`, and send the same call twice to check idempotency.

Spike 2 (Cal.diy): create a user, create an API key in its settings, create an event type, request slots, make a booking. Needs a throwaway Google calendar only for the calendar-connection part, which can wait.

Stop everything when done (free hours run while a codespace is running): `docker compose down` in each `.work/*` folder, then stop the codespace from the GitHub Codespaces page.
