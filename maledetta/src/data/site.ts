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

export const ink = '#0B3B2A'; // the mascot's line colour never changes, like the reference's

export const services = [
  { label: 'Delivery', img: 'svc-delivery.jpg', alt: 'A delivery rider on a scooter in a London street.', action: 'link', href: '#', pos: '50% 40%', flex: 1.25 },
  { label: 'Collect', img: 'svc-collect.jpg', alt: 'A woman carrying a takeaway pizza box through the street.', action: 'menu', pos: '50% 35%', flex: 1.55 },
  { label: 'Dine in', img: 'svc-dinein.jpg', alt: 'Pizzas, bowls and glasses on a dark wooden table, seen from above.', action: 'menu', pos: '50% 50%', flex: 1.4 },
  { label: 'The shop', img: 'svc-kitchen.jpg', alt: 'A pizza chef in the steam of the kitchen.', action: 'scroll', href: '#shop', pos: '50% 30%', flex: 1.25 },
];

// Nine central London sites. Order = loader order (reversed) and marquee order.
export const areas = [
  { name: 'Soho', img: 'area-soho.jpg', food: 'pizza', street: '9 Lisle Yard, W1', phone: '020 7946 0101' },
  { name: 'Covent Garden', img: 'area-covent-garden.jpg', food: 'spritz', street: '22 Maiden Row, WC2', phone: '020 7946 0102' },
  { name: 'Fitzrovia', img: 'area-fitzrovia.jpg', food: 'tiramisu', street: '41 Rathmoor Street, W1', phone: '020 7946 0103' },
  { name: 'Marylebone', img: 'area-marylebone.jpg', food: 'burrata', street: '6 Aldous Mews, W1', phone: '020 7946 0104' },
  { name: 'Clerkenwell', img: 'area-clerkenwell.jpg', food: 'cannoli', street: '18 Spindle Lane, EC1', phone: '020 7946 0105' },
  { name: 'Bloomsbury', img: 'area-bloomsbury.jpg', food: 'espresso', street: '3 Quill Passage, WC1', phone: '020 7946 0106' },
  { name: 'Shoreditch', img: 'area-shoreditch.jpg', food: 'pasta', street: '57 Tenter Yard, E1', phone: '020 7946 0107' },
  { name: 'Borough', img: 'area-borough.jpg', food: 'gelato', street: '12 Hopton Arch, SE1', phone: '020 7946 0108' },
  { name: 'Mayfair', img: 'area-mayfair.jpg', food: 'spritz', street: '27 Brooke Row, W1', phone: '020 7946 0109' },
];
export const hours = ['Mon to Thu 12 to 11pm', 'Fri and Sat 12 to midnight', 'Sun 12 to 10pm'];

export const statement = [
  'Moments of life to share with family or friends, with pizzas that follow the seasons and a light, long-proved dough.',
  'A neighbourhood pizzeria and then some: a special for every area, fresh pasta and drinks from around the corner.',
  'Dine in, collect or have it delivered. Always a short walk from you!',
  'La pizza e la vita.',
];

export const merch = {
  heading: 'Looking sharp takes more than a good sauce.',
  body: 'But we did treat ourselves: a small collection of aprons, tees and kit that looks like us. The street, the sun, the good food and the attitude we own. Caps, socks, totes, tea towels, the Maledetta look from head to toe.',
  cta: 'The shop',
  img: 'merch.jpg',
  alt: 'A cook in a white jacket working at the pass.',
};

export const wall = [
  { img: 'wall-1.jpg', alt: 'Hands holding a ball of pizza dough.', x: 7, y: 1, w: 18, speed: 0.5 },
  { img: 'wall-7.jpg', alt: 'A table football table in green and red.', x: 74, y: 8, w: 17, speed: 0.9 },
  { img: 'wall-3.jpg', alt: 'Friends raising glasses at a long table.', x: 27, y: 21, w: 19, speed: 0.7 },
  { img: 'wall-5.jpg', alt: 'A smiling man carrying a stack of boxes.', x: 51, y: 32, w: 16, speed: 1.1 },
  { img: 'wall-2.jpg', alt: 'Spaghetti twirled high on a fork against black.', x: 71, y: 47, w: 16, speed: 0.6 },
  { img: 'wall-4.jpg', alt: 'A lit restaurant doorway at night.', x: 8, y: 59, w: 17, speed: 1.0 },
  { img: 'wall-6.jpg', alt: 'Hands holding a plate of dessert.', x: 28, y: 76, w: 16, speed: 0.8 },
  { img: 'wall-8.jpg', alt: 'Women laughing together at a restaurant table.', x: 62, y: 79, w: 19, speed: 0.55 },
];

export const foods = ['pizza', 'spritz', 'tiramisu', 'burrata', 'cannoli', 'espresso', 'pasta', 'gelato'];

export const heroLinks = [
  { label: 'Join the crew', href: '#' },
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
