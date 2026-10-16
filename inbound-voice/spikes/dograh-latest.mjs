// Usage: DG_API=... DG_EMAIL=... DG_PASSWORD=... [RUN=<id>] node dograh-latest.mjs   (latest non-text-chat run: outcome, tools, cost; transcript text is easier to read on the Dograh run page)
const b = process.env.DG_API;
const l = await (await fetch(b + "/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: process.env.DG_EMAIL, password: process.env.DG_PASSWORD }) })).json();
const H = { authorization: "Bearer " + l.token };
const list = await (await fetch(b + "/workflow/1/runs?limit=5", { headers: H })).json();
const runs = list.runs ?? list.items ?? list;
console.log("runs:", runs.map((r) => `#${r.id} ${r.mode ?? ""} ${r.created_at ?? ""}`).join(" | "));
const id = process.env.RUN ?? runs.find((r) => (r.mode ?? "") !== "textchat")?.id ?? runs[0]?.id;
const info = await (await fetch(`${b}/workflow/1/runs/${id}`, { headers: H })).json();
const gc = info.gathered_context ?? {};
console.log("RUN", id, "mode", info.mode, "complete", info.is_completed, "nodes", JSON.stringify(gc.nodes_visited), "disposition", gc.call_disposition, "outcome", gc.outcome);
console.log("cost/usage", JSON.stringify(info.cost_info ?? {}).slice(0, 300), JSON.stringify(info.usage_info ?? {}).slice(0, 300));
for (const t of gc.tool_results ?? []) console.log("TOOL", t.function_name, JSON.stringify(t.arguments), "=>", JSON.stringify(t.result).slice(0, 260));
console.log("recording:", info.recording_url ? "yes" : "no", "transcript:", info.transcript_url ? "yes" : "no");
if (info.transcript_url) { try { const t = await (await fetch(info.transcript_url)).text(); console.log("TRANSCRIPT\n" + t.slice(0, 2500)); } catch (e) { console.log("transcript fetch failed", String(e)); } }
