const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(file, context, names) {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils/', file), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '');
  const module = { exports: {} };
  vm.runInNewContext(source + '\nmodule.exports = {' + names.join(',') + '};', { module, URL, ...context });
  return module.exports;
}
const { validatePortfolio, reviewPayload } = load('portfolio.js', {}, ['validatePortfolio', 'reviewPayload']);
const valid = { title: ' API Siswa ', deskripsi: ' Integrasi API dan pengujian respons. ', skillId: 1, projectUrl: '' };

test('portfolio form requires a claim and accessible evidence, preserves trimmed project data', () => {
  assert.throws(() => validatePortfolio(valid, false), /Lampirkan/);
  assert.throws(() => validatePortfolio({ ...valid, deskripsi: ' ' }, true), /Isi judul/);
  assert.throws(() => validatePortfolio({ ...valid, skillId: null }, true), /keterampilan/);
  assert.equal(validatePortfolio(valid, true).title, 'API Siswa');
  assert.equal(validatePortfolio({ ...valid, projectUrl: 'https://example.com/project' }, false).projectUrl, 'https://example.com/project');
  for (const projectUrl of ['javascript:alert(1)', 'file:///private/file.pdf', 'not-a-url', 'https://user:secret@example.com']) {
    assert.throws(() => validatePortfolio({ ...valid, projectUrl }, true), /tautan/);
  }
});

test('teacher decisions require a note and an explicit integer assessment only for approval', () => {
  for (const proficiency of ['', '0', '101', '80.5', '8e1', '0x50']) assert.throws(() => reviewPayload('approved', 'Bukti diperiksa', proficiency, 3), /1–100/);
  assert.throws(() => reviewPayload('revision', ' ', '', 3), /catatan/);
  const body = reviewPayload('approved', ' Sudah diperiksa ', '85', 3);
  assert.equal(body.proficiency, 85); assert.equal(body.version, 3); assert.equal(body.note, 'Sudah diperiksa');
  assert.equal(Object.hasOwn(reviewPayload('revision', 'Perjelas peranmu', '', 3), 'proficiency'), false);
});

function evidenceFixture({ changesSession = false, failsDownload = false, application = false } = {}) {
  let credential = 'current-private-token', shared = false, deleted = false, cacheDeleted = false;
  class Directory {
    constructor(parent, name) { assert.equal(parent, 'private-app-cache'); assert.equal(name, 'finetern-proofs'); this.exists = true; }
    create(options) { assert.equal(options.idempotent, true); }
    delete() { cacheDeleted = true; }
  }
  class File {
    constructor(directory, name) { assert.ok(directory instanceof Directory); assert.match(name, application ? /^lamaran-12-/ : /^karya-12-/); this.uri = 'file:///private-app-cache/' + name; this.exists = true; }
    delete() { deleted = true; }
    static async downloadFileAsync(url, file, options) {
      assert.equal(url, application ? 'http://example.invalid/api/applications/12/evidence/4' : 'http://example.invalid/api/portfolios/12/evidence?eventId=4');
      assert.equal(options.headers.Authorization, 'Bearer current-private-token');
      if (changesSession) credential = null;
      if (failsDownload) throw new Error('download failed');
    }
  }
  const helpers = load('portfolioEvidence.js', {
    Platform: { OS: 'android' }, Directory, File, Paths: { cache: 'private-app-cache' },
    getToken: async () => credential,
    API_BASE_URL: 'http://example.invalid/api',
    api: { get: async url => assert.equal(url, application ? '/applications/12' : '/portfolios/12') },
    Sharing: { isAvailableAsync: async () => true, shareAsync: async (uri, options) => { shared = true; assert.match(uri, /^file:\/\/\/private-app-cache\//); assert.equal(options.mimeType, 'application/pdf'); } },
  }, ['openPortfolioEvidence', 'openApplicationEvidence', 'clearProofCache']);
  return { ...helpers, shared: () => shared, deleted: () => deleted, cacheDeleted: () => cacheDeleted };
}

test('private evidence uses scoped authorization and retains cache until readers finish', async () => {
  const fixture = evidenceFixture();
  await fixture.openPortfolioEvidence(12, 'pdf', 4);
  assert.equal(fixture.shared(), true); assert.equal(fixture.deleted(), false);
  await fixture.clearProofCache(); assert.equal(fixture.cacheDeleted(), true);
});

test('logout during download prevents opening proof and removes the downloaded file', async () => {
  const fixture = evidenceFixture({ changesSession: true });
  await assert.rejects(fixture.openPortfolioEvidence(12, 'pdf', 4), /Sesi sudah berubah/);
  assert.equal(fixture.shared(), false); assert.equal(fixture.deleted(), true);
});

test('failed download removes partial native files without opening another app', async () => {
  const fixture = evidenceFixture({ failsDownload: true });
  await assert.rejects(fixture.openPortfolioEvidence(12, 'pdf', 4), /Bukti tidak dapat dibuka/);
  assert.equal(fixture.shared(), false); assert.equal(fixture.deleted(), true);
});

test('application evidence uses its application-scoped route and never a general portfolio URL', async () => {
  const fixture = evidenceFixture({ application: true });
  await fixture.openApplicationEvidence(12, 4, 'pdf');
  assert.equal(fixture.shared(), true);
});
