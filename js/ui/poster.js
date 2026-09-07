/**
 * Procedural cover art.
 *
 * Catalogue films ship without licensed poster files, so CineScope draws one:
 * deterministic per title, always available offline, and consistent between
 * visits. Live TMDb results use their real artwork and fall back here on error.
 */
import { h, svg } from './dom.js';
import { paletteFor } from '../utils/color.js';
import { initials } from '../utils/text.js';

const W = 200;
const H = 300;

/** Greedy word wrap for the poster title block. */
export function wrapTitle(title, maxChars = 16, maxLines = 3) {
  const words = String(title).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

/**
 * @param {{title:string, year:number, genres:string[]}} movie
 * @param {object} opts { score, compact }
 */
export function proceduralPoster(movie, opts = {}) {
  const seed = `${movie.title}${movie.year ?? ''}`;
  const palette = paletteFor(seed);
  const gid = `g${Math.abs(hash(seed)).toString(36)}`;
  const lines = wrapTitle(movie.title, opts.compact ? 14 : 16, opts.compact ? 4 : 3);
  const titleSize = lines.length >= 3 ? 22 : lines.length === 2 ? 26 : 30;
  const mono = initials(movie.title, 2);

  return svg('svg', {
    class: 'poster',
    viewBox: `0 0 ${W} ${H}`,
    role: 'img',
    'aria-label': `Cover art for ${movie.title} (${movie.year ?? 'year unknown'})`,
    preserveAspectRatio: 'xMidYMid slice',
  },
  svg('defs', {},
    svg('linearGradient', { id: `${gid}bg`, x1: '0', y1: '0', x2: '1', y2: '1' },
      svg('stop', { offset: '0%', 'stop-color': palette.from }),
      svg('stop', { offset: '100%', 'stop-color': palette.to }),
    ),
    svg('radialGradient', { id: `${gid}hi`, cx: '0.3', cy: '0.15', r: '0.9' },
      svg('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '0.34' }),
      svg('stop', { offset: '55%', 'stop-color': '#ffffff', 'stop-opacity': '0.04' }),
      svg('stop', { offset: '100%', 'stop-color': '#000000', 'stop-opacity': '0.38' }),
    ),
    svg('linearGradient', { id: `${gid}fade`, x1: '0', y1: '0', x2: '0', y2: '1' },
      svg('stop', { offset: '35%', 'stop-color': '#000000', 'stop-opacity': '0' }),
      svg('stop', { offset: '100%', 'stop-color': '#000000', 'stop-opacity': '0.62' }),
    ),
  ),
  svg('rect', { width: W, height: H, fill: `url(#${gid}bg)` }),
  svg('rect', { width: W, height: H, fill: `url(#${gid}hi)` }),
  // filmstrip sprockets
  svg('g', { opacity: '0.5' },
    ...Array.from({ length: 11 }, (_, i) => svg('rect', {
      x: 5, y: 8 + i * 27, width: 7, height: 14, rx: 2.5, fill: '#00000055',
    })),
    ...Array.from({ length: 11 }, (_, i) => svg('rect', {
      x: W - 12, y: 8 + i * 27, width: 7, height: 14, rx: 2.5, fill: '#00000055',
    })),
  ),
  // monogram
  svg('text', {
    class: 'poster__mono',
    x: W / 2,
    y: 118,
    'text-anchor': 'middle',
    'font-size': '86',
    fill: '#ffffff',
    'fill-opacity': '0.16',
    'letter-spacing': '-4',
  }, mono),
  // vignette behind the type
  svg('rect', { width: W, height: H, fill: `url(#${gid}fade)` }),
  svg('line', { x1: 22, y1: H - 74, x2: W - 22, y2: H - 74, stroke: '#ffffff', 'stroke-opacity': '0.28', 'stroke-width': '1' }),
  svg('text', {
    class: 'poster__title',
    x: W / 2,
    y: H - 48,
    'text-anchor': 'middle',
    'font-size': titleSize,
    fill: '#ffffff',
  }, ...lines.map((line, i) => svg('tspan', { x: W / 2, dy: i === 0 ? 0 : titleSize + 2 }, line))),
  svg('text', {
    class: 'poster__year',
    x: W / 2,
    y: H - 20 + (lines.length > 2 ? 2 : 0),
    'text-anchor': 'middle',
    'font-size': '11',
    fill: '#ffffff',
    'fill-opacity': '0.72',
  }, [movie.year, movie.genres?.[0]].filter(Boolean).join('  ·  ')),
  );
}

function hash(str) {
  let out = 0;
  for (let i = 0; i < str.length; i += 1) out = (out * 31 + str.charCodeAt(i)) | 0;
  return out;
}

/** Poster host that prefers remote artwork and falls back to generated art. */
export function posterNode(movie, opts = {}) {
  if (movie?.poster) {
    const img = h('img', {
      src: movie.poster,
      alt: `Poster for ${movie.title}`,
      loading: opts.eager ? 'eager' : 'lazy',
      decoding: 'async',
    });
    img.addEventListener('error', () => {
      const fallback = proceduralPoster(movie, opts);
      img.replaceWith(fallback);
    }, { once: true });
    return img;
  }
  return proceduralPoster(movie, opts);
}

/**
 * 1080x1350 share card drawn on canvas — used by "Export card".
 * Returns a Blob, or null if canvas is unavailable.
 */
export async function renderShareCard(movie, score, verdict) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const palette = paletteFor(`${movie.title}${movie.year ?? ''}`);
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, palette.from);
  grad.addColorStop(1, palette.to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const hi = ctx.createRadialGradient(220, 120, 40, 540, 675, 900);
  hi.addColorStop(0, 'rgba(255,255,255,0.32)');
  hi.addColorStop(0.55, 'rgba(255,255,255,0.04)');
  hi.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = hi;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // lower scrim
  const scrim = ctx.createLinearGradient(0, 620, 0, canvas.height);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 620, canvas.width, canvas.height - 620);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.font = '600 340px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText(initials(movie.title, 2), 540, 470);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '600 30px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText('CINESCOPE AI', 540, 130);

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(180, 980);
  ctx.lineTo(900, 980);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  const lines = wrapTitle(movie.title, 15, 3);
  ctx.font = '700 96px "Space Grotesk", system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line.toUpperCase(), 540, 1070 + i * 100));

  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '500 34px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText([movie.year, movie.genres?.[0]].filter(Boolean).join('  ·  ').toUpperCase(), 540, 1100 + lines.length * 100);

  if (score !== null && score !== undefined) {
    ctx.fillStyle = '#fff';
    ctx.font = '700 64px "Space Grotesk", system-ui, sans-serif';
    ctx.fillText(`${Math.round(score)}/100`, 540, 250 + 380);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '500 30px "Space Grotesk", system-ui, sans-serif';
    ctx.fillText(`${verdict ?? ''} · CINESCORE`, 540, 680);
  }

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}
