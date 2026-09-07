/**
 * Insight generation. Everything here is derived from named, visible inputs —
 * ratings, runtime, advisories, box office — and the UI labels the panel as
 * modelled output. No number in here is invented from thin air.
 */
import { clamp, formatCount, formatMoney, formatRuntime, round, seededInt, weightedAverage } from '../utils/number.js';
import { describeConfidence, describeGap } from './score.js';
import { joinList, truncate } from '../utils/text.js';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Five-axis profile used by the radar chart. Each axis names its own inputs.
 */
export function buildStrengths(movie, score, advisory) {
  const { entries, critics, audience, gap } = score;
  const value = (key) => entries.find((e) => e.key === key)?.value ?? null;

  const criticsAxis = value('rtCritics') ?? value('metacritic') ?? critics;
  const audienceAxis = value('imdb') ?? value('rtAudience') ?? audience;
  const agreement = gap === null ? null : round(100 - Math.abs(gap) * 3.2, 0);

  const reach = weightedAverage([
    { value: movie.votes ? clamp(Math.log10(movie.votes) / 6.6 * 100, 5, 100) : null, weight: 1 },
    {
      value: movie.revenue && movie.budget
        ? clamp((movie.revenue / movie.budget) * 22, 5, 100)
        : null,
      weight: 0.7,
    },
    { value: movie.popularity ? clamp(movie.popularity, 5, 100) : null, weight: 0.5 },
  ]);

  const accessibility = round(100 - (advisory.maxRank / 4) * 78 - clamp(((movie.runtime ?? 120) - 100) / 12, 0, 18), 0);

  const axes = [
    { id: 'critics', label: 'Critics', value: criticsAxis === null ? null : round(criticsAxis, 0), note: 'Critic-side scores' },
    { id: 'audience', label: 'Audience', value: audienceAxis === null ? null : round(audienceAxis, 0), note: 'Viewer-side scores' },
    { id: 'agreement', label: 'Agreement', value: agreement, note: 'How close the two camps land' },
    { id: 'reach', label: 'Cultural reach', value: reach === null ? null : round(reach, 0), note: 'Votes, box office, buzz' },
    { id: 'ease', label: 'Easy watch', value: clamp(accessibility, 0, 100), note: 'Content calm + runtime' },
  ];

  return axes.map((axis) => ({ ...axis, value: axis.value === null ? null : clamp(axis.value, 0, 100) }));
}

/** 2-4 sentence plain-English reasoning for the verdict. */
export function buildExplanation(movie, score, advisory) {
  const lines = [];
  const top = score.available.slice(0, 3);

  if (score.score !== null) {
    lines.push(
      `Blending ${top.length} published source${top.length === 1 ? '' : 's'} (${joinList(top.map((e) => e.short))}) puts it at ${round(score.score, 0)}/100 — ${score.verdict.label.toLowerCase()}.`,
    );
  } else {
    lines.push('No published ratings were available for this title, so no score could be computed.');
  }

  if (score.gap !== null && Math.abs(score.gap) >= 6) {
    lines.push(`The split is the story: ${describeGap(score.gap)}.`);
  } else if (score.critics !== null && score.audience !== null) {
    lines.push('Critics and viewers land in the same place, which usually means few surprises.');
  }

  if (movie.runtime) {
    lines.push(
      movie.runtime > 150
        ? `It asks for ${formatRuntime(movie.runtime)} of your life, so treat it as an event rather than background noise.`
        : `At ${formatRuntime(movie.runtime)} it is a single-sitting watch with room left over.`,
    );
  }

  if (advisory.maxRank >= 3) {
    lines.push(`Content-wise it is not casual viewing: ${advisory.headline.toLowerCase()}`);
  } else if (advisory.maxRank <= 1) {
    lines.push('Content is mild, so it travels well with mixed company.');
  }

  lines.push(describeConfidence(score.confidence));
  return lines.filter(Boolean);
}

/** Mood chips — derived from genre + advisory profile + runtime. */
export function buildMoods(movie, advisory) {
  const genres = (movie.genres ?? []).map((g) => g.toLowerCase());
  const moods = [];
  const add = (label, reason) => { if (!moods.some((m) => m.label === label)) moods.push({ label, reason }); };

  if (genres.includes('horror')) add('👻 Late-night scares', 'Horror with real bite');
  if (genres.includes('comedy')) add('😂 Low-effort laugh', 'Comedy-led');
  if (genres.includes('animation') || genres.includes('family')) add('🍿 Family night', 'Suitable for younger viewers');
  if (genres.includes('romance')) add('💞 Date night', 'Romance at the core');
  if (genres.includes('documentary')) add('🧠 Something to talk about', 'Documentary');
  if (genres.includes('science fiction')) add('🚀 Big-idea mode', 'Science fiction');
  if (advisory.maxRank >= 3) add('🕯️ Heavy lifting', `Worst flag: ${advisory.present[0]?.label.toLowerCase() ?? 'intense'}`);
  if ((movie.runtime ?? 0) > 150) add('⏳ Block out the evening', formatRuntime(movie.runtime));
  if ((movie.runtime ?? 0) && movie.runtime < 100) add('⚡ Quick hit', formatRuntime(movie.runtime));
  if (movie.budget && movie.revenue && movie.revenue > movie.budget * 4) add('🎆 Crowd-pleaser', 'Big box office return');
  if (!genres.includes('action') && advisory.maxRank <= 1 && (movie.runtime ?? 120) < 120) add('🛋️ Wind-down watch', 'Calm and short');

  return moods.slice(0, 4);
}

/**
 * A roast that is actually about the film: it reads the critic/audience gap, the
 * box-office ratio and the runtime rather than picking a canned insult.
 */
export function buildRoast(movie, score) {
  const title = movie.title;
  const gap = score.gap;
  const flop = movie.budget && movie.revenue ? movie.revenue / movie.budget : null;
  const runtime = movie.runtime ?? 0;

  if (score.score !== null && score.score >= 85) {
    return `${title} is so well received that recommending it counts as a personality.`;
  }
  if (gap !== null && gap >= 15) {
    return `${title} made critics reach for the adjectives and audiences reach for the remote.`;
  }
  if (gap !== null && gap <= -15) {
    return `${title} is the film your friend studied cinema to defend and you watched with one eye on your phone.`;
  }
  if (flop !== null && flop < 0.7) {
    return `${title} spent ${formatMoney(movie.budget)} to earn ${formatMoney(movie.revenue)} — the box office equivalent of a polite cough.`;
  }
  if (flop !== null && flop > 6) {
    return `${title} printed ${formatMoney(movie.revenue)}, which is how we ended up with three more of them.`;
  }
  if (runtime >= 170) {
    return `${title} runs ${formatRuntime(runtime)}. Bring snacks and a will.`;
  }
  if (score.score !== null && score.score < 40) {
    return `${title} is the rare film where the credits feel like the best scene.`;
  }
  if (score.score !== null && score.score < 60) {
    return `${title} is best enjoyed at 1.5x speed, on a plane, next to a stranger.`;
  }
  return `${title} did exactly what it set out to do. Whether that was worth ${formatRuntime(runtime) || 'the runtime'} is up to you.`;
}

/** Who this is for / who should skip it. */
export function buildAudienceNotes(movie, score, advisory) {
  const forWhom = [];
  const avoid = [];
  const genres = movie.genres ?? [];

  genres.slice(0, 2).forEach((genre) => forWhom.push(`${genre} fans looking for a strong example of the form.`));
  if (score.critics !== null && score.critics >= 85) forWhom.push('Anyone who tracks critic consensus.');
  if (score.audience !== null && score.audience >= 80) forWhom.push('Viewers who want a crowd-pleaser with substance.');
  if (advisory.maxRank <= 1) forWhom.push('Mixed-age groups and first dates.');
  if (movie.director) forWhom.push(`People who follow ${movie.director}.`);

  advisory.present.slice(0, 2).forEach((entry) => {
    if (entry.rank >= 3) avoid.push(`Anyone avoiding ${entry.label.toLowerCase()}.`);
  });
  if (score.gap !== null && score.gap <= -12) avoid.push('Viewers who trust critic scores over audience ones.');
  if (movie.runtime >= 165) avoid.push('Anyone who cannot commit to a long runtime.');
  if (score.score !== null && score.score < 45) avoid.push('People short on time this week.');

  return { forWhom: forWhom.slice(0, 4), avoid: avoid.slice(0, 4) };
}

/** Light, factual trivia — all computed from the data on screen. */
export function buildFunStats(movie, score) {
  const stats = [];
  const push = (label, value) => { if (value !== null && value !== undefined) stats.push({ label, value }); };

  push('Runtime', formatRuntime(movie.runtime));
  if (movie.runtime) push('Your life committed', `${round(movie.runtime / 60, 1)} hours`);
  push('Released', movie.year ? `${CURRENT_YEAR - movie.year} years ago` : null);
  push('IMDb votes', formatCount(movie.votes));
  push('Budget', formatMoney(movie.budget));
  push('Box office', formatMoney(movie.revenue));
  if (movie.budget && movie.revenue) {
    const ratio = movie.revenue / movie.budget;
    push('Return on budget', `${round(ratio, 1)}x`);
    push('Profit', formatMoney(movie.revenue - movie.budget));
    push('Cost per minute', formatMoney(movie.budget / movie.runtime));
  }
  push('Sources reporting', `${score.available.length} of ${score.entries.length}`);
  push('Confidence', `${Math.round(score.confidence * 100)}%`);
  if (score.score !== null) push('CinemaScore', `${round(score.score, 0)}/100`);

  return stats.filter(Boolean);
}

/** Watch-plan suggestion: when to watch it, and with what. */
export function buildWatchPlan(movie, score, advisory) {
  const runtime = movie.runtime ?? 110;
  const intensity = advisory.maxRank;
  const when = intensity >= 3
    ? 'Watch it awake, not as background noise'
    : runtime >= 150 ? 'Save it for a night with nothing after it' : 'Fits almost any evening';
  const company = intensity >= 3
    ? 'Better with someone who knows what they are getting into'
    : advisory.maxRank <= 1 ? 'Fine with family or a first date' : 'Good with friends who share your tolerance';
  const after = intensity >= 3
    ? 'Pair it with something light afterwards'
    : score.score !== null && score.score >= 80 ? 'Rewatchable — most people come back to it' : 'One viewing is probably enough';
  const snack = seededInt(`${movie.id}-snack`, 0, 3);
  const snacks = ['popcorn', 'something salty', 'a proper meal first', 'tea, not coffee'];

  return {
    when,
    company,
    after,
    snack: snacks[snack],
    rewatchValue: clamp(round((score.score ?? 50) * 0.7 + (100 - advisory.maxRank * 12) * 0.3, 0), 0, 100),
  };
}

/** Short "why now" line for the hero, under the verdict badge. */
export function buildHookline(movie, score, advisory) {
  if (score.score === null) return 'Not enough published data to judge this one yet.';
  const bits = [];
  bits.push(`${round(score.score, 0)}/100 CinemaScore`);
  if (movie.runtime) bits.push(formatRuntime(movie.runtime));
  bits.push(advisory.audience.label.toLowerCase());
  return bits.join(' · ');
}

export { truncate };
