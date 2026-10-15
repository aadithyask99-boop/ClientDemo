# Inbound voice agent platform

- [ARCHITECTURE.md](ARCHITECTURE.md): decisions, data model, phases, open items.
- [SPIKES.md](SPIKES.md): what the source and docs reviews showed, and what is still unverified.
- `call-service/`: TypeScript service. Run `npm install`, `npm run typecheck`, `npm test` (31 tests pass). Receives Dograh webhooks (per-tenant bearer token) and signed provider events, copies recordings into private storage, and writes calls to Twenty through a retrying queue. Tenants and the queue are in memory for now.
- `twenty-app/`: Twenty app source (object and logic function). Synced and tested on a Twenty dev server in Codespaces; see SPIKES.md.

Verified end to end in a Codespace: Dograh webhook, then call-service, then Twenty (SPIKES.md). Not yet run against Cal.diy, a phone line or a live voice call.
