#!/usr/bin/env node
// node check.mjs video.tsvg — validate a TSVG document against the bundled engine and libraries (no network).
// Prints ERROR / WARN lines with source line numbers, or "ok · <duration>s". Exit 1 on errors.
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const here = new URL('.', import.meta.url).pathname;
const TSVG = createRequire(import.meta.url)(here + 'tsvg-core.js');
const file = process.argv[2]; if (!file) { console.error('usage: node check.mjs video.tsvg'); process.exit(2); }
const xml = readFileSync(file, 'utf8');
const libBase = 'file://' + here + 'libs/';
const o = { base: 'file://' + file, libBase, fetchText: async (u) => { const p = decodeURIComponent(u.replace('file://', '')); if (!existsSync(p)) throw new Error('not bundled: ' + u); return readFileSync(p, 'utf8'); } };
let libs = {}; try { if (TSVG.needsLibs(xml)) libs = await TSVG.loadLibs(xml, o); } catch (e) { console.error('ERROR ' + e.message); process.exit(1); }
// files: library files exist (bundled in the page); anything else would be a network request the artifact blocks
const r = TSVG.validate(xml, Object.assign({}, o, { libs, files: { has: (p) => p.startsWith('lib/') } }));
const bad = /<voices\b|\bsrc="(?!data:|tsvg:|lib\/)[^"]+"/.exec(xml.replace(/<import\b[^>]*>/g, ''));
if (bad) r.errors.push('artifacts cannot load files or URLs: ' + bad[0] + ' (use icon=/glyph=, data: images, and narration from say text)');
for (const e of r.errors) console.log('ERROR ' + e);
r.warnings = r.warnings.filter((w) => !/no recorded clip yet/.test(w)); // artifacts speak say text with the browser voice
for (const w of r.warnings) console.log('WARN  ' + w);
if (!r.errors.length) console.log(`ok · ${r.doc ? r.doc.duration.toFixed(1) + 's' : ''} · ${r.warnings.length} warning(s)`);
process.exit(r.errors.length ? 1 : 0);
