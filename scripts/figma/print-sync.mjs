// Prints sync-variables.js with the current tokens inlined, for running in Figma's plugin context.
import { readFileSync } from 'node:fs';

const tokens = readFileSync(new URL('../../tokens/figma-variables.json', import.meta.url), 'utf8');
const script = readFileSync(new URL('./sync-variables.js', import.meta.url), 'utf8');
process.stdout.write(script.replace('__TOKENS__', tokens.trim()));
