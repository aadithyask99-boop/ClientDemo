// The Garden: the seal opens, then the page runs down to the first dance and scrubs it slowly, so the couple can be seen waltzing.
// node scripts/record-demo.mjs garden <url> --length 20 --start 2.2 --gate "I&T" --gate-wait 4.4 --script scripts/recordings/garden.mjs
export default async function (r) {
  await r.wait(0.5);
  await r.scroll(4867 - 60, 2.4); // down to the dance (the threads and photographs go past)
  await r.wait(0.6);
  await r.scroll(1700, 8.2); // slowly through the section: scroll scrubs the waltz
  await r.until(20);
}
