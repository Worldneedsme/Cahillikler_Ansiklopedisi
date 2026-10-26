// The tempo grid: the single source of truth for picture, score and subtitles. One tempo (126 BPM); the speed-ups
// shorten games, dwell and command holds and raise the fox's frame rate, while the score halves its note values.
export const BPM = 126;
export const B = 60 / BPM;
export const W = 1080, H = 1920;

// [id, beats, kind, extra]
const RAW = [
  ['open', 6, 'home'],
  ['g1', 8, 'game', { round: 1, cmd: 'find', medium: 'swiss' }],
  ['h1', 4, 'home'],
  ['g2', 8, 'game', { round: 1, cmd: 'scan', medium: 'crt' }],
  ['h2', 4, 'home', { speed: true }],
  ['g3', 6, 'game', { round: 2, cmd: 'scan', medium: 'crayon', fail: true }],
  ['rp', 6, 'replay'],
  ['h3', 2, 'home'],
  ['g4', 6, 'game', { round: 2, cmd: 'run', medium: 'pixel' }],
  ['h4', 4, 'home', { speed: true }],
  ['g5', 5, 'game', { round: 3, cmd: 'stamp', medium: 'woodcut' }],
  ['spot', 4, 'home', { spot: true }],
  ['fin', 12, 'game', { round: 4, cmd: 'win', medium: 'app' }],
  ['end', 12, 'end'],
];
let acc = 0;
export const SECS = RAW.map(([id, beats, kind, x]) => { const s = { id, beats, kind, t0: acc * B, t1: (acc + beats) * B, b0: acc, ...(x || {}) }; acc += beats; return s; });
export const DUR = acc * B;
export const S = Object.fromEntries(SECS.map(s => [s.id, s]));
export const at = (id, beat = 0) => S[id].t0 + beat * B;
export const secAt = t => { for (const s of SECS) if (t < s.t1) return s; return SECS[SECS.length - 1]; };

// The speed ladder per round.
export const LADDER = {
  1: { hold: 1.1, fps: 8 },
  2: { hold: 0.9, fps: 12 },
  3: { hold: 0.8, fps: 15 },
  4: { hold: 0.8, fps: 30 },
};
export const PUSH = 0.25, SHRINK = 0.33;     // transitions through the phone screen
