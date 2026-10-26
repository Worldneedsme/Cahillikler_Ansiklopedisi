// Kanal şablonu ortak parçaları: 1080x1920 dikey, deterministik render(t).
// Her video kendi index.html'inde SCENES, sahne çizim fonksiyonları ve olayları tanımlar,
// sonra K.baslat({...}) çağırır. Render aracı window.render(t), window.DUR, window.EV kullanır.
(function (g) {
  const W = 1080, H = 1920;
  const R = {
    navy: '#14213D', purple: '#2B1E4A', teal: '#0F3B45', ink: '#F7F4EA', muted: '#A9B3C9',
    q: '#FFC93C', bang: '#FF5E5B', ok: '#2EC4B6', lav: '#9B7BFF', panel: '#1B2A4A',
  };

  // --- yardımcılar ---
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, d) => clamp((t - a) / d);
  const E = {
    out: (p) => 1 - Math.pow(1 - p, 3),
    inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    back: (p) => { const c = 1.7, c3 = c + 1; return 1 + c3 * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
    elastic: (p) => (p === 0 || p === 1 ? p : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
    in: (p) => p * p * p,
  };
  // Düşme + ezilme (squash): y ilerlemesi ve ölçek
  function drop(t, t0, dur = 0.45) {
    const p = prog(t, t0, dur);
    if (p < 0.7) { const q = p / 0.7; return { y: q * q, sx: 1 - 0.12 * q, sy: 1 + 0.15 * q }; }
    const q = (p - 0.7) / 0.3; // çarpma ve toparlanma
    const k = Math.sin(q * Math.PI) * (1 - q * 0.4);
    return { y: 1, sx: 1 + 0.35 * k, sy: 1 - 0.3 * k };
  }
  // Pop: 0 → aşma → 1, öncesinde hafif hazırlık yok
  function pop(t, t0, dur = 0.4) { return t < t0 ? 0 : E.back(prog(t, t0, dur)); }
  function fade(t, t0, dur = 0.3) { return E.out(prog(t, t0, dur)); }

  function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  const rnd = mulberry(42);
  const STARS = Array.from({ length: 70 }, () => ({ x: rnd() * W, y: rnd() * H, r: 1.2 + rnd() * 3.2, sp: 6 + rnd() * 22, ph: rnd() * 6.28, d: rnd() }));

  // devo() SVG'sini sahneye yerleştir: (x,y) ayakların ortası, h yükseklik
  function devoAt(opts, x, y, h, extra = '') {
    const w = h * 200 / 300;
    const s = devo(opts).replace('<svg xmlns="http://www.w3.org/2000/svg"', `<svg x="${-w / 2}" y="${-h * 278 / 300}" width="${w}" height="${h}" overflow="visible"`).replace(' width="100%" height="100%"', '');
    return `<g transform="translate(${x} ${y}) ${extra}">${s}</g>`;
  }

  function txt(x, y, s, size, col, o = {}) {
    const w = o.weight || 800, anchor = o.anchor || 'middle', fam = o.font || "'Baloo 2'";
    const stroke = o.stroke ? `stroke="${o.stroke}" stroke-width="${o.sw || size * 0.16}" stroke-linejoin="round" paint-order="stroke"` : '';
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${fam}, sans-serif" font-weight="${w}" font-size="${size}" fill="${col}" ${stroke} ${o.attr || ''}>${s}</text>`;
  }

  function background(t, col) {
    let s = `<rect width="${W}" height="${H}" fill="${col}"/>`;
    s += `<circle cx="${W / 2}" cy="${H * 0.42}" r="${760}" fill="#FFFFFF" opacity="0.035"/>`;
    s += `<circle cx="${W / 2}" cy="${H * 0.42}" r="${520}" fill="#FFFFFF" opacity="0.03"/>`;
    for (const st of STARS) {
      const y = ((st.y - t * st.sp) % H + H) % H;
      const tw = 0.35 + 0.35 * Math.sin(t * 1.6 + st.ph);
      s += `<circle cx="${st.x.toFixed(1)}" cy="${y.toFixed(1)}" r="${st.r.toFixed(1)}" fill="${R.ink}" opacity="${(tw * (0.4 + st.d * 0.6)).toFixed(2)}"/>`;
    }
    return s;
  }

  // Kelime kelime altyazı: zamanlar.json kelimeleri + sahne başlangıcı
  function caption(t, words, y) {
    if (!words.length) return '';
    // kelimeleri 3-4'lük gruplara böl (en fazla ~20 karakter)
    const groups = []; let cur = [];
    for (const w of words) {
      const len = cur.reduce((a, b) => a + b.metin.length + 1, 0);
      const gap = cur.length ? w.T - (cur[cur.length - 1].T + cur[cur.length - 1].D) : 0;
      const end = cur.length && /[.!?,:;]$/.test(cur[cur.length - 1].metin);
      if (cur.length && (cur.length >= 4 || len + w.metin.length > 20 || gap > 0.3 || end)) { groups.push(cur); cur = []; }
      cur.push(w);
    }
    if (cur.length) groups.push(cur);
    let gi = -1;
    for (let i = 0; i < groups.length; i++) if (t >= groups[i][0].T - 0.05) gi = i;
    if (gi < 0) return '';
    const grp = groups[gi];
    const last = grp[grp.length - 1];
    const next = groups[gi + 1];
    if (!next && t > last.T + last.D + 0.9) return '';
    const k = E.back(prog(t, grp[0].T - 0.05, 0.25));
    const size = 76;
    const parts = grp.map((w) => {
      const on = t >= w.T - 0.03;
      return `<tspan fill="${on ? R.q : R.ink}">${esc(w.metin.replace(/[.,:;]+$/, ''))}</tspan>`;
    }).join(' ');
    return `<g transform="translate(${W / 2} ${y}) scale(${0.85 + 0.15 * k})" opacity="${clamp(k)}">` +
      txt(0, 0, parts, size, R.ink, { stroke: '#0B1428', sw: 16 }) + `</g>`;
  }
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // Daire wipe geçişi: kesmeden 0.22 sn önce kapanır, 0.22 sn sonra açılır
  function wipe(t, cuts, cx, cy, col) {
    let s = '';
    for (const c of cuts) {
      const p = prog(t, c - 0.22, 0.44);
      if (p <= 0 || p >= 1) continue;
      const rr = p < 0.5 ? E.inOut(p * 2) : 1 - E.inOut((p - 0.5) * 2);
      s += `<circle cx="${cx}" cy="${cy}" r="${(rr * 1250).toFixed(1)}" fill="${col}"/>`;
    }
    return s;
  }

  // İlerleme çubuğu (izleyiciye ne kadar kaldığını göstermeden, ince)
  function progress(t, dur) {
    return `<rect x="0" y="${H - 8}" width="${(W * clamp(t / dur)).toFixed(1)}" height="8" fill="${R.q}" opacity="0.8"/>`;
  }

  g.K = { W, H, R, clamp, lerp, prog, E, drop, pop, fade, mulberry, devoAt, txt, background, caption, wipe, progress, esc };

  // baslat: { scenes:[sure...], sceneFns:[fn(t,lt,i)], bg:[renk], words, events, voStart }
  g.K.baslat = function (cfg) {
    const starts = []; let acc = 0;
    for (const d of cfg.scenes) { starts.push(acc); acc += d; }
    g.DUR = acc;
    g.SCENE_STARTS = starts;
    const stage = document.getElementById('stage');
    // kelimelerin mutlak zamanları
    const words = [];
    cfg.words.forEach((sc, i) => sc.kelimeler.forEach((w) => words.push({ metin: w.metin, T: starts[i] + cfg.voOffset[i] + w.bas, D: w.son - w.bas, s: i })));
    g.render = function (t) {
      let i = 0;
      for (let k = 0; k < starts.length; k++) if (t >= starts[k]) i = k;
      const lt = t - starts[i];
      let s = background(t, cfg.bg[i]);
      const cam = cfg.camera ? cfg.camera(t, lt, i) : { s: 1 + 0.03 * prog(lt, 0, cfg.scenes[i]), x: 0, y: 0 };
      s += `<g transform="translate(${W / 2 + cam.x} ${H * 0.45 + cam.y}) scale(${cam.s}) translate(${-W / 2} ${-H * 0.45})">`;
      s += cfg.sceneFns[i](t, lt, i);
      s += `</g>`;
      s += caption(t, words.filter((w) => w.s === i), cfg.captionY || 1460);
      s += wipe(t, starts.slice(1), W / 2, H * 0.45, cfg.wipeColor || R.q);
      s += progress(t, g.DUR);
      stage.innerHTML = s;
    };
    g.EV = cfg.events.slice().sort((a, b) => a.t - b.t);
    g.VO = cfg.words.map((sc, i) => ({ id: sc.id, t: starts[i] + cfg.voOffset[i] }));
    g.render(0);
    document.fonts.ready.then(() => { g.READY = true; });
  };
})(window);
