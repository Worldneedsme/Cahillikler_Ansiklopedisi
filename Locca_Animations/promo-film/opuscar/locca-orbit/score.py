# "Yörüngeden sokağa" — score and foley from the page's events (events.json). Telemetry is synthesized (FM pings, ticks,
# scans, servo, ratchet, a pulse bass with 2nd/3rd harmonics); weight and colour come from real CC0 samples through the
# lemo-opuscar sampler: gran cassa for the hits, and one wet timbre (glass + bowed vibraphone) only where colour returns.
#   $LIB/.venv/bin/python score.py  → out/mix.wav (then mux.sh masters it to -14 LUFS)
import os, sys, json
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add, bp, hp, lp, noise, env_exp, norm, t_, limit

HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']
S.seed(3)
FR = 1 / 30
at = lambda t: t + FR
N = int(DUR * SR)
tel = np.zeros((N, 2), np.float32)            # telemetry and foley

# ---------- synthesized telemetry ----------
def ping(f=1760, d=.9, v=1.0):
    tt = t_(d); return norm(np.sin(2 * np.pi * f * tt + 2.2 * np.exp(-tt * 9) * np.sin(2 * np.pi * f * 2.0 * tt)) * env_exp(d, .22)) * v
def tick(f=4200, v=1.0):
    d = .018; tt = t_(d); return norm(np.sin(2 * np.pi * f * tt) * env_exp(d, .003) + hp(noise(d), 5000) * env_exp(d, .002) * .4) * v
def scan(d=.55, up=False):
    x = noise(d); out = np.zeros_like(x)
    for i in range(0, len(x), 480):
        hi = min(len(x), i + 480); p = i / len(x); f = (600 + 4200 * p) if up else (4800 - 4000 * p)
        out[i:hi] = bp(x[max(0, i - 2000):hi], f * .75, f * 1.25)[-(hi - i):]
    return norm(out * np.sin(np.pi * t_(d) / d) ** 1.4)
def servo(v=1.0):
    d = .14; tt = t_(d); f = 900 + 1400 * tt / d; return norm(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .3 * env_exp(d, .05) + bp(noise(d), 2000, 6000) * env_exp(d, .01)) * v
def ratchet(d):
    out = np.zeros(int(d * SR)); k = 0
    while k * .045 < d - .02: c = tick(2600 + 300 * (k % 2), .6); s = int(k * .045 * SR); out[s:s + len(c)] += c[:len(out) - s]; k += 1
    return out
def riser(d=2.2):
    tt = t_(d); f = 120 * (1 + 6 * (tt / d) ** 2); s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return norm(lp(s, 3000) * (tt / d) ** 1.5 * .6 + scan(d, True) * .7)
def hum(d):
    tt = t_(d); return norm(lp(np.sin(2 * np.pi * 55 * tt) + .4 * np.sin(2 * np.pi * 110 * tt) + .3 * noise(d) * .2, 400) * .7 + bp(noise(d), 2500, 6000) * .08)
def pulse_note(f, d=.22, v=1.0):   # bass with audible 2nd and 3rd harmonics, so it speaks on a phone
    tt = t_(d); return norm((np.sin(2 * np.pi * f * tt) + .55 * np.sin(4 * np.pi * f * tt) + .35 * np.sin(6 * np.pi * f * tt)) * env_exp(d, .07) * np.minimum(1, tt / .004)) * v
def whoosh_low(d=.8):
    tt = t_(d); return norm(lp(noise(d), 700) * np.sin(np.pi * tt / d) ** 2)

add(tel, hum(3.2), 0, .22, 0)
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'ping': add(tel, ping(1760), at(t), .3, .1)
    elif ty == 'dive':
        add(tel, riser(2.2), at(t), .3, 0)
        k, tk, gap = 0, t, .26
        while tk < 2.8: add(tel, tick(), at(tk), .18, .3 if k % 2 else -.3); tk += gap; gap = max(.05, gap * .84); k += 1
    elif ty == 'settle': add(tel, ping(1760), at(t), .32, 0)
    elif ty == 'bracket': add(tel, servo(), at(t), .2, .2)
    elif ty == 'pass': add(tel, scan(.55), at(t), .2, 0)
    elif ty == 'line': add(tel, ratchet(e['dur']), at(t), .2, .15)
    elif ty == 'range': add(tel, ping(2349, .5), at(t), .16, .2)
    elif ty == 'stamp': add(tel, ping(2637, .4), at(t), .2, -.2); add(tel, ping(2637, .4), at(t + .12), .16, -.2)
    elif ty == 'pull': add(tel, whoosh_low(.9), at(t), .2, 0)
    elif ty == 'full': add(tel, scan(1.0, True), at(t), .2, 0)
    elif ty == 'title': add(tel, ping(1760), at(t), .26, 0)
# the pulse: from the settle to the last pass, eighth notes on D, rising to A before 105
pulse = np.zeros((N, 2), np.float32)
for k in range(int((12.0 - 3.0) / .25)):
    t = 3.0 + k * .25; f = 73.42 if t < 9.5 else (110.0 if t < 10.3 else 73.42)
    add(pulse, pulse_note(f, .22, 1 if k % 2 == 0 else .7), at(t), .28, 0)
    add(tel, tick(5200, .5), at(t + .125), .05, .4)

# ---------- samples: weight and the one wet timbre ----------
ev = []
def n(t, inst, p, d, v, pan=0): ev.append((at(t), inst, p, d, v, pan))
def h(t, inst, var, v, pan=0): ev.append(dict(t=at(t), inst=inst, pitch=var, dur=None, vel=v, pan=pan))
h(2.8, 'gran_cassa', 'hit', .35)
for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'visit':   # a landing: gran cassa for points, a woodblock knock for the stamp; the glass note of colour coming back
        if e.get('stamp'): h(t + .4, 'woodblock', 'a', .5, -.2)
        else: h(t, 'gran_cassa', 'hit', .34)
        n(t, 'glass', ['D5', 'F#5', 'A5'][e['i']], 1.6, .55, .2)
        for p in [['D4', 'A4'], ['F#4', 'D5'], ['A4', 'E5']][e['i']]: ev.append(dict(t=at(t), inst='vibraphone_bowed', pitch=p, dur=1.6, vel=.35, pan=-.2, attack=.25))
    elif ty == 'hit105':
        h(t, 'gran_cassa', 'hit', .6); h(t, 'sus_cymbal', 'bow', .35, .2); n(t, 'glass', 'A5', 2.2, .6, .2); n(t, 'glass', 'D6', 2.2, .45, -.2)
        for p in ['D3', 'A3', 'F#4', 'E5']: ev.append(dict(t=at(t), inst='vibraphone_bowed', pitch=p, dur=2.4, vel=.45, pan=0, attack=.15))
    elif ty == 'full':
        for p in ['D4', 'F#4', 'A4', 'C#5', 'E5']: ev.append(dict(t=at(t), inst='vibraphone_bowed', pitch=p, dur=3.6, vel=.4, pan=0, attack=.8))
    elif ty == 'logo': n(t, 'hand_chimes', 'D6', 2.0, .4, 0); n(t, 'glass', 'F#5', 1.8, .35, .2)
    elif ty == 'fox': n(t, 'kalimba', 'A4', .8, .35, .3)
mus = S.render(ev, dur=DUR)

# ---------- mix: the suck-out before 105, a small room ----------
mix = tel + pulse + mus
env = np.ones(N, np.float32)
s0, s1 = int(at(10.0) * SR), int(at(10.3) * SR); env[s0:s1] = 10 ** (-25 / 20)
env[s1:s1 + int(.02 * SR)] = np.linspace(10 ** (-25 / 20), 1, int(.02 * SR))
pre = (tel + pulse) * env[:, None]
mix = pre + mus
mix = S.room(mix, size=.35, mix=.12)
fade = np.ones(N, np.float32); k = int(.7 * SR); fade[-k:] = np.cos(np.linspace(0, np.pi / 2, k)); mix *= fade[:, None]
mix = hp(mix.T, 40).T.astype(np.float32)
# the master lands at -14 LUFS with a true peak under -1.2 dB only if peaks sit within ~12.5 dB of the loudness: limit relative to RMS
ceil = min(.8, float(np.sqrt(np.mean(mix ** 2))) * 10 ** (12.5 / 20))
mix = np.stack([limit(mix[:, 0], ceil), limit(mix[:, 1], ceil)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
used = sorted({x[1] if isinstance(x, tuple) else x['inst'] for x in ev})
open(os.path.join(HERE, 'instruments.txt'), 'w').write('\n'.join(used + S.credits(used)) + '\n')
print('instruments:', used)
