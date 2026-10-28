import { existsSync } from 'node:fs';
import { join } from 'node:path';

/* A photo dropped at public/portrait.jpg (or .jpeg .webp .png .avif) is used for the hover face and the portrait section; without one, the pixel-art stand-in is. */
export const portraitFile = ['jpg', 'jpeg', 'webp', 'png', 'avif'].map((e) => `portrait.${e}`).find((f) => existsSync(join(process.cwd(), 'public', f)));
