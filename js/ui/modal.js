/** Modal shell with focus trap, Esc-to-close and restore-focus. */
import { h, mount, clear, trapFocus } from './dom.js';

export function openModal({ title, subtitle, body, footer, root, onClose }) {
  const host = root ?? document.getElementById('modal-root');
  const previous = document.activeElement;

  const panelNode = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'modal__head' },
      h('div', {},
        h('h2', { class: 'modal__title' }, title),
        subtitle ? h('p', { class: 'modal__sub' }, subtitle) : null,
      ),
      h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Close', onclick: () => close() }, '✕'),
    ),
    h('div', { class: 'modal__body' }, ...(Array.isArray(body) ? body : [body])),
    footer ? h('div', { class: 'modal__foot' }, ...footer) : null,
  );

  const releaseTrap = trapFocus(panelNode);

  const onKey = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  };

  const onBackdrop = (event) => {
    if (event.target === host) close();
  };

  function close() {
    releaseTrap();
    document.removeEventListener('keydown', onKey, true);
    host.removeEventListener('mousedown', onBackdrop);
    clear(host);
    host.hidden = true;
    previous?.focus?.();
    onClose?.();
  }

  host.addEventListener('mousedown', onBackdrop);
  document.addEventListener('keydown', onKey, true);
  host.hidden = false;
  mount(host, panelNode);

  const focusable = panelNode.querySelector('input, select, textarea, button');
  focusable?.focus();

  return { close, panel: panelNode };
}

/** Full-screen confirmation / warning gate. */
export function openGate({ icon = '⚠️', title, body, confirmLabel = 'Continue', cancelLabel = 'Go back', onConfirm, onCancel }) {
  const host = document.getElementById('gate-root');
  const close = () => {
    clear(host);
    host.hidden = true;
  };

  host.hidden = false;
  mount(host, h('div', { class: 'gate', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'gate__icon', 'aria-hidden': 'true' }, icon),
    h('h2', { class: 'gate__title' }, title),
    h('p', { class: 'gate__body' }, body),
    h('div', { class: 'row', style: { gap: '8px', marginTop: '10px' } },
      h('button', {
        class: 'btn btn--primary',
        type: 'button',
        onclick: () => {
          close();
          onConfirm?.();
        },
      }, confirmLabel),
      h('button', {
        class: 'btn',
        type: 'button',
        onclick: () => {
          close();
          onCancel?.();
        },
      }, cancelLabel),
    ),
  ));

  host.querySelector('button')?.focus();
  return close;
}
