import { P, box, face, floor, wallX, wallY, pop, fadeIn, G, doc, write, NEU, WOOD, DARK, GRN, LIME } from './gen.mjs';
const pt = (X, Y, Z = 0) => P(X, Y, Z).map((n) => Math.round(n));

// 1 · almost empty: one tile, one gear pill under it
const b1 = `    <tx:beat id="b1" chapter="Driver" say="Your printer only works / because of a small program / called a driver.">
      <tx:tile x="720" y="760" icon="printer" size="180" at="=cue('b1.0')" hl="=tx:on(cue('b1.0'), sdur)"/>
      <tx:wire d="M720 860 L720 950" at="=cue('b1.2')"/>
      <tx:pill x="720" y="1000" text="Driver" kind="gear" at="=cue('b1.2')"/>
    </tx:beat>`;

// 2 · a hub with spokes, and two outsiders with their own gear pills
const spokes = [['app-window', 220, 640], ['file-music', 330, 760], ['image', 460, 820], ['mail', 620, 820], ['calendar', 750, 760], ['gamepad-2', 860, 640], ['globe', 880, 500]];
const b2 = `    <tx:beat id="b2" chapter="Chips" say="Most of an app runs / on the main processor, / but graphics and AI / get chips of their own.">
      ${spokes.map(([, x, y], k) => `<tx:wire d="M540 470 L${x} ${y}" at="=cue('b2.1') + ${(0.06 * k).toFixed(2)}" sw="3"/>`).join('\n      ')}
      <tx:tile x="540" y="470" icon="cpu" size="200" label="" at="=cue('b2.0')" hl="=tx:on(cue('b2.1'), cue('b2.2'))"/>
      ${spokes.map(([ic, x, y], k) => `<tx:tile x="${x}" y="${y}" icon="${ic}" size="100" at="=cue('b2.0') + ${(0.08 * k + 0.2).toFixed(2)}" op="=tx:fade(cue('b2.2'), sdur, 0.4)"/>`).join('\n      ')}
      <tx:tile x="300" y="1040" icon="monitor" size="130" at="=cue('b2.2')" hl="=tx:on(cue('b2.2'), cue('b2.3'))"/>
      <tx:wire d="M300 1105 L300 1160" at="=cue('b2.2') + 0.2"/><tx:pill x="300" y="1200" text="GPU" kind="gear" at="=cue('b2.2') + 0.3"/>
      <tx:tile x="780" y="1040" icon="sparkles" size="130" at="=cue('b2.2') + 0.5" hl="=tx:on(cue('b2.3'), sdur)"/>
      <tx:wire d="M780 1105 L780 1160" at="=cue('b2.2') + 0.7"/><tx:pill x="780" y="1200" text="NPU" kind="gear" at="=cue('b2.2') + 0.8"/>
    </tx:beat>`;

// 3 · a listing on paper becomes a tree on an isometric slab, each node a tag on a post
const nodes = { root: [60, 260, '/'], home: [200, 200, 'home'], etc: [180, 380, 'etc'], ana: [360, 150, 'ana'], photos: [520, 60, 'photos'], notes: [520, 260, 'notes.txt'], beach: [680, 40, 'beach.jpg'], cfg: [340, 420, 'hosts'] };
const edges = [['root', 'home'], ['root', 'etc'], ['home', 'ana'], ['ana', 'photos'], ['ana', 'notes'], ['photos', 'beach'], ['etc', 'cfg']];
const H = 70;
const tag = (k, i) => { const [X, Y, t] = nodes[k]; const [x0, y0] = pt(X, Y, 0), [x1, y1] = pt(X, Y, H);
  return `<group at="=cue('b3.1') + ${(0.12 * i).toFixed(2)}"><anim prop="opacity" from="0" to="1" dur="0.25"/><line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="$ink" sw="3"/><circle x="${x0}" y="${y0}" r="7" fill="$tile" stroke="$ink" sw="2.5"/>
        <row x="${x1}" y="${y1}" ax="0.5" ay="1" pad="8" r="6" fill="${k === 'beach' ? '$soft' : '$tile'}" stroke="${k === 'beach' ? '$focus' : '$ink'}" sw="${k === 'beach' ? 4 : 2.5}"><text size="22" weight="700" font="JetBrains Mono" fill="$ink" text="${t}"/></row></group>`; };
const b3 = `    <tx:beat id="b3" chapter="File tree" say="On disk, your folders / are really a tree, / and every file is a leaf.">
      <group at="=cue('b3.0')"><anim prop="opacity" from="0" to="1" dur="0.3"/>
        <rect x="90" y="358" w="400" h="330" r="6" fill="$shade"/>
        <rect x="90" y="350" w="400" h="330" r="6" fill="$tile" stroke="$ink" sw="2.5"/>
        <path x="446" y="350" d="M0 0 L44 44 L0 44 Z" fill="$shade" stroke="$ink" sw="2.5"/>
        <rect x="120" y="380" w="120" h="10" r="5" fill="$shade"/>
        ${['/', '├ home/', '│  └ ana/', '│     ├ photos/', '│     │  └ beach.jpg', '│     └ notes.txt', '└ etc/', '   └ hosts'].map((l, i) => `<text x="120" y="${420 + i * 32}" size="22" font="JetBrains Mono" fill="$ink" text="${l}"/>`).join('')}
      </group>
      <tx:label x="800" y="420" text="File system" sub="one tree from /" tx="780" ty="800" at="=cue('b3.1')" hl="=tx:on(cue('b3.1'), cue('b3.2'))"/>
      ${G(330, 740, 0.98, `${pop(`=cue('b3.1') - 0.2`, box(-40, -60, -24, 820, 560, 24, { top: '$tile', left: '#efe9da', right: '#ddd6c3' }))}
        ${fadeIn(`=cue('b3.1')`, floor(0, 0, 0, edges.map(([a, b]) => { const [X1, Y1] = nodes[a], [X2, Y2] = nodes[b]; return `<path d="M${X1} ${Y1} L${X2} ${Y2}" fill="none" stroke="$line" sw="4"/>`; }).join('')))}
        ${Object.keys(nodes).sort((a, b) => (nodes[a][0] + nodes[a][1]) - (nodes[b][0] + nodes[b][1])).map(tag).join('\n        ')}`)}
    </tx:beat>`;

// 4 · a graph: real servers vouch for each other (green arrows), spam stays in its own red corner
const card = (x, y, bad = false, focus = false) => `<group x="${x}" y="${y}"><rect x="-44" y="-50" w="88" h="104" r="6" fill="${bad ? '$badsoft' : '$tile'}" stroke="${bad ? '$bad' : '$ink'}" sw="2.5"/><rect x="-30" y="-34" w="60" h="22" r="3" fill="${bad ? '#efb3a5' : focus ? '$lime' : '$shade'}"/><rect x="-30" y="0" w="60" h="8" r="4" fill="${bad ? '#efb3a5' : '$shade'}"/><rect x="-30" y="16" w="44" h="8" r="4" fill="${bad ? '#efb3a5' : '$shade'}"/></group>`;
const arrow = (x1, y1, x2, y2, c, t) => { const a = Math.atan2(y2 - y1, x2 - x1), ex = x2 - Math.cos(a) * 60, ey = y2 - Math.sin(a) * 60, sx = x1 + Math.cos(a) * 60, sy = y1 + Math.sin(a) * 60;
  const h = (d) => `${(ex - Math.cos(a + d) * 16).toFixed(1)} ${(ey - Math.sin(a + d) * 16).toFixed(1)}`;
  return `<group at="${t}"><path d="M${sx.toFixed(1)} ${sy.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${c}" sw="4"><anim prop="draw" from="0" to="1" dur="0.4"/></path><path d="M${h(0.45)} L${ex.toFixed(1)} ${ey.toFixed(1)} L${h(-0.45)}" fill="none" stroke="${c}" sw="4"/></group>`; };
const good = [[540, 380], [320, 500], [760, 500], [300, 720], [540, 740], [780, 720]];
const ge = [[1, 0], [2, 0], [3, 1], [4, 0], [5, 2], [4, 1], [4, 2], [3, 4]];
const badc = [[300, 950], [540, 920], [780, 980], [420, 1160], [660, 1160]];
const be = [[1, 3], [0, 3], [2, 4]];
const b4 = `    <tx:beat id="b4" chapter="Reputation" say="Real mail servers / vouch for each other. / Spam servers can't.">
      ${good.map(([x, y], k) => fadeIn(`=cue('b4.0') + ${(0.08 * k).toFixed(2)}`, card(x, y, false, k === 0))).join('\n      ')}
      ${ge.map(([a, b], k) => arrow(good[a][0], good[a][1], good[b][0], good[b][1], '$green', `=cue('b4.1') + ${(0.1 * k).toFixed(2)}`)).join('\n      ')}
      ${badc.map(([x, y], k) => fadeIn(`=cue('b4.2') + ${(0.08 * k).toFixed(2)}`, card(x, y, true))).join('\n      ')}
      ${be.map(([a, b], k) => arrow(badc[a][0], badc[a][1], badc[b][0], badc[b][1], '$bad', `=cue('b4.2') + ${(0.3 + 0.1 * k).toFixed(2)}`)).join('\n      ')}
    </tx:beat>`;

// 5 · a network of dots (a small model) next to a gauge that fills
const layers = [9, 13, 13, 9, 1];
const lx = (l) => 150 + l * 130, ly = (l, i) => 760 + (i - (layers[l] - 1) / 2) * 52;
let links = '', dots = '';
for (let l = 0; l < layers.length - 1; l++) for (let i = 0; i < layers[l]; i++) for (let j = 0; j < layers[l + 1]; j++) if ((i * 7 + j * 3 + l) % 4 === 0 || layers[l + 1] === 1) links += `M${lx(l)} ${ly(l, i)} L${lx(l + 1)} ${ly(l + 1, j)} `;
layers.forEach((n, l) => { for (let i = 0; i < n; i++) dots += `<circle x="${lx(l)}" y="${ly(l, i)}" r="${n === 1 ? 20 : 13}" fill="${n === 1 ? '$lime' : '$tile'}" stroke="$ink" sw="2.5" at="=0.1 + ${(0.03 * l + 0.01 * i).toFixed(2)}"><anim prop="scale" from="0" to="1" dur="0.25" ease="back"/></circle>`; });
const b5 = `    <tx:beat id="b5" chapter="Spam score" say="A small model / reads every email / and gives it a spam score.">
      <path d="${links}" fill="none" stroke="$dim" sw="1.5" at="=cue('b5.0') + 0.3"><anim prop="opacity" from="0" to="1" dur="0.5"/></path>
      ${dots}
      <tx:tile x="150" y="380" icon="mail" size="120" at="=cue('b5.1')"/>
      <tx:wire d="M150 445 L150 520" at="=cue('b5.1') + 0.2"/>
      <group x="860" y="760" at="=cue('b5.2')"><anim prop="opacity" from="0" to="1" dur="0.3"/>
        <rect x="-50" y="-260" w="100" h="480" r="18" fill="$tile" stroke="$ink" sw="3"/>
        <rect x="-26" y="-236" w="52" h="432" r="12" fill="$shade"/>
        <rect x="-26" y="=196 - 432*0.86*tx:grow(cue('b5.2') + 0.2, 0.9)" w="52" h="=432*0.86*tx:grow(cue('b5.2') + 0.2, 0.9)" r="12" fill="$green"/>
        <rect x="-36" y="220" w="72" h="18" r="4" fill="$tile" stroke="$ink" sw="2.5"/><rect x="-8" y="238" w="16" h="60" fill="$tile" stroke="$ink" sw="2.5"/><rect x="-60" y="296" w="120" h="20" r="6" fill="$tile" stroke="$ink" sw="2.5"/>
      </group>
      <tx:label x="860" y="420" text="0.86" mono="1" sub="spam score" at="=cue('b5.2') + 0.9" hl="=tx:on(cue('b5.2') + 0.9, sdur)"/>
    </tx:beat>`;

// 6 · a row of everyday devices, each with the same chip floating above it
const dev = [
  box(0, 0, 0, 70, 10, 140, NEU) + wallX(4, 10, 134, `<rect w="62" h="128" r="6" fill="$pale"/>`),
  box(0, 0, 0, 44, 44, 14, NEU) + box(14, -40, 0, 16, 40, 4, DARK) + box(14, 44, 0, 16, 40, 4, DARK) + face([[6, 6, 14], [38, 6, 14], [38, 38, 14], [6, 38, 14]], '$pale'),
  box(0, 0, 0, 80, 50, 40, NEU) + face([[0, 50, 28], [80, 50, 28], [80, 50, 27], [0, 50, 27]], '$line'),
  box(0, 0, 0, 120, 80, 8, NEU) + box(0, 0, 8, 120, 6, 80, NEU) + wallX(6, 6, 82, `<rect w="108" h="70" fill="$pale"/>`),
  box(0, 0, 0, 56, 56, 130, NEU) + wallX(0, 56, 120, `<circle x="28" y="30" r="16" fill="$shade" stroke="$line" sw="1.5"/><circle x="28" y="80" r="22" fill="$shade" stroke="$line" sw="1.5"/>`),
];
const xs = [130, 330, 540, 750, 950];
const b6 = `    <tx:beat id="b6" chapter="Bluetooth" say="And every Bluetooth chip / already measures / how strong a signal is.">
      ${dev.map((d, k) => pop(`=cue('b6.0') + ${(0.12 * k).toFixed(2)}`, G(xs[k] - 10, 920, 1.4, d))).join('\n      ')}
      ${xs.map((x, k) => `<tx:tile x="${x}" y="680" icon="bluetooth" size="76" at="=cue('b6.0') + ${(0.12 * k + 0.4).toFixed(2)}" hl="=tx:on(cue('b6.1') + ${(0.12 * k).toFixed(2)}, sdur)"/>`).join('\n      ')}
      ${[[150, 420], [410, 400]].map(([x, y], c) => `<group x="${x - 100}" y="${y}" at="=cue('b6.2') + ${c * 0.3}"><anim prop="opacity" from="0" to="1" dur="0.3"/><rect w="210" h="100" r="8" fill="$tile" stroke="$ink" sw="2.5"/>${Array.from({ length: 16 }, (_, i) => { const h = Math.round(20 + 50 * Math.abs(Math.sin(i * 0.7 + c * 2))); return `<rect x="${16 + i * 11.5}" y="${86 - h}" w="8" h="${h}" fill="${c ? '$deep' : '$green'}"/>`; }).join('')}</group>`).join('')}
    </tx:beat>`;

write(3, doc('Diagrams', [b1, b2, b3, b4, b5, b6]));
