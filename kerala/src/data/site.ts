// All page content lives here. Copy is original and short; every fact is checkable.
// Photographs are real, from Wikimedia Commons (see ../../credits.json and /credits).
const B = import.meta.env.BASE_URL;
const img = (n: string) => `${B}img/${n}.webp`.replace('//', '/');

export const site = {
  name: 'Kerala',
  malayalam: 'കേരളം',
  visit: 'https://www.keralatourism.org/',
  nav: [
    { label: 'Arts', href: '#arts' },
    { label: 'Faces', href: '#faces' },
    { label: 'Pooram', href: '#pooram' },
    { label: 'Houses', href: '#houses' },
  ],
  hero: {
    image: img('hero'),
    alt: 'Extreme close-up of a face painted green, with a red jewel at the ear',
    title: ['Kerala,', 'after', 'dark.'],
    accent: 'dark.',
    sub: 'A night of living heritage, from the first lamp to the first light.',
  },
  statement: {
    words:
      'In Kerala a story is not told, it is lit, painted and drummed into the night. Here, heritage is not kept behind glass. It performs.',
    accent: ['performs.'],
  },
  arts: {
    title: 'Seven ways Kerala speaks without a page.',
    items: [
      { name: 'Kathakali', line: 'The story play, told in gesture, green paint and a crown of light.', image: img('kathakali'), alt: 'Two Kathakali performers on stage in red and gold costume' },
      { name: 'Theyyam', line: 'A village shrine becomes a stage, and the performer becomes the deity.', image: img('theyyam'), alt: 'Theyyam performer with an orange painted face and a tall silver headdress' },
      { name: 'Mohiniyattam', line: 'The dance of the enchantress: slow, flowing and dressed in white and gold.', image: img('mohini'), alt: 'Mohiniyattam dancer in a white and gold costume against a black stage' },
      { name: 'Kalaripayattu', line: 'A martial art older than most kingdoms, practised barefoot in the earth.', image: img('kalari'), alt: 'Kalaripayattu fighter leaping with a stick over a crouching partner' },
      { name: 'Koodiyattam', line: 'Sanskrit theatre, performed in Kerala temples for over a thousand years.', image: img('koodiyattam'), alt: 'Koodiyattam performer lit by the flames of a brass lamp' },
      { name: 'Chenda Melam', line: 'Drummers in a circle, building a storm one beat at a time.', image: img('chenda'), alt: 'A line of chenda drummers in white mundu cloth' },
      { name: 'Vallam Kali', line: 'The snake boat race, a hundred voices rowing as one body.', image: img('vallam'), alt: 'A long snake boat full of rowers racing on a backwater' },
    ],
  },
  faces: {
    steps: [
      { head: 'It begins with a lamp.', accent: 'lamp.', text: 'Hours before the curtain rises, the artist sits by an oil lamp and starts to paint.', image: img('mk1'), alt: 'The reflection of an artist in a small mirror, orange in the glow of an oil lamp' },
      { head: 'The face is drawn, line by line.', accent: 'drawn,', text: 'Black outlines the eyes. Nothing is left to chance, and nothing is hurried.', image: img('mk2'), alt: 'An artist painting his own face with a mirror in his hand' },
      { head: 'Colour is character.', accent: 'character.', text: 'Green marks the noble. Red marks the fierce. The audience reads the story before a word is sung.', image: img('mk3'), alt: 'A man looking down, his face half green and yellow, framed by a white collar of rice paste' },
      { head: 'Then the person disappears.', accent: 'disappears.', text: 'The crown goes on, and the story steps out of the lamp light.', image: img('mk4'), alt: 'A fully dressed performer in a tall crown, wearing green make-up and gold ornaments' },
    ],
  },
  pooram: {
    image: img('pooram'),
    alt: 'Thrissur Pooram at night: elephants and a glowing crowd below a lit temple',
    title: 'When the elephants wear gold.',
    accent: 'gold.',
    lead: 'Thrissur Pooram, once a year: caparisoned elephants, parasols raised against the sky, and drums that rise like weather.',
    lamps: { image: img('pooramlamps'), alt: 'Rows of small oil lamps lit on the ground at a temple festival, with fireworks behind' },
    lampsLine: 'On the ground, a field of small lamps. Above them, the whole night answers.',
    drumLine: 'The drums do not keep time. They make it.',
  },
  houses: {
    title: 'Roofs built for the monsoon.',
    accent: 'monsoon.',
    items: [
      { name: 'The nalukettu', line: 'A four-sided home around an open courtyard, with a steep tiled roof that sheds the rain.', image: img('house2'), alt: 'A nalukettu house with a layered tiled roof among coconut palms' },
      { name: 'Mattancherry Palace', line: 'A throne room in Kochi, its walls covered in painted epics.', image: img('house1'), alt: 'Inside Mattancherry Palace, a swing and painted murals', },
      { name: 'Vaikom Mahadeva Temple', line: 'Timber, laterite and a roofline made for a long wet season.', image: img('house3'), alt: 'The Vaikom Mahadeva Temple with its tiled gabled roof and lamp towers' },
    ],
  },
  kasavu: {
    title: 'A border of gold.',
    accent: 'gold.',
    lines: [
      'Kasavu is Kerala’s own cloth: plain cotton the colour of cream, finished with a woven gold edge. It is worn at Onam, at weddings, and on the stage by Mohiniyattam dancers.',
    ],
  },
  dawn: {
    image: img('dawn'),
    alt: 'A woman rowing a small boat on a backwater at sunrise',
    title: 'Dawn. The lamp is put out. The land keeps performing.',
    accent: 'performing.',
  },
  footer: {
    title: 'Come for a night. Stay for the rest.',
    cta: 'Plan your visit',
  },
};
