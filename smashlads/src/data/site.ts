// All content for Smashley's, a fictional smash-burger restaurant group in central London. Everything here is invented:
// the brand, addresses, phone numbers (020 7946 0xxx is the Ofcom range reserved for fiction), hours, prices and claims.
import credits from './credits.json';

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

// Build your own: layers are drawn in code (see src/scripts/builder.ts). Prices in pounds, energy in kcal.
export const parts = [
  { id: 'patty', name: 'Patty', price: 2.5, kcal: 260 },
  { id: 'cheese', name: 'Cheese', price: 0.8, kcal: 90 },
  { id: 'bacon', name: 'Bacon', price: 1.2, kcal: 110 },
  { id: 'lettuce', name: 'Lettuce', price: 0.4, kcal: 10 },
  { id: 'tomato', name: 'Tomato', price: 0.4, kcal: 15 },
  { id: 'onion', name: 'Onion', price: 0.3, kcal: 20 },
  { id: 'pickle', name: 'Pickles', price: 0.3, kcal: 5 },
  { id: 'sauce', name: 'Sauce', price: 0.3, kcal: 80 },
  { id: 'top', name: 'Top bun', price: 0, kcal: 150 },
];
export const builder = { baseBun: { price: 3.5, kcal: 150 }, maxLayers: 12 };

export const facts = ['Beef smashed to order', 'Brioche baked at 5am', 'House pickles and sauces'];

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
  { label: 'Contact', href: 'mailto:hello@smashleys.example' },
];

export const note = "Smashley's is a fictional restaurant, a design concept. Photography from Unsplash contributors.";
export const ingredients = ['patty', 'tomato', 'lettuce', 'cheese', 'onion', 'pickle'];
export { credits };
