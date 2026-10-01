// Smoke test for the Natural MCP server (npm run check:mcp, also in CI): starts it over stdio like an agent would,
// lists tools / resources / prompts, and calls every tool with a real question. Fails on any wrong answer.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({ name: 'natural-smoke', version: '1.0.0' });
// NATURAL_MCP_COMMAND='["npx","-y","github:chris-terterian/natural-design-system"]' tests an installed copy instead of this checkout.
const [command, ...cmdArgs] = process.env.NATURAL_MCP_COMMAND ? JSON.parse(process.env.NATURAL_MCP_COMMAND) : [process.execPath, new URL('./server.mjs', import.meta.url).pathname];
// NATURAL_MCP_ENV='{"PATH":"/usr/bin:/bin"}' launches with only that environment (like an app started from the Dock).
const env = process.env.NATURAL_MCP_ENV ? JSON.parse(process.env.NATURAL_MCP_ENV) : undefined;
await client.connect(new StdioClientTransport({ command, args: cmdArgs, env, cwd: process.env.NATURAL_MCP_CWD || process.cwd() }));
const errors = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };
const call = async (name, args = {}) => { const r = await client.callTool({ name, arguments: args }); return r.content[0].text; };
const J = async (name, args) => JSON.parse(await call(name, args));

const { tools } = await client.listTools();
const expected = ['list_components', 'get_component', 'get_guidelines', 'get_tokens', 'find_token', 'validate_code', 'check_contrast', 'get_system_fingerprint', 'review_plan', 'check_copy', 'run_checkpoints', 'propose_color_change', 'apply_color_change'];
ok(expected.every((t) => tools.some((x) => x.name === t)), `tools missing: ${expected.filter((t) => !tools.some((x) => x.name === t))}`);

const list = await J('list_components');
ok(list.components.length >= 19 && list.components.some((c) => c.name === 'Cart Drawer' && c.figma && c.storybook), 'list_components incomplete');

const card = await call('get_component', { name: 'CartLine' });
ok(card.includes('### 6.28 Cart Line') && card.includes('interface CartLineProps'), 'get_component: spec or props missing');

ok((await call('get_guidelines', { topic: 'voice' })).includes('Add to Bag'), 'get_guidelines(voice) missing UI vocabulary');

const roles = await J('get_tokens', { collection: 'Color', query: 'fg/' });
ok(roles.some((t) => t.name === 'fg/muted' && t.css === 'var(--nds-fg-muted)' && t.value === '#6B4F35'), 'get_tokens: fg/muted wrong');
const layout = await J('get_tokens', { collection: 'Layout', query: 'gutter' });
ok(layout[0]?.Desktop?.value === '24px' && layout[0]?.Mobile?.value === '16px', 'get_tokens: layout/gutter modes wrong');

const border = await J('find_token', { value: '#6B4F35', property: 'border-color' });
ok(border.use?.[0]?.name === 'border/hover', `find_token hex in border → ${border.use?.[0]?.name}`);
const text = await J('find_token', { value: '#6B4F35', property: 'color' });
ok(text.use?.[0]?.name === 'fg/muted', `find_token hex in color → ${text.use?.[0]?.name}`);
const px = await J('find_token', { value: '12px', property: 'padding' });
ok(px.publicScale?.some((s) => s.name === 'space/12'), 'find_token 12px → space/12');

const bad = await J('validate_code', { path: 'src/components/Demo/Demo.css', code: '.nds-demo { color: #6B4F35; padding: 12px; border-color: var(--nds-color-brown-900); }\n' });
ok(bad.pass === false && ['hardcoded-color', 'hardcoded-size', 'tier-primitive'].every((r) => bad.findings.some((f) => f.rule === r)), 'validate_code missed a violation');
const good = await J('validate_code', { path: 'src/components/Demo/Demo.css', code: '.nds-demo { color: var(--nds-fg-muted); padding: var(--nds-space-12); }\n' });
ok(good.pass === true, 'validate_code rejected valid code');

const c = await J('check_contrast', { foreground: 'fg/muted', background: 'bg/default' });
ok(c.ratio === '7.51:1' && c.text.AAA === true, `check_contrast fg/muted → ${c.ratio}`);

// ---- checkpoints: each must catch drift and pass good work
const fp = await J('get_system_fingerprint');
ok(/^\d+\.\d+\.\d+$/.test(fp.version) && fp.hash.length === 12, 'fingerprint malformed');
const badPlan = await J('review_plan', { brief: 'x', components: ['Button', 'HeroCarousel'], tokens: ['color/brown/900', 'fg/nope'] });
ok(!badPlan.pass && badPlan.issues.length === 3, `review_plan should reject invented component + hidden primitive + unknown token (got ${badPlan.issues.length})`);
const goodPlan = await J('review_plan', { brief: 'x', components: ['Heading', 'ProductCard', 'Button', 'CartDrawer'], tokens: ['layout/gutter', 'space/24', 'bg/subtle'] });
ok(goodPlan.pass && goodPlan.notes.some((n) => n.startsWith('Cart Drawer is Beta')), 'review_plan should pass and flag Beta');
const badCopy = await J('check_copy', { headings: ['Gifts Under Fifty'], buttons: ['Add to cart'], links: ['Click here'], alts: ['Image of a cup'] });
ok(!badCopy.pass && badCopy.issues.length >= 4, `check_copy should catch Title Case, cart, link text, alt (got ${badCopy.issues.length})`);
const goodCopy = await J('check_copy', { headings: ['Gifts under $50'], buttons: ['Add to Bag'], links: ['View all gifts'], alts: ['River clay cup with a matte ash glaze'] });
ok(goodCopy.pass, `check_copy rejected good copy: ${goodCopy.issues}`);
const css = '.nds-gift-guide { display: grid; gap: var(--nds-layout-gutter); padding: var(--nds-layout-section) var(--nds-layout-page-margin); background: var(--nds-bg-subtle); }\n';
const run = (over = {}) => J('run_checkpoints', { fingerprint: fp, plan: { brief: 'gift guide', components: ['Heading', 'ProductCard'] }, files: [{ path: 'src/components/GiftGuide/GiftGuide.css', code: css }], copy: { headings: ['Gifts under $50'], links: ['View all gifts'] }, contrast: [{ foreground: 'fg/default', background: 'bg/subtle' }], ...over });
ok((await run()).pass === true, 'run_checkpoints should pass good work');
const stale = await run({ fingerprint: { version: fp.version, hash: 'deadbeef0000' } });
ok(stale.failedAt === '0 · anchor', `stale fingerprint should stop at 0 (got ${stale.failedAt})`);
const styled = await run({ files: [{ path: 'src/components/GiftGuide/GiftGuide.css', code: '.nds-gift-guide { color: #3B2A1E; }\n' }] });
ok(styled.failedAt === '3 · style' && styled.steps.filter((x) => x.pass).length === 3, `hardcoded colour should stop at 3 after 0–2 pass (got ${styled.failedAt})`);
const worded = await run({ copy: { buttons: ['Add to cart'] } });
ok(worded.failedAt === '4 · content', `"cart" should stop at 4 (got ${worded.failedAt})`);
const faint = await run({ contrast: [{ foreground: 'fg/decorative', background: 'bg/default' }] });
ok(faint.failedAt === '5 · accessibility', `2.11:1 text should stop at 5 (got ${faint.failedAt})`);

// ---- colour changes (D-033): read back, contrast-gated, applied only with the approved id
const warm = await J('propose_color_change', { changes: [{ token: 'accent/bg', to: 'darker' }] });
ok(warm.pass && warm.changes[0].to === 'color/brown/300' && /Shall I apply it\?$/.test(warm.say), `propose: accent/bg darker → ${warm.changes?.[0]?.to}`);
const pale = await J('propose_color_change', { changes: [{ token: 'border/default', to: 'color/brown/300' }] });
ok(!pale.pass && pale.blocked[0]?.after === '2.11:1' && pale.say.includes("can't be applied"), 'propose should block a 2.11:1 border');
const step = await J('propose_color_change', { changes: [{ token: 'color/brown/600', to: '#A08060' }] });
ok(!step.pass && step.moved.length === 2 && step.blocked.some((b) => b.foreground === 'fg/subtle'), 'retuning a primitive should move every role on it and catch fg/subtle');
const fresh = await J('propose_color_change', { changes: [{ token: 'fg/sale', to: '#C2410C', primitiveName: 'color/clay/600' }] });
ok(fresh.pass && fresh.changes[0].newPrimitive?.name === 'color/clay/600', 'propose: new primitive for an off-palette hex');
ok((await call('propose_color_change', { changes: [{ token: 'fg/sale', to: 'darker' }] })).includes('already the darkest'), 'propose: darker past the end of the scale');
ok(/differ from proposal|needs a clone/.test(await call('apply_color_change', { changes: [{ token: 'accent/bg', to: 'darker' }], proposalId: 'not-approved' })), 'apply must refuse an unapproved proposal');

const { resources } = await client.listResources();
ok(resources.some((r) => r.uri === 'natural://design.md'), 'resource design.md missing');
const { prompts } = await client.listPrompts();
ok(['build_page', 'recolor'].every((n) => prompts.some((p) => p.name === n)), 'prompts build_page / recolor missing');

// The Figma script the apply step returns, run against a stand-in for Figma's variables API.
const { figmaScriptFor } = await import('./recolor.mjs');
const mk = (id, name, col) => ({ id, name, variableCollectionId: col, values: {}, setValueForMode(m, v) { this.values[m] = v; } });
const fv = [mk('p1', 'color/brown/300', 'P'), mk('p2', 'color/brown/300', 'C'), mk('c1', 'accent/bg', 'C'), mk('c2', 'fg/sale', 'C')]; // p2: same name in another collection
const figma = { variables: { getLocalVariableCollectionsAsync: async () => [{ id: 'P', name: 'Primitives', modes: [{ modeId: 'pm' }] }, { id: 'C', name: 'Color', modes: [{ modeId: 'light' }] }], getLocalVariablesAsync: async () => fv, createVariable: (n, c) => mk('new', n, c.id) } };
const runInFigma = new Function('figma', `return (async () => { ${figmaScriptFor([...warm.changes, ...fresh.changes])} })()`);
const out = await runInFigma(figma);
ok(fv[2].values.light?.id === 'p1' && fv[3].values.light?.id === 'new' && out.done.includes('created color/clay/600'), `Figma script: ${JSON.stringify(out.done)} (alias must target the Primitives variable, not a same-named one elsewhere)`);

await client.close();
if (errors.length) { console.error(`✖ MCP smoke test failed:\n  - ${errors.join('\n  - ')}`); process.exit(1); }
console.log(`✔ Natural MCP server: ${tools.length} tools, ${resources.length} resources, ${prompts.length} prompt(s) answered correctly.`);
