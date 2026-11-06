// Renders MALEDETTA in Oswald 700 with rough ink-bleed edges to a transparent PNG (used as a CSS mask so it takes the palette colour).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
import { readFileSync } from 'node:fs';
const font = readFileSync('node_modules/@fontsource/oswald/files/oswald-latin-700-normal.woff2').toString('base64');
const html = `<html><body style="margin:0;background:transparent">
<svg width="0" height="0"><filter id="r" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="9"/><feDisplacementMap in="SourceGraphic" scale="11"/></filter></svg>
<style>@font-face{font-family:O;src:url(data:font/woff2;base64,${font})}
#t{font:700 640px/1 O;letter-spacing:-6px;color:#000;display:inline-block;padding:40px 30px;filter:url(#r);white-space:nowrap;text-transform:uppercase}</style>
<div id="t">MALEDETTA</div></body></html>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 3600, height: 1000 } });
await p.setContent(html); await p.evaluate(() => document.fonts.ready);
const box = await (await p.$('#t')).boundingBox(); console.log(box);
await p.screenshot({ path: 'art-src/wordmark-raw.png', omitBackground: true, clip: box });
await b.close();
