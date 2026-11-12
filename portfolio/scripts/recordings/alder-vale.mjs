// Alder & Vale: the knitting-needle cursor over the first screen, then down to "Try the look": pick a look, point at a piece, add it to the bag.
// node scripts/record-demo.mjs alder-vale <url> --length 20 --start 3 --script scripts/recordings/alder-vale.mjs
export default async function (r) {
  const to = async (sel, sec = 0.7, dy = 0) => { const p = await r.rect(sel); if (p) await r.move(p.x, p.y + dy, sec); return p; };
  await r.move(840, 430, 0.7); // the needle appears over the first screen
  await r.move(520, 470, 0.7);
  await r.wait(0.3);
  await r.scroll(2619, 2.3); // down to Try the look
  await r.wait(0.9); // the section reveals itself
  await r.move(420, 470, 0.6);
  await r.wait(0.5); // the cursor over the stage says Drag
  await to('.rw__tick:nth-child(3)', 0.8);
  await r.click(); // a different look
  await r.wait(1.1);
  await to('.rw__hero.is-on .rw__pin', 0.8); // point at a piece in the look
  await r.wait(0.8);
  await to('.rw__look-panel:not([hidden]) .rw__add', 0.8);
  await r.click(); // add it: the size picker opens
  await r.wait(0.9);
  await to('.rw__look-panel:not([hidden]) .rw__confirm', 0.6);
  await r.click();
  await r.wait(1.2);
  await r.until(20);
}
