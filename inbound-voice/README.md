# Inbound voice agent platform

- [ARCHITECTURE.md](ARCHITECTURE.md): decisions, data model, phases, open items.
- [SPIKES.md](SPIKES.md): what the source and docs reviews showed, and what is still unverified.
- `call-service/`: TypeScript service. Run `npm install`, `npm run typecheck`, `npm test` (19 tests pass). Uses in-memory tenants and queue for now.
- `twenty-app/`: Twenty app source (object and logic function). **Never run**; needs a Twenty server.

Nothing here has been run against a live Twenty, Cal.diy, Twilio or voice platform.
