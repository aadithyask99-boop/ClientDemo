// Encrypt / decrypt .env with a passphrase so a copy can live safely in git.
//   SECRETS_PASSPHRASE=... node scripts/secrets.mjs encrypt   (.env -> .env.enc)
//   SECRETS_PASSPHRASE=... node scripts/secrets.mjs decrypt   (.env.enc -> .env)
// AES-256-GCM, key derived with scrypt. .env.enc is safe to commit if the passphrase is strong.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const [mode] = process.argv.slice(2);
const pass = process.env.SECRETS_PASSPHRASE;
if (!["encrypt", "decrypt"].includes(mode) || !pass) {
  console.error("usage: SECRETS_PASSPHRASE=... node scripts/secrets.mjs encrypt|decrypt");
  process.exit(1);
}
const derive = (salt) => scryptSync(pass, salt, 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });

if (mode === "encrypt") {
  const salt = randomBytes(16), iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", derive(salt), iv);
  const body = Buffer.concat([c.update(readFileSync(".env")), c.final()]);
  writeFileSync(".env.enc", Buffer.concat([salt, iv, c.getAuthTag(), body]).toString("base64") + "\n");
  console.log("wrote .env.enc");
} else {
  const raw = Buffer.from(readFileSync(".env.enc", "utf8").trim(), "base64");
  const salt = raw.subarray(0, 16), iv = raw.subarray(16, 28), tag = raw.subarray(28, 44), body = raw.subarray(44);
  const d = createDecipheriv("aes-256-gcm", derive(salt), iv);
  d.setAuthTag(tag);
  if (existsSync(".env")) { console.error(".env exists, refusing to overwrite"); process.exit(1); }
  try { writeFileSync(".env", Buffer.concat([d.update(body), d.final()]), { mode: 0o600 }); console.log("wrote .env"); }
  catch { console.error("wrong passphrase or corrupted file"); process.exit(1); }
}
