// Builds the site for the shared demo deploy, served under /halcyon.
// Output goes to ../site/halcyon. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/halcyon' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/halcyon', { recursive: true, force: true });
mkdirSync('../site/halcyon', { recursive: true });
cpSync('dist', '../site/halcyon', { recursive: true });
console.log('Staged ../site/halcyon');
