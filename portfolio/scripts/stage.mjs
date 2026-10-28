// Builds the site for the shared demo deploy, served under /portfolio.
// Output goes to ../site/portfolio. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/portfolio' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/portfolio', { recursive: true, force: true });
mkdirSync('../site/portfolio', { recursive: true });
cpSync('dist', '../site/portfolio', { recursive: true });
console.log('Staged ../site/portfolio');
