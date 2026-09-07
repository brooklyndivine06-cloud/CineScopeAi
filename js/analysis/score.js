/**
 * CinemaScore: a single 0-100 number with an honest explanation of where it came
 * from. Every rating source contributes with a fixed weight; missing sources are
 * dropped and the remaining weights re-normalised, and the *coverage* of that
 * surviving set becomes the confidence figure shown in the UI.
 *
 * Nothing here invents a rating. If a score is absent, it is absent.
 */
import { clamp, round, weightedAverage, weightedCoverage } from '../utils/number.js';
import { verdictForScore } from '../data/taxonomy.js';

/**
 * Source weights. Critic-weighted sources get less room to dominate; audience
 * sources anchor the number because that is what a viewer is asking about.
 */
export const SCORE_WEIGHTS = {
  imdb: 0.3,
  rtAudience: 0.18,
  rtCritics: 0.18,
  metacritic: 0.14,
  tmdb: 0.12,
  letterboxd: 0.08,
};

export const RATING_SOURCES = [
  { key: 'imdb', label: 'IMDb', short: 'IMDb', scale: 10, suffix: '/10', weight: SCORE_WEIGHTS.imdb },
  { key: 'rtCritics', label: 'Rotten Tomatoes — Critics', short: 'RT Critics', scale: 100, suffix: '%', weight: SCORE_WEIGHTS.rtCritics },
  { key: 'rtAudience', label: 'Rotten Tomatoes — Audience', short: 'RT Audience', scale: 100, suffix: '%', weight: SCORE_WEIGHTS.rtAudience },
  { key: 'metacritic', label: 'Metacritic', short: 'Metacritic', scale: 100, suffix: '', weight: SCORE_WEIGHTS.metacritic },
  { key: 'tmdb', label: 'TMDb', short: 'TMDb', scale: 10, suffix: '/10', weight: SCORE_WEIGHTS.tmdb },
  { key: 'letterboxd', label: 'Letterboxd', short: 'Letterboxd', scale: 5, suffix: '/5', weight: SCORE_WEIGHTS.letterboxd },
];

const isNum = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * Normalise a raw ratings bag into per-source entries on a 0-100 scale.
 */
export function ratingEntries(ratings = {}) {
  return RATING_SOURCES.map((source) => {
    const raw = ratings?.[source.key];
    if (!isNum(raw)) return { ...source, raw: null, value: null, weight: source.weight };
    const value = clamp((raw / source.scale) * 100, 0, 100);
    return { ...source, raw, value: round(value, 1), weight: source.weight };
  });
}

export function criticAverage(entries) {
  const critics = entries.filter((e) => e.key === 'rtCritics' || e.key === 'metacritic');
  return weightedAverage(critics.map((e) => ({ value: e.value, weight: e.weight })));
}

export function audienceAverage(entries) {
  const audience = entries.filter((e) => ['imdb', 'rtAudience', 'tmdb', 'letterboxd'].includes(e.key));
  return weightedAverage(audience.map((e) => ({ value: e.value, weight: e.weight })));
}

/**
 * Main entry point: `{ score, verdict, confidence, entries, critics, audience, gap }`.
 */
export function computeCinemaScore(ratings) {
  const entries = ratingEntries(ratings);
  const score = weightedAverage(entries.map((e) => ({ value: e.value, weight: e.weight })));
  const coverage = weightedCoverage(entries.map((e) => ({ value: e.value, weight: e.weight })));
  const critics = criticAverage(entries);
  const audience = audienceAverage(entries);

  const result = {
    score: score === null ? null : round(score, 1),
    confidence: round(clamp(coverage, 0, 1), 2),
    entries,
    available: entries.filter((e) => e.value !== null),
    missing: entries.filter((e) => e.value === null),
    critics: critics === null ? null : round(critics, 1),
    audience: audience === null ? null : round(audience, 1),
    gap: critics === null || audience === null ? null : round(audience - critics, 1),
  };

  result.verdict = verdictForScore(result.score);
  return result;
}

/** Human phrasing for the critic/audience split. */
export function describeGap(gap) {
  if (gap === null || Math.abs(gap) < 6) return 'critics and audiences broadly agree';
  if (gap > 0) return `audiences rated it ${Math.round(gap)} points higher than critics did`;
  return `critics rated it ${Math.round(Math.abs(gap))} points higher than audiences did`;
}

/** Confidence phrasing used next to the score ring. */
export function describeConfidence(confidence) {
  if (confidence >= 0.85) return 'High confidence — nearly every major rating source reported.';
  if (confidence >= 0.55) return 'Good confidence — most major sources reported.';
  if (confidence >= 0.3) return 'Limited confidence — only some sources reported.';
  return 'Low confidence — very little published rating data.';
}
