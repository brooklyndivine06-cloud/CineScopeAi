/**
 * CineScope AI — application bootstrap.
 * Wires store, router, theme, services and views together.
 */
import { createStore } from './core/store.js';
import { createRouter } from './core/router.js';
import { createTmdbService } from './services/tmdb.js';
import { resolveById, resolveInput } from './services/provider.js';
import { renderLanding } from './ui/views/landing.js';
import { renderReport } from './ui/views/report.js';
import { renderCompare } from './ui/views/compare.js';
import { renderWatchlist } from './ui/views/watchlist.js';
import { createPalette } from './ui/palette.js';
import { createTheme } from './ui/theme.js';
import { createSound } from './ui/sound.js';
import { initToasts, toast } from './ui/toast.js';
import { openSettings } from './ui/settings.js';
import { openShortcuts } from './ui/shortcuts.js';
import { openGate } from './ui/modal.js';
import { h, mount, $ } from './ui/dom.js';
import { catalogSize } from './services/catalog-service.js';
import { isPersistent } from './utils/storage.js';

const MIN_SCAN_MS = 620;

const SCAN_STEPS = [
  'Reading your query',
  'Matching the catalogue',
  'Blending rating sources',
  'Checking content advisories',
  'Building the verdict',
];

const store = createStore();
const sound = createSound(store);
const theme = createTheme(store);

const tmdb = createTmdbService({
  getKey: () => store.settings.tmdbKey,
  getRegion: () => store.settings.region,
});

initToasts({ container: $('#toast-stack'), onSound: (tone) => sound.play(tone) });

const views = {
  landing: $('#view-landing'),
  report: $('#view-report'),
  compare: $('#view-compare'),
  list: $('#view-list'),
};

function showView(name) {
  Object.entries(views).forEach(([key, node]) => {
    node.hidden = key !== name;
  });
  document.querySelectorAll('.navlink').forEach((link) => {
    const target = link.getAttribute('href');
    const map = { '#/': 'landing', '#/list': 'list', '#/compare': 'compare' };
    const expected = map[target];
    if (expected === name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/* ---------------- shared view context ---------------- */
const ctx = {
  store,
  tmdb,
  sound,
  theme,
  toast,
  go: (path) => router.go(path),
  openMovie: (id) => router.go(`/m/${encodeURIComponent(id)}`),
  resolveQuery: (query) => router.go(`/q/${encodeURIComponent(query)}`),
  refresh: () => router.dispatch(),
  refreshChrome: syncChrome,
  refreshSettings: syncChrome,
  applyMotion: () => theme.apply(),
  syncSound,
  openSettings: () => openSettings(ctx),
  openShortcuts: () => openShortcuts(),
  toggleMotion: () => {
    store.setSetting('reduceMotion', !store.settings.reduceMotion);
    theme.apply();
  },
};

/* ---------------- chrome ---------------- */
function syncChrome() {
  const count = store.watchlist.length;
  const badge = $('#nav-watchlist-count');
  badge.hidden = count === 0;
  badge.textContent = String(count);

  const soundBtn = $('#sound-toggle');
  soundBtn.setAttribute('aria-pressed', String(Boolean(store.settings.sound)));

  $('#footer-source').textContent = store.hasKey()
    ? `${catalogSize()} bundled + live TMDb`
    : `${catalogSize()} films bundled · works offline`;
}

function syncSound() {
  $('#sound-toggle').setAttribute('aria-pressed', String(Boolean(store.settings.sound)));
}

/* ---------------- analysis progress ---------------- */
let scanTimer = null;
let scanToken = 0;

function stopScan() {
  if (scanTimer !== null) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
}

function startScan(host, label) {
  stopScan();
  const token = ++scanToken;
  const steps = SCAN_STEPS.map((text) =>
    h('div', { class: 'progress__step', 'data-state': 'idle' },
      h('span', { class: 'tick', 'aria-hidden': 'true' }, '○'), h('span', {}, text)));

  const fill = h('div', { class: 'progress__fill' });
  const node = h('div', { class: 'progress', role: 'status', 'aria-live': 'polite' },
    h('p', { class: 'eyebrow' }, 'CineScope analysis'),
    h('h2', { class: 'progress__title' }, label),
    h('div', { class: 'progress__bar' }, fill),
    h('div', { class: 'progress__steps' }, ...steps),
  );
  mount(host, node);

  let index = 0;
  const advance = () => {
    if (index >= steps.length) return;
    steps[index].setAttribute('data-state', 'active');
    steps[index].firstChild.textContent = '◐';
    if (index > 0) {
      steps[index - 1].setAttribute('data-state', 'done');
      steps[index - 1].firstChild.textContent = '✓';
    }
    fill.style.width = `${((index + 1) / steps.length) * 100}%`;
    sound.play('tick');
    index += 1;
  };

  advance();
  scanTimer = setInterval(() => {
    if (index < steps.length - 1) advance();
  }, 260);

  return () => {
    // A newer scan owns the timer now — never clear someone else's.
    if (token !== scanToken) return;
    stopScan();
    steps.forEach((step) => {
      step.setAttribute('data-state', 'done');
      step.firstChild.textContent = '✓';
    });
    fill.style.width = '100%';
  };
}

/* ---------------- report rendering with the content gate ---------------- */
const acknowledged = new Set();

function presentReport(report) {
  showView('report');
  const finish = () => {
    renderReport(views.report, ctx, report);
    store.pushHistory(report);
    store.setLastReport(report);
    syncChrome();
    sound.play('verdict');
  };

  const { advisory, movie } = report;
  if (advisory.needsGate && !acknowledged.has(movie.id)) {
    openGate({
      icon: '⚠️',
      title: `${movie.title} has extreme content`,
      body: `${advisory.headline} This analysis includes descriptions of that content. Continue?`,
      confirmLabel: 'Show the analysis',
      cancelLabel: 'Back to discover',
      onConfirm: () => {
        acknowledged.add(movie.id);
        finish();
      },
      onCancel: () => router.go('/'),
    });
    return;
  }
  finish();
}

let analysisToken = 0;

async function handleAnalysis(input, { byId = false } = {}) {
  const token = ++analysisToken;
  showView('report');
  const started = Date.now();
  const done = startScan(views.report, byId ? 'Loading your film…' : `Analyzing “${input.slice(0, 48)}”…`);

  try {
    const report = byId
      ? await resolveById(input, { tmdb, settings: store.settings })
      : await resolveInput(input, { tmdb, settings: store.settings });

    // The user navigated away mid-flight: drop this result.
    if (token !== analysisToken) return;

    const elapsed = Date.now() - started;
    if (elapsed < MIN_SCAN_MS) await new Promise((resolve) => setTimeout(resolve, MIN_SCAN_MS - elapsed));
    if (token !== analysisToken) return;
    done();
    presentReport(report);

    if (!byId && report.movie.id !== input) {
      globalThis.history.replaceState(null, '', `#/m/${encodeURIComponent(report.movie.id)}`);
    }
  } catch (error) {
    if (token !== analysisToken) return;
    stopScan();
    const suggestions = error.extra?.suggestions ?? [];
    mount(views.report,
      h('div', { class: 'report' },
        h('button', { class: 'btn btn--sm btn--ghost', type: 'button', onclick: () => router.go('/') }, '← Back to discover'),
        h('div', { class: 'state' },
          h('div', { class: 'state__icon' }, error.code === 'opaque-link' ? '🔗' : '🎞️'),
          h('h3', { class: 'state__title' }, 'Could not analyze that'),
          h('p', { class: 'state__body' }, error.message),
          suggestions.length
            ? h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap', justifyContent: 'center' } },
              h('span', { class: 'muted' }, 'Did you mean'),
              ...suggestions.map((title) => h('button', {
                class: 'chip chip--accent',
                type: 'button',
                onclick: () => router.go(`/q/${encodeURIComponent(title)}`),
              }, title)))
            : null,
          h('div', { class: 'row', style: { gap: '8px', marginTop: '6px' } },
            h('button', { class: 'btn btn--primary', type: 'button', onclick: () => openSettings(ctx) }, 'Add a TMDb key'),
            h('button', { class: 'btn', type: 'button', onclick: () => router.go('/') }, 'Back to discover'),
          ),
        ),
      ));
    toast(error.message, { tone: 'error', duration: 5000 });
  }
}

/* ---------------- router ---------------- */
const router = createRouter({
  routes: [
    {
      path: '/',
      onEnter: () => {
        showView('landing');
        renderLanding(views.landing, ctx);
      },
    },
    {
      path: '/m/:id',
      onEnter: ({ params }) => handleAnalysis(params.id, { byId: true }),
    },
    {
      path: '/q/:query',
      onEnter: ({ params }) => handleAnalysis(params.query),
    },
    {
      path: '/compare',
      onEnter: () => {
        showView('compare');
        renderCompare(views.compare, ctx);
      },
    },
    {
      path: '/list',
      onEnter: () => {
        showView('list');
        renderWatchlist(views.list, ctx);
      },
    },
  ],
  onNotFound: () => router.go('/'),
});

/* ---------------- global keyboard ---------------- */
let palette = null;
let chord = null;

document.addEventListener('keydown', (event) => {
  const target = event.target;
  const typing = target instanceof HTMLElement
    && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    && !target.classList.contains('palette__input');

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    palette?.open();
    return;
  }

  if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

  if (chord === 'g') {
    chord = null;
    const map = { d: '/', w: '/list', c: '/compare' };
    const path = map[event.key.toLowerCase()];
    if (path) {
      event.preventDefault();
      router.go(path);
    }
    return;
  }

  switch (event.key.toLowerCase()) {
    case 'g':
      chord = 'g';
      setTimeout(() => { chord = null; }, 900);
      break;
    case '/':
      event.preventDefault();
      palette?.open();
      break;
    case 's':
      event.preventDefault();
      openSettings(ctx);
      break;
    case 'r':
      event.preventDefault();
      router.go('/');
      setTimeout(() => $('#hero-search')?.focus(), 60);
      break;
    case 't':
      event.preventDefault();
      theme.toggle();
      break;
    case 'w': {
      event.preventDefault();
      const report = store.state.lastReport;
      if (!report) {
        toast('Open a film first, then press W to save it.');
        break;
      }
      const { added } = store.toggleWatchlist(report);
      syncChrome();
      toast(added ? `Saved ${report.movie.title}` : `Removed ${report.movie.title}`, { tone: added ? 'success' : 'info' });
      break;
    }
    case '?':
      event.preventDefault();
      openShortcuts();
      break;
    default:
      break;
  }
});

/* ---------------- PWA ---------------- */
let deferredPrompt = null;

globalThis.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  const button = $('#install-btn');
  button.hidden = false;
  button.textContent = '⬇️';
  button.title = 'Install CineScope';
});

$('#install-btn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $('#install-btn').hidden = true;
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  globalThis.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is a bonus, not a requirement */
    });
  });
}

/* ---------------- boot ---------------- */
$('#search-trigger').addEventListener('click', () => palette.open());
$('#settings-btn').addEventListener('click', () => openSettings(ctx));
$('#footer-shortcuts').addEventListener('click', () => openShortcuts());
$('#footer-privacy').addEventListener('click', () => openSettings(ctx));
$('#sound-toggle').addEventListener('click', () => {
  const next = !store.settings.sound;
  store.setSetting('sound', next);
  syncSound();
  if (next) sound.play('success');
});

document.querySelectorAll('[data-nav]').forEach((link) => {
  link.addEventListener('click', () => {
    if (link.getAttribute('href') === globalThis.location.hash) router.dispatch();
  });
});

palette = createPalette(ctx);
store.bus.on('settings', syncChrome);
store.bus.on('watchlist', syncChrome);
syncChrome();
router.start();

if (!isPersistent()) {
  toast('This browser blocks local storage, so your watchlist will not be kept.', { tone: 'warn', duration: 6000 });
}

globalThis.cinescope = { store, router, tmdb, theme, sound, ctx };
