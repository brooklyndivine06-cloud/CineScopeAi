/** Watchlist view: saved films, aggregate stats, export/import. */
import { h, mount } from '../dom.js';
import { emptyState, movieTile, panel, badge } from '../components.js';
import { CATALOG } from '../../data/catalog.js';
import { quickAnalysis } from '../../analysis/index.js';
import { summarizeAdvisories } from '../../analysis/advisory.js';
import { round } from '../../utils/number.js';
import { read, write } from '../../utils/storage.js';

const SORTS = {
  added: (a, b) => new Date(b.addedAt) - new Date(a.addedAt),
  score: (a, b) => (b.score ?? -1) - (a.score ?? -1),
  title: (a, b) => a.title.localeCompare(b.title),
  year: (a, b) => (b.year ?? 0) - (a.year ?? 0),
};

let sortKey = 'added';

export function renderWatchlist(host, ctx) {
  const { store, openMovie, toast, refresh } = ctx;
  const list = store.watchlist;

  const head = h('div', { class: 'list-head' },
    h('div', {},
      h('h1', { class: 'list-title' }, 'Watchlist'),
      h('p', { class: 'list-sub' }, `${list.length} saved on this device · nothing is uploaded anywhere`),
    ),
    h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } },
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Sort watchlist' },
        ...Object.keys(SORTS).map((key) => h('button', {
          class: 'seg__btn',
          type: 'button',
          'aria-pressed': String(sortKey === key),
          onclick: () => {
            sortKey = key;
            refresh();
          },
        }, key[0].toUpperCase() + key.slice(1)))),
      h('button', {
        class: 'btn btn--sm',
        type: 'button',
        onclick: () => exportList(list, toast),
      }, '⤓ Export'),
      h('button', {
        class: 'btn btn--sm',
        type: 'button',
        onclick: () => importList(store, toast, refresh),
      }, '⤒ Import'),
      list.length
        ? h('button', {
          class: 'btn btn--sm btn--danger',
          type: 'button',
          onclick: () => {
            store.clearWatchlist();
            toast('Watchlist cleared', { tone: 'info' });
            refresh();
          },
        }, 'Clear all')
        : null,
    ),
  );

  if (!list.length) {
    mount(host, head, emptyState({
      icon: '⭐',
      title: 'Nothing saved yet',
      body: 'Open any film and hit “Save to watchlist”. It stays on this device and survives a refresh.',
      actions: [h('button', { class: 'btn btn--primary', type: 'button', onclick: () => ctx.go('/') }, 'Find something to watch')],
    }));
    return;
  }

  const scored = list.map((entry) => {
    const source = entry.ratings ? { ratings: entry.ratings } : (CATALOG.find((m) => m.id === entry.id) ?? {});
    return { entry, analysis: quickAnalysis(source) };
  });

  const values = scored.map((item) => item.analysis.score).filter((v) => v !== null);
  const avg = values.length ? round(values.reduce((sum, v) => sum + v, 0) / values.length, 0) : null;
  const best = values.length ? Math.max(...values) : null;
  const worst = values.length ? Math.min(...values) : null;
  const family = list.filter((entry) => {
    const movie = CATALOG.find((m) => m.id === entry.id);
    if (!movie) return false;
    return summarizeAdvisories(movie.adv ?? {}, { certification: movie.cert }).maxRank <= 1;
  }).length;

  const stats = h('div', { class: 'wl-stats' },
    stat(list.length, 'Saved'),
    stat(avg === null ? '—' : avg, 'Average score'),
    stat(best === null ? '—' : Math.round(best), 'Best'),
    stat(worst === null ? '—' : Math.round(worst), 'Weakest'),
    stat(family, 'Family-safe'),
  );

  const sorted = [...list].sort(SORTS[sortKey]);

  const grid = h('div', { class: 'tiles tiles--wide' },
    ...sorted.map((entry) => {
      const movie = CATALOG.find((m) => m.id === entry.id) ?? { id: entry.id, title: entry.title, year: entry.year, poster: entry.poster, ratings: {} };
      return h('div', { class: 'stack', style: { gap: '8px' } },
        movieTile(movie, { onOpen: (m) => openMovie(m.id), note: entry.verdict ?? `${entry.year ?? ''}` }),
        h('button', {
          class: 'btn btn--sm btn--ghost btn--block',
          type: 'button',
          onclick: () => {
            store.toggleWatchlist({ movie });
            toast(`Removed ${entry.title}`);
            refresh();
          },
        }, 'Remove'),
      );
    }));

  mount(host, head, stats, grid,
    panel('Storage', [
      h('p', { class: 'muted', style: { fontSize: '0.84rem' } },
        'Your watchlist, history and settings live in this browser only. Export a JSON copy if you are moving devices — import reads that same file back.'),
    ], { icon: '🗄️', flat: true }),
  );
}

const stat = (value, label) =>
  h('div', { class: 'wl-stat' },
    h('span', { class: 'wl-stat__value tnum' }, String(value)),
    h('span', { class: 'wl-stat__label' }, label));

function exportList(list, toast) {
  try {
    const blob = new Blob([JSON.stringify({ app: 'cinescope', version: 2, exportedAt: new Date().toISOString(), watchlist: list }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: 'cinescope-watchlist.json' });
    a.click();
    URL.revokeObjectURL(url);
    toast('Watchlist exported', { tone: 'success' });
  } catch {
    toast('Export failed in this browser.', { tone: 'warn' });
  }
}

function importList(store, toast, refresh) {
  const input = h('input', { type: 'file', accept: 'application/json', class: 'sr-only' });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming = Array.isArray(parsed) ? parsed : parsed.watchlist;
        if (!Array.isArray(incoming) || !incoming.length) throw new Error('empty');
        let added = 0;
        incoming.forEach((entry) => {
          if (!entry?.id || store.inWatchlist(entry.id)) return;
          store.toggleWatchlist({ movie: entry });
          added += 1;
        });
        write('watchlist', store.watchlist);
        toast(`Imported ${added} title${added === 1 ? '' : 's'}`, { tone: 'success' });
        refresh();
      } catch {
        toast('That file is not a CineScope export.', { tone: 'error' });
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

export { badge, read };
