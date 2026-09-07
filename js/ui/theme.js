/** Theme, accent and motion preferences applied to <html>. */
export function createTheme(store) {
  const root = document.documentElement;
  const media = globalThis.matchMedia?.('(prefers-color-scheme: light)');

  const resolve = () => {
    const pref = store.settings.theme;
    if (pref !== 'auto') return pref;
    return media?.matches ? 'light' : 'dark';
  };

  const apply = () => {
    root.setAttribute('data-theme', resolve());
    root.setAttribute('data-theme-pref', store.settings.theme);
    root.setAttribute('data-accent', store.settings.accent);
    root.setAttribute('data-motion', store.settings.reduceMotion ? 'off' : 'on');
    const color = getComputedStyle(root).getPropertyValue('--surface-0').trim() || '#08090d';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  };

  media?.addEventListener?.('change', () => { if (store.settings.theme === 'auto') apply(); });
  store.bus.on('settings', apply);
  apply();

  return {
    apply,
    current: resolve,
    toggle() {
      store.setSetting('theme', resolve() === 'dark' ? 'light' : 'dark');
    },
  };
}
