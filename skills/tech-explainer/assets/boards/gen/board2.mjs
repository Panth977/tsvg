import { P, box, face, floor, wallX, wallY, pop, fadeIn, G, doc, write, NEU, WOOD, DARK, GRN, LIME, tree, house, person, room, panes, byDepth } from './gen.mjs';
const pt = (X, Y, Z = 0) => P(X, Y, Z).map((n) => Math.round(n));

// 1 · a whole apartment as a cutaway, the router's waves spreading over the floor
const sofa = box(80, 430, 0, 300, 30, 100) + box(80, 460, 0, 40, 110, 70) + box(120, 460, 0, 220, 110, 45) + box(340, 460, 0, 40, 110, 70);
const b1 = `    <tx:beat id="b1" chapter="Home Wi-Fi" say="Your router fills / the whole apartment / with radio waves.">
      ${G(530, 470, 0.98, `
        ${room(940, 720, 300, { t: 18 })}
        ${wallX(90, 0, 250, `<rect w="200" h="130" fill="$pale" stroke="$line" sw="2"/><line x1="100" y1="0" x2="100" y2="130" stroke="$line" sw="2"/>`)}
        ${wallY(0, 520, 250, `<rect w="160" h="130" fill="$pale" stroke="$line" sw="2"/><line x1="80" y1="0" x2="80" y2="130" stroke="$line" sw="2"/>`)}
        ${box(560, 0, 0, 14, 330, 300, NEU)}
        ${box(600, 0, 0, 240, 90, 110)}${box(840, 0, 0, 90, 90, 270)}${box(600, 0, 190, 240, 50, 70)}
        ${floor(640, 10, 110, `<rect w="90" h="60" r="6" fill="$shade" stroke="$line" sw="1.5"/>`)}
        ${floor(80, 380, 0, `<rect w="420" h="300" r="8" fill="$shade" stroke="$line" sw="1.5"/>`)}
        ${fadeIn(`=cue('b1.1')`, floor(250, 250, 1, `<circle r="140" fill="$green" opacity="0.18"/><circle r="260" fill="none" stroke="$green" sw="6" opacity="0.5"/><circle r="400" fill="none" stroke="$green" sw="6" opacity="0.3"/>`))}
        ${box(60, 30, 90, 280, 120, 14, WOOD)}${box(70, 40, 0, 14, 14, 90, WOOD)}${box(320, 40, 0, 14, 14, 90, WOOD)}${box(70, 130, 0, 14, 14, 90, WOOD)}${box(320, 130, 0, 14, 14, 90, WOOD)}
        ${box(150, 60, 104, 130, 80, 6)}${box(150, 60, 110, 130, 6, 80, NEU)}${wallX(156, 66, 184, `<rect w="118" h="68" fill="$pale"/>`)}
        ${box(230, 230, 0, 50, 50, 60, WOOD)}
        ${box(236, 236, 60, 38, 30, 14, DARK)}<line x1="${pt(240, 240, 74).join('" y1="')}" x2="${pt(240, 240, 120).join('" y2="')}" stroke="$ink" sw="4"/><line x1="${pt(270, 240, 74).join('" y1="')}" x2="${pt(270, 240, 120).join('" y2="')}" stroke="$ink" sw="4"/>
        ${sofa}
        ${person(...pt(470, 230), 2.4, '$deep')}
        ${box(780, 420, 0, 120, 120, 40, WOOD)}<line x1="${pt(880, 640).join('" y1="')}" x2="${pt(880, 640, 220).join('" y2="')}" stroke="$ink" sw="3"/><circle x="${pt(880, 640, 230)[0]}" y="${pt(880, 640, 230)[1]}" r="24" fill="$tile" stroke="$line" sw="2"/>`)}
      <tx:chip x="540" y="330" text="Home Wi-Fi" icon="wifi" size="38" at="=cue('b1.0')" hl="=tx:on(cue('b1.0'), cue('b1.1'))"/>
    </tx:beat>`;

// 2 · close inside one room: the waves cross it, one appliance shares the band
const b2 = `    <tx:beat id="b2" chapter="Microwave" plate="1" say="Your microwave oven / works at 2.45 gigahertz, / right inside the Wi-Fi band.">
      ${G(330, 330, 1.35, `
        ${room(820, 760, 330)}
        ${wallY(0, 560, 280, `<rect w="200" h="150" fill="$pale" stroke="$line" sw="2"/><line x1="100" y1="0" x2="100" y2="150" stroke="$line" sw="2"/>`)}
        ${box(80, 0, 0, 720, 110, 120)}
        ${wallX(80, 110, 120, `<rect repeat="4" as="k" x="=10 + k*178" y="12" w="166" h="96" r="4" fill="none" stroke="$line" sw="2"/><rect repeat="4" as="k" x="=73 + k*178" y="24" w="40" h="6" r="3" fill="$line"/>`)}
        ${box(80, 0, 210, 420, 60, 90)}
        ${box(120, 20, 120, 80, 56, 22, DARK)}<line x1="${pt(130, 30, 142).join('" y1="')}" x2="${pt(130, 30, 200).join('" y2="')}" stroke="$ink" sw="4"/><line x1="${pt(190, 30, 142).join('" y1="')}" x2="${pt(190, 30, 200).join('" y2="')}" stroke="$ink" sw="4"/>
        ${box(520, 10, 120, 200, 100, 100, NEU)}
        ${wallX(520, 110, 210, `<rect x="12" y="12" w="128" h="76" r="6" fill="#2f3830" stroke="$ink" sw="2"/><rect x="12" y="12" w="128" h="76" r="6" fill="$lime" at="=cue('b2.1')"><anim prop="opacity" from="0" to="1" dur="0.3"/></rect><rect x="152" y="14" w="36" h="16" r="3" fill="$shade" stroke="$line" sw="1"/><circle repeat="4" as="k" x="=162 + (k % 2)*16" y="=50 + floor(k/2)*18" r="5" fill="$line"/>`)}
        ${box(470, 330, 0, 300, 160, 100, WOOD)}${box(450, 310, 100, 340, 200, 12)}${person(...pt(360, 520), 4.2, '$deep')}
        ${box(700, 0, 0, 120, 110, 320)}
      `)}
      <group at="=cue('b2.0') - 0.2">
        <path d="M470 300 L1100 700 M470 300 L 1100 380 M470 300 L 620 1300 M470 300 L 0 1100" fill="none" stroke="$line" sw="16" cap="round" opacity="0.5"><anim prop="draw" from="0" to="1" dur="0.8"/></path>
        <path d="M470 300 L1100 700 M470 300 L 1100 380 M470 300 L 620 1300 M470 300 L 0 1100" fill="none" stroke="#ffffff" sw="10" cap="round"><anim prop="draw" from="0" to="1" dur="0.8"/></path>
      </group>
      <tx:label x="250" y="330" text="Wi-Fi" sub="2.4 GHz" tx="455" ty="290" at="=cue('b2.0') + 0.3" op="=tx:fade(cue('b2.1'), sdur, 0.5)"/>
      <tx:label x="900" y="330" text="Microwave" sub="2.45 GHz" tx="890" ty="560" at="=cue('b2.1')" hl="=tx:on(cue('b2.1'), sdur)"/>
    </tx:beat>`;

// 3 · one city block: an office tower, a low windowless hall, trees, a street
const hallRoof = Array.from({ length: 8 }, (_, k) => box(410 + (k % 4) * 95, 110 + Math.floor(k / 4) * 120, 120, 60, 60, 26, GRN)).join('');
const b3 = `    <tx:beat id="b3" chapter="Data center" say="This plain building / is a data center, / where your photos live.">
      ${G(500, 560, 0.85, `
        ${floor(-300, -300, -20, `<rect w="1500" h="1400" fill="#d9ebe6" stroke="$line" sw="2"/>`)}
        ${box(-40, -40, -20, 980, 760, 20, { top: '#efeadb', left: '#e2dccb', right: '#d3ccb8' })}
        ${floor(-40, 560, 0, `<rect w="980" h="160" fill="$shade"/><rect repeat="12" as="k" x="=20 + k*80" y="76" w="44" h="8" fill="$tile"/>`)}
        ${box(60, 40, 0, 220, 200, 400, NEU)}
        ${wallX(60, 240, 380, panes(5, 9, 30, 26, 12, 14))}
        ${wallY(280, 240, 380, panes(5, 9, 28, 26, 12, 14))}
        ${pop(`=cue('b3.1')`, box(380, 80, 0, 440, 300, 120, { top: '$tile', left: '#efe9da', right: '#ddd6c3' }) + hallRoof + wallX(380, 380, 80, `<rect x="40" y="30" w="60" h="50" fill="$line"/>`))}
        ${house(650, 440, 70, 60, 40, 24)}
        ${[[340, 470], [460, 500], [880, 120], [880, 300], [20, 420], [120, 460]].map(([x, y]) => tree(x, y, 34)).join('')}
      `)}
      <tx:label x="760" y="380" text="Data center" sub="no windows, lots of power" tx="720" ty="620" at="=cue('b3.1') + 0.2" hl="=tx:on(cue('b3.1') + 0.2, sdur)"/>
      <tx:chip x="300" y="1120" text="Your photos" icon="image" size="34" at="=cue('b3.2')"/>
    </tx:beat>`;

// 4 · a map from above that fills the frame: blocks, a park, green markers
const blocks = [];
for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if (!((i === 2 || i === 3) && (j === 2))) blocks.push(`<rect x="${i * 330}" y="${j * 330}" w="260" h="260" r="24" fill="$pale" stroke="$line" sw="2.5"/><rect x="${i * 330 + 40 + ((i * 3 + j) % 3) * 40}" y="${j * 330 + 50}" w="90" h="70" r="6" fill="$tile" stroke="$line" sw="2"/>`);
const markers = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i * 5 + j * 3) % 3 !== 0 && !((i === 2 || i === 3) && j === 2)) markers.push([i, j]);
const parkTrees = [];
for (let k = 0; k < 26; k++) { const X = 690 + ((k * 37) % 560), Y = 690 + ((k * 61) % 230); parkTrees.push([X + Y, tree(X, Y, 30)]); }
const b4 = `    <tx:beat id="b4" chapter="Chargers" plate="1" zoom="1.08" zx="540" zy="760" say="Every green dot / is a public charger / for electric cars.">
      ${G(560, -180, 0.9, `
        ${floor(0, 0, 0, `<rect x="-200" y="-200" w="2400" h="2400" fill="$bg"/>${blocks.join('')}
          <rect x="660" y="660" w="590" h="260" r="24" fill="$mid" stroke="$line" sw="2.5"/>
          <path d="M660 800 C 800 760 900 860 1050 800 C 1150 760 1200 820 1250 790" fill="none" stroke="#cfe4e2" sw="34"/>
          <path d="M700 700 C 800 900 1000 700 1200 880" fill="none" stroke="#e9dcc0" sw="8" dash="4 10"/>`)}
        ${byDepth(parkTrees)}
        ${floor(0, 0, 1, markers.map(([i, j], k) => `<group x="${i * 330 + 200}" y="${j * 330 + 200}" at="=cue('b4.0') + ${(0.08 * k).toFixed(2)}"><anim prop="scale" from="0" to="1" dur="0.35" ease="back"/><circle r="34" fill="$lime" stroke="$ink" sw="5"/><circle r="12" fill="$green"/></group>`).join(''))}
      `)}
      <tx:label x="540" y="330" text="Public charger" sub="22 kW" at="=cue('b4.1')" hl="=tx:on(cue('b4.1'), sdur)"/>
    </tx:beat>`;

// 5 · a town of houses to the edges of the frame, one number floating in a clearing
const town = [];
for (let i = -8; i < 24; i++) for (let j = -8; j < 24; j++) {
  const X = i * 100 + (j % 2) * 30, Y = j * 92;
  const [sx, sy] = P(X, Y);
  if (sx < -650 || sx > 650 || sy < -260 || sy > 1720) continue;
  const clear = Math.hypot(sx, sy - 560) < 210;
  if (clear) { if ((i + j) % 2 === 0) town.push([X + Y, tree(X + 30, Y + 20, 22)]); continue; }
  if ((i * 7 + j * 3) % 9 === 0) { town.push([X + Y, tree(X + 30, Y + 30, 24)]); continue; }
  town.push([X + Y, house(X, Y, 58, 46, 28, 18, undefined, (i * 5 + j) % 11 === 0 ? '$mid' : '#d9d2bf', { sw: 1.5 })]);
}
const b5 = `    <tx:beat id="b5" chapter="Devices" plate="1" say="Every one of these homes / has about 20 connected devices.">
      ${fadeIn(0, G(540, 230, 1, byDepth(town)))}
      <tx:stat x="540" y="790" value="≈ 20" sub="devices per home" size="110" at="=cue('b5.1')"/>
    </tx:beat>`;

// 6 · the calm wide shot: a small hall of racks on one slab, the rest of the frame empty
const racks = [];
for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) {
  const X = 40 + k * 82, Y = 50 + r * 170;
  racks.push(box(X, Y, 18, 60, 80, 170, NEU, { sw: 1.5 }) + wallX(X, Y + 80, 188, `<rect repeat="5" as="q" x="8" y="=14 + q*30" w="44" h="18" fill="${(r + k) % 4 === 0 ? '$green' : '$pale'}" stroke="$line" sw="1.2"/>`));
}
const b6 = `    <tx:beat id="b6" chapter="Racks" say="And that's where / it all ends up.">
      ${G(560, 560, 0.72, pop(0.1, box(0, 0, 0, 640, 560, 18, { top: '$tile', left: '#efe9da', right: '#ddd6c3' }) + floor(0, 0, 18, `<rect repeat="11" as="k" x="0" y="=k*52" w="640" h="1" fill="$shade"/><rect repeat="13" as="k" x="=k*52" y="0" w="1" h="560" fill="$shade"/>`) + racks.join('')))}
    </tx:beat>`;

write(2, doc('Isometric worlds', [b1, b2, b3, b4, b5, b6]));
