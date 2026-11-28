# Codebase scene recipes

Pictures for explaining code to the team. All beats use `stage="wide"`: coordinates are the 1920×1080 frame, content inside **x 64–1856, y 40–880** (the caption owns the band below). Portrait and square scale the same beat down automatically.

These are a vocabulary, not a menu. For every sentence ask "what picture makes this obvious?" — if none of these fits, draw it (see the end of this file and `../../tech-explainer/references/scenes.md` for 22 more general recipes: rooms, devices, stacks, crowds, tokens, timelines).

House rules for every recipe:
- **One blue thing at a time** (`hl="=tx:on(a, b)"`): the thing the current chunk names. Red only for removed / failed (`$bad`, strike); green only for a done check.
- **Arrive on the word** (`at="=cue('a.2')"`), never early. Earlier pieces stay (context) — step them back with `op="=tx:fade(a, b, 0.35)"` rather than removing them.
- **Real logos** for named tech (`scripts/logo.mjs` → `logos/*.png`), a glyph tile (initials) for the team's own services, never a stock icon for a named product.
- Paths and names in `sub` lines are real (`api/src/auth`), but only inside the target repo's own work folder (see SKILL.md, Privacy).

---

### 1. Flow — who calls whom
The workhorse: logo tiles + wires + a packet with the call on it. Grow it left to right as the voice walks the flow; keep it on screen for the next beats.
```xml
<tx:beat id="f" stage="wide" kicker="AUTH · LOGIN" say="When you log in, the web app / sends your email and password to the API.">
  <tx:tile x="560" y="420" src="images/logos/svelte.png" label="Web app" sub="svelte" at="=cue('f.0')" hl="=tx:on(cue('f.0') + 0.3, cue('f.1'))"/>
  <tx:wire d="M645 420 L1275 420" at="=cue('f.1')" hl="=tx:on(cue('f.1'), sdur)"/>
  <tx:packet x1="645" y1="420" x2="1275" y2="420" label="POST /login" at="=cue('f.1') + 0.4" d="1.6"/>
  <tx:tile x="1360" y="420" src="images/logos/deno.png" dark="1" label="API" sub="api/src/auth" at="=cue('f.1') + 0.2"/>
</tx:beat>
```

### 2. Code proof — the line that makes it true
Show the real code at the moment the claim is made, with the one line that proves it in focus. Never read the card aloud; the voice says what it means.
```xml
<tx:beat id="c" stage="wide" say="The key lives for fifteen minutes, / that's the ttl of 900 seconds.">
  <tx:code x="360" y="300" w="1200" size="30" title="api/src/auth/session.ts:41" at="=cue('c.0')" mark="=cue('c.1')"
           lines="// keep the session close to the API | await cache.set(key, session, |   { ttl: 900 })  // seconds :: hl"/>
  <tx:label x="1660" y="560" text="15 min" mono="1" size="48" at="=cue('c.0') + 0.3" hl="=tx:on(cue('c.0') + 0.3, cue('c.1'))"/>
</tx:beat>
```

### 3. Rows written — what lands in the database
One row per write, in order: `TABLE.COLUMN ← value`. Use the focus row for the value the voice is on.
```xml
<tx:beat id="w" stage="wide" say="Then it writes one row to sessions / and stamps the user's last login.">
  <tx:code x="460" y="320" w="1000" size="30" title="writes · in order" at="=cue('w.0')" mark="=cue('w.0') + 0.4"
           lines="sessions.id          ← 42 :: hl | sessions.user_id     ← 7 | sessions.expires_at  ← now + 7 days"/>
  <tx:code x="460" y="580" w="1000" size="30" title="then" at="=cue('w.1')" mark="=cue('w.1') + 0.3"
           lines="users.last_login_at  ← now :: hl"/>
</tx:beat>
```

### 4. The real UI — one control at a time
A screenshot from `scripts/capture.mjs` (1920×1080) in a browser window, with a focus ring on the control being named (`box` comes straight from `shots/boxes.json`; capture.mjs writes 1920×1080 PNGs, so no cropping — a 16:10 image like this sample is centre-cropped to 16:9 and its box shifts). Zoom toward it with the beat's `zoom zx zy` so its text is ≥ 20 px on screen.
```xml
<tx:beat id="u" stage="wide" zoom="1.3" zx="1220" zy="180" say="On the repository page, / the Star button / sends one request.">
  <tx:shot x="460" y="70" w="1000" src="images/ui-github.jpg" url="github.com/acme/web" box="0.825 0.152 0.055 0.034" mark="=cue('u.1')" tag="Star" at="0.1"/>
</tx:beat>
```

### 5. State change — before → after
The same object twice in time: strike the old value (red), focus the new one (blue). For cache clears, status changes, migrations, permission flips.
```xml
<tx:beat id="s" stage="wide" say="Logging out deletes that key / at once.">
  <tx:tile x="760" y="420" src="images/logos/redis.png" label="Redis" at="0.1"/>
  <tx:label x="1160" y="420" text="session:42" mono="1" size="40" at="0.2" hl="=tx:on(cue('s.0'), cue('s.0') + 1)" op="=1 - 0.6*tx:grow(cue('s.1'), 0.3)"/>
  <line x1="1040" y1="420" x2="1280" y2="420" stroke="$bad" sw="7" at="=cue('s.0') + 0.9"><anim prop="draw" from="0" to="1" dur="0.3"/></line>
  <tx:label x="1160" y="560" text="DEL session:42" mono="1" at="=cue('s.0') + 0.9" hl="=tx:on(cue('s.0') + 0.9, sdur)"/>
</tx:beat>
```

### 6. Scale — a number with its source, drawn to proportion
`ttl: 900` → "fifteen minutes"; 1 row vs 21; 60 s vs 1 h. Draw both bars to scale and label each with where the number comes from.
```xml
<tx:beat id="n" stage="wide" say="A cache hit takes about one millisecond. / A Postgres read takes about twenty.">
  <tx:label x="380" y="360" text="Redis" sub="p50 · metrics" at="=cue('n.0')"/>
  <rect x="520" y="340" w="40" h="44" r="6" fill="$focus" at="=cue('n.0') + 0.2"><anim prop="w" from="0" to="40" dur="0.4" ease="out"/></rect>
  <tx:label x="380" y="520" text="Postgres" sub="p50 · metrics" at="=cue('n.1')"/>
  <rect x="520" y="500" w="800" h="44" r="6" fill="$mid" at="=cue('n.1') + 0.2"><anim prop="w" from="0" to="800" dur="0.8" ease="out"/></rect>
  <tx:label x="1460" y="520" text="≈ 20×" mono="1" size="44" at="=cue('n.1') + 1" hl="=tx:on(cue('n.1') + 1, sdur)"/>
</tx:beat>
```

### 7. What the user sees — a drawn device
When the point is what reaches a person (a mail, an alert, a form), draw a phone with a mock screen instead of a screenshot.
```xml
<tx:beat id="d" stage="wide" say="The user gets an alert / with the device name and the value.">
  <tx:phone x="780" y="140" w="320" h="640" tilt="-12" at="0.1" hl="=tx:on(cue('d.0'), cue('d.1'))">
    <rect x="20" y="90" w="252" h="120" r="16" fill="$soft" at="=cue('d.0') + 0.3"><anim prop="opacity" from="0" to="1" dur="0.3"/></rect>
    <text x="40" y="130" size="24" weight="700" font="Outfit" fill="$ink" text="Alert · Sensor 3" at="=cue('d.0') + 0.3"/>
    <text x="40" y="170" size="22" font="JetBrains Mono" fill="$ink" text="PM2.5 = 182" at="=cue('d.1')"/>
  </tx:phone>
  <tx:packet x1="300" y1="460" x2="760" y2="460" label="push" at="=cue('d.0')" d="1"/>
</tx:beat>
```

### 8. Machines and places — draw them
A server, a queue, a device on a wall: isometric boxes with a label on a leader. Use `tx:room` when it matters where something physically is.
```xml
<tx:beat id="m" stage="wide" say="Jobs wait in a queue / until a worker picks them up.">
  <group repeat="5" as="k"><tx:box x="=560 + k*70" y="=420 - k*40" w="60" d="60" h="40" at="=cue('m.0') + 0.1*k"/></group>
  <tx:box x="1300" y="300" w="160" d="160" h="220" at="=cue('m.1')"/>
  <tx:label x="700" y="250" text="jobs" mono="1" sub="queue" tx="700" ty="360" at="=cue('m.0') + 0.4"/>
  <tx:label x="1300" y="160" text="worker" sub="1 of 3" tx="1300" ty="290" at="=cue('m.1') + 0.3" hl="=tx:on(cue('m.1') + 0.3, sdur)"/>
</tx:beat>
```

### 9. The ending — In short, then checked / open
Every video ends plainly. A summary a teammate could repeat in standup; then, for investigations, what we checked (✓, and how) and what is still open (dashed, in focus).
```xml
<tx:beat id="e" stage="wide" pad="1.5" say="So Postgres stays the source, / and Redis only holds a short copy. / One thing we have not checked: / what happens when Redis is down.">
  <group y="=-140*tx:grow(cue('e.2') - 0.2, 0.5)">
    <tx:sum x="960" y="380" w="1200" text="[Postgres]($focus) is the source. Redis holds a [short copy]($focus)." at="0.1"/>
  </group>
  <tx:qs x="410" y="440" w="1100" at="=cue('e.2')" openat="=cue('e.3')" items="done :: Logout deletes the key — read in the code | open :: What happens when Redis is down? — not checked"/>
</tx:beat>
```

## Drawing your own

Anything not covered: draw it with plain TSVG shapes in the theme tokens — `$ink` outlines 3–4 px, flat `$tile`/`$pale`/`$mid` fills, one offset `$shade` slab as the shadow, isometric (`tx:box`, `tx:room`, `tilt`) when depth helps; no gradients, no clip-art. A drawn object takes `$focus` only while it is the thing being said. Look at `../../tech-explainer/assets/` for how far simple drawn scenes can go.
