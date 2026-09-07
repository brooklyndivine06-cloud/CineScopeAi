import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveById, resolveInput, searchEverywhere, ResolveError } from '../js/services/provider.js';
import { pickCertification, pickProviders, transformFull } from '../js/services/tmdb.js';

/** A TMDb service double — no network, deterministic payloads. */
function fakeTmdb({ hasKey = true, fail = false } = {}) {
  const calls = [];
  const payload = {
    id: 157336,
    title: 'Inception',
    original_title: 'Inception',
    tagline: 'Your mind is the scene of the crime.',
    overview: 'A thief who steals corporate secrets through dream-sharing technology.',
    runtime: 148,
    vote_average: 8.364,
    vote_count: 37000,
    budget: 160000000,
    revenue: 836836967,
    popularity: 92.4,
    status: 'Released',
    genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
    production_companies: [{ name: 'Warner Bros.' }],
    production_countries: [{ iso_3166_1: 'US' }],
    spoken_languages: [{ english_name: 'English' }],
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    external_ids: { imdb_id: 'tt1375666' },
    credits: {
      crew: [{ job: 'Director', name: 'Christopher Nolan' }, { job: 'Screenplay', name: 'Christopher Nolan' }],
      cast: [{ name: 'Leonardo DiCaprio', character: 'Cobb', profile_path: '/leo.jpg' }],
    },
    keywords: { keywords: [{ name: 'Dream' }, { name: 'Heist' }] },
    release_dates: {
      results: [
        { iso_3166_1: 'GB', release_dates: [{ certification: '12A' }] },
        { iso_3166_1: 'US', release_dates: [{ certification: '' }, { certification: 'PG-13' }] },
      ],
    },
    'watch/providers': {
      results: {
        US: {
          flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' }],
          rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/a.png' }],
        },
      },
    },
  };

  return {
    calls,
    hasKey: () => hasKey,
    async byId(id) {
      calls.push(['byId', id]);
      if (fail) throw new Error('boom');
      return transformFull({ ...payload, id });
    },
    async byImdbId(imdbId) {
      calls.push(['byImdbId', imdbId]);
      return transformFull(payload);
    },
    async search(query) {
      calls.push(['search', query]);
      if (fail) throw new Error('boom');
      return [{ id: 157336, tmdbId: 157336, title: `Result for ${query}`, year: 2010, ratings: {} }];
    },
    async trending() {
      return [{ tmdbId: 1, title: 'Trending' }];
    },
  };
}

test('a catalogue title resolves offline with authored advisories', async () => {
  const report = await resolveInput('Interstellar', { tmdb: fakeTmdb({ hasKey: false }) });
  assert.equal(report.movie.title, 'Interstellar');
  assert.equal(report.meta.advisorySource, 'authored');
  assert.ok(report.score.score > 75);
  assert.equal(report.advisory.list.length > 0, true);
});

test('pasting a Letterboxd link resolves the same film', async () => {
  const report = await resolveInput('https://letterboxd.com/film/parasite/', { tmdb: fakeTmdb({ hasKey: false }) });
  assert.equal(report.movie.title, 'Parasite');
});

test('an opaque link without a key fails with guidance, not a crash', async () => {
  await assert.rejects(
    () => resolveInput('https://www.netflix.com/title/81234567', { tmdb: fakeTmdb({ hasKey: false }) }),
    (error) => {
      assert.ok(error instanceof ResolveError);
      assert.equal(error.code, 'opaque-link');
      assert.match(error.message, /TMDb key/);
      return true;
    },
  );
});

test('a typo still lands on the right film', async () => {
  const report = await resolveInput('Interstelar', { tmdb: fakeTmdb({ hasKey: false }) });
  assert.equal(report.movie.title, 'Interstellar');
});

test('an ambiguous query offers near matches instead of guessing', async () => {
  await assert.rejects(
    () => resolveInput('the a', { tmdb: fakeTmdb({ hasKey: false }) }),
    (error) => {
      assert.equal(error.code, 'not-found');
      assert.ok(error.extra.suggestions.length >= 2, `expected suggestions, got ${error.extra.suggestions}`);
      return true;
    },
  );
});

test('a title with no plausible match reports not-found cleanly', async () => {
  await assert.rejects(
    () => resolveInput('qqqq zzzz nothing like this', { tmdb: fakeTmdb({ hasKey: false }) }),
    (error) => error.code === 'not-found',
  );
});

test('an empty query is rejected before any lookup happens', async () => {
  const tmdb = fakeTmdb();
  await assert.rejects(() => resolveInput('   ', { tmdb }), (error) => error.code === 'empty');
  assert.equal(tmdb.calls.length, 0);
});

test('with a key, a TMDb id link goes live', async () => {
  const tmdb = fakeTmdb();
  const report = await resolveInput('https://www.themoviedb.org/movie/157336-inception', { tmdb });
  assert.deepEqual(tmdb.calls[0], ['byId', 157336]);
  assert.equal(report.movie.source, 'tmdb');
  assert.equal(report.movie.runtime, 148);
  assert.equal(report.meta.advisorySource, 'estimated');
});

test('with a key, a title outside the catalogue falls through to TMDb', async () => {
  const tmdb = fakeTmdb();
  const report = await resolveInput('Some Obscure Film', { tmdb });
  assert.deepEqual(tmdb.calls[0], ['search', 'Some Obscure Film']);
  assert.deepEqual(tmdb.calls[1], ['byId', 157336]);
  assert.equal(report.movie.title, 'Inception');
});

test('an exact catalogue match still wins when a key is present', async () => {
  const tmdb = fakeTmdb();
  const report = await resolveInput('Oppenheimer', { tmdb });
  assert.equal(report.movie.source, 'catalog');
  assert.equal(tmdb.calls.length, 0, 'should not have hit the network');
});

test('resolveById reads the catalogue and rejects unknown ids', async () => {
  const report = await resolveById('the-matrix-1999', { tmdb: fakeTmdb({ hasKey: false }) });
  assert.equal(report.movie.title, 'The Matrix');

  await assert.rejects(() => resolveById('nope-1999', { tmdb: fakeTmdb({ hasKey: false }) }), (e) => e.code === 'missing');
});

test('searchEverywhere returns local hits and tolerates a dead network', async () => {
  const offline = await searchEverywhere('dune', { tmdb: fakeTmdb({ hasKey: false }) });
  assert.ok(offline.local.length > 0);
  assert.deepEqual(offline.remote, []);

  const broken = await searchEverywhere('dune', { tmdb: fakeTmdb({ fail: true }) });
  assert.ok(broken.local.length > 0);
  assert.equal(broken.remoteError, true);
});

test('the viewer tolerance reaches the advisory summary', async () => {
  const strict = await resolveInput('Hereditary', { tmdb: fakeTmdb({ hasKey: false }), settings: { tolerance: 1 } });
  assert.ok(strict.advisory.breaches.length > 0);

  const relaxed = await resolveInput('Hereditary', { tmdb: fakeTmdb({ hasKey: false }), settings: { tolerance: 4 } });
  assert.equal(relaxed.advisory.breaches.length, 0);
});

/* ---------- TMDb payload transforms ---------- */

test('transformFull maps the TMDB payload onto the app shape', () => {
  const movie = transformFull({
    id: 157336,
    title: 'Inception',
    original_title: 'Inception',
    runtime: 148,
    vote_average: 8.36,
    vote_count: 37000,
    budget: 160000000,
    revenue: 836836967,
    genres: [{ name: 'Science Fiction' }],
    poster_path: '/p.jpg',
    backdrop_path: '/b.jpg',
    release_date: '2010-07-16',
    credits: { crew: [{ job: 'Director', name: 'Christopher Nolan' }], cast: [{ name: 'Leonardo DiCaprio', character: 'Cobb' }] },
    keywords: { keywords: [{ name: 'Dream' }] },
    release_dates: { results: [{ iso_3166_1: 'US', release_dates: [{ certification: 'PG-13' }] }] },
    'watch/providers': { results: { US: { flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' }] } } },
  });

  assert.equal(movie.id, 'tmdb-157336');
  assert.equal(movie.year, 2010);
  assert.equal(movie.director, 'Christopher Nolan');
  assert.equal(movie.certification, 'PG-13');
  assert.equal(movie.ratings.tmdb, 8.36);
  assert.deepEqual(movie.genres, ['Science Fiction']);
  assert.deepEqual(movie.keywords, ['dream']);
  assert.equal(movie.streaming.length, 1);
  assert.equal(movie.streaming[0].key, 'netflix');
  assert.match(movie.poster, /image\.tmdb\.org/);
});

test('pickCertification prefers the US entry and skips blanks', () => {
  const results = [
    { iso_3166_1: 'GB', release_dates: [{ certification: '12A' }] },
    { iso_3166_1: 'US', release_dates: [{ certification: '' }, { certification: 'R' }] },
  ];
  assert.equal(pickCertification(results), 'R');
  assert.equal(pickCertification([]), null);
});

test('pickProviders orders stream, rent then buy', () => {
  const providers = pickProviders({
    US: {
      buy: [{ provider_id: 3, provider_name: 'Google Play' }],
      rent: [{ provider_id: 2, provider_name: 'Apple TV' }],
      flatrate: [{ provider_id: 8, provider_name: 'Netflix' }],
    },
  });
  assert.deepEqual(providers.map((p) => p.type), ['stream', 'rent', 'buy']);
  assert.deepEqual(pickProviders({}), []);
});

test('catalogue films use their hand-written advisories, not estimates', async () => {
  const report = await resolveInput('The Matrix', { tmdb: fakeTmdb({ hasKey: false }) });
  assert.equal(report.meta.advisorySource, 'authored');
  const byId = Object.fromEntries(report.advisory.list.map((e) => [e.id, e.rank]));
  assert.equal(byId.gore, 2, 'authored gore severity should be used verbatim');
  assert.equal(byId.strobe, 2);
});

test('live API films are clearly marked as estimated advisories', async () => {
  const tmdb = fakeTmdb();
  const report = await resolveInput('Some Obscure Film', { tmdb });
  assert.equal(report.meta.advisorySource, 'estimated');
  assert.equal(report.advisory.estimated, true);
  assert.ok(report.advisory.present.length > 0, 'estimation should still flag something for a PG-13 action film');
});
