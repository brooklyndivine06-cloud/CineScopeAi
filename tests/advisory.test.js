import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateAdvisories, normalizeAdvisories, summarizeAdvisories } from '../js/analysis/advisory.js';
import { ADVISORY_CATEGORIES } from '../js/data/taxonomy.js';

test('normalises authored severities and sorts worst-first', () => {
  const list = normalizeAdvisories({ violence: 1, gore: 4, language: 2, sexual: 0 });
  assert.equal(list[0].id, 'gore');
  assert.equal(list[0].severity, 'extreme');
  assert.equal(list[1].id, 'language');
  assert.equal(list.at(-1).id, 'sexual');
  assert.equal(list.at(-1).severity, 'none');
});

test('clamps out-of-range severity input', () => {
  const list = normalizeAdvisories({ violence: 99, gore: -3 });
  assert.equal(list.find((e) => e.id === 'violence').rank, 4);
  assert.equal(list.find((e) => e.id === 'gore').rank, 0);
});

test('every normalised entry carries taxonomy metadata', () => {
  const list = normalizeAdvisories({ violence: 3 });
  const entry = list.find((e) => e.id === 'violence');
  const source = ADVISORY_CATEGORIES.find((c) => c.id === 'violence');
  assert.equal(entry.label, source.label);
  assert.equal(entry.icon, source.icon);
  assert.ok(entry.hint.length > 10);
});

test('summary flags breaches above the viewer tolerance', () => {
  const summary = summarizeAdvisories({ violence: 4, language: 2, sexual: 1 }, { tolerance: 2, certification: 'R' });
  assert.equal(summary.maxSeverity, 'extreme');
  assert.equal(summary.maxRank, 4);
  assert.deepEqual(summary.breaches.map((b) => b.id), ['violence']);
  assert.match(summary.verdict, /Above your tolerance/);
  assert.equal(summary.audience.key, 'strong');
  assert.equal(summary.needsGate, true);
});

test('a calm film reads as family-friendly', () => {
  const summary = summarizeAdvisories({ violence: 1, language: 0 }, { tolerance: 3, certification: 'PG' });
  assert.equal(summary.audience.key, 'family');
  assert.equal(summary.breaches.length, 0);
  assert.equal(summary.calmScore, 75);
  assert.equal(summary.needsGate, false);
});

test('nothing flagged at all still produces a usable summary', () => {
  const summary = summarizeAdvisories({}, { tolerance: 3 });
  assert.equal(summary.present.length, 0);
  assert.equal(summary.headline, 'No notable content flags.');
  assert.equal(summary.maxSeverity, 'none');
});

test('estimation from certification alone is conservative', () => {
  const adult = summarizeAdvisories(estimateAdvisories({ certification: 'R', genres: ['Drama'] }));
  const kids = summarizeAdvisories(estimateAdvisories({ certification: 'G', genres: ['Animation'] }));
  assert.ok(adult.maxRank >= 2, 'an R-rated drama should flag something');
  assert.ok(kids.maxRank <= 2, `a G animation should stay mild, got ${kids.maxSeverity}`);
  assert.ok(adult.present.some((e) => e.id === 'language'));
});

test('genre keywords push estimation in the right direction', () => {
  const horror = estimateAdvisories({ certification: 'R', genres: ['Horror'], keywords: ['gore'] });
  assert.ok(horror.gore >= 3);
  assert.ok(horror.jumpscares >= 3);

  const war = estimateAdvisories({ certification: 'R', genres: ['War'], keywords: [] });
  assert.ok(war.war >= 4);
  assert.ok(war.violence >= 3);
});

test('tolerance of extreme means nothing can breach', () => {
  const summary = summarizeAdvisories({ gore: 4, disturbing: 4 }, { tolerance: 4 });
  assert.equal(summary.breaches.length, 0);
  assert.match(summary.verdict, /Inside the limits/);
});
