---
name: tsvg-video
description: Make a narrated video that plays right inside the chat as an artifact, written as TSVG (an XML vector video format that the player draws live, with real video controls, chapters, word-by-word captions and spoken narration). Use when the user asks for a video, explainer, animated summary, walkthrough or reel of an uploaded document, a topic, a codebase or a process, e.g. "make a video of this document", "explain this PDF as a video", "turn these notes into an explainer video", "a reel about why X". No rendering or mp4: the artifact itself is the video.
---

# TSVG video in an artifact

The video is one TSVG XML document inside a small HTML artifact. The artifact loads the TSVG player from jsdelivr (the only kind of script an artifact may load), and the player draws the video live: timeline, chapters, captions, speed, fullscreen, and the narration spoken by the browser's voice. **Never make an mp4 and never try to render frames.** The artifact is the deliverable.

## Workflow

1. **Read the source** (the uploaded document, the notes, the topic). Pull out the one question the video answers and the 5–12 facts that answer it. Use the document's own numbers and words; leave out anything you are not sure of.
2. **Pick the style** (don't ask unless the user seems to care):
   - **Tech explainer** (default for documents, topics, "how / why does X work"): cream paper, outlined icon tiles, boxed labels, isometric props, green word-by-word captions; plays 16:9, 9:16 and 1:1 from one document. Read `references/story.md`, then `references/scenes.md`; start from `examples/tech-explainer.tsvg`.
   - **Codebase explainer** (how a feature in code works, for its developers): read `references/codebase-scenes.md`; start from `examples/codebase-explainer.tsvg`.
   - **Report** (a plain summary: title, lists, stats, comparisons): start from `examples/report.tsvg` (the `tsvg:report` library).
   Every component and prop: `references/libs.md`. Full language: `references/tsvg.md`.
3. **Beat map:** write every beat's narration first (cut into 3–7-word chunks on `/` for the tech styles), one picture idea per beat. ~170 words a minute; aim for 45–120 s unless asked. Show the beat map to the user first only if they asked to review it.
4. **Write** the document to `/tmp/video.tsvg` with your file tool.
5. **Check:** `node <this skill dir>/scripts/check.mjs /tmp/video.tsvg`. Fix every ERROR and every warning, run again until it prints `ok`. (No node? Re-read the rules below carefully instead.)
6. **Deliver:** create an HTML artifact with exactly this content, the checked document pasted in place of the comment (drop the `<?xml …?>` line):

```html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIDEO TITLE</title>
<style>html,body{margin:0;background:#000}</style>
<script src="https://cdn.jsdelivr.net/npm/@dixitram/tsvg@__VERSION__/tsvg.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@dixitram/tsvg@__VERSION__/tsvg-libs.js"></script>
</head><body>
<script type="text/tsvg" data-play>
<!-- the <tsvg …>…</tsvg> document -->
</script>
</body></html>
```
   Keep both script tags at this exact version: `tsvg-libs.js` carries the built-in libraries (`tsvg:tech`, `tsvg:icons`, `tsvg:report`, `tsvg:explainer`, `tsvg:charts`, `tsvg:fx`) and their fonts. Then tell the user in one or two lines what the video covers and that they press play: on first play the player says how the narration will sound (browser voice) and, where the page can download, offers a natural voice; captions always show.

## What works inside an artifact (and what doesn't)

The artifact sandbox blocks every network request except scripts from cdn.jsdelivr.net/npm. So:
- **No `<voices>` section and no audio files.** Narration comes from `say` text: the player speaks it with the browser's speech voice and times each beat from its word count. Never write `<voices>`, `src="voice/…"` or `<music>` with a file.
- **No external images, fonts or logo PNGs** (`src="images/…"`, `https://…` are blocked). Use `icon="…"` (Lucide names from `tsvg:icons`: `server`, `database`, `globe`, `lock`, `shield`, `file-text`, `cpu`, `cloud`, `user`, `mail`, `rocket`, `chart-bar`…) or `glyph="…"` on tiles, and draw the rest with shapes. A small picture the user uploaded may be inlined as a `data:image/png;base64,…` src (keep it under ~200 KB).
- Fonts: only the bundled ones (`Outfit`, `Inter`, `JetBrains Mono`, `Noto Sans Gujarati`), which the libraries already declare.
- Do not reference any file path at all: the artifact has no files beside it.

## Rules (all styles)

- **Sync is the style.** Things appear on the chunk that names them (`at="=cue('b3.1')"`), are highlighted while it's said, and step back after. Never show something before the narration gets there.
- One idea per beat; adjacent beats look different. Calm motion: pop, draw, fade, a slow push-in. No loops, shakes or spinning text.
- Keep `dur="auto"` on beats so each lasts as long as its narration. A text value that starts with `=` is an expression: write `\=` for a literal.
- Body text `size` ≥ 34, headings 64–110; keep everything inside the frame in every layout (portrait is the tightest).
- Say numbers and units the way they should be spoken ("one terabyte", "40 percent"), so voice and caption agree.
- Never copy a real channel's or company's name, branding or logo as the video's own; `tx:follow channel` is the user's name or omit the end card.
