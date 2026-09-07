/**
 * Content advisory analysis.
 *
 * Two input shapes are supported:
 *  - `catalog`  : hand-written severities (accurate, authored per film).
 *  - `heuristic`: derived from certification + genres + keywords when a film
 *                 comes from a live API and no authored data exists. These are
 *                 always flagged `estimated: true` in the UI.
 */
import { ADVISORY_BY_ID, CERT_RANK, FAMILY_MAX_RANK, severityFromRank, severityRank } from '../data/taxonomy.js';
import { clamp, round } from '../utils/number.js';
import { joinList } from '../utils/text.js';

/** Sort key: worst first, then the taxonomy's own stable order. */
const categoryOrder = Object.keys(ADVISORY_BY_ID);

export function normalizeAdvisories(input) {
  const entries = [];
  for (const category of categoryOrder) {
    const meta = ADVISORY_BY_ID[category];
    const raw = input?.[category];
    if (raw === undefined || raw === null) continue;
    const rank = clamp(Math.round(Number(raw) || 0), 0, 4);
    entries.push({
      id: category,
      label: meta.label,
      icon: meta.icon,
      hint: meta.hint,
      severity: severityFromRank(rank),
      rank,
    });
  }
  entries.sort((a, b) => b.rank - a.rank || categoryOrder.indexOf(a.id) - categoryOrder.indexOf(b.id));
  return entries;
}

/**
 * Estimate severities when only a certification and genre list are known.
 * Deliberately conservative: it errs toward flagging, and the UI says it is an
 * estimate rather than passing it off as classification data.
 */
export function estimateAdvisories({ certification, genres = [], keywords = [] } = {}) {
  const rank = CERT_RANK[certification] ?? 2;
  const g = new Set(genres.map((x) => String(x).toLowerCase()));
  const k = keywords.map((x) => String(x).toLowerCase());
  const has = (...words) => words.some((w) => g.has(w) || k.some((kw) => kw.includes(w)));

  const out = {};
  const set = (id, value) => {
    out[id] = Math.max(out[id] ?? 0, value);
  };

  const violenceBase = rank >= 3 ? 3 : rank >= 2 ? 2 : 1;
  if (has('action', 'thriller', 'crime', 'war')) set('violence', violenceBase + 1);
  if (has('horror')) set('violence', Math.max(2, violenceBase));
  if (has('horror', 'gore', 'splatter')) set('gore', rank >= 3 ? 4 : 2);
  if (has('horror', 'thriller')) set('frightening', rank >= 3 ? 4 : 3);
  if (has('horror')) set('jumpscares', 3);
  if (has('romance') && rank >= 3) set('sexual', 3);
  else if (has('romance', 'drama') && rank >= 2) set('sexual', 2);
  if (rank >= 3 && has('drama', 'romance', 'thriller')) set('nudity', 2);
  if (rank >= 3) set('language', 3);
  else if (rank === 2) set('language', 2);
  if (has('crime', 'drama') && rank >= 3) set('substances', 3);
  else if (rank === 2) set('substances', 1);
  if (has('war', 'history')) set('war', rank >= 3 ? 4 : 3);
  if (has('animation', 'family') && rank <= 1) set('frightening', 2);
  if (has('action', 'science fiction', 'music')) set('strobe', 2);
  if (has('horror', 'mystery', 'thriller')) set('disturbing', rank >= 3 ? 3 : 2);

  if (Object.keys(out).length === 0) {
    out.violence = rank >= 3 ? 2 : 1;
    out.language = rank >= 3 ? 2 : 0;
  }

  return out;
}

/**
 * Full advisory summary for a movie.
 * `tolerance` is the viewer's configured maximum acceptable rank (0-4).
 */
export function summarizeAdvisories(advisories, options = {}) {
  const { tolerance = 3, certification = null, estimated = false } = options;
  const list = normalizeAdvisories(advisories);
  const present = list.filter((entry) => entry.rank > 0);
  const maxRank = present.reduce((max, entry) => Math.max(max, entry.rank), 0);

  const certRank = CERT_RANK[certification] ?? null;
  const worst = Math.max(maxRank, certRank ?? 0);
  const breaches = present.filter((entry) => entry.rank > tolerance);

  let audience;
  if (worst <= FAMILY_MAX_RANK) audience = { key: 'family', label: 'Family-friendly', tone: 'green' };
  else if (worst <= 2) audience = { key: 'teen', label: 'Teen & up', tone: 'teal' };
  else if (worst <= 3) audience = { key: 'adult', label: 'Adults', tone: 'amber' };
  else audience = { key: 'strong', label: 'Strong content', tone: 'red' };

  return {
    list,
    present,
    clear: list.filter((entry) => entry.rank === 0),
    maxSeverity: severityFromRank(maxRank),
    maxRank,
    audience,
    breaches,
    /** 0-100 "calmness" figure — inverse of the worst thing in the film. */
    calmScore: round(100 - (maxRank / 4) * 100, 0),
    needsGate: maxRank >= 4,
    headline: headlineFor(present, maxRank),
    estimated,
    tolerance,
    verdict: breaches.length
      ? `Above your tolerance: ${joinList(breaches.map((b) => b.label.toLowerCase()))}.`
      : 'Inside the limits you set in Settings.',
  };
}

function headlineFor(present, maxRank) {
  if (!present.length) return 'No notable content flags.';
  const top = present[0];
  if (maxRank >= 4) return `${top.label} is extreme in this one.`;
  if (maxRank === 3) return `Expect frequent ${top.label.toLowerCase()}.`;
  if (maxRank === 2) return `Some ${top.label.toLowerCase()}, nothing graphic.`;
  return 'Mild content throughout.';
}

/** One-line summary for cards and compare rows. */
export function advisoryDigest(summary) {
  if (!summary.present.length) return 'Nothing flagged';
  return joinList(summary.present.slice(0, 3).map((entry) => entry.label.toLowerCase()));
}
