// Copies our pages into a checkout of dograh-hq/dograh and adds two sidebar items.
// Usage: node apply-overlay.mjs <path to the dograh checkout>
// Safe to re-run: it copies files over and only patches the sidebar once.
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

const file = join(root, "ui/src/components/layout/AppSidebar.tsx");
const raw = readFileSync(file, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";
let s = raw.replace(/\r\n/g, "\n");
if (s.includes('url: "/crm"')) {
  console.log("Sidebar already patched.");
} else {
  const must = (ok, what) => {
    if (!ok) throw new Error(`Sidebar patch failed: ${what} not found (Dograh changed this file?)`);
  };
  must(s.includes("  Brain,\n"), "icon import list");
  s = s.replace("  Brain,\n", "  Brain,\n  CalendarDays,\n  Contact,\n");
  const anchor = '      {\n        title: "Voice Agents",';
  must(s.includes(anchor), "Voice Agents item");
  s = s.replace(
    anchor,
    '      { title: "CRM", url: "/crm", icon: Contact },\n      { title: "Calendar", url: "/calendar", icon: CalendarDays },\n' + anchor,
  );
  writeFileSync(file, s.replace(/\n/g, eol));
  console.log("Sidebar patched.");
}
console.log("Overlay applied. Set CALL_SERVICE_URL and CALL_SERVICE_TOKEN (server) and NEXT_PUBLIC_TWENTY_URL (build) for the UI.");
