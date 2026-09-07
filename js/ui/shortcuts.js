/** Keyboard shortcut reference. */
import { h } from './dom.js';
import { openModal } from './modal.js';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Open search / commands' },
  { keys: ['/'], label: 'Focus the search field' },
  { keys: ['G'], then: ['D'], label: 'Go to discover' },
  { keys: ['G'], then: ['W'], label: 'Go to watchlist' },
  { keys: ['G'], then: ['C'], label: 'Go to compare' },
  { keys: ['S'], label: 'Open settings' },
  { keys: ['R'], label: 'Surprise me' },
  { keys: ['T'], label: 'Toggle light / dark' },
  { keys: ['W'], label: 'Save current film to watchlist' },
  { keys: ['Esc'], label: 'Close any overlay' },
  { keys: ['?'], label: 'This list' },
];

export function openShortcuts() {
  let modal;
  modal = openModal({
    title: 'Keyboard shortcuts',
    subtitle: 'CineScope is fully keyboard-driven.',
    body: [
      h('div', { class: 'panel panel--flat panel--tight' },
        ...SHORTCUTS.map((shortcut) => h('div', { class: 'switch' },
          h('span', { class: 'switch__name' }, shortcut.label),
          h('span', { class: 'row', style: { gap: '4px' } },
            ...[...(shortcut.keys ?? []), ...(shortcut.then ? ['then', ...shortcut.then] : [])].map((key) =>
              key === 'then'
                ? h('span', { class: 'muted', style: { fontSize: '0.75rem' } }, 'then')
                : h('kbd', {}, key)),
          ),
        ))),
    ],
    footer: [h('button', { class: 'btn btn--primary', type: 'button', onclick: () => modal.close() }, 'Got it')],
  });
}
