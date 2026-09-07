/**
 * Reference taxonomy: content advisory categories, severity scale, genre groups,
 * streaming provider metadata and verdict tiers.
 *
 * Advisory categories follow the shape of real classification guidance
 * (BBFC/MPAA style descriptors) so the app can say *what* is in a film, not just
 * slap on an age rating.
 */

export const SEVERITY = {
  none: { rank: 0, label: 'None', blurb: 'Not present' },
  low: { rank: 1, label: 'Low', blurb: 'Brief or mild' },
  moderate: { rank: 2, label: 'Moderate', blurb: 'Present, not graphic' },
  high: { rank: 3, label: 'High', blurb: 'Frequent or graphic' },
  extreme: { rank: 4, label: 'Extreme', blurb: 'Sustained or explicit' },
};

export const SEVERITY_ORDER = ['none', 'low', 'moderate', 'high', 'extreme'];

export const severityRank = (severity) => SEVERITY[severity]?.rank ?? 0;

/** Rank -> severity key. */
export const severityFromRank = (rank) => SEVERITY_ORDER[Math.min(Math.max(rank, 0), 4)];

export const ADVISORY_CATEGORIES = [
  {
    id: 'violence',
    label: 'Violence',
    icon: '⚔️',
    hint: 'Fights, weapons, injury or threat of harm.',
  },
  {
    id: 'gore',
    label: 'Gore & blood',
    icon: '🩸',
    hint: 'Visible wounds, blood, surgery, body horror.',
  },
  {
    id: 'frightening',
    label: 'Frightening scenes',
    icon: '👻',
    hint: 'Dread, monsters, peril that may upset sensitive viewers.',
  },
  {
    id: 'jumpscares',
    label: 'Jump scares',
    icon: '⚡',
    hint: 'Sudden loud stingers and shocks.',
  },
  {
    id: 'sexual',
    label: 'Sexual content',
    icon: '💋',
    hint: 'Sex scenes, innuendo, simulated acts.',
  },
  {
    id: 'nudity',
    label: 'Nudity',
    icon: '🚿',
    hint: 'Non-sexual or sexual nudity.',
  },
  {
    id: 'language',
    label: 'Strong language',
    icon: '🗯️',
    hint: 'Profanity, slurs, aggressive dialogue.',
  },
  {
    id: 'substances',
    label: 'Drugs & alcohol',
    icon: '🍸',
    hint: 'Use, abuse or glorification of substances.',
  },
  {
    id: 'smoking',
    label: 'Smoking',
    icon: '🚬',
    hint: 'Frequent on-screen smoking.',
  },
  {
    id: 'selfharm',
    label: 'Self-harm & suicide',
    icon: '🕯️',
    hint: 'Depiction or discussion of self-harm.',
  },
  {
    id: 'childperil',
    label: 'Child peril',
    icon: '🧸',
    hint: 'Children in danger, harmed or grieving.',
  },
  {
    id: 'animalharm',
    label: 'Animal harm',
    icon: '🐾',
    hint: 'Animals killed, injured or distressed.',
  },
  {
    id: 'war',
    label: 'War & atrocity',
    icon: '💣',
    hint: 'Combat, genocide, real-world atrocity.',
  },
  {
    id: 'discrimination',
    label: 'Discrimination',
    icon: '🚫',
    hint: 'Racism, bigotry or slurs — period or thematic.',
  },
  {
    id: 'disturbing',
    label: 'Disturbing imagery',
    icon: '🌀',
    hint: 'Grotesque, surreal or psychologically harsh imagery.',
  },
  {
    id: 'strobe',
    label: 'Strobe & flashing',
    icon: '💡',
    hint: 'Rapid cuts or flashes — photosensitivity risk.',
  },
];

export const ADVISORY_BY_ID = Object.fromEntries(ADVISORY_CATEGORIES.map((c) => [c.id, c]));

/** Highest severity a viewer typically accepts for "family night". */
export const FAMILY_MAX_RANK = 1;

/** Genre grouping used for rails, icons and similarity. */
export const GENRE_GROUPS = {
  Action: { icon: '💥', hue: 12 },
  Adventure: { icon: '🧭', hue: 32 },
  Animation: { icon: '🎨', hue: 300 },
  Comedy: { icon: '😂', hue: 46 },
  Crime: { icon: '🕵️', hue: 220 },
  Documentary: { icon: '🎥', hue: 190 },
  Drama: { icon: '🎭', hue: 268 },
  Family: { icon: '🏡', hue: 140 },
  Fantasy: { icon: '🐉', hue: 288 },
  History: { icon: '📜', hue: 36 },
  Horror: { icon: '🔪', hue: 348 },
  Music: { icon: '🎸', hue: 320 },
  Mystery: { icon: '🔎', hue: 200 },
  Romance: { icon: '💞', hue: 340 },
  'Science Fiction': { icon: '🚀', hue: 196 },
  Thriller: { icon: '🧊', hue: 210 },
  War: { icon: '🎖️', hue: 28 },
  Western: { icon: '🤠', hue: 24 },
};

export const genreMeta = (genre) =>
  GENRE_GROUPS[genre] ?? { icon: '🎬', hue: (genre?.length ?? 3) * 37 };

/** Streaming/search providers with deep links that always resolve. */
export const PROVIDERS = {
  netflix: { name: 'Netflix', hue: 355, short: 'N', search: (q) => `https://www.netflix.com/search?q=${q}` },
  prime: { name: 'Prime Video', hue: 200, short: 'pv', search: (q) => `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}` },
  disney: { name: 'Disney+', hue: 220, short: 'D+', search: (q) => `https://www.disneyplus.com/search/${q}` },
  hulu: { name: 'Hulu', hue: 140, short: 'h', search: (q) => `https://www.hulu.com/search?q=${q}` },
  max: { name: 'Max', hue: 260, short: 'M', search: (q) => `https://play.max.com/search?q=${q}` },
  apple: { name: 'Apple TV+', hue: 0, short: '', search: (q) => `https://tv.apple.com/us/search?term=${q}` },
  paramount: { name: 'Paramount+', hue: 228, short: 'P+', search: (q) => `https://www.paramountplus.com/search/?q=${q}` },
  peacock: { name: 'Peacock', hue: 265, short: 'P', search: (q) => `https://www.peacocktv.com/search?q=${q}` },
  justwatch: { name: 'JustWatch', hue: 48, short: 'JW', search: (q) => `https://www.justwatch.com/us/search?q=${q}` },
};

/** Map TMDB provider ids -> our provider keys. */
export const TMDB_PROVIDER_MAP = {
  8: 'netflix', 9: 'prime', 15: 'hulu', 337: 'disney', 384: 'max', 2552: 'max',
  350: 'apple', 1024: 'prime', 531: 'paramount', 337: 'disney', 386: 'peacock',
  1899: 'max', 510: 'paramount', 7: 'justwatch',
};

/**
 * Verdict tiers. `min` is the inclusive CinemaScore threshold.
 * Ordered from best to worst — the first match wins.
 */
export const VERDICT_TIERS = [
  {
    key: 'peak',
    min: 85,
    label: 'Peak Cinema',
    icon: '👑',
    tone: 'gold',
    headline: 'Cancel your plans.',
    summary: 'This is the kind of film people recommend for years.',
  },
  {
    key: 'must',
    min: 76,
    label: 'Must Watch',
    icon: '🎬',
    tone: 'green',
    headline: 'Worth the runtime, twice over.',
    summary: 'Strong across critics and audiences with very little to argue about.',
  },
  {
    key: 'solid',
    min: 66,
    label: 'Solid Pick',
    icon: '✅',
    tone: 'teal',
    headline: 'A safe, enjoyable watch.',
    summary: 'Delivers on its premise even if it never reinvents the genre.',
  },
  {
    key: 'mixed',
    min: 55,
    label: 'Mixed Signals',
    icon: '😐',
    tone: 'amber',
    headline: 'Depends entirely on your taste.',
    summary: 'Divisive — read what splits people before you commit.',
  },
  {
    key: 'weak',
    min: 40,
    label: 'Probably Skip',
    icon: '⏭️',
    tone: 'orange',
    headline: 'Your time is worth more.',
    summary: 'There are better films in the same genre, and you know it.',
  },
  {
    key: 'awful',
    min: 0,
    label: 'Cinematic Crime',
    icon: '🗑️',
    tone: 'red',
    headline: 'Do not watch this sober.',
    summary: 'Widely considered a mistake by critics and audiences alike.',
  },
];

export const verdictForScore = (score) => {
  const value = Number.isFinite(score) ? score : 0;
  return VERDICT_TIERS.find((tier) => value >= tier.min) ?? VERDICT_TIERS[VERDICT_TIERS.length - 1];
};

/** Certification ladder for the family-friendly verdict. */
export const CERT_RANK = {
  G: 0,
  PG: 1,
  'PG-13': 2,
  '12A': 2,
  R: 3,
  'NC-17': 4,
  'NR': 2,
  'Unrated': 3,
};
