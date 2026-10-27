// All names, figures and addresses below are placeholders for a fictional firm.

/** Words wrapped in * get an underline once they light up */
export const statement = [
  "WE DON'T *JUST* MONITOR.",
  'WE RESPOND TOO.',
  'NETWORKS. CLOUD. PEOPLE.',
  'YOUR RISK. OUR WATCH.',
  'BUILT TO *HOLD*.',
];

export type ArtKind = 'rings' | 'nodes' | 'planes' | 'stream';

export const cases: { name: string; year: string; kind: string; accent: string; art: ArtKind }[] = [
  { name: 'MERIDIAN BANK', year: '2025', kind: 'ZERO-TRUST ROLLOUT', accent: '#2fd3c8', art: 'rings' },
  { name: 'NORTHWIND HEALTH', year: '2025', kind: 'RANSOMWARE RECOVERY', accent: '#4f8bff', art: 'nodes' },
  { name: 'ATLAS FREIGHT', year: '2024', kind: 'CLOUD POSTURE REVIEW', accent: '#ff7a45', art: 'planes' },
  { name: 'CORVID LABS', year: '2024', kind: 'THREAT INTELLIGENCE', accent: '#a47bff', art: 'stream' },
];

export const manifesto = ['NOBODY REMEMBERS', 'THE ATTACKS', 'WE STOPPED.'];

export const engagements: [string, string, string, string][] = [
  ['INCIDENT RESPONSE', 'HEALTHCARE', '(a.)', 'Northwind Health — 2025'],
  ['ZERO-TRUST', 'FINANCE', '(b.)', 'Meridian Bank — 2025'],
  ['CLOUD POSTURE', 'LOGISTICS', '(c.)', 'Atlas Freight — 2024'],
  ['THREAT INTEL', 'RESEARCH', '(d.)', 'Corvid Labs — 2024'],
  ['RED TEAM', 'ENERGY', '(e.)', 'Tern Power — 2024'],
  ['SOC RETAINER', 'RETAIL', '(f.)', 'Lumen & Co — 2023'],
  ['COMPLIANCE', 'INSURANCE', '(g.)', 'Harbor Mutual — 2023'],
  ['TABLETOP', 'PUBLIC SECTOR', '(h.)', 'Civic Works — 2022'],
];

export const wordmarks: { text: string; cls: string }[] = [
  { text: 'MERIDIAN', cls: 'wm--wide' },
  { text: 'northwind', cls: 'wm--soft' },
  { text: 'ATLAS°', cls: 'wm--bold' },
  { text: 'corvid', cls: 'wm--mono' },
  { text: 'TERN', cls: 'wm--wide' },
  { text: 'lumen&co', cls: 'wm--soft' },
  { text: 'HARBOR', cls: 'wm--bold' },
];

export const services: { name: string; tag: string; art: ArtKind }[] = [
  { name: 'MONITORING', tag: 'DETECT', art: 'rings' },
  { name: 'RESPONSE', tag: 'CONTAIN', art: 'nodes' },
  { name: 'CLOUD', tag: 'HARDEN', art: 'planes' },
  { name: 'INTEL', tag: 'ANTICIPATE', art: 'stream' },
];

/** Small inline illustrations, drawn in code, used on the tiles and as hover thumbnails */
export function art(kind: ArtKind, accent: string): string {
  const bg = `<defs><linearGradient id="g-${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a1830"/><stop offset="1" stop-color="#050b16"/></linearGradient></defs><rect width="320" height="180" fill="url(#g-${kind})"/>`;
  let body = '';
  if (kind === 'rings') {
    body = [20, 38, 58, 80, 104]
      .map((r, i) => `<circle cx="190" cy="92" r="${r}" fill="none" stroke="${accent}" stroke-opacity="${0.55 - i * 0.09}" stroke-width="1.2"/>`)
      .join('') +
      `<path d="M190 92 L190 -10 A104 104 0 0 1 270 25 Z" fill="${accent}" fill-opacity=".22"/><line x1="190" y1="92" x2="190" y2="-12" stroke="${accent}" stroke-width="1.5"/><circle cx="226" cy="58" r="3.5" fill="${accent}"/><circle cx="150" cy="120" r="2.5" fill="${accent}" fill-opacity=".7"/>`;
  } else if (kind === 'nodes') {
    const pts: [number, number][] = [];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 7; x++) pts.push([48 + x * 38 + (y % 2) * 14, 36 + y * 36]);
    body = pts.map(([x, y], i) => (i % 5 === 2 ? '' : `<line x1="${x}" y1="${y}" x2="${pts[(i + 8) % pts.length][0]}" y2="${pts[(i + 8) % pts.length][1]}" stroke="${accent}" stroke-opacity=".28"/>`)).join('') +
      pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 6 === 1 ? 5 : 2.6}" fill="${accent}" fill-opacity="${i % 6 === 1 ? 1 : 0.55}"/>`).join('');
  } else if (kind === 'planes') {
    body = [0, 1, 2].map((i) => `<polygon points="160,${40 + i * 30} 250,${78 + i * 30} 160,${116 + i * 30} 70,${78 + i * 30}" fill="${accent}" fill-opacity="${0.34 - i * 0.09}" stroke="${accent}" stroke-opacity=".7"/>`).join('');
  } else {
    body = Array.from({ length: 14 }, (_, i) => `<line x1="${10 + (i * 37) % 60}" y1="${14 + i * 11.6}" x2="${150 + (i * 53) % 160}" y2="${14 + i * 11.6}" stroke="${accent}" stroke-opacity="${0.25 + (i % 4) * 0.18}" stroke-width="1.6" stroke-dasharray="${6 + (i % 3) * 8} ${5 + (i % 4) * 4}"/>`).join('');
  }
  return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${bg}${body}</svg>`;
}
