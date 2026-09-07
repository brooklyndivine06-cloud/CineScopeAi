/**
 * The analysis pipeline: normalised movie in -> full report out.
 * Pure and synchronous, so it is fully unit-testable.
 */
import { CATALOG } from '../data/catalog.js';
import { slugify, joinList } from '../utils/text.js';
import { round } from '../utils/number.js';
import { computeCinemaScore } from './score.js';
import { estimateAdvisories, summarizeAdvisories } from './advisory.js';
import {
  buildAudienceNotes,
  buildExplanation,
  buildFunStats,
  buildHookline,
  buildMoods,
  buildRoast,
  buildStrengths,
  buildWatchPlan,
} from './insights.js';
import { findSimilar } from './similar.js';

/** Shape every provider must produce before analysis. */
export function normalizeMovie(raw) {
  const title = raw.title ?? 'Untitled';
  const year = raw.year ?? null;
  // Catalogue entries carry hand-written severities under `adv`.
  const advisories = raw.advisories ?? raw.adv ?? {};
  const estimated = raw.advisoryEstimated ?? raw.source !== 'catalog';

  return {
    id: raw.id ?? `${slugify(title)}-${year ?? 'unknown'}`,
    tmdbId: raw.tmdbId ?? null,
    imdbId: raw.imdbId ?? null,
    title,
    originalTitle: raw.originalTitle ?? null,
    year,
    tagline: raw.tagline ?? null,
    runtime: raw.runtime ?? null,
    certification: raw.certification ?? raw.cert ?? null,
    genres: raw.genres ?? [],
    keywords: raw.keywords ?? [],
    overview: raw.overview ?? null,
    director: raw.director ?? null,
    cast: raw.cast ?? [],
    poster: raw.poster ?? null,
    backdrop: raw.backdrop ?? null,
    votes: raw.ratings?.votes ?? raw.votes ?? null,
    ratings: {
      imdb: raw.ratings?.imdb ?? raw.imdb ?? null,
      votes: raw.ratings?.votes ?? raw.votes ?? null,
      rtCritics: raw.ratings?.rtCritics ?? raw.rt ?? null,
      rtAudience: raw.ratings?.rtAudience ?? raw.rta ?? null,
      metacritic: raw.ratings?.metacritic ?? raw.meta ?? null,
      tmdb: raw.ratings?.tmdb ?? null,
      letterboxd: raw.ratings?.letterboxd ?? raw.lb ?? null,
    },
    budget: raw.budget ?? null,
    revenue: raw.revenue ?? null,
    popularity: raw.popularity ?? null,
    streaming: raw.streaming ?? [],
    advisories,
    advisoryEstimated: estimated,
    source: raw.source ?? 'catalog',
    dataNote: raw.dataNote ?? null,
  };
}

/**
 * @param {object} rawMovie  provider output or catalogue entry
 * @param {object} options   { tolerance, similarLimit, pool }
 */
export function analyzeMovie(rawMovie, options = {}) {
  const { tolerance = 3, similarLimit = 6, pool = CATALOG } = options;
  const movie = normalizeMovie(rawMovie);

  const authored = Object.keys(movie.advisories ?? {}).length > 0;
  const advisoryInput = authored
    ? movie.advisories
    : estimateAdvisories({
      certification: movie.certification,
      genres: movie.genres,
      keywords: movie.keywords,
    });
  // Honest provenance: the advisory is only "authored" when we actually had one.
  const advisoryEstimated = !authored;

  const score = computeCinemaScore(movie.ratings);
  const advisory = summarizeAdvisories(advisoryInput, {
    tolerance,
    certification: movie.certification,
    estimated: advisoryEstimated,
  });

  const strengths = buildStrengths(movie, score, advisory);
  const similar = findSimilar(movie, pool.filter((entry) => entry.id !== movie.id), similarLimit);

  return {
    movie,
    score,
    advisory,
    strengths,
    explanation: buildExplanation(movie, score, advisory),
    moods: buildMoods(movie, advisory),
    roast: buildRoast(movie, score),
    audience: buildAudienceNotes(movie, score, advisory),
    funStats: buildFunStats(movie, score),
    watchPlan: buildWatchPlan(movie, score, advisory),
    hookline: buildHookline(movie, score, advisory),
    similar,
    meta: {
      analysedAt: new Date().toISOString(),
      advisorySource: advisoryEstimated ? 'estimated' : 'authored',
      ratingSources: score.available.map((entry) => entry.short),
      genreList: joinList(movie.genres, ' · '),
      scoreLabel: score.score === null ? 'No score' : `${round(score.score, 0)}/100`,
    },
  };
}

/**
 * Lightweight analysis used by cards, rails and the palette.
 * Goes through `normalizeMovie` so both catalogue entries (flat fields) and
 * provider output (nested `ratings`) score identically.
 */
export function quickAnalysis(rawMovie) {
  const movie = normalizeMovie(rawMovie ?? {});
  const score = computeCinemaScore(movie.ratings);
  return {
    score: score.score,
    verdict: score.verdict,
    confidence: score.confidence,
  };
}
