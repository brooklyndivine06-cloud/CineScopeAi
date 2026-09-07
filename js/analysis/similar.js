/**
 * Similarity: shared genres, overlapping eras, matching director and keyword
 * overlap. Deterministic and explainable — each result carries the reasons it
 * was picked, which the UI shows on hover.
 */
import { genreMeta } from '../data/taxonomy.js';

const GENRE_WEIGHT = 10;
const KEYWORD_WEIGHT = 4;
const DIRECTOR_BONUS = 14;
const DECADE_WINDOW = 12; // years

export function similarityScore(a, b) {
  if (!a || !b || a.id === b.id) return { score: 0, reasons: [] };

  const reasons = [];
  let score = 0;

  const aGenres = new Set(a.genres ?? []);
  const sharedGenres = (b.genres ?? []).filter((g) => aGenres.has(g));
  if (sharedGenres.length) {
    score += sharedGenres.length * GENRE_WEIGHT - (sharedGenres.length - 1) * 3;
    reasons.push(`shares ${sharedGenres.map((g) => genreMeta(g).icon).join('')} ${sharedGenres.join(', ')}`);
  }

  const aKeys = new Set(a.keywords ?? []);
  const sharedKeys = (b.keywords ?? []).filter((k) => aKeys.has(k));
  if (sharedKeys.length) {
    score += Math.min(sharedKeys.length, 3) * KEYWORD_WEIGHT;
    reasons.push(`also about ${sharedKeys.slice(0, 2).join(' and ')}`);
  }

  if (a.director && b.director && a.director === b.director) {
    score += DIRECTOR_BONUS;
    reasons.push(`also directed by ${b.director}`);
  }

  const yearGap = Math.abs((a.year ?? 0) - (b.year ?? 0));
  if (yearGap <= DECADE_WINDOW) {
    score += 6 * (1 - yearGap / DECADE_WINDOW);
    reasons.push(`same era (${b.year})`);
  }

  return { score, reasons };
}

/**
 * Rank a pool of candidates against `movie`.
 * Returns `[{ movie, score, reasons }]`, best first.
 */
export function findSimilar(movie, pool = [], limit = 6) {
  return pool
    .map((candidate) => ({ movie: candidate, ...similarityScore(movie, candidate) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (b.movie.imdb ?? 0) - (a.movie.imdb ?? 0))
    .slice(0, limit);
}
