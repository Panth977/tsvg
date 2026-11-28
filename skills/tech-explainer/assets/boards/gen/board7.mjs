import { P, box, face, floor, wallX, wallY, pop, fadeIn, G, limb, doc, write, NEU, WOOD, DARK, GRN } from './gen.mjs';
const pt = (X, Y, Z = 0) => P(X, Y, Z).map((n) => Math.round(n));
// the channel card's parts: avatar, name, Follow button (the channel is always the user's own)
const avatar = (x, y, r, t = 0.2) => `<group x="${x}" y="${y}" at="${t}"><anim prop="scale" from="0" to="1" dur="0.45" ease="back"/><circle r="${r}" fill="$green"/><i:icon name="sparkles" size="${Math.round(r * 1.1)}" color="#ffffff" sw="2.2"/></group>`;
const button = (x, y, w, h, t, size = 30) => `<group x="${x}" y="${y}" at="${t}"><anim prop="scale" from="0.6" to="1" dur="0.4" ease="back"/><anim prop="opacity" from="0" to="1" dur="0.2"/><rect x="${-w / 2}" y="${-h / 2}" w="${w}" h="${h}" r="${h * 0.22}" fill="$green"/><text y="1" size="${size}" weight="700" font="Outfit" align="center" fill="#ffffff" text="+ Follow"/></group>`;

// 1 · the library's own end card
const b1 = `    <tx:follow id="b1" channel="Your Channel" say="Follow Your Channel, / and next time, / I'll show you where deleted files go."/>`;

// 2 · the card on a laptop screen that bleeds off the frame
const b2 = `    <tx:beat id="b2" chapter="Laptop" plate="1" say="Follow for more, / and next time, / we open up a power bank.">
      ${G(-60, 960, 1.1, `
        ${wallX(0, 0, 720, `<rect w="1100" h="720" r="30" fill="$tile" stroke="$ink" sw="4"/><rect x="26" y="26" w="1048" h="668" r="14" fill="$bg" stroke="$line" sw="2"/>
          <i:icon name="monitor" size="34" color="$ink" x="70" y="70"/><text x="100" y="70" size="30" weight="700" font="Outfit" fill="$ink" text="This laptop"/>
          <group x="120" y="130" at="0.1"><anim prop="opacity" from="0" to="1" dur="0.3"/>
            <rect y="8" w="820" h="440" r="18" fill="$shade"/><rect w="820" h="440" r="18" fill="$tile" stroke="$ink" sw="3"/>
            ${avatar(90, 90, 56)}
            <text x="170" y="90" size="50" weight="800" font="Outfit" fill="$ink" text="Your Channel"/>
            <rect x="40" y="180" w="740" h="44" r="10" fill="$green" at="=cue('b2.0')"><anim prop="w" from="0" to="740" dur="0.6" ease="out"/></rect>
            ${button(410, 340, 300, 80, `=cue('b2.1')`, 36)}
          </group>`)}
        ${box(0, 0, -34, 1100, 760, 34, { top: '$tile', left: '#ece6d6', right: '#ddd6c3' }, { stroke: '$ink', sw: 3 })}
        ${floor(50, 70, 0, `<rect repeat="70" as="k" x="=(k % 14)*71" y="=floor(k/14)*64" w="62" h="54" r="9" fill="$tile" stroke="$line" sw="2"/><rect x="320" y="370" w="360" h="300" r="16" fill="none" stroke="$line" sw="2.5"/>`)}`)}
    </tx:beat>`;

// 3 · a caption card at the top, a small phone with the channel page under it
const b3 = `    <tx:beat id="b3" chapter="Phone page" cy="330" csize="46" say="Follow Your Channel, / and next time, / the trick inside a QR code.">
      <group at="0.05"><anim prop="opacity" from="0" to="1" dur="0.3"/><rect x="200" y="252" w="680" h="170" r="14" fill="$shade"/><rect x="200" y="244" w="680" h="170" r="14" fill="$tile" stroke="$ink" sw="3"/></group>
      <tx:phone x="400" y="520" w="290" h="600" tilt="0" at="0.2">
        <rect w="262" h="572" r="36" fill="$bg"/>
        <text x="24" y="80" size="22" font="Outfit" fill="$muted" text="‹"/>
        ${avatar(131, 160, 52)}
        <text x="131" y="250" size="28" weight="800" font="Outfit" align="center" fill="$ink" text="Your Channel"/>
        ${button(131, 310, 170, 52, `=cue('b3.1')`, 24)}
        <rect x="12" y="380" w="76" h="110" fill="$lime" stroke="$line" sw="1.5"/><rect x="93" y="380" w="76" h="110" fill="$green" stroke="$line" sw="1.5"/><rect x="174" y="380" w="76" h="110" fill="$pale" stroke="$line" sw="1.5"/>
        <i:icon name="qr-code" size="40" color="$ink" x="50" y="435"/><i:icon name="globe" size="40" color="#ffffff" x="131" y="435"/><i:icon name="battery" size="40" color="$ink" x="212" y="435"/>
      </tx:phone>
      <ellipse x="545" y="1150" rx="150" ry="22" fill="$shade" at="0.2"/>
    </tx:beat>`;

// 4 · an old CRT, huge, the card on its dark screen; keyboard bleeding off the bottom
const crt = `<rect w="560" h="420" r="40" fill="#e9e2cf" stroke="$line" sw="3"/>
  <rect x="30" y="28" w="500" h="350" r="30" fill="#2c3530" stroke="$ink" sw="4"/>
  <rect x="60" y="56" w="440" h="290" r="16" fill="$tile" stroke="$ink" sw="2" at="0.2"/>
  ${avatar(110, 104, 34, 0.3)}<text x="160" y="104" size="34" weight="800" font="Outfit" fill="$ink" text="Your Channel" at="0.3"/>
  ${button(280, 250, 240, 64, `=cue('b4.1')`, 28)}`;
const b4 = `    <tx:beat id="b4" chapter="CRT" plate="1" say="Follow, and next time, / what a CPU fan / really does.">
      ${G(560, 640, 1.25, `${box(-500, -200, -30, 1300, 1100, 30, WOOD)}
        ${box(60, 60, 0, 300, 260, 30, NEU)}${box(20, 20, 30, 620, 460, 470, NEU)}
        ${floor(60, 60, 500, `<rect repeat="10" as="k" x="30" y="=30 + k*34" w="480" h="10" r="5" fill="$shade"/>`)}
        ${wallX(40, 480, 480, crt)}
        ${wallX(40, 480, 70, `<rect repeat="4" as="k" x="=160 + k*56" y="8" w="44" h="20" r="10" fill="none" stroke="$line" sw="2"/><circle x="480" y="18" r="14" fill="none" stroke="$line" sw="2"/><circle x="440" y="18" r="5" fill="$green"/>`)}
        ${box(0, 600, 0, 600, 240, 26, NEU)}
        ${floor(14, 614, 26, `<rect repeat="60" as="k" x="=(k % 15)*38" y="=floor(k/15)*50 + 10" w="32" h="40" r="5" fill="$tile" stroke="$line" sw="1.5"/>`)}`)}
    </tx:beat>`;

// 5 · a phone floating, tilted, alone, the follow screen on it
const b5 = `    <tx:beat id="b5" chapter="Floating phone" say="Follow Your Channel, / and next time, / how your phone finds Wi-Fi.">
      <ellipse x="560" y="1220" rx="200" ry="30" fill="$shade" at="0.2"/>
      <group x="540" y="740"><group rot="-14" x="-200" y="-420"><tx:phone x="0" y="0" w="400" h="820" tilt="-10" at="0.1">
        <rect w="372" h="792" r="36" fill="$bg"/>
        <i:icon name="lock" size="26" color="$ink" x="186" y="90"/>
        <rect x="24" y="130" w="324" h="620" r="24" fill="$tile" stroke="$line" sw="2"/>
        ${avatar(186, 230, 62)}
        <text x="186" y="340" size="34" weight="800" font="Outfit" align="center" fill="$ink" text="Your Channel"/>
        <text x="186" y="490" size="24" font="Outfit" align="center" maxw="280" lh="1.3" fill="$ink" text="Follow, and next time: how your phone finds Wi-Fi" at="=cue('b5.1')"/>
        ${button(186, 680, 240, 68, `=cue('b5.2')`, 30)}
      </tx:phone></group></group>
    </tx:beat>`;

// 6 · bookend: the person from the opening, at the monitor, the card floating over a wall of tiles
const b6 = `    <tx:beat id="b6" chapter="Bookend" cy="640" csize="46" say="Follow Your Channel / for more stories like this one. / See you next time.">
      ${fadeIn(0, `<group x="-40" y="-60">${Array.from({ length: 15 }, (_, k) => `<group x="${(k % 5) * 240 + (Math.floor(k / 5) % 2) * 120}" y="${Math.floor(k / 5) * 150}"><rect w="200" h="120" r="10" fill="$pale" stroke="$line" sw="2"/><rect x="14" y="14" w="172" h="92" r="6" fill="none" stroke="$mid" sw="2"/><circle x="80" y="70" r="16" fill="none" stroke="$ink" sw="3"/><circle x="120" y="50" r="10" fill="none" stroke="$ink" sw="3"/></group>`).join('')}</group>`, ' opacity="0.8"')}
      ${G(470, 1000, 1.4, `${box(140, 100, 0, 140, 90, 10, NEU)}${box(200, 120, 10, 20, 14, 120, NEU)}${box(0, 120, 110, 460, 18, 280, { top: '$ink', left: '$ink', right: '$ink' }, { stroke: '$ink' })}${wallX(10, 138, 380, `<rect w="440" h="260" fill="$pale"/><rect x="20" y="20" w="200" h="120" fill="$tile"/><rect x="240" y="20" w="180" h="220" fill="$mid"/>`)}`)}
      <group at="0.1"><anim prop="opacity" from="0" to="1" dur="0.3"/>
        <path d="M60 1960 L70 1480 C 90 1360 200 1320 300 1320 C 420 1320 490 1390 500 1500 L 520 1960 Z" fill="$deep" stroke="$ink" sw="6"/>
        ${limb('M450 1520 C 600 1560 760 1600 900 1560', 100, '$deep')}
        <circle x="910" y="1555" r="46" fill="$tile" stroke="$ink" sw="5"/>
        <circle x="290" y="1200" r="130" fill="#4b3b2e" stroke="$ink" sw="6"/>
        <path d="M165 1200 C 165 1050 415 1050 415 1200" fill="none" stroke="$ink" sw="22"/><rect x="138" y="1160" w="56" h="100" r="22" fill="$ink"/><rect x="388" y="1160" w="56" h="100" r="22" fill="$ink"/>
      </group>
      <group x="250" y="380" at="0.3"><anim prop="opacity" from="0" to="1" dur="0.3"/><anim prop="y" from="420" to="380" dur="0.5" ease="out"/>
        <rect y="10" w="580" h="520" r="20" fill="$shade"/><rect w="580" h="520" r="20" fill="$tile" stroke="$ink" sw="3"/>
        ${avatar(290, 110, 62, 0.4)}
        ${button(290, 430, 280, 76, `=cue('b6.1')`, 34)}
      </group>
    </tx:beat>`;

write(7, doc('Endings', [b1, b2, b3, b4, b5, b6]));
