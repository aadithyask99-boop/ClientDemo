// Builds the site for the shared demo deploy, served under /sidecut. Output goes to ../site/sidecut.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
const build = spawnSync('npx', ['astro', 'build'], { stdio: 'inherit', shell: true, env: { ...process.env, BASE_PATH: '/sidecut' } });
if (build.status !== 0) process.exit(build.status ?? 1);
rmSync('../site/sidecut', { recursive: true, force: true });
mkdirSync('../site/sidecut', { recursive: true });
cpSync('dist', '../site/sidecut', { recursive: true });
console.log('Staged ../site/sidecut');
