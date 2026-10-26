// Devo: Cahillikler kanalının devekuşu maskotu.
// devo({ view, pose, face, mark, crop, guides, uid }) bir SVG string döndürür.
//   view : 'side' (sağa bakar) | 'front'
//   pose : 'stand' | 'sand' (kafa kumda) | 'point' (kanatla gösterir) | 'jump'
//   face : 'neutral' | 'confused' | 'smug' | 'aha' | 'happy' | 'sad'
//   mark : '?' | '!' | '' (verilmezse ifadeye göre seçilir)
//   crop : 'full' | 'head'
// Koordinat sistemi: 200x300, zemin y=278. Işık sol üstten.
(function (g) {
  const C = {
    body: '#3B3656', bodyHi: '#4D4770', bodyLo: '#2C2843', wing: '#5E5789',
    fluff: '#F7F4EA', fluffLo: '#D9D2C0',
    skin: '#F4A6A0', skinLo: '#DE8A86', leg: '#EE9B95', legFar: '#C8726E',
    beak: '#FFC93C', beakLo: '#E3A21F', mouth: '#8C2F39',
    eye: '#FFFFFF', pupil: '#14213D', blush: '#FF7B8A',
    q: '#FFC93C', bang: '#FF5E5B', sand: '#E9C46A', sandHi: '#F2D488', sandLo: '#CFA64A',
  };
  const DEFAULT_MARK = { neutral: '?', confused: '?', smug: '', aha: '!', happy: '', sad: '' };

  // Yan görünüş kafa: merkez (142,52)
  function sideHead(face) {
    let s = '';
    s += `<circle cx="142" cy="52" r="17" fill="${C.skin}"/>`;
    s += `<path d="M126 58 A17 17 0 0 0 158 60 A20 20 0 0 1 126 58 Z" fill="${C.skinLo}"/>`;
    s += `<ellipse cx="136" cy="37" rx="3.5" ry="7" transform="rotate(-25 136 37)" fill="${C.body}"/>`;
    s += `<ellipse cx="142" cy="35" rx="3.5" ry="8" fill="${C.body}"/>`;
    s += `<ellipse cx="148" cy="37" rx="3" ry="6.5" transform="rotate(25 148 37)" fill="${C.body}"/>`;
    s += sideBeak(face);
    s += sideEye(face);
    return s;
  }
  function sideBeak(face) {
    const upper = face === 'smug'
      ? `<path d="M155 47 Q172 44 178 49 Q168 54 155 55 Z" fill="${C.beak}"/>`
      : `<path d="M155 49 Q172 50 177 55 Q168 58 155 57 Z" fill="${C.beak}"/>`;
    if (face === 'aha') {
      return upper +
        `<path d="M155 57 L175 56 L170 71 L154 63 Z" fill="${C.mouth}"/>` +
        `<path d="M154 61 Q164 68 171 71 Q161 74 153 65 Z" fill="${C.beakLo}"/>`;
    }
    if (face === 'happy') {
      return upper +
        `<path d="M155 57 L175 56 L171 64 L155 61 Z" fill="${C.mouth}"/>` +
        `<path d="M155 60 Q165 63 172 63 Q164 68 155 65 Z" fill="${C.beakLo}"/>`;
    }
    const lowY = face === 'smug' ? 0 : 0;
    return upper + `<path d="M155 ${57 + lowY} Q166 58 174 57 Q166 63 155 62 Z" fill="${C.beakLo}"/>`;
  }
  function sideEye(face) {
    const ex = 147, ey = 47;
    switch (face) {
      case 'happy':
        return `<path d="M140 49 Q147 40 154 49" stroke="${C.pupil}" stroke-width="3" fill="none" stroke-linecap="round"/>` +
          `<ellipse cx="140" cy="58" rx="4" ry="2.5" fill="${C.blush}" opacity=".7"/>`;
      case 'aha':
        return `<ellipse cx="${ex}" cy="${ey - 1}" rx="10" ry="11.5" fill="${C.eye}"/>` +
          `<circle cx="${ex + 1}" cy="${ey - 1}" r="2.6" fill="${C.pupil}"/>` +
          `<path d="M137 31 Q147 25 157 31" stroke="${C.body}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      case 'smug':
        return `<ellipse cx="${ex}" cy="${ey}" rx="8" ry="9" fill="${C.eye}"/>` +
          `<circle cx="${ex + 3}" cy="${ey + 2}" r="4" fill="${C.pupil}"/>` +
          `<path d="M138.6 47.5 A8.4 9.4 0 0 1 155.4 47.5 Z" fill="${C.skin}"/>` +
          `<path d="M139 47.5 L155 47.5" stroke="${C.skinLo}" stroke-width="2" stroke-linecap="round"/>` +
          `<path d="M139 37 L155 35" stroke="${C.body}" stroke-width="3" stroke-linecap="round"/>`;
      case 'confused':
        return `<ellipse cx="${ex}" cy="${ey}" rx="8" ry="9" fill="${C.eye}"/>` +
          `<circle cx="${ex + 1}" cy="${ey - 3}" r="4" fill="${C.pupil}"/>` +
          `<circle cx="${ex + 2.5}" cy="${ey - 4.5}" r="1.3" fill="${C.eye}"/>` +
          `<path d="M139 37 Q146 30 155 33" stroke="${C.body}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      case 'sad':
        return `<ellipse cx="${ex}" cy="${ey + 1}" rx="8" ry="8.5" fill="${C.eye}"/>` +
          `<circle cx="${ex}" cy="${ey + 4}" r="4" fill="${C.pupil}"/>` +
          `<circle cx="${ex + 1.5}" cy="${ey + 2.5}" r="1.3" fill="${C.eye}"/>` +
          `<path d="M139 36 L154 40" stroke="${C.body}" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M152 56 Q154 61 152 63 Q150 61 152 56 Z" fill="#8EC5FF"/>`;
      default:
        return `<ellipse cx="${ex}" cy="${ey}" rx="8" ry="9" fill="${C.eye}"/>` +
          `<circle cx="${ex + 2}" cy="${ey}" r="4" fill="${C.pupil}"/>` +
          `<circle cx="${ex + 3.5}" cy="${ey - 1.5}" r="1.3" fill="${C.eye}"/>`;
    }
  }

  // Ön görünüş kafa: merkez (100,52)
  function frontHead(face) {
    let s = `<circle cx="100" cy="52" r="18" fill="${C.skin}"/>`;
    s += `<path d="M83 58 A18 18 0 0 0 117 58 A21 21 0 0 1 83 58 Z" fill="${C.skinLo}"/>`;
    s += `<ellipse cx="94" cy="36" rx="3.5" ry="7" transform="rotate(-20 94 36)" fill="${C.body}"/>`;
    s += `<ellipse cx="100" cy="34" rx="3.5" ry="8" fill="${C.body}"/>`;
    s += `<ellipse cx="106" cy="36" rx="3.5" ry="7" transform="rotate(20 106 36)" fill="${C.body}"/>`;
    const eyes = [[92.5, 47], [107.5, 47]];
    eyes.forEach(([x, y], i) => {
      const side = i === 0 ? -1 : 1;
      if (face === 'happy') {
        s += `<path d="M${x - 6} ${y + 2} Q${x} ${y - 6} ${x + 6} ${y + 2}" stroke="${C.pupil}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
        s += `<ellipse cx="${x + side * 4}" cy="${y + 11}" rx="3.5" ry="2" fill="${C.blush}" opacity=".7"/>`;
        return;
      }
      const big = face === 'aha';
      s += `<ellipse cx="${x}" cy="${y}" rx="${big ? 8 : 6.5}" ry="${big ? 9.5 : 8}" fill="${C.eye}"/>`;
      const py = face === 'confused' ? y - 3 : face === 'sad' ? y + 3 : y;
      s += `<circle cx="${x}" cy="${py}" r="${big ? 2.3 : 3.6}" fill="${C.pupil}"/>`;
      if (!big) s += `<circle cx="${x + 1.3}" cy="${py - 1.4}" r="1.1" fill="${C.eye}"/>`;
      if (face === 'smug') s += `<path d="M${x - 6.9} ${y} A6.9 8.4 0 0 1 ${x + 6.9} ${y} Z" fill="${C.skin}"/><path d="M${x - 6.5} ${y} L${x + 6.5} ${y}" stroke="${C.skinLo}" stroke-width="1.8" stroke-linecap="round"/>`;
      if (face === 'aha') s += `<path d="M${x - 7} ${y - 15} Q${x} ${y - 19} ${x + 7} ${y - 15}" stroke="${C.body}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      if (face === 'sad') s += `<path d="M${x - 6} ${y - 12 - side * 2} L${x + 6} ${y - 12 + side * 2}" stroke="${C.body}" stroke-width="2.6" stroke-linecap="round"/>`;
      if (face === 'confused' && i === 1) s += `<path d="M${x - 6} ${y - 14} Q${x} ${y - 19} ${x + 6} ${y - 15}" stroke="${C.body}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    });
    if (face === 'aha') {
      s += `<ellipse cx="100" cy="63" rx="6" ry="7" fill="${C.mouth}"/>`;
      s += `<path d="M93 58 Q100 54 107 58 Q100 62 93 58 Z" fill="${C.beak}"/>`;
    } else {
      s += `<path d="M93 58 Q100 53 107 58 Q104 64 100 65 Q96 64 93 58 Z" fill="${C.beak}"/>`;
      s += `<path d="M94 60.5 Q100 63 106 60.5 Q103 65 100 65.5 Q97 65 94 60.5 Z" fill="${C.beakLo}"/>`;
    }
    return s;
  }

  function markSvg(m, x, y) {
    if (!m) return '';
    const col = m === '!' ? C.bang : C.q;
    let s = `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Baloo 2','Nunito',sans-serif" font-weight="800" font-size="28" fill="${col}">${m}</text>`;
    if (m === '!') {
      s += [[-18, -14, -24, -20], [18, -14, 24, -20], [-20, 2, -28, 2], [20, 2, 28, 2]]
        .map(([a, b, c, d]) => `<path d="M${x + a} ${y - 10 + b} L${x + c} ${y - 10 + d}" stroke="${C.q}" stroke-width="2.5" stroke-linecap="round"/>`).join('');
    }
    return s;
  }

  function shadow(rx, op) {
    return `<ellipse cx="100" cy="279" rx="${rx}" ry="6.5" fill="#000" opacity="${op}"/>`;
  }

  function sideLegs(pose) {
    let s = '';
    if (pose === 'jump') {
      s += `<path d="M110 184 L98 208 L114 222" stroke="${C.legFar}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += `<path d="M114 222 L126 224" stroke="${C.legFar}" stroke-width="6" stroke-linecap="round"/>`;
      s += `<path d="M92 186 L80 212 L96 226" stroke="${C.leg}" stroke-width="8.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += `<circle cx="80" cy="212" r="5.5" fill="${C.leg}"/>`;
      s += `<path d="M96 226 L109 228 M96 226 L90 230" stroke="${C.leg}" stroke-width="6.5" stroke-linecap="round"/>`;
      return s;
    }
    s += `<path d="M110 184 L104 226 L112 271" stroke="${C.legFar}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<circle cx="104" cy="226" r="5" fill="${C.legFar}"/>`;
    s += `<path d="M112 271 L127 273 M112 271 L106 274" stroke="${C.legFar}" stroke-width="6" stroke-linecap="round"/>`;
    s += `<path d="M92 186 L86 228 L94 272" stroke="${C.leg}" stroke-width="8.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<circle cx="86" cy="228" r="5.5" fill="${C.leg}"/>`;
    s += `<path d="M94 272 L110 274 M94 272 L87 275" stroke="${C.leg}" stroke-width="6.5" stroke-linecap="round"/>`;
    return s;
  }

  function sideBody(pose) {
    let s = '';
    // kuyruk tüyleri
    s += `<circle cx="52" cy="150" r="10" fill="${C.fluffLo}"/>`;
    s += `<circle cx="50" cy="130" r="12" fill="${C.fluff}"/><circle cx="41" cy="142" r="10" fill="${C.fluff}"/><circle cx="55" cy="144" r="10" fill="${C.fluff}"/>`;
    // gövde
    s += `<ellipse cx="100" cy="150" rx="58" ry="42" fill="${C.body}"/>`;
    s += `<ellipse cx="100" cy="170" rx="44" ry="22" fill="${C.bodyLo}"/>`;
    s += `<ellipse cx="94" cy="134" rx="38" ry="16" fill="${C.bodyHi}"/>`;
    // kanat
    if (pose === 'point') {
      s += `<path d="M86 146 Q120 112 176 104 Q182 108 176 114 Q130 128 104 160 Q90 162 86 146 Z" fill="${C.wing}"/>`;
      s += `<circle cx="181" cy="103" r="6" fill="${C.fluff}"/><circle cx="184" cy="112" r="5" fill="${C.fluff}"/><circle cx="176" cy="96" r="4.5" fill="${C.fluff}"/>`;
    } else {
      s += `<ellipse cx="94" cy="148" rx="34" ry="20" transform="rotate(-12 94 148)" fill="${C.wing}"/>`;
      s += `<circle cx="64" cy="156" r="6" fill="${C.fluff}"/><circle cx="70" cy="163" r="5" fill="${C.fluff}"/><circle cx="62" cy="146" r="4.5" fill="${C.fluff}"/>`;
    }
    return s;
  }

  function sideNeck(pose) {
    let s = '';
    if (pose === 'sand') {
      s += `<path d="M126 134 C150 136 166 196 168 250" stroke="${C.skinLo}" stroke-width="13" fill="none" stroke-linecap="round" transform="translate(2 1.5)"/>`;
      s += `<path d="M126 134 C150 136 166 196 168 250" stroke="${C.skin}" stroke-width="13" fill="none" stroke-linecap="round"/>`;
    } else {
      s += `<path d="M122 132 C132 105 128 80 140 62" stroke="${C.skinLo}" stroke-width="13" fill="none" stroke-linecap="round" transform="translate(2.5 1)"/>`;
      s += `<path d="M122 132 C132 105 128 80 140 62" stroke="${C.skin}" stroke-width="13" fill="none" stroke-linecap="round"/>`;
    }
    // boyun tabanı tüy yakası
    s += `<circle cx="126" cy="134" r="8" fill="${C.fluffLo}"/>`;
    s += `<circle cx="119" cy="126" r="9" fill="${C.fluff}"/><circle cx="129" cy="122" r="8" fill="${C.fluff}"/><circle cx="124" cy="131" r="7.5" fill="${C.fluff}"/>`;
    return s;
  }

  function sandMound() {
    return `<ellipse cx="170" cy="266" rx="36" ry="14" fill="${C.sandLo}"/>` +
      `<ellipse cx="170" cy="262" rx="34" ry="12" fill="${C.sand}"/>` +
      `<ellipse cx="164" cy="257" rx="20" ry="5" fill="${C.sandHi}"/>` +
      `<circle cx="146" cy="250" r="1.8" fill="${C.sand}"/><circle cx="194" cy="248" r="1.5" fill="${C.sand}"/><circle cx="188" cy="241" r="1.2" fill="${C.sand}"/>`;
  }

  function side(pose, face, mark) {
    let s = '';
    const lift = pose === 'jump' ? -28 : 0;
    s += shadow(pose === 'jump' ? 36 : 52, pose === 'jump' ? 0.16 : 0.28);
    if (pose === 'sand') s += sandMound();
    s += `<g transform="translate(0 ${lift})">`;
    s += sideLegs(pose);
    s += sideBody(pose);
    s += sideNeck(pose);
    if (pose !== 'sand') s += sideHead(face);
    s += `</g>`;
    if (pose === 'sand') s += `<path d="M150 252 Q170 246 190 252" stroke="${C.sandLo}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    s += pose === 'sand' ? markSvg(mark, 104, 98) : markSvg(mark, 142, 22 + lift);
    return s;
  }

  function front(pose, face, mark) {
    let s = shadow(50, 0.28);
    // bacaklar
    s += `<path d="M88 186 L86 230 L88 272" stroke="${C.leg}" stroke-width="8.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="M112 186 L114 230 L112 272" stroke="${C.legFar}" stroke-width="8.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<circle cx="86" cy="230" r="5.5" fill="${C.leg}"/><circle cx="114" cy="230" r="5.5" fill="${C.legFar}"/>`;
    s += `<path d="M88 272 L80 276 M88 272 L92 277" stroke="${C.leg}" stroke-width="6.5" stroke-linecap="round"/>`;
    s += `<path d="M112 272 L120 276 M112 272 L108 277" stroke="${C.legFar}" stroke-width="6.5" stroke-linecap="round"/>`;
    // gövde + kanatlar
    s += `<ellipse cx="100" cy="152" rx="50" ry="42" fill="${C.body}"/>`;
    s += `<ellipse cx="100" cy="172" rx="38" ry="22" fill="${C.bodyLo}"/>`;
    s += `<ellipse cx="94" cy="136" rx="32" ry="16" fill="${C.bodyHi}"/>`;
    s += `<ellipse cx="54" cy="154" rx="15" ry="30" transform="rotate(12 54 154)" fill="${C.wing}"/>`;
    s += `<ellipse cx="146" cy="154" rx="15" ry="30" transform="rotate(-12 146 154)" fill="${C.wing}"/>`;
    s += `<circle cx="46" cy="180" r="6" fill="${C.fluff}"/><circle cx="154" cy="180" r="6" fill="${C.fluff}"/>`;
    // boyun
    s += `<path d="M100 122 C98 96 102 82 100 66" stroke="${C.skinLo}" stroke-width="13" fill="none" stroke-linecap="round" transform="translate(2.5 0)"/>`;
    s += `<path d="M100 122 C98 96 102 82 100 66" stroke="${C.skin}" stroke-width="13" fill="none" stroke-linecap="round"/>`;
    s += `<circle cx="100" cy="126" r="9" fill="${C.fluffLo}"/>`;
    s += `<circle cx="91" cy="120" r="9" fill="${C.fluff}"/><circle cx="109" cy="120" r="9" fill="${C.fluff}"/><circle cx="100" cy="117" r="8" fill="${C.fluff}"/>`;
    s += frontHead(face);
    s += markSvg(mark, 100, 20);
    return s;
  }

  function guidesSvg() {
    // 7 kafa boyu: kafa çapı 34, tepe y=35, zemin y=278
    let s = '';
    for (let i = 0; i <= 7; i++) {
      const y = 278 - i * 34.7;
      s += `<line x1="0" y1="${y}" x2="200" y2="${y}" stroke="#F7F4EA" stroke-opacity=".18" stroke-dasharray="4 4"/>`;
      s += `<text x="2" y="${y - 3}" font-size="9" fill="#F7F4EA" fill-opacity=".45" font-family="sans-serif">${i}</text>`;
    }
    return s;
  }

  g.devo = function devo(o = {}) {
    const view = o.view || 'side', pose = o.pose || 'stand', face = o.face || 'neutral';
    const mark = o.mark !== undefined ? o.mark : DEFAULT_MARK[face];
    let vb = '0 0 200 300';
    if (o.crop === 'head') vb = view === 'side' ? '100 -6 94 94' : '53 -6 94 94';
    const inner = (o.guides ? guidesSvg() : '') + (view === 'front' ? front(pose, face, mark) : side(pose, face, mark));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="100%" height="100%">${inner}</svg>`;
  };
  g.devo.colors = C;
})(typeof window !== 'undefined' ? window : globalThis);
