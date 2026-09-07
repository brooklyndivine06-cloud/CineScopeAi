/**
 * Numeric helpers. Pure — no DOM, no side effects.
 */

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const round = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);

export const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

/**
 * Average of `{ value, weight }` entries, ignoring missing values and
 * re-normalising across whatever weights survived.
 */
export function weightedAverage(entries) {
  let total = 0;
  let weight = 0;
  for (const entry of entries) {
    if (!entry || !isFiniteNumber(entry.value) || !isFiniteNumber(entry.weight) || entry.weight <= 0) continue;
    total += entry.value * entry.weight;
    weight += entry.weight;
  }
  return weight === 0 ? null : total / weight;
}

/** Coverage of a 0..1 weighted set: how much of the possible weight is present. */
export function weightedCoverage(entries) {
  let present = 0;
  let total = 0;
  for (const entry of entries) {
    if (!entry || !isFiniteNumber(entry.weight) || entry.weight <= 0) continue;
    total += entry.weight;
    if (isFiniteNumber(entry.value)) present += entry.weight;
  }
  return total === 0 ? 0 : present / total;
}

/** "$1.5M", "$320.4K" — compact money for tight UI slots. */
export function formatMoney(value, currency = '$') {
  if (!isFiniteNumber(value) || value <= 0) return null;
  if (value >= 1e9) return `${currency}${round(value / 1e9, 2)}B`;
  if (value >= 1e6) return `${currency}${round(value / 1e6, 1)}M`;
  if (value >= 1e3) return `${currency}${Math.round(value / 1e3)}K`;
  return `${currency}${Math.round(value)}`;
}

/** "2h 29m" from minutes. */
export function formatRuntime(minutes) {
  if (!isFiniteNumber(minutes) || minutes <= 0) return null;
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** "1.2M", "48.5K" — compact counts. */
export function formatCount(value) {
  if (!isFiniteNumber(value) || value < 0) return null;
  if (value >= 1e6) return `${round(value / 1e6, 1)}M`;
  if (value >= 1e3) return `${round(value / 1e3, 1)}K`;
  return `${Math.round(value)}`;
}

/** Percentage of change, signed: +12 / -4. */
export function formatDelta(value, digits = 0) {
  if (!isFiniteNumber(value)) return null;
  const rounded = round(value, digits);
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

/** Deterministic 0..1 pseudo-random from a string. Stable across sessions. */
export function seededUnit(seed) {
  const text = String(seed ?? '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 100000) / 100000;
}

/** Deterministic integer in [min, max] from a string seed. */
export function seededInt(seed, min, max) {
  if (max < min) return min;
  return min + Math.floor(seededUnit(seed) * (max - min + 1)) % (max - min + 1);
}
