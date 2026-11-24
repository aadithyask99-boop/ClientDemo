// All content for the UK Thech homepage concept. Anything marked TO_CONFIRM is a placeholder the client has not confirmed.
// It is shown on the page as a labelled placeholder, never as fact (see README).
const m = (n: string) => `media/${n}.webp`;

export const site = {
  brand: { name: 'UK Thech', note: 'Working name only. The client is renaming; replace the wordmark when the new name arrives.' },
  contact: {
    person: 'Your named contact',            // TO_CONFIRM: a real named person and photo
    phone: '0000 000 0000',                  // TO_CONFIRM: direct number
    email: 'quotes@example.com',             // TO_CONFIRM: quote inbox (used for the mailto fallback)
    address: 'UK address to confirm',        // TO_CONFIRM
    replyTime: 'a reply time we will confirm', // TO_CONFIRM
    company: 'Company number 13801574',      // from the client's current site
  },
  nav: {
    links: [
      { id: 'education', label: 'Education', title: 'Education', items: ['Chromebooks for classrooms', 'Windows laptops for staff', 'Tablets and charging', 'Trusts and multi-site orders'], image: 'hero-school' },
      { id: 'public', label: 'Public sector', title: 'Public sector', items: ['NHS and health', 'Councils and local government', 'Below-threshold purchases', 'Refurbished and recycled'], image: 'hero-ward' },
      { id: 'hospitality', label: 'Hospitality', title: 'Hospitality', items: ['Front-desk laptops', 'Multi-site roll-outs', 'Tablets and displays', 'Fast replacements'], image: 'hero-hotel' },
      { id: 'property', label: 'Property', title: 'Property and business', items: ['Landlords and agents', 'Construction and site offices', 'Small business refresh', 'Accessories'], image: 'hero-council' },
      { id: 'how', label: 'How it works', title: 'How it works', items: ['Tell us what, how many, by when', 'We source and price it', 'It arrives with its paperwork', 'Send us a quote to beat'], image: 'promise-desk' },
    ],
  },
  hero: {
    lead: 'Tech for',
    scenes: [
      { word: 'Schools', image: 'hero-school', alt: 'An empty school corridor at dusk with a charging trolley of laptops in warm low sun' },
      { word: 'Hospitals', image: 'hero-ward', alt: 'A curved wooden reception counter in a quiet health building at night' },
      { word: 'Councils', image: 'hero-council', alt: 'A council service counter in late afternoon light with a laptop and folders' },
      { word: 'Hotels', image: 'hero-hotel', alt: 'A dark timber hotel front desk with a stool in the evening glow' },
    ],
    interval: 5300,
    cta: 'Get a quote',
    media: m,
  },
  statement: {
    // The four sector words are set inline (marked by []). Words brighten with scroll.
    text: 'We source the technology [schools], [hospitals], [councils] and [hotels] need, at a price that beats the quote you hold, and it arrives with the paperwork to prove it.',
  },
  schools: {
    title: 'What schools buy first',
    lead: { name: 'Chromebooks', line: 'The classroom workhorse, sourced new and boxed with full warranty.', image: 'obj-chromebooks', closeup: 'hero-hotel-alt' },
    sideA: { name: 'Charging trolleys', line: 'Stored, charged and wheeled between rooms.', image: 'obj-trolley', closeup: 'hero-school-alt' },
    sideB: { name: 'Tablets', line: 'For younger year groups and support staff.', image: 'obj-tablets', closeup: 'hero-council-alt' },
  },
  quote: {
    heading: 'Tell us what you need',
    products: ['Chromebooks', 'Windows laptops', 'MacBooks', 'Tablets', 'Something else'],
    quantities: ['10', '30', '60', '100', '250+'],
    whens: ['this month', 'next month', 'before September', 'later this year'],
    defaults: { product: 'Chromebooks', quantity: '30', when: 'before September' },
    confirm: 'Thank you. This is a concept, so nothing was sent, but this is the quote you asked for:',
    objects: ['obj-chromebooks-b', 'obj-trolley-front', 'obj-tablets-b', 'obj-parcel-b', 'obj-van-b'],
  },
  order: {
    title: 'Every order arrives with its paperwork',
    steps: [
      { title: 'It arrives', line: 'Boxed, checked and tagged before it leaves us.' },
      { title: 'It opens', line: 'The pack sits on top: quote, specification, serial list.' },
      { title: 'It is yours', line: 'Delivery note and certificates, ready for your records.' },
    ],
    note: 'Illustrative. The real pack contents are to be confirmed with the client.',
  },
  promise: {
    line1: 'Send us the quote you hold.',
    line2: 'We will try to beat it.',
    drop: 'Drop your quote in the tray',
    after: 'Received. A named person will reply.',
    image: 'promise-desk',
  },
  footer: {
    sectors: ['Education', 'Public sector', 'Hospitality', 'Property and business'],
    links: ['How it works', 'Sustainability and recycling', 'Privacy and GDPR', 'Contact'],
    van: 'obj-van',
  },
  // Builder C (order, promise, footer, easter eggs): interface copy only, no new facts
  uiC: {
    orderAlt: 'A cardboard parcel opening on a table, with a pack of blank paper lifting out of it',
    promiseAlt: 'A wooden desk beside a sash window with a wire in-tray of papers, a closed laptop, a mug and an angled lamp',
    promiseFile: 'Choose the quote you hold',
    promiseName: 'File chosen:',
    placeholder: 'Placeholder, to confirm with the client',
    footerQuote: 'Get a quote',
    stamp: 'Received',
  },
};
export type Site = typeof site;
