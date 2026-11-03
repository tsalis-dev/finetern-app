const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createStore } = require('zustand/vanilla');

// Exercise the actual store, substituting only native storage and HTTP boundaries.
function setup(overrides = {}) {
  let stored = overrides.token || null, unauthorized;
  const user = { id: 8, role: 'siswa', canUseApp: false };
  const api = { get: async () => ({ data: user }), post: async () => ({ data: { user, token: 'new-token' } }), ...overrides.api };
  const context = {
    create: createStore, api,
    AsyncStorage: { multiRemove: async keys => assert.deepEqual(Array.from(keys), ['finetern_token', 'finetern_user']) },
    getToken: async () => stored,
    saveToken: overrides.saveToken || (async token => { stored = token; }),
    clearToken: overrides.clearToken || (async () => { stored = null; }),
    clearProofCache: async () => {},
    setUnauthorizedHandler: handler => { unauthorized = handler; },
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/store/useAuthStore.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export const useAuthStore', 'const useAuthStore');
  vm.runInNewContext(source + '\nthis.store = useAuthStore;', context);
  return { store: context.store, api, stored: () => stored, unauthorized: token => unauthorized(token) };
}

test('restored token requires a server identity and preserves pending access', async () => {
  const { store } = setup({ token: 'saved-token' });
  assert.equal(store.getState().isAuthenticated, false);
  await store.getState().restoreSession();
  assert.equal(store.getState().isAuthenticated, true);
  assert.equal(store.getState().user.canUseApp, false);
  assert.equal(store.getState().isLoading, false);
});

test('network failure retains token and requires retry before showing account routes', async () => {
  const { store, api, stored } = setup({ token: 'saved-token', api: { get: async () => { throw { message: 'Offline' }; } } });
  await store.getState().restoreSession();
  assert.equal(store.getState().isAuthenticated, false);
  assert.equal(store.getState().sessionError, 'Offline');
  assert.equal(stored(), 'saved-token');
  api.get = async () => ({ data: { id: 8, role: 'sekolah', canUseApp: true } });
  await store.getState().restoreSession();
  assert.equal(store.getState().sessionError, null);
  assert.equal(store.getState().role, 'sekolah');
});

test('401 clears only the matching session; a stale request cannot log out another account', async () => {
  const fixture = setup({ token: 'saved-token' });
  await fixture.store.getState().restoreSession();
  fixture.unauthorized('older-token');
  assert.equal(fixture.store.getState().isAuthenticated, true);
  fixture.unauthorized('saved-token');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fixture.store.getState().isAuthenticated, false);
  assert.equal(fixture.stored(), null);
});

test('late profile response cannot restore an account after logout', async () => {
  const { store, api } = setup({ token: 'saved-token' });
  await store.getState().restoreSession();
  let resolveProfile;
  api.get = () => new Promise(resolve => { resolveProfile = resolve; });
  const pending = store.getState().refreshProfile();
  await store.getState().logout();
  resolveProfile({ data: { id: 8, role: 'siswa', canUseApp: true } });
  await pending;
  assert.equal(store.getState().user, null);
  assert.equal(store.getState().isAuthenticated, false);
});

test('failed credential storage does not admit user to authenticated routes', async () => {
  const { store } = setup({ saveToken: async () => { throw new Error('Storage unavailable'); } });
  await assert.rejects(store.getState().authenticate('login', {}), error => /sesi tidak dapat disimpan/.test(error.message));
  assert.equal(store.getState().isAuthenticated, false);
  assert.equal(store.getState().token, null);
});

test('the chosen login role is checked before credentials are stored', async () => {
  const fixture = setup();
  await assert.rejects(fixture.store.getState().authenticate('login', {}, 'sekolah'),
    error => /Ganti peran/.test(error.message));
  assert.equal(fixture.stored(), null);
  assert.equal(fixture.store.getState().isAuthenticated, false);
  await fixture.store.getState().authenticate('login', {}, 'siswa');
  assert.equal(fixture.stored(), 'new-token');
  assert.equal(fixture.store.getState().role, 'siswa');
});

test('failed logout blocks access and retry removes credentials instead of restoring them', async () => {
  let attempts = 0;
  const { store, api } = setup({ token: 'saved-token', clearToken: async () => { if (++attempts === 1) throw new Error('Locked'); } });
  await store.getState().restoreSession();
  await assert.rejects(store.getState().logout());
  assert.equal(store.getState().isAuthenticated, false);
  assert.ok(store.getState().sessionError);
  api.get = () => assert.fail('Logout retry must not fetch the old account');
  await store.getState().restoreSession();
  assert.equal(store.getState().logoutPending, false);
  assert.equal(store.getState().sessionError, null);
});
