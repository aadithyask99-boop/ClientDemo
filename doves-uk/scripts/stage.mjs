// Builds the site for the shared demo deploy: served under /doves-uk, with / redirecting to it.
// Output goes to ../site, which wrangler.jsonc at the repo root serves as static assets.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/doves-uk' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site', { recursive: true, force: true });
mkdirSync('../site/doves-uk', { recursive: true });
cpSync('dist', '../site/doves-uk', { recursive: true });
writeFileSync('../site/_redirects', '/ /doves-uk/ 302\n');
console.log('Staged ../site/doves-uk');
