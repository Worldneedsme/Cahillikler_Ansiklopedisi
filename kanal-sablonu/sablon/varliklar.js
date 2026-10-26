// Tekrar kullanılabilir çizimler (varlık kütüphanesi). parcalar.js'den sonra yüklenir.
// Her fonksiyon SVG string döndürür; k = görünme ölçeği (0 → gizli, 1 → tam), genelde pop(lt, t0).
// Yeni videoda işe yarayan her çizimi buraya ekleyin ki sonraki videolar yeniden kullansın.
(function (g) {
  const { R, clamp, txt } = K;
  const STROKE = '#0B1428';
  const sc = (x, y, k) => `translate(${x} ${y}) scale(${Math.max(0, k).toFixed(3)})`;

  // ✓ / ✗ rozeti, döndürmeden (çevirme gerekiyorsa K.badge)
  K.mark = function (cx, cy, r, ok, k = 1) {
    if (k <= 0) return '';
    const m = ok
      ? `<path d="M${-r * 0.42} 0 L${-r * 0.1} ${r * 0.32} L${r * 0.45} ${-r * 0.34}" stroke="#FFF" stroke-width="${r * 0.22}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M${-r * 0.34} ${-r * 0.34} L${r * 0.34} ${r * 0.34} M${r * 0.34} ${-r * 0.34} L${-r * 0.34} ${r * 0.34}" stroke="#FFF" stroke-width="${r * 0.22}" stroke-linecap="round"/>`;
    return `<g transform="${sc(cx, cy, k)}"><circle r="${r}" fill="${ok ? R.ok : R.bang}"/>${m}</g>`;
  };

  // Kronometre: value ortadaki sayı, frac 0-1 dolan dilim, alt yazı (ör. 'saniye')
  K.stopwatch = function (cx, cy, r, value, frac, k = 1, alt = 'saniye') {
    if (k <= 0) return '';
    const a = clamp(frac) * Math.PI * 2;
    const x = Math.sin(a) * r * 0.86, y = -Math.cos(a) * r * 0.86;
    const dilim = frac >= 0.999 ? `<circle r="${r * 0.86}" fill="#F6C9C4"/>`
      : frac > 0 ? `<path d="M0 0 L0 ${-r * 0.86} A${r * 0.86} ${r * 0.86} 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)} Z" fill="#F6C9C4"/>` : '';
    return `<g transform="${sc(cx, cy, k)}">` +
      `<rect x="${-r * 0.1}" y="${-r * 1.22}" width="${r * 0.2}" height="${r * 0.2}" rx="6" fill="${R.q}"/>` +
      `<circle r="${r}" fill="${R.q}"/><circle r="${r * 0.86}" fill="${R.ink}"/>${dilim}` +
      txt(0, r * 0.14, String(value), r * 0.62, R.navy) + (alt ? txt(0, r * 0.42, alt, r * 0.15, R.navy, { weight: 600 }) : '') + `</g>`;
  };

  // Bayraklar: fr, en (İngiltere), gb, tr, it, de, us, jp. (x,y) merkez
  K.flag = function (code, x, y, w, h) {
    const L = x - w / 2, T = y - h / 2;
    const v3 = (a, b, c) => [a, b, c].map((col, i) => `<rect x="${L + i * w / 3}" y="${T}" width="${w / 3 + 0.5}" height="${h}" fill="${col}"/>`).join('');
    const h3 = (a, b, c) => [a, b, c].map((col, i) => `<rect x="${L}" y="${T + i * h / 3}" width="${w}" height="${h / 3 + 0.5}" fill="${col}"/>`).join('');
    const f = {
      fr: () => v3('#2B4FB8', '#FFFFFF', '#E8414B'),
      it: () => v3('#1F9A55', '#FFFFFF', '#E8414B'),
      de: () => h3('#1A1A1A', '#DD2E2E', '#FFCE2E'),
      en: () => `<rect x="${L}" y="${T}" width="${w}" height="${h}" fill="#FFF"/><rect x="${x - w * 0.09}" y="${T}" width="${w * 0.18}" height="${h}" fill="#D7263D"/><rect x="${L}" y="${y - h * 0.12}" width="${w}" height="${h * 0.24}" fill="#D7263D"/>`,
      gb: () => `<rect x="${L}" y="${T}" width="${w}" height="${h}" fill="#1F3A93"/><path d="M${L} ${T} L${L + w} ${T + h} M${L + w} ${T} L${L} ${T + h}" stroke="#FFF" stroke-width="${h * 0.2}"/><path d="M${L} ${T} L${L + w} ${T + h} M${L + w} ${T} L${L} ${T + h}" stroke="#D7263D" stroke-width="${h * 0.07}"/><rect x="${x - w * 0.11}" y="${T}" width="${w * 0.22}" height="${h}" fill="#FFF"/><rect x="${L}" y="${y - h * 0.17}" width="${w}" height="${h * 0.34}" fill="#FFF"/><rect x="${x - w * 0.065}" y="${T}" width="${w * 0.13}" height="${h}" fill="#D7263D"/><rect x="${L}" y="${y - h * 0.1}" width="${w}" height="${h * 0.2}" fill="#D7263D"/>`,
      tr: () => `<rect x="${L}" y="${T}" width="${w}" height="${h}" fill="#E30A17"/><circle cx="${L + w * 0.36}" cy="${y}" r="${h * 0.25}" fill="#FFF"/><circle cx="${L + w * 0.4}" cy="${y}" r="${h * 0.2}" fill="#E30A17"/><path d="${star(L + w * 0.56, y, h * 0.11)}" fill="#FFF"/>`,
      us: () => Array.from({ length: 7 }, (_, i) => `<rect x="${L}" y="${T + i * h / 6.5}" width="${w}" height="${h / 13}" fill="#D7263D"/>`).join('') + `<rect x="${L}" y="${T}" width="${w * 0.42}" height="${h * 0.54}" fill="#1F3A93"/>`,
      jp: () => `<rect x="${L}" y="${T}" width="${w}" height="${h}" fill="#FFF"/><circle cx="${x}" cy="${y}" r="${h * 0.3}" fill="#D7263D"/>`,
    }[code];
    const clip = `fl${code}${Math.round(x)}${Math.round(y)}`;
    return `<clipPath id="${clip}"><rect x="${L}" y="${T}" width="${w}" height="${h}" rx="${h * 0.08}"/></clipPath><g clip-path="url(#${clip})">${f ? f() : ''}</g>`;
  };
  function star(cx, cy, r) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); }
    return d + 'Z';
  }

  // Bayraklı kart: koyu panel, bayrak, altında etiket
  K.flagCard = function (cx, cy, code, label, k = 1, w = 300, h = 270) {
    if (k <= 0) return '';
    return `<g transform="${sc(cx, cy, k)}"><rect x="${-w / 2 + 8}" y="${-h / 2 + 12}" width="${w}" height="${h}" rx="30" fill="${STROKE}" opacity=".45"/>` +
      `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="30" fill="${R.panel}"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h * 0.42}" rx="30" fill="#FFF" opacity=".07"/>` +
      K.flag(code, 0, -h * 0.1, w * 0.62, w * 0.42) + txt(0, h * 0.36, label, 46, R.ink) + `</g>`;
  };

  // Harita iğnesi: (x,y) ucun değdiği nokta
  K.pin = function (x, y, k = 1, col = R.bang) {
    if (k <= 0) return '';
    return `<g transform="${sc(x, y, k)}"><ellipse cx="0" cy="4" rx="16" ry="6" fill="#000" opacity=".25"/>` +
      `<path d="M0 0 C-10 -22 -30 -38 -30 -62 A30 30 0 1 1 30 -62 C30 -38 10 -22 0 0 Z" fill="${col}"/><circle cy="-62" r="11" fill="#FFF"/></g>`;
  };

  // Liste satırı: koyu hap, yazı, sağda ✓/✗ (markK: rozetin görünme ölçeği)
  K.row = function (cx, cy, w, text, k = 1, ok = false, markK = 0) {
    if (k <= 0) return '';
    const h = 110;
    return `<g transform="${sc(cx, cy, k)}"><rect x="${-w / 2 + 6}" y="${-h / 2 + 10}" width="${w}" height="${h}" rx="26" fill="${STROKE}" opacity=".45"/>` +
      `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="26" fill="${R.panel}"/>` +
      txt(-40, 17, text, 50, R.ink) + K.mark(w / 2 - 70, 0, 36, ok, markK) + `</g>`;
  };

  // Kişi portresi (göğüs çekimi). o: { hair: 'wig'|'short'|'long'|'bald', hairCol, skin, coat, smile }
  K.kisi = function (cx, cy, s, o = {}, k = 1) {
    if (k <= 0) return '';
    const skin = o.skin || '#F4C9A8', coat = o.coat || '#2A2440', hc = o.hairCol || (o.hair === 'wig' ? '#F4F1EA' : '#4A3426');
    let h = '';
    if (o.hair === 'wig') h = [[-70, -20], [-62, 30], [70, -20], [62, 30], [-40, -75], [0, -88], [40, -75], [-72, 70], [72, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="38" fill="${hc}"/>`).join('');
    else if (o.hair === 'long') h = `<path d="M-78 -10 Q-80 -95 0 -98 Q80 -95 78 -10 L84 95 L-84 95 Z" fill="${hc}"/>`;
    const top = o.hair === 'short' ? `<path d="M-66 -24 Q-66 -92 0 -92 Q66 -92 66 -24 Q40 -60 -66 -24 Z" fill="${hc}"/>` : o.hair === 'wig' ? `<path d="M-60 -30 Q-50 -90 0 -90 Q50 -90 60 -30 Q30 -62 -60 -30 Z" fill="${hc}"/>` : '';
    const mouth = o.smile === false ? `<path d="M-14 38 L14 38" stroke="#6B3A2E" stroke-width="5" stroke-linecap="round"/>` : `<path d="M-18 34 Q0 50 18 34" stroke="#6B3A2E" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    return `<g transform="${sc(cx, cy, k * s)}">` + h +
      `<path d="M-110 190 Q-105 105 0 100 Q105 105 110 190 Z" fill="${coat}"/><path d="M-26 100 L0 140 L26 100 Z" fill="#FFF"/>` +
      `<rect x="-20" y="64" width="40" height="44" fill="${skin}"/><ellipse cx="0" cy="0" rx="64" ry="74" fill="${skin}"/>` + top +
      `<circle cx="-24" cy="-2" r="7" fill="${R.navy}"/><circle cx="24" cy="-2" r="7" fill="${R.navy}"/>` +
      `<ellipse cx="-38" cy="22" rx="11" ry="7" fill="#FF8C8C" opacity=".45"/><ellipse cx="38" cy="22" rx="11" ry="7" fill="#FF8C8C" opacity=".45"/>` +
      `<path d="M0 6 Q-6 20 4 22" stroke="#C99A7E" stroke-width="4" fill="none" stroke-linecap="round"/>${mouth}</g>`;
  };

  // Gözler: sepetten, kutudan bakan iki göz. blink 0-1 kapanma
  K.gozler = function (cx, cy, r, k = 1, blink = 0, bak = 0) {
    if (k <= 0) return '';
    const ry = r * (1 - 0.9 * clamp(blink));
    return `<g transform="${sc(cx, cy, k)}">` + [-1, 1].map((d) => `<ellipse cx="${d * r * 1.05}" cy="0" rx="${r}" ry="${ry}" fill="#FFF"/><circle cx="${d * r * 1.05 + bak * r * 0.4}" cy="${r * 0.15}" r="${Math.min(r * 0.45, ry)}" fill="${R.navy}"/>`).join('') + `</g>`;
  };
})(window);
