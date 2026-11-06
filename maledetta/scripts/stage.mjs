// Builds the site for the shared demo deploy, served under /maledetta. Output goes to ../site/maledetta.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
const build = spawnSync('npx', ['astro', 'build'], { stdio: 'inherit', shell: true, env: { ...process.env, BASE_PATH: '/maledetta' } });
if (build.status !== 0) process.exit(build.status ?? 1);
rmSync('../site/maledetta', { recursive: true, force: true });
mkdirSync('../site/maledetta', { recursive: true });
cpSync('dist', '../site/maledetta', { recursive: true });
console.log('Staged ../site/maledetta');
