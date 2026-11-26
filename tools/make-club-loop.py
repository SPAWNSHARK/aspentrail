# Renders the Hiveport club loop (user, Nov 26: "like Afterlife in Mass Effect 2") — an ORIGINAL track in that style:
# dark driving electro-industrial, 124 BPM, A minor with a phrygian Bb, four-on-the-floor kick, sidechain-pumped rolling
# bass, gritty 16th arpeggio with dotted-8th ping-pong delay and a slow filter sweep, dark pad, claps, hats, big reverb.
# Everything is synthesised here (numpy only). The whole loop is rendered CIRCULARLY (FFT reverb, rolled delays) so its
# end flows straight back into its start. Output: hiveport/audio/hiveport_club_loop.wav → ffmpeg to .m4a/.mp3.
import numpy as np, wave, sys
SR = 44100; BPM = 124; BEAT = 60 / BPM; BARS = 16; N = int(round(SR * BEAT * 4 * BARS)); T = np.arange(N) / SR
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
def at(t): return int(round(t * SR)) % N
def place(buf, sig, t, gain=1.0):
    i = at(t); n = len(sig); end = i + n
    if end <= N: buf[i:end] += sig * gain
    else: k = N - i; buf[i:] += sig[:k] * gain; buf[:n - k] += sig[k:] * gain
def note_hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def saw_lp(f0, dur, fc_env, res=0.0, detune=0.0, harm=60):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for d in ([0.0] if not detune else [-detune, detune]):
        f = f0 * 2 ** (d / 1200); ph = rng.random() * 2 * np.pi
        for k in range(1, harm + 1):
            fk = f * k
            if fk > 16000: break
            w = (1 / k) / np.sqrt(1 + (fk / fc_env) ** 6)
            if res: w = w + res * (1 / k) * np.exp(-((fk - fc_env) / (0.18 * fc_env)) ** 2)
            out += w * np.sin(2 * np.pi * fk * t + ph * k)
    return out / (2 if detune else 1)
def env_ad(n, a, d):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)); return e * np.exp(-np.maximum(0, t - a) / d)

# ── harmony: Am | Am | Bb | G  (×4) ──
CH = [[57, 60, 64], [57, 60, 64], [58, 62, 65], [55, 59, 62]]
ROOT = [33, 33, 34, 31]

# ── kick + sidechain curve ──
kick = None; side = np.ones(N)
kn = int(0.45 * SR); kt = np.arange(kn) / SR
kf = 45 + 110 * np.exp(-kt / 0.035); kick = np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-kt / 0.28)
kick += 0.4 * rng.standard_normal(kn) * np.exp(-kt / 0.004)
pump_n = int(BEAT * SR); pt = np.arange(pump_n) / SR; pump = 1 - 0.85 * np.exp(-pt / 0.11)
for b in range(BARS * 4):
    t0 = b * BEAT; place(L, kick, t0, 0.9); place(R, kick, t0, 0.9)
    i = at(t0); side[i:i + pump_n] = np.minimum(side[i:i + pump_n], pump[:len(side[i:i + pump_n])])

# ── claps on 2 and 4 (layered noise bursts) ──
cn = int(0.35 * SR); ct = np.arange(cn) / SR
clap = np.zeros(cn)
for off in (0, 0.011, 0.022): j = int(off * SR); clap[j:] += rng.standard_normal(cn - j) * np.exp(-ct[:cn - j] / (0.012 if off < 0.02 else 0.09))
C = np.fft.rfft(clap); cf = np.fft.rfftfreq(cn, 1 / SR); C[(cf < 800) | (cf > 4200)] *= 0.08; clap = np.fft.irfft(C, cn); clap /= np.abs(clap).max()   # band-passed snap
wet_send = np.zeros(N)
for b in range(BARS * 4):
    if b % 4 in (1, 3): place(L, clap, b * BEAT, 0.13); place(R, clap, b * BEAT, 0.13); place(wet_send, clap, b * BEAT, 0.05)

# ── hats: closed 16ths (accented offbeats), open hat on the "and" ──
hn = int(0.06 * SR); hat = 0.5 * np.diff(rng.standard_normal(hn + 1)) * np.exp(-np.arange(hn) / SR / 0.012)
on_ = int(0.3 * SR); ohat = 0.5 * np.diff(rng.standard_normal(on_ + 1)) * np.exp(-np.arange(on_) / SR / 0.09)
for s in range(BARS * 16):
    t0 = s * BEAT / 4; pan = 0.15 * np.sin(s * 1.3)
    g = 0.05 if s % 4 == 2 else 0.022
    if s % 4 == 2 and s % 8 == 6: place(L, ohat, t0, 0.035 * (1 - pan)); place(R, ohat, t0, 0.035 * (1 + pan))
    else: place(L, hat, t0, g * (1 - pan)); place(R, hat, t0, g * (1 + pan))

# ── rolling bass: 16ths off the kick, filter plucks, pumped by the kick ──
bass = np.zeros(N)
for bar in range(BARS):
    r = ROOT[bar % 4]
    for s in range(16):
        if s % 4 == 0: continue
        m = r + (12 if s in (7, 15) else 0)
        dur = BEAT / 4 * 0.95; n = int(dur * SR)
        fc = 160 + 900 * np.exp(-np.arange(n) / SR / 0.05)
        sig = saw_lp(note_hz(m), dur, fc, res=0.6, harm=48) * env_ad(n, 0.003, 0.09)
        place(bass, sig, bar * BEAT * 4 + s * BEAT / 4)
bass = np.tanh(bass * 2.2) * 0.42 * side
L += bass; R += bass

# ── gritty arp: 16ths over chord tones, detuned saw, filter sweeps open over 8 bars and back (sinusoidal = seamless) ──
arp = np.zeros(N); PAT = [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2, 3, 2, 1, 0, 2]
for bar in range(BARS):
    ch = CH[bar % 4] + [CH[bar % 4][0] + 12]
    for s in range(16):
        t0 = bar * BEAT * 4 + s * BEAT / 4; sweep = 0.5 - 0.5 * np.cos(2 * np.pi * t0 / (N / SR))
        m = ch[PAT[s]] + (12 if (s == 11 and bar % 2) else 0); dur = BEAT / 4 * 0.8; n = int(dur * SR)
        fc = (500 + 3800 * sweep) * (0.6 + 0.4 * np.exp(-np.arange(n) / SR / 0.04))
        sig = saw_lp(note_hz(m), dur, fc, res=1.2, detune=9, harm=40) * env_ad(n, 0.002, 0.07)
        place(arp, sig, t0, 0.9 if s % 4 == 0 else 0.65)
arp = np.tanh(arp * 2.4) * 0.30 * (0.55 + 0.45 * side)
d = int(BEAT * 0.75 * SR)                                         # dotted-8th ping-pong delay, rolled = circular
aL = arp.copy(); aR = arp.copy()
for k in range(1, 6): g = 0.42 ** k; (aR if k % 2 else aL)[:] += np.roll(arp, d * k) * g
L += aL * 0.9; R += aR * 0.9; wet_send += arp * 0.5

# ── dark pad: chord per bar, slow swell, low-passed, pumped ──
pad = np.zeros(N)
for bar in range(BARS):
    dur = BEAT * 4; n = int(dur * SR); e = np.minimum(1, np.arange(n) / SR / 0.6) * np.minimum(1, (n - np.arange(n)) / SR / 0.25)
    for m in CH[bar % 4]: pad[at(bar * dur):at(bar * dur) + n] += saw_lp(note_hz(m - 12), dur, np.full(n, 900.0), detune=14, harm=30) * e
pad = pad * 0.13 * (0.45 + 0.55 * side)
L += pad; R += pad * 0.95; wet_send += pad * 1.2

# ── low drone + a sub swell on the Bb bar for menace ──
drone = 0.05 * np.sin(2 * np.pi * 55 * T) * (0.5 + 0.5 * np.sin(2 * np.pi * T / (N / SR) * 4)) * side
L += drone; R += drone

# ── reverb: circular FFT convolution with a 2.2 s decaying stereo noise tail ──
irn = int(2.2 * SR); irt = np.arange(irn) / SR
def ir(seed): g = np.random.default_rng(seed).standard_normal(irn) * np.exp(-irt / 0.55); g[:int(0.02 * SR)] = 0; g = np.convolve(g, [0.5, 0.5], 'same'); return g / np.sqrt((g ** 2).sum())   # unit-energy tail
W = np.fft.rfft(wet_send)
for buf, seed in ((L, 11), (R, 12)):
    h = np.zeros(N); h[:irn] = ir(seed); buf += np.fft.irfft(W * np.fft.rfft(h), N) * 0.55

# ── master: gentle glue + soft clip + normalise ──
mx = np.max(np.abs(np.concatenate([L, R])))
L, R = np.tanh(L / mx * 1.4) / np.tanh(1.4) * 0.89, np.tanh(R / mx * 1.4) / np.tanh(1.4) * 0.89
out = np.stack([L, R], 1); pcm = (out * 32767).astype('<i2')
path = sys.argv[1] if len(sys.argv) > 1 else 'hiveport/audio/hiveport_club_loop.wav'
with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', path, round(N / SR, 2), 's')
