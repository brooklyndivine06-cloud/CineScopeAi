import test from 'node:test';
import assert from 'node:assert/strict';
import { fuzzyMatch, fuzzySearch, highlightSegments } from '../js/utils/fuzzy.js';
import { searchCatalog } from '../js/services/catalog-service.js';

test('exact prefix beats a looser subsequence', () => {
  const exact = fuzzyMatch('interstellar', 'Interstellar');
  const loose = fuzzyMatch('intrl', 'Interstellar');
  assert.ok(exact.score > loose.score, `expected ${exact.score} > ${loose.score}`);
  assert.equal(exact.matches.length, 12);
});

test('a query that is not a subsequence scores null', () => {
  assert.equal(fuzzyMatch('zzz', 'Interstellar').score, null);
  assert.equal(fuzzyMatch('abc', '').score, null);
});

test('matching ignores case and diacritics', () => {
  assert.ok(fuzzyMatch('amelie', 'Amélie').score > 0);
  assert.ok(fuzzyMatch('AMÉLIE', 'amelie').score > 0);
});

test('empty query matches everything with score 0', () => {
  const result = fuzzyMatch('', 'anything');
  assert.equal(result.score, 0);
  assert.deepEqual(result.matches, []);
});

test('ranking prefers titles over peripheral fields', () => {
  const items = [
    { title: 'The Dark Knight', director: 'Christopher Nolan' },
    { title: 'Memento', director: 'Christopher Nolan' },
  ];
  const ranked = fuzzySearch(items, 'dark knight', { fields: ['title', 'director'] });
  assert.equal(ranked[0].item.title, 'The Dark Knight');
  assert.equal(ranked[0].field, 'title');
});

test('searchCatalog finds films by director, cast and theme', () => {
  assert.equal(searchCatalog('nolan')[0].movie.director.includes('Nolan'), true);
  assert.ok(searchCatalog('tim robbins').length > 0);
  assert.ok(searchCatalog('multiverse').length > 0);
  assert.ok(searchCatalog('zzzzqqq').length === 0);
});

test('searchCatalog honours a year in the query', () => {
  const results = searchCatalog('dune 2024');
  assert.equal(results[0].movie.title, 'Dune: Part Two');
  assert.equal(results[0].movie.year, 2024);
});

test('highlight marks the matched span for safe rendering', () => {
  const segments = highlightSegments('Interstellar', 'inter');
  assert.equal(segments[0].text, 'Inter');
  assert.equal(segments[0].hit, true);
  assert.equal(segments[1].text, 'stellar');
  assert.equal(segments[1].hit, false);
  assert.equal(segments.map((s) => s.text).join(''), 'Interstellar');
});

test('highlight returns one plain segment when there is no match', () => {
  const segments = highlightSegments('Parasite', 'zzz');
  assert.deepEqual(segments, [{ text: 'Parasite', hit: false }]);
});
