// Template and slot contracts gate (D-038). Checks that governance/templates.json is internally
// consistent and points at real registry components, that every valid example composition passes,
// and that every rejected example fails with exactly the rules it expects.
import { readFileSync } from 'node:fs';
import { expandProductRefs, validateComposition } from '../src/templates/contract.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const contract = read('governance/templates.json');
const registry = read('governance/components.json');
const examples = read('src/components/PageTemplate/examples.json');
const problems = [];

// 1. The contract itself
const names = new Set(registry.components.map((c) => c.name));
const kinds = Object.keys(contract.sections);
for (const [kind, def] of Object.entries(contract.sections)) {
  if (!names.has(def.component)) problems.push(`section "${kind}" points at "${def.component}", which isn't in governance/components.json`);
}
for (const fb of contract.personalization.fallbackSources) {
  if (!contract.sources[fb]) problems.push(`fallback source "${fb}" isn't a known source`);
  else if (contract.sources[fb].personalized) problems.push(`fallback source "${fb}" is personalised; a fallback must work with no history`);
}
for (const [id, t] of Object.entries(contract.templates)) {
  const seen = new Set();
  for (const slot of t.slots) {
    if (seen.has(slot.id)) problems.push(`${id}: slot "${slot.id}" is listed twice`);
    seen.add(slot.id);
    if (!(slot.min >= 0 && slot.max >= slot.min)) problems.push(`${id}.${slot.id}: min/max don't make sense (${slot.min}/${slot.max})`);
    for (const k of slot.accepts) if (!kinds.includes(k)) problems.push(`${id}.${slot.id}: accepts unknown section "${k}"`);
    for (const r of slot.rules ?? []) {
      if (!r.reason) problems.push(`${id}.${slot.id}: every rule needs a reason a person can read`);
      if (r.kind && !slot.accepts.includes(r.kind)) problems.push(`${id}.${slot.id}: rule "${r.type}" names "${r.kind}", which the slot doesn't accept`);
      for (const s of r.allow ?? []) if (!contract.sources[s]) problems.push(`${id}.${slot.id}: rule allows unknown source "${s}"`);
    }
  }
  for (const required of ['header', 'footer']) if (!seen.has(required)) problems.push(`${id}: every template needs a "${required}" slot`);
  if (!examples.valid[id]) problems.push(`${id}: no valid example in src/components/PageTemplate/examples.json`);
}

// 2. The examples
const expand = (c) => expandProductRefs(c, examples.products);
for (const [id, c] of Object.entries({ ...examples.valid, ...examples.personalised })) {
  const r = validateComposition(contract, expand(c));
  if (!r.valid) problems.push(`example "${id}" should pass but fails: ${r.errors.map((e) => `${e.rule} (${e.message})`).join('; ')}`);
}
for (const [id, { expect, composition }] of Object.entries(examples.rejected)) {
  const r = validateComposition(contract, expand(composition));
  const got = [...new Set(r.errors.map((e) => e.rule))].sort();
  const want = [...new Set(expect)].sort();
  if (got.join() !== want.join()) problems.push(`rejected example "${id}" should fail with [${want.join(', ')}] but failed with [${got.join(', ')}]`);
}

if (problems.length) {
  console.error(`✖ Template contracts: ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
const templates = Object.keys(contract.templates);
console.log(`✔ Template contracts: ${templates.length} templates (${templates.join(', ')}), ${kinds.length} section kinds; ${Object.keys(examples.valid).length + Object.keys(examples.personalised).length} examples pass and ${Object.keys(examples.rejected).length} are rejected as expected.`);
