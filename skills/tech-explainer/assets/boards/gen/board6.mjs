import { P, box, face, floor, wallX, wallY, pop, fadeIn, G, limb, doc, write, NEU, WOOD, DARK, GRN, person, byDepth } from './gen.mjs';
const pt = (X, Y, Z = 0) => P(X, Y, Z).map((n) => Math.round(n));
const L = (a, b, sw = 3, c = '$ink') => `<line x1="${pt(...a)[0]}" y1="${pt(...a)[1]}" x2="${pt(...b)[0]}" y2="${pt(...b)[1]}" stroke="${c}" sw="${sw}"/>`;
const desk = (X, Y, w, d, h = 150, drawers = false) => box(X, Y, h - 12, w, d, 12, WOOD) + box(X + 6, Y + d - 16, 0, 12, 12, h - 12, WOOD) + box(X + w - 18, Y + d - 16, 0, 12, 12, h - 12, WOOD) +
  (drawers ? box(X, Y, 0, 110, d, h - 12, WOOD) + wallX(X, Y + d, h - 16, `<rect repeat="3" as="k" x="10" y="=8 + k*(${(h - 16) / 3})" w="90" h="${(h - 16) / 3 - 8}" r="3" fill="none" stroke="$line" sw="1.5"/><rect repeat="3" as="k" x="45" y="=${(h - 16) / 6} + k*(${(h - 16) / 3})" w="20" h="4" fill="$line"/>`) : '');
const monitor = (X, Y, Z, w, h, screen) => box(X + w / 2 - 20, Y + 10, Z, 40, 30, 8, NEU) + box(X + w / 2 - 6, Y + 16, Z + 8, 12, 8, 60, NEU) + box(X, Y, Z + 40, w, 10, h, NEU) + wallX(X + 8, Y + 10, Z + 40 + h - 8, screen);

// 1 · a person at their desk, big, from behind; the frame cuts through them
const b1 = `    <tx:beat id="b1" chapter="Mia" plate="1" say="Mia built her first app / at this desk, / in one weekend.">
      ${G(560, 930, 1.5, `
        ${desk(0, -40, 520, 300, 170)}
        ${box(-20, -40, 0, 110, 110, 230, NEU)}${wallX(-20, 70, 220, `<circle x="55" y="50" r="30" fill="$shade" stroke="$line" sw="2"/><circle x="55" y="140" r="30" fill="$shade" stroke="$line" sw="2"/>`)}
        ${monitor(150, 10, 170, 300, 190, `<rect w="284" h="174" fill="$tile"/><rect x="10" y="10" w="264" h="20" r="4" fill="$shade"/><path d="M14 150 L70 120 L120 132 L170 80 L220 92 L270 40" fill="none" stroke="$green" sw="5" at="=cue('b1.0') + 0.3"><anim prop="draw" from="0" to="1" dur="0.8"/></path><rect repeat="6" as="k" x="=14 + k*44" y="160" w="30" h="6" fill="$shade"/>`)}
        ${box(160, 160, 170, 220, 80, 8, NEU)}${box(420, 180, 170, 30, 40, 10, NEU)}
        ${box(420, 120, 170, 40, 40, 50, { top: '$tile', left: '#e6dfcc', right: '#d6ceb8' })}`)}
      <group at="0.1"><anim prop="opacity" from="0" to="1" dur="0.3"/><anim prop="y" from="60" to="0" dur="0.5" ease="out"/>
        <rect x="-40" y="1180" w="300" h="420" r="40" fill="#6d7466" stroke="$ink" sw="6"/>
        <path d="M120 1520 L120 1960 M80 1960 L320 1880 M-40 1880 L120 1900" fill="none" stroke="$ink" sw="16" cap="round"/>
        ${limb('M300 1160 C 420 1120 520 1080 600 1050', 100, '$deep')}
        <circle x="615" y="1045" r="44" fill="$tile" stroke="$ink" sw="5"/>
        <path d="M0 1500 L10 1100 C 30 980 120 940 220 940 C 330 940 400 1000 410 1120 L 430 1500 Z" fill="$deep" stroke="$ink" sw="6"/>
        <path d="M120 1000 C 150 940 290 940 320 1000 C 280 1050 160 1050 120 1000 Z" fill="$mid" stroke="$ink" sw="5"/>
        <circle x="225" y="830" r="125" fill="#4b3b2e" stroke="$ink" sw="6"/>
        <path d="M100 830 C 100 680 350 680 350 830" fill="none" stroke="$ink" sw="22"/><rect x="72" y="790" w="56" h="100" r="22" fill="$ink"/><rect x="322" y="790" w="56" h="100" r="22" fill="$ink"/>
      </group>
      <tx:tile x="900" y="300" icon="rocket" size="130" at="=cue('b1.1')" hl="=tx:on(cue('b1.2'), sdur)"/>
    </tx:beat>`;

// 2 · tiny person at a desk, a cable running far across the floor to a printer, a packet on the way
const cable = [[300, 170, 0], [1000, 170, 0], [1000, 440, 0]];
const b2 = `    <tx:beat id="b2" chapter="Printer" say="As long as the printer / is on the network, / anyone can print to it.">
      ${G(200, 430, 1.15, `${desk(0, 0, 300, 150, 150)}
        ${monitor(80, 10, 150, 130, 90, `<rect w="114" h="74" fill="$pale"/>`)}${box(90, 100, 150, 110, 30, 6, NEU)}
        ${person(...pt(150, 230, 0), 2.1, '$mid')}
        ${fadeIn(`=cue('b2.0') + 0.3`, `<path d="M${cable.map((p) => pt(...p).join(' ')).join(' L')}" fill="none" stroke="$ink" sw="3"><anim prop="draw" from="0" to="1" dur="0.8"/></path>`)}
        ${pop(`=cue('b2.0')`, box(980, 440, 0, 110, 100, 90, NEU) + box(970, 430, 90, 130, 120, 70, NEU) + wallX(970, 550, 150, `<rect x="10" y="10" w="40" h="20" fill="$pale" stroke="$line" sw="1.5"/><circle x="110" y="20" r="6" fill="$green"/>`) + face([[985, 470, 160], [1085, 470, 160], [1095, 500, 220], [995, 500, 220]], '$tile'))}
        <group x="=lerp(${pt(300, 170)[0]}, ${pt(1000, 170)[0]}, tx:grow(cue('b2.2'), 1.2))" y="=lerp(${pt(300, 170)[1]}, ${pt(1000, 170)[1]}, tx:grow(cue('b2.2'), 1.2)) - 14" at="=cue('b2.2')">${box(-12, -12, 0, 24, 24, 24, { top: '$lime', left: '$green', right: '#24700a' }, { stroke: '$ink' })}</group>`)}
      <tx:label x="820" y="900" text="Office printer" sub="open to the network" tx="${200 + Math.round(1.15 * pt(1040, 490, 200)[0])}" ty="${430 + Math.round(1.15 * pt(1040, 490, 200)[1])}" at="=cue('b2.1')" hl="=tx:on(cue('b2.1'), sdur)"/>
    </tx:beat>`;

// 3 · a crowd on a slab, every one a small person
const crowd = [];
const shirts = ['$mid', '#d9d2bf', '#b9c2b0', '#e8e2d2', '$deep', '#c8c0aa'];
for (let i = 0; i < 16; i++) for (let j = 0; j < 12; j++) {
  const X = 30 + i * 34 + ((j * 13) % 7) * 3, Y = 30 + j * 36 + ((i * 7) % 5) * 3;
  if ((i * 3 + j * 5) % 11 === 0) continue;
  crowd.push([X + Y, person(...pt(X, Y), 0.8, shirts[(i * 5 + j * 3) % 6], '#6d7466')]);
}
const b3 = `    <tx:beat id="b3" chapter="Crowd" say="Imagine asking / 2,400 people / to pick a new password.">
      ${G(560, 520, 1, `${pop(0.1, box(-20, -20, -16, 640, 500, 16, { top: '$tile', left: '#efe9da', right: '#ddd6c3' }))}
        ${fadeIn(`=cue('b3.1')`, byDepth(crowd))}
        ${box(560, 60, 0, 50, 40, 50, NEU)}${box(560, 380, 0, 50, 40, 50, NEU)}`)}
      <tx:chip x="280" y="330" text="Study" icon="clipboard-list" size="40" at="=cue('b3.0')" hl="=tx:on(cue('b3.0'), cue('b3.1'))"/>
      <tx:label x="820" y="380" text="2,400" sub="people" at="=cue('b3.1') + 0.5" hl="=tx:on(cue('b3.1') + 0.5, sdur)"/>
    </tx:beat>`;

// 4 · a desk on its own with a name label on a leader
const b4 = `    <tx:beat id="b4" chapter="First server" say="Her first server / was an old laptop / under the desk.">
      ${G(560, 560, 1.2, `${desk(0, 0, 440, 260, 180, true)}
        ${monitor(170, 20, 180, 200, 130, `<rect w="184" h="114" fill="$pale"/><rect x="10" y="10" w="80" h="94" fill="$tile"/>`)}
        ${box(170, 170, 180, 200, 60, 6, NEU)}${floor(175, 175, 186, `<rect repeat="24" as="k" x="=(k % 12)*16" y="=floor(k/12)*24 + 6" w="12" h="16" r="2" fill="$tile" stroke="$line" sw="1"/>`)}
        ${box(390, 60, 180, 30, 30, 36, { top: '#4b3b2e', left: '$tile', right: '#e6dfcc' })}
        ${box(150, 120, 0, 160, 110, 10, DARK)}${box(150, 120, 10, 160, 8, 90, DARK)}${wallX(156, 128, 96, `<rect w="148" h="78" fill="$lime" at="=cue('b4.1')"/><text x="74" y="44" size="26" weight="700" font="JetBrains Mono" align="center" fill="$ink" text="ONLINE" at="=cue('b4.1')"/>`)}`)}
      <tx:label x="300" y="420" text="Old laptop" sub="running 24/7" tx="${560 + Math.round(1.2 * pt(230, 128, 60)[0])}" ty="${560 + Math.round(1.2 * pt(230, 128, 60)[1])}" at="=cue('b4.1')" hl="=tx:on(cue('b4.1'), sdur)"/>
    </tx:beat>`;

// 5 · fragments: a page cut by the top-left edge, big letter keys, one in focus
const key = (x, y, ch, t, hl = '0', s = 150) => `<group x="${x}" y="${y}" at="${t}"><anim prop="scale" from="0.6" to="1" dur="0.35" ease="back"/>
        <rect x="${-s / 2}" y="${-s / 2 + 10}" w="${s}" h="${s}" r="20" fill="$shade" stroke="$ink" sw="3"/><rect x="${-s / 2}" y="${-s / 2}" w="${s}" h="${s}" r="20" fill="$tile" stroke="$ink" sw="3"/>
        <rect x="${-s / 2}" y="${-s / 2}" w="${s}" h="${s}" r="20" fill="$lime" stroke="$ink" sw="3" opacity="${hl}"/>
        <text y="4" size="${s * 0.55}" weight="800" font="Outfit" align="center" fill="$ink" text="${ch}"/></group>`;
const b5 = `    <tx:beat id="b5" chapter="QWERTY" say="As the story goes, / the letters were spread out / so the keys wouldn't jam.">
      <tx:doc x="30" y="160" w="430" title="Patent · 1878" lines="6" at="0.1"/>
      <tx:wire d="M300 600 L300 720" at="=cue('b5.1')"/>
      ${key(110, 800, 'Q', `=cue('b5.1')`)}${key(300, 800, 'W', `=cue('b5.1') + 0.2`, `=tx:on(cue('b5.2'), sdur)`)}${key(490, 800, 'E', `=cue('b5.1') + 0.4`)}
      <tx:wire d="M300 880 C 300 1000 520 1040 720 1000" at="=cue('b5.2')" hl="=tx:on(cue('b5.2'), sdur)"/>
      ${key(1040, 620, 'T', `=cue('b5.0')`, '0', 200)}
      <tx:chip x="830" y="1120" text="Typewriter" icon="keyboard" size="44" at="=cue('b5.2')"/>
    </tx:beat>`;

// 6 · a dated chip, the document from that year, and the idea split into tokens
const b6 = `    <tx:beat id="b6" chapter="1971" say="In 1971, / the first network email / put an @ between / a name and a computer.">
      <tx:chip x="250" y="330" text="1971" icon="mail" size="44" at="=cue('b6.0')" hl="=tx:on(cue('b6.0'), cue('b6.1'))"/>
      <tx:doc x="520" y="250" w="420" title="Network mail test" lines="5" at="=cue('b6.1')"/>
      <tx:tokens x="540" y="920" items="name | \\@ | computer" size="52" at="=cue('b6.2')" step="0.25"/>
      <rect x="449" y="876" w="74" h="88" r="8" fill="none" stroke="$focus" sw="6" opacity="=tx:on(cue('b6.2') + 0.6, sdur)"/>
    </tx:beat>`;

write(6, doc('People and story', [b1, b2, b3, b4, b5, b6]));
