// Builds the site for the shared demo deploy, served under /kerala3.
// Output goes to ../site/kerala3. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/kerala3' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/kerala3', { recursive: true, force: true });
mkdirSync('../site/kerala3', { recursive: true });
cpSync('dist', '../site/kerala3', { recursive: true });
console.log('Staged ../site/kerala3');
