// Homepage content: a highlight reel. The full content lives in archive.ts and belongs on the linked pages.
// Stills are CC0 (Openverse: Wikimedia, WordPress photo directory, rawpixel, StockSnap). Video: Coverr (free licence). Logos: Simple Icons.
export const site = {
  name: 'EVM Group',
  title: 'EVM Group | Porsche, BMW, MINI and more across Kerala',
  description:
    'EVM Group has built automobile dealerships, hotels, plantations, transport and cinemas across Kerala since 1952. Future is our business.',
  lang: 'en-IN',
  tagOne: 'EVM Group',
  tagTwo: 'Automotive and hospitality group',
  nav: [
    { label: 'About', href: '/about' },
    { label: 'Marques', href: '/marques' },
    { label: 'Sectors', href: '/sectors' },
    { label: 'History', href: '/history' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  hero: {
    lines: ['Future is', 'our Business'],
    sub: 'Seven decades of one family business across Kerala.',
    cta: 'Our story',
    filmAlt: 'Aerial roads, a Porsche 911 and a night drive',
  },
  statement: {
    label: 'EVM Group, since 1952',
    text: 'In 1952, E.V. Mathai auctioned a toddy shop at fifteen and set out on his own. His family has grown the business ever since.',
    links: [{ label: 'Our story', href: '/about' }],
  },
  who: {
    label: 'Who leads it',
    link: { label: 'The wider team', href: '/people' },
    items: [
      { name: 'E.V. Mathai', role: 'Founder', img: 'person-mathai.webp', alt: 'E.V. Mathai, the founder' },
      { name: 'E.M. Johny', role: 'Chairman', img: 'person-johny.webp', alt: 'E.M. Johny, the chairman' },
      { name: 'Sabu Johny', role: 'Managing Director', img: 'person-sabu.webp', alt: 'Sabu Johny, the managing director' },
      { name: 'Divya Paul', role: 'Director', img: 'person-divya.webp', alt: 'Divya Paul, a director' },
    ],
  },
  photo: { img: 'photo-kochi.webp', alt: 'Chinese fishing nets on the shore at Kochi, Kerala', pos: '50% 60%' },
  marques: {
    label: 'Brands we represent',
    link: { label: 'Every brand', href: '/marques' },
    items: [
      { name: 'Porsche', logo: 'porsche', note: 'Kerala\'s sole Porsche dealer.' },
      { name: 'BMW', logo: 'bmw', note: 'Showrooms in Cochin and Trivandrum.' },
      { name: 'MINI', logo: 'mini', note: 'A four-car showroom with a cafe in Kochi.' },
      { name: 'Volkswagen', logo: 'volkswagen', note: 'On the road with the family since 2008.' },
      { name: 'Skoda', logo: 'skoda', note: 'A 25-bay workshop at Muttom, Cochin.' },
      { name: 'Nissan', logo: 'nissan', note: 'Five dealerships across Kerala.' },
      { name: 'Honda', logo: 'honda', note: 'A Wing World Elite Club dealer.' },
      { name: 'MG', logo: 'mg', note: 'Through Coastline Garages.' },
    ],
  },
  group: {
    label: 'The group',
    link: { label: 'Every business', href: '/sectors' },
    places: {
      calicut: { name: 'Calicut', lon: 75.78, lat: 11.25, side: 'r' },
      kochi: { name: 'Kochi', lon: 76.27, lat: 9.97, side: 'l' },
      trivandrum: { name: 'Trivandrum', lon: 76.95, lat: 8.52, side: 'l' },
      munnar: { name: 'Munnar', lon: 77.06, lat: 10.09, side: 'l' },
      vembanad: { name: 'Vembanad Lake', lon: 76.4, lat: 9.6, side: 'r' },
      highrange: { name: 'The high ranges', lon: 77.0, lat: 9.72, side: 'l' },
      kothamangalam: { name: 'Kothamangalam', lon: 76.63, lat: 10.06, side: 'r' },
    },
    items: [
      { name: 'Automobile', slug: 'automobile', note: 'Showrooms and workshops from Trivandrum to Calicut.', places: ['calicut', 'kochi', 'trivandrum'] },
      { name: 'Hotels and resorts', slug: 'hotels', note: 'Mountain Club in the Munnar tea gardens, and Le Leela on Vembanad Lake.', places: ['munnar', 'vembanad'] },
      { name: 'Plantation', slug: 'plantation', note: 'Hill produce, lemongrass and tea from the high ranges.', places: ['highrange'] },
      { name: 'Transportation', slug: 'transportation', note: 'The EVM bus service, and EVM Wheels self drive cars.', places: ['kothamangalam'] },
      { name: 'Entertainment', slug: 'entertainment', note: 'EVM Cinemas, from the Jawahar in Kothamangalam to the Kavitha in Kochi.', places: ['kothamangalam', 'kochi'] },
    ],
  },
  milestones: {
    label: 'Milestones',
    link: { label: 'The full timeline', href: '/history' },
    items: [
      { y: '1985', t: 'EVM Cinemas opens in Kothamangalam.' },
      { y: '1988', t: 'Hill View, the first hotel in Munnar, opens.' },
      { y: '2001', t: 'EVM Honda becomes the first dealership of the group.' },
      { y: '2019', t: 'MG, Skoda and MINI join within one year.' },
    ],
  },
  proof: {
    label: 'What people say',
    quote: 'Our MINI is the third car we have bought from EVM Autokraft. That itself proves their customer service is way beyond others.',
    who: 'Vivek Ajit, MINI Cooper',
    reviews: { label: 'More customers', href: '/reviews' },
    awardsLabel: 'Awards',
    awardsLink: { label: 'More awards', href: '/recognition' },
    figures: [
      { n: 1, pre: 'No. ', suf: '', t: 'All India dealer, Excellent Performance Award 2012 to 2013' },
      { n: 20000, pre: '', suf: '', t: 'Nissans: the first dealer in India to cross it' },
      { n: 350, pre: '', suf: '+', t: 'Porsche cars delivered since inception' },
    ],
  },
  next: {
    label: 'Where next',
    items: [
      { name: 'Careers', line: 'Join the group.', href: '/careers' },
      { name: 'Contact', line: 'Offices, phone and email.', href: '/contact' },
    ],
  },
  footer: {
    address: 'Automotive and hospitality group. Kerala, India. Since 1952.',
    contact: { label: 'Corporate office', lines: ['Maradu, Cochin', '0484 404040', 'corporateoffice@evmgroup.co.in'] },
    legal: 'Concept website. Content comes from the current website and needs client confirmation. Photographs are CC0 stock, film is Coverr stock.',
  },
};
