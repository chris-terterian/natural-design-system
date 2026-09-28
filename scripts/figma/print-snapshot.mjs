// Prints export-snapshot.js for one part (variables-1, variables-2, structure), with the Figma node ids
// from src/figma.ts inlined, ready to run in Figma.
import { readFileSync } from 'node:fs';

const part = process.argv[2];
if (!['variables-1', 'variables-2', 'structure'].includes(part)) {
  console.error('Usage: npm run figma:snapshot-script -- <variables-1 | variables-2 | structure>');
  process.exit(1);
}
const figmaTs = readFileSync(new URL('../../src/figma.ts', import.meta.url), 'utf8');
const nodes = Object.fromEntries([...figmaTs.matchAll(/^\s+(\w+): '(\d+:\d+)',$/gm)].map((m) => [m[1], m[2]]));
const script = readFileSync(new URL('./export-snapshot.js', import.meta.url), 'utf8');
process.stdout.write(script.replace('__PART__', JSON.stringify(part)).replace('__NODES__', JSON.stringify(nodes)));
