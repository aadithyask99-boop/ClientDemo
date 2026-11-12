// Smashley's: the cartoon glove cursor, then "Build your own smash": fewer patties, bacon on, a side, then add it to the cart. Slower than the plain scroll.
// node scripts/record-demo.mjs smashlads <url> --length 20 --start 5.5 --script scripts/recordings/smashlads.mjs
export default async function (r) {
  const to = async (sel, sec = 0.7) => { const p = await r.rect(sel); if (p) await r.move(p.x, p.y, sec); return p; };
  await r.move(880, 420, 0.7);
  await r.wait(0.6);
  await r.scroll(3136 + 120, 2.6); // down to the builder, far enough that the whole burger and every choice are on the screen
  await r.wait(1.0);
  await to('[data-bp="1"]', 0.8);
  await r.click(); // one patty
  await r.wait(0.9);
  await to('[data-bt="bacon"]', 0.7);
  await r.click(); // bacon on
  await r.wait(0.9);
  await to('[data-bp="2"]', 0.7);
  await r.click(); // back to a double
  await r.wait(0.9);
  await to('[data-side]:not([data-side="none"])', 0.7);
  await r.click(); // make it a meal
  await r.wait(1.0);
  await to('[data-send]', 0.8);
  await r.click(); // add to cart
  await r.wait(1.2);
  await r.until(20);
}
