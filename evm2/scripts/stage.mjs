// Builds the site for the shared demo deploy, served under /evm2.
// Output goes to ../site/evm2. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/evm2' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/evm2', { recursive: true, force: true });
mkdirSync('../site/evm2', { recursive: true });
cpSync('dist', '../site/evm2', { recursive: true });
console.log('Staged ../site/evm2');
