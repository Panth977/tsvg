---
name: tech-explainer
description: Make a calm, precise tech explainer video as TSVG in one house look — cream paper, real logos in outlined tiles, small boxed labels, pale-green isometric props, and a caption that turns green word by word as it is spoken — playing in 16:9, 9:16 and 1:1 from one document. Use when the user wants a tech explainer, "why does X…?" / "how does X work?" / "what happens when…" video, a news-explained video about a tech company, a YouTube explainer, an Instagram Reel / Short / TikTok, a LinkedIn video, or "a video like the geek-explained reels". Built on the tsvg:tech library; needs the tsvg skill's CLI.
---

# TSVG tech explainer

One everyday tech question, answered so clearly that a non-technical viewer gets it and an engineer finds nothing wrong. The picture always shows **exactly what the voice is saying right now**; the caption follows the voice word by word; one thing is green at a time.

Distilled from 22 reference reels (83–178 s, most 2–3 min). The look is fixed (paper, ink, one green focus, sync to the voice); the topic, the story and the pictures are yours. The recipes and examples show the range; **invent new scenes whenever the topic asks for them**.

**Read before you start:**
- `references/story.md` — the question, the arc, beats and chunks, the ending, the post text, the approval gate. **Read first.**
- `references/scenes.md` — 22 scene recipes (device hook, logo wall, hub, versus, labelled part, stack, document, flow, room cutaway, timeline chips, debugger, tokens, full-bleed world…) with code, the motion vocabulary, and how to invent beyond them.
- `assets/README.md` — seven boards of original scenes showing the style's range (`assets/boards/`, with sources), contact sheets of the recipes (`assets/own/`) and, when present locally, the original study material (`assets/reference/`, never shipped). **Look at them before designing scenes**, as inspiration for range and quality — not as templates to copy.
- `references/formats.md` — 16:9 / 9:16 / 1:1 from one document, the stage, safe zones, exporting per platform.

Use the **tsvg** skill for the CLI (`TSVG=…`, `npm install`, Chrome, Kokoro voices).

## Workflow

1. **Question + arc** (`story.md` §1–2). One question in the viewer's words; pick the arc.
2. **Beat map** (`story.md` §3–4): every beat's caption chunks (3–7 words, cut on `/`) plus a one-line picture note naming its recipe. ~170 words/min.
3. **Approval gate:** show the user the beat map (title, arc, beats) unless they asked for the finished video in one go. Change words now, not scenes later.
4. **Look:** open the `assets/boards/board-*.jpg` boards for the kinds of scenes your beats need (rooms, devices, worlds, diagrams, documents, numbers, people, endings), and `assets/own/scene-recipes-portrait.jpg` for the recipes; when a board scene is close to what you need, read its source in `assets/boards/src/`. Then design each beat for *this* topic — the boards show the bar, not the answer.
5. **Build:** `$TSVG new out/<slug> --style tech-explainer` gives the worked example; replace its beats. One `<tx:beat>` per beat. Use a recipe where it fits, adapt or combine them, or draw something new; adjacent beats should look different.
6. **Make:** `$TSVG make out/<slug>/<slug>.tsvg` → 0 errors, **0 warnings**.
7. **Check:** read all three `*.preview-*.png`, then render 10–16 moments across the video (`$TSVG render f.tsvg -t <s> --width 360 --layout portrait`) and look at them as one montage (`magick montage`). Every frame: one green focus, matching its caption; nothing early; nothing overlapping; nothing under the caption.
8. **Deliver:** the `.tsvgz`, the post text (`story.md` §5), and mp4s only if asked (`formats.md`).

## The document

```xml
<tsvg version="0.10" title="Why does a 1 TB drive show 931 GB?">
  <import src="tsvg:tech" as="tx"/>
  <timeline>
    <tx:beat id="b1" chapter="Hook" say="You bought a one terabyte drive, / but Windows shows / only 931 gigabytes.">
      <tx:window x="150" y="560" w="780" h="430" title="This PC" tilt="30" at="0.1">
        <text x="30" y="220" size="110" weight="800" font="Outfit" fill="$ink" text="931 GB" at="=cue('b1.2')"/>
      </tx:window>
      <tx:stat x="540" y="380" value="1 TB?" size="110" at="=cue('b1.0') + 0.4"/>
    </tx:beat>
    <tx:beat id="b2" chapter="Two ways to count" say="The box counts a kilobyte / as 1,000 bytes, / but Windows uses 1,024.">
      <tx:label x="300" y="420" text="1 KB" sub="the box: 1,000 bytes" size="48" at="=cue('b2.0')" hl="=tx:on(cue('b2.1'), cue('b2.2'))"/>
      <tx:label x="780" y="420" text="1 KB" sub="Windows: 1,024 bytes" size="48" at="=cue('b2.2')" hl="=tx:on(cue('b2.2'), sdur)"/>
    </tx:beat>
    <tx:follow id="end" channel="Your Channel" say="Follow Your Channel, / and next time, / I'll show you where the other 7% went."/>
  </timeline>
</tsvg>
```

## Components (`$TSVG lib tech` for every prop)

| Component | What | Place by |
|---|---|---|
| `tx:beat` | a scene: `say` cut on `/` → voice lines `<id>.0`, `<id>.1`…; word-by-word caption; the stage; `zoom zx zy` push-in; `plate="1"` = paper plate behind the caption on busy scenes | — |
| `tx:follow` | end card: channel window, closing line inside it, Follow button | — |
| `tx:tile` | logo tile: `src` (real logo PNG) · `icon` (Lucide) · `glyph`; `label` `sub` under it | centre |
| `tx:label` | boxed name + small line; `tx ty` leader line to the part it names; `mono="1"` for numbers/code | centre |
| `tx:pill` | `kind="green"` (steps, "You"), `dark` (a value in transit), `gear` (an engine / setting name) | centre |
| `tx:wire` | thin ink line/curve `d`, draws on | path coords |
| `tx:box` | isometric box: slab, server, chip, drive, sandbox; `top left right` colours; slot = its top face | back corner of top face |
| `tx:window` | app / browser window, `url`, `tilt="30"` = isometric screen; slot = content | top-left |
| `tx:phone` | phone, `tilt`; slot = screen | top-left |
| `tx:doc` | paper page; `quotes="a \| b"` appear lime-highlighted one by one; `from` source line | top-left |
| `tx:code` | code / debugger window; `lines="text :: ok \| text :: bad \| text"` rows turn green / red `mark` s after it appears | top-left |
| `tx:tokens` | a row of word chips that pop in; `sweep` walks a lime highlight along them | centre |
| `tx:chip` | small marker: optional icon/logo + bold text — years and eras on a timeline (2017, 1980s), a brand beside a fact | centre |
| `tx:room` | isometric room cutaway (floor + two walls) to furnish with boxes, devices, people | back floor corner |
| `tx:stat` | big number with a lime highlighter swipe, `sub` | centre |
| `tx:headline` | two-line claim at the top: ink line + green line | centre x, `y` |

**Timing and focus.** Chunk *n* of beat `b3` is voice line `b3.n`: `at="=cue('b3.1')"`, `cueEnd('b3.1')`, `sdur` (scene end). Functions (always with the `tx:` prefix): `tx:on(a, b)` 0→1→0 focus window → `hl`; `tx:fade(a, b, 0.3)` steps back to 30% → `op`; `tx:grow(a, d)` 0→1 eased → for your own moving parts.

**Theme tokens** for hand-drawn bits inside slots: `$ink $line $muted $dim $tile $shade $bg $green $pale $mid $deep $lime $bad`; fonts `Outfit` (500/700/800) and `JetBrains Mono`.

## Rules that make it this style

- **Sync is the style.** Things arrive on the chunk that names them, are green while it's said, and step back after. Never show something before the voice gets there.
- **One accent.** Green = spoken / in focus; lime = a highlighter; everything else ink on cream. No other colours except real logos (and `$bad` red for a genuine "no").
- **Real things, simply drawn:** real product logos in tiles, real numbers, real UI words ("Local Disk (E:)", "Privacy Policy"). Isometric props stay pale green and outlined; no gradients, no shadows beyond the tile drop, no photos.
- **Calm motion:** pop, draw, fade, a slow push-in on detail beats. No loops, shakes, spins or bouncing text. The payoff beat is the stillest.
- **Fair and exact:** check facts; say who claims what; leave out any number you're not sure of.
- Never copy another channel's name, avatar or branding: `tx:follow channel` is the user's own.

## Gotchas

- Keep `dur="auto"` on beats (the default): the chunks then follow each other. A fixed `dur` stacks them at 0 s.
- A text value that starts with `=` is an expression: write `\= 1,000 bytes` or reword.
- Lucide has no brand logos (no `chrome`, `windows`): real logos go in `src="images/…png"`; `$TSVG icons <word>` finds generic icons.
- `hl`, `op`, `x`, `y`, `at` take numbers or `=expressions`; sizes (`size`, `w`, `h`, `d`) and offsets measured from a component's own start (`code mark`, `tokens step sweep`, `doc step`) take plain numbers.
- `tsvg check` warning about overlapping text = a real collision; move one of them. Check square too: it is the tightest layout.
- Kokoro reads digits well ("931", "1,024") but say units in words in the chunk ("one terabyte", "gigabytes") so the voice and the caption agree.
- The player has its own CC captions; this style burns them in, so leave CC off (`formats.md`).
