# Inbound voice agent platform

- [ARCHITECTURE.md](ARCHITECTURE.md): decisions, data model, phases, open items.
- [SPIKES.md](SPIKES.md): what the source and docs reviews showed, and what is still unverified.
- `call-service/`: TypeScript service. Run `npm install`, `npm run typecheck`, `npm test` (19 tests pass). Uses in-memory tenants and queue for now.
- `twenty-app/`: Twenty app source (object and logic function). Synced and tested on a Twenty dev server in Codespaces; see SPIKES.md.

Verified against a live Twenty dev server only. Not yet run against Cal.diy, Twilio or a voice platform.
