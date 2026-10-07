// Reduced-motion gate (D-037): opens every story in the built Storybook with prefers-reduced-motion: reduce and fails
// if anything still moves. Allowed in Reduced: colour and opacity fades (not movement), and an endless progress
// indicator slowed to at least 2000ms per cycle (it's the only sign that something is happening).
// Checks: (1) no transition on transform / translate / scale / rotate with a duration, on any element;
// (2) every running animation either leaves its element's position, size and rotation unchanged from start to end, or
// is an endless progress animation of 2000ms or more.
// Usage: npm run build-storybook && npm run check:motion
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../storybook-static/', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const path = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try { res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(await readFile(path.endsWith('/') ? join(path, 'index.html') : path)); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}`;
const stories = Object.values(JSON.parse(await readFile(join(ROOT, 'index.json'), 'utf8')).entries).filter((e) => e.type === 'story');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.emulateMedia({ reducedMotion: 'reduce' });
const failures = [];
let animationsSeen = 0;

for (const story of stories) {
  await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`);
  await page.waitForSelector('#storybook-root > *', { timeout: 15000 });
  const found = await page.evaluate(() => {
    const out = [];
    const MOVE = ['transform', 'translate', 'scale', 'rotate', 'all'];
    const ms = (s) => s.split(',').map((x) => parseFloat(x) * (x.trim().endsWith('ms') ? 1 : 1000));
    const label = (el) => (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : el.tagName.toLowerCase());
    for (const el of document.querySelectorAll('#storybook-root *')) {
      const cs = getComputedStyle(el);
      const props = cs.transitionProperty.split(',').map((p) => p.trim());
      const durs = ms(cs.transitionDuration);
      props.forEach((p, i) => { const d = durs[i % durs.length]; if (MOVE.includes(p) && d > 0) out.push(`${label(el)}: transition on ${p} lasts ${d}ms`); });
    }
    let seen = 0;
    for (const a of document.getAnimations()) {
      const target = a.effect?.target; if (!target || !target.closest('#storybook-root')) continue;
      seen++;
      const timing = a.effect.getComputedTiming();
      if (timing.iterations === Infinity) { if (timing.duration < 2000) out.push(`${label(target)}: endless animation at ${timing.duration}ms per cycle (Reduced needs 2000ms or more)`); continue; }
      a.pause();
      a.currentTime = 0; const r0 = target.getBoundingClientRect(); const t0 = getComputedStyle(target).transform;
      a.currentTime = timing.endTime; const r1 = target.getBoundingClientRect(); const t1 = getComputedStyle(target).transform;
      const moved = Math.abs(r0.x - r1.x) > 0.5 || Math.abs(r0.y - r1.y) > 0.5 || Math.abs(r0.width - r1.width) > 0.5 || Math.abs(r0.height - r1.height) > 0.5 || t0 !== t1;
      if (moved) out.push(`${label(target)}: animation moves the element (${t0} → ${t1})`);
      a.finish();
    }
    return { out, seen };
  });
  animationsSeen += found.seen;
  for (const f of found.out) failures.push(`${story.id}: ${f}`);
}

await browser.close();
server.close();
if (failures.length) { console.error(`✖ Reduced motion: ${failures.length} thing(s) still move:\n  - ${[...new Set(failures)].join('\n  - ')}`); process.exit(1); }
console.log(`✔ Reduced motion: ${stories.length} stories checked, nothing moves (${animationsSeen} running animation(s) checked; fades and slowed progress allowed).`);
