// Merges the three export results (saved as JSON files) into governance/figma-snapshot.json.
// Usage: npm run figma:snapshot-save -- <variables-1.json> <variables-2.json> <structure.json>
import { readFileSync, writeFileSync } from 'node:fs';

const parts = process.argv.slice(2).map((p) => JSON.parse(readFileSync(p, 'utf8')));
const byPart = Object.fromEntries(parts.map((p) => [p.part, p]));
for (const need of ['variables-1', 'variables-2', 'structure']) if (!byPart[need]) throw new Error(`Missing part: ${need}`);
const snapshot = {
  $comment: 'Figma parity snapshot, exported through the Figma MCP (scripts/figma/export-snapshot.js). Checked by npm run check:parity. Refresh after any Figma or token change, and before every release.',
  generatedAt: new Date().toISOString(),
  figmaFile: '84MjZXozBoKCvf9lwIU5pu',
  variables: [...byPart['variables-1'].variables, ...byPart['variables-2'].variables].sort(),
  components: byPart.structure.components,
  textStyles: byPart.structure.textStyles,
};
writeFileSync(new URL('../../governance/figma-snapshot.json', import.meta.url), JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Saved snapshot: ${snapshot.variables.length} variable values, ${Object.keys(snapshot.components).length} components, ${Object.keys(snapshot.textStyles).length} text styles.`);
