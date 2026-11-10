# Flow MCP setup, once per laptop

Uses https://github.com/GTAI-1/flow-mcp (MIT-style community project, unofficial). It runs on your own computer, opens its own Chrome window with its own profile, and drives Flow's real buttons. Stills cost no Flow credits; video does (Flow gives 50 a day). Needs: Node.js 22+, Google Chrome, Git. FFmpeg and whisper.cpp are only for video joining and captions, so skip them for images.

**Install it in your home folder.** Mac: not in Desktop, Documents or Downloads. Windows: not in a OneDrive-synced folder.

## Mac (Terminal)

```bash
brew install node git
git clone https://github.com/GTAI-1/flow-mcp.git ~/flow-mcp
cd ~/flow-mcp && npm install && npm run build
npm run login
```

`npm run login` opens a Chrome window: sign in to Google by hand, open or create a Flow project, leave the window open.

Connect it to Claude Code for every folder:

```bash
claude mcp add --scope user flow -- node "$HOME/flow-mcp/dist/index.js"
```

## Windows (PowerShell)

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```

Close and reopen PowerShell, then:

```powershell
git clone https://github.com/GTAI-1/flow-mcp.git "$HOME\flow-mcp"
cd "$HOME\flow-mcp"; npm install; npm run build
npm run login
```

Sign in to Google in the window that opens, open or create a Flow project, leave it open. Then:

```powershell
claude mcp add --scope user flow -- node "$HOME\flow-mcp\dist\index.js"
```

## Claude Desktop app (either system)

Add this to `claude_desktop_config.json` (Mac: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`), keeping any servers already there. Use the full path; on Windows double the backslashes, for example `C:\\Users\\you\\flow-mcp\\dist\\index.js`. Quit and reopen the app.

```json
{ "mcpServers": { "flow": { "command": "node", "args": ["/full/path/to/flow-mcp/dist/index.js"] } } }
```

## Check it

Restart Claude, then ask: "Check my Flow session." It should report you signed in with your credit balance.

## Faster: let Claude Code do it

Paste into Claude Code on that laptop: *Set up Flow MCP from https://github.com/GTAI-1/flow-mcp for me. Install what it needs (Node.js 22+, Google Chrome, Git), put it in my home folder, build it, connect it for every folder with `claude mcp add --scope user`, then run `npm run login`.* You sign in to Google yourself in the window that opens.

## Notes
- The computer must be awake with the Chrome window left open while it generates. It does not work in claude.ai web chats or cloud sessions, because it drives a Chrome on the computer it is installed on.
- Windows support is described by its author as written but untried on a real PC; tell Claude if a step fails.
- Update later with `git pull && npm install && npm run build` in the `flow-mcp` folder.
