// Locca Business: calm 45 s version of the 120 BPM track (same instruments, drums pulled back).
// SFX times come from the <script id="cues"> block in index.html (single source of truth).
//   node tools/audio.mjs   -> audio/music.wav, audio/sfx.wav, audio/mix_raw.wav, audio/mix.wav (-14 LUFS, -1 dBTP)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const V = (process.argv[2] || 'b').toLowerCase();
const PLAN_ = JSON.parse(readFileSync(join(ROOT, 'business.html'), 'utf8').match(/<script type="application\/json" id="timelines">([\s\S]*?)<\/script>/)[1])[V];
const DUR = PLAN_.reduce((s, [, d]) => s + d, 0);
const T_CTA = (() => { let t = 0; for (const [n, d] of PLAN_) { if (n === 'cta') return t; t += d; } return DUR - 5; })();
const SR = 48000, N = Math.round(SR * DUR);
const TAU = Math.PI * 2;

// ---------- deterministic noise ----------
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rand = mulberry32(0x10cca);
const noise = () => rand() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------- buses (stereo, circular) ----------
const bus = () => [new Float32Array(N), new Float32Array(N)];
const DRUMS = bus(), MUSIC = bus(), SFX = bus(), SEND = bus(); // SEND -> reverb
function add(b, t, mono, gain = 1, pan = 0, send = 0) {
  const s0 = Math.round(t * SR);
  const gl = Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2 * gain, gr = Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2 * gain;
  for (let i = 0; i < mono.length; i++) {
    const j = (((s0 + i) % N) + N) % N; // wrap: tails fold onto the loop start
    b[0][j] += mono[i] * gl; b[1][j] += mono[i] * gr;
    if (send) { SEND[0][j] += mono[i] * gl * send; SEND[1][j] += mono[i] * gr * send; }
  }
}
const buf = (sec) => new Float32Array(Math.round(sec * SR));

// ---------- filters ----------
function biquad(x, type, f, q = 0.707) {
  const w = (TAU * f) / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else { b0 = a; b1 = 0; b2 = -a; } // band-pass
  a0 = 1 + a; a1 = -2 * c; a2 = 1 - a;
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}
// Band-pass with a moving centre frequency (for whooshes).
function sweepBP(x, f0, f1, q = 1.4) {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const p = i / x.length, f = f0 * Math.pow(f1 / f0, p);
    const w = (TAU * f) / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
    const v = ((a * x[i] - a * x2) - (-2 * c) * y1 - (1 - a) * y2) / (1 + a);
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}

// ---------- instruments ----------
function kick(big = 1) {
  const o = buf(0.5); let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR, f = 47 + 115 * Math.exp(-t * 32);
    ph += (TAU * f) / SR;
    o[i] = Math.tanh(1.7 * Math.sin(ph)) * Math.exp(-t * (6.5 / big)) + noise() * Math.exp(-t * 420) * 0.22;
  }
  return o;
}
function clap() {
  const n = buf(0.35);
  for (let i = 0; i < n.length; i++) {
    const t = i / SR;
    let e = 0;
    for (const d of [0, 0.011, 0.022]) if (t >= d) e += Math.exp(-(t - d) * 230);
    if (t >= 0.022) e += 0.55 * Math.exp(-(t - 0.022) * 15);
    n[i] = noise() * e;
  }
  return biquad(biquad(n, 'bp', 1500, 0.9), 'hp', 500);
}
function hat(open = false) {
  const o = buf(open ? 0.3 : 0.1);
  for (let i = 0; i < o.length; i++) o[i] = noise() * Math.exp(-(i / SR) * (open ? 14 : 60));
  return biquad(biquad(o, 'hp', 7500), 'hp', 6000);
}
function bass(m, dur) {
  const f = mtof(m), o = buf(dur + 0.06); let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    ph += (TAU * f * (1 + 0.02 * Math.exp(-t * 40))) / SR;
    const env = Math.min(1, t / 0.006) * (t < dur ? 1 : Math.exp(-(t - dur) * 60)) * (0.75 + 0.25 * Math.exp(-t * 6));
    o[i] = Math.tanh(1.4 * (Math.sin(ph) + 0.28 * Math.sin(2 * ph) + 0.07 * Math.sin(3 * ph))) * env;
  }
  return biquad(o, 'lp', 900);
}
// FM electric piano: 1:1 carrier/modulator with a decaying index, plus a short tine partial.
function ep(m, dur, vel = 1, bright = 1) {
  const f = mtof(m), o = buf(dur + 1.4);
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    const idx = (1.5 * bright * Math.exp(-t * 5) + 0.3) * vel;
    const mod = Math.sin(TAU * f * t) * idx;
    const env = Math.min(1, t / 0.002) * Math.exp(-t * 1.3) * (t < dur ? 1 : Math.exp(-(t - dur) * 9));
    o[i] = (Math.sin(TAU * f * t + mod) + 0.12 * bright * Math.sin(TAU * f * 6.98 * t) * Math.exp(-t * 22)) * env * vel;
  }
  return o;
}
function marimba(m, vel = 1, len = 1.1) {
  const f = mtof(m), o = buf(len);
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    o[i] = (Math.sin(TAU * f * t) * Math.exp(-t * 5.5) + 0.38 * Math.sin(TAU * f * 3.93 * t) * Math.exp(-t * 26) + 0.1 * Math.sin(TAU * f * 9.2 * t) * Math.exp(-t * 60)) * Math.min(1, t / 0.0012) * vel;
  }
  return o;
}
function bell(freq, len = 1.4, decay = 3, ratio = 3.5, index = 2) {
  const o = buf(len);
  for (let i = 0; i < o.length; i++) {
    const t = i / SR;
    o[i] = Math.sin(TAU * freq * t + Math.sin(TAU * freq * ratio * t) * index * Math.exp(-t * 5)) * Math.exp(-t * decay) * Math.min(1, t / 0.002);
  }
  return o;
}
function sine(f0, f1, len, decay, attack = 0.001) {
  const o = buf(len); let ph = 0;
  for (let i = 0; i < o.length; i++) {
    const t = i / SR, p = i / o.length;
    ph += (TAU * (f0 * Math.pow(f1 / f0, p))) / SR;
    o[i] = Math.sin(ph) * Math.exp(-t * decay) * Math.min(1, t / attack);
  }
  return o;
}
function noiseBurst(len, shape) {
  const o = buf(len);
  for (let i = 0; i < o.length; i++) o[i] = noise() * shape(i / o.length, i / SR);
  return o;
}
const mix = (...xs) => { const n = Math.max(...xs.map((x) => x.length)); const o = new Float32Array(n); for (const x of xs) for (let i = 0; i < x.length; i++) o[i] += x[i]; return o; };
const gainOf = (x, g) => x.map((v) => v * g);
const reverse = (x) => Float32Array.from(x).reverse();


// ---------- harmony: D - Bm - G - A, one bar (2 s) each; D holds from 40 s ----------
const VOICING = { D: [62, 66, 69, 74], Bm: [59, 62, 66, 71], G: [59, 62, 67, 71], A: [57, 61, 64, 69] };
const ROOT_NOTE = { D: 38, Bm: 35, G: 43, A: 45 };
const PROG = ['D', 'Bm', 'G', 'A'];
const kicks = [];
function playKick(t, g = 0.22, big = 1) { kicks.push(t); add(DRUMS, t, kick(big), g); }

for (let b = 0; b < Math.ceil(DUR / 2); b++) {
  const t0 = b * 2, chord = t0 >= T_CTA ? 'D' : PROG[b % 4], v = VOICING[chord], root = ROOT_NOTE[chord];
  const keys = (t, dur, vel) => v.forEach((m) => add(MUSIC, t, ep(m, dur, vel, 0.8), 0.12, (m - 66) / 30, 0.3));
  keys(t0, 0.55, 0.5);
  if (t0 < T_CTA) keys(t0 + 0.75, 0.3, 0.38);
  if (t0 >= 4 && t0 < T_CTA && b % 2) keys(t0 + 1.5, 0.3, 0.32);
  add(MUSIC, t0, bass(root, 0.6), 0.3);
  if (t0 < T_CTA) add(MUSIC, t0 + 1.0, bass(root, 0.4), 0.2);
  if (t0 >= 4 && t0 < T_CTA) {
    playKick(t0, 0.2, 1);
    playKick(t0 + 1.0, 0.16, 1);
    const tones = v.map((m) => m + 12);
    [0.5, 1.25, 1.75].forEach((d, i) => add(MUSIC, t0 + d, marimba(tones[(b + i) % 4], 0.45), 0.13, (i - 1) * 0.35, 0.35));
  }
}
// the hook: a soft pluck per line, then the question
[[0.3, 74], [0.6, 78], [1.6, 81]].forEach(([t, m]) => add(MUSIC, t, marimba(m, 0.6), 0.16, 0.1, 0.3));
// call to action: the tonic rings out
add(MUSIC, T_CTA, marimba(86, 0.9), 0.2, 0, 0.35);
add(MUSIC, DUR - 1, ep(62, 1.0, 0.5, 0.6), 0.12, 0, 0.4);

const click = (f, len = 0.03, g = 1) => gainOf(mix(sine(f, f * 0.98, len, 140), gainOf(biquad(noiseBurst(0.01, (p) => 1 - p), 'hp', 3000), 0.4)), g);
const whoosh = (f0, f1, len, peak = 0.6) => noiseBurst(len, (p) => Math.pow(Math.sin(Math.PI * Math.pow(p, peak)), 1.6));
const SFXGEN = {
  pop: () => mix(sine(320, 980, 0.09, 22, 0.002), gainOf(click(2400, 0.02), 0.3)),
  swish: () => gainOf(sweepBP(whoosh(0, 0, 0.14, 0.4), 2200, 7000, 1.2), 0.9),
  swishBack: () => gainOf(sweepBP(whoosh(0, 0, 0.2, 0.3), 7000, 1800, 1.2), 0.9),
  whooshUp: () => sweepBP(whoosh(0, 0, 0.3), 400, 3200),
  whoosh: () => sweepBP(whoosh(0, 0, 0.28), 700, 2600),
  whooshDown: () => sweepBP(whoosh(0, 0, 0.3, 0.4), 2600, 380),
  lowWhoosh: () => gainOf(sweepBP(whoosh(0, 0, 0.34), 180, 900, 1), 1.3),
  reverseWhoosh: () => sweepBP(whoosh(0, 0, 0.3, 0.85), 1600, 320),
  softWhoosh: () => gainOf(sweepBP(whoosh(0, 0, 0.26), 900, 2200), 0.55),
  suck: () => mix(click(1900, 0.03, 0.8), gainOf(sweepBP(whoosh(0, 0, 0.36, 0.9), 2400, 300), 0.8), gainOf(sine(700, 180, 0.36, 4, 0.2), 0.25)),
  thud: () => mix(sine(98, 48, 0.32, 13), gainOf(biquad(noiseBurst(0.06, (p) => 1 - p), 'lp', 700), 0.5)),
  open: () => mix(sine(880, 1320, 0.07, 45, 0.002), gainOf(click(2600, 0.02), 0.25)),
  tick: () => click(2300, 0.025, 0.5),
  lock: () => { const o = buf(0.07), a = click(1800, 0.03), b = click(2700, 0.03), d = Math.round(0.028 * SR); o.set(a); for (let i = 0; i < b.length; i++) o[d + i] += b[i]; return o; },
  scan: () => mix(gainOf(sine(700, 1500, 0.45, 0.5, 0.05).map((v, i, a) => v * Math.sin((Math.PI * i) / a.length)), 0.35), gainOf(biquad(noiseBurst(0.45, (p) => Math.sin(Math.PI * p) * 0.3), 'bp', 4000, 2), 0.5)),
  confirm: () => { const o = buf(0.4); o.set(gainOf(bell(1046.5, 0.12, 18, 2, 0.6), 0.6)); const b = gainOf(bell(1568, 0.28, 10, 2, 0.6), 0.6); o.set(b.subarray(0, o.length - Math.round(0.08 * SR)), Math.round(0.08 * SR)); return o; },
  count: () => { const o = buf(0.55); [0, 0.125, 0.25, 0.375].forEach((d, k) => { const c = click(1800 + k * 260, 0.025, 0.55); const s = Math.round(d * SR); for (let i = 0; i < c.length; i++) o[s + i] += c[i]; }); return o; },
  coin: () => mix(gainOf(bell(1318.5, 1.0, 4.5), 0.45), gainOf(bell(1975.5, 1.0, 5, 3.5, 1.5), 0.35)),
  softClick: () => click(1600, 0.03, 0.45),
  hop: (c) => mix(gainOf(marimba(c.note, 1, 0.8), 0.8), gainOf(sine(500, 900, 0.05, 50, 0.002), 0.25)),
  stamp: (c) => gainOf(mix(sine(150, 52, 0.22, 20), gainOf(biquad(noiseBurst(0.05, (p) => Math.pow(1 - p, 3)), 'bp', 1300, 0.8), 0.9), gainOf(sine(320, 260, 0.06, 45), 0.35)), c.big ? 1.25 : 1),
  swap: () => gainOf(sine(1200, 1900, 0.07, 30, 0.003), 0.5),
  chime: () => { const o = buf(1.6); [[1174.66, 0], [1479.98, 0.025], [1760, 0.05], [2349.3, 0.075]].forEach(([f, d]) => { const b = gainOf(bell(f, 1.5, 2.6, 2, 1.2), 0.3); const s = Math.round(d * SR); for (let i = 0; i < b.length && s + i < o.length; i++) o[s + i] += b[i]; }); return o; },
  pluck: (c) => gainOf(marimba(c.note, 1, 1.0), 0.9),
  wink: () => gainOf(bell(2637, 0.18, 22, 2, 0.5), 0.4),
  badge: () => mix(click(1400, 0.03, 0.5), gainOf(marimba(98, 0.6, 0.3), 0.35)),
};
const SFX_GAIN = { pop: 0.55, swish: 0.22, swishBack: 0.24, whooshUp: 0.3, whoosh: 0.26, whooshDown: 0.28, lowWhoosh: 0.32, reverseWhoosh: 0.28, softWhoosh: 0.2, suck: 0.32, thud: 0.6, open: 0.28, tick: 0.3, lock: 0.38, scan: 0.3, confirm: 0.42, count: 0.4, coin: 0.38, softClick: 0.3, hop: 0.34, stamp: 0.62, swap: 0.25, chime: 0.42, pluck: 0.3, wink: 0.3, badge: 0.3 };

// ---------- SFX on scene changes ----------
const html = await readFile(join(ROOT, 'business.html'), 'utf8');
const TL = JSON.parse(html.match(/<script type="application\/json" id="timelines">([\s\S]*?)<\/script>/)[1]);
const cues = [{ t: 0.3, sfx: 'softClick' }];
{
  let t = 0;
  for (const [name, d] of TL[V]) {
    if (name !== 'hook' && !['camp', 'data2', 'cta'].includes(name)) cues.push({ t, sfx: 'softWhoosh' });
    if (name === 'inn' || name === 'out') cues.push({ t: t + 1.2, sfx: 'softClick' });
    if (name === 'menu') cues.push({ t: t + 4, sfx: 'softClick' });
    if (name === 'story') cues.push({ t: t + 2.9, sfx: 'pluck', note: 86 });
    if (name === 'camp' || name === 'data2') cues.push({ t, sfx: 'softClick' });
    if (name === 'cta') cues.push({ t, sfx: 'chime' }, { t: t + 1.5, sfx: 'tick' }, { t: t + 2.6, sfx: 'wink' });
    t += d;
  }
}

for (const c of cues) {
  const gen = SFXGEN[c.sfx];
  if (!gen) throw new Error('unknown sfx ' + c.sfx);
  add(SFX, c.t, gen(c), SFX_GAIN[c.sfx] * 0.8, c.pan || 0, c.sfx === 'chime' || c.sfx === 'pluck' ? 0.35 : 0.12);
}

// ---------- sidechain: the kick ducks keys + bass ----------
const duck = new Float32Array(N).fill(1);
for (const t of kicks) {
  const s0 = Math.round(t * SR);
  for (let i = 0; i < SR * 0.3; i++) { const j = (s0 + i) % N; duck[j] = Math.min(duck[j], 1 - 0.38 * Math.exp(-(i / SR) * 11)); }
}
for (let i = 0; i < N; i++) { MUSIC[0][i] *= duck[i]; MUSIC[1][i] *= duck[i]; }

// ---------- reverb (Freeverb-style), run over two loops so the tail wraps seamlessly ----------
function reverb(inL, inR) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round((d * SR) / 44100));
  const aps = [556, 441, 341, 225].map((d) => Math.round((d * SR) / 44100));
  const run = (x, spread) => {
    const y = new Float32Array(x.length * 2);
    const cb = combs.map((d) => ({ b: new Float32Array(d + spread), i: 0, f: 0 }));
    const ab = aps.map((d) => ({ b: new Float32Array(d + spread), i: 0 }));
    for (let n = 0; n < y.length; n++) {
      const v = x[n % x.length] * 0.015;
      let s = 0;
      for (const c of cb) { const o = c.b[c.i]; c.f = o * 0.8 + c.f * 0.2; c.b[c.i] = v + c.f * 0.84; c.i = (c.i + 1) % c.b.length; s += o; }
      for (const a of ab) { const o = a.b[a.i]; a.b[a.i] = s + o * 0.5; a.i = (a.i + 1) % a.b.length; s = o - s; }
      y[n] = s;
    }
    return y.subarray(x.length); // second loop = steady state, wraps cleanly
  };
  return [run(inL, 0), run(inR, 23)];
}
const [RL, RR] = reverb(SEND[0], SEND[1]);

// ---------- master ----------
const out = [new Float32Array(N), new Float32Array(N)];
for (let ch = 0; ch < 2; ch++) {
  const r = ch ? RR : RL;
  for (let i = 0; i < N; i++) {
    const v = DRUMS[ch][i] * 0.9 + MUSIC[ch][i] + SFX[ch][i] + r[i] * 0.55;
    out[ch][i] = Math.tanh(v * 1.1) / 1.1; // gentle safety saturation
  }
}

function wav24(path, chans) {
  const n = chans[0].length, data = Buffer.alloc(n * 2 * 3);
  let peak = 0;
  for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) peak = Math.max(peak, Math.abs(chans[c][i]));
  const g = peak > 0.98 ? 0.98 / peak : 1;
  for (let i = 0, o = 0; i < n; i++) for (let c = 0; c < 2; c++, o += 3) {
    const v = Math.max(-8388608, Math.min(8388607, Math.round(chans[c][i] * g * 8388607)));
    data.writeIntLE(v, o, 3);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 6, 28); h.writeUInt16LE(6, 32); h.writeUInt16LE(24, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return writeFile(path, Buffer.concat([h, data]));
}
await mkdir(join(ROOT, 'audio'), { recursive: true });
const sum = (a, b, ga = 1, gb = 1) => [a[0].map((v, i) => v * ga + b[0][i] * gb), a[1].map((v, i) => v * ga + b[1][i] * gb)];
await wav24(join(ROOT, 'audio', `business_${V}_music.wav`), sum(DRUMS, MUSIC, 0.9, 1));
await wav24(join(ROOT, 'audio', `business_${V}_sfx.wav`), SFX);
await wav24(join(ROOT, 'audio', `business_${V}_mix_raw.wav`), out);

// ---------- loudness: two-pass EBU R128 to -14 LUFS, -1 dBTP ----------
const raw = join(ROOT, 'audio', `business_${V}_mix_raw.wav`), fin = join(ROOT, 'audio', `business_${V}_mix.wav`);
const err1 = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${raw}" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1`]).toString();
const m = JSON.parse(err1.slice(err1.lastIndexOf('{'), err1.lastIndexOf('}') + 1));
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-af',
  `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
  '-ar', String(SR), '-c:a', 'pcm_s24le', fin]);
const err2 = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${fin}" -af loudnorm=I=-14:TP=-1:print_format=json -f null - 2>&1`]).toString();
const m2 = JSON.parse(err2.slice(err2.lastIndexOf('{'), err2.lastIndexOf('}') + 1));
console.log(`raw: ${m.input_i} LUFS, TP ${m.input_tp} dBTP  ->  final: ${m2.input_i} LUFS, TP ${m2.input_tp} dBTP · ${cues.length} cues, ${kicks.length} kicks`);
