// Helpers that emit plain TSVG for isometric drawings. X → down-right, Y → down-left, Z → up.
import { writeFileSync } from 'node:fs';
export const C = 0.866;
export const P = (X, Y, Z = 0) => [C * (X - Y), 0.5 * (X + Y) - Z];
const r1 = (n) => Math.round(n * 10) / 10;
export const pd = (pts) => 'M' + pts.map(([X, Y, Z]) => P(X, Y, Z).map(r1).join(' ')).join(' L') + ' Z';
export const face = (pts, fill, o = {}) => `<path d="${pd(pts)}" fill="${fill}" stroke="${o.stroke ?? '$line'}" sw="${o.sw ?? 2}"${o.op ? ` opacity="${o.op}"` : ''}/>`;
export const NEU = { top: '$tile', left: '#efe9da', right: '#ddd6c3' };
export const WOOD = { top: '#efe2c4', left: '#e2d1ab', right: '#d2bf95' };
export const GRN = { top: '$pale', left: '$mid', right: '$deep' };
export const LIME = { top: '$lime', left: '$green', right: '#24700a' };
export const DARK = { top: '#4a5148', left: '#363c35', right: '#2a2f29' };
export function box(X, Y, Z, w, d, h, c = NEU, o = {}) {
  return [
    face([[X, Y, Z + h], [X + w, Y, Z + h], [X + w, Y + d, Z + h], [X, Y + d, Z + h]], c.top, o),
    face([[X, Y + d, Z + h], [X + w, Y + d, Z + h], [X + w, Y + d, Z], [X, Y + d, Z]], c.left, o),
    face([[X + w, Y, Z + h], [X + w, Y + d, Z + h], [X + w, Y + d, Z], [X + w, Y, Z]], c.right, o),
  ].join('');
}
// flat content on a plane; origin = the 3D point, local units
const at3 = (X, Y, Z) => P(X, Y, Z).map(r1);
export const floor = (X, Y, Z, inner) => { const [x, y] = at3(X, Y, Z); return `<group x="${x}" y="${y}"><group rot="30" skx="-30" sy="0.866">${inner}</group></group>`; };
// wall facing down-left (plane Y = const): u → +X, v → down
export const wallX = (X, Y, Z, inner) => { const [x, y] = at3(X, Y, Z); return `<group x="${x}" y="${y}"><group sky="30" sx="0.866">${inner}</group></group>`; };
// wall facing down-right (plane X = const): u → −Y (reads left to right), v → down
export const wallY = (X, Y, Z, inner) => { const [x, y] = at3(X, Y, Z); return `<group x="${x}" y="${y}"><group sky="-30" sx="0.866">${inner}</group></group>`; };
export const pop = (t, inner, extra = '') => `<group at="${t}"${extra}><anim prop="opacity" from="0" to="1" dur="0.3"/><group><anim prop="y" from="-40" to="0" dur="0.45" ease="out"/>${inner}</group></group>`;
export const fadeIn = (t, inner, extra = '') => `<group at="${t}"${extra}><anim prop="opacity" from="0" to="1" dur="0.35"/>${inner}</group>`;
export const G = (x, y, s, inner, extra = '') => `<group x="${x}" y="${y}"${s !== 1 ? ` scale="${s}"` : ''}${extra}>${inner}</group>`;

export function house(X, Y, w = 60, d = 50, h = 34, rh = 22, c = NEU, roof = '#d9d2bf', o = {}) {
  const Z = h, R = h + rh, m = Y + d / 2;
  return box(X, Y, 0, w, d, h, c, o).replace(/<path[^>]*>/, '') + // drop the flat top
    face([[X + w, Y, Z], [X + w, Y + d, Z], [X + w, m, R]], c.right, o) +
    face([[X, Y, Z], [X + w, Y, Z], [X + w, m, R], [X, m, R]], roof, o) +
    face([[X, m, R], [X + w, m, R], [X + w, Y + d, Z], [X, Y + d, Z]], roof, o) +
    face([[X + w * 0.2, Y + d, h * 0.62], [X + w * 0.34, Y + d, h * 0.62], [X + w * 0.34, Y + d, 0], [X + w * 0.2, Y + d, 0]], '$line', { ...o, sw: 1 }) +
    face([[X + w * 0.5, Y + d, h * 0.7], [X + w * 0.8, Y + d, h * 0.7], [X + w * 0.8, Y + d, h * 0.38], [X + w * 0.5, Y + d, h * 0.38]], '$pale', { ...o, sw: 1 });
}
export function tree(X, Y, s = 30, fill = '$mid') {
  const [x0, y0] = P(X, Y, 0), [x1, y1] = P(X, Y, s * 1.3);
  return `<line x1="${r1(x0)}" y1="${r1(y0)}" x2="${r1(x1)}" y2="${r1(y1)}" stroke="$line" sw="${Math.max(2, s / 10)}"/>` +
    `<circle x="${r1(x1)}" y="${r1(y1 - s * 0.35)}" r="${r1(s * 0.6)}" fill="${fill}" stroke="$line" sw="2"/>` +
    `<circle x="${r1(x1 - s * 0.18)}" y="${r1(y1 - s * 0.55)}" r="${r1(s * 0.22)}" fill="$pale"/>`;
}
// tiny standing person, feet at screen (x, y), height ≈ 70*s
export function person(x, y, s = 1, shirt = '$mid', pants = '#6d7466', hair = '#4b3b2e') {
  const q = (n) => r1(n * s);
  return `<group x="${r1(x)}" y="${r1(y)}">` +
    `<rect x="${q(-9)}" y="${q(-30)}" w="${q(8)}" h="${q(30)}" r="${q(3)}" fill="${pants}" stroke="$ink" sw="1.5"/>` +
    `<rect x="${q(1)}" y="${q(-30)}" w="${q(8)}" h="${q(30)}" r="${q(3)}" fill="${pants}" stroke="$ink" sw="1.5"/>` +
    `<rect x="${q(-12)}" y="${q(-60)}" w="${q(24)}" h="${q(34)}" r="${q(8)}" fill="${shirt}" stroke="$ink" sw="1.5"/>` +
    `<circle y="${q(-70)}" r="${q(10)}" fill="#f1d9bf" stroke="$ink" sw="1.5"/>` +
    `<path d="M${q(-10)} ${q(-71)} C${q(-10)} ${q(-84)} ${q(10)} ${q(-84)} ${q(10)} ${q(-71)} Z" fill="${hair}"/>` +
    `</group>`;
}
// a fat rounded limb: ink outline under a coloured stroke
export const limb = (d, w, fill) => `<path d="${d}" fill="none" stroke="$ink" sw="${w + 7}" cap="round"/><path d="${d}" fill="none" stroke="${fill}" sw="${w}" cap="round"/>`;

export function doc(title, beats, extraDefs = '') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${title} — a reference board for the tech-explainer skill: six original scenes in the tsvg:tech paper look.
     Isometric props are plain paths (X → down-right, Y → down-left, up = −y); flat content sits on a plane with
     rot="30" skx="-30" sy="0.866" (floor), sky="30" sx="0.866" (wall facing down-left) or sky="-30" sx="0.866" (facing down-right). -->
<tsvg version="0.10" title="${title}">
  <import src="tsvg:tech" as="tx"/>
  <import src="tsvg:icons" as="i"/>
  <layouts><layout id="portrait" w="1080" h="1920"/></layouts>${extraDefs}
  <timeline>
${beats.join('\n\n')}
  </timeline>
</tsvg>
`;
}
export const write = (n, xml) => writeFileSync(new URL(`../src/board-${n}.tsvg`, import.meta.url), xml); // assets/boards/src/
// a room cutaway: floor + back walls (plane Y=0 and plane X=0), corner at the origin
export function room(W, D, H, o = {}) {
  return face([[0, 0, H], [W, 0, H], [W, 0, 0], [0, 0, 0]], o.wall ?? '$tile') +
    face([[0, 0, H], [0, D, H], [0, D, 0], [0, 0, 0]], o.wall2 ?? '#f1ecdf') +
    face([[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]], o.floor ?? '#f4efe2') +
    face([[0, 0, 0], [W, 0, 0], [W, 0, -o.t], [0, 0, -o.t]], 'none', { sw: 0 }).replace(/.*/, '') +
    (o.t ? face([[0, D, 0], [W, D, 0], [W, D, -o.t], [0, D, -o.t]], '#ece6d6') + face([[W, 0, 0], [W, D, 0], [W, D, -o.t], [W, 0, -o.t]], '#ddd6c3') : '');
}
// window grid on a wall plane: cols × rows panes
export const panes = (cols, rows, pw, ph, gx, gy, fill = '$pale') => `<rect repeat="${cols * rows}" as="k" x="=(k % ${cols})*${pw + gx}" y="=floor(k/${cols})*${ph + gy}" w="${pw}" h="${ph}" fill="${fill}" stroke="$line" sw="1.5"/>`;
export const byDepth = (items) => items.sort((a, b) => a[0] - b[0]).map((a) => a[1]).join('');
