// dist/: the npm package (@dixitram/tsvg), served by jsdelivr so claude.ai artifacts can load it (they allow
// scripts from cdn.jsdelivr.net/npm/ only, and no fetch at all).
//   dist/tsvg.js       the three engine files as one classic script (window.TSVG, TSVGZip, TSVGPlayer) + autoplay
//   dist/tsvg-libs.js  the built-in libraries (tsvg:report, tech, …) and their fonts/sounds, keyed by their jsr.io URL
// publish: npm run build && npm publish ./dist --access public
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = new URL('..', import.meta.url).pathname;
const v = JSON.parse(readFileSync(root + 'deno.json', 'utf8')).version;
const pkg = /const PKG = '([^']+)'/.exec(readFileSync(root + 'web/tsvg-core.js', 'utf8'))[1];
if (pkg !== v) { console.error(`web/tsvg-core.js PKG ${pkg} != deno.json ${v}: bump both (tsvg:<lib> imports resolve to jsr.io/@panth977/tsvg/<PKG>/libs/)`); process.exit(1); }
const NPM = '0.10.1'; // the npm package's own version: bump on every publish (npm never takes a version twice); v = engine
const head = `/*! TSVG ${v} · Timeseries Scalable Vector Graphics · MIT · github.com/Panth977/tsvg */\n`;
mkdirSync(root + 'dist', { recursive: true });

// <script type="text/tsvg" data-play>…</script>: a player in its place, playing that document
const autoplay = `
// ── autoplay ──
(function () {
  if (typeof document === 'undefined') return;
  const go = () => document.querySelectorAll('script[type="text/tsvg"][data-play]').forEach(async (s) => {
    const box = document.createElement('div'); box.style.cssText = 'width:100%;aspect-ratio:16/9;max-height:100vh';
    s.parentNode.insertBefore(box, s);
    try { const p = new TSVGPlayer(box, { base: location.href }); await p.load(s.textContent); window.player = window.player || p; }
    catch (e) { box.style.cssText = 'padding:16px;color:#c33;font:14px monospace;white-space:pre-wrap'; box.textContent = 'TSVG: ' + (e && e.message || e); console.error(e); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
`;
const body = ['tsvg-core.js', 'tsvg-zip.js', 'tsvg-player.js'].map((f) => `// ── ${f} ──\n` + readFileSync(root + 'web/' + f, 'utf8')).join('\n');
writeFileSync(root + 'dist/tsvg.js', head + body + autoplay);

// libraries: .tsvgl as text, everything they load (fonts, sounds) as base64; the player turns those into blob: URLs
const MIME = { ttf: 'font/ttf', otf: 'font/otf', woff2: 'font/woff2', m4a: 'audio/mp4', mp3: 'audio/mpeg', png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp' };
const base = `https://jsr.io/@panth977/tsvg/${v}/libs/`;
const files = {};
(function walk(rel) {
  for (const n of readdirSync(root + 'libs/' + rel)) {
    const r = rel + n, ext = n.split('.').pop();
    if (statSync(root + 'libs/' + r).isDirectory()) walk(r + '/');
    else if (ext === 'tsvgl') files[base + r] = readFileSync(root + 'libs/' + r, 'utf8');
    else if (MIME[ext]) files[base + r] = { type: MIME[ext], b64: readFileSync(root + 'libs/' + r).toString('base64') };
  }
})('');
writeFileSync(root + 'dist/tsvg-libs.js', head + 'var TSVG_FILES = Object.assign(globalThis.TSVG_FILES || {}, ' + JSON.stringify(files) + ');\nglobalThis.TSVG_FILES = TSVG_FILES;\n');

writeFileSync(root + 'dist/package.json', JSON.stringify({
  name: '@dixitram/tsvg', version: NPM, license: 'MIT',
  description: 'TSVG player for the browser: one classic script, plus the built-in libraries bundled for pages that cannot fetch (claude.ai artifacts).',
  repository: { type: 'git', url: 'git+https://github.com/Panth977/tsvg.git' }, main: 'tsvg.js', files: ['tsvg.js', 'tsvg-libs.js', 'README.md'],
}, null, 2) + '\n');
writeFileSync(root + 'dist/README.md', `# @dixitram/tsvg ${NPM} (TSVG engine ${v})

TSVG (Timeseries Scalable Vector Graphics) player as plain scripts. Spec and tools: https://github.com/Panth977/tsvg

\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/@dixitram/tsvg@${NPM}/tsvg.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@dixitram/tsvg@${NPM}/tsvg-libs.js"></script> <!-- only if the video imports tsvg:<lib> -->
<script type="text/tsvg" data-play>
  <tsvg …>…</tsvg>
</script>
\`\`\`
`);
// dist/tsvg-video.zip: the claude.ai skill (upload in Settings → Capabilities → Skills). web-skill/ + references
// and examples from the Claude Code skills, made artifact-safe (no voice files, no image paths), + the checker.
const sk = root + 'dist/skill/tsvg-video/'; rmSync(root + 'dist/skill', { recursive: true, force: true });
const put = (p, data) => { mkdirSync(dirname(sk + p), { recursive: true }); writeFileSync(sk + p, data); };
const rd = (p) => readFileSync(root + p, 'utf8');
put('SKILL.md', rd('web-skill/SKILL.md').replaceAll('__VERSION__', NPM));
put('scripts/check.mjs', rd('web-skill/scripts/check.mjs'));
put('scripts/tsvg-core.js', rd('web/tsvg-core.js'));
for (const u of Object.keys(files)) if (u.endsWith('.tsvgl')) put('scripts/libs/' + u.slice(base.length), files[u]);
for (const f of ['story', 'scenes', 'formats']) put(`references/${f}.md`, rd(`skills/tech-explainer/references/${f}.md`));
put('references/codebase-scenes.md', rd('skills/codebase-explainer/references/scenes.md'));
put('references/tsvg.md', '# TSVG language\n\n' + rd('skills/tsvg/SKILL.md').split('## Document skeleton')[1].replace(/^/, '## Document skeleton'));
const lib = (n) => execFileSync('node', [root + 'cli/tsvg.mjs', 'lib', n], { encoding: 'utf8' });
put('references/libs.md', '# Built-in libraries (all bundled in tsvg-libs.js)\n\n' + ['tech', 'icons', 'report', 'explainer', 'charts', 'fx'].map((n) => '## tsvg:' + n + '\n\n```\n' + lib(n).trim() + '\n```\n').join('\n'));
const safe = (x) => x.replace(/<\?xml[^>]*>\s*/, '').replace(/\s*<voices>[\s\S]*?<\/voices>/, '').replace(/src="images\/logos\/(\w)\w*\.png"/g, (m, c) => `glyph="${c.toUpperCase()}"`);
for (const n of ['tech-explainer', 'codebase-explainer']) put(`examples/${n}.tsvg`, safe(rd(`examples/styles/${n}.tsvg`)));
for (const n of ['tech-explainer', 'codebase-explainer']) execFileSync('node', [sk + 'scripts/check.mjs', sk + `examples/${n}.tsvg`], { stdio: 'inherit' });
execFileSync('zip', ['-qr', '../tsvg-video.zip', 'tsvg-video'], { cwd: root + 'dist/skill' });
console.log('dist/tsvg-video.zip (claude.ai skill)', (statSync(root + 'dist/tsvg-video.zip').size / 1024).toFixed(0) + ' KB');

for (const f of ['tsvg.js', 'tsvg-libs.js']) console.log('dist/' + f, v, (statSync(root + 'dist/' + f).size / 1024).toFixed(0) + ' KB');
