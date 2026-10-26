// Home look: flat fills, a thick ink outline and one hard-edged shadow (fill the shade, clip, refill shifted up-left).
export const INK = '#120F2B';
export const HOME = {
  ground: '#10133A', ray1: '#151A4C', ray2: '#1C2568', blue: '#2F6BFF', lemon: '#FFD23F',
  orange: '#FF5B00', orangeShade: '#C94100', ok: '#2BD67B', fail: '#FF3B3B', white: '#FFFFFF', whiteShade: '#D9D3EA',
};
let g = null;
export const setCtx = c => { const p = g; g = c; return p; };
export const ctx = () => g;

// path: a Path2D in the current transform. sh = shadow offset in current units.
export function toon(path, base, shade, lw = 7, sh = 9, outline = true) {
  g.fillStyle = shade || base; g.fill(path);
  if (shade) { g.save(); g.clip(path); g.translate(-sh, -sh); g.fillStyle = base; g.fill(path); g.restore(); }
  if (outline && lw > 0) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(path); }
}
export function rrect(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }
export function ell(x, y, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; }
export function poly(pts, close = true) { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); if (close) p.closePath(); return p; }
// a capsule (limb) from a to b with width w
export function capsule(ax, ay, bx, by, w) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2, a = Math.atan2(dy, dx);
  const p = new Path2D(); p.moveTo(ax + nx, ay + ny); p.lineTo(bx + nx, by + ny); p.arc(bx, by, w / 2, a + Math.PI / 2, a - Math.PI / 2, true);
  p.lineTo(ax - nx, ay - ny); p.arc(ax, ay, w / 2, a - Math.PI / 2, a + Math.PI / 2, true); p.closePath(); return p;
}
// outlined display text with a coloured drop (command words, banners)
export function bigText(txt, x, y, size, { fill = '#fff', drop = HOME.orange, lw = 12, font = 'Lilita One', skew = -0.1, maxW = 0, align = 'center' } = {}) {
  g.save(); g.translate(x, y); g.transform(1, 0, skew, 1, 0, 0);
  g.font = `${size}px "${font}"`; g.textAlign = align; g.textBaseline = 'middle';
  if (maxW) { const w = g.measureText(txt).width; if (w > maxW) { const k = maxW / w; g.scale(k, k); } }
  g.lineJoin = 'round'; g.lineWidth = lw * 2; g.strokeStyle = INK;
  g.save(); g.translate(lw * .7, lw * .9); g.fillStyle = drop; g.strokeText(txt, 0, 0); g.fillText(txt, 0, 0); g.restore();
  g.strokeText(txt, 0, 0); g.fillStyle = fill; g.fillText(txt, 0, 0);
  g.restore();
}
// a spiky burst behind a word
export function burst(x, y, r, n, col, rot = 0) {
  const pts = []; for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * Math.PI * 2, rr = i % 2 ? r * .72 : r; pts.push([x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr * .8]); }
  toon(poly(pts), col, null, 7);
}
