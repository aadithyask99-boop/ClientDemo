// Builds the site for the shared demo deploy, served under /ukthech.
// Output goes to ../site/ukthech. ../site is what wrangler.jsonc at the repo root serves.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/ukthech' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/ukthech', { recursive: true, force: true });
mkdirSync('../site/ukthech', { recursive: true });
cpSync('dist', '../site/ukthech', { recursive: true });
console.log('Staged ../site/ukthech');
