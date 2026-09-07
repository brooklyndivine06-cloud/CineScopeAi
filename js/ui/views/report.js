/** Report view: verdict, ratings, advisory, cast, providers, similar titles. */
import { h, mount, nextFrame } from '../dom.js';
import {
  advisorySummaryLine,
  advisoryTile,
  badge,
  chip,
  genreChips,
  movieTile,
  panel,
  provenanceBadge,
  providerChip,
  sectionHead,
} from '../components.js';
import { posterNode, renderShareCard } from '../poster.js';
import { barRow, miniMeter, radarChart, ringText, scoreRing } from '../charts.js';
import { scoreColor } from '../../utils/color.js';
import { formatMoney, formatRuntime, round } from '../../utils/number.js';
import { joinList, truncate } from '../../utils/text.js';
import { PROVIDERS } from '../../data/taxonomy.js';

export function renderReport(host, ctx, report) {
  const { store, go, openMovie, toast } = ctx;
  const { movie, score, advisory, strengths, explanation, moods, roast, audience, funStats, watchPlan, hookline, similar } = report;

  /* ---------------- hero ---------------- */
  const verdictTone = score.verdict.tone;
  const ring = scoreRing(score.score, {
    size: 132,
    color: scoreColor(score.score ?? 0),
    caption: 'CinemaScore',
  });

  const watchlistBtn = h('button', { class: 'btn', type: 'button' }, '');
  const syncWatchlist = () => {
    const saved = store.inWatchlist(movie.id);
    watchlistBtn.className = ['btn', saved && 'btn--active'].filter(Boolean).join(' ');
    watchlistBtn.textContent = saved ? '★ In watchlist' : '☆ Save to watchlist';
  };
  syncWatchlist();
  watchlistBtn.addEventListener('click', () => {
    const { added } = store.toggleWatchlist(report);
    syncWatchlist();
    ctx.refreshChrome?.();
    toast(added ? `Added ${movie.title} to your watchlist` : `Removed ${movie.title}`, { tone: added ? 'success' : 'info' });
  });

  const inCompare = store.compare.includes(movie.id);
  const compareBtn = h('button', {
    class: ['btn', inCompare && 'btn--active'].filter(Boolean).join(' '),
    type: 'button',
    onclick: () => {
      if (store.compare.includes(movie.id)) {
        toast('Already in the comparison.');
        return;
      }
      const slot = store.compare.length < 2 ? store.compare.length : 1;
      store.setCompareSlot(slot, movie.id);
      compareBtn.classList.add('btn--active');
      toast(`${movie.title} added to comparison`, {
        action: { label: 'Open', onClick: () => go('/compare') },
      });
    },
  }, '⇄ Compare');

  const shareBtn = h('button', {
    class: 'btn',
    type: 'button',
    onclick: async () => {
      const url = `${location.origin}${location.pathname}#/m/${encodeURIComponent(movie.id)}`;
      const payload = {
        title: `${movie.title} — CineScope AI`,
        text: `${movie.title} (${movie.year ?? 'n.d.'}) — ${score.verdict.label}, CinemaScore ${score.score ?? 'n/a'}/100.`,
        url,
      };
      try {
        if (navigator.share) await navigator.share(payload);
        else {
          await navigator.clipboard.writeText(url);
          toast('Link copied to clipboard', { tone: 'success' });
        }
      } catch (error) {
        if (error?.name !== 'AbortError') toast('Could not share from this browser.', { tone: 'warn' });
      }
    },
  }, '↗ Share');

  const cardBtn = h('button', {
    class: 'btn btn--ghost',
    type: 'button',
    onclick: async () => {
      toast('Rendering your card…', { duration: 1200 });
      const blob = await renderShareCard(movie, score.score, score.verdict.label);
      if (!blob) {
        toast('Canvas export is unavailable here.', { tone: 'warn' });
        return;
      }
      const file = new File([blob], `cinescope-${movie.id}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `${movie.title} — CineScope AI` });
          return;
        } catch {
          /* fall through to download */
        }
      }
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: file.name });
      a.click();
      URL.revokeObjectURL(url);
      toast('Card saved', { tone: 'success' });
    },
  }, '⤓ Export card');

  const hero = h('header', { class: 'report__hero' },
    movie.backdrop ? h('div', { class: 'report__bg', style: { backgroundImage: `url(${movie.backdrop})` } }) : null,
    h('div', { class: 'report__bg-scrim' }),
    h('div', { class: 'report__poster' }, posterNode(movie, { eager: true })),
    h('div', { class: 'report__info' },
      h('div', { class: 'report__eyebrow' },
        provenanceBadge(movie.source),
        advisory.estimated ? badge('Advisory modelled', 'amber') : badge('Advisory authored', 'green'),
        score.available.length ? badge(`${score.available.length}/${score.entries.length} sources`, 'grey') : badge('No rating data', 'grey'),
      ),
      h('h1', { class: 'report__title' }, movie.title),
      movie.originalTitle ? h('p', { class: 'report__original' }, `Original title: ${movie.originalTitle}`) : null,
      movie.tagline ? h('p', { class: 'report__tagline' }, `“${movie.tagline}”`) : null,
      h('div', { class: 'report__facts' },
        movie.year ? h('span', { class: 'report__fact' }, '📅 ', h('strong', {}, String(movie.year))) : null,
        movie.runtime ? h('span', { class: 'report__fact' }, '⏱ ', h('strong', {}, formatRuntime(movie.runtime))) : null,
        movie.certification ? h('span', { class: 'report__fact' }, '🔞 ', h('strong', {}, movie.certification)) : null,
        movie.director ? h('span', { class: 'report__fact' }, '🎬 ', h('strong', {}, movie.director)) : null,
      ),
      genreChips(movie.genres),
      movie.overview
        ? h('p', { class: 'report__overview' }, store.settings.spoilers ? movie.overview : truncate(movie.overview, 320))
        : h('p', { class: 'report__overview muted' }, 'No synopsis available for this title.'),
      h('div', { class: 'report__actions' }, watchlistBtn, compareBtn, shareBtn, cardBtn,
        h('a', {
          class: 'btn btn--ghost',
          href: PROVIDERS.justwatch.search(encodeURIComponent(movie.title)),
          target: '_blank',
          rel: 'noopener noreferrer',
        }, '🔎 Where to watch'),
      ),
    ),
    h('div', { class: 'report__verdict' },
      ring,
      ringText(score.score, 'CinemaScore'),
      h('span', { class: `badge badge--${verdictTone}` }, `${score.verdict.icon} ${score.verdict.label}`),
      h('span', { class: 'report__verdict-head' }, score.verdict.headline),
      h('span', { class: 'report__hook' }, hookline),
    ),
  );

  /* ---------------- explanation ---------------- */
  const explanationPanel = panel('The verdict', [
    h('div', { class: 'verdict-body' },
      h('div', { class: 'verdict-points' },
        ...explanation.map((line) => h('p', { class: 'verdict-point' },
          h('span', { class: 'bullet', 'aria-hidden': 'true' }, '◆'), h('span', {}, line)))),
      moods.length
        ? h('div', { class: 'chips', style: { marginTop: '10px' } },
          ...moods.map((mood) => h('span', { class: 'chip', title: mood.reason }, mood.label)))
        : null,
      h('div', { class: 'roast' },
        h('span', { class: 'roast__label' }, 'The honest take'),
        roast,
      ),
    ),
  ], { icon: '🧭' });

  /* ---------------- ratings ---------------- */
  const ratingRows = score.entries.map((entry) => {
    const missing = entry.value === null;
    return h('div', { class: ['rating-row', missing && 'rating-row--missing'] },
      h('span', { class: 'rating-row__src' }, entry.label),
      h('span', { class: 'rating-row__val' },
        missing ? '—' : String(entry.raw),
        missing ? null : h('span', { class: 'rating-row__scale' }, entry.suffix),
      ),
      h('span', { class: 'rating-row__track' },
        barRow('', entry.value ?? 0, { missing, color: missing ? 'transparent' : scoreColor(entry.value) })),
    );
  });

  const ratingsPanel = panel('Rating sources', [
    h('div', { class: 'ratings' }, ...ratingRows),
    h('p', { class: 'muted', style: { fontSize: '0.8rem', marginTop: '12px' } },
      score.missing.length
        ? `Not reported: ${joinList(score.missing.map((e) => e.short))}. Missing sources are excluded, not guessed.`
        : 'Every tracked source reported for this title.'),
  ], { hint: 'weighted blend', icon: '📊' });

  /* ---------------- strengths ---------------- */
  const strengthsPanel = panel('Strength profile', [
    radarChart(strengths),
    h('p', { class: 'muted', style: { fontSize: '0.78rem', textAlign: 'center' } },
      'Modelled from the ratings above, the critic/audience split, box office reach, content severity and runtime.'),
  ], { icon: '🕸️' });

  /* ---------------- advisory ---------------- */
  const advisoryPanel = panel('Content advisory', [
    advisorySummaryLine(advisory),
    h('div', { class: 'adv', style: { marginTop: '14px' } }, ...advisory.list.map(advisoryTile)),
    h('div', { class: 'panel__head', style: { marginTop: '16px', marginBottom: '8px' } },
      h('span', { class: 'eyebrow' }, 'Your tolerance'),
      h('span', { class: 'panel__hint' }, advisory.verdict),
    ),
    advisory.breaches.length
      ? h('p', { class: 'chip chip--accent' }, `⚠ ${joinList(advisory.breaches.map((b) => b.label))} above your limit`)
      : h('p', { class: 'chip' }, '✓ Nothing exceeds your limit'),
    advisory.estimated
      ? h('p', { class: 'muted', style: { fontSize: '0.78rem', marginTop: '12px' } },
        'This advisory is modelled from the certification, genres and keywords because no hand-written advisory exists for this title. Treat it as a guide, not a classification.')
      : null,
  ], { icon: '⚠️', hint: advisory.present.length ? `${advisory.present.length} flagged` : 'all clear' });

  /* ---------------- watch plan ---------------- */
  const planPanel = panel('How to watch it', [
    h('div', { class: 'plan' },
      h('div', { class: 'plan__item' }, h('span', { class: 'plan__label' }, 'When'), h('span', { class: 'plan__value' }, watchPlan.when)),
      h('div', { class: 'plan__item' }, h('span', { class: 'plan__label' }, 'Company'), h('span', { class: 'plan__value' }, watchPlan.company)),
      h('div', { class: 'plan__item' }, h('span', { class: 'plan__label' }, 'Afterwards'), h('span', { class: 'plan__value' }, watchPlan.after)),
      h('div', { class: 'plan__item' }, h('span', { class: 'plan__label' }, 'Snacks'), h('span', { class: 'plan__value' }, watchPlan.snack)),
    ),
    h('div', { style: { marginTop: '14px' } }, miniMeter(watchPlan.rewatchValue, 'Rewatch value')),
  ], { icon: '🛋️' });

  /* ---------------- audience notes ---------------- */
  const audiencePanel = panel('Who it lands with', [
    audience.forWhom.length ? h('ul', { class: 'bulleted' }, ...audience.forWhom.map((line) => h('li', {}, line))) : null,
    audience.avoid.length
      ? h('div', { style: { marginTop: '14px' } },
        h('span', { class: 'eyebrow' }, 'Skip if'),
        h('ul', { class: 'bulleted bulleted--avoid', style: { marginTop: '6px' } }, ...audience.avoid.map((line) => h('li', {}, line))))
      : null,
  ], { icon: '🎯' });

  /* ---------------- cast ---------------- */
  const castPanel = movie.cast?.length
    ? panel('Cast & crew', [
      h('div', { class: 'cast' },
        ...movie.cast.slice(0, 8).map((person) => {
          const name = typeof person === 'string' ? person : person.name;
          const role = typeof person === 'string' ? '' : person.character;
          const photo = typeof person === 'string' ? null : person.photo;
          return h('div', { class: 'cast__person' },
            h('div', { class: 'cast__avatar' },
              photo
                ? h('img', { src: photo, alt: name, loading: 'lazy' })
                : name.split(' ').map((w) => w[0]).slice(0, 2).join('')),
            h('span', { class: 'cast__name' }, name),
            role ? h('span', { class: 'cast__role' }, role) : null,
          );
        })),
      movie.director
        ? h('p', { class: 'muted', style: { fontSize: '0.84rem', marginTop: '14px' } }, `Directed by ${movie.director}`)
        : null,
    ], { icon: '🎭' })
    : null;

  /* ---------------- providers ---------------- */
  const providers = movie.streaming?.length
    ? movie.streaming.map((provider) => providerChip({ ...provider, query: encodeURIComponent(movie.title) }))
    : [
      { name: 'JustWatch', type: 'search', provider: PROVIDERS.justwatch, query: encodeURIComponent(movie.title) },
      { name: 'Netflix', type: 'search', provider: PROVIDERS.netflix, query: encodeURIComponent(movie.title) },
      { name: 'Prime Video', type: 'search', provider: PROVIDERS.prime, query: encodeURIComponent(movie.title) },
      { name: 'Disney+', type: 'search', provider: PROVIDERS.disney, query: encodeURIComponent(movie.title) },
    ].map((p) => providerChip(p));

  const providersPanel = panel('Where to watch', [
    h('div', { class: 'providers' }, ...providers),
    h('p', { class: 'muted', style: { fontSize: '0.78rem', marginTop: '12px' } },
      movie.streaming?.length
        ? `Live availability for ${store.settings.region}. Catalogues differ by country — change your region in Settings.`
        : 'Availability changes constantly, so these open a live search rather than claiming a stream exists.'),
  ], { icon: '📺' });

  /* ---------------- stats ---------------- */
  const statsPanel = panel('The numbers', [
    h('div', { class: 'statgrid' },
      ...funStats.map((stat) => h('div', { class: 'stat' },
        h('div', { class: 'stat__label' }, stat.label),
        h('div', { class: 'stat__value tnum' }, String(stat.value))))),
  ], { icon: '🧮' });

  /* ---------------- similar ---------------- */
  const similarSection = similar.length
    ? h('section', { class: 'rail' },
      sectionHead({ title: 'If you like this', subtitle: 'Matched on genre, themes, era and director' }),
      h('div', { class: 'rail__scroller' },
        ...similar.map((entry) => movieTile(entry.movie, {
          onOpen: (m) => openMovie(m.id),
          note: entry.reasons[0] ? `Because it ${entry.reasons[0]}` : undefined,
        }))),
    )
    : null;

  /* ---------------- meta / provenance ---------------- */
  const metaPanel = panel('How this was built', [
    h('dl', { class: 'deflist' },
      h('dt', {}, 'Rating sources'), h('dd', {}, score.available.length ? joinList(score.available.map((e) => e.short)) : 'None reported'),
      h('dt', {}, 'Advisory'), h('dd', {}, advisory.estimated ? 'Modelled from certification, genre and keywords' : 'Hand-written for this title'),
      h('dt', {}, 'Confidence'), h('dd', {}, `${Math.round(score.confidence * 100)}% of weighted sources present`),
      h('dt', {}, 'CinemaScore'), h('dd', {}, score.score === null ? 'Not computable' : `${round(score.score, 1)}/100 — ${score.verdict.label}`),
      movie.dataNote ? (h('dt', {}, 'Note'), h('dd', {}, movie.dataNote)) : null,
    ),
  ], { icon: '🔍', flat: true });

  mount(host,
    h('div', { class: 'report' },
      h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => go('/') }, '← Back to discover'),
      hero,
      h('div', { class: 'report__grid' },
        h('div', { class: 'report__col' }, explanationPanel, ratingsPanel, strengthsPanel),
        h('div', { class: 'report__col' }, advisoryPanel, planPanel, audiencePanel),
        h('div', { class: 'report__col report__col--full' },
          h('div', { class: 'report__grid' },
            h('div', { class: 'report__col' }, castPanel, providersPanel),
            h('div', { class: 'report__col' }, statsPanel, metaPanel),
          ),
        ),
      ),
      similarSection,
    ),
  );

  nextFrame(() => window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }));
}

/** Box-office line reused by the compare view. */
export function moneyLine(movie) {
  if (!movie.budget && !movie.revenue) return 'Not disclosed';
  return [formatMoney(movie.budget), formatMoney(movie.revenue)].filter(Boolean).join(' → ');
}

export { chip };
