#!/usr/bin/env node
// tsvg — command line tools for TSVG (Timeseries Scalable Vector Graphics).
//   tsvg new      <dir> [--style id]             start a video from the report template or a style (tsvg styles)
//   tsvg check    <file> [--fast]                compiler: errors with line numbers, typos, off-frame/overlapping text
//   tsvg preview  <file>                         contact sheet PNG per layout (every scene + its narration)
//   tsvg make     <file.tsvg>                    check → bake voices → check → preview sheets → pack .tsvgz (one step)
//   tsvg styles                                  list the 62 style templates
//   tsvg lib [name]                              the built-in libraries; with a name: its components and props
//   tsvg icons [word]                            icon names in tsvg:icons
//   tsvg captions <file> [--lang gu] [--srt] [-o out.vtt]   the narration as WebVTT / SRT
//   tsvg watch    <file.tsvg> [--port 4390]      live preview: reloads on every save, keeps the position, shows errors
//   tsvg edit     <file.tsvg> [--port 4391]      visual editor: click, drag, edit attributes/props/strings, save
//   tsvg validate <file.tsvg|.tsvgz>             static checks + dry run of every variant
//   tsvg info     <file>                         duration, options, chapters, voices
//   tsvg pack     <file.tsvg> [-o out.tsvgz] [--html [out.html]] [--no-preview]
//                                                zip the document with its files (+ index.html preview); --html: one offline page
//   tsvg unpack   <file.tsvgz> [-o dir]
//   tsvg bake     <file.tsvg> [--tts gu=sarvam:shubh] [--only en,gu] [--force]
//                                                record every <say> line per language, write <voices>
//   tsvg render   <file> -t 3.5 [-o frame.png] [--width 960] [--layout portrait] [--lang gu …]
//   tsvg export   <file> [-o out.mp4] [--fps 30] [--width 1920] [--layout …] [--lang …] [--mix …] [--captions]
//   tsvg test     [--update]                     golden frames (tests/cases.json)
//   tsvg serve    [dir] [--port 4380]            static server for the spec + playground
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve, relative, extname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { detectBeats } from './beats.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const TSVG = require(join(ROOT, 'web/tsvg-core.js'));
const Zip = require(join(ROOT, 'web/tsvg-zip.js'));

// ───────── args ─────────
const argv = process.argv.slice(2);
const cmd = argv.shift();
const flags = {}; const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[++i] : true; (flags[k] = flags[k] || []).push(v); }
  else if (a === '-o' || a === '-t') flags[a.slice(1)] = [argv[++i]];
  else pos.push(a);
}
const flag = (k, d) => (flags[k] ? flags[k][flags[k].length - 1] : d);
const die = (m) => { console.error('tsvg: ' + m); process.exit(1); };

// ───────── sources: a .tsvg file next to its files, or a .tsvgz package ─────────
async function openSource(file) {
  if (!file) die('missing file');
  const abs = resolve(file); if (!existsSync(abs)) die('no such file: ' + file);
  const bytes = readFileSync(abs);
  if (Zip.isZip(bytes)) {
    const files = await Zip.read(bytes, { inflateRaw: (b) => new Uint8Array(inflateRawSync(b)) });
    return { kind: 'zip', path: abs, xml: Zip.text(files.get(Zip.MAIN)), get: (p) => (files.has(p) ? Buffer.from(files.get(p)) : null), has: (p) => files.has(p), list: () => [...files.keys()] };
  }
  const dir = dirname(abs);
  return withLibs({ kind: 'file', path: abs, dir, xml: bytes.toString('utf8'), get: (p) => (existsSync(join(dir, p)) ? readFileSync(join(dir, p)) : null), has: (p) => existsSync(join(dir, p)) && statSync(join(dir, p)).isFile() });
}
// libraries: tsvg:<name> = libs/ in this repo (the same files ship on jsr.io); relative paths and jsr:/https: imports load too.
// The source keeps its imports; src.xml becomes the flattened document every other command works on,
// src.lineMap maps its lines back to the source, and the library files are served next to the document's own.
const LIBS_URL = pathToFileURL(join(ROOT, 'libs') + '/').href;
const libOpts = (base) => ({ base, libBase: LIBS_URL, fetchText: async (u) => (u.startsWith('file:') ? readFileSync(fileURLToPath(u), 'utf8') : fetchOk(u).then((r) => r.text())) });
async function fetchOk(u) { const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status); return r; }
async function withLibs(src) {
  if (!TSVG.needsLibs(src.xml)) return src;
  const o = libOpts(pathToFileURL(src.path).href);
  let libs; try { libs = await TSVG.loadLibs(src.xml, o); } catch (e) { die(e.message); }
  const f = TSVG.flatten(src.xml, libs, o);
  Object.assign(src, { srcXml: src.xml, xml: f.xml, lineMap: f.lineMap, flatErrors: f.errors, libs });
  const extra = {};
  for (const [p, u] of Object.entries(f.files)) extra[p] = u.startsWith('file:') ? (existsSync(fileURLToPath(u)) ? readFileSync(fileURLToPath(u)) : null) : Buffer.from(await (await fetchOk(u)).arrayBuffer());
  const g = src.get, h = src.has; src.get = (p) => extra[p] || g(p); src.has = (p) => !!extra[p] || h(p);
  return src;
}
const srcLine = (src, m) => (src.lineMap ? m.replace(/\bline (\d+)\b/g, (x, n) => (src.lineMap[+n] ? 'line ' + src.lineMap[+n] : x)) : m);
function referenced(doc) {
  const s = new Set();
  const add = (r) => { const p = TSVG.assetPath(doc, r); if (p && !/^(https?|data):/.test(p)) s.add(p); };
  for (const a of Object.values(doc.assets)) add(a.src);
  for (const f of doc.fonts) add(f.src);
  for (const v of Object.values(doc.voices)) add(v.src);
  for (const a of doc.audio) add(a.src);
  for (const say of doc.says) for (const [k, v] of Object.entries(say.raw)) if (k.startsWith('src.')) add(v);
  return [...s];
}
const optsFromFlags = (doc) => { const o = TSVG.defaults(doc); for (const op of doc.options) if (flags[op.id]) o[op.id] = flag(op.id); return o; };
const layoutOf = (doc) => { const id = flag('layout'); const L = id ? doc.layouts.find((l) => l.id === id) : doc.layouts[0]; if (!L) die('no layout ' + id + ' (have ' + doc.layouts.map((l) => l.id).join(', ') + ')'); return L; };

// ───────── commands ─────────
const cmds = {
  async validate() {
    const src = await openSource(pos[0]);
    const r = TSVG.validate(src.xml, { files: { has: src.has } });
    for (const w of r.warnings) console.log('warn  ' + w);
    for (const e of r.errors) console.log('ERROR ' + e);
    if (r.stats) console.log(`${r.ok ? 'ok' : 'FAILED'} · ${r.stats.duration}s · ${r.stats.scenes} scenes · ${r.stats.variants} variants · ${r.errors.length} errors · ${r.warnings.length} warnings`);
    process.exit(r.ok ? 0 : 1);
  },
  async info() {
    const src = await openSource(pos[0]); const doc = TSVG.parse(src.xml);
    const env = TSVG.makeEnv(doc, TSVG.defaults(doc), doc.layouts[0], 0);
    console.log(`TSVG ${doc.version} · ${doc.duration}s · ${src.kind}`);
    console.log('layouts:  ' + doc.layouts.map((l) => `${l.id} ${l.w}×${l.h}`).join(', '));
    for (const o of doc.options) console.log(`option ${o.id}: ` + o.choices.map((c) => (c.id === o.default ? '*' : '') + c.id).join(' '));
    console.log('chapters: ' + doc.chapters.map((c) => `${c.t}s ${TSVG.value(c.label, env, doc)}`).join(' · '));
    const langs = (doc.options.find((o) => o.id === 'lang') || { choices: [{ id: 'en' }] }).choices.map((c) => c.id);
    for (const l of langs) { const lines = TSVG.sayLines(doc, Object.assign(TSVG.defaults(doc), { lang: l })); console.log(`voice ${l}: ${lines.filter((x) => x.clip).length}/${lines.length} lines recorded`); }
  },
  async pack() {
    const src = await openSource(pos[0]); if (src.kind !== 'file') die('pack takes a .tsvg file');
    if (src.flatErrors && src.flatErrors.length) { src.flatErrors.forEach((e) => console.error('ERROR ' + e)); die('fix errors before packing'); }
    const doc = TSVG.parse(src.xml); const extraFiles = {};
    const r = TSVG.validate(src.xml, { files: { has: src.has } }); if (!r.ok) { r.errors.forEach((e) => console.error('ERROR ' + srcLine(src, e))); die('fix errors before packing'); }
    // <video> clips: a poster frame (shown until the clip can play, and by engines without video) and the clip length
    let mainXml = src.xml;
    for (const [id, a] of Object.entries(doc.assets)) {
      if (a.type !== 'video' || /^(https?|data):/.test(a.src) || a.poster || src.kind !== 'file' || !existsSync(join(src.dir, a.src))) continue;
      const poster = a.src.replace(/\.[^./]+$/, '') + '.poster.jpg'; const tmp = join(src.dir, '.tsvg-poster-' + process.pid + '.jpg');
      const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', join(src.dir, a.src), '-frames:v', '1', '-q:v', '4', '-vf', 'scale=min(960\\,iw):-2', tmp], { encoding: 'utf8' });
      if (r.status !== 0) { console.error('warn  no poster for ' + a.src + ' (ffmpeg)'); continue; }
      const d = probeDur(join(src.dir, a.src)); a.poster = poster; extraFiles[poster] = readFileSync(tmp); rmSync(tmp, { force: true });
      const esc = a.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      mainXml = mainXml.replace(new RegExp('<(asset|video)(\\s[^>]*?)src="' + esc + '"', 'g'), (m, tag, pre) => (m.includes('poster=') ? m : '<' + tag + pre + 'src="' + a.src + '" poster="' + poster + '"' + (d ? (tag === 'asset' ? ' dur="' : ' cliplen="') + d.toFixed(3) + '"' : '')));
    }
    const entries = [{ path: Zip.MAIN, data: mainXml }];
    for (const [p, b] of Object.entries(extraFiles)) entries.push({ path: p, data: new Uint8Array(b) });
    if (src.srcXml) entries.push({ path: 'source.tsvg', data: src.srcXml }); // the document as written (imports kept); main.tsvg is flattened
    for (const p of referenced(doc)) entries.push({ path: p, data: new Uint8Array(src.get(p)) });
    // captions files (WebVTT) per language, for players and tools that read captions
    const langOpt = doc.options.find((o) => o.id === 'lang');
    for (const l of langOpt ? langOpt.choices.map((c) => c.id) : ['en']) if (TSVG.sayLines(doc, Object.assign(TSVG.defaults(doc), { lang: l })).length) entries.push({ path: 'captions/' + l + '.vtt', data: TSVG.captions(doc, { lang: l }) });
    // smaller packages (default; --full keeps files as they are): font subsets, big pictures as WebP, duplicates once
    if (!flag('full')) mainXml = shrink(entries, doc, mainXml, src);
    entries[0].data = mainXml;
    const deflateRaw = (b) => new Uint8Array(deflateRawSync(b, { level: 9 }));
    // --html out.html: one self-contained page (player + package inline) that plays offline in any browser
    if (flag('html')) {
      const html = previewHtml(mainXml, doc, { pkg: Zip.write(entries, { deflateRaw }) });
      const hout = flag('html') === true ? src.path.replace(/\.tsvg$/, '') + '.html' : flag('html');
      mkdirSync(dirname(resolve(hout)), { recursive: true }); writeFileSync(hout, html);
      console.log(`${hout} · offline preview · ${(html.length / 1024).toFixed(0)} KB`);
      if (!flags.o) return;
    }
    // every package carries index.html: unzip it and open the page to preview without a player
    if (!flag('no-preview')) entries.push({ path: 'index.html', data: previewHtml(mainXml, doc, {}) });
    const out = flag('o', src.path.replace(/\.tsvg$/, '') + '.tsvgz'); mkdirSync(dirname(resolve(out)), { recursive: true });
    const bytes = Zip.write(entries, { deflateRaw });
    writeFileSync(out, bytes); console.log(`${out} · ${entries.length} files · ${(bytes.length / 1024).toFixed(0)} KB`);
  },
  async unpack() {
    const src = await openSource(pos[0]); if (src.kind !== 'zip') die('unpack takes a .tsvgz');
    const out = resolve(flag('o', src.path.replace(/\.tsvgz$/, '')));
    for (const p of src.list()) { if (p.includes('..')) die('unsafe path in package: ' + p); const f = join(out, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, src.get(p)); }
    console.log(out);
  },
  bake, render, export: exportMp4, test, serve, check, preview, make, new: scaffold, styles, lib: libCmd, libs: libCmd, icons: iconsCmd, captions: captionsCmd, watch: liveCmd, edit: liveCmd,
};
// tsvg watch <file> (live preview) · tsvg edit <file> (visual editor): cli/live.mjs; the next free port from --port
async function liveCmd() {
  if (!pos[0]) die('usage: tsvg ' + cmd + ' <file.tsvg> [--port N]');
  const { startLive } = await import('./live.mjs');
  let port = +flag('port', cmd === 'watch' ? 4390 : 4391);
  for (let k = 0; k < 20; k++) {
    try { const s = await startLive({ file: resolve(pos[0]), port: port + k, mode: cmd, root: ROOT }); console.log(`${cmd === 'watch' ? 'live preview' : 'editor'}: ${s.url}  (Ctrl+C to stop)`); return; }
    catch (e) { if (!/EADDRINUSE/.test(String(e && (e.code || e.message)))) die(e.message); }
  }
  die('no free port from ' + port);
}
// ───────── smaller packages ─────────
// fonts → subset to every character the document can show (all strings in every language, literal texts, ASCII and
// common punctuation, whole scripts its languages use); JPEG/PNG over 150 KB → WebP when that saves 20 %+;
// identical files → one copy. References in main.tsvg follow. Returns the new main.tsvg.
function shrink(entries, doc, xml, src) {
  const before = entries.reduce((a, e) => a + (typeof e.data === 'string' ? e.data.length : e.data.length), 0);
  const tmp = join(src.dir, '.tsvg-shrink-' + process.pid); mkdirSync(tmp, { recursive: true });
  const notes = [];
  try {
    // characters
    const chars = new Set();
    const add = (t) => { for (const ch of String(t || '')) chars.add(ch.codePointAt(0)); };
    for (const s of Object.values(doc.strings)) for (const v of Object.values(s)) add(v);
    for (const m of xml.matchAll(/\b(?:text|chapter|title|label)(?:\.[\w-]+)?="([^"]*)"/g)) add(m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&#10;/g, '\n'));
    for (let c = 0x20; c < 0x7f; c++) chars.add(c);
    for (const c of '–—‘’“”…•·×÷±°™©®€£₹¥✓✗→←↑↓⇢★☆♪%‰′″') chars.add(c.codePointAt(0));
    const langs = (doc.options.find((o) => o.id === 'lang') || { choices: [] }).choices.map((c) => c.id);
    const SCRIPTS = { gu: [0x0a80, 0x0aff], hi: [0x0900, 0x097f], mr: [0x0900, 0x097f], bn: [0x0980, 0x09ff], ta: [0x0b80, 0x0bff], te: [0x0c00, 0x0c7f], kn: [0x0c80, 0x0cff], ml: [0x0d00, 0x0d7f], pa: [0x0a00, 0x0a7f] };
    for (const l of langs) if (SCRIPTS[l]) { for (let c = SCRIPTS[l][0]; c <= SCRIPTS[l][1]; c++) chars.add(c); chars.add(0x0964); chars.add(0x0965); chars.add(0x200c); chars.add(0x200d); }
    const uni = [...chars].sort((a, b) => a - b).map((c) => c.toString(16)).join(',');
    const py = process.env.TSVG_PYTHON || join(process.env.HOME, '.cache/explainer-video/py/venv/bin/python');
    const hasFT = spawnSync(py, ['-c', 'import fontTools'], { encoding: 'utf8' }).status === 0;
    for (const e of entries) {
      if (!/\.(ttf|otf)$/i.test(e.path)) continue;
      if (!hasFT) { notes.push('fonts not subset (pip install fonttools)'); break; }
      const i = join(tmp, 'in' + extname(e.path)), o = join(tmp, 'out' + extname(e.path)); writeFileSync(i, e.data);
      const r = spawnSync(py, ['-m', 'fontTools.subset', i, '--unicodes=' + uni, '--layout-features=*', '--no-hinting', '--notdef-outline', '--name-IDs=*', '--output-file=' + o], { encoding: 'utf8' });
      if (r.status === 0 && existsSync(o)) { const b = readFileSync(o); if (b.length < e.data.length) e.data = new Uint8Array(b); } else notes.push('subset failed: ' + e.path);
    }
    // pictures
    for (const e of entries) {
      if (!/\.(jpe?g|png)$/i.test(e.path) || e.path.endsWith('.poster.jpg') || e.data.length < 150 * 1024) continue;
      const i = join(tmp, 'in' + extname(e.path)), o = join(tmp, 'out.webp'); writeFileSync(i, e.data);
      const r = spawnSync('cwebp', ['-quiet', '-q', '82', '-alpha_q', '90', i, '-o', o], { encoding: 'utf8' });
      if (r.status !== 0 || !existsSync(o)) continue;
      const b = readFileSync(o); if (b.length > e.data.length * 0.8) continue;
      const np = e.path.replace(/\.(jpe?g|png)$/i, '.webp'); if (entries.some((x) => x.path === np)) continue;
      xml = xml.split('"' + e.path + '"').join('"' + np + '"'); e.path = np; e.data = new Uint8Array(b);
    }
    // duplicates
    const seen = new Map();
    for (let k = entries.length - 1; k >= 1; k--) {
      const e = entries[k]; if (typeof e.data === 'string' || /\.(tsvg|vtt|html)$/.test(e.path)) continue;
      const h = createHash('sha1').update(e.data).digest('hex');
      if (seen.has(h)) { const keep = seen.get(h); xml = xml.split('"' + e.path + '"').join('"' + keep + '"'); entries.splice(k, 1); } else seen.set(h, e.path);
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  const after = entries.reduce((a, e) => a + (typeof e.data === 'string' ? e.data.length : e.data.length), 0);
  console.log(`pack: ${(before / 1024).toFixed(0)} KB of files → ${(after / 1024).toFixed(0)} KB (font subsets, WebP, duplicates; --full keeps them)` + (notes.length ? ' · ' + [...new Set(notes)].join(' · ') : ''));
  return xml;
}
// tsvg captions <file> [--lang gu] [--srt] [-o out.vtt]: the narration as a captions file
async function captionsCmd() {
  const src = await openSource(pos[0]); const doc = TSVG.parse(src.xml); const o = optsFromFlags(doc);
  const text = TSVG.captions(doc, o, flag('srt') ? 'srt' : 'vtt');
  const out = flag('o'); if (out) { writeFileSync(out, text); console.log(out); } else process.stdout.write(text);
}
// tsvg icons [word]: icon names in tsvg:icons that contain the word
function iconsCmd() {
  const names = [...readFileSync(join(ROOT, 'libs/icons/icons.tsvgl'), 'utf8').matchAll(/<e k="([^"]+)"/g)].map((m) => m[1]);
  const tags = existsSync(join(ROOT, 'libs/icons/tags.json')) ? JSON.parse(readFileSync(join(ROOT, 'libs/icons/tags.json'), 'utf8')) : {};
  const q = (pos[0] || '').toLowerCase(); const hit = names.filter((n) => n.includes(q)).concat(names.filter((n) => !n.includes(q) && (tags[n] || '').includes(q))); // names first, then tags (lucide tags.json)
  console.log(hit.slice(0, 200).join('  ') + (hit.length > 200 ? `  … (${hit.length - 200} more)` : ''));
  console.log(`\n${hit.length} of ${names.length} · <i:icon name="${hit[0] || 'rocket'}" size="64" color="$accent"/> after <import src="tsvg:icons" as="i"/>`);
}
// tsvg lib            the built-in libraries
// tsvg lib <name|path|jsr:…>   its components and props, as one line each (what an agent needs to write with it)
async function libCmd() {
  const dir = join(ROOT, 'libs');
  if (!pos[0]) {
    for (const n of readdirSync(dir).filter((x) => !x.startsWith('_') && existsSync(join(dir, x, x + '.tsvgl')))) {
      const L = TSVG.describeLib(await loadOne('tsvg:' + n));
      console.log(`tsvg:${n.padEnd(12)} ${L.version.padEnd(7)} ${L.doc}\n${' '.repeat(18)}components: ${L.components.map((c) => c.id).join(', ')}`);
    }
    console.log('\nuse one:   <import src="tsvg:report" as="r"/>  …  <r:title title="…"/>      details: tsvg lib report');
    return;
  }
  const L = TSVG.describeLib(await loadOne(pos[0]));
  const as = flag('as', L.name === 'explainer' ? 'ex' : L.name === 'tech' ? 'tx' : L.name[0]);
  console.log(`<import src="${/^(tsvg|jsr|https?):|[/.]/.test(pos[0]) ? pos[0] : 'tsvg:' + pos[0]}" as="${as}"${L.params.map((p) => ` ${p.name}="${p.dflt || ''}"`).join('')}/>   ${L.name} ${L.version} · ${L.doc}\n`);
  for (const c of L.components) {
    const req = c.props.filter((p) => p.required).map((p) => `${p.name}="…"`); const opt = c.props.filter((p) => !p.required).map((p) => `${p.name}="${p.dflt}"`);
    console.log(`<${as}:${c.id} ${req.join(' ')}${opt.length ? '  [' + opt.join(' ') + ']' : ''}/>\n    ${c.doc}`);
  }
}
async function loadOne(src) {
  const o = libOpts(pathToFileURL(resolve('x.tsvg')).href); const url = TSVG.libUrl(/^(tsvg|jsr|https?):|[/.]/.test(src) ? src : 'tsvg:' + src, o.base, o);
  let text; try { text = await o.fetchText(url); } catch (e) { die('cannot load ' + src + ': ' + e.message); }
  const libs = await TSVG.loadLibs(`<tsvg><import src="${url}"/></tsvg>`, o); return libs[url];
}

// ───────── agent tools: check (compiler), preview (contact sheet), make (one step), new (templates) ─────────
const loc = (file, m) => { const k = /^line (\d+) /.exec(m); return k ? `${file}:${k[1]}: ` + m.slice(k[0].length) : `${file}: ` + m; };
// static checks + a browser pass over every layout: text off the frame, text on top of text. Returns { errors, warnings }.
async function runCheck(src, { fast = false, page } = {}) {
  const rel = relative(process.cwd(), src.path); const file = rel && !rel.startsWith('..') ? rel : src.path;
  if (src.flatErrors && src.flatErrors.length) return { errors: src.flatErrors.map((m) => loc(file, m)), warnings: [], doc: null };
  const r = TSVG.validate(src.xml, { files: { has: src.has } });
  const errors = r.errors.map((m) => loc(file, srcLine(src, m))), warnings = r.warnings.map((m) => loc(file, srcLine(src, m)));
  if (r.ok && !fast) {
    const own = !page; const br = own ? await browser(src) : { page };
    const doc = r.doc;
    const seen = new Set();
    for (const L of doc.layouts) for (const opts of (TSVG.combos(doc).length ? TSVG.combos(doc) : [{}]).slice(0, 4)) {
      const times = []; for (const sc of TSVG.forOptions(doc, Object.assign(TSVG.defaults(doc), opts)).scenes) times.push(sc.start + sc.dur * 0.5, sc.start + sc.dur * 0.9);
      const res = await br.page.evaluate(([t, o, l]) => window.bounds(t, o, l), [times, opts, L.id]);
      for (const b of res) {
        const key = b.kind + b.line + (b.line2 || '') + L.id; if (seen.has(key)) continue; seen.add(key);
        const when = ` (${L.id}${opts.lang ? ' ' + opts.lang : ''}, t=${b.t.toFixed(1)}s)`;
        if (b.line && src.lineMap) b.line = src.lineMap[b.line] || b.line; if (b.line2 && src.lineMap) b.line2 = src.lineMap[b.line2] || b.line2;
        if (b.error) errors.push(loc(file, srcLine(src, b.error)) + when);
        else if (b.kind === 'off') warnings.push(loc(file, `line ${b.line} text "${b.text}" runs off the ${b.where} edge by ${b.by} units${when}`));
        else warnings.push(loc(file, `line ${b.line} text "${b.text}" overlaps line ${b.line2} "${b.text2}"${when}`));
      }
    }
    if (own) await br.b.close();
  }
  return { errors, warnings, doc: r.doc, stats: r.stats };
}
function printIssues({ errors, warnings }) {
  for (const w of warnings) console.log('warning: ' + w);
  for (const e of errors) console.log('error:   ' + e);
}
async function check() {
  const src = await openSource(pos[0]); const r = await runCheck(src, { fast: !!flag('fast') });
  printIssues(r);
  console.log(`${r.errors.length ? 'FAILED' : 'ok'} · ${r.errors.length} errors · ${r.warnings.length} warnings` + (r.stats ? ` · ${+r.stats.duration.toFixed(2)}s · ${r.stats.variants} variants` : ''));
  process.exit(r.errors.length ? 1 : 0);
}
// one PNG per layout: every scene as a tile + its narration line. Agents look at this instead of rendering frames one by one.
async function writeSheets(src, doc, page, base) {
  const opts = optsFromFlags(doc); const outs = [];
  for (const L of doc.layouts) {
    const url = await page.evaluate(([o, l, w]) => window.sheet(o, l, w), [opts, L.id, L.w >= L.h ? 560 : 240]);
    const f = doc.layouts.length > 1 ? base.replace(/\.png$/, '') + '-' + L.id + '.png' : base; writeFileSync(f, fromDataURL(url)); outs.push(f);
  }
  return outs;
}
async function preview() {
  const src = await openSource(pos[0]); const doc = TSVG.parse(src.xml);
  const { b, page } = await browser(src);
  const outs = await writeSheets(src, doc, page, flag('o', src.path.replace(/\.tsvgz?$/, '') + '.preview.png'));
  await b.close(); for (const f of outs) console.log(f);
  for (const l of TSVG.sayLines(doc, optsFromFlags(doc))) console.log(`  ${l.start.toFixed(1).padStart(5)}s  ${l.text}`);
}
// make = check → bake missing voices → check timing again → contact sheets → pack (with index.html). Stops on errors.
async function make() {
  const src0 = await openSource(pos[0]); if (src0.kind !== 'file') die('make takes a .tsvg file');
  const t0 = Date.now();
  let r = await runCheck(src0, { fast: true }); if (r.errors.length) { printIssues(r); die(`${r.errors.length} error(s): fix them and run make again`); }
  const doc0 = r.doc; const langs = (doc0.options.find((o) => o.id === 'lang') || { choices: [{ id: 'en' }] }).choices.map((c) => c.id);
  const missing = langs.some((l) => TSVG.sayLines(doc0, Object.assign(TSVG.defaults(doc0), { lang: l })).some((x) => !x.clip)) || doc0.audio.some((a) => a.beats && !(doc0.data[a.beats] || []).length);
  if (missing && !flag('no-bake')) { console.log('· baking voices'); await bake(); }
  const src = await openSource(pos[0]); const { b, page } = await browser(src);
  r = await runCheck(src, { page }); printIssues(r);
  if (r.errors.length) { await b.close(); die(`${r.errors.length} error(s): fix them and run make again`); }
  const base = flag('o', src.path.replace(/\.tsvg$/, '') + '.tsvgz');
  const sheets = await writeSheets(src, r.doc, page, base.replace(/\.tsvgz$/, '') + '.preview.png'); await b.close();
  flags.o = [base]; await cmds.pack();
  console.log(`\nmade in ${((Date.now() - t0) / 1000).toFixed(0)}s · ${r.warnings.length} warning(s)`);
  console.log('look at:  ' + sheets.join('  '));
  console.log('share:    ' + resolve(base) + '   (or one offline page: tsvg pack ' + relative(process.cwd(), src.path) + ' --html)');
}
// new <dir> [--style id | --template report]: a ready-to-edit .tsvg with its files copied in, no baked voices
async function scaffold() {
  const name = pos[0] || die('usage: tsvg new <dir> [--style <id>] [--template report]');
  const style = flag('style'); const tplPath = style ? join(ROOT, 'examples/styles', style + '.tsvg') : join(ROOT, 'templates', (flag('template') || 'report') + '.tsvg');
  if (!existsSync(tplPath)) die('no such ' + (style ? 'style' : 'template') + ': ' + (style || flag('template')) + (style ? ' (see: tsvg styles)' : ''));
  const dir = resolve(name); if (existsSync(dir) && readdirSync(dir).length) die(dir + ' is not empty');
  mkdirSync(dir, { recursive: true });
  let xml = readFileSync(tplPath, 'utf8').replace(/\n?\s*<!-- written by `tsvg bake`[^\n]*-->/, '').replace(/\s*<voices\b[\s\S]*?<\/voices>/, '');
  const from = dirname(tplPath); let n = 0;
  const s0 = await withLibs({ kind: 'file', path: tplPath, dir: from, xml, get: () => null, has: () => false }); const doc = TSVG.parse(s0.xml);
  for (const p of referenced(doc)) { const f = join(from, p); if (!existsSync(f)) continue; mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), readFileSync(f)); n++; }
  const out = join(dir, basename(dir) + '.tsvg'); writeFileSync(out, xml);
  console.log(`${out}  (${n} files copied from ${style ? 'style ' + style : 'template ' + (flag('template') || 'report')})\nnext: edit it, then  tsvg check ${out}   →   tsvg make ${out}`);
}
function styles() {
  const cat = JSON.parse(readFileSync(join(ROOT, 'examples/styles/catalog.json'), 'utf8'));
  let cur = ''; for (const c of cat) { if (c.category !== cur) { cur = c.category; console.log('\n' + cur); } console.log(`  ${c.id.padEnd(26)} ${c.summary}`); }
  console.log('\nuse one:  tsvg new <dir> --style <id>    (default: tsvg new <dir>, the report template)');
}

// ───────── preview page (web/preview.html) ─────────
// pkg absent: the page loads the player from the CDN and plays the inline document with its files beside it.
// pkg given: the player and the whole package are inlined, so the page works offline from anywhere.
function previewHtml(xml, doc, { pkg }) {
  const version = JSON.parse(readFileSync(join(ROOT, 'deno.json'), 'utf8')).version;
  const env = TSVG.makeEnv(doc, TSVG.defaults(doc), doc.layouts[0], 0);
  let title = 'TSVG video'; try { title = String(TSVG.value(doc.title, env, doc) || title); } catch {}
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const engine = pkg
    ? '<script>' + ['tsvg-core.js', 'tsvg-zip.js', 'tsvg-player.js'].map((f) => readFileSync(join(ROOT, 'web', f), 'utf8')).join('\n').replace(/<\/script/gi, '<\\/script') + '</script>'
    : `<script src="https://esm.sh/jsr/@panth977/tsvg@${version}/dist/tsvg.js?raw"></script>`;
  return readFileSync(join(ROOT, 'web/preview.html'), 'utf8')
    .replace('__VERSION__', version).replace('__TITLE__', () => esc(title))
    .replace('<!--TSVG_ENGINE-->', () => engine)
    .replace('<!--TSVG_PACKAGE-->', () => (pkg ? `<script type="application/octet-stream" id="tsvg-pkg">${Buffer.from(pkg).toString('base64')}</script>` : ''))
    .replace('__DOC__', () => (pkg ? '' : xml.replace(/<\/script/gi, '<\\/script')));
}

// ───────── bake: record every <say> line per language ─────────
async function bake() {
  const src = await openSource(pos[0]); if (src.kind !== 'file') die('bake works on a .tsvg file (unpack a .tsvgz first)');
  const doc = TSVG.parse(src.xml);
  const langOpt = doc.options.find((o) => o.id === 'lang');
  let langs = langOpt ? langOpt.choices.map((c) => c.id) : ['en'];
  if (flag('only')) langs = String(flag('only')).split(',');
  const ttsFor = {};
  for (const l of langs) {
    const fromFlag = (flags.tts || []).map(String).find((x) => x.startsWith(l + '='));
    const choice = langOpt && langOpt.choices.find((c) => c.id === l);
    const fromDoc = choice && parseChoiceTts(src.xml, l);
    ttsFor[l] = (fromFlag && fromFlag.split('=')[1]) || fromDoc || (l === 'en' ? 'kokoro:af_heart' : 'sarvam:shubh');
  }
  const voices = Object.assign({}, doc.voices);
  const docName = basename(src.path).replace(/\.tsvg$/, ''); // clips live in voice/<doc>/<lang>/ so many documents can share a folder
  const jobs = [];
  for (const l of langs) {
    const [engine, voice] = ttsFor[l].split(':');
    for (const ln of TSVG.sayLines(doc, Object.assign(TSVG.defaults(doc), { lang: l }))) {
      const say = doc.says.find((s) => s.key === ln.key); if (say.raw['src.' + l]) continue; // hand-recorded clip wins
      const v = say.raw['voice.' + l] || say.raw.voice || voice;
      const hash = createHash('sha1').update(engine + '|' + v + '|' + ln.speak).digest('hex').slice(0, 10);
      const path = `voice/${docName}/${l}/${ln.key}.${hash}.m4a`; const k = ln.key + '|' + l;
      if (!flag('force') && voices[k] && voices[k].hash === hash && src.has(voices[k].src)) continue;
      jobs.push({ k, key: ln.key, lang: l, engine, voice: v, text: ln.speak, hash, path });
    }
  }
  console.log(`bake: ${jobs.length} line(s) to record · ${langs.map((l) => l + '=' + ttsFor[l]).join(' ')}`);
  const tmp = join(src.dir, '.tsvg-bake-' + basename(src.path) + '-' + process.pid); mkdirSync(tmp, { recursive: true }); // per run: bakes can run side by side
  const kok = jobs.filter((j) => j.engine === 'kokoro');
  if (kok.length) {
    const py = process.env.TSVG_PYTHON || join(process.env.HOME, '.cache/explainer-video/py/venv/bin/python');
    const input = kok.map((j, i) => ({ text: j.text, voice: j.voice, lang: j.lang === 'en' ? 'en-us' : j.lang, speed: 1, out: join(tmp, i + '.wav') }));
    const r = spawnSync(py, [join(ROOT, 'cli/tts_kokoro.py')], { input: JSON.stringify(input), encoding: 'utf8', maxBuffer: 1 << 26 });
    if (r.status !== 0) die('kokoro failed: ' + (r.stderr || '').split('\n').slice(-4).join(' '));
    kok.forEach((j, i) => (j.wav = input[i].out));
  }
  for (const j of jobs.filter((x) => x.engine === 'sarvam')) {
    const key = process.env.SARVAM_API_KEY; if (!key) die('SARVAM_API_KEY not set (needed for ' + j.lang + ')');
    const [model, speaker] = j.voice.includes('@') ? j.voice.split('@') : ['bulbul:v3', j.voice];
    const res = await fetch('https://api.sarvam.ai/text-to-speech', { method: 'POST', headers: { 'api-subscription-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ text: j.text, target_language_code: j.lang + '-IN', speaker, model }) });
    if (!res.ok) die(`sarvam ${j.key} [${j.lang}]: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const body = await res.json(); j.wav = join(tmp, j.lang + '-' + j.key + '.wav'); writeFileSync(j.wav, Buffer.from(body.audios.join(''), 'base64'));
    process.stdout.write('.');
  }
  for (const j of jobs.filter((x) => !['kokoro', 'sarvam'].includes(x.engine))) die('unknown TTS engine ' + j.engine + ' (kokoro | sarvam)');
  for (const j of jobs) {
    const out = join(src.dir, j.path); mkdirSync(dirname(out), { recursive: true });
    ff(['-i', j.wav, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000', '-ac', '1', '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart', out]);
    voices[j.k] = { src: j.path, dur: probeDur(out), hash: j.hash, engine: j.engine + ':' + j.voice };
  }
  rmSync(tmp, { recursive: true, force: true });
  // drop entries for lines that no longer exist, delete files nobody references
  const live = new Set(doc.says.flatMap((s) => langs.map((l) => s.key + '|' + l)));
  for (const k of Object.keys(voices)) if (!live.has(k) && langs.includes(k.split('|')[1])) delete voices[k];
  const keep = new Set(Object.values(voices).map((v) => v.src));
  const vdir = join(src.dir, 'voice', docName); // only this document's folder is cleaned
  if (existsSync(vdir)) for (const l of readdirSync(vdir)) for (const f of readdirSync(join(vdir, l))) { const p = `voice/${docName}/${l}/${f}`; if (!keep.has(p)) unlinkSync(join(src.dir, p)); }
  const block = '<voices>\n' + Object.entries(voices).sort().map(([k, v]) => { const [say, lang] = k.split('|'); return `    <voice say="${say}" lang="${lang}" src="${v.src}" dur="${(+v.dur).toFixed(2)}" hash="${v.hash}" engine="${v.engine}"/>`; }).join('\n') + '\n  </voices>';
  let xml = src.srcXml || src.xml;
  // <music beats="id">: the music's beat grid as <data id="id"> (looped music repeats it to the end of the video)
  for (const m of doc.audio.filter((a) => a.beats)) {
    const path = TSVG.assetPath(doc, m.src); const bytes = src.get(path); if (!bytes) { console.log('warn  beats: no file ' + path); continue; }
    const tag = createHash('sha1').update(bytes).digest('hex').slice(0, 10) + '@' + m.start;
    if (new RegExp('<data id="' + m.beats + '"[^>]*from="' + tag + '"').test(xml) && !flag('force')) continue;
    const tmpf = join(src.dir, '.tsvg-beats-' + process.pid + extname(path)); writeFileSync(tmpf, bytes);
    let grid; try { grid = detectBeats(tmpf); } finally { rmSync(tmpf, { force: true }); }
    const len = probeDur(join(src.dir, path)) || (existsSync(tmpf) ? 0 : 0); const total = Math.max(...TSVG.combos(doc).map((o) => TSVG.forOptions(doc, Object.assign(TSVG.defaults(doc), o)).duration), doc.duration);
    const music = grid.length ? grid : []; const out = []; const L = music.length ? Math.max(music[music.length - 1] + 0.01, len || 0) : 0;
    for (let k = 0; L && m.start + k * L < total + 1; k++) { for (const b of music) { const t = m.start + k * L + b; if (t <= total + 1) out.push(+t.toFixed(3)); } if (!m.loop) break; }
    const el = `<data id="${m.beats}" from="${tag}" v="${out.join(', ')}"/>`;
    if (new RegExp('<data id="' + m.beats + '"[^>]*/>').test(xml)) xml = xml.replace(new RegExp('<data id="' + m.beats + '"[^>]*/>'), el);
    else if (/<defs>/.test(xml)) xml = xml.replace(/<defs>/, '<defs>\n    ' + el);
    else xml = xml.replace(/(\n\s*)<timeline/, '$1<defs>$1  <!-- written by `tsvg bake`: the beat grid of the music -->$1  ' + el + '$1</defs>$1<timeline');
    console.log(`bake: beats → <data id="${m.beats}"> ${out.length} beats (${music.length > 1 ? (60 / (music[1] - music[0])).toFixed(0) + ' bpm' : '?'})`);
  }
  if (/<voices\b[\s\S]*?<\/voices>|<voices\s*\/>/.test(xml)) xml = xml.replace(/<voices\b[\s\S]*?<\/voices>|<voices\s*\/>/, block);
  else xml = xml.replace(/\n?<\/tsvg>\s*$/, '\n\n  <!-- written by `tsvg bake`: one recorded clip per <say> line and language -->\n  ' + block + '\n</tsvg>\n');
  writeFileSync(src.path, xml);
  if (jobs.length) console.log('');
  const s2 = await openSource(src.path); const r = TSVG.validate(s2.xml, { files: { has: s2.has } });
  for (const w of r.warnings.filter((w) => /overlaps|past the end/.test(w))) console.log('warn  ' + w);
  console.log(`bake: done · ${Object.keys(voices).length} clips in <voices>`);
}
function parseChoiceTts(xml, lang) { const m = new RegExp('<choice[^>]*\\bid="' + lang + '"[^>]*\\btts="([^"]+)"').exec(xml); return m && m[1]; }
function ff(args) { const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { encoding: 'utf8' }); if (r.status !== 0) die('ffmpeg: ' + r.stderr); }
function probeDur(f) { return +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout.trim(); }

// ───────── headless Chrome harness (render, export, test) ─────────
async function browser(src) {
  let chromium; try { ({ chromium } = await import('playwright-core')); } catch { die('npm install (playwright-core) first'); }
  const exe = process.env.TSVG_CHROME;
  const b = await chromium.launch(exe ? { executablePath: exe } : { channel: 'chrome' }).catch((e) => die('cannot start Chrome (' + e.message.split('\n')[0] + '); set TSVG_CHROME'));
  const page = await b.newPage();
  await page.route('http://tsvg.local/**', async (route) => {
    const p = decodeURIComponent(new URL(route.request().url()).pathname.slice(1));
    if (p === '__harness.html') return route.fulfill({ contentType: 'text/html', body: HARNESS });
    if (p.startsWith('__web/')) return route.fulfill({ contentType: 'text/javascript', body: readFileSync(join(ROOT, 'web', p.slice(6))) });
    if (p.startsWith('__file/')) { const f = resolve(p.slice(7)); return existsSync(f) ? route.fulfill({ body: readFileSync(f) }) : route.fulfill({ status: 404 }); }
    const data = src && src.get(p); if (!data) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ body: data });
  });
  await page.goto('http://tsvg.local/__harness.html');
  if (src) { const err = await page.evaluate((x) => window.setup(x), src.xml); if (err) die(err); }
  return { b, page };
}
const HARNESS = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000">
<script src="/__web/tsvg-core.js"></script><script src="/__web/tsvg-zip.js"></script><script>
let doc, images = {}; const cv = document.createElement('canvas'); document.body.appendChild(cv);
window.setup = async (xml) => {
  try { doc = TSVG.parse(xml); } catch (e) { return e.message; }
  await Promise.all(doc.fonts.map(async (f) => { const ff = new FontFace(f.family, 'url(/' + f.src + ')', { weight: f.weight, style: f.style }); await ff.load(); document.fonts.add(ff); }));
  await Promise.all(Object.entries(doc.assets).filter(([, a]) => a.type === 'image').map(([id, a]) => new Promise((ok) => { const im = new Image(); im.onload = im.onerror = ok; im.src = '/' + a.src; images[id] = images[a.src] = im; })));
  await Promise.all(Object.entries(doc.assets).filter(([, a]) => a.type === 'video').map(async ([id, a]) => {
    let url = null; try { url = URL.createObjectURL(await (await fetch('/' + a.src)).blob()); } catch (e) {}
    const pool = new Map(); // one element per clip node, as in the player
    const make = async () => { const el = document.createElement('video'); el.muted = true; el.preload = 'auto'; el.src = url; await new Promise((ok) => { el.onloadeddata = ok; el.onerror = ok; setTimeout(ok, 8000); }); const v = { el, want: null }; vids.push(v); return v; };
    const first = await make();
    images[id] = images[a.src] = { frame(ct, rate, vol, n) { const key = n ? (n.line || 0) + '|' + n.a.start + '|' + n.a.rate : ''; let v = pool.get(key); if (!v) { if (!pool.size) v = first; else { v = { el: first.el.cloneNode(), want: null, fresh: true }; vids.push(v); } pool.set(key, v); } v.want = ct; return v.el.readyState >= 2 ? v.el : null; } };
    if (a.poster) await new Promise((ok) => { const im = new Image(); im.onload = im.onerror = ok; im.src = '/' + a.poster; images[a.poster] = im; });
  }));
  await document.fonts.ready; return null;
};
// <video>: a dry render collects the clip times a frame needs; seek every clip there, then draw for real
const vids = [];
async function prep(t, o, L) {
  if (!vids.length) return;
  for (const v of vids) v.want = null;
  const sc = document.createElement('canvas'); sc.width = 8; sc.height = 8;
  try { TSVG.renderFrame(sc.getContext('2d'), doc, t, o, L, images); } catch (e) {}
  await Promise.all(vids.filter((v) => v.fresh).map((v) => { v.fresh = false; return new Promise((ok) => { v.el.onloadeddata = ok; v.el.onerror = ok; v.el.load(); setTimeout(ok, 8000); }); }));
  await Promise.all(vids.filter((v) => v.want != null && Math.abs(v.el.currentTime - v.want) > 0.001).map((v) => new Promise((ok) => { v.el.onseeked = ok; v.el.currentTime = v.want; setTimeout(ok, 4000); })));
}
window.meta = () => ({ duration: doc.duration, layouts: doc.layouts, defaults: TSVG.defaults(doc), plan: null });
window.frame = async (t, opts, layoutId, width, type, q, cc) => {
  const L = doc.layouts.find((l) => l.id === layoutId) || doc.layouts[0];
  const w = Math.round(width || L.w), h = Math.round(w * L.h / L.w);
  const o = Object.assign(TSVG.defaults(doc), opts); await prep(t, o, L);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const ctx = cv.getContext('2d'); ctx.setTransform(w / L.w, 0, 0, w / L.w, 0, 0);
  TSVG.renderFrame(ctx, doc, t, o, L, images);
  if (cc) burnCaption(ctx, t, o, L);
  return cv.toDataURL(type || 'image/png', q || 0.92);
};
// captions burned into exported video (--captions): same look as the web player
function burnCaption(ctx, t, o, L) {
  const ln = TSVG.sayLines(doc, o).find((l) => t >= l.start && t < l.start + l.dur + 0.3); if (!ln) return;
  const size = Math.round(Math.min(L.w, L.h) * 0.034), pad = size * 0.45, maxw = L.w * 0.8;
  ctx.save(); ctx.font = '500 ' + size + "px 'Inter', 'Noto Sans Gujarati', system-ui, sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const words = ln.text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (ctx.measureText(tr).width > maxw && cur) { lines.push(cur); cur = w; } else cur = tr; } lines.push(cur);
  const lh = size * 1.35; const y0 = L.h - L.h * 0.07 - (lines.length - 1) * lh;
  lines.forEach((s, i) => { const w = ctx.measureText(s).width + pad * 2; const y = y0 + i * lh; ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.beginPath(); ctx.roundRect(L.w / 2 - w / 2, y - lh / 2, w, lh, size * 0.2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(s, L.w / 2, y); });
  ctx.restore();
}
// layout check: every text drawn at the sample times, as boxes in layout units → off-frame and overlapping text
window.bounds = (times, opts, layoutId) => {
  const L = doc.layouts.find((l) => l.id === layoutId) || doc.layouts[0];
  const k = 0.5, w = Math.round(L.w * k), h = Math.round(L.h * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
  const proto = CanvasRenderingContext2D.prototype; const orig = proto.fillText; let boxes = [];
  proto.fillText = function (txt, x, y, mw) {
    const n = this.__tsvgNode; const m = this.measureText(txt); const tf = this.getTransform();
    const al = this.textAlign, wd = m.width; const x0 = al === 'center' ? x - wd / 2 : al === 'right' || al === 'end' ? x - wd : x;
    const asc = m.actualBoundingBoxAscent || 0, desc = m.actualBoundingBoxDescent || 0;
    const pts = [[x0, y - asc], [x0 + wd, y - asc], [x0, y + desc], [x0 + wd, y + desc]].map(([px, py]) => [(tf.a * px + tf.c * py + tf.e) / k, (tf.b * px + tf.d * py + tf.f) / k]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    if (this.globalAlpha > 0.2 && String(txt).trim()) boxes.push({ clipped: this.__tsvgClipped, line: n && n.line, text: String(txt).slice(0, 40), x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
    return orig.call(this, txt, x, y, mw);
  };
  const out = [];
  try {
    for (const t of times) {
      boxes = []; ctx.setTransform(k, 0, 0, k, 0, 0);
      try { TSVG.renderFrame(ctx, doc, t, Object.assign(TSVG.defaults(doc), opts), L, images); } catch (e) { out.push({ t, error: e.message }); continue; }
      const m = 6;
      for (const b of boxes) {
        const off = [b.x0 < -m && 'left', b.x1 > L.w + m && 'right', b.y0 < -m && 'top', b.y1 > L.h + m && 'bottom'].filter(Boolean);
        const visible = b.x1 > 0 && b.x0 < L.w && b.y1 > 0 && b.y0 < L.h; // wholly off-screen text is usually on purpose (tickers, camera moves)
        if (off.length && visible && !b.clipped) out.push({ t, line: b.line, text: b.text, kind: 'off', where: off.join('+'), by: Math.round(Math.max(-b.x0, b.x1 - L.w, -b.y0, b.y1 - L.h)) });
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]; if (a.line === b.line) continue; if (a.text === b.text && Math.abs(a.x0 - b.x0) < 2 && Math.abs(a.y0 - b.y0) < 2) continue; // the same text layered on itself (a highlight copy)
        const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (ix <= 0 || iy <= 0 || a.clipped || b.clipped) continue;
        const area = (q) => Math.max(1, (q.x1 - q.x0) * (q.y1 - q.y0));
        if ((ix * iy) / Math.min(area(a), area(b)) > 0.3) out.push({ t, line: a.line, line2: b.line, text: a.text, text2: b.text, kind: 'overlap' });
      }
    }
  } finally { proto.fillText = orig; }
  return out;
};
// contact sheet: one tile per scene (a late frame, after build-ins) with a label, for one layout
window.sheet = async (opts, layoutId, tileW, at) => {
  const L = doc.layouts.find((l) => l.id === layoutId) || doc.layouts[0];
  const o = Object.assign(TSVG.defaults(doc), opts); const V = TSVG.forOptions(doc, o); const env = TSVG.makeEnv(V, o, L, 0);
  const n = V.scenes.length, cols = L.w >= L.h ? Math.min(3, n) : Math.min(5, n), rows = Math.ceil(n / cols);
  const tw = tileW, th = Math.round(tw * L.h / L.w), lab = 46, pad = 12;
  const c = document.createElement('canvas'); c.width = cols * (tw + pad) + pad; c.height = rows * (th + lab + pad) + pad + 40;
  const x = c.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#ddd'; x.font = '600 18px system-ui'; x.fillText((doc.title ? String(TSVG.value(doc.title, env, doc)) + ' · ' : '') + L.id + ' ' + L.w + '×' + L.h + ' · ' + doc.duration + 's · ' + JSON.stringify(o), pad, 26);
  const lines = TSVG.sayLines(doc, o);
  for (const [i, sc] of V.scenes.entries()) {
    const t = sc.start + sc.dur * (at || 0.7), cx = pad + (i % cols) * (tw + pad), cy = 40 + pad + Math.floor(i / cols) * (th + lab + pad);
    x.save(); x.translate(cx, cy); x.beginPath(); x.rect(0, 0, tw, th); x.clip(); x.setTransform(tw / L.w, 0, 0, tw / L.w, cx, cy);
    await prep(t, o, L); try { TSVG.renderFrame(x, doc, t, o, L, images); } catch (e) { x.setTransform(1, 0, 0, 1, cx, cy); x.fillStyle = '#f55'; x.font = '13px monospace'; x.fillText(e.message.slice(0, 80), 6, 20); }
    x.restore();
    const ch = V.chapters.filter((q) => q.t <= sc.start + 1e-6).pop();
    x.fillStyle = '#fff'; x.font = '600 15px system-ui'; x.fillText((i + 1) + ' · ' + sc.id + ' · ' + Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') + (ch ? ' · ' + String(TSVG.value(ch.label, env, doc)) : ''), cx, cy + th + 18);
    const say = lines.find((l) => l.start >= sc.start && l.start < sc.start + sc.dur);
    if (say) { x.fillStyle = '#9aa'; x.font = '13px system-ui'; let s = say.text; while (x.measureText(s).width > tw && s.length > 4) s = s.slice(0, -4) + '…'; x.fillText(s, cx, cy + th + 37); }
  }
  return c.toDataURL('image/png');
};
window.compare = async (a, b, tol) => {
  const load = (u) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = u; });
  const [A, B] = await Promise.all([load(a), load(b)]);
  if (A.width !== B.width || A.height !== B.height) return { size: true, ratio: 1 };
  const get = (im) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return [c, x, x.getImageData(0, 0, c.width, c.height)]; };
  const [, , da] = get(A); const [dc, dx, db] = get(B); const out = dx.createImageData(dc.width, dc.height); let bad = 0;
  for (let i = 0; i < da.data.length; i += 4) {
    const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
    const off = d > (tol || 40); if (off) bad++;
    out.data[i] = off ? 255 : db.data[i] * 0.3; out.data[i + 1] = off ? 0 : db.data[i + 1] * 0.3; out.data[i + 2] = off ? 80 : db.data[i + 2] * 0.3; out.data[i + 3] = 255;
  }
  dx.putImageData(out, 0, 0);
  return { ratio: bad / (da.data.length / 4), diff: dc.toDataURL('image/png') };
};
</script>`;
const fromDataURL = (u) => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');

async function render() {
  const src = await openSource(pos[0]); const doc = TSVG.parse(src.xml);
  const t = +flag('t', 0); const L = layoutOf(doc); const opts = optsFromFlags(doc);
  const { b, page } = await browser(src);
  const url = await page.evaluate(([t, o, l, w]) => window.frame(t, o, l, w), [t, opts, L.id, +flag('width', L.w)]).catch((e) => { b.close(); die('render t=' + t + ': ' + e.message.split('\n')[0].replace(/^page.evaluate: Error: /, '')); });
  const out = flag('o', 'frame.png'); writeFileSync(out, fromDataURL(url)); await b.close();
  console.log(out);
}

// ───────── export: frames from Chrome → ffmpeg, audio mixed from the plan ─────────
async function exportMp4() {
  const src = await openSource(pos[0]); const doc0 = TSVG.parse(src.xml);
  const L = layoutOf(doc0); const opts = optsFromFlags(doc0); const fps = +flag('fps', 30); const doc = TSVG.forOptions(doc0, opts);
  const width = +flag('width', L.w) & ~1; const height = Math.round((width * L.h) / L.w) & ~1;
  const out = resolve(flag('o', basename(src.path).replace(/\.tsvgz?$/, '') + '-' + Object.values(opts).join('-') + '-' + L.id + '.mp4'));
  const tmp = join(dirname(out), '.tsvg-export-' + process.pid); mkdirSync(tmp, { recursive: true });
  const n = Math.ceil(doc.duration * fps); const video = join(tmp, 'video.mp4');
  console.log(`export: ${n} frames · ${width}×${height} @ ${fps} fps · ${JSON.stringify(opts)} · ${L.id}`);
  const { b, page } = await browser(src);
  const enc = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-vf', `scale=${width}:${height}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18', '-movflags', '+faststart', video], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, no) => enc.on('close', (c) => (c === 0 ? ok() : no(new Error('ffmpeg exit ' + c)))));
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const url = await page.evaluate(([t, o, l, w, cc]) => window.frame(t, o, l, w, 'image/jpeg', 0.95, cc), [i / fps, opts, L.id, width, !!flag('captions')]);
    if (!enc.stdin.write(fromDataURL(url))) await new Promise((r) => enc.stdin.once('drain', r));
    if (i % fps === 0) process.stdout.write(`\r  ${Math.round((i / n) * 100)}%`);
  }
  enc.stdin.end(); await done; await b.close();
  process.stdout.write(`\r  frames in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  // audio
  const plan = TSVG.audioPlan(doc, opts); const inputs = []; const chains = [];
  plan.clips.forEach((c, i) => {
    const p = TSVG.assetPath(doc, c.src); const data = src.get(p); if (!data) { console.warn('  missing audio ' + p); return; }
    const gain = (plan.mix[c.bus] == null ? 1 : plan.mix[c.bus]) * (c.vol == null ? 1 : c.vol); if (gain <= 0) return;
    const f = join(tmp, 'a' + i + extname(p)); writeFileSync(f, data);
    if (c.loop) inputs.push('-stream_loop', '-1'); inputs.push('-i', f);
    const k = inputs.filter((x) => x === '-i').length; const ms = Math.round(c.start * 1000);
    // ducking (mix duck=…): the music bus dips under every spoken line
    const duck = plan.mix.duck != null && plan.mix.duck < 1 && c.bus === 'music' ? TSVG.sayLines(doc, opts).filter((l) => l.clip).map((l) => `,volume=${(+plan.mix.duck).toFixed(3)}:enable='between(t,${Math.max(0, l.start - 0.1).toFixed(2)},${(l.start + l.dur + 0.15).toFixed(2)})'`).join('') : '';
    chains.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${doc.duration - c.start},adelay=${ms}:all=1,volume=${gain.toFixed(3)}${duck}[a${k}]`);
  });
  if (chains.length) {
    const labels = chains.map((c) => c.slice(c.lastIndexOf('['))).join('');
    const graph = chains.join(';') + `;${labels}amix=inputs=${chains.length}:normalize=0:duration=longest,atrim=0:${doc.duration},apad=whole_dur=${doc.duration}[out]`;
    ff(['-i', video, ...inputs, '-filter_complex', graph, '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', out]);
  } else ff(['-i', video, '-c', 'copy', out]);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`${out} · ${(statSync(out).size / 1024 / 1024).toFixed(1)} MB · ${chains.length} audio clips`);
}

// ───────── golden-frame tests ─────────
async function test() {
  const casesFile = join(ROOT, 'tests/cases.json'); const cases = JSON.parse(readFileSync(casesFile, 'utf8'));
  const update = !!flag('update'); const gdir = join(ROOT, 'tests/golden'); const odir = join(ROOT, 'tests/out');
  mkdirSync(gdir, { recursive: true }); rmSync(odir, { recursive: true, force: true }); mkdirSync(odir, { recursive: true });
  let failed = 0; const byFile = {};
  for (const c of cases) (byFile[c.file] = byFile[c.file] || []).push(c);
  // validation of every example first
  for (const f of Object.keys(byFile)) { const s = await openSource(join(ROOT, f)); const r = TSVG.validate(s.xml, { files: { has: s.has } }); console.log(`${r.ok ? 'ok  ' : 'FAIL'} validate ${f}${r.ok ? '' : ': ' + r.errors[0]}`); if (!r.ok) failed++; }
  for (const [f, list] of Object.entries(byFile)) {
    const src = await openSource(join(ROOT, f)); const { b, page } = await browser(src);
    for (const c of list) {
      const url = await page.evaluate(([t, o, l, w]) => window.frame(t, o, l, w), [c.t, c.opts || {}, c.layout, c.width || 480]);
      const gold = join(gdir, c.name + '.png');
      if (update || !existsSync(gold)) { writeFileSync(gold, fromDataURL(url)); console.log(`new  ${c.name}`); continue; }
      const r = await page.evaluate(([a, b]) => window.compare(a, b), ['data:image/png;base64,' + readFileSync(gold).toString('base64'), url]);
      const ok = !r.size && r.ratio <= (c.tolerance || 0.003);
      if (!ok) { failed++; writeFileSync(join(odir, c.name + '.png'), fromDataURL(url)); if (r.diff) writeFileSync(join(odir, c.name + '.diff.png'), fromDataURL(r.diff)); }
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name} · ${(r.ratio * 100).toFixed(2)}% pixels differ${r.size ? ' (size)' : ''}`);
    }
    await b.close();
  }
  // zip round trip
  {
    const s = await openSource(join(ROOT, Object.keys(byFile)[0]));
    if (s.kind === 'file') {
      const doc = TSVG.parse(s.xml); const entries = [{ path: Zip.MAIN, data: s.xml }, ...referenced(doc).map((p) => ({ path: p, data: new Uint8Array(s.get(p)) }))];
      const z = Zip.write(entries, { deflateRaw: (x) => new Uint8Array(deflateRawSync(x)) });
      const back = await Zip.read(z, { inflateRaw: (x) => new Uint8Array(inflateRawSync(x)) });
      const ok = entries.every((e) => Buffer.compare(Buffer.from(typeof e.data === 'string' ? Buffer.from(e.data) : e.data), Buffer.from(back.get(e.path))) === 0);
      console.log(`${ok ? 'ok  ' : 'FAIL'} zip round trip · ${entries.length} files`); if (!ok) failed++;
    }
  }
  console.log(failed ? `${failed} failed (see tests/out)` : 'all passed'); process.exit(failed ? 1 : 0);
}

function serve() {
  const dir = resolve(pos[0] || ROOT); const port = +flag('port', 4380);
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.tsvg': 'application/xml', '.tsvgz': 'application/zip', '.mp4': 'video/mp4' };
  createServer((q, s) => {
    let p = join(dir, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!p.startsWith(dir)) { s.writeHead(403); return s.end(); }
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) { s.writeHead(404); return s.end('not found'); }
    const body = readFileSync(p); const type = types[extname(p)] || 'application/octet-stream';
    const m = /^bytes=(\d*)-(\d*)$/.exec(q.headers.range || ''); // Safari needs ranges for media
    if (m) { const a = m[1] ? +m[1] : body.length - +m[2]; const b = m[1] && m[2] ? Math.min(+m[2], body.length - 1) : body.length - 1; s.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${b}/${body.length}`, 'content-length': b - a + 1 }); return s.end(body.subarray(a, b + 1)); }
    s.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': body.length }); s.end(body);
  }).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/  (spec: /spec/  playground: /playground/)`));
}

if (!cmds[cmd]) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 18).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(cmd ? 1 : 0); }
await cmds[cmd]();
