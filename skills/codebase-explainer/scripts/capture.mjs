// Real UI screenshots + element boxes, driven by capture.config.mjs in this folder.
//   node capture.mjs            → every shot in the config
//   node capture.mjs list add   → only shots whose `file` starts with one of these
// Output: shots/<file>.png (1920×1080) and boxes merged into shots/boxes.json: PNG pixels + `box`, the fractions <tx:shot box> takes.
// READ-ONLY: never click submit/save/delete in a `prepare` step. Log in once per run (rate limits).
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('.', import.meta.url).pathname;
let chromium;
try {
  ({ chromium } = createRequire(`${process.cwd()}/package.json`)('playwright'));
} catch {
  ({ chromium } = await import('playwright'));
}
const { default: cfg } = await import(`${dir}capture.config.mjs`);
const SCALE = 1.2; // 1600×900 CSS viewport × 1.2 = 1920×1080 PNGs (tx:shot expects 1920×1080)
const only = process.argv.slice(2);

mkdirSync(`${dir}shots`, { recursive: true });
const boxesPath = `${dir}shots/boxes.json`;
const boxes = existsSync(boxesPath) ? JSON.parse(readFileSync(boxesPath, 'utf8')) : {};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: SCALE, colorScheme: cfg.colorScheme ?? 'dark' });
if (cfg.login) await cfg.login(page, cfg.baseUrl);

for (const shot of cfg.shots) {
  if (only.length && !only.some((o) => shot.file.startsWith(o))) continue;
  await page.goto(cfg.baseUrl + shot.path);
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  if (shot.prepare) await shot.prepare(page);
  await page.waitForTimeout(shot.settleMs ?? 1200);
  await page.screenshot({ path: `${dir}shots/${shot.file}.png` });
  const out = {};
  for (const [key, locate] of Object.entries(shot.boxes ?? {})) {
    const loc = locate(page).first();
    const b = await loc.boundingBox().catch(() => null);
    if (!b) { console.warn(`  ! ${shot.file}: no box for "${key}"`); continue; }
    out[key] = { x: Math.round(b.x * SCALE), y: Math.round(b.y * SCALE), w: Math.round(b.width * SCALE), h: Math.round(b.height * SCALE),
      text: ((await loc.textContent().catch(() => '')) ?? '').trim().slice(0, 60) };
    const r = (v) => +v.toFixed(4); // the same box as fractions of the PNG, ready for <tx:shot box="…">
    out[key].box = [r(b.x * SCALE / 1920), r(b.y * SCALE / 1080), r(b.width * SCALE / 1920), r(b.height * SCALE / 1080)].join(' ');
  }
  boxes[`${shot.file}.png`] = out;
  console.log(`shot ${shot.file} (${Object.keys(out).length} boxes)`);
}
writeFileSync(boxesPath, JSON.stringify(boxes, null, 1));
await browser.close();
