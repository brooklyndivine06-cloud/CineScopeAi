import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, DEFAULT_SETTINGS } from '../js/core/store.js';
import { createEmitter } from '../js/core/emitter.js';
import { createRouter } from '../js/core/router.js';
import * as storage from '../js/utils/storage.js';

const report = (id, title, score = 80) => ({
  movie: { id, title, year: 2000 },
  score: { score, verdict: { label: 'Must Watch' } },
});

test('watchlist toggles add and remove, and broadcast changes', () => {
  const store = createStore();
  const events = [];
  store.bus.on('watchlist', (payload) => events.push(payload));

  const first = store.toggleWatchlist(report('a', 'Alpha'));
  assert.equal(first.added, true);
  assert.equal(store.watchlist.length, 1);
  assert.equal(store.inWatchlist('a'), true);

  const second = store.toggleWatchlist(report('a', 'Alpha'));
  assert.equal(second.added, false);
  assert.equal(store.watchlist.length, 0);
  assert.equal(events.length, 2);
});

test('history de-duplicates and caps itself', () => {
  const store = createStore();
  for (let i = 0; i < 30; i += 1) store.pushHistory(report(`film-${i}`, `Film ${i}`));
  store.pushHistory(report('film-0', 'Film 0'));
  assert.equal(store.history.length, 24);
  assert.equal(store.history[0].id, 'film-0', 'most recent first');
  assert.equal(store.history.filter((entry) => entry.id === 'film-0').length, 1);
});

test('compare holds at most two slots', () => {
  const store = createStore();
  store.setCompareSlot(0, 'a');
  store.setCompareSlot(1, 'b');
  store.setCompareSlot(1, 'c');
  assert.deepEqual(store.compare, ['a', 'c']);
});

test('settings reject unknown keys and survive a patch', () => {
  const store = createStore();
  store.setSetting('accent', 'teal');
  store.setSetting('notASetting', true);
  assert.equal(store.settings.accent, 'teal');
  assert.equal('notASetting' in store.settings, false);
  store.patchSettings({ theme: 'light', bogus: 1 });
  assert.equal(store.settings.theme, 'light');
  store.resetSettings();
  assert.deepEqual(store.settings, DEFAULT_SETTINGS);
});

test('wipeAll clears every slice', () => {
  const store = createStore();
  store.toggleWatchlist(report('a', 'Alpha'));
  store.pushHistory(report('a', 'Alpha'));
  store.setSetting('accent', 'rose');
  store.wipeAll();
  assert.equal(store.watchlist.length, 0);
  assert.equal(store.history.length, 0);
  assert.deepEqual(store.settings, DEFAULT_SETTINGS);
});

test('storage falls back to memory when the browser blocks it', () => {
  storage.write('probe', { ok: true });
  assert.deepEqual(storage.read('probe'), { ok: true });
  assert.equal(storage.isPersistent(), false, 'plain Node has no localStorage');
  storage.remove('probe');
  assert.equal(storage.read('probe', 'gone'), 'gone');
});

test('the emitter isolates listener failures', () => {
  const bus = createEmitter();
  const seen = [];
  bus.on('x', () => { throw new Error('listener blew up'); });
  bus.on('x', (payload) => seen.push(payload));
  assert.doesNotThrow(() => bus.emit('x', 42));
  assert.deepEqual(seen, [42]);
});

test('the router matches params and query strings', async () => {
  const hits = [];
  const fakeLocation = { hash: '#/m/the-matrix-1999?from=rail', replace(path) { fakeLocation.hash = path; } };
  globalThis.location = fakeLocation;
  globalThis.addEventListener = () => {};
  globalThis.removeEventListener = () => {};

  const router = createRouter({
    routes: [
      { path: '/', onEnter: () => hits.push('landing') },
      { path: '/m/:id', onEnter: ({ params, query }) => hits.push(`movie:${params.id}:${query.get('from')}`) },
    ],
  });
  router.dispatch();
  assert.deepEqual(hits, ['movie:the-matrix-1999:rail']);

  fakeLocation.hash = '#/';
  router.dispatch();
  assert.deepEqual(hits, ['movie:the-matrix-1999:rail', 'landing']);
});
