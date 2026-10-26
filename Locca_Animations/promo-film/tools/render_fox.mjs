// Render the fox clips (fox.html, or another page with --page fox-tour.html) with the installed Google Chrome.
//   node tools/render_fox.mjs sheet  [--f story|feed] [--lang tr|en|ru]   -> review/fox/sheet_<f>_<lang>.png (one frame per beat)
//   node tools/render_fox.mjs frames 0,2.75,11 [--f ..] [--lang ..]       -> review/fox/<f>_<lang>_<t>.png
//   node tools/render_fox.mjs strip 10.9:11.3 [--f ..] [--lang ..]        -> review/fox/strip_<f>_<lang>_<a>-<b>.png (every frame)
//   node tools/render_fox.mjs video [--f ..] [--lang ..] [--pages 4] [--sub 4] -> out/Locca_Fox_<f>_<lang>.mp4
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const mode = args[0] || 'sheet';
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const F = opt('f', 'story'), LANG = opt('lang', 'tr'), FPS = +opt('fps', 60), PAGE = opt('page', 'fox.html');
const TAG = PAGE === 'fox.html' ? '' : PAGE.replace(/\.html$/, '') + '_'; // keeps the first clip's file names
const OUT = join(ROOT, 'review', 'fox');

const MIME = { '.html': 'text/html', '.png': 'image/png', '.woff2': 'font/woff2', '.js': 'text/javascript' };
function serve() {
  return new Promise((resolve) => {
    const srv = createServer(async (req, res) => {
      const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '');
      try {
        const body = await readFile(join(ROOT, p || 'fox.html'));
        res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
        res.end(body);
      } catch { res.writeHead(404); res.end(); }
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function openPages(browser, url, n) {
  const pages = [];
  for (let i = 0; i < n; i++) {
    const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
    page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
    page.on('pageerror', (e) => console.error('[pageerror]', e.message));
    await page.goto(url);
    const info = await page.evaluate(() => window.ready);
    if (i === 0) {
      if (info.missingGlyphs?.length) { console.error('MISSING GLYPHS:', info.missingGlyphs.join(' ')); process.exit(2); }
      console.log(`fonts + images ok (${info.size.join('x')}${info.scenery === false ? ', NO SCENERY' : ''})`);
    }
    pages.push(page);
  }
  return pages;
}
const buf = (d) => Buffer.from(d.slice(d.indexOf(',') + 1), 'base64');
const frameAt = (page, t, sub) => page.evaluate(([t, sub, fps]) => window.renderAt(t, sub, fps), [t, sub, FPS]);

async function sheet(page, times, cols, tw, name, label = (t) => `${t.toFixed(2)} s · f${Math.round(t * FPS)}`) {
  const urls = [];
  for (const t of times) urls.push(await frameAt(page, t, 1));
  const out = await page.evaluate(async ({ urls, labels, cols, tw }) => {
    const load = (u) => new Promise((r) => { const im = new Image(); im.onload = () => r(im); im.src = u; });
    const first = await load(urls[0]), th = Math.round(tw * first.height / first.width), pad = 8, lab = 22;
    const rows = Math.ceil(urls.length / cols);
    const c = document.createElement('canvas'); c.width = cols * (tw + pad) + pad; c.height = rows * (th + lab + pad) + pad;
    const x = c.getContext('2d'); x.fillStyle = '#d6d2cc'; x.fillRect(0, 0, c.width, c.height); x.imageSmoothingQuality = 'high';
    for (let i = 0; i < urls.length; i++) {
      const im = await load(urls[i]);
      const cx = pad + (i % cols) * (tw + pad), cy = pad + Math.floor(i / cols) * (th + lab + pad);
      x.drawImage(im, cx, cy + lab, tw, th);
      x.fillStyle = '#111'; x.font = '600 14px system-ui'; x.fillText(labels[i], cx + 2, cy + 16);
    }
    return c.toDataURL('image/png');
  }, { urls, labels: times.map(label), cols, tw });
  await writeFile(join(OUT, name), buf(out));
  console.log(`review/fox/${name} written`);
}

async function main() {
  const srv = await serve();
  const url = `http://127.0.0.1:${srv.address().port}/${PAGE}?f=${F}&lang=${LANG}`;
  const browser = await chromium.launch({ channel: 'chrome', args: ['--force-color-profile=srgb', '--disable-lcd-text'] });
  await mkdir(OUT, { recursive: true });
  await mkdir(join(ROOT, 'out'), { recursive: true });

  if (mode === 'sheet') {
    const [page] = await openPages(browser, url, 1);
    const n = +opt('n', 32), step = +opt('step', 0.5), tw = +opt('tw', F === 'feed' ? 240 : 200);
    const times = Array.from({ length: n }, (_, i) => i * step + step / 2); // mid-beat by default
    if (!TAG) times[0] = 0; // the first clip: frame 0 must be the old post
    await sheet(page, times, +opt('cols', 8), tw, `${TAG}sheet_${F}_${LANG}.png`);
  }

  if (mode === 'frames') {
    const [page] = await openPages(browser, url, 1);
    for (const t of (args[1] || '0').split(',').map(Number)) await writeFile(join(OUT, `${TAG}${F}_${LANG}_${t.toFixed(2)}.png`), buf(await frameAt(page, t, 4)));
    console.log('frames written to review/fox/');
  }

  if (mode === 'strip') {
    const [page] = await openPages(browser, url, 1);
    const [a, b] = (args[1] || '0:0.5').split(':').map(Number);
    const times = []; for (let f = Math.round(a * FPS); f <= Math.round(b * FPS); f += +opt('step', 2)) times.push(f / FPS);
    await sheet(page, times, 8, 180, `${TAG}strip_${F}_${LANG}_${a}-${b}.png`);
  }

  if (mode === 'video') {
    const nPages = +opt('pages', 4), sub = +opt('sub', 4);
    const pages = await openPages(browser, url, nPages);
    const DUR = await pages[0].evaluate(() => window.DURATION), FRAMES = Math.round(FPS * DUR);
    const silent = join(ROOT, 'out', `${TAG}fox_${F}_${LANG}_silent.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'high', '-preset', opt('preset', 'slow'), '-crf', opt('crf', '16'),
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg ' + c)))));
    const pending = new Map(); let next = 0, issued = 0; const t0 = Date.now();
    const write = (b) => new Promise((r) => (ff.stdin.write(b) ? r() : ff.stdin.once('drain', r)));
    async function flush() { while (pending.has(next)) { const b = pending.get(next); pending.delete(next); await write(b); next++; if (next % 60 === 0) process.stdout.write(`\r${next}/${FRAMES}`); } }
    let flushing = Promise.resolve();
    await Promise.all(pages.map(async (page) => {
      while (issued < FRAMES) {
        const f = issued++;
        while (pending.size > 24) await new Promise((r) => setTimeout(r, 20));
        pending.set(f, buf(await frameAt(page, f / FPS, sub)));
        flushing = flushing.then(flush);
      }
    }));
    await flushing; ff.stdin.end(); await done;
    const audio = join(ROOT, 'audio', PAGE === 'fox.html' ? 'fox_mix.wav' : PAGE.replace(/\.html$/, '') + '_mix.wav'), final = join(ROOT, 'out', `Locca_${PAGE === 'fox.html' ? 'Fox' : 'FoxTour'}_${F}_${LANG}.mp4`);
    let hasAudio = true; try { await access(audio); } catch { hasAudio = false; }
    if (hasAudio) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', audio, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', final]);
    else execFileSync('cp', [silent, final]);
    console.log(`\nwrote ${final} (${hasAudio ? 'with audio' : 'silent'}) in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }

  await browser.close();
  srv.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
