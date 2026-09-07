import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, ALL_GENRES, catalogByDecade, catalogByGenre, trendingCatalog } from '../js/data/catalog.js';
import { ADVISORY_BY_ID } from '../js/data/taxonomy.js';

test('the catalogue is large enough to be useful offline', () => {
  assert.ok(CATALOG.length >= 40, `only ${CATALOG.length} titles bundled`);
});

test('every entry has the fields the UI depends on', () => {
  for (const movie of CATALOG) {
    assert.ok(movie.id, `${movie.title} has no id`);
    assert.ok(movie.title, 'missing title');
    assert.ok(movie.year >= 1900 && movie.year <= 2030, `${movie.title} has a bad year: ${movie.year}`);
    assert.ok(movie.runtime > 30 && movie.runtime < 400, `${movie.title} runtime looks wrong: ${movie.runtime}`);
    assert.ok(movie.cert, `${movie.title} has no certification`);
    assert.ok(movie.genres.length > 0, `${movie.title} has no genres`);
    assert.ok(movie.director, `${movie.title} has no director`);
    assert.ok(movie.cast.length >= 3, `${movie.title} has too few cast members`);
    assert.ok(movie.overview.length > 40, `${movie.title} needs a real synopsis`);
    assert.equal(movie.source, 'catalog');
  }
});

test('ids are unique and slug-shaped', () => {
  const ids = new Set();
  for (const movie of CATALOG) {
    assert.equal(ids.has(movie.id), false, `duplicate id ${movie.id}`);
    ids.add(movie.id);
    assert.match(movie.id, /^[a-z0-9-]+\d{4}$/, `bad id shape: ${movie.id}`);
  }
});

test('advisory keys are all real taxonomy categories', () => {
  for (const movie of CATALOG) {
    for (const key of Object.keys(movie.adv ?? {})) {
      assert.ok(ADVISORY_BY_ID[key], `${movie.title} uses unknown advisory "${key}"`);
    }
  }
});

test('severities sit in the 0-4 range', () => {
  for (const movie of CATALOG) {
    for (const [key, value] of Object.entries(movie.adv ?? {})) {
      assert.ok(Number.isInteger(value) && value >= 0 && value <= 4, `${movie.title}.${key} = ${value}`);
    }
  }
});

test('PG-13 and below never claims extreme violence', () => {
  const soft = ['G', 'PG', 'PG-13'];
  for (const movie of CATALOG.filter((m) => soft.includes(m.cert))) {
    const violence = movie.adv?.violence ?? 0;
    assert.ok(violence <= 3, `${movie.title} (${movie.cert}) flagged violence ${violence}`);
  }
});

test('published scores are inside their real scales', () => {
  for (const movie of CATALOG) {
    if (movie.imdb !== undefined) assert.ok(movie.imdb >= 0 && movie.imdb <= 10, `${movie.title} imdb ${movie.imdb}`);
    for (const key of ['rt', 'rta', 'meta']) {
      if (movie[key] === undefined) continue;
      assert.ok(movie[key] >= 0 && movie[key] <= 100, `${movie.title}.${key} ${movie[key]}`);
    }
    if (movie.lb !== undefined) assert.ok(movie.lb >= 0 && movie.lb <= 5, `${movie.title} lb ${movie.lb}`);
    if (movie.budget !== null) assert.ok(movie.budget > 0, `${movie.title} budget`);
  }
});

test('the catalogue spans genres, decades and quality bands', () => {
  assert.ok(ALL_GENRES.length >= 10, `only ${ALL_GENRES.length} genres`);
  assert.ok(catalogByGenre('Horror').length >= 3);
  assert.ok(catalogByGenre('Animation').length >= 3);
  assert.ok(catalogByDecade(2020).length >= 4);
  assert.ok(catalogByDecade(1990).length >= 4);
  const scores = CATALOG.map((m) => m.imdb);
  assert.ok(Math.max(...scores) >= 9, 'no masterpieces bundled');
  assert.ok(Math.min(...scores) <= 4, 'no genuinely bad films bundled — the Skip verdict would be unreachable');
});

test('trending returns the requested limit, most popular first', () => {
  const list = trendingCatalog(5);
  assert.equal(list.length, 5);
  const popularity = list.map((m) => m.popularity);
  assert.deepEqual(popularity, [...popularity].sort((a, b) => b - a));
});
