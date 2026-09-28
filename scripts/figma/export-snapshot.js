/**
 * Exports part of a parity snapshot of the Figma file. Runs inside Figma's plugin context
 * (figma-console `figma_execute` or the Figma MCP `use_figma`).
 *
 * `npm run figma:snapshot-script -- <part>` prints this file ready to run, where <part> is:
 *   variables-1 / variables-2  every local variable as "Collection|name|Mode|value" lines (split in two
 *                              so each result stays small)
 *   structure                  every component the code links to (src/figma.ts): name, variants,
 *                              properties, and whether each property is wired to a layer; plus
 *                              text-style variable bindings
 * Merge the three results into governance/figma-snapshot.json with `npm run figma:snapshot-save`,
 * then `npm run check:parity` compares it with the repo (in CI too).
 */
const PART = __PART__;
const NODES = __NODES__;

const toHex = (c) => '#' + [c.r, c.g, c.b, ...(c.a !== undefined && c.a < 1 ? [c.a] : [])].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = await figma.variables.getLocalVariablesAsync();
const byId = Object.fromEntries(variables.map((v) => [v.id, v]));

if (PART.startsWith('variables')) {
  const half = Math.ceil(collections.length / 2);
  const chosen = PART === 'variables-1' ? collections.slice(0, half) : collections.slice(half);
  const lines = [];
  for (const c of chosen) {
    for (const id of c.variableIds) {
      const v = byId[id];
      for (const m of c.modes) {
        const val = v.valuesByMode[m.modeId];
        const out = val && val.type === 'VARIABLE_ALIAS' ? '@' + byId[val.id].name : v.resolvedType === 'COLOR' ? toHex(val) : val;
        lines.push(`${c.name}|${v.name}|${c.modes.length > 1 ? m.name : ''}|${out}`);
      }
    }
  }
  return { part: PART, collections: chosen.map((c) => c.name), variables: lines };
}

// structure
const components = {};
for (const [key, id] of Object.entries(NODES)) {
  const node = await figma.getNodeByIdAsync(id);
  if (!node) { components[key] = { id, missing: true }; continue; }
  if (node.type !== 'COMPONENT_SET' && node.type !== 'COMPONENT') { components[key] = { id, name: node.name, type: node.type }; continue; }
  const owner = node.type === 'COMPONENT' && node.parent && node.parent.type === 'COMPONENT_SET' ? node.parent : node;
  const roots = owner.type === 'COMPONENT_SET' ? owner.children : [owner];
  const referenced = new Set();
  for (const r of roots) for (const n of [r, ...r.findAll(() => true)]) {
    if (n.componentPropertyReferences) Object.values(n.componentPropertyReferences).forEach((k) => referenced.add(k));
  }
  const properties = {};
  for (const [k, d] of Object.entries(owner.componentPropertyDefinitions)) {
    properties[k.split('#')[0]] = d.type === 'VARIANT'
      ? { type: 'VARIANT', options: d.variantOptions }
      : { type: d.type, default: d.type === 'INSTANCE_SWAP' ? '(instance)' : d.defaultValue, wired: referenced.has(k) };
  }
  components[key] = { id, name: owner.name, type: owner.type, variants: roots.length, properties };
}
const textStyles = {};
for (const s of await figma.getLocalTextStylesAsync()) {
  textStyles[s.name] = Object.fromEntries(Object.entries(s.boundVariables || {}).map(([k, v]) => [k, byId[v.id] ? byId[v.id].name : null]));
}
return { part: 'structure', components, textStyles };
