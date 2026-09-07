/**
 * Defensive storage wrapper. Falls back to an in-memory map when localStorage
 * is unavailable (private mode, sandboxed iframe, disabled cookies).
 */

const NAMESPACE = 'cinescope.v2';

/** Storage-shaped in-memory fallback (getItem/setItem/removeItem/key/length). */
const memory = {
  map: new Map(),
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  },
  setItem(key, value) {
    this.map.set(key, String(value));
  },
  removeItem(key) {
    this.map.delete(key);
  },
  key(index) {
    return Array.from(this.map.keys())[index] ?? null;
  },
  get length() {
    return this.map.size;
  },
};

let backend = null;

function resolveBackend() {
  if (backend) return backend;
  try {
    const probe = '__cinescope_probe__';
    globalThis.localStorage.setItem(probe, '1');
    globalThis.localStorage.removeItem(probe);
    backend = globalThis.localStorage;
  } catch {
    backend = memory;
  }
  return backend;
}

const key = (name) => `${NAMESPACE}.${name}`;

export function read(name, fallback = null) {
  const store = resolveBackend();
  try {
    const raw = store.getItem ? store.getItem(key(name)) : null;
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function write(name, value) {
  const store = resolveBackend();
  try {
    store.setItem(key(name), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(name) {
  const store = resolveBackend();
  try {
    store.removeItem(key(name));
  } catch {
    /* nothing to do */
  }
}

export function readList(name) {
  const value = read(name, []);
  return Array.isArray(value) ? value : [];
}

export function clearAll() {
  const store = resolveBackend();
  const doomed = [];
  if (store === memory) {
    for (const k of [...memory.map.keys()]) if (k.startsWith(NAMESPACE)) memory.map.delete(k);
    return;
  }
  for (let i = 0; i < store.length; i += 1) {
    const k = store.key(i);
    if (k && k.startsWith(NAMESPACE)) doomed.push(k);
  }
  doomed.forEach((k) => store.removeItem(k));
}

/** True when persistence actually survived a write — used to warn in the UI. */
export function isPersistent() {
  return resolveBackend() !== memory;
}
