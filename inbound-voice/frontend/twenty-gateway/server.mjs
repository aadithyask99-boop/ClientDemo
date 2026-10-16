// Sits in front of Twenty so a client who is already signed in to our app never sees Twenty's login.
// Every visitor without a Twenty session is signed in as one configured Twenty user (one per client deployment),
// and Twenty is allowed to be shown inside our app's page. Twenty's own code is not touched.
//
// Env: UPSTREAM (default http://localhost:2020), PORT (2021), LOGIN_EMAIL, LOGIN_PASSWORD,
//      FRAME_ANCESTORS (space separated origins allowed to frame it, default 'self').
// Only expose this behind our app's own access control: anyone who can reach it is signed in.
import http from "node:http";
import { URL } from "node:url";

const upstream = new URL(process.env.UPSTREAM ?? "http://localhost:2020");
const port = Number(process.env.PORT ?? 2021);
const email = process.env.LOGIN_EMAIL;
const password = process.env.LOGIN_PASSWORD;
const frameAncestors = process.env.FRAME_ANCESTORS ?? "'self'";
const SESSION = "twenty-session";
const SIGNED_IN_FLAG = "isCookieAuthActiveState";
if (!email || !password) {
  console.error("LOGIN_EMAIL and LOGIN_PASSWORD are required");
  process.exit(1);
}

const gql = async (query) => {
  const res = await fetch(new URL("/metadata", upstream), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }) });
  return { res, body: await res.json() };
};
const q = (s) => JSON.stringify(s);

/** Signs in as the configured user and returns the Set-Cookie lines for the session. */
async function login() {
  const origin = upstream.origin;
  const first = await gql(`mutation{getLoginTokenFromCredentials(email:${q(email)},password:${q(password)},origin:${q(origin)}){loginToken{token}}}`);
  const loginToken = first.body?.data?.getLoginTokenFromCredentials?.loginToken?.token;
  if (!loginToken) throw new Error("login step 1 failed");
  const second = await gql(`mutation{getAuthTokensFromLoginToken(loginToken:${q(loginToken)},origin:${q(origin)}){tokens{accessOrWorkspaceAgnosticToken{token}}}}`);
  const cookies = second.res.headers.getSetCookie().filter((c) => c.startsWith(`${SESSION}=`));
  if (!cookies.length) throw new Error("login step 2 returned no session");
  return cookies;
}

/** Cookies have to survive being set from a frame under another site: SameSite=None needs Secure, so only when served over https. */
const adjustCookie = (cookie, secure) =>
  secure ? cookie.replace(/;\s*SameSite=\w+/i, "").replace(/;\s*Secure/i, "") + "; SameSite=None; Secure" : cookie;

const hasSession = (req) => (req.headers.cookie ?? "").split(/;\s*/).some((c) => c.startsWith(`${SESSION}=`));
const isPage = (req) => req.method === "GET" && (req.headers.accept ?? "").includes("text/html");
const isHttps = (req) => (req.headers["x-forwarded-proto"] ?? "").split(",")[0] === "https";

function proxy(req, res) {
  const headers = { ...req.headers, host: upstream.host };
  delete headers["accept-encoding"]; // keep bodies uncompressed so nothing needs rewriting
  // Twenty ties a session to the address it signed in at, so present its own address upstream.
  if (headers.origin) headers.origin = upstream.origin;
  if (headers.referer) headers.referer = upstream.origin + new URL(headers.referer).pathname;
  const out = http.request({ host: upstream.hostname, port: upstream.port, method: req.method, path: req.url, headers }, (up) => {
    const h = { ...up.headers };
    delete h["x-frame-options"];
    if (typeof h["content-security-policy"] === "string") {
      h["content-security-policy"] = h["content-security-policy"].replace(/frame-ancestors[^;]*;?/i, "").trim() + `; frame-ancestors ${frameAncestors}`;
    }
    if (String(h["content-type"] ?? "").includes("text/html") && up.statusCode === 200) {
      // The session cookie is HttpOnly, so Twenty's page decides "signed in" from this local-storage flag. Set it before the app starts.
      const chunks = [];
      up.on("data", (c) => chunks.push(c));
      up.on("end", () => {
        const html = Buffer.concat(chunks).toString("utf8").replace("<head>", `<head><script>try{localStorage.setItem("${SIGNED_IN_FLAG}","true")}catch(e){}</script>`);
        h["content-length"] = Buffer.byteLength(html);
        res.writeHead(200, h);
        res.end(html);
      });
      return;
    }
    res.writeHead(up.statusCode ?? 502, h);
    up.pipe(res);
  });
  out.on("error", () => {
    if (!res.headersSent) res.writeHead(502);
    res.end("CRM is not reachable");
  });
  req.pipe(out);
}

const server = http.createServer(async (req, res) => {
  try {
    if (!hasSession(req) && isPage(req)) {
      const cookies = (await login()).map((c) => adjustCookie(c, isHttps(req)));
      res.writeHead(302, { location: req.url, "set-cookie": cookies, "cache-control": "no-store" });
      return res.end();
    }
    proxy(req, res);
  } catch (err) {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end(`CRM sign-in failed: ${err.message}`);
  }
});

// Live updates from Twenty use upgrades on some versions: pass them through untouched.
server.on("upgrade", (req, socket, head) => {
  const out = http.request({ host: upstream.hostname, port: upstream.port, method: req.method, path: req.url, headers: { ...req.headers, host: upstream.host } });
  out.on("upgrade", (up, upSocket, upHead) => {
    socket.write(`HTTP/1.1 101 Switching Protocols\r\n${Object.entries(up.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n")}\r\n\r\n`);
    if (upHead.length) socket.write(upHead);
    upSocket.pipe(socket).pipe(upSocket);
  });
  out.on("error", () => socket.destroy());
  out.end(head);
});

server.listen(port, () => console.log(`twenty gateway on ${port} -> ${upstream.origin}`));
