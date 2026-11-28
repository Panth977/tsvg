// node shoot.mjs N [beatIndex...]  → renders each beat late in its time, montages board-N
import { execFileSync } from 'node:child_process';
import { readdirSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
const N = process.argv[2];
const only = process.argv.slice(3).map(Number);
const repo = new URL('../../../../../', import.meta.url).pathname; // plugin root (skills/tech-explainer/assets/boards/gen → ../../../../..)
const out = `${tmpdir()}/tsvg-boards-frames`; mkdirSync(out, { recursive: true });
const src = `${repo}/skills/tech-explainer/assets/boards/src/board-${N}.tsvg`;
const env = { ...process.env };
const info = execFileSync('node', [`${repo}/cli/tsvg.mjs`, 'info', src], { env }).toString();
const total = parseFloat(info.match(/· ([\d.]+)s ·/)[1]);
const starts = [...info.match(/chapters: (.*)/)[1].matchAll(/([\d.]+)s /g)].map((m) => parseFloat(m[1]));
execFileSync('mkdir', ['-p', out]);
const files = [];
starts.forEach((s, i) => {
  const end = i + 1 < starts.length ? starts[i + 1] : total;
  const t = (end - 0.75).toFixed(2);
  const f = `${out}/b${N}-f${i + 1}.png`; files.push(f);
  if (only.length && !only.includes(i + 1)) return;
  execFileSync('node', [`${repo}/cli/tsvg.mjs`, 'render', src, '-t', t, '--width', '360', '--layout', 'portrait', '-o', f], { env, stdio: 'inherit' });
});
const names = { 1: 'devices-and-screens', 2: 'isometric-worlds', 3: 'diagrams', 4: 'ui-code-documents', 5: 'numbers-and-scale', 6: 'people-and-story', 7: 'endings' };
const jpg = `${repo}/skills/tech-explainer/assets/boards/board-${N}-${names[N]}.jpg`;
execFileSync('magick', ['montage', ...files, '-tile', '6x', '-geometry', '+6+6', '-background', '#1b1b1b', '-quality', '85', jpg]);
console.log(jpg, starts.join(' '), total);
