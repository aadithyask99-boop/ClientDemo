// Uploads a document to Dograh's knowledge base from INSIDE the Codespace, where Dograh's storage (localhost:9000) is reachable.
// The browser upload on the Files page fails because its upload address is http://localhost:9000, which is the visitor's own PC.
//
//   DG_API=http://localhost:8000/api/v1 DG_EMAIL=... DG_PASSWORD=... node upload-kb.mjs ../kb/acme-plumbing-faq.txt [full|chunked]
//
// Prints the document id and attaches nothing: attach the document to an agent node in Dograh's agent editor.
import fs from "node:fs";
import path from "node:path";

const base = process.env.DG_API;
const file = process.argv[2];
const mode = process.argv[3] ?? "full";
if (!base || !process.env.DG_EMAIL || !process.env.DG_PASSWORD || !file) throw new Error("DG_API, DG_EMAIL, DG_PASSWORD and a file path are required");

async function api(method, p, body, token) {
  const r = await fetch(base + p, { method, headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch {}
  return { s: r.status, j };
}

const login = await api("POST", "/auth/login", { email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD });
if (login.s >= 400) throw new Error("login failed " + login.s);
const token = login.j.token;

// The accepted retrieval modes come from the API's own schema, so a rename does not break this script.
const spec = await (await fetch(base + "/openapi.json")).json();
const processSchema = Object.values(spec.components.schemas).find((s) => s.properties?.s3_key && s.properties?.retrieval_mode);
const modeSchema = processSchema?.properties?.retrieval_mode;
const enumRef = modeSchema?.$ref?.split("/").pop() ?? modeSchema?.allOf?.[0]?.$ref?.split("/").pop();
const allowed = modeSchema?.enum ?? spec.components.schemas[enumRef]?.enum ?? [];
const retrieval = allowed.find((m) => m.includes(mode)) ?? allowed[0];
console.log("retrieval modes:", allowed.join(", "), "-> using", retrieval);

const name = path.basename(file);
const mime = name.endsWith(".md") ? "text/markdown" : name.endsWith(".pdf") ? "application/pdf" : "text/plain";
const up = await api("POST", "/knowledge-base/upload-url", { filename: name, mime_type: mime }, token);
console.log("upload-url", up.s, up.s >= 400 ? JSON.stringify(up.j).slice(0, 300) : "keys: " + Object.keys(up.j ?? {}).join(","));
if (up.s >= 400) process.exit(1);
const url = up.j.upload_url ?? up.j.presigned_url ?? up.j.url;
const put = await fetch(url, { method: "PUT", headers: { "content-type": mime }, body: fs.readFileSync(file) });
console.log("storage upload", put.status);
if (!put.ok) process.exit(1);

const done = await api("POST", "/knowledge-base/process-document", { document_uuid: up.j.document_uuid, s3_key: up.j.s3_key, retrieval_mode: retrieval }, token);
console.log("process-document", done.s, done.s >= 400 ? JSON.stringify(done.j).slice(0, 300) : "ok");
console.log("document_uuid", up.j.document_uuid);
