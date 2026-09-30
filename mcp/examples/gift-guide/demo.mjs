// npm run mcp:demo: an agent's run through the checkpointed build_page workflow, over the real MCP protocol.
// Attempt 1 drifts (a hand-built "HeroCarousel", a hex colour, "Add to cart", "Click here"); the checkpoints stop it
// where it goes wrong. Attempt 2 is the fixed work in this folder, which passes all six checkpoints.
import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const here = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
const client = new Client({ name: 'natural-demo-agent', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [new URL('../../server.mjs', import.meta.url).pathname] }));
const call = async (name, args = {}) => JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);
const say = (s) => console.log(s);

say('Brief: a gift guide section with three picks under $50\n');
const fp = await call('get_system_fingerprint');
say(`0 · anchor      system ${fp.version} (${fp.hash})`);

say('\n— Attempt 1 (drifted) —');
const plan1 = await call('review_plan', { brief: 'gift guide', components: ['Heading', 'HeroCarousel', 'ProductCard'], tokens: ['color/brown/900'] });
say(`1 · plan        ${plan1.pass ? 'pass' : 'STOP'}  ${plan1.issues.join(' | ')}`);
const run1 = await call('run_checkpoints', {
  fingerprint: fp,
  plan: { brief: 'gift guide', components: ['Heading', 'ProductCard', 'NavLink', 'Text'] },
  files: [{ path: 'src/components/GiftGuide/GiftGuide.css', code: '.nds-gift-guide { padding: 48px 40px; background: #F6EFE7; }\n' }],
  copy: { headings: ['Gifts Under $50'], buttons: ['Add to cart'], links: ['Click here'] },
});
say(`6 · final gate  ${run1.pass ? 'pass' : `STOP at ${run1.failedAt}`}`);
for (const e of run1.steps.at(-1).errors || []) say(`                ${e.message} → ${e.fix}`);

say('\n— Attempt 2 (fixed, files in this folder) —');
const files = [{ path: 'src/components/GiftGuide/GiftGuide.tsx', code: here('./GiftGuide.tsx') }, { path: 'src/components/GiftGuide/GiftGuide.css', code: here('./GiftGuide.css') }];
const run2 = await call('run_checkpoints', {
  fingerprint: fp,
  plan: { brief: 'gift guide', components: ['Heading', 'Text', 'ProductCard', 'NavLink'], tokens: ['layout/gutter', 'layout/section', 'layout/page-margin', 'bg/subtle', 'space/12'] },
  files,
  copy: { headings: ['Gifts under $50'], links: ['View all gifts under $50'], body: ['Small pieces made slowly: a cup for the first coffee, a vase for one stem, candles that burn clean.'],
    alts: ['River clay cup with a matte grey ash glaze pooling at the base', 'Small stoneware bud vase holding a single dried grass stem', 'Two hand-dipped beeswax tapers with slightly uneven drips'] },
  contrast: [{ foreground: 'fg/default', background: 'bg/subtle' }, { foreground: 'fg/muted', background: 'bg/subtle' }],
});
for (const s of run2.steps) say(`${s.checkpoint} · ${s.name.padEnd(13)} ${s.pass ? 'pass' : 'STOP'}${s.notes?.length ? `  (${s.notes.length} note)` : ''}`);
say(`\n${run2.pass ? '✔ All checkpoints passed.' : `✖ Stopped at ${run2.failedAt}`} ${run2.next}`);
await client.close();
process.exit(run2.pass ? 0 : 1);
