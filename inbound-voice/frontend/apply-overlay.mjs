// Copies our pages into a checkout of dograh-hq/dograh and sets up our sidebar items.
// Usage: node apply-overlay.mjs <path to the dograh checkout>
// Safe to re-run: it copies files over, adds sidebar items that are missing and removes the ones we retired.
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2];
if (!root || !existsSync(join(root, "ui/src/components/layout/AppSidebar.tsx"))) {
  console.error("Usage: node apply-overlay.mjs <dograh checkout>");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
cpSync(join(here, "overlay/src"), join(root, "ui/src"), { recursive: true });

// In the order they appear in the sidebar, above "Voice Agents".
const ITEMS = [
  { title: "Calendar", url: "/calendar", icon: "CalendarDays" },
  { title: "Customers", url: "/customers", icon: "Users" },
  { title: "Calls", url: "/calls", icon: "PhoneCall" },
  { title: "Follow-ups", url: "/follow-ups", icon: "ListChecks" },
];

// Items we added earlier and no longer want (the full CRM is gone; its data lives in our own call log now).
const RETIRED = ["/crm"];

const file = join(root, "ui/src/components/layout/AppSidebar.tsx");
const raw = readFileSync(file, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";
let s = raw.replace(/\r\n/g, "\n");

const must = (ok, what) => {
  if (!ok) throw new Error(`Sidebar patch failed: ${what} not found (Dograh changed this file?)`);
};
const anchor = '      {\n        title: "Voice Agents",';

let removed = 0;
for (const url of RETIRED) {
  const line = new RegExp(String.raw`^ *\{ title: "[^"]+", url: "${url}", icon: (\w+) \},\n`, "m");
  const m = line.exec(s);
  if (!m) continue;
  s = s.replace(line, "");
  const importLine = new RegExp(String.raw`^  ${m[1]},\n`, "m");
  // Drop the icon import too, but only if nothing else in the file uses it.
  if (!new RegExp(String.raw`\b${m[1]}\b`).test(s.replace(importLine, ""))) s = s.replace(importLine, "");
  removed++;
}

let added = 0;
for (const item of ITEMS) {
  if (s.includes(`url: "${item.url}"`)) continue;
  must(s.includes("  Brain,\n"), "icon import list");
  must(s.includes(anchor), "Voice Agents item");
  if (!new RegExp(String.raw`^  ${item.icon},$`, "m").test(s)) s = s.replace("  Brain,\n", `  Brain,\n  ${item.icon},\n`);
  s = s.replace(anchor, `      { title: "${item.title}", url: "${item.url}", icon: ${item.icon} },\n` + anchor);
  added++;
}

if (added || removed) writeFileSync(file, s.replace(/\n/g, eol));
console.log(added || removed ? `Sidebar patched (${added} added, ${removed} removed).` : "Sidebar already patched.");
console.log("Overlay applied. UI server settings: CALL_SERVICE_URL and CALL_SERVICE_TOKEN.");
