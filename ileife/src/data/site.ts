// All copy for the page lives here. Source: ileife.facesconsent.com and the @ileifebeauty Instagram,
// lightly edited. Reviews are the six on the current website, word for word.

export const brand = {
  name: 'ILÉ IFÉ',
  meaning: 'The House of Love',
  instagram: 'https://www.instagram.com/ileifebeauty/',
  handle: '@ileifebeauty',
  // Every Book button points here until the client's own booking page is confirmed
  book: 'https://ileife.facesconsent.com/',
  terms: 'https://ileife.facesconsent.com/',
  area: 'Elephant & Castle, South London',
};

export const hero = {
  title: ['Restorative skin care,', 'delivered', 'with intention.'],
  lede: 'A calm, intimate space for facials in South London.',
};

export const intro = {
  title: ['Skin care, on', 'your own terms.'],
  body:
    'ILÉ ÌFẸ́ (pronounced ee-leh ee-feh, meaning “The House of Love”) is a calm, intimate space for restorative skin care. Rooted in love and guided by peace, each treatment is intentionally designed to support skin health while restoring balance, confidence, and calm.',
  more:
    'Care here is unrushed, personal, and thoughtfully delivered, combining targeted techniques with a holistic approach to skin. The aim is simple: to restore your skin and create moments of peace that remain long after you leave.',
  facts: [
    { k: 'Facials from', v: '£90' },
    { k: 'Founder led', v: 'Princess Adeyemi' },
    { k: 'Where', v: 'South London' },
  ],
};

export const rules = {
  title: ['The house', 'rules.'],
  lede: 'How every appointment is run, whatever the facial.',
  list: [
    {
      t: 'Your skin over the sale',
      d: 'It is not about getting you to book. Time is taken to understand your concerns before anything is recommended, then each treatment is tailored to what your skin actually needs.',
    },
    {
      t: 'A conversation first',
      d: 'Nothing starts with a treatment. It starts with your skin, your stress and your environment, and the facial is built around you, not the other way round.',
    },
    {
      t: 'Barrier first',
      d: 'If your skin says no to extractions, we listen. Calming mask, LED, barrier repair first. Always read the skin.',
    },
    {
      t: 'Protocol before popularity',
      d: 'Melanin-rich skin is not difficult, it is reactive to inflammation. Some trends prioritise intensity. Here, control comes first.',
    },
  ],
};

export type TreatmentId = 'collagen' | 'glow' | 'clarity' | 'balance';
export type Treatment = {
  id: TreatmentId;
  name: string;
  price: string;
  for: string;
  body: string;
};

export const treatments = {
  title: ['Four facials,', 'one standard of care.'],
  list: [
    {
      id: 'collagen',
      name: 'Collagen Cocktail',
      price: '£90',
      for: 'Firmness, texture and long-term skin health',
      body: 'A restorative facial designed to support long-term skin health, boost firmness, and enhance hydration and radiance. Includes cleansing, dermaplaning, non-ablative chemical peel, microneedling, and a nourishing mask to smooth texture, stimulate collagen, and improve overall skin resilience.',
    },
    {
      id: 'glow',
      name: 'Glow Facial',
      price: '£90',
      for: 'Dull or dehydrated skin',
      body: 'A deeply hydrating facial focused on restoring moisture, smoothing texture, and enhancing natural radiance. Includes cleansing, dermaplaning, extractions (if needed) and high-frequency treatment, and a nourishing mask to maintain healthy, hydrated skin.',
    },
    {
      id: 'clarity',
      name: 'Clarity Facial',
      price: '£90',
      for: 'Congested or acne-prone skin',
      body: 'A supportive facial for congested or acne-prone skin. Includes cleansing, exfoliation, extractions, high-frequency treatment, and a mask, combined with either microneedling or a non-ablative chemical peel to reduce congestion and support barrier health.',
    },
    {
      id: 'balance',
      name: 'Balance Facial',
      price: '£90',
      for: 'Sensitive or reactive skin',
      body: 'A restorative facial for sensitive or reactive skin. Includes gentle cleansing, gentle exfoliation, extractions (if necessary), and a calming mask paired with an LED light to repair the skin barrier, restore balance, and support overall skin resilience.',
    },
  ] as Treatment[],
};

export const quiz = {
  title: ['Find your', 'skin persona.'],
  lede: 'Four quick questions to point you to the right facial. A starting point, not a diagnosis. Princess confirms everything at your consultation.',
  questions: [
    {
      q: 'What does your skin do most days?',
      a: [
        { t: 'Looks dull, tired or dry', s: { glow: 3 } },
        { t: 'Breaks out or feels congested', s: { clarity: 3 } },
        { t: 'Reacts easily: redness, stinging, tightness', s: { balance: 3 } },
        { t: 'Feels uneven, or less firm than it used to', s: { collagen: 3 } },
      ],
    },
    {
      q: 'How does your skin take new products?',
      a: [
        { t: 'Without any fuss', s: { glow: 1, collagen: 1 } },
        { t: 'Usually fine, occasionally flares', s: { clarity: 1 } },
        { t: 'It often stings or turns red', s: { balance: 2 } },
      ],
    },
    {
      q: 'What would you love to leave with?',
      a: [
        { t: 'An all-over, healthy glow', s: { glow: 2 } },
        { t: 'Clearer, calmer breakouts', s: { clarity: 2 } },
        { t: 'A stronger, settled skin barrier', s: { balance: 2 } },
        { t: 'Visible change over time', s: { collagen: 2 } },
      ],
    },
    {
      q: 'What pace suits you?',
      a: [
        { t: 'Gentle and calming', s: { balance: 2, glow: 1 } },
        { t: 'A proper reset, results first', s: { clarity: 1, collagen: 2 } },
        { t: 'Mostly a moment to switch off', s: { glow: 2, balance: 1 } },
      ],
    },
  ],
  personas: {
    glow: { name: 'The Glow Seeker', line: 'Your skin is asking for moisture and radiance.' },
    clarity: { name: 'The Clear Skin Builder', line: 'Your skin needs decongesting without being stripped.' },
    balance: { name: 'The Calm Barrier', line: 'Your skin needs soothing and a barrier it can rely on.' },
    collagen: { name: 'The Long Game', line: 'You are investing in how your skin looks and behaves over years, not days.' },
  },
};

export const princess = {
  title: ['Meet', 'Princess Adeyemi.'],
  role: 'Founder and aesthetician',
  body: [
    'A trained aesthetician with over five years of industry experience, currently advancing through Level 4 to 5 qualifications. Her practice is centred on corrective skincare, barrier repair, sensitivity management and restoring skin confidence.',
    'She guides clients toward long-term skin health through considered, gentle treatments, clear education, and a calm, faith-aligned environment.',
  ],
  quote: 'Without Christ there’s no ILÉ IFÉ.',
  focus: [
    { t: 'Barrier repair', d: 'Calming and strengthening skin that has been pushed too far.' },
    { t: 'Sensitivity', d: 'Reactive skin treated with patience and a slower pace.' },
    { t: 'Melanin-rich skin', d: 'Controlled technique that respects how deeper skin tones react to inflammation.' },
    { t: 'Corrective skincare', d: 'Visible results, without force.' },
  ],
  facts: [
    { k: '5+', v: 'years in the industry' },
    { k: 'L4 to 5', v: 'qualifications in progress' },
  ],
};

export const notes = {
  title: ['Skin notes', 'from the studio.'],
  lede: 'Short, honest answers to the questions that come up in the room.',
  list: [
    {
      t: 'Water is not the same as hydration',
      d: 'Drinking water matters, but when skin is dry and dehydrated, water alone may not be enough. Topical hydration replenishes the surface and keeps skin soft and comfortable. Cellular hydration goes further, supporting the skin from within. Good care tends to need both.',
    },
    {
      t: 'Coffee and acne',
      d: 'Not as unrelated as you think. Before you blame your skincare, check what is in your cup. Sometimes the trigger is daily, not topical.',
    },
    {
      t: 'Why we steam',
      d: 'Steam softens build-up, helps the skin relax, and prepares it for everything that follows. It is also simply a lovely moment to settle into the treatment.',
    },
  ],
};

export const reviews = {
  title: ['Kind words,', 'in their own words.'],
  rating: '5.0',
  count: 6,
  list: [
    { n: 'Busayo M.', d: '17 Feb 2026', t: 'I had a lovely facial with ILE IFE, my face felt so soft and was glowing the next day. Definitely recommend!' },
    { n: 'Steven P.', d: '31 Jan 2026', t: 'Princess has been great with helping me book the right treatment according to my needs. She is very knowledgeable. I will be making this a regular occurrence.' },
    { n: 'Hanna K.', d: '15 Aug 2026', t: 'I really enjoyed my experience with Princess from ILÉ ÌFẸ́. She gave me the option to be talked through my facial which was great for a skincare geek like me. It was a lovely and relaxing experience and Princess kept checking everything was going OK as it was my first facial with her. My skin has felt rejuvenated and has been glowing since the facial. I highly recommend booking in with ILÉ ÌFẸ́.' },
    { n: 'Christine A.', d: '25 Apr 2026', t: 'I recently experienced the Glow facial treatment at ILE IFE, and it was absolutely amazing! The ambiance was calming and very relaxing. The staff were incredibly knowledgeable, explaining the benefits of the treatment and making sure I felt comfortable throughout. Highly recommend!' },
    { n: 'Vanessa A.', d: '19 Apr 2026', t: 'My experience at ILE IFE was absolutely brilliant. My second time getting the glow facial and I can honestly say the difference is stark! Princess is very gentle and honest about the treatment. I was talked through each stage and she answered all my questions about skincare. I even got a goody bag with face masks and other items. Thank you ILE IFE, I’ll definitely be back' },
    { n: 'Titi A.', d: '13 Apr 2026', t: 'I recently had the Clarity Facial at ILE IFE on Cherrill Street, and it was an exceptional experience. The ambiance was soothing, and the staff was incredibly knowledgeable and attentive. My skin feels rejuvenated and has a healthy glow. I highly recommend this service for anyone seeking a refreshing skincare boost!' },
  ],
};

export const closing = {
  title: ['A calm place', 'for your skin.'],
  body: 'Unrushed, personal and thoughtfully delivered. Choose a facial and come as you are.',
};

export const visit = {
  title: ['Your first', 'visit.'],
  lede: 'What to expect, so there are no surprises.',
  steps: [
    { t: 'A conversation first', d: 'You talk, Princess listens: your skin, your routine, your stress, what you hope to change.' },
    { t: 'Talked through, step by step', d: 'Every stage is explained as it happens, and you can ask anything. Prefer quiet? Just say so.' },
    { t: 'The facial', d: 'Unrushed, adapted as your skin responds. If your skin says no to something, the plan changes.' },
    { t: 'Aftercare to take home', d: 'Clear guidance for the days after, so the results last, plus a few small extras to take with you.' },
  ],
};

export const request = {
  title: ['Request your', 'appointment.'],
  lede: 'Fill in the sentence. Princess replies personally to confirm a time. Nothing is booked until she does.',
  facials: [
    { v: 'collagen', t: 'a Collagen Cocktail', concern: 'texture and firmness' },
    { v: 'glow', t: 'a Glow Facial', concern: 'dull or dry skin' },
    { v: 'clarity', t: 'a Clarity Facial', concern: 'breakouts and congestion' },
    { v: 'balance', t: 'a Balance Facial', concern: 'sensitive or reactive skin' },
    { v: 'advice', t: 'a facial, but I would like advice first', concern: 'something I would like advice on' },
  ],
  concerns: ['dull or dry skin', 'breakouts and congestion', 'sensitive or reactive skin', 'texture and firmness', 'something I would like advice on'],
  times: ['weekday mornings', 'weekday evenings', 'weekends', 'whenever suits Princess'],
  alt: 'Prefer to book online?',
};

export const mission =
  'ILÉ IFÉ is more than a facial space. It was created as a place to experience the love of God through specialised treatments that help you appreciate the beauty of your skin.';

export const results = {
  title: ['See the', 'difference.'],
  lede: 'Drag the handle to compare. Sample photography for the preview: her own client results go here.',
  pairs: [
    { id: 'glow', label: 'Glow Facial', note: 'Hydration, smoother texture and a healthy glow.' },
    { id: 'clarity', label: 'Clarity Facial', note: 'Calmer, clearer, less congested skin.' },
  ],
};
