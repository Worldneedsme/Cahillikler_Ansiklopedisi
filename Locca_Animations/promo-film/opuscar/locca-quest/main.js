// Locca Quest — a wordless 16-bit pixel RPG film (11.7 s, 9:16).
// Indexed framebuffer at 180×320, scaled ×6. Everything (sprites, UI, numbers, logo) lives in the framebuffer.
import { clamp, lerp, seg, eo, ei, eio, mulberry } from '/core/lib.js';

// ---------- format and timing ----------
const W = 180, H = 320, S = 6;
const BPM = 144, B = 60 / BPM;             // one beat = 10 frames at 24 fps
const NB = 28;
const DUR = NB * B;                        // 11.667 s
const bt = t => t / B;                     // seconds → beats

// ---------- palette (index → RGB) ----------
const PAL = [
  '#000000', '#14101e', '#2b2d42', '#5a6075', '#9aa3b5', '#f7f1e8', '#e8d9c0', '#ff5b00', '#ff8a3d', '#c23d00',
  '#4a2a1e', '#7a4632', '#5fb3e6', '#a6dcf2', '#2f7fb5', '#5bb04a', '#2f6b3a', '#d9c7a4', '#b39e7a', '#ece6da',
  '#c9c0ae', '#d6334c', '#8f1f33', '#ffc93c', '#d99a1e', '#3ec8e0', '#c98a4b', '#ff7aa0', '#c8553d', '#8e3a2a',
  '#b3a58c', '#7d715d', '#55607a', '#f7f1e8', '#ffc93c', '#ff8a3d', '#4a2a1e',
].map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const K = 1, NAVY = 2, GREY = 3, SILVER = 4, CREAM = 5, SAND = 6, OR = 7, ORL = 8, ORD = 9, BRD = 10, BR = 11,
  SKY = 12, SKYL = 13, SEA = 14, GRN = 15, GRND = 16, PAV = 17, PAVD = 18, WALL = 19, WALLD = 20, RED = 21, REDD = 22,
  YEL = 23, YELD = 24, TEAL = 25, BREAD = 26, PINK = 27, ROOF = 28, ROOFD = 29, STONE = 30, STONED = 31, DUSK = 32,
  CREAM_P = 33, YEL_P = 34, ORL_P = 35, BRD_P = 36;    // protected duplicates: never touched by dusk or two-tone
const PROTECTED = new Set([OR, CREAM_P, YEL_P, ORL_P, BRD_P]);
const LUM = PAL.map(([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255);
// one step darker along each ramp (night falls by table, never by alpha)
const DARK = [0, K, K, NAVY, GREY, SAND, SILVER, OR, ORD, BRD, K, BRD, NAVY, SKY, NAVY, GRND, DUSK, PAVD, BR, WALLD,
  GREY, REDD, BRD, YELD, ORD, SEA, BR, RED, ROOFD, BRD, STONED, GREY, NAVY, CREAM_P, YEL_P, ORL_P, BRD_P];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

// ---------- framebuffer ----------
const fb = new Uint8Array(W * H);
const px = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < W && y < H && c) fb[y * W + x] = c; };
const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
const ditherRect = (x, y, w, h, a, b, f) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, bayer(x + i, y + j) < f(j / Math.max(1, h - 1)) ? b : a); };
const ellipse = (cx, cy, rx, ry, c, put = px) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) put(x, y, c);
  }
};
const tri = (a, b, c2, col, put = px) => {
  const minX = Math.floor(Math.min(a[0], b[0], c2[0])), maxX = Math.ceil(Math.max(a[0], b[0], c2[0]));
  const minY = Math.floor(Math.min(a[1], b[1], c2[1])), maxY = Math.ceil(Math.max(a[1], b[1], c2[1]));
  const e = (p, q, x, y) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const X = x + 0.5, Y = y + 0.5, w0 = e(b, c2, X, Y), w1 = e(c2, a, X, Y), w2 = e(a, b, X, Y);
    if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) put(x, y, col);
  }
};

// ---------- sprite buffers: draw, outline, blit (flip, integer scale, squash) ----------
function spriteBuf(w, h) { return { w, h, d: new Uint8Array(w * h) }; }
const sput = s => (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < s.w && y < s.h && c) s.d[y * s.w + x] = c; };
function outline(s, c = K) {
  const o = s.d.slice();
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    if (s.d[y * s.w + x]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < s.w && Y < s.h && s.d[Y * s.w + X] && s.d[Y * s.w + X] !== c) { o[y * s.w + x] = c; break; }
    }
  }
  s.d = o;
}
// blit with the sprite's anchor (ax, ay) placed at screen (x, y)
function blit(s, x, y, { ax = 0, ay = 0, flip = false, scale = 1, sx = 1, sy = 1 } = {}) {
  const w = Math.round(s.w * scale * sx), h = Math.round(s.h * scale * sy);
  const ox = Math.round(x - ax * scale * sx), oy = Math.round(y - ay * scale * sy);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let u = Math.floor(i / (scale * sx)), v = Math.floor(j / (scale * sy));
    if (flip) u = s.w - 1 - u;
    const c = s.d[v * s.w + u]; if (c) px(ox + i, oy + j, c);
  }
}
// ASCII icon → sprite (map chars to palette indices)
function icon(rows, map) {
  const s = spriteBuf(rows[0].length, rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (map[ch]) s.d[y * s.w + x] = map[ch]; }));
  return s;
}

// ---------- icons ----------
const COIN = icon(['..kkk..', '.kOOOk.', 'kOyOOdk', 'kOyOOdk', 'kOOOOdk', '.kOddk.', '..kkk..'], { k: K, O: OR, y: YEL_P, d: ORD });
const CUP = (body, line) => icon(['..s..s...', '.s..s....', '..s..s...', 'kkkkkkk..', 'kwwwwwkkk', 'kwwwwwk.k', 'kwwwwwkkk', '.kwwwk...', '..kkk....'], { s: SILVER, k: line, w: body });
const CUP_SIGN = CUP(CREAM, K), CUP_STAMP = CUP(K, K), CUP_ITEM = CUP(CREAM_P, K);
const BOWL = icon(['..s..s..s.', '.s..s..s..', '..s..s..s.', 'kkkkkkkkkk', 'kRRRRRRRRk', '.kRRrRRRk.', '..kkkkkk..'], { s: SILVER, k: K, R: RED, r: CREAM });
const PLATE = icon(['k.k..kkkkk..k', 'k.k.kwwwwwk.k', 'kkk.kwRRRwk.k', '.k..kwRRRwk.k', '.k..kwwwwwk.k', '.k...kkkkk..k'], { k: K, w: CREAM, R: RED });
const STAMP = icon(['....kkkk....', '...kbbbbk...', '...kbBbbk...', '....kbbk....', '....kbbk....', '....kbbk....', '..kkkkkkkk..', '.kbbbbbbbbk.', 'kkkkkkkkkkkk', 'kKKKKKKKKKKk', 'kkkkkkkkkkkk'], { k: K, b: BR, B: SAND, K: NAVY });
const SPARK = icon(['..y..', '..y..', 'yywyy', '..y..', '..y..'], { y: YEL_P, w: CREAM_P });
const BANG = icon(['.kkkkk.', 'kwwkwwk', 'kwwkwwk', 'kwwkwwk', 'kwwwwwk', 'kwwkwwk', '.kkkkk.', '..kk...', '..k....'], { k: K, w: CREAM_P });
const QR = icon(['kkkkkkk', 'kwkwwwk', 'kkwkwkk', 'kwwkkwk', 'kkwwkwk', 'kwkwwkk', 'kkkkkkk'], { k: K, w: CREAM });
const PHONE = icon(['kkkk', 'kssk', 'kssk', 'kssk', 'kkkk'], { k: K, s: TEAL });

// ---------- pixel digits (original 5×7) ----------
const GLYPH = {
  0: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
};
function number(str, x, y, c, scale = 1, ink = K) {
  const s = spriteBuf(str.length * 6 + 2, 9);
  [...str].forEach((ch, i) => GLYPH[ch].forEach((r, gy) => [...r].forEach((p, gx) => { if (p === '#') s.d[(gy + 1) * s.w + i * 6 + gx + 1] = c; })));
  // 8-neighbour ink outline
  const o = s.d.slice();
  for (let yy = 0; yy < s.h; yy++) for (let xx = 0; xx < s.w; xx++) if (!s.d[yy * s.w + xx])
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = xx + dx, Y = yy + dy; if (X >= 0 && Y >= 0 && X < s.w && Y < s.h && s.d[Y * s.w + X] === c) o[yy * s.w + xx] = ink; }
  s.d = o;
  blit(s, x, y, { scale });
  return s.w * scale;
}

// ---------- the fox (rig drawn per pose, outlined, blitted) ----------
// pose: { step: 0..3 walk frame or -1, run, arm: 'down'|'phone'|'up'|'wave', wave, blink, wink, scan }
function fox(pose) {
  const s = spriteBuf(48, 46), put = sput(s), X = 24, Y = 42;  // feet at (24, 42)
  const P = (x, y) => [X + x, Y + y];
  const st = pose.step ?? -1, run = pose.run ? 1 : 0;
  const bob = st >= 0 && st % 2 === 1 ? -1 : 0;
  const lean = run ? 1 : 0;
  const legF = st < 0 ? 0 : [2, 0, -2, 0][st] * (1 + run), legB = st < 0 ? 0 : [-2, 0, 2, 0][st] * (1 + run);
  const liftF = st === 0 ? 1 : 0, liftB = st === 2 ? 1 : 0;
  // tail (sways with the walk), cream tip
  const sway = st < 0 ? 0 : [0, 1, 0, -1][st];
  for (let i = 0; i < 9; i++) ellipse(...P(-6 - i * 1.0, -10 - i * 0.75 + bob + (i > 4 ? sway * 0.4 * (i - 4) : 0)), 3.6 - i * 0.12, 3.2 - i * 0.1, i < 6 ? OR : CREAM, put);
  ellipse(...P(-14, -17 + bob + sway * 2), 2.6, 2.4, CREAM, put);
  // back leg
  rect2(put, X - 4 + legB, Y - 7 - liftB, 2, 7, OR); rect2(put, X - 4 + legB, Y - 3 - liftB, 2, 3, BRD);
  // body + belly
  ellipse(...P(0 + lean, -9 + bob), 6.5, 4.8, OR, put);
  ellipse(...P(2.2 + lean, -9.6 + bob), 3.4, 3.0, CREAM, put);
  // front leg
  rect2(put, X + 3 + legF + lean, Y - 7 - liftF, 2, 7, OR); rect2(put, X + 3 + legF + lean, Y - 3 - liftF, 2, 3, BRD);
  // head
  const hx = 3.5 + lean, hy = -17.5 + bob;
  tri(P(hx - 3.5, hy - 3), P(hx - 4, hy - 10.5), P(hx + 0, hy - 4.5), BRD, put);          // back ear
  ellipse(...P(hx, hy), 5.6, 5.2, OR, put);
  tri(P(hx + 0.5, hy - 4.8), P(hx + 3, hy - 11.5), P(hx + 4.8, hy - 3.6), OR, put);       // front ear
  tri(P(hx + 1.8, hy - 7.5), P(hx + 3, hy - 11.5), P(hx + 4, hy - 7.2), BRD, put);
  put(...P(hx + 2.4, hy - 5.5), CREAM);
  ellipse(...P(hx + 0.5, hy + 3.2), 3.2, 2.2, CREAM, put);                                   // cheek
  ellipse(...P(hx + 4.2, hy + 1.6), 3.3, 2.3, CREAM, put);                                   // muzzle
  put(...P(hx + 7, hy + 0.5), K); put(...P(hx + 7, hy + 1.5), K);                            // nose
  if (pose.wink || pose.blink) { put(...P(hx + 2, hy - 1), K); put(...P(hx + 3, hy - 1), K); }
  else { put(...P(hx + 2.5, hy - 1.5), K); put(...P(hx + 2.5, hy - 0.5), K); }
  ellipse(...P(hx - 2, hy - 2.5), 1.4, 1.2, ORL, put);                                       // highlight
  // front arm
  const sh = P(1.5 + lean, -12 + bob);
  let hand;
  if (pose.arm === 'phone') hand = P(8 + lean, -15 + bob);
  else if (pose.arm === 'up') hand = P(3 + lean, -27 + bob);
  else if (pose.arm === 'wave') hand = P(6 + lean + (pose.wave ? 2 : 0), -26 + bob + (pose.wave ? 1 : 0));
  else hand = P(4 + lean, -6 + bob);
  line2(put, sh, hand, OR);
  rect2(put, hand[0] - 1, hand[1] - 1, 2, 2, BRD);
  if (pose.arm === 'up') { line2(put, P(-2 + lean, -12 + bob), P(-3 + lean, -26 + bob), OR); rect2(put, X - 4 + lean, Y - 27 + bob, 2, 2, BRD); }
  outline(s);
  if (pose.arm === 'phone') {
    const ph = icon(['kkkk', 'kssk', 'kssk', 'kssk', 'kkkk'], { k: K, s: pose.scan ? CREAM_P : TEAL });
    for (let j = 0; j < ph.h; j++) for (let i = 0; i < ph.w; i++) { const c = ph.d[j * ph.w + i]; if (c) put(hand[0] + i, hand[1] - 4 + j, c); }
  }
  return s;
}
function rect2(put, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(Math.round(x) + i, Math.round(y) + j, c); }
function line2(put, a, b, c) {
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
  for (let i = 0; i <= n; i++) { const x = Math.round(lerp(a[0], b[0], i / n)), y = Math.round(lerp(a[1], b[1], i / n)); put(x, y, c); put(x + 1, y, c); }
}

// ---------- the story, in beats ----------
const DOORS = [125, 285, 435];
const STAND = DOORS.map(d => d - 16);
const SHOP = [
  { awn: RED, awnD: REDD, sign: BOWL, gain: 45, at: 7, coins: 6, gap: 0.42 },
  { awn: YEL, awnD: YELD, sign: PLATE, gain: 60, at: 12, coins: 9, gap: 0.3 },
  { awn: GRN, awnD: GRND, sign: CUP_SIGN },
];
const LAND = 0.5, HUD_IN = 1, BANG_AT = 1;
const SWAP = 16, SLAM = 17, FLOOD = 18, ITEM = 18.5, TILT = 21, LOGO = 24, FOXIN = 24.5, WINK = 26.2;

function foxX(b) {
  if (b < 3) return 46;
  if (b < 6) return lerp(46, STAND[0], (b - 3) / 3);
  if (b < 9) return STAND[0];
  if (b < 11.5) return lerp(STAND[0], STAND[1], eio(seg(b, 9, 11.5)));
  if (b < 14) return STAND[1];
  if (b < 16) return lerp(STAND[1], STAND[2], eio(seg(b, 14, 16)));
  return STAND[2];
}
const camX = b => Math.round(clamp(foxX(b) - 64, 0, 480));
const camY = b => Math.round(170 * eio(seg(b, TILT, TILT + 2.5)));
// coin flights: [{shop, i, launch, arrive}] in beats
const FLIGHT = 1.35;
const COINS = SHOP.slice(0, 2).flatMap((sh, k) => Array.from({ length: sh.coins }, (_, i) => ({ k, i, launch: sh.at + i * sh.gap, arrive: sh.at + i * sh.gap + FLIGHT })));
function score(b) {
  let v = 0;
  SHOP.slice(0, 2).forEach((sh, k) => { const n = COINS.filter(c => c.k === k && c.arrive <= b).length; v += n === sh.coins ? sh.gain : Math.round(sh.gain * n / sh.coins); });
  return v;
}

// ---------- scenery ----------
function sky(b, cy) {
  // daylight gradient, taller during the tilt
  ditherRect(0, 0, W, 150 + cy, SKY, SKYL, f => f * 1.1 - 0.05);
}
function castle(b, cy) {
  const ox = -Math.round(camX(b) * 0.18) + 70, oy = Math.round(cy * 0.45);
  // hill
  for (let x = -10; x < 200; x++) {
    const h = 34 + 18 * Math.exp(-((x - 60) ** 2) / 1400) + 10 * Math.exp(-((x - 120) ** 2) / 600);
    for (let y = Math.round(140 - h); y < 146; y++) px(x + ox - 60, y + oy, y < 140 - h + 3 ? GRN : GRND);
  }
  // walls and towers on the crest
  const top = 140 - 52 + oy;
  rect(ox - 18, top - 8, 70, 10, STONE); rect(ox - 18, top + 1, 70, 2, STONED);
  for (let i = 0; i < 70; i += 6) rect(ox - 18 + i, top - 11, 3, 3, STONE);
  rect(ox + 6, top - 24, 14, 18, STONE); rect(ox + 6, top - 24, 3, 18, STONED);
  for (let i = 0; i < 14; i += 4) rect(ox + 6 + i, top - 27, 2, 3, STONE);
  rect(ox + 12, top - 18, 2, 4, K);
  rect(ox + 40, top - 16, 10, 10, STONE); rect(ox + 40, top - 16, 2, 10, STONED);
}
function sea(b, cy) {
  const oy = Math.round(cy * 0.55);
  rect(0, 140 + oy, W, 14, SEA);
  const r = mulberry(7);
  for (let i = 0; i < 14; i++) { const x = Math.floor(r() * W), y = 142 + Math.floor(r() * 10) + oy; if (((Math.floor(b * 2) + i) % 3) === 0) rect(x, y, 3, 1, SKYL); }
}
function roofs(b, cy) {
  const ox = -Math.round(camX(b) * 0.55), oy = Math.round(cy * 0.75);
  for (let k = -1; k < 12; k++) {
    const x = k * 34 + ox + 4, hgt = 22 + (k * 7 % 3) * 5, base = 162 + oy;
    rect(x, base - hgt, 28, hgt, WALL); rect(x + 22, base - hgt, 6, hgt, WALLD);
    tri([x - 3, base - hgt + 1], [x + 14, base - hgt - 11], [x + 31, base - hgt + 1], ROOF);
    tri([x + 14, base - hgt - 11], [x + 31, base - hgt + 1], [x + 24, base - hgt + 1], ROOFD);
    rect(x + 6, base - hgt + 6, 4, 5, SEA); rect(x + 16, base - hgt + 6, 4, 5, SEA);
  }
}
function shops(b, cy) {
  const ox = -camX(b), oy = cy;
  // plain houses between shops
  for (let x = -40; x < 640; x += 40) {
    if (DOORS.some(d => Math.abs(x + 20 - d) < 50)) continue;
    rect(x + ox, 150 + oy, 40, 90, WALLD); rect(x + ox + 2, 152 + oy, 36, 88, WALL);
    rect(x + ox + 8, 168 + oy, 9, 12, SEA); rect(x + ox + 23, 168 + oy, 9, 12, SEA); rect(x + ox + 8, 168 + oy, 9, 1, K); rect(x + ox + 23, 168 + oy, 9, 1, K);
    rect(x + ox + 8, 200 + oy, 9, 12, SEA); rect(x + ox + 23, 200 + oy, 9, 12, SEA);
  }
  SHOP.forEach((sh, k) => {
    const cx = DOORS[k] + ox, x = cx - 34, top = 140 + oy;
    rect(x, top, 68, 100, K); rect(x + 1, top + 1, 66, 99, WALL); rect(x + 56, top + 1, 11, 99, WALLD);
    // sign plate with the shop's icon
    rect(x + 20, top + 6, 28, 18, K); rect(x + 21, top + 7, 26, 16, CREAM);
    blit(sh.sign, cx, top + 15, { ax: sh.sign.w / 2, ay: sh.sign.h / 2 });
    // striped awning with a scalloped edge
    const ay = top + 30;
    for (let i = 0; i < 68; i++) { const c = Math.floor(i / 6) % 2 ? sh.awn : CREAM; rect(x + i, ay, 1, 10, c); }
    for (let i = 0; i < 68; i += 6) ellipse(x + i + 3, ay + 10, 3, 2.2, Math.floor(i / 6) % 2 ? sh.awnD : SAND);
    rect(x, ay - 1, 68, 1, K);
    // window and door
    rect(x + 4, top + 50, 22, 26, K); rect(x + 5, top + 51, 20, 24, SKYL); rect(x + 7, top + 53, 3, 10, CREAM);
    const open = k === 0 ? seg(b, 6.9, 7.1) - seg(b, 9.2, 9.4) : k === 1 ? seg(b, 11.9, 12.1) - seg(b, 14.4, 14.6) : 0;
    rect(cx - 9, top + 64, 18, 36, K);
    if (open > 0.5) { rect(cx - 8, top + 65, 16, 35, BRD); rect(cx - 8, top + 65, 4, 35, BR); ditherRect(cx - 8, top + 72, 16, 28, BRD, ORD, f => 0.45 * (1 - f)); }
    else { rect(cx - 8, top + 65, 16, 35, BR); rect(cx - 6, top + 68, 5, 12, BRD); rect(cx + 1, top + 68, 5, 12, BRD); rect(cx + 4, top + 84, 2, 2, YEL); }
    blit(QR, cx + 12, top + 72);
  });
}
function street(b, cy) {
  const ox = -camX(b), oy = cy;
  rect(0, 240 + oy, W, 14, PAV);
  for (let x = ((ox % 12) + 12) % 12 - 12; x < W; x += 12) rect(x, 240 + oy, 1, 14, PAVD);
  rect(0, 246 + oy, W, 1, PAVD);
  rect(0, 254 + oy, W, 2, K);
  rect(0, 256 + oy, W, 70, GREY);
  for (let x = ((ox % 24) + 24) % 24 - 24; x < W; x += 24) rect(x, 284 + oy, 12, 2, CREAM);
}

// ---------- UI windows ----------
function windowBox(x, y, w, h, skin) {
  rect(x, y, w, h, K);
  rect(x + 1, y + 1, w - 2, h - 2, skin === 'cream' ? CREAM : CREAM_P);
  rect(x + 2, y + 2, w - 4, h - 4, SILVER);
  if (skin === 'cream') rect(x + 3, y + 3, w - 6, h - 6, CREAM);
  else ditherRect(x + 3, y + 3, w - 6, h - 6, NAVY, K, f => 0.25 + f * 0.4);
}
function hud(b) {
  if (b < HUD_IN) return;
  const y = Math.round(lerp(-32, 6, eo(seg(b, HUD_IN, HUD_IN + 0.8))) - 40 * ei(seg(b, 23, 24)));
  windowBox(6, y, 168, 34, 'blue');
  blit(COIN, 12, y + 10, { scale: 2 });
  number(String(score(b)), 29, y + 8, CREAM_P, 2);
  blit(CUP_SIGN, 91, y + 12);
  const full = b >= SLAM;
  for (let i = 0; i < 8; i++) {
    const filled = i < 7 || full, blink = full && b < SLAM + 3 && Math.floor(b * 4) % 2;
    const x = 104 + i * 8, yy = y + 14;
    rect(x, yy, 7, 7, filled ? K : SILVER);
    rect(x + 1, yy + 1, 5, 5, filled ? (blink ? YEL_P : CREAM_P) : K);
  }
}
function card(b) {
  if (b < SWAP || b > FLOOD + 1) return;
  const y = Math.round(lerp(330, 132, eo(seg(b, SWAP, SWAP + 0.6))) + 210 * ei(seg(b, FLOOD + 0.2, FLOOD + 0.9)) - 4 * Math.sin(Math.PI * seg(b, SLAM, SLAM + 0.4)));
  windowBox(14, y, 152, 92, 'cream');
  // tab with the café cup
  rect(70, y - 12, 40, 14, K); rect(71, y - 11, 38, 13, CREAM); blit(CUP_STAMP, 90, y - 4, { ax: 4.5, ay: 4.5 });
  for (let i = 0; i < 8; i++) {
    const col = i % 4, row = Math.floor(i / 4), cx = 36 + col * 36, cy = y + 26 + row * 38;
    const stamped = i < 7 || b >= SLAM;
    ellipse(cx, cy, 13, 13, K); ellipse(cx, cy, 12, 12, CREAM);
    if (!stamped) for (let a = 0; a < 24; a++) if (a % 2) { const t = a / 24 * Math.PI * 2; px(cx + Math.cos(t) * 10, cy + Math.sin(t) * 10, GREY); }
    if (stamped) blit(CUP_STAMP, cx, cy + 1, { ax: 4.5, ay: 4.5, scale: 2 });
    if (i === 7 && b >= SLAM && b < SLAM + 1) { const r = 13 + 14 * eo(seg(b, SLAM, SLAM + 1)); for (let a = 0; a < 32; a++) { const t = a / 32 * Math.PI * 2; if (bayer(a, 1) < 1 - seg(b, SLAM, SLAM + 1)) px(cx + Math.cos(t) * r, cy + Math.sin(t) * r, K); } }
  }
  // the rubber stamp comes down on slot 8
  if (b >= SWAP + 0.6 && b < SLAM + 0.9) {
    const sx = 36 + 3 * 36, sy0 = y + 26 + 38;
    const fall = b < SLAM ? lerp(-60, sy0 - 24, ei(seg(b, SLAM - 0.45, SLAM))) : lerp(sy0 - 24, -60, ei(seg(b, SLAM + 0.3, SLAM + 0.9)));
    const hover = b < SLAM - 0.45 ? -60 + 6 * Math.sin(b * 6) : fall;
    blit(STAMP, sx, hover, { ax: 6, ay: 0, scale: 2 });
  }
}

// ---------- fireworks and logo ----------
const FIRE = [{ b: 21.8, x: 42, y: 70 }, { b: 22.6, x: 138, y: 52 }, { b: 23.4, x: 74, y: 38 }, { b: 24.3, x: 150, y: 96 }, { b: 25.2, x: 28, y: 104 }, { b: 26.2, x: 120, y: 30 }, { b: 27.0, x: 60, y: 84 }];
function fireworks(b) {
  FIRE.forEach((f, k) => {
    const launch = f.b - 1.1;
    if (b >= launch && b < f.b) { const u = ei(seg(b, launch, f.b)), y = lerp(330, f.y, u); rect(f.x, y, 1, 3, YEL_P); if (Math.floor(b * 12) % 2) px(f.x, y + 4, ORL_P); }
    if (b >= f.b && b < f.b + 2.2) {
      const u = seg(b, f.b, f.b + 2.2), r = 28 * eo(u * 1.6), cols = [OR, YEL_P, CREAM_P, ORL_P];
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * Math.PI * 2 + k;
        const x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r + 14 * u * u;
        if (bayer(Math.round(x), Math.round(y)) < 1.15 - u) { px(x, y, cols[(i + k) % 4]); if (u < 0.5) px(x - Math.cos(a), y - Math.sin(a), cols[(i + k + 1) % 4]); }
      }
      if (u < 0.12) ellipse(f.x, f.y, 4, 4, CREAM_P);
    }
  });
}
let LOGO_PX = null;   // [{x, y}] at native resolution
function logo(b) {
  if (!LOGO_PX || b < LOGO) return;
  const p = seg(b, LOGO, LOGO + 0.8), bob = b > LOGO + 1 && Math.floor(b) % 2 ? 1 : 0;
  const ox = 90 - LOGO_PX.w / 2, oy = 156 + bob;
  for (const q of LOGO_PX.ink) if (bayer(q.x, q.y) < p) px(ox + q.x, oy + q.y, K);
  for (const q of LOGO_PX.fill) if (bayer(q.x, q.y) < p) px(ox + q.x, oy + q.y, OR);
}

// ---------- present: palette effects, mosaic, shake ----------
const small = document.createElement('canvas'); small.width = W; small.height = H;
const sctx = small.getContext('2d'); const img = sctx.createImageData(W, H);
const cv = document.getElementById('c'); const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
function present(b) {
  const dusk = b >= TILT + 0.6 ? (b >= TILT + 1.6 ? 2 : 1) : 0;
  const twoTone = b >= SWAP && b < FLOOD + 1;
  const flood = seg(b, FLOOD, FLOOD + 0.9);
  const mosaic = b < 0.6 ? [8, 6, 4, 3, 2][Math.min(4, Math.floor(b / 0.12))] : 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = mosaic > 1 ? Math.floor(x / mosaic) * mosaic : x, sy = mosaic > 1 ? Math.floor(y / mosaic) * mosaic : y;
    let c = fb[sy * W + sx];
    for (let k = 0; k < dusk; k++) if (!PROTECTED.has(c)) c = DARK[c];
    if (twoTone) {
      // black / cream: luminance against the Bayer matrix, flooded back to colour from the bottom
      const back = flood > 0 && bayer(x, y) < clamp(flood * 1.6 - (1 - y / H)) * 1.0;
      if (!back) c = LUM[c] > bayer(x, y) * 0.7 + 0.18 ? CREAM : K;
    }
    const [r, g, bl] = PAL[c], o = (y * W + x) * 4;
    img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = bl; img.data[o + 3] = 255;
  }
  sctx.putImageData(img, 0, 0);
  // screen shake 3-2-1 px over 8 frames after the landing and the stamp
  const shakeAt = [LAND, SLAM].find(s => b >= s && b < s + 0.8);
  const sh = shakeAt === undefined ? 0 : [3, -3, 2, -2, 1, -1, 1, 0][Math.min(7, Math.floor((b - shakeAt) / 0.1))];
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(small, 0, sh * S, W * S, H * S);
}

// ---------- one frame ----------
function render(t) {
  const b = bt(t);
  fb.fill(SKY);
  const cy = camY(b);
  sky(b, cy); castle(b, cy); sea(b, cy); roofs(b, cy); shops(b, cy); street(b, cy);

  // the fox on the street
  const sprite8 = Math.floor(t * 8);
  const walking = (b >= 3 && b < 6) || (b >= 9 && b < 11.5) || (b >= 14 && b < 16);
  const running = b >= 9 && b < 11.5;
  if (b < TILT + 3) {
    let y = 247 + cy;
    if (b < LAND) y = lerp(-20, 247, ei(seg(b, 0, LAND)));
    const hop = b >= ITEM && b < ITEM + 0.5 ? -Math.round(8 * Math.sin(Math.PI * seg(b, ITEM, ITEM + 0.5))) : 0;
    let arm = 'down';
    if ((b >= 6 && b < 8.2) || (b >= 11.6 && b < 13.6)) arm = 'phone';
    if (b >= ITEM && b < TILT + 3) arm = 'up';
    const scan = arm === 'phone' && Math.floor(t * 12) % 2 === 0 && ((b > 6.3 && b < 7) || (b > 11.8 && b < 12.1));
    const squash = b >= LAND && b < LAND + 0.4 ? 0.82 + 0.18 * eo(seg(b, LAND, LAND + 0.4)) : 1;
    const f = fox({ step: walking ? sprite8 % 4 : -1, run: running, arm, scan, blink: !walking && sprite8 % 29 === 0 });
    blit(f, foxX(b) - camX(b), y + hop, { ax: 24, ay: 42, sy: squash });
    // the "!" bubble
    if (b >= BANG_AT && b < BANG_AT + 1.5) blit(BANG, foxX(b) - camX(b) + 4, y - 40 - (b < BANG_AT + 0.15 ? 3 : 0), { ax: 3.5, ay: 9 });
    // scan beam to the QR plate
    if ((b > 6.3 && b < 7) || (b > 11.8 && b < 12.1)) {
      const k = b < 9 ? 0 : 1, qx = DOORS[k] + 12 - camX(b) + 3, qy = 215 + cy;
      for (let i = 0; i < 12; i++) { const x = Math.round(lerp(foxX(b) - camX(b) + 9, qx, i / 11)), yy = Math.round(lerp(y - 18, qy, i / 11)); if ((i + Math.floor(t * 24)) % 2) px(x, yy, CREAM_P); }
    }
    // item-get: the free coffee over the head, sparkles around
    if (b >= ITEM + 0.2) {
      const iy = y + hop - 44 - Math.round(4 * eo(seg(b, ITEM + 0.2, ITEM + 0.8)));
      const ix = foxX(b) - camX(b) + 1;
      blit(CUP_ITEM, ix, iy, { ax: 4.5, ay: 4.5, scale: 2 });
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + b * 2.4; if ((sprite8 + i) % 3) blit(SPARK, ix + Math.cos(a) * 15, iy + Math.sin(a) * 12, { ax: 2, ay: 2 }); }
    }
    // "+45" / "+60" rising over the head
    SHOP.slice(0, 2).forEach((sh, k) => {
      const t0 = sh.at + 0.6, t1 = sh.at + 3.2;
      if (b >= t0 && b < t1 && !(b > t1 - 0.6 && sprite8 % 2)) number('+' + sh.gain, foxX(b) - camX(b) - 15, y - 62 - Math.round(8 * eo(seg(b, t0, t0 + 1))), OR, 2);
    });
  }
  // coins in flight, from the door to the counter
  for (const c of COINS) {
    if (b < c.launch || b >= c.arrive) continue;
    const u = seg(b, c.launch, c.arrive), d = DOORS[c.k] - camX(c.launch);
    const x = lerp(d, 19, eio(u)), y = lerp(205, 23, eio(u)) - 46 * Math.sin(Math.PI * u);
    blit(COIN, x, y, { ax: 3.5, ay: 3.5, sx: [1, 0.7, 0.3, 0.7][Math.floor(t * 12 + c.i) % 4], scale: c.k === 1 ? 2 : 1.5 });
  }
  fireworks(b);
  logo(b);
  // the fox returns big under the logo, waves and winks
  if (b >= FOXIN) {
    // lands on top of the logo's letters
    const u = seg(b, FOXIN, FOXIN + 1), y = lerp(380, 171, eo(u)) - 40 * Math.sin(Math.PI * u);
    const f = fox({ step: -1, arm: b > FOXIN + 1 ? 'wave' : 'up', wave: Math.floor(t * 5) % 2, wink: b >= WINK && b < WINK + 0.7 });
    // the hero keeps full colour at dusk: swap to the protected duplicates
    const keep = { [CREAM]: CREAM_P, [ORL]: ORL_P, [BRD]: BRD_P };
    f.d = f.d.map(c => keep[c] ?? c);
    blit(f, 90, y, { ax: 24, ay: 42, scale: 2 });
  }
  hud(b);
  card(b);
  present(b);
}

// ---------- sound and cue events (for score.py) ----------
const EV = [];
const at = (b, type, extra = {}) => EV.push({ t: +(b * B).toFixed(4), type, ...extra });
for (let i = 0; i < NB; i++) at(i, 'beat', { i });
at(LAND, 'land'); at(BANG_AT, 'bang'); at(HUD_IN, 'hud');
[3, 4, 5].forEach(b => at(b, 'step')); [9, 9.5, 10, 10.5, 11].forEach(b => at(b, 'step', { run: 1 })); [14, 15].forEach(b => at(b, 'step'));
[6.3, 11.8].forEach(b => at(b, 'scan')); [6.9, 11.9].forEach(b => at(b, 'door'));
COINS.forEach(c => at(c.arrive, 'coin', { k: c.k, i: c.i }));
SHOP.slice(0, 2).forEach(sh => at(sh.at + 0.6, 'plus'));
at(SWAP, 'swap'); at(SWAP + 0.1, 'cardup'); at(SLAM - 0.45, 'stampfall'); at(SLAM, 'stamp');
at(FLOOD, 'flood'); at(ITEM, 'item'); at(TILT, 'tilt');
FIRE.forEach(f => { at(f.b - 1.1, 'launch'); at(f.b, 'burst'); });
at(LOGO, 'logo'); at(FOXIN, 'jump'); at(FOXIN + 1, 'land2'); at(WINK, 'wink');

window.DUR = DUR; window.EV = EV; window.render = render;

// logo → pixels: alpha-thresholded at native width, with an ink outline
const L = new Image();
L.onload = () => {
  const w = 112, h = Math.round(L.height / L.width * w), c = document.createElement('canvas'); c.width = w + 2; c.height = h + 2;
  const g = c.getContext('2d'); g.drawImage(L, 1, 1, w, h);
  const d = g.getImageData(0, 0, c.width, c.height).data, on = (x, y) => x >= 0 && y >= 0 && x < c.width && y < c.height && d[(y * c.width + x) * 4 + 3] > 110;
  const fill = [], ink = [];
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    if (on(x, y)) fill.push({ x, y });
    else if (on(x + 1, y) || on(x - 1, y) || on(x, y + 1) || on(x, y - 1) || on(x - 1, y - 1)) ink.push({ x, y });
  }
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (!on(x, y) && on(x - 1, y - 1) && on(x - 2, y - 2)) ink.push({ x: x + 1, y: y + 1 });
  LOGO_PX = { w: c.width, fill, ink };
  render(0); window.READY = true;
};
L.src = 'assets/locca-logo.png';
