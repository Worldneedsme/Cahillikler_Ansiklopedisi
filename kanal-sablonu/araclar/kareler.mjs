// İnceleme kareleri: node araclar/kareler.mjs <video_klasoru_adi> t1 t2 ...  → videolar/<ad>/kareler/t_<t>.jpg
// Sunucu: python -m http.server 8765 (kanal-sablonu kökünden)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [ad, ...ts] = process.argv.slice(2);
const out = path.join('videolar', ad, 'kareler');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('SAYFA HATASI:', e.message); process.exitCode = 1; });
page.on('console', (m) => { if (m.type() === 'error') console.error('KONSOL:', m.text()); });
await page.goto(`http://localhost:8765/videolar/${ad}/index.html`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.READY === true', { timeout: 60000 });
for (const t of ts) {
  await page.evaluate((x) => window.render(x), +t);
  await page.screenshot({ path: path.join(out, `t_${t}.jpg`), type: 'jpeg', quality: 85 });
}
console.log('DUR', await page.evaluate(() => window.DUR), '→', out);
await browser.close();
