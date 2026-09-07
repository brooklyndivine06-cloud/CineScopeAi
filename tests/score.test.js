import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCinemaScore,
  describeConfidence,
  describeGap,
  ratingEntries,
} from '../js/analysis/score.js';

test('blends sources into a weighted 0-100 CinemaScore', () => {
  const result = computeCinemaScore({ imdb: 8.7, rtCritics: 73, rtAudience: 86, metacritic: 74, tmdb: 8.4, letterboxd: 4.0 });
  assert.ok(result.score > 75 && result.score < 90, `score ${result.score} out of expected band`);
  assert.equal(result.available.length, 6);
  assert.equal(result.missing.length, 0);
  assert.equal(result.confidence, 1);
});

test('normalises each scale onto 0-100', () => {
  const entries = ratingEntries({ imdb: 9.2, tmdb: 8.4, letterboxd: 4.3, rtCritics: 97 });
  const byKey = Object.fromEntries(entries.map((e) => [e.key, e.value]));
  assert.equal(byKey.imdb, 92);
  assert.equal(byKey.tmdb, 84);
  assert.equal(byKey.letterboxd, 86);
  assert.equal(byKey.rtCritics, 97);
});

test('missing sources are dropped, never invented, and lower confidence', () => {
  const result = computeCinemaScore({ imdb: 8.0 });
  assert.equal(result.available.length, 1);
  assert.equal(result.missing.length, 5);
  assert.equal(result.score, 80);
  assert.ok(result.confidence < 0.4, `confidence should be low, got ${result.confidence}`);
  assert.match(describeConfidence(result.confidence), /Limited|Low confidence/);
});

test('no data at all yields no score and the bottom verdict', () => {
  const result = computeCinemaScore({});
  assert.equal(result.score, null);
  assert.equal(result.confidence, 0);
  assert.equal(result.verdict.key, 'awful');
  assert.equal(result.critics, null);
  assert.equal(result.audience, null);
});

test('verdict tiers map scores to the right labels', () => {
  const cases = [
    [95, 'peak'], [85, 'peak'], [84.9, 'must'], [76, 'must'],
    [70, 'solid'], [66, 'solid'], [60, 'mixed'], [55, 'mixed'],
    [45, 'weak'], [40, 'weak'], [39, 'awful'], [0, 'awful'],
  ];
  for (const [score, expected] of cases) {
    const { verdict } = computeCinemaScore({ imdb: score / 10 });
    assert.equal(verdict.key, expected, `score ${score} should be ${expected}, got ${verdict.key}`);
  }
});

test('critic/audience split is measured and described', () => {
  const loved = computeCinemaScore({ rtCritics: 98, imdb: 4.0 });
  assert.ok(loved.gap < -20, `expected a large negative gap, got ${loved.gap}`);
  assert.match(describeGap(loved.gap), /critics rated it/);

  const agreed = computeCinemaScore({ rtCritics: 80, imdb: 8.0 });
  assert.match(describeGap(agreed.gap), /broadly agree/);
});

test('values are clamped and non-numeric input is ignored', () => {
  const result = computeCinemaScore({ imdb: 99, tmdb: null, rtCritics: 'high' });
  assert.equal(result.available.length, 1);
  assert.equal(result.score, 100);
});
