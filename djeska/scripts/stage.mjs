// Builds the site for the shared demo deploy, served under /djeska.
// Output goes to ../site/djeska. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/djeska' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/djeska', { recursive: true, force: true });
mkdirSync('../site/djeska', { recursive: true });
cpSync('dist', '../site/djeska', { recursive: true });
console.log('Staged ../site/djeska');
