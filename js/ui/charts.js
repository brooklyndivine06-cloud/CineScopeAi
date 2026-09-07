/**
 * SVG charts built with the hyperscript helper — no chart library, no canvas.
 * Values animate in on the frame after mount via CSS transitions.
 */
import { h, svg, nextFrame } from './dom.js';
import { scoreColor, SEVERITY_COLORS } from '../utils/color.js';
import { clamp, round } from '../utils/number.js';

/**
 * Circular score gauge.
 * @param {number|null} value 0-100
 * @param {{size:number, stroke:number, label:string, caption:string, color:string}} opts
 */
export function scoreRing(value, opts = {}) {
  const { size = 128, stroke = 9, label = 'CinemaScore', caption = 'of 100' } = opts;
  const radius = (size - stroke) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value === null ? 0 : clamp(value, 0, 100) / 100;
  const color = opts.color ?? (value === null ? 'var(--tone-grey)' : scoreColor(value));
  const dash = circumference * pct;

  const valueStroke = svg('circle', {
    class: 'ring__value',
    cx: size / 2,
    cy: size / 2,
    r: radius,
    stroke: color,
    'stroke-width': stroke,
    'stroke-dasharray': `0 ${circumference}`,
  });

  const node = h('div', { class: 'ring', style: { width: `${size}px`, height: `${size}px` } },
    svg('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, 'aria-hidden': 'true' },
      svg('circle', { class: 'ring__track', cx: size / 2, cy: size / 2, r: radius, 'stroke-width': stroke }),
      valueStroke,
    ),
    h('span', { class: 'ring__label' },
      h('span', { class: 'ring__num', style: { fontSize: `${Math.round(size * 0.3)}px`, color } },
        value === null ? '—' : String(round(value, 0)),
      ),
      h('span', { class: 'ring__cap' }, caption),
    ),
  );

  nextFrame(() => valueStroke.setAttribute('stroke-dasharray', `${dash} ${circumference}`));
  return node;
}

/** Accessible text version of the ring for screen readers. */
export const ringText = (value, label) =>
  h('p', { class: 'sr-only' }, value === null ? `${label}: no score available.` : `${label}: ${Math.round(value)} out of 100.`);

/**
 * Five-axis radar.
 * @param {{id:string,label:string,value:number|null}[]} axes
 */
export function radarChart(axes, opts = {}) {
  const size = opts.size ?? 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 52;
  const usable = axes.filter((axis) => axis.value !== null);
  const rings = [0.25, 0.5, 0.75, 1];

  const point = (index, total, factor) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    return [cx + Math.cos(angle) * radius * factor, cy + Math.sin(angle) * radius * factor];
  };

  const grid = rings.map((factor) =>
    svg('polygon', {
      class: 'radar__grid',
      points: axes.map((_, i) => point(i, axes.length, factor).join(',')).join(' '),
    }));

  const spokes = axes.map((_, i) => {
    const [x, y] = point(i, axes.length, 1);
    return svg('line', { class: 'radar__axis', x1: cx, y1: cy, x2: x, y2: y });
  });

  const shapePoints = axes.map((axis, i) =>
    point(i, axes.length, axis.value === null ? 0 : clamp(axis.value, 0, 100) / 100).join(','));

  const shape = svg('polygon', { class: 'radar__shape', points: axes.map(() => `${cx},${cy}`).join(' ') });
  nextFrame(() => shape.setAttribute('points', shapePoints.join(' ')));

  const dots = axes.map((axis, i) => {
    const [x, y] = point(i, axes.length, axis.value === null ? 0 : clamp(axis.value, 0, 100) / 100);
    return svg('circle', { class: 'radar__dot', cx: x, cy: y, r: 3.4 });
  });

  const labels = axes.map((axis, i) => {
    const [x, y] = point(i, axes.length, 1.26);
    const anchor = Math.abs(x - cx) < 12 ? 'middle' : x > cx ? 'start' : 'end';
    const group = svg('g', { class: 'radar__labels' },
      svg('text', { class: 'radar__label', x, y, 'text-anchor': anchor, 'dominant-baseline': 'middle' }, axis.label),
      svg('text', {
        class: 'radar__value',
        x,
        y: y + 13,
        'text-anchor': anchor,
        'dominant-baseline': 'middle',
      }, axis.value === null ? 'n/a' : String(Math.round(axis.value))),
    );
    if (axis.note) {
      const title = svg('title', {}, `${axis.label}: ${axis.value === null ? 'no data' : Math.round(axis.value)}/100 (${axis.note})`);
      group.insertBefore(title, group.firstChild);
    }
    return group;
  });

  return h('div', { class: 'radar' },
    svg('svg', {
      viewBox: `0 0 ${size} ${size}`,
      role: 'img',
      'aria-label': `Profile: ${axes.map((a) => `${a.label} ${a.value === null ? 'no data' : Math.round(a.value)}`).join(', ')}`,
      style: { width: '100%', height: 'auto', overflow: 'visible' },
    }, ...grid, ...spokes, shape, ...dots, ...labels),
    usable.length < axes.length
      ? h('p', { class: 'muted', style: { textAlign: 'center', fontSize: '0.78rem' } },
        `${axes.length - usable.length} axis${axes.length - usable.length === 1 ? '' : 'es'} missing published data.`)
      : null,
  );
}

/** Horizontal 0-100 bar with label and value. */
export function barRow(name, value, opts = {}) {
  const { suffix = '', color, scale, missing = value === null } = opts;
  const pct = value === null ? 0 : clamp((scale ? (value / scale) * 100 : value), 0, 100);
  const fill = h('div', {
    class: 'bar__fill',
    style: { background: color ?? (missing ? 'transparent' : scoreColor(pct)) },
  });
  nextFrame(() => { if (!missing) fill.style.width = `${pct}%`; });

  return h('div', { class: ['bar', missing && 'bar--missing'] },
    h('div', { class: 'bar__top' },
      h('span', { class: 'bar__name' }, name),
      h('span', { class: 'bar__val tnum' }, missing ? 'no data' : `${value}${suffix}`),
    ),
    h('div', { class: 'bar__track', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': scale ? String(scale) : '100', 'aria-valuenow': missing ? '0' : String(Math.round(pct)), 'aria-label': name }, fill),
  );
}

/** Severity pips for a content advisory row. */
export function severityPips(rank) {
  const color = [null, SEVERITY_COLORS.low, SEVERITY_COLORS.moderate, SEVERITY_COLORS.high, SEVERITY_COLORS.extreme][clamp(rank, 0, 4)];
  return h('div', { class: 'adv__sev', 'aria-hidden': 'true' },
    ...Array.from({ length: 4 }, (_, i) =>
      h('span', { class: 'adv__pip', style: i < rank ? { background: color } : {} })));
}

/** Compact inline meter used in the watch plan. */
export function miniMeter(value, label) {
  const pct = clamp(value ?? 0, 0, 100);
  const fill = h('div', { class: 'bar__fill', style: { background: scoreColor(pct) } });
  nextFrame(() => { fill.style.width = `${pct}%`; });
  return h('div', { class: 'bar' },
    h('div', { class: 'bar__top' },
      h('span', { class: 'bar__name' }, label),
      h('span', { class: 'bar__val tnum' }, `${Math.round(pct)}%`),
    ),
    h('div', { class: 'bar__track' }, fill),
  );
}
