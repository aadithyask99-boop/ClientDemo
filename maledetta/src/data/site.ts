// All content for Maledetta (a fictional pizzeria group in central London). Invented: the brand, the addresses, the
// phone numbers (020 7946 0xxx is the Ofcom range reserved for drama), the hours and every claim. See README.md.
import credits from './credits.json';

export const brand = {
  name: 'Maledetta',
  title: 'Maledetta | Neighbourhood pizza with attitude, central London',
  description:
    'Maledetta is a neighbourhood pizzeria with attitude: a light, long-proved dough, pizzas that change with the seasons, fresh pasta and local drinks. Nine sites across central London (a fictional concept).',
  sticker: ['My', 'Local'],
  tagline: ['A local', 'with extra soul'],
};

// Palette B "London": one pale tint and one saturated dark at a time. The page advances to the next pair each time
// the footer is reached (the reference does this to disguise its infinite loop; we keep the colour change, not the loop).
export const pairs = [
  { light: '#CFEBD9', dark: '#0E5A3A' }, // Thames green
  { light: '#F7C9CF', dark: '#B3121F' }, // pillar-box red
  { light: '#D6E4FF', dark: '#0A2FA5' }, // Tube blue
  { light: '#E3D2F0', dark: '#4B1D5E' }, // plum
  { light: '#FFE0C7', dark: '#C2410C' }, // burnt tangerine
];

// Loader curtains: a fixed ground and text colour per area (the reference does the same per city).
export const curtains = [
  { bg: '#0E5A3A', fg: '#CFEBD9' }, { bg: '#0A2FA5', fg: '#D6E4FF' }, { bg: '#B3121F', fg: '#F6F1E6' },
  { bg: '#4B1D5E', fg: '#F7C9CF' }, { bg: '#C2410C', fg: '#FFE0C7' }, { bg: '#0E5A3A', fg: '#F7C9CF' },
  { bg: '#B3121F', fg: '#CFEBD9' }, { bg: '#0A2FA5', fg: '#F6F1E6' }, { bg: '#F7C9CF', fg: '#B3121F' },
];

export const ink = '#0B3B2A'; // the mascot's line colour never changes, like the reference's

export const services = [
  { label: 'Delivery', img: 'svc-delivery.jpg', alt: 'A delivery rider on a scooter in a London street.', action: 'link', href: '#', pos: '50% 40%', flex: 20 },
  { label: 'Collect', img: 'svc-collect.jpg', alt: 'A woman carrying a takeaway pizza box through the street.', action: 'menu', pos: '50% 35%', flex: 32 },
  { label: 'Dine in', img: 'svc-dinein.jpg', alt: 'Pizzas, bowls and glasses on a dark wooden table, seen from above.', action: 'menu', pos: '50% 50%', flex: 28 },
  { label: 'The shop', img: 'svc-kitchen.jpg', alt: 'A pizza chef in the steam of the kitchen.', action: 'scroll', href: '#shop', pos: '50% 30%', flex: 20 },
];

// Nine central London sites. Order = loader order (reversed) and marquee order.
export const areas = [
  { name: 'Soho', site: 'Lisle Yard', img: 'area-soho.jpg', food: 'pizza', street: '9 Lisle Yard, W1', phone: '020 7946 0101' },
  { name: 'Covent Garden', site: 'Maiden Row', img: 'area-covent-garden.jpg', food: 'spritz', street: '22 Maiden Row, WC2', phone: '020 7946 0102' },
  { name: 'Fitzrovia', site: 'Rathmoor Street', img: 'area-fitzrovia.jpg', food: 'tiramisu', street: '41 Rathmoor Street, W1', phone: '020 7946 0103' },
  { name: 'Marylebone', site: 'Aldous Mews', img: 'area-marylebone.jpg', food: 'burrata', street: '6 Aldous Mews, W1', phone: '020 7946 0104' },
  { name: 'Clerkenwell', site: 'Spindle Lane', img: 'area-clerkenwell.jpg', food: 'cannoli', street: '18 Spindle Lane, EC1', phone: '020 7946 0105' },
  { name: 'Bloomsbury', site: 'Quill Passage', img: 'area-bloomsbury.jpg', food: 'espresso', street: '3 Quill Passage, WC1', phone: '020 7946 0106' },
  { name: 'Shoreditch', site: 'Tenter Yard', img: 'area-shoreditch.jpg', food: 'pasta', street: '57 Tenter Yard, E1', phone: '020 7946 0107' },
  { name: 'Borough', site: 'Hopton Arch', img: 'area-borough.jpg', food: 'gelato', street: '12 Hopton Arch, SE1', phone: '020 7946 0108' },
  { name: 'Mayfair', site: 'Brooke Row', img: 'area-mayfair.jpg', food: 'spritz', street: '27 Brooke Row, W1', phone: '020 7946 0109' },
];
export const hours = ['Mon to Thu 12 to 11pm', 'Fri and Sat 12 to midnight', 'Sun 12 to 10pm'];

export const statement = [
  'Moments of life to share with family or friends, with pizzas that follow the seasons and a light, long-proved dough.',
  'A neighbourhood pizzeria and then some: a special for every area, fresh pasta and drinks from around the corner.',
  'Dine in, collect or have it delivered. Always a short walk from you!',
  'La pizza e la vita.',
];

export const merch = {
  mobileHeading: 'A bit of Maledetta in your everyday',
  heading: 'Looking sharp takes more than a good sauce.',
  body: 'But we did treat ourselves: a small collection of aprons, tees and kit that looks like us. The street, the sun, the good food and the attitude we own. Caps, socks, totes, tea towels, the Maledetta look from head to toe.',
  cta: 'The shop',
  img: 'merch.jpg',
  alt: 'A cook in a white jacket working at the pass.',
};

export const wall = [
  { img: 'wall-1.jpg', alt: 'Hands holding a ball of pizza dough.', x: 7.5, y: 0.5, w: 18, from: -80, to: 30 },
  { img: 'wall-2.jpg', alt: 'Spaghetti twirled high on a fork against black.', x: 73.5, y: 18, w: 16.5, from: 40, to: -30 },
  { img: 'wall-3.jpg', alt: 'Friends raising glasses at a long table.', x: 29.5, y: 28, w: 18.5, from: 30, to: -100 },
  { img: 'wall-5.jpg', alt: 'A smiling man carrying a stack of boxes.', x: 52, y: 39, w: 18, from: 0, to: -50 },
  { img: 'wall-6.jpg', alt: 'Hands holding a plate of dessert.', x: 7.6, y: 81, w: 18, from: 0, to: 30 },
  { img: 'wall-7.jpg', alt: 'A table football table in green and red.', x: 74, y: 89, w: 16.5, from: -150, to: 0 },
];

export const foods = ['pizza', 'spritz', 'tiramisu', 'burrata', 'cannoli', 'espresso', 'pasta', 'gelato'];

export const heroLinks = [
  { label: 'Private dining', href: 'mailto:hello@maledetta.example' },
];
export const footerLinks = [
  { label: 'Join the crew', href: '#' },
  { label: 'Loyalty', href: '#' },
  { label: 'Terms and privacy', href: '#' },
  { label: 'Contact', href: 'mailto:hello@maledetta.example' },
];
export const note = 'Maledetta is a fictional restaurant, a design concept. Photography from Unsplash contributors.';
export { credits };
