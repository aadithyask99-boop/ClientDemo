// Builds the site for the shared demo deploy, served under /ileife.
// Output goes to ../site/ileife. ../site is what wrangler.jsonc at the repo root serves, so other
// sites can be staged next to this one (../site/<name>) without being touched.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const build = spawnSync('npx', ['astro', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BASE_PATH: '/ileife', PUBLIC_PRELOADER: '1' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

// The type specimen page is a design tool, not part of the deliverable
rmSync('dist/type', { recursive: true, force: true });
rmSync('../site/ileife', { recursive: true, force: true });
mkdirSync('../site/ileife', { recursive: true });
cpSync('dist', '../site/ileife', { recursive: true });
console.log('Staged ../site/ileife');
