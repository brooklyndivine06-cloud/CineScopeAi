/** jsdom harness so the real browser modules can run under `node --test`. */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

export function setupDom({ url = 'http://localhost/' } = {}) {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, {
    url,
    // pretendToBeVisual would keep a rAF loop alive and block process exit;
    // drive frames with plain timers instead.
    runScripts: 'outside-only',
  });

  const { window } = dom;

  const timers = new Map();
  let frame = 0;
  window.requestAnimationFrame = (callback) => {
    const id = ++frame;
    timers.set(id, setTimeout(() => { timers.delete(id); callback(Date.now()); }, 16));
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    clearTimeout(timers.get(id));
    timers.delete(id);
  };

  // jsdom leaves these unimplemented; the app only needs them to exist.
  window.Element.prototype.scrollIntoView = function noop() {};
  window.scrollTo = function noop() {};
  window.matchMedia = window.matchMedia ?? (() => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
  window.HTMLCanvasElement.prototype.getContext = function fake() {
    return {
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} }),
      fillRect() {},
      fillText() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      set fillStyle(_v) {},
      set font(_v) {},
      set textAlign(_v) {},
      set strokeStyle(_v) {},
      set lineWidth(_v) {},
    };
  };
  window.HTMLCanvasElement.prototype.toBlob = function fake(cb) {
    cb(new window.Blob(['x'], { type: 'image/png' }));
  };

  const globals = [
    'window', 'document', 'navigator', 'location', 'history', 'localStorage',
    'HTMLElement', 'Element', 'Node', 'Blob', 'File', 'FileReader', 'Event',
    'CustomEvent', 'KeyboardEvent', 'MouseEvent', 'requestAnimationFrame',
    'cancelAnimationFrame', 'getComputedStyle', 'DOMParser',
  ];
  for (const name of globals) {
    if (window[name] === undefined) continue;
    // Node 22 exposes `navigator` as a getter-only global; assign defensively.
    try {
      globalThis[name] = window[name];
    } catch {
      Object.defineProperty(globalThis, name, {
        value: window[name],
        writable: true,
        configurable: true,
      });
    }
  }
  globalThis.window = window;
  globalThis.document = window.document;
  // EventTarget methods must keep their receiver, so bind them explicitly.
  globalThis.addEventListener = window.addEventListener.bind(window);
  globalThis.removeEventListener = window.removeEventListener.bind(window);
  globalThis.dispatchEvent = window.dispatchEvent.bind(window);

  return { dom, window };
}

export const html = (node) => node?.innerHTML ?? '';
export const text = (node) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

export { root };
