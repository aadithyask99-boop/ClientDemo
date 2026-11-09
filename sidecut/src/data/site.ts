// All content for Sidecut, a fictional barbershop group with three shops in central London. Everything here is invented:
// the brand, addresses, phone numbers (020 7946 0xxx is the Ofcom range reserved for fiction), hours, prices, reviews and claims.
export const brand = {
  name: 'Sidecut',
  title: 'Sidecut | Barbers in Soho, Shoreditch and King\'s Cross, London',
  description: 'Sidecut is a London barbershop group: skin fades, tapers and beard work in three central shops, booked online in under a minute. A fictional concept.',
};

export const nav = [
  { label: 'Cuts', href: '#cuts' },
  { label: 'Barbers', href: '#barbers' },
  { label: 'Club', href: '#club' },
  { label: 'Shelf', href: '#shelf' },
  { label: 'Visit', href: '#shops' },
];

export const services = [
  { n: 0, name: 'Skin fade', min: 45, price: 32, text: 'Bald at the bottom, blended to any length on top.' },
  { n: 1, name: 'Taper', min: 40, price: 30, text: 'Clean neckline and sideburns, length kept on the sides.' },
  { n: 2, name: 'Scissor cut', min: 45, price: 34, text: 'All scissors, no clippers. Best for longer hair.' },
  { n: 3, name: 'Beard trim', min: 25, price: 18, text: 'Shaped, lined up and finished with a hot towel.' },
  { n: 4, name: 'Cut and beard', min: 60, price: 46, text: 'A fade or taper and the beard, in one sitting.' },
  { n: 5, name: 'Kids cut', min: 30, price: 22, text: 'Under twelve. Patient barbers, no tears promised.' },
];

export const shelf = [
  { id: 'clay', name: 'Matte clay', price: 14 },
  { id: 'oil', name: 'Beard oil', price: 16 },
  { id: 'comb', name: 'Wooden comb', price: 8 },
  { id: 'brush', name: 'Neck brush', price: 12 },
];

export const shops = [
  { id: 'soho', look: 'one chair under pendant lamps', name: 'Soho', street: '12 Kingly Yard, London W1', phone: '020 7946 0301', hours: ['Mon to Sat 10 to 8pm', 'Sun 11 to 6pm'] },
  { id: 'shoreditch', look: 'three chairs in front of old brick', name: 'Shoreditch', street: '27 Rivington Arch, London E1', phone: '020 7946 0302', hours: ['Mon to Sat 10 to 9pm', 'Sun 11 to 7pm'] },
  { id: 'kings-cross', look: 'chairs under a railway arch', name: "King's Cross", street: '5 Goods Way Arch, London N1', phone: '020 7946 0303', hours: ['Mon to Fri 9 to 8pm', 'Sat and Sun 10 to 6pm'] },
];

export const barbers = [
  { id: 'kofi', name: 'Kofi', shop: 'soho', shopName: 'Soho', does: 'Skin fades and beards', years: 9 },
  { id: 'raj', name: 'Raj', shop: 'soho', shopName: 'Soho', does: 'Tapers and textured crops', years: 12 },
  { id: 'mateo', name: 'Mateo', shop: 'shoreditch', shopName: 'Shoreditch', does: 'Curls and mid fades', years: 7 },
  { id: 'jin', name: 'Jin', shop: 'kings-cross', shopName: "King's Cross", does: 'Scissor work and side parts', years: 10 },
];

export const props = [
  { id: 'spray', name: 'Spray', w: 11 },
  { id: 'clock', name: 'Clock', w: 17 },
  { id: 'pomade', name: 'Pomade', w: 19 },
  { id: 'clippers', name: 'Clippers', w: 21 },
];

export const plans = [
  { name: 'Standing cut', price: 48, text: 'One cut every three weeks, the same chair, the same barber. Skip a month if you travel.' },
  { name: 'Cut and beard', price: 72, text: 'A fade and a beard line every three weeks, plus a hot towel on the house.', hot: true },
  { name: 'Anytime', price: 95, text: 'As many cuts as your hair can take, at any of the three shops, no booking fee.' },
];

export const giftAmounts = [50, 100, 150];

export const reviews = [
  { q: 'Walked in with a mess and a deadline. Walked out looking like I planned it. Booked my next one before I stood up.', by: 'Jordan, Shoreditch' },
  { q: 'The first barber who asked what I do all day before touching the clippers. The fade held for a month.', by: 'Priya, Soho' },
  { q: 'I had completely forgotten the deposit. It came off the bill, like they said it would.', by: 'Sam, King\'s Cross' },
  { q: 'Three kids, three cuts, forty minutes, nobody cried. I will pay for that every time.', by: 'Adaeze, Soho' },
];

export const faq = [
  { q: 'Why a £10 deposit?', a: 'It holds your chair and comes off the bill at the end. If you cannot come, tell us a day ahead and it comes back to you.' },
  { q: 'What if I am late?', a: 'Up to ten minutes is fine. After that we may have to shorten the cut or move you to the next free chair.' },
  { q: 'When should I book my next cut?', a: 'A fade looks its best for about three weeks. Book at the end of the cut and you keep your usual slot.' },
  { q: 'Do you take walk-ins?', a: 'Yes, whenever a chair is free. Booking just means you never have to find out.' },
  { q: 'How do I pay?', a: 'The £10 deposit goes on a card when you book. The rest is paid at the chair, by card or cash.' },
];

export const statement = ['Nobody should have to message a barber at midnight for a ', 'two o\'clock chair.'];

export const note = 'Sidecut is a fictional barbershop, a design concept. The shops, prices, reviews and the booking flow are invented, and nothing here is charged or sent. Photography is generated.';
export const contact = { email: 'hello@sidecut.example', phone: '020 7946 0300' };
