# python3 music.py timeline.json out.wav [seed]  -- original music bed, made from scratch (no samples)
import json, sys, numpy as np, wave
tl = json.load(open(sys.argv[1])); dur = tl['duration'] + 0.3; cuts = tl['cuts']
seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1
rng = np.random.default_rng(seed)
SR = 44100; N = int(dur * SR); t = np.arange(N) / SR
bpm = 104; beat = 60 / bpm
mix = np.zeros(N); 
def add(sig, at, gain=1.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if i < N: mix[i:j] += sig[:j - i] * gain
def env(n, a=0.005, r=0.3):
    x = np.arange(n) / SR; e = np.minimum(1, x / a) * np.exp(-x / r); return e
note = lambda m: 440 * 2 ** ((m - 69) / 12)
progs = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]]  # Am9-ish, F, C, G
if seed % 2: progs = [[50, 53, 57, 60], [46, 50, 53, 57], [53, 57, 60, 64], [48, 52, 55, 60]]
bar = 4 * beat
nb = int(dur / bar) + 1
for b in range(nb):
    ch = progs[b % 4]; n = int(bar * SR) + SR
    x = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * note(m) * x + 0.3 * np.sin(2 * np.pi * 0.5 * x)) for m in ch) / 4
    pad *= np.minimum(1, x / 0.4) * np.exp(-x / 3.5)
    add(pad, b * bar, 0.18)
    bass = np.sin(2 * np.pi * note(ch[0] - 24) * x) * env(n, 0.01, 0.9)
    add(bass, b * bar, 0.35); add(bass, b * bar + 2.5 * beat, 0.25)
    for s in range(8):  # pluck arp on eighths
        m = ch[[0, 2, 1, 3, 2, 1, 3, 2][s]] + 12
        k = int(0.4 * SR); xx = np.arange(k) / SR
        pl = (np.sin(2 * np.pi * note(m) * xx) + 0.3 * np.sin(4 * np.pi * note(m) * xx)) * env(k, 0.002, 0.12)
        add(pl, b * bar + s * beat / 2, 0.10)
nbeats = int(dur / beat) + 1
for k in range(nbeats):
    at = k * beat
    if at < 0.9: continue  # quiet intro
    n = int(0.35 * SR); x = np.arange(n) / SR
    f = 110 * np.exp(-x * 25) + 45
    kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.12)
    if k % 2 == 0: add(kick, at, 0.55)
    else:
        sn = rng.standard_normal(int(0.2 * SR)) * env(int(0.2 * SR), 0.001, 0.05)
        add(sn, at, 0.12)
    for h in (0, 0.5):
        hn = rng.standard_normal(int(0.05 * SR)); hn = np.diff(hn, prepend=0) * env(len(hn), 0.001, 0.015)
        add(hn, at + h * beat, 0.06)
for c in cuts[1:]:  # whoosh into each cut
    n = int(0.6 * SR); x = np.arange(n) / SR
    w = rng.standard_normal(n); w = np.convolve(w, np.ones(30) / 30, 'same') * np.sin(np.pi * x / 0.6) ** 2
    add(w, c - 0.45, 0.35)
for c in cuts[1:-1]:  # price tick when the price lands (deal start + 2.6 s)
    n = int(0.25 * SR); x = np.arange(n) / SR
    add(np.sin(2 * np.pi * 1760 * x) * env(n, 0.001, 0.06) + 0.5 * np.sin(2 * np.pi * 2637 * x) * env(n, 0.001, 0.05), c + 2.6, 0.18)
fade = np.ones(N); fl = int(1.2 * SR); fade[-fl:] = np.linspace(1, 0, fl); fade[:int(0.3 * SR)] = np.linspace(0, 1, int(0.3 * SR))
mix *= fade; mix /= np.max(np.abs(mix)) + 1e-9; mix *= 0.85
st = np.stack([mix, np.roll(mix, 220)], 1)
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
