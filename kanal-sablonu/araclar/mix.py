"""Ses miksi: seslendirme + prosedürel efektler + yumuşak müzik → videoya ekler.
Kullanım: python mix.py <video_klasoru>
Girdi: <klasör>/out/video.mp4, <klasör>/out/olaylar.json, <klasör>/ses/<sahne>.mp3
Çıktı: <klasör>/<ad>.mp4 (-14 LUFS, AAC 192k)
"""
import json, os, subprocess, sys

import numpy as np

SR = 48000
MUZIK = 0.5  # müzik seviyesi (önceki 0.9, kullanıcı isteğiyle kısıldı; yaklaşık −5 dB)
FFMPEG = r'C:\Users\Win10\tools\ffmpeg-8.1\bin\ffmpeg.exe'
rng = np.random.default_rng(7)


def decode(path):
    raw = subprocess.run([FFMPEG, '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def env(n, a=0.005, r=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def tone(f, dur, a=0.005, r=0.1, kind='sine'):
    n = int(dur * SR); t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f(t) if callable(f) else np.full(n, f)) / SR
    w = np.sin(ph) if kind == 'sine' else np.sign(np.sin(ph)) * 0.5
    return w * env(n, a, r)


def noise(dur, lo, hi, a=0.01, r=0.1):
    n = int(dur * SR)
    spec = np.fft.rfft(rng.standard_normal(n))
    fr = np.fft.rfftfreq(n, 1 / SR)
    spec[(fr < lo) | (fr > hi)] = 0
    return np.fft.irfft(spec, n) * env(n, a, r) * 3


SFX = {
    'pop': lambda: tone(lambda t: 500 + 900 * np.exp(-t * 40), 0.12, 0.002, 0.04) * 0.6,
    'ding': lambda: (tone(1318, 0.9, 0.002, 0.35) + 0.5 * tone(1976, 0.9, 0.002, 0.25)) * 0.35,
    'buzz': lambda: tone(lambda t: 150 - 30 * t, 0.42, 0.005, 0.3, 'square') * 0.35,
    'boing': lambda: tone(lambda t: 220 + 260 * np.sin(t * 28) * np.exp(-t * 5), 0.5, 0.003, 0.25) * 0.5,
    'thump': lambda: (tone(lambda t: 110 * np.exp(-t * 6) + 45, 0.35, 0.001, 0.12) + noise(0.35, 60, 900, 0.001, 0.05) * 0.4) * 0.9,
    'click': lambda: noise(0.05, 1500, 6000, 0.0005, 0.012) * 0.6,
    'plink': lambda: tone(lambda t: 1800 - 600 * t, 0.15, 0.001, 0.05) * 0.3,
    'tick': lambda: noise(0.04, 2500, 8000, 0.0005, 0.008) * 0.5,
    'bell': lambda: sum(tone(f, 1.4, 0.002, 0.5) * g for f, g in [(1046, 0.5), (1568, 0.3), (2093, 0.2)]) * (0.5 + 0.5 * np.sign(np.sin(np.arange(int(1.4 * SR)) / SR * 2 * np.pi * 14))) * 0.3,
    'whoosh': lambda: noise(0.45, 300, 3500, 0.2, 0.12) * 0.45,
    'swish': lambda: noise(0.25, 800, 5000, 0.08, 0.06) * 0.35,
}


def music(dur):
    """Yumuşak, uzaysı pad + hafif arpej: C - Am - F - G, 96 BPM."""
    n = int(dur * SR); out = np.zeros(n)
    beat = 60 / 96; bar = beat * 4
    chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    t = np.arange(int(bar * SR)) / SR
    pad_env = np.minimum(1, t / 0.6) * np.minimum(1, (bar - t) / 0.6)
    for b in range(int(dur / bar) + 1):
        ch = chords[b % 4]; s0 = int(b * bar * SR)
        seg = sum(np.sin(2 * np.pi * hz(m) * t) + 0.3 * np.sin(2 * np.pi * hz(m) * 2 * t) for m in ch) * pad_env * 0.05
        seg += np.sin(2 * np.pi * hz(ch[0] - 24) * t) * pad_env * 0.06
        e = min(n, s0 + len(seg)); out[s0:e] += seg[:e - s0]
        for k in range(8):  # sekizlik arpej
            m = ch[k % 3] + 12 * (k // 3 % 2)
            a = s0 + int(k * beat / 2 * SR); pl = tone(hz(m + 12), 0.4, 0.003, 0.15) * 0.05
            e = min(n, a + len(pl));
            if a < n: out[a:e] += pl[:e - a]
    fade = np.minimum(1, np.arange(n) / (0.5 * SR)) * np.minimum(1, (n - np.arange(n)) / (1.0 * SR))
    return out * fade


def main():
    k = sys.argv[1].rstrip('/\\'); ad = os.path.basename(k)
    meta = json.load(open(os.path.join(k, 'out', 'olaylar.json'), encoding='utf-8'))
    dur = meta['DUR']; n = int(dur * SR) + SR
    voice = np.zeros(n); fx = np.zeros(n)
    for v in meta['VO']:
        a = decode(os.path.join(k, 'ses', v['id'] + '.mp3'))
        s = int(v['t'] * SR); e = min(n, s + len(a)); voice[s:e] += a[:e - s]
    for ev in meta['EV']:
        snd = SFX[ev['type']](); s = int(ev['t'] * SR); e = min(n, s + len(snd)); fx[s:e] += snd[:e - s]
    mus = music(dur); mus = np.pad(mus, (0, n - len(mus)))
    # konuşma sırasında müziği kıs (ducking)
    win = int(0.15 * SR)
    vol = np.convolve(np.abs(voice), np.ones(win) / win, mode='same')
    duck = 1 - 0.55 * np.clip(vol / (vol.max() * 0.15 + 1e-9), 0, 1)
    mix = voice * 1.0 + fx * 0.8 + mus * duck * MUZIK
    mix = mix[: int(dur * SR)]
    wav = os.path.join(k, 'out', 'mix.f32')
    mix.astype(np.float32).tofile(wav)
    final = os.path.join(k, ad + '.mp4')
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', os.path.join(k, 'out', 'video.mp4'), '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', wav,
                    '-filter_complex', '[1:a]acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=9,aformat=channel_layouts=stereo[a]',
                    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', str(SR), '-movflags', '+faststart', '-shortest', final], check=True)
    os.remove(wav)
    print('Bitti:', final)


if __name__ == '__main__':
    main()
