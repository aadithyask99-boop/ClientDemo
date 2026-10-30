// One file per couple. Everything the page says comes from here, so a new client
// is this file plus (optionally) their own artwork in public/art.

export interface Milestone {
  when: string;
  title: string;
  text: string;
}
export interface Moment {
  time: string; // 24h "HH:MM", shown as 5:00 pm
  title: string;
  note?: string;
  icon: 'church' | 'rings' | 'glass' | 'cake' | 'dance' | 'moon' | 'arrive';
}

export interface Invitation {
  a: string; // first partner
  b: string; // second partner
  families: string;
  date: string; // ISO date of the wedding
  ceremonyTime: string; // "HH:MM" local, used for the countdown target
  dateWords: string;
  venue: { name: string; place: string; address: string; mapUrl: string; note: string };
  welcome: string;
  story: Milestone[];
  day: Moment[];
  dress: { code: string; note: string; swatches: string[] };
  dance: { title: string; hint: string; holdHint: string };
  scene: { church: string; tree: string; bench: string };
  gifts: string;
  rsvp: {
    deadline: string; // ISO date
    deadlineWords: string;
    endpoint: string; // Google Apps Script web-app URL; empty = demo mode (stored in the browser only)
    meals: string[];
    extra: { id: string; label: string; options?: string[] }[];
    note: string;
  };
  secret: string; // revealed by long-pressing the wax seal
  hunt: { found: string }; // revealed when all five hidden rings are found
  music: { src: string; title: string }; // src empty = chimes only
}

export const invitation: Invitation = {
  a: 'Imogen',
  b: 'Theo',
  families: 'Together with their families',
  date: '2027-06-19',
  ceremonyTime: '14:30',
  dateWords: 'Saturday 19 June 2027',
  venue: {
    name: 'Hartwell Court',
    place: 'The Cotswolds, Gloucestershire',
    address: 'Hartwell Court, Winchcombe GL54 5XX',
    mapUrl: 'https://maps.google.com/?q=Winchcombe+Gloucestershire',
    note: 'The orangery for the ceremony, then supper in the walled garden. The gravel paths are kind to flat shoes.',
  },
  welcome:
    'We cannot wait to celebrate with the people who made us who we are. Come as you are, bring your dancing shoes, and stay until the lanterns burn low.',
  story: [
    { when: 'Autumn 2018', title: 'A borrowed umbrella', text: 'A rainy platform in Bath, one umbrella between two strangers, and a very slow walk to a station that was only five minutes away.' },
    { when: 'Summer 2021', title: 'Lavender and a wrong turn', text: 'A road trip through Provence with no map and a lot of confidence. We found the best lunch of our lives and each other, in that order.' },
    { when: 'Winter 2025', title: 'The question', text: 'Beside the fountain at Hartwell, in the snow, with the dog wearing a bow tie. She said yes before he finished.' },
    { when: '19 June 2027', title: 'The rest of it', text: 'Which is where you come in.' },
  ],
  day: [
    { time: '14:00', title: 'Guests arrive', note: 'Find a seat in the orangery', icon: 'arrive' },
    { time: '14:30', title: 'The ceremony', icon: 'rings' },
    { time: '15:30', title: 'Drinks in the rose garden', note: 'Lawn games and long lemonades', icon: 'glass' },
    { time: '18:00', title: 'Supper in the walled garden', icon: 'cake' },
    { time: '20:00', title: 'First dance and then everyone', icon: 'dance' },
    { time: '23:30', title: 'Lanterns and farewells', icon: 'moon' },
  ],
  dress: {
    code: 'Garden formal',
    note: 'Soft colours, a good hat if you have one. Whatever you choose, you will be on grass at some point.',
    swatches: ['#8a9a6b', '#e9dcc3', '#c98f87', '#9b86b5', '#c9a35e'],
  },
  dance: { title: 'Save us a dance', hint: 'scroll to waltz, or press and hold to keep them dancing', holdHint: 'dancing… let go to carry on scrolling' },
  scene: {
    church: 'The chapel bell will ring at half past two. Please do not be the reason it rings twice.',
    tree: 'The Hartwell oak is three hundred years old and has seen far worse proposals.',
    bench: 'Reserved for anyone who needs a sit-down, a shoe off and a gossip.',
  },
  gifts:
    'Your being there is the gift. If you would still like to give something, a contribution to our honeymoon in Provence would make us very happy.',
  rsvp: {
    deadline: '2027-04-30',
    deadlineWords: '30 April 2027',
    endpoint: '',
    meals: ['Roast chicken, tarragon', 'Wild mushroom wellington (v)', 'Sea bass, samphire'],
    extra: [
      { id: 'dietary', label: 'Allergies or dietary needs' },
      { id: 'song', label: 'A song that will get you on the dance floor' },
      { id: 'coach', label: 'A seat on the coach from Cheltenham?', options: ['Yes please', 'No, I will drive'] },
    ],
    note: 'Adults only, with love for your little ones.',
  },
  secret: 'The proposal ring is older than the house. It was his grandmother’s, and she said it was waiting for someone who walks slowly.',
  hunt: { found: 'You found all five rings. Tell the bride you did and she will save you a dance.' },
  music: { src: '', title: '' },
};
