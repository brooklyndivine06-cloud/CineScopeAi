/** Discover view: hero search, instant suggestions, curated rails. */
import { h, mount, clear, debounce, nextFrame } from '../dom.js';
import { movieTile, sectionHead, emptyState, chip, badge } from '../components.js';
import { quickAnalysis } from '../../analysis/index.js';
import { catalogSize, decadeRails, genreRails, rails as staticRails, randomMovie, suggest } from '../../services/catalog-service.js';
import { highlightSegments } from '../../utils/fuzzy.js';
import { parseInput } from '../../services/links.js';
import { posterNode } from '../poster.js';
import { getCatalogMovie } from '../../data/catalog.js';

const EXAMPLES = ['Interstellar', 'Parasite', 'Hereditary', 'The Room', 'Paddington 2'];

export function renderLanding(host, ctx) {
  const { store, go, openMovie, toast } = ctx;
  const input = h('input', {
    class: 'searchbar__input',
    type: 'search',
    id: 'hero-search',
    placeholder: 'Search a film, a director, or paste a Letterboxd / IMDb link…',
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-label': 'Search for a film',
    'aria-expanded': 'false',
    'aria-controls': 'hero-suggestions',
    role: 'combobox',
  });

  const suggestions = h('div', { class: 'suggestions', id: 'hero-suggestions', role: 'listbox', hidden: true });
  let items = [];
  let active = -1;

  const submit = (value) => {
    const text = (value ?? input.value).trim();
    if (!text) return;
    hideSuggestions();
    go(`/q/${encodeURIComponent(text)}`);
  };

  const hideSuggestions = () => {
    suggestions.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    active = -1;
    items = [];
  };

  const paint = (query) => {
    items = suggest(query, 7);
    const parsed = parseInput(query);
    if (parsed.kind === 'url' && !items.length) {
      items = [];
    }
    clear(suggestions);
    if (!items.length) {
      suggestions.append(
        h('div', { class: 'suggest', style: { cursor: 'default', gridTemplateColumns: '1fr' } },
          h('span', { class: 'suggest__sub' },
            parsed.opaque
              ? `${parsed.label} links need a TMDb key — add one in Settings, or type the title.`
              : `No match in the bundled catalogue. Try ${EXAMPLES[0].toLowerCase()}, or add a TMDb key for the full catalogue.`),
        ),
      );
      suggestions.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      return;
    }

    items.forEach((item, index) => {
      suggestions.append(
        h('button', {
          class: 'suggest',
          type: 'button',
          role: 'option',
          'data-active': String(index === active),
          'aria-selected': String(index === active),
          onclick: () => openMovie(item.id),
          onmousemove: () => setActive(index),
        },
        h('span', { class: 'suggest__thumb', style: { width: '30px', height: '42px', borderRadius: '5px', overflow: 'hidden' } },
          posterNode({ ...findMovie(item.id), title: item.title }, { compact: true })),
        h('span', {},
          h('span', { class: 'suggest__title' }, ...highlighted(item.title, query)),
          h('br'),
          h('span', { class: 'suggest__sub' }, item.subtitle),
        ),
        scoreTag(item.id),
        ),
      );
    });

    suggestions.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  const findMovie = (id) => getCatalogMovie(id) ?? { title: id, ratings: {} };
  const scoreTag = (id) => {
    const movie = findMovie(id);
    const { score } = quickAnalysis(movie.ratings ?? movie);
    return score === null ? null : h('span', { class: 'suggest__score tnum' }, Math.round(score));
  };

  const highlighted = (text, query) =>
    highlightSegments(text, query).map((segment) => (segment.hit ? h('mark', {}, segment.text) : segment.text));

  const setActive = (index) => {
    active = index;
    suggestions.querySelectorAll('.suggest').forEach((node, i) => node.setAttribute('data-active', String(i === index)));
  };

  const onInput = debounce(() => {
    const query = input.value.trim();
    if (!query) {
      hideSuggestions();
      return;
    }
    paint(query);
  }, 110);

  input.addEventListener('input', onInput);
  input.addEventListener('focus', () => { if (input.value.trim()) paint(input.value.trim()); });
  input.addEventListener('blur', () => setTimeout(hideSuggestions, 120));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideSuggestions();
      input.blur();
      return;
    }
    if (event.key === 'ArrowDown' && items.length) {
      event.preventDefault();
      setActive((active + 1) % items.length);
      return;
    }
    if (event.key === 'ArrowUp' && items.length) {
      event.preventDefault();
      setActive((active - 1 + items.length) % items.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (active >= 0 && items[active]) openMovie(items[active].id);
      else submit();
    }
  });

  const clearBtn = h('button', {
    class: 'searchbar__clear',
    type: 'button',
    'aria-label': 'Clear search',
    hidden: true,
    onclick: () => {
      input.value = '';
      clearBtn.hidden = true;
      hideSuggestions();
      input.focus();
    },
  }, '✕');

  input.addEventListener('input', () => { clearBtn.hidden = !input.value; });

  const searchbar = h('div', { class: 'searchbar', role: 'search' },
    h('span', { class: 'searchbar__icon', 'aria-hidden': 'true' },
      h('svg', { viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        h('circle', { cx: '11', cy: '11', r: '7' }), h('path', { d: 'm20 20-3.5-3.5' }))),
    input,
    clearBtn,
    h('button', { class: 'btn btn--primary', type: 'button', onclick: () => submit() }, 'Analyze'),
    suggestions,
  );

  const sourceBadge = store.hasKey()
    ? chip(`${catalogSize()} bundled · full catalogue via TMDb`, { accent: true })
    : chip(`${catalogSize()} films bundled · works offline`, { accent: true });

  const hero = h('section', { class: 'hero' },
    h('span', { class: 'hero__badge' }, h('span', { class: 'dot', 'aria-hidden': 'true' }), 'No account. No sign-up. Nothing leaves your browser.'),
    h('h1', { class: 'hero__title' }, 'Should you ', h('em', {}, 'actually'), ' watch it?'),
    h('p', { class: 'hero__sub' },
      'CineScope reads IMDb, Rotten Tomatoes, Metacritic, TMDb and Letterboxd, then gives you one verdict — plus a real content advisory that says what is actually in the film.'),
    searchbar,
    h('div', { class: 'hero__quick' },
      ...EXAMPLES.map((title) => h('button', {
        class: 'chip chip--quiet',
        type: 'button',
        onclick: () => submit(title),
      }, title)),
      h('button', {
        class: 'chip chip--accent',
        type: 'button',
        onclick: () => {
          const pick = randomMovie(store.history.map((entry) => entry.id));
          toast(`Surprise pick: ${pick.title} (${pick.year})`);
          openMovie(pick.id);
        },
      }, '🎲 Surprise me'),
    ),
    h('div', { class: 'hero__foot' }, sourceBadge),
  );

  const railSections = h('div', { class: 'landing__sections' });
  const buildRails = () => {
    const groups = [...staticRails(), ...genreRails().slice(0, 3), ...decadeRails().slice(0, 2)];
    clear(railSections);
    groups.forEach((rail) => {
      if (!rail.movies.length) return;
      railSections.append(
        h('section', { class: 'rail' },
          sectionHead({ title: rail.title, subtitle: rail.subtitle }),
          h('div', { class: 'rail__scroller' },
            ...rail.movies.map((movie) => movieTile(movie, { onOpen: (m) => openMovie(m.id) }))),
        ),
      );
    });
  };

  const historyStrip = store.history.length
    ? h('section', { class: 'rail' },
      sectionHead({
        title: 'Recently analyzed',
        subtitle: 'Stored on this device only',
        action: h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => { store.clearHistory(); ctx.refresh(); } }, 'Clear'),
      }),
      h('div', { class: 'rail__scroller' },
        ...store.history.slice(0, 10).map((entry) => movieTile(
          { id: entry.id, title: entry.title, year: entry.year, poster: entry.poster, ratings: {} },
          { onOpen: (m) => openMovie(m.id), showScore: false, note: `${entry.year ?? ''}` },
        ))),
    )
    : null;

  mount(host,
    hero,
    historyStrip,
    railSections,
    h('p', { class: 'muted', style: { textAlign: 'center', fontSize: '0.8rem' } },
      'Ratings are the published figures from each source. Verdicts, profiles and advisories are computed from them — CineScope never invents a score.'),
  );

  buildRails();
  nextFrame(() => input.focus({ preventScroll: true }));
}

export { emptyState, badge };
