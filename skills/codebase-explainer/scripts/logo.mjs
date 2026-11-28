// Fetch real tech logos for one video, into ./logos/<name>.svg + <name>.png (next to this script).
//   node logo.mjs postgres redis deno svelte     → logos/postgres.png …   (use the PNG: <tx:tile src="logos/postgres.png"/>)
// PNG needs ImageMagick (magick) or rsvg-convert; TSVG engines must support PNG, SVG only in browsers.
// Colour logo from devicon first (MIT), else Simple Icons in its brand colour (CC0). Already-fetched files are kept.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// SVG → 256 px transparent PNG (magick, else rsvg-convert)
const toPng = (svg, png) => {
  const m = spawnSync('magick', ['-background', 'none', '-density', '600', svg, '-resize', '256x256', '-gravity', 'center', '-extent', '256x256', png]);
  if (m.status === 0) return true;
  return spawnSync('rsvg-convert', ['-w', '256', '-h', '256', '-a', '-o', png, svg]).status === 0;
};

// Common names → [devicon id, simple-icons slug]. Anything not listed is tried as-is in both (e.g. stripe, nginx).
const STACK = {
  postgres: ['postgresql', 'postgresql'], pg: ['postgresql', 'postgresql'],
  redis: ['redis', 'redis'], cassandra: ['cassandra', 'apachecassandra'],
  influx: ['influxdb', 'influxdb'], influxdb: ['influxdb', 'influxdb'],
  sqlite: ['sqlite', 'sqlite'], deno: ['denojs', 'deno'], hono: [null, 'hono'],
  svelte: ['svelte', 'svelte'], sveltekit: ['svelte', 'svelte'], tailwind: ['tailwindcss', 'tailwindcss'],
  typescript: ['typescript', 'typescript'], node: ['nodejs', 'nodedotjs'], zod: [null, 'zod'],
  mqtt: [null, 'mqtt'],
  firebase: ['firebase', 'firebase'], firestore: ['firebase', 'firebase'],
  aws: ['amazonwebservices', 'amazonwebservices'], s3: [null, 'amazons3'],
  gemini: [null, 'googlegemini'], docker: ['docker', 'docker'], github: ['github', 'github'],
  android: ['android', 'android'], capacitor: [null, 'capacitor'], playwright: ['playwright', null],
  monaco: ['vscode', 'visualstudiocode'], handlebars: ['handlebars', 'handlebarsdotjs'],
};
const DEVICON = (id, v) => `https://cdn.jsdelivr.net/npm/devicon@2.18.0/icons/${id}/${id}-${v}.svg`;
const SIMPLE = (slug) => `https://cdn.simpleicons.org/${slug}`; // served in the brand colour

const names = process.argv.slice(2);
if (!names.length) throw new Error('usage: node logo.mjs postgres redis …   (known: ' + Object.keys(STACK).join(' ') + ')');
const out = new URL('./logos/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

for (const name of names) {
  const file = `${out}${name}.svg`;
  if (existsSync(file)) { if (!existsSync(file.replace(/svg$/, 'png'))) toPng(file, file.replace(/svg$/, 'png')); console.log(`have   ${name}`); continue; }
  const [dev, simple] = STACK[name] ?? [name, name];
  const urls = [...(dev ? [DEVICON(dev, 'original'), DEVICON(dev, 'plain')] : []), ...(simple ? [SIMPLE(simple)] : [])];
  let ok = false;
  for (const u of urls) {
    const r = await fetch(u).catch(() => null);
    const svg = r?.ok ? await r.text() : '';
    if (!svg.includes('<svg')) continue;
    writeFileSync(file, svg);
    if (!toPng(file, file.replace(/svg$/, 'png'))) console.warn(`  ! ${name}: no PNG (install ImageMagick or rsvg-convert)`);
    console.log(`fetched ${name} ← ${u}`);
    ok = true;
    break;
  }
  if (!ok) console.warn(`MISSING ${name}: no logo found — use the generic icon, or drop a PNG at logos/${name}.png`);
}
