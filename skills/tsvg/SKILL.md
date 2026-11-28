---
name: tsvg
description: Make a video as a TSVG document (.tsvg XML, packed as .tsvgz) that a player draws live, with no rendering to mp4 and no encoding. Use when the user asks for a TSVG, a .tsvg/.tsvgz file, or a lightweight narrated video, explainer, report, demo or animation that should play directly instead of being rendered; also when editing or fixing an existing .tsvg file. First asks which style to use (tech explainer, codebase explainer, or another the user names), then builds it with tsvg new → edit the XML → tsvg check → tsvg make.
---

# TSVG: videos without rendering

A TSVG video is one XML file: vector shapes, text, images and sound on a timeline, plus options the viewer can switch (language, audio mix, theme, layout). The player draws every frame live with real video controls (timeline, chapters, captions, speed, sharp zoom). **There is nothing to render or encode.** Don't make an mp4 unless the user asks for one (`tsvg export`).

## The CLI

The CLI ships with this plugin. When this skill loads you are told its base directory; the plugin root is two levels up from it. Use it like this in every Bash call (shell state doesn't persist):

```sh
TSVG="node <skill base dir>/../../cli/tsvg.mjs"     # or just `tsvg` if it's on PATH
```

One-time setup, before the first `check`/`preview`/`make` (they drive headless Chrome through `playwright-core`):

```sh
R="<skill base dir>/../.."; [ -d "$R/node_modules/playwright-core" ] || npm install --prefix "$R" --omit=dev
```
It uses the installed Google Chrome. No Chrome? Set `TSVG_CHROME=/path/to/chromium`. Voices need `ffmpeg` and Kokoro (see Narration).

## First: pick the style

Every new video starts by asking the user **which style** it should be in. Ask one question (with the AskUserQuestion tool when you have it), offering:

1. **Tech explainer** — a calm "why / how does X work" video for anyone (YouTube 16:9, Reels / Shorts 9:16, LinkedIn 1:1 from one file): cream paper, real logos in tiles, isometric props, green word-by-word captions. → Read `../tech-explainer/SKILL.md` (next to this skill) and follow it.
2. **Codebase explainer** — how a feature in a codebase really works, for its dev team: `file:line` facts, real UI screenshots, the rows each step writes, an honest "In short" / checked-and-open ending; warm paper with one blue focus, or editor-dark. → Read `../codebase-explainer/SKILL.md` and follow it.
3. **Other** (the user types it) — a style template from `$TSVG styles` (whiteboard, data story, product tour, terminal demo, news bulletin…), the task report (`$TSVG new` with no style), or their own description. → Pick the closest template, read its `examples/styles/<id>.tsvg`, start from it with `$TSVG new <dir> --style <id>`, and follow the rest of this skill.

Skip the question only when the request already settles it: "explain how our login works in a video" → codebase explainer; "a reel / short about why X…" → tech explainer; a named style or an existing `.tsvg` to edit → that. Whatever the style, the result is a TSVG document made with this framework (`tsvg new → edit → check → make`), never a rendered mp4 or an HTML page unless the user asks for one.

## Workflow

```sh
$TSVG new  out/my-video                  # report template on the tsvg:report library + a screenshot slot
$TSVG styles                             # 62 hand-written style templates (product tour, code walkthrough, data story, whiteboard, tech explainer, codebase explainer…)
$TSVG new  out/my-video --style <id>     # start from one of them
#   edit out/my-video/my-video.tsvg
$TSVG check out/my-video/my-video.tsvg   # compiler: errors as file:line + "did you mean"; off-frame and overlapping text
$TSVG make  out/my-video/my-video.tsvg   # check → bake voices → check → preview sheets → my-video.tsvgz
```
- **Libraries first: write props, not shapes.** The report template is `<import src="tsvg:report" as="r" key="KEY"/>` then one `<r:title|list|shot …/>` per scene, each with a `say`. `$TSVG lib` lists the libraries; `$TSVG lib report` / `$TSVG lib explainer` list their components and props (report: `title list shot stat compare code`; explainer: `title point chapter steps stat quote picture versus outro`). Lists: `items="a | b :: detail | c"`. Hand-written shapes only for what no component covers.
- **Codebase explainers** for a dev team (how a feature really works, file:line facts, real UI, the rows each step writes, an honest ending; Oizom paper / editor-dark): use the **codebase-explainer** skill (same `tsvg:tech` library, wide stage).
- **Tech explainers** ("why does X…", "how does X work", news explained; YouTube 16:9, Reels/Shorts 9:16, LinkedIn 1:1 from one document; green word-by-word captions, logo tiles, isometric props): use the **tech-explainer** skill and the `tsvg:tech` library.
- `make` stops on errors. Fix what `check` prints and run again. Treat warnings as bugs too: text off the frame, overlapping text, a narration line longer than its scene.
- **Look at the printed `*.preview*.png` contact sheets** (one per layout: every scene plus its narration) with the Read tool before you call it done. Don't render single frames one by one; use `$TSVG render file -t 12 -o f.png` only to inspect one moment.
- Output: the `.tsvgz` (a zip carrying `index.html`; unzip and open it, it plays). For one self-contained page that plays offline in any browser: `$TSVG pack file.tsvg --html out.html`. Live preview while editing: `$TSVG serve <dir>` then open the `index.html` or the playground.
- For a person editing by hand: `$TSVG watch x.tsvg` (live preview, reloads on save) or `$TSVG edit x.tsvg` (visual editor). Packs carry captions (`captions/<lang>.vtt`) and are size-optimised by default.
- Other commands: `info` (duration, options, chapters, voices), `captions` (WebVTT/SRT), `icons <word>`, `validate`, `unpack`, `bake`, `export` (mp4, only on request).

## Document skeleton

```xml
<tsvg version="0.3" title="@title" font="Inter">
  <layouts><layout id="landscape" w="1920" h="1080"/><layout id="portrait" w="1080" h="1920"/></layouts>
  <options>
    <option id="lang" default="en"><choice id="en" label="English" tts="kokoro:af_heart"/></option>
    <option id="mix" default="full"><choice id="full"/><choice id="speech"/></option>
    <option id="theme" default="dark"><choice id="dark"/><choice id="light"/></option>
  </options>
  <mixes><mix id="full" voice="1" music="0.2" sfx="0.5"/><mix id="speech" voice="1" music="0" sfx="0"/></mixes>
  <themes>
    <theme id="dark"  bg="#0d1016" fg="#eef1f7" accent="#7aa2ff"/>
    <theme id="light" bg="#f6f3ec" fg="#1b1e26" accent="#2f5bea"/>
  </themes>
  <strings><s id="title" en="Hello"/><s id="vo1" en="Hello, world."/></strings>
  <defs><!-- fn, symbol, linear, radial, clip, mask, data --></defs>
  <assets><font family="Inter" src="fonts/Inter.ttf"/><asset id="pad" src="audio/pad.m4a"/></assets>
  <music src="pad" loop="1" vol="0.8"/>
  <backdrop><!-- drawn under every scene, T = t --></backdrop>
  <timeline>
    <scene id="intro" dur="6" chapter="@title">
      <say at="0.5" text="@vo1"/>
      <text x="=W/2" y="=H/2" size="110" size.portrait="80" weight="800" align="center" text="@title" fill="$accent">
        <anim prop="opacity" from="0" to="1" dur="0.7"/>
      </text>
    </scene>
  </timeline>
  <overlay><!-- drawn over every scene --></overlay>
</tsvg>
```
Scenes play in order, each starting where the last ended. Relative paths resolve next to the `.tsvg`; `make`/`pack` bundle every referenced file. `<voices>` is written by `bake`; never edit it by hand.

## Writing it

**Values.** literal · `$token` (theme) · `@id` (string in the current language) · `=expr` (evaluated each frame) · `"text {expr}"` templates · leading `\` escapes a literal `=`.

**Variants.** `attr.portrait`, `attr.light`, `attr.gu`: the first active tag wins (layout id first, then option values in declared order). Give every position, size and `maxw` that differs in portrait its own `.portrait` variant.

**Nodes.** `rect` (x y w h r ax ay) · `circle` (x y r, from/to for pies, `arc="1"` open arc) · `ellipse` · `line` (x1 y1 x2 y2 draw) · `path` (d, draw 0–1 stroke reveal) · `text` (text x y size weight italic font align maxw lh reveal) · `image` (src x y w h r ax ay fit cover|contain|fill) · `group` (x y + children) · `use` (ref a symbol).
Common: `fill stroke sw opacity rot scale sx sy shadow="dx dy blur color" clip="url(#id)" mask="url(#id)" blur dash blend`, timing `at dur when only="portrait gu"`, repeat `repeat="n" as="i"` (i = 0…n−1 in the subtree).

**Animation.** `<anim prop from to at dur ease/>` (times relative to the node's `at`, else the scene start) and `<keys prop v="0:0; 1.2:300; 2:250"/>`. Eases: `linear in out io back elastic step`. Colours interpolate; `<keys prop="d">` morphs paths with the same commands.

**Expressions.** Variables `t` (video time) `T` (scene time) `p` (scene progress 0–1) `sdur dur W H portrait layout`, every option id (`lang`, `theme`…), `i` inside repeats. Functions: `sin cos tan abs sqrt min max floor ceil round pow clamp lerp step smooth fract ease(k,'out') fmt(n,d) str mix(c1,c2,k) rgba data('id',i) count('id') rand(seed) noise(x) s('id')`, plus your `<fn>`s. Deterministic: no clocks, no randomness beyond `rand(seed)`.

**Text.** Body `size` ≥ 34, headings 64–110. Use `maxw` to wrap. `y` is the vertical centre of the text block, so leave room for wrapped lines. Keep text inside the frame in every layout; `check` tells you when it isn't. `rich="1"` → `**bold** *italic* \`code\` ==highlight== [word]($accent)`; `split="word|char"` + `stagger` animates piece by piece; `ls` letter spacing; `path="M…"` text on a curve.

**Layout without numbers.** `<row>`, `<col>`, `<grid cols="3">` place their children (`gap pad align justify`, `grow="1"`; `fill r shadow` makes a card). Prefer them to computing x/y.

**Charts, icons, footage, looks.**
- `<import src="tsvg:charts" as="c"/>` → `<c:bars values="12, 30, 22" labels="Q1 | Q2 | Q3"/>` (also `hbars line pie ring counter spark`).
- `<import src="tsvg:icons" as="i"/>` → `<i:icon name="rocket" size="64" color="$accent" drawin="0.8"/>`; `$TSVG icons <word>` finds names.
- `<video src="clips/x.mp4" w h fit start rate loop vol/>` plays like an image and seeks with the timeline. Keep clips short, H.264.
- `filter="grayscale(1) contrast(1.2)"`, `skx`/`sky`; `<import src="tsvg:fx" as="fx"/>` → `<fx:grain/> <fx:vignette/> <fx:leak/> <fx:flash/> <fx:grade look="vintage">…</fx:grade> <fx:glow> <fx:shake>`.
- Transitions: `<timeline in="fade 0.5">` or `<scene in="push 0.6 left">` (fade slide push wipe zoom iris blur).
- Music: `<music … beats="beats"/>` (make bakes a beat grid; `pulse(t,'beats',0.2)`, `<fx:beat>`); `<mix … duck="0.3"/>` dips music under the voice.
- Own parts: `<defs><component id="card" props="title, sub=''">…%{title}…</component></defs>` then `<card title="…"/>`.

**Narration.** One `<say text="@voN"/>` per scene; the text is also the caption. Keep each line to 1–3 short sentences. `<scene dur="auto">` lasts as long as its narration in each language (+`pad`, ≥`min`); says without `at` follow each other; `at="=cue('v2')"` starts a node with that line. With a fixed `dur`, make it ≥ clip length + 1 s. Use `speak="@x_say"` when pronunciation should differ from the caption (e.g. "T. S. V. G.").
- `make` bakes voices with Kokoro (local) into `voice/<doc>/<lang>/` and writes `<voices>`. It needs `ffmpeg` and a Python with `kokoro-onnx soundfile` plus the model files (`kokoro-v1.0.onnx`, `voices-v1.0.bin` from github.com/thewh1teagle/kokoro-onnx releases). Point to them with `TSVG_PYTHON=<venv python>` and `TSVG_KOKORO_DIR=<model dir>`.
- Not set up, and the user hasn't asked for voice? Run `$TSVG make file.tsvg --no-bake`: captions still show, timed at ~0.42 s per word, and the "no recorded clip yet" warnings are expected. Tell the user how to add voices; don't download the models without asking. Viewers can also make voices themselves: the player's mic button (Voice menu) generates every line in their browser with Kokoro or sanoTTS, or reads lines with a browser voice.
- More languages: add `<choice id="gu" tts="sarvam:shubh"/>` and a `gu="…"` on every string (Sarvam needs `SARVAM_API_KEY`; never print it).

**Craft.** One idea per scene. Build elements in with short staggered `anim`s (opacity + a small x/y/scale move) rather than everything at once. Use theme tokens, not raw colours, so light/dark both work. Keep `<backdrop>` subtle. Check both layouts in the contact sheets.

## claude.ai (web, no CLI)

People on claude.ai can't run the CLI or a server, so the video plays inside an artifact instead: the `tsvg-video` skill (`web-skill/`, built into `dist/tsvg-video.zip` by `npm run build`, uploaded in claude.ai → Settings → Capabilities → Skills) writes the document into a small HTML page that loads the player and the built-in libraries from `cdn.jsdelivr.net/npm/@dixitram/tsvg` (the only scripts an artifact may load; artifacts block every fetch). If a user asks for a video they can view on claude.ai, point them to that skill.

## Reference
In the plugin root: `spec/index.html` (full spec), `libs/` (built-in libraries), `templates/report.tsvg` (library template; `report-classic.tsvg` is the hand-written one), `examples/demo/demo.tsvg` (every feature), `examples/features/`, `examples/styles/*.tsvg` (62 styles; `catalog.json` describes them). Read the closest style example before writing an unfamiliar kind of scene.
