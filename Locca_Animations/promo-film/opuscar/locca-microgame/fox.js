// The fox in the home look: full body, frontal three-quarter, rigged from a pose object so poses blend with easing.
// Marks that survive every medium: tall ears with dark tips, a bushy tail with a white tip, the brand orange.
import { toon, ell, poly, capsule, rrect, INK, HOME, ctx } from './toon.js';

export const FOX = { orange: '#FF5B00', shade: '#C94100', white: '#FFFFFF', wshade: '#DAD3E6', dark: '#24161C', inner: '#FFD2B0' };

export const POSE = {
  idle:    { a1L: .25, a2L: .1, a1R: .25, a2R: .1, lean: 0, sq: 0, eyes: 0, mouth: 0, brow: 0, tail: 0, walk: 0, stride: 0, head: 0 },
  phone:   { a1L: .3, a2L: .15, a1R: 1.25, a2R: -2.75, lean: 0, sq: 0, eyes: 0, mouth: 0, brow: 0, tail: 0, walk: 0, stride: 0, head: 0 },
  cheer:   { a1L: 2.5, a2L: .3, a1R: 2.5, a2R: .3, lean: 0, sq: -.05, eyes: 1, mouth: 2, brow: -.4, tail: .4, walk: 0, stride: 0, head: 0 },
  sad:     { a1L: .12, a2L: 0, a1R: .12, a2R: 0, lean: .04, sq: .06, eyes: 3, mouth: 3, brow: -1.2, tail: -.5, walk: 0, stride: 0, head: .12 },
  ready:   { a1L: .9, a2L: -1.6, a1R: .9, a2R: -1.6, lean: -.05, sq: .04, eyes: 0, mouth: 1, brow: 1, tail: .2, walk: 0, stride: 0, head: -.05 },
  sleep:   { a1L: .1, a2L: 0, a1R: .1, a2R: 0, lean: .03, sq: .05, eyes: 2, mouth: 0, brow: 0, tail: -.3, walk: 0, stride: 0, head: .2 },
  cup:     { a1L: .45, a2L: -1.75, a1R: .45, a2R: -1.75, lean: 0, sq: 0, eyes: 1, mouth: 1, brow: -.3, tail: .3, walk: 0, stride: 0, head: 0 },
  sip:     { a1L: .9, a2L: -2.7, a1R: .9, a2R: -2.7, lean: -.03, sq: 0, eyes: 2, mouth: 0, brow: -.3, tail: .5, walk: 0, stride: 0, head: -.08 },
};
export function blend(a, b, k) { const o = {}; for (const key in a) o[key] = a[key] + (b[key] - a[key]) * k; o.prop = k < .5 ? a.prop : b.prop; return o; }

// eyes: 0 open, 1 happy arcs, 2 closed, 3 worried, 4 wide. mouth: 0 small smile, 1 grin, 2 open cheer, 3 frown, 4 "o"
export function drawFox(x, y, s, p, { flip = false, prop = null, propT = 0 } = {}) {
  const g = ctx(); g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
  const lw = 7 / s * 1.0, sh = 8 / s;
  const bob = Math.sin(p.walk * 2) * 6 * p.stride, sq = p.sq;
  g.translate(0, bob); g.rotate(p.lean);
  g.scale(1 + sq * .6, 1 - sq);
  // tail
  g.save(); g.translate(48, -160); g.rotate(-.35 + p.tail * .5 + Math.sin(p.walk) * .08 * p.stride);
  const tail = new Path2D(); tail.moveTo(-10, 10); tail.bezierCurveTo(70, 20, 150, -40, 150, -150); tail.bezierCurveTo(150, -200, 120, -235, 92, -240);
  tail.bezierCurveTo(105, -190, 90, -120, 40, -70); tail.bezierCurveTo(20, -50, 0, -40, -14, -32); tail.closePath();
  toon(tail, FOX.orange, FOX.shade, lw, sh);
  g.save(); g.clip(tail); const tip = new Path2D(); tip.moveTo(160, -150); tip.bezierCurveTo(140, -120, 110, -140, 95, -175); tip.lineTo(80, -260); tip.lineTo(200, -260); tip.closePath();
  toon(tip, FOX.white, FOX.wshade, 0, sh, false); g.restore(); g.lineWidth = lw; g.strokeStyle = INK; g.stroke(tail);
  g.restore();
  // legs
  for (const sg of [-1, 1]) {
    const sw = Math.sin(p.walk + (sg > 0 ? Math.PI : 0)) * p.stride;
    const hx = sg * 34, hy = -150, fx = sg * 38 + sw * 46, fy = -Math.max(0, -Math.cos(p.walk + (sg > 0 ? Math.PI : 0))) * 22 * p.stride;
    const leg = capsule(hx, hy, fx, fy - 8, 50);
    toon(leg, FOX.orange, FOX.shade, 0, sh, false);
    g.save(); g.clip(leg); g.fillStyle = FOX.dark; g.fillRect(-200, hy + 70, 400, 200); g.restore();
    g.lineWidth = lw; g.strokeStyle = INK; g.stroke(leg);
    const foot = ell(fx + sg * 6, fy - 8, 32, 17); toon(foot, FOX.dark, null, lw);
  }
  // body
  const body = ell(0, -222, 84, 104); toon(body, FOX.orange, FOX.shade, lw, sh);
  g.save(); g.clip(body); toon(ell(0, -196, 52, 80), FOX.white, FOX.wshade, 0, sh, false); g.restore(); g.lineWidth = lw; g.strokeStyle = INK; g.stroke(body);
  // arms (paws hold props between them)
  const paws = [];
  for (const sg of [-1, 1]) {
    const a1 = sg < 0 ? p.a1L : p.a1R, a2 = sg < 0 ? p.a2L : p.a2R;
    const sx = sg * 70, sy = -262 - Math.max(0, a1 - 1.2) * 10;
    const ex = sx + sg * Math.sin(a1) * 70, ey = sy + Math.cos(a1) * 70;
    const px = ex + sg * Math.sin(a1 + a2) * 60, py = ey + Math.cos(a1 + a2) * 60;
    paws.push([px, py]);
    const up = capsule(sx, sy, ex, ey, 36), fo = capsule(ex, ey, px, py, 34);
    toon(up, FOX.orange, FOX.shade, 0, sh, false); toon(fo, FOX.orange, FOX.shade, 0, sh, false);
    g.lineWidth = lw; g.strokeStyle = INK; g.stroke(fo);
    toon(ell(px, py, 22, 21), FOX.dark, null, lw);
  }
  // head
  g.save(); g.translate(0, -352); g.rotate(p.head);
  for (const sg of [-1, 1]) {
    const ear = poly([[sg * 28, -48], [sg * 96, -30], [sg * 88, -150]]); toon(ear, FOX.orange, FOX.shade, lw, sh);
    g.save(); g.clip(ear); g.fillStyle = FOX.dark; g.beginPath(); g.moveTo(sg * 40, -112); g.lineTo(sg * 120, -96); g.lineTo(sg * 120, -170); g.lineTo(sg * 40, -170); g.fill(); g.restore();
    g.fillStyle = FOX.inner; g.beginPath(); g.moveTo(sg * 44, -48); g.lineTo(sg * 82, -40); g.lineTo(sg * 80, -100); g.closePath(); g.fill();
    g.lineWidth = lw; g.strokeStyle = INK; g.stroke(ear);
  }
  const head = new Path2D(); head.moveTo(0, -64); head.bezierCurveTo(70, -66, 104, -30, 106, 6); head.lineTo(128, 34); head.lineTo(90, 40);
  head.bezierCurveTo(70, 70, 30, 82, 0, 82); head.bezierCurveTo(-30, 82, -70, 70, -90, 40); head.lineTo(-128, 34); head.lineTo(-106, 6);
  head.bezierCurveTo(-104, -30, -70, -66, 0, -64); head.closePath();
  toon(head, FOX.orange, FOX.shade, 0, sh, false);
  g.save(); g.clip(head);
  const muz = new Path2D(); muz.moveTo(-130, 30); muz.bezierCurveTo(-80, 6, -40, 10, 0, 22); muz.bezierCurveTo(40, 10, 80, 6, 130, 30); muz.lineTo(130, 120); muz.lineTo(-130, 120); muz.closePath();
  toon(muz, FOX.white, FOX.wshade, 0, sh, false); g.restore();
  g.lineWidth = lw; g.strokeStyle = INK; g.stroke(head);
  // face
  g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = lw;
  for (const sg of [-1, 1]) {
    const ex = sg * 40, ey = -6;
    const e = Math.round(p.eyes);
    if (e === 1) { g.beginPath(); g.arc(ex, ey + 6, 14, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    else if (e === 2) { g.beginPath(); g.arc(ex, ey - 4, 14, Math.PI * .15, Math.PI * .85); g.stroke(); }
    else {
      const ry = e === 4 ? 20 : e === 3 ? 15 : 17, rx = e === 4 ? 14 : 11;
      g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + 4, ey - 6, 4.5, 0, Math.PI * 2); g.fill(); g.fillStyle = INK;
    }
    // brows
    const br = p.brow, by = ey - 32 + Math.min(0, br) * 4; g.lineWidth = lw * .9; g.beginPath(); g.moveTo(ex - sg * 15, by + br * 7); g.lineTo(ex + sg * 15, by - br * 3); g.stroke(); g.lineWidth = lw;
  }
  g.beginPath(); g.ellipse(0, 26, 15, 11, 0, 0, Math.PI * 2); g.fill();
  const m = Math.round(p.mouth);
  g.beginPath();
  if (m === 0) { g.moveTo(-16, 44); g.quadraticCurveTo(0, 56, 16, 44); g.stroke(); }
  else if (m === 1) { g.moveTo(-24, 42); g.quadraticCurveTo(0, 66, 24, 42); g.stroke(); }
  else if (m === 2) { g.moveTo(-24, 42); g.quadraticCurveTo(0, 82, 24, 42); g.closePath(); g.fill(); g.fillStyle = '#FF7A8A'; g.beginPath(); g.ellipse(0, 60, 10, 7, 0, 0, Math.PI * 2); g.fill(); }
  else if (m === 3) { g.moveTo(-18, 56); g.quadraticCurveTo(0, 42, 18, 56); g.stroke(); }
  else { g.ellipse(0, 52, 9, 11, 0, 0, Math.PI * 2); g.fill(); }
  g.restore();
  // props
  if (prop === 'phone') {
    const [px, py] = paws[1]; g.save(); g.translate(px - 8, py - 30); g.rotate(-.12);
    toon(rrect(-40, -70, 80, 140, 14), '#1B1B22', null, lw);
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-31, -60, 62, 120, 8); g.fill();
    qr(g, -22, -38, 44, 7);
    g.restore(); toon(ell(px, py, 22, 21), FOX.dark, null, lw);
  }
  if (prop === 'cup') {
    const cx = (paws[0][0] + paws[1][0]) / 2, cy = (paws[0][1] + paws[1][1]) / 2;
    const sipping = p.a2L < -2.4; g.save(); g.translate(cx, cy + (sipping ? -30 : 14));
    // steam
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 6; g.lineCap = 'round';
    for (let k = 0; k < (sipping ? 3 : 2); k++) { g.beginPath(); const ph = propT * 3 + k * 2; g.moveTo(-14 + k * 14, -64); g.bezierCurveTo(-24 + k * 14 + Math.sin(ph) * 8, -90, -4 + k * 14, -100, -14 + k * 14 + Math.sin(ph + 1) * 8, -128); g.stroke(); }
    const cup = poly([[-46, -66], [46, -66], [36, 46], [-36, 46]]); toon(cup, '#FFFFFF', FOX.wshade, lw);
    toon(rrect(-34, -18, 68, 30, 4), '#FF5B00', null, 0, 0, false);
    toon(rrect(-46, -72, 92, 18, 8), '#2A2A30', null, lw);
    g.restore();
    for (const [px, py] of paws) toon(ell(px, py, 22, 21), FOX.dark, null, lw);
  }
  g.restore();
}

// a small QR-like block (finder squares + seeded modules), for phones and Kare
export function qr(g, x, y, s, seed = 1) {
  const n = 11, c = s / n; g.fillStyle = INK; let r = seed * 9301 + 49297;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const fin = (i < 3 && j < 3) || (i > 7 && j < 3) || (i < 3 && j > 7);
    r = (r * 9301 + 49297) % 233280;
    if (fin ? !(i % 8 === 1 && j % 8 === 1) && !((i === 1 || i === 9) && j === 1) : r / 233280 > .52) g.fillRect(x + i * c, y + j * c, c + .3, c + .3);
  }
  g.fillStyle = '#fff'; for (const [i, j] of [[1, 1], [9, 1], [1, 9]]) g.fillRect(x + i * c, y + j * c, c, c);
  g.fillStyle = INK; for (const [i, j] of [[1, 1], [9, 1], [1, 9]]) g.fillRect(x + i * c + c * .25, y + j * c + c * .25, c * .5, c * .5);
}
