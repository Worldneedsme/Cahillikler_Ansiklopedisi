// The finale and the opening screen: the real app's Loccard, in the app's own design (QrWalletCard + LoyaltyStatsPanel):
// a dark gradient card, LOCCARD in #FF5B00, Puanlar / Damgalar / Ücretsiz içecek, Kart sahibi John Doe.
import { clamp, lerp, seg, eo, back, ss } from '/core/lib.js';
const OR = '#FF5B00';

function statusBar(g) {
  g.fillStyle = '#111'; g.font = '700 40px Manrope'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('9:41', 70, 70);
  g.fillRect(900, 58, 70, 26); g.fillStyle = '#fff'; g.fillRect(904, 62, 50, 18);
  g.fillStyle = '#111'; g.fillRect(860, 64, 8, 18); g.fillRect(872, 58, 8, 24); g.fillRect(884, 52, 8, 30);
}
function loccard(g, x, y, w, h, st, T) {
  g.save(); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 50; g.shadowOffsetY = 22;
  const lg = g.createLinearGradient(x, y, x + w, y + h); ['#3D3D44', '#2C2C31', '#222226', '#1E1A18'].forEach((c, i) => lg.addColorStop(i / 3, c));
  g.fillStyle = lg; g.beginPath(); g.roundRect(x, y, w, h, 48); g.fill(); g.restore();
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, 48); g.clip();
  const wg = g.createLinearGradient(x + w, y, x + w * .2, y + h); wg.addColorStop(0, 'rgba(255,91,0,.22)'); wg.addColorStop(1, 'rgba(255,91,0,0)'); g.fillStyle = wg; g.fillRect(x, y, w, h);
  if (st.shine > 0 && st.shine < 1) { const sx = lerp(x - 300, x + w + 300, st.shine); g.save(); g.translate(sx, y + h / 2); g.rotate(.38); const sg = g.createLinearGradient(-120, 0, 120, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(-120, -800, 240, 1600); g.restore(); }
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2; g.beginPath(); g.roundRect(x, y, w, h, 48); g.stroke();
  g.fillStyle = OR; g.font = '800 50px Manrope'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.letterSpacing = '5px'; g.fillText('LOCCARD', x + 54, y + 100); g.letterSpacing = '0px';
  // stats panel (dark variant)
  const px = x + 44, py = y + 150, pw = w - 88, ph = 210;
  g.fillStyle = 'rgba(255,255,255,.06)'; g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.roundRect(px, py, pw, ph, 30); g.fill(); g.stroke();
  const cols = [[T.statPoints, st.points, OR], [T.statStamps, st.stamps, '#fff'], [T.statFree, st.free, '#fff']];
  cols.forEach(([lab, v, col], i) => {
    const cx = px + pw * (i + .5) / 3;
    if (i) { g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(px + pw * i / 3, py + 40, 2, ph - 80); }
    g.save(); g.translate(cx, py + 104); const pop = (st.pop && st.pop[i]) || 0; g.scale(1 + pop * .3, 1 + pop * .3);
    g.fillStyle = col; g.font = '800 76px Manrope'; g.textAlign = 'center'; g.fillText(String(Math.round(v)), 0, 0); g.restore();
    g.fillStyle = 'rgba(255,255,255,.45)'; g.font = '700 26px Manrope'; g.textAlign = 'center'; g.fillText(lab.toLocaleUpperCase(T.locale), cx, py + 166);
  });
  g.fillStyle = 'rgba(255,255,255,.38)'; g.font = '700 24px Manrope'; g.textAlign = 'left'; g.fillText(T.cardholder.toLocaleUpperCase(T.locale), x + 54, y + h - 86);
  g.fillStyle = '#fff'; g.font = '700 38px Manrope'; g.fillText('John Doe', x + 54, y + h - 40);
}
function row(g, y, k, title, sub, right, rightCol, icon) {
  if (k <= 0) return; g.save(); g.globalAlpha = clamp(k * 2); g.translate(lerp(120, 0, eo(k)), 0);
  g.fillStyle = '#FAFAFA'; g.strokeStyle = '#E5E7EB'; g.lineWidth = 2; g.beginPath(); g.roundRect(60, y, 960, 150, 32); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,91,0,.10)'; g.beginPath(); g.arc(140, y + 75, 46, 0, 7); g.fill(); icon(g, 140, y + 75);
  g.fillStyle = '#111'; g.font = '800 44px Manrope'; g.textAlign = 'left'; g.fillText(title, 214, y + 68);
  g.fillStyle = 'rgba(17,17,17,.55)'; g.font = '600 30px Manrope'; g.fillText(sub, 214, y + 114);
  g.fillStyle = rightCol; g.font = '800 46px Manrope'; g.textAlign = 'right'; g.fillText(right, 980, y + 90);
  g.restore();
}
const pinIcon = (g, x, y) => { g.fillStyle = OR; g.beginPath(); g.arc(x, y - 8, 18, Math.PI, 0); g.lineTo(x, y + 24); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - 8, 7, 0, 7); g.fill(); };
const cupIcon = (g, x, y) => { g.fillStyle = OR; g.beginPath(); g.moveTo(x - 18, y - 16); g.lineTo(x + 18, y - 16); g.lineTo(x + 13, y + 20); g.lineTo(x - 13, y + 20); g.closePath(); g.fill(); g.strokeStyle = OR; g.lineWidth = 6; g.beginPath(); g.arc(x + 20, y, 8, -1.3, 1.3); g.stroke(); };

// lt in beats (b). Used for the opening (empty card) with b < 0.
export function app(g, b, T, opt = {}) {
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 1080, 1920); statusBar(g);
  g.save(); g.translate(0, 70);
  g.fillStyle = '#111'; g.font = '800 70px Manrope'; g.textAlign = 'left'; g.fillText(T.appTitle, 60, 230);
  const empty = !!opt.empty;
  const p1 = empty ? 0 : lerp(0, 45, ss(seg(b, 2.2, 2.9))) + lerp(0, 60, ss(seg(b, 3.2, 3.9)));
  const st = { points: p1, stamps: empty ? 0 : (b >= 4.6 ? 8 : 7), free: empty ? 0 : (b >= 4.6 ? 1 : 0), shine: empty ? -1 : (b < 6 ? seg(b, 1.2, 2.2) : seg(b, 7.2, 8.4)),
    pop: [Math.max(1 - Math.abs(b - 2.9) * 4, 1 - Math.abs(b - 3.9) * 4, 0), Math.max(0, 1 - Math.abs(b - 4.6) * 4), Math.max(0, 1 - Math.abs(b - 4.6) * 4)] };
  const cy = empty ? 300 : lerp(420, 300, eo(seg(b, .6, 1.4)));
  loccard(g, 60, cy, 960, 600, st, T);
  if (empty) { g.restore(); return; }
  g.fillStyle = '#111'; g.font = '800 44px Manrope'; g.textAlign = 'left'; g.fillText(T.recent, 60, 1010);
  row(g, 1050, seg(b, 2.0, 2.6), T.v1, T.v1sub, '+45', OR, pinIcon);
  row(g, 1220, seg(b, 3.0, 3.6), T.v2, T.v2sub, '+60', OR, pinIcon);
  row(g, 1390, seg(b, 4.0, 4.6), T.v3, T.v3sub, '8/8', '#111', cupIcon);
  // the Palm & Bean stamp dots (stampFilled = black)
  if (b > 4.0) { const k = seg(b, 4.0, 4.6); for (let i = 0; i < 8; i++) { g.fillStyle = i < 7 || b >= 4.6 ? '#111' : '#E5E7EB'; g.beginPath(); g.arc(560 + i * 38, 1512, 13 * clamp(k * 2 - i * .1), 0, 7); g.fill(); } }
  // the reward banner
  const rk = seg(b, 4.6, 5.0);
  if (rk > 0) {
    const s = back(rk, 2) * (1 + .03 * Math.max(0, Math.sin((b - 5) * Math.PI)) * (b > 5 ? 1 : 0)); g.save(); g.translate(540, 1690); g.scale(s, s);
    g.fillStyle = OR; g.beginPath(); g.roundRect(-460, -80, 920, 160, 80); g.fill();
    g.fillStyle = '#fff'; g.font = '800 50px Manrope'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(T.reward, 0, 4); g.textBaseline = 'alphabetic';
    g.restore();
  }
  g.restore();
}
