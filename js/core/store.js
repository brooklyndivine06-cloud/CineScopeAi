/**
 * Application store: settings, watchlist, history and compare slots, all
 * persisted and all broadcast through one emitter so views stay decoupled.
 */
import { createEmitter } from './emitter.js';
import * as storage from '../utils/storage.js';

export const DEFAULT_SETTINGS = {
  tmdbKey: '',
  region: 'US',
  /** Max advisory rank a viewer is happy with: 1 low, 2 moderate, 3 high, 4 extreme. */
  tolerance: 3,
  theme: 'auto',
  accent: 'amber',
  reduceMotion: false,
  sound: false,
  spoilers: false,
  dataSaver: false,
};

const HISTORY_LIMIT = 24;

export function createStore() {
  const bus = createEmitter();
  const persistedSettings = storage.read('settings', {}) ?? {};

  const state = {
    settings: { ...DEFAULT_SETTINGS, ...persistedSettings },
    watchlist: storage.readList('watchlist'),
    history: storage.readList('history'),
    compare: storage.readList('compare').slice(0, 2),
    lastReport: null,
  };

  const emitSettings = () => bus.emit('settings', state.settings);

  return {
    bus,
    state,

    get settings() {
      return state.settings;
    },
    get watchlist() {
      return state.watchlist;
    },
    get history() {
      return state.history;
    },
    get compare() {
      return state.compare;
    },

    /* ---------------- settings ---------------- */
    setSetting(key, value) {
      if (!(key in DEFAULT_SETTINGS)) return;
      state.settings[key] = value;
      storage.write('settings', state.settings);
      bus.emit(`setting:${key}`, value);
      emitSettings();
    },
    patchSettings(patch) {
      Object.entries(patch).forEach(([key, value]) => {
        if (key in DEFAULT_SETTINGS) state.settings[key] = value;
      });
      storage.write('settings', state.settings);
      emitSettings();
    },
    resetSettings() {
      state.settings = { ...DEFAULT_SETTINGS };
      storage.write('settings', state.settings);
      emitSettings();
    },
    hasKey: () => Boolean(String(state.settings.tmdbKey ?? '').trim()),

    /* ---------------- watchlist ---------------- */
    inWatchlist(id) {
      return state.watchlist.some((entry) => entry.id === id);
    },
    toggleWatchlist(report) {
      const movie = report.movie ?? report;
      const entry = {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        score: report.score?.score ?? null,
        verdict: report.score?.verdict?.label ?? null,
        poster: movie.poster ?? null,
        addedAt: new Date().toISOString(),
      };
      if (this.inWatchlist(movie.id)) {
        state.watchlist = state.watchlist.filter((item) => item.id !== movie.id);
        storage.write('watchlist', state.watchlist);
        bus.emit('watchlist', { list: state.watchlist, removed: entry });
        return { added: false, entry };
      }
      state.watchlist = [entry, ...state.watchlist];
      storage.write('watchlist', state.watchlist);
      bus.emit('watchlist', { list: state.watchlist, added: entry });
      return { added: true, entry };
    },
    clearWatchlist() {
      state.watchlist = [];
      storage.write('watchlist', state.watchlist);
      bus.emit('watchlist', { list: state.watchlist, cleared: true });
    },

    /* ---------------- history ---------------- */
    pushHistory(report) {
      const movie = report.movie ?? report;
      const entry = {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        score: report.score?.score ?? null,
        poster: movie.poster ?? null,
        at: new Date().toISOString(),
      };
      state.history = [entry, ...state.history.filter((item) => item.id !== entry.id)].slice(0, HISTORY_LIMIT);
      storage.write('history', state.history);
      bus.emit('history', state.history);
    },
    clearHistory() {
      state.history = [];
      storage.write('history', state.history);
      bus.emit('history', state.history);
    },

    /* ---------------- compare ---------------- */
    setCompareSlot(slot, id) {
      const next = [...state.compare];
      next[slot] = id;
      state.compare = next.filter(Boolean).slice(0, 2);
      storage.write('compare', state.compare);
      bus.emit('compare', state.compare);
    },
    clearCompare() {
      state.compare = [];
      storage.write('compare', state.compare);
      bus.emit('compare', state.compare);
    },

    /* ---------------- misc ---------------- */
    setLastReport(report) {
      state.lastReport = report;
      bus.emit('report', report);
    },
    wipeAll() {
      state.settings = { ...DEFAULT_SETTINGS };
      state.watchlist = [];
      state.history = [];
      state.compare = [];
      state.lastReport = null;
      storage.clearAll();
      bus.emit('reset');
      emitSettings();
    },
  };
}
