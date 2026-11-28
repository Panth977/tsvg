---
name: codebase-explainer
description: Make narrated explainer videos of a codebase for its dev team as TSVG (plays live, no rendering) — how a feature or data flow really works end to end (UI button → API endpoint → database/cache → device), or explain + open-question videos that show what was checked and what is still unknown. One house look (warm paper, ink outlines, one blue focus at a time, real tech logos, word-by-word captions; editor-dark on request), every claim from the code (file:line), real UI screenshots, the rows each step writes. Use when someone asks for an explainer / walkthrough / onboarding video of their code, "explain how X works in a video", or a video for the team about a change or an investigation. NOT for reels, promos or client demos (tech-explainer for public tech explainers).
---

# Codebase explainer

A 1–6 minute narrated TSVG video that teaches a developer on the team how a part of the code works. Every claim comes from the code (`file:line`), every screen is the real app, every number has a source. It plays in the TSVG player with chapters, captions and sharp zoom; there is nothing to render.

**These are explanations, not reels.** No hook, no teaser, no "X is about to change, here is what happens", no fun facts, no "follow for more". The first sentence already explains.

Built on `tsvg:tech` (the same library as **tech-explainer**) in its **Oizom theme** on the **wide stage**. Use the **tsvg** skill for the CLI (`TSVG=…`, `npm install`, Chrome, Kokoro voices).

**Read before you start:**
- `references/research.md` — fan-out research with `file:line`, what to ask the human, screenshots (`scripts/capture.mjs`), logos (`scripts/logo.mjs`), numbers, open questions.
- `references/scenes.md` — 9 codebase recipes (flow + packet, code proof, rows written, real UI with a ring, before → after, scale, drawn device, machines, the ending), all with code.
- `assets/` — what this looks like: the example video in paper, editor-dark and portrait, and every recipe rendered. Inspiration for quality, not templates: design each scene from its sentence.
- For more pictures (rooms, devices, stacks, timelines, tokens, isometric worlds) and the 16:9 / 9:16 / 1:1 details: `../tech-explainer/references/scenes.md` and `formats.md`.

## Privacy (hard rule)

Project facts live in the project, not in this skill. Service names, test accounts, devices, which UI area to redact, where the work folder is: read them from the target repo (its CLAUDE.md, docs, memory) or ask the human. Never write them back into this skill, its examples, or any public repo.

- Work in a **gitignored** folder of the target repo (e.g. `explainer-video/<topic>/`). Check first: `git check-ignore -v explainer-video`.
- Never put credentials, internal URLs, client names or real user data in frames, file names or shared files. Test accounts and test devices only (ask the human which); redact the signed-in user.
- A `.tsvgz` carries every file and the narration text: share it only where the code itself may go.

## Workflow

1. **Research** (`references/research.md`): facts with `file:line`, inferred marked, every writer grepped, the "why" asked.
2. **Script = beat map.** One `<tx:beat>` per step of the explanation (2–6 chunks each), chunks cut on `/` at natural pauses, 8–20 words a sentence. Follow the narration rules below. Note the picture for each chunk (a recipe, or what you'll draw).
3. **Approval gate:** show the human the beat map and the facts behind it (one line each, with `file:line`) before building, unless they asked for the finished video in one go. A wrong "why" caught here costs nothing.
4. **Voice:** pick with the human. Kokoro (local, default): `af_heart` (warm), `am_michael` (calm male), `af_bella`, `am_fenrir`, `bm_george`, `bf_emma` — set it in the document's `<option id="lang">` (`tts="kokoro:am_michael"`). Names the voice gets wrong: word the chunk the way it should sound ("session dot ts", "P M two point five", "Postgres" not "PG"); the caption shows the same words, the picture shows the real name.
5. **Build:** `$TSVG new <work>/<topic> --style codebase-explainer` gives the worked example (made-up session cache). Replace its beats; keep its `<options>` (Oizom theme, voice). One idea per beat; earlier pieces stay as context.
6. **Make:** `$TSVG make <file>.tsvg` → 0 errors, **0 warnings** (overlaps, text off-frame and lines longer than their beat are bugs).
7. **Look:** read the `*.preview-*.png` sheets, then render one frame per chunk (`$TSVG render f.tsvg -t <s> --width 640`, cue times from `$TSVG captions f.tsvg`) and look at them as a montage, plus one at full size and one in `--theme oizom-dark`. Check: one blue thing per frame, the blue thing is what the caption says, nothing early, rings on the right control, logos legible, code ≥ 28 px.
8. **Deliver:** the `.tsvgz` (or `$TSVG pack f.tsvg --html f.html` for one offline page) or `$TSVG watch f.tsvg` to watch live. An MP4 only when asked: `$TSVG export f.tsvg -o f.mp4 --width 1280` (720p). Chapters are built in (`chapter` on each beat); a series is several beats with chapters in one file, no joining.

## Narration rules

Calm senior engineer walking a teammate through the code. First person plural ("we", "our"). The voice explains the *why* while the screen shows the *what* — never read the card aloud.

1. **Start explaining at second 0.** Bad: "Our auth flow is about to change, here's what happens." Good: "When you log in, the web app sends your email and password to the API."
2. **Describe it, then name it.** "The API keeps your session in a fast store for fifteen minutes. That's the session key in Redis." Names (files, tables, endpoints) come after the meaning.
3. **One sentence = one change on screen.** 8–20 words. If nothing changes on screen, the sentence is filler: cut it, or show something.
4. **Normal case before special case** ("Usually the key is already there. The first time, it isn't.").
5. **Numbers only with a source** (`ttl: 900` → "fifteen minutes"), never rounded for effect.
6. **Say only what research proved.** Inferred → leave it out or say "probably". Unchecked → the open-questions list.
7. **Spell for the voice:** "session dot ts" only if the name matters; "P M two point five"; "Postgres", not "PG".
8. **End plainly**, one of: **In short** (`tx:sum`: one sentence a teammate could repeat in standup) · **Explain + question** (`tx:qs`: what we checked ✓ and how, what is still open, who can answer) · **Next:** one line naming the next chapter.

## The look

- **Theme `oizom`** (warm paper `#f4f2ea`, navy ink, Oizom blue `#0090ff`) by default; **`oizom-dark`** (editor dark) only when the human asks — the viewer can also switch in the player. Set in the document:
  `<option id="theme" label="Theme" default="oizom"><choice id="oizom" label="Paper"/><choice id="oizom-dark" label="Editor dark"/></option>`
- **One blue at a time.** `$focus` marks only what the voice is saying now (`hl="=tx:on(a, b)"`); it hands over when the next thing takes focus. Never two blue things, never blue as decoration. Red (`$bad`) only means removed / failed / cleared. Green (`$ok`) only on a done check or a passing row.
- **Captions** are neutral: the spoken word turns ink, the rest waits in grey (the theme does this).
- **Real logos, never generic icons** for named tech (`scripts/logo.mjs`). Few, big things; one idea per beat.
- **Wide stage:** every beat `stage="wide"`, authored in 1920×1080, content in x 64–1856, y 40–880. It plays in portrait and square too (scaled), but these videos are made for 16:9.
- `kicker="AUTH · SESSION CACHE"` on each beat: the topic, top-left, small.

## Layout rules

`tsvg check` measures overlapping text, text off the frame and narration longer than its beat; fix every warning. The rest is on you:

1. **Centre the composition** on the stage and fill most of its height; shift a whole beat with a `<group y="…">` rather than nudging pieces.
2. **One grid per beat:** siblings share size, centre line and equal gaps (compute positions from the stage width and item count).
3. **Breathing room:** ≥ 24 px between separate things, ≥ 40 px between groups. Overlap only when it is the point (a packet on a wire, a ring on a control).
4. **Readable at 720p:** text ≥ 22 px, code ≥ 28 px (`size="28"` on `tx:code`), numbers and chips ≥ 26 px on the 1080 layout. If it has to be smaller, cut it.
5. **Labels touch what they label** (beside it, or on a leader `tx ty`), never on a line or another label.
6. **Connectors are smooth:** straight for neighbours, an S-curve `C` for a level change (`M x1 y1 C mx y1 mx y2 x2 y2`), leaving and entering tiles horizontally, stopping just off each tile (± 85 for a 170 tile).
7. **Real UI shows one control at a time:** zoom to it (beat `zoom zx zy`) as it's named, ring it (`tx:shot box mark tag`); never talk over a whole static page.
8. **Reveals land on the word**, and the ending holds ~1.5 s after the last word (`pad="1.5"` on the last beat).

## Components (`$TSVG lib tech` for every prop)

| Use | Component |
|---|---|
| a named technology / service | `tx:tile` (`src="logos/x.png"`, `dark="1"` for black logos, `glyph` for own services) |
| a call between them | `tx:wire` + `tx:packet` (label: `POST /login`, `A7F3`) |
| a file, table, key, number | `tx:label` (`mono="1"`, `sub` = the source, `tx ty` leader) |
| the code that proves it / rows written | `tx:code` (`lines="text :: hl \| text :: ok \| text :: bad"`, `mark` = when they light, `size="28"`) |
| the real app | `tx:shot` (`box` from capture's boxes.json, `tag`, `mark`) + beat `zoom` |
| what a user sees | `tx:phone` / `tx:window` with drawn content |
| machines, queues, places | `tx:box`, `tx:room`, your own shapes |
| the ending | `tx:sum` (rich text, `[words]($focus)`), `tx:qs` (`done :: … \| open :: …`, `openat`) |

Timing: chunk *n* of beat `b` is voice line `b.n` → `at="=cue('b.2')"`, `cueEnd('b.2')`, `sdur`. Functions: `tx:on(a, b)` (focus window → `hl`), `tx:fade(a, b, 0.35)` (step back → `op`), `tx:grow(a, d)` (0 → 1 for your own moves). Theme tokens: `$ink $line $muted $dim $tile $shade $bg $focus $soft $ok $oksoft $bad $badsoft $pale $mid $deep`; fonts `Outfit`, `JetBrains Mono`.

## Gotchas

- **Two blues = no focus.** When something new turns blue, the previous `tx:on(a, b)` must end at or before it.
- **Black logos vanish on dark:** `dark="1"` on the tile; check one frame with `--theme oizom-dark`.
- **Code with `{ }`:** `tx:code` lines are literal. In your own `<text>`, start the value with `\` to make it literal (TSVG reads `{…}` as an expression and a leading `=` as one).
- **Props and expressions:** `at`, `mark`, `openat`, `hl`, `op`, `x`, `y` accept `=cue(…)` / `=tx:on(…)`; `step`, `sweep`, `size`, `w`, `h` take plain numbers.
- **Kokoro mispronounces some names:** write the chunk the way it should sound, keep the real word in the picture.
- **Screenshot boxes drift** when data changes between captures: recapture.
- **Don't overclaim.** "The one place that writes X" only after grepping every writer.
- Keep `dur="auto"` on beats (the default) so chunks follow the voice.

## Files

- `scripts/capture.mjs` + `capture.config.example.mjs` — real UI screenshots + control boxes (Playwright, read-only).
- `scripts/logo.mjs` — real logos per video, SVG + PNG.
- `references/research.md`, `references/scenes.md` — how to research, what to draw.
- `assets/` — rendered sheets of the example and the recipes. The example source: `examples/styles/codebase-explainer.tsvg` in the TSVG repo (`$TSVG new <dir> --style codebase-explainer`).
