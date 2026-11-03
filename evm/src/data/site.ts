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
    sub: 'Seven decades of dealerships, hotels, plantations, transport and cinemas across Kerala.',
    cta: 'Our story',
    filmAlt: 'Aerial roads, a Porsche 911 and a night drive',
  },
  statement: {
    label: 'EVM Group, since 1952',
    text: 'In 1952, E.V. Mathai auctioned a toddy shop at fifteen and set out on his own. Seven decades later his family runs Kerala\'s dealerships for Porsche, BMW and MINI, and hotels, plantations, transport and cinemas besides, led today by E.M. Johny and Sabu Johny.',
    links: [{ label: 'Our story', href: '/about' }, { label: 'Our people', href: '/people' }],
  },
  photo: { img: 'photo-kochi.webp', alt: 'Chinese fishing nets on the shore at Kochi, Kerala', pos: '50% 60%' },
  photoTwo: { img: 'photo-tea.webp', alt: 'Tea terraces in the hills at Munnar, Kerala', pos: '50% 55%' },
  marques: {
    label: 'Marques',
    link: { label: 'All marques', href: '/marques' },
    items: [
      { name: 'Porsche', logo: 'porsche', note: 'Kerala\'s sole Porsche dealer.' },
      { name: 'BMW', logo: 'bmw', note: 'Cochin and Trivandrum since 2016.' },
      { name: 'MINI', logo: 'mini', note: 'Authorised MINI dealer since 2019.' },
      { name: 'Volkswagen', logo: 'volkswagen', note: 'The family\'s first car dealership, 2008.' },
      { name: 'Skoda', logo: 'skoda', note: 'Muttom, Cochin, since 2019.' },
      { name: 'Nissan', logo: 'nissan', note: 'Five dealerships across Kerala.' },
      { name: 'Honda', logo: 'honda', note: 'The group\'s first dealership, 2001.' },
      { name: 'MG', logo: 'mg', note: 'Through Coastline Garages since 2019.' },
    ],
  },
  sectors: {
    label: 'The group',
    text: 'Dealerships across Kerala, hotels in the hills and on the backwaters, plantations in the high ranges, buses and freight, and the cinemas of Kothamangalam and Kochi: five businesses, one family.',
    rowsLabel: 'Our sectors',
    link: { label: 'All sectors', href: '/sectors' },
    items: [
      { name: 'Automobile', slug: 'automobile', img: 'tile-porsche.webp', alt: 'A white Porsche 911 cabriolet outside a villa' },
      { name: 'Hotels and resorts', slug: 'hotels', img: 'tile-resort.webp', alt: 'A resort on the backwaters at Kumarakom' },
      { name: 'Plantation', slug: 'plantation', img: 'tea-wide.webp', alt: 'Tea terraces in the hills at Munnar' },
      { name: 'Transportation', slug: 'transportation', img: 'tile-truck.webp', alt: 'Container trucks on a highway' },
      { name: 'Entertainment', slug: 'entertainment', img: 'tile-cinema.webp', alt: 'Red cinema seats in a dark auditorium' },
    ],
  },
  milestones: {
    label: 'Milestones',
    link: { label: 'Full history', href: '/history' },
    items: [
      { y: '1952', t: 'A toddy shop auction at fifteen.', img: 'tea-wide.webp', alt: 'Tea terraces in the hills' },
      { y: '1985', t: 'EVM Cinemas opens in Kothamangalam.', img: 'tile-cinema.webp', alt: 'Red cinema seats' },
      { y: '2013', t: 'Porsche Centre Kochi opens.', img: 'tile-porsche.webp', alt: 'A white Porsche 911 cabriolet' },
      { y: '2019', t: 'MG, Skoda and MINI join in one year.', logos: ['mg', 'skoda', 'mini'] },
    ],
  },
  proof: {
    label: 'What people say',
    quote: 'Our MINI is the third car we have bought from EVM Autokraft. That itself proves their customer service is way beyond others.',
    who: 'Vivek Ajit, MINI Cooper',
    reviews: { label: 'More reviews', href: '/reviews' },
    awardsLabel: 'Recognition',
    awardsLink: { label: 'All recognition', href: '/recognition' },
    stage: { img: 'tea-wide.webp', alt: 'Tea terraces and a mountain at Munnar, Kerala' },
    figures: [
      { n: 1, pre: 'No. ', suf: '', t: 'All India dealer, Excellent Performance Award 2012 to 2013' },
      { n: 20000, pre: '', suf: '', t: 'Nissans: the first dealer in India to cross it' },
      { n: 350, pre: '', suf: '+', t: 'Porsche cars delivered since inception' },
    ],
  },
  next: {
    label: 'Where next',
    items: [
      { name: 'Our people', line: 'The family and the leaders of each marque.', href: '/people', img: 'photo-kochi.webp', alt: 'Kochi, Kerala' },
      { name: 'Careers', line: 'Join the group.', href: '/careers', img: 'photo-tea.webp', alt: 'Tea terraces at Munnar' },
      { name: 'Contact', line: 'Offices, phone and email.', href: '/contact', img: 'tile-resort.webp', alt: 'A resort on the backwaters' },
    ],
  },
  footer: {
    address: 'Automotive and hospitality group. Kerala, India. Since 1952.',
    contact: { label: 'Corporate office', lines: ['Maradu, Cochin', '0484 404040', 'corporateoffice@evmgroup.co.in'] },
    legal: 'Concept website. Content comes from the current website and needs client confirmation. Photographs are CC0 stock, film is Coverr stock.',
  },
};
