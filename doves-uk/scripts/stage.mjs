// Builds the site for the shared demo deploy, served under /doves-uk.
// Output goes to ../site/doves-uk. ../site is what wrangler.jsonc at the repo root serves, so other
// sites can be staged next to this one (../site/<name>) without being touched.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/doves-uk', PUBLIC_PRELOADER: '1' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

rmSync('../site/doves-uk', { recursive: true, force: true });
mkdirSync('../site/doves-uk', { recursive: true });
cpSync('dist', '../site/doves-uk', { recursive: true });
console.log('Staged ../site/doves-uk');
