// All content for Sidecut, a fictional barbershop group with three shops in central London. Everything here is invented:
// the brand, addresses, phone numbers (020 7946 0xxx is the Ofcom range reserved for fiction), hours, prices, reviews and claims.
export const brand = {
  name: 'Sidecut',
  title: "Sidecut | Barbers in Soho, Shoreditch and King's Cross, London",
  description: 'Sidecut is a London barbershop group: skin fades, tapers and beard work in three central shops, booked online in under a minute. A fictional concept.',
};

export const nav = [
  { label: 'Services', href: '#cuts' },
  { label: 'Barbers', href: '#barbers' },
  { label: 'Club', href: '#club' },
  { label: 'Shop', href: '#shelf' },
  { label: 'Visit', href: '#visit' },
];

// tool = the chrome tool that pops up beside the cursor when the row is hovered
export const services = [
  { n: 0, name: 'Skin fade', min: 45, price: 32, text: 'Bald at the bottom, blended to any length on top.', tool: 'clippers' },
  { n: 1, name: 'Taper', min: 40, price: 30, text: 'Clean neckline and sideburns, length kept on the sides.', tool: 'comb' },
  { n: 2, name: 'Scissor cut', min: 50, price: 34, text: 'All scissors, for longer hair that has to move.', tool: 'scissors' },
  { n: 3, name: 'Line-up', min: 20, price: 15, text: 'Straight-razor edges between cuts.', tool: 'razor' },
  { n: 4, name: 'Beard sculpt', min: 25, price: 22, text: 'Shape, line and hot towel.', tool: 'brush' },
  { n: 5, name: 'Hot-towel shave', min: 40, price: 30, text: 'Two towels, warm lather, one straight razor.', tool: 'razor' },
  { n: 6, name: 'Cut + beard', min: 60, price: 48, text: 'Any cut with a full beard sculpt.', tool: 'scissors' },
];
export const kids = 'Kids under 12 · £22 · weekdays before 4 pm';

export const barbers = [
  { id: 'kofi', name: 'Kofi', shop: 'soho', shopName: 'Soho', does: 'Fades and beards', years: 9, langs: 'English, Twi' },
  { id: 'raj', name: 'Raj', shop: 'soho', shopName: 'Soho', does: 'Tapers and crops', years: 12, langs: 'English, Hindi' },
  { id: 'mateo', name: 'Mateo', shop: 'shoreditch', shopName: 'Shoreditch', does: 'Curls and mid fades', years: 7, langs: 'English, Spanish' },
  { id: 'jin', name: 'Jin', shop: 'kings-cross', shopName: "King's Cross", does: 'Scissor work and side parts', years: 10, langs: 'English, Korean' },
];

// the "see the back" book: one photograph per cut, with the back of the head on hover
export const cuts = [
  { id: 'kofi', name: 'Skin fade + part', price: 32, by: 'kofi', service: 0 },
  { id: 'mateo', name: 'Curl taper', price: 30, by: 'mateo', service: 1 },
  { id: 'jin', name: 'French crop', price: 34, by: 'jin', service: 2 },
  { id: 'luca', name: 'Low fade + beard', price: 52, by: 'kofi', service: 6 },
  { id: 'raj', name: 'Textured crop', price: 32, by: 'raj', service: 1 },
  { id: 'tom', name: 'Scissor cut', price: 34, by: 'jin', service: 2 },
  { id: 'dre', name: 'Burst fade', price: 34, by: 'kofi', service: 0 },
  { id: 'omar', name: 'Slick-back taper', price: 32, by: 'raj', service: 1 },
  { id: 'ben', name: 'Buzz + line-up', price: 22, by: 'mateo', service: 3 },
];

// the tools to throw around the statement; clicking one shows a promise
export const props = [
  { id: 'clock', w: 8.5, big: '-1 day', small: 'A reminder text the day before.' },
  { id: 'spray', w: 6.2, big: '£10', small: 'Deposit, taken off your bill.' },
  { id: 'pomade', w: 10.5, big: 'Free', small: 'Cancel up to 24 hours ahead.' },
  { id: 'clippers', w: 13, big: '0', small: 'No-shows. Your chair is held.' },
];

export const plans = [
  { name: 'Line-up', price: 29, save: 8, items: ['Two line-ups a month', '10% off any cut', 'Book 14 days ahead'], cta: 'Join' },
  { name: 'Fade Club', price: 69, save: 21, items: ['Two fades a month', 'Unlimited line-ups', "Your barber's chair held every other Friday"], cta: 'Join the club', hot: true },
  { name: 'Every week', price: 119, save: 34, items: ['A cut every week', 'Beard sculpt included', 'First pick of Saturday chairs'], cta: 'Join' },
];

export const shelf = [
  { id: 'clay', name: 'Matte clay', price: 14 },
  { id: 'oil', name: 'Beard oil', price: 16 },
  { id: 'comb', name: 'Wooden comb', price: 8 },
  { id: 'brush', name: 'Neck brush', price: 12 },
];

export const giftAmounts = [50, 100, 150];

export const reviews = [
  { q: 'Walked in with a mess and a deadline. Walked out looking like I planned it. Booked my next one before I stood up.', by: 'Jordan · Shoreditch · Skin fade' },
  { q: 'The first barber who asked what I do all day before touching the clippers. The fade held for a month.', by: 'Priya · Soho · Taper' },
  { q: 'I had completely forgotten the deposit. It came off the bill, like they said it would.', by: "Sam · King's Cross · Cut + beard" },
  { q: 'Three kids, three cuts, forty minutes, nobody cried. I will pay for that every time.', by: 'Adaeze · Soho · Kids cut' },
];

const wk = (a: [string, string], sat: [string, string], sun: [string, string]) => [
  ...['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => [d, ...a]),
  ['Sat', ...sat],
  ['Sun', ...sun],
];
// tube = the nearest station, walk = minutes on foot, rot = how the street grid is turned on the map panel
export const shops = [
  { id: 'soho', name: 'Soho', street: '12 Kingly Yard', area: 'London W1', phone: '020 7946 0301', tube: 'Oxford Circus', walk: 4, rot: -24, walkins: 'Walk-ins till 6', week: wk(['10:00', '20:00'], ['10:00', '20:00'], ['11:00', '18:00']) },
  { id: 'shoreditch', name: 'Shoreditch', street: '27 Rivington Arch', area: 'London E1', phone: '020 7946 0302', tube: 'Old Street', walk: 3, rot: 18, walkins: 'Walk-ins till 7', week: wk(['10:00', '21:00'], ['10:00', '21:00'], ['11:00', '19:00']) },
  { id: 'kings-cross', name: "King's Cross", street: '5 Goods Way Arch', area: 'London N1', phone: '020 7946 0303', tube: "King's Cross St Pancras", walk: 2, rot: -8, walkins: 'Walk-ins till 6', week: wk(['09:00', '20:00'], ['10:00', '18:00'], ['10:00', '18:00']) },
];

export const faq = [
  { q: 'Why a £10 deposit?', a: 'It holds your chair and comes off the bill at the end. If you cannot come, tell us a day ahead and it comes back to you.' },
  { q: 'What if I am late?', a: 'Up to ten minutes is fine. After that we may have to shorten the cut or move you to the next free chair.' },
  { q: 'When should I book my next cut?', a: 'A fade looks its best for about three weeks. Book at the end of the cut and you keep your usual slot.' },
  { q: 'Do you take walk-ins?', a: 'Yes, whenever a chair is free. Booking just means you never have to find out.' },
  { q: 'How do I pay?', a: 'The £10 deposit goes on a card when you book. The rest is paid at the chair, by card or cash.' },
];

export const statement = ['Nobody should have to DM a barber at midnight for a ', '2 pm chair.'];

export const note = 'Concept design. Sidecut is not a real business; ratings, prices and people are illustrative. Photography is generated.';
export const contact = { email: 'hello@sidecut.example', phone: '020 7946 0300' };
