// Single source of truth for links and copy. Copy is the client's final wording
// (see research/content-final.md). Only layout and order changed.

export const links = {
  login: 'https://apply.doveslife.co.uk/portal/login',
  apply: 'https://apply.doveslife.co.uk/apply/lead',
  report: 'https://apply.doveslife.co.uk/report-a-death',
  parent: 'https://doves.co.zw/',
  whatsapp: 'https://wa.me/447387940626',
} as const;

export const contact = {
  address: 'Unit 17f, The Lansbury Estates, 102 Lower Guildford Road, Knaphill, Woking, Surrey, England, GU21 2EP',
  landline: { label: '+44 20 3885 1002', href: 'tel:+442038851002' },
  mobile: { label: '+44 7387 940626', href: 'tel:+447387940626' },
  whatsapp: { label: '+44 7387 940626', href: links.whatsapp },
  email: 'enquiries@doves.co.zw',
} as const;

export const nav = [
  { label: 'Repatriation', href: '#repatriation' },
  { label: 'Doves Global Plan', href: '#global-plan' },
  { label: 'Remittances', href: '#remittances' },
  { label: 'Contact', href: '#contact' },
] as const;

export const hero = {
  title: ['Bringing peace', 'of mind', 'across borders'],
  trust: 'Trusted since 1902',
  body: 'We assist bereaved families to repatriate or expatriate their loved ones, and we look after the documentation from start to finish.',
};

export const repatriation = {
  title: 'Repatriation & Expatriation',
  body: 'We assist bereaved families to repatriate or expatriate their loved ones. We assist in all documentation processing from start to finish. Our wealth of experience in repatriations and expatriations has made our service second to none.',
  points: [
    'Documentation handled from the first paper to airport clearance.',
    'Care, embalming, casket and hearse included in the cover.',
    'A service shaped by long experience with families at home and abroad.',
  ],
  captions: {
    attendance: 'Attendance from the first call',
    airport: 'Airport clearance for the journey home',
  },
};

export type Frame = {
  title: string;
  image: string; // file name (without .jpg) in src/assets/photos/covers
  alt: string;
  pos: string; // object-position focal point
};

// Title and photo pairs follow doveslife.co.uk. Alt text is from the same site.
export const covers = {
  title: 'Doves repatriation covers',
  body: 'Everything listed here is part of the repatriation cover, so families know what is taken care of before the journey begins.',
  items: [
    { title: 'Attendance fees', image: 'attendance', alt: 'An officiant attending a coffin at a service', pos: '50% 40%' },
    { title: 'Mortuary fees', image: 'mortuary', alt: 'Refrigerated mortuary units at a Doves mortuary', pos: '50% 50%' },
    { title: 'Removal', image: 'hospital-bed', alt: 'A hospital ward, where collection often begins', pos: '50% 50%' },
    { title: 'Undertakers', image: 'undertakers', alt: 'The Doves undertakers team in blue suits and white gloves', pos: '50% 40%' },
    { title: 'Washing and dressing', image: 'shirt', alt: 'Clothing prepared for dressing', pos: '35% 50%' },
    { title: 'Embalming', image: 'clinical', alt: 'A practitioner preparing sterile gloves', pos: '50% 60%' },
    { title: 'Casket', image: 'casket', alt: 'A white and gold Doves casket with gold handles', pos: '88% 55%' },
    { title: 'Zinc lining', image: 'zinc-lining', alt: 'A closed sealed casket prepared for travel', pos: '55% 50%' },
    { title: 'Hearse', image: 'hearse', alt: 'A Doves Mercedes hearse', pos: '35% 50%' },
    { title: 'Airport clearance', image: 'airport', alt: 'An aircraft wing at sunset, where the journey home begins', pos: '50% 50%' },
    { title: 'Documentation', image: 'papers', alt: 'Official papers being completed', pos: '50% 50%' },
  ] satisfies Frame[],
};

export const plan = {
  title: 'Doves Global Plan',
  tagline: 'Bringing peace of mind across borders',
  body: 'This is one plan: funeral and repatriation cover for Zimbabweans living in the UK and abroad. Single or family plans, with dependants included, and a benefits schedule you can read before you apply. The principal member pays the premium from overseas. Family in Zimbabwe can be included on the local deluxe plan rates.',
  benefitsTitle: 'Benefits',
  benefits: [
    'Bringing the deceased into care from hospital or mortuary',
    'Full embalming',
    'Washing & dressing',
    'Provision of zinc lined burial casket',
    'Grocery allowance',
    'Advice and support throughout the process',
    'Provision of all the necessary administration and documentation',
  ],
  optionalTitle: 'Optional benefits',
  optional: [
    'Life insurance component',
    'International travel cover',
    'Bus, courtesy vehicles, accommodation',
    'Funeral catering and décor',
    '2 return air tickets',
  ],
};

export const steps = {
  title: 'Four steps to being covered',
  body: 'Apply online in about ten minutes. Your progress is saved as you go, so you can finish later.',
  items: [
    { title: 'Verify your number', body: "A one-time WhatsApp code confirms it's really you." },
    { title: 'Choose your plan', body: 'Pick your region, currency and cover amount.' },
    { title: 'Tell us about you', body: 'Personal details, family members and payment method.' },
    { title: 'Sign and pay', body: 'Sign on screen. Your policy document follows by email and WhatsApp.' },
  ],
};

export type FleetItem = { title: string; image: string; alt: string; pos: string };

// Title and photo pairs follow doveslife.co.uk.
export const fleet = {
  title: 'Fleet, tentage and events',
  body: 'The plan includes the vehicles for the journey, executive tentage for the gathering, and the event set up for family and guests.',
  items: [
    { title: 'G-Wagon hearse', image: 'hearse-prestige', alt: 'A white G-Wagon hearse', pos: '45% 55%' },
    { title: 'Executive hearses', image: 'exec-hearses', alt: 'Three Doves executive hearses seen from above', pos: '50% 50%' },
    { title: 'Vintage hearses', image: 'vintage-hearse', alt: 'A dark vintage Doves hearse', pos: '50% 55%' },
    { title: 'All terrain hearses', image: 'removal-vehicle', alt: 'A Doves all terrain vehicle on a bush track', pos: '50% 55%' },
    { title: 'Hearses', image: 'line-up', alt: 'The Doves fleet lined up on a field', pos: '50% 55%' },
    { title: 'Executive buses', image: 'courtesy-bus', alt: 'A Doves VVIP executive coach', pos: '60% 50%' },
    { title: 'Mourners transport', image: 'executive-buses', alt: 'A row of Doves buses for mourners', pos: '50% 55%' },
    { title: 'Courtesy vehicles', image: 'courtesy-suv', alt: 'White Doves courtesy SUVs parked together', pos: '50% 55%' },
    { title: 'Executive tentage', image: 'executive-tentage', alt: 'Tentage with lounge seating set up for a gathering', pos: '50% 55%' },
    { title: 'Executive events set up', image: 'executive-events', alt: 'A black and white dance floor and stage under a marquee', pos: '50% 55%' },
  ] satisfies FleetItem[],
};

export const currency = {
  title: 'Pay in your currency',
  lead: 'Wherever you are',
  body: 'Choose your region at the start of the application and we show cover and premiums in a currency that makes sense to you.',
  regions: [
    { big: 'ZAR', name: 'South Africa', note: 'Cover in ZAR' },
    { big: '8', name: 'SADC region', note: '8 local currencies' },
    { big: 'GBP', name: 'Worldwide', note: 'USD, GBP, EUR and more' },
  ],
};

export const faq = {
  title: 'Who the plan is for',
  body: 'A few clear answers for families arranging cover from abroad.',
  items: [
    {
      q: 'Who is eligible?',
      a: 'Zimbabweans residing abroad. Coverage is available for both members residing abroad and in Zimbabwe.',
    },
    {
      q: 'What if I want to add my beneficiaries in Zimbabwe?',
      a: 'Members are covered using the local deluxe plan rates.',
    },
    {
      q: 'Who pays for premiums?',
      a: 'The principal member living abroad pays the premium, in the currency they earn in. South Africa is shown in ZAR, the SADC region in 8 local currencies, and worldwide cover in USD, GBP, EUR and more.',
    },
  ],
};

export const remit = {
  title: 'International remittances',
  caption: 'Money sent across borders',
  body: [
    'Families can send and receive money across borders, including support for relatives in Zimbabwe.',
    'Western Union and WorldRemit collections can be made at Doves branches, with cash available for convenience and peace of mind.',
  ],
  partners: ['Western Union', 'WorldRemit', 'Doves branches'],
};

export const cta = {
  title: 'Start your application today',
  body: 'It takes about ten minutes. Your progress is saved as you go, so you can finish later.',
};

export const contactCopy = {
  title: 'Speak with us',
  formTitle: 'Send an enquiry',
  services: [
    'Repatriation & expatriation',
    'Doves Global Plan',
    'Beneficiaries in Zimbabwe',
    'International remittances',
  ],
};

export const footer = {
  tagline: 'Funeral and repatriation cover for Zimbabweans living in the UK and abroad.',
  open: 'Open 24/7 for funeral services',
  copyright: '© 2026 Doves Holdings. Trusted since 1902.',
};

// Regulatory wording (FCA / insurer details) goes here once supplied by Doves.
// Leave empty and nothing is rendered.
export const regulatory: string[] = [];

