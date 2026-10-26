// One scene per medium. Each draws a full 1080×1920 frame into g at local time lt (camera, on ones) with lc
// (the fox's stepped time, on the round's frame rate). bt = beat length. Each medium keeps the fox's marks:
// tall ears with dark tips, the white tail tip, the orange.
import { clamp, lerp, seg, eo, ei, eio, ss, back, mulberry, hash } from '/core/lib.js';
import { qr } from './fox.js';

const OR = '#FF5B00';
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ───────────────────────────── 1 · Swiss grid map: BUL! ─────────────────────────────
const SW = { paper: '#EEECE5', ink: '#111111', grid: '#D9D6CC' };
const PATH1 = [[110, 1520], [620, 1520], [620, 1160], [900, 1160], [900, 905]];
const PINS1 = [{ x: 620, y: 1420, name: 'BANKA', wrong: true }, { x: 770, y: 1090, name: 'ECZANE', wrong: true, left: true }, { x: 900, y: 860, name: 'KALE SOFRASI' }];
function along(pts, u) {
  const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let d = u * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const k = d / L[i]; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k), Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0])]; } d -= L[i]; }
  const n = pts.length - 1; return [pts[n][0], pts[n][1], 0];
}
export function swiss(g, lt, lc, bt, T) {
  const b = lt / bt, bc = lc / bt;
  g.fillStyle = SW.paper; g.fillRect(0, 0, 1080, 1920);
  // slow push toward the target from beat 5
  const pz = 1 + .04 * eio(seg(b, 5, 8)); g.save(); g.translate(900, 905); g.scale(pz, pz); g.translate(-900, -905);
  g.strokeStyle = SW.grid; g.lineWidth = 2; for (let i = 0; i <= 6; i++) { const x = 60 + i * 160; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1920); g.stroke(); }
  for (let j = 0; j < 12; j++) { const y = 380 + j * 130; g.beginPath(); g.moveTo(0, y); g.lineTo(1080, y); g.stroke(); }
  // sea: one black block
  g.fillStyle = SW.ink; g.fillRect(60, 1640, 960, 280);
  g.fillStyle = SW.paper; g.font = '600 30px Inter'; g.textAlign = 'left'; g.fillText(T.sea, 84, 1690);
  // streets as rules
  g.fillStyle = SW.ink; g.fillRect(60, 1505, 960, 30); g.fillRect(220, 1145, 800, 30); g.fillRect(605, 1145, 30, 390); g.fillRect(885, 700, 30, 475); g.fillRect(60, 740, 960, 22); g.fillRect(220, 740, 22, 435);
  g.font = '700 24px Inter'; g.fillStyle = SW.ink; g.fillText(T.st1, 70, 1575); g.fillText(T.st2, 250, 1215); g.fillText(T.st3, 70, 725);
  g.save(); g.translate(948, 1100); g.rotate(-Math.PI / 2); g.fillText(T.st4, 0, 0); g.restore();
  // header on the grid
  g.fillStyle = SW.ink; g.font = '900 132px Inter'; g.fillText('ALANYA', 56, 430); g.font = '500 32px Inter'; g.fillText(T.mapSub, 62, 488);
  g.fillStyle = OR; g.fillRect(62, 520, 160, 12);
  // pins
  const u = ss(seg(bc, 1.2, 5.6)), [fx, fy, fa] = along(PATH1, u), hit = b >= 6;
  for (const p of PINS1) {
    const passed = p.wrong && (u > (p.name === 'BANKA' ? .38 : .66));
    g.lineWidth = 9; g.strokeStyle = SW.ink; g.fillStyle = p.wrong ? SW.paper : (hit ? OR : SW.paper);
    g.beginPath(); g.arc(p.x, p.y, p.wrong ? 26 : 34, 0, Math.PI * 2); g.fill(); g.stroke();
    if (!p.wrong) { g.fillStyle = hit ? '#fff' : SW.ink; g.beginPath(); g.arc(p.x, p.y, 10, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = SW.ink; g.font = p.wrong ? '600 28px Inter' : '800 34px Inter'; g.textAlign = p.wrong ? 'left' : 'right';
    if (p.left) g.textAlign = 'right'; g.fillText(p.name, p.wrong && !p.left ? p.x + 44 : p.x - 48, p.y + 11); g.textAlign = 'left';
    if (passed) { g.lineWidth = 8; g.beginPath(); g.moveTo(p.x - 22, p.y - 22); g.lineTo(p.x + 22, p.y + 22); g.moveTo(p.x + 22, p.y - 22); g.lineTo(p.x - 22, p.y + 22); g.stroke(); }
  }
  if (hit) { const k = seg(b, 6, 7.2); g.strokeStyle = OR; g.lineWidth = 8 * (1 - k); g.beginPath(); g.arc(900, 860, 34 + k * 120, 0, Math.PI * 2); g.stroke(); }
  // the fox as a pictogram: orange disc head, two ears with black tips, black body, tail triangle with a white tip
  const stepBob = (Math.floor(bc * 4) % 2) * -6 * (u > 0 && u < 1 ? 1 : 0);
  g.save(); g.translate(fx, fy - 104 + stepBob + (hit ? -18 * Math.sin(seg(b, 6, 6.5) * Math.PI) : 0));
  g.scale(1.55, 1.55);
  g.fillStyle = SW.ink; g.fillRect(-20, 10, 40, 58);
  g.fillStyle = OR; g.beginPath(); g.moveTo(18, 54); g.lineTo(78, 6); g.lineTo(30, 66); g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(62, 19); g.lineTo(78, 6); g.lineTo(68, 26); g.closePath(); g.fill();
  g.fillStyle = OR; g.beginPath(); g.arc(0, -16, 32, 0, Math.PI * 2); g.fill();
  for (const s of [-1, 1]) { g.fillStyle = OR; g.beginPath(); g.moveTo(s * 8, -40); g.lineTo(s * 30, -36); g.lineTo(s * 24, -78); g.closePath(); g.fill(); g.fillStyle = SW.ink; g.beginPath(); g.moveTo(s * 21.5, -62); g.lineTo(s * 26.4, -63); g.lineTo(s * 24, -78); g.closePath(); g.fill(); }
  g.fillStyle = SW.ink; g.fillRect(-14, -22, 8, 8); g.fillRect(6, -22, 8, 8);
  g.restore();
  g.restore();
  // the result in big type over the sea block
  if (b >= 6.1) { const k = eo(seg(b, 6.1, 6.6)); g.save(); g.beginPath(); g.rect(60, 1640, 960, 280); g.clip(); g.fillStyle = SW.paper; g.font = '900 150px Inter'; g.textAlign = 'left'; g.fillText(T.found, lerp(-700, 84, k), 1850); g.restore(); }
}

// ───────────────────────────── 2 · Amber CRT terminal: TARAT! ─────────────────────────────
const CRT = mk(360, 640), cg = CRT.getContext('2d');
const AMB = '#FFB43A', DIM = '#6E4A10';
const FOXA = [
  '  /\\         /\\',
  ' /  \\_______/  \\',
  ' \\   o     o   /',
  '  \\     ^     /',
  "   '-.  w  .-'",
  "      '---'",
  '      /   \\       ,--.',
  '     /|   |\\     /  ~ \\',
  '      |   |     /    /',
  '      |___|____/   /',
  "      /   \\ '---'",
  '     /_   _\\',
];
export function crt(g, lt, lc, bt, T) {
  const b = lt / bt, bc = lc / bt, c = cg;
  c.fillStyle = '#140B02'; c.fillRect(0, 0, 360, 640);
  c.font = '20px VT323'; c.textBaseline = 'top'; c.textAlign = 'left';
  const row = (r, s, x = 1, col = AMB) => { c.fillStyle = col; c.fillText(s, 6 + x * 9.6, 8 + r * 19); };
  row(4, T.crtHead); row(5, '----------------------------------', 1, DIM);
  // counter
  row(25, '==================================');
  row(26, '|  ' + T.till + '                         |', 1, DIM);
  // QR on its stand: blocks
  const qx = 232, qy = 250, s = 9;
  const pattern = [ '1111111.1.1', '1.....1..11', '1.111.1.1.1', '1.111.1..1.', '1.....1.11.', '1111111.1.1', '.........1.', '11.1.11.111', '..1.1..1.1.', '1.1..11.1.1', '11.11.1..11' ];
  pattern.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '1') { c.fillStyle = AMB; c.fillRect(qx + i * s, qy + j * s, s - 1, s - 1); } }));
  c.fillStyle = AMB; c.fillRect(qx + 46, qy + 100, 6, 128 + 100); row(18.6, '[QR]', 30, DIM);
  // fox, hand-authored glyph art; the phone is an inverse block in its paw
  const fx = 2, fr = 13; FOXA.forEach((l, i) => row(fr + i, l, fx));
  const raise = eo(seg(bc, 1.6, 2.6));
  const px = lerp(13 * 9.6 + 6, 205, raise), py = lerp(8 + (fr + 7) * 19, 280, raise);
  c.fillStyle = AMB; c.fillRect(px, py, 30, 46); c.fillStyle = '#140B02'; c.font = '16px VT323'; c.fillText('QR', px + 5, py + 14);
  c.strokeStyle = AMB; c.lineWidth = 3; c.beginPath(); c.moveTo(13 * 9.6 + 6, 8 + (fr + 7) * 19 + 10); c.lineTo(px + 4, py + 30); c.stroke();
  // scan sweep
  const sk = seg(b, 3, 4.4);
  if (sk > 0 && sk < 1) { const y = qy - 6 + (sk * 2 % 1) * 112; c.fillStyle = '#FFE7A8'; c.fillRect(qx - 12, y, 124, 4); row(10.6, 'BIIIP', 24, AMB); }
  // the readout types out
  const lines = [T.crtL1, T.crtL2], start = 4.4 * bt, cps = 26;
  let n = Math.floor(Math.max(0, lt - start) * cps);
  lines.forEach((l, i) => { const m = clamp(n, 0, l.length); n -= l.length + 3; if (m > 0) row(29 + i, l.slice(0, m)); });
  if (b > 5.8) { c.font = '64px VT323'; c.fillStyle = AMB; const pop = b < 6.1 ? 1.15 : 1; c.save(); c.translate(180, 556); c.scale(pop, pop); c.textAlign = 'center'; c.fillText(T.crtBig, 0, -24); c.restore(); }
  if (Math.floor(lt * 3) % 2 === 0) { c.fillStyle = AMB; c.fillRect(6 + 1 * 9.6, 8 + 31.5 * 19, 9, 16); }
  // phosphor: soft upscale + bloom + scanlines + vignette
  g.fillStyle = '#0B0601'; g.fillRect(0, 0, 1080, 1920);
  g.imageSmoothingEnabled = true; g.drawImage(CRT, 0, 0, 1080, 1920);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55; g.filter = 'blur(10px)'; g.drawImage(CRT, 0, 0, 1080, 1920); g.restore();
  g.fillStyle = 'rgba(0,0,0,.33)'; for (let y = 0; y < 1920; y += 6) g.fillRect(0, y, 1080, 3);
  const vg = g.createRadialGradient(540, 960, 500, 540, 960, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.75)'); g.fillStyle = vg; g.fillRect(0, 0, 1080, 1920);
}

// ───────────────────────────── 3 · Crayon on paper: TARAT! (the fail) ─────────────────────────────
const TOOTH = mk(540, 960), MASKS = {};
(() => { const c = TOOTH.getContext('2d'), im = c.createImageData(540, 960), r = mulberry(7);
  for (let i = 0; i < 540 * 960; i++) { const x = i % 540, y = (i / 540) | 0; const v = .55 * r() + .45 * (.5 + .5 * Math.sin(x * .9 + Math.sin(y * .3) * 2) * Math.sin(y * 1.3)); im.data[i * 4 + 3] = v * 255; }
  c.putImageData(im, 0, 0);
  for (const p of [.5, .8]) { const m = mk(540, 960), mc = m.getContext('2d'), mi = mc.createImageData(540, 960);
    for (let i = 0; i < 540 * 960; i++) mi.data[i * 4 + 3] = im.data[i * 4 + 3] / 255 < 1 - 1.22 * p ? 255 : 0; mc.putImageData(mi, 0, 0); MASKS[p] = m; }
})();
const SCR3 = mk(1080, 1920), sg3 = SCR3.getContext('2d');
let boil = 0;
function wax(g, drawFn, color, p = .8) {
  sg3.clearRect(0, 0, 1080, 1920); sg3.save(); sg3.fillStyle = color; sg3.strokeStyle = color; drawFn(sg3); sg3.restore();
  sg3.save(); sg3.globalCompositeOperation = 'destination-out'; sg3.imageSmoothingEnabled = false; sg3.drawImage(MASKS[p >= .65 ? .8 : .5], 0, 0, 1080, 1920); sg3.restore();
  g.drawImage(SCR3, 0, 0);
}
function wobble(c, pts, close, seed) { const r = mulberry(seed + boil * 31); c.beginPath(); pts.forEach(([x, y], i) => { const jx = (r() - .5) * 7, jy = (r() - .5) * 7; i ? c.lineTo(x + jx, y + jy) : c.moveTo(x + jx, y + jy); }); if (close) c.closePath(); }
const ellPts = (x, y, rx, ry, n = 22, rot = 0) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; const cx = Math.cos(a) * rx, cy = Math.sin(a) * ry; return [x + cx * Math.cos(rot) - cy * Math.sin(rot), y + cx * Math.sin(rot) + cy * Math.cos(rot)]; });
function cShape(g, pts, fill, seed, p = .8, line = '#2E2A6B') {
  wax(g, c => { wobble(c, pts, true, seed); c.fill(); }, fill, p);
  wax(g, c => { c.lineWidth = 7; c.lineJoin = 'round'; wobble(c, pts, true, seed + 5); c.stroke(); }, line, .8);
}
function hatch(g, pts, color, seed, ang = .6, gap = 22) {
  wax(g, c => { wobble(c, pts, true, seed); c.clip(); c.lineWidth = 5; c.beginPath(); const r = mulberry(seed);
    for (let k = -1500; k < 1500; k += gap) { c.moveTo(-200 + k, -200); c.lineTo(-200 + k + Math.cos(ang) * 3000, -200 + Math.sin(ang) * 3000); } c.stroke(); }, color, .5);
}
// the crayon fox (side view, facing right); arm: 0 down … 1 reaching out with the phone
export function crayonFox(g, x, y, s, arm, lean, look, seed) {
  g.save(); g.translate(x, y); g.rotate(lean); g.scale(s, s); g.translate(-x, -y);
  const T = (pts) => pts.map(([a, b]) => [x + a, y + b]);
  cShape(g, T([[-150, -120], [-260, -230], [-300, -330], [-240, -300], [-170, -200], [-110, -150]]), OR, seed + 1);
  cShape(g, T([[-300, -330], [-250, -305], [-270, -360]]), '#FFFFFF', seed + 2, .9);
  for (const dx of [-70, 40]) cShape(g, T([[dx - 18, -90], [dx + 18, -90], [dx + 16, 0], [dx - 16, 0]]), '#2B1E25', seed + 3 + dx, .9);
  cShape(g, ellPts(x - 10, y - 160, 150, 92, 24), OR, seed + 4);
  hatch(g, ellPts(x - 10, y - 130, 120, 50, 18), '#C93E00', seed + 6);
  cShape(g, ellPts(x + 40, y - 150, 60, 44, 18), '#FFFFFF', seed + 7, .9);
  // head
  cShape(g, T([[90, -300], [170, -320], [270, -270], [290, -250], [250, -230], [150, -200], [80, -230]]), OR, seed + 8);
  cShape(g, T([[150, -250], [290, -250], [250, -230], [160, -212]]), '#FFFFFF', seed + 9, .9);
  cShape(g, T([[100, -296], [118, -410], [160, -310]]), OR, seed + 10);
  cShape(g, T([[108, -360], [118, -410], [140, -356]]), '#2B1E25', seed + 11, .9);
  cShape(g, T([[150, -312], [190, -400], [205, -300]]), OR, seed + 12);
  cShape(g, T([[170, -356], [190, -400], [200, -350]]), '#2B1E25', seed + 13, .9);
  wax(g, c => { c.beginPath(); c.arc(x + 286, y - 252, 11, 0, 7); c.fill(); }, '#2B1E25', .9);
  wax(g, c => { c.beginPath(); c.ellipse(x + 200 + look * 6, y - 276, 9, look > .5 ? 15 : 12, 0, 0, 7); c.fill(); }, '#2B1E25', .9);
  // arm + phone
  const ax = x + 60, ay = y - 190, hx = x + lerp(110, 310, arm), hy = y + lerp(-110, -230, arm);
  wax(g, c => { c.lineWidth = 34; c.lineCap = 'round'; const r = mulberry(seed + boil); c.beginPath(); c.moveTo(ax, ay); c.lineTo(hx + (r() - .5) * 4, hy); c.stroke(); }, OR, .8);
  cShape(g, T([[hx - x - 22, hy - y - 46], [hx - x + 26, hy - y - 46], [hx - x + 26, hy - y + 40], [hx - x - 22, hy - y + 40]]), '#2B2B44', seed + 14, .9);
  wax(g, c => { c.beginPath(); c.arc(hx - 10, hy + 6, 20, 0, 7); c.fill(); }, '#2B1E25', .9);
  g.restore();
}
export function crayon(g, lt, lc, bt, T, opt = {}) {
  const b = lt / bt, bc = lc / bt; boil = Math.floor(lc * 8);
  g.fillStyle = '#FBF4E4'; g.fillRect(0, 0, 1080, 1920);
  g.save(); g.globalAlpha = .18; g.imageSmoothingEnabled = false; g.drawImage(TOOTH, 0, 0, 1080, 1920); g.restore();
  // wall, window, sign
  hatch(g, [[0, 300], [1080, 300], [1080, 1240], [0, 1240]], '#F2C9A0', 21, .3, 30);
  cShape(g, [[620, 520], [960, 520], [960, 860], [620, 860]], '#BFE3F5', 22, .6);
  wax(g, c => { c.lineWidth = 7; wobble(c, [[790, 520], [790, 860]], false, 23); c.stroke(); wobble(c, [[620, 690], [960, 690]], false, 24); c.stroke(); }, '#2E2A6B');
  wax(g, c => { c.font = '120px "Caveat Brush"'; c.textAlign = 'left'; c.fillText(T.bakery, 70, 470); }, '#8A3B1C', .9);
  // counter
  cShape(g, [[-20, 1240], [1100, 1240], [1100, 1330], [-20, 1330]], '#B9733F', 25);
  cShape(g, [[-20, 1330], [1100, 1330], [1100, 1920], [-20, 1920]], '#8E5130', 26);
  hatch(g, [[-20, 1330], [1100, 1330], [1100, 1920], [-20, 1920]], '#6E3A20', 27, 1.2, 26);
  // QR stand at the right edge (the thing to scan)
  cShape(g, [[880, 1240], [900, 1240], [900, 1100], [880, 1100]], '#2B1E25', 28, .9);
  cShape(g, [[810, 920], [990, 920], [990, 1110], [810, 1110]], '#FFFFFF', 29, .9);
  wax(g, c => { for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if (hash(i * 7 + j * 13) > .45 || (i < 2 && j < 2)) c.fillRect(830 + i * 24, 940 + j * 24, 20, 20); }, '#2B1E25', .9);
  // basket + poğaça
  cShape(g, [[400, 1160], [760, 1160], [730, 1245], [430, 1245]], '#D29A52', 30);
  hatch(g, [[400, 1160], [760, 1160], [730, 1245], [430, 1245]], '#9A6A2C', 31, -.7, 20);
  const squish = clamp(seg(b, 3.2, 3.4)) * (1 - seg(b, 3.4, 3.9) * .6);
  const roll = eo(seg(b, 3.4, 4.6));
  const pog = [[470, 1140], [580, 1125], [690, 1140]];
  pog.forEach(([px, py], i) => {
    let x = px, y = py, sx = 1, sy = 1;
    if (i === 1) { sx = 1 + squish * .35; sy = 1 - squish * .3; x += roll * 260; y += -Math.abs(Math.sin(roll * Math.PI * 2)) * 60 * (1 - roll) + roll * 0; }
    cShape(g, ellPts(x, y + (1 - sy) * 30, 62 * sx, 42 * sy, 20, i === 1 ? roll * 6 : 0), '#E9B24E', 32 + i);
    hatch(g, ellPts(x, y - 12, 44 * sx, 18 * sy, 14), '#B77A23', 35 + i, .4, 16);
  });
  // the fox rushes in, overshoots, points the phone at the poğaça
  const enter = back(seg(bc, .2, 1.2), 1.4), fx = lerp(-420, 250, enter), lean = (1 - seg(bc, 1.0, 1.6)) * .12 * (bc > .2 ? 1 : 0);
  const arm = eo(seg(bc, 1.6, 2.6)) + .08 * Math.sin(seg(bc, 2.6, 3.2) * Math.PI);
  const look = b > 3.6 ? 1 : 0;
  crayonFox(g, fx, 1240, 1.05, arm, -lean, look, 40);
  // "bip?" from the phone, then a question mark
  if (b > 3.0) wax(g, c => { c.font = '86px "Caveat Brush"'; c.textAlign = 'center'; c.fillText(T.bip, 610, 920 - seg(b, 3, 4) * 40); }, '#2E2A6B', .9);
  if (b > 4.0) wax(g, c => { c.font = '170px "Caveat Brush"'; c.fillText('?', 520, 700 + Math.sin(lt * 9) * 6); }, '#E0412C', .9);
  if (opt.replay) opt.replay(g, wax, wobble);
}

// ───────────────────────────── 4 · 16-bit pixel: YETİŞ! ─────────────────────────────
const PX = mk(180, 320), pc = PX.getContext('2d');
const PAL = { sky0: '#2B1B4A', sky1: '#7A2E5B', sky2: '#F2703A', brick: '#8E4A33', brickD: '#5E2B22', ink: '#1A1022', ground: '#3A2A40', shut: '#A4A6B8', shutD: '#6C6E86', crate: '#B0743A', sign: '#F5D36B', white: '#FFF4E0', or: '#FF5B00', orD: '#B83C00' };
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function pfill(x, y, w, h, col) { pc.fillStyle = col; pc.fillRect(Math.round(x), Math.round(y), w, h); }
const FOXSPR = [
  // 0 run A, 1 run B, 2 slide, 3 phone up
  ['....k...k.......', '...kok.kok......', '...koooooo......', '..koowooowk.....', '..kooooooook....', '...kwwwwwk..kkk.', '..kooooooook.koo', '.koooooooooookow', '.kooooooooooo.kw', '..kooooooook....', '..kk.k..k.kk....', '..k...k..k......'],
  ['....k...k.......', '...kok.kok......', '...koooooo......', '..koowooowk.....', '..kooooooook....', '...kwwwwwk..kkk.', '..kooooooook.koo', '.koooooooooookow', '.kooooooooooo.kw', '..kooooooook....', '...k.kk.kk......', '...kk....kk.....'],
  ['................', '................', '................', '................', '.....k...k......', '....kok.kok.....', '..kkoooooooooookkk', '.koowoooooooooookow', '.kooooooooooooooo.kw', '..kkkkkkkkkkkkkkk...', '................', '................'],
  ['....k...k...kkk.', '...kok.kok..kpk.', '...koooooo..kpk.', '..koowooowk.kpk.', '..kooooooook.k..', '...kwwwwwkkk....', '..kooooooook.kkk', '.kooooooooook.ko', '.kooooooooooo.kw', '..kooooooook....', '..kk.k..k.kk....', '..k.....k.......'],
];
function sprite(rows, x, y, flipX = false, k = 2) {
  const C = { k: PAL.ink, o: PAL.or, w: PAL.white, p: PAL.sign }; y -= (rows.length - 12) * k + 12;
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (C[ch]) pfill(x + (flipX ? r.length - i : i) * k, y + j * k, k, k, C[ch]); }));
}
function ptext(s, x, y, col, size = 8) { pc.font = `${size}px "Press Start 2P"`; pc.textBaseline = 'top'; pc.fillStyle = PAL.ink; pc.fillText(s, x + 1, y + 1); pc.fillStyle = col; pc.fillText(s, x, y); }
export function pixel(g, lt, lc, bt, T) {
  const b = lt / bt, bc = lc / bt;
  // sky in dithered bands
  for (let y = 0; y < 250; y++) for (let x = 0; x < 180; x += 1) {
    const v = Math.min(y, 199) / 200 * 2, band = Math.floor(v), f = (v - band) * 16;
    const col = (BAYER[y % 4][x % 4] < f ? band + 1 : band); pc.fillStyle = [PAL.sky0, PAL.sky1, PAL.sky2, PAL.sky2][col]; pc.fillRect(x, y, 1, 1);
  }
  // sun
  pc.fillStyle = '#FFD27A'; pc.beginPath(); pc.arc(40, 150, 16, 0, 7); pc.fill();
  // building
  pfill(70, 90, 110, 160, PAL.brick);
  for (let y = 94; y < 250; y += 6) for (let x = 70 + ((y / 6) % 2) * 6; x < 180; x += 12) pfill(x, y, 1, 5, PAL.brickD);
  for (let y = 96; y < 250; y += 6) pfill(70, y, 110, 1, PAL.brickD);
  pfill(78, 104, 96, 22, PAL.ink); pfill(80, 106, 92, 18, PAL.sign);
  ptext(T.pxSign, 83, 111, PAL.ink, 7);
  // door + shutter coming down
  const dX = 104, dY = 150, dW = 60, dH = 100;
  pfill(dX - 2, dY - 6, dW + 4, 6, PAL.ink); pfill(dX, dY, dW, dH, '#2A1630');
  pfill(dX + 8, dY + 30, 44, 30, '#F7C873'); pfill(dX + 8, dY + 60, 44, 4, PAL.brickD);
  const stopAt = dH - 24; // the shutter stops on the raised phone
  const down = Math.min(lerp(10, dH, ss(seg(b, .5, 4.6))), b > 4.0 ? stopAt : dH);
  pfill(dX, dY, dW, down, PAL.shut); for (let y = dY + 3; y < dY + down; y += 4) pfill(dX, y, dW, 1, PAL.shutD);
  pfill(dX + 26, dY + down - 3, 8, 3, PAL.ink);
  // ground + crate
  pfill(0, 250, 180, 70, PAL.ground); for (let x = 0; x < 180; x += 8) pfill(x + (Math.floor(lt * 0) % 8), 252, 4, 1, '#55405E');
  pfill(56, 236, 16, 14, PAL.ink); pfill(57, 237, 14, 12, PAL.crate); pfill(57, 242, 14, 1, PAL.ink); pfill(63, 237, 1, 12, PAL.ink);
  // the fox: run, jump the crate, slide under, phone up
  let fx, fy, fr, flip = false;
  const run = seg(bc, .8, 3.7);
  fx = lerp(-20, 118, run); fy = 238;
  const jump = seg(fx, 40, 78); if (jump > 0 && jump < 1) fy -= Math.sin(jump * Math.PI) * 22;
  fr = Math.floor(lc * 12) % 2;
  if (bc >= 3.7 && bc < 4.2) { fr = 2; fx = lerp(118, 128, seg(bc, 3.7, 4.2)); fy = 238; }
  if (bc >= 4.2) { fr = 3; fx = 126; fy = 238; }
  sprite(FOXSPR[fr], Math.round(fx), Math.round(fy));
  // dust puffs on the slide
  if (bc > 3.7 && bc < 4.6) { const k = seg(bc, 3.7, 4.6); for (let i = 0; i < 4; i++) pfill(118 - i * 5 - k * 10, 246 - (i % 2) * 2 - k * 4, 2, 2, '#C9B7C9'); }
  // scan + reward
  if (b > 4.5) { if (Math.floor(lt * 15) % 2) pfill(dX + 20, dY + stopAt - 6, 20, 2, '#7CFF9B'); }
  if (b > 4.8) { const k = seg(b, 4.8, 5.2); ptext(T.pxPts, 112, 60 - k * 10, PAL.sign, 16); }
  g.imageSmoothingEnabled = false; g.drawImage(PX, 0, 0, 1080, 1920); g.imageSmoothingEnabled = true;
}

// ───────────────────────────── 5 · Woodcut print: DAMGALA! ─────────────────────────────
const PAPER5 = mk(540, 960);
(() => { const c = PAPER5.getContext('2d'), r = mulberry(11); c.fillStyle = '#EFE5D1'; c.fillRect(0, 0, 540, 960);
  c.strokeStyle = 'rgba(120,90,50,.12)'; c.lineWidth = 1; for (let i = 0; i < 900; i++) { const x = r() * 540, y = r() * 960; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - .5) * 30, y + (r() - .5) * 8); c.stroke(); } })();
function gouges(g, x0, y0, w, h, seed, dens = 1) {
  const r = mulberry(seed); g.strokeStyle = '#EFE5D1'; g.lineCap = 'round';
  for (let y = y0 + 20; y < y0 + h; y += 26) for (let x = x0 + (r() * 40); x < x0 + w; x += 70 + r() * 60) {
    if (r() > .55 * dens) continue; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 6 - r() * 6, x + 34 + r() * 20, y + (r() - .5) * 4); g.stroke();
  }
}
function cupGlyph(g, x, y, s, col) {
  g.fillStyle = col; g.beginPath(); g.moveTo(x - 30 * s, y - 26 * s); g.lineTo(x + 30 * s, y - 26 * s); g.lineTo(x + 22 * s, y + 30 * s); g.lineTo(x - 22 * s, y + 30 * s); g.closePath(); g.fill();
  g.lineWidth = 9 * s; g.strokeStyle = col; g.beginPath(); g.arc(x + 32 * s, y, 13 * s, -1.2, 1.2); g.stroke();
}
export function woodcut(g, lt, lc, bt, T) {
  const b = lt / bt, bc = lc / bt;
  const slamB = 3, hitK = seg(b, slamB, slamB + .15), shake = b > slamB && b < slamB + .6 ? Math.sin(lt * 90) * 10 * (1 - seg(b, slamB, slamB + .6)) : 0;
  g.imageSmoothingEnabled = true; g.drawImage(PAPER5, 0, 0, 1080, 1920);
  g.save(); g.translate(shake, shake * .4);
  // insert: push in on the stamp near the slam
  const pz = 1 + .22 * eio(seg(b, 2.2, 2.95)) - .22 * eo(seg(b, 3.4, 4.4)); g.translate(820, 1150); g.scale(pz, pz); g.translate(-820, -1150);
  // orange block (misregistered +9,+7): filled cells
  const cells = []; for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) cells.push([215 + i * 216, 930 + j * 230]);
  const filled = b >= slamB ? 8 : 7;
  // black key block: the card
  g.fillStyle = '#16120F'; g.beginPath(); g.roundRect(100, 560, 880, 820, 40); g.fill();
  gouges(g, 100, 560, 880, 820, 5);
  g.strokeStyle = '#EFE5D1'; g.lineWidth = 7; g.beginPath(); g.roundRect(128, 588, 824, 764, 26); g.stroke();
  g.fillStyle = '#EFE5D1'; g.font = '92px "Alfa Slab One"'; g.textAlign = 'center'; g.fillText(T.palm, 540, 730);
  g.font = '34px "Alfa Slab One"'; g.fillText(T.palmSub, 540, 790);
  cells.forEach(([x, y], k) => {
    g.save(); g.beginPath(); g.arc(x, y, 84, 0, 7); g.clip();
    if (k < filled) { g.fillStyle = '#EFE5D1'; g.fill(); g.fillStyle = OR; g.beginPath(); g.arc(x + 9, y + 7, 84, 0, 7); g.fill(); cupGlyph(g, x, y, 1.1, '#16120F'); }
    g.restore();
    g.strokeStyle = '#EFE5D1'; g.lineWidth = 6; g.beginPath(); g.arc(x, y, 84, 0, 7); g.stroke();
  });
  // ink splats at the slam
  if (b >= slamB) { const r = mulberry(3); g.fillStyle = '#16120F'; for (let i = 0; i < 9; i++) { const a = r() * 7, d = 110 + r() * 70 * eo(hitK); g.beginPath(); g.arc(cells[7][0] + Math.cos(a) * d, cells[7][1] + Math.sin(a) * d, 5 + r() * 9, 0, 7); g.fill(); } }
  // the stamp in the fox's paw: lift (anticipation) then slam
  const lift = Math.sin(seg(bc, 1, 2.6) * Math.PI / 2) * 1, drop = ei(seg(b, 2.75, slamB));
  const sy = lerp(lerp(420, 220, lift), 1140, drop) - (b > slamB ? eo(seg(b, slamB + .5, 4.6)) * 700 : 0);
  const sx = 1076 - 216;
  g.save(); g.translate(sx, sy); g.rotate(lerp(.12, 0, drop));
  g.fillStyle = OR; g.fillRect(-60 + 8, -320 + 6, 120, 230); g.fillStyle = '#16120F'; g.beginPath(); g.roundRect(-95, -70, 190, 70, 10); g.fill();
  g.beginPath(); g.ellipse(0, -110, 60, 40, 0, 0, 7); g.fill(); g.fillRect(-28, -330, 56, 230);
  gouges(g, -95, -70, 190, 70, 9, 1.4);
  // paw on the handle (orange block + key line)
  g.fillStyle = OR; g.beginPath(); g.ellipse(14, -300, 74, 56, 0, 0, 7); g.fill(); g.fillRect(-30, -520, 120, 230);
  g.strokeStyle = '#16120F'; g.lineWidth = 9; g.beginPath(); g.ellipse(6, -306, 74, 56, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-36, -520); g.lineTo(-36, -330); g.moveTo(86, -520); g.lineTo(86, -340); g.stroke();
  g.fillStyle = '#16120F'; for (const dx of [-26, 6, 38]) { g.beginPath(); g.arc(dx, -262, 12, 0, 7); g.fill(); }
  g.restore();
  g.restore();
  // the fox peeks at the bottom-left (carved ears with dark tips, eyes)
  const peek = eo(seg(bc, .6, 1.4)) - (b > 4.3 ? 0 : 0);
  g.save(); g.translate(250, lerp(2100, 1700, peek));
  g.fillStyle = OR; g.beginPath(); g.ellipse(9, 7, 170, 120, 0, 0, 7); g.fill();
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 50 + 9, -80 + 7); g.lineTo(s * 150 + 9, -60 + 7); g.lineTo(s * 130 + 9, -230 + 7); g.closePath(); g.fill(); }
  g.strokeStyle = '#16120F'; g.lineWidth = 10; g.beginPath(); g.ellipse(0, 0, 170, 120, 0, 0, 7); g.stroke();
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 50, -80); g.lineTo(s * 150, -60); g.lineTo(s * 130, -230); g.closePath(); g.stroke();
    g.fillStyle = '#16120F'; g.beginPath(); g.moveTo(s * 138, -160); g.lineTo(s * 146, -140); g.lineTo(s * 130, -230); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(s * 55, -10, 16, b > slamB ? 6 : 22, 0, 0, 7); g.fill(); }
  g.fillStyle = '#EFE5D1'; g.beginPath(); g.moveTo(-90, 40); g.quadraticCurveTo(0, 0, 90, 40); g.lineTo(60, 120); g.lineTo(-60, 120); g.closePath(); g.fill();
  g.restore();
  if (b > slamB + .3) { const k = back(seg(b, slamB + .3, slamB + .8)); g.save(); g.translate(760, 1600); g.scale(k, k); g.fillStyle = '#16120F'; g.font = '170px "Alfa Slab One"'; g.textAlign = 'center'; g.fillText('8/8', 0, 0); g.restore(); }
}
