const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const readline = require('node:readline');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');
const { email, password } = require('../src/utils/validation');

async function readPassword() {
  if (!process.stdin.isTTY) throw new Error('Gunakan terminal interaktif untuk mengatur password, atau --generate untuk kredensial lokal sementara.');
  process.stdout.write('Kata sandi baru (input disembunyikan): ');
  readline.emitKeypressEvents(process.stdin); process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const done = () => { process.stdin.off('keypress', handler); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); };
    const handler = (text, key) => {
      if (key?.name === 'return' || key?.name === 'enter') { done(); resolve(value); }
      else if (key?.ctrl && key.name === 'c') { done(); reject(new Error('Dibatalkan.')); }
      else if (key?.name === 'backspace') value = value.slice(0, -1);
      else if (text && !key?.ctrl && !key?.meta) value += text;
    };
    process.stdin.on('keypress', handler);
  });
}

async function main() {
  const args = process.argv.slice(2); const idx = args.indexOf('--email');
  const address = email(idx >= 0 ? args[idx + 1] : process.env.ADMIN_EMAIL);
  const generated = args.includes('--generate'); const reset = args.includes('--reset-password');
  const secret = password(generated ? randomBytes(24).toString('base64url') : await readPassword());
  const [[existing]] = await pool.execute('SELECT id,role FROM users WHERE email=?', [address]);
  if (existing && (existing.role !== 'admin' || !reset)) throw new Error('Akun sudah ada. Hanya akun admin boleh direset dengan --reset-password.');
  const hash = await bcrypt.hash(secret, 10);
  if (existing) await pool.execute('UPDATE users SET password=?,is_active=1,disabled_at=NULL,disabled_by=NULL,disabled_reason=NULL WHERE id=?', [hash, existing.id]);
  else await pool.execute("INSERT INTO users (email,password,role) VALUES (?,?,'admin')", [address, hash]);
  const localDir = path.join(__dirname, '../.local');
  fs.mkdirSync(localDir, { recursive: true });
  if (generated) {
    const target = path.join(localDir, 'admin-onboarding.txt');
    fs.writeFileSync(target, `Admin Finetern\nEmail: ${address}\nPassword awal: ${secret}\n\nAtur password pribadi: npm run admin:create -- --email ${address} --reset-password\n`, { mode: 0o600 });
    console.log('Kredensial awal tersimpan hanya di file lokal:', target);
  } else {
    const target = path.join(localDir, 'admin-onboarding.txt');
    if (fs.existsSync(target)) fs.unlinkSync(target);
    console.log('Password admin berhasil diatur.');
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
