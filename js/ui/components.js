/** Shared building blocks used by every view. */
import { h, frag } from './dom.js';
import { posterNode } from './poster.js';
import { quickAnalysis } from '../analysis/index.js';
import { severityPips } from './charts.js';
import { summarizeAdvisories } from '../analysis/advisory.js';
import { scoreColor } from '../utils/color.js';
import { genreMeta, SEVERITY } from '../data/taxonomy.js';
import { joinList } from '../utils/text.js';

export function panel(title, children, options = {}) {
  const { hint, actions, flat = false, tight = false, id } = options;
  return h('section', { class: ['panel', flat && 'panel--flat', tight && 'panel--tight'], id },
    title
      ? h('div', { class: 'panel__head' },
        h('h2', { class: 'panel__title' },
          options.icon ? h('span', { 'aria-hidden': 'true' }, options.icon) : null,
          title,
        ),
        hint || actions
          ? h('div', { class: 'row', style: { gap: '8px' } },
            hint ? h('span', { class: 'panel__hint' }, hint) : null,
            actions ?? null,
          )
          : null,
      )
      : null,
    ...(Array.isArray(children) ? children : [children]),
  );
}

export const chip = (text, options = {}) =>
  h('span', { class: ['chip', options.accent && 'chip--accent', options.quiet && 'chip--quiet'], title: options.title }, text);

export const badge = (text, tone = 'grey') => h('span', { class: `badge badge--${tone}` }, text);

/** Poster tile for rails, grids and the watchlist. */
export function movieTile(movie, options = {}) {
  const { onOpen, showScore = true, note } = options;
  const { score, verdict } = quickAnalysis(movie.ratings ?? movie);

  const poster = h('div', { class: 'tile__poster' },
    posterNode(movie),
    showScore && score !== null
      ? h('span', { class: 'tile__score tnum', style: { color: '#fff', boxShadow: `inset 0 0 0 1.5px ${scoreColor(score)}` } }, Math.round(score))
      : null,
    verdict && score !== null && (score >= 85 || score < 40)
      ? h('span', { class: 'tile__flag' }, score >= 85 ? verdict.icon : '⚠️')
      : null,
  );

  const content = frag(
    poster,
    h('span', { class: 'stack', style: { gap: '2px' } },
      h('span', { class: 'tile__title' }, movie.title),
      h('span', { class: 'tile__sub' }, note ?? joinList([movie.year, movie.genres?.[0]], ' · ')),
    ),
  );

  if (!onOpen) return h('div', { class: 'tile' }, content);

  return h('button', {
    class: 'tile',
    type: 'button',
    'aria-label': `Open analysis for ${movie.title} (${movie.year ?? 'year unknown'})`,
    onclick: () => onOpen(movie),
  }, content);
}

export function skeletonTile() {
  return h('div', { class: 'stack', style: { gap: '10px' } },
    h('div', { class: 'skeleton skeleton--poster' }),
    h('div', { class: 'skeleton skeleton--line', style: { width: '70%' } }),
    h('div', { class: 'skeleton skeleton--line', style: { width: '40%' } }),
  );
}

export function skeletonRail(count = 6) {
  return h('div', { class: 'tiles' }, ...Array.from({ length: count }, skeletonTile));
}

export function emptyState({ icon = '🎞️', title, body, actions = [] }) {
  return h('div', { class: 'state' },
    h('div', { class: 'state__icon', 'aria-hidden': 'true' }, icon),
    h('h3', { class: 'state__title' }, title),
    body ? h('p', { class: 'state__body' }, body) : null,
    actions.length ? h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap', justifyContent: 'center' } }, ...actions) : null,
  );
}

export function sectionHead({ title, subtitle, action }) {
  return h('div', { class: 'rail__head' },
    h('div', {},
      h('h2', { class: 'rail__title' }, title),
      subtitle ? h('p', { class: 'rail__sub' }, subtitle) : null,
    ),
    action ?? null,
  );
}

/** One content-advisory tile. */
export function advisoryTile(entry) {
  return h('div', {
    class: 'adv__item',
    'data-rank': String(entry.rank),
    title: `${entry.label}: ${entry.hint}`,
  },
  h('span', { class: 'adv__icon', 'aria-hidden': 'true' }, entry.icon),
  h('div', {},
    h('div', { class: 'adv__name' }, entry.label),
    severityPips(entry.rank),
    h('div', { class: 'adv__meta' },
      entry.rank === 0 ? 'Not present' : SEVERITY[entry.severity].label,
      h('span', { class: 'sr-only' }, ` — ${entry.hint}`),
    ),
  ),
  );
}

export function advisorySummaryLine(summary) {
  const tone = { family: 'green', teen: 'teal', adult: 'amber', strong: 'red' }[summary.audience.key] ?? 'grey';
  return h('div', { class: 'row', style: { gap: '10px', flexWrap: 'wrap' } },
    badge(summary.audience.label, tone),
    h('span', { class: 'muted', style: { fontSize: '0.84rem' } }, summary.headline),
  );
}

export function providerChip(provider) {
  const meta = provider.provider ?? null;
  const hue = meta?.hue ?? 220;
  return h('a', {
    class: 'provider',
    href: provider.href ?? meta?.search?.(provider.query ?? '') ?? '#',
    target: '_blank',
    rel: 'noopener noreferrer',
    title: `${provider.type === 'stream' ? 'Streaming on' : provider.type === 'rent' ? 'Rent on' : provider.type === 'buy' ? 'Buy on' : 'Search'} ${provider.name}`,
  },
  provider.logo
    ? h('img', { class: 'provider__logo', src: provider.logo, alt: '', loading: 'lazy' })
    : h('span', { class: 'provider__glyph', style: { background: `hsl(${hue} 70% 45%)` } }, meta?.short ?? provider.name.slice(0, 2).toUpperCase()),
  h('span', { class: 'stack', style: { gap: '0' } },
    h('span', { class: 'provider__name' }, provider.name),
    provider.type ? h('span', { class: 'provider__type' }, { stream: 'Included', rent: 'Rent', buy: 'Buy', search: 'Search' }[provider.type] ?? provider.type) : null,
  ),
  );
}

export function genreChips(genres) {
  return h('div', { class: 'chips' },
    ...(genres ?? []).map((genre) => h('span', { class: 'chip chip--quiet' }, `${genreMeta(genre).icon} ${genre}`)));
}

/** Small "verified vs estimated" marker for data provenance. */
export function provenanceBadge(source) {
  if (source === 'catalog') return badge('Catalogue data', 'teal');
  if (source === 'tmdb') return badge('Live TMDb', 'green');
  return badge('Unknown source', 'grey');
}

export { summarizeAdvisories };
