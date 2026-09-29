// Blocking accessibility gate: runs axe (WCAG 2.0/2.1/2.2 A + AA) on every story in the built Storybook.
// Violations fail the build unless they're listed in governance/a11y-exceptions.json with a reason.
// Usage: npm run build-storybook && npm run check:a11y
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../storybook-static/', import.meta.url).pathname;
const exceptions = JSON.parse(await readFile(new URL('../governance/a11y-exceptions.json', import.meta.url), 'utf8')).exceptions;
const axeSource = await readFile(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

const server = createServer(async (req, res) => {
  const path = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try {
    const body = await readFile(path.endsWith('/') ? join(path, 'index.html') : path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const index = JSON.parse(await readFile(join(ROOT, 'index.json'), 'utf8'));
const stories = Object.values(index.entries).filter((e) => e.type === 'story');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
const failures = [];
const excused = [];

for (const story of stories) {
  await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`);
  await page.waitForSelector('#storybook-root > *', { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async (exceptions) => {
    // Storybook's a11y addon runs its own axe scan on load, and axe allows one run at a time.
    // Wait for it to finish instead of failing (it's a timing race, not a violation).
    const run = () => window.axe.run(document.querySelector('#storybook-root'), {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    });
    let r;
    for (let attempt = 0; ; attempt++) {
      try { r = await run(); break; } catch (e) {
        if (!String(e).includes('already running') || attempt >= 100) throw e;
        await new Promise((ok) => setTimeout(ok, 100));
      }
    }
    // An exception applies when the rule matches and the failing element matches its CSS selector.
    return r.violations.flatMap((v) =>
      v.nodes.map((n) => {
        const target = n.target.join(' ');
        const el = document.querySelector(target);
        const ex = exceptions.find((e) => e.rule === v.id && el && el.matches(e.selector));
        return { rule: v.id, help: v.help, target, exception: ex?.id };
      }),
    );
  }, exceptions);
  for (const v of violations) {
    const ex = exceptions.find((e) => e.id === v.exception);
    (ex ? excused : failures).push({ story: story.id, ...v, reason: ex?.reason });
  }
}

await browser.close();
server.close();

console.log(`Checked ${stories.length} stories.`);
if (excused.length) console.log(`${excused.length} violation(s) excused by governance/a11y-exceptions.json: ${[...new Set(excused.map((e) => e.exception))].join(', ')}`);
if (failures.length) {
  console.error(`\n✖ ${failures.length} accessibility violation(s):`);
  for (const f of failures) console.error(`  ${f.story}  [${f.rule}]  ${f.target}\n    ${f.help}`);
  process.exit(1);
}
console.log('✔ No unexcused accessibility violations.');
