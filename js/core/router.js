/**
 * Hash router. Hash routing keeps deep links working on static hosting (GitHub
 * Pages, any CDN) with no server rewrites.
 *
 * Routes:  #/            landing
 *          #/m/:id       report
 *          #/compare     compare
 *          #/list        watchlist
 */
export function createRouter({ routes, onNotFound } = {}) {
  let teardown = null;

  const parse = () => {
    const hash = (globalThis.location?.hash ?? '').replace(/^#/, '');
    const path = hash.startsWith('/') ? hash : `/${hash}`;
    const [pathname, search = ''] = path.split('?');
    const segments = pathname.split('/').filter(Boolean);
    return { path: pathname, segments, query: new URLSearchParams(search) };
  };

  const match = () => {
    const { segments, query } = parse();
    for (const route of routes) {
      const routeSegments = route.path.split('/').filter(Boolean);
      if (routeSegments.length !== segments.length) continue;
      const params = {};
      let ok = true;
      routeSegments.forEach((part, index) => {
        if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(segments[index]);
        else if (part !== segments[index]) ok = false;
      });
      if (ok) return { route, params, query };
    }
    return null;
  };

  const dispatch = () => {
    const found = match();
    if (!found) {
      onNotFound?.();
      return;
    }
    const { route, params, query } = found;
    if (route.onExit) route.onExit();
    route.onEnter?.({ params, query });
  };

  const go = (path, options = {}) => {
    const next = path.startsWith('#') ? path : `#${path}`;
    if (globalThis.location.hash === next) {
      dispatch();
      return;
    }
    if (options.replace) globalThis.location.replace(next);
    else globalThis.location.hash = next;
  };

  const start = () => {
    const handler = () => dispatch();
    globalThis.addEventListener('hashchange', handler);
    teardown = () => globalThis.removeEventListener('hashchange', handler);
    dispatch();
  };

  const stop = () => {
    teardown?.();
    teardown = null;
  };

  return { start, stop, go, dispatch, current: parse };
}

export const href = (path) => `#${path}`;
