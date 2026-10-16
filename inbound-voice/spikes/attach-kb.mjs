// Points the agent at a (re-)uploaded knowledge base document and publishes, so the Dograh editor is not needed.
//
//   DG_API=http://localhost:8000/api/v1 DG_EMAIL=... DG_PASSWORD=... WORKFLOW_ID=1 node attach-kb.mjs <document_uuid from upload-kb.mjs>
//
// Every list of document ids found on a node of the agent is replaced with the one given, so the old document stops being used.
const base = process.env.DG_API;
const workflowId = process.env.WORKFLOW_ID ?? "1";
const uuid = process.argv[2];
if (!base || !process.env.DG_EMAIL || !process.env.DG_PASSWORD || !uuid) throw new Error("DG_API, DG_EMAIL, DG_PASSWORD and a document uuid are required");

let tok = "";
async function api(method, path, body) {
  const r = await fetch(base + path, { method, headers: { "content-type": "application/json", ...(tok ? { authorization: "Bearer " + tok } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null;
  try { j = await r.json(); } catch {}
  return { s: r.status, j };
}

const li = await api("POST", "/auth/login", { email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD });
if (li.s >= 400) throw new Error("login failed " + li.s);
tok = li.j.token;

const cur = await api("GET", "/workflow/fetch/" + workflowId);
if (cur.s >= 400) throw new Error("fetch failed " + cur.s);
const def = cur.j.workflow_definition;

let replaced = 0;
const walk = (v, where) => {
  if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${where}[${i}]`));
  if (!v || typeof v !== "object") return;
  for (const [k, val] of Object.entries(v)) {
    if (/document/i.test(k) && Array.isArray(val) && val.every((x) => typeof x === "string")) {
      console.log("replacing", `${where}.${k}`, "(" + val.length + " id)");
      v[k] = [uuid];
      replaced++;
    } else walk(val, `${where}.${k}`);
  }
};
walk(def, "definition");
if (!replaced) throw new Error("no list of document ids found on any node; attach once in the editor first");

const put = await api("PUT", "/workflow/" + workflowId, { workflow_definition: def, workflow_configurations: cur.j.workflow_configurations });
console.log("update agent", put.s);
const pub = await api("POST", `/workflow/${workflowId}/publish`);
console.log("publish", pub.s);
