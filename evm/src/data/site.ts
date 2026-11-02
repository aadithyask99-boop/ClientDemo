// All page content lives here. Copy comes from the client's current site (typos fixed) unless marked placeholder.
export const site = {
  name: 'EVM Group',
  title: 'EVM Group | Porsche, BMW, MINI and more across Kerala',
  description:
    'EVM Group has built automobile dealerships, hotels, plantations, transport and cinemas across Kerala since 1952. Future is our business.',
  lang: 'en-IN',
  tagline: 'Automotive and hospitality group',
  nav: [
    { label: 'Home', href: '#top', img: 'hero-poster.webp' },
    { label: 'About', href: '#statement', img: 'sector-plantation.webp' },
    { label: 'Marques', href: '#marques', img: 'panel-bmw.webp' },
    { label: 'Our story', href: '#story', img: 'sector-cinema.webp' },
    { label: 'Sectors', href: '#sectors', img: 'sector-hotel.webp' },
    { label: 'Contact', href: '#contact', img: 'panel-mini.webp' },
  ],
  hero: {
    lines: ['Future is', 'our Business'],
    sub: 'Seven decades of dealerships, hotels, plantations, transport and cinemas across Kerala.',
    cta: 'Explore the marques',
    filmAlt: 'A white Porsche 911 cabriolet parked outside a villa',
  },
  statement:
    'EVM Group is synonymous with passion, integrity and hard work. Since 1952, when E.V. Mathai auctioned a toddy shop at fifteen and set out on his own, the family has built a group that spans automobile dealerships, hotels, plantations, transport and cinemas across Kerala.',
  marques: {
    title: 'The marques we represent',
    // Porsche, BMW and MINI scenes are generated from the client's press photos (illustrative). The rest are the client's press photos.
    items: [
      { name: 'Porsche', slug: 'porsche', note: 'Porsche Centre Kochi, Kerala\'s sole Porsche dealer', img: 'panel-porsche.webp', alt: 'A red Porsche 911 GT3 on a wet road at dusk', pos: '50% 62%' },
      { name: 'BMW', slug: 'bmw', note: 'Cochin, Trivandrum and a host of service facilities', img: 'panel-bmw.webp', alt: 'A white BMW M car with blue and red stripes at dusk', pos: '45% 58%' },
      { name: 'MINI', slug: 'mini', note: 'EVM Autokraft, the MINI dealership for Kerala', img: 'panel-mini.webp', alt: 'A teal MINI Convertible on a wet road at dusk', pos: '50% 62%' },
      { name: 'Volkswagen', slug: 'volkswagen', note: 'The first Volkswagen dealership of the family, set up in 2008', img: 'brand-vw.webp', alt: 'A red Volkswagen Polo on a wet road at dusk', pos: '50% 58%' },
      { name: 'Skoda', slug: 'skoda', note: 'EVM Skoda, with a 25 bay workshop in Muttom, Cochin', img: 'brand-skoda.webp', alt: 'An orange Skoda SUV on a wet road at dusk', pos: '50% 58%' },
      { name: 'Nissan', slug: 'nissan', note: 'Five full dealerships across north and central Kerala', img: 'brand-nissan.webp', alt: 'A silver Nissan sedan on a wet road at dusk', pos: '50% 58%' },
      { name: 'Isuzu', slug: 'isuzu', note: 'Trivandrum and Pathanamthitta districts', img: 'brand-isuzu.webp', alt: 'A dark grey Isuzu pickup on a wet road at dusk', pos: '50% 58%' },
      { name: 'BMW Motorrad', slug: 'bmw-motorrad', note: 'Motorcycles from the flagship EVM two wheeler dealerships', img: 'brand-motorrad.webp', alt: 'A white BMW motorcycle on a wet road at dusk', pos: '50% 58%' },
      { name: 'Indian Motorcycle', slug: 'indian-motorcycle', note: 'A brand that defines prestige and legacy', img: 'brand-indian.webp', alt: 'A dark red Indian motorcycle on a wet road at dusk', pos: '50% 58%' },
    ],
  },
  story: {
    title: 'Seven decades, one family',
    scenes: [
      { year: '1952', text: 'E.V. Mathai auctions a toddy shop at fifteen and takes his first steps in business.', img: 'sector-plantation.webp', alt: 'Tea plantation hills at sunrise with mist' },
      { year: '1985', text: 'EVM Cinemas begins with the Jawahar theatre at Kothamangalam.', img: 'sector-cinema.webp', alt: 'Red cinema seats' },
      { year: '2001', text: 'EVM Honda becomes the first automobile dealership of the group.', img: 'sector-auto.webp', alt: 'Three sports cars in a dark showroom' },
      { year: '2013', text: 'Porsche Centre Kochi becomes Kerala\'s sole dealer for Porsche.', img: 'panel-porsche.webp', alt: 'A red Porsche 911 GT3 on a wet road at dusk' },
      { year: '2019', text: 'MG, Skoda and MINI join the group within the same year.', img: 'panel-mini.webp', alt: 'A teal MINI Convertible on a wet road at dusk' },
    ],
    ledgerTitle: 'And in between',
    ledger: [
      { year: '1975', text: 'Rubber trading begins at Kothamangalam.' },
      { year: '1976', text: 'The EVM bus service brings the group into the private bus industry.' },
      { year: '1980', text: 'Hotel Matha opens at Kothamangalam and Adimali, the start of the hospitality business.' },
      { year: '1988', text: 'Hill View, the first hotel in Munnar, opens.' },
      { year: '2008', text: 'EVM Volkswagen opens in September.' },
      { year: '2016', text: 'BMW dealerships open in Cochin and Trivandrum, with a host of service facilities.' },
    ],
  },
  photoBreak: { line: 'From one toddy shop to the showrooms of Kerala.', img: 'break-showroom.webp', alt: 'A glass-fronted car showroom glowing at night' },
  sectors: {
    title: 'Beyond the showroom',
    items: [
      { name: 'Automobile', slug: 'automobile', text: 'Cars and motorcycles across Kerala, from Porsche and BMW to Nissan and Honda.', img: 'sector-auto.webp', alt: 'Three sports cars in a dark showroom' },
      { name: 'Hotels and resorts', slug: 'hotels', text: 'From Hotel Matha at Kothamangalam to Hill View in Munnar.', img: 'sector-hotel.webp', alt: 'A resort hotel and pool at blue hour' },
      { name: 'Plantation', slug: 'plantation', text: 'Hill produce and lemongrass from the high ranges, with tea trade since the 1970s.', img: 'sector-plantation.webp', alt: 'Tea plantation hills at sunrise with mist' },
      { name: 'Transportation', slug: 'transportation', text: 'Buses, freight and the C and F agency for Tata Tea, plus EVM Wheels self drive cars.', img: 'sector-transport.webp', alt: 'A freight truck on a highway at dusk' },
      { name: 'Entertainment', slug: 'entertainment', text: 'EVM Cinemas, from the Jawahar theatre in 1985 to Kavitha in Kochi.', img: 'sector-cinema.webp', alt: 'Red cinema seats' },
    ],
  },
  people: {
    title: 'The family behind it',
    items: [
      { name: 'E.V. Mathai', role: 'Founder', av: 0 },
      { name: 'E.M. Johny', role: 'Chairman', av: 1 },
      { name: 'Sabu Johny', role: 'Managing Director', av: 2 },
      { name: 'Divya Paul', role: 'Director', av: 3 },
    ],
    awardsTitle: 'Recognition',
    awards: [
      { brand: 'Porsche', text: 'More than 350 cars delivered since inception, including India\'s first 2020 model year 911. Set the benchmark for Porsche infrastructure in India.' },
      { brand: 'BMW', text: 'Annual retail targets achieved since inception, with 120% CBU achievement in 2018 and the lowest complaints per throughput in the country.' },
      { brand: 'Honda', text: 'The only Honda dealer in Kerala selected for the Elite Club of Wing World Dealers. Ranked No. 1 in South India in the Dealer Customer Satisfaction Index, 2014 to 2015.' },
      { brand: 'Nissan', text: 'First dealer in India to cross 20,000 units, with the highest Nissan sales in all India.' },
    ],
  },
  quotes: [
    { who: 'Vivek Ajit', car: 'MINI Cooper', text: 'Our MINI is the third car purchased from the EVM Autokraft dealership. That itself proves their customer service is way beyond others.' },
    { who: 'Dr Sunil Sreedhar', car: 'BMW', text: 'Happy to own the first new X6 M40i in Kerala. The relationship with EVM Group over the past four to five years has made me a repeat buyer.' },
    { who: 'Jithin Jayakrishnan', car: 'BMW', text: 'The best customer-centric dealership I have ever dealt with. Courteous staff and management.' },
  ],
  footer: {
    businesses: ['Plantation', 'Transportation', 'Entertainment', 'Hotels and resorts', 'EVM Wheels self drive'],
    note: 'Demo concept for EVM Group. Figures and recognition come from the current website and need client confirmation. Portraits are placeholder illustrations. Car and sector images are generated for this concept.',
  },
};
