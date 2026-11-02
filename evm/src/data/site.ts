// Homepage content: a highlight reel. The full content lives in archive.ts and belongs on the linked pages.
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
    filmAlt: 'A night drive and a white Porsche 911 cabriolet',
  },
  statement: {
    label: 'EVM Group, since 1952',
    text: 'In 1952, E.V. Mathai auctioned a toddy shop at fifteen. Today his family runs Kerala\'s dealerships for Porsche, BMW and MINI, and hotels, plantations and cinemas besides. Led by E.M. Johny and Sabu Johny.',
    links: [{ label: 'Our story', href: '/about' }, { label: 'Our people', href: '/people' }],
  },
  photo: { img: 'break-showroom.webp', alt: 'A glass-fronted car showroom glowing at night' },
  photoTwo: { img: 'sector-plantation.webp', alt: 'Tea plantation hills at sunrise with mist' },
  marques: {
    label: 'Marques',
    link: { label: 'All marques', href: '/marques' },
    // Scenes are generated from the client's own press photos (illustrative).
    items: [
      { name: 'Porsche', img: 'panel-porsche.webp', alt: 'A red Porsche 911 GT3 on a wet road at dusk', note: 'Kerala\'s sole Porsche dealer.' },
      { name: 'BMW', img: 'panel-bmw.webp', alt: 'A white BMW M car with blue and red stripes at dusk', note: 'Cochin and Trivandrum since 2016.' },
      { name: 'MINI', img: 'panel-mini.webp', alt: 'A teal MINI Convertible on a wet road at dusk', note: 'Authorised MINI dealer since 2019.' },
      { name: 'Volkswagen', img: 'brand-vw.webp', alt: 'A red Volkswagen Polo on a wet road at dusk', note: 'The family\'s first car dealership, 2008.' },
      { name: 'Skoda', img: 'brand-skoda.webp', alt: 'An orange Skoda SUV on a wet road at dusk', note: 'Muttom, Cochin, since 2019.' },
      { name: 'Nissan', img: 'brand-nissan.webp', alt: 'A silver Nissan sedan on a wet road at dusk', note: 'Five dealerships across Kerala.' },
      { name: 'Honda', img: 'brand-honda.webp', alt: 'A dark grey Honda roadster motorcycle at dusk', note: 'The group\'s first dealership, 2001.' },
      { name: 'MG', img: 'brand-mg.webp', alt: 'A red MG Hector SUV on a wet road at dusk', note: 'Through Coastline Garages since 2019.' },
    ],
  },
  sectors: {
    label: 'The group',
    text: 'One family of businesses, from showrooms to hill resorts.',
    rowsLabel: 'Our sectors',
    link: { label: 'All sectors', href: '/sectors' },
    items: [
      { name: 'Automobile', slug: 'automobile', img: 'sector-auto.webp', alt: 'Three sports cars in a dark showroom' },
      { name: 'Hotels and resorts', slug: 'hotels', img: 'sector-hotel.webp', alt: 'A resort hotel and pool at blue hour' },
      { name: 'Plantation', slug: 'plantation', img: 'sector-plantation.webp', alt: 'Tea plantation hills at sunrise with mist' },
      { name: 'Transportation', slug: 'transportation', img: 'sector-transport.webp', alt: 'A freight truck on a highway at dusk' },
      { name: 'Entertainment', slug: 'entertainment', img: 'sector-cinema.webp', alt: 'Red cinema seats' },
    ],
  },
  milestones: {
    label: 'Milestones',
    link: { label: 'Full history', href: '/history' },
    items: [
      { y: '1952', t: 'A toddy shop auction at fifteen.' },
      { y: '1985', t: 'EVM Cinemas opens in Kothamangalam.' },
      { y: '2013', t: 'Porsche Centre Kochi opens.' },
      { y: '2019', t: 'MG, Skoda and MINI join in one year.' },
    ],
  },
  proof: {
    label: 'What people say',
    quote: 'Our MINI is the third car we have bought from EVM Autokraft. That itself proves their service is way beyond others.',
    who: 'Vivek Ajit, MINI Cooper',
    reviews: { label: 'More reviews', href: '/reviews' },
    awardsLabel: 'Recognition',
    awardsLink: { label: 'All recognition', href: '/recognition' },
    awards: [
      'All India No.1 Dealer, 2012 to 2013',
      'First dealer in India to cross 20,000 Nissans',
      'Honda Elite Club of Wing World Dealers',
    ],
  },
  careers: {
    label: 'Careers',
    text: 'Join a family that has built on passion, integrity and hard work since 1952.',
    links: [{ label: 'Careers', href: '/careers' }, { label: 'Our people', href: '/people' }],
  },
  footer: {
    address: 'Automotive and hospitality group. Kerala, India. Since 1952.',
    contact: { label: 'Corporate office', lines: ['Maradu, Cochin', '0484 404040', 'corporateoffice@evmgroup.co.in'] },
    legal: 'Concept website. Content comes from the current website and needs client confirmation. Images are generated for this concept.',
  },
};
