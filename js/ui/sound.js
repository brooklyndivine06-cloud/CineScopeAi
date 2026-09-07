/**
 * Optional interface sound. Off by default, never autoplayed before a gesture,
 * and torn down between plays so we do not accumulate audio contexts.
 */
export function createSound(store) {
  let ctx = null;

  const ensure = () => {
    if (!store.settings.sound) return null;
    const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };

  const blip = (freq, duration = 0.08, type = 'sine', gain = 0.05) => {
    const audio = ensure();
    if (!audio) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    amp.gain.setValueAtTime(0.0001, audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(gain, audio.currentTime + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    osc.connect(amp).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration + 0.02);
  };

  const patterns = {
    info: () => blip(520, 0.07),
    success: () => { blip(660, 0.07); setTimeout(() => blip(880, 0.09), 70); },
    warn: () => { blip(320, 0.1, 'triangle'); },
    error: () => { blip(220, 0.14, 'sawtooth', 0.035); },
    tick: () => blip(880, 0.03, 'sine', 0.025),
    verdict: () => { blip(523, 0.1); setTimeout(() => blip(784, 0.12), 90); setTimeout(() => blip(1047, 0.16), 190); },
  };

  return {
    play(name = 'info') {
      if (!store.settings.sound) return;
      (patterns[name] ?? patterns.info)();
    },
  };
}
