import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, text } from './helpers/dom.js';

const { window } = setupDom({ url: 'http://localhost/' });
const { document } = window;

const tick = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));
// app.js exposes its internals on globalThis (=== window in a browser).
const app = () => globalThis.cinescope;
const q = (selector) => document.querySelector(selector);
const qa = (selector) => Array.from(document.querySelectorAll(selector));

/* Boot the real app once for this file. */
await import('../js/app.js');
await tick(80);

// jsdom keeps the event loop alive; close it so the test process can exit.
after(() => window.close());

test('the landing view renders from the shipped index.html shell', () => {
  assert.equal(q('#view-landing').hidden, false, 'landing should be visible');
  assert.equal(q('#view-report').hidden, true);
  assert.match(text(q('.hero__title')), /Should you/);
  assert.ok(q('#hero-search'), 'search field is present');
});

test('catalogue rails render real tiles with scores', () => {
  const tiles = qa('#view-landing .tile');
  assert.ok(tiles.length > 20, `expected many tiles, got ${tiles.length}`);
  const scored = qa('#view-landing .tile__score');
  assert.ok(scored.length > 10, `expected score badges on tiles, got ${scored.length}`);
  const first = Number(scored[0].textContent);
  assert.ok(first > 0 && first <= 100, `tile score out of range: ${first}`);
});

test('procedural poster art is generated for bundled titles', () => {
  const posters = qa('#view-landing svg.poster');
  assert.ok(posters.length > 5, `expected generated posters, got ${posters.length}`);
  assert.ok(posters[0].querySelector('.poster__title'), 'poster carries the title');
});

test('typing in the search field produces suggestions', async () => {
  const input = q('#hero-search');
  input.value = 'matrix';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick(200);
  const suggestions = qa('#hero-suggestions .suggest');
  assert.ok(suggestions.length > 0, 'no suggestions appeared');
  assert.match(text(suggestions[0]), /Matrix/i);
});

test('⌘K opens the command palette with commands and films', async () => {
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
  await tick(60);
  assert.equal(q('#palette-root').hidden, false, 'palette should be open');
  const groups = qa('.palette__group').map((node) => text(node));
  assert.ok(groups.includes('Commands'), `expected a Commands group, got ${groups.join('|')}`);
  assert.ok(qa('.palette__item').length > 3);

  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await tick(30);
  assert.equal(q('#palette-root').hidden, true, 'escape should close the palette');
});

test('the topbar search trigger opens the palette', async () => {
  q('#search-trigger').click();
  await tick(50);
  assert.equal(q('#palette-root').hidden, false, 'clicking the search trigger should open the palette');
  assert.ok(document.activeElement === q('.palette__input'), 'focus should land in the palette input');
  q('.palette__input').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await tick(30);
  assert.equal(q('#palette-root').hidden, true);
});

test('navigating to a film runs the analysis and gates extreme content', async () => {
  window.location.hash = '#/m/hereditary-2018';
  await tick(1100);

  const gate = q('#gate-root');
  assert.equal(gate.hidden, false, 'Hereditary has extreme gore, so the gate should appear');
  assert.match(text(gate), /extreme content/i);

  gate.querySelector('button').click(); // "Show the analysis"
  await tick(60);

  const report = q('#view-report');
  assert.equal(report.hidden, false, 'report should be visible after the gate');
  assert.match(text(q('.report__title')), /Hereditary/);
  assert.match(text(q('.report__verdict')), /Cinematic Crime|Probably Skip|Mixed Signals|Solid Pick|Must Watch|Peak Cinema/);
});

test('the report shows rating sources, advisories and a verdict ring', () => {
  assert.ok(q('.ring__num'), 'score ring rendered');
  const score = Number(text(q('.ring__num')));
  assert.ok(score > 0 && score <= 100, `ring score out of range: ${score}`);

  const sources = qa('.rating-row__src').map(text);
  assert.ok(sources.includes('IMDb'));
  assert.ok(sources.includes('Rotten Tomatoes — Critics'));

  const advisoryTiles = qa('.adv__item');
  assert.ok(advisoryTiles.length >= 8, `expected the authored advisory grid, got ${advisoryTiles.length}`);
  const flagged = advisoryTiles.filter((tile) => tile.getAttribute('data-rank') !== '0');
  assert.ok(flagged.length >= 8, 'Hereditary should flag most categories');
  const extreme = advisoryTiles.filter((tile) => tile.getAttribute('data-rank') === '4');
  assert.ok(extreme.length >= 2, `expected extreme flags, got ${extreme.length}`);
  // Each tile draws four severity pips, filled up to its rank.
  const gore = advisoryTiles.find((tile) => tile.querySelector('.adv__name').textContent === 'Gore & blood');
  assert.ok(gore, 'gore advisory present');
  const pips = Array.from(gore.querySelectorAll('.adv__pip'));
  assert.equal(pips.length, 4);
  assert.equal(pips.filter((pip) => pip.getAttribute('style')?.includes('background')).length, 4,
    'extreme severity should fill all four pips');

  assert.ok(q('.radar'), 'strength radar rendered');
  assert.ok(qa('.bulleted li').length > 0, 'audience notes rendered');
});

test('saving to the watchlist updates the store and the nav badge', async () => {
  const button = qa('#view-report .report__actions .btn')[0];
  assert.match(text(button), /watchlist/i);
  button.click();
  await tick(30);

  const cinescope = app();
  assert.equal(cinescope.store.watchlist.length, 1);
  assert.equal(cinescope.store.watchlist[0].id, 'hereditary-2018');
  assert.equal(q('#nav-watchlist-count').hidden, false);
  assert.equal(text(q('#nav-watchlist-count')), '1');
  assert.match(text(qa('#view-report .report__actions .btn')[0]), /In watchlist/);
});

test('the film is pushed into history', () => {
  const history = app().store.history;
  assert.ok(history.length >= 1);
  assert.equal(history[0].id, 'hereditary-2018');
});

test('the compare view builds a side-by-side table', async () => {
  const { store } = app();
  store.setCompareSlot(0, 'hereditary-2018');
  store.setCompareSlot(1, 'inception-2010');
  window.location.hash = '#/compare';
  await tick(80);

  assert.equal(q('#view-compare').hidden, false);
  const rows = qa('.compare__table tbody tr');
  assert.ok(rows.length >= 12, `expected a full comparison, got ${rows.length} rows`);
  assert.ok(qa('#view-compare .compare__win').length > 0, 'the table should call out a winner somewhere');
  assert.equal(qa('#view-compare .radar').length, 2, 'both films get a profile radar');
  assert.match(text(q('.compare__table')), /Hereditary/);
});

test('the watchlist view lists saved films with aggregates', async () => {
  window.location.hash = '#/list';
  await tick(80);

  assert.equal(q('#view-list').hidden, false);
  assert.match(text(q('#view-list .list-title')), /Watchlist/);
  assert.equal(qa('#view-list .tile').length, 1);
  const stats = qa('#view-list .wl-stat__value').map(text);
  assert.equal(stats[0], '1', 'saved count');
});

test('an unknown film shows a helpful error state instead of crashing', async () => {
  window.location.hash = '#/q/definitely-not-a-real-film-xyz';
  await tick(1100);

  const state = q('#view-report .state');
  assert.ok(state, 'an error state should render');
  assert.match(text(state), /not in the bundled catalogue/i);
  assert.ok(q('#view-report .btn'), 'the error state offers a way forward');
});

test('settings modal opens and the TMDb key round-trips', async () => {
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 's', bubbles: true }));
  await tick(60);
  const modal = q('#modal-root .modal');
  assert.ok(modal, 'settings modal should open');
  assert.match(text(modal), /TMDb|Full catalogue/);

  const input = modal.querySelector('input[type="password"]');
  input.value = 'test-key-123';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  app().store.setSetting('tmdbKey', 'test-key-123');
  assert.equal(app().store.hasKey(), true);

  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await tick(40);
  assert.equal(q('#modal-root').hidden, true);
  assert.match(text(q('#footer-source')), /live TMDb/);
});

test('theme toggle flips the document theme attribute', async () => {
  const { store, theme } = app();
  assert.ok(theme, 'theme controller is exposed');
  store.setSetting('theme', 'dark');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
  theme.toggle();
  assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
  assert.equal(store.settings.theme, 'light');
  theme.toggle();
});

test('an opaque link explains what is needed instead of guessing', async () => {
  app().store.setSetting('tmdbKey', '');
  window.location.hash = '#/q/https%3A%2F%2Fwww.netflix.com%2Ftitle%2F81234567';
  await tick(1100);
  assert.match(text(q('#view-report .state')), /TMDb key/);
});
