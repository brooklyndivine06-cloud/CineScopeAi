/** Minimal event emitter — no dependencies, no surprises. */
export function createEmitter() {
  const listeners = new Map();

  return {
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
      return () => listeners.get(event)?.delete(handler);
    },
    once(event, handler) {
      const off = this.on(event, (payload) => {
        off();
        handler(payload);
      });
      return off;
    },
    emit(event, payload) {
      const set = listeners.get(event);
      if (!set) return;
      for (const handler of [...set]) {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[cinescope] listener for "${event}" threw`, error);
        }
      }
    },
    off(event, handler) {
      if (!handler) listeners.delete(event);
      else listeners.get(event)?.delete(handler);
    },
  };
}
