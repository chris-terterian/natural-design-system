// natural-mcp setup: register the Natural MCP server with Claude Desktop, Cursor and Claude Code in one step.
//
//   npx -y github:chris-terterian/natural-design-system setup                 all three (whichever are installed)
//   npx -y github:chris-terterian/natural-design-system setup claude-desktop  just one (also: cursor, claude-code)
//   … setup --dry-run                                                          print what would change, write nothing
//   … setup --remove                                                           unregister
//
// Why a setup command: apps launched from the Dock or Start menu don't get the terminal's PATH, so a config that says
// "command": "npx" fails there ("spawn npx ENOENT") even though it works in a terminal. Setup writes absolute paths to
// npx and Node instead, merges with the existing config and keeps a timestamped backup.
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const NAME = 'natural';
const args = process.argv.slice(3);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const DRY = flag('--dry-run');
const REMOVE = flag('--remove');
const SOURCE = opt('--source') || 'github:chris-terterian/natural-design-system';
const WIN = platform() === 'win32';
const home = homedir();

// Absolute launcher. Prefer the npx / node the terminal resolves (stable links such as /opt/homebrew/bin, which
// survive Node upgrades) over the versioned path of the running process; fall back to the npx next to it.
const which = (bin) => { try { return execFileSync(WIN ? 'where' : 'which', [bin], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().split(/\r?\n/).find((l) => l && !l.includes('_npx')) || ''; } catch { return ''; } };
const nodeDir = dirname(which('node') || process.execPath);
let npx = which('npx') || join(dirname(process.execPath), WIN ? 'npx.cmd' : 'npx');
if (!existsSync(npx)) npx = 'npx';
const server = WIN
  ? { command: 'cmd', args: ['/c', npx, '-y', SOURCE] }
  : { command: npx, args: ['-y', SOURCE], env: { PATH: [nodeDir, '/usr/local/bin', '/usr/bin', '/bin'].filter((v, i, a) => a.indexOf(v) === i).join(':') } };

const FILES = {
  'claude-desktop': WIN ? join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json')
    : platform() === 'darwin' ? join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
    : join(home, '.config', 'Claude', 'claude_desktop_config.json'),
  cursor: join(home, '.cursor', 'mcp.json'),
};
const installed = {
  'claude-desktop': existsSync(dirname(FILES['claude-desktop'])),
  cursor: existsSync(dirname(FILES.cursor)),
  'claude-code': (() => { try { execFileSync(WIN ? 'where' : 'which', ['claude'], { stdio: 'ignore' }); return true; } catch { return false; } })(),
};
const wanted = args.filter((a) => !a.startsWith('--') && a !== opt('--source'));
const targets = wanted.length ? wanted : Object.keys(installed).filter((t) => installed[t]);
if (!targets.length) { console.log('No Claude Desktop, Cursor or Claude Code found. Name one explicitly: setup claude-desktop | cursor | claude-code'); process.exit(1); }

const results = [];
for (const t of targets) {
  if (t === 'claude-code') {
    const cmd = REMOVE ? ['mcp', 'remove', '--scope', 'user', NAME] : ['mcp', 'add-json', '--scope', 'user', NAME, JSON.stringify({ type: 'stdio', ...server })];
    if (DRY || !installed['claude-code']) { results.push(`claude-code: ${DRY ? 'would run' : 'Claude Code not found; run'}: claude ${cmd.map((c) => (/\s|"/.test(c) ? `'${c}'` : c)).join(' ')}`); continue; }
    try { execFileSync('claude', ['mcp', 'remove', '--scope', 'user', NAME], { stdio: 'ignore' }); } catch { /* not registered yet */ }
    if (!REMOVE) execFileSync('claude', cmd, { stdio: 'ignore' });
    results.push(`claude-code: ${REMOVE ? 'removed' : 'registered for all projects (user scope)'}`);
    continue;
  }
  const file = FILES[t];
  if (!file) { results.push(`${t}: unknown target (use claude-desktop, cursor or claude-code)`); continue; }
  let config = {};
  if (existsSync(file)) { try { config = JSON.parse(readFileSync(file, 'utf8') || '{}'); } catch { results.push(`${t}: ${file} isn't valid JSON; left untouched`); continue; } }
  config.mcpServers ??= {};
  if (REMOVE) delete config.mcpServers[NAME]; else config.mcpServers[NAME] = server;
  if (DRY) { results.push(`${t}: would write ${file}\n${JSON.stringify({ mcpServers: { [NAME]: config.mcpServers[NAME] } }, null, 2)}`); continue; }
  mkdirSync(dirname(file), { recursive: true });
  if (existsSync(file)) copyFileSync(file, `${file}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
  results.push(`${t}: ${REMOVE ? 'removed from' : 'written to'} ${file} (backup kept)`);
}
console.log(results.join('\n'));
if (!DRY && !REMOVE) console.log(`\nRestart ${targets.filter((t) => t !== 'claude-code').map((t) => (t === 'cursor' ? 'Cursor' : 'Claude Desktop')).join(' and ') || 'your client'} to load "${NAME}". Then ask: "use the natural server's build_page prompt to build a gift guide with three picks under $50".`);
