#!/usr/bin/env node
// Natural MCP server: the design system as tools for AI agents (D-031).
// Everything is read live from the repo (DESIGN.md, tokens/figma-variables.json, governance/components.json,
// src/figma.ts, component sources) and validation reuses scripts/validate-file.mjs, so the server can't drift
// from the system it describes.
//
// Run:   npm run mcp            (stdio; registered for Claude Code as "natural" in .mcp.json)
// Tools: list_components · get_component · get_guidelines · get_tokens · find_token · validate_code · check_contrast
// Checkpoints (stop-and-verify workflow against drift): get_system_fingerprint (0) · review_plan (1) · validate_code (2, 3)
//   · check_copy (4) · check_contrast (5) · run_checkpoints (6: all gates in order, then human review)
// Colour by voice or text (D-033): propose_color_change (reads the change back with its contrast impact) ·
//   apply_color_change (writes the tokens, returns the Figma script) · prompt recolor
// Prompts: build_page (walks the checkpoints) · recolor
// `natural-mcp setup …` registers the server with Claude Desktop / Cursor / Claude Code instead of starting it.
if (process.argv[2] === 'setup') { await import('./setup.mjs'); process.exit(0); }
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { validateSource } from '../scripts/validate-file.mjs';
import { proposeColorChange, figmaScriptFor, colorOf, colorModes, brands, primitiveOf } from './recolor.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));
const FIGMA_FILE = 'https://www.figma.com/design/84MjZXozBoKCvf9lwIU5pu/Natural-Design-System';
const STORYBOOK = 'https://chris-terterian.github.io/natural-design-system/';

// ---------------------------------------------------------------- sources
const design = () => read('DESIGN.md').replace(/^---\n[\s\S]*?\n---\n/, '');
const tokens = () => JSON.parse(read('tokens/figma-variables.json'));
const registry = () => JSON.parse(read('governance/components.json')).components;
const figmaNodes = () => Object.fromEntries([...read('src/figma.ts').matchAll(/^\s+(\w+): '(\d+:\d+)',$/gm)].map((m) => [m[1], m[2]]));
const figmaUrl = (id) => `${FIGMA_FILE}?node-id=${id.replace(':', '-')}`;
const storyUrl = (title) => `${STORYBOOK}?path=/docs/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}--docs`;
const cssVar = (name) => `--nds-${name.replaceAll('/', '-')}`;

/** Markdown section starting at a heading line that matches `re`, up to the next heading of the same or higher level. */
const section = (md, re) => {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => re.test(l));
  if (start < 0) return null;
  const level = lines[start].match(/^#+/)[0].length;
  let end = lines.findIndex((l, i) => i > start && /^#+ /.test(l) && l.match(/^#+/)[0].length <= level);
  if (end < 0) end = lines.length;
  return lines.slice(start, end).join('\n').replace(/\n---\s*$/, '').trim();
};
const text = (s) => ({ content: [{ type: 'text', text: s }] });
const json = (o) => text(JSON.stringify(o, null, 2));

// Resolve a token (any tier) to its primitive value, per mode.
const resolveToken = (t, all) => {
  const prim = all.Primitives;
  // A palette step (Brand) resolves to its primitive in the default brand, Natural.
  const val = (alias) => { const p = prim[alias] ?? prim[primitiveOf(all, alias)]; return p ? (p.type === 'COLOR' ? p.value : `${p.value}px`) : alias; };
  if (t.modes) return Object.fromEntries(Object.entries(t.modes).map(([m, x]) => [m, { value: val(x.alias), ref: x.alias }]));
  return t.alias ? { value: val(t.alias), ref: t.alias } : { value: t.type === 'COLOR' ? t.value : `${t.value}px` };
};

// ---------------------------------------------------------------- server
const server = new McpServer({ name: 'natural-design-system', version: pkg.version });

server.registerTool('list_components', {
  title: 'List components',
  description: 'Every component in the Natural Design System with status (stable/beta), code exports, Figma and Storybook links. Start here, and prefer these components over writing new UI.',
  inputSchema: {},
}, async () => {
  const nodes = figmaNodes();
  return json({
    version: pkg.version,
    import: "import { … } from 'natural-design-system'; import 'natural-design-system/styles.css';",
    components: registry().map((c) => ({ name: c.name, status: c.status, exports: c.exports, figma: nodes[c.figmaKey] ? figmaUrl(nodes[c.figmaKey]) : null, storybook: storyUrl(c.storyTitle), spec: c.specs.map((s) => `DESIGN.md § ${s}`) })),
  });
});

server.registerTool('get_component', {
  title: 'Get component',
  description: 'The full spec of one component: when to use it, Figma property ↔ code prop table, tokens, states, do / don\'t, keyboard and screen-reader behaviour, known gaps, and its TypeScript props. Accepts the component name or any export (e.g. "Cart Line", "CartLine", "TextField").',
  inputSchema: { name: z.string().describe('Component name or export, e.g. "Button", "RangeSlider", "Product Card"') },
}, async ({ name }) => {
  const q = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const c = registry().find((r) => r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === q || r.exports.some((e) => e.toLowerCase() === q));
  if (!c) return text(`No component "${name}". Available: ${registry().map((r) => r.name).join(', ')}`);
  const md = design();
  const specs = c.specs.map((s) => section(md, new RegExp(`^### ${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)) || `(spec § ${s} not found)`);
  const folder = c.storyFile.split('/')[2];
  const srcPath = `src/components/${folder}/${folder}.tsx`;
  const props = existsSync(new URL(`../${srcPath}`, import.meta.url))
    ? [...read(srcPath).matchAll(/export (?:interface|type) \w+Props[\s\S]*?\n}\n/g)].map((m) => m[0]).join('\n')
    : '';
  const node = figmaNodes()[c.figmaKey];
  return text([
    `# ${c.name} (${c.status})`,
    `Exports: ${c.exports.join(', ')} · Figma: ${node ? figmaUrl(node) : 'n/a'} · Storybook: ${storyUrl(c.storyTitle)}`,
    c.notes ? `Known gaps / notes: ${c.notes}` : '',
    ...specs,
    props ? `## TypeScript props\n\`\`\`ts\n${props}\`\`\`` : '',
  ].filter(Boolean).join('\n\n'));
});

const GUIDE = {
  brand: /^## 1\. /, voice: /^## 2\. /, content: /^## 2\. /, foundations: /^## 3\. /, colour: /^### 3\.1 /, color: /^### 4\.2 /,
  'colour-roles': /^### 4\.2 /, type: /^### 3\.2 /, typography: /^### 3\.2 /, space: /^### 3\.3 /, spacing: /^### 3\.3 /,
  icons: /^### 3\.5 /, imagery: /^### 3\.6 /, layout: /^### 4\.4 /, tokens: /^## 5\. /, patterns: /^## 7\. /,
  accessibility: /^## 8\. /, a11y: /^## 8\. /, workflow: /^## 9\. /,
};
server.registerTool('get_guidelines', {
  title: 'Get guidelines',
  description: `Brand, voice and content rules, foundations and accessibility from DESIGN.md. Topics: ${Object.keys(GUIDE).join(', ')}.`,
  inputSchema: { topic: z.enum(Object.keys(GUIDE)).describe('Which guideline to read') },
}, async ({ topic }) => text(section(design(), GUIDE[topic]) || `No section for "${topic}".`));

server.registerTool('get_tokens', {
  title: 'Get tokens',
  description: 'Design tokens by tier: Brand (palette steps per brand: Natural, Tide), Color (semantic roles, Light / Dark), Dimension, Layout (Desktop/Mobile), Typography, Component (one-offs), Primitives. Each entry has its value(s), the primitive it aliases and its CSS variable. Components must use roles and the public scale (space/*, radius/*, border-width/*), never colour or type primitives.',
  inputSchema: {
    collection: z.enum(['Color', 'Brand', 'Dimension', 'Layout', 'Typography', 'Component', 'Primitives']).optional().describe('Omit for an overview of the tiers'),
    query: z.string().optional().describe('Filter by substring of the token name, e.g. "fg/", "focus", "gutter"'),
  },
}, async ({ collection, query }) => {
  const all = tokens();
  if (!collection && !query) {
    return text([section(design(), /^## 5\. /), '', 'Counts: ' + Object.entries(all).filter(([k]) => !k.startsWith('$')).map(([k, v]) => `${k} ${Object.keys(v).length}`).join(' · ')].join('\n'));
  }
  const out = [];
  for (const [col, vars] of Object.entries(all)) {
    if (col.startsWith('$') || (collection && col !== collection)) continue;
    for (const [name, t] of Object.entries(vars)) if (!query || name.includes(query)) out.push({ collection: col, name, css: `var(${cssVar(name)})`, ...resolveToken(t, all) });
  }
  return json(out.slice(0, 200));
});

const hexOf = (s) => { const m = s.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!m) return null; const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]; return `#${h.toUpperCase()}`; };
server.registerTool('find_token', {
  title: 'Find token',
  description: 'Which token to use. Give a raw value (a hex colour or a px number) and the CSS property it is for, or describe the intent ("secondary text", "hover fill", "page margin"). Returns the role(s) to use, in preference order.',
  inputSchema: {
    value: z.string().optional().describe('e.g. "#6B4F35" or "12" / "12px"'),
    property: z.string().optional().describe('CSS property it is for, e.g. "color", "border-color", "background", "padding", "gap"'),
    intent: z.string().optional().describe('Plain-language role, e.g. "secondary text", "divider", "focus ring", "control height"'),
  },
}, async ({ value, property = '', intent }) => {
  const all = tokens();
  const semantic = ['Color', 'Dimension', 'Layout', 'Typography'];
  // Default mode (Light / Desktop) decides the match: a hex from a light-mode mock maps to the role that shows it there.
  const defaultAlias = (t) => primitiveOf(all, t.alias || Object.values(t.modes || {})[0]?.alias);
  const aliasesOf = (prim) => semantic.flatMap((col) => Object.entries(all[col]).filter(([, t]) => defaultAlias(t) === prim).map(([n]) => ({ collection: col, name: n, css: `var(${cssVar(n)})` })));
  if (value) {
    const hex = hexOf(value);
    if (hex) {
      const prims = Object.entries(all.Primitives).filter(([, t]) => t.type === 'COLOR' && t.value.toUpperCase().startsWith(hex)).map(([n]) => n);
      if (!prims.length) return text(`${hex} is not in the palette. Pick a role from get_tokens({ collection: "Color" }) or propose one (GOVERNANCE.md §4).`);
      const role = /background|fill/.test(property) ? /^(bg|control|accent)\// : /^color$/.test(property) ? /^fg\// : /outline/.test(property) ? /^focus\// : /border|stroke/.test(property) ? /^border\// : /shadow/.test(property) ? /^shadow\// : /./;
      const roles = prims.flatMap(aliasesOf);
      const best = roles.filter((r) => role.test(r.name));
      return json({ value: hex, primitive: prims, use: best.length ? best : roles, note: 'Components never bind the primitive itself.' });
    }
    const px = Number(value.replace(/px$/, ''));
    if (!Number.isNaN(px)) {
      const scale = Object.entries(all.Primitives).filter(([n, t]) => t.type !== 'COLOR' && t.value === px && /^(space|radius|border-width|size|font-size|line-height)\//.test(n));
      return json({ value: `${px}px`, roles: scale.flatMap(([n]) => aliasesOf(n)), publicScale: scale.filter(([n]) => /^(space|radius|border-width)\//.test(n)).map(([n]) => ({ name: n, css: `var(${cssVar(n)})` })), note: px && !scale.length ? `${px}px is off the scale; use the nearest step (get_tokens with query "space/").` : undefined });
    }
  }
  if (intent) {
    const words = intent.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    const rows = (section(design(), /^### 4\.2 /) || '').split('\n').filter((l) => l.startsWith('| `'));
    const hits = rows.map((l) => ({ l, score: words.filter((w) => l.toLowerCase().includes(w)).length })).filter((x) => x.score).sort((a, b) => b.score - a.score).slice(0, 5).map((x) => x.l);
    const names = semantic.flatMap((col) => Object.keys(all[col]).filter((n) => words.some((w) => n.includes(w))).map((n) => ({ collection: col, name: n, css: `var(${cssVar(n)})` })));
    return json({ intent, colourRoles: hits, tokens: names.slice(0, 10) });
  }
  return text('Give a value (with the CSS property) or an intent.');
});

server.registerTool('validate_code', {
  title: 'Validate code',
  description: 'Run the system\'s pre-commit guardrail (validate_file) on code you wrote, before a person reviews it. Blocks hardcoded values, token-tier violations (colour/type primitives, other components\' tokens), broken naming and placeholder link text; warns on static accessibility issues. Every finding comes with a fix. Iterate until it passes.',
  inputSchema: {
    code: z.string().describe('The file contents'),
    path: z.string().describe('Repo-relative path the code would live at, e.g. "src/components/GiftGuide/GiftGuide.css" or ".tsx". Decides the rules (CSS vs TSX) and which Component tokens are its own.'),
  },
}, async ({ code, path }) => {
  const findings = validateSource(path, code);
  const errors = findings.filter((f) => f.severity === 'error');
  return json({
    pass: errors.length === 0,
    summary: `${errors.length} error(s), ${findings.length - errors.length} warning(s)`,
    findings: findings.map((f) => ({ line: f.line, severity: f.severity, rule: f.rule, message: f.message, fix: f.fix, text: f.text?.trim() })),
  });
});

const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255].map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0); };
server.registerTool('check_contrast', {
  title: 'Check contrast',
  description: 'WCAG 2.2 contrast between two colours (hex, or a Color role such as "fg/muted" or "bg/subtle"). Reports AA / AAA for normal and large text and the 3:1 non-text threshold. Roles have a value per Color mode: the top-level result is Light (or the mode you ask for), and `modes` reports every mode.',
  inputSchema: { foreground: z.string(), background: z.string(), mode: z.string().optional().describe('Color mode, e.g. "Light" (default) or "Dark"'), brand: z.string().optional().describe('Brand, e.g. "Natural" (default) or "Tide"') },
}, async ({ foreground, background, mode = 'Light', brand }) => {
  const all = tokens();
  brand ??= brands(all)[0];
  const measure = (m, b0 = brand) => {
    const [a, b] = [colorOf(all, foreground, m, b0), colorOf(all, background, m, b0)];
    if (!a || !b) return null;
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    const r = Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
    return { foreground: a, background: b, ratio: `${r}:1`, text: { AA: r >= 4.5, AAA: r >= 7 }, largeText: { AA: r >= 3, AAA: r >= 4.5 }, nonText: { '3:1': r >= 3 } };
  };
  const main = measure(mode);
  if (!main) return text(`Unknown colour: ${!colorOf(all, foreground, mode) ? foreground : background}. Use a hex value or a Color role (get_tokens({ collection: "Color" })).`);
  return json({ brand, mode, ...main, modes: Object.fromEntries(colorModes(all).map((m) => [m, measure(m)])), brands: Object.fromEntries(brands(all).map((b) => [b, Object.fromEntries(colorModes(all).map((m) => [m, measure(m, b)?.ratio]))])) });
});

// ---------------------------------------------------------------- checkpoints (anti-drift workflow)
// AI work is split into small steps; each ends at a checkpoint that must pass before the next starts, so a wrong turn
// is caught where it happens instead of in review. Checkpoint 0 anchors the agent to the current system; 6 re-runs
// everything in order, confirms the system didn't change underneath the work, and hands over to a person.

/** Identity of the system the agent is working against: version + hash of tokens, registry and spec. */
const fingerprint = () => ({
  version: pkg.version,
  hash: createHash('sha256').update(read('tokens/figma-variables.json')).update(read('governance/components.json')).update(design()).digest('hex').slice(0, 12),
});

const findComponent = (name) => {
  const q = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return registry().find((r) => r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === q || r.exports.some((e) => e.toLowerCase() === q));
};
const HIDDEN = /^(color|size|font-size|line-height|letter-spacing|elevation)\//;
const reviewPlan = ({ components = [], tokens: toks = [], newComponents = [] }) => {
  const all = tokens(); const issues = []; const notes = [];
  const allNames = new Map(Object.entries(all).filter(([k]) => !k.startsWith('$')).flatMap(([col, v]) => Object.keys(v).map((n) => [n, col])));
  for (const c of components) {
    const hit = findComponent(c);
    if (!hit) issues.push(`"${c}" is not a Natural component. Use list_components; don't invent one.`);
    else if (hit.status === 'beta') notes.push(`${hit.name} is Beta: ${hit.notes}`);
  }
  for (const t of toks) {
    const col = allNames.get(t);
    if (!col) issues.push(`Token "${t}" doesn't exist (get_tokens / find_token).`);
    else if (col === 'Primitives' && HIDDEN.test(t)) issues.push(`"${t}" is a hidden primitive; use a role (find_token).`);
  }
  for (const n of newComponents) issues.push(`New component "${n.name || n}": new parts go through the Proposal flow (GOVERNANCE.md §4) before code; compose existing components for now.`);
  if (!components.length) issues.push('The plan lists no components. Name the Natural components you will compose.');
  return { pass: issues.length === 0, issues, notes };
};

const PLACEHOLDER = /^(click here|click|here|read more|learn more|more|link|this link|go|continue|details|link \d+)$/i;
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with', '&']);
const PROPER = /\b(Add to Bag|Natural)\b/g;
const isTitleCase = (s) => { const w = s.replace(PROPER, '').split(/\s+/).filter((x) => /^[A-Za-z]/.test(x)); const big = w.slice(1).filter((x) => !SMALL.has(x.toLowerCase())); return big.length >= 1 && big.every((x) => /^[A-Z][a-z]/.test(x)); };
const checkCopy = ({ headings = [], buttons = [], links = [], alts = [], body = [] }) => {
  const issues = []; const warnings = [];
  const every = [...headings, ...buttons, ...links, ...alts, ...body];
  for (const t of every) {
    if (/\bcart\b/i.test(t)) issues.push(`"${t}": Natural says "bag", never "cart" (Add to Bag, Your bag).`);
    if (/\b[A-Z]{4,}\b/.test(t)) issues.push(`"${t}": no ALL CAPS.`);
    if (/lorem ipsum|product name|placeholder/i.test(t)) issues.push(`"${t}": placeholder copy; use real Natural products (split log bench, river clay cup…).`);
    if (/!/.test(t)) warnings.push(`"${t}": avoid exclamation marks.`);
  }
  for (const t of [...headings, ...buttons]) if (isTitleCase(t)) issues.push(`"${t}": sentence case, not Title Case.`);
  for (const b of buttons) if (/add to (basket|bag)/i.test(b) && b !== 'Add to Bag') issues.push(`"${b}": the purchase button is exactly "Add to Bag".`);
  for (const l of links) if (PLACEHOLDER.test(l.trim())) issues.push(`Link "${l}": say where it goes ("View all cups", "Read the care guide").`);
  for (const a of alts) {
    if (/^(image|picture|photo|photograph) of/i.test(a)) issues.push(`Alt "${a}": don't start with "Image of"; describe it, material first.`);
    else if (a && a.split(/\s+/).length < 3) warnings.push(`Alt "${a}": too thin; describe the piece, material first ("River clay cup with a matte ash glaze").`);
  }
  return { pass: issues.length === 0, issues, warnings };
};

server.registerTool('get_system_fingerprint', {
  title: 'Checkpoint 0: anchor',
  description: 'Start of every task: returns the version and a hash of the tokens, component registry and spec you are working against. Pass it to run_checkpoints at the end; if the system changed meanwhile, the work is re-checked against the new one instead of drifting from it.',
  inputSchema: {},
}, async () => json({ ...fingerprint(), next: 'Checkpoint 1: review_plan with the components and tokens you intend to use.' }));

server.registerTool('review_plan', {
  title: 'Checkpoint 1: plan',
  description: 'Before writing code: list the Natural components (and any tokens) you will use. Rejects invented components, hidden primitives and unapproved new parts; flags Beta components and their gaps. Do not start building until pass is true.',
  inputSchema: {
    brief: z.string().describe('What you are building, in one sentence'),
    components: z.array(z.string()).describe('Natural components you will compose, e.g. ["Heading", "ProductCard", "Button"]'),
    tokens: z.array(z.string()).optional().describe('Tokens for any layout CSS, e.g. ["layout/gutter", "space/24", "bg/subtle"]'),
    newComponents: z.array(z.string()).optional().describe('Anything you think the system lacks (these fail: propose them instead)'),
  },
}, async (args) => json({ checkpoint: 1, ...reviewPlan(args), next: 'Checkpoint 2: write the markup with those components, then validate_code on each .tsx file.' }));

server.registerTool('check_copy', {
  title: 'Checkpoint 4: content',
  description: 'Check UI copy against the Natural voice: "bag" not "cart", exactly "Add to Bag", sentence case, no ALL CAPS or placeholder copy, link text that says where it goes, material-first alt text.',
  inputSchema: {
    headings: z.array(z.string()).optional(), buttons: z.array(z.string()).optional(), links: z.array(z.string()).optional(),
    alts: z.array(z.string()).optional(), body: z.array(z.string()).optional(),
  },
}, async (args) => json({ checkpoint: 4, ...checkCopy(args), next: 'Checkpoint 5: check_contrast for any colour pairing you introduced.' }));

server.registerTool('run_checkpoints', {
  title: 'Checkpoint 6: final gate',
  description: 'Run every checkpoint in order (0 anchor → 1 plan → 2 structure → 3 style → 4 content → 5 accessibility) and stop at the first that fails. Passing means ready for a person to review, never auto-merge.',
  inputSchema: {
    fingerprint: z.object({ version: z.string(), hash: z.string() }).describe('What get_system_fingerprint returned at the start'),
    plan: z.object({ brief: z.string(), components: z.array(z.string()), tokens: z.array(z.string()).optional() }),
    files: z.array(z.object({ path: z.string(), code: z.string() })).describe('Every file you wrote, with its repo-relative path'),
    copy: z.object({ headings: z.array(z.string()).optional(), buttons: z.array(z.string()).optional(), links: z.array(z.string()).optional(), alts: z.array(z.string()).optional(), body: z.array(z.string()).optional() }),
    contrast: z.array(z.object({ foreground: z.string(), background: z.string(), largeText: z.boolean().optional() })).optional(),
  },
}, async ({ fingerprint: fp, plan, files, copy, contrast = [] }) => {
  const steps = [];
  const stop = (n, name, detail) => json({ pass: false, failedAt: `${n} · ${name}`, steps: [...steps, { checkpoint: n, name, pass: false, ...detail }], next: 'Fix this checkpoint and run again. Later checkpoints were not run.' });
  const now = fingerprint();
  if (fp.hash !== now.hash) return stop(0, 'anchor', { detail: `The system changed since you started (${fp.version}/${fp.hash} → ${now.version}/${now.hash}). Re-read the components and tokens you used, then run again with the new fingerprint.` });
  steps.push({ checkpoint: 0, name: 'anchor', pass: true });
  const p = reviewPlan(plan);
  if (!p.pass) return stop(1, 'plan', p);
  steps.push({ checkpoint: 1, name: 'plan', pass: true, notes: p.notes });
  for (const [n, name, re] of [[2, 'structure', /\.(tsx|ts)$/], [3, 'style', /\.css$/]]) {
    const results = files.filter((f) => re.test(f.path)).map((f) => ({ path: f.path, findings: validateSource(f.path, f.code) }));
    const errs = results.flatMap((r) => r.findings.filter((x) => x.severity === 'error').map((x) => ({ path: r.path, line: x.line, rule: x.rule, message: x.message, fix: x.fix })));
    if (errs.length) return stop(n, name, { errors: errs });
    steps.push({ checkpoint: n, name, pass: true, files: results.length });
  }
  const c = checkCopy(copy);
  if (!c.pass) return stop(4, 'content', c);
  steps.push({ checkpoint: 4, name: 'content', pass: true, warnings: c.warnings });
  const all = tokens();
  const failing = [];
  for (const pr of contrast) for (const br of brands(all)) for (const m of colorModes(all)) { // every pairing, every brand and Color mode
    const [a, b] = [colorOf(all, pr.foreground, m, br), colorOf(all, pr.background, m, br)]; if (!a || !b) { failing.push({ ...pr, brand: br, mode: m, error: 'unknown colour' }); continue; }
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); const r = (x + 0.05) / (y + 0.05);
    if (r < (pr.largeText ? 3 : 4.5)) failing.push({ ...pr, brand: br, mode: m, ratio: `${r.toFixed(2)}:1` });
  }
  const a11yWarnings = files.flatMap((f) => validateSource(f.path, f.code).filter((x) => x.severity === 'warn').map((x) => `${f.path}:${x.line} ${x.message}`));
  if (failing.length) return stop(5, 'accessibility', { contrast: failing, warnings: a11yWarnings });
  steps.push({ checkpoint: 5, name: 'accessibility', pass: true, warnings: a11yWarnings });
  return json({
    pass: true, steps, fingerprint: now,
    next: 'Ready for human review (not merge). Reviewer: check the rendered result in Storybook, keyboard and screen-reader behaviour, and that the copy fits the brand; then open a pull request, where the full CI gates run again.',
  });
});

// ---------------------------------------------------------------- colour changes (D-033)
// Spoken or typed, a colour change is a token change: a role re-pointed or a primitive retuned, contrast-checked,
// read back, applied only with the id the person approved, then mirrored to Figma from the same tokens.
const colorChange = z.array(z.object({
  token: z.string().describe('A Color role ("fg/sale", "accent/bg") or a colour primitive ("color/brown/600")'),
  to: z.string().describe('For a role: a palette step ("palette/neutral/700"), a primitive or hex that is a palette step in the default brand, or "darker" / "lighter" (next palette step). For a primitive: a hex value.'),
  mode: z.string().optional().describe('For a role: which Color mode to change, "Light" (default) or "Dark". Primitives change in every mode that uses them.'),
})).min(1);
server.registerTool('propose_color_change', {
  title: 'Propose a colour change (voice or text)',
  description: 'Turn a colour request into token edits and check them. Returns the edits, every role that moves, the contrast before / after for each pairing the system promises (DESIGN.md §4.2), and `say`: a short read-back for the person (works for voice). Changes that would break WCAG AA are blocked. Writes nothing.',
  inputSchema: { changes: colorChange },
}, async ({ changes }) => {
  try { const { next, ...p } = proposeColorChange(tokens(), changes); return json({ ...p, next: p.pass ? 'Read `say` back to the person. Apply only after a clear yes: apply_color_change with the same changes and this proposalId.' : 'Blocked. Suggest a value that keeps every pairing at its minimum (check_contrast helps), and propose again.' }); }
  catch (e) { return text(e.message); }
});
server.registerTool('apply_color_change', {
  title: 'Apply an approved colour change',
  description: 'After the person said yes to a proposal: writes tokens/figma-variables.json, regenerates tokens.css and DESIGN.md, and returns the Figma script (run it with the Figma MCP use_figma on the Natural Design System file) plus the steps to finish. Needs a clone of the repo; refuses anything that differs from the approved proposal or fails contrast.',
  inputSchema: { changes: colorChange, proposalId: z.string().describe('The proposalId the person approved') },
}, async ({ changes, proposalId }) => {
  const root = new URL('..', import.meta.url);
  if (!existsSync(new URL('.git', root))) return text('apply_color_change edits the repo, so it needs a clone (git clone https://github.com/chris-terterian/natural-design-system, then npm install and run the server from there). propose_color_change works anywhere.');
  let p; try { p = proposeColorChange(tokens(), changes); } catch (e) { return text(e.message); }
  if (p.proposalId !== proposalId) return text(`These changes (or the tokens) differ from proposal ${proposalId}. Propose again and get a new yes.`);
  if (!p.pass) return json({ applied: false, blocked: p.blocked });
  writeFileSync(new URL('tokens/figma-variables.json', root), JSON.stringify(p.next, null, 2) + '\n');
  const build = spawnSync(process.execPath, ['scripts/build-tokens.mjs'], { cwd: root, encoding: 'utf8' });
  if (build.status !== 0) return text(`Tokens written, but regenerating failed:\n${build.stderr}`);
  return json({
    applied: true, changes: p.changes, moved: p.moved,
    figma: { fileKey: '84MjZXozBoKCvf9lwIU5pu', tool: 'use_figma (load the figma-use skill first)', script: figmaScriptFor(p.changes) },
    next: [
      'Run figma.script with use_figma on the Natural Design System file and check it returns every change in `done`.',
      'Refresh the parity snapshot (npm run figma:snapshot-script -- variables-1 | variables-2 | structure via use_figma, then npm run figma:snapshot-save), then npm run check.',
      'Add a CHANGELOG entry (a colour change is a minor release in 0.x) and update the DESIGN.md §4.2 table if a role moved.',
      'Ask the person before committing; open a pull request. Never push to main or merge.',
    ],
  });
});

// ---------------------------------------------------------------- resources & prompt
server.registerResource('design-md', 'natural://design.md', { title: 'DESIGN.md', description: 'The full design brief: brand, voice, foundations, token architecture, every component spec, patterns, accessibility.', mimeType: 'text/markdown' },
  async (uri) => ({ contents: [{ uri: uri.href, text: read('DESIGN.md') }] }));
server.registerResource('tokens', 'natural://tokens.json', { title: 'Tokens', description: 'Every token by tier, mirroring the Figma variables.', mimeType: 'application/json' },
  async (uri) => ({ contents: [{ uri: uri.href, text: read('tokens/figma-variables.json') }] }));

server.registerPrompt('build_page', {
  title: 'Build a page with Natural (checkpointed)',
  description: 'Build a page or section from the Natural Design System in small verified steps, stopping at each checkpoint, so the work cannot drift from the system.',
  argsSchema: { brief: z.string().describe('What to build, e.g. "a gift guide section with three product picks under $50"') },
}, ({ brief }) => ({
  messages: [{ role: 'user', content: { type: 'text', text: [
    `Build this with the Natural Design System: ${brief}`,
    '',
    'Work in small steps. After each step, run its checkpoint, report the result in one line, and do not start the next step until it passes. If a checkpoint fails, fix only what it names and run it again. Never skip ahead.',
    '',
    '0. Anchor: get_system_fingerprint. Keep the result.',
    '1. Plan: read get_guidelines("voice") and list_components, then get_component for each part you need. Checkpoint → review_plan with the components and tokens you will use.',
    '2. Structure: write the markup (TSX) composing those components only; no hand-built buttons, cards, badges or fields. Checkpoint → validate_code on each .tsx file.',
    '3. Style: write layout CSS with tokens only (find_token / get_tokens: roles for colour, space/* for spacing, layout/* for page rhythm). Checkpoint → validate_code on each .css file.',
    '4. Content: collect every heading, button label, link text, alt text and body line. Checkpoint → check_copy.',
    '5. Accessibility: for any colour pairing that isn\'t inside a component, check_contrast; resolve validate_code warnings. Checkpoint → all pairs pass.',
    '6. Final gate: run_checkpoints with the fingerprint from step 0, the plan, all files and all copy. It re-runs 0–5 in order and stops at the first failure.',
    '',
    'When run_checkpoints passes, stop. Reply with the files, the checkpoint report, and what a person should review. Do not merge or publish anything yourself.',
  ].join('\n') } }],
}));

server.registerPrompt('recolor', {
  title: 'Change colours by voice (through the tokens)',
  description: 'Say what colour should change ("make the sale price a bit darker", "use a warmer sand for the primary button"). It becomes a token change, is read back with its contrast impact, and after a yes is applied to the code and the Figma file.',
  argsSchema: { request: z.string().describe('What to change, in plain words (dictated is fine)') },
}, ({ request }) => ({
  messages: [{ role: 'user', content: { type: 'text', text: [
    `Colour change request (it may be dictated, so allow for misheard words): "${request}"`,
    '',
    'Change colours only through the Natural tokens, never hex in components or Figma layers. Keep every reply short enough to be read aloud.',
    '1. Map the request to tokens: get_tokens({ collection: "Color" }) and DESIGN.md §4.2 tell you which role does what ("sale price" is fg/sale, "primary button" is accent/bg, "page background" is bg/default). Prefer re-pointing one role; retune a primitive only when the person means the whole palette step. If it is ambiguous, ask one short question.',
    '2. propose_color_change. Read its `say` to the person, word for word. If it is blocked, offer the nearest value that passes and propose again.',
    '3. Wait for a clear yes. Anything else ("hmm", "maybe", silence) is not a yes.',
    '4. apply_color_change with the same changes and the proposalId.',
    '5. Run the returned Figma script with the Figma MCP (use_figma) on file 84MjZXozBoKCvf9lwIU5pu, then follow its `next` steps: snapshot, npm run check, CHANGELOG.',
    '6. Tell the person what changed in Figma and code in one sentence, and ask before committing or opening the pull request. Never merge.',
  ].join('\n') } }],
}));

await server.connect(new StdioServerTransport());
