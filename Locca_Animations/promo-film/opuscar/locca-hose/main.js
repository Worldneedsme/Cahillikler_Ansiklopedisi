// Locca Jazz — a wordless 1930s rubber-hose cartoon (11.7 s, 9:16).
// Greyscale world, brand orange only on the fox, the coins and the logo. Characters on twos, camera on ones.
import { clamp, lerp, seg, eo, ei, eio, ss, back, mulberry, hash, vnoise, TAU } from '/core/lib.js';

const W = 1080, H = 1920;
const BPM = 144, B = 60 / BPM, NB = 28, DUR = NB * B;          // one beat = 10 frames
const cv = document.getElementById('c'), out = cv.getContext('2d');
const scn = document.createElement('canvas'); scn.width = W; scn.height = H;
const ctx = scn.getContext('2d');

// warm paper greys (6 steps) + character white + ink + the brand orange
const G = ['#2f2a25', '#4b443c', '#6b635a', '#8c847a', '#ada69b', '#cbc5ba'];
const WHITE = '#f6f2ea', INK = '#141110', OR = '#ff5b00', ORL = '#ff8a3d', CREAM = '#f7e9d6', BROWN = '#3a2418';
const LW = 6;                                                   // ink width in screen pixels, at any zoom

// ---------- matrices and the one world → screen function ----------
let M = new DOMMatrix();
const withM = (m, fn) => { const keep = M; M = m; fn(); M = keep; };
function shape(path, fill, lw = LW, stroke = INK) {
  ctx.setTransform(M); ctx.beginPath(); path(ctx); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = stroke; ctx.stroke(); }
}
const scaleOf = () => Math.hypot(M.a, M.b);
// a rubber-hose tube from a to b with one smooth bend (width in local units)
function tube(a, b, bend, w, color = INK) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const c = [mx - dy / L * bend, my + dx / L * bend];
  shape(g => { g.moveTo(...a); g.quadraticCurveTo(...c, ...b); }, null, w * scaleOf(), color);
}
const ell = (x, y, rx, ry, rot = 0) => g => g.ellipse(x, y, rx, ry, rot, 0, TAU);

// ---------- camera ----------
const X1 = 0, X2 = 1250, X3 = 2500;                              // shop centres
const FOX_OFF = 120;
function camera(b) {
  // keyframes: [beat, x, y, zoom]
  const K = [[0, X1 + FOX_OFF - 44, -560, 5], [1, X1 + FOX_OFF - 44, -560, 5], [3, X1 - 20, -560, 1], [7, X1 - 20, -560, 1], [10, X2 - 20, -560, 1], [12, X2 - 20, -560, 1], [13, X3 - 20, -560, 1],
    [14, X3 - 20, -560, 1], [14.6, X3 + 50, -560, 1.25], [16, X3 + 50, -560, 1.25], [16.8, X3 + 20, -600, 0.82], [22, X3 + 20, -600, 0.82], [23, X3 - 60, -600, 1.05], [24.4, X3 - 60, -560, 1.55], [28, X3 - 60, -560, 1.55]];
  let i = 0; while (i < K.length - 2 && b >= K[i + 1][0]) i++;
  const [b0, x0, y0, z0] = K[i], [b1, x1, y1, z1] = K[i + 1], u = eio(seg(b, b0, b1));
  // zoom interpolates in log space so a push feels even
  return { x: lerp(x0, x1, u), y: lerp(y0, y1, u), z: Math.exp(lerp(Math.log(z0), Math.log(z1), u)) };
}
const camM = c => new DOMMatrix().translate(W / 2, H / 2).scale(c.z).translate(-c.x, -c.y);
const toScreen = (c, x, y) => [(x - c.x) * c.z + W / 2, (y - c.y) * c.z + H / 2];

// ---------- timing helpers ----------
const twos = t => Math.floor(t * 12) / 12;                       // characters move on twos
const beatsOf = t => t / B;
const STOP1 = [13, 14], STOP2 = [22, 23];
const stopped = b => (b >= STOP1[0] && b < STOP1[1]) || (b >= STOP2[0] && b < STOP2[1]);
// breathing: an extreme on every beat; frozen during band stops (held at the stop's first frame)
function breath(b) {
  const bb = b >= STOP2[0] && b < STOP2[1] ? STOP2[0] : b >= STOP1[0] && b < STOP1[1] ? STOP1[0] : b;
  const peak = b >= 16 && b < 22 ? 3 : 1;
  return Math.cos(TAU * bb) * 0.012 * peak;
}

// ---------- painted backgrounds (cached once) ----------
const BG = {};
function paintFacade(kind) {
  const c = document.createElement('canvas'), S = 1.5, w = 1150, h = 1420; c.width = w * S; c.height = (h + 480) * S;
  const g = c.getContext('2d'); g.scale(S, S); g.translate(w / 2, h);            // origin: facade bottom centre
  const r = mulberry(kind * 31 + 7);
  const wash = (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); for (let i = 0; i < 26; i++) { g.globalAlpha = 0.05; g.fillStyle = r() > .5 ? '#000' : '#fff'; g.beginPath(); g.ellipse(x + r() * ww, y + r() * hh, 40 + r() * 120, 30 + r() * 80, r() * 3, 0, TAU); g.fill(); } g.globalAlpha = 1; };
  const line = (col, lw, pts) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(...pts[0]); pts.slice(1).forEach(p => g.lineTo(...p)); g.stroke(); };
  // wall: clapboard or brick, mid greys
  wash(-575, -1420, 1150, 1420, kind === 1 ? G[3] : G[2]);
  if (kind === 1) for (let y = -1400; y < 0; y += 44) for (let x = -575 + ((y / 44) % 2) * 45; x < 575; x += 90) { g.strokeStyle = 'rgba(40,34,30,.35)'; g.lineWidth = 3; g.strokeRect(x, y, 90, 44); }
  else for (let y = -1400; y < 0; y += 56) line('rgba(30,26,22,.35)', 4, [[-575, y], [575, y]]);
  // cornice
  wash(-575, -1420, 1150, 70, G[1]); line(INK, 5, [[-575, -1350], [575, -1350]]);
  // sign board with the shop's icon
  wash(-300, -1260, 600, 200, G[4]); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(-300, -1260, 600, 200); g.strokeRect(-285, -1245, 570, 170);
  g.save(); g.translate(0, -1160); g.fillStyle = G[1]; g.strokeStyle = INK; g.lineWidth = 6;
  if (kind === 0) { g.beginPath(); g.ellipse(0, 10, 110, 50, 0, 0, Math.PI); g.closePath(); g.fill(); g.stroke(); for (const sx of [-50, 0, 50]) { g.beginPath(); g.moveTo(sx, -30); g.bezierCurveTo(sx + 20, -55, sx - 20, -75, sx, -100); g.stroke(); } }
  if (kind === 1) {                                                // plate with fork and knife
    g.fillStyle = G[4]; g.beginPath(); g.ellipse(0, 0, 70, 70, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.ellipse(0, 0, 46, 46, 0, 0, TAU); g.stroke();
    g.fillStyle = G[1]; for (const sx of [-128, -112, -96]) g.fillRect(sx - 4, -70, 8, 50); g.fillRect(-122, -24, 36, 14); g.fillRect(-110, -14, 12, 84);
    g.beginPath(); g.moveTo(100, -70); g.quadraticCurveTo(136, -30, 116, 10); g.lineTo(116, 70); g.lineTo(104, 70); g.closePath(); g.fill(); }
  if (kind === 2) { g.beginPath(); g.moveTo(-80, -60); g.lineTo(80, -60); g.lineTo(60, 60); g.lineTo(-60, 60); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(95, 0, 35, -1.3, 1.3); g.stroke(); }
  g.restore();
  // awning: scalloped grey stripes
  for (let i = 0; i < 18; i++) { g.fillStyle = i % 2 ? G[4] : G[1]; g.fillRect(-540 + i * 60, -1020, 60, 110); g.beginPath(); g.arc(-510 + i * 60, -910, 30, 0, Math.PI); g.fill(); }
  line(INK, 6, [[-540, -1020], [540, -1020]]);
  // door (left) with panels, plate and knob
  wash(-420, -700, 260, 700, G[1]); g.strokeStyle = INK; g.lineWidth = 7; g.strokeRect(-420, -700, 260, 700);
  for (const [px_, py] of [[-395, -670], [-395, -330]]) { g.lineWidth = 5; g.strokeRect(px_, py, 210, 290); }
  // window (right) with a shelf
  wash(20, -820, 450, 520, G[5]); g.lineWidth = 7; g.strokeRect(20, -820, 450, 520); line(INK, 6, [[20, -420], [470, -420]]);
  g.globalAlpha = .25; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(60, -800); g.lineTo(140, -800); g.lineTo(60, -680); g.fill(); g.globalAlpha = 1;
  // kerbside: checker sidewalk
  for (let y = 0; y < 480; y += 80) for (let x = -575; x < 575; x += 80) { g.fillStyle = ((x + 575) / 80 + y / 80) % 2 ? G[4] : G[3]; g.fillRect(x, y, 80, 80); }
  return { c, S, w, h };
}
function paintSky() {
  const c = document.createElement('canvas'); c.width = 900; c.height = 1600; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 1600); gr.addColorStop(0, G[4]); gr.addColorStop(1, G[5]); g.fillStyle = gr; g.fillRect(0, 0, 900, 1600);
  const r = mulberry(3);
  for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(255,255,255,.25)'; const x = r() * 900, y = 200 + r() * 900; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + k * 50, y - (k % 2) * 20, 70, 40, 0, 0, TAU); g.fill(); } }
  return c;
}

function drawWorld(b, c) {
  const br = breath(b);
  // sky (screen-fixed, slight parallax)
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(BG.sky, -c.x * 0.05 % 200 - 200, -80, W + 400, H * 0.9);
  // street floor beyond the facades
  withM(camM(c), () => {
    shape(g => g.rect(-1500, 0, 6000, 900), G[3], 0);
    [X1, X2, X3].forEach((X, k) => {
      const f = BG['f' + k];
      // breathe about the floor line; the peak squashes the whole painting
      const m = M.translate(X, 0).scale(1 - br * 0.6, 1 + br);
      ctx.setTransform(m); ctx.drawImage(f.c, -f.w / 2, -f.h, f.w, f.h + 480);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    shape(g => g.rect(-1500, 470, 6000, 430), G[1], 0);                 // kerb and road
    shape(g => { g.moveTo(-1500, 470); g.lineTo(4500, 470); }, null, LW);
  });
}

// ---------- the anatomy kit ----------
function pieEye(x, y, rx, ry, look = [0, 0], lid = 0) {
  shape(ell(x, y, rx, ry), WHITE);
  const px_ = x + look[0] * rx * 0.3, py = y + look[1] * ry * 0.22, prx = rx * 0.64, pry = ry * 0.74;
  ctx.setTransform(M); ctx.beginPath(); ctx.moveTo(px_, py); ctx.ellipse(px_, py, prx, pry, 0, -0.32, TAU - 1.0); ctx.closePath();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = INK; ctx.fill();
  if (lid > 0) {
    ctx.save(); ctx.setTransform(M); ctx.beginPath(); ctx.ellipse(x, y, rx + 2, ry + 2, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = OR; ctx.fillRect(x - rx - 4, y - ry - 4, rx * 2 + 8, (ry * 2 + 8) * lid); ctx.restore();
    shape(g => { g.moveTo(x - rx, y - ry + ry * 2 * lid); g.quadraticCurveTo(x, y - ry + ry * 2 * lid + 10, x + rx, y - ry + ry * 2 * lid); }, null, LW);
  }
}
function glove(x, y, ang, s = 1) {
  const m = M.translate(x, y).rotate(ang * 180 / Math.PI).scale(s);
  withM(m, () => {
    const parts = [ell(0, 0, 34, 30), ell(30, -22, 14, 20, -0.4), ell(40, 0, 14, 20), ell(30, 22, 14, 20, 0.4), ell(-6, -32, 12, 18, 0.7)];
    const cuff = g => { g.moveTo(-30, -22); g.lineTo(-62, -36); g.lineTo(-62, 36); g.lineTo(-30, 22); g.closePath(); };
    // stroke every part thick, then fill all white: only the union keeps an outline
    parts.forEach(p => shape(p, null, LW * 2)); shape(cuff, null, LW * 2);
    parts.forEach(p => shape(p, WHITE, 0)); shape(cuff, WHITE, 0);
    shape(g => { g.moveTo(-46, -28); g.lineTo(-46, 28); }, null, LW * 0.6);
    for (const k of [-10, 0, 10]) shape(g => { g.moveTo(-10, k); g.lineTo(14, k * 1.3); }, null, LW * 0.5, G[3]);
  });
}
function shoe(x, y, flip = 1) { shape(ell(x + 16 * flip, y - 26, 70, 38), INK, LW); shape(ell(x + 40 * flip, y - 42, 14, 8, -0.3), WHITE, 0); }

// ---------- the fox ----------
// Drawn after the user's reference: a big round head, wide ears with dark rims and cream insides, a cream muzzle
// that fluffs out into cheek tufts with whiskers, big touching eyes with shiny pupils under happy arched brows,
// a small pear body with a big egg belly, thin striped arms, big open four-finger gloves and big white feet.
// st: { x, sx, sy, bob, lookX, lookY, lid, wink, mouth, armL, armR, legL, legR, tail, tilt, card }
function limb(a, b, bend, w) { tube(a, b, bend, w + 2 * LW / scaleOf()); tube(a, b, bend, w, OR); }
function stripes(a, b, bend, w, ts) {                             // fur stripes across a limb
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const c = [mx - dy / L * bend, my + dx / L * bend];
  for (const t of ts) {
    const q = (k) => (1 - t) ** 2 * a[k] + 2 * (1 - t) * t * c[k] + t * t * b[k];
    const tg = [2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]), 2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1])], tl = Math.hypot(...tg) || 1;
    const n = [-tg[1] / tl * w * 0.5, tg[0] / tl * w * 0.5], p = [q(0), q(1)];
    shape(g => { g.moveTo(p[0] - n[0], p[1] - n[1]); g.lineTo(p[0] + n[0] * 0.4, p[1] + n[1] * 0.4); }, null, LW * 1.1, BROWN);
  }
}
// a big open glove: wide palm, four spread fingers, a thumb on the upper side (flip 1 = right hand, -1 = left)
function openGlove(x, y, ang, flip = 1, s = 1) {
  withM(M.translate(x, y).rotate(ang * 180 / Math.PI).scale(s), () => {
    const parts = [ell(-6, 0, 18, 22), ell(28, 0, 40, 36)];
    for (const a of [-0.78, -0.26, 0.26, 0.78]) parts.push(ell(28 + Math.cos(a) * 56, Math.sin(a) * 56, 28, 14, a));
    const ta = -1.45 * flip; parts.push(ell(24 + Math.cos(ta) * 44, Math.sin(ta) * 44, 22, 13, ta));
    // stroke every part thick, then fill all white: only the union keeps an outline
    parts.forEach(p => shape(p, null, LW * 2 / s)); parts.forEach(p => shape(p, WHITE, 0));
    shape(g => { g.moveTo(-4, -18); g.quadraticCurveTo(4, 0, -4, 18); }, null, LW * 0.6 / s);
  });
}
function paw(x, y, flip = 1) {
  const cx = x + 22 * flip;
  shape(ell(cx, y - 40, 82, 42), WHITE);
  for (const k of [0, 1]) { const px_ = cx + flip * (30 + 24 * k); shape(g => { g.moveTo(px_, y - 80); g.quadraticCurveTo(px_ + flip * 8, y - 66, px_ + flip * 2, y - 52); }, null, LW * 0.8); }
}
function roundEye(x, y, rx, ry, look = [0, 0], lid = 0) {
  shape(ell(x, y, rx, ry), WHITE);
  const px_ = x + (0.3 + look[0] * 0.7) * rx * 0.3, py = y + 8 + look[1] * ry * 0.2;
  shape(ell(px_, py, rx * 0.64, ry * 0.64), INK, 0);
  shape(ell(px_ + rx * 0.2, py - ry * 0.22, rx * 0.2, ry * 0.17), WHITE, 0);
  if (lid > 0) {
    ctx.save(); ctx.setTransform(M); ctx.beginPath(); ctx.ellipse(x, y, rx + 2, ry + 2, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = OR; ctx.fillRect(x - rx - 4, y - ry - 4, rx * 2 + 8, (ry * 2 + 8) * lid); ctx.restore();
    shape(g => { g.moveTo(x - rx, y - ry + ry * 2 * lid); g.quadraticCurveTo(x, y - ry + ry * 2 * lid + 12, x + rx, y - ry + ry * 2 * lid); }, null, LW);
    shape(ell(x, y, rx, ry), null, LW);
  }
}
// the cream muzzle: right half as quadratic segments from the nose down to the chin, mirrored for the left
const MUZZLE = [[0, 22], [[70, 54], [150, 32]], [[215, 12], [300, -4]], [[250, 26], [252, 36]], [[290, 46], [318, 62]], [[262, 76], [252, 86]],
  [[285, 104], [292, 124]], [[235, 128], [205, 132]], [[180, 168], [90, 190]], [[44, 214], [0, 202]]];
function muzzle(tx, nx) {
  const P = ([x, y], k) => [x + (k ? tx * 0.7 : nx), y];
  return g => {
    g.moveTo(...P(MUZZLE[0], 0));
    for (let i = 1; i < MUZZLE.length; i++) g.quadraticCurveTo(...P(MUZZLE[i][0], 1), ...P(MUZZLE[i][1], i < MUZZLE.length - 1));
    for (let i = MUZZLE.length - 1; i >= 1; i--) {                // back up the left side, mirrored
      const c = MUZZLE[i][0], e = i > 1 ? MUZZLE[i - 1][1] : MUZZLE[0];
      g.quadraticCurveTo(...P([-c[0], c[1]], 1), ...P([-e[0], e[1]], i > 1));
    }
    g.closePath();
  };
}
function fox(st) {
  const base = M.translate(st.x, 0).scale(st.s ?? 1);
  withM(base.scale(st.sx ?? 1, st.sy ?? 1), () => {
    const bob = st.bob ?? 0;
    // bushy tail behind: orange, a dark ring, cream tip
    withM(M.translate(-50, -130 + bob).rotate(st.tail ?? 0).scale(0.9), () => {
      const tail = g => { g.moveTo(0, 0); g.bezierCurveTo(-60, 40, -230, 50, -310, -30); g.bezierCurveTo(-350, -80, -320, -170, -250, -140); g.bezierCurveTo(-170, -100, -70, -50, 0, -40); g.closePath(); };
      shape(tail, OR);
      ctx.save(); ctx.setTransform(M); ctx.beginPath(); tail(ctx); ctx.clip();
      ctx.fillStyle = BROWN; ctx.beginPath(); ctx.ellipse(-280, -70, 95, 110, 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = CREAM; ctx.beginPath(); ctx.ellipse(-310, -80, 70, 100, 0.5, 0, TAU); ctx.fill(); ctx.restore();
      shape(tail, null, LW);
    });
    // short legs, big white feet
    const hips = [[-42, -100 + bob], [42, -100 + bob]], feet = [st.legL ?? [-80, 0], st.legR ?? [80, 0]];
    limb(hips[0], [feet[0][0], feet[0][1] - 36], 8, 30); limb(hips[1], [feet[1][0], feet[1][1] - 36], -8, 30);
    paw(feet[0][0], feet[0][1], -1); paw(feet[1][0], feet[1][1], 1);
    // thin striped arms from the sides, behind the body (the gloves come after the head so a raised hand reads in front)
    const sh = [[-62, -280 + bob], [62, -280 + bob]];
    const hL = st.armL ?? [-210, -200 + bob], hR = st.armR ?? [240, -140 + bob];
    const bL = st.bendL ?? -30, bR = st.bendR ?? 30;
    limb(sh[0], hL, bL, 24); limb(sh[1], hR, bR, 24);
    stripes(sh[0], hL, bL, 24, [0.62, 0.74]); stripes(sh[1], hR, bR, 24, [0.62, 0.74]);
    // small pear body, big cream egg belly
    shape(g => { g.moveTo(0, -340 + bob); g.bezierCurveTo(62, -340 + bob, 112, -200 + bob, 102, -130 + bob); g.bezierCurveTo(96, -66 + bob, -96, -66 + bob, -102, -130 + bob); g.bezierCurveTo(-112, -200 + bob, -62, -340 + bob, 0, -340 + bob); }, OR);
    shape(ell(16, -188 + bob, 62, 92), WHITE);
    // head
    const hy = -520 + bob + (st.headY ?? 0);
    const tx = 60 * clamp(0.3 + 0.5 * (st.lookX ?? 0), -0.8, 0.8);  // the face turns toward where it looks
    withM(M.translate(0, hy).rotate(st.tilt ?? 0), () => {
      // wide ears: cream inside, dark rim on the outer edge and tip
      for (const side of [-1, 1]) {
        const ear = g => { g.moveTo(side * 235, -60); g.quadraticCurveTo(side * 278, -220, side * 265, -378); g.quadraticCurveTo(side * 160, -300, side * 70, -200); g.closePath(); };
        shape(ear, OR);
        ctx.save(); ctx.setTransform(M); ctx.beginPath(); ear(ctx); ctx.clip();
        ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(side * 175, -118); ctx.quadraticCurveTo(side * 206, -220, side * 222, -306); ctx.quadraticCurveTo(side * 150, -256, side * 104, -196); ctx.closePath(); ctx.fill();
        ctx.fillStyle = BROWN; ctx.beginPath(); ctx.moveTo(side * 330, -430); ctx.lineTo(side * 300, -40); ctx.lineTo(side * 222, -60); ctx.quadraticCurveTo(side * 250, -220, side * 236, -330); ctx.lineTo(side * 150, -300); ctx.closePath(); ctx.fill();
        ctx.restore();
        shape(ear, null, LW);
      }
      // big round skull with a spiky forehead tuft
      shape(g => { g.moveTo(-238, 30); g.lineTo(-266, 2); g.lineTo(-240, -10); g.lineTo(-262, -42); g.lineTo(-234, -52); g.bezierCurveTo(-232, -130, -150, -205, -24, -212); g.lineTo(-10, -244); g.lineTo(4, -214); g.lineTo(24, -238); g.lineTo(32, -210); g.bezierCurveTo(160, -200, 240, -130, 238, -52); g.lineTo(264, -42); g.lineTo(242, -10); g.lineTo(268, 2); g.lineTo(240, 30); g.bezierCurveTo(232, 120, 130, 165, 0, 165); g.bezierCurveTo(-130, 165, -232, 120, -238, 30); }, OR);
      const nx = tx * 1.4;
      shape(muzzle(tx, nx), CREAM);
      // whiskers
      for (const side of [-1, 1]) for (const k of [0, 1]) shape(g => { g.moveTo(side * 210 + tx * 0.7, 48 + k * 30); g.lineTo(side * 345 + tx * 0.7, 26 + k * 74); }, null, LW * 0.5);
      // happy arched brows, high above the eyes (never angled down toward the nose)
      for (const side of [-1, 1]) {
        const ex = side * 62 + tx;
        shape(g => { g.moveTo(ex - 44, -118); g.quadraticCurveTo(ex - 2, -172, ex + 44, -124); }, null, LW * 1.5);
      }
      // big shiny eyes, almost touching; the wink is a happy closed arc
      const look = [st.lookX ?? 0, st.lookY ?? 0];
      roundEye(-62 + tx, -40, 54, 64, look, st.lid ?? 0);
      if (st.wink) shape(g => { g.moveTo(14 + tx, -30); g.quadraticCurveTo(62 + tx, -86, 110 + tx, -30); }, null, LW * 1.8);
      else roundEye(62 + tx, -40, 54, 64, look, st.lid ?? 0);
      // round black nose with a shine
      shape(ell(nx, 42, 30, 21), INK, 0); shape(ell(nx - 8, 35, 10, 6, -0.3), WHITE, 0);
      // mouth: a warm smile with a dimple and a little chin, an open grin, or a small "o"
      if (st.mouth === 'o') shape(ell(nx - 8, 102, 16, 20), INK, 0);
      else if (st.mouth === 'grin') {
        shape(g => { g.moveTo(nx - 76, 74); g.quadraticCurveTo(nx - 12, 168, nx + 52, 76); g.quadraticCurveTo(nx - 12, 100, nx - 76, 74); }, INK, LW);
        shape(ell(nx - 12, 120, 22, 10), G[2], 0);
      } else shape(g => { g.moveTo(nx - 76, 78); g.quadraticCurveTo(nx - 12, 134, nx + 48, 80); }, null, LW);
      if (st.mouth !== 'o') {
        shape(g => { g.moveTo(nx - 90, 64); g.quadraticCurveTo(nx - 88, 80, nx - 72, 84); }, null, LW * 0.8);
        shape(g => { g.moveTo(nx - 42, 142); g.quadraticCurveTo(nx - 14, 154, nx + 14, 142); }, null, LW * 0.7);
      }
    });
    if (st.card) st.card(hR);
    openGlove(hL[0], hL[1], Math.atan2(hL[1] - sh[0][1], hL[0] - sh[0][0]), -1, 1.45);
    openGlove(hR[0], hR[1], Math.atan2(hR[1] - sh[1][1], hR[0] - sh[1][0]), 1, 1.45);
  });
}

// ---------- coin, cup, loaf, card ----------
function coin(x, y, s, sq = 1, look = 0, legs = 0) {
  withM(M.translate(x, y).scale(s * (2 - sq), s * sq), () => {
    tube([-24, -40], [-30 + legs * 10, 0], 6, 12); tube([24, -40], [30 - legs * 10, 0], -6, 12);
    shape(ell(-34 + legs * 10, -10, 26, 13), INK, 0); shape(ell(34 - legs * 10, -10, 26, 13), INK, 0);
    shape(ell(0, -110, 76, 76), OR); shape(ell(0, -110, 58, 58), null, LW * 0.6, '#b33f00');
    shape(ell(-22, -130, 14, 8, -0.5), ORL, 0);
    pieEye(-22, -120, 14, 20, [look, 0]); pieEye(22, -120, 14, 20, [look, 0]);
    shape(g => { g.moveTo(-22, -84); g.quadraticCurveTo(0, -66, 22, -84); }, null, LW * 0.8);
  });
}
function cup(x, y, s, rot = 0, look = 0, sq = 1, mood = 1) {
  withM(M.translate(x, y).rotate(rot * 180 / Math.PI).scale(s * (2 - sq), s * sq), () => {
    // steam carries the mood
    if (mood) for (const k of [-30, 0, 30]) shape(g => { g.moveTo(k, -150); g.bezierCurveTo(k + 22, -175, k - 22, -200, k, -228); }, null, LW * 0.8, G[2]);
    shape(g => g.arc(78, -70, 30, -1.4, 1.4), null, LW * 2.4);
    shape(g => g.arc(78, -70, 30, -1.4, 1.4), null, LW * 1.0, WHITE);
    shape(ell(0, -4, 110, 18), G[4]);
    shape(g => { g.moveTo(-80, -140); g.lineTo(80, -140); g.lineTo(58, -14); g.lineTo(-58, -14); g.closePath(); }, WHITE);
    shape(ell(0, -140, 80, 14), G[2]);
    pieEye(-24, -90, 16, 22, [look, 0]); pieEye(24, -90, 16, 22, [look, 0]);
    shape(g => { g.moveTo(-22, -52); g.quadraticCurveTo(0, -34, 22, -52); }, null, LW * 0.8);
  });
}
// a restaurant serving dome on its plate (the dishes dance in the window)
function dish(x, y, s, sq = 1) {
  withM(M.translate(x, y).scale(s * (2 - sq), s * sq), () => {
    shape(ell(0, 0, 100, 16), G[4]);
    shape(g => { g.moveTo(-82, -4); g.bezierCurveTo(-84, -112, 84, -112, 82, -4); g.closePath(); }, G[5]);
    shape(ell(0, -92, 14, 10), G[3]);
    shape(g => { g.moveTo(-50, -40); g.quadraticCurveTo(-44, -70, -20, -80); }, null, LW * 0.8, WHITE);
  });
}
function numberText(str, x, y, size, fill = OR) {
  // Shrikhand, heavy ink outline (~14 % of cap height), ink drop shadow down-right; drawn in screen space
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = `${size}px Shrikhand`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.16; ctx.strokeStyle = INK;
  ctx.fillStyle = INK; ctx.fillText(str, x + size * 0.07, y + size * 0.09); ctx.strokeText(str, x + size * 0.07, y + size * 0.09);
  ctx.strokeText(str, x, y); ctx.fillStyle = fill; ctx.fillText(str, x, y);
}
// the Loccard: front = coin + total, back = 8 cup slots
function card(hand, opts) {
  const { value, flip, stamped, bump = 1, scale = 1 } = opts;
  const side = Math.cos(flip * Math.PI);                          // 1 front, -1 back
  withM(M.translate(hand[0] + 20, hand[1] - 120).scale(Math.abs(side) * scale * bump, scale * bump), () => {
    shape(g => g.roundRect(-150, -95, 300, 190, 22), CREAM);
    if (side > 0) {
      shape(g => g.roundRect(-150, -95, 300, 46, [22, 22, 0, 0]), OR, LW * 0.7);
      shape(ell(-92, 20, 34, 34), OR); shape(ell(-92, 20, 24, 24), null, LW * 0.5, '#b33f00');
      const p = M.transformPoint(new DOMPoint(40, 22));
      numberText(String(value), p.x, p.y, 92 * scaleOf() * 0.62);
    } else {
      for (let i = 0; i < 8; i++) {
        const cx = -105 + (i % 4) * 70, cy = -38 + Math.floor(i / 4) * 78;
        shape(ell(cx, cy, 27, 27), WHITE, LW * 0.7);
        const on = i < 7 || stamped;
        if (on) shape(g => { g.moveTo(cx - 15, cy - 12); g.lineTo(cx + 15, cy - 12); g.lineTo(cx + 10, cy + 13); g.lineTo(cx - 10, cy + 13); g.closePath(); g.moveTo(cx + 15, cy - 6); g.arc(cx + 18, cy, 7, -1.4, 1.4); }, INK, 0);
        else shape(ell(cx, cy, 20, 20), null, LW * 0.5, G[3]);
      }
    }
  });
}

// ---------- the story ----------
const FOX = [X1 + FOX_OFF, X2 + FOX_OFF, X3 - 60];
const DOOR = k => [[X1, X2, X3][k] - 290, -330];
function foxState(b, t) {
  const tc = twos(t), bc = beatsOf(tc);
  const st = { x: FOX[0], bob: 0, lookX: 0, lid: 0, mouth: 'smile', tail: 6 * Math.sin(TAU * bc / 2) };
  // idle breathing on the beat
  const br = breath(bc); st.sx = 1 - br; st.sy = 1 + br * 1.6;
  if (bc < 0.5) st.lid = 0;
  else if (bc < 0.75) st.lid = 1;                                 // the first blink, in close-up
  // strut segments: one step per beat
  const strut = (b0, b1, x0, x1) => {
    if (bc < b0 || bc >= b1) return false;
    const u = seg(bc, b0, b1), step = (bc - b0) * (b1 - b0 <= 1 ? 4 : 1);
    st.x = lerp(x0, x1, eio(u)); st.bob = -18 * Math.abs(Math.sin(Math.PI * step));
    const ph = Math.sin(Math.PI * step);
    st.legL = [-70 + 40 * ph, -40 * Math.max(0, ph)]; st.legR = [70 + 40 * ph, -40 * Math.max(0, -ph)];
    st.armL = [-210 - 20 * ph, -200]; st.armR = [240 + 20 * ph, -140]; st.tail = 14 * ph; st.lookX = 0.6;
    return true;
  };
  if (!strut(7, 10, FOX[0], FOX[1]) && !strut(12, 13, FOX[1], FOX[2])) {
    st.x = bc < 10 ? FOX[0] : bc < 13 ? FOX[1] : FOX[2];
  }
  // taps: anticipation squash, the left arm stretches to the door plate, snaps back
  for (const [k, tb] of [[0, 3], [1, 10]]) {
    if (bc >= tb - 0.4 && bc < tb) { const u = seg(bc, tb - 0.4, tb); st.sy *= 1 - 0.14 * u; st.sx *= 1 + 0.08 * u; st.mouth = 'o'; }
    if (bc >= tb && bc < tb + 1) {
      const u = bc < tb + 0.4 ? eo(seg(bc, tb, tb + 0.4)) : 1 - ei(seg(bc, tb + 0.6, tb + 1));
      const [dx, dy] = DOOR(k); st.armL = [lerp(-210, dx - st.x + 40, u), lerp(-200, dy + 6, u)]; st.bendL = -60 * (1 - u); st.lookX = -1; st.mouth = 'grin';
    }
  }
  if ((bc >= 4 && bc < 7) || (bc >= 10.6 && bc < 12)) { st.lookX = 0.4; st.mouth = 'grin'; }
  // band stop 1: frozen, then looks at the cup
  if (bc >= 13 && bc < 14) { st.lookX = 1; st.mouth = 'o'; }
  // card up for the stamp
  if (bc >= 14 && bc < 16.2) { st.armR = [290, -280]; st.lookX = 0.5; st.lookY = 0.6; st.mouth = bc > 15.5 ? 'grin' : 'smile'; }
  // the dance: kicks on the beat, card held high
  if (bc >= 16.2 && bc < 23) {
    const d = bc >= 22 ? 22 : bc, k = Math.sin(TAU * d / 2), u = Math.abs(Math.sin(Math.PI * d));
    st.legL = [-80 - 60 * Math.max(0, k), -70 * Math.max(0, k)]; st.legR = [80 + 60 * Math.max(0, -k), -70 * Math.max(0, -k)];
    st.armR = [390, -560 - 30 * u]; st.armL = [-230 - 40 * k, -380 + 60 * k]; st.bob = -26 * u; st.tail = 22 * k; st.mouth = 'grin'; st.tilt = 0.08 * k;
    st.sy = 1 + 0.06 * u; st.sx = 1 - 0.04 * u;
  }
  // the ending: turns to us, reaches up for the iris, winks
  if (bc >= 23) {
    st.lookX = 0; st.mouth = 'smile';
    const u = eo(seg(bc, 23.4, 24));
    st.armR = [lerp(390, 330, u), lerp(-560, -930, u)]; st.bendR = 40;
    if (bc >= 24.7) st.wink = true;
  }
  return st;
}
const coinHop = (b, b0, from, to, k) => {
  // out of the door with a hop, a held beat, then a dive into the card
  if (b < b0 || b > b0 + 2.2) return null;
  if (b < b0 + 0.6) { const u = seg(b, b0, b0 + 0.6); return { x: lerp(from[0], from[0] + 150 + k * 70, u), y: -260 * Math.sin(Math.PI * u), s: 1, sq: u > 0.9 ? 0.75 : 1 + 0.1 * Math.sin(Math.PI * u) }; }
  if (b < b0 + 1.4) return { x: from[0] + 150 + k * 70, y: 0, s: 1, sq: 1 + 0.06 * Math.cos(TAU * b), look: 1 };
  const u = ei(seg(b, b0 + 1.4, b0 + 2.2));
  return { x: lerp(from[0] + 150 + k * 70, to[0], u), y: lerp(0, to[1], u) - 220 * Math.sin(Math.PI * u), s: lerp(1, 0.25, u), sq: 1 };
};
function totals(b) {
  if (b < 6.2) return 0;
  if (b < 11.8) return 45;
  if (b < 12.6) return Math.round(lerp(45, 105, seg(b, 11.8, 12.6)));
  return 105;
}

// ---------- film damage and the gate ----------
function composite(t, b) {
  const f = Math.floor(t * 24), r = mulberry(f * 97 + 13);
  const weave = [1.2 * (vnoise(t * 3) - 0.5) * 2, 1.2 * (vnoise(t * 3 + 40) - 0.5) * 2 + (f % 53 === 0 ? 4 : 0)];
  const flick = 1 + (vnoise(t * 18) - 0.5) * 0.08;
  out.setTransform(1, 0, 0, 1, 0, 0); out.fillStyle = '#000'; out.fillRect(0, 0, W, H);
  out.save();
  out.beginPath(); out.roundRect(16, 16, W - 32, H - 32, 34); out.clip();
  out.filter = `contrast(1.13) brightness(${flick.toFixed(3)}) blur(0.35px)`;
  out.drawImage(scn, weave[0], weave[1]);
  out.filter = 'none';
  // vignette
  const v = out.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.62);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); out.fillStyle = v; out.fillRect(0, 0, W, H);
  // scratches (persist a few frames), dust, an occasional hair
  const sr = mulberry(Math.floor(f / 7) * 11 + 3);
  for (let i = 0; i < Math.floor(sr() * 3); i++) { out.strokeStyle = sr() > 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.22)'; out.lineWidth = 1 + sr() * 1.5; const x = sr() * W + (f % 7) * 2; out.beginPath(); out.moveTo(x, 0); out.lineTo(x + sr() * 6, H); out.stroke(); }
  for (let i = 0; i < 3 + Math.floor(r() * 6); i++) { out.fillStyle = r() > 0.6 ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.6)'; out.beginPath(); out.ellipse(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3, 0, 0, TAU); out.fill(); }
  if (f % 37 < 3) { out.strokeStyle = 'rgba(0,0,0,.4)'; out.lineWidth = 1.5; out.beginPath(); const x = r() * W, y = r() * H; out.moveTo(x, y); out.bezierCurveTo(x + 30, y + 20, x - 20, y + 50, x + 10, y + 80); out.stroke(); }
  out.restore();
  // soft inner shadow on the gate edge
  out.strokeStyle = 'rgba(0,0,0,.6)'; out.lineWidth = 18; out.beginPath(); out.roundRect(16, 16, W - 32, H - 32, 34); out.stroke();
}

// ---------- the iris (a physical object the fox can grab) ----------
function iris(c, b, foxX) {
  let cx, cy, r;
  if (b < 3) {                                                     // opens on one eye
    [cx, cy] = toScreen(c, FOX[0] - 44, -560);
    r = 300 * eo(seg(b, 0, 0.35)) + 1300 * eio(seg(b, 1, 2.8));        // the eye first, the blink, then the world
  } else if (b >= 23.8) {                                          // pulled shut on the face
    [cx, cy] = toScreen(c, foxX + 15, -545);
    r = lerp(1300, 0, eio(seg(b, 24, 25.5)));
    if (b < 24) r = 1300;
  } else return null;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, Math.max(0, r), 0, TAU, true); ctx.fill('evenodd');
  return { cx, cy, r };
}

// ---------- logo card ----------
let LOGO = null;
function logoCard(b) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const u = seg(b, 25.6, 26.1), pop = back(u, 2.4), hop = b > 26.2 ? Math.abs(Math.sin(Math.PI * (b - 26.2))) : 0;
  const sq = b > 26.2 && (b % 1) < 0.12 ? 0.9 : 1;
  // period plate: double white rule, dot-and-ring corners
  const pw = 860, ph = 520, px_ = (W - pw) / 2, py = (H - ph) / 2;
  if (u > 0) {
    ctx.globalAlpha = 1; ctx.fillStyle = '#0b0a09'; ctx.fillRect(px_, py, pw, ph);
    ctx.strokeStyle = WHITE; ctx.lineWidth = 6; ctx.strokeRect(px_ + 24, py + 24, pw - 48, ph - 48); ctx.lineWidth = 2; ctx.strokeRect(px_ + 40, py + 40, pw - 80, ph - 80);
    for (const [x, y] of [[px_ + 24, py + 24], [px_ + pw - 24, py + 24], [px_ + 24, py + ph - 24], [px_ + pw - 24, py + ph - 24]]) { ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.lineWidth = 3; ctx.stroke(); }
  }
  if (LOGO && u > 0) {
    const w = 640 * pop, h = w * LOGO.height / LOGO.width;
    ctx.save(); ctx.translate(W / 2, H / 2 + h / 2 - 30 * hop); ctx.scale(2 - sq, sq);
    ctx.drawImage(LOGO, -w / 2, -h, w, h); ctx.restore();
  }
}

// ---------- one frame ----------
function render(t) {
  const b = beatsOf(t), tc = twos(t), bc = beatsOf(tc), c = camera(b);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  if (b >= 25.5) { logoCard(b); composite(t, b); return; }
  drawWorld(bc, c);
  // boil: three drawings cycling at 12 fps
  const boil = Math.floor(t * 12) % 3, bj = [[0, 0], [1.2, -0.8], [-0.9, 1.0]][boil];
  M = camM(c).translate(bj[0] / c.z, bj[1] / c.z);

  // door 1 / 2 swing open (squash–stretch panel) after the tap
  [[0, 3.4, 7], [1, 10.4, 12.6]].forEach(([k, o, cl]) => {
    if (bc < o || bc > cl) return;
    const X = [X1, X2][k], u = eo(seg(bc, o, o + 0.3)) - ei(seg(bc, cl - 0.4, cl));
    shape(g => g.rect(X - 420, -700, 260, 700), G[0], LW);
    shape(g => g.rect(X - 420, -700, 260 * (1 - 0.8 * u), 700), G[1], LW);
  });
  // serving domes bob in the restaurant window (and dance at the peak)
  for (let i = 0; i < 3; i++) {
    const pk = bc >= 16 && bc < 22 ? 3 : 1, bb = stopped(bc) ? Math.floor(bc) : bc;
    dish(X2 + 120 + i * 120, -440 - 14 * pk * Math.abs(Math.sin(Math.PI * (bb + i / 3))), 0.62, 1 + 0.06 * pk * Math.cos(TAU * (bb + i / 3)));
  }
  // the café cup: in the window, glances during the band stop, hops to the card, stamps, lands on the street
  const cupWin = [X3 + 385, -440];
  let cupPos = { x: cupWin[0], y: cupWin[1], rot: 0, look: 0, sq: 1 + breath(bc) * 3 };
  if (bc >= 13 && bc < 14) cupPos.look = bc < 13.33 ? -1 : bc < 13.66 ? 1 : -1;
  const fs = foxState(b, t);
  const cardHand = [fs.x + (fs.armR ? fs.armR[0] : 240), fs.armR ? fs.armR[1] : -140];
  const slot8 = [cardHand[0] + 20 + 105 * 1.4, cardHand[1] - 120 + 40 * 1.4];
  if (bc >= 14.4 && bc < 16) {
    const u = seg(bc, 14.4, 15.5);
    if (bc < 15.5) cupPos = { x: lerp(cupWin[0], slot8[0], eio(u)), y: lerp(cupWin[1], slot8[1] - 90, eio(u)) - 380 * Math.sin(Math.PI * u), rot: Math.PI * eio(seg(bc, 14.8, 15.3)), look: -1, sq: 1 };
    else { const v = seg(bc, 15.5, 16); cupPos = { x: lerp(slot8[0], fs.x + 330, v), y: lerp(slot8[1] - 70, 0, ei(v)) - 260 * Math.sin(Math.PI * v), rot: Math.PI * (1 - eo(v)), look: 0, sq: bc < 15.6 ? 0.7 : 1 }; }
  }
  if (bc >= 16) {
    const d = stopped(bc) ? 22 : bc, u = Math.abs(Math.sin(Math.PI * d));
    cupPos = { x: fs.x + 330 + 30 * Math.sin(Math.PI * d / 2), y: -60 * u, rot: 0.15 * Math.sin(Math.PI * d), look: 0, sq: 1 - 0.1 * u };
  }
  // fox and the card
  const stamped = bc >= 15.5;
  const cardOpts = { value: totals(bc), flip: seg(bc, 14, 14.4), stamped, bump: 1 + 0.12 * Math.exp(-((bc - 6.2) ** 2) * 30) + 0.12 * Math.exp(-((bc - 12.6) ** 2) * 30) + 0.15 * Math.exp(-((bc - 15.55) ** 2) * 40), scale: bc >= 14 && bc < 16.2 ? 1.4 : 1 };
  if (bc >= 16.2) { cardOpts.flip = 1 - seg(bc, 16.2, 16.6); }
  fs.card = hand => card(hand, cardOpts);
  fox(fs);
  // cup drawn after the fox so it lands on the card
  cup(cupPos.x, cupPos.y, 1, cupPos.rot, cupPos.look, cupPos.sq, bc < 14.4 || bc >= 15.5);
  // coins from the doors into the card
  [[0, 4.1], [1, 10.5], [1, 10.75]].forEach(([k, b0], j) => {
    const p = coinHop(bc, b0, [[X1, X2][k] - 290, 0], [cardHand[0] + 20, cardHand[1] - 120], j);
    if (p) coin(p.x, p.y, p.s, p.sq, p.look ?? 0, 0);
  });
  // at the peak the coins hop back out of the card and dance
  if (bc >= 16.4 && bc < 23) {
    for (let i = 0; i < 3; i++) {
      const d = stopped(bc) ? 22 : bc, u = Math.abs(Math.sin(Math.PI * (d + i / 3)));
      const x = fs.x + [-500, -350, 560][i], y = -150 * u;
      coin(x, y, 0.9, 1 - 0.18 * u, Math.sin(d) > 0 ? 1 : -1, Math.sin(Math.PI * d));
    }
  }
  // numbers: "+45" / "+60" pop over the coins
  [[4.3, 6.4, 0, '+45'], [10.7, 12.6, 1, '+60']].forEach(([b0, b1, k, s]) => {
    if (bc < b0 || bc >= b1) return;
    const [sx, sy] = toScreen(c, [X1, X2][k] - 250, -790);
    numberText(s, sx, sy - 40 * eo(seg(bc, b0, b0 + 0.5)), 170 * back(seg(bc, b0, b0 + 0.35), 2.2));
  });
  // the hand pulls the iris shut
  const ir = iris(c, b, fs.x);
  if (ir && b >= 23.8) {
    const a = -0.85, hx = ir.cx + Math.cos(a) * ir.r, hy = ir.cy + Math.sin(a) * ir.r;
    M = new DOMMatrix(); openGlove(hx, hy, a + Math.PI, 1, 1.45 * c.z);
  }
  composite(t, b);
}

// ---------- sound and cue events (for score.py) ----------
const EV = [];
const at = (b, type, extra = {}) => EV.push({ t: +(b * B).toFixed(4), type, ...extra });
for (let i = 0; i < NB; i++) at(i, 'beat', { i });
at(0.5, 'blink'); at(2.6, 'squash'); at(3, 'stretch'); at(3.4, 'tap'); at(3.4, 'door'); at(4.1, 'coinhop'); at(4.3, 'plus'); at(5.5, 'dive'); at(6.2, 'cardin');
[7, 8, 9].forEach(b => at(b, 'step')); at(9.6, 'squash'); at(10, 'stretch'); at(10.4, 'tap'); at(10.4, 'door');
at(10.5, 'coinhop'); at(10.75, 'coinhop'); at(10.7, 'plus'); at(11.9, 'dive'); at(12.15, 'dive'); at(12.6, 'cardin');
[12, 12.25, 12.5, 12.75].forEach(b => at(b, 'step', { quick: 1 }));
at(13, 'stop'); [13.0, 13.33, 13.66].forEach(b => at(b, 'glance')); at(14, 'flip'); at(14.4, 'cuphop'); at(14.8, 'whistle'); at(15.5, 'stamp');
at(16, 'crash'); at(16.2, 'flip'); at(22, 'stop'); at(23.4, 'reach'); at(24, 'iris'); at(24.7, 'wink'); at(25.6, 'logo'); [26.2, 27.2].forEach(b => at(b, 'bounce'));

window.DUR = DUR; window.EV = EV; window.render = render;

// paint the backgrounds, load the logo and the font, then ready
BG.sky = paintSky(); [0, 1, 2].forEach(k => { BG['f' + k] = paintFacade(k); });
LOGO = new Image(); LOGO.src = 'assets/locca-logo.png';
Promise.all([new Promise(r => { LOGO.onload = r; }), document.fonts.load('100px Shrikhand')]).then(() => { render(0); window.READY = true; });
