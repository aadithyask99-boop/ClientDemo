// Local test: node test/run.mjs "<prompt>"  (needs BROWSER_USE_API_KEY and FLOW_PROFILE_ID in the environment)
import { writeFileSync, mkdirSync } from 'node:fs';
import { startBrowser, stopBrowser } from '../src/browseruse.js';
import { Page } from '../src/cdp.js';
import { openProject, generateImages } from '../src/flow.js';
const env = process.env;
const b = await startBrowser(env, 10);
let page;
try {
  await new Promise((r) => setTimeout(r, 3000));
  page = await Page.attach(b.cdpUrl);
  const t0 = Date.now();
  const project = await openProject(page, env);
  console.log('project', project, `${Date.now() - t0}ms`);
  const r = await generateImages(page, { prompt: process.argv[2] || 'a single green monstera leaf on a flat white background', aspect: '1:1', count: 1 });
  console.log('agent said:', r.agent);
  mkdirSync('/tmp/flowtest', { recursive: true });
  r.images.forEach((im, i) => { const f = `/tmp/flowtest/img${i}.${im.type.split('/')[1] || 'bin'}`; writeFileSync(f, Buffer.from(im.b64, 'base64')); console.log('saved', f, im.type, im.bytes); });
  console.log('total', `${Date.now() - t0}ms`);
} catch (e) { console.error('FAIL', e.message); }
finally { page?.close(); await stopBrowser(env, b.id); console.log('browser stopped'); }
