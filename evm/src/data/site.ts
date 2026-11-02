// All page content lives here. Copy comes from the client's current site (typos fixed) unless marked placeholder.
export const site = {
  name: 'EVM Group',
  title: 'EVM Group | Porsche, BMW, MINI and more across Kerala',
  description:
    'EVM Group has built automobile dealerships, hotels, plantations, transport and cinemas across Kerala since 1952. Future is our business.',
  lang: 'en-IN',
  tagOne: 'EVM Group',
  tagTwo: 'Automotive and hospitality group',
  nav: [
    { label: 'About', href: '#statement' },
    { label: 'Marques', href: '#marques' },
    { label: 'Sectors', href: '#sectors' },
    { label: 'Recognition', href: '#recognition' },
    { label: 'Contact', href: '#contact' },
  ],
  hero: {
    lines: ['Future is', 'our Business'],
    sub: 'Seven decades of dealerships, hotels, plantations, transport and cinemas across Kerala.',
    cta: 'Our story',
    filmAlt: 'A night drive and a white Porsche 911 cabriolet',
  },
  statement: {
    label: 'EVM Group, since 1952',
    text: 'EVM Group is synonymous with passion, integrity and hard work. Since 1952, when E.V. Mathai auctioned a toddy shop at fifteen and set out on his own, the family has built a group that spans automobile dealerships, hotels, plantations, transport and cinemas across Kerala.',
  },
  photo: { img: 'break-showroom.webp', alt: 'A glass-fronted car showroom glowing at night' },
  marques: {
    label: 'Marques',
    caption: 'EVM Group represents these marques across Kerala.',
    // Porsche, BMW and MINI scenes are generated from the client\'s press photos (illustrative). The rest too (see README).
    items: [
      { name: 'Porsche', slug: 'porsche', img: 'panel-porsche.webp', alt: 'A red Porsche 911 GT3 on a wet road at dusk', pos: '50% 62%' },
      { name: 'BMW', slug: 'bmw', img: 'panel-bmw.webp', alt: 'A white BMW M car with blue and red stripes at dusk', pos: '45% 58%' },
      { name: 'MINI', slug: 'mini', img: 'panel-mini.webp', alt: 'A teal MINI Convertible on a wet road at dusk', pos: '50% 62%' },
      { name: 'Volkswagen', slug: 'volkswagen', img: 'brand-vw.webp', alt: 'A red Volkswagen Polo on a wet road at dusk', pos: '50% 58%' },
      { name: 'Skoda', slug: 'skoda', img: 'brand-skoda.webp', alt: 'An orange Skoda SUV on a wet road at dusk', pos: '50% 58%' },
      { name: 'Nissan', slug: 'nissan', img: 'brand-nissan.webp', alt: 'A silver Nissan sedan on a wet road at dusk', pos: '50% 58%' },
      { name: 'Isuzu', slug: 'isuzu', img: 'brand-isuzu.webp', alt: 'A dark grey Isuzu pickup on a wet road at dusk', pos: '50% 58%' },
      { name: 'BMW Motorrad', slug: 'bmw-motorrad', img: 'brand-motorrad.webp', alt: 'A white BMW motorcycle on a wet road at dusk', pos: '50% 58%' },
      { name: 'Indian Motorcycle', slug: 'indian-motorcycle', img: 'brand-indian.webp', alt: 'A dark red Indian motorcycle on a wet road at dusk', pos: '50% 58%' },
    ],
  },
  history: {
    label: 'Our story',
    text: '1952, E.V. Mathai auctions a toddy shop at fifteen and takes his first steps in business. 1975, rubber trading begins at Kothamangalam. 1976, the EVM bus service starts. 1980, Hotel Matha opens. 1985, EVM Cinemas begins with the Jawahar theatre. 1988, Hill View opens in Munnar. 2001, EVM Honda becomes the first automobile dealership. 2008, EVM Volkswagen opens. 2013, Porsche Centre Kochi becomes the sole Porsche dealer in Kerala. 2016, BMW arrives in Cochin and Trivandrum. 2019, MG, Skoda and MINI join the group.',
  },
  sectors: {
    label: 'Our sectors',
    items: [
      { name: 'Automobile', slug: 'automobile' },
      { name: 'Hotels and resorts', slug: 'hotels' },
      { name: 'Plantation', slug: 'plantation' },
      { name: 'Transportation', slug: 'transportation' },
      { name: 'Entertainment', slug: 'entertainment' },
    ],
  },
  recognition: {
    label: 'Recognition',
    items: [
      { name: 'Porsche', text: 'More than 350 cars delivered since inception, including India\'s first 2020 model year 911. Set the benchmark for Porsche infrastructure in India.' },
      { name: 'BMW', text: 'Annual retail targets achieved since inception, with 120% CBU achievement in 2018 and the lowest complaints per throughput in the country.' },
      { name: 'Honda', text: 'The only Honda dealer in Kerala selected for the Elite Club of Wing World Dealers. Ranked No. 1 in South India in the Dealer Customer Satisfaction Index, 2014 to 2015.' },
      { name: 'Nissan', text: 'First dealer in India to cross 20,000 units, with the highest Nissan sales in all India.' },
    ],
    peopleLabel: 'Directors',
    people: [
      { name: 'E.V. Mathai', role: 'Founder' },
      { name: 'E.M. Johny', role: 'Chairman' },
      { name: 'Sabu Johny', role: 'Managing Director' },
      { name: 'Divya Paul', role: 'Director' },
    ],
  },
  footer: {
    address: 'Automotive and hospitality group. Kerala, India. Since 1952.',
    contactNote: 'Contact details to be confirmed by EVM Group.',
    legal: 'Concept website. Copy and figures come from the current website and need client confirmation.',
  },
};
