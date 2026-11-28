# Research — every claim from the code

A codebase video is only as good as its facts. Every sentence must trace to `file:line`, a real screen, or the human. Do this before writing a word of script.

## 1. Fan out read-only agents

Keep file dumps out of your own context: send read-only agents, one per side, and ask each for facts with `file:line`, marking anything **inferred**.

- **Backend.** Every endpoint in the flow → the database / cache / queue calls → each write in order (table, columns, values), the checks and their exact error text, caches and their expiry, what is NOT written, who owns what.
- **Frontend.** The pages, button labels, what each picker lists, which API call each button makes, permission gating.
- **Writers.** Before saying "the only place that changes X", grep **every** writer of X (all `INSERT` / `UPDATE` / `.set(` / `DEL` on that table or key). Name them, or don't claim uniqueness.

Brief each agent with the flow in one line, the repo path, and the exact output wanted (a list of facts, each with `file:line` and `inferred: yes/no`).

## 2. Ask the human what code can't say

Why the feature exists, what a domain word means, which device / org / test account to show, which screen area to redact. **A wrong "why" is the most likely error in these videos.** Ask; don't guess.

## 3. Real screens (when the UI is the point)

`scripts/capture.mjs` takes 1920×1080 screenshots and measures controls:

```sh
cp <skill>/scripts/capture.mjs <skill>/scripts/capture.config.example.mjs <work>/
mv <work>/capture.config.example.mjs <work>/capture.config.mjs   # edit: baseUrl, login, shots, boxes
cd <work> && node capture.mjs            # → shots/<file>.png + shots/boxes.json (pixels + a ready "box" string)
```

- **Read-only.** Open pickers and tabs; never save, submit or delete. Log in once per run. Local dev server and a **test account** only; credentials from env, never in a file.
- Open every PNG and check it shows what you expect. Boxes drift when data changes between captures: recapture, don't nudge.
- Use it in the video as `<tx:shot src="shots/orders-list.png" box="<boxes.json box>" tag="New Order" mark="=cue('b2.1')"/>`.
- Redact the signed-in user's name / avatar: a `$tile` rect over that area inside the shot's slot position, measured per app.

## 4. Real logos

```sh
cp <skill>/scripts/logo.mjs <work>/ && cd <work> && node logo.mjs postgres redis deno svelte mqtt
# → logos/<name>.svg + logos/<name>.png (devicon colour first, Simple Icons in brand colour as fallback)
```

Use the PNG: `<tx:tile src="logos/postgres.png" label="Postgres"/>`. Known aliases: postgres pg redis cassandra influx sqlite deno hono svelte sveltekit tailwind typescript node zod mqtt firebase aws s3 gemini docker github android capacitor playwright monaco handlebars; any other name is tried as-is (`node logo.mjs stripe`). Black logos (deno, github): `dark="1"` on the tile so they invert on editor-dark. The team's own services: their framework's logo + the service name as the label. Nothing found → `glyph="EZ"` (initials), never a stock icon.

## 5. Numbers

Only numbers with a source: a constant in the code (`ttl: 900` → "fifteen minutes"), a config value, a measured metric (and where it was measured). Never rounded for effect. Put the source in the label's `sub` ("p50 · metrics", "session.ts:41").

## 6. What goes in the open-questions list

Anything you could not verify: behaviour that depends on production config, an untested failure path, a "probably". The ending lists it as an open row (`tx:qs`), with who could answer it if known. Saying "not checked" is a feature of these videos, not a weakness.
