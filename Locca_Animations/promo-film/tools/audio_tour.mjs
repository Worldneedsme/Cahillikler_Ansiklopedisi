// Locca "Tilkinin Alanya turu": 24 s score on the 120 BPM grid, same instruments and method as audio_fox.mjs.
// Every hit lands 1 frame after its picture event in fox-tour.html (times below are the picture times).
//   node tools/audio_tour.mjs -> audio/fox-tour_music.wav, audio/fox-tour_sfx.wav, audio/fox-tour_mix.wav (-14 LUFS, true peak under -2 dBTP)
//   and prints the measurements: hit timing, hit-over-bed in the phone band, loudness full range and 200 Hz-6 kHz.
import { writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DUR = 24, FR = 1 / 60;
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
    const j = s0 + i; if (j < 0 || j >= N) continue; // not a loop: tails past the end are dropped
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

// ---------- harmony: one chord per bar; the win (bar 8) and the end card land on D ----------
const VOICING = { D: [62, 66, 69, 74], Bm: [59, 62, 66, 71], G: [59, 62, 67, 71], A: [57, 61, 64, 69] };
const ROOT_NOTE = { D: 38, Bm: 35, G: 43, A: 45 };
//            hook  map   street street till  earn  stamps win  app  app  end  end
const BARS = ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'D', 'G', 'A', 'D', 'D'];
const SECTION = ['soft', 'light', 'groove', 'groove', 'groove', 'groove', 'groove', 'win', 'groove', 'groove', 'end', 'end'];
const kicks = [];
function playKick(t, g = 0.2, big = 1) { kicks.push(t); add(DRUMS, t, kick(big), g); }
const keys = (t, chord, dur, vel, g = 0.12) => VOICING[chord].forEach((m) => add(MUSIC, t, ep(m, dur, vel, 0.8), g, (m - 66) / 30, 0.3));

BARS.forEach((chord, b) => {
  const t0 = b * 2, root = ROOT_NOTE[chord], sec = SECTION[b];
  if (sec === 'soft') { keys(0, chord, 1.6, 0.42, 0.1); return; }
  if (sec === 'light') { keys(t0, chord, 1.2, 0.45); add(MUSIC, t0, bass(root, 1.0), 0.22); return; }
  if (sec === 'win' || sec === 'end') {
    keys(t0, chord, sec === 'win' ? 1.6 : 1.9, sec === 'win' ? 0.6 : 0.45); add(MUSIC, t0, bass(root, 1.6), 0.26);
    if (sec === 'win' || b === 10) { playKick(t0, 0.22, 1.2); add(DRUMS, t0 + 1.0, clap(), 0.12, 0, 0.3); }
    return;
  }
  keys(t0, chord, 0.55, 0.5); keys(t0 + 0.75, chord, 0.3, 0.38);
  add(MUSIC, t0, bass(root, 0.6), 0.3); add(MUSIC, t0 + 1.0, bass(root, 0.4), 0.22);
  playKick(t0, 0.2); playKick(t0 + 1.0, 0.16);
  add(DRUMS, t0 + 0.5, clap(), 0.08, 0, 0.25); add(DRUMS, t0 + 1.5, clap(), 0.08, 0, 0.25);
  for (let e = 0; e < 8; e++) add(DRUMS, t0 + e * 0.25, hat(), e % 2 ? 0.05 : 0.035, 0.2);
});

// ---------- SFX, picture times from fox.html ----------
const click = (f, len = 0.03, g = 1) => gainOf(mix(sine(f, f * 0.98, len, 140), gainOf(biquad(noiseBurst(0.01, (p) => 1 - p), 'hp', 3000), 0.4)), g);
const whoosh = (len, peak = 0.6) => noiseBurst(len, (p) => Math.pow(Math.sin(Math.PI * Math.pow(p, peak)), 1.6));
const GEN = {
  blink: () => click(2600, 0.02, 0.35),
  bloop: (c) => mix(gainOf(marimba(c.note, 1, 0.5), 0.8), gainOf(sine(420, 760, 0.06, 45, 0.002), 0.3)),
  pop: () => mix(sine(320, 980, 0.09, 22, 0.002), gainOf(click(2400, 0.02), 0.3)),
  swishIn: () => gainOf(sweepBP(whoosh(0.22, 0.45), 600, 3200, 1.2), 0.9),
  swishOut: () => gainOf(sweepBP(whoosh(0.2, 0.3), 3200, 700, 1.2), 0.9),
  flick: () => gainOf(sweepBP(whoosh(0.1, 0.4), 2500, 6000, 1.4), 0.5),
  stamp: (c) => mix(gainOf(marimba(c.note, 1, 0.9), 0.9), gainOf(sine(170, 70, 0.12, 30, 0.0008), 0.55), gainOf(biquad(noiseBurst(0.03, (p) => Math.pow(1 - p, 3)), 'bp', 1600, 0.9), 0.35)),
  swap: () => gainOf(sine(1200, 1900, 0.07, 30, 0.003), 0.5),
  wink: () => gainOf(bell(2637, 0.25, 18, 2, 0.5), 0.5),
  riser: () => gainOf(mix(sweepBP(noiseBurst(0.45, (p) => Math.pow(p, 2.2)), 500, 4200, 1.1), gainOf(sine(300, 900, 0.45, 0.5, 0.3), 0.15)), 0.9),
  hero: () => mix(gainOf(sine(150, 48, 0.4, 9, 0.0008), 0.9), gainOf(biquad(noiseBurst(0.08, (p) => Math.pow(1 - p, 2)), 'lp', 2400), 0.45), gainOf(bell(1174.66, 1.2, 3.5, 2, 1.2), 0.35), gainOf(bell(1760, 1.2, 4, 2, 1), 0.22)),
  swell: () => { const s = mix(...VOICING.D.map((m) => ep(m + 12, 0.6, 0.7, 0.6))); return gainOf(reverse(s.subarray(0, Math.round(SR * 0.6))), 0.5); },
  cup: () => mix(gainOf(marimba(86, 1, 0.9), 0.8), gainOf(sine(500, 1100, 0.07, 35, 0.002), 0.3)),
  steam: () => biquad(noiseBurst(0.7, (p) => Math.sin(Math.PI * p) * 0.5), 'bp', 5200, 1.5),
  heart: (c) => gainOf(marimba(c.note, 0.8, 0.5), 0.6),
  step: () => mix(click(900, 0.04, 0.5), gainOf(sine(230, 170, 0.06, 40, 0.002), 0.5)),
  skid: () => gainOf(sweepBP(noiseBurst(0.32, (p) => Math.pow(1 - p, 1.5)), 3200, 700, 1.3), 0.9),
  scan: () => mix(gainOf(sine(700, 1500, 0.4, 0.5, 0.05).map((v, i, a) => v * Math.sin((Math.PI * i) / a.length)), 0.35), gainOf(biquad(noiseBurst(0.4, (p) => Math.sin(Math.PI * p) * 0.3), 'bp', 4000, 2), 0.5)),
  confirm: () => { const o = buf(0.4); o.set(gainOf(bell(1046.5, 0.12, 18, 2, 0.6), 0.6)); const b = gainOf(bell(1568, 0.28, 10, 2, 0.6), 0.6); o.set(b.subarray(0, o.length - Math.round(0.08 * SR)), Math.round(0.08 * SR)); return o; },
  coin: () => mix(gainOf(bell(1318.5, 1.0, 4.5), 0.45), gainOf(bell(1975.5, 1.0, 5, 3.5, 1.5), 0.35)),
  chime: () => { const o = buf(1.6); [[1174.66, 0], [1479.98, 0.025], [1760, 0.05], [2349.3, 0.075]].forEach(([f, d]) => { const b = gainOf(bell(f, 1.5, 2.6, 2, 1.2), 0.3); const s = Math.round(d * SR); for (let i = 0; i < b.length && s + i < o.length; i++) o[s + i] += b[i]; }); return o; },
};
const CUES = [
  { t: 0.5, s: 'flick', g: 0.2 },
  { t: 1.0, s: 'stamp', note: 74, g: 0.4 }, { t: 1.0, s: 'pop', g: 0.36, pan: -0.1 },
  { t: 2.0, s: 'swishIn', g: 0.22 },
  { t: 2.25, s: 'pop', g: 0.36 },
  { t: 2.5, s: 'bloop', note: 78, g: 0.3, pan: -0.3 }, { t: 3.0, s: 'bloop', note: 81, g: 0.3, pan: 0.3 }, { t: 3.5, s: 'bloop', note: 86, g: 0.3 },
  { t: 3.8, s: 'swishOut', g: 0.2 },
  ...[4.5, 5.0, 5.5].map((t, i) => ({ t, s: 'step', g: 0.28, pan: -0.2 + i * 0.1 })),
  { t: 6.0, s: 'swishIn', g: 0.22, pan: 0.2 },
  ...Array.from({ length: 6 }, (_, i) => ({ t: 6.25 + i * 0.25, s: 'step', g: 0.2, pan: 0.1 })),
  { t: 7.6, s: 'skid', g: 0.3, pan: 0.2, lead: true },
  { t: 8.0, s: 'pop', g: 0.36 },
  { t: 8.5, s: 'scan', g: 0.24, lead: true },
  { t: 9.0, s: 'confirm', g: 0.36 }, { t: 9.0, s: 'swishIn', g: 0.16, pan: 0.5 },
  { t: 9.4, s: 'pop', g: 0.3 },
  { t: 10.0, s: 'pop', g: 0.34 },
  { t: 10.5, s: 'coin', g: 0.34 }, { t: 11.0, s: 'stamp', note: 81, g: 0.38 },
  { t: 12.0, s: 'pop', g: 0.34, pan: -0.4 }, { t: 12.5, s: 'stamp', note: 83, g: 0.38 },
  { t: 13.0, s: 'pop', g: 0.34, pan: 0.4 }, { t: 13.5, s: 'stamp', note: 86, g: 0.38 },
  { t: 14.0, s: 'pop', g: 0.34 },
  { t: 14.2, s: 'riser', g: 0.26, lead: true },
  { t: 14.5, s: 'hero', g: 0.6 },
  { t: 14.7, s: 'cup', g: 0.4 }, { t: 14.95, s: 'heart', note: 90, g: 0.26 },
  { t: 15.3, s: 'wink', g: 0.28 },
  { t: 16.0, s: 'pop', g: 0.34 }, { t: 17.0, s: 'pop', g: 0.3 },
  { t: 20.0, s: 'chime', g: 0.36 }, { t: 20.5, s: 'bloop', note: 86, g: 0.28 }, { t: 21.0, s: 'pop', g: 0.3 },
  { t: 23.0, s: 'bloop', note: 90, g: 0.28 },
];
// "lead" sounds build up to their moment (riser, swell, swish-in), so they start before it; everything else starts 1 frame after.
// Target level over the bed for each hit (dB, phone band); textures have none. The gains below are calibrated against these.
const TARGET = { hero: 6, stamp: 5, cup: 5, chime: 5, coin: 5, confirm: 4.5, pop: 4, bloop: 4.5, wink: 4, heart: 4, step: 2 };
const SFXSEND = bus();
function renderSfx(trim) {
  for (const b of [SFX, SFXSEND]) for (const ch of b) ch.fill(0);
  for (const c of CUES) {
    const x = GEN[c.s](c), g = c.g * (trim[c.t.toFixed(3)] ?? 1);
    const t = c.s === 'swishIn' ? c.t + FR - 0.12 : c.s === 'riser' ? c.t + FR - 0.3 : c.s === 'skid' ? c.t + FR - 0.05 : c.t + FR;
    const send = ['chime', 'stamp', 'hero', 'heart', 'cup'].includes(c.s) ? 0.3 : 0.1;
    const s0 = Math.round(t * SR), gl = Math.cos(((c.pan || 0) + 1) * Math.PI / 4) * Math.SQRT2 * g, gr = Math.sin(((c.pan || 0) + 1) * Math.PI / 4) * Math.SQRT2 * g;
    for (let i = 0; i < x.length; i++) { const j = s0 + i; if (j < 0 || j >= N) continue; SFX[0][j] += x[i] * gl; SFX[1][j] += x[i] * gr; SFXSEND[0][j] += x[i] * gl * send; SFXSEND[1][j] += x[i] * gr * send; }
  }
}
const HITS = CUES.filter((c) => TARGET[c.s] !== undefined).map((c) => ({ t: c.t, s: c.s }));
// ---------- duck the bed under the hold and the hero ----------
const duck = new Float32Array(N).fill(1);
for (const t of kicks) {
  const s0 = Math.round(t * SR);
  for (let i = 0; i < SR * 0.3 && s0 + i < N; i++) duck[s0 + i] = Math.min(duck[s0 + i], 1 - 0.3 * Math.exp(-(i / SR) * 11));
}
for (let i = 0; i < N; i++) { const t = i / SR; if (t >= 14.0 && t < 14.6) duck[i] *= Math.pow(10, -4 / 20); } // a breath before the win
for (let i = 0; i < N; i++) { MUSIC[0][i] *= duck[i]; MUSIC[1][i] *= duck[i]; DRUMS[0][i] *= duck[i]; DRUMS[1][i] *= duck[i]; }

// ---------- reverb (Freeverb-style), single pass: the clip does not loop ----------
function reverb(inL, inR) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round((d * SR) / 44100));
  const aps = [556, 441, 341, 225].map((d) => Math.round((d * SR) / 44100));
  const run = (x, spread) => {
    const y = new Float32Array(x.length);
    const cb = combs.map((d) => ({ b: new Float32Array(d + spread), i: 0, f: 0 }));
    const ab = aps.map((d) => ({ b: new Float32Array(d + spread), i: 0 }));
    for (let n = 0; n < y.length; n++) {
      const v = x[n] * 0.015;
      let s = 0;
      for (const c of cb) { const o = c.b[c.i]; c.f = o * 0.8 + c.f * 0.2; c.b[c.i] = v + c.f * 0.84; c.i = (c.i + 1) % c.b.length; s += o; }
      for (const a of ab) { const o = a.b[a.i]; a.b[a.i] = s + o * 0.5; a.i = (a.i + 1) % a.b.length; s = o - s; }
      y[n] = s;
    }
    return y;
  };
  return [run(inL, 0), run(inR, 23)];
}
const BED_GAIN = Math.pow(10, 6 / 20); // the bed carries the track; hits sit 3-6 dB over it
for (const b of [MUSIC, DRUMS, SEND]) for (const ch of b) for (let i = 0; i < N; i++) ch[i] *= BED_GAIN;
// phones play almost nothing under ~150 Hz: thin the sub so the loudness sits where they can play it
for (const b of [MUSIC, DRUMS]) for (let c = 0; c < 2; c++) b[c] = biquad(biquad(b[c], 'hp', 110), 'hp', 110);
const [BL, BR] = reverb(SEND[0], SEND[1]);
const BED = [DRUMS[0].map((v, i) => v * 0.9 + MUSIC[0][i] + BL[i] * 0.55), DRUMS[1].map((v, i) => v * 0.9 + MUSIC[1][i] + BR[i] * 0.55)];

// ---------- measuring, in the 200 Hz-6 kHz phone band ----------
const band = (x) => biquad(biquad(x, 'hp', 200), 'lp', 6000);
const monoOf = (b) => b[0].map((v, i) => (v + b[1][i]) / 2);
const bedB = band(monoOf(BED));
const rms = (x, a, b) => { let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, b - a)); };
function measureHits() {
  const sfxB = band(monoOf(SFX));
  return HITS.map((h) => {
    const s0 = Math.round((h.t + FR) * SR), w = Math.round(0.06 * SR);
    let pk = 0, at = s0;
    for (let i = s0 - Math.round(0.01 * SR); i < s0 + w && i < N; i++) if (Math.abs(sfxB[i]) > pk) { pk = Math.abs(sfxB[i]); at = i; }
    let first = at; for (let i = s0 - Math.round(0.01 * SR); i <= at; i++) if (Math.abs(sfxB[i]) >= pk * 0.89) { first = i; break; } // within 1 dB of the peak
    // the bed as the ear hears it: its level over the surrounding second, not the gap the hit happens to fall in
    const over = 20 * Math.log10(rms(sfxB, s0, s0 + w) / Math.max(1e-9, rms(bedB, Math.max(0, s0 - SR / 2), Math.min(N, s0 + SR / 2))));
    return { ...h, ms: ((first - s0) / SR) * 1000, over };
  });
}
// Calibrate: hits that share a frame are trimmed together, three passes.
const trim = {};
for (let pass = 0; pass < 3; pass++) {
  renderSfx(trim);
  const byT = {};
  for (const r of measureHits()) (byT[r.t.toFixed(3)] ??= []).push(r);
  for (const [k, rs] of Object.entries(byT)) {
    const err = rs.reduce((a, r) => a + (TARGET[r.s] - r.over), 0) / rs.length;
    trim[k] = (trim[k] ?? 1) * Math.pow(10, err / 20);
  }
}
renderSfx(trim);
const RESULT = measureHits();
const [SL, SR_] = reverb(SFXSEND[0], SFXSEND[1]);
const RL = BL.map((v, i) => v + SL[i]), RR = BR.map((v, i) => v + SR_[i]);

// ---------- master: 0.8 s fade at the end, DC removed ----------
const out = [new Float32Array(N), new Float32Array(N)];
for (let ch = 0; ch < 2; ch++) {
  const r = ch ? RR : RL;
  let mean = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, fade = t > DUR - 0.8 ? Math.cos((Math.PI / 2) * (t - (DUR - 0.8)) / 0.8) : 1, fin = Math.min(1, i / 96);
    const v = (DRUMS[ch][i] * 0.9 + MUSIC[ch][i] + SFX[ch][i] + r[i] * 0.55) * fade * fin;
    out[ch][i] = Math.tanh(v * 1.1) / 1.1;
    mean += out[ch][i] / N;
  }
  for (let i = 0; i < N; i++) out[ch][i] -= mean;
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
await wav24(join(ROOT, 'audio', 'fox-tour_music.wav'), BED);
await wav24(join(ROOT, 'audio', 'fox-tour_sfx.wav'), SFX);
await wav24(join(ROOT, 'audio', 'fox-tour_mix_raw.wav'), out);

// ---------- loudness: two-pass EBU R128 to -14 LUFS; true peak under -2.2 dBTP so the AAC file stays under -1 ----------
const raw = join(ROOT, 'audio', 'fox-tour_mix_raw.wav'), fin = join(ROOT, 'audio', 'fox-tour_mix.wav');
const meas = (file, pre = '') => { const e = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${file}" -af ${pre}loudnorm=I=-14:TP=-2.2:LRA=11:print_format=json -f null - 2>&1`]).toString(); return JSON.parse(e.slice(e.lastIndexOf('{'), e.lastIndexOf('}') + 1)); };
const m = meas(raw);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-af',
  `loudnorm=I=-14:TP=-2.2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
  '-ar', String(SR), '-c:a', 'pcm_s24le', fin]);
const m2 = meas(fin), phone = meas(fin, 'highpass=f=200,lowpass=f=6000,');
console.log(`loudness: ${m2.input_i} LUFS full, ${phone.input_i} LUFS in 200 Hz-6 kHz, true peak ${m2.input_tp} dBTP`);

console.log(RESULT.map((r) => `${r.t.toFixed(2).padStart(6)} ${r.s.padEnd(6)} peak ${r.ms.toFixed(1).padStart(5)} ms after frame+1 · ${r.over.toFixed(1).padStart(5)} dB over bed (target ${TARGET[r.s]})`).join('\n'));
