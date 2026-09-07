/**
 * Tiny hyperscript. Every piece of dynamic text lands in `textContent`, so data
 * coming from remote APIs can never inject markup.
 */

const SVG_TAGS = new Set([
  'svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'tspan',
  'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'use', 'filter',
  'feTurbulence', 'feGaussianBlur', 'ellipse', 'title', 'desc', 'foreignObject', 'pattern',
]);

const SVG_NS = 'http://www.w3.org/2000/svg';

function classValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(' ');
  return Object.entries(value)
    .filter(([, on]) => on)
    .map(([name]) => name)
    .join(' ');
}

function applyProps(node, props, isSvg) {
  for (const [name, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (name === 'class' || name === 'className') node.setAttribute('class', classValue(value));
    else if (name === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (name === 'dataset') Object.assign(node.dataset, value);
    else if (name === 'text') node.textContent = String(value);
    else if (name === 'html') node.innerHTML = value; // only for static, authored markup
    else if (name.startsWith('on') && typeof value === 'function') {
      node.addEventListener(name.slice(2).toLowerCase(), value);
    } else if (name === 'aria' && typeof value === 'object') {
      Object.entries(value).forEach(([k, v]) => node.setAttribute(`aria-${k}`, v));
    } else if (isSvg || !name.includes('-')) node.setAttribute(name, value === true ? '' : value);
    else node.setAttribute(name, value === true ? '' : value);
  }
}

function append(node, children, isSvg) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === true) continue;
    if (child instanceof Node) node.appendChild(child);
    else node.appendChild(document.createTextNode(String(child)));
  }
  return node;
}

export function h(tag, props = {}, ...children) {
  const isSvg = SVG_TAGS.has(tag);
  const node = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  applyProps(node, props, isSvg);
  return append(node, children, isSvg);
}

/** Same builder, but always SVG namespace (for tags like `title`). */
export const svg = (tag, props = {}, ...children) => {
  const node = document.createElementNS(SVG_NS, tag);
  applyProps(node, props, true);
  return append(node, children, true);
};

export const frag = (...children) => append(document.createDocumentFragment(), children);

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function clear(node) {
  if (!node) return node;
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Replace contents atomically-ish and return the host. */
export function mount(node, ...children) {
  if (!node) return node;
  clear(node);
  return append(node, children, false);
}

/**
 * Run `fn` on the next frame — lets CSS transitions animate from their initial
 * state (ring strokes, bars, meters) instead of snapping.
 */
export function nextFrame(fn) {
  const raf = globalThis.requestAnimationFrame ?? ((cb) => setTimeout(cb, 16));
  raf(() => fn());
}

export function on(node, event, handler, options) {
  node?.addEventListener(event, handler, options);
  return () => node?.removeEventListener(event, handler, options);
}

/** Debounce trailing-edge calls. */
export function debounce(fn, wait = 160) {
  let timer = null;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  wrapped.cancel = () => clearTimeout(timer);
  return wrapped;
}

/** Focus trap helper for modals; returns a teardown function. */
export function trapFocus(container) {
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const handler = (event) => {
    if (event.key !== 'Tab') return;
    const nodes = Array.from(container.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}
