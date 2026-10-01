// Drift check (D-032): runs every quality gate, keeps going past failures, and writes one report the drift bot
// files as an issue and an agent fixes in a pull request. Also asks Figma whether the file was edited after the
// parity snapshot was taken (needs FIGMA_TOKEN, a read-only personal access token; skipped without it).
//
//   node scripts/drift-check.mjs                  every gate, report to drift/
//   node scripts/drift-check.mjs --fix            first apply the safe, deterministic fixes (regenerate tokens.css,
//                                                 DESIGN.md front matter, story-ui-docs from tokens/figma-variables.json)
//   node scripts/drift-check.mjs --skip-a11y      skip the Storybook build and accessibility gate (fast, local)
//   node scripts/drift-check.mjs --out <dir>      where to write report.md and report.json
//
// Exit code 1 when anything drifted. The report is the only output agents act on, so it says what failed, where,
// and who can fix it: code drift can be fixed by the agent in CI; Figma drift needs the Figma MCP (/drift locally).
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const SKIP_A11Y = args.includes('--skip-a11y');
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'drift';
const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const sh = (cmd) => spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const tail = (s, n = 60) => s.trim().split('\n').slice(-n).join('\n');

// Who can fix a failure. "code": the agent in CI. "figma": needs the Figma MCP, so a person runs /drift locally.
const GATES = [
  { id: 'validate', name: 'validate_file (hardcoded values, naming, link text, a11y)', cmd: 'node scripts/validate-file.mjs --all', owner: 'code' },
  { id: 'typecheck', name: 'Typecheck', cmd: 'npm run --silent typecheck', owner: 'code' },
  { id: 'governance', name: 'Governance (registry, specs, Figma links, generated tokens)', cmd: 'npm run --silent check:governance', owner: 'code' },
  { id: 'parity', name: 'Figma ↔ code parity (committed snapshot)', cmd: 'npm run --silent check:parity', owner: 'figma' },
  { id: 'mcp', name: 'Natural MCP server (tools, checkpoints catch drift)', cmd: 'npm run --silent check:mcp', owner: 'code' },
  { id: 'build', name: 'Storybook build', cmd: 'npm run --silent build-storybook', owner: 'code', slow: true },
  { id: 'a11y', name: 'Accessibility (axe, WCAG 2.2 AA, every story)', cmd: 'npm run --silent check:a11y', owner: 'code', slow: true, needs: 'build' },
];

const fixes = [];
if (FIX) {
  const before = sh('git status --porcelain').stdout;
  sh('npm run --silent tokens');
  const after = sh('git status --porcelain').stdout;
  if (after !== before) fixes.push('Regenerated tokens.css, tokens-deprecated.css, DESIGN.md front matter and story-ui-docs from tokens/figma-variables.json (`npm run tokens`).');
}

const results = [];
for (const g of GATES) {
  if (g.slow && SKIP_A11Y) { results.push({ ...g, status: 'skipped', output: 'skipped (--skip-a11y)' }); continue; }
  if (g.needs && results.find((r) => r.id === g.needs)?.status === 'fail') { results.push({ ...g, status: 'skipped', output: `skipped: ${g.needs} failed` }); continue; }
  const started = Date.now();
  const r = sh(g.cmd);
  results.push({ ...g, status: r.status === 0 ? 'pass' : 'fail', seconds: Math.round((Date.now() - started) / 1000), output: tail(`${r.stdout}\n${r.stderr}`) });
  console.log(`${r.status === 0 ? '✔' : '✖'} ${g.name}`);
}

// Figma edited after the snapshot? The Variables API is Enterprise-only, but any plan can read when a file last changed.
const snapshot = JSON.parse(read('governance/figma-snapshot.json'));
let figma = { checked: false, reason: 'FIGMA_TOKEN not set' };
if (process.env.FIGMA_TOKEN) {
  try {
    const res = await fetch(`https://api.figma.com/v1/files/${snapshot.figmaFile}?depth=1`, { headers: { 'X-Figma-Token': process.env.FIGMA_TOKEN } });
    if (!res.ok) throw new Error(`Figma API ${res.status}`);
    const { lastModified, version } = await res.json();
    const edited = new Date(lastModified) > new Date(snapshot.generatedAt);
    figma = { checked: true, lastModified, version, snapshotAt: snapshot.generatedAt, edited };
  } catch (e) { figma = { checked: false, reason: e.message }; }
}
console.log(figma.checked ? `${figma.edited ? '✖' : '✔'} Figma file ${figma.edited ? 'edited since' : 'unchanged since'} the snapshot` : `- Figma freshness not checked (${figma.reason})`);

const failed = results.filter((r) => r.status === 'fail');
const figmaDrift = failed.some((r) => r.owner === 'figma') || figma.edited === true;
const codeDrift = failed.some((r) => r.owner === 'code');
const report = {
  version: JSON.parse(read('package.json')).version,
  commit: sh('git rev-parse --short HEAD').stdout.trim(),
  date: new Date().toISOString(),
  drift: failed.length > 0 || figma.edited === true,
  codeDrift, figmaDrift, fixes, figma,
  gates: results.map(({ id, name, owner, status, seconds, output }) => ({ id, name, owner, status, seconds, output })),
};

const icon = { pass: '✅', fail: '❌', skipped: '⏭️' };
const md = [
  `## ${report.drift ? 'Drift detected' : 'No drift'} · v${report.version} @ \`${report.commit}\``,
  '',
  `Checked ${report.date}. Every gate runs even after one fails, so this is the full picture.`,
  '',
  '| Gate | Result | Who fixes it |',
  '|---|---|---|',
  ...results.map((r) => `| ${r.name} | ${icon[r.status]} ${r.status} | ${r.status === 'fail' ? (r.owner === 'figma' ? 'Person + Figma MCP (`/drift`)' : 'Drift bot pull request') : ''} |`),
  `| Figma edited since snapshot (${snapshot.generatedAt.slice(0, 10)}) | ${figma.checked ? (figma.edited ? `❌ yes, ${figma.lastModified}` : '✅ no') : `⏭️ ${figma.reason}`} | ${figma.edited ? 'Person + Figma MCP (`/drift`)' : ''} |`,
  '',
  ...(fixes.length ? ['### Safe fixes already applied', ...fixes.map((f) => `- ${f}`), ''] : []),
  ...failed.flatMap((r) => [`### ❌ ${r.name}`, '', `\`${r.cmd}\``, '', '```', r.output, '```', '']),
  '### What happens next',
  codeDrift && '- **Code drift:** the drift bot opens a pull request with a fix. A person reviews and merges it; the bot never merges.',
  figmaDrift && '- **Figma ↔ code disagreement:** CI can\'t read Figma variables on the Professional plan. Run `/drift` in Claude Code: it refreshes the snapshot through the Figma MCP, brings Figma in line with code (code is the source of truth) or asks when the Figma change looks intentional, and opens a pull request.',
  !report.drift && '- Nothing to do. Open drift issues close automatically.',
].filter((l) => l !== false).join('\n');

mkdirSync(resolve(root, OUT), { recursive: true });
writeFileSync(resolve(root, OUT, 'report.json'), JSON.stringify(report, null, 2) + '\n');
writeFileSync(resolve(root, OUT, 'report.md'), md + '\n');
console.log(`\n${report.drift ? '✖ Drift detected' : '✔ No drift'}: ${failed.length} gate(s) failed${figma.edited ? ', Figma edited since the snapshot' : ''}. Report: ${OUT}/report.md`);
process.exit(report.drift ? 1 : 0);
