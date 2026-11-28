import { P, box, face, floor, wallX, wallY, pop, fadeIn, G, limb, doc, write, NEU, WOOD, DARK, GRN, tree } from './gen.mjs';

// 1 · device as the stage: a huge laptop bleeding off the frame, its battery window with one big number
const b1 = `    <tx:beat id="b1" chapter="Battery health" plate="1" say="Your laptop says / the battery is at 82%. / But 82% of what?">
      ${G(-40, 980, 1.12, `
        ${wallX(0, 0, 720, `<rect w="1100" h="720" r="30" fill="$tile" stroke="$ink" sw="4"/><rect x="26" y="26" w="1048" h="668" r="14" fill="$bg" stroke="$line" sw="2"/>
          <tx:window x="80" y="70" w="940" h="560" title="Battery" at="0.1">
            <i:icon name="battery-charging" size="54" color="$ink" x="36" y="50"/>
            <text x="80" y="50" size="44" weight="700" font="Outfit" fill="$ink" text="Battery health"/>
            <rect x="10" y="110" w="880" h="34" r="17" fill="$shade"/>
            <rect x="10" y="110" w="722" h="34" r="17" fill="$green" at="=cue('b1.1')"><anim prop="w" from="0" to="722" dur="0.7" ease="out"/></rect>
            <rect x="10" y="190" w="460" h="150" r="12" fill="$lime" at="=cue('b1.1') + 0.3"><anim prop="w" from="0" to="460" dur="0.4" ease="io"/></rect>
            <text x="30" y="268" size="160" weight="800" font="Outfit" fill="$ink" text="82%" at="=cue('b1.1')"><anim prop="scale" from="0.8" to="1" dur="0.35" ease="back"/></text>
            <text x="500" y="268" size="40" weight="500" font="Outfit" fill="$muted" text="max capacity" at="=cue('b1.1') + 0.4"/>
          </tx:window>`)}
        ${box(0, 0, -34, 1100, 760, 34, { top: '$tile', left: '#ece6d6', right: '#ddd6c3' }, { stroke: '$ink', sw: 3 })}
        ${floor(50, 70, 0, `<rect repeat="70" as="k" x="=(k % 14)*71" y="=floor(k/14)*64" w="62" h="54" r="9" fill="$tile" stroke="$line" sw="2"/>
          <rect x="320" y="370" w="360" h="300" r="16" fill="none" stroke="$line" sw="2.5"/>`)}
        ${face([[1100, 300, -10], [1100, 360, -10], [1100, 360, -24], [1100, 300, -24]], '$ink', { sw: 1 })}
        <path d="M${P(1100, 330, -17).join(' ')} C ${P(1240, 330, -17).join(' ')} ${P(1300, 380, -40).join(' ')} ${P(1400, 300, -60).join(' ')}" fill="none" stroke="$ink" sw="9" cap="round"/>
        <path d="M${P(1100, 330, -17).join(' ')} C ${P(1240, 330, -17).join(' ')} ${P(1300, 380, -40).join(' ')} ${P(1400, 300, -60).join(' ')}" fill="none" stroke="$tile" sw="5" cap="round"/>`)}
    </tx:beat>`;

// 2 · a device in a room: TV on a media cabinet, the screen mid-download
const tvScreen = `<rect w="508" h="290" fill="$tile"/>
  <tx:tile x="110" y="132" icon="refresh-cw" size="150" at="0.2"/>
  <text x="215" y="86" size="30" weight="700" font="Outfit" fill="$ink" text="System update"/>
  <text x="215" y="236" size="24" font="Outfit" fill="$muted" text="1.6 GB"/>
  <rect x="215" y="160" w="260" h="18" r="9" fill="$shade"/>
  <rect x="215" y="160" w="34" h="18" r="9" fill="$green" at="=cue('b2.1')"><anim prop="w" from="0" to="34" dur="0.6" ease="out"/></rect>
  <text x="475" y="150" size="24" weight="700" font="Outfit" align="right" fill="$green" text="12%" at="=cue('b2.1') + 0.3"/>`;
const b2 = `    <tx:beat id="b2" chapter="TV update" plate="1" zoom="1.06" zx="560" zy="700" say="Even your TV / quietly downloads / a 1.6 gigabyte update.">
      ${G(400, 800, 1.45, `
        ${face([[-260, -260, 520], [900, -260, 520], [900, -260, 0], [-260, -260, 0]], 'none', { stroke: '$dim' })}
        ${face([[-260, -260, 520], [-260, 900, 520], [-260, 900, 0], [-260, -260, 0]], 'none', { stroke: '$dim' })}
        ${floor(-120, 300, 0, `<rect w="760" h="420" r="10" fill="none" stroke="$dim" sw="2.5"/><rect x="24" y="24" w="712" h="372" r="6" fill="none" stroke="$dim" sw="1.5"/>`)}
        ${box(0, 0, 0, 660, 200, 150)}
        ${wallX(0, 200, 150, `<rect repeat="4" as="k" x="=12 + k*162" y="14" w="150" h="122" r="6" fill="none" stroke="$line" sw="2"/><rect repeat="4" as="k" x="=74 + k*162" y="30" w="26" h="6" r="3" fill="$line"/>`)}
        ${box(270, 70, 150, 120, 60, 10, DARK)}
        ${box(60, 84, 170, 540, 14, 310, { top: '$ink', left: '$ink', right: '$ink' }, { stroke: '$ink' })}
        ${wallX(76, 98, 464, tvScreen)}
        ${box(150, 150, 150, 340, 36, 30, DARK)}
        ${box(520, 120, 150, 100, 64, 22, DARK)}
        ${face([[600, 184, 163], [612, 184, 163], [612, 184, 157], [600, 184, 157]], '$lime', { sw: 0 })}
        ${box(700, 40, 0, 74, 74, 250, NEU)}
        ${wallX(700, 114, 250, `<circle x="37" y="60" r="20" fill="none" stroke="$line" sw="2"/><circle x="37" y="150" r="28" fill="none" stroke="$line" sw="2"/>`)}
        <line x1="${P(20, 40, 150).join('" y1="')}" x2="${P(-30, 40, 330).join('" y2="')}" stroke="$ink" sw="4"/><circle x="${P(-30, 40, 330)[0]}" y="${P(-30, 40, 330)[1]}" r="8" fill="$tile" stroke="$ink" sw="3"/>`)}
    </tx:beat>`;

// 3 · a phone turned sideways: a map with you, the heading cone and the route
const map = `<rect w="676" h="296" r="36" fill="$pale"/>
  <path d="M0 210 C 160 180 260 250 420 200 C 540 160 600 190 676 170" fill="none" stroke="#cfe4e2" sw="34"/>
  <path d="M110 0 L210 296 M0 96 L676 60 M470 0 L520 296" fill="none" stroke="$line" sw="30" cap="round"/>
  <path d="M110 0 L210 296 M0 96 L676 60 M470 0 L520 296" fill="none" stroke="$tile" sw="24" cap="round"/>
  <rect x="250" y="120" w="150" h="56" r="8" fill="$mid" stroke="$line" sw="2"/>
  <rect x="560" y="100" w="90" h="60" r="8" fill="$mid" stroke="$line" sw="2"/>
  ${[[30, 130], [60, 160], [320, 240], [380, 250], [600, 230], [640, 10]].map(([x, y]) => `<circle x="${x}" y="${y}" r="14" fill="$deep" stroke="$line" sw="2"/>`).join('')}
  <path d="M160 150 L330 82 L495 78 L500 30" fill="none" stroke="$green" sw="9" dash="2 16" cap="round" at="=cue('b3.1')"><anim prop="draw" from="0" to="1" dur="0.8"/></path>
  <path d="M160 150 L80 40 A 140 140 0 0 1 250 40 Z" fill="$green" opacity="0.22" at="=cue('b3.1')"><anim prop="scale" from="0" to="1" dur="0.5" ease="out"/></path>
  <circle x="160" y="150" r="22" fill="$tile" stroke="$ink" sw="2"/><circle x="160" y="150" r="14" fill="$green"/>
  <group x="500" y="20" at="=cue('b3.2')"><anim prop="scale" from="0" to="1" dur="0.35" ease="back"/><i:icon name="map-pin" size="56" color="$ink"/></group>`;
const b3 = `    <tx:beat id="b3" chapter="Which way" say="So how does your phone / know which way / you're facing?">
      <group x="540" y="760" rot="-10" scale="1.38"><group at="0.1"><anim prop="opacity" from="0" to="1" dur="0.3"/><anim prop="y" from="40" to="0" dur="0.5" ease="out"/>
        <rect x="-352" y="-162" w="720" h="340" r="60" fill="$shade"/>
        <rect x="-360" y="-170" w="720" h="340" r="60" fill="$tile" stroke="$ink" sw="5"/>
        <rect x="-340" y="-150" w="680" h="300" r="40" fill="$bg" stroke="$line" sw="1.5"/>
        <group x="-338" y="-148">${map}</group>
        <rect x="-336" y="-46" w="22" h="92" r="11" fill="$ink"/>
        <rect x="-120" y="-176" w="90" h="8" r="4" fill="$line"/><rect x="-10" y="-176" w="60" h="8" r="4" fill="$line"/>
      </group></group>
      <tx:label x="830" y="360" text="Compass" sub="+ GPS" tx="700" ty="560" at="=cue('b3.1') + 0.3" hl="=tx:on(cue('b3.1') + 0.3, sdur)"/>
    </tx:beat>`;

// 4 · a person seen from behind at an old computer (bleeds off the frame)
const crtScreen = `<rect w="330" h="240" r="22" fill="#e9e2cf" stroke="$line" sw="2"/>
  <rect x="18" y="16" w="294" h="200" r="16" fill="#26302a" stroke="$ink" sw="3"/>
  <text x="38" y="52" size="20" font="JetBrains Mono" fill="$deep" text="ATDT 555 0134" when="=T &lt; cue('b4.1')"/>
  <text x="38" y="52" size="20" font="JetBrains Mono" fill="$lime" text="CONNECT 56000" at="=cue('b4.1')"/>
  <rect x="38" y="150" w="250" h="16" r="4" fill="none" stroke="$deep" sw="2" at="=cue('b4.1')"/>
  <rect x="38" y="150" w="170" h="16" r="4" fill="$lime" at="=cue('b4.1') + 0.2"><anim prop="w" from="0" to="170" dur="1.2"/></rect>`;
const b4 = `    <tx:beat id="b4" chapter="Dial-up" plate="1" say="Back when the internet / came through a phone line, / at 56 kilobits a second.">
      ${G(560, 560, 1.35, `
        ${box(-300, -150, -30, 1100, 820, 30, WOOD)}
        ${box(190, 110, 0, 230, 200, 30, NEU)}
        ${box(120, 40, 30, 380, 360, 300, NEU)}
        ${floor(150, 70, 330, `<rect repeat="9" as="k" x="20" y="=20 + k*26" w="260" h="8" r="4" fill="$shade"/>`)}
        ${wallX(145, 400, 310, crtScreen)}
        ${wallX(145, 400, 60, `<rect repeat="4" as="k" x="=90 + k*44" y="8" w="34" h="16" r="8" fill="none" stroke="$line" sw="2"/><circle x="300" y="16" r="11" fill="none" stroke="$line" sw="2"/><circle x="268" y="16" r="4" fill="$green"/>`)}
        ${box(560, 120, 0, 130, 130, 230, NEU)}
        ${wallX(560, 250, 200, `<circle x="65" y="50" r="34" fill="$shade" stroke="$line" sw="2"/><circle x="65" y="50" r="12" fill="$line"/><circle x="65" y="140" r="22" fill="none" stroke="$line" sw="2"/>`)}
        ${box(110, 470, 0, 380, 150, 18, NEU)}
        ${floor(120, 480, 18, `<rect repeat="42" as="k" x="=(k % 14)*25" y="=floor(k/14)*30 + 14" w="20" h="22" r="4" fill="$tile" stroke="$line" sw="1.5"/>`)}`)}
      <group at="0.1"><anim prop="opacity" from="0" to="1" dur="0.3"/><anim prop="y" from="60" to="0" dur="0.5" ease="out"/>
        ${limb('M330 1430 C 420 1330 520 1280 600 1250', 110, '$deep')}
        <circle x="610" y="1240" r="48" fill="$tile" stroke="$ink" sw="5"/>
        <path d="M-60 1960 L-60 1420 C -40 1300 80 1250 180 1250 C 300 1250 400 1310 430 1440 L 470 1960 Z" fill="$deep" stroke="$ink" sw="6"/>
        <path d="M60 1300 C 100 1240 260 1240 310 1300 C 260 1350 110 1350 60 1300 Z" fill="$mid" stroke="$ink" sw="5"/>
        <circle x="190" y="1130" r="135" fill="#4b3b2e" stroke="$ink" sw="6"/>
        <path d="M310 1110 C 330 1100 340 1150 318 1165" fill="#e8c9a8" stroke="$ink" sw="5"/>
      </group>
      <tx:label x="820" y="330" text="56 kbit/s" mono="1" sub="about 7 KB a second" at="=cue('b4.2')" hl="=tx:on(cue('b4.2'), sdur)"/>
    </tx:beat>`;

// 5 · one phone, everything radiating out of it (dashed rays, icon tiles around)
const b5 = `    <tx:beat id="b5" chapter="Permissions" say="And every app / that asks for your location / gets a little more.">
      <group at="0.05"><line repeat="24" as="k" x1="540" y1="740" x2="=540 + 1000*cos(k*PI/12 + 0.13)" y2="=740 + 1000*sin(k*PI/12 + 0.13)" stroke="$dim" sw="2.5" dash="10 12"><anim prop="draw" from="0" to="1" dur="0.8"/></line></group>
      <rect repeat="10" as="k" x="=540 + (330 + (k % 3)*110)*cos(k*PI/5 + 0.4) - 7" y="=740 + (330 + (k % 3)*110)*sin(k*PI/5 + 0.4) - 7" w="14" h="14" r="2" fill="$muted" at="=0.3 + 0.05*k"/>
      <tx:phone x="400" y="440" w="280" h="580" tilt="-8" at="0.1">
        <rect w="252" h="552" r="36" fill="$pale"/>
        <rect x="20" y="70" w="212" h="90" r="14" fill="$tile" stroke="$line" sw="1.5"/><rect x="20" y="176" w="140" h="14" r="7" fill="$shade"/><rect x="20" y="202" w="180" h="14" r="7" fill="$shade"/>
        <rect w="252" h="552" r="36" fill="$ink" opacity="0.35" at="=cue('b5.1')"/>
        <group x="16" y="250" at="=cue('b5.1')"><anim prop="scale" from="0.85" to="1" dur="0.3" ease="back"/><anim prop="opacity" from="0" to="1" dur="0.2"/>
          <rect w="220" h="240" r="18" fill="$tile" stroke="$ink" sw="2"/>
          <circle x="110" y="44" r="26" fill="$pale"/><i:icon name="map-pin" size="30" color="$green" x="110" y="44"/>
          <text x="110" y="100" size="19" weight="700" font="Outfit" align="center" maxw="190" lh="1.15" fill="$ink" text="Allow Weather to use your location?"/>
          <rect x="16" y="150" w="188" h="36" r="18" fill="$green"/><text x="110" y="168" size="18" weight="700" font="Outfit" align="center" fill="#ffffff" text="Allow while using"/>
          <text x="110" y="214" size="18" weight="600" font="Outfit" align="center" fill="$muted" text="Don't allow"/>
        </group>
      </tx:phone>
      <tx:tile x="190" y="430" icon="map-pin" size="120" at="=cue('b5.1') + 0.2"/>
      <tx:tile x="890" y="400" icon="camera" size="120" at="=cue('b5.2')"/>
      <tx:tile x="170" y="1080" icon="mic" size="120" at="=cue('b5.2') + 0.2"/>
      <tx:tile x="900" y="1100" icon="contact-round" size="120" at="=cue('b5.2') + 0.4"/>
    </tx:beat>`;

// 6 · a big tilted phone with a settings screen, a faded room behind it
const settings = `<rect w="492" h="1052" r="36" fill="$bg"/>
  <text x="34" y="80" size="22" weight="700" font="Outfit" fill="$ink" text="9:41"/>
  <text x="34" y="130" size="24" font="Outfit" fill="$muted" text="‹ Settings"/>
  <text x="34" y="190" size="48" weight="800" font="Outfit" fill="$ink" text="Battery"/>
  <rect x="24" y="240" w="444" h="230" r="22" fill="$tile" stroke="$line" sw="2"/>
  <text x="52" y="290" size="28" weight="700" font="Outfit" fill="$ink" text="Charge limit"/>
  <rect x="52" y="356" w="388" h="12" r="6" fill="$shade"/>
  <rect x="52" y="356" w="=lerp(388, 300, tx:grow(cue('b6.2'), 0.6))" h="12" r="6" fill="$green"/>
  <circle x="=52 + lerp(388, 300, tx:grow(cue('b6.2'), 0.6))" y="362" r="22" fill="$tile" stroke="$green" sw="5"/>
  <text x="52" y="420" size="22" font="Outfit" fill="$muted" text="70%"/>
  <text x="352" y="420" size="24" weight="700" font="Outfit" align="center" fill="$green" text="80%" at="=cue('b6.2') + 0.4"/>
  <text x="440" y="420" size="22" font="Outfit" align="right" fill="$muted" text="100%"/>
  <rect x="24" y="500" w="444" h="110" r="22" fill="$tile" stroke="$line" sw="2"/>
  <text x="52" y="558" size="26" weight="700" font="Outfit" fill="$ink" text="Smart charging"/>
  <rect x="372" y="538" w="72" h="40" r="20" fill="$ink" at="=cue('b6.1')"/><circle x="=lerp(392, 424, tx:grow(cue('b6.1'), 0.3))" y="558" r="15" fill="$tile"/>
  <rect x="24" y="640" w="444" h="90" r="22" fill="$tile" stroke="$line" sw="2"/>
  <text x="52" y="690" size="26" weight="700" font="Outfit" fill="$ink" text="Battery health"/><text x="440" y="690" size="26" weight="700" font="Outfit" align="right" fill="$ink" text="82%"/>
  <rect x="24" y="760" w="444" h="90" r="22" fill="$tile" stroke="$line" sw="2"/>
  <text x="52" y="810" size="26" weight="700" font="Outfit" fill="$ink" text="Low Power Mode"/><rect x="372" y="790" w="72" h="40" r="20" fill="$shade"/><circle x="392" y="810" r="15" fill="$tile"/>`;
const b6 = `    <tx:beat id="b6" chapter="Charge limit" say="So the phone / can stop charging / at 80 percent.">
      ${fadeIn(0, G(700, 470, 0.9, `
        ${face([[0, 0, 360], [600, 0, 360], [600, 0, 0], [0, 0, 0]], '$pale', { op: 0.9 })}
        ${face([[0, 0, 360], [0, 600, 360], [0, 600, 0], [0, 0, 0]], '$tile')}
        ${floor(0, 0, 0, `<rect w="600" h="600" fill="$tile" stroke="$line" sw="2"/>`)}
        ${box(260, 30, 0, 300, 100, 80, NEU)}${box(260, 30, 80, 300, 30, 70, NEU)}
        ${box(60, 30, 0, 70, 70, 160, NEU)}
        ${box(330, 260, 0, 160, 110, 40, WOOD)}
        ${box(380, 290, 40, 30, 20, 120, NEU)}${box(340, 270, 160, 110, 70, 10, GRN)}
        ${wallX(150, 0, 300, `<rect w="180" h="120" r="6" fill="$tile" stroke="$line" sw="2"/><line x1="90" y1="0" x2="90" y2="120" stroke="$line" sw="2"/>`)}
        ${wallY(0, 520, 330, `<rect w="320" h="40" fill="$shade" stroke="$line" sw="2"/>`)}`, ' opacity="0.75"'))}
      <tx:phone x="160" y="250" w="520" h="1080" tilt="-14" at="0.15">${settings}</tx:phone>
    </tx:beat>`;

write(1, doc('Devices and screens', [b1, b2, b3, b4, b5, b6]));
