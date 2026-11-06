// Builds the site for the shared demo deploy, served under /smashlads. Output goes to ../site/smashlads.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
const build = spawnSync('npx', ['astro', 'build'], { stdio: 'inherit', shell: true, env: { ...process.env, BASE_PATH: '/smashlads' } });
if (build.status !== 0) process.exit(build.status ?? 1);
rmSync('../site/smashlads', { recursive: true, force: true });
mkdirSync('../site/smashlads', { recursive: true });
cpSync('dist', '../site/smashlads', { recursive: true });
console.log('Staged ../site/smashlads');
