// Ortak ortam: Chrome ve ffmpeg yolları, video kodlayıcı seçimi, yerel statik sunucu.
// macOS, Windows ve Linux'ta çalışır. Yollar CHROME / FFMPEG ortam değişkenleriyle ezilebilir.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const KOK = path.dirname(path.dirname(fileURLToPath(import.meta.url))); // kanal-sablonu/
export const PORT = 8765;

function ilkVar(liste) { return liste.find((p) => p && fs.existsSync(p)); }

export const CHROME = process.env.CHROME || ilkVar([
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
]);
if (!CHROME) throw new Error('Chrome bulunamadı: CHROME ortam değişkenine yolunu yazın.');

export const FFMPEG = process.env.FFMPEG || ilkVar(['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', 'C:/Users/Win10/tools/ffmpeg-8.1/bin/ffmpeg.exe']) || 'ffmpeg';

// Donanım kodlayıcı varsa onu, yoksa libx264'ü kullanır.
let kodlayicilar = '';
try { kodlayicilar = execFileSync(FFMPEG, ['-hide_banner', '-encoders'], { encoding: 'utf8' }); } catch {}
export function kodlayici() {
  if (kodlayicilar.includes('h264_videotoolbox')) return { ad: 'VideoToolbox', args: ['-c:v', 'h264_videotoolbox', '-b:v', '14M', '-maxrate', '20M', '-bufsize', '28M'] };
  if (kodlayicilar.includes('h264_nvenc')) return { ad: 'NVENC', args: ['-c:v', 'h264_nvenc', '-preset', 'p5', '-cq', '21'] };
  return { ad: 'libx264', args: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '19'] };
}

const TIPLER = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

// 8765'te sunucu zaten çalışıyorsa onu kullanır, yoksa kanal-sablonu kökünü kendisi sunar.
export async function sunucu() {
  const acik = await new Promise((r) => {
    const q = http.get(`http://localhost:${PORT}/`, (res) => { res.resume(); r(true); });
    q.on('error', () => r(false));
  });
  if (acik) return { kapat: () => {} };
  const srv = http.createServer((req, res) => {
    const yol = path.join(KOK, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!yol.startsWith(KOK) || !fs.existsSync(yol) || fs.statSync(yol).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TIPLER[path.extname(yol)] || 'application/octet-stream' });
    fs.createReadStream(yol).pipe(res);
  });
  await new Promise((r) => srv.listen(PORT, r));
  return { kapat: () => srv.close() };
}
