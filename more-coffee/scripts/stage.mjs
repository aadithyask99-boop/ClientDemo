// Builds the site for the shared demo deploy, served under /more-coffee.
// Output goes to ../site/more-coffee. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/more-coffee' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/more-coffee', { recursive: true, force: true });
mkdirSync('../site/more-coffee', { recursive: true });
cpSync('dist', '../site/more-coffee', { recursive: true });
console.log('Staged ../site/more-coffee');
