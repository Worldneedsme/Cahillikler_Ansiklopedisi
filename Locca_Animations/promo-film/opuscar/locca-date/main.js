// Locca Date — a wordless 80s cel-anime scene (11.5 s, 9:16).
// Painted plates (colour + emissive pair) under flat cels with hard shadow and highlight shapes and coloured lines,
// backlit neon, characters on twos, performance beats on threes, camera on ones, played back through the shared
// videotape + CRT pass (core/post/crt.js). Three colour models: night (the date), blue (panic), gold (relief).
import { clamp, lerp, seg, eo, ei, eio, back, mulberry, hash, TAU } from '/core/lib.js';
import { makePost } from '/core/post/crt.js';

const W = 1080, H = 1920;
const BPM = 120, B = 60 / BPM, NB = 23, DUR = NB * B;          // one beat = 12 frames
const RAW = new URLSearchParams(location.search).has('raw');
const cv = document.getElementById('c');
const mk2 = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const post = RAW ? null : makePost(cv);
const scn = RAW ? cv : mk2(), glw = mk2();
const ctx = scn.getContext('2d'), gctx = glw.getContext('2d');

// ---------- colour models ----------
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = c => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const tone = (h, m) => hex(rgb(h).map((v, i) => v * m[i]));
const SETS = {
  night: { lit: [.96, .9, 1.0], sh: [.68, .5, .78], hi: [1.1, 1.06, 1.08], rim: '#ff6cc0' },
  warm: { lit: [1.02, .95, .88], sh: [.8, .55, .6], hi: [1.12, 1.08, 1.0], rim: '#ffb35c' },
  blue: { lit: [.62, .68, 1.0], sh: [.36, .36, .72], hi: [.86, .92, 1.15], rim: '#6fdcff' },
  gold: { lit: [1.06, .98, .84], sh: [.92, .64, .52], hi: [1.16, 1.12, .98], rim: '#fff0b0' },
};
let SET = SETS.night;
// fill / hard shadow / hard highlight / line for the current set; keep pulls an accent back toward its own colour
function pal(base, line, keep = 0) {
  const k = m => m.map(v => lerp(v, 1, keep));
  return { f: tone(base, k(SET.lit)), s: tone(base, k(SET.sh)), h: tone(base, k(SET.hi)), l: tone(line, k(SET.lit)) };
}
const OR = '#ff5b00';
const FUR = { fox: ['#ff5b00', '#6e1d00'], girl: ['#ff9452', '#7c2c0a'] };
const CREAM = ['#fbefe0', '#8a5a3a'], TIP = ['#3a2418', '#1a0c06'], GLOVE = ['#fbfaf6', '#5c5a78'];
const JACKET = ['#283a78', '#0d1330'], SHIRT = ['#f4f1ea', '#5d5d76'], BOW = ['#c8203f', '#4d0816'], DRESS = ['#c42a6e', '#4d0a2c'];

// ---------- matrices, cels ----------
let M = new DOMMatrix();
const withM = (m, fn) => { const keep = M; M = m; fn(); M = keep; };
const sc = () => Math.hypot(M.a, M.b);
let LIGHT = [18, -12], RIM = null, MONO = null, LW = 3.2;
const ell = (x, y, rx, ry, r = 0) => g => { g.moveTo(x + rx * Math.cos(r), y + rx * Math.sin(r)); g.ellipse(x, y, rx, ry, r, 0, TAU); };
const poly = pts => g => { g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); };
const rrect = (x, y, w, h, r) => g => { g.roundRect(x, y, w, h, r); };
const I = () => ctx.setTransform(1, 0, 0, 1, 0, 0);
// shape − (shape shifted by d), filled: the hard shadow / highlight / rim shapes
function sliver(path, d, col) {
  ctx.save(); ctx.setTransform(M); ctx.beginPath(); path(ctx); ctx.clip();
  ctx.beginPath(); ctx.rect(-1e5, -1e5, 2e5, 2e5); ctx.translate(d[0], d[1]); path(ctx); ctx.fillStyle = col; ctx.fill('evenodd'); ctx.restore();
}
function stamp(path) { gctx.setTransform(M); gctx.beginPath(); path(gctx); gctx.fillStyle = '#000'; gctx.fill(); gctx.setTransform(1, 0, 0, 1, 0, 0); }
// a cel: flat fill, hard shadow, hard highlight, neon rim, coloured line; its silhouette blocks the glow behind it
function cel(path, c, o = {}) {
  if (MONO) { ctx.setTransform(M); ctx.beginPath(); path(ctx); ctx.fillStyle = MONO; ctx.fill(); I(); return; }
  ctx.setTransform(M); ctx.beginPath(); path(ctx); ctx.fillStyle = c.f; ctx.fill();
  const d = o.d ?? LIGHT;
  if (o.shade !== false) sliver(path, d, c.s);
  if (o.hi) sliver(path, [-d[0] * .35, -d[1] * .35], c.h);
  if (RIM && o.rim !== false) sliver(path, [-RIM[0], -RIM[1]], SET.rim);
  if (o.lw !== 0) { ctx.setTransform(M); ctx.beginPath(); path(ctx); I(); ctx.lineWidth = o.lw ?? LW; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = c.l; ctx.stroke(); }
  I(); if (o.stamp !== false) stamp(path);
}
function line(path, col, lw = LW) {
  if (MONO) return;
  ctx.setTransform(M); ctx.beginPath(); path(ctx); I(); ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.stroke();
}
function fill(path, col, alpha = 1) { if (MONO) return; ctx.setTransform(M); ctx.globalAlpha = alpha; ctx.beginPath(); path(ctx); ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1; I(); }
// emissive: drawn in the picture and in the glow layer
function lum(path, col, alpha = 1, glowA = 1) {
  fill(path, col, alpha);
  gctx.setTransform(M); gctx.globalAlpha = glowA; gctx.beginPath(); path(gctx); gctx.fillStyle = col; gctx.fill(); gctx.globalAlpha = 1; gctx.setTransform(1, 0, 0, 1, 0, 0);
}
function lumLine(path, col, lw, glowW = lw * 3) {
  line(path, col, lw);
  gctx.setTransform(M); gctx.beginPath(); path(gctx); gctx.setTransform(1, 0, 0, 1, 0, 0); gctx.lineWidth = glowW; gctx.lineCap = 'round'; gctx.lineJoin = 'round'; gctx.strokeStyle = col; gctx.stroke();
}
function clipTo(path, fn) { ctx.save(); ctx.setTransform(M); ctx.beginPath(); path(ctx); ctx.clip(); fn(); ctx.restore(); }
function num(str, x, y, size, fillc, linec, align = 'center') {
  ctx.setTransform(M); ctx.font = `italic 800 ${size}px BSC`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (linec) { ctx.lineWidth = size * .14; ctx.strokeStyle = linec; ctx.strokeText(str, x, y); }
  ctx.fillStyle = fillc; ctx.fillText(str, x, y); I();
}
function plate(img, x, y, glowImg = null) {
  ctx.setTransform(M); ctx.drawImage(img, x, y); I();
  if (glowImg) { gctx.setTransform(M); gctx.drawImage(glowImg, x, y); gctx.setTransform(1, 0, 0, 1, 0, 0); }
}

// ---------- the fox head (after the approved Locca Jazz design, cel-shaded) ----------
const MUZZLE = [[0, 22], [[70, 54], [150, 32]], [[215, 12], [300, -4]], [[250, 26], [252, 36]], [[290, 46], [318, 62]], [[262, 76], [252, 86]],
  [[285, 104], [292, 124]], [[235, 128], [205, 132]], [[180, 168], [90, 190]], [[44, 214], [0, 202]]];
function muzzle(tx, nx) {
  const P = ([x, y], k) => [x + (k ? tx * 0.7 : nx), y];
  return g => {
    g.moveTo(...P(MUZZLE[0], 0));
    for (let i = 1; i < MUZZLE.length; i++) g.quadraticCurveTo(...P(MUZZLE[i][0], 1), ...P(MUZZLE[i][1], i < MUZZLE.length - 1));
    for (let i = MUZZLE.length - 1; i >= 1; i--) {
      const c = MUZZLE[i][0], e = i > 1 ? MUZZLE[i - 1][1] : MUZZLE[0];
      g.quadraticCurveTo(...P([-c[0], c[1]], 1), ...P([-e[0], e[1]], i > 1));
    }
    g.closePath();
  };
}
const SKULL = g => { g.moveTo(-238, 30); g.lineTo(-266, 2); g.lineTo(-240, -10); g.lineTo(-262, -42); g.lineTo(-234, -52); g.bezierCurveTo(-232, -130, -150, -205, -24, -212); g.lineTo(-10, -244); g.lineTo(4, -214); g.lineTo(24, -238); g.lineTo(32, -210); g.bezierCurveTo(160, -200, 240, -130, 238, -52); g.lineTo(264, -42); g.lineTo(242, -10); g.lineTo(268, 2); g.lineTo(240, 30); g.bezierCurveTo(232, 120, 130, 165, 0, 165); g.bezierCurveTo(-130, 165, -232, 120, -238, 30); };
const BANGS = g => { g.moveTo(-200, -150); g.lineTo(-170, -70); g.lineTo(-140, -128); g.lineTo(-96, -52); g.lineTo(-62, -132); g.lineTo(-14, -58); g.lineTo(26, -138); g.lineTo(70, -64); g.lineTo(104, -134); g.lineTo(150, -76); g.lineTo(166, -128); g.lineTo(210, -150); g.quadraticCurveTo(20, -262, -200, -150); g.closePath(); };
function sweatDrop(x, y, s, rot = 0) {
  withM(M.translate(x, y).rotate(rot).scale(s), () => {
    const p = g => { g.moveTo(0, -62); g.bezierCurveTo(14, -30, 34, -4, 34, 18); g.bezierCurveTo(34, 44, -34, 44, -34, 18); g.bezierCurveTo(-34, -4, -14, -30, 0, -62); };
    cel(p, { f: '#d9f3ff', s: '#8fcaf2', h: '#ffffff', l: '#2f6fb0' }, { d: [10, -8], hi: true, rim: false, lw: LW * .9 });
    fill(ell(-10, 14, 8, 12, .3), '#ffffff');
  });
}
function star(x, y, r, col = '#ffffff', glowA = 1) {
  const p = g => { g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r * .32, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r * .32, y); g.quadraticCurveTo(x, y, x, y - r); g.moveTo(x - r * .7, y); g.quadraticCurveTo(x, y, x, y - r * .2); g.quadraticCurveTo(x, y, x + r * .7, y); g.quadraticCurveTo(x, y, x, y + r * .2); g.quadraticCurveTo(x, y, x - r * .7, y); };
  lum(p, col, 1, glowA);
}
function eye(x, y, rx, ry, o, side) {
  const fur = pal(...FUR[o.kind], .45);
  if (o.closed) {                                                  // a happy closed eye: an upward arc with a lash flick
    line(g => { g.moveTo(x - rx, y + 8); g.quadraticCurveTo(x, y - ry * .9, x + rx, y + 8); }, '#2a120a', LW * 2.2);
    if (o.kind === 'girl') line(g => { g.moveTo(x + side * rx * .9, y); g.lineTo(x + side * (rx + 22), y - 16); }, '#2a120a', LW * 1.6);
    return;
  }
  const scl = g => ell(x, y, rx, ry)(g);
  cel(scl, { f: tone('#fbfaf6', SET.lit), s: tone('#c9c2e6', SET.lit), l: '#2a120a' }, { d: [0, ry * .3], rim: false, stamp: false });
  const ps = o.ps ?? 1, lx = o.look?.[0] ?? 0, ly = o.look?.[1] ?? 0;
  const ix = x + 5 + lx * rx * .3, iy = y + 6 + ly * ry * .22;
  clipTo(scl, () => {
    if (MONO) return;
    if (ps < .5) { fill(ell(ix, iy, rx * .22, ry * .22), '#160804'); return; }
    const ir = g => ell(ix, iy, rx * .64 * ps, ry * .7 * ps)(g);
    fill(ir, tone('#3a1608', SET.lit));
    clipTo(ir, () => fill(ell(ix, iy + ry * .36 * ps, rx * .62 * ps, ry * .42 * ps), tone('#c0602a', SET.lit)));
    fill(ell(ix, iy + 2, rx * .3 * ps, ry * .34 * ps), '#120604');
    fill(ell(ix + rx * .24, iy - ry * .26, rx * .2, ry * .17), '#ffffff');
    fill(ell(ix - rx * .2, iy + ry * .3, rx * .09, ry * .08), '#ffffff');
  });
  if (o.star) star(ix + rx * .24, iy - ry * .26, rx * .55 * o.star);
  const lid = o.lid ?? 0;
  if (lid > 0) {
    clipTo(scl, () => { ctx.setTransform(M); ctx.fillStyle = fur.f; ctx.fillRect(x - rx - 4, y - ry - 4, rx * 2 + 8, (ry * 2 + 8) * lid); });
    line(g => { g.moveTo(x - rx, y - ry + ry * 2 * lid); g.quadraticCurveTo(x, y - ry + ry * 2 * lid + 10, x + rx, y - ry + ry * 2 * lid); }, '#2a120a', LW * 1.6);
  }
  // thick upper lash line, flicking outward (the girl gets lashes)
  const ty = y - ry + ry * 2 * lid;
  line(g => { g.moveTo(x - side * rx * .8, ty + ry * .3 * (1 - lid)); g.quadraticCurveTo(x, ty - 6, x + side * rx * .95, ty + ry * .25 * (1 - lid)); }, '#2a120a', LW * (o.kind === 'girl' ? 2.6 : 1.8));
  if (o.kind === 'girl') for (const k of [0, 1]) line(g => { const ex = x + side * rx * .9, ey = ty + ry * .22 * (1 - lid) - k * 14; g.moveTo(ex - side * 6, ey); g.lineTo(ex + side * (24 - k * 4), ey - 18 - k * 10); }, '#2a120a', LW * 1.4);
}
function head(o) {
  const girl = o.kind === 'girl';
  const fur = pal(...FUR[o.kind], .45), cr = pal(...CREAM, .2), tip = pal(...TIP);
  const tx = o.tx ?? 18, nx = tx * 1.4;
  // ears: cream inside, dark rim and tip; droop folds them outward and down
  for (const s of [-1, 1]) {
    const piv = [s * 150, -120], a = s * (o.droop ?? 0) * 38;
    withM(M.translate(...piv).rotate(a).translate(-piv[0], -piv[1]).translate(s * (girl ? 12 : 0), girl ? 22 : 0), () => {
      const ear = g => { g.moveTo(s * 235, -60); g.quadraticCurveTo(s * 278, -220, s * (girl ? 250 : 265), girl ? -350 : -378); g.quadraticCurveTo(s * 160, -300, s * 70, -200); g.closePath(); };
      cel(ear, fur);
      if (!MONO) clipTo(ear, () => {
        fill(g => { g.moveTo(s * 175, -118); g.quadraticCurveTo(s * 206, -220, s * 222, -306); g.quadraticCurveTo(s * 150, -256, s * 104, -196); g.closePath(); }, cr.f);
        fill(g => { g.moveTo(s * 330, -430); g.lineTo(s * 300, -40); g.lineTo(s * 222, -60); g.quadraticCurveTo(s * 250, -220, s * 236, -330); g.lineTo(s * 150, -300); g.closePath(); }, tip.f);
      });
      line(ear, fur.l);
    });
  }
  cel(SKULL, fur, { hi: true });
  if (o.band != null && !MONO) clipTo(SKULL, () => fill(poly([[o.band - 60, -300], [o.band + 30, -300], [o.band - 170, 260], [o.band - 260, 260]]), '#fff6d8', .35));
  if (o.gloom && !MONO) clipTo(SKULL, () => {                     // vertical gloom lines over the upper face
    ctx.setTransform(M);
    for (let i = 0; i < 16; i++) {
      const x = -240 + i * 32, gr = ctx.createLinearGradient(0, -250, 0, lerp(-130, -70, hash(i * 3.1)));
      gr.addColorStop(0, 'rgba(36,24,110,.75)'); gr.addColorStop(1, 'rgba(36,24,110,0)');
      ctx.fillStyle = gr; ctx.fillRect(x, -260, 12 + 6 * hash(i), 300);
    }
    I();
  });
  if (girl) {                                                      // a fur fringe in locks with an angel-ring highlight
    withM(M.translate(0, 12), () => cel(BANGS, { ...fur, f: fur.s }, { shade: false, rim: false, lw: 0 }));
    cel(BANGS, fur, { hi: true });
    if (!MONO) clipTo(BANGS, () => fill(g => { g.moveTo(-220, -196); g.lineTo(220, -196); g.lineTo(220, -170); for (let x = 200; x >= -220; x -= 40) { g.lineTo(x, -166 + (x / 40 % 2 ? 14 : 0)); } g.closePath(); }, fur.h));
  }
  cel(muzzle(tx, nx), cr, { d: [LIGHT[0] * .8, LIGHT[1] * .8] });
  if (o.blush) fill(g => { ell(-150 + tx * .7, 40, 46, 22)(g); ell(150 + tx * .7, 40, 46, 22)(g); }, '#ff6f9a', .45 * o.blush);
  for (const s of [-1, 1]) for (const k of (girl ? [0] : [0, 1])) line(g => { g.moveTo(s * 210 + tx * 0.7, 48 + k * 30); g.lineTo(s * 345 + tx * 0.7, 26 + k * 74); }, cr.l, LW * .7);
  // brows: happy arches, worried (inner ends up), or raised high in surprise; never angled down toward the nose
  for (const s of [-1, 1]) {
    const ex = s * 62 + tx, br = o.brow ?? 'happy';
    if (br === 'worry') line(g => { g.moveTo(ex + s * 44, -116); g.quadraticCurveTo(ex + s * 4, -150, ex - s * 44, -172); }, fur.l, LW * 2.2);   // inner ends up
    else line(g => { const up = br === 'up' ? -30 : 0; g.moveTo(ex - 44, -118 + up); g.quadraticCurveTo(ex - 2, -172 + up, ex + 44, -124 + up); }, fur.l, LW * 2.2);
  }
  const er = girl ? [50, 58] : [54, 64];
  eye(-62 + tx, -40, ...er, o, -1);
  if (o.wink) line(g => { g.moveTo(14 + tx, -30); g.quadraticCurveTo(62 + tx, -86, 110 + tx, -30); }, '#2a120a', LW * 2.2);
  else eye(62 + tx, -40, ...er, o, 1);
  if (!MONO) { fill(ell(nx, 42, girl ? 24 : 30, girl ? 17 : 21), '#1c0e0a'); fill(ell(nx - 8, 35, 9, 5, -.3), '#ffffff'); }
  // mouth
  const m = o.mouth ?? 'smile', ml = '#3a1208';
  if (MONO) {}
  else if (m === 'grin') { cel(g => { g.moveTo(nx - 76, 74); g.quadraticCurveTo(nx - 12, 168, nx + 52, 76); g.quadraticCurveTo(nx - 12, 100, nx - 76, 74); }, { f: '#4a0e14', s: '#4a0e14', l: ml }, { shade: false, rim: false, stamp: false }); fill(ell(nx - 12, 120, 22, 10), '#ff7f8f'); }
  else if (m === 'wobble') {
    cel(g => { g.moveTo(nx - 66, 84); g.quadraticCurveTo(nx - 50, 70, nx - 34, 86); g.quadraticCurveTo(nx - 18, 72, nx - 2, 86); g.quadraticCurveTo(nx + 14, 72, nx + 30, 86); g.quadraticCurveTo(nx + 44, 74, nx + 54, 88); g.quadraticCurveTo(nx, 150, nx - 66, 84); }, { f: '#4a0e14', s: '#4a0e14', l: ml }, { shade: false, rim: false, stamp: false });
    fill(ell(nx - 6, 122, 20, 9), '#ff7f8f');
  } else if (m === 'nervous') line(g => { g.moveTo(nx - 66, 90); g.quadraticCurveTo(nx - 50, 76, nx - 33, 92); g.quadraticCurveTo(nx - 16, 106, nx, 90); g.quadraticCurveTo(nx + 16, 76, nx + 33, 92); g.quadraticCurveTo(nx + 44, 102, nx + 52, 88); }, ml, LW * 1.4);
  else if (m === 'kiss') line(g => { g.moveTo(nx - 2, 76); g.quadraticCurveTo(nx + 22, 86, nx + 2, 96); g.quadraticCurveTo(nx + 22, 106, nx - 2, 116); }, ml, LW * 1.6);
  else if (m === 'sigh') { fill(ell(nx - 6, 100, 18, 14), '#4a0e14'); line(ell(nx - 6, 100, 18, 14), ml, LW); }
  else if (girl) line(g => { g.moveTo(nx - 56, 78); g.quadraticCurveTo(nx - 10, 124, nx + 40, 80); }, ml, LW * 1.3);
  else {
    line(g => { g.moveTo(nx - 76, 78); g.quadraticCurveTo(nx - 12, 134, nx + 48, 80); }, ml, LW * 1.3);
    line(g => { g.moveTo(nx - 90, 64); g.quadraticCurveTo(nx - 88, 80, nx - 72, 84); }, ml, LW);
  }
  if (girl && !MONO) {                                            // a white flower by her ear
    withM(M.translate(176, -150).rotate(-20), () => {
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; cel(ell(Math.cos(a) * 26, Math.sin(a) * 26, 22, 15, a), pal('#fff8fb', '#9a5a78'), { d: [6, -4], rim: false }); }
      cel(ell(0, 0, 13, 13), pal('#ffd24a', '#8a5a10'), { shade: false, rim: false });
    });
  }
  for (const d of o.sweat ?? []) sweatDrop(d.x, d.y, d.s, d.r ?? 0);
}

// ---------- busts, hands and props ----------
function foxBust() {
  const jk = pal(...JACKET), sh = pal(...SHIRT), bw = pal(...BOW), fur = pal(...FUR.fox, .45);
  cel(poly([[-74, 110], [74, 110], [84, 250], [-84, 250]]), fur, { hi: false });
  cel(g => { g.moveTo(-96, 196); g.bezierCurveTo(-210, 210, -290, 250, -305, 340); g.lineTo(-330, 1300); g.lineTo(330, 1300); g.lineTo(305, 340); g.bezierCurveTo(290, 250, 210, 210, 96, 196); g.closePath(); }, jk, { hi: true });
  cel(poly([[-92, 198], [92, 198], [0, 470]]), sh, { shade: false });
  for (const s of [-1, 1]) line(g => { g.moveTo(s * 96, 200); g.lineTo(s * 150, 330); g.lineTo(s * 30, 520); }, jk.l, LW * 1.2);
  cel(poly([[0, 236], [-74, 200], [-74, 274]]), bw); cel(poly([[0, 236], [74, 200], [74, 274]]), bw); cel(ell(0, 236, 20, 22), bw, { shade: false });
}
function girlBust() {
  const fur = pal(...FUR.girl, .45), dr = pal(...DRESS);
  cel(g => { g.moveTo(-70, 120); g.lineTo(-74, 220); g.bezierCurveTo(-170, 236, -250, 270, -262, 360); g.lineTo(-280, 1300); g.lineTo(280, 1300); g.lineTo(262, 360); g.bezierCurveTo(250, 270, 170, 236, 74, 220); g.lineTo(70, 120); g.closePath(); }, fur, { hi: true });
  cel(g => { g.moveTo(-262, 340); g.quadraticCurveTo(-140, 270, 0, 336); g.quadraticCurveTo(140, 270, 262, 340); g.lineTo(282, 1300); g.lineTo(-282, 1300); g.closePath(); }, dr, { hi: true });
  for (const s of [-1, 1]) line(g => { g.moveTo(s * 150, 300); g.lineTo(s * 128, 236); }, dr.l, LW * 1.4);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (.2 + .6 * i / 8); cel(ell(Math.cos(a) * 104, 190 + Math.sin(a) * 70, 11, 11), pal('#fbf6f0', '#7a6a80'), { shade: false, rim: false, lw: 2 }); }
}
// a white cartoon glove: 'open', 'chin' (curled, knuckles up) or 'hold' (wrapped round a stem or a phone)
function glove(x, y, rot, s, kind = 'open', flip = 1) {
  withM(M.translate(x, y).rotate(rot).scale(s * flip, s), () => {
    const parts = [ell(0, 0, 46, 40)];
    if (kind === 'open') for (const a of [-.8, -.27, .27, .8]) parts.push(ell(Math.cos(a) * 60, Math.sin(a) * 60, 28, 14, a));
    if (kind === 'chin') for (let i = 0; i < 4; i++) parts.push(ell(-30 + i * 21, -34, 14, 16));
    if (kind === 'hold') { parts.push(ell(34, -14, 24, 14, -.5)); for (let i = 0; i < 3; i++) parts.push(ell(-14 + i * 4, 26 + i * 14, 26, 12, .2)); }
    if (kind !== 'chin') parts.push(ell(-6, -40, 26, 13, -1.2));
    const c = pal(...GLOVE);
    if (MONO) { parts.forEach(p => cel(p, c)); return; }
    parts.forEach(p => line(p, c.l, LW * 2)); parts.forEach(p => fill(p, c.f));
    sliver(parts[0], [10, -8], c.s);
    parts.forEach(p => stamp(p));
  });
}
function sleeve(a, b, w, c, cuff = true) {
  const p = g => { g.moveTo(...a); g.lineTo(...b); };
  line(p, c.l, w + LW * 2); line(p, c.f, w);
  if (cuff) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; line(g => { g.moveTo(b[0] - u[0] * 26, b[1] - u[1] * 26); g.lineTo(b[0] - u[0] * 4, b[1] - u[1] * 4); }, tone('#f4f1ea', SET.lit), w * .9); }
  withM(M, () => { gctx.setTransform(M); gctx.beginPath(); p(gctx); gctx.setTransform(1, 0, 0, 1, 0, 0); gctx.lineWidth = w + 6; gctx.strokeStyle = '#000'; gctx.stroke(); });
}
// the bill: a black folder, cream paper with icons, three amounts and the total
const ICON = {
  plate: g => { ell(0, 0, 34, 34)(g); ell(0, 0, 20, 20)(g); },
  glass: g => { g.moveTo(-18, -30); g.lineTo(18, -30); g.quadraticCurveTo(18, 6, 0, 8); g.quadraticCurveTo(-18, 6, -18, -30); g.moveTo(0, 8); g.lineTo(0, 28); g.moveTo(-14, 30); g.lineTo(14, 30); },
  cake: g => { g.moveTo(-32, 24); g.lineTo(30, 24); g.lineTo(30, -6); g.lineTo(-32, 10); g.closePath(); g.moveTo(-32, 10); g.lineTo(30, -6); g.moveTo(22, -12); g.quadraticCurveTo(22, -30, 30, -34); },
};
function billPaper(o = {}) {
  const ink = tone('#3a2a2a', SET.lit), pap = pal('#fbf3e2', '#8a7258');
  cel(rrect(-250, -350, 500, 700, 10), pap, { d: [14, 10], rim: false });
  [['plate', '40', -230], ['glass', '30', -110], ['cake', '30', 10]].forEach(([ic, v, y], i) => {
    withM(M.translate(-170, y), () => { line(ICON[ic], ink, LW * 1.2); if (ic === 'glass') withM(M.translate(46, 0), () => line(ICON.glass, ink, LW * 1.2)); });
    line(g => { for (let x = -60; x < 110; x += 18) { g.moveTo(x, y + 18); g.lineTo(x + 6, y + 18); } }, tone('#b8a890', SET.lit), LW);
    num(v, 200, y, 72, ink, null, 'right');
  });
  line(g => { g.moveTo(-200, 110); g.lineTo(200, 110); }, ink, LW * 1.4);
  num('100', 0, 232, 170, tone('#2a1a1a', SET.lit), null);
  if (o.sweep != null) clipTo(rrect(-250, -350, 500, 700, 10), () => fill(poly([[o.sweep - 80, -400], [o.sweep + 20, -400], [o.sweep - 200, 400], [o.sweep - 300, 400]]), '#ffffff', .45));
  if (o.check) {                                                   // the orange check stamped over the total
    const k = o.check;
    withM(M.translate(40, 220).scale(back(k, 2.6) * 1.0).rotate(-8), () => {
      const ck = g => { g.moveTo(-150, 0); g.lineTo(-60, 90); g.lineTo(160, -150); g.lineTo(186, -120); g.lineTo(-60, 150); g.lineTo(-186, 30); g.closePath(); };
      cel(ck, pal(OR, '#6e1d00', .6), { d: [10, 8], hi: true, rim: false });
      gctx.setTransform(M); gctx.globalAlpha = .5; gctx.beginPath(); ck(gctx); gctx.fillStyle = OR; gctx.fill(); gctx.globalAlpha = 1; gctx.setTransform(1, 0, 0, 1, 0, 0);
    });
  }
}
function billFolder(open, o = {}) {
  const lea = pal('#2a2226', '#0a0608'), sue = pal('#6a3a2a', '#2a120a');
  cel(rrect(-280, -390, 560, 780, 26), lea, { hi: true });
  if (open > 0) {
    clipTo(rrect(-280, -390, 560, 780, 26), () => fill(rrect(-262, -372, 524, 744, 18), sue.s));
    billPaper(o);
  }
  // the cover swings open on its left hinge
  const u = clamp(open), cx = Math.cos(Math.PI * u);
  if (u < 1) withM(M.translate(-280, 0).scale(cx, 1).translate(280, 0), () => cel(rrect(-280, -390, 560, 780, 26), cx > 0 ? lea : sue, { hi: cx > 0 }));
}
function coin(x, y, s, spin = 0) {
  withM(M.translate(x, y).scale(s * Math.max(.15, Math.abs(Math.cos(spin))), s), () => {
    const c = pal(OR, '#6e1d00', .7);
    cel(ell(0, 0, 50, 50), c, { d: [8, -8], hi: true, rim: false });
    line(ell(0, 0, 34, 34), tone('#ffd0a0', SET.lit), LW * 1.2);
    fill(ell(-14, -16, 9, 13, .5), '#fff4e0');
    gctx.setTransform(M); gctx.globalAlpha = .55; gctx.beginPath(); ell(0, 0, 50, 50)(gctx); gctx.fillStyle = OR; gctx.fill(); gctx.globalAlpha = 1; gctx.setTransform(1, 0, 0, 1, 0, 0);
  });
}
function heart(x, y, s, col = '#ff6fa8', glowA = .7) {
  withM(M.translate(x, y).scale(s), () => {
    const p = g => { g.moveTo(0, 30); g.bezierCurveTo(-60, -10, -40, -60, 0, -32); g.bezierCurveTo(40, -60, 60, -10, 0, 30); g.closePath(); };
    cel(p, { f: col, s: tone(col, [.8, .6, .7]), h: '#ffffff', l: tone(col, [.45, .3, .4]) }, { d: [6, -6], hi: true, rim: false });
    gctx.setTransform(M); gctx.globalAlpha = glowA; gctx.beginPath(); p(gctx); gctx.fillStyle = col; gctx.fill(); gctx.globalAlpha = 1; gctx.setTransform(1, 0, 0, 1, 0, 0);
  });
}
function wineGlass(x, y, s, rot = 0, wine = .5) {
  withM(M.translate(x, y).rotate(rot).scale(s), () => {
    const bowl = g => { g.moveTo(-52, -190); g.bezierCurveTo(-58, -80, -30, -60, 0, -60); g.bezierCurveTo(30, -60, 58, -80, 52, -190); g.closePath(); };
    fill(bowl, '#e8e4ff', .16);
    if (wine > 0) clipTo(bowl, () => { fill(g => g.rect(-70, -60 - 130 * wine, 140, 140), tone('#9a1238', SET.lit)); fill(g => g.rect(-70, -60 - 130 * wine, 140, 8), tone('#d8406a', SET.lit)); });
    const gl_ = tone('#ece8ff', SET.lit);
    line(bowl, gl_, LW * .9);
    line(g => { g.moveTo(0, -60); g.lineTo(0, 40); g.moveTo(-40, 44); g.quadraticCurveTo(0, 30, 40, 44); }, gl_, LW * 1.4);
    lumLine(g => { g.moveTo(-38, -176); g.quadraticCurveTo(-44, -110, -24, -80); }, '#ffffff', LW * 1.4, LW * 3);
  });
}
function candle(x, y, s, t) {
  withM(M.translate(x, y).scale(s), () => {
    cel(g => { g.moveTo(-40, 0); g.lineTo(40, 0); g.lineTo(26, -26); g.lineTo(-26, -26); g.closePath(); }, pal('#c89a3a', '#5a3a08'), { hi: true });
    cel(rrect(-18, -150, 36, 126, 6), pal('#fbf3e6', '#8a7258'), { hi: true });
    const f = 1 + .12 * Math.sin(t * 31) * hash(Math.floor(t * 12));
    withM(M.translate(0, -158).scale(1, f), () => {
      lum(g => { g.moveTo(0, -56); g.bezierCurveTo(18, -26, 16, 0, 0, 4); g.bezierCurveTo(-16, 0, -18, -26, 0, -56); }, '#ffcf5a');
      lum(ell(0, -12, 7, 12), '#fff6d8');
    });
    gctx.setTransform(M); const gr = gctx.createRadialGradient(0, -170, 0, 0, -170, 220); gr.addColorStop(0, 'rgba(255,170,60,.55)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); gctx.fillStyle = gr; gctx.fillRect(-240, -400, 480, 460); gctx.setTransform(1, 0, 0, 1, 0, 0);
  });
}
// a bifold leather wallet: stitching, a strap with a snap; it opens like a book onto empty card slots and an empty
// money pocket with a cobweb in the corner
function wallet(open) {
  const lea = pal('#a85e2c', '#3a1808', .4), inn = pal('#6e3a1c', '#2a1006', .4), st = tone('#f0c890', SET.lit.map(v => lerp(v, 1, .5)));
  const u = clamp(open), stitch = (x, y, w, h) => { ctx.setLineDash([10, 8]); line(rrect(x, y, w, h, 10), st, LW * .9); ctx.setLineDash([]); };
  withM(M.translate(170 * u, 0), () => {
    // the inside right panel (under the cover): the money pocket, empty
    if (u > 0) {
      cel(rrect(-170, -115, 340, 230, 18), inn, { hi: true });
      cel(rrect(-150, -70, 300, 160, 10), pal('#2a1208', '#120604', .4), { shade: false });
      line(g => { g.moveTo(-150, -70); g.quadraticCurveTo(0, -40, 150, -70); }, inn.l, LW * 1.4);
      line(g => { g.moveTo(150, -66); g.lineTo(100, -66); g.moveTo(150, -66); g.lineTo(150, -20); g.moveTo(150, -66); g.lineTo(110, -26);
        g.moveTo(130, -66); g.quadraticCurveTo(136, -48, 150, -46); g.moveTo(114, -66); g.quadraticCurveTo(124, -34, 150, -30); }, 'rgba(220,220,235,.9)', 2.2);
      stitch(-158, -103, 316, 206);
    }
    // the cover swings open on its left fold: outside first, then its inside with empty card slots
    const cx = Math.cos(Math.PI * u);
    withM(M.translate(-170, 0).scale(cx, 1).translate(170, 0), () => {
      if (cx > 0) {
        cel(rrect(-170, -115, 340, 230, 18), lea, { hi: true });
        stitch(-156, -101, 312, 202);
        line(g => { g.moveTo(-162, -100); g.lineTo(-162, 100); }, lea.l, LW * 1.2);
        cel(g => { g.moveTo(170, -40); g.lineTo(90, -40); g.quadraticCurveTo(70, -40, 70, -20); g.lineTo(70, 20); g.quadraticCurveTo(70, 40, 90, 40); g.lineTo(170, 40); g.closePath(); }, lea, { hi: true });
        cel(ell(100, 0, 16, 16), pal('#d8d4e0', '#4a4658', .3), { d: [4, -4], hi: true });
      } else {
        cel(rrect(-170, -115, 340, 230, 18), inn, { hi: true });
        for (const y of [-70, -10, 50]) line(g => { g.moveTo(-150, y); g.quadraticCurveTo(0, y + 24, 150, y); }, inn.l, LW * 1.3);
        stitch(-158, -103, 316, 206);
      }
    });
  });
}
function moth(x, y, s, flap) {
  withM(M.translate(x, y).scale(s), () => {
    const c = pal('#b8b0a8', '#4a443e');
    for (const sd of [-1, 1]) withM(M.scale(1, .3 + .7 * Math.abs(Math.cos(flap))), () => cel(g => { g.moveTo(0, -4); g.bezierCurveTo(sd * 30, -50, sd * 80, -40, sd * 70, 0); g.bezierCurveTo(sd * 60, 30, sd * 20, 20, 0, 6); g.closePath(); }, c, { d: [0, 6], rim: false }));
    cel(ell(0, 0, 9, 24), pal('#6a625a', '#2a241e'), { shade: false, rim: false });
    line(g => { g.moveTo(-4, -22); g.quadraticCurveTo(-16, -44, -24, -46); g.moveTo(4, -22); g.quadraticCurveTo(16, -44, 24, -46); }, '#2a241e', LW * .8);
  });
}
let LOGO = null;
function phone(o) {
  // the Locca app in the hand: logo, the orange card with the points, the pay button (a coin with an arrow)
  cel(rrect(-220, -440, 440, 880, 56), pal('#262a36', '#08090e'), { hi: true });
  const scr = rrect(-196, -410, 392, 820, 34);
  lum(scr, '#141a33', 1, .25);
  clipTo(scr, () => {
    ctx.setTransform(M); const gr = ctx.createLinearGradient(0, -410, 0, 410); gr.addColorStop(0, '#1d2550'); gr.addColorStop(1, '#0c1024'); ctx.fillStyle = gr; ctx.fillRect(-200, -420, 400, 840); I();
    if (LOGO) { ctx.setTransform(M); ctx.drawImage(LOGO, -150, -350, 300, 102); I(); gctx.setTransform(M); gctx.globalAlpha = .6; gctx.drawImage(LOGO, -150, -350, 300, 102); gctx.globalAlpha = 1; gctx.setTransform(1, 0, 0, 1, 0, 0); }
    lum(rrect(-168, -200, 336, 210, 24), OR, 1, .35);
    fill(rrect(-168, -200, 336, 52, [24, 24, 0, 0]), '#d84a00');
    withM(M.translate(-96, -60).scale(.7), () => coin(0, 0, 1));
    num(String(o.points), 70, -64, 104, '#fff4e4', '#7a2200');
    if (o.button) {
      const k = o.press ?? 1;
      withM(M.translate(0, 190).scale(k), () => {
        lum(ell(0, 0, 100, 100), OR, 1, .5);
        line(ell(0, 0, 100, 100), '#ffd0a0', LW * 1.2);
        withM(M.translate(0, -24).scale(.75), () => coin(0, 0, 1));
        lum(poly([[-30, 34], [30, 34], [0, 74]]), '#fff4e4', 1, .6);
      });
      if (o.ripple > 0 && o.ripple < 1) line(ell(0, 190, 100 + 140 * o.ripple, 100 + 140 * o.ripple), `rgba(255,240,220,${1 - o.ripple})`, LW * 2);
    }
    if (o.done) withM(M.translate(0, 190).scale(back(o.done, 2.2) * .9), () => lumLine(g => { g.moveTo(-50, 0); g.lineTo(-12, 40); g.lineTo(60, -44); }, '#7dffb0', LW * 4, LW * 7));
  });
  line(scr, '#000', LW);
}

// ---------- the Locca neon sign ----------
let LOGOW = null, LOGOB = null;
function tint(img, col) { const c = mk2(img.width, img.height), g = c.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; }
const zoomTo = (x, y, z) => new DOMMatrix().translate(x, y).scale(z).translate(-x, -y);
function neonSign(on, b) {
  const w = 560, h = w * 168 / 492, x0 = -w / 2, y0 = -h / 2;
  fill(rrect(-340, -150, 680, 300, 26), '#0c0716');
  stamp(rrect(-340, -150, 680, 300, 26));                        // the backing blocks the city glow behind it
  line(rrect(-340, -150, 680, 300, 26), '#2a1d44', LW * 1.5);
  if (!LOGO) return;
  if (!on) { ctx.setTransform(M); ctx.globalAlpha = .22; ctx.drawImage(LOGO, x0, y0, w, h); ctx.globalAlpha = 1; I(); line(rrect(-316, -126, 632, 252, 22), 'rgba(255,120,180,.18)', LW * 2); return; }
  const pulse = 1 + .05 * Math.sin(b * 7);
  // light spills onto the wet night around the sign
  ctx.setTransform(M); ctx.globalCompositeOperation = 'screen';
  const sp = ctx.createRadialGradient(0, 0, 60, 0, 0, 900); sp.addColorStop(0, 'rgba(255,110,30,.3)'); sp.addColorStop(.5, 'rgba(255,80,40,.18)'); sp.addColorStop(1, 'rgba(255,60,60,0)');
  ctx.fillStyle = sp; ctx.fillRect(-1000, -1000, 2000, 2000); ctx.globalCompositeOperation = 'source-over'; I();
  // the tube frame in pink, the letters in orange with a white-hot core
  lumLine(rrect(-316, -126, 632, 252, 22), '#ff4fa8', LW * 2, LW * 5);
  lumLine(rrect(-298, -108, 596, 216, 16), '#ffd0ea', LW * .8, LW * 3);
  ctx.setTransform(M); ctx.drawImage(LOGOB, x0, y0, w, h); ctx.globalAlpha = .4; ctx.drawImage(LOGOW, x0, y0, w, h); ctx.globalAlpha = 1; I();
  gctx.setTransform(M); gctx.globalAlpha = .85 * pulse; gctx.drawImage(LOGOB, x0, y0, w, h); gctx.globalAlpha = 1; gctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 5; i++) { const k = (b * 1.3 + i * .37) % 1; star(-280 + i * 140 + 30 * Math.sin(i * 7), (i % 2 ? -170 : 170), 34 * Math.sin(Math.PI * k), '#fff4e6', 1); }
}

// ---------- painted plates (once at load): colour + emissive pairs ----------
const PL = {};
function softDot(g, x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; }
function bokeh(g, q, x, y, r, col, a) {
  g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.globalAlpha = a * 1.4; g.strokeStyle = col; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1;
  q.globalAlpha = a * .8; q.fillStyle = col; q.beginPath(); q.arc(x, y, r, 0, TAU); q.fill(); q.globalAlpha = 1;
}
function paintCity() {                                            // far plane: canvas y = far y + 1300
  const Hh = 2600, c = mk2(W, Hh), g = c.getContext('2d'), e = mk2(W, Hh), q = e.getContext('2d'), r = mulberry(11);
  q.fillStyle = '#000'; q.fillRect(0, 0, W, Hh);
  const sky = g.createLinearGradient(0, 0, 0, Hh);
  sky.addColorStop(0, '#080616'); sky.addColorStop(.3, '#160e3c'); sky.addColorStop(.55, '#38185a'); sky.addColorStop(.72, '#7a2f6e'); sky.addColorStop(.85, '#3a1640'); sky.addColorStop(1, '#1a0a20');
  g.fillStyle = sky; g.fillRect(0, 0, W, Hh);
  for (let i = 0; i < 14; i++) { const x = r() * W, y = 300 + r() * 1300; for (let k = 0; k < 5; k++) { softDot(g, x + (k - 2) * 90, y + r() * 30, 120 + r() * 60, 'rgba(120,70,160,1)', .12); softDot(g, x + (k - 2) * 90, y + 50, 90, 'rgba(255,110,180,1)', .06); } }
  for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(r() * W, r() * 900, 2, 2); }
  const rows = [{ top: [1380, 1700], col: '#3a2560', win: .25, w: [90, 200] }, { top: [1500, 1900], col: '#24153e', win: .35, w: [110, 240] }, { top: [1650, 2100], col: '#150b26', win: .45, w: [140, 280] }];
  rows.forEach((row, ri) => {
    for (let x = -40; x < W + 40;) {
      const w = row.w[0] + r() * (row.w[1] - row.w[0]), top = row.top[0] + r() * (row.top[1] - row.top[0]);
      if (ri === 1 && x > 360 && x < 720) { x += w; continue; }      // leave room for the sign tower
      g.fillStyle = row.col; g.fillRect(x, top, w - 8, Hh - top);
      g.fillStyle = 'rgba(255,120,200,.25)'; g.fillRect(x, top, w - 8, 4);
      for (let yy = top + 24; yy < Hh; yy += 34) for (let xx = x + 12; xx < x + w - 24; xx += 26) if (r() < row.win) {
        const col = r() < .7 ? '#ffcf6a' : r() < .5 ? '#7fe8ff' : '#ff8fc8';
        g.fillStyle = col; g.fillRect(xx, yy, 12, 16); q.globalAlpha = .7; q.fillStyle = col; q.fillRect(xx, yy, 12, 16); q.globalAlpha = 1;
      }
      x += w;
    }
  });
  // the sign tower (its sign is lit in the last shot)
  g.fillStyle = '#1c1032'; g.fillRect(380, 970, 320, Hh - 970); g.fillStyle = 'rgba(255,120,200,.3)'; g.fillRect(380, 970, 320, 5);
  g.fillStyle = '#120a22'; g.fillRect(400, 1000, 280, 240); g.strokeStyle = '#3a2a5a'; g.lineWidth = 4; g.strokeRect(400, 1000, 280, 240);
  g.fillStyle = '#1c1032'; g.fillRect(536, 880, 8, 90); q.fillStyle = '#ff3050'; q.beginPath(); q.arc(540, 878, 8, 0, TAU); q.fill(); g.fillStyle = '#ff3050'; g.beginPath(); g.arc(540, 878, 6, 0, TAU); g.fill();
  for (let yy = 1280; yy < Hh; yy += 40) for (let xx = 400; xx < 680; xx += 30) if (r() < .3) { g.fillStyle = '#ffcf6a'; g.fillRect(xx, yy, 14, 18); q.globalAlpha = .6; q.fillStyle = '#ffcf6a'; q.fillRect(xx, yy, 14, 18); q.globalAlpha = 1; }
  // wordless neon icons on the buildings: a heart, a cocktail glass, a star, a note
  const neon = (fn, col) => { for (const [cc, lw, a] of [[g, 5, 1], [q, 16, .7], [q, 5, 1]]) { cc.save(); cc.globalAlpha = a; cc.strokeStyle = col; cc.lineWidth = lw; cc.lineJoin = 'round'; cc.lineCap = 'round'; cc.beginPath(); fn(cc); cc.stroke(); cc.restore(); } };
  neon(cc => { cc.moveTo(130, 1650); cc.bezierCurveTo(70, 1610, 90, 1560, 130, 1585); cc.bezierCurveTo(170, 1560, 190, 1610, 130, 1650); }, '#ff5fae');
  neon(cc => { cc.moveTo(860, 1700); cc.lineTo(940, 1700); cc.lineTo(900, 1750); cc.closePath(); cc.moveTo(900, 1750); cc.lineTo(900, 1790); cc.moveTo(880, 1792); cc.lineTo(920, 1792); }, '#62e6ff');
  neon(cc => { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; cc[i ? 'lineTo' : 'moveTo'](250 + 40 * Math.cos(a), 1830 + 40 * Math.sin(a)); } cc.closePath(); }, '#ffd85a');
  neon(cc => { cc.moveTo(990, 1500); cc.lineTo(990, 1560); cc.moveTo(990, 1500); cc.lineTo(1030, 1490); cc.lineTo(1030, 1545); }, '#c48cff');
  return { c, e };
}
function paintRoom() {                                             // near plane: canvas y = near y + 1700
  const Hh = 2920, c = mk2(W, Hh), g = c.getContext('2d');
  const wall = g.createLinearGradient(0, 0, 0, Hh); wall.addColorStop(0, '#2a1230'); wall.addColorStop(1, '#3e1a3a');
  g.fillStyle = wall; g.fillRect(0, 0, W, Hh);
  for (let x = 0; x < W; x += 36) { g.fillStyle = 'rgba(255,200,230,.04)'; g.fillRect(x, 0, 14, Hh); }
  g.globalCompositeOperation = 'destination-out'; g.fillRect(150, 0, 780, 2850); g.globalCompositeOperation = 'source-over';
  const wood = '#1e0f14', woodHi = '#4a2a2a';
  g.fillStyle = wood; g.fillRect(132, 0, 18, 2850); g.fillRect(930, 0, 18, 2850); g.fillRect(531, 2220, 18, 630);   // the upper pane is one sheet of glass
  for (const y of [1700 + 520, 1700 - 400, 1700 - 1320]) { g.fillStyle = wood; g.fillRect(132, y, 816, 18); g.fillStyle = woodHi; g.fillRect(132, y, 816, 3); }
  g.fillStyle = '#2a1418'; g.fillRect(110, 2850, 860, 46); g.fillStyle = '#5a3030'; g.fillRect(110, 2850, 860, 6);
  // velvet curtains with hard-edged folds, tied back
  for (const s of [-1, 1]) {
    g.save(); if (s > 0) { g.translate(W, 0); g.scale(-1, 1); }
    const path = () => { g.beginPath(); g.moveTo(0, 0); g.lineTo(160, 0); g.bezierCurveTo(165, 1400, 150, 2300, 120, 2700); g.bezierCurveTo(170, 2800, 200, 2860, 190, 2920); g.lineTo(0, 2920); g.closePath(); };
    path(); g.fillStyle = '#6a1838'; g.fill(); g.save(); path(); g.clip();
    for (let x = 10; x < 280; x += 54) { g.fillStyle = '#4a0f28'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 18, 0); g.lineTo(x * .5 + 30, 2560); g.lineTo(x * .5 + 20, 2560); g.closePath(); g.fill(); g.fillStyle = '#a03060'; g.fillRect(x + 30, 0, 5, 2400); }
    g.restore(); path(); g.strokeStyle = '#2a0614'; g.lineWidth = 3; g.stroke();
    g.restore();
  }
  return c;
}
function paintTable() {                                            // canvas y = near y − 1160
  const c = mk2(W, 760), g = c.getContext('2d');
  g.beginPath(); g.moveTo(40, 70); g.lineTo(1040, 70); g.lineTo(1120, 340); g.lineTo(-40, 340); g.closePath();
  const top = g.createRadialGradient(540, 140, 20, 540, 200, 700); top.addColorStop(0, '#fff3dc'); top.addColorStop(.5, '#efe2d4'); top.addColorStop(1, '#bfaecf');
  g.fillStyle = top; g.fill(); g.strokeStyle = '#7a6070'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#d8c8d8'; g.fillRect(-40, 340, 1160, 420);
  for (let x = -20; x < W + 40; x += 110) { g.fillStyle = '#a894b4'; g.beginPath(); g.moveTo(x, 340); g.lineTo(x + 30, 340); g.lineTo(x + 50, 760); g.lineTo(x + 6, 760); g.closePath(); g.fill(); g.fillStyle = '#f4ecf0'; g.fillRect(x + 64, 346, 5, 414); }
  g.fillStyle = '#f8f0f0'; g.fillRect(-40, 336, 1160, 8); g.strokeStyle = '#7a6070'; g.beginPath(); g.moveTo(-40, 344); g.lineTo(1120, 344); g.stroke();
  return c;
}
function paintFlat(kind) {
  const c = mk2(), g = c.getContext('2d'), e = mk2(), q = e.getContext('2d'), r = mulberry(kind.length * 7);
  q.fillStyle = '#000'; q.fillRect(0, 0, W, H);
  if (kind === 'top') {                                            // the table seen from above, bokeh of the room beyond
    const bg = g.createLinearGradient(0, 0, 0, 520); bg.addColorStop(0, '#1a0a1a'); bg.addColorStop(1, '#3a1a30'); g.fillStyle = bg; g.fillRect(0, 0, W, 520);
    for (let i = 0; i < 26; i++) bokeh(g, q, r() * W, r() * 480, 30 + r() * 70, ['#ffcf6a', '#ff7fc0', '#7fe0ff'][i % 3], .18 + r() * .2);
    const cl = g.createRadialGradient(820, 500, 40, 600, 900, 1500); cl.addColorStop(0, '#fff2d6'); cl.addColorStop(.6, '#eadbd0'); cl.addColorStop(1, '#a898b4');
    g.fillStyle = cl; g.fillRect(0, 500, W, H - 500);
    for (let y = 520; y < H; y += 7) { g.fillStyle = 'rgba(120,90,120,.05)'; g.fillRect(0, y, W, 2); }
    g.fillStyle = '#f8f0e8'; g.fillRect(0, 498, W, 10); g.fillStyle = '#7a6070'; g.fillRect(0, 508, W, 3);
    g.save(); g.translate(30, 1760); g.scale(1, .7); g.fillStyle = '#fbf8f4'; g.beginPath(); g.arc(0, 0, 330, 0, TAU); g.fill(); g.strokeStyle = '#8a7a8a'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#d8ccd8'; g.beginPath(); g.arc(0, 0, 230, 0, TAU); g.fill(); g.stroke(); g.restore();
    softDot(q, 820, 420, 340, 'rgba(255,170,80,1)', .5);
  }
  if (kind === 'panic') {
    const bg = g.createRadialGradient(540, 700, 60, 540, 900, 1300); bg.addColorStop(0, '#2c2a7c'); bg.addColorStop(1, '#07061c'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  }
  if (kind === 'bokeh') {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a1222'); bg.addColorStop(1, '#120612'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) bokeh(g, q, r() * W, r() * H, 40 + r() * 110, ['#ffcf6a', '#ff7fc0', '#7fe0ff', '#ffa040'][i % 4], .1 + r() * .18);
  }
  if (kind === 'gold') {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#ffd98a'); bg.addColorStop(.55, '#ffb39a'); bg.addColorStop(1, '#ff8fb0'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) { const x = r() * W, y = r() * H, rr = 40 + r() * 120; g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.stroke(); }
    for (let i = 0; i < 9; i++) {                                   // stylized flowers in the corners
      const x = (i % 2 ? W - 60 : 60) + (r() - .5) * 200, y = r() * H;
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.fillStyle = 'rgba(255,240,246,.7)'; g.beginPath(); g.ellipse(x + Math.cos(a) * 34, y + Math.sin(a) * 34, 30, 18, a, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,210,90,.8)'; g.beginPath(); g.arc(x, y, 16, 0, TAU); g.fill();
    }
    softDot(q, 540, 900, 900, 'rgba(255,200,120,1)', .25);
  }
  return { c, e };
}

// ---------- the shots ----------
const tw = t => Math.floor(t * 12) / 12;                            // twos
const th = t => Math.floor(t * 8) / 8;                              // threes
function shake(t, a) { const k = Math.floor(t * 12); return [(hash(k * 1.7) - .5) * 2 * a, (hash(k * 2.9 + 4) - .5) * 2 * a]; }

function shotBill(b, t) {
  SET = SETS.warm; LIGHT = [-14, 12]; RIM = null;
  const z = 1 + .08 * seg(b, 0, 2.5);
  M = new DOMMatrix().translate(540, 1000).scale(z).translate(-540, -1000);
  plate(PL.top.c, 0, 0, PL.top.e);
  const bc = tw(b * B) / B;
  const x = lerp(1500, 560, eo(seg(bc, 0, .9))), rot = lerp(14, -3, eo(seg(bc, 0, .9)));
  withM(M.translate(x + 24, 1210).rotate(rot), () => fill(rrect(-280, -390, 560, 780, 30), '#2a1424', .35));
  withM(M.translate(x, 1180).rotate(rot), () => {
    const op = eio(seg(bc, 1.45, 1.95));
    billFolder(op, { sweep: bc > 1.95 ? lerp(-500, 700, seg(b, 1.95, 2.5)) : null });
  });
  // the waiter's sleeve and glove slide it in, then leave
  const hx = x + 230 + 900 * ei(seg(bc, 1.0, 1.5));
  sleeve([hx + 700, 900], [hx + 40, 820], 120, pal('#1c1c24', '#050508'));
  glove(hx, 820, 200, 1.6, 'open', 1);
}

function twoShot(b, t, act) {
  SET = act === 'a' ? SETS.night : SETS.warm;
  const bc = tw(t) / B, b8 = th(t) / B;
  const cy = act === 'b' ? 1500 * eio(seg(b, 19.6, 21.6)) : 0;
  const Z = act === 'b' ? zoomTo(540, 690, 1 + .15 * eio(seg(b, 20.9, 23))) : new DOMMatrix();
  M = Z.translate(0, cy * .5);
  plate(PL.city.c, 0, -1300, PL.city.e);
  // the Locca sign on the tower flickers on in the last shot
  const on = act === 'b' ? (b < 20.6 ? 0 : b < 21.0 ? [1, 0, 1, 0, 1, 1][Math.floor((b - 20.6) * 12 / 2 * 3) % 6] : 1) : 0;
  withM(M.translate(540, -60), () => neonSign(on, b));
  M = Z.translate(0, cy);
  // rain on the glass (on ones)
  for (let i = 0; i < 70; i++) {
    const x = 150 + hash(i * 3.3) * 780, sp = 1400 + 900 * hash(i * 7.1), y = ((hash(i * 5.7) * 3000 + t * sp) % 3000) - 1700 - cy;
    line(g => { g.moveTo(x, y); g.lineTo(x - 6, y + 70); }, 'rgba(200,220,255,.22)', 2);
  }
  for (let i = 0; i < 40; i++) { const x = 160 + hash(i * 9.1) * 760, y = -1600 + hash(i * 4.3) * 2700 + 30 * seg(t % 3, 0, 3); fill(ell(x, y, 6, 8), 'rgba(220,235,255,.45)'); fill(ell(x - 2, y - 3, 2, 2), '#ffffff'); }
  plate(PL.room, 0, -1700);
  if (act === 'b') { ctx.setTransform(M); const gr = ctx.createRadialGradient(540, 1200, 50, 540, 1100, 900); gr.addColorStop(0, 'rgba(255,170,90,.35)'); gr.addColorStop(1, 'rgba(255,120,60,0)'); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.fillRect(0, 300, W, 1100); ctx.globalCompositeOperation = 'source-over'; I(); }
  RIM = [0, -7];
  // the fox (left) and the girlfriend (right)
  const fo = { kind: 'fox', tx: 40, look: [.6, 0], mouth: 'smile', brow: 'happy' };
  const go = { kind: 'girl', tx: -40, look: [-.7, -.3], lid: .1, mouth: 'smile', blush: .8, brow: 'up', star: .45 + .15 * Math.sin(t * 9) };
  let gTilt = Math.sin(TAU * bc / 4) * 2.5, gShift = 0, jit = [0, 0];
  if (act === 'a') {
    if (b8 >= 4.2) { fo.look = [.3, .9]; }
    if (b8 >= 4.6) { fo.sweat = [{ x: -215, y: -170, s: back(seg(b8, 4.6, 4.9), 2.5) }]; fo.mouth = 'nervous'; fo.brow = 'worry'; }
    if (b8 >= 5.2) { fo.sweat.push({ x: -250, y: -60, s: .6 * back(seg(b8, 5.2, 5.45), 2.5) }); fo.droop = .6 * seg(b8, 5.2, 5.6); jit = shake(t, 3); }
  } else {
    fo.mouth = 'grin'; fo.look = [.7, .1];
    go.closed = true; go.blush = 1; gTilt = -9 * eo(seg(bc, 18, 18.6)); gShift = -30 * eo(seg(bc, 18, 18.6));
    if (bc >= 19.1) fo.closed = true;
  }
  const fM = M.translate(285 + jit[0], 870 + jit[1]).scale(.62), gM = M.translate(805 + gShift, 890).rotate(gTilt).scale(.58);
  const P = (m, x, y) => { const q = m.transformPoint(new DOMPoint(x, y)); return [q.x, q.y]; };
  LIGHT = [22, 8];
  withM(fM, () => { foxBust(); head(fo); });
  LIGHT = [-22, 8];
  withM(gM, () => { girlBust(); head(go); });
  plate(PL.table, 0, 1160);
  RIM = null;
  candle(540, 1300, 1, t);
  const hearts = (n, x0, y0) => { for (let i = 0; i < n; i++) { const u = ((bc / 2 + i / n) % 1); heart(x0 + 40 * Math.sin(TAU * (u + i * .3)), y0 - 360 * u, .5 * (1 - u * .4) * Math.min(1, u * 6)); } };
  const fur = pal(...FUR.girl, .45), jk = pal(...JACKET);
  if (act === 'a') {
    withM(M.translate(330, 1400).scale(.3).rotate(-6), () => billFolder(1));
    wineGlass(475, 1275, .55, 0, .45); wineGlass(650, 1285, .55, 0, .4);
    LIGHT = [22, 8];
    sleeve(P(fM, -250, 340), [205, 1362], 56, jk); sleeve(P(fM, 250, 340), [450, 1370], 56, jk);
    glove(210, 1374, 80, .64, 'open', -1); glove(455, 1382, 100, .64, 'open', 1);
    // she rests her chin on her clasped hands
    LIGHT = [-22, 8];
    for (const [sh, el, hd] of [[[-225, 370], [-150, 540], [-20, 240]], [[225, 370], [170, 540], [70, 250]]]) { sleeve(P(gM, ...sh), P(gM, ...el), 42, fur, false); sleeve(P(gM, ...el), P(gM, ...hd), 42, fur, false); }
    withM(gM, () => { glove(-20, 236, -10, .95, 'chin', 1); glove(70, 246, 10, .95, 'chin', -1); });
    hearts(3, 900, 640);
  } else {
    const u = eo(seg(bc, 18.3, 19)), fgx = lerp(445, 527, u), ggx = lerp(645, 553, u), gyy = 1100 - 40 * u;
    LIGHT = [22, 8];
    sleeve(P(fM, -250, 340), [205, 1362], 56, jk); glove(210, 1374, 80, .64, 'open', -1);
    sleeve(P(fM, 250, 340), [fgx - 30, gyy + 40], 56, jk);
    wineGlass(fgx, gyy, .62, 8 * u, .35); glove(fgx - 6, gyy + 4, -20, .58, 'hold', 1);
    LIGHT = [-22, 8];
    sleeve(P(gM, -225, 370), P(gM, -230, 560), 42, fur, false); sleeve(P(gM, -230, 560), [ggx + 26, gyy + 44], 42, fur, false);
    wineGlass(ggx, gyy, .62, -8 * u, .32); glove(ggx + 6, gyy + 4, 20, .52, 'hold', -1);
    sleeve(P(gM, 225, 370), [905, 1365], 42, fur, false); glove(900, 1380, 100, .52, 'open', 1);
    if (bc >= 19 && bc < 19.8) { const k = seg(bc, 19, 19.8); star(540, gyy - 120, 90 * Math.sin(Math.PI * k)); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; star(540 + Math.cos(a) * 140 * k, gyy - 120 + Math.sin(a) * 140 * k, 26 * (1 - k)); } }
    hearts(4, 540, 720);
  }
}

function shotPanic(b, t) {
  SET = SETS.blue; LIGHT = [16, -12]; RIM = [8, -4];
  const bc = tw(t) / B, b8 = th(t) / B;
  const sh = bc < 6.5 ? shake(t, 12) : shake(t, 3);
  M = new DOMMatrix().translate(sh[0], sh[1]);
  plate(PL.panic.c, 0, 0, PL.panic.e);
  for (let i = 0; i < 26; i++) {                                    // falling gloom streaks (on ones)
    const x = hash(i * 2.3) * W, y = ((hash(i * 7.7) * 2400 + t * 900) % 2400) - 400;
    ctx.setTransform(M); const gr = ctx.createLinearGradient(0, y, 0, y + 500); gr.addColorStop(0, 'rgba(90,80,200,0)'); gr.addColorStop(1, 'rgba(90,80,200,.45)'); ctx.fillStyle = gr; ctx.fillRect(x, y, 8 + 10 * hash(i), 500); I();
  }
  const sweat = [{ x: -225, y: lerp(-210, -40, seg(bc, 6.2, 9.6)), s: 1.4 }];
  for (let k = 0; k < 8; k++) {                                     // little drops fly off every half beat
    const b0 = 6.3 + k * .45, u = seg(bc, b0, b0 + .6); if (u <= 0 || u >= 1) continue;
    const s = k % 2 ? 1 : -1; sweat.push({ x: s * (240 + 220 * u), y: -150 - 160 * Math.sin(Math.PI * u) + 200 * u * u, s: .55 * (1 - u * .5), r: s * 40 * u });
  }
  const o = { kind: 'fox', tx: 0, ps: .3, brow: 'worry', mouth: 'wobble', gloom: true, droop: 1, sweat, look: [0, bc > 7.6 ? .9 : 0] };
  withM(M.translate(540, 780).scale(1.12), () => { foxBust(); head(o); });
  // the empty wallet, and the moth that flies out of it
  if (bc >= 7.1) {
    const up = eo(seg(bc, 7.1, 7.6)), wy = lerp(2100, 1380, up);
    const wo = eio(seg(bc, 8, 8.3)), half = 221 * (1 + wo);
    withM(M.translate(540, wy).scale(1.3), () => wallet(wo));
    const jk = pal(...JACKET);
    sleeve([100, 2100], [540 - half - 20, wy + 60], 120, jk); sleeve([980, 2100], [540 + half + 20, wy + 60], 120, jk);
    glove(540 - half + 10, wy + 30, -60, 1.1, 'hold', 1); glove(540 + half - 10, wy + 30, 60, 1.1, 'hold', -1);
    if (bc >= 8.15) {
      const u = seg(b8, 8.2, 10), mx = lerp(760, 360, u) + 70 * Math.sin(u * 9), my = lerp(wy - 40, 520, eo(u)) + 40 * Math.sin(u * 13);
      moth(mx, my, 2.2, b8 * Math.PI * 1.5);
      for (let i = 0; i < 6; i++) { const k = seg(bc, 8.2, 9); if (k > 0 && k < 1) fill(ell(760 + (i - 2.5) * 50 * k * 2, wy - 60 - 120 * k * hash(i), 22 * (1 - k), 22 * (1 - k)), 'rgba(170,170,200,.7)'); }
    }
  }
}

function shotImpact(b, t) {
  const f = Math.floor((b - 10.5) * 12);                            // two frames
  const bgc = f === 0 ? '#ffffff' : '#000000', fg = f === 0 ? '#000000' : '#ffffff';
  M = new DOMMatrix(); ctx.fillStyle = bgc; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 48; i++) { const a = i / 48 * TAU + hash(i) * .1, r0 = 260 + 120 * hash(i * 3); fill(poly([[540 + Math.cos(a) * r0, 760 + Math.sin(a) * r0], [540 + Math.cos(a + .03) * 2000, 760 + Math.sin(a + .03) * 2000], [540 + Math.cos(a - .03) * 2000, 760 + Math.sin(a - .03) * 2000]]), fg); }
  SET = SETS.blue; MONO = fg;
  withM(M.translate(540, 780).scale(1.12), () => { foxBust(); head({ kind: 'fox', tx: 0, droop: 0, brow: 'up' }); });
  MONO = null;
}

function shotEyes(b, t) {
  SET = SETS.gold; LIGHT = [16, -12]; RIM = [0, 8];
  const b8 = th(t) / B, u = seg(b8, 10.67, 10.92);
  M = new DOMMatrix();
  plate(PL.gold.c, 0, 0, PL.gold.e);
  withM(M.translate(540, 1000).scale(3.0), () => head({ kind: 'fox', tx: 0, ps: lerp(.3, 1.2, u) < .5 ? .3 : lerp(.3, 1.2, u), brow: 'up', mouth: 'o', star: u > .5 ? 1 + .3 * Math.sin(b * 20) : 0 }));
  // the phone glows up from his pocket
  ctx.setTransform(1, 0, 0, 1, 0, 0); const gr = ctx.createLinearGradient(0, H, 0, H - 700); gr.addColorStop(0, 'rgba(255,110,20,.85)'); gr.addColorStop(1, 'rgba(255,110,20,0)'); ctx.fillStyle = gr; ctx.fillRect(0, H - 700, W, 700);
  gctx.fillStyle = gr; gctx.fillRect(0, H - 700, W, 700);
}

const COINS = [0, 1, 2, 3, 4, 5].map(i => ({ b0: 12.2 + i * .18, dx: (hash(i * 4.1) - .5) * 260, h: 160 + 160 * hash(i * 2.2) }));
function shotPhone(b, t) {
  SET = SETS.warm; LIGHT = [-14, 12]; RIM = null;
  const bc = tw(t) / B;
  M = new DOMMatrix();
  plate(PL.bokeh.c, 0, 0, PL.bokeh.e);
  const billM = M.translate(540, 1530).rotate(4).scale(.62);
  withM(billM, () => billFolder(1, { check: bc >= 13.5 ? seg(b, 13.5, 13.85) : 0, sweep: bc >= 13.6 ? lerp(-500, 700, seg(b, 13.6, 14.3)) : null }));
  const press = bc >= 12 && bc < 12.25 ? .9 : 1;
  const pts = Math.round(lerp(105, 5, eio(seg(bc, 12.2, 13.4))));
  const phM = M.translate(560, 680).rotate(-5).scale(1.05);
  withM(phM, () => phone({ points: pts, button: true, press, ripple: seg(b, 12, 12.7), done: bc >= 13.4 ? seg(b, 13.4, 13.7) : 0 }));
  // the thumb comes in and taps the pay button
  const tu = eio(seg(bc, 11.3, 12)), lift = bc >= 12.3 ? eo(seg(bc, 12.3, 12.8)) : 0;
  const tp = phM.transformPoint(new DOMPoint(lerp(-260, 10, tu) - 160 * lift, lerp(420, 230, tu) + 180 * lift));
  const jk = pal(...JACKET);
  sleeve([-60, 1500], [tp.x - 70, tp.y + 90], 110, jk);
  glove(tp.x - 30, tp.y + 40, -60, 1.0, 'open', 1);
  // coins pour out of the phone into the bill
  const from = phM.transformPoint(new DOMPoint(0, 190)), to = billM.transformPoint(new DOMPoint(0, 230));
  for (const [i, c] of COINS.entries()) {
    const u = seg(bc, c.b0, c.b0 + .7); if (u <= 0 || u >= 1) continue;
    const x = lerp(from.x, to.x + c.dx, u), y = lerp(from.y, to.y - 40, u) - c.h * Math.sin(Math.PI * u);
    coin(x, y, .9, bc * 5 + i);
    if (u > .85) star(to.x + c.dx, to.y - 40, 50 * Math.sin(Math.PI * seg(u, .85, 1)));
  }
  if (bc >= 13.5 && bc < 14.2) { const k = seg(bc, 13.5, 14.2); line(ell(to.x + 30, to.y, 120 + 300 * k, 120 + 300 * k), `rgba(255,200,120,${1 - k})`, 8); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; star(to.x + 30 + Math.cos(a) * 260 * k, to.y + Math.sin(a) * 260 * k, 34 * (1 - k)); } }
}

function shotRelief(b, t) {
  SET = SETS.gold; LIGHT = [16, -12]; RIM = [-8, -6];
  const bc = tw(t) / B, b8 = th(t) / B;
  const z = 1 + .05 * seg(b, 14.5, 18);
  M = new DOMMatrix().translate(540, 900).scale(z).translate(-540, -900);
  plate(PL.gold.c, 0, 0, PL.gold.e);
  for (let i = 0; i < 14; i++) { const k = Math.floor(b8 * 2 + i * 7) % 5; if (k < 2) star(hash(i * 3.3) * W, hash(i * 5.1) * 1600, 30 + 30 * hash(i), '#ffffff', .8); }
  for (let i = 0; i < 10; i++) { const u = (t * .25 + hash(i * 2.1)) % 1; line(ell(hash(i * 6.3) * W, H - u * 2200, 26 + 30 * hash(i), 26 + 30 * hash(i)), 'rgba(255,255,255,.6)', 3); }
  const o = { kind: 'fox', tx: 0, brow: 'happy', mouth: 'smile', closed: true, droop: -.12, blush: .5 };
  if (b8 < 15.6) { o.mouth = b8 > 14.7 ? 'sigh' : 'smile'; o.sweat = [{ x: -225, y: -40 - 60 * seg(bc, 14.5, 15.2), s: 1.4 * (1 - seg(bc, 14.5, 15.2)) }].filter(d => d.s > .05); }
  if (bc >= 15.8) { o.tx = 40; o.blush = 1; }
  if (b8 >= 16.9 && b8 < 17.6) o.mouth = 'kiss';
  if (b8 >= 17.6) { o.closed = false; o.look = [.6, -.2]; o.mouth = 'grin'; o.star = .8; }
  o.band = bc >= 15 && bc < 16.6 ? lerp(-400, 700, seg(b, 15, 16.6)) : null;
  withM(M.translate(540, 820).scale(1.05).rotate(bc >= 15.8 ? 6 : 0), () => { foxBust(); head(o); });
  // the sigh: a little cloud drifts away
  if (bc >= 14.7 && bc < 16) { const k = seg(bc, 14.7, 16); withM(M.translate(560 - 260 * k, 960 - 60 * k).scale(.6 + .5 * k), () => cel(g => { for (const [x, y, r] of [[-40, 0, 40], [10, -20, 50], [60, 0, 38]]) ell(x, y, r, r)(g); }, pal('#ffffff', '#c89a8a'), { shade: false, rim: false, lw: 2 })); }
  // steam where the sweat was
  if (bc >= 14.6 && bc < 15.6) for (let i = 0; i < 3; i++) { const k = seg(bc, 14.6 + i * .15, 15.6); line(g => { const x = 290 + i * 30, y = 620 - 160 * k; g.moveTo(x, y); g.quadraticCurveTo(x + 24, y - 30, x, y - 60); g.quadraticCurveTo(x - 24, y - 90, x, y - 120); }, `rgba(255,255,255,${.8 * (1 - k)})`, 6); }
  // the phone comes up to his cheek; a kiss; a heart for Locca
  if (bc >= 15.8) {
    const u = eo(seg(bc, 15.8, 16.3)), px = lerp(820, 790, u), py = lerp(2200, 980, u);
    const jk = pal(...JACKET);
    sleeve([1100, 1900], [px + 60, py + 200], 120, jk);
    withM(M.translate(px, py).rotate(14).scale(.5), () => phone({ points: 5, button: false }));
    glove(px + 40, py + 170, -100, 1.0, 'hold', -1);
    if (bc >= 17.1) { const k = seg(bc, 17.1, 18); heart(px - 20, py - 260 - 260 * eo(k), 1.6 * back(seg(bc, 17.1, 17.4), 2.4), OR, .9); }
  }
}

// ---------- one frame ----------
function render(t) {
  const b = t / B;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  gctx.setTransform(1, 0, 0, 1, 0, 0); gctx.fillStyle = '#000'; gctx.fillRect(0, 0, W, H);
  MONO = null;
  if (b < 2.5) shotBill(b, t);
  else if (b < 6) twoShot(b, t, 'a');
  else if (b < 10.5) shotPanic(Math.min(b, 10), Math.min(t, 10 * B));      // b10–10.5: a held frame in silence
  else if (b < 10.5 + 2 / 12) shotImpact(b, t);
  else if (b < 11) shotEyes(b, t);
  else if (b < 14.5) shotPhone(b, t);
  else if (b < 18) shotRelief(b, t);
  else twoShot(b, t, 'b');
  M = new DOMMatrix();
  if (post) {
    const over = { power: clamp(t / .25, .02, 1), track: b >= 6 && b < 6.4 ? .9 * (1 - seg(b, 6, 6.4)) : 0 };
    if (b >= 6 && b < 10.5) Object.assign(over, { sat: .9 });
    if (b >= 20.6) Object.assign(over, { bloom: .95, halo: .26 });
    post.render(scn, glw, Math.round(t * 24), null, over);
  }
}

// ---------- sound and cue events (for score.py) ----------
const EV = [];
const at = (b, type, extra = {}) => EV.push({ t: +(b * B).toFixed(4), type, ...extra });
for (let i = 0; i < NB; i++) at(i, 'beat', { i });
at(0, 'slide'); at(.9, 'land'); at(1.45, 'open'); at(2, 'total');
at(4.6, 'sweat'); at(5.2, 'sweat'); at(6, 'hit'); [6.3, 6.75, 7.2, 7.65, 8.1, 8.55, 9.0, 9.45].forEach(b => at(b, 'drop'));
at(7.1, 'wallet'); at(8, 'walletopen'); at(8.15, 'moth'); at(10, 'silence'); at(10.5, 'impact'); at(10.67, 'sparkle');
at(11.3, 'reach'); at(12, 'tap'); COINS.forEach(c => { at(c.b0, 'coin'); at(c.b0 + .7, 'coinland'); }); at(13.5, 'check');
at(14.6, 'steam'); at(14.7, 'sigh'); at(15.8, 'phoneup'); at(16.9, 'kiss'); at(17.1, 'heart'); at(19, 'clink'); at(19.6, 'crane'); at(20.6, 'neon'); at(21, 'logo');

window.DUR = DUR; window.EV = EV; window.render = render;

PL.city = paintCity(); PL.room = paintRoom(); PL.table = paintTable();
PL.top = paintFlat('top'); PL.panic = paintFlat('panic'); PL.bokeh = paintFlat('bokeh'); PL.gold = paintFlat('gold');
LOGO = new Image(); LOGO.src = 'assets/locca-logo.png';
Promise.all([new Promise(r => { LOGO.onload = r; }).then(() => { LOGOW = tint(LOGO, '#fff2dc'); LOGOB = tint(LOGO, '#ff7a1a'); }), document.fonts.load('italic 800 100px BSC')]).then(() => { render(0); window.READY = true; });
