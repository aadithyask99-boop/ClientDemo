// The Google login, stored encrypted (AES-256-GCM, key from scrypt of FLOW_SESSION_KEY) in secrets/flow-session.enc.
import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const SESSION_FILE = resolve(repo, 'secrets/flow-session.enc');

export function encrypt(obj, pass) {
  const salt = randomBytes(16), iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', scryptSync(pass, salt, 32), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(obj)), c.final()]);
  return JSON.stringify({ v: 1, salt: salt.toString('base64'), iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), ct: ct.toString('base64'), saved: new Date().toISOString() });
}
export function decrypt(text, pass) {
  const j = JSON.parse(text);
  const d = createDecipheriv('aes-256-gcm', scryptSync(pass, Buffer.from(j.salt, 'base64'), 32), Buffer.from(j.iv, 'base64'));
  d.setAuthTag(Buffer.from(j.tag, 'base64'));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(j.ct, 'base64')), d.final()]).toString());
}
export const hasSession = () => existsSync(SESSION_FILE);
export function loadSession(pass) { return decrypt(readFileSync(SESSION_FILE, 'utf8'), pass); }
export function saveSession(state, pass) { mkdirSync(dirname(SESSION_FILE), { recursive: true }); writeFileSync(SESSION_FILE, encrypt(state, pass)); }
export const fingerprint = (state) => JSON.stringify((state.cookies || []).map((c) => [c.domain, c.name, c.value]).sort());
