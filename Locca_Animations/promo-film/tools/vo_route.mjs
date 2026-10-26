// Locca "Tilkinin Alanya rotası" (hf/fox-route): lays the ElevenLabs dialogue over the score and swaps the audio of the rendered video.
// Usage: node tools/vo_route.mjs <dialogue.mp3> [lang]   (default lang tr; reads out/Locca_FoxRoute_story_<lang>.mp4)
// Each line is cut from the recording at its silences (silencedetect -40 dB, 0.3 s) and placed at its beat in the film;
// the score ducks under the voice (sidechain), then the whole mix goes to -14 LUFS like the score alone.
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const [src, LANG = 'tr'] = process.argv.slice(2);
if (!src) throw new Error('usage: node tools/vo_route.mjs <dialogue.mp3> [lang]');

// [from, to] in the recording → at (seconds in the film). Times for "Marketing Campaign TR.mp3" (2026-10-21, 46.3 s).
const LINES = {
  tr: [
    [0.00, 0.64, 1.15],   // TİLKİ: Hı?            the pin lands on the sleeping fox (1.1)
    [1.30, 2.01, 2.00],   // TİLKİ: Oo!            awake, looking up at the pin
    [2.50, 4.89, 3.05],   // ANLATICI: Yereli keşfet, ödülleri kazan.   ends 5.44, scene 2 at 6.0 (held)
    [6.09, 9.54, 4.65],   // ANLATICI: Önce ziyaret et: sevdiğin mekanları bul, uğra.   a breath after scene 1 (0.8 s)
    [11.05, 11.47, 8.75], // TİLKİ: Yemek!         the restaurant stop
    [12.16, 12.56, 10.40],// TİLKİ: Tatlı!         the dessert stop
    [13.39, 13.87, 12.10],// TİLKİ: Kahve.         arriving at the café
    [14.48, 17.76, 13.30],// ANLATICI: Sonra tarat: kasada Locca QR kodunu göster.
    [18.91, 19.88, 16.70],// KASİYER: Okuttum, tamam!
    [20.48, 23.40, 19.30],// ANLATICI: Ve her ziyarette puan ya da damga kazan.
    [24.59, 26.25, 26.30],// TİLKİ: Kart doldu!    the 8th stamp slams
    [26.45, 28.31, 29.00],// TİLKİ: Kahve benden değil, Locca'dan!
    [29.17, 31.46, 31.30],// ANLATICI: Bir yerde kazan, başka yerde harca.
    [32.37, 33.21, 33.70],// TİLKİ: Puanla ödesem?  the Loccard chip arrives
    [33.85, 34.81, 34.60],// SATICI: Tabii, hemen!  the chip lands, ₺250 → ₺145
    [35.34, 37.57, 37.10],// ANLATICI: Ziyaret et. Tarat. Kazan.
    [38.18, 40.57, 40.80],// ANLATICI: QR kodunu göster, kazanmaya başla.
    [41.21, 42.92, 44.60],// ANLATICI: Locca. Çok yakında.
    [44.03, 44.66, 46.60],// TİLKİ: Görüşürüz!
  ],
  // "Marketing Campaign EN.mp3" (2026-10-21, 38.2 s); joined lines split at their quietest 40 ms
  en: [
    [0.00, 0.51, 1.15],   // FOX: Hm?
    [1.34, 1.91, 2.00],   // FOX: Oh!
    [2.30, 4.68, 3.05],   // NARRATOR: Discover local. Earn rewards.   ends 5.43
    [5.26, 8.92, 4.55],   // NARRATOR: First, visit: find the places you love, and drop by.
    [9.40, 9.88, 8.85],   // FOX: Dinner!
    [10.06, 10.69, 10.40],// FOX: Dessert!
    [11.01, 11.62, 12.10],// FOX: Coffee!
    [0.00, 3.95, 13.00, { file: 'scan_register.mp3', gain: 1.12 }], // NARRATOR: Then scan: show your Locca QR code at the register. (retake, 2026-10-21; 1 dB quieter than the dialogue)
    [15.99, 17.43, 17.05],// CASHIER: Scanned, all set!
    [17.79, 20.41, 19.30],// NARRATOR: And earn points or stamps on every visit.
    [20.82, 21.98, 26.30],// FOX: Card's full!
    [22.10, 23.38, 29.00],// FOX: Coffee's on Locca!
    [23.74, 26.20, 31.30],// NARRATOR: Earn at one place, spend at another.
    [26.63, 27.74, 33.90],// FOX: Can I pay with points?
    [27.94, 28.66, 35.10],// SHOPKEEPER: Of course!
    [28.98, 31.37, 37.10],// NARRATOR: Visit. Scan. Earn.
    [32.05, 34.51, 40.80],// NARRATOR: Show your QR code and start earning.
    [35.20, 36.82, 44.60],// NARRATOR: Locca. Coming soon.
    [37.33, 38.19, 46.60],// FOX: See you soon!
  ],
  // audio/vo/ru/dialogue_v4.mp3 (ElevenLabs v4, 2026-10-21, 38.0 s): cut at its own speech runs (-42 dB, 120 ms gaps)
  ru: [
    [0.19, 0.47, 1.15],   // ЛИС: Ммм?
    [0.94, 1.41, 2.00],   // ЛИС: Ой!
    [1.74, 4.75, 2.80],   // ДИКТОР: Открой приложение Locca. Получи бонусы.   ends 5.81, scene 2 at 6.0
    [5.23, 7.30, 4.50],   // ДИКТОР: Сначала находи любимые места.
    [7.55, 8.20, 8.85],   // ЛИС: Ужин!
    [8.38, 9.42, 10.40],  // ЛИС: Десерт!
    [9.79, 10.73, 11.90], // ЛИС: И кофе.
    [11.07, 14.72, 13.05],// ДИКТОР: Потом сканируй. Покажи QR-код Locca на кассе.
    [14.99, 15.70, 17.05],// КАССИР: Готово!
    [15.99, 18.89, 19.30],// ДИКТОР: И получай баллы или штампы за каждый визит.
    [19.17, 20.94, 26.30],// ЛИС: О! Карта полная!
    [21.18, 23.56, 28.75],// ЛИС: Ха-ха! Кофе от Locca!
    [23.85, 26.48, 31.35],// ДИКТОР: Копи здесь, а трать в другом месте.
    [26.79, 27.88, 34.10],// ЛИС: А баллами можно?   the chip lands at 34.0-34.5
    [28.09, 28.81, 35.40],// ПРОДАВЕЦ: Конечно!
    [29.09, 31.45, 37.10],// ДИКТОР: Заходи. Сканируй. Получай.
    [31.90, 34.66, 40.60],// ДИКТОР: Покажи QR-код и начни получать бонусы.
    [35.11, 36.52, 44.60],// ДИКТОР: Locca — скоро!
    [36.94, 37.80, 46.60],// ЛИС: До встречи!
  ],
}[LANG];

// two holds of one bar each (2026-10-21, same HOLDS as index.html): lines are written in the original picture times
const HOLDS = [[4, 2], [6, 2]];
for (const l of LINES) l[2] = HOLDS.reduce((u, [at, d]) => (l[2] >= at ? u + d : u), l[2]);
// a language may drop still frames, in film seconds [from, length]: Russian's visit line is short, so 1 s of the
// held ZİYARET ET. screen (still from 7.6 to 10.6 s) comes out, on the beat; the score and the later lines move up with it
const CUT = { ru: [9.0, 1.0] }[LANG];
const DUR = 52 - (CUT ? CUT[1] : 0);
if (CUT) for (const l of LINES) {
  if (l[2] < CUT[0] && l[2] + (l[1] - l[0]) > CUT[0]) throw new Error(`a line runs into the cut at ${l[2]}`);
  if (l[2] >= CUT[0]) l[2] -= CUT[1];
}

const score = join(ROOT, 'audio', 'fox-route_mix.wav');
const raw = join(ROOT, 'audio', `fox-route_vo_${LANG}_raw.wav`), fin = join(ROOT, 'audio', `fox-route_vo_${LANG}.wav`);
const video = join(ROOT, 'out', `Locca_FoxRoute_story_${LANG}.mp4`);

// a line may come from a retake: [from, to, at, { file, gain }], the file next to the dialogue
const FILES = [src, ...new Set(LINES.filter((l) => l[3]).map((l) => join(dirname(src), l[3].file)))];
const inputOf = (l) => (l[3] ? FILES.indexOf(join(dirname(src), l[3].file)) : 0);
const pad = 0.04; // keep the breath-in and the tail of each line
// every dialogue is brought to -18 LUFS before mixing (ElevenLabs exports range from -21 to -14), so the voice/music balance is the same in each language
const lufs = (f) => { const e = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${f}" -af ebur128 -f null - 2>&1`]).toString(); return Number(e.match(/I:\s+(-?[\d.]+) LUFS/g).pop().match(/-?[\d.]+/)[0]); };
const LEVEL = Math.pow(10, (-18 - lufs(src)) / 20);
// one split per recording (one branch per line it feeds), then each line is cut, faded, placed, and all are mixed into one voice track
const split = FILES.map((_, k) => { const n = LINES.filter((l) => inputOf(l) === k).length;
  return `[${k + 1}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,asplit=${n}${LINES.map((l, i) => (inputOf(l) === k ? `[s${i}]` : '')).join('')}`; }).join(';');
const cuts = LINES.map(([a, b, at, o], i) =>
  `[s${i}]atrim=${Math.max(0, a - pad)}:${b + pad},asetpts=PTS-STARTPTS,volume=${((o?.gain ?? 1) * LEVEL).toFixed(3)},afade=t=in:d=0.02,afade=t=out:st=${(b - a + pad * 2 - 0.04).toFixed(3)}:d=0.04,adelay=${Math.round((at - pad) * 1000)}:all=1[v${i}]`);
const vo = `${LINES.map((_, i) => `[v${i}]`).join('')}amix=inputs=${LINES.length}:normalize=0,apad=whole_dur=${DUR},volume=1.6,asplit=2[vo][key]`;
const bed = CUT ? `[0:a]asplit=2[ba][bb];[ba]atrim=0:${CUT[0]},asetpts=PTS-STARTPTS[b0];[bb]atrim=${CUT[0] + CUT[1]},asetpts=PTS-STARTPTS[b1];[b0][b1]acrossfade=d=0.03,apad=whole_dur=${DUR}[score]` : '[0:a]anull[score]';
const duck = `[score][key]sidechaincompress=threshold=0.015:ratio=4:attack=15:release=400:makeup=1[bed]`;
const mix = `[bed]volume=0.4[bed2];[bed2][vo]amix=inputs=2:normalize=0:duration=first[out]`;
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', score, ...FILES.flatMap((f) => ['-i', f]),
  '-filter_complex', [split, ...cuts, vo, bed, duck, mix].join(';'), '-map', '[out]', '-ar', '48000', '-c:a', 'pcm_s24le', raw]);

// loudness: two-pass EBU R128 to -14 LUFS, true peak under -2.2 dBTP (same as tools/audio_route.mjs)
const meas = (file) => { const e = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${file}" -af loudnorm=I=-14:TP=-2.2:LRA=11:print_format=json -f null - 2>&1`]).toString(); return JSON.parse(e.slice(e.lastIndexOf('{'), e.lastIndexOf('}') + 1)); };
const m = meas(raw);
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', raw, '-af',
  `loudnorm=I=-14:TP=-2.2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
  '-ar', '48000', '-c:a', 'pcm_s24le', fin]);
const m2 = meas(fin);
console.log(`loudness: ${m2.input_i} LUFS, true peak ${m2.input_tp} dBTP`);

// swap the video's audio; the picture is copied untouched, unless this language drops frames and the render still has them
const tmp = video.replace('.mp4', '.vo.mp4');
const vdur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).toString());
const cutVideo = CUT && vdur > DUR + 0.5;
const vargs = cutVideo
  ? ['-filter_complex', `[0:v]split=2[va][vb];[va]trim=0:${CUT[0]},setpts=PTS-STARTPTS[v0];[vb]trim=start=${CUT[0] + CUT[1]},setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0[v]`,
    '-map', '[v]', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-profile:v', 'high']
  : ['-map', '0:v', '-map', '1:a', '-c:v', 'copy'];
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', fin, ...vargs,
  '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', tmp]);
execFileSync('mv', [tmp, video]);
console.log(`→ ${video}`);
