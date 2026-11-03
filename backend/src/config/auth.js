const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });

function authConfig() {
  const secret = process.env.JWT_SECRET || '';
  if (Buffer.byteLength(secret) < 32 || /change|your_|replace_with|finetern.*secret/i.test(secret)) {
    throw new Error('JWT_SECRET harus berupa secret acak minimal 32 byte, bukan nilai contoh.');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  if (!/^[1-9]\d*[smhd]$/.test(expiresIn)) throw new Error('JWT_EXPIRES_IN harus seperti 30m, 12h, atau 7d.');
  return { secret, expiresIn, issuer: 'finetern-api', audience: 'finetern-app' };
}

module.exports = { authConfig };
