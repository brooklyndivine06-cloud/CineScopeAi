/**
 * Stylesheet sanity checks.
 *
 * jsdom does not implement the real CSS cascade (it lets the UA `[hidden]` rule
 * win over author `display`, which browsers do not), so these assertions check
 * the shipped CSS directly instead of trusting computed style.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const cssDir = fileURLToPath(new URL('../css/', import.meta.url));
const files = readdirSync(cssDir).filter((f) => f.endsWith('.css'));
const sheets = Object.fromEntries(files.map((f) => [f, readFileSync(`${cssDir}${f}`, 'utf8')]));
const all = Object.values(sheets).join('\n');

test('every stylesheet is loaded by index.html', () => {
  const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
  for (const file of files) {
    assert.ok(html.includes(`./css/${file}`), `index.html does not link ${file}`);
  }
});

test('braces, parens and quotes are balanced in every sheet', () => {
  for (const [file, css] of Object.entries(sheets)) {
    const open = (css.match(/{/g) ?? []).length;
    const close = (css.match(/}/g) ?? []).length;
    assert.equal(open, close, `${file}: ${open} { vs ${close} }`);
    assert.equal((css.match(/\(/g) ?? []).length, (css.match(/\)/g) ?? []).length, `${file}: unbalanced parens`);
    assert.equal((css.match(/'/g) ?? []).length % 2, 0, `${file}: unbalanced single quotes`);
  }
});

test('hidden elements are forced off, because author display beats the UA rule', () => {
  assert.match(all, /\[hidden\]\s*{\s*display:\s*none\s*!important;\s*}/,
    'missing the [hidden] override — overlays with display:grid would stay visible');
});

test('the design tokens the components rely on are defined', () => {
  const required = [
    '--surface-0', '--surface-1', '--surface-2', '--line', '--text', '--text-2', '--text-3',
    '--accent', '--accent-soft', '--accent-ink', '--r-lg', '--r-pill', '--font-ui', '--font-display',
    '--sev-extreme', '--tone-gold', '--tone-red',
  ];
  for (const token of required) {
    assert.ok(all.includes(`${token}:`), `token ${token} is never defined`);
  }
});

test('every accent referenced in settings exists as a token block', () => {
  for (const accent of ['amber', 'teal', 'rose', 'violet', 'lime', 'ice']) {
    assert.ok(all.includes(`[data-accent='${accent}']`), `accent "${accent}" has no CSS`);
  }
});

test('light and auto themes are both handled', () => {
  assert.match(all, /\[data-theme='light'\]/);
  assert.match(all, /prefers-color-scheme:\s*light/);
  assert.match(all, /\[data-motion='off'\]/);
  assert.match(all, /prefers-reduced-motion:\s*reduce/);
});

test('every var() reference resolves to a defined token', () => {
  const defined = new Set([...all.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]));
  const used = new Set([...all.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
  const missing = [...used].filter((token) => !defined.has(token));
  assert.deepEqual(missing, [], `undefined custom properties: ${missing.join(', ')}`);
});
