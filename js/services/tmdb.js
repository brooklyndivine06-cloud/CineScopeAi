/**
 * TMDb live provider (optional).
 *
 * The app never requires a key — this service unlocks the full catalogue on top
 * of the bundled one. `fetchImpl` is injectable so the transform is unit-testable
 * against recorded payloads with no network.
 */
import { slugify } from '../utils/text.js';
import { TMDB_PROVIDER_MAP, PROVIDERS } from '../data/taxonomy.js';

const BASE = 'https://api.themoviedb.org/3';
const IMAGE = 'https://image.tmdb.org/t/p';

export class TmdbError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'TmdbError';
    this.code = code;
  }
}

export function createTmdbService({ getKey = () => '', getRegion = () => 'US', fetchImpl } = {}) {
  const doFetch = fetchImpl ?? globalThis.fetch?.bind(globalThis);

  const hasKey = () => Boolean(String(getKey() ?? '').trim());

  const isReadToken = (key) => key.length > 60 && key.split('.').length === 3;

  async function request(path, params = {}) {
    const key = String(getKey() ?? '').trim();
    if (!key) throw new TmdbError('No TMDb key configured.', 'no-key');
    if (!doFetch) throw new TmdbError('This browser cannot make network requests.', 'no-fetch');

    const url = new URL(`${BASE}${path}`);
    if (!isReadToken(key)) url.searchParams.set('api_key', key);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });

    let response;
    try {
      response = await doFetch(url.toString(), {
        headers: isReadToken(key) ? { Authorization: `Bearer ${key}`, Accept: 'application/json' } : { Accept: 'application/json' },
      });
    } catch {
      throw new TmdbError('Network unreachable — TMDb is offline or blocked.', 'network');
    }

    if (response.status === 401 || response.status === 403) {
      throw new TmdbError('TMDb rejected that key. Check it in Settings.', 'auth');
    }
    if (response.status === 404) {
      throw new TmdbError('TMDb has no record of that id.', 'not-found');
    }
    if (!response.ok) {
      throw new TmdbError(`TMDb responded ${response.status}.`, 'http');
    }
    return response.json();
  }

  async function search(query, page = 1) {
    const data = await request('/search/movie', { query, page, include_adult: false });
    return (data.results ?? []).map(transformBrief);
  }

  async function byId(id) {
    const data = await request(`/movie/${id}`, {
      append_to_response: 'credits,release_dates,watch/providers,keywords,external_ids',
    });
    return transformFull(data, getRegion());
  }

  async function byImdbId(imdbId) {
    const data = await request(`/find/${imdbId}`, { external_source: 'imdb_id' });
    const hit = (data.movie_results ?? [])[0];
    return hit ? byId(hit.id) : null;
  }

  async function trending() {
    const data = await request('/trending/movie/week');
    return (data.results ?? []).map(transformBrief);
  }

  async function similar(id, limit = 6) {
    const data = await request(`/movie/${id}/similar`);
    return (data.results ?? []).slice(0, limit).map(transformBrief);
  }

  return { hasKey, search, byId, byImdbId, trending, similar, request };
}

export function transformBrief(item) {
  const year = item.release_date ? Number(String(item.release_date).slice(0, 4)) : null;
  return {
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    title: item.title ?? item.name ?? 'Untitled',
    originalTitle: item.original_title ?? null,
    year,
    overview: item.overview || null,
    poster: item.poster_path ? `${IMAGE}/w500${item.poster_path}` : null,
    backdrop: item.backdrop_path ? `${IMAGE}/w1280${item.backdrop_path}` : null,
    ratings: { tmdb: item.vote_average ?? null, votes: item.vote_count ?? null },
    popularity: item.popularity ?? null,
    genres: [],
    source: 'tmdb',
  };
}

export function transformFull(tmdb, region = 'US') {
  const crew = tmdb.credits?.crew ?? [];
  const cast = (tmdb.credits?.cast ?? []).slice(0, 10);
  const cert = pickCertification(tmdb.release_dates?.results ?? []);
  const providers = pickProviders(tmdb['watch/providers']?.results ?? {}, region);
  const year = tmdb.release_date ? Number(String(tmdb.release_date).slice(0, 4)) : null;

  return {
    id: `tmdb-${tmdb.id}`,
    tmdbId: tmdb.id,
    imdbId: tmdb.external_ids?.imdb_id ?? null,
    title: tmdb.title,
    originalTitle: tmdb.original_title && tmdb.original_title !== tmdb.title ? tmdb.original_title : null,
    year,
    tagline: tmdb.tagline || null,
    runtime: tmdb.runtime ?? null,
    certification: cert,
    genres: (tmdb.genres ?? []).map((g) => g.name),
    keywords: (tmdb.keywords?.keywords ?? []).slice(0, 20).map((k) => k.name.toLowerCase()),
    overview: tmdb.overview || null,
    director: crew.find((c) => c.job === 'Director')?.name ?? null,
    writers: crew.filter((c) => c.job === 'Screenplay' || c.job === 'Writer').slice(0, 3).map((c) => c.name),
    cast: cast.map((c) => ({ name: c.name, character: c.character ?? '', photo: c.profile_path ? `${IMAGE}/w185${c.profile_path}` : null })),
    poster: tmdb.poster_path ? `${IMAGE}/w500${tmdb.poster_path}` : null,
    backdrop: tmdb.backdrop_path ? `${IMAGE}/original${tmdb.backdrop_path}` : null,
    ratings: { tmdb: tmdb.vote_average ?? null, votes: tmdb.vote_count ?? null },
    budget: tmdb.budget || null,
    revenue: tmdb.revenue || null,
    popularity: tmdb.popularity ?? null,
    production: (tmdb.production_companies ?? []).slice(0, 3).map((c) => c.name),
    countries: (tmdb.production_countries ?? []).map((c) => c.iso_3166_1),
    languages: (tmdb.spoken_languages ?? []).map((l) => l.english_name ?? l.name),
    status: tmdb.status,
    streaming: providers,
    source: 'tmdb',
    dataNote: 'Live TMDb data. Content advisories are modelled from certification, genre and keywords.',
  };
}

export function pickCertification(results) {
  const us = results.find((r) => r.iso_3166_1 === 'US');
  if (!us) return null;
  const rated = us.release_dates?.find((d) => d.certification);
  return rated?.certification || null;
}

export function pickProviders(results, region = 'US') {
  const data = results[region] ?? results.US ?? null;
  if (!data) return [];
  const map = (list, type) =>
    (list ?? []).slice(0, 6).map((p) => ({
      key: TMDB_PROVIDER_MAP[p.provider_id] ?? slugify(p.provider_name),
      name: p.provider_name,
      type,
      logo: p.logo_path ? `${IMAGE}/original${p.logo_path}` : null,
      provider: PROVIDERS[TMDB_PROVIDER_MAP[p.provider_id]] ?? null,
    }));

  return [
    ...map(data.flatrate, 'stream'),
    ...map(data.rent, 'rent'),
    ...map(data.buy, 'buy'),
  ];
}
