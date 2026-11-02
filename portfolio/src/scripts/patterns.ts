/* The pixel icon is a 7x7 grid. Each pattern stands for one thing I do, so the icon quietly cycles through the whole service list. */
export const PATTERNS = {
  /* design */
  spark: ['...#...', '...#...', '..###..', '#######', '..###..', '...#...', '...#...'],
  /* build: a terminal prompt */
  build: ['.......', '#......', '.#.....', '..#....', '.#.....', '#..###.', '.......'],
  /* SEO: a magnifying glass */
  search: ['.####..', '#....#.', '#....#.', '#....#.', '.####..', '....##.', '.....##'],
  /* marketing: bars going up */
  growth: ['.....#.', '.....#.', '...#.#.', '...#.#.', '.#.#.#.', '.#.#.#.', '#######'],
  /* the pricing sheet's icon: a page being designed, the home page, and the thumbs-up of approval */
  window: ['#######', '#.....#', '#######', '#.....#', '#.....#', '#.....#', '#######'],
  house: ['...#...', '..###..', '.#####.', '#######', '.#####.', '.##.##.', '.##.##.'],
  check: ['.......', '......#', '.....#.', '#...#..', '.#.#...', '..#....', '.......'],
} as const;

export type PatternName = keyof typeof PATTERNS;
/* the hero icon cycles through these four; the pricing sheet passes its own list */
export const ORDER: PatternName[] = ['spark', 'build', 'search', 'growth'];
export const SIZE = 7;
