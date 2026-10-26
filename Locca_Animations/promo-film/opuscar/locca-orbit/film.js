// "Yörüngeden sokağa" — Locca, Satellite Briefing style (lemo-opuscar). 1080×1920, 16 s.
// From orbit down to Alanya, then one locked frame over the town for a week of visits: each satellite pass leaves a
// visit, a reading in Locca orange, and true colour returning around the venue; the Loccard counter lands on 105;
// a last pass gives the whole town its colour back. Ground = real imagery (Blue Marble, Sentinel-2); venues are made up.
// Camera math adapted from lemomo-ai/lemo-opuscar styles/satellite-briefing/demo/engine.js (MIT, © 2026 LemoLab).
import { clamp, seg, ss, eio, eo, ei, lerp, monotone } from '/core/lib.js';

const W = 1080, H = 1920, DUR = 16, QS = new URLSearchParams(location.search);
const LANG = ['tr', 'en', 'ru'].includes(QS.get('lang')) ? QS.get('lang') : 'tr';
const COPY = {
  tr: { pass: (n, d) => `GEÇİŞ ${n} · ${d}`, days: ['PZT 12:30', 'ÇAR 16:05', 'CUM 09:41'], visit: 'ZİYARET', pts: 'PUAN', stamp: 'DAMGA', card: 'LOCCARD',
        l1: ['YERELİ ', 'KEŞFET.'], l2: ['ÖDÜLLERİ ', 'KAZAN.'], km: (v) => `${v.toFixed(1).replace('.', ',')} km` },
  en: { pass: (n, d) => `PASS ${n} · ${d}`, days: ['MON 12:30', 'WED 16:05', 'FRI 09:41'], visit: 'VISIT', pts: 'POINTS', stamp: 'STAMPS', card: 'LOCCARD',
        l1: ['DISCOVER ', 'LOCAL.'], l2: ['WIN ', 'REWARDS.'], km: (v) => `${v.toFixed(1)} km` },
  ru: { pass: (n, d) => `ПРОЛЁТ ${n} · ${d}`, days: ['ПН 12:30', 'СР 16:05', 'ПТ 09:41'], visit: 'ВИЗИТ', pts: 'БАЛЛОВ', stamp: 'ШТАМПОВ', card: 'LOCCARD',
        l1: ['ОТКРЫВАЙ ', 'МЕСТНОЕ.'], l2: ['ПОЛУЧАЙ ', 'НАГРАДЫ.'], km: (v) => `${v.toFixed(1).replace('.', ',')} км` },
}[LANG];

// ---------- camera (double precision in JS) ----------
const R = 6371.0088, D2R = Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
const ecef = (lat, lon, h = 0) => { const p = lat * D2R, l = lon * D2R, r = R + h; return [r * Math.cos(p) * Math.cos(l), r * Math.cos(p) * Math.sin(l), r * Math.sin(p)]; };
function makeCamera({ lat, lon, d, tilt = 0, heading = 0, fov = 30 }) {
  const T = ecef(lat, lon), p = lat * D2R, l = lon * D2R;
  const up = [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)], east = [-Math.sin(l), Math.cos(l), 0], north = cross(up, east);
  const hd = heading * D2R, tl = tilt * D2R, Hd = add(mul(north, Math.cos(hd)), mul(east, Math.sin(hd)));
  const C = add(T, mul(add(mul(up, Math.cos(tl)), mul(Hd, -Math.sin(tl))), d));
  const f = norm(sub(T, C)); let u = norm(add(mul(Hd, Math.cos(tl)), mul(up, Math.sin(tl)))); u = norm(sub(u, mul(f, dot(u, f))));
  const r = norm(cross(f, u)), F = (H / 2) / Math.tan(fov * D2R / 2), h = Math.hypot(...C) - R;
  return { C, f, u, r, F, alt: h, c2: h * (2 * R + h) };
}
function project(cam, lat, lon) {
  const P = ecef(lat, lon), rel = sub(P, cam.C), z = dot(rel, cam.f);
  return [W / 2 + dot(rel, cam.r) / z * cam.F, H / 2 - dot(rel, cam.u) / z * cam.F, z > 0 && dot(rel, P) < 0];
}
const kmPerPx = (cam) => (cam.alt) / cam.F;

// ---------- story ----------
const TOWN = { lat: 36.5452, lon: 31.9948 };
const VEN = [ // made-up venues on plausible streets of the real town
  // one reward per venue: points OR a stamp, never both
  { name: 'Kale Sofrası', lat: 36.5405, lon: 31.9958, pts: 45, t: 3.9 },
  { name: 'Palm & Bean', lat: 36.5492, lon: 31.9871, stamp: true, t: 6.7 },   // its own stamp card: 7/8 → 8/8
  { name: 'Şeker Fırın', lat: 36.5468, lon: 32.0005, pts: 60, t: 9.5 },
];
const BRACKET_T = [3.0, 6.0, 8.8], PASS_T = [3.4, 6.2, 9.0];
const LEG = [[4.6, 5.8], [7.4, 8.6]];
const T105 = 10.3, FULL = [12.0, 13.0], TITLE_T = 13.2;
const hav = (a, b) => { const dl = (b.lat - a.lat) * D2R, dn = (b.lon - a.lon) * D2R, s = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * D2R) * Math.cos(b.lat * D2R) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };
const LEG_KM = [hav(VEN[0], VEN[1]), hav(VEN[1], VEN[2])];

// camera keys: orbit over the eastern Mediterranean, a log dive to the town, a locked week, a pull-back to the coast
const kLat = monotone([[0, 33.2], [0.6, 33.5], [1.5, 36.35], [2.1, TOWN.lat], [2.8, TOWN.lat], [10.6, TOWN.lat + .0006], [12.4, 36.548], [16, 36.548]]);
const kLon = monotone([[0, 29.6], [0.6, 30.0], [1.5, 31.85], [2.1, TOWN.lon], [2.8, TOWN.lon], [10.6, TOWN.lon + .0006], [12.4, 31.998], [16, 31.999]]);
const kTilt = monotone([[0, 52], [0.6, 52], [2.4, 6], [2.8, 0], [16, 0]]);
const kHead = monotone([[0, 8], [2.8, -4], [10.6, 3], [16, 5]]);
const logD = monotone([[0, Math.log(5200)], [0.6, Math.log(4800)], [2.8, Math.log(14)], [10.6, Math.log(12.5)], [12.4, Math.log(31)], [16, Math.log(29)]]);
const camAt = (t) => makeCamera({ lat: kLat(t), lon: kLon(t), d: Math.exp(logD(t)), tilt: kTilt(t), heading: kHead(t) });

// ---------- WebGL2: the globe, the plates, the grade ----------
const gl = document.getElementById('gl').getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
const VS = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`;
const FS = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uF; uniform vec3 uR, uU, uFw, uC; uniform float uC2;
uniform sampler2D t0, t1, t2, t3; uniform vec4 b0, b1, b2, b3; uniform float uRegW;
uniform float uGrey, uShade, uFull, uPass, uPassAmt, uTime, uDim;
uniform vec4 uBloom[3];
out vec4 o;
const float R = 6371.0088;
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
vec2 uvOf(vec4 b, float lon, float lat){ return vec2((lon - b.x) / (b.z - b.x), (b.w - lat) / (b.w - b.y)); }
float inside(vec4 b, float lon, float lat, float fe){ return smoothstep(b.x, b.x + fe, lon) * smoothstep(b.z, b.z - fe, lon) * smoothstep(b.y, b.y + fe, lat) * smoothstep(b.w, b.w - fe, lat); }
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 dir = normalize(uFw * uF + uR * (px.x - uRes.x * .5) - uU * (px.y - uRes.y * .5));
  float b = dot(dir, -uC), disc = b * b - uC2;
  vec3 col;
  if (disc < 0. || b < 0.) {   // space: stars and a thin atmosphere rim
    float dmin = sqrt(max(0., dot(uC, uC) - b * b));
    float rim = b > 0. ? exp(-max(0., dmin - R) / 70.) : 0.;
    vec2 sp = px / 3.; float s = h21(floor(sp)); col = vec3(.012, .016, .028) + vec3(.9) * step(.9965, s) * (.4 + .6 * h21(floor(sp) + 3.));
    col += vec3(.35, .6, 1.) * rim * .85;
  } else {
    float tt = uC2 / (b + sqrt(disc));
    vec3 P = uC + tt * dir; float lat = degrees(asin(clamp(P.z / length(P), -1., 1.))), lon = degrees(atan(P.y, P.x));
    vec3 c = texture(t0, uvOf(b0, lon, lat)).rgb;
    float w1 = inside(b1, lon, lat, .6); c = mix(c, texture(t1, uvOf(b1, lon, lat)).rgb, w1);
    vec4 b2v = vec4(uRegW, b2.yzw);
    float w2 = inside(b2v, lon, lat, .04); vec3 c2 = texture(t2, uvOf(b2, lon, lat)).rgb * 1.08; c = mix(c, c2, w2);
    float w3 = inside(b3, lon, lat, .006); c = mix(c, texture(t3, uvOf(b3, lon, lat)).rgb * 1.08, w3);
    // limb shading at orbit
    vec3 n = normalize(P); c *= mix(1., pow(max(0., dot(n, -dir)), .35), uShade);
    // the analyst's grade: blue-black to cool silver, a fifth of the chroma
    float l = dot(c, vec3(.2126, .7152, .0722));
    float g = smoothstep(.015, .62, pow(l, .9));
    vec3 grey = mix(vec3(.027, .043, .055), vec3(.56, .585, .595), g);
    grey = mix(grey, c, .18);
    // colour returns: around each visited venue (a ragged circle), and everywhere below the last pass
    float back = 0.;
    for (int i = 0; i < 3; i++) {
      vec4 bl = uBloom[i]; if (bl.z <= 0.) continue;
      float dx = (lon - bl.x) * 111.32 * cos(radians(bl.y)), dy = (lat - bl.y) * 110.57;
      float dk = length(vec2(dx, dy)) + (vn(vec2(lon, lat) * 9000.) - .5) * .09;
      back = max(back, 1. - smoothstep(bl.z - .05, bl.z, dk));
    }
    back = max(back, smoothstep(uFull - 40., uFull + 40., px.y));
    col = mix(c * 1.04, grey, uGrey * (1. - back));
  }
  // a satellite pass: a soft bright band moving down the frame
  float band = exp(-pow((px.y - uPass) / 70., 2.)) * uPassAmt;
  col += vec3(.75, .8, .85) * band * .22;
  col *= 1. - .3 * smoothstep(.45, 1.2, length((px / uRes - .5) * vec2(1.3, 1.)));   // vignette
  col *= uDim;
  o = vec4(pow(col, vec3(1. / 1.0)), 1.);
}`;
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
const aL = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(aL); gl.vertexAttribPointer(aL, 2, gl.FLOAT, false, 0, 0);
const U = (n) => gl.getUniformLocation(prog, n);
gl.viewport(0, 0, W, H); gl.uniform2f(U('uRes'), W, H);

const PLATES = ['world', 'med', 'region', 'town'];
let BOX = null;
function loadTex(unit, src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => {
    const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const ext = gl.getExtension('EXT_texture_filter_anisotropic'); if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.uniform1i(U('t' + unit), unit); res(); }; im.onerror = rej; im.src = src; });
}

// ---------- events for the score ----------
const EV = [{ t: 0, type: 'orbit' }, { t: 0.4, type: 'ping' }, { t: 0.6, type: 'dive' }, { t: 2.8, type: 'settle' }];
BRACKET_T.forEach((t, i) => EV.push({ t, type: 'bracket', i }));
PASS_T.forEach((t, i) => EV.push({ t, type: 'pass', i }));
VEN.forEach((v, i) => EV.push({ t: v.t, type: 'visit', i, pts: v.pts || 0, stamp: !!v.stamp }));
LEG.forEach(([a, b], i) => EV.push({ t: a, type: 'line', i, dur: b - a }, { t: b, type: 'range', i }));
EV.push({ t: VEN[1].t + .4, type: 'stamp' }, { t: 10.0, type: 'suck' }, { t: T105, type: 'hit105' }, { t: 10.6, type: 'pull' }, { t: FULL[0], type: 'full' },
  { t: TITLE_T, type: 'title' }, { t: 13.8, type: 'logo' }, { t: 14.0, type: 'fox' });
EV.sort((a, b) => a.t - b.t);

// ---------- the 2D layer: hairlines, brackets, readings, instruments ----------
const ov = document.getElementById('ov').getContext('2d');
const WHITE = '#f2f5f6', ACC = '#ff7a2e', MONO = '"IBM Plex Mono", "Jost", monospace', COND = '"Barlow Condensed", "Jost", sans-serif';
const logo = new Image(); logo.src = 'assets/locca-logo.png';
const fox = new Image(); fox.src = 'assets/fox-sit-wink-cut.png';
function txt(s, x, y, font, col, align = 'left', alpha = 1, spacing = 0) {
  ov.save(); ov.globalAlpha = alpha; ov.font = font; ov.textAlign = align; ov.letterSpacing = `${spacing}px`;
  ov.shadowColor = 'rgba(0,0,0,.85)'; ov.shadowBlur = 8; ov.fillStyle = col; ov.fillText(s, x, y); ov.restore();
}
function hair(pts, col = WHITE, w = 2.2, dash = null, alpha = 1) {
  ov.save(); ov.globalAlpha = alpha; ov.lineCap = 'round'; ov.lineJoin = 'round'; if (dash) ov.setLineDash(dash);
  ov.strokeStyle = 'rgba(0,0,0,.55)'; ov.lineWidth = w + 3; ov.beginPath(); pts.forEach(([x, y], i) => (i ? ov.lineTo(x, y) : ov.moveTo(x, y))); ov.stroke();
  ov.strokeStyle = col; ov.lineWidth = w; ov.stroke(); ov.restore();
}
function brackets(x, y, s, u, col = WHITE) { // s = half size; u = 0..1 snap with overshoot
  const k = s * (1 + .5 * (1 - u) + .12 * Math.sin(u * Math.PI)), a = s * .45;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => hair([[x + sx * k, y + sy * (k - a)], [x + sx * k, y + sy * k], [x + sx * (k - a), y + sy * k]], col, 2.4, null, u));
}

function render(t) {
  const cam = camAt(t);
  gl.uniform3f(U('uR'), ...cam.r); gl.uniform3f(U('uU'), ...cam.u); gl.uniform3f(U('uFw'), ...cam.f); gl.uniform3f(U('uC'), ...cam.C);
  gl.uniform1f(U('uC2'), cam.c2); gl.uniform1f(U('uF'), cam.F);
  gl.uniform1f(U('uGrey'), ss(seg(t, 1.6, 2.8))); gl.uniform1f(U('uShade'), 1 - ss(seg(t, .6, 2.2)));
  // colour back around each venue (a ragged circle growing to 0.45 km), and the last pass from the bottom up
  const blooms = VEN.map((v) => [v.lon, v.lat, .32 * eo(seg(t, v.t, v.t + .7)), 0]).flat();
  gl.uniform4fv(U('uBloom'), new Float32Array(blooms));
  gl.uniform1f(U('uFull'), t < FULL[0] ? H + 200 : lerp(H + 60, -60, eio(seg(t, FULL[0], FULL[1]))));
  // passes: a band down the frame in 0.5 s
  let pass = -999, pAmt = 0; PASS_T.forEach((p) => { if (t >= p && t < p + .55) { pass = lerp(-80, H + 80, (t - p) / .55); pAmt = 1; } });
  gl.uniform1f(U('uPass'), pass); gl.uniform1f(U('uPassAmt'), pAmt);
  gl.uniform1f(U('uDim'), 1 - .22 * ss(seg(t, TITLE_T - .2, TITLE_T + .6)));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  ov.clearRect(0, 0, W, H);
  const P = (v) => project(cam, v.lat, v.lon);
  // instruments: altitude top-left, scale bar and credit bottom-left
  const alt = cam.alt, altS = alt >= 100 ? `${Math.round(alt).toLocaleString('tr-TR')} km` : `${alt.toFixed(1).replace('.', ',')} km`;
  txt(`ALT ${altS}`, 56, 108, `500 30px ${MONO}`, WHITE, 'left', .95, 1);
  txt(`${(t < 2.8 ? kLat(t) : TOWN.lat).toFixed(3)}° K  ${(t < 2.8 ? kLon(t) : TOWN.lon).toFixed(3)}° D`.replace('K', LANG === 'tr' ? 'K' : 'N').replace('D', LANG === 'tr' ? 'D' : 'E'), 56, 150, `500 24px ${MONO}`, WHITE, 'left', .7);
  { const kpp = kmPerPx(cam), nice = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000], target = 240 * kpp, km = nice.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
    const len = km / kpp; hair([[56, 1760], [56, 1772], [56 + len, 1772], [56 + len, 1760]], WHITE, 2.2);
    txt(km >= 1 ? `${km} km` : `${Math.round(km * 1000)} m`, 56 + len + 14, 1778, `500 24px ${MONO}`, WHITE); }
  txt(t < 1.6 ? 'NASA Blue Marble' : 'Contains modified Copernicus Sentinel data 2025', 56, 1846, `500 21px ${MONO}`, '#c8cfd4', 'left', .8);
  // the target over Alanya while we dive
  if (t >= .4 && t < 2.8) { const [x, y] = P(TOWN), r = 26 + 6 * Math.sin(t * 10); ov.save(); ov.globalAlpha = 1 - ss(seg(t, 2.3, 2.8));
    ov.strokeStyle = ACC; ov.lineWidth = 3; ov.beginPath(); ov.arc(x, y, r, 0, Math.PI * 2); ov.stroke(); ov.fillStyle = ACC; ov.beginPath(); ov.arc(x, y, 5, 0, Math.PI * 2); ov.fill(); ov.restore();
    txt('ALANYA', x + 40, y + 10, `600 40px ${COND}`, WHITE, 'left', ss(seg(t, .5, .9)), 4); }
  // pass labels at the top centre
  PASS_T.forEach((p, i) => { if (t >= p - .05 && t < p + 1.6) txt(COPY.pass(i + 1, COPY.days[i]), W / 2, 230, `500 28px ${MONO}`, WHITE, 'center', ss(seg(t, p - .05, p + .1)) * (1 - ss(seg(t, p + 1.3, p + 1.6))), 2); });
  // the route lines (dashed: a history, not a measurement of the ground), ticks every 100 m, the distance at the tip
  LEG.forEach(([a, b], i) => {
    if (t < a) return; const u = eio(seg(t, a, b)), A = VEN[i], B = VEN[i + 1];
    const tip = { lat: lerp(A.lat, B.lat, u), lon: lerp(A.lon, B.lon, u) }, [x0, y0] = P(A), [x1, y1] = P(tip);
    const fade = t > 12.4 ? 1 - ss(seg(t, 12.4, 13)) : 1;
    hair([[x0, y0], [x1, y1]], WHITE, 2.4, [14, 10], fade);
    const n = Math.floor(LEG_KM[i] * 10 * u); for (let k = 1; k <= n; k++) { const f = k / (LEG_KM[i] * 10), q = P({ lat: lerp(A.lat, B.lat, f), lon: lerp(A.lon, B.lon, f) });
      const dx = y1 - y0, dy = -(x1 - x0), L = Math.hypot(dx, dy) || 1; hair([[q[0] - dx / L * 8, q[1] - dy / L * 8], [q[0] + dx / L * 8, q[1] + dy / L * 8]], WHITE, 1.8, null, fade); }
    if (t < b + 1.8 && t < 12.4 && u > .08) txt(COPY.km(LEG_KM[i] * u), x1 + 26, y1 - 30, `500 28px ${MONO}`, WHITE, 'left', ss(seg(u, .08, .2)) * (1 - ss(seg(t, b + 1.4, b + 1.8))));
  });
  // brackets and venue labels
  VEN.forEach((v, i) => {
    const t0 = BRACKET_T[i]; if (t < t0) return; const [x, y] = P(v), u = eo(seg(t, t0, t0 + .25)), fade = t > 12.4 ? 1 - ss(seg(t, 12.4, 13)) : 1;
    ov.save(); ov.globalAlpha = fade; brackets(x, y, 34, u, t >= v.t ? ACC : WHITE); ov.restore();
    txt(v.name, x, y + 78, `600 38px ${COND}`, WHITE, 'center', u * fade, 1);
    // the visit: a reading in Locca orange with its label, leader line up and right
    if (t >= v.t && t < v.t + 2.2) {
      const a = eo(seg(t, v.t, v.t + .25)) * (1 - ss(seg(t, v.t + 1.9, v.t + 2.2))), lx = x + 60, ly = y - 120;
      hair([[x + 26, y - 26], [lx, ly + 12]], ACC, 2.2, null, a);
      txt(COPY.visit, lx + 6, ly - 60, `500 24px ${MONO}`, WHITE, 'left', a, 2);
      const big = v.stamp ? (t < v.t + .4 ? '7/8' : '8/8') : `+${v.pts}`, word = v.stamp ? COPY.stamp : COPY.pts;
      const pop8 = v.stamp && t >= v.t + .4 ? 1 + .15 * Math.exp(-10 * (t - v.t - .4)) : 1;
      ov.save(); ov.translate(lx + 4, ly + 10); ov.scale(pop8, pop8); txt(big, 0, 0, `300 104px ${COND}`, v.stamp && t < v.t + .4 ? WHITE : ACC, 'left', a); ov.restore();
      ov.font = `300 104px ${COND}`; const nw = ov.measureText(big).width;
      txt(word, lx + 4 + nw + 12, ly + 6, `600 34px ${COND}`, ACC, 'left', a, 2);
    }
  });
  // the Loccard counter: top right, rolls to each new total and lands
  if (t >= 3.9) {
    const totals = [[3.9, 45], [T105, 105]]; let prev = 0, cur = 0, land = 0;
    totals.forEach(([tt, v]) => { if (t >= tt) { prev = cur; cur = v; land = tt; } });
    const roll = seg(t, land, land + (cur === 105 ? .25 : .5)), val = Math.round(lerp(prev, cur, eo(roll)));
    const big = cur === 105 ? 1 + .12 * Math.exp(-9 * Math.max(0, t - T105 - .25)) * (t > T105 + .25 ? 1 : 0) : 1, fade = 1 - ss(seg(t, TITLE_T - .3, TITLE_T + .2));
    txt(COPY.card, W - 56, 300, `500 26px ${MONO}`, WHITE, 'right', fade, 4);
    ov.save(); ov.translate(W - 56, 430); ov.scale(big, big); txt(String(val), 0, 0, `300 ${cur === 105 && t > T105 ? 168 : 132}px ${COND}`, ACC, 'right', fade); ov.restore();
    txt(COPY.pts, W - 56, 476, `600 32px ${COND}`, ACC, 'right', fade, 4);
    // the stamp lives on its own card, under the points
    const st = VEN[1].t + .4; if (t >= st) { const a = eo(seg(t, st, st + .3)) * fade;
      hair([[W - 300, 512], [W - 56, 512]], WHITE, 1.6, null, a * .7);
      txt(VEN[1].name.toUpperCase(), W - 56, 556, `500 24px ${MONO}`, WHITE, 'right', a, 2);
      txt(`8/8 ${COPY.stamp}`, W - 56, 610, `600 44px ${COND}`, ACC, 'right', a, 3); }
  }
  // the title card: the brand line, the logo, the fox
  if (t >= TITLE_T) {
    [COPY.l1, COPY.l2].forEach((parts, li) => {
      const a = eo(seg(t, TITLE_T + li * .35, TITLE_T + li * .35 + .4)), y = 820 + li * 128 + 30 * (1 - a);
      ov.save(); ov.font = `600 122px ${COND}`; ov.letterSpacing = '2px'; const w0 = ov.measureText(parts[0]).width, w1 = ov.measureText(parts[1]).width; ov.restore();
      const x0 = W / 2 - (w0 + w1) / 2; txt(parts[0], x0, y, `600 122px ${COND}`, WHITE, 'left', a, 2); txt(parts[1], x0 + w0, y, `600 122px ${COND}`, ACC, 'left', a, 2);
    });
    if (t >= 13.8 && logo.complete) { const u = eo(seg(t, 13.8, 14.2)), w = 280, h = w * logo.naturalHeight / logo.naturalWidth; ov.save(); ov.globalAlpha = u; ov.drawImage(logo, W / 2 - w / 2, 1060, w, h); ov.restore(); }
    if (t >= 14.0 && fox.complete) { const u = eo(seg(t, 14.0, 14.35)), h = 520 * (.85 + .15 * u), w = h * fox.naturalWidth / fox.naturalHeight; ov.save(); ov.globalAlpha = u; ov.drawImage(fox, W - w - 40, 1700 - h + 40 * (1 - u), w, h); ov.restore(); }
  }
}

window.DUR = DUR;
window.EV = EV;
window.render = render;
window.TEXTS = (t) => (t >= TITLE_T ? [{ id: 'title', text: COPY.l1.join('') + ' ' + COPY.l2.join(''), x0: 80, y0: 720, x1: 1000, y1: 980 }] : []);
fetch('assets/plates/plates.json').then((r) => r.json()).then(async (box) => {
  BOX = box; PLATES.forEach((p, i) => gl.uniform4f(U('b' + i), ...box[p]));
  gl.uniform1f(U('uRegW'), 31.885);   // the region scene starts at 31.875° E
  await Promise.all(PLATES.map((p, i) => loadTex(i, `assets/plates/${p}.jpg`)));
  await Promise.all([document.fonts.load(`300 100px "Barlow Condensed"`), document.fonts.load(`600 100px "Barlow Condensed"`), document.fonts.load(`500 30px "IBM Plex Mono"`), document.fonts.ready,
    new Promise((r) => (logo.complete ? r() : (logo.onload = r))), new Promise((r) => (fox.complete ? r() : (fox.onload = r)))]);
  render(0); window.READY = true;
});
