import { P, box, face, floor, wallX, wallY, pop, fadeIn, G, doc, write, NEU, WOOD, DARK, GRN, LIME, tree, house, person, room, byDepth } from './gen.mjs';
const pt = (X, Y, Z = 0) => P(X, Y, Z).map((n) => Math.round(n));

// 1 · exploded view: the board below, the image layer floating above it, a number on a leader
const parts = [[60, 60, 70, 50], [380, 60, 60, 60], [60, 280, 80, 50], [400, 290, 50, 40], [220, 40, 90, 30]].map(([X, Y, w, d]) => box(X, Y, 16, w, d, 12, NEU, { sw: 1.5 })).join('');
const b1 = `    <tx:beat id="b1" chapter="Refresh" say="Your screen redraws itself / 120 times a second.">
      ${G(540, 640, 1, `
        ${pop(0.1, box(0, 0, 0, 520, 400, 16, NEU) + floor(0, 0, 16, `<rect repeat="14" as="k" x="=30 + k*34" y="372" w="18" h="10" fill="$shade"/>`) + parts + box(200, 140, 16, 130, 130, 26, GRN) + floor(220, 160, 42, `<rect w="90" h="90" r="6" fill="$deep"/><rect x="20" y="20" w="50" h="50" fill="$green"/>`))}
        <line x1="${pt(265, 205, 42).join('" y1="')}" x2="${pt(265, 205, 300).join('" y2="')}" stroke="$ink" sw="2.5" dash="6 6" at="=cue('b1.1')"/>
        ${pop(`=cue('b1.0') + 0.3`, `<group y="=-20*tx:grow(cue('b1.1'), 0.8)">${box(70, 70, 280, 380, 260, 10, { top: '$tile', left: '$pale', right: '$mid' }, { stroke: '$green', sw: 3 })}
          ${floor(70, 70, 290, `<rect x="20" y="20" w="230" h="110" r="10" fill="$pale"/><path d="M20 130 C 80 60 140 120 250 40 L250 130 Z" fill="$green"/><rect x="270" y="20" w="90" h="110" r="10" fill="$ink"/><circle x="315" y="75" r="18" fill="$tile"/><rect repeat="3" as="k" x="=20 + k*120" y="160" w="100" h="24" r="6" fill="$shade"/><rect x="20" y="200" w="160" h="24" r="6" fill="$deep"/>`)}</group>`)}`)}
      <tx:label x="540" y="300" text="120×" sub="a second · 8.3 ms each" size="56" tx="540" ty="520" at="=cue('b1.1')" hl="=tx:on(cue('b1.1'), sdur)"/>
    </tx:beat>`;

// 2 · a huge cube made of tiny cells, a division above it, one cell named below
const S = 460;
const cells = (n, s) => `<rect repeat="${n * n}" as="k" x="=(k % ${n})*${s}" y="=floor(k/${n})*${s}" w="${s - 5}" h="${s - 5}" fill="$shade"/>`;
const b2 = `    <tx:beat id="b2" chapter="Photos per drive" say="A one terabyte drive / holds about 250,000 photos, / at 4 megabytes each.">
      <tx:label x="540" y="190" text="1,000,000,000,000 ÷ 4,000,000" mono="1" size="30" at="=cue('b2.1')"/>
      ${G(540, 700, 0.92, pop(`=cue('b2.0')`, `${box(0, 0, 0, S, S, S, { top: '$tile', left: '#f3eee0', right: '#e4ddc9' }, { stroke: '$line', sw: 2.5 })}
        ${floor(0, 0, S, cells(46, 10))}
        ${wallX(0, S, S, cells(46, 10))}
        ${wallY(S, S, S, cells(46, 10))}
        ${wallX(0, S, 110, `<rect repeat="10" as="k" x="=k*46" y="0" w="46" h="110" fill="none" stroke="$line" sw="2"/>`)}
        ${wallY(S, S, 110, `<rect repeat="10" as="k" x="=k*46" y="0" w="46" h="110" fill="none" stroke="$line" sw="2"/>`)}
        ${face([[0, S, S * 0.3], [30, S, S * 0.3], [30, S, S * 0.3 - 30], [0, S, S * 0.3 - 30]], '$green', { sw: 2, stroke: '$ink' })}`))}
      <tx:label x="380" y="1260" text="1 photo ≈ 4 MB" tx="${Math.round(540 + 0.92 * pt(15, S, S * 0.3 - 15)[0])}" ty="${Math.round(700 + 0.92 * pt(15, S, S * 0.3 - 15)[1])}" at="=cue('b2.2')" hl="=tx:on(cue('b2.2'), sdur)"/>
    </tx:beat>`;

// 3 · money falling out of a tile in a column, a counter at the bottom
const b3 = `    <tx:beat id="b3" chapter="Egress" say="Moving data out of a cloud / costs about 9 cents a gigabyte, / so a petabyte is about $90,000.">
      ${fadeIn(0, G(560, 640, 0.9, [[-200, 0], [100, -150], [300, 200]].map(([X, Y]) => house(X, Y, 120, 90, 60, 30, NEU, '#e6dfcc', { sw: 1.5 })).join('')), ' opacity="0.25"')}
      <tx:tile x="540" y="320" icon="cloud" size="130" at="=cue('b3.0')"/>
      <group at="=cue('b3.1')">
        ${Array.from({ length: 13 }, (_, k) => `<group x="${(540 + Math.sin(k * 1.3) * 18).toFixed(0)}" y="=min(${420 + k * 58}, ${420} + (T - T0 - ${(k * 0.12).toFixed(2)})*900)" when="=T - T0 &gt; ${(k * 0.12).toFixed(2)}"><circle r="24" fill="$lime" stroke="$ink" sw="3"/><circle r="15" fill="none" stroke="$green" sw="2"/><text y="2" size="20" weight="800" font="Outfit" align="center" fill="$green" text="$"/></group>`).join('')}
        ${Array.from({ length: 5 }, (_, k) => `<rect x="${640 + k * 40}" y="${460 + k * 90}" w="18" h="18" fill="$green" stroke="$ink" sw="2" when="=T - T0 &gt; ${(0.3 + k * 0.2).toFixed(1)}"/>`).join('')}
      </group>
      <group x="540" y="1250" at="=cue('b3.2')"><anim prop="scale" from="0.85" to="1" dur="0.3" ease="back"/>
        <rect x="-210" y="-50" w="420" h="100" r="6" fill="$tile" stroke="$ink" sw="3"/>
        <text y="2" size="56" weight="800" font="Outfit" align="center" fill="$ink" text="='$' + commas(90000*tx:grow(cue('b3.2'), 1.2))"/>
      </group>
    </tx:beat>`;

// 4 · a map on a slab with pins and a dotted route, a phone with the app, a stamped number
const blocks = [];
for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
  const X = i * 160, Y = j * 160;
  blocks.push([X + Y, floor(X + 10, Y + 10, 0, `<rect w="120" h="120" r="6" fill="${(i + j) % 3 === 1 ? '$pale' : '#efeadb'}" stroke="$line" sw="1.5"/>`)]);
  if ((i + j) % 3 === 1) blocks.push([X + Y + 1, tree(X + 50, Y + 60, 18) + tree(X + 90, Y + 30, 16)]);
  else blocks.push([X + Y + 1, house(X + 30, Y + 35, 60, 50, 26, 16, NEU, '#ddd6c3', { sw: 1.2 })]);
}
const route = [[150, 20], [150, 300], [450, 300], [450, 470]];
const pin = (X, Y, t, green) => { const [x, y] = pt(X, Y, 0); return `<group x="${x}" y="${y}" at="${t}"><anim prop="scale" from="0" to="1" dur="0.3" ease="back"/><path d="M0 0 C -10 -20 -26 -30 -26 -48 A 26 26 0 1 1 26 -48 C 26 -30 10 -20 0 0 Z" fill="${green ? '$green' : '$tile'}" stroke="$ink" sw="3"/><circle y="-48" r="9" fill="$tile" stroke="$ink" sw="2"/></group>`; };
const b4 = `    <tx:beat id="b4" chapter="Delivery" say="The app guessed / 14 minutes, / from 3.2 kilometres away.">
      ${G(620, 290, 1.15, `${pop(0.1, box(-20, -20, -18, 660, 500, 18, { top: '#e6e0cf', left: '#efe9da', right: '#ddd6c3' }) + floor(-20, 140, 0, `<rect x="0" y="0" w="660" h="20" fill="#d9ebe6"/>`) + byDepth(blocks))}
        ${fadeIn(`=cue('b4.0')`, floor(0, 0, 1, `<path d="${route.map(([X, Y], i) => (i ? 'L' : 'M') + X + ' ' + Y).join(' ')}" fill="none" stroke="$ink" sw="6" dash="3 12" cap="round"><anim prop="draw" from="0" to="1" dur="0.8"/></path>`))}
        ${pin(150, 20, `=cue('b4.0')`, false)}${pin(450, 470, `=cue('b4.0') + 0.4`, true)}${pin(320, 300, `=cue('b4.0') + 0.6`, false)}`)}
      <tx:phone x="110" y="760" w="280" h="560" tilt="-12" at="=cue('b4.1')">
        <rect w="252" h="532" r="36" fill="$bg"/>
        <rect x="16" y="80" w="220" h="160" r="14" fill="$pale"/><path x="16" y="80" d="M30 130 L110 70 L190 110" fill="none" stroke="$green" sw="5" dash="2 10" cap="round"/>
        <text x="20" y="290" size="26" weight="800" font="Outfit" fill="$ink" text="Arriving in"/>
        <text x="20" y="340" size="44" weight="800" font="Outfit" fill="$green" text="14 min"/>
        <rect x="20" y="380" w="212" h="14" r="7" fill="$shade"/><rect x="20" y="380" w="130" h="14" r="7" fill="$green"/>
        <rect x="20" y="420" w="150" h="14" r="7" fill="$shade"/>
      </tx:phone>
      <group x="760" y="1040" rot="-10" at="=cue('b4.2')"><anim prop="scale" from="1.4" to="1" dur="0.3" ease="out"/><anim prop="opacity" from="0" to="1" dur="0.2"/>
        <rect x="-170" y="-70" w="340" h="140" r="10" fill="$tile" stroke="$ink" sw="4"/><rect x="-158" y="-58" w="316" h="116" r="6" fill="none" stroke="$ink" sw="2"/>
        <text y="-8" size="50" weight="800" font="Outfit" align="center" fill="$ink" text="3.2 km"/><text y="36" size="22" weight="700" font="Outfit" align="center" ls="3" fill="$ink" text="14 MIN"/>
      </group>
    </tx:beat>`;

// 5 · two file cards, then the same two as bars
const card = (x, ic, name, size, t, hl) => `<group x="${x}" y="360" at="${t}"><anim prop="scale" from="0.85" to="1" dur="0.3" ease="back"/><anim prop="opacity" from="0" to="1" dur="0.2"/>
        <rect y="10" w="300" h="360" r="4" fill="$shade"/><rect w="300" h="360" r="4" fill="$tile" stroke="$ink" sw="2.5"/><path x="256" d="M0 0 L44 44 L0 44 Z" fill="$shade" stroke="$ink" sw="2.5"/>
        <i:icon name="${ic}" size="90" color="$green" x="150" y="110"/>
        <text x="150" y="230" size="26" font="Outfit" align="center" fill="$muted" text="${name}"/>
        <text x="150" y="295" size="56" weight="800" font="Outfit" align="center" fill="$ink" text="${size}"/>
        <rect w="300" h="360" r="4" fill="none" stroke="$focus" sw="6" opacity="${hl}"/></group>`;
const b5 = `    <tx:beat id="b5" chapter="RAW vs JPEG" say="The RAW photo is 25 megabytes. / The JPEG is about 3, / around eight times smaller.">
      ${card(150, 'camera', 'photo.raw', '25 MB', `=cue('b5.0')`, `=tx:on(cue('b5.0'), cue('b5.1'))`)}
      ${card(630, 'image', 'photo.jpg', '3 MB', `=cue('b5.1')`, `=tx:on(cue('b5.1'), cue('b5.2'))`)}
      <group at="=cue('b5.2')"><anim prop="opacity" from="0" to="1" dur="0.3"/>
        <i:icon name="camera" size="44" color="$ink" x="170" y="930"/><rect x="220" y="905" w="=700*tx:grow(cue('b5.2'), 0.8)" h="50" r="4" fill="$shade" stroke="$ink" sw="2"/>
        <i:icon name="image" size="44" color="$ink" x="170" y="1050"/><rect x="220" y="1025" w="84" h="50" r="4" fill="$green" stroke="$ink" sw="2"/>
        <text x="330" y="1051" size="34" weight="700" font="Outfit" fill="$ink" text="8× smaller"/>
      </group>
    </tx:beat>`;

// 6 · calm wide room at night: a bed, a sleeper, a watch, one small chart card
const b6 = `    <tx:beat id="b6" chapter="Sleep" say="And while you sleep, / your watch is still counting / every breath.">
      ${G(450, 640, 0.95, `${room(620, 560, 300, { t: 16 })}
        ${wallX(380, 0, 260, `<rect w="150" h="110" fill="#e4e8de" stroke="$line" sw="2"/><line x1="75" y1="0" x2="75" y2="110" stroke="$line" sw="2"/>`)}
        ${box(150, 20, 0, 260, 30, 170, WOOD)}
        ${box(150, 50, 0, 260, 380, 60, WOOD)}${box(160, 50, 60, 240, 370, 30, NEU)}
        ${box(190, 70, 90, 170, 70, 22, { top: '$tile', left: '#efe9da', right: '#ddd6c3' })}
        ${box(160, 170, 90, 240, 250, 26, { top: '#e8e2d2', left: '#ddd6c3', right: '#d0c8b2' })}
        <circle x="${pt(270, 120, 128)[0]}" y="${pt(270, 120, 128)[1]}" r="26" fill="#4b3b2e" stroke="$ink" sw="2.5"/>
        ${box(440, 40, 0, 90, 80, 80, WOOD)}${box(470, 60, 80, 34, 24, 4, DARK)}
        ${box(30, 40, 0, 80, 80, 70, WOOD)}<line x1="${pt(70, 80, 70).join('" y1="')}" x2="${pt(70, 80, 150).join('" y2="')}" stroke="$ink" sw="3"/><circle x="${pt(70, 80, 160)[0]}" y="${pt(70, 80, 160)[1]}" r="20" fill="$tile" stroke="$line" sw="2"/>
        ${floor(80, 440, 0, `<rect w="420" h="100" r="8" fill="$shade" stroke="$line" sw="1.5"/>`)}`)}
      <tx:label x="740" y="740" text="Watch" tx="${450 + Math.round(0.95 * pt(300, 260, 120)[0])}" ty="${640 + Math.round(0.95 * pt(300, 260, 120)[1])}" at="=cue('b6.1')" hl="=tx:on(cue('b6.1'), cue('b6.2'))"/>
      <group x="140" y="380" at="=cue('b6.2')"><anim prop="opacity" from="0" to="1" dur="0.3"/>
        <rect w="300" h="120" r="10" fill="$tile" stroke="$ink" sw="2.5"/>
        ${Array.from({ length: 22 }, (_, i) => { const h = Math.round(24 + 40 * Math.abs(Math.sin(i * 0.45))); return `<rect x="${18 + i * 12}" y="${104 - h}" w="8" h="${h}" fill="$green"/>`; }).join('')}
        <rect w="300" h="120" r="10" fill="none" stroke="$focus" sw="5" opacity="=tx:on(cue('b6.2'), sdur)"/>
      </group>
    </tx:beat>`;

write(5, doc('Numbers and scale', [b1, b2, b3, b4, b5, b6]));
