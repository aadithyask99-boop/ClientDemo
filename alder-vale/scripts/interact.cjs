const { chromium } = require('playwright');
(async () => {
  const [url, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(6200);
  await p.screenshot({ path: out + '/a-hero.png' });
  await p.click('.swatch[data-id="snowfield"]'); await p.waitForTimeout(330); await p.screenshot({ path: out + '/b-fog.png' });
  await p.waitForTimeout(1500); await p.screenshot({ path: out + '/c-snowfield.png' });
  await p.click('.swatch[data-id="hearth"]'); await p.waitForTimeout(1800); await p.screenshot({ path: out + '/d-hearth.png' });
  await p.click('.size[data-size="L"]');
  await p.click('#addBtn'); await p.waitForTimeout(450); await p.screenshot({ path: out + '/e-fly.png' });
  await p.waitForTimeout(1800); await p.screenshot({ path: out + '/f-drawer.png' });
  console.log('count', await p.textContent('#bagCount'), 'sub', await p.textContent('#subtotal'));
  await p.click('#pairs .addbtn'); await p.waitForTimeout(700); await p.screenshot({ path: out + '/g-drawer2.png' });
  await p.click('#checkoutBtn'); await p.waitForTimeout(700); await p.screenshot({ path: out + '/h-load.png' });
  await p.waitForTimeout(1900); await p.screenshot({ path: out + '/i-checkout.png' });
  await p.click('#backBtn'); await p.waitForTimeout(800);
  // melt egg
  await p.mouse.move(700, 450); await p.mouse.down(); await p.waitForTimeout(1500); await p.screenshot({ path: out + '/j-melt.png' }); await p.mouse.up();
  // cocoa
  await p.keyboard.type('cocoa'); await p.waitForTimeout(1200); await p.screenshot({ path: out + '/k-cocoa.png' });
  // quick add
  await p.evaluate(() => document.getElementById('collection').scrollIntoView()); await p.waitForTimeout(1500);
  await p.hover('.card:nth-of-type(2) .tile'); await p.waitForTimeout(700); await p.screenshot({ path: out + '/l-hover.png' });
  console.log('errors:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();
