// Copy comes from his Instagram captions and flyer. Nothing here is invented: where he has not
// published something (prices, what each package includes) the page says so.
export const brand = {
  name: 'DJ ESKA',
  alias: 'Mr Good Vibes',
  tagline: 'Soundtrack to your best nights',
  place: 'Hampshire, UK',
  whatsapp: '447453321902',
  phone: '07453 321902',
  email: 'kcdennis@icloud.com',
  linktree: 'https://linktr.ee/DJEska85',
  tiktok: 'https://tiktok.com/@dj.eska7',
  apple: 'https://music.apple.com/profile/kcdennis',
  instagram: 'https://www.instagram.com/djeska_mrgoodvibes/',
};

// Each track plays either from a local file (src) or from a track in his SoundCloud playlist (sc, the position in it).
// The two SoundCloud tracks are what is public on his profile today. The others are placeholder audio (Pixabay,
// see research/SOURCES.md). Swap in his own mixes when he has them.
export const soundcloud = {
  profile: 'https://soundcloud.com/kristian-eskalade-dennis',
  playlist: 'https://api.soundcloud.com/playlists/1836996051',
};

export type Track = { title: string; meta: string; dur: number; art: 'orange' | 'waves' | 'sky' | 'dune'; src?: string; sc?: number };

export const tracks: Track[] = [
  { title: 'Ding Dong', meta: 'Old skool new skool, SoundCloud', dur: 195, art: 'orange', sc: 0 },
  { title: 'The Laffy Taffy', meta: 'Party, SoundCloud', dur: 192, art: 'waves', sc: 1 },
  { title: 'Garden Party', meta: 'Soul and funk, 2025', dur: 128, art: 'sky', src: 'audio/soulful-soul-music.mp3' },
  { title: 'Courtside', meta: 'Afro house, 2025', dur: 177, art: 'dune', src: 'audio/afro-deep-house.mp3' },
];

export const listen = { label: 'Listen on SoundCloud', href: soundcloud.profile };

export const played = [
  { when: '2026', where: 'The Black Barn at Roundwood', what: 'Confirmed wedding supplier', photo: 'mobile' },
  { when: '2026', where: 'My Wedding Vibe UK', what: 'Selected supplier directory', photo: 'mobile' },
  { when: '2026', where: 'Chainnet 3x3, Portsmouth', what: 'Tournament DJ', photo: 'classic' },
  { when: '2025', where: 'All In Summer Classic, Solent University', what: 'Second year running', photo: 'classic' },
  { when: '2025', where: 'Portsmouth Force', what: 'Guest DJ, National League game', photo: 'force' },
  { when: '2025', where: 'Students all-star event', what: 'DJ set', photo: 'laptop' },
  { when: '2024', where: 'South Coast Classic', what: 'Weekend tournament DJ', photo: 'pointing' },
] as const;

export const kit = [
  'Professional DJ',
  'Lighting',
  'PA and microphones',
  '360 photo booth',
  'Personalised playlists',
];

export const portfolio = [
  { title: 'Behind the decks', meta: '2024', photo: 'pointing' },
  { title: 'South Coast Classic', meta: 'Solent University, 2025', photo: 'classic' },
  { title: 'Portsmouth Force', meta: 'National League, 2025', photo: 'force' },
  { title: 'Garden party', meta: 'Mobile setup, 2025', photo: 'mobile' },
] as const;

export const ticker = ['Now taking bookings', '2026 and 2027 dates open', 'Weddings, parties and clubs'];

export const packages = ['Gold', 'Platinum', 'Diamond'];

export const events = ['Wedding', 'Party', 'Club night', 'Corporate event', 'Private function', 'Sporting event'];
