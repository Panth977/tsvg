// TSVG core: XML parser, expression language, timeline, Canvas2D renderer and validator.
// Reference engine for TSVG 0.2 (Timeseries Scalable Vector Graphics).
// No dependencies, no DOM needed for parse/validate (runs in Node and browsers).
// A frame is a pure function of (time, options): renderFrame(ctx, doc, t, opts, layout)
// always draws the same picture. That is what makes seeking, ±10 s skip and scrub
// thumbnails free, and what lets every native engine be tested against golden frames.
(function (root) {
  'use strict';
  const VERSION = '0.10';

  // ───────────────────────── XML (subset) ─────────────────────────
  // Elements, attributes, text, comments, <?…?>, <!…>, CDATA, the 5 named
  // entities and numeric ones. Enough for TSVG; tiny to port.
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  const unent = (s) => s.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e] != null ? ENT[e] : m));
  function parseXML(src) {
    let i = 0, line = 1;
    const fail = (msg) => { throw new Error('XML line ' + (src.slice(0, i).split('\n').length) + ': ' + msg); };
    const rootEl = { name: '#root', attrs: {}, children: [], text: '' };
    const stack = [rootEl];
    while (i < src.length) {
      const lt = src.indexOf('<', i);
      const textEnd = lt < 0 ? src.length : lt;
      if (textEnd > i) { const top = stack[stack.length - 1]; top.text += unent(src.slice(i, textEnd)); i = textEnd; continue; }
      if (src.startsWith('<!--', i)) { const e = src.indexOf('-->', i); if (e < 0) fail('unclosed comment'); i = e + 3; continue; }
      if (src.startsWith('<![CDATA[', i)) { const e = src.indexOf(']]>', i); if (e < 0) fail('unclosed CDATA'); stack[stack.length - 1].text += src.slice(i + 9, e); i = e + 3; continue; }
      if (src.startsWith('<?', i) || src.startsWith('<!', i)) { const e = src.indexOf('>', i); if (e < 0) fail('unclosed declaration'); i = e + 1; continue; }
      if (src.startsWith('</', i)) {
        const m = /^<\/([A-Za-z_][\w:.-]*)\s*>/.exec(src.slice(i, i + 200)); if (!m) fail('bad closing tag');
        const top = stack.pop(); if (!top || top.name !== m[1]) fail('expected </' + (top && top.name) + '> but found </' + m[1] + '>');
        i += m[0].length; continue;
      }
      const m = /^<([A-Za-z_][\w:.-]*)/.exec(src.slice(i, i + 200)); if (!m) fail('bad tag');
      const el = { name: m[1], attrs: {}, children: [], text: '', line: src.slice(0, i).split('\n').length };
      i += m[0].length;
      for (;;) {
        const ws = /^\s*/.exec(src.slice(i, i + 1000))[0]; i += ws.length;
        if (src.startsWith('/>', i)) { i += 2; stack[stack.length - 1].children.push(el); break; }
        if (src[i] === '>') { i++; stack[stack.length - 1].children.push(el); stack.push(el); break; }
        const a = /^([A-Za-z_][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/.exec(src.slice(i, i + 100000));
        if (!a) fail('bad attribute in <' + el.name + '>');
        if (a[1] in el.attrs) fail('duplicate attribute ' + a[1] + ' in <' + el.name + '>');
        el.attrs[a[1]] = unent(a[3] != null ? a[3] : a[4]); i += a[0].length;
      }
    }
    if (stack.length > 1) fail('unclosed <' + stack[stack.length - 1].name + '>');
    const els = rootEl.children; if (els.length !== 1) fail('expected exactly one root element');
    return els[0];
  }

  // ───────────────────────── libraries & components ─────────────────────────
  // <import src="tsvg:report" as="r" key="…"/> pulls in a library (.tsvgl): components, styles (themes, fonts,
  // symbols, gradients, fns) and document defaults. <r:title text="…"/> expands a component with props.
  // Expansion is static and happens before parse: flatten() turns a document with imports into plain TSVG
  // (packages carry the flattened main.tsvg, so every player plays them). Local components live in <defs>.
  const PKG = '0.10.0'; // package version: tsvg:<lib> resolves to this release's libs on jsr.io
  const HEAD = ['layouts', 'options', 'mixes', 'themes', 'strings', 'defs', 'assets', 'music', 'backdrop', 'overlay'];
  const BUILTIN = new Set(['tsvg', 'layouts', 'layout', 'options', 'option', 'choice', 'mixes', 'mix', 'themes', 'theme', 'strings', 's', 'defs', 'fn', 'symbol', 'linear', 'radial', 'stop', 'clip', 'mask', 'data', 'assets', 'asset', 'font', 'voices', 'voice', 'music', 'backdrop', 'overlay', 'timeline', 'scene', 'say', 'sfx', 'anim', 'keys', 'rect', 'circle', 'ellipse', 'line', 'path', 'text', 'image', 'group', 'use', 'import', 'component', 'prop', 'slot', 'each', 'if']);
  const needsLibs = (xml) => /<(import|component|dict)\b/.test(xml);
  function libBase(o) { return (o && o.libBase) || root.TSVG_LIB_BASE || 'https://jsr.io/@panth977/tsvg/' + PKG + '/libs/'; }
  function libUrl(src, from, o) {
    if (/^tsvg:/.test(src)) { const n = src.slice(5); return libBase(o) + n + '/' + n + '.tsvgl'; }
    if (/^jsr:/.test(src)) { const m = /^jsr:(@[^/]+\/[^@/]+)@([^/]+)\/(.+)$/.exec(src); if (!m) throw new Error('jsr import must look like jsr:@scope/name@1.2.3/path.tsvgl, got ' + src); return 'https://jsr.io/' + m[1] + '/' + m[2] + '/' + m[3]; }
    return new URL(src, from || (typeof location !== 'undefined' ? location.href : 'file:///')).href;
  }
  const cloneEl = (e) => ({ name: e.name, attrs: Object.assign({}, e.attrs), children: e.children.map(cloneEl), text: e.text, line: e.line });
  function uidOf(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  // props="a, b=default, c?" plus <prop name doc default required/> children
  function propsOf(comp) {
    const out = {};
    // split on commas outside quotes: colors='$a, $b' is one default
    const parts = []; let cur = '', q = null;
    for (const ch of comp.attrs.props || '') { if (q) { if (ch === q) q = null; cur += ch; } else if (ch === "'" || ch === '"') { q = ch; cur += ch; } else if (ch === ',') { parts.push(cur); cur = ''; } else cur += ch; }
    parts.push(cur);
    for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
      const m = /^([A-Za-z_][\w-]*)(\?)?(?:\s*=\s*(.*))?$/.exec(p); if (!m) continue;
      out[m[1]] = { name: m[1], required: !m[2] && m[3] == null, dflt: m[3] != null ? m[3].trim().replace(/^(['"])(.*)\1$/, '$2') : m[2] ? '' : null, doc: '' };
    }
    for (const p of comp.children.filter((c) => c.name === 'prop')) out[p.attrs.name] = { name: p.attrs.name, required: p.attrs.required === '1' || (p.attrs.default == null && p.attrs.optional !== '1'), dflt: p.attrs.default != null ? p.attrs.default : p.attrs.optional === '1' ? '' : null, doc: p.attrs.doc || p.text.trim() };
    return out;
  }
  // load every library a document imports (and theirs), once each. fetchText(url) → text.
  async function loadLibs(xml, o) {
    o = o || {}; const libs = {};
    async function visit(tree, from) {
      for (const im of tree.children.filter((c) => c.name === 'import')) {
        if (!im.attrs.src) continue;
        const url = libUrl(im.attrs.src, from, o); if (libs[url]) continue;
        let text; try { text = await o.fetchText(url); } catch (e) { throw new Error('line ' + im.line + ' <import>: cannot load ' + im.attrs.src + ' (' + url + '): ' + e.message); }
        let t; try { t = parseXML(text); } catch (e) { throw new Error('library ' + im.attrs.src + ': ' + e.message); }
        if (t.name !== 'tsvglib') throw new Error('library ' + im.attrs.src + ': root element must be <tsvglib>');
        libs[url] = prepareLib(t, url, o);
        await visit(t, url);
      }
    }
    await visit(parseXML(xml), o.base);
    return libs;
  }
  // namespace a library's own ids (lib__id) so they never clash with the document's, and move its files under lib/
  function prepareLib(t, url, o) {
    const name = t.attrs.name || 'lib'; const P = name + '__';
    const sec = (n) => t.children.filter((c) => c.name === n);
    const ids = { defs: new Set(), fns: new Set(), data: new Set(), strings: new Set(), assets: new Set() };
    for (const d of sec('defs')) for (const k of d.children) if (k.attrs.id && k.name !== 'component') { ids.defs.add(k.attrs.id); if (k.name === 'fn') ids.fns.add(k.attrs.id); if (k.name === 'data') ids.data.add(k.attrs.id); }
    for (const s of sec('strings')) for (const k of s.children) if (k.attrs.id) ids.strings.add(k.attrs.id);
    for (const a of sec('assets')) for (const k of a.children) if (k.name === 'asset' && k.attrs.id) ids.assets.add(k.attrs.id);
    const files = {};
    const base = libBase(o); const under = url.startsWith(base);
    const relocate = (p) => { if (/^(https?|data):|^lib\//.test(p) || p.includes('%{')) return p; const abs = new URL(p, url).href; const rel = under && abs.startsWith(base) ? abs.slice(base.length) : name + '/' + abs.split('/').pop(); files['lib/' + rel] = abs; return 'lib/' + rel; };
    const fnRe = ids.fns.size ? new RegExp('\\b(' + [...ids.fns].join('|') + ')\\s*\\(', 'g') : null;
    const expr = (v) => {
      v = v.replace(/\bs\(\s*(['"])([^'"]+)\1\s*\)/g, (m, q, id) => (ids.strings.has(id) ? 's(' + q + P + id + q + ')' : m));
      v = v.replace(/\b(data|count)\(\s*(['"])([^'"]+)\2/g, (m, f, q, id) => (ids.data.has(id) ? f + '(' + q + P + id + q : m));
      if (fnRe) v = v.replace(fnRe, (m, id) => P + id + '(');
      return v;
    };
    const fix = (k, v, el) => {
      const base0 = k.split('.')[0];
      v = v.replace(/url\(#([\w-]+)\)/g, (m, id) => (ids.defs.has(id) ? 'url(#' + P + id + ')' : m));
      if (base0 === 'ref' && ids.defs.has(v)) return P + v;
      if ((base0 === 'src') && ids.assets.has(v)) return P + v;
      if (v[0] === '@' && ids.strings.has(v.slice(1))) return '@' + P + v.slice(1);
      if (v[0] === '=' || v.includes('{') || base0 === 'when') v = expr(v);
      if (base0 === 'src' && (el.name === 'asset' || el.name === 'font' || el.name === 'music') && !ids.assets.has(v)) return relocate(v);
      return v;
    };
    (function walk(el, inDefs) {
      for (const [k, v] of Object.entries(el.attrs)) el.attrs[k] = fix(k, v, el);
      if (el.name === 'fn' || el.name === 'data') el.text = expr(el.text);
      if (inDefs && el.attrs.id && el.name !== 'component' && ids.defs.has(el.attrs.id)) el.attrs.id = P + el.attrs.id;
      for (const c of el.children) walk(c, el.name === 'defs');
    })(t, false);
    for (const s of sec('strings')) for (const k of s.children) if (k.attrs.id) k.attrs.id = P + k.attrs.id;
    for (const a of sec('assets')) for (const k of a.children) if (k.name === 'asset' && k.attrs.id) k.attrs.id = P + k.attrs.id;
    const comps = {};
    for (const c of t.children.concat(...sec('defs').map((d) => d.children))) if (c.name === 'component' && c.attrs.id) comps[c.attrs.id] = c;
    const dicts = dictsOf(t);
    const params = propsOf({ attrs: { props: t.attrs.params || '' }, children: [] });
    return { name, url, tree: t, comps, params, files, ids, dicts, version: t.attrs.version || '', doc: t.attrs.doc || '' };
  }
  // <dict id="icons"><e k="check" v="M20 6 9 17l-5-5"/>…</dict>: static key → text tables for %{icons[name]}
  function dictsOf(t) {
    const out = {};
    for (const d of t.children.concat(...t.children.filter((c) => c.name === 'defs').map((c) => c.children))) if (d.name === 'dict' && d.attrs.id) { const m = (out[d.attrs.id] = {}); for (const e of d.children) if (e.name === 'e') m[e.attrs.k] = e.attrs.v != null ? e.attrs.v : e.text; }
    return out;
  }
  // the document (or a library) as a scope: its own components + the libraries it imports (by alias)
  function scopeOf(tree, from, libs, o, errors, own, outer) {
    const subP = (v) => (outer && v && v.indexOf('%{') >= 0 ? v.replace(/%\{([A-Za-z_][\w-]*)\}/g, (m, k) => (outer[k] != null ? outer[k] : m)) : v);
    const ns = {};
    for (const im of tree.children.filter((c) => c.name === 'import')) {
      const url = libUrl(im.attrs.src || '', from, o); const lib = libs[url];
      if (!lib) { errors.push('line ' + im.line + ' <import>: library ' + im.attrs.src + ' is not loaded (use TSVG.loadLibs, tsvg check or the player)'); continue; }
      const as = im.attrs.as || lib.name; const vals = {};
      for (const [k, p] of Object.entries(lib.params)) vals[k] = im.attrs[k] != null ? subP(im.attrs[k]) : p.dflt != null ? p.dflt : '';
      for (const k of Object.keys(im.attrs)) if (!['src', 'as'].includes(k) && !lib.params[k]) errors.push('line ' + im.line + ' <import>: ' + lib.name + ' has no param "' + k + '"' + hint(k, Object.keys(lib.params)));
      ns[as] = { lib, params: vals, im };
    }
    return { comps: own || {}, ns, from, lib: null };
  }
  // flatten: imports + components → plain TSVG. Returns { xml, files (package path → URL), lineMap (flat line → source line), errors }
  function flatten(xml, libs, o) {
    o = o || {}; libs = libs || {};
    const errors = []; const files = {};
    const r = typeof xml === 'string' ? parseXML(xml) : xml;
    const ownComps = {};
    for (const d of r.children.filter((c) => c.name === 'defs')) { for (const c of d.children) if (c.name === 'component') ownComps[c.attrs.id] = c; d.children = d.children.filter((c) => c.name !== 'component'); }
    for (const c of r.children) if (c.name === 'component') ownComps[c.attrs.id] = c;
    const docScope = scopeOf(r, o.base, libs, o, errors, ownComps); docScope.dicts = dictsOf(r);
    for (const d of r.children.filter((c) => c.name === 'defs')) d.children = d.children.filter((c) => c.name !== 'dict');
    r.children = r.children.filter((c) => c.name !== 'dict');
    // library scopes (cached), and each library's head merged into the document: earlier wins, the document first
    const scopes = new Map();
    // a library's scope depends on the params it was imported with (they flow into its own imports)
    const libScope = (lib, params) => { const key = lib.url + '|' + JSON.stringify(params || {}); if (!scopes.has(key)) { const s = scopeOf(lib.tree, lib.url, libs, o, errors, lib.comps, params); s.lib = lib; s.params = params; scopes.set(key, s); } return scopes.get(key); };
    const seen = new Set(); const order = [];
    (function heads(scope) { for (const k of Object.values(scope.ns)) { if (seen.has(k.lib)) continue; seen.add(k.lib); order.push(k); heads(libScope(k.lib, k.params)); } })(docScope);
    const secOf = (el, n) => el.children.find((c) => c.name === n);
    for (const { lib, params } of order) {
      Object.assign(files, lib.files);
      const head = lib.tree.children.filter((c) => HEAD.includes(c.name)).map((c) => applyStatic([c], params, {}, [], errors, 0, lib.name)[0]).filter(Boolean);
      for (const h of head) {
        let mine = secOf(r, h.name);
        if (h.name === 'music') { if (!r.children.some((c) => c.name === 'music')) r.children.push(h); continue; }
        if (h.name === 'backdrop' || h.name === 'overlay') { if (!mine) r.children.push(h); continue; }
        if (mine && h.name === 'layouts') continue; // the document's layouts replace the library's
        if (!mine) { mine = { name: h.name, attrs: {}, children: [], text: '', line: 0 }; r.children.push(mine); }
        if (h.name === 'themes') { // merge by id, token by token; the document's themes without a match borrow the library's first
          for (const th of mine.children) { const from = h.children.find((x) => x.attrs.id === th.attrs.id) || h.children[0]; if (from) for (const [k, v] of Object.entries(from.attrs)) if (th.attrs[k] == null) th.attrs[k] = v; }
          for (const lt of h.children) if (!mine.children.some((x) => x.attrs.id === lt.attrs.id)) mine.children.push(lt);
          continue;
        }
        const have = new Set(mine.children.map((c) => c.attrs.id || c.attrs.family).filter(Boolean));
        for (const c of h.children) { if (c.name === 'component' || c.name === 'dict') continue; const id = c.attrs.id || c.attrs.family; if (id && have.has(id)) continue; c.fromLib = true; mine.children.push(c); }
      }
      if (!r.attrs.font && lib.tree.attrs.font) r.attrs.font = lib.tree.attrs.font;
    }
    let count = 0;
    const resolve = (name, scope) => {
      const i = name.indexOf(':');
      if (i < 0) { const c = scope.comps[name]; return c && !BUILTIN.has(name) ? { comp: c, scope, params: scope.params || {}, label: name } : null; }
      const k = scope.ns[name.slice(0, i)]; if (!k) return null;
      const id = name.slice(i + 1); const c = k.lib.comps[id];
      if (!c) { errors.push('unknown component <' + name + '>: ' + k.lib.name + ' has ' + (Object.keys(k.lib.comps).join(', ') || 'none') + hint(id, Object.keys(k.lib.comps))); return { missing: true }; }
      const s = libScope(k.lib, k.params); return { comp: c, scope: s, params: k.params, label: name };
    };
    // alias:id points into an imported library: ref="b:tick", url(#b:ink), @b:hello, src="b:pad", s('b:x'), data('b:x'), =b:fn(x)
    function nsRefs(el, scope) {
      const P = (a, id) => { const k = scope.ns[a]; return k ? k.lib.name + '__' + id : null; };
      for (const [k, v] of Object.entries(el.attrs)) {
        // a library body may pick one of its own symbols by prop: ref="%{icon}" → lib__icon
        if (scope.lib && k.split('.')[0] === 'ref' && scope.lib.ids.defs.has(v)) { el.attrs[k] = scope.lib.name + '__' + v; continue; }
        if (v.indexOf(':') < 0) continue;
        let w = v.replace(/url\(#([A-Za-z_][\w-]*):([\w-]+)\)/g, (m, a, id) => { const p = P(a, id); return p ? 'url(#' + p + ')' : m; });
        w = w.replace(/\b(s|data|count)\(\s*(['"])([A-Za-z_][\w-]*):([^'"]+)\2/g, (m, f, q, a, id) => { const p = P(a, id); return p ? f + '(' + q + p + q : m; });
        if (w[0] === '=' || w.indexOf('{') >= 0) w = w.replace(/\b([A-Za-z_][\w-]*):([A-Za-z_]\w*)\s*\(/g, (m, a, id) => { const p = P(a, id); return p ? p + '(' : m; }); // a library's <fn>: rl:on(a, b)
        const base = k.split('.')[0]; const m = /^(@?)([A-Za-z_][\w-]*):([\w-]+)$/.exec(w);
        if (m && (m[1] || base === 'ref' || base === 'src')) { const p = P(m[2], m[3]); if (p) w = m[1] + p; }
        el.attrs[k] = w;
      }
    }
    function expand(el, scope, depth) {
      const out = [];
      for (const c of el.children) {
        if (c.done) { out.push(c); continue; }
        if (c.name === 'import' || c.name === 'component') continue;
        const hit = c.name.includes(':') || scope.comps[c.name] ? resolve(c.name, scope) : null;
        if (hit && hit.missing) { errors[errors.length - 1] = 'line ' + c.line + ' ' + errors[errors.length - 1]; continue; }
        if (!hit) { nsRefs(c, scope); if (c.name.includes(':')) errors.push('line ' + c.line + ' <' + c.name + '>: no import with as="' + c.name.split(':')[0] + '"' + hint(c.name.split(':')[0], Object.keys(scope.ns))); c.children = expand(c, scope, depth); out.push(c); continue; }
        if (depth > 40) { errors.push('line ' + c.line + ' <' + c.name + '>: components nest too deep (a component that uses itself?)'); continue; }
        if (++count > 20000) { errors.push('too many component expansions'); return out; }
        for (const k of Object.keys(c.attrs)) { const v = c.attrs[k]; if (v.indexOf(':') >= 0 && (v[0] === '=' || v.indexOf('{') >= 0)) c.attrs[k] = v.replace(/\b([A-Za-z_][\w-]*):([A-Za-z_]\w*)\s*\(/g, (m, a, id) => { const k2 = scope.ns[a]; return k2 ? k2.lib.name + '__' + id + '(' : m; }); } // prop="=rl:on(a, b)" resolves in the caller's scope
        const props = propsOf(hit.comp); const vals = Object.assign({}, hit.params); const variants = {};
        for (const k of Object.keys(c.attrs)) {
          const dot = k.indexOf('.'); const base = dot < 0 ? k : k.slice(0, dot);
          if (base === 'slot' || base === 'id') continue;
          if (!props[base]) { errors.push('line ' + c.line + ' <' + c.name + '>: unknown prop "' + base + '"' + hint(base, Object.keys(props)) + ' (props: ' + Object.keys(props).join(', ') + ')'); continue; }
          if (dot >= 0) (variants[base] = variants[base] || {})[k.slice(dot + 1)] = c.attrs[k];
        }
        for (const p of Object.values(props)) {
          if (c.attrs[p.name] != null) vals[p.name] = c.attrs[p.name];
          else if (p.dflt != null) vals[p.name] = p.dflt;
          else { errors.push('line ' + c.line + ' <' + c.name + '>: missing prop "' + p.name + '"' + (p.doc ? ' (' + p.doc + ')' : '')); vals[p.name] = ''; }
        }
        vals.__dicts = hit.scope.lib ? hit.scope.lib.dicts : hit.scope.dicts || {};
        vals._uid = c.attrs.id || c.name.replace(':', '-') + '-' + uidOf(JSON.stringify(c.attrs) + (c.text || ''));
        vals._line = String(c.line);
        const slots = expand({ children: c.children }, scope, depth + 1).map((s) => { s.done = true; return s; });
        const body = applyStatic(hit.comp.children.filter((x) => x.name !== 'prop'), vals, variants, slots, errors, c.line, c.name);
        const res = expand({ children: body }, hit.scope, depth + 1);
        const mark = (e) => { if (!e.done) { e.line = c.line; e.children.forEach(mark); } };
        res.forEach(mark); out.push(...res);
      }
      return out;
    }
    r.children = r.children.filter((c) => c.name !== 'import' && c.name !== 'component');
    r.children = expand(r, docScope, 0);
    // drop library assets and fonts nothing uses (packages stay small); <font only="gu"> ships only with a gu choice
    const used = []; const choices = new Set();
    (function scan(e, skip) { if (skip) return; for (const [k, v] of Object.entries(e.attrs)) { used.push(v); if (e.name === 'choice' && k === 'id') choices.add(v); } used.push(e.text || ''); for (const c of e.children) scan(c, e.name === 'assets'); })(r, false);
    const all = used.join('\n');
    const uses = (id) => new RegExp('(^|[^\\w])' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^\\w]|$)').test(all);
    for (const a of r.children.filter((c) => c.name === 'assets')) a.children = a.children.filter((c) => !c.fromLib || (c.name === 'font' ? uses(c.attrs.family) && (!c.attrs.only || c.attrs.only.split(/[ ,]+/).some((x) => choices.has(x))) : uses(c.attrs.id)));
    for (const a of r.children.filter((c) => c.name === 'assets')) for (const c of a.children) delete c.attrs.only;
    const lineMap = [0]; const xmlOut = serializeXML(r, lineMap);
    return { xml: xmlOut, files, lineMap, errors, root: r };
  }
  // static template: %{prop} substitution, <if test>, <each items>, <slot>
  function applyStatic(nodes, vals, variants, slots, errors, line, who) {
    // %{p} = the prop's value; %{p#} = a short stable hash of it (ids that follow the content, e.g. say ids)
    // %{dict[p]}: the entry of <dict id="dict"> whose key is p's value; %{p:sum}: the sum of p's numbers
    const dicts = vals.__dicts || {};
    const sub = (s, v) => (s.indexOf('%{') < 0 ? s : s.replace(/%\{([A-Za-z_][\w.|-]*)(?:\[([A-Za-z_][\w.-]*)\])?(#|:count|:sum)?\}/g, (m, k, dk, h) => {
      if (dk != null) {
        const d = dicts[k]; const key = v[dk];
        if (!d) { errors.push('line ' + line + ' <' + who + '>: no <dict id="' + k + '">'); return ''; }
        if (key == null) { errors.push('line ' + line + ' <' + who + '>: %{' + dk + '} is not a prop here'); return ''; }
        if (d[key] == null) { errors.push('line ' + line + ' <' + who + '>: "' + key + '" is not in ' + k + hint(String(key), Object.keys(d))); return ''; }
        return d[key];
      }
      const val = k.indexOf('|') < 0 ? v[k] : k.split('|').map((x) => v[x]).find((x) => x != null && x !== '') ?? v[k.split('|').pop()];
      if (val == null) { errors.push('line ' + line + ' <' + who + '>: %{' + k + '} is not a prop here'); return ''; }
      if (h === '#') return 'h' + uidOf(val);
      if (h === ':sum') return String(String(val).split(/[|,\s]+/).filter((x) => NUMERIC.test(x)).reduce((a, x) => a + +x, 0));
      if (h) return String(val.split(/[\n‖]/.test(val) ? /\n|‖/ : '|').filter((x) => x.trim() !== '').length);
      return val;
    }));
    // a test compares only where the template itself has == or != (a prop's text may contain them too)
    const test = (raw, v) => {
      const masked = raw.replace(/%\{[^}]*\}/g, (m) => '\u0000'.repeat(m.length));
      const m = /^([\s\S]*?)\s*(==|!=)\s*([\s\S]*)$/.exec(masked);
      if (m) { const a = sub(raw.slice(0, m[1].length), v).trim(), b = sub(raw.slice(masked.length - m[3].length), v).trim(); return (a === b) === (m[2] === '=='); }
      return !['', '0', 'false', 'no', 'none'].includes(sub(raw, v).trim());
    };
    const out = [];
    for (const n of nodes) {
      if (n.name === 'slot') { const want = n.attrs.name || ''; for (const s of slots) if ((s.attrs.slot || '') === want) { delete s.attrs.slot; out.push(s); } continue; }
      if (n.name === 'if') {
        const ok = n.attrs.test != null ? test(n.attrs.test, vals) : n.attrs.not != null ? !test(n.attrs.not, vals) : true;
        const kids = n.children.filter((c) => c.name !== 'else'); const els = n.children.find((c) => c.name === 'else');
        out.push(...applyStatic(ok ? kids : els ? els.children : [], vals, variants, slots, errors, line, who)); continue;
      }
      if (n.name === 'each') {
        const as = n.attrs.as || 'item'; const sep = n.attrs.sep || '|'; const fsep = n.attrs.fsep || '::';
        const fields = (n.attrs.fields || '').split(',').map((x) => x.trim()).filter(Boolean);
        const items = n.attrs.n != null ? Array.from({ length: Math.max(0, Math.min(1000, Math.floor(+sub(n.attrs.n, vals) || 0))) }, (_, i) => String(i))
          : sub(n.attrs.items || '', vals).split(sep === 'lines' ? /\n|‖/ : sep).map((x) => (n.attrs.keep ? x.replace(/\s+$/, '') : x.trim())).filter((x, i, a) => (n.attrs.keep ? !(x === '' && (i === 0 || i === a.length - 1)) : x !== ''));
        items.forEach((it, i) => {
          const acc = items.slice(0, i).filter((x) => NUMERIC.test(x)).reduce((a, x) => a + +x, 0);
          const v = Object.assign({}, vals, { [as]: it, [as + '_i']: String(i), [as + '_1']: String(i + 1), [as + '_n']: String(items.length), [as + '_last']: i === items.length - 1 ? '1' : '0',
            [as + '_prev']: i > 0 ? items[i - 1] : '', [as + '_next']: i < items.length - 1 ? items[i + 1] : '', [as + '_acc']: String(+acc.toFixed(6)) });
          const parts = it.split(fsep).map((x) => x.trim()); for (let j = 0; j < Math.max(4, parts.length); j++) v[as + '.' + j] = parts[j] != null ? parts[j] : ''; fields.forEach((f, j) => (v[as + '.' + f] = parts[j] != null ? parts[j] : ''));
          out.push(...applyStatic(n.children, v, variants, slots, errors, line, who));
        });
        continue;
      }
      const c = { name: n.name, attrs: {}, children: [], text: sub(n.text || '', vals), line: n.line };
      for (const [k, v] of Object.entries(n.attrs)) {
        c.attrs[k] = sub(v, vals);
        if (k.indexOf('.') < 0 && v.indexOf('%{') >= 0) for (const [p, vs] of Object.entries(variants)) if (v.indexOf('%{' + p + '}') >= 0) for (const [tag, val] of Object.entries(vs)) if (n.attrs[k + '.' + tag] == null) c.attrs[k + '.' + tag] = sub(v, Object.assign({}, vals, { [p]: val }));
      }
      c.children = applyStatic(n.children, vals, variants, slots, errors, line, who);
      out.push(c);
    }
    return out;
  }
  // element tree → XML text; lineMap[outputLine] = the element's source line
  function serializeXML(el, lineMap) {
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
    const escT = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let out = '<?xml version="1.0" encoding="UTF-8"?>\n'; let ln = 2;
    const put = (s, srcLine) => { lineMap[ln] = srcLine || 0; out += s + '\n'; ln += 1 + (s.match(/\n/g) || []).length; };
    (function w(e, ind) {
      const a = Object.entries(e.attrs).map(([k, v]) => ' ' + k + '="' + esc(v) + '"').join('');
      const text = e.text && e.text.trim() ? e.text : '';
      if (!e.children.length && !text) return put(ind + '<' + e.name + a + '/>', e.line);
      if (!e.children.length) return put(ind + '<' + e.name + a + '>' + escT(text.trim()) + '</' + e.name + '>', e.line);
      put(ind + '<' + e.name + a + '>', e.line);
      if (text) put(ind + '  ' + escT(text.trim()), e.line);
      for (const c of e.children) w(c, ind + '  ');
      put(ind + '</' + e.name + '>', e.line);
    })(el, '');
    return out;
  }
  // a library's components and props, for docs and `tsvg lib`
  function describeLib(lib) {
    return { name: lib.name, version: lib.version, doc: lib.doc, params: Object.values(lib.params), components: Object.entries(lib.comps).map(([id, c]) => ({ id, doc: c.attrs.doc || '', props: Object.values(propsOf(c)) })) };
  }

  // ───────────────────────── expression language ─────────────────────────
  const PI = Math.PI;
  const EASE = {
    linear: (k) => k,
    in: (k) => k * k * k,
    out: (k) => 1 - Math.pow(1 - k, 3),
    io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    back: (k) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    elastic: (k) => (k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * PI / 3)) + 1),
    step: (k) => (k < 1 ? 0 : 1),
  };
  const FNS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, sqrt: Math.sqrt,
    min: Math.min, max: Math.max, floor: Math.floor, ceil: Math.ceil, round: Math.round,
    pow: Math.pow, exp: Math.exp, log: Math.log, atan2: Math.atan2, sign: Math.sign,
    clamp: (v, a, b) => Math.min(b, Math.max(a, v)),
    lerp: (a, b, k) => a + (b - a) * k,
    step: (e, x) => (x < e ? 0 : 1),
    smooth: (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); },
    fract: (x) => x - Math.floor(x),
    ease: (k, name) => (EASE[name] || EASE.linear)(Math.min(1, Math.max(0, k))),
    fmt: (n, d) => Number(n).toFixed(d || 0),
    commas: (n, d) => { const [a, b] = Number(n).toFixed(d || 0).split('.'); return a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : ''); }, // 12840 → 12,840
    // size of a picture of aspect a (w/h) fitted inside bw × bh (fit="contain")
    fitw: (a, bw, bh) => Math.min(bw, bh * a), fith: (a, bw, bh) => Math.min(bw / a, bh),
    num: (list, i) => { const p = String(list).trim().split(/[\s,]+/); return +p[((Math.floor(i) % p.length) + p.length) % p.length] || 0; }, // i-th number of "0.1 0.2 0.3"
    str: (x) => String(x),
    rgba: (r, g, b, a) => 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + (a == null ? 1 : a) + ')',
    mix: (a, b, k) => lerpAny(a, b, k),
    // deterministic pseudo-random 0…1 for a seed, and smooth 1-D value noise (same result on every engine)
    rand: (n) => { const x = Math.sin((+n || 0) * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); },
    noise: (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); const r = (n) => { const y = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return y - Math.floor(y); }; return r(i) + (r(i + 1) - r(i)) * u; },
  };

  function tokenize(src) {
    const out = []; let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) { const m = /^[0-9]*\.?[0-9]+(e[-+]?[0-9]+)?/i.exec(src.slice(i)); if (!m) throw new Error('bad number in ' + src); out.push({ t: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if (/[A-Za-z_$]/.test(c)) { const m = /^\$?[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i)); out.push({ t: 'id', v: m[0] }); i += m[0].length; continue; }
      if (c === "'" || c === '"') { const j = src.indexOf(c, i + 1); if (j < 0) throw new Error('unclosed string in ' + src); out.push({ t: 'str', v: src.slice(i + 1, j) }); i = j + 1; continue; }
      const two = src.slice(i, i + 2);
      if (['==', '!=', '<=', '>=', '&&', '||'].includes(two)) { out.push({ t: 'op', v: two }); i += 2; continue; }
      if ('+-*/%^<>!?:(),'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
      throw new Error("bad character '" + c + "' in " + src);
    }
    return out;
  }
  const BP = { '?': 1, '||': 2, '&&': 3, '==': 4, '!=': 4, '<': 5, '>': 5, '<=': 5, '>=': 5, '+': 6, '-': 6, '*': 7, '/': 7, '%': 7, '^': 8 };
  const BIN = {
    '+': (x, y) => (typeof x === 'string' || typeof y === 'string' ? String(x) + String(y) : x + y),
    '-': (x, y) => x - y, '*': (x, y) => x * y, '/': (x, y) => x / y,
    '%': (x, y) => ((x % y) + y) % y, '^': (x, y) => Math.pow(x, y),
    '==': (x, y) => (x == y ? 1 : 0), '!=': (x, y) => (x != y ? 1 : 0),
    '<': (x, y) => (x < y ? 1 : 0), '>': (x, y) => (x > y ? 1 : 0), '<=': (x, y) => (x <= y ? 1 : 0), '>=': (x, y) => (x >= y ? 1 : 0),
  };
  function compile(src) {
    const toks = tokenize(src); let p = 0;
    const peek = () => toks[p]; const next = () => toks[p++];
    const expect = (v) => { const k = next(); if (!k || k.v !== v) throw new Error("expected '" + v + "' in " + src); };
    function prefix() {
      const k = next(); if (!k) throw new Error('unexpected end of ' + src);
      if (k.t === 'num' || k.t === 'str') { const v = k.v; return () => v; }
      if (k.t === 'op' && k.v === '(') { const e = expr(0); expect(')'); return e; }
      if (k.t === 'op' && k.v === '-') { const e = expr(9); return (env) => -e(env); }
      if (k.t === 'op' && k.v === '!') { const e = expr(9); return (env) => (e(env) ? 0 : 1); }
      if (k.t === 'id') {
        const name = k.v;
        if (peek() && peek().v === '(') {
          next(); const args = [];
          if (peek() && peek().v !== ')') { do { args.push(expr(0)); } while (peek() && peek().v === ',' && next()); }
          expect(')');
          return (env) => {
            const vals = args.map((a) => a(env));
            if (name === 's') return strOf(env.doc, String(vals[0]), env);
            if (name === 'nth') { // nth('a | b | c', i) or nth('$accent, #f00', i): i-th item (wraps); $tokens resolve, numbers stay numbers
              const sl = String(vals[0]); const items = sl.split(sl.indexOf('|') >= 0 ? '|' : ',').map((x) => x.trim());
              const it = items[((Math.floor(+vals[1] || 0) % items.length) + items.length) % items.length];
              return it[0] === '$' ? lookup(env, it) : NUMERIC.test(it) ? parseFloat(it) : it;
            }
            if (name === 'cue' || name === 'cueEnd') {
              const sc = env.scene; const c = sc && sc.cues[vals[0]];
              if (!c) throw new Error(sc ? 'no <say> "' + vals[0] + '" in scene ' + sc.id + ' (cue takes a say id or 0, 1, …)' : name + '() works inside a scene');
              return name === 'cue' ? c.at : c.end;
            }
            if (name === 'aspect') { const im = env.images && env.images[vals[0]]; const w = im && (im.naturalWidth || im.width), h = im && (im.naturalHeight || im.height); return w && h ? w / h : vals[1] != null ? vals[1] : 1.6; } // width / height of a loaded image
            // time lists (beats, cues): since(t, 'beats') seconds since the last time ≤ t, idx(t, 'beats') how many ≤ t,
            // pulse(t, 'beats', decay) 1 on each time, fading with exp(-(t − last)/decay)
            if (name === 'since' || name === 'idx' || name === 'pulse') {
              const list = env.doc && env.doc.data[vals[1]]; if (!list) throw new Error('unknown data ' + vals[1]);
              const t = +vals[0]; let lo = 0, hi = list.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (+list[mid] <= t) lo = mid + 1; else hi = mid; }
              if (name === 'idx') return lo;
              const dt = lo ? t - +list[lo - 1] : Infinity;
              return name === 'since' ? (lo ? dt : 1e9) : lo ? Math.exp(-dt / (vals[2] > 0 ? +vals[2] : 0.25)) : 0;
            }
            if (name === 'data' || name === 'count') {
              const list = env.doc && env.doc.data[vals[0]]; if (!list) throw new Error('unknown data ' + vals[0]);
              if (name === 'count') return list.length;
              const i = Math.floor(vals[1]); return list[((i % list.length) + list.length) % list.length];
            }
            if (FNS[name]) return FNS[name].apply(null, vals);
            const f = env.fns && env.fns[name]; if (!f) throw new Error('unknown function ' + name + '()');
            return f(vals, env);
          };
        }
        if (name === 'PI') return () => PI;
        if (name === 'true') return () => 1;
        if (name === 'false') return () => 0;
        return (env) => lookup(env, name);
      }
      throw new Error("unexpected '" + k.v + "' in " + src);
    }
    function expr(rbp) {
      let left = prefix();
      for (;;) {
        const k = peek(); if (!k || k.t !== 'op' || !(k.v in BP) || BP[k.v] <= rbp) break;
        next(); const op = k.v;
        if (op === '?') { const a = expr(0); expect(':'); const b = expr(0); const c = left; left = (env) => (c(env) ? a(env) : b(env)); continue; }
        const right = expr(op === '^' ? BP[op] - 1 : BP[op]); const l = left;
        if (op === '&&') left = (e) => (l(e) && right(e) ? 1 : 0);
        else if (op === '||') left = (e) => (l(e) || right(e) ? 1 : 0);
        else { const f = BIN[op]; left = (e) => f(l(e), right(e)); }
      }
      return left;
    }
    const e = expr(0); if (p < toks.length) throw new Error("unexpected '" + toks[p].v + "' in " + src); return e;
  }
  function lookup(env, name) {
    if (name[0] === '$') { const v = env.theme[name.slice(1)]; if (v === undefined) throw new Error('unknown theme token ' + name); return v; }
    if (name in env.vars) return env.vars[name];
    if (name in env.opts) return env.opts[name];
    throw new Error('unknown variable ' + name);
  }

  // ───────────────────────── document model ─────────────────────────
  const SHAPES = new Set(['rect', 'circle', 'ellipse', 'line', 'path', 'text', 'image', 'video', 'group', 'use', 'row', 'col', 'grid']);
  const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;
  const LAYOUTS = new Set(['row', 'col', 'grid']); // auto layout containers (0.5)
  const NUMERIC = /^-?[0-9]*\.?[0-9]+$/;
  const AUDIO_EXT = /\.(ogg|opus|mp3|m4a|wav|aac|flac)$/i;
  const FONT_EXT = /\.(ttf|otf|woff2?)$/i;

  function parse(xml, o) {
    let r;
    if (typeof xml === 'string' && needsLibs(xml)) { const f = flatten(xml, o && o.libs, o); if (f.errors.length) throw new Error(f.errors[0]); r = f.root; }
    else r = typeof xml === 'string' ? parseXML(xml) : xml;
    if (r.name !== 'tsvg') throw new Error('root element must be <tsvg>, found <' + r.name + '>');
    const kids = (el, name) => el.children.filter((c) => !name || c.name === name);
    const one = (name) => kids(r, name)[0];
    const doc = {
      version: r.attrs.version || VERSION, title: r.attrs.title || '', font: r.attrs.font || '', layouts: [], options: [], mixes: {}, themes: {}, strings: {},
      fns: {}, fnSrc: {}, data: {}, symbols: {}, gradients: {}, clips: {}, masks: {}, assets: {}, fonts: [], scenes: [], backdrop: [], overlay: [],
      audio: [], says: [], voices: {}, chapters: [], duration: 0, warnings: [],
    };
    for (const l of kids(one('layouts') || r, 'layout')) doc.layouts.push({ id: l.attrs.id, w: +l.attrs.w, h: +l.attrs.h });
    if (!doc.layouts.length) doc.layouts.push({ id: 'landscape', w: 1920, h: 1080 });
    for (const o of kids(one('options') || r, 'option')) doc.options.push({ id: o.attrs.id, label: o.attrs.label || o.attrs.id, default: o.attrs.default, choices: kids(o, 'choice').map((c) => ({ id: c.attrs.id, label: c.attrs.label || c.attrs.id })) });
    for (const m of kids(one('mixes') || r, 'mix')) { const g = {}; for (const k in m.attrs) if (k !== 'id') g[k] = +m.attrs[k]; doc.mixes[m.attrs.id] = g; }
    for (const th of kids(one('themes') || r, 'theme')) { const a = Object.assign({}, th.attrs); delete a.id; doc.themes[th.attrs.id] = a; }
    for (const s of kids(one('strings') || r, 's')) { const a = Object.assign({}, s.attrs); delete a.id; doc.strings[s.attrs.id] = a; }
    const defs = one('defs');
    if (defs) for (const d of defs.children) {
      const id = d.attrs.id;
      if (d.name === 'fn') {
        const args = (d.attrs.args || '').split(',').map((s) => s.trim()).filter(Boolean); const src = d.text.trim(); const body = compile(src);
        doc.fnSrc[id] = { args, src };
        doc.fns[id] = (vals, env) => { const vars = Object.assign({}, env.vars); args.forEach((n, i) => (vars[n] = vals[i])); return body(Object.assign({}, env, { vars })); };
      } else if (d.name === 'symbol') doc.symbols[id] = buildNodes(d);
      else if (d.name === 'linear' || d.name === 'radial') doc.gradients[id] = { type: d.name, a: d.attrs, stops: kids(d, 'stop').map((s) => s.attrs) };
      else if (d.name === 'clip') doc.clips[id] = buildNodes(d);
      else if (d.name === 'mask') doc.masks[id] = buildNodes(d);
      else if (d.name === 'data') doc.data[id] = (d.attrs.v != null ? d.attrs.v : d.text).split(/[,\n]/).map((x) => x.trim()).filter((x) => x !== '').map((x) => (NUMERIC.test(x) ? parseFloat(x) : x.replace(/^['"]|['"]$/g, '')));
    }
    for (const a of kids(one('assets') || r)) {
      if (a.name === 'font') doc.fonts.push({ id: a.attrs.id, family: a.attrs.family || a.attrs.id, src: a.attrs.src, weight: a.attrs.weight || '1 1000', style: a.attrs.style || 'normal' });
      else if (a.name === 'asset') doc.assets[a.attrs.id] = { src: a.attrs.src, type: a.attrs.type || guessType(a.attrs.src), poster: a.attrs.poster, dur: a.attrs.dur != null ? +a.attrs.dur : undefined };
    }
    for (const v of kids(one('voices') || r, 'voice')) doc.voices[v.attrs.say + '|' + v.attrs.lang] = { src: v.attrs.src, dur: +v.attrs.dur || 0, hash: v.attrs.hash || '', engine: v.attrs.engine || '' };
    for (const m of kids(r, 'music')) doc.audio.push({ bus: m.attrs.bus || 'music', src: m.attrs.src, start: +(m.attrs.start || 0), loop: m.attrs.loop === '1', vol: +(m.attrs.vol || 1), when: m.attrs.when, beats: m.attrs.beats });
    const bd = one('backdrop'); if (bd) doc.backdrop = buildNodes(bd);
    const ov = one('overlay'); if (ov) doc.overlay = buildNodes(ov);
    // the timeline is kept as written; timing() lays it out for one option set (scene lengths may follow the narration)
    doc.sceneSrc = []; let sayN = 0;
    for (const sc of kids(one('timeline') || r, 'scene')) {
      const src = { id: sc.attrs.id, a: sc.attrs, nodes: buildNodes(sc), says: [], sfx: [], line: sc.line };
      walk(sc, (el) => {
        if (el.name === 'say') { src.says.push({ key: el.attrs.id || (el.attrs.text && el.attrs.text[0] === '@' ? el.attrs.text.slice(1) : 'say' + sayN), raw: el.attrs, scene: sc.attrs.id }); sayN++; }
        if (el.name === 'sfx') src.sfx.push(el.attrs);
      });
      doc.sceneSrc.push(src);
    }
    doc.music = doc.audio.slice();
    for (const m of doc.music) if (m.beats && !doc.data[m.beats]) doc.data[m.beats] = []; // until tsvg bake writes the grid
    doc.timelineIn = (one('timeline') || {}).attrs ? one('timeline').attrs.in : undefined; // default transition for every scene
    const varied = (a, names) => Object.keys(a).some((k) => names.includes(k.split('.')[0]) && k.includes('.'));
    doc.timed = doc.sceneSrc.some((s) => s.a.dur === 'auto' || varied(s.a, ['dur', 'start']) || s.says.some((x) => varied(x.raw, ['at'])) || s.sfx.some((x) => varied(x, ['at'])));
    doc.rootDuration = r.attrs.duration;
    Object.assign(doc, timing(doc, defaults(doc)));
    return doc;

    function walk(el, f) { for (const c of el.children) { f(c); walk(c, f); } }
    function buildNodes(el) {
      const out = [];
      for (const c of el.children) {
        if (!SHAPES.has(c.name)) continue;
        const node = { type: c.name, a: c.attrs, anims: [], children: [], line: c.line };
        if ((c.name === 'image' || c.name === 'video') && c.attrs.src && !doc.assets[c.attrs.src] && /[/.]/.test(c.attrs.src)) doc.assets[c.attrs.src] = { src: c.attrs.src, type: c.name, poster: c.attrs.poster }; // <image src="path.png"> needs no <asset>
        for (const k of c.children) {
          if (k.name === 'anim') node.anims.push({ prop: k.attrs.prop, a: k.attrs });
          else if (k.name === 'keys') node.anims.push({ prop: k.attrs.prop, keys: parseKeys(k.attrs.v || k.text), ease: k.attrs.ease || 'io' });
        }
        if (c.name === 'group' || LAYOUTS.has(c.name)) node.children = buildNodes(c);
        out.push(node);
      }
      return out;
    }
  }
  function guessType(src) { return AUDIO_EXT.test(src || '') ? 'audio' : FONT_EXT.test(src || '') ? 'font' : VIDEO_EXT.test(src || '') ? 'video' : 'image'; }
  // ───────────────────────── timing ─────────────────────────
  // Scene starts/lengths, say and sfx times for one option set. dur="auto": the scene lasts as long as its narration
  // in the chosen language (+ pad, at least min); a <say> without at= in such a scene follows the previous one (+ gap).
  // dur.gu / start.gu / at.gu variants work too. cue('key') / cueEnd('key') (or cue(0) = the scene's first line) give
  // a line's start / end inside the scene, so animations can follow the voice.
  function lineDur(doc, x, lang, env) {
    const baked = doc.voices[x.key + '|' + lang];
    if (baked && baked.dur) return baked.dur;
    if (x.raw.dur) return +x.raw.dur;
    let text = ''; try { text = String(value(x.raw.text, env, doc)); } catch (e) {}
    return Math.max(1.5, text.split(/\s+/).length * 0.42);
  }
  function timing(doc, opts) {
    const env = makeEnv(doc, opts, doc.layouts[0], 0, null);
    const num = (a, k, d) => { const raw = pick(a, k, env); if (raw == null) return d; try { return value(raw, env, doc); } catch (e) { throw where(e, k + '="' + raw + '"'); } };
    const scenes = [], says = [], audio = doc.music.slice(), chapters = []; let cursor = 0, duration = 0;
    for (const s of doc.sceneSrc) {
      const start = +num(s.a, 'start', cursor); const rawDur = num(s.a, 'dur', null); const auto = rawDur === 'auto';
      const gap = +num(s.a, 'gap', 0.3); const cues = {}; let prevEnd = null, last = 0, i = 0;
      for (const x of s.says) {
        const on = !x.raw.when || compiled(x.raw.when[0] === '=' ? x.raw.when.slice(1) : x.raw.when)(env);
        const explicit = pick(x.raw, 'at', env);
        const at = explicit != null ? +value(explicit, env, doc) : auto ? (prevEnd == null ? 0.4 : prevEnd + gap) : 0;
        const d = lineDur(doc, x, opts.lang, env);
        says.push({ key: x.key, start: start + at, raw: x.raw, scene: s.id });
        if (on) { cues[x.key] = cues[i] = { at, end: at + d }; i++; prevEnd = at + d; last = Math.max(last, at + d); }
      }
      let dur;
      if (auto) dur = Math.round(Math.max(+num(s.a, 'min', 2), last + +num(s.a, 'pad', 0.8)) * 1000) / 1000;
      else { dur = +rawDur; if (!(dur > 0)) throw new Error('<scene id="' + s.id + '"> needs dur > 0 (or dur="auto")'); }
      for (const f of s.sfx) audio.push({ bus: f.bus || 'sfx', src: f.src, start: start + +num(f, 'at', 0), vol: +(f.vol || 1), when: f.when });
      scenes.push({ id: s.id, start, dur, nodes: s.nodes, cues, line: s.line, trans: pick(s.a, 'in', env) != null ? pick(s.a, 'in', env) : doc.timelineIn });
      if (s.a.chapter) chapters.push({ t: start, label: s.a.chapter });
      cursor = Math.round((start + dur) * 1000) / 1000; duration = Math.max(duration, cursor);
    }
    if (doc.rootDuration) duration = +doc.rootDuration;
    return { scenes, says, audio, chapters, duration };
  }
  // the document as timed for these options (itself when nothing depends on them)
  function forOptions(doc, opts) {
    if (!doc.timed || !opts) return doc;
    const key = doc.options.map((o) => opts[o.id]).join('|');
    if (!doc.views) Object.defineProperty(doc, 'views', { value: new Map(), enumerable: false });
    let v = doc.views.get(key);
    if (!v) { v = Object.assign({}, doc, timing(doc, Object.assign(defaults(doc), opts))); Object.defineProperty(v, 'views', { value: new Map(), enumerable: false }); v.timed = false; doc.views.set(key, v); }
    return v;
  }
  function parseKeys(s) { return s.split(';').map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf(':'); return { at: +x.slice(0, i), v: x.slice(i + 1).trim() }; }); }

  // ───────────────────────── value resolution ─────────────────────────
  const cache = new Map();
  function compiled(src) { let f = cache.get(src); if (!f) { f = compile(src); cache.set(src, f); } return f; }

  function strOf(doc, id, env) {
    const s = doc.strings[id]; if (!s) throw new Error('unknown string @' + id);
    const lang = env.opts.lang; const v = s[lang] != null ? s[lang] : s.en != null ? s.en : Object.values(s)[0];
    return template(v, env);
  }
  function template(s, env) { return s.indexOf('{') < 0 ? s : s.replace(/\{([^}]+)\}/g, (_, e) => String(compiled(e)(env))); }
  function value(raw, env, doc) {
    if (raw == null) return undefined;
    if (raw[0] === '\\') return raw.slice(1); // escape: \=> is the literal text "=>"
    if (raw[0] === '=') return compiled(raw.slice(1))(env);
    if (raw[0] === '@') return strOf(doc, raw.slice(1), env);
    if (raw[0] === '$' && /^\$[A-Za-z_]\w*$/.test(raw)) return lookup(env, raw);
    if (NUMERIC.test(raw)) return parseFloat(raw);
    return template(raw, env);
  }
  // attribute variants: x.portrait, size.gu, fill.light … first matching tag wins
  function pick(a, name, env) {
    for (const tag of env.tags) { const k = name + '.' + tag; if (k in a) return a[k]; }
    return a[name];
  }
  function attr(node, name, env, doc, dflt) {
    const raw = pick(node.a, name, env);
    let v; try { v = value(raw, env, doc); } catch (e) { throw where(e, name + '="' + raw + '"'); }
    return v === undefined ? dflt : v;
  }
  // errors say where they happened: the attribute, then the element's line (added once, innermost first)
  function where(e, ctx) { if (!(e instanceof Error) || (typeof DOMException !== 'undefined' && e instanceof DOMException)) e = new Error(String(e && e.message || e)); if (!e.tsvgAttr) { e.tsvgAttr = true; e.message = ctx + ': ' + e.message; } return e; }

  function parseColor(c) {
    if (typeof c !== 'string') return null;
    let m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c);
    if (m) { const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255, m[2] ? parseInt(m[2], 16) / 255 : 1]; }
    m = /^#([0-9a-f]{3})([0-9a-f])?$/i.exec(c); if (m) return [...m[1]].map((h) => parseInt(h + h, 16)).concat(m[2] ? parseInt(m[2] + m[2], 16) / 255 : 1);
    m = /^rgba?\(([^)]+)\)$/.exec(c); if (m) { const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; }
    return null;
  }
  const NUMS = /-?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:e[-+]?[0-9]+)?/gi;
  function lerpAny(a, b, k) {
    if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * k;
    const ca = parseColor(a), cb = parseColor(b);
    if (ca && cb) return 'rgba(' + [0, 1, 2].map((i) => Math.round(ca[i] + (cb[i] - ca[i]) * k)).join(',') + ',' + +(ca[3] + (cb[3] - ca[3]) * k).toFixed(3) + ')';
    // morph: two strings with the same skeleton (e.g. path data with the same commands) interpolate number by number
    if (typeof a === 'string' && typeof b === 'string') {
      const na = a.match(NUMS), nb = b.match(NUMS);
      if (na && nb && na.length === nb.length && a.replace(NUMS, '#') === b.replace(NUMS, '#')) { let i = 0; return a.replace(NUMS, () => { const v = +na[i] + (+nb[i] - +na[i]) * k; i++; return String(+v.toFixed(3)); }); }
    }
    return k < 1 ? a : b;
  }
  function withAlpha(c, a) { const p = parseColor(c); if (!p || a >= 1) return c; return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + +(p[3] * a).toFixed(3) + ')'; }

  // property = base attribute, then <anim>/<keys> in order (later started anims win)
  function prop(node, name, env, doc, dflt) {
    let v = attr(node, name, env, doc, dflt);
    let first = true;
    for (const an of node.anims) {
      if (an.prop !== name) continue;
      const lt = env.vars.T - env.vars.T0;
      if (an.keys) {
        const ks = an.keys; const ease = EASE[an.ease] || EASE.io;
        if (lt <= ks[0].at) v = value(ks[0].v, env, doc);
        else if (lt >= ks[ks.length - 1].at) v = value(ks[ks.length - 1].v, env, doc);
        else for (let i = 0; i < ks.length - 1; i++) if (lt >= ks[i].at && lt < ks[i + 1].at) { v = lerpAny(value(ks[i].v, env, doc), value(ks[i + 1].v, env, doc), ease((lt - ks[i].at) / (ks[i + 1].at - ks[i].at))); break; }
        first = false; continue;
      }
      const a = an.a;
      const at = +value(pick(a, 'at', env) || '0', env, doc), dur = +value(pick(a, 'dur', env) || '0.5', env, doc);
      const from = pick(a, 'from', env) != null ? value(pick(a, 'from', env), env, doc) : v;
      const to = pick(a, 'to', env) != null ? value(pick(a, 'to', env), env, doc) : v;
      if (lt < at) { if (first) v = from; }
      else { const k = dur > 0 ? Math.min(1, (lt - at) / dur) : 1; v = lerpAny(from, to, (EASE[a.ease] || EASE.out)(k)); }
      first = false;
    }
    return v;
  }

  // ───────────────────────── rendering ─────────────────────────
  const FONT = "system-ui, -apple-system, 'Segoe UI', 'Noto Sans Gujarati', 'Gujarati Sangam MN', sans-serif";
  const pathLen = new Map();
  function lengthOf(d) {
    if (pathLen.has(d)) return pathLen.get(d);
    let L = 1000;
    try { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); L = p.getTotalLength(); } catch (e) {}
    pathLen.set(d, L); return L;
  }

  function makeEnv(doc, opts, layout, t, images) {
    const theme = doc.themes[opts.theme] || Object.values(doc.themes)[0] || {};
    const tags = [layout.id].concat(doc.options.map((o) => opts[o.id]).filter(Boolean));
    return { doc, opts, theme, tags, fns: doc.fns, images, vars: { t, T: t, T0: 0, p: 0, W: layout.w, H: layout.h, dur: doc.duration, portrait: layout.h > layout.w ? 1 : 0, layout: layout.id } };
  }
  function drawNodes(ctx, nodes, env) { for (const n of nodes) drawNode(ctx, n, env); }
  function visible(n, env) {
    const a = n.a;
    const w = pick(a, 'when', env);
    if (w != null && !compiled(w[0] === '=' ? w.slice(1) : w)(env)) return false;
    if (a.only) { const want = a.only.split(/[ ,]+/); if (!want.some((x) => env.tags.includes(x))) return false; }
    const T = env.vars.T;
    const at = a.at != null ? +value(pick(a, 'at', env), env, env.doc) : null;
    if (at != null && T < at) return false;
    if (a.dur != null && T > (at || 0) + +value(pick(a, 'dur', env), env, env.doc)) return false;
    return true;
  }
  // fill/stroke paint: colour, $token, or url(#gradient)
  function paintOf(ctx, v, env, alpha) {
    if (v == null || v === 'none') return null;
    const m = /^url\(#([\w-]+)\)$/.exec(v);
    if (!m) return alpha < 1 ? withAlpha(v, alpha) : v;
    const g = env.doc.gradients[m[1]]; if (!g) throw new Error('unknown gradient #' + m[1]);
    const n = (k, d) => { const r = pick(g.a, k, env); return r == null ? d : +value(r, env, env.doc); };
    const grad = g.type === 'linear' ? ctx.createLinearGradient(n('x1', 0), n('y1', 0), n('x2', 100), n('y2', 0)) : ctx.createRadialGradient(n('fx', n('x', 0)), n('fy', n('y', 0)), 0, n('x', 0), n('y', 0), n('r', 100));
    for (const s of g.stops) grad.addColorStop(Math.min(1, Math.max(0, +value(s.at || '0', env, env.doc))), withAlpha(String(value(s.color || '#000', env, env.doc)), (s.opacity != null ? +value(s.opacity, env, env.doc) : 1) * (alpha == null ? 1 : alpha)));
    return grad;
  }
  // Path2D of a shape node (for clip paths); null when the node has no area
  function shapePath(n, env) {
    const P = (k, d) => prop(n, k, env, env.doc, d);
    const p = new Path2D();
    if (n.type === 'rect') { const w = P('w', 100), h = P('h', 100), x = P('x', 0) - w * P('ax', 0), y = P('y', 0) - h * P('ay', 0), r = P('r', 0); if (r > 0 && p.roundRect) p.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else p.rect(x, y, w, h); return p; }
    if (n.type === 'circle' || n.type === 'ellipse') { const rx = P('r', P('rx', 50)), ry = n.type === 'ellipse' ? P('ry', rx) : rx; p.ellipse(P('x', 0), P('y', 0), Math.max(0, rx), Math.max(0, ry), 0, 0, 2 * PI); return p; }
    if (n.type === 'path') { const q = new Path2D(); const x = P('x', 0), y = P('y', 0); q.addPath(new Path2D(P('d', '')), { a: 1, b: 0, c: 0, d: 1, e: x, f: y }); return q; }
    return null;
  }
  function shadowOf(ctx, raw, env) {
    if (!raw || raw === 'none') return;
    const parts = String(raw).trim().split(/\s+/);
    const k = ctx.getTransform ? Math.sqrt(Math.abs(ctx.getTransform().a * ctx.getTransform().d - ctx.getTransform().b * ctx.getTransform().c)) : 1;
    ctx.shadowOffsetX = +parts[0] * k; ctx.shadowOffsetY = +parts[1] * k; ctx.shadowBlur = +(parts[2] || 0) * k;
    const c = parts[3] || '#0008'; ctx.shadowColor = c[0] === '$' ? lookup(env, c) : c;
  }

  function fontOf(P, doc) {
    const fams = String(P('font', '') || doc.font || '').split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    return (P('italic', 0) ? 'italic ' : '') + P('weight', 400) + ' ' + P('size', 48) + 'px ' + fams.map((f) => "'" + f + "', ").join('') + FONT;
  }
  function textOf(n, env) { const raw = pick(n.a, 'text', env); return raw != null && NUMERIC.test(raw) ? raw : String(value(raw, env, env.doc) ?? ''); }

  // ───────── rich text (0.6): spans, letter spacing, split into words/letters, text on a path ─────────
  // rich="1": **bold**  *italic*  `code`  ==highlight==  [words]($accent)  (\ escapes). ls = letter spacing.
  // split="word|char|line" stagger="0.06": each unit runs the node's anims on its own clock (T0 + k·stagger),
  // with variables u (index) and u_n. path="M …" lays one line along a path (offset 0–1 slides it).
  const isRich = (n) => n.a.rich != null || n.a.split != null || n.a.ls != null || n.a.path != null;
  function parseRich(txt, on) {
    if (!on) return [{ t: txt, b: 0, i: 0, code: 0, hl: 0, c: null }];
    const runs = []; const st = { b: 0, i: 0, code: 0, hl: 0, c: null }; let cur = Object.assign({ t: '' }, st);
    const push = () => { if (cur.t) runs.push(cur); cur = Object.assign({ t: '' }, st); };
    for (let k = 0; k < txt.length; k++) {
      const ch = txt[k], two = txt.slice(k, k + 2);
      if (ch === '\\' && k + 1 < txt.length) { cur.t += txt[++k]; continue; }
      if (st.code) { if (ch === '`') { push(); st.code = 0; cur = Object.assign({ t: '' }, st); } else cur.t += ch; continue; }
      if (two === '**') { push(); st.b ^= 1; cur = Object.assign({ t: '' }, st); k++; continue; }
      if (two === '==') { push(); st.hl ^= 1; cur = Object.assign({ t: '' }, st); k++; continue; }
      if (ch === '*') { push(); st.i ^= 1; cur = Object.assign({ t: '' }, st); continue; }
      if (ch === '`') { push(); st.code = 1; cur = Object.assign({ t: '' }, st); continue; }
      if (ch === '[') { const m = /^\[([^\]]*)\]\(([^)]*)\)/.exec(txt.slice(k)); if (m) { push(); runs.push(Object.assign({}, st, { t: m[1], c: m[2] })); k += m[0].length - 1; continue; } }
      cur.t += ch;
    }
    push(); return runs;
  }
  // lines of pieces (words, spaces) with x positions; widths include letter spacing
  function richLayout(ctx, n, env, P, txt) {
    const doc = env.doc; const size = P('size', 48), lh = P('lh', 1.25), maxw = P('maxw', 0), ls = P('ls', 0), weight = P('weight', 400);
    const fams = String(P('font', '') || doc.font || '').split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    const fontFor = (r) => (r.i || P('italic', 0) ? 'italic ' : '') + (r.b ? Math.max(700, +weight || 0) : weight) + ' ' + (r.code ? size * 0.9 : size) + 'px ' + (r.code ? "'JetBrains Mono', ui-monospace, Menlo, monospace" : fams.map((f) => "'" + f + "', ").join('') + FONT);
    const hasLS = 'letterSpacing' in ctx;
    const measure = (t, r) => { ctx.font = fontFor(r); if (hasLS) ctx.letterSpacing = ls + 'px'; return ctx.measureText(t).width + (hasLS ? 0 : ls * [...t].length); };
    ctx.save();
    const pieces = [];
    for (const r of parseRich(txt, n.a.rich != null && n.a.rich !== '0')) for (const t of r.t.split(/(\n|[ \t]+)/)) if (t !== '') pieces.push({ t, r, nl: t === '\n', sp: /^[ \t]+$/.test(t) });
    const lines = []; let cur = { pieces: [], w: 0 };
    const end = () => { while (cur.pieces.length && cur.pieces[cur.pieces.length - 1].sp) cur.w -= cur.pieces.pop().w; lines.push(cur); cur = { pieces: [], w: 0 }; };
    for (const pc of pieces) {
      if (pc.nl) { end(); continue; }
      pc.w = measure(pc.t, pc.r);
      if (pc.sp && !cur.pieces.length) continue;
      if (!pc.sp && maxw > 0 && cur.w + pc.w > maxw && cur.pieces.some((q) => !q.sp)) end();
      pc.x = cur.w; cur.pieces.push(pc); cur.w += pc.w;
    }
    end();
    ctx.restore();
    return { lines, size, lh, ls, fontFor, measure, w: Math.max(0, ...lines.map((l) => l.w)), h: (lines.length - 1) * size * lh + size };
  }
  const pathCache = new Map();
  function pathSampler(d) {
    if (pathCache.has(d)) return pathCache.get(d);
    let smp = null;
    try { const el = document.createElementNS('http://www.w3.org/2000/svg', 'path'); el.setAttribute('d', d); const L = el.getTotalLength(); smp = { L, at: (s) => { const a = el.getPointAtLength(Math.max(0, Math.min(L, s))), b = el.getPointAtLength(Math.max(0, Math.min(L, s + 0.5))), c = s + 0.5 > L ? el.getPointAtLength(Math.max(0, s - 0.5)) : null; return { x: a.x, y: a.y, a: c ? Math.atan2(a.y - c.y, a.x - c.x) : Math.atan2(b.y - a.y, b.x - a.x) }; } }; } catch (e) {}
    pathCache.set(d, smp); return smp;
  }
  function drawRichText(ctx, n, env, P, fill, stroke, sw, x, y) {
    const doc = env.doc;
    const txt = textOf(n, env); const L = richLayout(ctx, n, env, P, txt); const align = P('align', 'left');
    const reveal = P('reveal', 1); let budget = reveal < 1 ? Math.round([...txt].length * reveal) : Infinity;
    const hasLS = 'letterSpacing' in ctx; if (hasLS) ctx.letterSpacing = L.ls + 'px';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const colorOf = (r) => (r.c ? paintOf(ctx, String(value(r.c, env, doc)), env) : fill);
    const hlFill = () => paintOf(ctx, String(value(P('hl', '$accent') || '#ff0', env, doc)), env, 0.35);
    const glyphs = (t, r, gx, gy, paintFill) => {
      ctx.font = L.fontFor(r);
      if (!hasLS && L.ls) { let cx = gx; for (const ch of t) { if (stroke) ctx.strokeText(ch, cx, gy); if (paintFill) ctx.fillText(ch, cx, gy); cx += ctx.measureText(ch).width + L.ls; } return; }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.lineJoin = 'round'; ctx.strokeText(t, gx, gy); }
      if (paintFill) ctx.fillText(t, gx, gy);
    };
    const piece = (pc, px, py) => {
      let t = pc.t; if (budget !== Infinity) { const cs = [...t]; if (budget <= 0) return; if (cs.length > budget) t = cs.slice(0, budget).join(''); budget -= cs.length; }
      const w = t === pc.t ? pc.w : L.measure(t, pc.r);
      if ((pc.r.hl || pc.r.code) && !pc.sp) { ctx.save(); ctx.fillStyle = pc.r.code ? paintOf(ctx, env.theme.panel || '#8883', env) : hlFill(); const p = new Path2D(); const hh = L.size * (pc.r.code ? 1.15 : 1.1); if (p.roundRect) p.roundRect(px - 6, py - hh / 2, w + 12, hh, 8); else p.rect(px - 6, py - hh / 2, w + 12, hh); ctx.fill(p); ctx.restore(); }
      const f = colorOf(pc.r); if (f) ctx.fillStyle = f; glyphs(t, pc.r, px, py, !!f);
    };
    // text on a path: one line, each letter turned with the path
    const pd = P('path', null);
    if (pd) {
      const smp = pathSampler(String(pd)); if (!smp) return;
      const all = L.lines.flatMap((l) => l.pieces); const total = L.lines.reduce((a, l) => a + l.w, 0);
      let s0 = P('offset', 0) * smp.L + (align === 'center' ? (smp.L - total) / 2 : align === 'right' ? smp.L - total : 0);
      ctx.save(); ctx.translate(x, y);
      for (const pc of all) for (const ch of [...pc.t]) {
        if (budget !== Infinity && budget-- <= 0) break;
        const cw = L.measure(ch, pc.r); const pt = smp.at(s0 + cw / 2); s0 += cw;
        if (pc.sp) continue;
        ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(pt.a); const f = colorOf(pc.r); if (f) ctx.fillStyle = f; glyphs(ch, pc.r, -cw / 2, 0, !!f); ctx.restore();
      }
      ctx.restore(); return;
    }
    const y0 = y - ((L.lines.length - 1) * L.size * L.lh) / 2;
    const lineX = (l) => (align === 'center' ? x - l.w / 2 : align === 'right' ? x - l.w : x);
    const split = n.a.split;
    if (!split) { L.lines.forEach((l, i) => { for (const pc of l.pieces) piece(pc, lineX(l) + pc.x, y0 + i * L.size * L.lh); }); return; }
    // split: every unit gets its own clock and transform
    const units = [];
    L.lines.forEach((l, i) => {
      const yy = y0 + i * L.size * L.lh;
      if (split === 'line') { units.push({ pcs: l.pieces.map((pc) => ({ pc, dx: pc.x })), x: lineX(l), y: yy, w: l.w }); return; }
      for (const pc of l.pieces) {
        if (pc.sp) continue;
        if (split === 'char') { let cx = 0; for (const ch of [...pc.t]) { const cw = L.measure(ch, pc.r); units.push({ pcs: [{ pc: Object.assign({}, pc, { t: ch, w: cw }), dx: 0 }], x: lineX(l) + pc.x + cx, y: yy, w: cw }); cx += cw; } }
        else units.push({ pcs: [{ pc, dx: 0 }], x: lineX(l) + pc.x, y: yy, w: pc.w });
      }
    });
    const stagger = P('stagger', 0.06); const T0 = env.vars.T0;
    units.forEach((u, k) => {
      const ue = Object.assign({}, env, { vars: Object.assign({}, env.vars, { T0: T0 + k * stagger, u: k, u_n: units.length }) });
      const U = (name, d) => prop(n, name, ue, doc, d);
      const op = U('opacity', 1); if (op <= 0) return;
      ctx.save(); ctx.globalAlpha *= Math.min(1, op);
      const cx = u.x + u.w / 2 + (U('x', 0) - x), cy = u.y + (U('y', 0) - y);
      ctx.translate(cx, cy); const r = U('rot', 0); if (r) ctx.rotate((r * PI) / 180); const sc = U('scale', 1); if (sc !== 1) ctx.scale(sc, sc);
      const f = U('fill', null); const uf = f != null ? paintOf(ctx, f, ue) : fill;
      for (const { pc, dx } of u.pcs) { const save = fill; fill = uf; piece(pc, -u.w / 2 + dx, 0); fill = save; }
      ctx.restore();
    });
  }

  // ───────── auto layout: <row>, <col>, <grid> ─────────
  // Children are placed by the container: no hand-computed x/y. A child's own x/y still offsets it (handy for
  // entrance animations). Sizes: rect/image/group/use/path w×h, circle 2r, ellipse 2rx×2ry, text measured
  // (wrapped at maxw), nested containers their own size. when=/only= false takes the child out of the flow;
  // at= keeps its place (it just isn't drawn yet), so staggered entrances never make the layout jump.
  function inFlow(n, env) {
    const w = pick(n.a, 'when', env);
    if (w != null && !compiled(w[0] === '=' ? w.slice(1) : w)(env)) return false;
    if (n.a.only) { const want = n.a.only.split(/[ ,]+/); if (!want.some((x) => env.tags.includes(x))) return false; }
    return true;
  }
  function boxOf(ctx, n, env) {
    const P = (k, d) => prop(n, k, env, env.doc, d);
    switch (n.type) {
      case 'rect': case 'image': case 'video': { const w = P('w', n.type === 'video' ? 1280 : 100), h = P('h', n.type === 'video' ? 720 : 100); return { w, h, ox: w * P('ax', 0), oy: h * P('ay', 0) }; }
      case 'circle': { const r = P('r', 50); return { w: 2 * r, h: 2 * r, ox: r, oy: r }; }
      case 'ellipse': { const rx = P('rx', 50), ry = P('ry', rx); return { w: 2 * rx, h: 2 * ry, ox: rx, oy: ry }; }
      case 'text': {
        if (isRich(n) && !n.a.path) { const L = richLayout(ctx, n, env, P, textOf(n, env)); const al = P('align', 'left'); return { w: L.w, h: L.h, ox: al === 'center' ? L.w / 2 : al === 'right' ? L.w : 0, oy: L.h / 2 }; }
        ctx.save(); ctx.font = fontOf(P, env.doc);
        const txt = textOf(n, env); const maxw = P('maxw', 0); const size = P('size', 48), lh = P('lh', 1.25);
        const lines = maxw > 0 ? wrap(ctx, txt, maxw) : txt.split('\n');
        const w = Math.max(0, ...lines.map((l) => ctx.measureText(l).width)); ctx.restore();
        const h = (lines.length - 1) * size * lh + size; const al = P('align', 'left');
        return { w, h, ox: al === 'center' ? w / 2 : al === 'right' ? w : 0, oy: h / 2 };
      }
      case 'row': case 'col': case 'grid': { const L = arrange(ctx, n, env); return { w: L.w, h: L.h, ox: L.w * P('ax', 0), oy: L.h * P('ay', 0) }; }
      case 'group': case 'use': {
        // a group without w/h is as big as its children (0.9): wrappers like <fx:grade> keep their content's size
        if (n.a.w == null && n.a.h == null) {
          const kids = n.type === 'use' ? env.doc.symbols[n.a.ref] || [] : n.children; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          for (const c of kids) { if (!inFlow(c, env)) continue; const b = boxOf(ctx, c, env); const cx = +prop(c, 'x', env, env.doc, 0) || 0, cy = +prop(c, 'y', env, env.doc, 0) || 0; x0 = Math.min(x0, cx - b.ox); y0 = Math.min(y0, cy - b.oy); x1 = Math.max(x1, cx - b.ox + b.w); y1 = Math.max(y1, cy - b.oy + b.h); }
          if (x0 === Infinity) return { w: 0, h: 0, ox: 0, oy: 0 };
          return { w: x1 - x0, h: y1 - y0, ox: -x0, oy: -y0 };
        }
        const w = P('w', 0), h = P('h', 0); return { w, h, ox: w * P('ax', 0), oy: h * P('ay', 0) };
      }
      default: { const w = P('w', 0), h = P('h', 0); return { w, h, ox: w * P('ax', 0), oy: h * P('ay', 0) }; }
    }
  }
  function arrange(ctx, n, env) {
    const doc = env.doc; const P = (k, d) => prop(n, k, env, doc, d);
    const gap = +P('gap', 0), pad = +P('pad', 0), align = P('align', 'start'), justify = P('justify', 'start');
    const items = [];
    for (const c of n.children) {
      const reps = c.a.repeat != null ? Math.min(1000, Math.max(0, Math.floor(+value(pick(c.a, 'repeat', env), env, doc)))) : -1;
      const as = c.a.as || 'i'; const plain = reps < 0 ? c : Object.assign({}, c, { a: Object.assign({}, c.a, { repeat: undefined }) });
      for (let k = 0; k < Math.max(1, reps); k++) {
        if (reps === 0) break;
        const e = reps < 0 ? env : Object.assign({}, env, { vars: Object.assign({}, env.vars, { [as]: k, [as + '_n']: reps }) });
        if (!inFlow(plain, e)) continue;
        const b = boxOf(ctx, plain, e);
        items.push(Object.assign(b, { node: plain, env: e, grow: +prop(plain, 'grow', e, doc, 0) || 0 }));
      }
    }
    const W0 = n.a.w != null ? +P('w') : null, H0 = n.a.h != null ? +P('h') : null;
    const stretchable = (it) => ['rect', 'image', 'video', 'group', 'use', 'row', 'col', 'grid'].includes(it.node.type);
    const resize = (it, k, v) => { if (!stretchable(it)) return; const ax = k === 'w' ? 'ax' : 'ay'; it[k] = v; it['o' + (k === 'w' ? 'x' : 'y')] = v * prop(it.node, ax, it.env, doc, 0); it.node = Object.assign({}, it.node, { a: Object.assign({}, it.node.a, { [k]: String(v) }) }); };
    const inAlign = (mode, room, size) => (mode === 'center' ? (room - size) / 2 : mode === 'end' ? room - size : 0);
    let W, H;
    if (n.type === 'grid') {
      const cols = Math.max(1, Math.floor(+P('cols', 2))); const rows = Math.ceil(items.length / cols);
      const cellW = W0 != null ? (W0 - 2 * pad - gap * (cols - 1)) / cols : Math.max(0, ...items.map((it) => it.w));
      const rowH = []; for (let r = 0; r < rows; r++) rowH.push(H0 != null && !items.length ? 0 : Math.max(0, ...items.slice(r * cols, r * cols + cols).map((it) => it.h)));
      if (H0 != null && rows) { const each = (H0 - 2 * pad - gap * (rows - 1)) / rows; for (let r = 0; r < rows; r++) rowH[r] = each; }
      let top = pad;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const it = items[r * cols + c]; if (!it) break;
          if (justify === 'stretch') resize(it, 'w', cellW); if (align === 'stretch') resize(it, 'h', rowH[r]);
          it.x = pad + c * (cellW + gap) + inAlign(justify, cellW, it.w); it.y = top + inAlign(align, rowH[r], it.h);
        }
        top += rowH[r] + gap;
      }
      W = W0 != null ? W0 : 2 * pad + cols * cellW + gap * (cols - 1);
      H = H0 != null ? H0 : 2 * pad + rowH.reduce((a, b) => a + b, 0) + gap * Math.max(0, rows - 1);
    } else {
      const row = n.type === 'row'; const M = row ? 'w' : 'h', C = row ? 'h' : 'w';
      const sumMain = items.reduce((a, it) => a + it[M], 0) + gap * Math.max(0, items.length - 1);
      const maxCross = Math.max(0, ...items.map((it) => it[C]));
      W = W0 != null ? W0 : row ? sumMain + 2 * pad : maxCross + 2 * pad;
      H = H0 != null ? H0 : row ? maxCross + 2 * pad : sumMain + 2 * pad;
      const innerMain = (row ? W : H) - 2 * pad, innerCross = (row ? H : W) - 2 * pad;
      let free = innerMain - sumMain; const grows = items.reduce((a, it) => a + (stretchable(it) ? it.grow : 0), 0);
      if (free > 0 && grows > 0) { for (const it of items) if (it.grow && stretchable(it)) resize(it, M, it[M] + (free * it.grow) / grows); free = 0; }
      let pos = pad, step = gap;
      if (justify === 'center') pos += free / 2; else if (justify === 'end') pos += free;
      else if (justify === 'between' && items.length > 1) step += free / (items.length - 1);
      else if (justify === 'around' && items.length) { step += free / items.length; pos += free / items.length / 2; }
      for (const it of items) {
        if (align === 'stretch') resize(it, C, innerCross);
        const cp = pad + inAlign(align, innerCross, it[C]);
        if (row) { it.x = pos; it.y = cp; } else { it.x = cp; it.y = pos; }
        pos += it[M] + step;
      }
    }
    return { w: W, h: H, items };
  }

  // repeat="n" [as="i"]: draw the node n times with i = 0…n-1 (and i_n = n) in its expressions
  function drawNode(ctx, n, parentEnv) {
    try { drawNodeIn(ctx, n, parentEnv); }
    catch (e) { if (!(e instanceof Error) || Object.getOwnPropertyDescriptor(e, 'message') == null && typeof DOMException !== 'undefined' && e instanceof DOMException) e = new Error(String(e && e.message || e)); if (!e.tsvgLine && n.line) { e.tsvgLine = n.line; e.message = 'line ' + n.line + ' <' + n.type + '>: ' + e.message; } throw e; }
  }
  function drawNodeIn(ctx, n, parentEnv) {
    const r = n.a.repeat;
    if (r == null) return drawOne(ctx, n, parentEnv);
    const count = Math.min(10000, Math.max(0, Math.floor(+value(pick(n.a, 'repeat', parentEnv), parentEnv, parentEnv.doc)))); const as = n.a.as || 'i';
    for (let k = 0; k < count; k++) drawOne(ctx, n, Object.assign({}, parentEnv, { vars: Object.assign({}, parentEnv.vars, { [as]: k, [as + '_n']: count }) }));
  }
  function drawOne(ctx, n, parentEnv) {
    ctx.__tsvgNode = n; // lets tools (tsvg check) map drawing back to the source line
    ctx.__tsvgClipped = !!(parentEnv.clipped || n.a.clip || n.a.mask);
    if (!visible(n, parentEnv)) return;
    const doc = parentEnv.doc;
    const env = Object.assign({}, parentEnv, { clipped: !!(parentEnv.clipped || n.a.clip || n.a.mask), vars: Object.assign({}, parentEnv.vars, { T0: n.a.at != null ? +value(pick(n.a, 'at', parentEnv), parentEnv, doc) : parentEnv.vars.T0 }) });
    if (n.type === 'text' && n.a.split) { env.vars.u = 0; env.vars.u_n = 1; } // whole-node reads of per-word attributes (fill="=… u …")
    const mask = pick(n.a, 'mask', env);
    if (mask && ctx.canvas && typeof ctx.canvas.getContext === 'function') return drawMasked(ctx, n, env, mask);
    const P = (name, d) => prop(n, name, env, doc, d);
    const unitAnims = n.type === 'text' && n.a.split != null; // split text runs opacity/scale/rot/x/y per unit, not on the whole
    const S = unitAnims ? (name, d) => attr(n, name, env, doc, d) : P;
    const opacity = S('opacity', 1); if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, opacity);
    const blend = pick(n.a, 'blend', env); if (blend) ctx.globalCompositeOperation = blend;
    const blur = P('blur', 0); const filt = P('filter', null);
    if ((blur > 0 || (filt && filt !== 'none')) && 'filter' in ctx) {
      const m = ctx.getTransform(); const k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
      ctx.filter = [blur > 0 ? 'blur(' + (blur * k).toFixed(2) + 'px)' : '', filt && filt !== 'none' ? cssFilter(String(filt), k) : ''].concat(ctx.filter && ctx.filter !== 'none' ? [ctx.filter] : []).filter(Boolean).join(' ');
    }
    const rot = S('rot', 0), scale = S('scale', 1), sx = S('sx', 1) * scale, sy = S('sy', 1) * scale, skx = S('skx', 0), sky = S('sky', 0);
    const fillRaw = P('fill', n.type === 'text' ? env.theme.fg || '#fff' : undefined);
    const strokeRaw = P('stroke'), sw = P('sw', 0);
    shadowOf(ctx, P('shadow'), env);
    const dash = P('dash'); if (dash && dash !== 'none') ctx.setLineDash(String(dash).trim().split(/[\s,]+/).map(Number));
    const pivot = (px, py) => { if (rot || sx !== 1 || sy !== 1 || skx || sky) { ctx.translate(px, py); if (rot) ctx.rotate((rot * PI) / 180); if (skx || sky) ctx.transform(1, Math.tan((sky * PI) / 180), Math.tan((skx * PI) / 180), 1, 0, 0); if (sx !== 1 || sy !== 1) ctx.scale(sx, sy); ctx.translate(-px, -py); } };
    const clipTo = () => {
      const c = pick(n.a, 'clip', env); if (!c) return;
      const m = /^url\(#([\w-]+)\)$/.exec(c); const shapes = m && doc.clips[m[1]]; if (!shapes) throw new Error('unknown clip ' + c);
      const p = new Path2D(); for (const s of shapes) { const sp = shapePath(s, env); if (sp) p.addPath(sp); }
      ctx.clip(p);
    };
    const paint = (path) => {
      const f = paintOf(ctx, fillRaw, env); const s = sw > 0 ? paintOf(ctx, strokeRaw, env) : null;
      if (f) { ctx.fillStyle = f; ctx.fill(path); }
      if (s) { if (f) ctx.shadowColor = 'transparent'; ctx.strokeStyle = s; ctx.lineWidth = sw; ctx.lineCap = P('cap', 'round'); ctx.lineJoin = 'round'; ctx.stroke(path); }
    };
    switch (n.type) {
      case 'group': case 'use': {
        // a group/use with a box (w h) and an anchor (ax ay) is placed by that anchor (0.7): icons centred on x, y
        const gw = n.a.ax != null ? P('w', 0) * P('ax', 0) : 0, gh = n.a.ay != null ? P('h', 0) * P('ay', 0) : 0;
        ctx.translate(P('x', 0) - gw, P('y', 0) - gh); pivot(gw, gh); clipTo();
        if (n.type === 'use' && !doc.symbols[n.a.ref]) throw new Error('unknown symbol ' + n.a.ref);
        drawNodes(ctx, n.type === 'use' ? doc.symbols[n.a.ref] : n.children, env);
        break;
      }
      case 'row': case 'col': case 'grid': {
        const L = arrange(ctx, n, env);
        ctx.translate(P('x', 0) - L.w * P('ax', 0), P('y', 0) - L.h * P('ay', 0)); pivot(L.w / 2, L.h / 2); clipTo();
        if ((fillRaw && fillRaw !== 'none') || (strokeRaw && sw > 0)) { const p = new Path2D(); const r = P('r', 0); if (r > 0 && p.roundRect) p.roundRect(0, 0, L.w, L.h, Math.min(r, L.w / 2, L.h / 2)); else p.rect(0, 0, L.w, L.h); paint(p); }
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = ctx.shadowOffsetY = 0; ctx.setLineDash([]); // the card's shadow/dash are its own
        for (const it of L.items) { ctx.save(); ctx.translate(it.x + it.ox, it.y + it.oy); drawNode(ctx, it.node, it.env); ctx.restore(); }
        break;
      }
      case 'rect': {
        const w = P('w', 100), h = P('h', 100), x = P('x', 0) - w * P('ax', 0), y = P('y', 0) - h * P('ay', 0), r = P('r', 0);
        pivot(x + w / 2, y + h / 2); clipTo();
        const p = new Path2D(); if (r > 0 && p.roundRect) p.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else p.rect(x, y, w, h);
        paint(p); break;
      }
      case 'circle': case 'ellipse': {
        const cx = P('x', 0), cy = P('y', 0), rx = P('r', P('rx', 50)), ry = n.type === 'ellipse' ? P('ry', rx) : rx;
        const a0 = P('from', 0), a1 = P('to', 360);
        pivot(cx, cy); clipTo();
        const arc = P('arc', 0) && a1 - a0 < 360; // arc="1": an open arc (stroke it), no lines to the centre
        const p = new Path2D(); if (a1 - a0 < 360 && !arc) p.moveTo(cx, cy);
        p.ellipse(cx, cy, Math.max(0, rx), Math.max(0, ry), 0, ((a0 - 90) * PI) / 180, ((a1 - 90) * PI) / 180);
        if (a1 - a0 < 360 && !arc) p.closePath();
        paint(p); break;
      }
      case 'line': {
        const x1 = P('x1', 0), y1 = P('y1', 0), x2 = P('x2', 0), y2 = P('y2', 0), draw = P('draw', 1);
        const p = new Path2D(); p.moveTo(x1, y1); p.lineTo(x1 + (x2 - x1) * draw, y1 + (y2 - y1) * draw);
        ctx.strokeStyle = paintOf(ctx, strokeRaw || fillRaw || env.theme.fg, env); ctx.lineWidth = sw || 4; ctx.lineCap = 'round'; ctx.stroke(p); break;
      }
      case 'path': {
        const d = P('d', ''), draw = P('draw', 1);
        ctx.translate(P('x', 0), P('y', 0)); pivot(0, 0); clipTo();
        const p = new Path2D(d);
        if (draw < 1) { const L = lengthOf(d); ctx.setLineDash([L * draw, L + 1]); }
        const f = draw >= 1 ? paintOf(ctx, fillRaw, env) : null; const s = sw > 0 ? paintOf(ctx, strokeRaw, env) : null;
        if (f) { ctx.fillStyle = f; ctx.fill(p); }
        if (s) { if (f) ctx.shadowColor = 'transparent'; ctx.strokeStyle = s; ctx.lineWidth = sw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(p); }
        break;
      }
      case 'text': {
        if (isRich(n)) { const tx = S('x', 0), ty = S('y', 0); pivot(tx, ty); clipTo(); drawRichText(ctx, n, env, P, paintOf(ctx, fillRaw, env), sw > 0 ? paintOf(ctx, strokeRaw, env) : null, sw, tx, ty); break; }
        const rawText = pick(n.a, 'text', env);
        let txt = rawText != null && NUMERIC.test(rawText) ? rawText : String(value(rawText, env, doc) ?? '');
        const reveal = P('reveal', 1); if (reveal < 1) txt = [...txt].slice(0, Math.round([...txt].length * reveal)).join('');
        const size = P('size', 48), weight = P('weight', 400), x = P('x', 0), y = P('y', 0);
        const align = P('align', 'left'), maxw = P('maxw', 0), lh = P('lh', 1.25), font = P('font', '');
        ctx.font = fontOf(P, doc);
        ctx.textAlign = align; ctx.textBaseline = 'middle';
        const lines = maxw > 0 ? wrap(ctx, txt, maxw) : txt.split('\n');
        pivot(x, y); clipTo();
        const y0 = y - ((lines.length - 1) * size * lh) / 2;
        const f = paintOf(ctx, fillRaw, env); const s = sw > 0 ? paintOf(ctx, strokeRaw, env) : null;
        lines.forEach((ln, i) => { const yy = y0 + i * size * lh; if (s) { ctx.strokeStyle = s; ctx.lineWidth = sw; ctx.lineJoin = 'round'; ctx.strokeText(ln, x, yy); } if (f) { ctx.fillStyle = f; ctx.fillText(ln, x, yy); } });
        break;
      }
      case 'video': {
        // a clip plays from `start` at `rate` while the node is visible: clip time = start + (T − at)·rate (wraps when loop="1")
        const asset = doc.assets[n.a.src] || {};
        let ct = P('start', 0) + Math.max(0, env.vars.T - env.vars.T0) * P('rate', 1);
        const vd = P('cliplen', asset.dur || 0); if (P('loop', 0) && vd > 0) ct = ct % vd; else if (vd > 0) ct = Math.min(ct, vd - 0.04);
        const v = env.images && env.images[n.a.src];
        let pic = v && v.frame ? v.frame(ct, P('rate', 1), P('vol', 0), n) : null;
        if (!pic && env.images) pic = env.images[pick(n.a, 'poster', env) || asset.poster];
        const w = P('w', 1280), h = P('h', 720), x = P('x', 0) - w * P('ax', 0), y = P('y', 0) - h * P('ay', 0), r = P('r', 0);
        pivot(x + w / 2, y + h / 2); clipTo();
        if (r > 0) { const p = new Path2D(); p.roundRect(x, y, w, h, r); ctx.clip(p); }
        drawPicture(ctx, pic, x, y, w, h, P('fit', 'cover'));
        break;
      }
      case 'image': {
        const img = env.images && env.images[n.a.src];
        const w = P('w', 100), h = P('h', 100), x = P('x', 0) - w * P('ax', 0), y = P('y', 0) - h * P('ay', 0), r = P('r', 0);
        pivot(x + w / 2, y + h / 2); clipTo();
        if (r > 0) { const p = new Path2D(); p.roundRect(x, y, w, h, r); ctx.clip(p); }
        if (img && img.complete !== false && (img.naturalWidth !== 0 || img.width)) { // a broken image draws the grey box
          const fit = P('fit', 'cover'); const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
          if (fit === 'fill' || !iw) ctx.drawImage(img, x, y, w, h);
          else { const k = fit === 'contain' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih); const dw = iw * k, dh = ih * k; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); ctx.restore(); }
        } else { ctx.fillStyle = '#8884'; ctx.fillRect(x, y, w, h); }
        break;
      }
    }
    ctx.restore();
  }
  // filter="grayscale(1) sepia(.4) contrast(1.2) brightness(1.1) saturate(1.5) hue(30) invert(1) blur(4) opacity(.8)" (0.9):
  // CSS filter functions in layout units; hue = degrees. Applies to the node (a group: each of its children).
  const FILTERS = ['grayscale', 'sepia', 'contrast', 'brightness', 'saturate', 'hue', 'invert', 'blur', 'opacity'];
  function cssFilter(f, k) {
    return f.replace(/([a-z-]+)\(\s*(-?[0-9.]+)\s*(deg|px|%)?\s*\)/g, (m, name, v) => {
      if (name === 'hue' || name === 'hue-rotate') return 'hue-rotate(' + v + 'deg)';
      if (name === 'blur') return 'blur(' + (+v * k).toFixed(2) + 'px)';
      return name + '(' + v + ')';
    });
  }
  // a picture (image, video element, canvas) fitted into a box; a grey box while it isn't ready
  function drawPicture(ctx, img, x, y, w, h, fit) {
    const iw = img && (img.videoWidth || img.naturalWidth || img.width), ih = img && (img.videoHeight || img.naturalHeight || img.height);
    if (!img || !iw || img.complete === false || (img.readyState != null && img.readyState < 2)) { ctx.fillStyle = '#8884'; ctx.fillRect(x, y, w, h); return; }
    if (fit === 'fill') { ctx.drawImage(img, x, y, w, h); return; }
    const k = fit === 'contain' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih); const dw = iw * k, dh = ih * k;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); ctx.restore();
  }
  // mask="url(#m)": draw the node and the mask into offscreen layers, keep node pixels where the mask has alpha
  function drawMasked(ctx, n, env, maskRef) {
    const m = /^url\(#([\w-]+)\)$/.exec(maskRef); const shapes = m && env.doc.masks[m[1]]; if (!shapes) throw new Error('unknown mask ' + maskRef);
    const W = ctx.canvas.width, H = ctx.canvas.height; const tf = ctx.getTransform();
    const mk = () => { const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H }); const x = c.getContext('2d'); x.setTransform(tf); return [c, x]; };
    const [lc, lx] = mk(); const [mc, mx] = mk();
    lx.globalAlpha = ctx.globalAlpha;
    const plain = Object.assign({}, n, { a: Object.assign({}, n.a, { mask: undefined, repeat: undefined }) });
    for (const k of Object.keys(plain.a)) if (k.startsWith('mask.')) delete plain.a[k];
    drawOne(lx, plain, env);
    // the mask is drawn in the node's coordinate space (after its x/y for groups)
    if (n.type === 'group' || n.type === 'use' || n.type === 'path') mx.translate(prop(n, 'x', env, env.doc, 0), prop(n, 'y', env, env.doc, 0));
    drawNodes(mx, shapes, env);
    lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalAlpha = 1; lx.globalCompositeOperation = 'destination-in'; lx.drawImage(mc, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(lc, 0, 0); ctx.restore();
  }
  function wrap(ctx, txt, maxw) {
    const out = [];
    for (const para of txt.split('\n')) {
      let line = '';
      for (const w of para.split(' ')) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxw && line) { out.push(line); line = w; } else line = t; }
      out.push(line);
    }
    return out;
  }

  // ───────── scene transitions (0.6) ─────────
  // <scene in="push 0.6 left io"> (kind, seconds, direction, ease) or <timeline in="fade"> for every scene.
  // The transition plays over the first seconds of the scene; the previous scene keeps running underneath.
  const TRANSITIONS = ['fade', 'slide', 'push', 'wipe', 'zoom', 'iris', 'blur', 'none'];
  function transitionOf(sc, env) {
    const raw = sc.trans; if (!raw) return null;
    const p = String(value(raw, env, env.doc)).trim().split(/\s+/); if (!p[0] || p[0] === 'none') return null;
    const num = p.slice(1).find((x) => NUMERIC.test(x)); const dir = p.slice(1).find((x) => ['left', 'right', 'up', 'down'].includes(x)); const ease = p.slice(1).find((x) => EASE[x]);
    return { kind: p[0], dur: num != null ? +num : 0.6, dir: dir || 'left', ease: ease || 'io' };
  }
  function transition(ctx, tr, k, L, drawPrev, drawCur) {
    const W = L.w, H = L.h; const v = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[tr.dir]; // where the old scene goes
    const layer = (alpha, f, tf) => { ctx.save(); ctx.globalAlpha *= alpha; if (tf) tf(); f(); ctx.restore(); };
    const around = (s) => () => { ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); };
    switch (tr.kind) {
      case 'fade': layer(1 - k, drawPrev); layer(k, drawCur); break;
      case 'slide': layer(1, drawPrev); layer(1, drawCur, () => ctx.translate(-v[0] * W * (1 - k), -v[1] * H * (1 - k))); break;
      case 'push': layer(1, drawPrev, () => ctx.translate(v[0] * W * k, v[1] * H * k)); layer(1, drawCur, () => ctx.translate(-v[0] * W * (1 - k), -v[1] * H * (1 - k))); break;
      case 'wipe': layer(1, drawPrev); layer(1, drawCur, () => { const p = new Path2D(); if (v[0]) p.rect(v[0] < 0 ? W * (1 - k) : 0, 0, W * k, H); else p.rect(0, v[1] < 0 ? H * (1 - k) : 0, W, H * k); ctx.clip(p); }); break;
      case 'zoom': layer(1 - k, drawPrev, around(1 + 0.25 * k)); layer(k, drawCur, around(0.85 + 0.15 * k)); break;
      case 'iris': layer(1, drawPrev); layer(1, drawCur, () => { const p = new Path2D(); p.ellipse(W / 2, H / 2, Math.max(0.01, k * Math.hypot(W, H) / 2), Math.max(0.01, k * Math.hypot(W, H) / 2), 0, 0, 2 * PI); ctx.clip(p); }); break;
      case 'blur': layer(1 - k, drawPrev, () => { if ('filter' in ctx) ctx.filter = 'blur(' + (24 * k * Math.sqrt(Math.abs(ctx.getTransform().a * ctx.getTransform().d))).toFixed(2) + 'px)'; }); layer(k, drawCur, () => { if ('filter' in ctx && k < 1) ctx.filter = 'blur(' + (24 * (1 - k) * Math.sqrt(Math.abs(ctx.getTransform().a * ctx.getTransform().d))).toFixed(2) + 'px)'; }); break;
      default: drawCur();
    }
  }

  // draw the frame at time t; ctx already maps layout units (layout.w × layout.h) to the target
  function renderFrame(ctx, doc, t, opts, layout, images) {
    doc = forOptions(doc, opts);
    const env = makeEnv(doc, opts, layout, t, images);
    ctx.save();
    ctx.fillStyle = paintOf(ctx, env.theme.bg || '#000', env); ctx.fillRect(0, 0, layout.w, layout.h);
    drawNodes(ctx, doc.backdrop, env);
    const last = doc.scenes[doc.scenes.length - 1];
    const drawScene = (sc, T) => drawNodes(ctx, sc.nodes, Object.assign({}, env, { scene: sc, vars: Object.assign({}, env.vars, { T, p: T / sc.dur, sdur: sc.dur }) }));
    doc.scenes.forEach((sc, i) => {
      const active = (t >= sc.start && t < sc.start + sc.dur) || (sc === last && t >= sc.start + sc.dur);
      if (!active) return;
      const T = Math.min(t, sc.start + sc.dur - 1e-6) - sc.start;
      const tr = i > 0 ? transitionOf(sc, env) : null;
      if (tr && T < tr.dur) { const prev = doc.scenes[i - 1]; transition(ctx, tr, (EASE[tr.ease] || EASE.io)(T / tr.dur), layout, () => drawScene(prev, prev.dur + T), () => drawScene(sc, T)); }
      else drawScene(sc, T);
    });
    drawNodes(ctx, doc.overlay, env);
    ctx.restore();
  }

  // ───────────────────────── audio plan ─────────────────────────
  // Everything an engine needs to play sound for one option set: clips on buses + captions.
  function sayLines(doc, opts) {
    doc = forOptions(doc, opts);
    const env = makeEnv(doc, opts, doc.layouts[0], 0, null);
    return doc.says.filter((s) => !s.raw.when || compiled(s.raw.when.replace(/^=/, ''))(env)).map((s) => {
      const text = String(value(s.raw.text, env, doc));
      const baked = doc.voices[s.key + '|' + opts.lang];
      const clip = s.raw['src.' + opts.lang] || (baked && baked.src) || null;
      const dur = lineDur(doc, s, opts.lang, env);
      const sp = s.raw['speak.' + opts.lang] || s.raw.speak; // pronunciation text for TTS (captions keep `text`)
      return { key: s.key, start: s.start, dur, text, speak: sp ? String(value(sp, env, doc)) : text, clip, lang: opts.lang, voice: s.raw.voice };
    });
  }
  function audioPlan(doc, opts) {
    doc = forOptions(doc, opts);
    const env = makeEnv(doc, opts, doc.layouts[0], 0, null);
    const mix = doc.mixes[opts.mix] || { voice: 1, music: 1, sfx: 1 };
    const clips = doc.audio.filter((a) => !a.when || compiled(a.when.replace(/^=/, ''))(env)).map((a) => Object.assign({}, a));
    for (const l of sayLines(doc, opts)) if (l.clip) clips.push({ bus: 'voice', src: l.clip, start: l.start, vol: 1 });
    return { mix, clips };
  }
  // ducking (0.9): <mix id="full" voice="1" music="0.3" duck="0.35"> lowers the music bus to duck× while a line is
  // spoken (0.25 s ramps either side). duckAt gives the factor at time t; players and exports apply it to the music bus.
  function duckAt(doc, opts, t, lines) {
    const mix = doc.mixes[opts.mix] || {}; const d = mix.duck; if (d == null || d >= 1) return 1;
    let k = 0; const R = 0.25;
    for (const l of lines || sayLines(doc, opts)) { if (!l.clip && !l.text) continue; const a = l.start, b = l.start + l.dur; const w = t < a ? 1 - (a - t) / R : t > b ? 1 - (t - b) / R : 1; if (w > k) k = w; if (k >= 1) break; }
    return 1 - (1 - d) * Math.max(0, Math.min(1, k));
  }
  // WebVTT (or SRT) captions of the narration for one option set (0.10)
  function captions(doc, opts, format) {
    const ts = (t, sep) => { const ms = Math.round(t * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + sep + String(ms % 1000).padStart(3, '0'); };
    const lines = sayLines(doc, Object.assign(defaults(doc), opts)).sort((a, b) => a.start - b.start);
    if (format === 'srt') return lines.map((l, i) => (i + 1) + '\n' + ts(l.start, ',') + ' --> ' + ts(l.start + l.dur, ',') + '\n' + l.text + '\n').join('\n');
    return 'WEBVTT\n\n' + lines.map((l) => ts(l.start, '.') + ' --> ' + ts(l.start + l.dur, '.') + '\n' + l.text + '\n').join('\n');
  }
  // asset id or path → path inside the package
  function assetPath(doc, ref) { return ref && doc.assets[ref] ? doc.assets[ref].src : ref; }

  function defaults(doc) { const o = { lang: 'en' }; for (const op of doc.options) o[op.id] = op.default || (op.choices[0] && op.choices[0].id); return o; } // no lang option = English, as tsvg bake assumes
  function combos(doc) {
    let out = [{}];
    for (const o of doc.options) { const next = []; for (const c of out) for (const ch of o.choices) next.push(Object.assign({}, c, { [o.id]: ch.id })); out = next; }
    return out;
  }

  // ───────────────────────── validation ─────────────────────────
  // Static checks + a dry run of every frame sample under every option set and layout
  // against a recording context (no canvas needed). files: Set of paths in the package (optional).
  // ───────── lint: static checks on the source, with line numbers and "did you mean" ─────────
  const COMMON = ['x', 'y', 'fill', 'stroke', 'sw', 'cap', 'opacity', 'rot', 'scale', 'sx', 'sy', 'skx', 'sky', 'filter', 'shadow', 'clip', 'mask', 'blend', 'blur', 'dash', 'at', 'dur', 'when', 'only', 'repeat', 'as', 'id', 'grow'];
  const ATTRS = {
    rect: ['w', 'h', 'r', 'ax', 'ay'], circle: ['r', 'from', 'to', 'arc'], ellipse: ['rx', 'ry', 'from', 'to', 'arc'],
    line: ['x1', 'y1', 'x2', 'y2', 'draw'], path: ['d', 'draw'], text: ['text', 'size', 'weight', 'italic', 'font', 'align', 'maxw', 'lh', 'reveal', 'rich', 'ls', 'split', 'stagger', 'path', 'offset', 'hl'],
    image: ['src', 'w', 'h', 'r', 'ax', 'ay', 'fit'], video: ['src', 'w', 'h', 'r', 'ax', 'ay', 'fit', 'start', 'rate', 'loop', 'vol', 'poster', 'cliplen'], group: ['w', 'h', 'ax', 'ay'], use: ['ref', 'w', 'h', 'ax', 'ay'],
    row: ['w', 'h', 'ax', 'ay', 'gap', 'pad', 'align', 'justify', 'r'], col: ['w', 'h', 'ax', 'ay', 'gap', 'pad', 'align', 'justify', 'r'], grid: ['w', 'h', 'ax', 'ay', 'gap', 'pad', 'align', 'justify', 'r', 'cols'],
  };
  const OTHER = {
    anim: ['prop', 'from', 'to', 'at', 'dur', 'ease'], keys: ['prop', 'v', 'ease'], say: ['at', 'text', 'speak', 'voice', 'dur', 'id', 'when', 'src'],
    sfx: ['at', 'src', 'vol', 'bus', 'when'], scene: ['id', 'dur', 'start', 'chapter', 'min', 'pad', 'gap', 'in'], music: ['src', 'start', 'loop', 'vol', 'bus', 'when', 'beats'],
  };
  const CONTAINERS = new Set(['scene', 'group', 'backdrop', 'overlay', 'symbol', 'clip', 'mask']);
  const ROOT_KIDS = ['layouts', 'options', 'mixes', 'themes', 'strings', 'defs', 'assets', 'voices', 'music', 'backdrop', 'timeline', 'overlay'];
  function lev(a, b) { const d = []; for (let i = 0; i <= a.length; i++) { d[i] = [i]; for (let j = 1; j <= b.length; j++) d[i][j] = i === 0 ? j : Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); } return d[a.length][b.length]; }
  function hint(x, list) { let best = null, bd = 3; for (const c of list) { const v = lev(x, c); if (v < bd) { bd = v; best = c; } } return best && bd <= Math.max(1, Math.floor(x.length / 3)) + 1 ? ' (did you mean "' + best + '"?)' : ''; }
  function lint(xml, doc) {
    const errors = [], warnings = [];
    const r = parseXML(xml);
    const tags = new Set(doc.layouts.map((l) => l.id)); for (const o of doc.options) for (const c of o.choices) tags.add(c.id);
    const langs = (doc.options.find((o) => o.id === 'lang') || { choices: [{ id: 'en' }] }).choices.map((c) => c.id);
    const themes = Object.entries(doc.themes);
    // names an expression may use: built-in variables, option ids, repeat variables, <fn> arguments
    const vars = new Set(['t', 'T', 'T0', 'p', 'W', 'H', 'dur', 'sdur', 'portrait', 'layout', 'PI', 'true', 'false'].concat(doc.options.map((o) => o.id)));
    (function scan(el) { for (const c of el.children) { if (c.attrs.repeat != null) { const a = c.attrs.as || 'i'; vars.add(a); vars.add(a + '_n'); } if (c.attrs.split) { vars.add('u'); vars.add('u_n'); } scan(c); } })(r);
    for (const f of Object.values(doc.fnSrc)) for (const a of f.args) vars.add(a);
    const fnNames = Object.keys(FNS).concat(Object.keys(doc.fns), ['data', 'count', 's', 'aspect', 'cue', 'cueEnd', 'nth', 'since', 'idx', 'pulse']);
    const exprIssues = (src) => {
      const out = []; let toks; try { toks = tokenize(src); } catch (e) { return out; }
      toks.forEach((k, i) => {
        if (k.t !== 'id' || k.v[0] === '$') return;
        const call = toks[i + 1] && toks[i + 1].v === '(';
        if (call && !fnNames.includes(k.v)) out.push('unknown function ' + k.v + '()' + hint(k.v, fnNames));
        if (!call && !vars.has(k.v)) out.push('unknown variable ' + k.v + hint(k.v, [...vars]));
      });
      return out;
    };
    const at = (el) => 'line ' + el.line + ' <' + el.name + '>: ';
    for (const k of r.children) if (!ROOT_KIDS.includes(k.name)) warnings.push(at(k) + 'unknown section, ignored' + hint(k.name, ROOT_KIDS));
    const checkValue = (el, name, v) => {
      if (v == null) return;
      if (v[0] === '@' && !doc.strings[v.slice(1)]) errors.push(at(el) + name + ': unknown string "' + v + '"' + hint(v.slice(1), Object.keys(doc.strings)));
      for (const m of v.matchAll(/\$([A-Za-z_]\w*)/g)) for (const [tid, th] of themes) if (th[m[1]] === undefined) errors.push(at(el) + name + ': theme "' + tid + '" has no token $' + m[1] + hint(m[1], Object.keys(th)));
      for (const m of v.matchAll(/url\(#([\w-]+)\)/g)) { const all = Object.keys(doc.gradients).concat(Object.keys(doc.clips), Object.keys(doc.masks)); if (!all.includes(m[1])) errors.push(at(el) + name + ': nothing in <defs> has id "' + m[1] + '"' + hint(m[1], all)); }
      for (const m of v.matchAll(/\bs\(\s*['"]([^'"]+)['"]\s*\)/g)) if (!doc.strings[m[1]]) errors.push(at(el) + name + ': s("' + m[1] + '"): unknown string' + hint(m[1], Object.keys(doc.strings)));
      for (const m of v.matchAll(/\b(?:data|count)\(\s*['"]([^'"]+)['"]\s*[,)]/g)) if (!doc.data[m[1]]) errors.push(at(el) + name + ': unknown data "' + m[1] + '"' + hint(m[1], Object.keys(doc.data)));
      if (v[0] === '=') { try { compile(v.slice(1)); for (const m of exprIssues(v.slice(1))) errors.push(at(el) + name + ': ' + m); } catch (e) { errors.push(at(el) + name + ': ' + e.message); } }
      else if (v.indexOf('{') >= 0 && v[0] !== '\\') for (const m of v.matchAll(/\{([^}]*)\}/g)) { try { compile(m[1]); for (const x of exprIssues(m[1])) errors.push(at(el) + name + ': in {' + m[1] + '}: ' + x); } catch (e) { errors.push(at(el) + name + ': in {' + m[1] + '}: ' + e.message); } }
    };
    const checkAttrs = (el, known, parentType) => {
      for (const [k, v] of Object.entries(el.attrs)) {
        const dot = k.indexOf('.'); const base = dot < 0 ? k : k.slice(0, dot); const tag = dot < 0 ? null : k.slice(dot + 1);
        if (!known.includes(base)) warnings.push(at(el) + 'unknown attribute "' + k + '", ignored' + hint(base, known));
        if (tag != null && !tags.has(tag) && !langs.includes(tag)) warnings.push(at(el) + 'attribute "' + k + '": no layout or option value "' + tag + '", so it never applies' + hint(tag, [...tags]));
        if (!['text', 'speak', 'd', 'v', 'id', 'as', 'chapter', 'font', 'only', 'blend', 'ease', 'prop', 'fit', 'align', 'src', 'ref', 'bus'].includes(base) || v[0] === '=' || v[0] === '@' || /\{/.test(v)) checkValue(el, k, v);
        else if (base === 'text' || base === 'speak' || base === 'chapter') checkValue(el, k, v);
      }
      if (el.attrs.ease && !EASE[el.attrs.ease]) warnings.push(at(el) + 'ease "' + el.attrs.ease + '" is unknown (linear in out io back elastic step)' + hint(el.attrs.ease, Object.keys(EASE)));
      if (el.name === 'anim' || el.name === 'keys') { const p = el.attrs.prop; const ok = parentType && (COMMON.concat(ATTRS[parentType] || [])); if (!p) errors.push(at(el) + 'needs prop="…"'); else if (ok && !ok.includes(p)) warnings.push(at(el) + 'prop "' + p + '" is not an attribute of <' + parentType + '>' + hint(p, ok)); }
      if ((el.name === 'image' || el.name === 'video') && el.attrs.src && !doc.assets[el.attrs.src] && !/[/.]/.test(el.attrs.src)) errors.push(at(el) + 'src "' + el.attrs.src + '" is not an asset id' + hint(el.attrs.src, Object.keys(doc.assets)));
      if ((el.name === 'sfx' || el.name === 'music') && el.attrs.src && !doc.assets[el.attrs.src] && !/[/.]/.test(el.attrs.src)) errors.push(at(el) + 'src "' + el.attrs.src + '" is not an asset id' + hint(el.attrs.src, Object.keys(doc.assets)));
      for (const k of Object.keys(el.attrs)) if (el.name === 'scene' && k.split('.')[0] === 'in') { const w = String(el.attrs[k]).trim().split(/\s+/)[0]; if (w && w[0] !== '=' && !TRANSITIONS.includes(w)) warnings.push(at(el) + k + ': unknown transition "' + w + '" (' + TRANSITIONS.join(' ') + ')' + hint(w, TRANSITIONS)); }
      if (el.name === 'text' && el.attrs.split && !['word', 'char', 'line'].includes(el.attrs.split)) warnings.push(at(el) + 'split="' + el.attrs.split + '": use word, char or line' + hint(el.attrs.split, ['word', 'char', 'line']));
      if (el.name === 'use' && !doc.symbols[el.attrs.ref]) errors.push(at(el) + 'ref "' + el.attrs.ref + '": no <symbol> with that id' + hint(el.attrs.ref || '', Object.keys(doc.symbols)));
    };
    const walk = (el, container, inScene) => {
      for (const c of el.children) {
        if ((c.name === 'anim' || c.name === 'keys') && container === 'group') continue; // the group's own, checked with it
        if (SHAPES.has(c.name)) { const box = c.name === 'group' || LAYOUTS.has(c.name); checkAttrs(c, COMMON.concat(ATTRS[c.name])); for (const k of c.children) { if (k.name === 'anim' || k.name === 'keys') checkAttrs(k, OTHER[k.name], c.name); else if (!(box && (SHAPES.has(k.name) || (inScene && (k.name === 'say' || k.name === 'sfx'))))) warnings.push(at(k) + 'not allowed inside <' + c.name + '>, ignored' + hint(k.name, box ? [...SHAPES] : ['anim', 'keys'])); } if (box) walk(c, 'group', inScene); }
        else if ((c.name === 'say' || c.name === 'sfx') && inScene) checkAttrs(c, OTHER[c.name]);
        else if (c.name === 'say' || c.name === 'sfx') warnings.push(at(c) + 'only works directly inside a <scene>');
        else warnings.push(at(c) + 'unknown element, ignored' + hint(c.name, [...SHAPES, 'say', 'sfx']));
      }
    };
    for (const k of r.children) {
      if (k.name === 'timeline') for (const sc of k.children) { if (sc.name !== 'scene') { warnings.push(at(sc) + 'only <scene> goes in <timeline>' + hint(sc.name, ['scene'])); continue; } checkAttrs(sc, OTHER.scene); walk(sc, 'scene', true); }
      else if (k.name === 'backdrop' || k.name === 'overlay') walk(k, k.name);
      else if (k.name === 'music') checkAttrs(k, OTHER.music);
      else if (k.name === 'defs') for (const d of k.children) if (d.name === 'symbol' || d.name === 'clip' || d.name === 'mask') walk(d, d.name);
    }
    return { errors, warnings };
  }

  function validate(xml, vo = {}) {
    const { files, samples = 4 } = vo;
    if (needsLibs(xml)) { // imports/components: check the flattened document, report source lines
      let f; try { f = flatten(xml, vo.libs, vo); } catch (e) { return { ok: false, errors: [e.message], warnings: [], doc: null }; }
      if (f.errors.length) return { ok: false, errors: f.errors, warnings: [], doc: null };
      const res = validate(f.xml, Object.assign({}, vo, { libs: null }));
      const map = (m) => m.replace(/\bline (\d+)\b/g, (x, n) => (f.lineMap[+n] ? 'line ' + f.lineMap[+n] : x));
      res.errors = res.errors.map(map); res.warnings = res.warnings.map(map); return res;
    }
    const errors = [], warnings = [];
    let doc;
    try { doc = parse(xml); } catch (e) { return { ok: false, errors: [e.message], warnings, doc: null }; }
    try { const l = lint(xml, doc); errors.push(...l.errors); warnings.push(...l.warnings); } catch (e) { warnings.push('lint failed: ' + e.message); }
    const langs = (doc.options.find((o) => o.id === 'lang') || { choices: [] }).choices.map((c) => c.id);
    for (const m of doc.audio) if (m.beats && !doc.data[m.beats].length) warnings.push('music ' + m.src + ': no beat grid in <data id="' + m.beats + '"> yet (tsvg make bakes it)');
    for (const [id, s] of Object.entries(doc.strings)) for (const l of langs) if (s[l] == null) warnings.push('string @' + id + ' has no "' + l + '" text (falls back)');
    for (const o of doc.options) if (o.default && !o.choices.some((c) => c.id === o.default)) errors.push('option ' + o.id + ': default "' + o.default + '" is not a choice');
    const mixOpt = doc.options.find((o) => o.id === 'mix'); if (mixOpt) for (const c of mixOpt.choices) if (!doc.mixes[c.id]) errors.push('mix choice "' + c.id + '" has no <mix id="' + c.id + '">');
    const themeOpt = doc.options.find((o) => o.id === 'theme'); if (themeOpt) for (const c of themeOpt.choices) if (!doc.themes[c.id]) errors.push('theme choice "' + c.id + '" has no <theme id="' + c.id + '">');
    const ref = (r, what) => { const p = assetPath(doc, r); if (!p) errors.push(what + ': missing src'); else if (files && !files.has(p) && !/^(https?|data):/.test(p)) errors.push(what + ': file not in package: ' + p); };
    for (const [id, a] of Object.entries(doc.assets)) ref(a.src, 'asset ' + id);
    for (const f of doc.fonts) ref(f.src, 'font ' + f.family);
    for (const a of doc.audio) { if (!doc.assets[a.src] && !/\//.test(a.src || '')) errors.push('audio src "' + a.src + '" is neither an asset id nor a path'); }
    for (const v of Object.values(doc.voices)) ref(v.src, 'voice');
    for (const s of doc.says) for (const l of langs.length ? langs : ['en']) {
      const c = s.raw['src.' + l]; if (c && !doc.assets[c] && !/\//.test(c)) errors.push('say ' + s.key + ': src.' + l + ' "' + c + '" unknown');
    }
    // voice lines that run into the next line (per language)
    for (const l of langs.length ? langs : ['en']) {
      const lines = sayLines(doc, Object.assign(defaults(doc), { lang: l })).sort((a, b) => a.start - b.start);
      lines.forEach((ln, i) => {
        if (!ln.clip) warnings.push('say ' + ln.key + ' [' + l + ']: no recorded clip yet (tsvg make bakes it)');
        const next = lines[i + 1]; const end = ln.start + ln.dur;
        if (next && end > next.start + 0.05) warnings.push('say ' + ln.key + ' [' + l + '] ends at ' + end.toFixed(2) + 's, overlaps ' + next.key + ' at ' + next.start.toFixed(2) + 's');
        if (end > forOptions(doc, Object.assign(defaults(doc), { lang: l })).duration + 0.05) warnings.push('say ' + ln.key + ' [' + l + '] runs past the end (' + end.toFixed(2) + 's > ' + forOptions(doc, Object.assign(defaults(doc), { lang: l })).duration.toFixed(2) + 's)');
      });
    }
    // dry run
    const ctx = recordingContext();
    const sets = combos(doc); const seen = new Set();
    outer: for (const L of doc.layouts) for (const opts of sets.length ? sets : [{}]) {
      for (let i = 0; i <= samples * doc.scenes.length; i++) {
        const V = forOptions(doc, Object.assign(defaults(doc), opts)); const t = (V.duration * i) / (samples * V.scenes.length);
        try { renderFrame(ctx, doc, t, Object.assign(defaults(doc), opts), L, null); }
        catch (e) { const k = e.message; if (!seen.has(k)) { seen.add(k); errors.push('render ' + L.id + ' ' + JSON.stringify(opts) + ' t=' + t.toFixed(2) + ': ' + e.message); } if (errors.length > 30) break outer; }
      }
    }
    return { ok: errors.length === 0, errors, warnings, doc, stats: { duration: doc.duration, scenes: doc.scenes.length, layouts: doc.layouts.length, variants: sets.length * doc.layouts.length, says: doc.says.length } };
  }
  function recordingContext() {
    const noop = () => {};
    const grad = { addColorStop: noop };
    const ctx = { canvas: null, globalAlpha: 1, save: noop, restore: noop, translate: noop, rotate: noop, scale: noop, transform: noop, setTransform: noop, getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }), fill: noop, stroke: noop, fillRect: noop, fillText: noop, strokeText: noop, clip: noop, rect: noop, beginPath: noop, drawImage: noop, setLineDash: noop, measureText: (s) => ({ width: String(s).length * 10 }), createLinearGradient: () => grad, createRadialGradient: () => grad };
    return ctx;
  }
  if (typeof root.Path2D === 'undefined') {
    root.Path2D = class { constructor() {} moveTo() {} lineTo() {} rect() {} roundRect() {} ellipse() {} closePath() {} addPath() {} };
  }

  root.TSVG = { VERSION, PKG, forOptions, duckAt, captions, needsLibs, loadLibs, flatten, serializeXML, describeLib, libUrl, lint, parse, parseXML, compile, renderFrame, sayLines, audioPlan, assetPath, defaults, combos, validate, EASE, value, makeEnv };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TSVG;
})(typeof window !== 'undefined' ? window : globalThis);
