// Sync + balance check for audio/mix.wav: onsets vs the 120 BPM grid, band energies, loop seam, waveform image.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const wav = await readFile(join(ROOT, 'audio', process.argv[2] || 'mix.wav'));
const dataAt = wav.indexOf('data') + 8, SR = wav.readUInt32LE(24), ch = wav.readUInt16LE(22), bits = wav.readUInt16LE(34);
const n = (wav.length - dataAt) / (ch * bits / 8);
const mono = new Float32Array(n);
for (let i = 0; i < n; i++) {
  let s = 0;
  for (let c = 0; c < ch; c++) s += wav.readIntLE(dataAt + (i * ch + c) * 3, 3) / 8388608;
  mono[i] = s / ch;
}

// Onsets: positive flux of a 5 ms RMS envelope, peak-picked.
const hop = Math.round(SR * 0.005), env = [];
for (let i = 0; i + hop <= n; i += hop) { let e = 0; for (let j = 0; j < hop; j++) e += mono[i + j] ** 2; env.push(Math.sqrt(e / hop)); }
const flux = env.map((v, i) => Math.max(0, v - (env[i - 2] ?? v)));
const thr = 3.2 * (flux.reduce((a, b) => a + b, 0) / flux.length);
const onsets = [];
for (let i = 2; i < flux.length - 2; i++) {
  if (flux[i] > thr && flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1] && flux[i] >= flux[i - 2] && flux[i] >= flux[i + 2]) {
    const t = (i * hop) / SR;
    if (!onsets.length || t - onsets[onsets.length - 1] > 0.06) onsets.push(t);
  }
}
const grid = 0.125; // 16th notes
const offs = onsets.map((t) => { const g = Math.round(t / grid) * grid; return (t - g) * 1000; });
const absMs = offs.map(Math.abs).sort((a, b) => a - b);
const beatsHit = Array.from({ length: 40 }, (_, b) => onsets.some((t) => Math.abs(t - b * 0.5) < 0.03));
console.log(`onsets: ${onsets.length} · median |offset| from 16th grid: ${absMs[absMs.length >> 1].toFixed(1)} ms · 90th pct: ${absMs[Math.floor(absMs.length * 0.9)].toFixed(1)} ms`);
console.log(`beats with an onset within ±30 ms: ${beatsHit.filter(Boolean).length}/40` + (beatsHit.includes(false) ? ` (missing: ${beatsHit.map((h, i) => (h ? null : i + 1)).filter(Boolean).join(', ')})` : ''));
// Loop seam: last 10 ms vs first 10 ms level
const rms = (a, b) => { let e = 0; for (let i = a; i < b; i++) e += mono[i] ** 2; return Math.sqrt(e / (b - a)); };
const seamJump = Math.abs(mono[n - 1] - mono[0]);
console.log(`loop seam: |last-first sample| = ${seamJump.toFixed(4)} · rms last 10 ms ${rms(n - SR / 100, n).toFixed(4)} vs first 10 ms ${rms(0, SR / 100).toFixed(4)}`);

// Waveform with beat grid, drawn in Chromium.
const peaks = [];
const cols = 2000, per = Math.floor(n / cols);
for (let c = 0; c < cols; c++) { let mx = 0; for (let j = 0; j < per; j++) mx = Math.max(mx, Math.abs(mono[c * per + j])); peaks.push(mx); }
const browser = await chromium.launch();
const page = await browser.newPage();
const url = await page.evaluate(({ peaks, onsets }) => {
  const c = document.createElement('canvas'); c.width = 2000; c.height = 360;
  const x = c.getContext('2d');
  x.fillStyle = '#F7F1E8'; x.fillRect(0, 0, 2000, 360);
  for (let b = 0; b <= 40; b++) { x.fillStyle = b % 4 === 0 ? '#999' : '#d4cdc2'; x.fillRect(b * 50, 0, b % 4 === 0 ? 2 : 1, 360); if (b < 40 && b % 2 === 0) { x.fillStyle = '#555'; x.font = '12px system-ui'; x.fillText(String(b / 2) + 's', b * 50 + 3, 14); } }
  x.fillStyle = '#111';
  peaks.forEach((p, i) => { const h = p * 150; x.fillRect(i, 190 - h, 1, h * 2); });
  x.fillStyle = '#FF5B00';
  onsets.forEach((t) => x.fillRect(Math.round(t * 100), 340, 2, 18));
  return c.toDataURL('image/png');
}, { peaks, onsets });
await writeFile(join(ROOT, 'review', 'audio_wave.png'), Buffer.from(url.split(',')[1], 'base64'));
await browser.close();
console.log('review/audio_wave.png');
