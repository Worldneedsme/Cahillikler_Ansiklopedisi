// Videolar arasında ortak sahne parçaları ve kelimeye bağlı kurulum.
// kanal.js'den sonra yüklenir. Videonun index.html'i yalnızca sahneleri ve olayları yazar:
//   K.video({ sahneler:[S0..S4], kelimeSayisi:[..], tail:[..], bg:[..], olaylar:(w, at) => [...] })
// Sahne içinde w(i, k) = i. sahnenin k. kelimesinin söylendiği an (sahne içi saniye).
(function (g) {
  const { W, R, clamp, prog, E, pop, fade, txt } = K;
  const STROKE = '#0B1428';

  K.title = function (lines, t, t0, y0, size = 84, col = R.ink) {
    return lines.map((l, i) => {
      const k = pop(t, t0 + i * 0.12, 0.45);
      return `<g transform="translate(${W / 2} ${y0 + i * size * 1.08}) scale(${k.toFixed(3)})">${txt(0, 0, l, size, col, { stroke: STROKE, sw: 14 })}</g>`;
    }).join('');
  };
  // Başlık + kendi kelimesine göre kaybolma (yer açmak için)
  K.titleOut = function (lines, t, t0, y0, size, col, tOut) {
    const o = tOut === undefined ? 1 : 1 - fade(t, tOut, 0.2);
    return `<g opacity="${o.toFixed(3)}">${K.title(lines, t, t0, y0, size, col)}</g>`;
  };
  K.label = function (x, y, s, size, col, k = 1) {
    return `<g transform="translate(${x} ${y}) scale(${k.toFixed(3)})">${txt(0, 0, s, size, col, { stroke: STROKE, sw: size * 0.18 })}</g>`;
  };
  // ✓ → ✗ ters dönme rozeti (tFlip verilmezse hep ✓; bad=true ise hep ✗)
  K.badge = function (cx, cy, r, t, tFlip, bad0 = false) {
    const p = tFlip === undefined ? 0 : prog(t, tFlip, 0.36);
    const sx = Math.abs(Math.cos(p * Math.PI));
    const bad = bad0 || p >= 0.5;
    const col = bad ? R.bang : R.ok;
    const mark = bad
      ? `<path d="M${-r * 0.36} ${-r * 0.36} L${r * 0.36} ${r * 0.36} M${r * 0.36} ${-r * 0.36} L${-r * 0.36} ${r * 0.36}" stroke="#FFF" stroke-width="${r * 0.2}" stroke-linecap="round"/>`
      : `<path d="M${-r * 0.42} 0 L${-r * 0.1} ${r * 0.32} L${r * 0.45} ${-r * 0.34}" stroke="#FFF" stroke-width="${r * 0.2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<g transform="translate(${cx} ${cy}) scale(${sx.toFixed(3)} 1)"><circle r="${r}" fill="${col}"/><circle r="${r}" fill="none" stroke="#FFF" stroke-opacity=".25" stroke-width="8"/>${mark}</g>`;
  };
  // Damga: büyükten küçülerek çarpar (hazırlık + aşma)
  K.stamp = function (cx, cy, s, size, col, t, t0, rot = -8) {
    if (t < t0) return '';
    const p = prog(t, t0, 0.35);
    const sc = p < 0.6 ? 2.2 - 1.3 * E.in(p / 0.6) : 0.9 + 0.1 * E.back((p - 0.6) / 0.4);
    const o = clamp(p * 3);
    const w = s.length * size * 0.62 + 60;
    return `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${sc.toFixed(3)})" opacity="${o.toFixed(2)}">` +
      `<rect x="${-w / 2}" y="${-size * 0.85}" width="${w}" height="${size * 1.3}" rx="18" fill="none" stroke="${col}" stroke-width="12"/>` +
      txt(0, size * 0.1, s, size, col, { attr: `dy="${size * 0.15}"` }) + `</g>`;
  };
  K.card = function (cx, cy, w, h, k, fill = R.ink, inner = '') {
    return `<g transform="translate(${cx} ${cy}) scale(${k.toFixed(3)})"><rect x="${-w / 2 + 10}" y="${-h / 2 + 12}" width="${w}" height="${h}" rx="34" fill="${STROKE}" opacity=".5"/>` +
      `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="34" fill="${fill}"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h * 0.45}" rx="34" fill="#FFF" opacity=".12"/>${inner}</g>`;
  };
  K.followButton = function (t, t0, y = 1110) {
    const kb = pop(t, t0, 0.45);
    const pulse = t > t0 + 0.5 ? 1 + 0.04 * Math.sin((t - t0 - 0.5) * 7) : 1;
    return `<g transform="translate(640 ${y}) scale(${(kb * pulse).toFixed(3)})"><rect x="-300" y="-80" width="600" height="160" rx="80" fill="${R.q}"/><rect x="-300" y="-80" width="600" height="80" rx="80" fill="#FFF" opacity=".15"/>${txt(0, 22, 'Takip et', 76, R.navy)}</g>`;
  };
  K.ring = function (cx, cy, t, t0, r0, r1, col, rx = 1, ry = 1) {
    const p = prog(t, t0, 0.6);
    if (p <= 0 || p >= 1) return '';
    const r = r0 + (r1 - r0) * p;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${r * rx}" ry="${r * ry}" fill="none" stroke="${col}" stroke-width="${10 * (1 - p)}" opacity="${1 - p}"/>`;
  };
  // 0 → hedef sayı, belirli sürede sayan sayaç
  K.counter = function (t, t0, dur, to) { return Math.round(to * E.out(prog(t, t0, dur))); };

  K.video = function (cfg) {
    const VO_OFF = cfg.voOff || cfg.sahneler.map((_, i) => (i === 0 ? 0.25 : 0.2));
    fetch('ses/zamanlar.json').then((r) => r.json()).then((z) => {
      z.sahneler.forEach((sc, i) => { if (cfg.kelimeSayisi && sc.kelimeler.length !== cfg.kelimeSayisi[i]) console.error(`sahne ${i}: ${sc.kelimeler.length} kelime, beklenen ${cfg.kelimeSayisi[i]}`); });
      const WT = z.sahneler.map((sc) => sc.kelimeler.map((k) => k.bas));
      g.w = (i, k) => VO_OFF[i] + WT[i][Math.min(k, WT[i].length - 1)];
      const SCENES = z.sahneler.map((sc, i) => +(VO_OFF[i] + sc.sure + cfg.tail[i]).toFixed(2));
      g.SCENES = SCENES;
      const st = []; { let a = 0; for (const d of SCENES) { st.push(a); a += d; } }
      const at = (i, lt) => +(st[i] + lt).toFixed(3);
      const events = [...st.slice(1).map((c) => ({ t: c - 0.22, type: 'whoosh' })), ...cfg.olaylar(g.w, at)];
      K.baslat({
        scenes: SCENES, voOffset: VO_OFF, words: z.sahneler, events,
        sceneFns: cfg.sahneler, bg: cfg.bg, wipeColor: cfg.wipeColor,
        camera: (t, lt, i) => ({ s: 1 + 0.035 * E.inOut(prog(lt, 0, SCENES[i])), x: 0, y: 0 }),
      });
      const q = new URLSearchParams(location.search).get('t');
      if (q !== null) g.render(+q);
    });
  };
})(window);
