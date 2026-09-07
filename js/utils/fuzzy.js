/**
 * Fuzzy matching used by the command palette and instant search.
 * Pure — no DOM.
 */
import { normalizeForSearch } from './text.js';

const BONUS = {
  WORD_START: 12,
  PREFIX: 18,
  CONTIGUOUS: 4,
  NUMBER_MATCH: 10,
  SHORT_HAYSTACK: 6,
};

/**
 * Subsequence match of `needle` inside `haystack`.
 * Returns `{ score, matches }` where matches are haystack indices that lit up.
 * Score is `null` when the needle is not a subsequence.
 */
export function fuzzyMatch(needle, haystack) {
  const query = normalizeForSearch(needle);
  const target = normalizeForSearch(haystack);
  if (!query) return { score: 0, matches: [] };
  if (!target) return { score: null, matches: [] };

  // Exact / prefix / substring shortcuts get the strongest, most predictable scores.
  const exactIndex = target.indexOf(query);
  if (exactIndex !== -1) {
    const isPrefix = exactIndex === 0;
    const atWord = exactIndex > 0 && target[exactIndex - 1] === ' ';
    let score = 120 - exactIndex * 0.6 + (isPrefix ? BONUS.PREFIX * 2 : 0) + (atWord ? BONUS.WORD_START : 0);
    score += Math.max(0, BONUS.SHORT_HAYSTACK - target.length * 0.08);
    return {
      score,
      matches: Array.from({ length: query.length }, (_, i) => exactIndex + i),
    };
  }

  let score = 0;
  let cursor = 0;
  let contiguous = 0;
  const matches = [];

  for (let qi = 0; qi < query.length; qi += 1) {
    const char = query[qi];
    const found = target.indexOf(char, cursor);
    if (found === -1) return { score: null, matches: [] };

    const atWordStart = found === 0 || target[found - 1] === ' ';
    score += 6;
    if (atWordStart) score += BONUS.WORD_START;
    if (found === cursor && contiguous > 0) {
      contiguous += 1;
      // Capped so a long near-miss cannot outrank an exact substring hit.
      score += BONUS.CONTIGUOUS * Math.min(contiguous, 4);
    } else {
      contiguous = 1;
    }
    if (char === found && /\d/.test(char)) score += BONUS.NUMBER_MATCH;

    matches.push(found);
    cursor = found + 1;
  }

  score += Math.max(0, BONUS.SHORT_HAYSTACK - target.length * 0.08);
  score -= (target.length - query.length) * 0.04;
  return { score, matches };
}

/**
 * Rank `items` for a query. Each item is scored on every field in `fields`,
 * keeping the best match plus a small bonus for matches in earlier fields.
 */
export function fuzzySearch(items, query, options = {}) {
  const { fields = ['title'], limit = 12, boost = {} } = options;
  const needle = normalizeForSearch(query);
  if (!needle) return items.slice(0, limit);

  const scored = [];
  for (const item of items ?? []) {
    let best = null;
    let bestField = null;
    fields.forEach((field, index) => {
      const value = Array.isArray(item[field]) ? item[field].join(' ') : item[field];
      if (!value) return;
      const result = fuzzyMatch(needle, String(value));
      if (result.score === null) return;
      const fieldBoost = boost[field] ?? 1;
      const adjusted = result.score * fieldBoost * (1 - index * 0.04);
      if (!best || adjusted > best) {
        best = adjusted;
        bestField = field;
      }
    });
    if (best === null) continue;
    scored.push({ item, score: best, field: bestField });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/** Highlight matched characters — returns `[{ char, hit }]` for safe rendering. */
export function highlightSegments(text, needle) {
  const value = String(text ?? '');
  const result = fuzzyMatch(needle, value);
  if (!needle || !result || result.score === null) return [{ text: value, hit: false }];

  // `fuzzyMatch` normalises; map normalised indices back onto the raw string.
  const normalised = normalizeForSearch(value);
  const rawIndexForNormalised = [];
  let rawCursor = 0;
  for (let i = 0; i < normalised.length; i += 1) {
    while (rawCursor < value.length && normalizeForSearch(value[rawCursor]) !== normalised[i]) rawCursor += 1;
    rawIndexForNormalised.push(Math.min(rawCursor, value.length - 1));
    rawCursor += 1;
  }
  const hits = new Set(result.matches.map((i) => rawIndexForNormalised[i]));

  const segments = [];
  for (let i = 0; i < value.length; i += 1) {
    const hit = hits.has(i);
    const last = segments[segments.length - 1];
    if (last && last.hit === hit) last.text += value[i];
    else segments.push({ text: value[i], hit });
  }
  return segments;
}
