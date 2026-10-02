// Proves the parity check tells which side moved (D-034), in a throwaway clone with real git history:
//   code changed → figma-behind · Figma changed → figma-changed · both → conflict · no history → unknown.
// Run: npm run test:parity-direction (part of npm run check).
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const repo = new URL('..', import.meta.url).pathname;
const work = mkdtempSync(join(tmpdir(), 'nds-parity-'));
const errors = [];

const clone = (name, shallow) => {
  const dir = join(work, name);
  execFileSync('git', ['clone', '--quiet', ...(shallow ? ['--depth', '1', `file://${repo}`] : [repo]), dir]);
  // Test the working copy of the checker, not the committed one.
  copyFileSync(join(repo, 'scripts/check-parity.mjs'), join(dir, 'scripts/check-parity.mjs'));
  return dir;
};
// Restore only the data files: a blanket checkout would also revert the checker under test.
const reset = (dir) => execFileSync('git', ['checkout', '--quiet', '--', 'tokens/figma-variables.json', 'governance/figma-snapshot.json'], { cwd: dir });
const edit = (dir, file, fn) => writeFileSync(join(dir, file), fn(readFileSync(join(dir, file), 'utf8')));
const gutterInCode = (to) => (s) => { const t = JSON.parse(s); t.Layout['layout/gutter'].modes.Desktop.alias = to; return JSON.stringify(t, null, 2) + '\n'; };
const gutterInFigma = (to) => (s) => s.replace('"Layout|layout/gutter|Desktop|@space/24"', `"Layout|layout/gutter|Desktop|@${to}"`);
const verdicts = (dir) => {
  const out = join(dir, 'parity.json');
  rmSync(out, { force: true });
  spawnSync(process.execPath, ['scripts/check-parity.mjs', '--json', out], { cwd: dir });
  return JSON.parse(readFileSync(out, 'utf8')).directions.map((d) => `${d.name}:${d.verdict}`);
};
const expect = (label, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`${label}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`); };

try {
  const dir = clone('full');
  expect('baseline', verdicts(dir), []);

  edit(dir, 'tokens/figma-variables.json', gutterInCode('space/32'));
  expect('code changed', verdicts(dir), ['layout/gutter:figma-behind']);
  reset(dir);

  edit(dir, 'governance/figma-snapshot.json', gutterInFigma('space/32'));
  expect('Figma changed', verdicts(dir), ['layout/gutter:figma-changed']);

  edit(dir, 'tokens/figma-variables.json', gutterInCode('space/16'));
  expect('both changed', verdicts(dir), ['layout/gutter:conflict']);
  reset(dir);

  edit(dir, 'governance/figma-snapshot.json', (s) => s.replace('"Primitives|color/brown/50||#F6EFE7"', '"Primitives|color/brown/50||#F6EFE7",\n    "Primitives|color/clay/600||#C2410C"'));
  expect('variable added in Figma', verdicts(dir), ['color/clay/600:figma-changed']);

  const shallow = clone('shallow', true);
  edit(shallow, 'tokens/figma-variables.json', gutterInCode('space/32'));
  expect('shallow clone refuses to guess', verdicts(shallow), ['layout/gutter:unknown']);
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (errors.length) { console.error(`✖ Parity direction test failed:\n  - ${errors.join('\n  - ')}`); process.exit(1); }
console.log('✔ Parity direction: code changed → figma-behind, Figma changed → figma-changed, both → conflict, no history → unknown.');
