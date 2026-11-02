// Builds the site for the shared demo deploy, served under /evm.
// Output goes to ../site/evm. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/evm' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/evm', { recursive: true, force: true });
mkdirSync('../site/evm', { recursive: true });
cpSync('dist', '../site/evm', { recursive: true });
console.log('Staged ../site/evm');
