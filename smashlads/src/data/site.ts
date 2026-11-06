// All content for Smashley's, a fictional smash-burger restaurant group in central London. Everything here is invented:
// the brand, addresses, phone numbers (020 7946 0xxx is the Ofcom range reserved for fiction), hours, prices and claims.
import credits from './credits.json';
import dims from './burger-dims.json';

export const brand = {
  name: "Smashley's",
  title: "Smashley's | Smash burgers with attitude, central London",
  description: "Smashley's is a London smash-burger joint: beef smashed hot on the flat-top, toasted brioche, house pickles and sauces. A fictional concept.",
  hero: ['The', 'Smash'],
};

export const palette = { ground: '#F3ECDD', blue: '#1F3FD9', orange: '#D63E0A', ink: '#14162B' };

export const burgers = [
  { name: 'The OG Smash', img: 'og', price: '9.50', prep: '10-12 min', bun: 'Brioche', patty: 'Beef', spice: 'Mild', kcal: 720, protein: 32 },
  { name: 'Jalapeno Heat', img: 'jalapeno', price: '10.50', prep: '12-14 min', bun: 'Brioche', patty: 'Beef', spice: 'Hot', kcal: 810, protein: 34 },
  { name: 'Bacon Double', img: 'bacon', price: '12.50', prep: '12-15 min', bun: 'Sesame', patty: 'Beef x2', spice: 'Mild', kcal: 960, protein: 44 },
  { name: 'Green Lad', img: 'green', price: '9.00', prep: '10-12 min', bun: 'Seeded', patty: 'Plant', spice: 'Mild', kcal: 640, protein: 26 },
  { name: 'Smoky BBQ', img: 'bbq', price: '11.50', prep: '12-14 min', bun: 'Brioche', patty: 'Beef', spice: 'Medium', kcal: 880, protein: 36 },
  { name: 'Truffle Shroom', img: 'truffle', price: '12.00', prep: '12-14 min', bun: 'Black bun', patty: 'Beef', spice: 'Mild', kcal: 840, protein: 35 },
];

export const menu = [
  { name: 'Burgers', kind: 'cards' },
  { name: 'Sides', items: [
    { name: 'Smashley fries', price: '4.00', text: 'Skin-on, double fried, sea salt.' },
    { name: 'Onion rings', price: '4.50', text: 'Beer batter, crisp, with house sauce.' },
    { name: 'Dirty fries', price: '6.00', text: 'Fries, cheese sauce, pickled jalapenos, crispy onions.' },
    { name: 'Pickle chips', price: '4.00', text: 'Fried dill pickles, ranch for dipping.' },
    { name: 'Slaw', price: '3.50', text: 'Crunchy, tangy, made fresh every morning.' },
  ] },
  { name: 'Shakes', items: [
    { name: 'Vanilla', price: '5.50', text: 'Thick, cold, made with real vanilla.' },
    { name: 'Chocolate', price: '5.50', text: 'Dark chocolate and a pinch of salt.' },
    { name: 'Strawberry', price: '5.50', text: 'Whole strawberries, blended.' },
    { name: 'Salted caramel', price: '6.00', text: 'Soft caramel, sea salt, whipped cream.' },
  ] },
  { name: 'Drinks', items: [
    { name: 'Cola', price: '3.00', text: 'Ice cold, in the bottle.' },
    { name: 'Lemonade', price: '3.50', text: 'Fresh lemons, not too sweet.' },
    { name: 'Craft lager', price: '5.50', text: 'Local, crisp, from the tap.' },
    { name: 'Iced tea', price: '3.50', text: 'Peach, unsweetened.' },
  ] },
];

// Build your own: finished burger photographs, one per combination (patties x cheese x bacon x lettuce and pickles).
// Prices in pounds, energy in kcal. The photos are public/art/b/p{patties}c{cheese}b{bacon}s{salad}.webp.
export const burgerDims = dims;
export const bld = {
  base: { price: 3.5, kcal: 230 },
  toggles: [
    { id: 'cheese', name: 'Cheese', price: 0.8, kcal: 90, per: 'patty' },
    { id: 'bacon', name: 'Bacon', price: 1.2, kcal: 110, per: 'once' },
    { id: 'salad', name: 'Lettuce and pickles', price: 0.7, kcal: 25, per: 'once' },
  ],
  patty: { price: 2.5, kcal: 260 },
  sides: [
    { id: 'none', name: 'Just the burger', price: 0, kcal: 0 },
    { id: 'fries', name: 'Fries', price: 3, kcal: 365, img: 'side-fries' },
    { id: 'rings', name: 'Onion rings', price: 3.5, kcal: 410, img: 'side-rings' },
    { id: 'salad', name: 'Side salad', price: 3.2, kcal: 90, img: 'side-salad' },
  ],
};
export const parts: never[] = [];
export const swaps = {};
export const builder = {};

// Number of frames in the hero cheese-melt sequences (public/art/seq/d-001.webp ..., desktop 16:9; m-001.webp ..., phone 9:16).
export const seq = { d: 73, m: 91 };

export const facts =['Beef smashed to order', 'Brioche baked at 5am', 'House pickles and sauces'];

export const areas = [
  { name: 'Soho', top: 6, left: 58 },
  { name: 'Shoreditch', top: 38, left: 80 },
  { name: 'Borough', top: 52, left: 42 },
];

export const sites = [
  { name: 'Soho', street: '4 Lisle Yard, W1' },
  { name: 'Shoreditch', street: '31 Tenter Yard, E1' },
  { name: 'Borough', street: '9 Hopton Arch, SE1' },
];

export const footerLinks = [
  { label: 'Home', href: '#top' },
  { label: 'Burgers', href: '#', menu: true },
  { label: 'Build', href: '#build' },
];

export const note = "Smashley's is a fictional restaurant, a design concept. Photography from Unsplash contributors.";
export const ingredients = ['patty', 'tomato', 'lettuce', 'cheese', 'onion', 'pickle'];

export const places = [
  { name: 'Soho', street: '4 Lisle Yard, London W1', phone: '020 7946 0201', hours: ['Mon to Thu 12 to 11pm', 'Fri and Sat 12 to 1am', 'Sun 12 to 10pm'] },
  { name: 'Shoreditch', street: '31 Tenter Yard, London E1', phone: '020 7946 0202', hours: ['Mon to Thu 12 to 11pm', 'Fri and Sat 12 to 2am', 'Sun 12 to 10pm'] },
  { name: 'Borough', street: '9 Hopton Arch, London SE1', phone: '020 7946 0203', hours: ['Mon to Sat 11 to 11pm', 'Sun 11 to 9pm'] },
];
export const contact = { email: 'hello@smashleys.example', phone: '020 7946 0200', note: 'Party bookings, press and jobs: write to us and we will answer within a day. This form is a concept and sends nothing.' };
export { credits };
