// Blocking governance gate. Fails when the system drifts:
//  1. Tokens: every alias resolves; moded tokens define every mode.
//  2. Generated files are current (tokens.css and the DESIGN.md front matter match tokens/figma-variables.json).
//  3. Registry: every component has a valid status, a story file with that status tag and a Figma link,
//     a Figma node id in src/figma.ts, and a spec section in DESIGN.md; every component folder is registered.
//  4. Exceptions register entries are complete.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const errors = [];
const fail = (msg) => errors.push(msg);

// ---- 1. Token integrity ----
const tokens = JSON.parse(read('tokens/figma-variables.json'));
const primitives = tokens.Primitives;
for (const [collection, vars] of Object.entries(tokens)) {
  if (collection.startsWith('$')) continue;
  const modeSets = new Set();
  for (const [name, t] of Object.entries(vars)) {
    const refs = t.modes ? Object.values(t.modes).map((m) => m.alias) : t.alias ? [t.alias] : [];
    if (t.modes) modeSets.add(Object.keys(t.modes).join(','));
    for (const ref of refs) if (ref && !primitives[ref]) fail(`Token ${collection}/${name} aliases missing primitive "${ref}"`);
    if (name.includes('.')) fail(`Token name "${name}" contains "." (not allowed in Figma)`);
  }
  if (modeSets.size > 1) fail(`Collection ${collection} mixes mode sets: ${[...modeSets].join(' | ')}`);
}

// ---- 2. Generated files are current ----
execSync('node scripts/build-tokens.mjs', { stdio: 'ignore' });
const dirty = execSync('git status --porcelain -- src/styles/tokens.css DESIGN.md').toString().trim();
if (dirty && process.env.CI) fail(`Generated files are out of date. Run "npm run tokens" and commit:\n${dirty}`);

// ---- 3. Component registry ----
const registry = JSON.parse(read('governance/components.json'));
const figmaTs = read('src/figma.ts');
const design = read('DESIGN.md');
const allowed = Object.keys(registry.statuses);
const registeredFolders = new Set();
for (const c of registry.components) {
  const where = `Registry "${c.name}"`;
  if (!allowed.includes(c.status)) fail(`${where}: unknown status "${c.status}"`);
  if (!existsSync(new URL(`../${c.storyFile}`, import.meta.url))) { fail(`${where}: story file missing (${c.storyFile})`); continue; }
  registeredFolders.add(c.storyFile.split('/')[2]);
  const story = read(c.storyFile);
  if (!story.includes(`title: '${c.storyTitle}'`)) fail(`${where}: story title is not "${c.storyTitle}"`);
  if (!story.includes(`'status:${c.status}'`)) fail(`${where}: story is not tagged 'status:${c.status}'`);
  if (!story.includes(`FIGMA_NODES.${c.figmaKey}`)) fail(`${where}: story doesn't link FIGMA_NODES.${c.figmaKey}`);
  if (!new RegExp(`\\b${c.figmaKey}: '\\d+:\\d+'`).test(figmaTs)) fail(`${where}: src/figma.ts has no node id for "${c.figmaKey}"`);
  for (const spec of c.specs) if (!design.includes(`### ${spec}`)) fail(`${where}: DESIGN.md has no "### ${spec}" section`);
  if (c.status === 'beta' && !c.notes) fail(`${where}: beta components must list their known gaps in "notes"`);
}
for (const folder of readdirSync(new URL('../src/components', import.meta.url))) {
  if (!registeredFolders.has(folder)) fail(`src/components/${folder} is not in governance/components.json`);
}

// ---- 4. Exceptions register ----
const { exceptions } = JSON.parse(read('governance/a11y-exceptions.json'));
for (const e of exceptions) for (const key of ['id', 'rule', 'selector', 'reason', 'wcag', 'owner', 'added', 'review']) if (!e[key]) fail(`Exception ${e.id ?? '?'} is missing "${key}"`);

if (errors.length) {
  console.error(`✖ Governance check failed (${errors.length}):\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
const counts = Object.fromEntries(allowed.map((s) => [s, registry.components.filter((c) => c.status === s).length]).filter(([, n]) => n));
console.log(`✔ Governance check passed: ${registry.components.length} components ${JSON.stringify(counts)}, ${exceptions.length} a11y exception(s), tokens consistent.`);
