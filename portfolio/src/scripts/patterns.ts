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
} as const;

export type PatternName = keyof typeof PATTERNS;
export const ORDER: PatternName[] = ['spark', 'build', 'search', 'growth'];
export const SIZE = 7;
