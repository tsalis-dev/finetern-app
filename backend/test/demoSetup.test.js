const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const lesson = require('./fixtures/learningLesson');
const { prepareDemo } = require('../scripts/prepareDemo');

test('classroom demo uses isolated data and real workflows without changing primary records', async t => {
  const database = 'finetern_demo_test_' + randomBytes(6).toString('hex');
  const primary = process.env.DB_NAME || 'finetern_db';
  const root = path.resolve(__dirname, '../.local', database);
  await assert.rejects(prepareDemo({ database: primary }));
  await assert.rejects(prepareDemo({ database: 'finetern_db' }));
  await assert.rejects(prepareDemo({ database: 'finetern_demo_bad;DROP' }));
  const db = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306, user: process.env.DB_USER || 'root', password: process.env.DB_PASS || '' });
  let created = false;
  try {
    const snapshot = async () => {
      const [tables] = await db.execute('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME', [primary]);
      const result = [];
      for (const row of tables) {
        assert.match(row.TABLE_NAME, /^[a-z_]+$/); assert.match(primary, /^[a-zA-Z0-9_]+$/);
        const [[count]] = await db.query('SELECT COUNT(*) AS total FROM `' + primary + '`.`' + row.TABLE_NAME + '`');
        result.push({ table: row.TABLE_NAME, total: count.total });
      }
      return result;
    };
    const before = await snapshot();
    process.env.GEMINI_API_KEY = 'test-only-demo-key';
    const gemini = require('../src/config/gemini');
    const mock = t.mock.method(gemini, 'generateLesson', async context => {
      assert.equal(context.current_proficiency, 55);
      assert.equal(context.target_proficiency, 70);
      return { lesson: structuredClone(lesson), model: 'gemini-3.5-flash-lite' };
    });
    const { manifest } = await prepareDemo({ database, withAI: true }); created = true;
    assert.deepEqual(await snapshot(), before);
    assert.equal(mock.mock.callCount(), 1);
    assert.ok(manifest.targetMatch >= 80 && manifest.targetMatch < 100);
    assert.equal(manifest.readyMatch, 100); assert.ok(manifest.moduleId);
    const local = JSON.parse(await fs.readFile(path.join(root, 'credentials.json'), 'utf8'));
    const [users] = await db.query('SELECT email,password FROM `' + database + '`.users');
    assert.equal(users.length, 6);
    assert.ok(users.every(user => user.email.endsWith('@demo.finetern.test') && user.password !== local.password));
    const [proofs] = await db.query('SELECT revision_number,reviewed_by FROM `' + database + '`.portfolios WHERE status_verifikasi="approved"');
    assert.equal(proofs.length, 3); assert.ok(proofs.every(item => item.revision_number > 0 && item.reviewed_by));
    const [[counts]] = await db.query('SELECT COUNT(*) total FROM `' + database + '`.users');
    process.env.DB_NAME = primary;
    await assert.rejects(prepareDemo({ database }), /sudah ada/);
    const [[after]] = await db.query('SELECT COUNT(*) total FROM `' + database + '`.users');
    assert.equal(after.total, counts.total);
  } finally {
    if (created) {
      assert.match(database, /^finetern_demo_test_[a-f0-9]{12}$/);
      await db.query('DROP DATABASE `' + database + '`');
      assert.equal(path.dirname(root), path.resolve(__dirname, '../.local'));
      assert.equal(path.basename(root), database);
      await fs.rm(root, { recursive: true });
    }
    await db.end();
  }
});
