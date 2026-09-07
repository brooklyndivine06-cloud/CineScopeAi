/**
 * Resolution chain: raw user input -> analysable movie.
 *
 * Order matters. Authored catalogue data wins on an exact match because its
 * content advisories are hand-written; the live API wins everywhere else, and it
 * is only consulted when the user has opted in with a key.
 */
import { analyzeMovie } from '../analysis/index.js';
import { bestCatalogMatch, findById, searchCatalog } from './catalog-service.js';
import { parseInput } from './links.js';
import { normalizeForSearch } from '../utils/text.js';

export class ResolveError extends Error {
  constructor(message, code, extra = {}) {
    super(message);
    this.name = 'ResolveError';
    this.code = code;
    this.extra = extra;
  }
}

const exactTitle = (movie, query) =>
  movie && normalizeForSearch(movie.title) === normalizeForSearch(query);

/**
 * @param {string} input what the user typed or pasted
 * @param {{tmdb: object, settings: object}} deps
 */
export async function resolveInput(input, { tmdb, settings = {} } = {}) {
  const parsed = parseInput(input);
  if (parsed.kind === 'empty') throw new ResolveError('Type a title or paste a link.', 'empty');

  const live = tmdb?.hasKey?.() ?? false;

  if (parsed.tmdbId && live) {
    const movie = await tmdb.byId(parsed.tmdbId);
    return analyzeMovie(movie, { tolerance: settings.tolerance ?? 3 });
  }

  if (parsed.imdbId && live) {
    const movie = await tmdb.byImdbId(parsed.imdbId);
    if (movie) return analyzeMovie(movie, { tolerance: settings.tolerance ?? 3 });
  }

  if (parsed.opaque) {
    throw new ResolveError(
      live
        ? `That ${parsed.label} link has no title in it and could not be looked up.`
        : `That ${parsed.label} link contains an id, not a title. Add a free TMDb key in Settings to resolve it — or just type the title.`,
      'opaque-link',
      { parsed },
    );
  }

  const query = parsed.query;
  const local = bestCatalogMatch(query);
  if (local && (exactTitle(local, query) || !live)) {
    return analyzeMovie(local, { tolerance: settings.tolerance ?? 3 });
  }

  if (live) {
    const [hit] = await tmdb.search(query);
    if (hit) {
      const movie = await tmdb.byId(hit.tmdbId);
      return analyzeMovie(movie, { tolerance: settings.tolerance ?? 3 });
    }
  }

  const near = searchCatalog(query, 4).map((r) => r.movie.title);
  throw new ResolveError(
    live
      ? `Nothing matched "${query}" in the catalogue or on TMDb.`
      : `"${query}" is not in the bundled catalogue. Add a free TMDb key in Settings for the full catalogue.`,
    'not-found',
    { query, suggestions: near, live },
  );
}

/** Resolve by internal id (routing, watchlist, compare, history). */
export async function resolveById(id, { tmdb, settings = {} } = {}) {
  const local = findById(id);
  if (local) return analyzeMovie(local, { tolerance: settings.tolerance ?? 3 });
  if (String(id).startsWith('tmdb-') && tmdb?.hasKey?.()) {
    const movie = await tmdb.byId(String(id).slice(5));
    return analyzeMovie(movie, { tolerance: settings.tolerance ?? 3 });
  }
  throw new ResolveError('That title is no longer available.', 'missing', { id });
}

/** Live search used by the command palette: local first, remote appended. */
export async function searchEverywhere(query, { tmdb } = {}) {
  const local = searchCatalog(query, 8).map(({ movie, score }) => ({ ...movie, matchScore: score, origin: 'catalog' }));
  if (!tmdb?.hasKey?.()) return { local, remote: [] };
  try {
    const remote = await tmdb.search(query, 1);
    return { local, remote: remote.map((movie) => ({ ...movie, origin: 'tmdb' })) };
  } catch {
    return { local, remote: [], remoteError: true };
  }
}
