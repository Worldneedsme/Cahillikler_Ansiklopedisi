// İnceleme kareleri: node araclar/kareler.mjs <video_klasoru_adi> t1 t2 ...  → videolar/<ad>/kareler/t_<t>.jpg
// Sunucu gerekmez: 8765'te çalışan yoksa araç kendisi açar.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { CHROME, KOK, PORT, sunucu } from './ortam.mjs';

const [ad, ...ts] = process.argv.slice(2);
const out = path.join(KOK, 'videolar', ad, 'kareler');
const srv = await sunucu();
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('SAYFA HATASI:', e.message); process.exitCode = 1; });
page.on('console', (m) => { if (m.type() === 'error') console.error('KONSOL:', m.text()); });
await page.goto(`http://localhost:${PORT}/videolar/${ad}/index.html`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.READY === true', { timeout: 60000 });
for (const t of ts) {
  await page.evaluate((x) => window.render(x), +t);
  await page.screenshot({ path: path.join(out, `t_${t}.jpg`), type: 'jpeg', quality: 85 });
}
console.log('DUR', await page.evaluate(() => window.DUR), '→', out);
await browser.close();
srv.kapat();
