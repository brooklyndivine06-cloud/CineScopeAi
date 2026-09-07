/** ⌘K command palette: films + actions, fully keyboard driven. */
import { h, mount, clear, debounce } from './dom.js';
import { highlightSegments } from '../utils/fuzzy.js';
import { suggest, randomMovie, catalogSize } from '../services/catalog-service.js';
import { posterNode } from './poster.js';
import { getCatalogMovie } from '../data/catalog.js';
import { parseInput } from '../services/links.js';

export function createPalette(ctx) {
  const host = document.getElementById('palette-root');
  let open = false;
  let items = [];
  let active = 0;
  let query = '';

  const input = h('input', {
    class: 'palette__input',
    type: 'text',
    placeholder: 'Search films or run a command…',
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-label': 'Command palette',
    'aria-controls': 'palette-list',
    role: 'combobox',
    'aria-expanded': 'true',
  });

  const list = h('div', { class: 'palette__list', id: 'palette-list', role: 'listbox' });

  const shell = h('div', { class: 'palette' },
    h('div', { class: 'palette__input-row' },
      h('span', { 'aria-hidden': 'true' }, '🔎'),
      input,
      h('kbd', {}, 'esc'),
    ),
    list,
    h('div', { class: 'palette__foot' },
      h('span', {}, '↑↓ navigate'),
      h('span', {}, '↵ open'),
      h('span', {}, `⌘K anytime · ${catalogSize()} films offline`),
    ),
  );

  const actions = () => [
    { id: 'go-discover', title: 'Go to discover', sub: 'Landing page', run: () => ctx.go('/') },
    { id: 'go-list', title: 'Open watchlist', sub: `${ctx.store.watchlist.length} saved`, run: () => ctx.go('/list') },
    { id: 'go-compare', title: 'Compare two films', sub: 'Head to head', run: () => ctx.go('/compare') },
    {
      id: 'surprise',
      title: 'Surprise me',
      sub: 'Random film from the catalogue',
      run: () => {
        const pick = randomMovie(ctx.store.history.map((entry) => entry.id));
        ctx.openMovie(pick.id);
      },
    },
    { id: 'settings', title: 'Settings', sub: 'TMDb key, tolerance, theme', run: () => ctx.openSettings() },
    { id: 'theme', title: ctx.theme.current() === 'light' ? 'Switch to dark' : 'Switch to light', sub: 'Appearance', run: () => ctx.theme.toggle() },
    { id: 'motion', title: 'Toggle reduced motion', sub: ctx.store.settings.reduceMotion ? 'Motion is off' : 'Motion is on', run: () => ctx.toggleMotion() },
    { id: 'shortcuts', title: 'Keyboard shortcuts', sub: 'Show the list', run: () => ctx.openShortcuts() },
  ];

  function buildItems() {
    const trimmed = query.trim();
    const parsed = parseInput(trimmed);
    const out = [];

    if (trimmed) {
      const films = suggest(trimmed, 6).map((entry) => ({
        group: 'Films',
        id: `film:${entry.id}`,
        title: entry.title,
        sub: entry.subtitle,
        poster: getCatalogMovie(entry.id)?.poster ?? null,
        movieId: entry.id,
        highlight: true,
        run: () => ctx.openMovie(entry.id),
      }));
      out.push(...films);

      if (parsed.kind === 'url') {
        out.push({
          group: 'Links',
          id: 'link:resolve',
          title: `Resolve ${parsed.label} link`,
          sub: parsed.opaque ? 'Needs a TMDb key' : parsed.query,
          run: () => ctx.resolveQuery(trimmed),
        });
      } else {
        out.push({
          group: 'Links',
          id: 'query:resolve',
          title: `Analyze “${trimmed}”`,
          sub: 'Run the full analysis',
          run: () => ctx.resolveQuery(trimmed),
        });
      }
    }

    const filteredActions = trimmed
      ? actions().filter((action) => action.title.toLowerCase().includes(trimmed.toLowerCase()))
      : actions();
    out.push(...filteredActions.map((action) => ({ group: 'Commands', ...action, highlight: false })));

    if (!out.length) {
      out.push({
        group: 'No results',
        id: 'none',
        title: 'Nothing matched',
        sub: parsed.opaque ? 'That link needs a TMDb key' : 'Try a different title or run a command',
        run: () => {},
        disabled: true,
      });
    }
    return out;
  }

  function paint() {
    items = buildItems();
    active = 0;
    clear(list);
    let lastGroup = null;
    items.forEach((item, index) => {
      if (item.group !== lastGroup) {
        list.append(h('div', { class: 'palette__group' }, item.group));
        lastGroup = item.group;
      }
      const titleNode = item.highlight
        ? h('span', { class: 'palette__item-title' }, ...highlightSegments(item.title, query).map((s) => (s.hit ? h('mark', {}, s.text) : s.text)))
        : h('span', { class: 'palette__item-title' }, item.title);

      list.append(h('button', {
        class: 'palette__item',
        type: 'button',
        role: 'option',
        'aria-selected': String(index === active),
        'data-active': String(index === active),
        onclick: () => run(index),
        onmousemove: () => setActive(index),
      },
      item.movieId
        ? h('span', { class: 'palette__thumb' }, posterNode(getCatalogMovie(item.movieId) ?? { title: item.title }, { compact: true }))
        : h('span', { class: 'palette__thumb', style: { display: 'grid', placeItems: 'center', fontSize: '1rem' } }, '⌘'),
      h('span', {}, titleNode, h('br'), h('span', { class: 'palette__item-sub' }, item.sub ?? '')),
      h('span', { class: 'palette__item-sub' }, '↵'),
      ));
    });
  }

  const setActive = (index) => {
    active = Math.max(0, Math.min(index, items.length - 1));
    list.querySelectorAll('.palette__item').forEach((node, i) => {
      node.setAttribute('data-active', String(i === active));
      node.setAttribute('aria-selected', String(i === active));
    });
    list.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  };

  const run = (index) => {
    const item = items[index];
    if (!item || item.disabled) return;
    close();
    item.run();
  };

  const onInput = debounce(() => {
    query = input.value;
    paint();
  }, 80);

  function open_() {
    if (open) return;
    open = true;
    host.hidden = false;
    mount(host, shell);
    input.value = '';
    query = '';
    paint();
    requestAnimationFrame(() => input.focus());
    document.addEventListener('keydown', onKey, true);
  }

  function close() {
    if (!open) return;
    open = false;
    document.removeEventListener('keydown', onKey, true);
    clear(host);
    host.hidden = true;
  }

  function onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(active + 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(active - 1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      run(active);
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
    }
  }

  input.addEventListener('input', onInput);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      run(active);
    }
  });

  return { open: open_, close, get isOpen() { return open; } };
}
