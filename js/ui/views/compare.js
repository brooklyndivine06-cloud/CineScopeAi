/** Compare view: two films, side by side, with the deltas called out. */
import { h, mount } from '../dom.js';
import { emptyState, panel, badge } from '../components.js';
import { posterNode } from '../poster.js';
import { radarChart } from '../charts.js';
import { CATALOG } from '../../data/catalog.js';
import { bestCatalogMatch } from '../../services/catalog-service.js';
import { analyzeMovie } from '../../analysis/index.js';
import { formatDelta } from '../../utils/number.js';
import { formatRuntime } from '../../utils/number.js';
import { joinList } from '../../utils/text.js';

const datalist = h('datalist', { id: 'compare-options' },
  ...CATALOG.map((movie) => h('option', { value: movie.title })));

function slot(index, ctx, currentId) {
  const input = h('input', {
    class: 'input',
    type: 'text',
    list: 'compare-options',
    placeholder: index === 0 ? 'First film…' : 'Second film…',
    'aria-label': `Film ${index + 1}`,
    value: currentId ? (CATALOG.find((m) => m.id === currentId)?.title ?? '') : '',
  });

  const button = h('button', {
    class: 'btn btn--primary',
    type: 'button',
    onclick: () => {
      const movie = bestCatalogMatch(input.value.trim());
      if (!movie) {
        ctx.toast('No match in the bundled catalogue.', { tone: 'warn' });
        return;
      }
      ctx.store.setCompareSlot(index, movie.id);
      ctx.refresh();
    },
  }, 'Set');

  return h('div', { class: 'compare__slot' },
    h('div', { class: 'compare__pick' }, input, button),
    currentId
      ? h('button', {
        class: 'btn btn--sm btn--ghost',
        type: 'button',
        onclick: () => {
          ctx.store.setCompareSlot(index, null);
          ctx.store.setCompareSlot(1 - index, ctx.store.compare[1 - index] ?? null);
          ctx.refresh();
        },
      }, 'Clear this slot')
      : null,
  );
}

function filmCard(report, ctx) {
  const { movie, score } = report;
  return h('div', { class: 'panel panel--tight' },
    h('div', { class: 'compare__card' },
      h('div', { class: 'compare__poster' }, posterNode(movie)),
      h('div', {},
        h('div', { class: 'compare__name' }, movie.title),
        h('div', { class: 'compare__meta' }, joinList([movie.year, formatRuntime(movie.runtime), movie.certification], ' · ')),
        h('div', { class: 'row', style: { gap: '6px', marginTop: '6px', flexWrap: 'wrap' } },
          score.score === null
            ? badge('No score', 'grey')
            : badge(`${score.verdict.icon} ${score.verdict.label}`, score.verdict.tone),
          badge(`${score.score === null ? '—' : Math.round(score.score)}/100`, 'grey'),
        ),
      ),
    ),
    h('button', {
      class: 'btn btn--sm btn--block',
      type: 'button',
      style: { marginTop: '12px' },
      onclick: () => ctx.openMovie(movie.id),
    }, 'Open full analysis'),
    radarChart(report.strengths, { size: 260 }),
  );
}

const ROWS = [
  { label: 'CinemaScore', get: (r) => r.score.score, higherBetter: true, fmt: (v) => v === null ? '—' : String(Math.round(v)) },
  { label: 'Verdict', get: (r) => r.score.verdict.label, text: true },
  { label: 'IMDb', get: (r) => r.movie.ratings.imdb, higherBetter: true, fmt: (v) => v ?? '—' },
  { label: 'RT critics', get: (r) => r.movie.ratings.rtCritics, higherBetter: true, fmt: (v) => (v == null ? '—' : `${v}%`) },
  { label: 'RT audience', get: (r) => r.movie.ratings.rtAudience, higherBetter: true, fmt: (v) => (v == null ? '—' : `${v}%`) },
  { label: 'Metacritic', get: (r) => r.movie.ratings.metacritic, higherBetter: true, fmt: (v) => v ?? '—' },
  { label: 'Letterboxd', get: (r) => r.movie.ratings.letterboxd, higherBetter: true, fmt: (v) => v ?? '—' },
  { label: 'Runtime', get: (r) => r.movie.runtime, fmt: (v) => (v ? formatRuntime(v) : '—') },
  { label: 'Year', get: (r) => r.movie.year, fmt: (v) => v ?? '—' },
  { label: 'Certification', get: (r) => r.movie.certification ?? '—', text: true },
  { label: 'Worst content flag', get: (r) => r.advisory.maxSeverity, text: true, lowerBetter: true, rank: (r) => r.advisory.maxRank },
  { label: 'Family verdict', get: (r) => r.advisory.audience.label, text: true },
  { label: 'Budget', get: (r) => r.movie.budget, fmt: (v) => (v ? `$${Math.round(v / 1e6)}M` : '—') },
  { label: 'Box office', get: (r) => r.movie.revenue, higherBetter: true, fmt: (v) => (v ? `$${Math.round(v / 1e6)}M` : '—') },
  { label: 'Rewatch value', get: (r) => r.watchPlan.rewatchValue, higherBetter: true, fmt: (v) => `${Math.round(v)}%` },
  { label: 'Rating sources', get: (r) => r.score.available.length, higherBetter: true, fmt: (v) => String(v) },
];

export function renderCompare(host, ctx) {
  const [idA, idB] = ctx.store.compare;
  const reports = [idA, idB].map((id) => (id ? analyzeMovie(CATALOG.find((m) => m.id === id)) : null));
  const [a, b] = reports;

  const head = h('div', { class: 'compare__head' },
    h('h1', { class: 'list-title' }, 'Head to head'),
    h('p', { class: 'list-sub' }, 'Pick two films and see where they actually differ — scores, runtime, content and rewatch value.'),
  );

  const pickers = h('div', { class: 'compare__grid' },
    slot(0, ctx, idA),
    slot(1, ctx, idB),
    datalist,
  );

  if (!a || !b) {
    mount(host, h('div', { class: 'compare' }, head, pickers,
      emptyState({
        icon: '⚖️',
        title: 'Two slots, two films',
        body: 'Choose a film in each box. Both stay saved on this device, so you can come back to a comparison later.',
      })));
    return;
  }

  const rows = ROWS.map((row) => {
    const va = row.get(a);
    const vb = row.get(b);
    let classA = '';
    let classB = '';
    if (row.higherBetter || row.lowerBetter) {
      const na = row.rank ? row.rank(a) : Number(va);
      const nb = row.rank ? row.rank(b) : Number(vb);
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) {
        const aWins = row.lowerBetter ? na < nb : na > nb;
        classA = aWins ? 'compare__win' : 'compare__lose';
        classB = aWins ? 'compare__lose' : 'compare__win';
      }
    }
    const delta = !row.text && Number.isFinite(Number(va)) && Number.isFinite(Number(vb))
      ? h('span', { class: 'muted', style: { fontSize: '0.76rem' } }, formatDelta(Number(va) - Number(vb)))
      : null;

    return h('tr', {},
      h('th', { scope: 'row' }, row.label),
      h('td', { class: classA }, row.fmt ? row.fmt(va) : String(va ?? '—'), ' ', delta),
      h('td', { class: classB }, row.fmt ? row.fmt(vb) : String(vb ?? '—')),
    );
  });

  const table = panel('Line by line', [
    h('table', { class: 'compare__table' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Metric'), h('th', {}, a.movie.title), h('th', {}, b.movie.title))),
      h('tbody', {}, ...rows)),
  ], { icon: '📋' });

  const cards = h('div', { class: 'compare__grid' }, filmCard(a, ctx), filmCard(b, ctx));

  const gap = a.score.score !== null && b.score.score !== null ? a.score.score - b.score.score : null;
  const summary = gap === null
    ? 'Not enough shared rating data to call this one.'
    : Math.abs(gap) < 3
      ? `${a.movie.title} and ${b.movie.title} land within three points of each other — pick on content tolerance and runtime.`
      : `${gap > 0 ? a.movie.title : b.movie.title} is the stronger film by ${Math.abs(Math.round(gap))} CinemaScore points.`;

  mount(host, h('div', { class: 'compare' },
    head,
    pickers,
    cards,
    panel('The call', [h('p', {}, summary)], { icon: '🏁' }),
    table,
  ));
}
