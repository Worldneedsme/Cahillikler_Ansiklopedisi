# "5 saniyede kazan" — original surf-garage score and foley, written from the page's events (events.json).
# One tempo (126 BPM) in E; the speed-ups halve the note values: guitar quarters (tur 1) → eighths (tur 2) → tremolo
# sixteenths (tur 3). Real CC0 samples (Muldjord kit, FreePats bass and guitar, VCSL sax, xylophone, dan tranh,
# glockenspiel) through the lemo-opuscar sampler, plus a synthesized combo organ, square and pulse chips, and foley.
#   $LIB/.venv/bin/python score.py  → out/mix.wav (mux.sh masters it to -14 LUFS)
import os, sys, json
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add, bp, hp, lp, noise, env_exp, norm, t_, whoosh, limit, click, thump, pop, heartbeat, compress

HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json')))
DUR = E['dur']; EV = E['ev']
B = 60 / 126
S.seed(11)
ev, perc = [], []
def n(t, inst, p, d, v, pan=0, g=1.0): ev.append((t, inst, p, d, v, pan, g))
def h(t, inst, var, v, pan=0, d=None): perc.append(dict(t=t, inst=inst, pitch=var, dur=d, vel=v, pan=pan))
name = S.name

def have(inst):
    try: S.load(inst); return True
    except Exception: return False
BRASS = 'trumpet_stac' if have('trumpet_stac') else None

beats = [e for e in EV if e['type'] == 'beat']
sec_of = lambda t: next((b for b in reversed(beats) if b['t'] <= t + 1e-6), beats[0])
CH = [('E', [40, 47, 52, 56, 59]), ('G', [43, 50, 55, 59, 62]), ('A', [45, 52, 57, 61, 64]), ('B', [47, 54, 59, 63, 66])]
def chord_at(i): return CH[(i // 4) % 4]

# ---------- synth voices ----------
def organ(freqs, d, v=.5):
    tt = t_(d + .08); out = np.zeros_like(tt)
    vib = 1 + .003 * np.sin(2 * np.pi * 6.3 * tt)
    for f in freqs:
        for hm, a in [(1, 1), (2, .7), (3, .45), (4, .3), (6, .15), (8, .1)]:
            out += a * np.sin(2 * np.pi * f * hm * np.cumsum(vib) / SR)
    env = np.minimum(1, tt / .006) * np.where(tt < d, 1, np.exp(-(tt - d) / .03))
    out = lp(out * env, 4200) * (1 + .25 * np.sin(2 * np.pi * 5.8 * tt))
    out[:int(.004 * SR)] += noise(.004) * .6   # key click
    return norm(out) * v
def square(f, d, v=.5, duty=.5):
    tt = t_(d); ph = (f * tt) % 1; x = np.where(ph < duty, 1., -1.)
    return lp(x * np.minimum(1, tt / .002) * np.exp(-tt / (d * .9 + 1e-3)), 6000) * v
def hz(m): return 440 * 2 ** ((m - 69) / 12)

syn = np.zeros((int(DUR * SR) + SR, 2), np.float32)
def sadd(x, t, g=1., pan=0.): add(syn, x, t, g, pan)
post = np.zeros_like(syn)   # sounds added after the spot's gate

# ---------- the groove, beat by beat ----------
for b in beats:
    t, sid, kind, rnd, k = b['t'], b['sec'], b['kind'], b['round'], b['n']
    i = int(round(t / B)); name_, notes = chord_at(i); root = notes[0]
    if sid == 'spot' or (sid == 'open' and k < 4) or sid == 'rp': continue
    if sid == 'end' and k >= 6: continue
    level = {1: 1, 2: 2, 3: 3, 4: 3}.get(rnd, 1 if sid in ('open', 'h1', 'g1', 'g2', 'h2') else 2 if sid in ('g3', 'h3', 'g4', 'h4') else 3)
    if sid in ('fin', 'end'): level = 3
    # kit
    h(t, 'drum_kit', 'kick_drum_left' if k % 2 == 0 else 'kick_drum_right', .82 if k % 2 == 0 else .55)
    if k % 2 == 1: h(t, 'drum_kit', 'snare_1', .78, .05)
    if level >= 2 and k % 2 == 1: h(t + B * .75, 'drum_kit', 'snare_rest_1', .22, .05)   # ghost note
    sub = {1: 2, 2: 2, 3: 4}[level]
    for j in range(sub): h(t + j * B / sub, 'drum_kit', 'hi_hat_closed', (.42 if j == 0 else .26) * (1 if level < 3 else .85), .3)
    if level >= 2 and k % 4 == 2: h(t + B / 2, 'drum_kit', 'kick_drum_right', .5)
    # bass: root eighths with a fifth pick-up
    bn = root - 12 if root - 12 >= 28 else root
    n(t, 'electric_bass', bn, B * .45, .75, -.05); n(t + B / 2, 'electric_bass', bn if k % 4 != 3 else bn + 7, B * .4, .6, -.05)
    # guitar: the note value halves each round
    gnotes = [notes[0] + 12, notes[1] + 12, notes[2] + 12] if notes[0] < 52 else notes[:3]
    if level == 1:
        if k % 2 == 1: [n(t + q * .008, 'electric_guitar', p, B * .5, .55, .35) for q, p in enumerate(gnotes)]
    elif level == 2:
        for j in range(2): [n(t + j * B / 2 + q * .006, 'electric_guitar', p, B * .3, .5 if j else .58, .35) for q, p in enumerate(gnotes)]
    else:
        mel = [64, 67, 69, 71, 74, 71, 69, 67][(i) % 8]
        for j in range(4): n(t + j * B / 4, 'electric_guitar', mel, B * .22, .44 + .06 * (j == 0), .3)
    # organ: long chords on home stages, short stabs in games
    if kind in ('home', 'end') or sid == 'fin':
        if k % 2 == 0: sadd(organ([hz(m) for m in notes[1:4]], B * 1.9, .1), t, 1, -.3)
    elif k % 2 == 1: sadd(organ([hz(m) for m in notes[1:4]], B * .35, .1), t + B / 2, 1, -.3)

# ---------- events: stabs, colours per medium, foley ----------
def stab(t, v=.7, notes=(64, 68, 71)):
    for q, p in enumerate(notes):
        n(t + q * .004, 'tenor_sax_stac', p - 12, .25, v, -.15)
        if BRASS: n(t + q * .004, BRASS, p, .22, v * .9, .15)
def tada(t, up=True):
    for p, dt in ([(71, 0), (76, B / 2)] if up else [(67, 0), (63, B / 2)]): stab(t + dt, .72, (p - 7, p - 3, p))

def beep(f, d, v=.5): tt = t_(d); return np.sin(2 * np.pi * f * tt) * np.minimum(1, tt / .003) * np.exp(-tt / (d * .8)) * v
def squeak(d=.25):   # crayon wax on paper
    tt = t_(d); f = 1800 + 600 * np.sin(2 * np.pi * 9 * tt); x = bp(noise(d), 1200, 3800) * .5 + np.sin(2 * np.pi * np.cumsum(f) / SR) * .3
    return norm(x * np.sin(np.pi * tt / d)) * .5
def crack():
    d = .5; tt = t_(d); x = hp(noise(d), 2500) * env_exp(d, .05) + sum(np.sin(2 * np.pi * f * tt) * env_exp(d, .12) * .2 for f in (3100, 4700, 6200))
    out = norm(x)
    for k, dt in enumerate([.12, .21, .27]): s = int(dt * SR); out[s:s + 2000] += norm(beep(5200 - k * 700, 2000 / SR, 1)) * .4
    return out
def rattle(d):   # shutter coming down
    tt = t_(d); x = bp(noise(d), 300, 2500) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 22 * tt))); return norm(x) * .6
def crush(x, bits=5, ds=6): y = np.round(x * 2 ** bits) / 2 ** bits; return np.repeat(y[::ds], ds)[:len(x)]
def coin(): return np.concatenate([square(hz(83), .07, .5, .25), square(hz(88), .22, .5, .25)])
def thunk():
    d = .4; tt = t_(d); return norm(np.sin(2 * np.pi * (90 + 120 * np.exp(-tt / .02)) * tt) * env_exp(d, .09) + bp(noise(d), 400, 1800) * env_exp(d, .02) * .8)
def crowd(d, v=.5):
    tt = t_(d); x = bp(noise(d), 300, 2400); m = .6 + .4 * np.abs(np.sin(2 * np.pi * 3.1 * tt) * np.sin(2 * np.pi * 1.7 * tt + 1))
    return norm(x * m * np.minimum(1, tt / .2) * np.minimum(1, (d - tt) / .8)) * v
def relay(): return norm(hp(noise(.012), 2000) * env_exp(.012, .003)) * .5

for e in EV:
    t, ty = e['t'], e['type']
    if ty == 'button': sadd(click(.8), t, .5, -.35); sadd(thump(.6, 110), t, .35, -.35); h(t - B / 2, 'drum_kit', 'tom_2', .5); h(t - B / 4, 'drum_kit', 'tom_3', .55)
    elif ty == 'push': sadd(whoosh(.25), t, .28)
    elif ty == 'shrink': sadd(whoosh(.33), t, .22)
    elif ty == 'cmd':
        stab(t, .8); h(t, 'drum_kit', 'crash_left' if e['round'] % 2 else 'crash_right', .5 if e['medium'] != 'app' else .8)
        if e['medium'] == 'app': h(t, 'gran_cassa', 'hit', .75); h(t, 'drum_kit', 'china', .45)
    elif ty == 'ok': tada(t); h(t, 'claps', 'group', .45, 0)
    elif ty == 'fail': tada(t, False); sadd(beep(180, .4, .5), t, .4)
    elif ty == 'lights': h(t, 'drum_kit', 'tom_' + str(4 - e['n'] % 3), .7); sadd(thump(.8, 60), t, .5)
    elif ty == 'wake': n(t, 'glockenspiel', 'B6', .6, .35, -.3)
    # Swiss: woodblock steps, a clean pin
    elif ty == 'step_swiss': h(t, 'woodblock', 'b' if int(t / B * 4) % 2 else 'a', .3, .2)
    elif ty == 'cross': sadd(beep(420, .12, .4), t, .5, .3)
    elif ty == 'pin': h(t, 'woodblock', 'c', .6, 0); n(t, 'glockenspiel', 'E6', .8, .45, 0); n(t + .08, 'glockenspiel', 'B6', .8, .4, 0)
    elif ty == 'slide': sadd(whoosh(.3), t, .2, .2)
    # CRT: square beeps, relays, the scan
    elif ty == 'raise': sadd(square(hz(76), .08, .3), t, .5)
    elif ty == 'scan': sadd(beep(1250, e['dur'], .45), t, .5); [sadd(square(hz(m), .07, .25), t + j * .09, .5, .2) for j, m in enumerate([76, 79, 83, 88, 83, 88])]
    elif ty == 'type': sadd(relay(), t, .6, .25)
    elif ty == 'big': [sadd(square(hz(m), .1, .32), t + j * .07, .7) for j, m in enumerate([76, 80, 83, 88])]
    # crayon: xylophone colour, wax squeaks, the poğaça gag
    elif ty == 'skid': sadd(squeak(.35), t, .5, -.3); [n(t + j * .07, 'xylophone', p, .3, .5, -.2) for j, p in enumerate(['E5', 'G5', 'A5', 'B5'])]
    elif ty == 'reach': sadd(squeak(.2), t, .4, .1); n(t, 'xylophone', 'D6', .3, .45)
    elif ty == 'bip': sadd(beep(900, .16, .5), t, .6, .1)
    elif ty == 'squish': sadd(thump(.5, 140), t, .45); sadd(lp(noise(.12), 900) * env_exp(.12, .03), t, .25)
    elif ty == 'roll': n(t, 'xylophone', 'E5', .25, .4, .3)
    elif ty == 'bounce': h(t, 'woodblock', 'a', .35, .4)
    elif ty == 'huh': n(t, 'xylophone', 'A5', .4, .45); n(t + .12, 'xylophone', 'F5', .5, .4)
    elif ty == 'bip_slow': sadd(beep(450, .32, .5), t, .55, .1)
    elif ty == 'circle': sadd(squeak(.6), t, .4, .2)
    # pixel: pulse arps, bit-crushed foley
    elif ty == 'step_px': sadd(crush(noise(.03) * env_exp(.03, .008) * .4), t, .35, -.1)
    elif ty == 'jump': sadd(np.concatenate([square(hz(m), .03, .35, .25) for m in range(72, 86, 2)]), t, .5)
    elif ty == 'land': sadd(crush(thump(.7, 90)), t, .4)
    elif ty == 'slide_px': sadd(crush(bp(noise(.3), 500, 3000) * .5), t, .4)
    elif ty == 'shutter': sadd(rattle(e['dur']), t, .3, .2)
    elif ty == 'clunk': sadd(crush(thump(.9, 70)), t, .55); h(t, 'drum_kit', 'tom_4', .5)
    elif ty == 'scan_px': sadd(square(hz(88), .2, .3, .5), t, .45)
    elif ty == 'coin': sadd(coin(), t, .55)
    # woodcut: dan tranh plucks, gouge, the stamp
    elif ty == 'lift': [n(t + j * .1, 'dan_tranh', p, .9, .5, -.2) for j, p in enumerate(['E4', 'G4', 'A4'])]
    elif ty == 'whoosh': sadd(whoosh(.2), t, .3)
    elif ty == 'thunk': sadd(thunk(), t, .9); h(t, 'gran_cassa', 'hit', .5); n(t, 'dan_tranh', 'E3', 1.4, .7)
    elif ty == 'print': [n(t + j * .05, 'dan_tranh', p, .9, .5, .2) for j, p in enumerate(['B4', 'E5', 'G5', 'B5'])]
    # home
    elif ty == 'points': [sadd(beep(1500 + j * 90, .04, .3), t + j * .04, .45, 0) for j in range(11)]
    elif ty == 'rotate': sadd(whoosh(.45), t, .3)
    elif ty == 'speed':
        for j, p in enumerate([52, 55, 57, 59, 62, 64, 67, 69]): n(t + j * B / 4, 'tenor_sax_stac', p, .18, .55 + j * .03, -.1)
        if BRASS: [n(t + j * B / 4, BRASS, p + 12, .16, .5 + j * .03, .1) for j, p in enumerate([52, 55, 57, 59, 62, 64, 67, 69])]
    elif ty == 'life': sadd(crack(), t, .6, .1)
    elif ty == 'lights_off': add(post, thump(.9, 50), t, .55)
    elif ty == 'heart': add(post, heartbeat(.8), t, .6)
    # finale
    elif ty == 'shine': n(t, 'glockenspiel', 'E7', 1.0, .3, .3)
    elif ty == 'row': n(t, 'glockenspiel', 'B6', .6, .35, .2)
    elif ty == 'count': [n(t - .5 + j * .05, 'glockenspiel', p, .3, .22, -.2) for j, p in enumerate(['E6', 'G6', 'A6', 'B6', 'D7', 'E7'])]
    elif ty == 'stampdot': sadd(thunk(), t, .4); n(t, 'glockenspiel', 'G#6', .8, .4)
    elif ty == 'reward': stab(t, .85, (64, 68, 71)); stab(t + B / 2, .85, (68, 71, 76)); h(t, 'claps', 'group', .6)
    elif ty == 'wide': h(t, 'drum_kit', 'crash_right', .7); sadd(crowd(2.2, .5), t, .35); [h(t + j * .06, 'claps', 'group', .5, (j % 3 - 1) * .4) for j in range(14)]
    elif ty == 'cupfly': sadd(whoosh(.35), t, .3)
    elif ty == 'cupland': sadd(pop(.7), t, .5); n(t, 'glockenspiel', 'E7', .9, .35)
    # end
    elif ty == 'pack': sadd(whoosh(.3), t, .22)
    elif ty == 'pocket': sadd(pop(.8), t, .45)
    elif ty == 'word': n(t, 'glockenspiel', 'B6', .8, .3)
    elif ty == 'logo':
        for q, p in enumerate([40, 52, 56, 59, 63, 66]): n(t + q * .01, 'electric_guitar', p, 3.5, .55, .3)
        sadd(organ([hz(m) for m in (56, 59, 63, 66)], 3.0, .14), t, 1, -.3); stab(t, .7, (63, 66, 71))
        n(t, 'electric_bass', 28, 2.5, .8)
        h(t, 'drum_kit', 'crash_left', .6); h(t, 'drum_kit', 'kick_drum_left', .9)
    elif ty == 'sip': sadd(lp(noise(.35), 1500) * np.sin(np.pi * t_(.35) / .35) * .3, t, .4)

mus = S.render(ev + perc, dur=DUR + 1)
mix = mus[:len(syn)] if len(mus) >= len(syn) else np.pad(mus, ((0, len(syn) - len(mus)), (0, 0)))
mix = mix + syn
# the instant replay: the groove tape-stops into half speed
r0 = next(e['t'] for e in EV if e['type'] == 'replay'); r1 = r0 + 6 * B
src = mix[int((r0 - 1.4) * SR):int(r0 * SR)].copy()
idx = np.arange(int((r1 - r0) * SR)) * .5; idx = np.minimum(idx, len(src) - 1)
half = np.stack([np.interp(idx, np.arange(len(src)), src[:, c]) for c in (0, 1)], 1)
fade_in = np.minimum(1, np.arange(len(half)) / (.05 * SR))[:, None]
seg_ = slice(int(r0 * SR), int(r0 * SR) + len(half))
mix[seg_] = mix[seg_] * .55 + lp(half.T, 2200).T * .55 * fade_in
mix = S.room(mix, size=.32, mix=.12)
# the spot: a real silence, only the heartbeat survives
sp = [e['t'] for e in EV if e['type'] == 'lights_off'][0]; sp1 = sp + 4 * B
gate = np.ones(len(mix)); a, b_ = int(sp * SR), int(sp1 * SR); r = int(.18 * SR)
gate[a:b_] = .03; gate[a:a + r] = np.linspace(1, .03, r)
mix = mix * gate[:, None] + post[:len(mix)]
# tame the low end: keep 20-120 Hz about 3 dB under the rest
mix = mix - .42 * lp(mix.T, 120).T
mix = mix[:int(DUR * SR)]
fade = np.ones(len(mix), np.float32); k = int(.8 * SR); fade[-k:] = np.cos(np.linspace(0, np.pi / 2, k)); mix *= fade[:, None]
# measured limit relative to RMS (mux.sh wants true peak <= -1.2 dB after loudnorm)
rms = np.sqrt(np.mean(mix ** 2)); ceil = min(.95, rms * 10 ** (12.5 / 20))
mix = np.stack([limit(mix[:, 0], ceil), limit(mix[:, 1], ceil)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
used = sorted({x[1] if isinstance(x, tuple) else x['inst'] for x in ev + perc})
open(os.path.join(HERE, 'instruments.txt'), 'w').write('\n'.join(used + S.credits(used)) + '\n')
print('instruments:', used, 'brass:', BRASS)
