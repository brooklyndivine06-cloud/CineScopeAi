/**
 * Colour helpers for procedural cover art and data-driven accents. Pure.
 */
import { seededUnit } from './number.js';

/** 0..1 -> "#rrggbb" */
export function hslToHex(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(Math.max(s, 0), 1);
  const light = Math.min(Math.max(l, 0), 1);
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Relative luminance of a hex colour (WCAG formula). */
export function luminance(hex) {
  const clean = String(hex).replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const channels = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const mapped = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * mapped[0] + 0.7152 * mapped[1] + 0.0722 * mapped[2];
}

export function contrastRatio(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever reads better on `hex`. */
export const readableOn = (hex) => (contrastRatio(hex, '#ffffff') >= 4.5 ? '#ffffff' : '#0b0b12');

/**
 * Deterministic two-stop palette for a title. Same title always yields the same
 * cover art, which keeps the UI stable between visits.
 */
export function paletteFor(seed, options = {}) {
  const { lightness = 0.42, spread = 52 } = options;
  const base = seededUnit(`${seed}:hue`) * 360;
  const sat = 0.55 + seededUnit(`${seed}:sat`) * 0.35;
  const hueA = base;
  const hueB = base + spread + seededUnit(`${seed}:spread`) * 60;
  return {
    hueA,
    hueB,
    from: hslToHex(hueA, sat, lightness),
    to: hslToHex(hueB, sat, lightness * 0.55),
    accent: hslToHex(base + 180, 0.75, 0.6),
    ink: readableOn(hslToHex(base, sat, lightness * 0.5)),
  };
}

/** Continuous score colour: red -> amber -> green. */
export function scoreColor(value) {
  const v = Math.min(Math.max(Number(value) || 0, 0), 100);
  const hue = (v / 100) * 132; // 0 red -> 132 green
  return hslToHex(hue, 0.78, 0.52);
}

/** Severity colour for content advisories. */
export const SEVERITY_COLORS = {
  none: '#7c8494',
  low: '#5ec26a',
  moderate: '#e9c46a',
  high: '#f08a3c',
  extreme: '#ef476f',
};

export const severityColor = (severity) => SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.none;
