import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInput, resolvableOffline } from '../js/services/links.js';

test('plain text is treated as a title query', () => {
  const parsed = parseInput('  Inception  ');
  assert.equal(parsed.kind, 'title');
  assert.equal(parsed.query, 'Inception');
  assert.equal(resolvableOffline(parsed), true);
});

test('quotes are stripped from pasted titles', () => {
  assert.equal(parseInput('"Parasite"').query, 'Parasite');
  assert.equal(parseInput('“Dune”').query, 'Dune');
});

test('Letterboxd slugs yield a readable title', () => {
  const parsed = parseInput('https://letterboxd.com/film/everything-everywhere-all-at-once/');
  assert.equal(parsed.provider, 'letterboxd');
  assert.equal(parsed.query, 'Everything Everywhere All At Once');
  assert.equal(parsed.opaque, false);
});

test('Wikipedia titles drop the disambiguation suffix', () => {
  const parsed = parseInput('https://en.wikipedia.org/wiki/Interstellar_(film)');
  assert.equal(parsed.provider, 'wikipedia');
  assert.equal(parsed.query, 'Interstellar');
});

test('TMDb links expose both the id and the slug', () => {
  const parsed = parseInput('https://www.themoviedb.org/movie/157336-inception');
  assert.equal(parsed.tmdbId, 157336);
  assert.equal(parsed.query, 'Inception');
  assert.equal(parsed.opaque, false);
});

test('IMDb and Netflix links are recognised as opaque ids', () => {
  const imdb = parseInput('https://www.imdb.com/title/tt0111161/');
  assert.equal(imdb.provider, 'imdb');
  assert.equal(imdb.imdbId, 'tt0111161');
  assert.equal(imdb.opaque, true);
  assert.equal(resolvableOffline(imdb), false);

  const netflix = parseInput('https://www.netflix.com/title/81234567');
  assert.equal(netflix.provider, 'netflix');
  assert.equal(netflix.opaque, true);
});

test('streaming services resolve to titles where the slug carries one', () => {
  const apple = parseInput('https://tv.apple.com/us/movie/paddington-2/umc.cmc.abc123');
  assert.equal(apple.provider, 'apple-tv');
  assert.equal(apple.query, 'Paddington 2');

  const justwatch = parseInput('https://www.justwatch.com/us/movie/knives-out');
  assert.equal(justwatch.provider, 'justwatch');
  assert.equal(justwatch.query, 'Knives Out');

  const disney = parseInput('https://www.disneyplus.com/movies/the-lion-king');
  assert.equal(disney.provider, 'disney');
  assert.equal(disney.query, 'The Lion King');
});

test('Prime ASINs stay opaque but words become titles', () => {
  const asin = parseInput('https://www.primevideo.com/dp/B08XV4K5QF');
  assert.equal(asin.primeId, 'B08XV4K5QF');
  assert.equal(asin.opaque, true);

  const words = parseInput('https://www.primevideo.com/detail/Some-Movie-Title');
  assert.equal(words.query, 'Some Movie Title');
});

test('empty input reports empty rather than inventing a query', () => {
  assert.equal(parseInput('   ').kind, 'empty');
  assert.equal(parseInput(undefined).kind, 'empty');
});

test('an unknown link is flagged opaque with a helpful note', () => {
  const parsed = parseInput('https://some-random-site.example/watch/abc');
  assert.equal(parsed.kind, 'url');
  assert.equal(parsed.opaque, true);
  assert.equal(parsed.provider, 'unknown');
});
