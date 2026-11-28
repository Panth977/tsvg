// TSVG web player: the reference engine for browsers.
// The .tsvg document carries no HTML/JS; this file is the engine that plays it:
// canvas renderer, video controls modelled on native players (tap shows controls,
// centre play/pause and ±10 s, double-tap sides to skip, scrubber with chapters
// and previews, volume, settings menu with speed / captions / document options,
// fullscreen, sharp zoom) and a WebAudio mixer with voice / music / sfx buses.
// The UI lives in a shadow root, so host-page CSS can't break it and it can't leak out.
(function (root) {
  'use strict';
  const TSVG = root.TSVG;
  const fmtT = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60); return m + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // icons (24×24, currentColor)
  const I = {
    play: '<path d="M8 5.5v13l11-6.5z"/>',
    pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>',
    replay: '<path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/>',
    back: '<path d="M11.5 5V2l-5 4 5 4V7a6 6 0 1 1-6 6h-2a8 8 0 1 0 8-8z"/><text x="12" y="16.2" font-size="6.6" font-weight="700" text-anchor="middle" font-family="system-ui,sans-serif">10</text>',
    fwd: '<path d="M12.5 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z"/><text x="12" y="16.2" font-size="6.6" font-weight="700" text-anchor="middle" font-family="system-ui,sans-serif">10</text>',
    vol: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    volLow: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    cc: '<rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="15" font-size="7" font-weight="800" text-anchor="middle" font-family="system-ui,sans-serif">CC</text>',
    gear: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.2 4.6l1.8 1.4-1.8 3.1-2.1-.8a7.5 7.5 0 0 1-1.7 1l-.3 2.2h-3.6l-.3-2.2a7.5 7.5 0 0 1-1.7-1l-2.1.8L4.6 14.5l1.8-1.4a7.7 7.7 0 0 1 0-2.2L4.6 9.5l1.8-3.1 2.1.8a7.5 7.5 0 0 1 1.7-1l.3-2.2h3.6l.3 2.2a7.5 7.5 0 0 1 1.7 1l2.1-.8 1.8 3.1-1.8 1.4a7.7 7.7 0 0 1 0 2.2z"/>',
    full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    exitFull: '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    chevron: '<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    left: '<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  };
  const svg = (name, cls) => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"${cls ? ` class="${cls}"` : ''}>${I[name]}</svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // host element only (zero specificity: any page rule wins); everything else is inside the shadow root
  const HOST_CSS = ':where(.tsvgp){display:block;position:relative;width:100%;height:100%;background:#000;overflow:hidden;border-radius:12px;outline:none}' +
    '.tsvgp.tsvgp-pfs{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:2147483647!important;border-radius:0!important}';
  const CSS = `
  :host{-webkit-tap-highlight-color:transparent}
  .p{position:absolute;inset:0;color:#fff;font:14px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;user-select:none;-webkit-user-select:none;overflow:hidden}
  canvas.main{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:default}
  .zoomed canvas.main{cursor:grab}
  button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;border-radius:50%;flex:none}
  button:focus-visible{outline:2px solid #fff8;outline-offset:2px}
  svg{width:24px;height:24px;display:block}
  .ctl{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .2s,visibility 0s .2s;pointer-events:none}
  .show .ctl{opacity:1;visibility:visible;transition:opacity .15s}
  .show .ctl .hit{pointer-events:auto}
  .scrim{position:absolute;inset:0;background:linear-gradient(#0007,transparent 22%,transparent 62%,#000b)}
  .narrow .scrim{background:#0008}
  .mid{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:clamp(18px,8vw,64px)}
  .mid button{width:56px;height:56px;background:#000a}
  .mid button svg{width:30px;height:30px}
  .mid [data-a=play]{width:72px;height:72px}
  .mid [data-a=play] svg{width:40px;height:40px}
  .wide .mid [data-a=back],.wide .mid [data-a=fwd]{display:none}
  .wide.playing .mid{display:none}
  .bottom{position:absolute;left:0;right:0;bottom:0;padding:0 12px 6px}
  .track{position:relative;height:28px;cursor:pointer;touch-action:none}
  .rail,.fill{position:absolute;left:0;top:12px;height:4px;border-radius:2px;transition:height .12s,top .12s}
  .rail{right:0;background:#ffffff40}
  .fill{background:#ff2d48}
  .track:hover .rail,.track:hover .fill,.drag .rail,.drag .fill{top:11px;height:6px}
  .tick{position:absolute;top:10px;width:3px;height:8px;margin-left:-1px;background:#000b;border-radius:1px}
  .knob{position:absolute;top:7px;width:14px;height:14px;margin-left:-7px;background:#ff2d48;border-radius:50%;transform:scale(.85);transition:transform .12s}
  .track:hover .knob,.drag .knob{transform:scale(1.15)}
  .tip{position:absolute;bottom:30px;transform:translateX(-50%);display:none;text-align:center;pointer-events:none}
  .tip canvas{display:block;border:2px solid #fff;border-radius:8px;background:#000}
  .tip span{display:inline-block;margin-top:5px;padding:2px 7px;background:#000c;border-radius:5px;font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap}
  .row{display:flex;align-items:center;gap:2px;height:40px}
  .row button{width:40px;height:40px;border-radius:8px}
  .row button:hover{background:#ffffff1f}
  .time{font-variant-numeric:tabular-nums;font-size:13px;margin:0 8px;white-space:nowrap}
  .chap{opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1;font-size:13px}
  .chap:empty{visibility:hidden}
  .vol{display:flex;align-items:center}
  .vol input{width:0;opacity:0;transition:width .15s,opacity .15s;margin:0;accent-color:#fff;height:4px;cursor:pointer}
  .vol:hover input,.vol:focus-within input{width:72px;opacity:1;margin:0 6px 0 2px}
  [data-a=rate]{font-size:13px;font-weight:600;width:auto!important;padding:0 8px;border-radius:8px}
  .cc-on [data-a=cc]{box-shadow:inset 0 -3px 0 -1px #ff2d48}
  .narrow .wideonly,.wideonly.hidden,.row .hidden{display:none!important}
  .toast{position:absolute;top:12px;left:50%;transform:translateX(-50%);display:none;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;max-width:calc(100% - 24px);width:max-content;background:#1c1c1ef2;border-radius:12px;padding:8px 8px 8px 14px;font-size:13px;line-height:1.35;box-shadow:0 6px 24px #0008;pointer-events:auto;z-index:2}
  .toast.on{display:flex}
  .toast button{border-radius:8px;padding:6px 10px;font-size:13px;font-weight:600;background:#ffffff1f}
  .toast button.go{background:#fff;color:#000}
  .toast button.x{background:none;opacity:.7;padding:6px 8px}
  .menu .note{padding:8px 14px;font-size:12.5px;opacity:.75;line-height:1.4;white-space:normal;max-width:300px}
  .wide .narrowonly{display:none!important}
  .cc{position:absolute;left:50%;bottom:var(--ccb,16px);transform:translateX(-50%);width:max-content;max-width:86%;text-align:center;pointer-events:none;font-size:var(--ccs,16px);transition:bottom .2s}
  .show .cc{--ccb:var(--ccb-show,80px)}
  .short.show .cc{display:none}
  .cc span{background:#000c;padding:2px 8px;border-radius:4px;line-height:1.55;box-decoration-break:clone;-webkit-box-decoration-break:clone}
  .ripple{position:absolute;top:0;bottom:0;width:34%;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:13px;opacity:0;transition:opacity .35s;pointer-events:none;background:radial-gradient(circle at var(--rx) 50%,#ffffff26 0,#ffffff12 45%,transparent 70%)}
  .ripple.l{left:0;--rx:0%} .ripple.r{right:0;--rx:100%}
  .ripple.on{opacity:1;transition:none}
  .zoomtag{position:absolute;top:10px;left:10px;background:#000b;padding:4px 10px;border-radius:14px;font-size:12px;display:none;pointer-events:auto;cursor:pointer}
  .zoomed .zoomtag{display:block}
  .menu{position:absolute;right:12px;bottom:56px;background:#1c1c1ef5;border-radius:12px;min-width:250px;max-width:calc(100% - 24px);max-height:calc(100% - 72px);overflow:auto;box-shadow:0 10px 40px #000a;display:none;padding:6px 0;pointer-events:auto;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  .menu.open{display:block}
  .narrow .menu{left:0;right:0;bottom:0;max-width:none;max-height:calc(100% - 8px);border-radius:16px 16px 0 0;padding:6px 0 14px}
  .narrow .menu:before{content:"";display:block;width:36px;height:4px;border-radius:2px;background:#fff5;margin:4px auto 6px}
  .menu .item{display:flex;align-items:center;gap:12px;width:100%;padding:0 14px;height:44px;border-radius:0;font-size:14px;text-align:left;justify-content:flex-start}
  .menu .item:hover{background:#ffffff14}
  .menu .item .k{flex:1}
  .menu .item .v{opacity:.7;font-size:13px}
  .menu .item svg{width:20px;height:20px;opacity:.8}
  .menu .head{font-weight:600;border-bottom:1px solid #ffffff1a;margin-bottom:4px}
  .menu .item .ck{width:20px;display:inline-flex}
  .menu .item:not(.on) .ck svg{visibility:hidden}
  .menu-bg{position:absolute;inset:0;display:none;pointer-events:auto}
  .menu-open .menu-bg{display:block}
  .narrow.menu-open .menu-bg{background:#0006}
  .err{position:absolute;left:12px;top:12px;right:12px;color:#ff6b6b;font:13px ui-monospace,monospace;pointer-events:none}`;

  class Player {
    // files: { path → URL } (e.g. blob URLs from a .tsvgz); base: URL the relative paths resolve against;
    // controls: false draws frames only (posters, thumbnails)
    constructor(host, { files = {}, base, onOptions, controls = true } = {}) {
      if (!document.getElementById('tsvgp-css')) { const st = document.createElement('style'); st.id = 'tsvgp-css'; st.textContent = HOST_CSS; document.head.appendChild(st); }
      this.host = host; this.files = files; this.base = base || (typeof location !== 'undefined' ? location.href : ''); this.onOptions = onOptions;
      this.t = 0; this.rate = 1; this.playing = false; this.cc = true; this.layoutPref = 'auto'; this.volume = 1; this.muted = false; this.controls = controls;
      this.zoom = 1; this.panX = 0; this.panY = 0; this.images = {}; this.loadedFonts = new Set(); this.lines = [];
      this.el = document.createElement('div'); this.el.className = 'tsvgp'; this.el.tabIndex = 0;
      this.el.setAttribute('role', 'region'); this.el.setAttribute('aria-label', 'Video player');
      const sr = this.el.attachShadow({ mode: 'open' });
      sr.innerHTML = `<style>${CSS}</style><div class="p">
        <canvas class="main"></canvas>
        <div class="cc"></div>
        <div class="ripple l">${svg('back')}<span>10 s</span></div><div class="ripple r"><span>10 s</span>${svg('fwd')}</div>
        <div class="menu-bg"></div>
        <div class="ctl">
          <div class="scrim"></div>
          <div class="mid">
            <button class="hit" data-a="back" aria-label="Back 10 seconds">${svg('back')}</button>
            <button class="hit" data-a="play" aria-label="Play">${svg('play')}</button>
            <button class="hit" data-a="fwd" aria-label="Forward 10 seconds">${svg('fwd')}</button>
          </div>
          <div class="bottom hit">
            <div class="track" role="slider" aria-label="Seek" tabindex="0"><div class="rail"></div><div class="fill"></div><div class="ticks"></div><div class="knob"></div><div class="tip"><canvas></canvas><span></span></div></div>
            <div class="row">
              <button class="wideonly" data-a="play2" aria-label="Play">${svg('play')}</button>
              <div class="vol"><button data-a="mute" aria-label="Mute (m)">${svg('vol')}</button><input class="wideonly" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume"></div>
              <span class="time"></span><span class="chap"></span>
              <button class="hidden" data-a="voice" aria-label="Narration voice">${svg('mic')}</button>
              <button data-a="cc" aria-label="Captions (c)">${svg('cc')}</button>
              <button class="wideonly" data-a="rate" aria-label="Playback speed">1×</button>
              <button data-a="menu" aria-label="Settings">${svg('gear')}</button>
              <button data-a="fs" aria-label="Fullscreen (f)">${svg('full')}</button>
            </div>
          </div>
        </div>
        <div class="zoomtag" title="Reset zoom"></div>
        <div class="menu" role="menu"></div>
        <div class="toast" role="status"></div>
        <div class="err"></div>
      </div>`;
      host.appendChild(this.el);
      this.sr = sr; this.p = sr.querySelector('.p');
      this.q = (s) => sr.querySelector(s);
      this.canvas = this.q('canvas.main'); this.ctx = this.canvas.getContext('2d');
      if (!controls) { this.q('.ctl').remove(); this.q('.cc').remove(); this.q('.menu').remove(); }
      else this.wire();
      this.showControls(true);
      new ResizeObserver(() => this.draw()).observe(this.el);
    }

    url(path) { return this.files[path] || new URL(path, this.base).href; }
    // the document as timed for the current options (scene lengths may follow the narration's language)
    get tl() { return TSVG.forOptions(this.doc, this.opts); }
    async load(xml) {
      // imports / components: load the libraries (tsvg:<name> from jsr.io at this engine's version), flatten, serve their files
      if (TSVG.needsLibs(xml)) {
        // root.TSVG_FILES (dist/tsvg-libs.js): the built-in libraries bundled by URL, for pages that cannot fetch (claude.ai artifacts)
        const reg = root.TSVG_FILES || {};
        const o = { base: this.base, fetchText: async (u) => { if (typeof reg[u] === 'string') return reg[u]; const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); } };
        const libs = await TSVG.loadLibs(xml, o); const f = TSVG.flatten(xml, libs, o);
        if (f.errors.length) throw new Error(f.errors[0]);
        const blobOf = (e) => { const s = atob(e.b64); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return URL.createObjectURL(new Blob([b], { type: e.type })); };
        for (const [p, u] of Object.entries(f.files)) if (!this.files[p]) this.files[p] = reg[u] && reg[u].b64 ? blobOf(reg[u]) : u;
        xml = f.xml;
      }
      const doc = TSVG.parse(xml);
      this.doc = doc; this.opts = Object.assign(TSVG.defaults(doc), this.keepOpts(doc));
      for (const [id, a] of Object.entries(doc.assets)) {
        if (a.type === 'video') { // a <video> clip: an element the frame drives (seek when paused, play in sync when playing)
          if (!this.images[a.src]) this.images[a.src] = this.makeVideo(a.src);
          this.images[id] = this.images[a.src];
          if (a.poster && !this.images[a.poster]) { const im = new Image(); im.onload = () => this.draw(); im.src = this.url(a.poster); this.images[a.poster] = im; }
          continue;
        }
        if (a.type !== 'image') continue;
        if (!this.images[a.src]) { const im = new Image(); im.onload = () => this.draw(); im.src = this.url(a.src); this.images[a.src] = im; }
        this.images[id] = this.images[a.src];
      }
      this.syncLines();
      await Promise.race([this.loadFonts(), new Promise((r) => setTimeout(r, 3000))]);
      this.t = Math.min(this.t, this.tl.duration);
      this.buildTicks(); this.syncLines(); this.renderMenu(); this.draw();
      if (this.controls) { this.q('[data-a=voice]').classList.toggle('hidden', !this.lines.length); if (root.speechSynthesis && !this._vc) { this._vc = 1; speechSynthesis.addEventListener('voiceschanged', () => this.renderMenu()); } }
      if (this.playing) this.ensureAudio().then(() => this.syncAudio(true));
      return doc;
    }
    // one <video> element per clip node (two nodes may show the same file at different times)
    makeVideo(path) {
      const pl = this; const pool = new Map();
      const make = () => {
        const el = document.createElement('video');
        el.muted = true; el.playsInline = true; el.preload = 'auto'; el.setAttribute('playsinline', ''); el.src = this.url(path);
        el.addEventListener('seeked', () => { if (!pl.playing) pl.draw(); });
        el.addEventListener('loadeddata', () => pl.draw());
        const v = { el, used: 0 }; (pl.videos = pl.videos || []).push(v); return v;
      };
      return { frame(ct, rate, vol, n) {
        const key = n ? (n.line || 0) + '|' + n.a.start + '|' + n.a.rate : '';
        let v = pool.get(key); if (!v) { v = make(); pool.set(key, v); }
        const el = v.el; v.used = pl.drawId;
        if (pl.thumbing) return el.readyState >= 2 ? el : null; // scrub previews never seek the real clip
        el.muted = !(vol > 0) || pl.muted; el.volume = Math.min(1, Math.max(0, (vol || 0) * pl.volume)); el.playbackRate = (rate || 1) * pl.rate;
        const d = el.currentTime - ct;
        if (pl.playing) { if (el.paused) { el.currentTime = ct; el.play().catch(() => {}); } else if (Math.abs(d) > 0.3) el.currentTime = ct; }
        else { if (!el.paused) el.pause(); if (Math.abs(d) > 0.03 && !el.seeking) el.currentTime = ct; }
        return el.readyState >= 2 ? el : null;
      } };
    }
    // .tsvgz bytes (or a URL to .tsvg / .tsvgz)
    async loadPackage(bytes) {
      const files = await root.TSVGZip.read(bytes);
      for (const u of Object.values(this.files)) if (String(u).startsWith('blob:')) URL.revokeObjectURL(u);
      this.files = {}; this.images = {}; this.loadedFonts = new Set(); for (const v of this.videos || []) { v.el.pause(); v.el.removeAttribute('src'); } this.videos = []; if (this.clipEls) { for (const ce of this.clipEls.values()) ce.el.pause(); this.clipEls.clear(); }
      for (const [path, data] of files) if (path !== root.TSVGZip.MAIN) this.files[path] = URL.createObjectURL(new Blob([data], { type: mimeOf(path) }));
      return this.load(root.TSVGZip.text(files.get(root.TSVGZip.MAIN)));
    }
    async open(url) {
      const r = await fetch(url); if (!r.ok) throw new Error('fetch ' + url + ': ' + r.status);
      const b = new Uint8Array(await r.arrayBuffer());
      if (root.TSVGZip && root.TSVGZip.isZip(b)) return this.loadPackage(b);
      this.base = new URL(url, this.base).href; return this.load(new TextDecoder().decode(b));
    }
    async loadFonts() {
      if (typeof FontFace === 'undefined') return;
      await Promise.all(this.doc.fonts.map(async (f) => {
        const key = f.family + '|' + f.weight + '|' + f.style + '|' + f.src; if (this.loadedFonts.has(key)) return;
        try { const ff = new FontFace(f.family, 'url(' + JSON.stringify(this.url(f.src)) + ')', { weight: f.weight, style: f.style }); await ff.load(); document.fonts.add(ff); this.loadedFonts.add(key); }
        catch (e) { console.warn('font', f.family, e); }
      }));
    }
    keepOpts(doc) { const o = {}; if (this.opts) for (const op of doc.options) if (this.opts[op.id] && op.choices.some((c) => c.id === this.opts[op.id])) o[op.id] = this.opts[op.id]; return o; }

    // ── audio ──
    // One <audio> element per clip, routed through WebAudio bus gains (voice / music / sfx / custom) into a
    // master gain (the volume control). Speed belongs to the player, like any video: every element plays
    // at the player's rate, pitch preserved.
    async ensureAudio() {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!this.ac && AC) { this.ac = new AC(); this.master = this.ac.createGain(); this.master.connect(this.ac.destination); this.buses = {}; }
      if (this.ac && this.ac.state === 'suspended') await this.ac.resume().catch(() => {});
      this.buildClips(); this.applyMix();
    }
    bus(name) { if (!this.buses[name]) { const g = this.ac.createGain(); g.connect(this.master); this.buses[name] = g; } return this.buses[name]; }
    buildClips() {
      const want = new Map();
      for (const c of TSVG.audioPlan(this.doc, this.opts).clips) { const path = TSVG.assetPath(this.doc, c.src); if (path) want.set(c.bus + '|' + path + '|' + c.start, Object.assign({}, c, { path })); }
      this.clipEls = this.clipEls || new Map();
      for (const [k, ce] of this.clipEls) if (!want.has(k)) { ce.el.pause(); this.clipEls.delete(k); }
      for (const [k, c] of want) {
        if (this.clipEls.has(k)) continue;
        const url = this.url(c.path); const el = new Audio();
        el.preload = 'auto'; el.loop = !!c.loop; el.preservesPitch = el.mozPreservesPitch = el.webkitPreservesPitch = true;
        const u = new URL(url, location.href); // file:// media is cross-origin to WebAudio (it would play silent): use element volume
        const local = /^(blob|data):/.test(url) || (u.protocol !== 'file:' && u.origin === location.origin);
        el.src = url;
        const ce = { el, clip: c, gain: null };
        // cross-origin media without CORS would play silent through WebAudio: keep those on element volume
        if (this.ac && local) { try { const src = this.ac.createMediaElementSource(el); const g = this.ac.createGain(); g.gain.value = c.vol == null ? 1 : c.vol; src.connect(g); g.connect(this.bus(c.bus)); ce.gain = g; } catch (e) {} }
        el.addEventListener('loadedmetadata', () => this.syncLines());
        // when the duration is unknown (streams, servers without ranges), 'ended' tells us where the clip stops
        el.addEventListener('ended', () => { if (!c.loop) ce.endedAt = c.start + el.currentTime; });
        this.clipEls.set(k, ce);
      }
    }
    applyMix() {
      const out = this.muted ? 0 : this.volume;
      if (this.master) this.master.gain.setTargetAtTime(out, this.ac.currentTime, 0.03);
      if (!this.clipEls) return;
      const mix = (this.doc && this.doc.mixes[this.opts.mix]) || {};
      const gainOf = (b) => (mix[b] == null ? 1 : mix[b]);
      this.duckK = null; // re-apply ducking on the next sync
      if (this.ac) for (const b in this.buses) this.buses[b].gain.setTargetAtTime(gainOf(b), this.ac.currentTime, 0.05);
      for (const ce of this.clipEls.values()) if (!ce.gain) ce.el.volume = Math.min(1, Math.max(0, (ce.clip.vol == null ? 1 : ce.clip.vol) * gainOf(ce.clip.bus) * out));
    }
    // keep every element where the timeline says it should be; called each frame while playing
    syncAudio(force) {
      if (!this.clipEls) return;
      // ducking: the music bus dips while a line is spoken (mix duck=…)
      const mix = (this.doc && this.doc.mixes[this.opts.mix]) || {};
      if (mix.duck != null) {
        if (!this.duckLines || this.duckKey !== JSON.stringify(this.opts)) { this.duckLines = TSVG.sayLines(this.doc, this.opts); this.duckKey = JSON.stringify(this.opts); }
        const k = TSVG.duckAt(this.doc, this.opts, this.t, this.duckLines);
        if (this.duckK == null || Math.abs(k - this.duckK) > 0.01) { this.duckK = k; const g = (mix.music == null ? 1 : mix.music) * k; if (this.ac && this.buses.music) this.buses.music.gain.setTargetAtTime(g, this.ac.currentTime, 0.04); for (const ce of this.clipEls.values()) if (!ce.gain && ce.clip.bus === 'music') ce.el.volume = Math.min(1, Math.max(0, (ce.clip.vol == null ? 1 : ce.clip.vol) * g * (this.muted ? 0 : this.volume))); }
      }
      for (const ce of this.clipEls.values()) {
        const el = ce.el, c = ce.clip, d = el.duration, known = isFinite(d) && d > 0;
        let local = this.t - c.start; if (c.loop && known && local >= 0) local %= d;
        const active = this.playing && local >= 0 && (c.loop || (known ? local < d - 0.02 : !(ce.endedAt != null && this.t >= ce.endedAt - 0.02)));
        if (!active) { if (!el.paused) el.pause(); continue; }
        if (el.playbackRate !== this.rate) el.playbackRate = this.rate;
        if (el.paused) { try { el.currentTime = local; } catch (e) {} el.play().catch(() => {}); }
        else if (force || Math.abs(el.currentTime - local) > 0.2) el.currentTime = local;
      }
    }
    stopAudio() { this.syncAudio(); if (root.speechSynthesis) speechSynthesis.cancel(); }
    // spoken lines without a baked clip use on-device TTS when a voice exists for the language
    ttsCross(prev, now) {
      if (!root.speechSynthesis || this.muted) return;
      const mix = this.doc.mixes[this.opts.mix]; if (mix && mix.voice === 0) return;
      for (const l of this.lines) if (!l.clip && prev < l.start && l.start <= now) {
        const vs = speechSynthesis.getVoices(); const v = vs.find((v) => v.voiceURI === this.ttsVoice) || vs.find((v) => v.lang.toLowerCase().startsWith(l.lang)); if (!v) continue;
        const u = new SpeechSynthesisUtterance(l.text); u.voice = v; u.lang = v.lang; u.rate = this.rate; u.volume = this.volume; speechSynthesis.speak(u);
      }
    }
    // ── voice: browser speech voices, or generate clips in this browser (Kokoro / sanoTTS) for every spoken line ──
    voiceRow() {
      const lang = this.opts.lang || 'en', g = this.gen;
      const vs = root.speechSynthesis ? speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang)) : [];
      const made = this.lines.length && this.lines.every((l) => l.clip);
      const choices = Object.entries(VOICE_ENGINES).map(([id, e]) => ({ id: 'gen:' + id, label: (made && this.genEngine === id ? 'Made with ' : 'Generate with ') + e.label }))
        .concat(vs.slice(0, 12).map((v) => ({ id: v.voiceURI, label: 'Browser: ' + v.name })));
      const cur = g ? g.msg : made ? (this.genEngine ? VOICE_ENGINES[this.genEngine].label.split(' ')[0] : 'Recorded') : (vs.find((v) => v.voiceURI === this.ttsVoice) || vs[0] || { name: 'None' }).name;
      const note = g ? g.msg : this.genErr ? this.genErr : made ? 'Every line has a voice clip.' : vs.length ? 'Lines without a clip are read by your browser\'s voice. Generate makes natural voice clips in this browser (nothing is uploaded).' : 'Your browser has no voice for this language. Generate makes voice clips in this browser (nothing is uploaded).';
      return { id: '__voice', label: 'Voice', cur, note, choices, val: made && this.genEngine ? 'gen:' + this.genEngine : this.ttsVoice || (vs[0] && vs[0].voiceURI) };
    }
    // speak every line of the current language with engine (kokoro | sanotts); clips become blob URLs, <voices> entries
    // join the document (scene timing follows them). Returns { 'key|lang': { src, dur, hash, engine } } (what tsvg bake writes).
    async generateVoices(name) {
      const eng = VOICE_ENGINES[name]; if (!eng || this.gen) return;
      const lang = this.opts.lang || 'en', ENGINE = name + ':' + eng.voice, set = (msg) => { this.gen = { msg }; this.renderMenu(); if (this._toast === 'gen') this.toast(msg); };
      this.genErr = null;
      try {
        set('Loading ' + eng.label + '…');
        const speak = (Player.speakers[name] = Player.speakers[name] || eng.load());
        const fn = await speak.catch((e) => { delete Player.speakers[name]; throw e; });
        const lines = this.lines.slice(), out = {};
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i]; set(`Speaking ${i + 1}/${lines.length}…`);
          const hash = (await sha1(name + '|' + eng.voice + '|' + l.speak)).slice(0, 10), path = 'tts/' + hash + '.wav'; // same hash as tsvg bake
          let dur = Player.clipDur[path];
          if (!dur || !this.files[path]) { const r = await fn(l.speak); this.files[path] = URL.createObjectURL(wavBlob(r.samples, r.rate)); dur = Player.clipDur[path] = r.samples.length / r.rate; }
          out[l.key + '|' + lang] = this.doc.voices[l.key + '|' + lang] = { src: path, dur, hash, engine: ENGINE };
        }
        if (this.doc.views) this.doc.views.clear(); // re-time scenes to the new clips
        this.genEngine = name; this.gen = null;
        this.t = Math.min(this.t, this.tl.duration); this.buildTicks(); this.syncLines(); if (this.ac) { this.buildClips(); this.syncAudio(true); }
        this.renderMenu(); this.draw(); return out;
      } catch (e) {
        this.gen = null;
        this.genErr = /fetch|network|load|import/i.test(String(e && e.message)) ? 'Could not download ' + eng.label + ' here (this page blocks downloads, e.g. a claude.ai artifact, or you are offline). Use a browser voice, or download this page and open it from your computer.' : 'Voice: ' + (e && e.message || e);
        this.renderMenu(); throw e;
      }
    }
    // first play of a video with lines that have no clip: say how it will sound and offer a natural voice
    async voiceHint() {
      if (!this.controls || this._hinted || !this.lines.some((l) => !l.clip)) return; this._hinted = true;
      const lang = this.opts.lang || 'en', has = root.speechSynthesis && speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(lang));
      const msg = has ? 'Narration is read by your browser\'s voice.' : 'This device has no voice for the narration.';
      if (await canDownload()) this.toast(msg, [['go', 'Natural voice', () => this.naturalVoice()], ['', 'More…', () => { this.toast(); this.openMenu('__voice'); }]]);
      else this.toast(has ? msg : msg + ' Captions are on.', has ? [['', 'Choose voice', () => { this.toast(); this.openMenu('__voice'); }]] : [], 7000);
    }
    async naturalVoice() {
      const was = this.playing; if (was) this.pause(); this._toast = 'gen'; this.toast('Loading voice…', []);
      try { await this.generateVoices('sanotts'); this._toast = null; this.toast('Natural voice ready.', null, 2500); if (was) this.play(); }
      catch (e) { this._toast = null; this.toast(this.genErr || String(e), [['', 'Choose voice', () => { this.toast(); this.openMenu('__voice'); }]], 9000); }
    }
    // toast(text, [[cls, label, fn]…], hideAfterMs): a small card at the top of the player; toast() hides it
    toast(text, buttons, ms) {
      const el = this.q('.toast'); clearTimeout(this._toastT);
      if (text == null) { el.classList.remove('on'); return; }
      if (buttons !== undefined || !el.classList.contains('on')) {
        el.innerHTML = `<span class="t"></span>` + (buttons || []).map((b, i) => `<button class="${b[0]}" data-i="${i}">${esc(b[1])}</button>`).join('') + (ms ? '' : `<button class="x" data-i="x" aria-label="Dismiss">✕</button>`);
        el.onclick = (e) => { e.stopPropagation(); const b = e.target.closest('button'); if (!b) return; if (b.dataset.i === 'x') return this.toast(); buttons[+b.dataset.i][2](); };
        el.onpointerdown = (e) => e.stopPropagation();
      }
      el.querySelector('.t').textContent = text; el.classList.add('on');
      if (ms) this._toastT = setTimeout(() => el.classList.remove('on'), ms);
    }
    setVolume(v) { this.volume = Math.min(1, Math.max(0, v)); if (this.volume > 0) this.muted = false; this.applyMix(); this.ui(); }
    toggleMute() { this.muted = !this.muted; if (!this.muted && this.volume === 0) this.volume = 0.5; this.applyMix(); this.ui(); }

    // ── transport ──
    async play() {
      if (this.t >= this.tl.duration - 0.05) this.t = 0;
      this.playing = true; this.p.classList.add('playing'); await this.ensureAudio();
      this.clock = performance.now(); this.syncAudio(true); this.loop(); this.ui(); this.showControls(false);
      this.voiceHint();
    }
    pause() { this.playing = false; this.p.classList.remove('playing'); this.stopAudio(); this.ui(); this.showControls(true); }
    toggle() { this.playing ? this.pause() : this.play(); }
    seek(t) { this.t = Math.min(this.tl.duration, Math.max(0, t)); if (this.playing) { this.clock = performance.now(); this.syncAudio(true); } this.draw(); }
    setRate(r) { this.rate = +r; this.syncAudio(true); this.ui(); }
    loop() {
      if (!this.playing) return;
      const now = performance.now(); const prev = this.t;
      this.t += ((now - this.clock) / 1000) * this.rate; this.clock = now;
      this.ttsCross(prev, this.t); this.syncAudio();
      if (this.t >= this.tl.duration) { this.t = this.tl.duration; this.draw(); return this.pause(); }
      this.draw(); requestAnimationFrame(() => this.loop());
    }

    layout() {
      const L = this.doc.layouts; const want = this.layoutPref;
      if (want !== 'auto') return L.find((l) => l.id === want) || L[0];
      const r = this.el.clientWidth / Math.max(1, this.el.clientHeight);
      return L.slice().sort((a, b) => Math.abs(Math.log(a.w / a.h / r)) - Math.abs(Math.log(b.w / b.h / r)))[0];
    }
    syncLines() {
      this.lines = TSVG.sayLines(this.doc, this.opts);
      for (const l of this.lines) { const ce = l.clip && this.clipEls && [...this.clipEls.values()].find((x) => x.clip.path === TSVG.assetPath(this.doc, l.clip)); if (ce && isFinite(ce.el.duration)) l.dur = ce.el.duration + 0.3; }
    }

    draw() {
      if (!this.doc) return;
      const dpr = root.devicePixelRatio || 1; const W = this.el.clientWidth, H = this.el.clientHeight;
      if (this.canvas.width !== Math.round(W * dpr) || this.canvas.height !== Math.round(H * dpr)) { this.canvas.width = Math.round(W * dpr); this.canvas.height = Math.round(H * dpr); }
      const L = this.layout(); const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      const s = Math.min(W / L.w, H / L.h) * dpr * this.zoom;
      const ox = (W * dpr - L.w * s) / 2 + this.panX * dpr, oy = (H * dpr - L.h * s) / 2 + this.panY * dpr;
      ctx.setTransform(s, 0, 0, s, ox, oy);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, L.w, L.h); ctx.clip();
      this.drawId = (this.drawId || 0) + 1;
      try { TSVG.renderFrame(ctx, this.doc, this.t, this.opts, L, this.images); this.err = null; } catch (e) { this.err = e; console.error(e); }
      for (const v of this.videos || []) if (v.used !== this.drawId && !v.el.paused) v.el.pause(); // clips off screen stop
      ctx.restore();
      this.q('.err').textContent = this.err ? 'render error: ' + this.err.message : '';
      const narrow = W < 600;
      this.p.classList.toggle('narrow', narrow); this.p.classList.toggle('wide', !narrow); this.p.classList.toggle('short', H < 340);
      this.p.style.setProperty('--ccs', Math.max(12, Math.min(22, W * 0.024)) + 'px');
      this.p.style.setProperty('--ccb-show', (narrow ? 84 : 78) + 'px');
      this.p.classList.toggle('zoomed', this.zoom > 1.01);
      this.ui();
    }
    thumb(t) {
      const c = this.q('.tip canvas'); const L = this.layout(); const w = L.w > L.h ? 176 : 96; const h = Math.round((w * L.h) / L.w);
      c.width = w * 2; c.height = h * 2; c.style.width = w + 'px'; c.style.height = h + 'px';
      const ctx = c.getContext('2d'); ctx.setTransform((w * 2) / L.w, 0, 0, (w * 2) / L.w, 0, 0);
      this.thumbing = true; try { TSVG.renderFrame(ctx, this.doc, t, this.opts, L, this.images); } catch (e) {} this.thumbing = false;
    }

    ui() {
      if (!this.doc || !this.controls) return;
      const d = this.tl.duration, k = d ? this.t / d : 0, ended = !this.playing && this.t >= d - 0.05;
      this.q('.fill').style.width = k * 100 + '%'; this.q('.knob').style.left = k * 100 + '%';
      this.q('.track').setAttribute('aria-valuenow', Math.round(this.t)); this.q('.track').setAttribute('aria-valuemax', Math.round(d));
      this.q('.time').textContent = fmtT(this.t) + ' / ' + fmtT(d);
      const icon = this.playing ? 'pause' : ended ? 'replay' : 'play'; const label = this.playing ? 'Pause' : ended ? 'Replay' : 'Play';
      for (const b of this.sr.querySelectorAll('[data-a=play],[data-a=play2]')) { if (b.dataset.icon !== icon) { b.innerHTML = svg(icon); b.dataset.icon = icon; } b.setAttribute('aria-label', label); b.dataset.state = this.playing ? 'playing' : 'paused'; }
      this.q('[data-a=rate]').textContent = (this.rate === 1 ? '1' : String(this.rate)) + '×';
      this.p.classList.toggle('cc-on', this.cc);
      const vi = this.muted || this.volume === 0 ? 'mute' : this.volume < 0.5 ? 'volLow' : 'vol';
      const mb = this.q('[data-a=mute]'); if (mb.dataset.icon !== vi) { mb.innerHTML = svg(vi); mb.dataset.icon = vi; }
      mb.setAttribute('aria-label', this.muted ? 'Unmute (m)' : 'Mute (m)');
      const vr = this.q('.vol input'); if (this.sr.activeElement !== vr) vr.value = this.muted ? 0 : this.volume;
      const fsOn = !!(document.fullscreenElement || document.webkitFullscreenElement) || this.el.classList.contains('tsvgp-pfs');
      const fb = this.q('[data-a=fs]'); const fi = fsOn ? 'exitFull' : 'full'; if (fb.dataset.icon !== fi) { fb.innerHTML = svg(fi); fb.dataset.icon = fi; }
      const ch = this.tl.chapters.filter((c) => c.t <= this.t + 1e-6).pop();
      this.q('.chap').textContent = ch ? '· ' + this.str(ch.label) : '';
      const line = this.cc && this.lines.find((l) => this.t >= l.start && this.t < l.start + l.dur);
      const cc = this.q('.cc'); const want = line ? line.text : '';
      if (cc.dataset.text !== want) { cc.dataset.text = want; cc.innerHTML = want ? '<span></span>' : ''; if (want) cc.firstChild.textContent = want; }
      this.q('.zoomtag').textContent = 'Zoom ' + this.zoom.toFixed(1) + '× · tap to reset';
    }
    str(v) { return v && v[0] === '@' ? TSVG.value(v, TSVG.makeEnv(this.doc, this.opts, this.doc.layouts[0], 0), this.doc) : v; }

    // controls overlay: shown while paused; while playing, shown on demand and hidden after a few seconds
    showControls(on) {
      if (!this.controls) return;
      clearTimeout(this._hide);
      const keep = !this.playing || this.p.classList.contains('menu-open') || this._dragging;
      if (on || keep) {
        this.p.classList.add('show');
        if (this.playing && !keep) this._hide = setTimeout(() => this.showControls(false), 3000);
      } else this.p.classList.remove('show');
    }

    buildTicks() { if (this.controls) this.q('.ticks').innerHTML = this.tl.chapters.filter((c) => c.t > 0).map((c) => `<div class="tick" style="left:${(c.t / this.tl.duration) * 100}%"></div>`).join(''); }

    // settings menu: a list of rows (Speed ›, Captions, each document option ›, Layout ›), each opening a submenu
    menuRows() {
      const rows = [{ id: '__rate', label: 'Playback speed', cur: this.rate === 1 ? 'Normal' : this.rate + '×', choices: SPEEDS.map((r) => ({ id: String(r), label: r === 1 ? 'Normal' : r + '×' })), val: String(this.rate) },
        { id: '__cc', label: 'Captions', cur: this.cc ? 'On' : 'Off', choices: [{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }], val: this.cc ? 'on' : 'off' }];
      for (const o of this.doc.options) { const c = o.choices.find((x) => x.id === this.opts[o.id]); rows.push({ id: o.id, label: this.str(o.label), cur: c ? this.str(c.label) : this.opts[o.id], choices: o.choices.map((x) => ({ id: x.id, label: this.str(x.label) })), val: this.opts[o.id] }); }
      // chapters (0.10): jump to any chapter from the menu
      const chs = this.tl.chapters; if (chs.length > 1) { const cur = chs.filter((c) => c.t <= this.t + 1e-6).pop(); rows.unshift({ id: '__chapter', label: 'Chapters', cur: cur ? this.str(cur.label) : '', choices: chs.map((c, i) => ({ id: String(i), label: fmtT(c.t) + '  ' + this.str(c.label) })), val: cur ? String(chs.indexOf(cur)) : '' }); }
      if (this.lines.length) rows.push(this.voiceRow());
      if (this.doc.layouts.length > 1) rows.push({ id: '__layout', label: 'Layout', cur: this.layoutPref === 'auto' ? 'Auto' : this.layoutPref, choices: [{ id: 'auto', label: 'Auto (fit screen)' }].concat(this.doc.layouts.map((l) => ({ id: l.id, label: l.id + ' · ' + l.w + '×' + l.h }))), val: this.layoutPref });
      return rows;
    }
    renderMenu() {
      if (!this.controls || !this.doc) return;
      const m = this.q('.menu'); const rows = this.menuRows(); const sub = this.menuSub && rows.find((r) => r.id === this.menuSub);
      if (!sub) m.innerHTML = rows.map((r) => `<button class="item" role="menuitem" data-row="${esc(r.id)}"><span class="k">${esc(r.label)}</span><span class="v">${esc(r.cur)}</span>${svg('chevron')}</button>`).join('');
      else m.innerHTML = `<button class="item head" data-back="1">${svg('left')}<span class="k">${esc(sub.label)}</span></button>` +
        (sub.note ? `<div class="note">${esc(sub.note)}</div>` : '') + sub.choices.map((c) => `<button class="item${c.id === sub.val ? ' on' : ''}" role="menuitemradio" aria-checked="${c.id === sub.val}" data-g="${esc(sub.id)}" data-c="${esc(c.id)}"><span class="ck">${svg('check')}</span><span class="k">${esc(c.label)}</span></button>`).join('');
    }
    openMenu(sub) { this.menuSub = sub || null; this.menuDirect = !!sub; this.renderMenu(); this.q('.menu').classList.add('open'); this.p.classList.add('menu-open'); this.showControls(true); }
    closeMenu() { this.q('.menu').classList.remove('open'); this.p.classList.remove('menu-open'); this.menuSub = null; this.showControls(true); }
    setOption(g, c) {
      if (g === '__layout') { this.layoutPref = c; this.zoom = 1; this.panX = this.panY = 0; }
      else if (g === '__rate') { this.setRate(+c); }
      else if (g === '__cc') { this.cc = c === 'on'; }
      else if (g === '__voice') { if (c.startsWith('gen:')) { this.generateVoices(c.slice(4)).catch(() => {}); return; } this.ttsVoice = c; }
      else if (g === '__chapter') { const ch = this.tl.chapters[+c]; if (ch) this.seek(ch.t); }
      else { this.opts[g] = c; this.t = Math.min(this.t, this.tl.duration); this.buildTicks(); this.syncLines(); if (g === 'mix') this.applyMix(); if (this.playing) this.ensureAudio().then(() => this.syncAudio(true)); }
      if (this.onOptions) this.onOptions(this.opts);
      this.renderMenu(); this.draw();
    }
    // zoom keeping the point (mx, my) — relative to the player centre — fixed on screen
    zoomAt(z, mx = 0, my = 0) {
      z = Math.min(12, Math.max(1, z)); const k = z / this.zoom;
      this.panX = mx - (mx - this.panX) * k; this.panY = my - (my - this.panY) * k; this.zoom = z;
      if (z === 1) this.panX = this.panY = 0; this.draw();
    }
    ripple(side) { const f = this.q('.ripple.' + side); f.classList.add('on'); clearTimeout(f._t); f._t = setTimeout(() => f.classList.remove('on'), 500); }
    fullscreen() {
      const doc = document, el = this.el;
      if (doc.fullscreenElement || doc.webkitFullscreenElement) return (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
      if (el.classList.contains('tsvgp-pfs')) { el.classList.remove('tsvgp-pfs'); return this.draw(); }
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { const r = req.call(el); if (r && r.catch) r.catch(() => { el.classList.add('tsvgp-pfs'); this.draw(); }); }
      else { el.classList.add('tsvgp-pfs'); this.draw(); } // iPhone Safari: no element fullscreen, fill the viewport instead
    }

    wire() {
      const act = {
        play: () => this.toggle(), play2: () => this.toggle(),
        back: () => { this.seek(this.t - 10); this.ripple('l'); }, fwd: () => { this.seek(this.t + 10); this.ripple('r'); },
        cc: () => { this.cc = !this.cc; this.renderMenu(); this.ui(); },
        rate: () => this.openMenu('__rate'), voice: () => this.openMenu('__voice'), menu: () => (this.p.classList.contains('menu-open') ? this.closeMenu() : this.openMenu()),
        fs: () => this.fullscreen(), mute: () => this.toggleMute(),
      };
      this.sr.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); act[b.dataset.a](); this.showControls(true); }));
      const vr = this.q('.vol input');
      vr.addEventListener('input', (e) => { e.stopPropagation(); this.setVolume(+vr.value); this.showControls(true); });
      vr.addEventListener('pointerdown', (e) => e.stopPropagation());
      // menu
      const menu = this.q('.menu');
      menu.addEventListener('click', (e) => {
        e.stopPropagation(); const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.back) { this.menuSub = null; this.renderMenu(); }
        else if (b.dataset.row) { this.menuSub = b.dataset.row; this.menuDirect = false; this.renderMenu(); }
        else if (b.dataset.g) { this.setOption(b.dataset.g, b.dataset.c); if (b.dataset.c.startsWith('gen:')) return; this.menuSub = null; this.renderMenu(); if (this.menuDirect || this.p.classList.contains('narrow')) this.closeMenu(); }
      });
      this.q('.menu-bg').addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); this.closeMenu(); });
      // scrubber: drag (mouse or touch) with a live preview frame; hover previews too
      const track = this.q('.track'); const tip = this.q('.tip');
      const at = (e) => { const r = track.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * this.tl.duration; };
      const preview = (t) => {
        const r = track.getBoundingClientRect(); tip.style.display = 'block'; this.thumb(t);
        const half = (tip.offsetWidth || 180) / 2; tip.style.left = Math.min(r.width - half, Math.max(half, (t / this.tl.duration) * r.width)) + 'px';
        const ch = this.tl.chapters.filter((c) => c.t <= t).pop(); tip.querySelector('span').textContent = fmtT(t) + (ch ? ' · ' + this.str(ch.label) : '');
      };
      track.addEventListener('pointerdown', (e) => { e.stopPropagation(); this._dragging = true; this.p.classList.add('drag'); track.setPointerCapture(e.pointerId); this.seek(at(e)); preview(at(e)); this.showControls(true); });
      track.addEventListener('pointermove', (e) => { const t = at(e); if (this._dragging) this.seek(t); if (this._dragging || e.pointerType === 'mouse') preview(t); });
      const end = () => { if (!this._dragging) return; this._dragging = false; this.p.classList.remove('drag'); tip.style.display = 'none'; this.showControls(true); };
      track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
      track.addEventListener('pointerleave', () => { if (!this._dragging) tip.style.display = 'none'; });
      track.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); this.seek(this.t + (e.key === 'ArrowLeft' ? -5 : 5)); } });
      // the video surface. Touch: tap shows/hides the controls, double-tap a side skips 10 s.
      // Mouse: click plays/pauses, double-click toggles fullscreen, moving shows the controls.
      // Wheel / pinch zooms (re-rendered, never blurry); drag pans while zoomed.
      const surface = this.p; let lastTap = 0, lastX = 0, pan = null, pinch = null; const pts = new Map();
      const inUi = (e) => e.composedPath().some((n) => n.classList && (n.classList.contains('hit') || n.classList.contains('menu') || n.classList.contains('zoomtag')));
      surface.addEventListener('pointerdown', (e) => {
        if (inUi(e)) return;
        pts.set(e.pointerId, e);
        if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: this.zoom }; pan = null; }
        else pan = { x: e.clientX, y: e.clientY, px: this.panX, py: this.panY, moved: false, type: e.pointerType };
      });
      surface.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'mouse' && !pts.size) { this.showControls(true); return; }
        if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, e);
        if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; this.zoom = Math.min(12, Math.max(1, (pinch.z * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)) / pinch.d)); if (this.zoom === 1) this.panX = this.panY = 0; this.draw(); return; }
        if (pan) { const dx = e.clientX - pan.x, dy = e.clientY - pan.y; if (Math.abs(dx) + Math.abs(dy) > 6) pan.moved = true; if (this.zoom > 1 && pan.moved) { this.panX = pan.px + dx; this.panY = pan.py + dy; this.draw(); } }
      });
      const up = (e) => {
        if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId);
        if (pinch) { if (!pts.size) pinch = null; return; }
        if (!pan || pan.moved || e.type === 'pointercancel') { pan = null; return; }
        const r = this.el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width; const now = performance.now(); const type = pan.type; pan = null;
        if (type === 'mouse') { // click = play/pause, double-click = fullscreen
          if (now - lastTap < 300) { clearTimeout(this._tap); act.fs(); lastTap = 0; return; }
          lastTap = now; clearTimeout(this._tap);
          this._tap = setTimeout(() => { if (this.p.classList.contains('menu-open')) this.closeMenu(); else { this.toggle(); this.showControls(true); } }, 220);
          return;
        }
        // touch / pen
        const side = x < 0.35 ? 'l' : x > 0.65 ? 'r' : '';
        if (side && now - lastTap < 320 && Math.abs(x - lastX) < 0.25) { clearTimeout(this._tap); side === 'l' ? act.back() : act.fwd(); lastTap = now; lastX = x; return; }
        lastTap = now; lastX = x; clearTimeout(this._tap);
        this._tap = setTimeout(() => {
          if (this.p.classList.contains('menu-open')) return this.closeMenu();
          if (this.p.classList.contains('show') && this.playing) this.showControls(false); else this.showControls(true);
        }, side ? 300 : 0);
      };
      surface.addEventListener('pointerup', up); surface.addEventListener('pointercancel', up);
      surface.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && this.playing && !this.p.classList.contains('menu-open')) { clearTimeout(this._hide); this._hide = setTimeout(() => this.showControls(false), 600); } });
      this.canvas.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && Math.abs(e.deltaY) < 1) return;
        e.preventDefault(); const r = this.el.getBoundingClientRect();
        this.zoomAt(this.zoom * Math.exp(-e.deltaY / 400), e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
      }, { passive: false });
      this.q('.zoomtag').addEventListener('click', (e) => { e.stopPropagation(); this.zoomAt(1); });
      for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => this.draw());
      this.el.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.p.classList.contains('menu-open')) { e.preventDefault(); e.stopPropagation(); return this.closeMenu(); }
        if (e.key === 'Escape' && this.el.classList.contains('tsvgp-pfs')) { e.preventDefault(); return this.fullscreen(); }
        const k = { ' ': 'play', k: 'play', j: 'back', ArrowLeft: 'back', l: 'fwd', ArrowRight: 'fwd', c: 'cc', f: 'fs', m: 'mute' }[e.key];
        if (k) { e.preventDefault(); act[k](); this.showControls(true); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); this.setVolume((this.muted ? 0 : this.volume) + (e.key === 'ArrowUp' ? 0.1 : -0.1)); this.showControls(true); }
        else if (e.key === '>' || e.key === '<') { const i = SPEEDS.indexOf(this.rate); const n = SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, (i < 0 ? 3 : i) + (e.key === '>' ? 1 : -1)))]; this.setRate(n); this.renderMenu(); }
        else if (/^[0-9]$/.test(e.key)) this.seek((this.tl.duration * +e.key) / 10);
      });
    }
  }
  function mimeOf(p) {
    const e = (p.split('.').pop() || '').toLowerCase();
    return { ogg: 'audio/ogg', opus: 'audio/ogg', mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif', ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2', mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' }[e] || 'application/octet-stream';
  }
  Player.speakers = {}; Player.clipDur = {}; // per page: engines load once, clips are reused across documents
  // in-browser TTS engines, loaded on demand from jsdelivr (Kokoro: same model, voice and hash as `tsvg bake`)
  const VOICE_ENGINES = {
    kokoro: { label: 'Kokoro (best, ~90 MB once)', voice: 'af_heart', async load() {
      const { KokoroTTS } = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm'), gpu = !!navigator.gpu; // WebGPU fp32 (~310 MB), else WASM q8 (~90 MB)
      const t = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: gpu ? 'fp32' : 'q8', device: gpu ? 'webgpu' : 'wasm' });
      return async (text) => { const a = await t.generate(text, { voice: 'af_heart' }); return { samples: a.audio, rate: a.sampling_rate }; }; // ponytail: one generate per line (~510 tokens max)
    } },
    sanotts: { label: 'sanoTTS (small, fast)', voice: 'heart', async load() {
      const base = 'https://cdn.jsdelivr.net/npm/sanotts-web@0.3.0/dist/', { SanoTTS } = await import(base + 'index.js'), t = await SanoTTS.load({ assetBase: base });
      return async (text) => { const r = await t.synthesize(text, { voice: 'heart', maxSeconds: 30 }); return { samples: r.samples, rate: r.sampleRate }; }; // 30 s per line: the nano runtime's cap
    } },
  };
  function wavBlob(samples, rate) {
    const b = new DataView(new ArrayBuffer(44 + samples.length * 2)), w = (o, t) => [...t].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); b.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
    b.setUint32(24, rate, true); b.setUint32(28, rate * 2, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true); w(36, 'data'); b.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) b.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
    return new Blob([b], { type: 'audio/wav' });
  }
  // can this page download (voice models)? claude.ai artifacts block every fetch
  let dl = null;
  function canDownload() { return (dl = dl || fetch('https://cdn.jsdelivr.net/npm/sanotts-web@0.3.0/package.json', { method: 'HEAD' }).then((r) => r.ok, () => false)); }
  async function sha1(t) { return [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(t)))].map((x) => x.toString(16).padStart(2, '0')).join(''); }
  Player.voiceEngines = VOICE_ENGINES;
  root.TSVGPlayer = Player;
})(typeof window !== "undefined" ? window : globalThis);
