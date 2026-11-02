// All page content lives here. Copy comes from the client's current site (typos fixed) unless marked placeholder.
// Source: evmgroup.co.in pages, its public data endpoints, and its contact blocks. See the section map in the design-craft skill.
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
    { label: 'History', href: '#history' },
    { label: 'People', href: '#people' },
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
    text: 'EVM Group is synonymous with passion, integrity and hard work. The group has its footprints across manufacturing and service sectors: automobile, hospitality, hill produce and entertainment. For us, future is our business. EVM is named after our founder, E.V. Mathai, who started his own business in 1952 and auctioned a toddy shop at the age of fifteen.',
    numbers: [
      { n: '68', t: 'Years of experience' },
      { n: '12 lakh', t: 'Satisfied customers' },
    ],
    numbersNote: 'Figures from the current website (2020). To be updated by the client.',
  },
  photo: { img: 'break-showroom.webp', alt: 'A glass-fronted car showroom glowing at night' },
  marques: {
    label: 'Marques',
    // All car and motorcycle scenes are generated from the client's own press photos (illustrative).
    items: [
      { name: 'Porsche', img: 'panel-porsche.webp', alt: 'A red Porsche 911 GT3 on a wet road at dusk', note: 'Porsche Centre Kochi is Kerala\'s sole dealer for Porsche sport luxury cars, including the 911, Boxster, Cayman, Macan, Cayenne and Panamera.' },
      { name: 'BMW', img: 'panel-bmw.webp', alt: 'A white BMW M car with blue and red stripes at dusk', note: 'The BMW dealership since 2016. The showrooms in Cochin and Trivandrum have an expert sales team, service advisors and Product Geniuses.' },
      { name: 'MINI', img: 'panel-mini.webp', alt: 'A teal MINI Convertible on a wet road at dusk', note: 'Authorised MINI dealers since April 2019. The Kalamassery showroom in Cochin has a four car display and a cafe with MINI accessories and lifestyle collection.' },
      { name: 'Volkswagen', img: 'brand-vw.webp', alt: 'A red Volkswagen Polo on a wet road at dusk', note: 'The first car dealership set up by the EVM family, in September 2008.' },
      { name: 'Skoda', img: 'brand-skoda.webp', alt: 'An orange Skoda SUV on a wet road at dusk', note: 'EVM Skoda opened in October 2019 at Muttom, Cochin, with a 25 bay workshop and a wide range of models.' },
      { name: 'Nissan', img: 'brand-nissan.webp', alt: 'A silver Nissan sedan on a wet road at dusk', note: 'Started in 2009 and grown to five full dealerships across north and central Kerala.' },
      { name: 'Honda', img: 'brand-honda.webp', alt: 'A dark grey Honda roadster motorcycle at dusk', note: 'EVM Honda was the first automobile dealership of the group, set up in 2001.' },
      { name: 'MG', img: 'brand-mg.webp', alt: 'A red MG Hector SUV on a wet road at dusk', note: 'Won in June 2019 through Coastline Garages for Cochin, Trichur, Calicut and Kottayam, with extension centres in Palakkad, Malappuram and Alappuzha.' },
      { name: 'Isuzu', img: 'brand-isuzu.webp', alt: 'A dark grey Isuzu pickup on a wet road at dusk', note: 'Dealers for the districts of Trivandrum and Pathanamthitta since 2018.' },
      { name: 'Datsun', img: 'brand-datsun.webp', alt: 'A blue Datsun compact MPV on a wet road at dusk', note: 'EVM Datsun, part of the group\'s automobile dealerships.' },
      { name: 'BMW Motorrad', img: 'brand-motorrad.webp', alt: 'A white BMW motorcycle on a wet road at dusk', note: 'The flagship motorcycle dealership of the group, with showrooms in Cochin, Calicut and Trivandrum.' },
      { name: 'Indian Motorcycle', img: 'brand-indian.webp', alt: 'A dark red Indian motorcycle on a wet road at dusk', note: 'Dealers for the Indian range of motorcycles, a brand that defines prestige and legacy.' },
      { name: 'Ashok Leyland', img: 'brand-ashok.webp', alt: 'A red Ashok Leyland container truck at dusk', note: 'EVM Ashok Leyland, commercial vehicles since 2011. Dealer of the Year 2014.' },
    ],
  },
  sectors: {
    label: 'Our sectors',
    text: 'The group has grown from rubber trading in Kothamangalam into a family of businesses: dealerships for the world\'s leading marques, hotels in the hills and on the backwaters, plantations, transport and cinemas.',
    items: [
      { name: 'Automobile', text: 'Dealerships for cars, motorcycles and commercial vehicles across Kerala.', img: 'sector-auto.webp', alt: 'Three sports cars in a dark showroom' },
      { name: 'Hotels and resorts', text: 'Mountain Club, Munnar in the tea gardens, and Le Leela, a boutique resort on the quay of Vembanad Lake.', img: 'sector-hotel.webp', alt: 'A resort hotel and pool at blue hour' },
      { name: 'Plantation', text: 'EVM Plantation: hill produce, lemongrass and tea from the high ranges.', img: 'sector-plantation.webp', alt: 'Tea plantation hills at sunrise with mist' },
      { name: 'Transportation', text: 'EVM Super Transportation, and EVM Wheels, a self drive rent a car service.', img: 'sector-transport.webp', alt: 'A freight truck on a highway at dusk' },
      { name: 'Entertainment', text: 'EVM Cinemas, from the Jawahar theatre in Kothamangalam to Kavitha in Kochi.', img: 'sector-cinema.webp', alt: 'Red cinema seats' },
    ],
  },
  beliefs: {
    missionLabel: 'Our mission',
    mission: 'To offer our customers the wide range of our product offerings with an exemplary service, delivered with warmth, friendliness, individual pride and brand spirit, so that their lives are joyful and healthy and their transport needs are met. Service fuels us. Our future is our business.',
    visionLabel: 'Our vision',
    vision: [
      'To help all families discover the joy of everyday life.',
      'Dedicated to creating lifetime customers through superior service, and to serve to win.',
      'A place people love to work, and in turn our people provide service you would love to spread.',
      'To run profitable businesses for long term viability.',
      'Forward thinking, and aiming to be India\'s most customer centric group through our commitment to excellence.',
    ],
  },
  history: {
    label: 'Our history',
    caption: 'How the group grew from 1952 to 2019.',
    items: [
      { y: '1952', t: 'E.V. Mathai steps out of his agrarian family background to start a business of his own. He auctions a toddy shop at the age of fifteen.' },
      { y: '1975', t: 'Rubber trading begins at Kothamangalam.' },
      { y: '1976', t: 'Entry into the private bus industry with the EVM bus service.' },
      { y: '1977', t: 'Lemongrass refineries start in the high ranges.' },
      { y: '1978', t: 'Entry into the transportation industry. The C and F agency for Tata Tea begins.' },
      { y: '1980', t: 'Entry into hospitality with Hotel Matha at Kothamangalam and Adimali.' },
      { y: '1982', t: 'The arrack and rubber business expands to north Kerala.' },
      { y: '1985', t: 'EVM Cinemas begins with the acquisition of the Jawahar theatre at Kothamangalam.' },
      { y: '1988', t: 'Hill View, the first hotel in Munnar.' },
      { y: '1996', t: 'The first theatre in Kochi, Kavitha, is purchased.' },
      { y: '1999', t: 'The group loses its founder, E.V. Mathai, after he had set the path for sustained growth and innovative approaches to business.' },
      { y: '2001', t: 'EVM Honda, the first automobile dealership of the group.' },
      { y: '2008', t: 'EVM Volkswagen, the first car dealership set up by the EVM family, opens in September.' },
      { y: '2009', t: 'EVM Nissan begins and expands to five full dealerships over north and central Kerala.' },
      { y: '2011', t: 'EVM Ashok Leyland.' },
      { y: '2012', t: 'EVM Group becomes the dealer for Polaris.' },
      { y: '2013', t: 'Porsche Centre Kochi becomes Kerala\'s sole dealer for Porsche.' },
      { y: '2014', t: 'EVM Scania.' },
      { y: '2015', t: 'Dealers for the Indian range of motorcycles.' },
      { y: '2016', t: 'The BMW dealership for Kerala, with showrooms in Cochin and Trivandrum and a host of service facilities.' },
      { y: '2017', t: 'Ducati Kochi opens in March, an exclusive dealership for Ducati motorcycles. BMW Motorrad becomes the flagship motorcycle dealership, in Cochin, Calicut and Trivandrum.' },
      { y: '2018', t: 'EVM bags the Isuzu dealership for Trivandrum and Pathanamthitta.' },
      { y: '2019', t: 'Morris Garages for Cochin, Trichur, Calicut and Kottayam, through Coastline Garages India Pvt Ltd. Skoda opens in Muttom, Cochin with a 25 bay workshop. EVM AutoKraft becomes the MINI dealer for Kerala.' },
    ],
  },
  letters: {
    label: 'Messages',
    items: [
      {
        who: 'E.M. Johny', role: 'Chairman',
        lead: 'Welcome to the EVM Group website.',
        body: [
          'Within these pages you will learn more about our history, our varied business interests, our latest accomplishments and the products and services we offer. You will also find out more about the values of our group, which since it was first established has been committed to delighting customers with diverse product offerings and setting unparalleled service standards.',
          'The group was founded by the enterprising E.V. Mathai, who started as an agriculturist and later ventured into hospitality and beverage services. Today EVM Group is a very strong brand in Kerala. His pioneering ideas, positive outlook and impeccable leadership helped me in a smooth transition, and we are reaping the benefits and blessings over the decades.',
        ],
      },
      {
        who: 'Sabu Johny', role: 'Managing Director',
        lead: 'There is always another milestone waiting to be crossed.',
        body: [
          'I join our Chairman in welcoming you. Under the guidance and with the blessing of our Chairman and family members we have come a long way in our entrepreneurial voyage.',
          'Progress and expansion of our business has never been a destination: once one milestone is achieved there is always another one waiting. We have always believed in challenging ourselves, picking up the learnings when we fall by the wayside, and building successful ventures on the other side.',
          'Our strength is our entrepreneurial courage, our unique ideas and values, where we deliver excellent, technology oriented and smart services by giving equal importance to all stakeholders in the chain: our principals, team partners, clients and society.',
        ],
      },
    ],
    note: 'Both messages are excerpts: the current website shows only the opening paragraphs. The Chairman\'s original text says the group was established in 1957; the group\'s own history says 1952.',
  },
  people: {
    label: 'Directors and top management',
    items: [
      { name: 'E.V. Mathai', role: 'Founder, EVM Group', ini: 'EM' },
      { name: 'E.M. Johny', role: 'Chairman, EVM Group', ini: 'EJ' },
      { name: 'Sabu Johny', role: 'Managing Director, EVM Group', ini: 'SJ' },
      { name: 'Divya Paul', role: 'Director', ini: 'DP' },
      { name: 'Gishil Bose', role: 'CEO, BMW EVM Autokraft', ini: 'GB' },
      { name: 'Shemir Mohammed', role: 'CEO, Volkswagen and Nissan', ini: 'SM' },
      { name: 'Varghese Mathew', role: 'Business Head, EVM Porsche', ini: 'VM' },
      { name: 'Biju K Gopalakrishnan', role: 'CEO, Skoda and Nissan Service', ini: 'BG' },
      { name: 'Harish V R', role: 'Head, Finance', ini: 'HR' },
    ],
    note: 'Portraits are placeholders (initials). Real portraits to be supplied.',
  },
  recognition: {
    label: 'Recognition',
    items: [
      { name: 'All India No.1 Dealer', text: 'Excellent Performance Award 2012 to 2013.' },
      { name: 'Ashok Leyland', text: 'Dealer of the Year 2014.' },
      { name: 'Honda', text: 'Autocar Bike Dealer of the Year 2018. The only Honda dealer in Kerala selected for the Elite Club of Wing World Dealers, and ranked No. 1 in South India and No. 2 in all India in the Dealer Customer Satisfaction Index, 2014 to 2015.' },
      { name: 'Porsche', text: 'More than 350 cars delivered since inception, including India\'s first 2020 model year 911. Set the benchmark for Porsche infrastructure in India.' },
      { name: 'BMW', text: 'Annual retail targets achieved since inception, with 120% CBU achievement including the M760Li xDrive and X5 M in 2018. Complaints per throughput were the lowest in the country in 2018, with 100% manpower availability and 0% attrition in after sales.' },
      { name: 'Nissan', text: 'Executive member of the Nissan dealer core committee. Highest Nissan sales in all India, and the first dealer in India to cross sales of 20,000 units.' },
    ],
  },
  reader: {
    label: 'What people say',
    items: [
      {
        "who": "Mr Jithin Jayakrishnan",
        "car": "BMW",
        "text": "The best customer-centric dealership I have ever dealt with happy to add The first BMW 840i in Kerala. Courteous staff and Management."
      },
      {
        "who": "Babu Xavier",
        "car": "MG Hector",
        "text": "Both Exterior and Interior of MG Hector are Remarkable. The Technology used in such a segment is awesome. I am fully satisfied with the service provided by Coastline Garages, Cochin. The Overall performance of the car after service is very good."
      },
      {
        "who": "Alfan Hassan",
        "car": "MINI Cooper",
        "text": "I wanted a MINI but one in which I could travel with my entire family. The MINI Countryman is a perfect choice. The staff at the MINI dealership made the entire buying experience cherishable."
      },
      {
        "who": "Rashid",
        "car": "MG Hector",
        "text": "I had a great experience with coastline garages. The salesman was an easy-going guy and was great to work with. I love my car and I got it at a very good price. Would definitely go to coastline garages for my next purchase."
      },
      {
        "who": "Dr Sunil Sreedhar",
        "car": "BMW",
        "text": "Happy to Own the First New X6 M40i in kerala my relationship with EVM Group over the past four to five years has made me a repeat buyer"
      },
      {
        "who": "Josily Boban",
        "car": "MINI Cooper",
        "text": "Had a fantastic experience buying my MINI and I absolutely love the car. It really is a great city car."
      },
      {
        "who": "Sujith Kammath",
        "car": "BMW",
        "text": "Being an auto enthusiast, my relationship with EVM Group has made me the owner of almost the whole portfolio, including cars, Motorrad bikes and MINI."
      },
      {
        "who": "Remya Nambeesan",
        "car": "MINI Cooper",
        "text": "I recently purchased my first MINI from MINI EVM Autokraft. I loved the experience and would surely recommend it to others."
      },
      {
        "who": "Vivek Ajit",
        "car": "MINI Cooper",
        "text": "Our MINI is the 3rd car purchased from the EVM Autokraft dealership. This itself proves that their customer service is way beyond others. Really had a great experience. The MINI is a car that I always wanted to have in my garage and is a real pleasure to drive."
      },
      {
        "who": "Jeeva Joseph",
        "car": "MG Hector",
        "text": "Two good things happened last year. One as a Successful anchor and second yes I own an MG.a car with lots of emotions with the best in class features. I am using a top-end diesel variant with top-class performance with a satisfying 13 km/l mileage on the road. Thanks to Coastline Garages for helping me in choosing the better vehicle."
      },
      {
        "who": "Lijo Augustin",
        "car": "MG Hector",
        "text": "The MG Hector is the best car. The seating comfortableness is technically very good and has fabulous interior and outer body design. It is a very rich looking and advanced technology at this price. Boot space is satisfied with my family and sunroof is also very satisfying."
      }
    ],
  },
  contact: {
    label: 'Contact us',
    intro: 'Sometimes you need a little help from your friends or from our team. Do not worry, we are here for you.',
    offices: [
      { name: 'Corporate office', lines: ['E.V.M Motors and Vehicles India Pvt Ltd', 'Kannadikkadu, Maradu, Cochin, Kerala, India', '0484 404040', 'corporateoffice@evmgroup.co.in'] },
      { name: 'EVM Wheels', lines: ['3/276A, Volkswagen, Edappally, Kochi, Kerala 682034', '+91 7902530000', 'support@evmwheels.com'] },
      { name: 'EVM Honda, Trivandrum', lines: ['Jn P.O, Panvel-Kochi-Kanyakumari Highway, near Neeramankara, Kaimanam, Thiruvananthapuram', '98957 59493', 'gmtvm@evmhonda.com'] },
    ],
    formNote: 'This demo does not send messages.',
    careersLabel: 'Careers',
    careersText: 'Send your details and your resume to join the group.',
  },
  footer: {
    business: ['Plantation', 'Transportation', 'Entertainment', 'Hotels and resorts', 'EVM Wheels self drive rent a car'],
    automobile: ['Cars', 'Bikes'],
    address: 'Automotive and hospitality group. Kerala, India. Since 1952.',
    legal: 'Concept website. Copy and figures come from the current website and need client confirmation. Car and sector images are generated for this concept.',
  },
};
