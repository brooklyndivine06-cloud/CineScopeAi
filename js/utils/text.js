/**
 * Text helpers. Pure — no DOM.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'of', 'on',
  'or', 'the', 'to', 'with', 'la', 'le', 'les', 'el', 'der', 'die', 'das', 'il', 'di',
]);

export const stripDiacritics = (value) =>
  String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const lowercase = (value) => stripDiacritics(value).toLowerCase();

export const slugify = (value) =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/** Searchable normalisation used by every matcher in the app. */
export function normalizeForSearch(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const titleCase = (value) =>
  String(value ?? '').replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));

/**
 * Human joining with an Oxford-comma-free tail: ["a","b","c"] -> "a, b, c".
 * Empty entries are dropped.
 */
export function joinList(items, separator = ', ', limit = 0) {
  const clean = (items ?? []).filter((item) => item !== null && item !== undefined && `${item}`.length > 0);
  const sliced = limit > 0 ? clean.slice(0, limit) : clean;
  return sliced.join(separator);
}

export function truncate(value, max = 160) {
  const text = String(value ?? '').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\s]+$/, '')}…`;
}

/** First letters of up to `count` words — for procedural poster monograms. */
export function initials(value, count = 2) {
  const words = String(value ?? '').split(/\s+/).filter((w) => w && !STOP_WORDS.has(lowercase(w)));
  const source = words.length ? words : String(value ?? '').split(/\s+/).filter(Boolean);
  return source.slice(0, count).map((w) => w[0].toUpperCase()).join('');
}

/** Sentence list -> one readable sentence. */
export function toSentence(parts) {
  const clean = (parts ?? []).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return `${clean[0]}`;
  return `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`;
}

/** Percent word for accessibility labels: 84 -> "84 percent". */
export const percentWord = (value) => `${Math.round(Number(value) || 0)} percent`;

export function dedupe(items, keyFn = (item) => item) {
  const seen = new Set();
  const out = [];
  for (const item of items ?? []) {
    const key = keyFn(item);
    if (key === null || key === undefined || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
