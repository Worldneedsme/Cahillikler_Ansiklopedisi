// Videoyu kare kare render eder ve donanım kodlayıcıyla (Mac: VideoToolbox, NVIDIA: NVENC) kodlar.
// node araclar/render.mjs <video_klasoru_adi> [--fps 30] [--workers 3]
// Çıktı: videolar/<ad>/out/video.mp4 (sessiz) ve videolar/<ad>/out/olaylar.json (DUR, EV, VO)
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CHROME, FFMPEG, KOK, PORT, kodlayici, sunucu } from './ortam.mjs';

const args = process.argv.slice(2);
const ad = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? +args[i + 1] : d; };
const FPS = opt('--fps', 30), WORKERS = opt('--workers', 3);
const url = `http://localhost:${PORT}/videolar/${ad}/index.html`;
const out = path.join(KOK, 'videolar', ad, 'out');
const srv = await sunucu();
const KOD = kodlayici();
fs.mkdirSync(out, { recursive: true });

// Her worker kendi tarayıcısını açar: aynı tarayıcıdaki arka plan sekmeleri boyanmıyor.
const browsers = [];
async function openPage() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 120000, args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
  browsers.push(browser);
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { console.error('SAYFA HATASI:', e.message); process.exit(1); });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.READY === true', { timeout: 60000 });
  return page;
}

const first = await openPage();
const meta = await first.evaluate(() => ({ DUR: window.DUR, EV: window.EV, VO: window.VO }));
fs.writeFileSync(path.join(out, 'olaylar.json'), JSON.stringify(meta, null, 1));
const N = Math.round(meta.DUR * FPS);
console.log(`${ad}: ${meta.DUR} sn, ${N} kare, ${WORKERS} worker, ${KOD.ad}`);

function encoder(file) {
  const ff = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    ...KOD.args, '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  return ff;
}

const t0 = Date.now();
const per = Math.ceil(N / WORKERS);
let done = 0;
const parts = [];
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const a = w * per, b = Math.min(N, a + per);
  if (a >= b) return;
  const page = w === 0 ? first : await openPage();
  const file = path.join(out, `parca_${w}.mp4`);
  parts[w] = file;
  const ff = encoder(file);
  for (let f = a; f < b; f++) {
    await page.evaluate((t) => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95, optimizeForSpeed: true });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (++done % 100 === 0) process.stdout.write(`  ${done}/${N} kare (${((Date.now() - t0) / 1000).toFixed(0)} sn)\n`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
}));
await Promise.all(browsers.map((b) => b.close()));
srv.kapat();

const list = path.join(out, 'parcalar.txt');
fs.writeFileSync(list, parts.filter(Boolean).map((p) => `file '${path.basename(p)}'`).join('\n'));
await new Promise((r, j) => spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(out, 'video.mp4')], { stdio: 'inherit' })
  .on('close', (c) => (c ? j(new Error('concat ' + c)) : r())));
parts.filter(Boolean).forEach((p) => fs.unlinkSync(p)); fs.unlinkSync(list);
console.log(`Bitti: ${path.join(out, 'video.mp4')} · ${((Date.now() - t0) / 1000).toFixed(1)} sn`);
