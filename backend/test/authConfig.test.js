const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomBytes } = require('node:crypto');
const { authConfig } = require('../src/config/auth');

test('authentication requires a usable secret and positive, bounded-format expiry', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiry = process.env.JWT_EXPIRES_IN;
  try {
    for (const secret of ['', 'short', 'replace_with_a_random_secret_of_at_least_32_bytes', 'your_jwt_secret_that_is_long_enough']) {
      process.env.JWT_SECRET = secret;
      assert.throws(authConfig, /JWT_SECRET/);
    }
    process.env.JWT_SECRET = randomBytes(48).toString('hex');
    for (const duration of ['0d', '-1d', 'tomorrow', '3600', '2 years']) {
      process.env.JWT_EXPIRES_IN = duration;
      assert.throws(authConfig, /JWT_EXPIRES_IN/);
    }
    process.env.JWT_EXPIRES_IN = '30m';
    assert.equal(authConfig().expiresIn, '30m');
    assert.equal(authConfig().issuer, 'finetern-api');
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalSecret;
    if (originalExpiry === undefined) delete process.env.JWT_EXPIRES_IN; else process.env.JWT_EXPIRES_IN = originalExpiry;
  }
});
