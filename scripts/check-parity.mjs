// Blocking Figma ↔ code parity gate. Compares governance/figma-snapshot.json (exported from the live Figma
// file through the Figma MCP; see scripts/figma/export-snapshot.js) with the repo:
//  1. Variables: every token in tokens/figma-variables.json exists in Figma with the same value per mode, and vice versa.
//  2. Components: every Figma node the code links to (src/figma.ts) exists, registry components have the same
//     name in Figma, and no component property is unwired (a property no layer uses, see D-009).
//  3. Text styles: every Figma text style is bound to Typography variables that exist in the repo.
// The snapshot can go stale if Figma is edited afterwards: refresh it after any Figma or token change and before
// every release (GOVERNANCE.md §6).
import { readFileSync } from 'node:fs';

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
const expected = [];
for (const [collection, vars] of Object.entries(tokens)) {
  if (collection.startsWith('$')) continue;
  for (const [name, t] of Object.entries(vars)) {
    const fmt = (x) => (x.alias ? `@${x.alias}` : String(x.value));
    if (t.modes) for (const [mode, m] of Object.entries(t.modes)) expected.push(`${collection}|${name}|${mode}|${fmt(m)}`);
    else expected.push(`${collection}|${name}||${fmt(t)}`);
  }
}
const figmaMap = new Map(snapshot.variables.map((l) => [key(l), val(l)]));
const codeMap = new Map(expected.map((l) => [key(l), val(l)]));
for (const [k, v] of codeMap) {
  if (!figmaMap.has(k)) errors.push(`Variable missing in Figma: ${k.replace(/\|$/, '')}`);
  else if (figmaMap.get(k) !== v) errors.push(`Variable differs: ${k.replace(/\|$/, '')}  code=${v}  figma=${figmaMap.get(k)}`);
}
for (const k of figmaMap.keys()) if (!codeMap.has(k)) errors.push(`Variable only in Figma (add to tokens or delete in Figma): ${k.replace(/\|$/, '')}`);

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
if (errors.length) {
  console.error(`✖ Figma ↔ code parity failed (${errors.length}), snapshot from ${snapshot.generatedAt} (${ageDays} days old):\n  - ${errors.join('\n  - ')}`);
  console.error('\nFix the drift, re-export the snapshot (npm run figma:snapshot-script), and run again.');
  process.exit(1);
}
const comps = Object.values(snapshot.components).filter((c) => !c.missing);
const props = comps.reduce((n, c) => n + Object.keys(c.properties || {}).length, 0);
console.log(`✔ Figma ↔ code parity: ${codeMap.size} variable values, ${comps.length} linked nodes (${props} properties, all wired), ${Object.keys(snapshot.textStyles).length} text styles. Snapshot ${ageDays} days old.`);
