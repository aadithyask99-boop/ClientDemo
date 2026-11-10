// All page content lives here. Everything invented (stats, reviews, prices, ratings, the brand itself) is illustrative:
// Alder & Vale is a fictional label made for a concept demo.

export const brand = {
  name: 'Alder & Vale',
  short: 'ALDER & VALE',
  initials: 'AV',
  season: 'Season 01',
  lodgeElevation: 2480,
};

export const nav = [
  { label: 'Shop', href: '#collection' },
  { label: 'Knitwear', href: '#specs' },
  { label: 'Lookbook', href: '#lookbook' },
  { label: 'Story', href: '#log' },
];

export type Colourway = {
  id: string;
  name: string;
  yarn: string;
  price: number;
  hero: string; // cutout image
  thumb: string; // round thumbnail
  ground: string; // hero ground colour
  word: string; // hero wordmark tint
  ink: string; // hero text colour
  pill: string; // pill ground
  dark: boolean;
};

export const product = {
  id: 'stag-quarter-zip',
  title: 'Stag cable quarter-zip',
  crumb: 'Drop 01 / FW26 / 4 colourways',
  sizes: ['S', 'M', 'L', 'XL'],
  rating: 4.9,
  reports: '1,240',
  note: 'Knit in two-ply Scottish merino. Mended free for two years.',
};

export const colourways: Colourway[] = [
  { id: 'midnight', name: 'Midnight', yarn: 'Navy', price: 398, hero: 'img/hero-midnight.webp', thumb: 'img/thumb-midnight.webp', ground: '#a9b8cc', word: '#d2dbe7', ink: '#0f1c33', pill: '#f1ede4', dark: false },
  { id: 'snowfield', name: 'Snowfield', yarn: 'Ivory', price: 398, hero: 'img/hero-snowfield.webp', thumb: 'img/thumb-snowfield.webp', ground: '#5d7391', word: '#7f93ad', ink: '#f1ede4', pill: '#f1ede4', dark: true },
  { id: 'pine', name: 'Pine', yarn: 'Forest', price: 428, hero: 'img/hero-pine.webp', thumb: 'img/thumb-pine.webp', ground: '#bcc9c0', word: '#dbe4de', ink: '#10261f', pill: '#f1ede4', dark: false },
  { id: 'hearth', name: 'Hearth', yarn: 'Oxblood', price: 428, hero: 'img/hero-hearth.webp', thumb: 'img/thumb-hearth.webp', ground: '#d8cdc0', word: '#ece4d8', ink: '#2a1015', pill: '#f1ede4', dark: false },
];

export const collection = {
  title: 'New collection',
  cta: 'Shop all 24',
  feature: { name: 'The Stag Edit', sub: 'Ivory cable knit, navy stag', price: 398, img: 'img/col-feature.webp' },
  items: [
    { id: 'crew', name: 'Heritage crew', sub: 'Cream cable knit', price: 348, img: 'img/col-crew.webp', dots: ['#efe6d2', '#0f1c33'] },
    { id: 'cardigan', name: 'Shawl cardigan', sub: 'Pine cable knit', price: 468, img: 'img/col-cardigan.webp', dots: ['#1c4a3c', '#0f1c33'] },
    { id: 'polo', name: 'Knit polo', sub: 'Navy, cream stag', price: 328, img: 'img/col-polo.webp', dots: ['#0f1c33', '#efe6d2'] },
    { id: 'turtle', name: 'Merino turtleneck', sub: 'Ivory', price: 298, img: 'img/col-turtle.webp', dots: ['#efe6d2', '#8c2433'] },
    { id: 'oxzip', name: 'Hearth quarter-zip', sub: 'Oxblood, cream stag', price: 428, img: 'img/col-oxzip.webp', dots: ['#8c2433', '#efe6d2'] },
    { id: 'fisher', name: 'Fisherman rib', sub: 'Navy', price: 378, img: 'img/col-fisher.webp', dots: ['#0f1c33', '#5d7391'] },
    { id: 'vest', name: 'Cable vest', sub: 'Heather grey', price: 268, img: 'img/col-vest.webp', dots: ['#a5a8ad', '#0f1c33'] },
    { id: 'stripe', name: 'Breton crew', sub: 'Navy and cream', price: 318, img: 'img/col-stripe.webp', dots: ['#0f1c33', '#efe6d2'] },
  ],
};

export const proof = {
  title: 'Knitted, not styled',
  cards: [
    { img: 'img/macro-cable.webp', value: 30, prefix: '−', unit: '°C', label: 'Comfort rating', text: 'Warmest cable knit in the line, Midnight.', dec: 0 },
    { img: 'img/macro-fibre.webp', value: 18.5, prefix: '', unit: 'µm', label: 'Merino fibre', text: 'Fine enough to sit soft against skin.', dec: 1 },
    { img: 'img/macro-collar.webp', value: 2, prefix: '', unit: 'yr', label: 'Free repairs', text: 'Moth, snag or hole. We mend it.', dec: 0 },
    { img: 'img/macro-parcel.webp', value: 48, prefix: '', unit: 'h', label: 'To your door', text: 'Duties included, wrapped for snow.', dec: 0 },
  ],
};

export const weather = {
  lines: ['Knit for cold', 'Made for height', 'Stitched to last'],
  left: 'Alder & Vale was born in a lodge at 1,800 m, not as a trend, but as an answer.',
  right: 'Every knit is worn on the slopes above 1,500 m before it is sold.',
  two: { l: 'Made slowly', r: 'Kept for life' },
};

export const specs = {
  heading: ['When the cold hits,', 'everything else', 'goes quiet.'],
  closing: ["You don't feel cold.", 'You feel less.'],
  tags: ['Ribbed storm collar', 'Two-ply merino', 'Hand-linked cable'],
  tested: 'Worn at −18°C on the Jungfrau ridge',
  cta: 'Shop Midnight',
};

export const shelf = {
  title: 'Lodge edit',
  text: 'Scarves, beanies, gloves, socks and the folded knits that finish a layer. Fair Isle patterns, cut from the same yarn.',
  cta: 'All 18',
  items: [
    { id: 'scarf', name: 'Fair Isle scarf', price: 148, img: 'img/acc-scarf.webp', rating: 4.9, dots: ['#0f1c33', '#efe6d2'] },
    { id: 'beanie', name: 'Stag beanie', price: 98, img: 'img/acc-beanie.webp', rating: 4.8, dots: ['#efe6d2', '#0f1c33'] },
    { id: 'gloves', name: 'Pine wool gloves', price: 128, img: 'img/acc-gloves.webp', rating: 4.7, dots: ['#1c4a3c'] },
    { id: 'crew', name: 'Hearth crew', price: 348, img: 'img/acc-crew.webp', rating: 4.9, dots: ['#8c2433', '#0f1c33'] },
    { id: 'polo', name: 'Knit polo', price: 298, img: 'img/acc-polo.webp', rating: 4.8, dots: ['#0f1c33'] },
    { id: 'socks', name: 'Nordic socks', price: 58, img: 'img/acc-socks.webp', rating: 4.9, dots: ['#efe6d2', '#0f1c33'] },
  ],
};

export const lookbook = {
  title: ['Shot above', 'the snow line'],
  text: 'Eight days in the Bernese Alps with the people who wear it. No studio, no retouched snow.',
  cta: 'Open the lookbook',
  images: ['look-1', 'look-2', 'look-3', 'look-4', 'look-5', 'look-6', 'look-7'].map((n) => `img/${n}.webp`),
};

export const log = {
  title: ['Lodge', 'log'],
  rating: 4.9,
  count: '1,141 reports from the lodge',
  flags: [
    { at: 0.12, alt: '1,020 m' },
    { at: 0.3, alt: '1,260 m' },
    { at: 0.47, alt: '1,540 m' },
    { at: 0.63, alt: '1,880 m' },
    { at: 0.81, alt: '2,210 m' },
    { at: 0.97, alt: '2,480 m' },
  ],
  reviews: [
    { text: 'Fits like it was knit for me. I stopped looking at other labels.', name: 'Marc D.', where: 'Zermatt, verified buyer' },
    { text: 'Warmer than my old down, and nothing rustles on the lift.', name: 'Ines H.', where: 'Verbier, verified buyer' },
    { text: 'Still soft after a full season of washing and wearing.', name: 'Tom R.', where: 'Chamonix, verified buyer' },
    { text: 'Everyone at the lodge asked about the stag.', name: 'Sofia L.', where: 'St. Moritz, verified buyer' },
    { text: 'A moth got to the cuff. They mended it free and it came back perfect.', name: 'Hugo B.', where: 'Gstaad, verified buyer' },
    { text: 'The best knit I own. I wore it from the first lift to the last fire.', name: 'Anna K.', where: 'Lech, verified buyer' },
  ],
};

export const drop = {
  title: ['Drop 02', 'The Lodge'],
  closes: '2026-12-20T18:00:00',
  text: 'Eight cable knits in the colours of a lit lodge. Members get first access.',
  cta: 'Join the waitlist',
  placeholder: 'Your email',
  lit: 'The fire is lit.',
};

export const footer = {
  title: ['Be first', 'in the first snow.'],
  text: 'Early access to drops, mending days and the lodge list.',
  cols: [
    { h: 'Shop', links: ['Quarter-zips', 'Crew necks', 'Polos', 'Cardigans', 'Accessories'] },
    { h: 'Help', links: ['Shipping', 'Returns', 'Care and mending', 'Size guide', 'Contact'] },
  ],
};

export const cartExtras = [
  { id: 'scarf', name: 'Fair Isle scarf', sub: 'Navy, one size', price: 148, img: 'img/acc-scarf.webp' },
  { id: 'beanie', name: 'Stag beanie', sub: 'Cream, one size', price: 98, img: 'img/acc-beanie.webp' },
  { id: 'gloves', name: 'Pine wool gloves', sub: 'Forest, M', price: 128, img: 'img/acc-gloves.webp' },
];

// Try the look: six outfits built from the line. Prices come from the products, the bundle is computed.
export const runway = {
  title: 'Try the look.',
  sub: 'Six looks from the first lift to the lodge fire. Tap a person to see the pieces.',
  bundlePct: 10,
  products: {
    stagzip: { name: 'Stag cable quarter-zip', type: 'Merino knitwear', price: 398, img: 'img/pin-knit.webp', legend: 'Size', options: ['S', 'M', 'L', 'XL'], pre: 'M' },
    crew: { name: 'Heritage crew', type: 'Merino knitwear', price: 348, img: 'img/col-crew.webp', legend: 'Size', options: ['S', 'M', 'L', 'XL'], pre: 'M' },
    oxzip: { name: 'Hearth quarter-zip', type: 'Merino knitwear', price: 428, img: 'img/col-oxzip.webp', legend: 'Size', options: ['S', 'M', 'L', 'XL'], pre: 'M', tag: 'New' },
    cardigan: { name: 'Shawl cardigan', type: 'Merino knitwear', price: 468, img: 'img/col-cardigan.webp', legend: 'Size', options: ['S', 'M', 'L', 'XL'], pre: 'M' },
    turtle: { name: 'Merino turtleneck', type: 'Merino knitwear', price: 298, img: 'img/col-turtle.webp', legend: 'Size', options: ['S', 'M', 'L', 'XL'], pre: 'M', tag: 'New' },
    polo: { name: 'Knit polo', type: 'Merino knitwear', price: 328, img: 'img/col-polo.webp', legend: 'Size', options: ['S', 'M', 'L', 'XL'], pre: 'M' },
    scarf: { name: 'Fair Isle scarf', type: 'Lodge accessories', price: 148, img: 'img/acc-scarf.webp', legend: 'Size', options: ['One size'], pre: 'One size' },
    beanie: { name: 'Stag beanie', type: 'Lodge accessories', price: 98, img: 'img/acc-beanie.webp', legend: 'Size', options: ['One size'], pre: 'One size' },
    gloves: { name: 'Pine wool gloves', type: 'Lodge accessories', price: 128, img: 'img/acc-gloves.webp', legend: 'Size', options: ['S/M', 'L/XL'], pre: 'S/M' },
  } as Record<string, { name: string; type: string; price: number; img: string; legend: string; options: string[]; pre: string; tag?: string }>,
  // pins: [left %, top %] of the figure box; pieces are listed in pin order
  looks: [
    { name: 'First Lift', alt: '1,020 m', pieces: ['stagzip', 'beanie', 'gloves'], pins: [[50, 33], [50, 9], [36, 52]] },
    { name: 'Village Walk', alt: '1,260 m', pieces: ['crew', 'scarf', 'beanie'], pins: [[50, 36], [50, 21], [50, 9]] },
    { name: 'Fireside', alt: '1,540 m', pieces: ['oxzip', 'scarf', 'gloves'], pins: [[50, 33], [50, 21], [36, 52]] },
    { name: 'Pine Ridge', alt: '1,880 m', pieces: ['cardigan', 'beanie', 'gloves'], pins: [[43, 40], [50, 9], [36, 52]] },
    { name: 'Cold Snap', alt: '2,210 m', pieces: ['turtle', 'scarf', 'beanie'], pins: [[41, 42], [50, 21], [50, 9]] },
    { name: 'The Lodge', alt: '2,480 m', pieces: ['polo', 'scarf', 'gloves'], pins: [[63, 37], [50, 21], [36, 52]] },
  ] as { name: string; alt: string; pieces: string[]; pins: number[][] }[],
};
