# Scene recipes — the picture grammar

Every beat is one of these recipes (or two in sequence: a wide state, then a detail that pops in on a later chunk). They come from the 22 reference reels; the "seen in" line says where. All coordinates are **stage coordinates**: 1080 wide, visual zone y 250–1300 (the portrait frame). The same beat plays in 16:9, 9:16 and 1:1 (see `formats.md`).

Rules that hold for every recipe:
- **One green thing at a time** (`hl`), and it is what the current chunk names.
- **Things arrive on the word that names them** (`at="=cue('b2.1')"`); nothing arrives early "to fill space".
- **Earlier things step back** instead of vanishing: `op="=tx:fade(cue('b4.1'), sdur, 0.3)"`.
- **Adjacent beats use different recipes** (a hub, then a versus, then a stat), and the payoff beat is the calmest one.
- Real logos go in tiles: `src="images/chrome.png"` (PNG/WebP, transparent, ~256 px). The snippets use Lucide `icon`s so they run anywhere.

---

### 1. Device hook — the everyday moment
Seen in: 931 GB (laptop "Local Disk"), GTA 6 (TV download bar), auto-rotate (phone). Use for: beat 1.
```xml
<tx:beat id="r1" say="You bought a one terabyte drive, / but Windows shows / only 931 gigabytes.">
  <tx:window x="150" y="560" w="780" h="430" title="This PC" tilt="30" at="0.1">
    <text x="30" y="70" size="34" weight="700" font="Outfit" fill="$ink" text="Local Disk (E:)"/>
    <rect x="30" y="110" w="660" h="26" r="13" fill="$shade"/>
    <rect x="30" y="110" w="600" h="26" r="13" fill="$green" at="=cue('r1.1')"><anim prop="w" from="0" to="600" dur="0.6" ease="out"/></rect>
    <text x="30" y="220" size="110" weight="800" font="Outfit" fill="$ink" text="931 GB" at="=cue('r1.2')"/>
  </tx:window>
  <tx:stat x="540" y="380" value="1 TB?" size="110" at="=cue('r1.0') + 0.4"/>
</tx:beat>
```

### 2. Logo wall → one
Seen in: browsers ("There are millions of apps out there"). Use for: "there are many X, but…".
```xml
<tx:beat id="r2" say="There are millions of apps, / but only a few / browser engines.">
  <group repeat="20" as="k">
    <tx:tile x="=180 + (k % 5)*180" y="=380 + floor(k/5)*160" icon="app-window" size="120" at="=0.05*k" op="=tx:fade(cue('r2.1'), sdur, 0.2)"/>
  </group>
  <tx:tile x="540" y="1110" icon="globe" size="170" label="Engine" at="=cue('r2.2')" hl="=tx:on(cue('r2.2'), sdur)"/>
</tx:beat>
```

### 3. Hub and spokes — one thing under many
Seen in: Chromium under Chrome/Edge/Opera/Brave/Samsung. Use for: platforms, shared engines, one server many clients.
```xml
<tx:beat id="r3" say="Chrome, Edge, Opera and Brave / are all built on one project, / called Chromium.">
  <tx:wire d="M540 560 L260 820" at="=cue('r3.1')"/><tx:wire d="M540 560 L440 900" at="=cue('r3.1') + 0.1"/>
  <tx:wire d="M540 560 L640 900" at="=cue('r3.1') + 0.2"/><tx:wire d="M540 560 L820 820" at="=cue('r3.1') + 0.3"/>
  <tx:tile x="260" y="820" icon="aperture" size="130" at="0.1"/><tx:tile x="440" y="900" icon="globe" size="130" at="0.3"/>
  <tx:tile x="640" y="900" icon="circle" size="130" at="0.5"/><tx:tile x="820" y="820" icon="shield" size="130" at="0.7"/>
  <tx:tile x="540" y="560" icon="aperture" size="190" color="$green" at="=cue('r3.1')" hl="=tx:on(cue('r3.2'), sdur)"/>
  <tx:label x="540" y="380" text="Chromium" sub="open source, from Google" tx="540" ty="460" at="=cue('r3.2')"/>
</tx:beat>
```

### 4. Two families — the exceptions, named
Seen in: Safari → WebKit, Firefox → Gecko (gear pills). Use for: "only two do it differently".
```xml
<tx:beat id="r4" say="Only Safari and Firefox / use their own engines, / called WebKit and Gecko.">
  <tx:tile x="300" y="640" icon="compass" size="170" label="Safari" at="=cue('r4.0')" hl="=tx:on(cue('r4.2'), cue('r4.2') + 0.8)"/>
  <tx:tile x="780" y="640" icon="flame" size="170" label="Firefox" at="=cue('r4.0') + 0.3" hl="=tx:on(cue('r4.2') + 0.8, sdur)"/>
  <tx:wire d="M300 790 L300 860" at="=cue('r4.2')"/><tx:pill x="300" y="900" text="WebKit" kind="gear" at="=cue('r4.2')"/>
  <tx:wire d="M780 790 L780 860" at="=cue('r4.2') + 0.8"/><tx:pill x="780" y="900" text="Gecko" kind="gear" at="=cue('r4.2') + 0.8"/>
</tx:beat>
```

### 5. Versus — the same thing counted two ways
Seen in: "1 KB maker" vs "1 KB Windows" (+2.4 %), the balance scale (Google vs Bing clicks). Use for: why_number, A vs B.
```xml
<tx:beat id="r5" say="The box counts a kilobyte / as 1,000 bytes, / but Windows uses 1,024.">
  <tx:label x="300" y="420" text="1 KB" sub="the box: 1,000 bytes" size="48" at="=cue('r5.0')" hl="=tx:on(cue('r5.1'), cue('r5.2'))"/>
  <tx:box x="300" y="540" w="170" d="170" h="150" at="=cue('r5.0') + 0.3"/>
  <tx:label x="780" y="420" text="1 KB" sub="Windows: 1,024 bytes" size="48" at="=cue('r5.2')" hl="=tx:on(cue('r5.2'), sdur)"/>
  <tx:box x="780" y="540" w="174" d="174" h="154" top="$pale" left="$mid" right="$deep" at="=cue('r5.2') + 0.2"/>
  <tx:pill x="540" y="1000" text="+2.4% per step" kind="dark" at="=cue('r5.2') + 0.8"/>
</tx:beat>
```

### 6. Name → number (a translation)
Seen in: the DOM tree labels, "kilo = 1,000". Use for: one thing is another thing (domain → IP, code → DOM).
```xml
<tx:beat id="r6" say="But computers don't know names. / They only know numbers, / called IP addresses.">
  <tx:label x="540" y="500" text="example.com" size="48" at="0.1" hl="=tx:on(cue('r6.0'), cue('r6.1'))"/>
  <tx:wire d="M540 550 L540 790" at="=cue('r6.1')"/>
  <tx:label x="540" y="850" text="93.184.215.14" mono="1" size="52" sub="IP address" at="=cue('r6.1') + 0.3" hl="=tx:on(cue('r6.2'), sdur)"/>
</tx:beat>
```

### 7. The hidden part, labelled (wide → detail)
Seen in: the accelerometer chip ("Proof mass", "about the size of a grain of rice"), the RTC crystal. Use for: naming the component that does the work. Zoom in on it across the beat.
```xml
<tx:beat id="r7" zoom="1.25" zx="540" zy="700" say="Inside is a tiny chip / about the size / of a grain of rice.">
  <tx:box x="540" y="520" w="380" d="380" h="40" at="0.1"/>
  <tx:box x="540" y="650" w="90" d="90" h="30" top="$lime" left="$deep" right="$green" at="=cue('r7.0')"/>
  <tx:label x="820" y="460" text="Accelerometer" sub="≈ 3 × 3 mm" tx="580" ty="660" at="=cue('r7.1')" hl="=tx:on(cue('r7.1'), sdur)"/>
</tx:beat>
```

### 8. Stack for scale — a pile you can feel
Seen in: Chrome's 35 M lines as a paper tower, security fixes every week, server racks. Use for: big counts, effort, size.
```xml
<tx:beat id="r8" say="A browser engine / is over 35 million lines of code.">
  <group repeat="14" as="k"><tx:box x="380" y="=1080 - k*44" w="220" d="220" h="40" at="=0.08*k"/></group>
  <tx:stat x="760" y="560" value="35M" sub="lines of code" size="120" at="=cue('r8.1')"/>
</tx:beat>
```

### 9. Their own words — the document
Seen in: Meta's privacy policy ("Battery level", "Signal strength"), the 2018 internal deck, court papers. Use for: proof, policies, quotes. Pair with the device it's about.
```xml
<tx:beat id="r9" say="Here is what / their own policy says / they collect.">
  <tx:doc x="80" y="400" title="Privacy Policy" quotes="Battery level | Signal strength | App and file names" from="Section 2 · what we collect" at="=cue('r9.1')" step="0.7"/>
  <tx:phone x="640" y="430" tilt="-20" at="0.1">
    <rect x="20" y="70" w="230" h="140" r="16" fill="$pale"/><rect x="20" y="230" w="180" h="18" r="9" fill="$shade"/>
  </tx:phone>
</tx:beat>
```

### 10. Flow chain — a packet travels
Seen in: torrents (peers), the tracking pixel round trip, DNS. Use for: what_happens stops, request/response.
```xml
<tx:beat id="r10" say="Your laptop asks the server, / and the answer / comes straight back.">
  <tx:tile x="220" y="760" icon="laptop" label="You" at="0.1" hl="=tx:on(cue('r10.0'), cue('r10.1'))"/>
  <tx:tile x="860" y="760" icon="server" label="Server" at="0.2" hl="=tx:on(cue('r10.1'), cue('r10.2'))"/>
  <tx:wire d="M305 730 L775 730" at="=cue('r10.0') + 0.3"/><tx:wire d="M775 790 L305 790" at="=cue('r10.1')"/>
  <circle x="=lerp(305, 775, tx:grow(cue('r10.0') + 0.5, 1))" y="730" r="12" fill="$green" when="=T &gt; cue('r10.0') + 0.5 &amp;&amp; T &lt; cue('r10.1')"/>
  <circle x="=lerp(775, 305, tx:grow(cue('r10.2'), 1))" y="790" r="12" fill="$lime" stroke="$ink" sw="2" when="=T &gt; cue('r10.2')"/>
</tx:beat>
```

### 11. Locked boxes — separation
Seen in: browser sandboxes ("each site locked away"). Use for: isolation, permissions, containers.
```xml
<tx:beat id="r11" say="Each site runs / in its own locked box, / called a sandbox.">
  <tx:box x="260" y="640" w="170" d="170" h="70" at="=cue('r11.0')"/><tx:box x="540" y="580" w="170" d="170" h="70" at="=cue('r11.0') + 0.2"/><tx:box x="820" y="640" w="170" d="170" h="70" at="=cue('r11.0') + 0.4"/>
  <tx:tile x="260" y="880" icon="lock" size="90" at="=cue('r11.1')"/><tx:tile x="540" y="820" icon="lock" size="90" at="=cue('r11.1') + 0.15"/><tx:tile x="820" y="880" icon="lock" size="90" at="=cue('r11.1') + 0.3"/>
  <tx:label x="540" y="430" text="Sandbox" sub="each site locked away" at="=cue('r11.2')" hl="=tx:on(cue('r11.2'), sdur)"/>
</tx:beat>
```

### 12. One of many — the crowd
Seen in: 270,000 quiz takers, a city of houses (212 PB), Google's copy of the web. Use for: one person among a number, scale of a population.
```xml
<tx:beat id="r12" say="About 270,000 people / took the quiz.">
  <group repeat="96" as="k"><circle x="=200 + (k % 12)*62" y="=480 + floor(k/12)*62" r="18" fill="=k == 41 ? $green : $mid" at="=0.012*k"><anim prop="scale" from="0" to="1" dur="0.2" ease="back"/></circle></group>
  <tx:stat x="540" y="1080" value="270,000" sub="people" size="110" at="=cue('r12.0') + 0.5"/>
</tx:beat>
```

### 13. Big number — the payoff (stay still)
Seen in: "60×", "$391.5M · 40 states", "$3,135,000". Use for: the moment the answer lands. No zoom, few elements.
```xml
<tx:beat id="r13" say="That cost them / $391 million.">
  <tx:stat x="540" y="740" value="$391.5M" sub="paid to 40 states" size="150" at="=cue('r13.1')"/>
</tx:beat>
```

### 14. Recap — the steps as one line
Seen in: endings before the follow card. Use for: the last beat before `tx:follow`.
```xml
<tx:beat id="r14" say="Name, number, / handshake, packets.">
  <tx:pill x="540" y="560" text="1 · DNS lookup" at="=cue('r14.0')"/><tx:pill x="540" y="680" text="2 · Connect" at="=cue('r14.0') + 0.4"/>
  <tx:pill x="540" y="800" text="3 · TLS handshake" at="=cue('r14.1')"/><tx:pill x="540" y="920" text="4 · Packets → page" at="=cue('r14.1') + 0.4"/>
</tx:beat>
```

### 15. Headline + diagram
Seen in: torrents ("More people, more speed."). Use for: stating the claim while the diagram proves it; good for landscape title beats.
```xml
<tx:beat id="r15" say="More people sharing / means more speed.">
  <tx:headline text="More people," text2="more speed." y="330" at="0.1"/>
  <group repeat="5" as="k"><tx:tile x="=180 + k*180" y="620" icon="laptop" size="110" at="=0.15*k"/></group>
  <tx:tile x="540" y="900" icon="gauge" size="170" color="$green" at="=cue('r15.1')" hl="=tx:on(cue('r15.1'), sdur)"/>
</tx:beat>
```

### 16. Room cutaway — tech in a real place
Seen in: Wi-Fi motion sensing (living room, bedroom), auto-rotate (couch), smart TV. Use for: anything that happens at home or at a desk; put people and devices in it.
```xml
<tx:beat id="r16" plate="1" say="Your router's signal / fills the whole room / and bounces off you.">
  <tx:room x="540" y="560" w="560" d="460" h="300" at="0.1"/>
  <tx:box x="420" y="720" w="160" d="80" h="60" at="0.3"/>
  <tx:tile x="420" y="660" icon="router" size="90" at="=cue('r16.0')" hl="=tx:on(cue('r16.0'), cue('r16.1'))"/>
  <circle x="420" y="660" r="40" fill="none" stroke="$green" sw="4" at="=cue('r16.1')"><anim prop="r" from="40" to="420" dur="1.6"/><anim prop="opacity" from="1" to="0" dur="1.6"/></circle>
  <tx:tile x="700" y="880" icon="person-standing" size="120" at="=cue('r16.2')" hl="=tx:on(cue('r16.2'), sdur)"/>
</tx:beat>
```

### 17. Timeline of chips — history, one era per beat
Seen in: Dota 2 → ChatGPT (2016 AlphaGo, 2019 OpenAI Five, G · 2017 paper, 2022 ChatGPT), keygens (1980s), Wi-Fi (2025). Use for: `news_explained`, `connection`, anything with dates. The chip sits top-left/top-right of the scene it dates.
```xml
<tx:beat id="r17" say="In 2017, / Google published a paper / called Attention Is All You Need.">
  <tx:chip x="300" y="420" text="2017" icon="search" at="=cue('r17.0')" hl="=tx:on(cue('r17.0'), cue('r17.1'))"/>
  <tx:doc x="540" y="480" w="380" title="Attention Is All You Need" lines="5" from="Google · 2017" at="=cue('r17.1')"/>
</tx:beat>
```

### 18. Debugger / code — the line that matters
Seen in: keygens (debugger, the serial check in red, "Reverse engineering", "Crack"). Use for: how software decides, a bug, a check, an exploit (explained, never as instructions).
```xml
<tx:beat id="r18" say="The debugger shows / the exact check / that rejects the key.">
  <tx:code x="140" y="560" w="800" title="Debugger" at="=cue('r18.0')" mark="1.6" lines="1A20  push ebp | 1A23  mov eax, [serial] :: ok | 1A26  add eax, [serial+4] :: ok | 1A30  cmp edx, [check] :: bad | 1A33  jne bad_serial :: bad | 1A35  mov al, 1"/>
  <tx:label x="820" y="460" text="The check" tx="820" ty="780" at="=cue('r18.1')" hl="=tx:on(cue('r18.1'), sdur)"/>
</tx:beat>
```

### 19. Tokens — how a model reads
Seen in: Dota 2 → ChatGPT ("The bot won because it trained", attention arcs). Use for: AI, text processing, parsing, anything split into pieces.
```xml
<tx:beat id="r19" say="The model reads / all the words at once.">
  <tx:tokens x="540" y="760" items="The | bot | won | because | it | trained" at="=cue('r19.0')" sweep="0.35"/>
  <tx:label x="540" y="960" text="Transformer" at="=cue('r19.1')" hl="=tx:on(cue('r19.1'), sdur)"/>
</tx:beat>
```

### 20. File cards — sizes compared
Seen in: keygens (song.xm 60 KB vs song.mp3 3 MB, "around 50 times bigger"). Use for: formats, compression, storage.
```xml
<tx:beat id="r20" say="The tracker song is 60 kilobytes. / The same song as an MP3 / is around 50 times bigger.">
  <tx:tile x="320" y="640" icon="file-music" size="200" label="song.xm" sub="60 KB" at="=cue('r20.0')" hl="=tx:on(cue('r20.0'), cue('r20.1'))"/>
  <tx:tile x="760" y="640" icon="audio-waveform" size="200" label="song.mp3" sub="3 MB" at="=cue('r20.1')" hl="=tx:on(cue('r20.1'), sdur)"/>
  <rect x="220" y="960" w="40" h="30" r="6" fill="$green" at="=cue('r20.2')"/>
  <rect x="220" y="1020" w="640" h="30" r="6" fill="$mid" at="=cue('r20.2') + 0.3"><anim prop="w" from="40" to="640" dur="0.8" ease="out"/></rect>
</tx:beat>
```

### 21. Device row — every one of them
Seen in: Wi-Fi ("Every Wi-Fi chip already makes that measurement": routers, mesh points, chips above each). Use for: "all of these have X", standards, compatibility.
```xml
<tx:beat id="r21" say="Every Wi-Fi chip / already makes that measurement.">
  <group repeat="5" as="k"><tx:box x="=170 + k*185" y="720" w="88" d="88" h="90" at="=cue('r21.0') + 0.12*k"/></group>
  <group repeat="5" as="k"><tx:tile x="=170 + k*185" y="600" icon="cpu" size="80" at="=cue('r21.1') + 0.1*k" hl="=tx:on(cue('r21.1') + 0.1*k, sdur)"/></group>
</tx:beat>
```

### 22. Full-bleed world — the frame as a window
Seen in: the Dota map, a city of houses (212 PB), server farms, the keygen-intro wall, the music-file wall. The scene runs past the frame edges and the beat drifts across it (`zoom` with an off-centre `zx`). Use for: scale and immersion, once or twice per video. Turn on `plate="1"` so the caption stays readable.
```xml
<tx:beat id="r22" plate="1" zoom="1.2" zx="300" zy="700" say="Every one of these houses / downloads the same game.">
  <group repeat="60" as="k"><tx:box x="=-120 + (k % 10)*150 + (floor(k/10) % 2)*75" y="=300 + floor(k/10)*170" w="80" d="80" h="50" top="=k == 23 ? $lime : $tile" at="=0.015*k"/></group>
</tx:beat>
```

## Beyond the recipes — invent

The recipes are a vocabulary, not a menu. The reference reels keep inventing: a person at a desk who opens and closes the video, a TV mid-download, a scale weighing likes, a road with a barrier that a packet can't pass, a crowd of 161 study participants, a Wi-Fi wave bouncing off a body, a chess board turning into a game map. Do the same:
- **Ask what the thing looks like in real life**, then draw that simply (boxes, rooms, tiles, windows, documents and your own `path`s in the theme colours).
- **Combine recipes** inside one beat (a room + a phone with the alert + a label), and change one thing per chunk.
- **Make metaphors physical** for ideas that have no picture: a balance scale for "worth more", a barrier for "blocked", a stack for "a lot", a crowd for "people".
- **Bookend:** open and close on the same object or person; the last line can call back to the topic (the Dota reel signs off "GG,").
- Keep the house rules (paper, ink, one green focus, sync to the voice, calm motion). Everything else is yours.

### Follow card (always last)
```xml
<tx:follow id="end" channel="Your Channel" say="Follow Your Channel, / and next time, / I'll show you what a cookie / really remembers."/>
```

## Motion vocabulary

| Move | How | Use |
|---|---|---|
| pop in | every component does it on `at` | default arrival |
| draw on | `tx:wire`, label leaders | connections, "this points to that" |
| fill / count | `<anim prop="w">` on a bar, `stat` swipe | progress, numbers |
| step back | `op="=tx:fade(a, b, 0.3)"` | old context while new talks |
| focus | `hl="=tx:on(a, b)"` | the thing being named |
| push in | beat `zoom="1.15" zx zy` | detail beats, tension (never two beats in a row) |
| travel | a circle on `lerp(…, tx:grow(a, d))` | packets, data, money moving |
| stagger | `repeat` + `at="=0.05*k"` | walls, crowds, stacks |

Don't: loop things forever, shake, spin, bounce text, use more than one accent colour, or show something the voice hasn't reached yet.
