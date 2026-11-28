import { P, box, face, floor, wallX, wallY, pop, fadeIn, G, doc, write, NEU, house } from './gen.mjs';

// 1 · a hex viewer: rows of bytes, the first row (the file's signature) marked
const hex = ['FF D8 FF E0 00 10 4A 46 49 46 00 01 :: hl', '01 01 00 48 00 48 00 00 FF DB 00 43', '00 08 06 06 07 06 05 08 07 07 07 09', '09 08 0A 0C 14 0D 0C 0B 0B 0C 19 12', '13 0F 14 1D 1A 1F 1E 1D 1A 1C 1C 20', '24 2E 27 20 22 2C 23 1C 1C 28 37 29', '2C 30 31 34 34 34 1F 27 39 3D 38 32', '3C 2E 33 34 32 FF DB 00 43 01 09 09', '09 0C 0B 0C 18 0D 0D 18 32 21 1C 21', '32 32 32 32 32 32 32 32 32 32 32 32', '32 32 32 32 32 32 32 32 32 32 32 32'];
const b1 = `    <tx:beat id="b1" chapter="Bytes" say="Open any photo / in a hex viewer, / and it starts with FF D8.">
      <tx:code x="90" y="420" w="900" size="30" title="Hex view · beach.jpg" at="=cue('b1.1')" mark="=cue('b1.2')" lines="${hex.join(' | ')}"/>
      <tx:label x="780" y="330" text="JPEG signature" sub="every .jpg starts this way" tx="500" ty="520" at="=cue('b1.2') + 0.3" hl="=tx:on(cue('b1.2') + 0.3, sdur)"/>
    </tx:beat>`;

// 2 · code with rows that turn green / red, a boxed label with a leader to the bad line
const code = ['def upload(file):', '    for attempt in range(5):', '        ok = send(file) :: ok', '        if ok: :: ok', '            return True :: ok', '        wait(0)   # retry now :: bad', '    return False', '', 'def send(file):', '    return http.post(URL, file)'];
const b2 = `    <tx:beat id="b2" chapter="The bug" say="The bug was one line. / It retried instantly, / five times in a row.">
      <tx:code x="90" y="560" w="900" size="30" title="upload.py" at="=cue('b2.0')" mark="=cue('b2.1')" lines="${code.map((l) => l.replace(/^ +/, (m) => '\u2800'.repeat(m.length))).join(' | ')}"/>
      <tx:label x="830" y="420" text="The bug" tx="830" ty="878" at="=cue('b2.1')" hl="=tx:on(cue('b2.1'), sdur)"/>
    </tx:beat>`;

// 3 · their own words: a terms page with lime quotes, beside the device it's about
const b3 = `    <tx:beat id="b3" chapter="Terms" say="And here's what / the doorbell's own terms / say it records.">
      <tx:doc x="70" y="470" w="520" title="Smart Doorbell · Terms" lines="2" quotes="Sound near your door | Faces of visitors | Times you come and go" from="Section 4 · what we collect" at="=cue('b3.1')" step="0.6"/>
      <tx:phone x="680" y="430" w="300" h="610" tilt="-16" at="=cue('b3.0')">
        <rect w="272" h="582" r="36" fill="$pale"/>
        <rect x="0" y="80" w="272" h="300" fill="$mid"/>
        <rect x="90" y="140" w="100" h="240" r="6" fill="$tile" stroke="$line" sw="2"/><circle x="176" y="270" r="6" fill="$line"/>
        <circle x="60" y="250" r="26" fill="$tile" stroke="$ink" sw="2"/><rect x="30" y="280" w="60" h="100" r="20" fill="$deep" stroke="$ink" sw="2"/>
        <circle x="30" y="110" r="9" fill="$bad"/><text x="48" y="110" size="20" weight="700" font="Outfit" fill="$ink" text="LIVE"/>
        <text x="24" y="430" size="26" weight="700" font="Outfit" fill="$ink" text="Front door"/>
        <rect x="24" y="500" w="224" h="50" r="25" fill="$ink"/><text x="136" y="525" size="22" weight="700" font="Outfit" align="center" fill="#ffffff" text="Talk"/>
      </tx:phone>
    </tx:beat>`;

// 4 · a plain window of text: one sentence lime-highlighted
const b4 = `    <tx:beat id="b4" chapter="Transcript" say="The speaker doesn't keep / everything it hears, / just what follows its name.">
      <tx:window x="110" y="560" w="860" h="460" title="Voice history" at="=cue('b4.0')">
        <text x="30" y="50" size="34" font="Outfit" fill="$muted" maxw="760" lh="1.35" text="(music, two people talking)"/>
        <rect x="18" y="114" w="=700*tx:grow(cue('b4.2'), 0.5)" h="104" r="6" fill="$lime"/>
        <text x="30" y="140" size="36" weight="600" font="Outfit" fill="$ink" maxw="760" lh="1.35" text="“Hey Speaker, turn off the hallway light at eleven.”" at="=cue('b4.1')"/>
        <text x="30" y="290" size="24" font="Outfit" fill="$muted" text="Today · 22:41 · kept 30 days" at="=cue('b4.2') + 0.4"/>
      </tx:window>
    </tx:beat>`;

// 5 · small sensor cards, the file they come from, and the table of readings
const wave = (c) => { let d = 'M10 60'; for (let i = 1; i <= 40; i++) d += ` L${10 + i * 4} ${(60 - Math.sin(i * (0.5 + c * 0.3)) * (12 + c * 8) * (c === 3 ? Math.exp(-i / 14) : 1)).toFixed(1)}`; return d; };
const rows = [['0.00', '0.02', '-0.11', '9.79'], ['0.02', '0.05', '-0.09', '9.83'], ['0.04', '0.31', '0.12', '10.6'], ['0.06', '1.84', '0.46', '12.9'], ['0.08', '0.27', '0.08', '9.92'], ['0.10', '0.03', '-0.10', '9.80'], ['0.12', '0.01', '-0.12', '9.78']];
const b5 = `    <tx:beat id="b5" chapter="Readings" say="Plus a table of readings, / fifty of them / every second.">
      <tx:tile x="540" y="330" icon="file-spreadsheet" size="110" at="=cue('b5.0')"/>
      ${['ax', 'ay', 'az', 'gyro'].map((n, c) => `<group x="${90 + c * 232}" y="440" at="=cue('b5.0') + ${(0.2 + 0.1 * c).toFixed(1)}"><anim prop="opacity" from="0" to="1" dur="0.3"/><rect w="200" h="120" r="10" fill="$tile" stroke="$ink" sw="2.5"/><text x="12" y="26" size="22" weight="700" font="JetBrains Mono" fill="$ink" text="${n}"/><path y="10" d="${wave(c)}" fill="none" stroke="$green" sw="3"/></group>`).join('')}
      <tx:window x="90" y="620" w="900" h="610" title="steps.csv" at="=cue('b5.0') + 0.3">
        ${['time', 'x', 'y', 'z'].map((h, i) => `<text x="${40 + i * 210}" y="30" size="26" weight="700" font="JetBrains Mono" fill="$muted" text="${h}"/>`).join('')}
        <line x1="10" y1="58" x2="850" y2="58" stroke="$line" sw="2"/>
        ${rows.map((r, j) => `<group y="${80 + j * 66}" at="=cue('b5.1') + ${(0.1 * j).toFixed(1)}">${j === 3 ? `<rect x="10" y="-6" w="840" h="56" r="6" fill="$soft" stroke="$focus" sw="3" at="=cue('b5.2')"/>` : ''}${r.map((v, i) => `<text x="${40 + i * 210}" y="22" size="28" font="JetBrains Mono" fill="$ink" text="${v}"/>`).join('')}</group>`).join('')}
      </tx:window>
    </tx:beat>`;

// 6 · the edit: a page with one line crossed out by a pen, the company faded behind it
const pen = `<group rot="-35"><rect x="-14" y="-150" w="28" h="140" r="8" fill="$tile" stroke="$ink" sw="3"/><rect x="-14" y="-150" w="28" h="30" r="8" fill="$ink"/><path d="M-14 -10 L0 22 L14 -10 Z" fill="$tile" stroke="$ink" sw="3"/></group>`;
const b6 = `    <tx:beat id="b6" chapter="Edit" say="The company has since / rewritten that sentence.">
      ${fadeIn(0, G(560, 760, 0.9, house(0, 0, 420, 260, 180, 0, NEU, '$tile') + wallX(40, 260, 140, `<rect repeat="5" as="k" x="=k*72" w="50" h="60" fill="$pale" stroke="$line" sw="1.5"/>`) + box(60, 30, 180, 60, 60, 120, NEU)), ' opacity="0.45"')}
      <group x="300" y="300" at="=cue('b6.0')"><anim prop="opacity" from="0" to="1" dur="0.3"/><anim prop="y" from="330" to="300" dur="0.4" ease="out"/>
        <rect y="10" w="480" h="560" r="6" fill="$shade"/><rect w="480" h="560" r="6" fill="$tile" stroke="$ink" sw="2.5"/>
        <path x="436" d="M0 0 L44 44 L0 44 Z" fill="$shade" stroke="$ink" sw="2.5"/>
        <text x="32" y="60" size="30" weight="700" font="Outfit" fill="$ink" text="Warranty"/>
        <rect repeat="4" as="k" x="32" y="=110 + k*42" w="=k % 2 ? 360 : 410" h="14" r="7" fill="$shade"/>
        <rect x="32" y="290" w="410" h="14" r="7" fill="$shade"/>
        <line x1="26" y1="297" x2="=26 + 422*tx:grow(cue('b6.1'), 0.6)" y2="297" stroke="$ink" sw="5"/>
        <rect x="26" y="326" w="=422*tx:grow(cue('b6.1') + 0.7, 0.5)" h="40" r="4" fill="$lime"/>
        <text x="36" y="347" size="24" weight="600" font="Outfit" fill="$ink" text="Repairs by any shop are covered." at="=cue('b6.1') + 0.9"/>
        <rect repeat="3" as="k" x="32" y="=410 + k*42" w="=k == 2 ? 240 : 410" h="14" r="7" fill="$shade"/>
        <group x="=lerp(30, 450, tx:grow(cue('b6.1'), 0.6))" y="=tx:grow(cue('b6.1') + 0.7, 0.3) &gt; 0 ? 330 : 290" at="=cue('b6.1') - 0.3">${pen}</group>
      </group>
    </tx:beat>`;

write(4, doc('UI, code and documents', [b1, b2, b3, b4, b5, b6]));
