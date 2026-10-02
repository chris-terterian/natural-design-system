// Blocking Figma ↔ code parity gate. Compares governance/figma-snapshot.json (exported from the live Figma
// file through the Figma MCP; see scripts/figma/export-snapshot.js) with the repo:
//  1. Variables: every token in tokens/figma-variables.json exists in Figma with the same value per mode, and vice versa.
//  2. Components: every Figma node the code links to (src/figma.ts) exists, registry components have the same
//     name in Figma, and no component property is unwired (a property no layer uses, see D-009).
//  3. Text styles: every Figma text style is bound to Typography variables that exist in the repo.
// The snapshot can go stale if Figma is edited afterwards: refresh it after any Figma or token change and before
// every release (GOVERNANCE.md §6).
//
// Direction (D-034): a difference alone doesn't say which side moved, so each variable difference is compared three
// ways: code now, code when the snapshot was last committed (the baseline, from git), and Figma (the snapshot).
//   code moved, Figma at the baseline   → figma-behind   update Figma to match code
//   Figma moved, code at the baseline   → figma-changed  a design decision: adopt it in code, or revert Figma
//   both moved                          → conflict       a person decides, seeing all three values
// `--json <file>` also writes the verdicts for the drift bot.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const snapshot = read('governance/figma-snapshot.json');
const tokens = read('tokens/figma-variables.json');
const registry = read('governance/components.json');
const figmaTs = readFileSync(new URL('../src/figma.ts', import.meta.url), 'utf8');
const nodes = Object.fromEntries([...figmaTs.matchAll(/^\s+(\w+): '(\d+:\d+)',$/gm)].map((m) => [m[1], m[2]]));
const errors = [];

// ---- 1. Variables ----
const key = (line) => line.split('|').slice(0, 3).join('|');
const val = (line) => line.split('|').slice(3).join('|');
const linesOf = (toks) => {
  const out = [];
  for (const [collection, vars] of Object.entries(toks)) {
    if (collection.startsWith('$')) continue;
    for (const [name, t] of Object.entries(vars)) {
      const fmt = (x) => (x.alias ? `@${x.alias}` : String(x.value));
      if (t.modes) for (const [mode, m] of Object.entries(t.modes)) out.push(`${collection}|${name}|${mode}|${fmt(m)}`);
      else out.push(`${collection}|${name}||${fmt(t)}`);
    }
  }
  return out;
};
const expected = linesOf(tokens);
const figmaMap = new Map(snapshot.variables.map((l) => [key(l), val(l)]));
const codeMap = new Map(expected.map((l) => [key(l), val(l)]));

// Baseline: the tokens as they were when the snapshot was last committed (parity held then; the gates enforce it).
const root = new URL('..', import.meta.url);
const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
let baseline = null, baselineCommit = null;
try {
  // A shallow checkout (CI's default) has no history, so every baseline would look like "now": refuse to guess.
  if (git('rev-parse', '--is-shallow-repository') === 'true') throw new Error('shallow');
  baselineCommit = git('log', '-1', '--format=%h', '--', 'governance/figma-snapshot.json');
  baseline = new Map(linesOf(JSON.parse(git('show', `${baselineCommit}:tokens/figma-variables.json`))).map((l) => [key(l), val(l)]));
} catch { baselineCommit = null; /* no or shallow git history: directions are unknown */ }

const VERDICT = {
  'figma-behind': 'code changed since the last snapshot; Figma is behind → update Figma',
  'figma-changed': 'Figma changed; code is as it was at the last snapshot → design decision: adopt in code or revert Figma',
  conflict: 'both changed since the last snapshot → a person decides',
  unknown: 'direction unknown (no git history; CI needs fetch-depth: 0)',
};
const directions = [];
const show = (v) => (v === undefined ? '(none)' : v);
for (const k of new Set([...codeMap.keys(), ...figmaMap.keys()])) {
  const code = codeMap.get(k), figma = figmaMap.get(k);
  if (code === figma) continue;
  const base = baseline?.get(k);
  const verdict = !baseline ? 'unknown' : code !== base && figma === base ? 'figma-behind' : code === base && figma !== base ? 'figma-changed' : 'conflict';
  const [collection, name, mode] = k.split('|');
  directions.push({ collection, name, mode: mode || undefined, code, figma, baseline: base, verdict });
  const what = code === undefined ? 'only in Figma' : figma === undefined ? 'missing in Figma' : 'differs';
  errors.push(`Variable ${what}: ${k.replace(/\|$/, '')}  code=${show(code)}  figma=${show(figma)}${baseline ? `  baseline@${baselineCommit}=${show(base)}` : ''}\n      → ${VERDICT[verdict]}`);
}

// ---- 2. Components ----
for (const [k, id] of Object.entries(nodes)) {
  const c = snapshot.components[k];
  if (!c) { errors.push(`src/figma.ts "${k}" (${id}) is not in the snapshot; re-export it`); continue; }
  if (c.id !== id) errors.push(`src/figma.ts "${k}" points at ${id} but the snapshot has ${c.id}`);
  if (c.missing) { errors.push(`Figma node ${id} ("${k}") no longer exists`); continue; }
  for (const [prop, p] of Object.entries(c.properties || {})) {
    if (p.type !== 'VARIANT' && p.wired === false) errors.push(`Figma "${c.name}" property "${prop}" is not wired to any layer (D-009)`);
  }
}
for (const r of registry.components) {
  const c = snapshot.components[r.figmaKey];
  if (!c || c.missing) continue;
  if (c.name !== r.name) errors.push(`Registry "${r.name}" is named "${c.name}" in Figma`);
  if (c.type !== 'COMPONENT_SET' && c.type !== 'COMPONENT' && r.name !== 'Typography') errors.push(`Registry "${r.name}" links to a ${c.type}, not a component`);
}

// ---- 3. Text styles ----
for (const [style, bindings] of Object.entries(snapshot.textStyles)) {
  for (const prop of ['fontSize', 'lineHeight']) {
    const v = bindings[prop];
    if (!v) errors.push(`Text style "${style}" has no variable bound to ${prop}`);
    else if (!tokens.Typography?.[v]) errors.push(`Text style "${style}" ${prop} is bound to "${v}", which isn't in the Typography tokens`);
  }
}

const ageDays = ((Date.now() - Date.parse(snapshot.generatedAt)) / 86400000).toFixed(1);
const jsonAt = process.argv.indexOf('--json');
if (jsonAt > 0) writeFileSync(process.argv[jsonAt + 1], JSON.stringify({ pass: errors.length === 0, baselineCommit, snapshotAt: snapshot.generatedAt, directions, other: errors.filter((e) => !e.startsWith('Variable ')) }, null, 2) + '\n');
if (errors.length) {
  console.error(`✖ Figma ↔ code parity failed (${errors.length}), snapshot from ${snapshot.generatedAt} (${ageDays} days old):\n  - ${errors.join('\n  - ')}`);
  console.error('\nFix the drift, re-export the snapshot (npm run figma:snapshot-script), and run again.');
  process.exit(1);
}
const comps = Object.values(snapshot.components).filter((c) => !c.missing);
const props = comps.reduce((n, c) => n + Object.keys(c.properties || {}).length, 0);
console.log(`✔ Figma ↔ code parity: ${codeMap.size} variable values, ${comps.length} linked nodes (${props} properties, all wired), ${Object.keys(snapshot.textStyles).length} text styles. Snapshot ${ageDays} days old.`);
