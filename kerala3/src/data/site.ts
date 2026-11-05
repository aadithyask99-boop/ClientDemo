// All page content lives here. Anything marked "illustrative" must be confirmed by the client before use.
export const site = {
  title: "God's Own Country | Kerala Tourism (homepage concept)",
  description: "A concept homepage for Kerala Tourism: God's Own Country, for travellers who have never been. Heritage, culture and what to expect in every month.",
  officialUrl: 'https://www.keralatourism.org/',
  nav: [
    { label: 'Destinations', href: '#places' },
    { label: 'When to come', href: '#months' },
    { label: 'Inspiration', href: '#stories' },
    { label: 'Trips', href: '#trips' },
    { label: 'Stays', href: '#stays' },
  ],
  mega: [
    { title: 'Hills and forest', links: ['Munnar', 'Thekkady', 'Wayanad'] },
    { title: 'Water', links: ['Alappuzha', 'Kuttanad', 'Athirappilly'] },
    { title: 'Coast and heritage', links: ['Kochi', 'Varkala', 'Kovalam'] },
  ],
  hero: {
    pre: "God's Own",
    accent: 'Country',
    sub: 'Where the mountains meet the sea. Keralam for those who have never been.',
    seasons: [
      { img: 'hero-monsoon', label: 'June, the monsoon', weather: 'rain' },
      { img: 'hero-onam', label: 'August, Onam', weather: 'dust' },
      { img: 'hero-mist', label: 'December, mist', weather: 'mist' },
    ],
  },
  // Hero 4 replicates the owner's reference (Costa Serenade) and plays like a tourism film: hook (Theyyam in fire), wonder (Munnar dawn),
  // calm (backwaters), intimacy (Kochi's fishermen), release (the coast). Each scene plays public/video/scene-N.mp4 over its poster image.
  // rate: playback speed (the short clips play slowed so none ever loops); hold: seconds a place stays once its cut has finished.
  scenes: [
    { img: 'scene-1-poster', sound: { layers: [{ n: 's1-chenda', l: 0.9 }, { n: 's1-bells', l: 0.55 }], hits: [{ n: 's1-whoosh', at: 0, l: 1 }, { n: 's1-crowd', at: 1.6, l: 0.85 }] }, rate: 0.85, hold: 6.0, title: ["GOD'S OWN", 'COUNTRY'], ml: ['ദൈവത്തിന്റെ', 'സ്വന്തം നാട്'],
      p: 'Where gods dance in fire. In Keralam a Theyyam dancer becomes a deity for one night, and the whole village comes to watch.' },
    { img: 'scene-2-poster', sound: { layers: [{ n: 's2-birds', l: 0.9 }], hits: [{ n: 's2-bell', at: 3.2, l: 0.8 }] }, rate: 1, hold: 6.0, title: ['ABOVE THE', 'CLOUDS'], line: 'THE MORNING STARTS AT FIVE. IT IS WORTH IT.' },
    { img: 'scene-3-poster', sound: { layers: [{ n: 's3-engine', l: 0.8 }], hits: [{ n: 's3-horn', at: 3.6, l: 0.75 }] }, rate: 1, hold: 6.0, title: ['ENTER THE', 'BACKWATERS'], line: 'FOUR HOURS AFLOAT. FIRST LIGHT TO LAST LAMP.' },
    { img: 'scene-4-poster', sound: { layers: [{ n: 's4-putt', l: 0.85 }], hits: [{ n: 's4-laugh', at: 2.6, l: 0.8 }] }, rate: 0.55, hold: 5.4, title: ['RICE BELOW', 'THE SEA'], line: 'FARMS BELOW THE SEA. NOBODY THINKS IT STRANGE.' },
    { img: 'scene-5-poster', sound: { layers: [{ n: 's5-ropes', l: 0.9 }], hits: [{ n: 's5-gulls', at: 1.4, l: 0.8 }] }, rate: 0.75, hold: 4.4, title: ['WHERE THE NETS', 'STILL FALL'], line: 'COME FOR THE PLACES. STAY FOR THE PEOPLE.' },
    { img: 'scene-6-poster', sound: { layers: [{ n: 's6-people', l: 0.4 }], hits: [{ n: 's6-gull', at: 2.0, l: 0.8 }] }, rate: 0.5, hold: 6.0, title: ['AND THEN', 'THE SEA'], line: 'START ANYWHERE. THE COAST WILL FIND YOU.' },
  ],
  statement: {
    text: 'A green strip between the Western Ghats and the Arabian Sea, with 44 rivers, spice forests and a festival in every month. Come for the landscape, stay for the people.',
    cta: 'Why Keralam',
    href: 'https://www.keralatourism.org/',
  },
  places: [
    { id: 'munnar', name: 'MUNNAR', months: 'Best from September to March', line: 'Tea hills above the clouds.', img: 'fan-munnar' },
    { id: 'thekkady', name: 'THEKKADY', months: 'Best from October to February', line: 'Spice forest and the Periyar lake.', img: 'fan-thekkady' },
    { id: 'wayanad', name: 'WAYANAD', months: 'Best from October to May', line: 'Misty ridges, coffee and old forest.', img: 'fan-wayanad' },
    { id: 'athirappilly', name: 'ATHIRAPPILLY', months: 'At its fullest from June to October', line: 'The falls at full strength.', img: 'fan-athirappilly' },
    { id: 'alappuzha', name: 'ALAPPUZHA', months: 'Best from November to February', line: 'Backwaters by houseboat.', img: 'fan-alappuzha' },
    { id: 'kochi', name: 'KOCHI', months: 'Best from November to March', line: 'Chinese nets, spice lanes and old Fort Kochi.', img: 'fan-kochi' },
    { id: 'varkala', name: 'VARKALA', months: 'Best from November to March', line: 'Red cliffs above the sea.', img: 'fan-varkala' },
  ],
  // Twelve months in six photographs. Facts rounded; the client must confirm festival dates.
  seasons: [
    { img: 'month-rain', weather: 'rain', months: ['June', 'July'] },
    { img: 'month-onam', weather: 'dust', months: ['August', 'September'] },
    { img: 'month-lamps', weather: 'dust', months: ['October', 'November'] },
    { img: 'month-mist', weather: 'mist', months: ['December', 'January'] },
    { img: 'month-harvest', weather: 'dust', months: ['February', 'March'] },
    { img: 'month-heat', weather: 'dust', months: ['April', 'May'] },
  ],
  monthLines: {
    January: 'Cool, dry and clear. Hill mornings in Munnar start in mist, and the beaches are at their best.',
    February: 'Warm days and calm seas. The temple festival season begins and elephants are dressed for the processions.',
    March: 'Harvest in the paddy fields, and temple festivals most evenings with drums and lamps.',
    April: 'Hot on the coast, cool in the hills. Vishu, the new year, is welcomed with a display of fruit and flowers.',
    May: 'Mango season, and the last dry days before the rains. Thrissur Pooram, with its parade of elephants, falls in April or May.',
    June: 'The south-west monsoon arrives. Waterfalls run full, the hills turn deep green, and it is the season for Ayurveda.',
    July: 'Deep monsoon. Rivers run high, beaches are empty and everything is green. Slow days and long treatments.',
    August: 'The rains ease. Onam, the harvest festival, begins in late August or September, with flower carpets and feasts.',
    September: 'Onam: pookalam flower carpets, a banana-leaf feast called sadya, and snake-boat races on the backwaters.',
    October: 'A last lighter rain, then clear air. The Theyyam season begins in the north, with fire and costume at village shrines.',
    November: 'The season opens. Cool evenings, clear skies, Theyyam in full swing and houseboats at their best.',
    December: 'Cool, dry and misty in the hills. The beaches fill, and Christmas is celebrated across the state.',
  } as Record<string, string>,
  water: { line: 'Forty-four rivers run west.', sub: 'They are why Keralam is green, and why it moves by boat.', img: 'water-falls' },
  heart: {
    pre: 'The heart of Keralam is its',
    accent: 'people',
    text: 'From heritage homes with carved verandas to houseboats and tea-estate bungalows, our stays are run by families who have lived here for generations. Come as a guest, leave as a friend.',
    cta: 'Discover your stay',
    // Photographs drifting through the forest in three depth layers. l: layer (0 far, 1 mid, 2 near); x in vw within the layer; y in %; w in vw.
    drift: [
      { img: 'h-chai-mist', l: 0, x: 20, y: 62, w: 9 },
      { img: 'drift-spice', l: 0, x: 78, y: 8, w: 9 },
      { img: 'h-picker', l: 0, x: 128, y: 60, w: 10 },
      { img: 'drift-tea', l: 1, x: 12, y: 10, w: 15 },
      { img: 'h-chai-maker', l: 1, x: 62, y: 56, w: 14 },
      { img: 'stay-homestay', l: 1, x: 112, y: 10, w: 19 },
      { img: 'h-bonfire', l: 1, x: 168, y: 56, w: 14 },
      { img: 'h-theyyam', l: 2, x: 30, y: 50, w: 20 },
      { img: 'h-kathakali', l: 2, x: 130, y: 8, w: 18 },
      { img: 'h-costume', l: 2, x: 232, y: 48, w: 19 },
    ],
  },
  stories: {
    pre: 'Swap the guidebook for a',
    accent: 'good story',
    text: 'Keralam is best understood through its living traditions. A Theyyam dancer becomes a god by firelight. A Kathakali actor spends hours painting a face. A weaver makes a border of gold thread by hand. Spend an evening with them and you will understand the place.',
    items: [
      { img: 'story-theyyam', title: 'Theyyam', line: 'Fire, costume and trance, October to May' },
      { img: 'story-kathakali', title: 'Kathakali', line: 'Eight hours of face painting, one night of story' },
      { img: 'story-kasavu', title: 'Kasavu', line: 'The white and gold cloth of Onam' },
    ],
  },
  trips: {
    title: 'Journeys across Keralam',
    // Names, nights and months are illustrative and must be confirmed by the client.
    items: [
      { img: 'trip-hills', name: 'Hills and Spice', nights: '8 nights', months: 'December to February' },
      { img: 'trip-backwaters', name: 'Backwater Days', nights: '5 nights', months: 'November to February' },
      { img: 'trip-heritage', name: 'Old Keralam', nights: '7 nights', months: 'October to March' },
      { img: 'trip-wildlife', name: 'Forest and Elephants', nights: '6 nights', months: 'January to May' },
      { img: 'trip-coast', name: 'Coast and Cliffs', nights: '6 nights', months: 'November to March' },
      { img: 'trip-ayurveda', name: 'Monsoon Ayurveda', nights: '10 nights', months: 'June to September' },
    ],
  },
  stays: {
    title: 'Stays',
    items: [
      { img: 'carousel-1', name: 'Heritage home', place: 'Fort Kochi' },
      { img: 'carousel-2', name: 'Houseboat', place: 'Alappuzha' },
      { img: 'stay-tea', name: 'Tea estate stay', place: 'Munnar' },
    ],
    away: { title: 'Away from the well-trodden path', text: 'Kuttanad, where rice grows below the sea. Kumarakom at dawn. Wayanad, when nobody else is there.', img: 'path-quiet' },
  },
  cta: { title: 'Choose your', accent: 'adventure', text: 'Tell us when you can come and what you care about. The official planner takes it from there.', button: "Let's get planning" },
  footer: {
    news: 'Sign up for news and updates',
    cols: [
      { h: 'Places', l: ['Munnar', 'Thekkady', 'Wayanad', 'Alappuzha', 'Kochi', 'Varkala'] },
      { h: 'Plan', l: ['When to come', 'Festivals', 'Stays', 'Journeys'] },
      { h: 'Contact', l: ['Official site', 'Kerala Tourism, Thiruvananthapuram'] },
    ],
    word: 'KERALAM',
  },
};
