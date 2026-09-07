/**
 * Paste-a-link parsing.
 *
 * Two kinds of link exist and the app treats them differently:
 *   1. Slugged URLs (Letterboxd, TMDb, Wikipedia, Apple TV, JustWatch…) carry the
 *      title in the path — these resolve offline, no network needed.
 *   2. Opaque-id URLs (Netflix, Prime, IMDb, TMDb ids) carry no title. These need
 *      a live API; without one the app says so instead of guessing.
 */
import { slugify, titleCase } from '../utils/text.js';

const slugToTitle = (slug) =>
  titleCase(
    decodeURIComponent(slug)
      .replace(/\.(html?|aspx?)$/i, '')
      .replace(/_/g, ' ')
      .replace(/[-+]+/g, ' ')
      .replace(/\s*\([^)]*\)\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );

/** Longest-first so `/movie/` beats a generic path rule. */
const RULES = [
  {
    id: 'tmdb',
    test: /themoviedb\.org\/(?:[a-z]{2}\/)?movie\/(\d+)(?:-([a-z0-9-]+))?/i,
    build: (match) => ({ tmdbId: Number(match[1]), query: match[2] ? slugToTitle(match[2]) : null }),
  },
  {
    id: 'imdb',
    test: /imdb\.com\/title\/(tt\d+)/i,
    build: (match) => ({ imdbId: match[1] }),
  },
  {
    id: 'imdb-search',
    test: /imdb\.com\/find\/?.*[?&]q=([^&#]+)/i,
    build: (match) => ({ query: decodeURIComponent(match[1]) }),
  },
  {
    id: 'letterboxd',
    test: /letterboxd\.com\/(?:[a-z]+\/)?film\/([a-z0-9-]+)/i,
    build: (match) => ({ query: slugToTitle(match[1]) }),
  },
  {
    id: 'wikipedia',
    test: /wikipedia\.org\/wiki\/([^#?/]+)/i,
    build: (match) => ({ query: slugToTitle(match[1]) }),
  },
  {
    id: 'rottentomatoes',
    test: /rottentomatoes\.com\/m\/([a-z0-9_]+)/i,
    build: (match) => ({ query: slugToTitle(match[1]) }),
  },
  {
    id: 'metacritic',
    test: /metacritic\.com\/movie\/([a-z0-9-]+)/i,
    build: (match) => ({ query: slugToTitle(match[1]) }),
  },
  {
    id: 'justwatch',
    test: /justwatch\.com\/[a-z]{2}\/(?:movie|tv-show)\/([a-z0-9-]+)/i,
    build: (match) => ({ query: slugToTitle(match[1]) }),
  },
  {
    id: 'apple-tv',
    test: /tv\.apple\.com\/[a-z]{2}\/(?:movie|show)\/([a-z0-9-]+)/i,
    build: (match) => ({ query: slugToTitle(match[1]) }),
  },
  {
    id: 'disney',
    test: /disneyplus\.com\/(?:[a-z]{2}-[a-z]{2}\/)?(?:movies|video)\/([a-z0-9-]+)/i,
    build: (match) => ({ query: slugToTitle(match[1]) }),
  },
  {
    id: 'max',
    test: /(?:play\.max\.com|hbo\.com)\/(?:[a-z]{2}\/)?(?:movie|video)\/([a-z0-9-]+)/i,
    build: (match) => ({ query: slugToTitle(match[1]) }),
  },
  {
    id: 'hulu',
    test: /hulu\.com\/(?:watch|series|movie)\/([a-z0-9-]+)/i,
    build: (match) => ({ query: slugToTitle(match[1]) }),
  },
  {
    id: 'netflix',
    test: /netflix\.com\/(?:[a-z]{2}-[a-z]{2}\/)?(?:title|watch)\/(\d+)/i,
    build: (match) => ({ netflixId: match[1] }),
  },
  {
    id: 'prime',
    test: /(?:primevideo|amazon)\.com\/(?:[a-z]{2}\/)?(?:dp|detail|gp\/product)\/([A-Za-z0-9_-]+)/i,
    build: (match) => (/^B0[A-Z0-9]{8}$/.test(match[1]) ? { primeId: match[1].toUpperCase() } : { query: slugToTitle(match[1]) }),
  },
  {
    id: 'trakt',
    test: /trakt\.tv\/movies\/([a-z0-9-]+)/i,
    build: (match) => ({ query: slugToTitle(match[1]) }),
  },
  {
    id: 'youtube',
    test: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
    build: () => ({ query: null, note: 'video' }),
  },
];

export const PROVIDER_LABELS = {
  tmdb: 'TMDb',
  imdb: 'IMDb',
  'imdb-search': 'IMDb',
  letterboxd: 'Letterboxd',
  wikipedia: 'Wikipedia',
  rottentomatoes: 'Rotten Tomatoes',
  metacritic: 'Metacritic',
  justwatch: 'JustWatch',
  'apple-tv': 'Apple TV',
  disney: 'Disney+',
  max: 'Max',
  hulu: 'Hulu',
  netflix: 'Netflix',
  prime: 'Prime Video',
  trakt: 'Trakt',
  youtube: 'YouTube',
};

/**
 * @param {string} input raw text from the search field
 * @returns {{kind:'empty'|'title'|'url', query, provider, label, tmdbId, imdbId, opaque, note}}
 */
export function parseInput(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { kind: 'empty', query: null };

  const isUrl = /^(https?:\/\/|www\.)\S+$/i.test(raw) || /\b(netflix|imdb|letterboxd|disneyplus|primevideo|hulu|tv\.apple|justwatch|wikipedia|themoviedb|rottentomatoes|metacritic|trakt)\.[a-z.]{2,}/i.test(raw);
  const haystack = isUrl ? raw : `https://x.invalid/${raw}`;

  if (isUrl) {
    for (const rule of RULES) {
      const match = haystack.match(rule.test);
      if (!match) continue;
      const built = rule.build(match) ?? {};
      const label = PROVIDER_LABELS[rule.id] ?? 'Link';
      const opaque = !built.query && !built.tmdbId;
      return {
        kind: 'url',
        provider: rule.id,
        label,
        query: built.query ?? null,
        tmdbId: built.tmdbId ?? null,
        imdbId: built.imdbId ?? null,
        netflixId: built.netflixId ?? null,
        primeId: built.primeId ?? null,
        opaque,
        slug: built.query ? slugify(built.query) : null,
        note: built.note ?? null,
        url: raw,
      };
    }
    return {
      kind: 'url',
      provider: 'unknown',
      label: 'Link',
      query: null,
      opaque: true,
      url: raw,
      note: 'That link has no title in it.',
    };
  }

  return { kind: 'title', query: raw.replace(/^["'“”]+|["'“”]+$/g, '').trim() };
}

/** True when the parsed input can be resolved without any API key. */
export const resolvableOffline = (parsed) => Boolean(parsed?.query);
