// validate_file: pre-commit guardrail (also runs in CI). Validates design-system files for tokens, naming and
// accessibility, printing each finding with its location and a fix suggestion.
//
// BLOCKS (exit 1):  hardcoded values · broken naming · placeholder link text
// WARNS (exit 0):   other static accessibility issues
//
// Usage:
//   node scripts/validate-file.mjs --staged        files staged for commit (the pre-commit hook)
//   node scripts/validate-file.mjs --all           every checked file in the repo (CI)
//   node scripts/validate-file.mjs <file> [...]    specific files
//
// Escape hatch (needs a reason; reviewed like an exception): put on the same line or the line above
//   CSS:  /* validate-ignore <rule-id>: <reason> */      TS/TSX:  // validate-ignore <rule-id>: <reason>
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------- inputs
const args = process.argv.slice(2);
let files;
if (args.includes('--staged')) {
  files = execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT }).toString().split('\n').filter(Boolean);
} else if (args.includes('--all')) {
  files = execSync('git ls-files src tokens', { cwd: ROOT }).toString().split('\n').filter(Boolean);
} else {
  files = args.map((f) => relative(ROOT, new URL(f, `file://${process.cwd()}/`).pathname));
}
const inScope = (f) =>
  f !== 'src/styles/tokens.css' && // generated
  !f.startsWith('src/stories/StoryUI') && // Story UI's own tool code (third-party, like node_modules)
  !f.startsWith('src/stories/generated/') && // AI drafts (gitignored); promoted into src/components they're checked
  (/^src\/.+\.(css|tsx?)$/.test(f) || f === 'tokens/figma-variables.json');
files = files.filter((f) => inScope(f) && existsSync(new URL(`../${f}`, import.meta.url)));

// ---------------------------------------------------------------- reference data
const tokens = JSON.parse(read('tokens/figma-variables.json'));
const primitives = tokens.Primitives;
const cssVar = (name) => `var(--nds-${name.replaceAll('/', '-')})`;
// Reverse lookup for fix suggestions: hex → colour primitives
const byHex = {};
for (const [name, t] of Object.entries(primitives)) if (t.type === 'COLOR') (byHex[t.value.toUpperCase()] ??= []).push(name);
const definedProps = new Set(
  [...read('src/styles/tokens.css').matchAll(/(--nds-[a-z0-9-]+)\s*:/g), ...read('src/styles/global.css').matchAll(/(--nds-[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
);

// ---------------------------------------------------------------- findings
const findings = [];
const add = (file, line, rule, severity, message, fix, text) => findings.push({ file, line, rule, severity, message, fix, text });
const ignored = (lines, i, rule) => {
  const re = new RegExp(`validate-ignore\\s+${rule}\\s*:\\s*\\S`);
  return re.test(lines[i]) || (i > 0 && re.test(lines[i - 1]));
};
const ignoreWithoutReason = /validate-ignore\s+[\w-]+\s*(?::\s*)?(\*\/|$)/;

// Allowed literal values in CSS (not design decisions): 0, 100%/50%, auto, keywords, 1px hairlines in
// accessibility utilities, transform/animation values, ms/deg units.
const pxRe = /(?<![\w.-])(-?\d*\.?\d+)px\b/g;
const emRe = /(?<![\w.-])(-?\d*\.?\d+)r?em\b/g;
const hexRe = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const colorFnRe = /\b(?:rgba?|hsla?)\s*\(/g;
const BEM = /^nds-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$/;
const PLACEHOLDER_LINK = /^(click here|click|here|read more|learn more|more|link|this link|go|continue|details|link \d+)$/i;

// Which primitive category fits a CSS property, and which component collection a file belongs to
const CATEGORY = [
  [/^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left|outline-offset|text-underline-offset)/, ['space']],
  [/^font-size$|^font$/, ['font-size']],
  [/^line-height$/, ['line-height']],
  [/^letter-spacing$/, ['letter-spacing']],
  [/radius/, ['radius']],
  [/^(border|outline)(-width)?$|-width$/, ['border-width']],
  [/^(width|height|min-|max-|flex-basis)/, ['size', 'space']],
];
const FOLDER_PREFIX = { Button: ['button'], Input: ['input'], Radio: ['radio'], Toggle: ['toggle'], ProductCard: ['card'], WishlistButton: ['wishlist'], ProductRow: ['row'], Badge: ['badge'], Navigation: ['nav'], Typography: ['text'], Spinner: ['button'], Logo: ['logo'], Calendar: ['calendar'], ImageBlock: ['image'], Footer: ['footer'], Slider: ['slider'], TextButton: ['text-button'], CartLine: ['cart'] };
let CTX = { prop: '', prefixes: [] };
const propAt = (code, index) => { const m = [...code.slice(0, index).matchAll(/([a-z-]+)\s*:/g)].pop(); return m ? m[1] : ''; };
const componentTokens = (primitive) => {
  const out = [];
  for (const [col, vars] of Object.entries(tokens)) {
    if (col.startsWith('$') || col === 'Primitives') continue;
    for (const [n, t] of Object.entries(vars)) if (t.alias === primitive && (!CTX.prefixes.length || CTX.prefixes.includes(n.split('/')[0]))) out.push(n);
  }
  return out;
};
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };

const suggestPx = (n) => {
  const cats = (CATEGORY.find(([re]) => re.test(CTX.prop)) || [null, null])[1];
  const pool = cats ? Object.entries(primitives).filter(([k, t]) => t.type !== 'COLOR' && cats.includes(k.split('/')[0])) : Object.entries(primitives).filter(([, t]) => t.type !== 'COLOR');
  const exact = pool.filter(([, t]) => t.value === Number(n)).map(([k]) => k);
  if (exact.length) {
    const comp = exact.flatMap(componentTokens);
    return comp.length ? `use ${comp.slice(0, 2).map(cssVar).join(' or ')} (aliases \`${exact[0]}\`)` : `add a component token aliasing \`${exact[0]}\` (${CTX.prefixes[0] ? `e.g. "${CTX.prefixes[0]}/…"` : 'in the component\'s collection'}), then use it`;
  }
  if (!pool.length) return 'use a token from src/styles/tokens.css';
  const [nearName, nearTok] = pool.reduce((a, b) => (Math.abs(b[1].value - n) < Math.abs(a[1].value - n) ? b : a));
  return `${n}px isn't on the ${cats ? cats.join('/') : ''} scale; nearest is ${nearTok.value}px (\`${nearName}\`). Use that via a component token, or propose a new step (GOVERNANCE.md §4)`;
};
const suggestHex = (hex) => {
  const h = hex.toUpperCase();
  const full = h.length === 4 ? '#' + [...h.slice(1)].map((c) => c + c).join('') : h;
  const names = byHex[full];
  if (!names) return `${hex} isn't in the palette; pick a colour role from DESIGN.md §4.2`;
  const role = /background|fill/.test(CTX.prop) ? /\/(bg|backdrop|fill)/ : /^(color)$/.test(CTX.prop) ? /\/(text|fg|icon|label)/ : /border|outline|stroke/.test(CTX.prop) ? /\/(border|focus-ring|divider)/ : /./;
  const sem = names.flatMap(componentTokens);
  const best = sem.filter((x) => role.test(x));
  const pick = (best.length ? best : sem).slice(0, 2);
  return `${full} is \`${names[0]}\`; ${pick.length ? `use ${pick.map(cssVar).join(' or ')}` : `add a component token aliasing it${CTX.prefixes[0] ? ` (e.g. "${CTX.prefixes[0]}/…")` : ''}`}`;
};

// Breakpoints can't use CSS variables inside @media / @container, so the literal is allowed only when it is
// the documented breakpoint (DESIGN.md §4.4: mobile below 768px).
// 767/768: the page breakpoint. 479/480: the compact breakpoint for components that live in a column
// (Cart Line), measured on the component's own width (DESIGN.md §4.4).
const BREAKPOINTS = new Set([767, 768, 479, 480]);

function checkCss(file, src) {
  const lines = src.split('\n');
  // Blank out comments (keeping line numbers) so code checks never read prose
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).split('\n');
  lines.forEach((line, i) => {
    const n = i + 1;
    if (ignoreWithoutReason.test(line)) add(file, n, 'ignore-needs-reason', 'error', 'validate-ignore without a reason', 'write `validate-ignore <rule>: <why this is an allowed exception>`', line);
    let code = stripped[i].replace(/(['"])(?:\\.|(?!\1).)*\1/g, '""').replace(/url\([^)]*\)/g, 'url()');
    if (/^\s*@(import|charset)\b/.test(code)) return;
    if (/^\s*@(media|container)\b/.test(code)) {
      for (const m of code.matchAll(pxRe)) if (!BREAKPOINTS.has(Number(m[1]))) add(file, n, 'breakpoint', 'error', `Undocumented breakpoint ${m[0]}`, 'use a system breakpoint: 767px / 768px (page), or 479px / 480px (compact component in a column) (DESIGN.md §4.4)', line);
      code = code.replace(pxRe, '');
    }
    // --- tokens: hardcoded values
    if (!/^\s*--/.test(code) && !ignored(lines, i, 'hardcoded-color')) {
      for (const m of code.matchAll(hexRe)) (CTX.prop = propAt(code, m.index)), add(file, n, 'hardcoded-color', 'error', `Hardcoded colour ${m[0]}`, suggestHex(m[0]), line);
      if (colorFnRe.test(code) && !/var\(/.test(code.slice(code.search(colorFnRe)))) add(file, n, 'hardcoded-color', 'error', 'Hardcoded colour function (rgb/hsl)', 'bind the colour to a token; for tints add a primitive with alpha (e.g. `color/brown/900-a16`) and a component token that aliases it', line);
      colorFnRe.lastIndex = 0;
    }
    if (!/^\s*--/.test(code) && !ignored(lines, i, 'hardcoded-size')) {
      for (const m of code.matchAll(emRe)) {
        if (Number(m[1]) === 0) continue;
        CTX.prop = propAt(code, m.index);
        add(file, n, 'hardcoded-size', 'error', `Hardcoded size ${m[0]}`, `use a token instead of ${m[0].replace(/^-/, '')}: for letter-spacing, \`letter-spacing/*\` (px); for sizes, ${suggestPx(Math.round(Math.abs(Number(m[1])) * 16))}`, line);
      }
      for (const m of code.matchAll(pxRe)) {
        const v = Math.abs(Number(m[1]));
        if (v === 0) continue;
        CTX.prop = propAt(code, m.index);
        add(file, n, 'hardcoded-size', 'error', `Hardcoded size ${m[0]}`, suggestPx(v), line);
      }
    }
    // --- naming: classes and custom properties
    const selector = code.includes('{') ? code.slice(0, code.indexOf('{')) : /,\s*$/.test(code) && !code.includes(':') ? code : '';
    for (const m of selector.replace(/\([^)]*\)/g, (x) => x.replace(/\./g, ' ')).matchAll(/\.([a-zA-Z_][\w-]*)/g)) {
      const cls = m[1];
      if (/^\d/.test(cls) || /^(?:is|has|where|not)$/.test(cls)) continue;
      if (!cls.startsWith('nds-')) add(file, n, 'naming-class', 'error', `Class ".${cls}" isn't namespaced`, `rename to ".nds-${cls.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()).replace(/^-/, '')}" (BEM: nds-block__element--modifier)`, line);
      else if (!BEM.test(cls)) add(file, n, 'naming-class', 'error', `Class ".${cls}" breaks the BEM pattern`, 'use lowercase kebab-case: nds-block, nds-block__element, nds-block--modifier', line);
    }
    for (const m of code.matchAll(/var\((--[\w-]+)/g)) {
      const prop = m[1];
      if (prop.startsWith('--_')) continue; // component-private
      if (!prop.startsWith('--nds-')) add(file, n, 'naming-token', 'error', `Custom property ${prop} isn't a system token`, 'reference a --nds-* token (see src/styles/tokens.css) or a component-private --_name', line);
      else if (!definedProps.has(prop)) {
        const guess = [...definedProps].map((p) => [p, lev(p, prop)]).sort((a, b) => a[1] - b[1]).filter(([, d]) => d <= 4).slice(0, 2).map(([p]) => p);
        add(file, n, 'naming-token', 'error', `Unknown token ${prop}`, guess.length ? `did you mean ${guess.join(' or ')}?` : 'add it to tokens/figma-variables.json (and Figma), then run npm run tokens', line);
      }
    }
    // --- accessibility
    if (/outline\s*:\s*(none|0)\b/.test(code) && !ignored(lines, i, 'a11y-focus') && !/focus-visible|nds-field__input/.test(src.slice(Math.max(0, src.indexOf(line) - 400), src.indexOf(line)))) {
      add(file, n, 'a11y-focus', 'warn', 'Focus outline removed', 'keep a visible focus style: add the Focus ring (outline: var(--*-focus-ring-width) solid var(--*-focus-ring); outline-offset: 2px) on :focus-visible', line);
    }
  });
}

function checkTsx(file, src) {
  const lines = src.split('\n');
  const isDocs = /\.stories\.tsx$|^src\/governance\//.test(file);
  lines.forEach((line, i) => {
    const n = i + 1;
    if (ignoreWithoutReason.test(line)) add(file, n, 'ignore-needs-reason', 'error', 'validate-ignore without a reason', 'write `validate-ignore <rule>: <why this is an allowed exception>`', line);
    // --- tokens: hardcoded values in component code (docs/story layout scaffolding is exempt)
    if (!isDocs && /style=\{\{/.test(line) && !ignored(lines, i, 'hardcoded-style')) {
      for (const m of line.matchAll(hexRe)) add(file, n, 'hardcoded-style', 'error', `Hardcoded colour ${m[0]} in inline style`, suggestHex(m[0]), line);
      for (const m of line.matchAll(/:\s*(\d+)(?=\s*[,}])/g)) if (Number(m[1]) > 1) add(file, n, 'hardcoded-style', 'error', `Hardcoded size ${m[1]} in inline style`, `move styling to the component's CSS with tokens; ${suggestPx(Number(m[1]))}`, line);
    }
    // --- placeholder link text: <a>, NavLink, MenuItem, or { label: '...' , href } data
    const linkText = [
      ...line.matchAll(/<(?:a|NavLink|MenuItem)\b[^>]*>\s*([^<{]+?)\s*<\/(?:a|NavLink|MenuItem)>/g),
      ...line.matchAll(/label:\s*'([^']+)',\s*href/g),
      ...line.matchAll(/viewAllLabel=["']([^"']+)["']/g),
    ];
    for (const m of linkText) {
      if (PLACEHOLDER_LINK.test(m[1].trim()) && !ignored(lines, i, 'link-text')) {
        add(file, n, 'link-text', 'error', `Placeholder link text "${m[1].trim()}"`, 'say where the link goes: "View all cups", "Shop benches", "Read the care guide" (WCAG 2.4.4 Link Purpose)', line);
      }
    }
    // --- naming: component files and exports
    const exp = line.match(/^export function ([A-Za-z0-9_]+)/);
    if (exp && !isDocs && /\/components\//.test(file) && !/^[A-Z][A-Za-z0-9]*$/.test(exp[1])) add(file, n, 'naming-component', 'error', `Component "${exp[1]}" isn't PascalCase`, `rename to ${exp[1][0].toUpperCase()}${exp[1].slice(1)}`, line);
    const title = line.match(/title:\s*'((?:Components|Foundations|Governance)\/[^']*)'/);
    if (title && /\.stories\.tsx$/.test(file) && !/^(Components|Foundations)\/[A-Z][A-Za-z]*(?: [A-Z][A-Za-z]*)*$/.test(title[1])) add(file, n, 'naming-story', 'error', `Story title "${title[1]}" doesn't follow "Components/<Figma component name>"`, 'use the Figma component name in Title Case, e.g. "Components/Product Card"', line);
    // --- accessibility (warnings)
    if (/<img\b(?![^>]*\balt=)/.test(line)) add(file, n, 'a11y-alt', 'warn', '<img> without alt', 'add alt: material-first description, or alt="" if decorative (DESIGN.md §2 Alt text)', line);
    if (/<(div|span)\b[^>]*\bonClick=/.test(line) && !/\brole=/.test(line)) add(file, n, 'a11y-click', 'warn', 'Click handler on a non-interactive element', 'use <button type="button"> (or <a href> for navigation) so it is focusable and keyboard operable', line);
    if (/tabIndex=\{?["']?[1-9]/.test(line)) add(file, n, 'a11y-tabindex', 'warn', 'Positive tabIndex', 'remove it and fix the DOM order instead (GOVERNANCE.md, D-012)', line);
    if (/<(?:button|IconButton)\b[^>]*\/>/.test(line) && !/aria-label|label=/.test(line)) add(file, n, 'a11y-name', 'warn', 'Button without an accessible name', 'add visible text, or label="…" / aria-label="…" with context ("Add River Clay Cup to wishlist")', line);
  });
}

function checkTokens(file, src) {
  const lines = src.split('\n');
  const data = JSON.parse(src);
  const PRIM = /^(color|space|size|radius|border-width|font-size|line-height|letter-spacing|elevation)\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
  const SEM = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)+$/;
  const PREFIX = { Button: ['button'], Input: ['input'], Radio: ['radio'], Toggle: ['toggle'], 'Product Card': ['card', 'wishlist'], 'Product Row': ['row'], Badge: ['badge'], Navigation: ['nav'], Typography: ['text'], Logo: ['logo'], Calendar: ['calendar'], 'Image Block': ['image'], Footer: ['footer'], Slider: ['slider'], 'Text Button': ['text-button'], 'Cart Line': ['cart'] };
  const lineOf = (name) => lines.findIndex((l) => l.includes(`"${name}"`)) + 1;
  for (const [col, vars] of Object.entries(data)) {
    if (col.startsWith('$')) continue;
    for (const name of Object.keys(vars)) {
      const at = lineOf(name);
      if (name.includes('.')) add(file, at, 'naming-token', 'error', `Token "${name}" contains "."`, `Figma rejects "." in variable names: use "${name.replaceAll('.', '-')}"`, lines[at - 1]);
      else if (col === 'Primitives' ? !PRIM.test(name) : !SEM.test(name)) add(file, at, 'naming-token', 'error', `Token "${name}" breaks naming`, col === 'Primitives' ? 'primitives are <category>/<scale-step> in lowercase kebab-case, e.g. "space/12", "color/brown/200"' : 'component tokens are component/part/property/state in lowercase kebab-case, e.g. "button/primary/bg/hover"', lines[at - 1]);
      else if (PREFIX[col] && !PREFIX[col].includes(name.split('/')[0])) add(file, at, 'naming-token', 'error', `Token "${name}" is in "${col}" but doesn't start with ${PREFIX[col].map((p) => `"${p}/"`).join(' or ')}`, `rename to "${PREFIX[col][0]}/${name.split('/').slice(1).join('/')}" or move it to the matching collection`, lines[at - 1]);
    }
  }
}

for (const f of files) {
  const src = read(f);
  const folder = (f.match(/^src\/components\/([^/]+)\//) || [])[1];
  CTX = { prop: '', prefixes: FOLDER_PREFIX[folder] || [] };
  if (f.endsWith('.css')) checkCss(f, src);
  else if (f.endsWith('.json')) checkTokens(f, src);
  else checkTsx(f, src);
}

// ---------------------------------------------------------------- report
const errors = findings.filter((x) => x.severity === 'error');
const warns = findings.filter((x) => x.severity === 'warn');
const tty = process.stdout.isTTY;
const c = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const byFile = Object.groupBy ? Object.groupBy(findings, (x) => x.file) : findings.reduce((a, x) => ((a[x.file] ??= []).push(x), a), {});
for (const [file, list] of Object.entries(byFile)) {
  console.log(`\n${c('1', file)}`);
  for (const f of list.sort((a, b) => a.line - b.line)) {
    const tag = f.severity === 'error' ? c('31', '✖ error') : c('33', '▲ warn ');
    console.log(`  ${file}:${f.line}  ${tag}  ${f.message}  ${c('2', `[${f.rule}]`)}`);
    if (f.text) console.log(`      ${c('2', '│')} ${f.text.trim().slice(0, 120)}`);
    console.log(`      ${c('2', '└')} ${c('32', 'fix:')} ${f.fix}`);
  }
}
console.log(`\nvalidate_file: ${files.length} file(s) checked · ${errors.length} error(s) · ${warns.length} warning(s)`);
if (errors.length) {
  console.log(c('31', 'Commit blocked: fix the errors above (hardcoded values, broken naming or placeholder link text).'));
  process.exit(1);
}
