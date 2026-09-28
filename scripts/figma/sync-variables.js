/**
 * Pushes tokens/figma-variables.json into the Figma file's local variables.
 * Runs inside Figma's plugin context (via the figma-console Desktop Bridge / figma_execute).
 * `scripts/figma/print-sync.mjs` prints this file with TOKENS inlined, ready to execute.
 *
 * - Creates missing collections and variables, updates changed values and aliases.
 * - Tokens with "modes" (e.g. Typography: Desktop / Mobile) get one value per mode; missing modes are created.
 * - Never deletes variables: removals are reported so they can be handled deliberately
 *   (deleting a variable in Figma detaches it from every component that uses it).
 */
const TOKENS = __TOKENS__;

const hexToRgba = (hex) => {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
};

const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = await figma.variables.getLocalVariablesAsync();
const byName = {};
for (const v of variables) byName[v.name] = v;

const report = { created: [], updated: [], unchanged: 0, onlyInFigma: [] };
const pending = [];

for (const [collectionName, tokens] of Object.entries(TOKENS)) {
  if (collectionName.startsWith('$')) continue;
  let collection = collections.find((c) => c.name === collectionName);
  if (!collection) {
    collection = figma.variables.createVariableCollection(collectionName);
    collections.push(collection);
  }
  // Ensure named modes exist (first token with modes defines them)
  const withModes = Object.values(tokens).find((t) => t.modes);
  if (withModes) {
    Object.keys(withModes.modes).forEach((modeName, i) => {
      if (collection.modes.some((m) => m.name === modeName)) return;
      if (i === 0) collection.renameMode(collection.modes[0].modeId, modeName);
      else collection.addMode(modeName);
    });
  }
  const modeIdFor = (modeName) => (modeName ? collection.modes.find((m) => m.name === modeName).modeId : collection.modes[0].modeId);
  for (const [name, token] of Object.entries(tokens)) {
    let v = byName[name];
    if (!v) {
      v = figma.variables.createVariable(name, collection, token.type);
      if (collectionName === 'Primitives') v.scopes = [];
      byName[name] = v;
      report.created.push(name);
    }
    if (token.modes) {
      for (const [modeName, modeToken] of Object.entries(token.modes)) pending.push({ v, modeId: modeIdFor(modeName), token: { type: token.type, ...modeToken }, name: `${name} (${modeName})` });
    } else {
      pending.push({ v, modeId: modeIdFor(), token, name });
    }
  }
  const inJson = new Set(Object.keys(tokens));
  for (const id of collection.variableIds) {
    const v = variables.find((x) => x.id === id);
    if (v && !inJson.has(v.name)) report.onlyInFigma.push(v.name);
  }
}

// Second pass so aliases can point at variables created above.
for (const { v, modeId, token, name } of pending) {
  const current = v.valuesByMode[modeId];
  let next;
  if (token.alias) {
    const target = byName[token.alias];
    if (!target) throw new Error(`${name}: alias target ${token.alias} not found`);
    if (current && current.type === 'VARIABLE_ALIAS' && current.id === target.id) { report.unchanged++; continue; }
    next = { type: 'VARIABLE_ALIAS', id: target.id };
  } else if (token.type === 'COLOR') {
    next = hexToRgba(token.value);
    if (current && !current.type && ['r', 'g', 'b', 'a'].every((k) => Math.abs((current[k] ?? 1) - next[k]) < 0.002)) { report.unchanged++; continue; }
  } else {
    next = token.value;
    if (current === next) { report.unchanged++; continue; }
  }
  v.setValueForMode(modeId, next);
  if (!report.created.includes(name)) report.updated.push(name);
}

return report;
