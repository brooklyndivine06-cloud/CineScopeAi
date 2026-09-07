/** Settings modal: data source, content tolerance, appearance, data controls. */
import { h } from './dom.js';
import { openModal } from './modal.js';
import { DEFAULT_SETTINGS } from '../core/store.js';

const REGIONS = ['US', 'GB', 'CA', 'AU', 'IN', 'DE', 'FR', 'BR', 'JP', 'NG', 'ZA', 'MX'];
const ACCENTS = [
  { id: 'amber', label: 'Amber', color: '#f0b429' },
  { id: 'teal', label: 'Teal', color: '#2dd4bf' },
  { id: 'rose', label: 'Rose', color: '#fb7185' },
  { id: 'violet', label: 'Violet', color: '#a78bfa' },
  { id: 'lime', label: 'Lime', color: '#a3e635' },
  { id: 'ice', label: 'Ice', color: '#7dd3fc' },
];
const TOLERANCE = [
  { rank: 1, label: 'Low', desc: 'Family-safe only' },
  { rank: 2, label: 'Moderate', desc: 'Some violence/language' },
  { rank: 3, label: 'High', desc: 'Graphic content ok' },
  { rank: 4, label: 'Extreme', desc: 'Nothing off-limits' },
];

function segmented(options, current, onPick) {
  return h('div', { class: 'seg', role: 'group' },
    ...options.map((option) => h('button', {
      class: 'seg__btn',
      type: 'button',
      'aria-pressed': String(option.value === current),
      onclick: () => onPick(option.value),
    }, option.label)));
}

function toggleRow({ name, desc, value, onChange }) {
  const button = h('button', { class: 'toggle', type: 'button', role: 'switch', 'aria-pressed': String(Boolean(value)) });
  button.addEventListener('click', () => {
    const next = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(next));
    onChange(next);
  });
  return h('div', { class: 'switch' },
    h('div', { class: 'switch__text' },
      h('span', { class: 'switch__name' }, name),
      desc ? h('span', { class: 'switch__desc' }, desc) : null,
    ),
    button,
  );
}

export function openSettings(ctx) {
  const { store, toast, tmdb } = ctx;
  const settings = store.settings;

  const keyInput = h('input', {
    class: 'input',
    type: 'password',
    value: settings.tmdbKey ?? '',
    placeholder: 'Paste a v3 key or v4 read token',
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-label': 'TMDb API key',
  });

  const status = h('p', { class: 'field__hint' }, settings.tmdbKey ? 'Key saved on this device.' : 'Optional — the bundled catalogue works without one.');

  const testBtn = h('button', {
    class: 'btn btn--sm',
    type: 'button',
    onclick: async () => {
      const key = keyInput.value.trim();
      if (!key) {
        status.textContent = 'Paste a key first.';
        return;
      }
      store.setSetting('tmdbKey', key);
      status.textContent = 'Testing against TMDb…';
      try {
        const results = await tmdb.trending();
        status.textContent = `Connected — ${results.length} trending titles returned.`;
        toast('TMDb key works', { tone: 'success' });
      } catch (error) {
        status.textContent = `Failed: ${error.message}`;
        toast('That key did not work', { tone: 'error' });
      }
    },
  }, 'Test key');

  const keySection = h('div', { class: 'panel panel--flat panel--tight' },
    h('div', { class: 'panel__head' }, h('h3', { class: 'panel__title' }, '🔑 Full catalogue (optional)'),
      h('span', { class: 'panel__hint' }, store.hasKey() ? 'Live' : 'Offline')),
    h('p', { class: 'field__hint' },
      'CineScope ships with a curated catalogue so it works with no account and no network. Add a free TMDb key to search every film ever made.'),
    h('ol', { class: 'bulleted', style: { margin: '8px 0 12px' } },
      h('li', {}, 'Create a free account at themoviedb.org'),
      h('li', {}, 'Settings → API → request a key (instant)'),
      h('li', {}, 'Paste the v4 read token or v3 key below')),
    h('div', { class: 'field' },
      h('div', { class: 'row', style: { gap: '8px' } }, keyInput, testBtn),
      status,
    ),
    h('div', { class: 'field', style: { marginTop: '12px' } },
      h('label', { class: 'field__label', for: 'region-select' }, 'Streaming region'),
      h('select', {
        class: 'select',
        id: 'region-select',
        onchange: (event) => {
          store.setSetting('region', event.target.value);
          toast(`Availability set to ${event.target.value}`);
        },
      }, ...REGIONS.map((code) => h('option', { value: code, selected: code === settings.region }, code))),
      h('span', { class: 'field__hint' }, 'Used for live “where to watch” providers.'),
    ),
  );

  const toleranceSection = h('div', { class: 'panel panel--flat panel--tight' },
    h('div', { class: 'panel__head' }, h('h3', { class: 'panel__title' }, '🚦 Content tolerance')),
    h('p', { class: 'field__hint' }, 'Anything above this gets called out on the report page.'),
    h('div', { style: { marginTop: '10px' } },
      segmented(
        TOLERANCE.map((level) => ({ value: level.rank, label: level.label })),
        settings.tolerance,
        (value) => {
          store.setSetting('tolerance', value);
          toast(`Tolerance set to ${TOLERANCE.find((l) => l.rank === value).label.toLowerCase()} and above is flagged`, { tone: 'success' });
          ctx.refresh?.();
        },
      ),
    ),
    h('p', { class: 'field__hint', style: { marginTop: '8px' } },
      TOLERANCE.find((level) => level.rank === settings.tolerance)?.desc ?? ''),
  );

  const appearanceSection = h('div', { class: 'panel panel--flat panel--tight' },
    h('div', { class: 'panel__head' }, h('h3', { class: 'panel__title' }, '🎨 Appearance')),
    h('div', { class: 'field' },
      h('span', { class: 'field__label' }, 'Theme'),
      segmented(
        [{ value: 'auto', label: 'Auto' }, { value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }],
        settings.theme,
        (value) => { store.setSetting('theme', value); ctx.refresh?.(); },
      ),
    ),
    h('div', { class: 'field', style: { marginTop: '12px' } },
      h('span', { class: 'field__label' }, 'Accent'),
      h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } },
        ...ACCENTS.map((accent) => h('button', {
          class: 'chip',
          type: 'button',
          'aria-pressed': String(settings.accent === accent.id),
          style: {
            borderColor: settings.accent === accent.id ? accent.color : undefined,
            color: settings.accent === accent.id ? accent.color : undefined,
          },
          onclick: () => {
            store.setSetting('accent', accent.id);
            ctx.refreshSettings?.();
            ctx.refresh?.();
          },
        }, accent.label))),
    ),
    h('div', { style: { marginTop: '12px' } },
      toggleRow({
        name: 'Reduce motion',
        desc: 'Turns off sweeps, fades and chart animations',
        value: settings.reduceMotion,
        onChange: (value) => { store.setSetting('reduceMotion', value); ctx.applyMotion?.(); },
      }),
      toggleRow({
        name: 'Interface sound',
        desc: 'Short blips on actions and verdicts',
        value: settings.sound,
        onChange: (value) => {
          store.setSetting('sound', value);
          ctx.syncSound?.();
          if (value) ctx.sound?.play('success');
        },
      }),
      toggleRow({
        name: 'Full synopses',
        desc: 'Show complete overviews instead of trimmed ones',
        value: settings.spoilers,
        onChange: (value) => { store.setSetting('spoilers', value); ctx.refresh?.(); },
      }),
    ),
  );

  const dataSection = h('div', { class: 'panel panel--flat panel--tight' },
    h('div', { class: 'panel__head' }, h('h3', { class: 'panel__title' }, '🗄️ Your data')),
    h('p', { class: 'field__hint' },
      `${store.watchlist.length} saved titles · ${store.history.length} analyzed · all stored in this browser. Nothing is sent to a server.`),
    h('div', { class: 'row', style: { gap: '8px', marginTop: '10px', flexWrap: 'wrap' } },
      h('a', { class: 'btn btn--sm', href: '#/list' }, 'Open watchlist'),
      h('button', {
        class: 'btn btn--sm',
        type: 'button',
        onclick: () => { store.clearHistory(); toast('History cleared'); ctx.refresh?.(); },
      }, 'Clear history'),
      h('button', {
        class: 'btn btn--sm btn--danger',
        type: 'button',
        onclick: () => {
          store.wipeAll();
          toast('All local data reset', { tone: 'warn' });
          ctx.refresh?.();
        },
      }, 'Reset everything'),
    ),
  );

  let modal;
  modal = openModal({
    title: 'Settings',
    subtitle: 'Everything here is stored locally in your browser.',
    body: [keySection, toleranceSection, appearanceSection, dataSection],
    footer: [
      h('button', {
        class: 'btn btn--ghost',
        type: 'button',
        onclick: () => {
          store.resetSettings();
          toast('Settings restored to defaults');
          ctx.refresh?.();
          ctx.refreshSettings?.();
        },
      }, 'Restore defaults'),
      h('button', { class: 'btn btn--primary', type: 'button', onclick: () => modal.close() }, 'Done'),
    ],
    onClose: () => ctx.refresh?.(),
  });
}

export { DEFAULT_SETTINGS };
