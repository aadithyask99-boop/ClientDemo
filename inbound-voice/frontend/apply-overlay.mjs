// Copies our pages into a checkout of dograh-hq/dograh and adds our items to the sidebar.
// Usage: node apply-overlay.mjs <path to the dograh checkout>
// Safe to re-run: it copies files over and only adds sidebar items that are not there yet.
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
  { title: "CRM", url: "/crm", icon: "Contact" },
  { title: "Calendar", url: "/calendar", icon: "CalendarDays" },
  { title: "Customers", url: "/customers", icon: "Users" },
  { title: "Calls", url: "/calls", icon: "PhoneCall" },
  { title: "Follow-ups", url: "/follow-ups", icon: "ListChecks" },
];

const file = join(root, "ui/src/components/layout/AppSidebar.tsx");
const raw = readFileSync(file, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";
let s = raw.replace(/\r\n/g, "\n");

const must = (ok, what) => {
  if (!ok) throw new Error(`Sidebar patch failed: ${what} not found (Dograh changed this file?)`);
};
const anchor = '      {\n        title: "Voice Agents",';
let added = 0;
for (const item of ITEMS) {
  if (s.includes(`url: "${item.url}"`)) continue;
  must(s.includes("  Brain,\n"), "icon import list");
  must(s.includes(anchor), "Voice Agents item");
  if (!new RegExp(`^  ${item.icon},$`, "m").test(s)) s = s.replace("  Brain,\n", `  Brain,\n  ${item.icon},\n`);
  s = s.replace(anchor, `      { title: "${item.title}", url: "${item.url}", icon: ${item.icon} },\n` + anchor);
  added++;
}
if (added) writeFileSync(file, s.replace(/\n/g, eol));
console.log(added ? `Sidebar patched (${added} item${added > 1 ? "s" : ""} added).` : "Sidebar already patched.");
console.log("Overlay applied. UI server settings: CALL_SERVICE_URL, CALL_SERVICE_TOKEN, TWENTY_URL, TWENTY_API_KEY; build setting: NEXT_PUBLIC_TWENTY_URL.");
