/* A small pixel-art portrait that stands in until a real photo is added (public/portrait.jpg).
   20 x 25 cells, drawn from a few ellipses so it can be tuned in numbers. Letters map to PALETTE. */
export const FACE_W = 20;
export const FACE_H = 25;
export const PALETTE: Record<string, string> = {
  O: '#ff5a1f', // background tile
  K: '#0a0a0a', // hair, eyes, hoodie
  C: '#f9f4ec', // skin
  S: '#e6d6c2', // shade under the chin
};

export function faceRows(): string[] {
  const g = Array.from({ length: FACE_H }, () => Array<string>(FACE_W).fill('O'));
  const ell = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
  for (let y = 0; y < FACE_H; y++) {
    for (let x = 0; x < FACE_W; x++) {
      if (ell(x, y, 10, 27.5, 10.6, 8.2)) g[y][x] = 'K'; // hoodie and shoulders
      if (x >= 8 && x <= 11 && y >= 15 && y <= 19) g[y][x] = y >= 18 ? 'S' : 'C'; // neck
      if (ell(x, y, 10, 10.2, 5.7, 7.3)) g[y][x] = 'C'; // head
      if (ell(x, y, 10, 9.6, 6.4, 8) && (y < 6 || (y < 10 && (x < 5 || x > 14)))) g[y][x] = 'K'; // hair
    }
  }
  const put = (cells: [number, number][], c: string) => cells.forEach(([x, y]) => (g[y][x] = c));
  put([[7, 10], [7, 11], [12, 10], [12, 11]], 'K'); // eyes
  put([[5, 13], [6, 13], [13, 13], [14, 13]], 'O'); // cheeks
  put([[8, 14], [11, 14], [9, 15], [10, 15]], 'K'); // smile
  return g.map((r) => r.join(''));
}
