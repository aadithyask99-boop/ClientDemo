// Builds the site for the shared demo deploy, served under /kerala.
// Output goes to ../site/kerala. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/kerala' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/kerala', { recursive: true, force: true });
mkdirSync('../site/kerala', { recursive: true });
cpSync('dist', '../site/kerala', { recursive: true });
console.log('Staged ../site/kerala');
