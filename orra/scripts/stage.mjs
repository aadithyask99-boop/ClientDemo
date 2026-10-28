// Builds the site for the shared demo deploy, served under /orra.
// Output goes to ../site/orra. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/orra' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/orra', { recursive: true, force: true });
mkdirSync('../site/orra', { recursive: true });
cpSync('dist', '../site/orra', { recursive: true });
console.log('Staged ../site/orra');
