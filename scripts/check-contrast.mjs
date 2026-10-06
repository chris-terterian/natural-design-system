// Contrast gate (D-035, D-036): every pairing DESIGN.md §4.2 promises (mcp/recolor.mjs PAIRS: text 4.5:1, UI 3:1) must
// pass in every brand (Natural, Tide) × Color mode (Light, Dark). Runs in npm run check and CI, so no brand or theme
// can ship below WCAG 2.2 AA.
import { readFileSync } from 'node:fs';
import { PAIRS, brands, colorModes, colorOf, contrastRatio } from '../mcp/recolor.mjs';

const all = JSON.parse(readFileSync(new URL('../tokens/figma-variables.json', import.meta.url), 'utf8'));
const errors = [];
const lowest = {};
for (const brand of brands(all)) for (const m of colorModes(all)) {
  const mode = `${brand} ${m}`;
  for (const p of PAIRS) {
    const [fg, bg] = [colorOf(all, p.foreground, m, brand), colorOf(all, p.background, m, brand)];
    if (!fg || !bg) { errors.push(`${mode}: ${p.foreground} or ${p.background} doesn't resolve to a colour`); continue; }
    const r = contrastRatio(fg, bg);
    if (r < p.min) errors.push(`${mode}: ${p.foreground} on ${p.background} is ${r}:1 (${fg} on ${bg}), under ${p.min}:1`);
    if (!lowest[mode] || r / p.min < lowest[mode].r / lowest[mode].min) lowest[mode] = { ...p, r };
  }
}
if (errors.length) { console.error(`✖ Contrast gate failed (${errors.length}):\n  - ${errors.join('\n  - ')}`); process.exit(1); }
console.log(`✔ Contrast: ${PAIRS.length} pairings pass AA in ${Object.keys(lowest).join(', ')}.`);
for (const [m, l] of Object.entries(lowest)) console.log(`  closest in ${m}: ${l.foreground} on ${l.background} ${l.r}:1 (min ${l.min}:1)`);
