// Builds the site for the shared demo deploy, served under /garden.
// Output goes to ../site/garden. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/garden' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/garden', { recursive: true, force: true });
mkdirSync('../site/garden', { recursive: true });
cpSync('dist', '../site/garden', { recursive: true });
console.log('Staged ../site/garden');
