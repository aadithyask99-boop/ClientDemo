// Builds the site for the shared demo deploy, served under /alder-vale.
// Output goes to ../site/alder-vale. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/alder-vale' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/alder-vale', { recursive: true, force: true });
mkdirSync('../site/alder-vale', { recursive: true });
cpSync('dist', '../site/alder-vale', { recursive: true });
console.log('Staged ../site/alder-vale');
