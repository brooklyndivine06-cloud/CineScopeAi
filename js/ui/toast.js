/** Toast queue with optional action + sound hook. */
import { h, mount } from './dom.js';

let host = null;
let sound = null;

export function initToasts({ container, onSound } = {}) {
  host = container ?? document.getElementById('toast-stack');
  if (onSound) sound = onSound;
}

export function toast(message, options = {}) {
  const { tone = 'info', action, duration = 3600 } = options;
  if (!host) return;

  const icons = { info: 'ℹ️', success: '✓', error: '⚠️', warn: '⚠️' };
  const node = h('div', { class: 'toast', role: 'status' },
    h('span', { 'aria-hidden': 'true' }, icons[tone] ?? icons.info),
    h('span', {}, message),
    action
      ? h('button', {
        class: 'btn btn--sm btn--ghost toast__action',
        type: 'button',
        onclick: () => {
          action.onClick?.();
          dismiss();
        },
      }, action.label)
      : null,
  );

  const dismiss = () => {
    node.classList.add('toast--out');
    setTimeout(() => node.remove(), 220);
  };

  mount(host, ...[...host.children, node]);
  sound?.(tone);

  const timer = setTimeout(dismiss, duration);
  node.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    clearTimeout(timer);
    dismiss();
  });

  return dismiss;
}
