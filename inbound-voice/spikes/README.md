# Spikes in Codespaces

Open a codespace on branch `inbound-voice` of this repo, choosing the "inbound-voice spikes" dev container configuration (4 cores, 16 GB). Run the scripts from the repo root as `bash inbound-voice/spikes/...`. Prefer **Open in VS Code Desktop**: forwarded ports then appear as `localhost`, which the scripts assume. In the browser version of Codespaces, ports get `*.app.github.dev` URLs and Twenty and Dograh will need their URL settings changed to match.

Run one stack at a time (memory is tight).

```bash
bash inbound-voice/spikes/twenty-up.sh    # Twenty at http://localhost:3000
```

These scripts have been run in a Codespace (results in SPIKES.md). Cal.diy was tried and dropped; its script is removed.

Spike 1 (Twenty): create the first workspace in the browser, build and deploy the app tarball from `twenty-app/`, install it, send a signed call with `call-service`, and send the same call twice to check idempotency.

Stop everything when done (free hours run while a codespace is running): `docker compose down` in each `.work/*` folder, then stop the codespace from the GitHub Codespaces page.
