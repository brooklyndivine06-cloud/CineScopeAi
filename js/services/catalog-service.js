/**
 * Catalogue service — the offline-first data source.
 * Wraps the bundled dataset with search, rails and random picks.
 */
import { CATALOG, catalogByDecade, catalogByGenre, getCatalogMovie, trendingCatalog } from '../data/catalog.js';
import { fuzzySearch } from '../utils/fuzzy.js';
import { normalizeForSearch } from '../utils/text.js';

const DECADES = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1940];

/** Extract a 4-digit year so "dune 2024" and "2024 dune" both work. */
function splitYear(query) {
  const match = String(query).match(/\b(19|20)\d{2}\b/);
  if (!match) return { text: query, year: null };
  const year = Number(match[0]);
  return { text: query.replace(match[0], ' ').replace(/\s+/g, ' ').trim(), year };
}

export function searchCatalog(query, limit = 8) {
  const { text, year } = splitYear(query);
  const haystack = year
    ? CATALOG.filter((movie) => movie.year === year || String(movie.year).startsWith(String(year).slice(0, 3)))
    : CATALOG;

  const results = fuzzySearch(haystack, text, {
    fields: ['title', 'director', 'cast', 'keywords', 'genres'],
    boost: { title: 1.4, director: 1.0, keywords: 0.8, cast: 0.7, genres: 0.5 },
    limit,
  });

  return results.map(({ item, score, field }) => ({ movie: item, score, field }));
}

/**
 * Best single match, with quality gates.
 *
 * Fuzzy matching is deliberately forgiving in the palette, but silently opening
 * the wrong film is worse than admitting a miss — so a non-exact match has to be
 * both strong and clearly ahead of the runner-up.
 */
export function bestCatalogMatch(query, options = {}) {
  const { minScore = 70, lead = 14 } = options;
  const results = searchCatalog(query, 4);
  if (!results.length) return null;

  const [top, second] = results;
  const wanted = normalizeForSearch(query);
  const title = normalizeForSearch(top.movie.title);
  if (wanted === title || wanted.includes(title) || title.includes(wanted)) return top.movie;
  if (top.score < minScore) return null;
  if (second && second.score > top.score - lead) return null; // ambiguous
  return top.movie;
}


export const findById = (id) => getCatalogMovie(id);

export const rails = () => ([
  { id: 'trending', title: 'Trending in the catalogue', subtitle: 'Most looked-up titles bundled with CineScope', movies: trendingCatalog(12) },
  { id: 'critics', title: 'Critics\u2019 darlings', subtitle: 'Highest combined critic scores', movies: [...CATALOG].sort((a, b) => (b.rt ?? 0) + (b.meta ?? 0) - ((a.rt ?? 0) + (a.meta ?? 0))).slice(0, 10) },
  { id: 'family', title: 'Easy with the whole room', subtitle: 'Mild content, broad appeal', movies: CATALOG.filter((m) => (m.cert === 'G' || m.cert === 'PG') && Object.values(m.adv ?? {}).every((v) => v <= 1)).sort((a, b) => (b.imdb ?? 0) - (a.imdb ?? 0)).slice(0, 10) },
  { id: 'longform', title: 'Commitment required', subtitle: 'Three hours or close to it', movies: CATALOG.filter((m) => m.runtime >= 160).sort((a, b) => b.runtime - a.runtime).slice(0, 10) },
  { id: 'avoid', title: 'Genuinely bad, on purpose', subtitle: 'Low scores, high curiosity value', movies: CATALOG.filter((m) => m.imdb && m.imdb < 5).sort((a, b) => a.imdb - b.imdb).slice(0, 8) },
]);

export const genreRails = () =>
  ['Science Fiction', 'Horror', 'Animation', 'Crime', 'Drama', 'Comedy']
    .map((genre) => ({ id: `genre-${genre.toLowerCase().replace(/\s+/g, '-')}`, title: genre, subtitle: 'By genre', movies: catalogByGenre(genre, 10) }))
    .filter((rail) => rail.movies.length);

export const decadeRails = () =>
  DECADES
    .map((decade) => ({ id: `decade-${decade}`, title: `The ${decade}s`, subtitle: 'By era', movies: catalogByDecade(decade, 10) }))
    .filter((rail) => rail.movies.length >= 3)
    .slice(0, 4);

export function randomMovie(exclude = []) {
  const pool = CATALOG.filter((movie) => !exclude.includes(movie.id));
  const source = pool.length ? pool : CATALOG;
  return source[Math.floor(Math.random() * source.length)];
}

export const catalogSize = () => CATALOG.length;

/** Search suggestions for the command palette: movies + quick actions. */
export function suggest(query, limit = 8) {
  const matches = searchCatalog(query, limit);
  return matches.map(({ movie, field }) => ({
    type: 'movie',
    id: movie.id,
    title: movie.title,
    subtitle: [movie.year, movie.genres?.[0]].filter(Boolean).join(' · '),
    matchedField: field,
    poster: movie.poster,
  }));
}

export function hasQuery(query) {
  return normalizeForSearch(query).length > 0;
}
