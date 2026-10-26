// Locca Sofra — a wordless low-poly homage to a quiet, tense floor-meal scene (12 s, 16:9 with 2.39 bars).
// Flat-shaded low-poly geometry under one warm tungsten source, perspective lenses with real depth of field
// (blurred foreground shoulders), GTAO, an earthy grade. No score: room tone, wind, a clock, chewing.
// Five foxes around a low sofra; the Locca fox in the middle lays his phone down and its orange light takes the room.
import * as THREE from 'three';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, eo, ei, eio, back, mulberry, hash, TAU } from '/core/lib.js';

const W = 1920, H = 804, FPS = 24, DUR = 12;
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: false, preserveDrawingBuffer: true });
renderer.setSize(W, H, false); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ov = document.getElementById('ov').getContext('2d');
const scene = new THREE.Scene(); scene.background = new THREE.Color('#0d0906');
const camera = new THREE.PerspectiveCamera(32, W / H, .05, 40);
const post = makePost(renderer, scene, camera, W, H, { ssaa: 1, ao: true, aoRadius: .18, aoAmt: .8 });
post.dof.maxCoc = 22;
post.bloom.strength = .18; post.bloom.threshold = .9;
Object.assign(post.vig.uniforms, {});
post.vig.uniforms.amt.value = .6; post.vig.uniforms.warm.value = .45; post.vig.uniforms.sat.value = 1.0; post.vig.uniforms.contrast.value = .32;

// ---------- materials ----------
const R = mulberry(17);
const MAT = {};
const mat = (col, o = {}) => new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: o.r ?? .9, metalness: o.m ?? 0, map: o.map ?? null, emissive: o.e ?? '#000000', emissiveIntensity: o.ei ?? 1 });
function mesh(geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], parent = scene) {
  const o = new THREE.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.scale.set(...s);
  o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}
const grp = (p = [0, 0, 0], parent = scene) => { const g = new THREE.Group(); g.position.set(...p); parent.add(g); return g; };
// jitter a geometry's vertices a little, so planes read as hand-plastered facets
function jitter(geo, a, seed = 3) {
  const r = mulberry(seed), pos = geo.attributes.position, key = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!key.has(k)) key.set(k, [(r() - .5) * a, (r() - .5) * a, (r() - .5) * a]);
    const d = key.get(k); pos.setXYZ(i, pos.getX(i) + d[0], pos.getY(i) + d[1], pos.getZ(i) + d[2]);
  }
  geo.computeVertexNormals(); return geo;
}
// painted cloth: white embroidered sedir cover with purple roses and green leaves; dark floor cushions with cream flowers
function clothTex(kind) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); const r = mulberry(kind === 'lace' ? 5 : 9);
  if (kind === 'lace') {
    g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 7; i++) {
      const x = 40 + i * 72, y = 120 + (i % 2) * 30;
      g.fillStyle = '#4a7a3a'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + (k - 1.5) * 18, y + 18, 9, 4, k, 0, TAU); g.fill(); }
      g.fillStyle = '#6a3a8a'; g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill(); g.fillStyle = '#9a6ab8'; g.beginPath(); g.arc(x - 3, y - 3, 7, 0, TAU); g.fill();
    }
    g.fillStyle = '#f2ece0'; for (let x = 0; x < 512; x += 24) { g.beginPath(); g.arc(x + 12, 250, 12, 0, Math.PI, true); g.fill(); }
  } else {
    g.fillStyle = kind === 'rug' ? '#2a1a14' : '#1c1612'; g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 30; i++) {
      const x = r() * 512, y = r() * 256, s = 8 + r() * 10;
      g.fillStyle = kind === 'rug' ? '#7a3a22' : '#d8d0c0';
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * s, y + Math.sin(a) * s, s * .7, s * .4, a, 0, TAU); g.fill(); }
      g.fillStyle = kind === 'rug' ? '#c88a3a' : '#e8803a'; g.beginPath(); g.arc(x, y, s * .4, 0, TAU); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ---------- the room ----------
const wallM = mat('#9a7a52');
mesh(jitter(new THREE.PlaneGeometry(9, 4, 22, 10), .06, 4), wallM, [0, 2, -2.1]);
mesh(jitter(new THREE.PlaneGeometry(6, 4, 14, 10), .06, 6), wallM, [-3.6, 2, 0.2], [0, Math.PI / 2.6, 0]);
mesh(jitter(new THREE.PlaneGeometry(6, 4, 14, 10), .06, 7), wallM, [3.6, 2, 0.2], [0, -Math.PI / 2.6, 0]);
const rugT = clothTex('rug'); rugT.repeat.set(3, 3);
mesh(jitter(new THREE.PlaneGeometry(9, 8, 16, 14), .015, 8), mat('#ffffff', { map: rugT }), [0, 0, .2], [-Math.PI / 2, 0, 0]);
// the sedir along the back wall: a low bench, a lace cover, floral cushions
const laceT = clothTex('lace'); laceT.repeat.set(3, 1);
mesh(new THREE.BoxGeometry(6.4, .42, .7, 8, 1, 2), mat('#3a2a20'), [0, .21, -1.72]);
mesh(jitter(new THREE.BoxGeometry(6.4, .5, .08, 16, 2, 1), .01, 9), mat('#ffffff', { map: laceT }), [0, .78, -2.02]);
const cushT = clothTex('cush'); cushT.repeat.set(2, 1);
for (let i = 0; i < 5; i++) mesh(jitter(new THREE.BoxGeometry(1.2, .14, .62, 4, 1, 3), .02, 20 + i), mat('#ffffff', { map: cushT }), [-2.6 + i * 1.3, .5, -1.7]);
// a small shelf with a cloth and a lamp glass on the left wall (a corner of interest, as in the reference)
mesh(new THREE.BoxGeometry(.5, .05, .3), mat('#4a3424'), [-2.5, 1.6, -1.9]);
mesh(new THREE.CylinderGeometry(.06, .09, .22, 6), mat('#c8c0b0', { r: .4 }), [-2.5, 1.74, -1.9]);

// ---------- the sofra ----------
const sofra = grp([0, 0, .25]);
mesh(new THREE.CylinderGeometry(.62, .62, .04, 18), mat('#5a3a22'), [0, .2, 0], [0, 0, 0], [1, 1, 1], sofra);
mesh(new THREE.CylinderGeometry(.5, .56, .18, 9, 1, true), mat('#3a2616'), [0, .09, 0], [0, 0, 0], [1, 1, 1], sofra);
mesh(new THREE.CylinderGeometry(.62, .62, .012, 18), mat('#9a8a70'), [0, .225, 0], [0, 0, 0], [1, 1, 1], sofra);   // the cloth
// the big plate of lamb in the middle, bread, tea glasses, a bowl
mesh(new THREE.CylinderGeometry(.22, .17, .03, 12), mat('#d8d0c4', { r: .5 }), [0, .25, 0], [0, 0, 0], [1, 1, 1], sofra);
const MEAT = [];
for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + R(), rr = .05 + R() * .1; MEAT.push(mesh(new THREE.IcosahedronGeometry(.045 + R() * .02, 0), mat(['#6a3418', '#7a4220', '#5a2a12'][i % 3], { r: .6 }), [Math.cos(a) * rr, .29, Math.sin(a) * rr], [R() * 3, R() * 3, R() * 3], [1, .7, 1.2], sofra)); }
for (const [x, z] of [[-.38, -.1], [.36, .14], [-.1, .42]]) mesh(new THREE.CylinderGeometry(.12, .12, .025, 8), mat('#d8a860'), [x, .25, z], [0, R(), 0], [1, 1, 1], sofra);
for (const [x, z] of [[.3, -.3], [-.32, .3], [.42, .34], [-.4, -.36]]) {
  mesh(new THREE.CylinderGeometry(.03, .022, .08, 7), mat('#8a2a10', { r: .2 }), [x, .275, z], [0, 0, 0], [1, 1, 1], sofra);
  mesh(new THREE.CylinderGeometry(.04, .04, .006, 8), mat('#c8b8a0', { r: .3, m: .4 }), [x, .234, z], [0, 0, 0], [1, 1, 1], sofra);
}
mesh(new THREE.SphereGeometry(.09, 8, 4, 0, TAU, Math.PI / 2, Math.PI / 2), mat('#e8e4dc'), [.18, .32, .3], [0, 0, 0], [1, 1, 1], sofra);

// ---------- the foxes ----------
// low-poly fox: faceted head with a snout, cream muzzle and cheek tufts, dark ear tips; clothes from boxes and cylinders
function fox(o) {
  const root = grp(o.p); root.rotation.y = o.ry ?? 0;
  const fur = mat(o.fur), cream = mat(o.cream ?? '#efe2cc'), tip = mat(o.tip ?? '#2a1a12'), cloth = mat(o.cloth), dark = mat('#120a08', { r: .4 });
  // crossed legs on the floor cushion
  mesh(new THREE.BoxGeometry(.9, .08, .7), mat('#ffffff', { map: cushT }), [0, .04, 0], [0, 0, 0], [1, 1, 1], root);
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(.09, .1, .5, 6), mat(o.trousers ?? '#4a3a2a'), [s * .12, .16, .16], [Math.PI / 2, 0, s * 1.15], [1, 1, 1], root);
  const body = grp([0, .2, 0], root);
  const torso = mesh(new THREE.CylinderGeometry(.19, .27, .56, 7), cloth, [0, .3, 0], [0, 0, 0], [1, 1, .85], body);
  for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(.035, .2, .03), mat(o.shirt ?? '#d8d0c0'), [s * .04, .5, .17], [-.2, 0, s * .45], [1, 1, 1], body);   // collar
  if (o.vest) mesh(new THREE.CylinderGeometry(.2, .26, .4, 7), mat(o.vest), [0, .32, .01], [0, 0, 0], [1.02, 1, .87], body);
  const neck = grp([0, .6, 0], body);
  mesh(new THREE.CylinderGeometry(.09, .11, .14, 6), fur, [0, .03, 0], [0, 0, 0], [1, 1, 1], neck);
  const head = grp([0, .2, 0], neck);
  mesh(new THREE.IcosahedronGeometry(.2, 1), fur, [0, 0, 0], [0, 0, 0], [1.08, .95, 1], head);
  // snout, muzzle, jaw, nose
  mesh(new THREE.ConeGeometry(.1, .24, 6), fur, [0, -.03, .2], [Math.PI / 2, 0, 0], [1, 1, .8], head);
  mesh(new THREE.IcosahedronGeometry(.12, 1), cream, [0, -.08, .12], [0, 0, 0], [1.25, .7, 1], head);
  const jaw = grp([0, -.1, .1], head);
  mesh(new THREE.ConeGeometry(.06, .18, 5), cream, [0, -.02, .09], [Math.PI / 2, 0, 0], [1, 1, .55], jaw);
  mesh(new THREE.IcosahedronGeometry(.032, 0), dark, [0, -.02, .33], [0, 0, 0], [1.2, .9, 1], head);
  for (const s of [-1, 1]) {
    mesh(new THREE.ConeGeometry(.07, .2, 4), cream, [s * .2, -.06, .02], [0, 0, s * Math.PI / 2.2], [1, 1, .6], head);   // cheek tufts
    const ear = grp([s * .13, .15, -.02], head); ear.rotation.z = -s * .35;
    mesh(new THREE.ConeGeometry(.085, .22, 4), fur, [0, .1, 0], [0, Math.PI / 4, 0], [1, 1, .55], ear);
    mesh(new THREE.ConeGeometry(.045, .09, 4), tip, [0, .18, 0], [0, Math.PI / 4, 0], [1, 1, .6], ear);
    mesh(new THREE.ConeGeometry(.05, .14, 3), cream, [0, .08, .025], [0, 0, 0], [1, 1, .3], ear);
  }
  // eyes with lids (lid 0 open … 1 shut) and brows
  const eyes = [], lids = [], brows = [];
  for (const s of [-1, 1]) {
    eyes.push(mesh(new THREE.IcosahedronGeometry(.032, 1), dark, [s * .085, .02, .17], [0, 0, 0], [1, 1.1, .6], head));
    mesh(new THREE.IcosahedronGeometry(.009, 0), mat('#ffffff', { e: '#ffffff', ei: .6 }), [s * .085 + .012, .035, .19], [0, 0, 0], [1, 1, 1], head);
    const lid = grp([s * .085, .02, .165], head); lids.push(lid);
    mesh(new THREE.SphereGeometry(.04, 6, 3, 0, TAU, 0, Math.PI / 2), fur, [0, 0, 0], [0, 0, 0], [1, 1, .7], lid);
    brows.push(mesh(new THREE.BoxGeometry(.07, .016, .02), mat(o.brow ?? o.tip ?? '#2a1a12'), [s * .085, .075, .175], [0, 0, 0], [1, 1, 1], head));
  }
  if (o.mustache) for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(.03, .12, 4), mat(o.mustache), [s * .05, -.07, .27], [0, 0, s * 1.9], [1, 1, .5], head);
  if (o.cap) { mesh(new THREE.SphereGeometry(.205, 9, 5, 0, TAU, 0, Math.PI / 2.1), mat(o.cap, { r: 1 }), [0, .03, -.01], [-.15, 0, 0], [1.07, 1, 1.02], head); mesh(new THREE.IcosahedronGeometry(.03, 0), mat(o.cap), [0, .23, -.04], [0, 0, 0], [1, 1, 1], head); }
  // arms: shoulder → elbow → paw, posed by angles
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = grp([s * .22, .5, 0], body);
    mesh(new THREE.CylinderGeometry(.065, .06, .26, 6), cloth, [0, -.13, 0], [0, 0, 0], [1, 1, 1], sh);
    const el = grp([0, -.26, 0], sh);
    mesh(new THREE.CylinderGeometry(.058, .05, .24, 6), cloth, [0, -.12, 0], [0, 0, 0], [1, 1, 1], el);
    const paw = mesh(new THREE.IcosahedronGeometry(.055, 0), fur, [0, -.26, 0], [0, 0, 0], [1, 1.1, .9], el);
    arms.push({ sh, el, paw });
  }
  return { root, body, neck, head, jaw, eyes, lids, brows, arms, torso };
}
// pose helpers: angles in radians
function pose(f, p) {
  f.body.rotation.x = p.lean ?? 0;
  f.head.rotation.set(p.pitch ?? 0, p.yaw ?? 0, p.roll ?? 0);
  f.jaw.rotation.x = p.jaw ?? 0;
  f.lids.forEach(l => { l.rotation.x = lerp(-1.6, 0, p.lid ?? .25); });
  f.brows.forEach((b, i) => { b.position.y = .075 + (p.browUp ?? 0) * .02; b.rotation.z = (i ? -1 : 1) * (p.browTilt ?? 0); });
  for (const [i, a] of [p.armL ?? [.2, -.3, -.6], p.armR ?? [.2, .3, -.6]].entries()) {
    const arm = f.arms[i]; arm.sh.rotation.set(a[0], 0, a[1]); arm.el.rotation.set(a[2], 0, 0);
  }
}
const F = {
  C: fox({ p: [0, 0, -1.0], ry: 0, fur: '#f2741e', cream: '#f4e6d0', cloth: '#2e2e2a', cap: '#6b4a30', trousers: '#5a4430', shirt: '#d8d0c0' }),
  L: fox({ p: [-1.0, 0, -.45], ry: .95, fur: '#8a7868', cloth: '#d8d4cc', vest: '#5a2418', mustache: '#2a2018', brow: '#2a2018', trousers: '#3a3430' }),
  R: fox({ p: [1.0, 0, -.4], ry: -1.0, fur: '#a29a92', cloth: '#1c2030', trousers: '#1c2030', shirt: '#3a4058' }),
  FL: fox({ p: [-.85, 0, 1.25], ry: 2.6, fur: '#6a5444', cloth: '#2a2420' }),
  FR: fox({ p: [.95, 0, 1.3], ry: -2.55, fur: '#7a5e4a', cloth: '#4a4640' }),
};
// the centre fox sits on the sedir edge, a little higher, like the reference
F.C.root.position.y = 0;

// a spoon for the eater, the phone for the Locca fox
const spoon = mesh(new THREE.BoxGeometry(.018, .16, .01), mat('#c8c4bc', { r: .3, m: .7 }), [0, -.3, .02], [0, 0, 0], [1, 1, 1], F.R.arms[0].el);
const phoneG = grp([0, 0, 0]);
mesh(new THREE.BoxGeometry(.11, .012, .22), mat('#1a1c22', { r: .35 }), [0, 0, 0], [0, 0, 0], [1, 1, 1], phoneG);
const pc = document.createElement('canvas'); pc.width = 256; pc.height = 512; const pg = pc.getContext('2d');
const phoneTex = new THREE.CanvasTexture(pc); phoneTex.colorSpace = THREE.SRGBColorSpace;
const screenM = new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false });
const screen = new THREE.Mesh(new THREE.PlaneGeometry(.098, .2), screenM); screen.rotation.x = -Math.PI / 2; screen.position.y = .007; phoneG.add(screen);
const phoneLight = new THREE.PointLight('#ff6a1a', 0, 2.2, 1.6); phoneG.add(phoneLight); phoneLight.position.set(0, .34, .05);

// ---------- light: one tungsten source above the sofra, a weak warm bounce ----------
const key = new THREE.SpotLight('#ffd9b0', 36, 9, .95, .85, 1.7); key.position.set(.6, 2.9, 1.0); key.target.position.set(0, .4, -.3); key.castShadow = true;
key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -.0005; scene.add(key, key.target);
const bulb = new THREE.PointLight('#ff9a50', 3.0, 7, 1.8); bulb.position.set(-1.2, 2.4, 1.8); scene.add(bulb);
scene.add(new THREE.HemisphereLight('#7a6a5a', '#1a140e', .5));

// ---------- the phone screen (drawn per frame) ----------
let LOGO = null;
function drawPhone(t) {
  pg.fillStyle = '#0e1226'; pg.fillRect(0, 0, 256, 512);
  const on = seg(t, 8.2, 8.5);
  if (on > 0) {
    pg.globalAlpha = on;
    const gr = pg.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#1d2550'); gr.addColorStop(1, '#0a0e20'); pg.fillStyle = gr; pg.fillRect(0, 0, 256, 512);
    if (LOGO) pg.drawImage(LOGO, 38, 90, 180, 61);
    const k = seg(t, 8.9, 9.3);
    if (k > 0) {
      const s = back(k, 2.4);
      pg.save(); pg.translate(128, 300); pg.scale(s, s);
      pg.fillStyle = '#ff5b00'; pg.beginPath(); pg.roundRect(-100, -60, 200, 120, 18); pg.fill();
      pg.fillStyle = '#ffb070'; pg.beginPath(); pg.arc(-52, 0, 30, 0, TAU); pg.fill(); pg.strokeStyle = '#ff5b00'; pg.lineWidth = 5; pg.beginPath(); pg.arc(-52, 0, 19, 0, TAU); pg.stroke();
      pg.font = 'italic 800 64px BSC'; pg.textAlign = 'center'; pg.textBaseline = 'middle'; pg.fillStyle = '#fff4e4'; pg.fillText('+45', 38, 4);
      pg.restore();
    }
    pg.globalAlpha = 1;
  }
  phoneTex.needsUpdate = true;
  screenM.color.setScalar(.25 + 1.05 * on);
  phoneLight.intensity = 4.2 * on * (1 + .04 * Math.sin(t * 9));
}

// ---------- shots ----------
// [t0, camera from, camera to, look-at from, look-at to, fov, focus distance]
const SHOTS = [
  { t: [0, 3.5], p: [[0, 1.02, 2.75], [0, 1.0, 2.45]], at: [[0, .95, -.8], [0, .95, -.8]], fov: 30 },          // wide over-shoulder, the circle
  { t: [3.5, 5.5], p: [[-.55, .98, 1.5], [-.5, .98, 1.4]], at: [[.95, .98, -.35], [.95, .98, -.35]], fov: 28 },   // on the eater; everyone stares
  { t: [5.5, 8.0], p: [[.2, 1.05, 1.15], [.16, 1.05, .95]], at: [[0, 1.12, -1.0], [0, 1.1, -1.0]], fov: 26 },     // the Locca fox looks up
  { t: [8.0, 10.0], p: [[.06, .78, .42], [.05, .72, .36]], at: [[0, .24, -.14], [0, .24, -.15]], fov: 30 },          // the phone on the sofra
  { t: [10.0, 11.2], p: [[0, .98, 2.35], [0, .98, 2.2]], at: [[0, .85, -.6], [0, .85, -.6]], fov: 30 },            // everyone leans in
];
const V = (a, b, u) => a.map((x, i) => lerp(x, b[i], u));
function shotAt(t) { for (const s of SHOTS) if (t >= s.t[0] && t < s.t[1]) return s; return null; }

function posesAt(t) {
  const tw = Math.floor(t * 24) / 24;
  // the eater (R): spoon up, chew, spoon again; stops dead when he feels the stares
  const chew = t < 4.3 ? Math.max(0, Math.sin(t * 2 * Math.PI * 2.6)) * .22 * (t > 1.1 ? 1 : 0) : 0;
  const spoonUp = Math.max(Math.sin(Math.PI * seg(t, .5, 1.3)), Math.sin(Math.PI * seg(t, 2.3, 3.1)));
  pose(F.R, { lean: .25 - .1 * spoonUp, pitch: .25 - .2 * spoonUp, yaw: t > 4.3 && t < 5.5 ? .25 * Math.sign(Math.sin(t * 5)) : 0, jaw: chew + (spoonUp > .7 ? .25 : 0), lid: .45,
    armL: [lerp(.4, 1.6, spoonUp), lerp(-.2, .1, spoonUp), lerp(-.5, -2.2, spoonUp)], armR: [.3, .3, -.7] });
  // the mustached fox (L): bent over his bread, then glances at the eater
  const look = seg(t, 3.5, 3.9);
  pose(F.L, { lean: .35, pitch: lerp(.35, .1, look), yaw: lerp(0, -.5, look), jaw: t < 3 ? .1 * Math.max(0, Math.sin(t * 13)) : 0, lid: .4, browTilt: .1,
    armR: [lerp(.6, 1.2, Math.sin(Math.PI * seg(t, 1.2, 2.4))), .2, -1.4], armL: [.4, -.3, -.8] });
  // the Locca fox (C): still, eyes down; looks at the eater; then up, calm, a small smile; lays the phone down
  const up = seg(t, 5.8, 6.6), reach = seg(t, 6.6, 7.2), lay = seg(t, 7.2, 7.9);
  const cp = { lean: .05, pitch: t < 3.5 ? .3 : t < 5.5 ? .12 : lerp(.12, -.05, eio(up)), yaw: t >= 3.5 && t < 5.5 ? -.35 : 0, lid: t < 5.8 ? .5 : lerp(.5, .38, up), browUp: up * .6, jaw: 0,
    armL: [.3, -.25, -.9], armR: [.3, .25, -.9] };
  if (t >= 6.6) { const u = reach < 1 ? eio(reach) : 1 - eio(lay); cp.armR = [lerp(.3, .9, u) + lerp(0, .9, eio(lay)), lerp(.25, -.3, u), lerp(-.9, -2.2, u) + .9 * eio(lay)]; }
  if (t >= 8.0) { cp.pitch = .25; cp.lean = .15; cp.armR = [1.2, .1, -.4]; }
  if (t >= 10.0) { cp.pitch = .05; cp.lean = .1; cp.lid = .35; cp.browUp = .8; cp.armR = [.3, .25, -.9]; }
  pose(F.C, cp);
  // foreground shoulders: breathe; everyone leans in at the end
  const lean = eio(seg(t, 9.4, 10.4));
  pose(F.FL, { lean: .1 + .3 * lean, pitch: .2 + .2 * lean });
  pose(F.FR, { lean: .1 + .3 * lean, pitch: .25 + .2 * lean });
  if (lean > 0) { F.L.body.rotation.x += .2 * lean; F.L.head.rotation.y = lerp(F.L.head.rotation.y, .2, lean); F.L.head.rotation.x = .35 * lean;
    F.R.body.rotation.x += .2 * lean; F.R.head.rotation.y = lerp(F.R.head.rotation.y, -.15, lean); F.R.head.rotation.x = .4 * lean; }
  // the phone: hidden in the jacket, then in the paw, then flat on the sofra
  if (t < 7.0) phoneG.visible = false;
  else {
    phoneG.visible = true;
    const pawW = new THREE.Vector3(); F.C.arms[1].paw.getWorldPosition(pawW);
    const dest = new THREE.Vector3(0, .238, -.16);
    const u = eio(seg(t, 7.2, 7.9));
    phoneG.position.copy(pawW).lerp(dest, u); phoneG.rotation.set(lerp(-1.2, 0, u), lerp(.4, .1, u), 0);
  }
  for (const s of [-1, 1]) {}
  void tw;
}

// ---------- end card ----------
function overlay(t) {
  ov.clearRect(0, 0, 1920, 1080);
  if (t >= 11.2) {
    ov.fillStyle = '#000'; ov.fillRect(0, 0, 1920, 1080);
    const a = seg(t, 11.3, 11.6);
    if (LOGO) { ov.globalAlpha = a; ov.drawImage(LOGO, 960 - 180, 540 - 61, 360, 123); ov.globalAlpha = 1; }
  }
}

function render(t) {
  posesAt(t); drawPhone(t);
  const s = shotAt(t);
  if (s) {
    const u = seg(t, s.t[0], s.t[1]);
    camera.position.set(...V(...s.p, u)); camera.lookAt(new THREE.Vector3(...V(...s.at, u)));
    camera.fov = s.fov; camera.updateProjectionMatrix();
    // focus on the subject of the shot
    const tgt = s === SHOTS[1] ? F.R.head : s === SHOTS[3] ? phoneG : F.C.head;
    const wp = new THREE.Vector3(); (tgt.visible === false ? sofra : tgt).getWorldPosition(wp);
    post.dof.focus = camera.position.distanceTo(wp); post.dof.aper = s === SHOTS[3] ? 9 : 14;
    key.intensity = t >= 8.2 ? lerp(36, 22, seg(t, 8.2, 9.4)) : 36;
    post.composer.render();
  }
  overlay(t);
}

// ---------- events for the sound ----------
const EV = [];
const at = (t, type, extra = {}) => EV.push({ t, type, ...extra });
at(.9, 'spoon'); at(2.7, 'spoon'); for (let t = 1.2; t < 4.3; t += 1 / 2.6) at(+t.toFixed(3), 'chew'); at(4.3, 'stop');
at(1.6, 'bread'); for (let k = 0; k < 12; k++) at(k, 'tick'); at(3.5, 'cut'); at(5.5, 'cut'); at(6.6, 'rustle'); at(7.85, 'phonedown'); at(8.0, 'cut');
at(8.2, 'screen'); at(8.9, 'coin'); at(9.4, 'lean'); at(10, 'cut'); at(11.2, 'black'); at(11.3, 'logo'); at(6.2, 'dog');

window.DUR = DUR; window.EV = EV; window.render = render;
LOGO = new Image(); LOGO.src = 'assets/locca-logo.png';
Promise.all([new Promise(r => { LOGO.onload = r; }), document.fonts.load('italic 800 64px BSC')]).then(() => { render(0); window.READY = true; });
