# flow-server: Google Flow as an MCP server for every chat

A real Chrome stays signed in to Google on an always-on server (its profile lives on the server's disk), and an MCP server drives
Flow in it. Add the URL once as a custom connector in claude.ai and every chat, on any laptop, has `flow_generate_image`.
No usage cap from this setup: it runs on a server you own.

Tools: `flow_generate_image` (prompt, aspect, count up to 4), `flow_last_result`, `flow_status`.

## Setup (Oracle Cloud Always Free, about 30 minutes, once)

1. Create an account at cloud.oracle.com (Always Free; it asks for a card to verify you and does not charge for Always Free resources).
2. **Compute, Instances, Create instance.**
   - Image: **Ubuntu 24.04** (aarch64 or x86).
   - Shape: **VM.Standard.A1.Flex**, 2 OCPU and 12 GB memory (Always Free eligible; Chrome needs the memory). If it says "out of capacity", retry later or in another availability domain.
   - Networking: keep the default VCN with a **public IPv4 address**.
   - Add or download an SSH key (you won't need it, but Oracle requires one).
   - **Show advanced options, Management, Cloud-init script: paste the script you were given** (see `cloud-init.example.sh`).
3. **Networking, Virtual cloud networks, your VCN, Security lists, Default, Add ingress rules:** source `0.0.0.0/0`, TCP, destination ports `80,443`.
4. Wait about 8 minutes, then open `https://<public-ip-with-dashes>.sslip.io/browser/` (for 12.34.56.78 that is `12-34-56-78.sslip.io`). Log in as `flow` with your browser password. A Chrome window opens: **sign in to Google, then open flow.google.com until your projects show.** You do this once; Chrome keeps the login on the server.
5. In claude.ai: Settings, Connectors, **Add custom connector**, URL `https://<ip>.sslip.io/mcp/<MCP_SECRET>`.

`/opt/flow-server/URLS.txt` on the server holds both URLs. Re-run `install.sh` (or `docker compose up -d --build` in `/opt/flow-server`) to update.

## Notes
- Any Ubuntu server works; the script is not Oracle specific. Oracle may reclaim idle Always Free instances.
- Google may ask you to verify the sign-in from a datacenter address. Do that in the same window.
- This automates the Flow website, which Google's terms may not allow. Flow's page can change and break the selectors in `src/flow.mjs`.
- Jobs run one at a time (they share one Chrome and one Flow project); a job takes 30 to 120 seconds.
- The repo is public: never commit `.env`; the install script creates it on the server.
