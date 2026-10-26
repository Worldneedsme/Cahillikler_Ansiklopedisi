// "5 saniyede kazan" — assembly: home stage, transitions through the phone screen, command words, fuse timer,
// replay, the app finale and the pack-away ending. Deterministic: render(t) rebuilds everything from t.
// ?scene=sheet renders the fox model sheet. ?lang=tr|en|ru.
import { clamp, lerp, seg, eo, ei, eio, ss, back, mulberry } from '/core/lib.js';
import { setCtx, bigText, burst, HOME, INK, toon, ell } from './toon.js';
import { drawFox, POSE, blend } from './fox.js';
import { SCR, SCR_C, drawBackdrop, drawMarquee, drawPhone, drawStamp, drawBoard, drawKare, drawDark, drawSpot } from './stage.js';
import { swiss, crt, crayon, pixel, woodcut } from './games.js';
import { app } from './app.js';
import { B, W, H, SECS, S, DUR, secAt, LADDER, PUSH, SHRINK } from './timeline.js';
import { STR } from './strings.js';

const Q = new URLSearchParams(location.search), LANG = Q.get('lang') || 'tr', T = STR[LANG];
const cv = document.getElementById('c'), g = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const GC = mk(), gc = GC.getContext('2d'), RC = mk(), rc = RC.getContext('2d');
const MEDIA = { swiss, crt, crayon, pixel, woodcut };

// ── game frames ──────────────────────────────────────────────
function fuse(c, lt, dur, beats) {
  const x0 = 90, x1 = 990, y = 1856, u = clamp(lt / dur), sx = lerp(x0, x1, u);
  c.save(); c.lineCap = 'round';
  c.strokeStyle = INK; c.lineWidth = 22; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
  c.strokeStyle = '#C98A4B'; c.lineWidth = 12; c.beginPath(); c.moveTo(sx, y); c.lineTo(x1, y); c.stroke();
  c.strokeStyle = '#8A5A2B'; c.lineWidth = 3; for (let x = sx; x < x1; x += 18) { c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 10, y + 6); c.stroke(); }
  c.strokeStyle = '#3A3A44'; c.lineWidth = 6; c.beginPath(); c.moveTo(x0, y); c.lineTo(sx, y); c.stroke();
  for (let i = 0; i <= beats; i++) { const kx = lerp(x0, x1, i / beats); c.fillStyle = kx < sx ? '#3A3A44' : '#C98A4B'; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(kx, y, 15, 0, 7); c.fill(); c.stroke(); }
  // the spark
  c.fillStyle = 'rgba(255,210,63,.5)'; c.beginPath(); c.arc(sx, y, 34 + Math.sin(lt * 50) * 5, 0, 7); c.fill();
  c.fillStyle = '#FFF2B0'; c.beginPath(); c.arc(sx, y, 14, 0, 7); c.fill();
  const r = mulberry(Math.floor(lt * 30)); c.strokeStyle = '#FFD23F'; c.lineWidth = 4;
  for (let i = 0; i < 6; i++) { const a = r() * 7, d = 20 + r() * 26; c.beginPath(); c.moveTo(sx + Math.cos(a) * 12, y + Math.sin(a) * 12); c.lineTo(sx + Math.cos(a) * d, y + Math.sin(a) * d); c.stroke(); }
  c.restore();
}
function command(c, word, lt, hold) {
  const prev = setCtx(c);
  if (lt < hold) {
    const sl = lt < 1 / 30 ? 1.9 : lt < 2 / 30 ? .92 : 1;
    c.save(); c.translate(540, 640); c.scale(sl, sl); c.translate(-540, -640);
    burst(540, 640, 330, 14, HOME.lemon, lt * .6);
    bigText(word, 540, 640, 220, { maxW: 900, drop: HOME.orange, lw: 12 });
    c.restore();
  } else {
    const k = eo(seg(lt, hold, hold + .16)), x = lerp(540, 200, k), y = lerp(640, 150, k), s = lerp(1, .34, k);
    c.save(); c.translate(x, y); c.scale(s, s); c.translate(-540, -640);
    if (k < 1) { c.globalAlpha = 1 - k; burst(540, 640, 330, 14, HOME.lemon, lt * .6); c.globalAlpha = 1; }
    bigText(word, 540, 640, 220, { maxW: 900, drop: HOME.orange, lw: 12 });
    c.restore();
  }
  setCtx(prev);
}
// draws section `s` (a game) at its local time into GC, with the overlays
function gameFrame(s, lt) {
  lt = clamp(lt, 0, s.t1 - s.t0); const L = LADDER[s.round], lc = Math.floor(lt * L.fps) / L.fps;
  const prev = setCtx(gc);
  gc.save();
  if (s.medium === 'app') app(gc, lt / B, T);
  else MEDIA[s.medium](gc, lt, lc, B, T);
  gc.restore();
  if (s.medium !== 'app') fuse(gc, lt, s.t1 - s.t0, s.beats);
  command(gc, T.cmd[s.cmd], lt, L.hold);
  setCtx(prev);
  return GC;
}
// the instant replay of game 3: freeze, half speed, push-in, letterbox, annotation in crayon
const RP = { from: 1.0, rate: .5, freeze: .1 };
function replayFrame(u) {
  const s = S.g3, gl = RP.from + Math.max(0, u - RP.freeze) * RP.rate, L = LADDER[2], lc = Math.floor(gl * L.fps) / L.fps;
  const prev = setCtx(gc);
  crayon(gc, gl, lc, B, T, {
    replay: (c, wax, wobble) => {
      const ck = seg(u, 1.3, 2.1);
      if (ck > 0) wax(c, cc => { cc.lineWidth = 12; const n = 28, pts = []; for (let i = 0; i <= n * ck; i++) { const a = -1.2 + i / n * Math.PI * 2.15; pts.push([900 + Math.cos(a) * 150, 1015 + Math.sin(a) * 135]); } wobble(cc, pts, false, 77); cc.stroke(); }, '#E0412C', .9);
      const ak = seg(u, 1.8, 2.3);
      if (ak > 0) wax(c, cc => { cc.lineWidth = 11; cc.lineCap = 'round'; const x0 = 640, y0 = 1080, x1 = lerp(x0, 740, ak), y1 = lerp(y0, 1030, ak); cc.beginPath(); cc.moveTo(x0, y0); cc.quadraticCurveTo(690, 1000, x1, y1); cc.stroke(); if (ak >= 1) { cc.beginPath(); cc.moveTo(740, 1030); cc.lineTo(706, 1012); cc.moveTo(740, 1030); cc.lineTo(716, 1060); cc.stroke(); } }, '#E0412C', .9);
    },
  });
  setCtx(prev);
  rc.fillStyle = '#000'; rc.fillRect(0, 0, W, H);
  const z = 1 + .3 * eio(seg(u, RP.freeze, 1.2)); rc.save(); rc.translate(660, 1060); rc.scale(z, z); rc.translate(-660, -1060); rc.drawImage(GC, 0, 0); rc.restore();
  // letterbox, label, caption
  rc.fillStyle = '#000'; rc.fillRect(0, 0, W, 210); rc.fillRect(0, H - 330, W, 330);
  rc.fillStyle = '#E0412C'; rc.beginPath(); rc.arc(700, 120, 22, 0, 7); rc.fill();
  rc.fillStyle = '#FBF4E4'; rc.font = '78px "Caveat Brush"'; rc.textAlign = 'left'; rc.textBaseline = 'middle'; rc.fillText(T.replay, 740, 124);
  const ck = clamp((u - .25) * 6);
  if (ck > 0) { rc.save(); rc.globalAlpha = ck; rc.translate(540, H - 175); rc.rotate(-.03); rc.fillStyle = '#FBF4E4'; rc.font = '112px "Caveat Brush"'; rc.textAlign = 'center'; rc.fillText(T.caption, 0, 0); rc.restore(); }
  command(rc, T.cmd.scan, 99, 0);   // the tag stays in the corner
  return RC;
}

// ── home stage ───────────────────────────────────────────────
const prevGame = s => { for (let i = SECS.indexOf(s) - 1; i >= 0; i--) if (SECS[i].kind === 'game' || SECS[i].kind === 'replay') return SECS[i]; return null; };
const nextGame = s => { const n = SECS[SECS.indexOf(s) + 1]; return n && n.kind === 'game' ? n : null; };
const lastFrameOf = p => p.kind === 'replay' ? replayFrame(p.t1 - p.t0) : gameFrame(p, p.t1 - p.t0);
const pointsAt = t => t < S.h2.t0 + .15 ? 0 : t < S.h4.t0 + .15 ? lerp(0, 45, ss(seg(t, S.h2.t0 + .15, S.h2.t0 + .6))) : lerp(45, 105, ss(seg(t, S.h4.t0 + .15, S.h4.t0 + .6)));
const badgeAt = t => t < S.h2.t0 + 2 * B ? T.r1 : t < S.h4.t0 + 2 * B ? T.r2 : t < S.spot.t0 ? T.r3 : T.fin;

function foxPoseAt(t) {
  const s = secAt(t), lt = t - s.t0, b = lt / B; let p = POSE.idle, prop = null;
  const bl = (a, c, k) => blend(a, c, ss(k));
  if (s.id === 'open') p = b < 2 ? POSE.sleep : bl(bl(POSE.sleep, POSE.idle, seg(b, 2, 2.5)), POSE.ready, seg(b, 4, 4.6));
  else if (s.id === 'h1') p = bl(bl(POSE.idle, POSE.cheer, seg(b, .1, .5)), POSE.ready, seg(b, 3, 3.6));
  else if (s.id === 'h2' || s.id === 'h4') p = bl(bl(POSE.idle, POSE.cheer, seg(b, .1, .5)), POSE.ready, seg(b, 1.6, 2.4));
  else if (s.id === 'h3') p = bl(POSE.idle, POSE.sad, seg(b, .1, .5));
  else if (s.id === 'spot') p = { ...POSE.idle, eyes: 4, brow: -1, mouth: 4 };
  else if (s.id === 'fin') { p = b < 10.9 ? bl(POSE.idle, POSE.ready, seg(b, 10, 10.5)) : bl(POSE.ready, POSE.cup, seg(b, 10.9, 11.2)); if (b >= 10.9) { p = { ...p, mouth: 2, eyes: 1 }; prop = 'cup'; } }
  return { p, prop };
}

function drawHome(t, opt = {}) {
  const s = secAt(t), lt = t - s.t0, b = lt / B;
  const isOpen = s.id === 'open', spot = s.id === 'spot' ? 1 : 0;
  const rot = t * .05 + (s.id === 'fin' && b >= 10 ? (t - S.fin.t0 - 10 * B) * .6 : 0);
  drawBackdrop(rot, 1);
  drawMarquee(isOpen ? Math.floor(seg(b, 1, 4) * [...T.marquee].length) : 99, Math.floor(t / B * 2), T.marquee);
  // scoreboard
  const lives = t >= S.h3.t0 + .1 ? 2 : 3;
  drawBoard({ L: T, badge: badgeAt(t), lives, crack: s.id === 'h3' ? seg(lt, .1, .5) : 0, points: pointsAt(t),
    pointsPop: (s.id === 'h2' || s.id === 'h4') ? Math.max(0, 1 - Math.abs(lt - .62) * 5) : 0 });
  // Kare: a tick on every beat, the slap on the button, frozen in the spot
  const nb = nextGame(s), press = nb ? (s.t1 - s.t0) - PUSH : -9;
  const frac = (t / B) % 1, frozen = spot || (isOpen && b < 1);
  drawKare({ bounce: frozen ? 0 : Math.max(0, 1 - frac * 4) * .8, slap: Math.max(0, 1 - Math.abs(lt - press) / .16), eyes: isOpen ? seg(b, 1, 1.2) : 1, look: spot ? .8 : 0,
    wave: s.id === 'fin' ? t * 12 : 0 });
  // fox
  const fp = foxPoseAt(t), fps = 12, tq = Math.floor(t * fps) / fps, fpq = foxPoseAt(tq);
  drawFox(905, 1890, .9, fpq.p, { prop: fpq.prop, propT: t });
  // the phone
  const speed = s.speed ? eio(seg(b, .8, 1.8)) - eio(seg(b, 2.2, 3.0)) : 0;
  const screen = opt.screen;
  drawPhone(c => c.drawImage(screen, 0, 0), speed);
  if (opt.stamp) drawStamp(opt.stamp.ok, opt.stamp.k);
  if (isOpen) { const d = b < 1 ? .9 : b < 2 ? .62 : b < 3 ? .3 : 0; drawDark(d); if (d > 0) drawPhone(c => c.drawImage(screen, 0, 0), 0, 1); }
  if (s.speed) { const k = seg(b, 1, 3); if (k > 0 && k < 1) { const x = lerp(1500, -420, eio(k)); burst(x, 1000, 260, 12, HOME.lemon, t); bigText(T.speed, x, 1000, 170, { drop: HOME.blue }); } }
  drawSpot(spot ? 1 : 0, 540, 820);
  // finale: confetti on the snap to wide
  if (s.id === 'fin' && b >= 10) confetti(t - S.fin.t0 - 10 * B);
}
function confetti(u) {
  const r = mulberry(4), cols = [HOME.orange, HOME.lemon, HOME.blue, '#fff', HOME.ok];
  for (let i = 0; i < 90; i++) {
    const x0 = 540 + (r() - .5) * 300, vx = (r() - .5) * 1500, vy = -1200 - r() * 900, sp = r() * 10;
    const x = x0 + vx * u, y = 900 + vy * u + 1500 * u * u; if (y > 1950) continue;
    g.save(); g.translate(x, y); g.rotate(sp * u * 3); g.fillStyle = cols[i % 5]; g.fillRect(-12, -7, 24, 14); g.restore();
  }
}

// camera: e = 0 wide home … 1 the screen fills the frame
function withCam(e, fn) {
  const s = lerp(1, W / SCR.w, e), cx = lerp(SCR_C.x, W / 2, e), cy = lerp(SCR_C.y, H / 2, e);
  g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-SCR_C.x, -SCR_C.y); fn(); g.restore();
}

// ── the end: the stage packs itself into the phone, the fox keeps the coffee ──
function drawEnd(t) {
  const s = S.end, lt = t - s.t0, b = lt / B;
  drawBackdrop(t * .05, 1);
  const pk = i => ei(seg(b, .2 + i * .35, 1.2 + i * .35));
  const toward = (k, fn) => { if (k >= 1) return; g.save(); g.translate(lerp(0, SCR_C.x, k), lerp(0, SCR_C.y, k)); g.scale(1 - k, 1 - k); g.globalAlpha = 1 - k * .3; fn(); g.restore(); };
  toward(pk(0), () => drawMarquee(99, Math.floor(t / B * 2), T.marquee));
  toward(pk(1), () => drawBoard({ L: T, badge: T.fin, lives: 2, crack: 0, points: 105 }));
  toward(pk(2), () => drawKare({ bounce: 0, slap: 0, eyes: 1, wave: t * 12 }));
  // the phone flies into the fox's pocket
  const fk = eio(seg(b, 1, 3.4)), fx = lerp(905, 540, fk), fy = lerp(1890, 1880, fk), fs = lerp(.9, 1.25, fk);
  const phk = ei(seg(b, 2.2, 3.5));
  if (phk < 1) { g.save(); const tx = lerp(0, fx - 60 - SCR_C.x * .04, phk), ty = lerp(0, fy - 260 - SCR_C.y * .04, phk); g.translate(tx, ty); g.scale(1 - phk * .96, 1 - phk * .96); drawPhone(c => c.drawImage(endScreen(), 0, 0)); g.restore(); }
  if (b > 3.5 && b < 4.2) { const k = seg(b, 3.5, 4.2); g.strokeStyle = HOME.lemon; g.lineWidth = 8 * (1 - k); for (let i = 0; i < 8; i++) { const a = i / 8 * 7; g.beginPath(); g.moveTo(fx - 60 + Math.cos(a) * 30 * (1 + k * 2), fy - 260 + Math.sin(a) * 30 * (1 + k * 2)); g.lineTo(fx - 60 + Math.cos(a) * 55 * (1 + k * 2), fy - 260 + Math.sin(a) * 55 * (1 + k * 2)); g.stroke(); } }
  const walking = b > 1 && b < 3.4, tq = Math.floor(t * 12) / 12;
  let p = blend(POSE.cup, POSE.sip, ss(seg(b, 6.4, 7))); p = blend(p, POSE.cup, ss(seg(b, 8.6, 9.2)));
  if (walking) p = { ...p, walk: tq * 14, stride: 1 };
  drawFox(fx, fy, fs, p, { prop: 'cup', propT: t });
  // motto, logo, stores
  const w1 = eo(seg(b, 3.5, 4.1)), w2 = eo(seg(b, 4.2, 4.8)), lk = back(seg(b, 5, 5.6), 1.6), sk = seg(b, 5.6, 6.2);
  g.save(); g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.globalAlpha = w1; g.fillStyle = '#fff'; g.font = '800 104px Manrope'; g.fillText(T.motto1, 540, 520 + (1 - w1) * 40);
  g.globalAlpha = w2; g.fillStyle = HOME.orange; g.fillText(T.motto2, 540, 650 + (1 - w2) * 40);
  g.globalAlpha = 1; g.restore();
  if (lk > 0) { g.save(); g.translate(540, 860); g.scale(lk, lk); const iw = 440, ih = LOGO.height / LOGO.width * iw; g.drawImage(LOGO, -iw / 2, -ih / 2, iw, ih); g.restore(); }
  if (sk > 0) { g.save(); g.globalAlpha = sk; g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '700 40px Manrope'; g.textAlign = 'center'; g.fillText(T.stores, 540, 1010); g.restore(); }
}
let ES = null;
function endScreen() { if (!ES) { ES = mk(); const c = ES.getContext('2d'); app(c, 10, T); } return ES; }
const OPEN = mk(); let openDrawn = false;
function openScreen() { if (!openDrawn) { app(OPEN.getContext('2d'), 0, T, { empty: true }); openDrawn = true; } return OPEN; }

// ── render ───────────────────────────────────────────────────
function render(t) {
  t = clamp(t, 0, DUR - 1e-4);
  const s = secAt(t), lt = t - s.t0, dur = s.t1 - s.t0;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.imageSmoothingEnabled = true; setCtx(g);
  if (s.kind === 'end') return drawEnd(t);
  if (s.kind === 'replay') { g.drawImage(replayFrame(lt), 0, 0); return; }
  if (s.kind === 'game' && !(s.id === 'fin' && lt >= 10 * B)) { g.drawImage(gameFrame(s, lt), 0, 0); return; }
  // home (or the finale's snap back to wide)
  let e = 0, screen, stamp = null;
  if (s.id === 'fin') { screen = endScreen(); e = 1 - eo(seg(lt - 10 * B, 0, B * .5)); }
  else {
    const p = prevGame(s), n = nextGame(s);
    screen = p ? lastFrameOf(p) : openScreen();
    if (p && lt < SHRINK) e = 1 - eo(lt / SHRINK);
    if (p) stamp = { ok: !p.fail && p.kind !== 'replay', k: seg(lt, SHRINK * .6, SHRINK + .12) };
    if (n && lt > dur - PUSH) { screen = gameFrame(n, 0); e = ei((lt - (dur - PUSH)) / PUSH); stamp = null; }
  }
  // copy the screen first: GC is reused by gameFrame
  if (screen === GC || screen === RC) { const c = SNAP.getContext('2d'); c.drawImage(screen, 0, 0); screen = SNAP; }
  withCam(e, () => drawHome(t, { screen, stamp }));
  if (s.id === 'fin') { const k = seg(lt, 10.2 * B, 10.9 * B); if (k > 0 && k < 1) flyCup(k); }
}
const SNAP = mk();
function flyCup(k) {
  const x = lerp(540, 905, ss(k)), y = lerp(1690 * SCR.h / 1920 + SCR.y, 1640, ss(k)) - Math.sin(k * Math.PI) * 260;
  g.save(); g.translate(x, y); g.rotate(k * 6.3); setCtx(g);
  toon(ell(0, 0, 40, 48), '#fff', HOME.whiteShade, 7, 6); g.fillStyle = HOME.orange; g.fillRect(-30, -8, 60, 20); g.restore();
}

// ── events for the score, and texts for readcheck ───────────
const EV = [];
const ev = (t, type, x = {}) => EV.push({ t: +t.toFixed(4), type, ...x });
for (let i = 0; i < Math.round(DUR / B); i++) { const s = secAt(i * B + 1e-6); ev(i * B, 'beat', { sec: s.id, kind: s.kind, round: s.round || 0, n: i - s.b0 }); }
for (const s of SECS) {
  const t0 = s.t0, bt = k => t0 + k * B;
  if (s.kind === 'game') { ev(t0 - PUSH, 'button'); ev(t0 - PUSH, 'push'); ev(t0, 'cmd', { medium: s.medium, round: s.round, word: T.cmd[s.cmd] }); }
  if (s.kind === 'home' && prevGame(s) && s.id !== 'open') { ev(t0, 'shrink'); ev(t0 + SHRINK * .6, prevGame(s).fail || prevGame(s).kind === 'replay' ? 'fail' : 'ok'); }
  if (s.id === 'open') { [1, 2, 3].forEach(k => ev(bt(k), 'lights', { n: k })); ev(bt(1), 'wake'); }
  if (s.id === 'g1') { for (let k = 1.25; k < 5.6; k += .25) ev(bt(k), 'step_swiss'); ev(bt(2.6), 'cross'); ev(bt(4.2), 'cross'); ev(bt(6), 'pin'); ev(bt(6.1), 'slide'); }
  if (s.id === 'g2') { ev(bt(1.6), 'raise'); ev(bt(3), 'scan', { dur: 1.4 * B }); const st = bt(4.4); const n = (T.crtL1.length + T.crtL2.length + 3); for (let k = 0; k < n; k += 2) ev(st + k / 26, 'type'); ev(bt(5.8), 'big'); }
  if (s.id === 'g3') { ev(bt(.2), 'skid'); ev(bt(1.6), 'reach'); ev(bt(3), 'bip'); ev(bt(3.2), 'squish'); ev(bt(3.4), 'roll'); ev(bt(3.9), 'bounce'); ev(bt(4.3), 'bounce'); ev(bt(4), 'huh'); }
  if (s.id === 'rp') { ev(t0, 'replay'); ev(t0 + RP.freeze + (3 * B - RP.from) / RP.rate, 'bip_slow'); ev(t0 + 1.3, 'circle'); ev(t0 + .25, 'caption'); }
  if (s.id === 'h3') ev(t0 + .1, 'life');
  if (s.id === 'g4') { ev(bt(.5), 'shutter', { dur: 3.5 * B }); for (let k = .8; k < 3.7; k += 1 / 3) ev(bt(k), 'step_px'); ev(bt(1.85), 'jump'); ev(bt(2.55), 'land'); ev(bt(3.7), 'slide_px'); ev(bt(4.0), 'clunk'); ev(bt(4.5), 'scan_px'); ev(bt(4.8), 'coin'); }
  if (s.speed) { ev(t0 + .15, 'points'); ev(bt(.8), 'rotate'); ev(bt(1), 'speed'); }
  if (s.id === 'g5') { ev(bt(1), 'lift'); ev(bt(2.75), 'whoosh'); ev(bt(3), 'thunk'); ev(bt(3.3), 'print'); }
  if (s.id === 'spot') { ev(t0, 'lights_off'); ev(bt(1), 'heart'); ev(bt(3), 'heart'); }
  if (s.id === 'fin') { ev(bt(1.2), 'shine'); ev(bt(2), 'row'); ev(bt(2.9), 'count'); ev(bt(3), 'row'); ev(bt(3.9), 'count'); ev(bt(4), 'row'); ev(bt(4.6), 'stampdot'); ev(bt(4.6), 'reward'); ev(bt(10), 'wide'); ev(bt(10.2), 'cupfly'); ev(bt(10.9), 'cupland'); }
  if (s.id === 'end') { [0, 1, 2].forEach(i => ev(bt(.2 + i * .35), 'pack')); ev(bt(2.2), 'pack'); ev(bt(3.5), 'pocket'); ev(bt(3.5), 'word'); ev(bt(4.2), 'word'); ev(bt(5), 'logo'); ev(bt(6.5), 'sip'); }
}
EV.sort((a, b) => a.t - b.t);

window.TEXTS = t => {
  const s = secAt(t), lt = t - s.t0, out = [], b = lt / B;
  if (s.kind === 'game' && !(s.id === 'fin' && lt >= 10 * B)) out.push({ id: 'cmd_' + s.id, text: T.cmd[s.cmd], x0: 40, y0: 60, x1: 1000, y1: 860 });   // big, then the corner tag
  if (s.id === 'rp' && lt > .25) out.push({ id: 'caption', text: T.caption, x0: 80, y0: 1660, x1: 1000, y1: 1820 });
  if (s.id === 'g1') out.push({ id: 'pin', text: 'KALE SOFRASI', x0: 520, y0: 830, x1: 860, y1: 890 });
  if ((s.id === 'fin' && b > 4.75) || (s.id === 'end' && b < .8)) out.push({ id: 'reward', text: T.reward, x0: 80, y0: 1610, x1: 1000, y1: 1770 });
  if (s.id === 'end' && b > 3.6) out.push({ id: 'motto', text: T.motto1 + ' ' + T.motto2, x0: 60, y0: 420, x1: 1020, y1: 680 });
  return out;
};

// model sheet
function sheet() {
  g.fillStyle = HOME.ground; g.fillRect(0, 0, W, H); setCtx(g);
  Object.keys(POSE).forEach((k, i) => { const x = 180 + (i % 3) * 360, y = 560 + Math.floor(i / 3) * 640; drawFox(x, y, .9, POSE[k], { prop: k === 'phone' ? 'phone' : (k === 'cup' || k === 'sip') ? 'cup' : null }); });
}

const LOGO = new Image(); LOGO.src = 'assets/locca-logo.png';
window.DUR = DUR; window.EV = EV;
window.render = Q.get('scene') === 'sheet' ? sheet : render;
Promise.all([LOGO.decode(), ...['40px "Lilita One"', '20px VT323', '80px "Caveat Brush"', '8px "Press Start 2P"', '90px "Alfa Slab One"', '900 100px Inter', '800 80px Manrope'].map(f => document.fonts.load(f, 'ŞİÜĞöçı'))])
  .then(() => document.fonts.ready).then(() => { window.render(0); window.READY = true; });
