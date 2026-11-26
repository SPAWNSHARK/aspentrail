# Stained-glass mosaic runner (user, Nov 25 — reference: an ammonite-spiral stained-glass rug). One tile = 1024 x 4096 px
# (1.9 m x 8.07 m), tiles seamlessly along its length; an ammonite spiral in warm amber/orange/red with a teal heart sits in
# the middle of each tile, surrounded by cool blue / teal / violet glass shards with dark lead lines.
import numpy as np, math, sys
from PIL import Image, ImageFilter
W, H = 1024, 4096
rng = np.random.default_rng(7)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

# ---- background shards: periodic (in y) Voronoi of jittered points ----
cell = 70
pts = []
for gy in range(0, H, cell):
    for gx in range(-cell, W + cell, cell):
        pts.append((gx + rng.uniform(0, cell), gy + rng.uniform(0, cell)))
pts = np.array(pts, np.float32)
P = np.concatenate([pts, pts + [0, H], pts - [0, H]])          # wrap copies for seamless tiling
lab = np.zeros((H, W), np.int32); best = np.full((H, W), 1e12, np.float32)
B = 256
for y0 in range(0, H, B):
    sl = slice(y0, y0 + B)
    near = P[(P[:, 1] > y0 - 3 * cell) & (P[:, 1] < y0 + B + 3 * cell)]
    idx = np.nonzero((P[:, 1] > y0 - 3 * cell) & (P[:, 1] < y0 + B + 3 * cell))[0]
    for k, (px, py) in zip(idx, near):
        d = (xx[sl] - px) ** 2 + (yy[sl] - py) ** 2
        m = d < best[sl]; best[sl][m] = d[m]; lab[sl][m] = k % len(pts)
# ---- the ammonite: chambers between log-spiral whorls, split by radial septa ----
cx, cy, R = W / 2, H / 2, 470.0
dx, dy = xx - cx, yy - cy; r = np.sqrt(dx * dx + dy * dy) + 1e-3; th = np.arctan2(dy, dx)
b = 0.17                                                    # growth per radian (≈5 turns from rim to heart)
u = (np.log(r / R) / b - th) / (2 * math.pi)                # whorl coordinate: integer steps = one turn outward
turn = np.floor(u); frac = u - turn
inside = (u < 0) & (r < R * 1.05)                           # outline follows the shell's own spiral edge
chamber_ang = np.floor(((th + math.pi) / (2 * math.pi) + turn * 0.37 + frac * 0.12) * 20)   # septa staggered per whorl, gently curved
spiral_lab = (1000000 + (turn + 50) * 1000 + chamber_ang).astype(np.int64)
spiral_lab = np.where(inside & (r > 14), spiral_lab, -1)
L = np.where(spiral_lab >= 0, spiral_lab, lab.astype(np.int64))

# ---- colours ----
def hsv(h, s, v):
    i = int(h * 6) % 6; f = h * 6 - int(h * 6); p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    return [(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)][i]
uniq, inv = np.unique(L, return_inverse=True); inv = inv.reshape(L.shape)
cols = np.zeros((len(uniq), 3), np.float32)
for i, l in enumerate(uniq):
    if l >= 1000000:
        t = (l - 1000000) // 1000 - 50 + 1                         # whorl index (0 = outermost, negative inward)
        depth = min(1.0, -t / 4.5)
        if depth > 0.85: h, s, v = 0.47 + rng.uniform(-0.02, 0.03), 0.7, 0.55 + rng.uniform(0, 0.15)    # teal heart
        else: h, s, v = (0.015 + depth * 0.12 + rng.uniform(-0.02, 0.02)) % 1, 0.85 - depth * 0.45 + rng.uniform(-0.08, 0.05), 0.72 + depth * 0.26 + rng.uniform(-0.1, 0.04)
        if rng.random() < 0.12 and depth < 0.4: h, s, v = 0.92 + rng.uniform(0, 0.05), 0.6, 0.6       # a few magenta chambers
    else:
        k = l % len(pts); py = pts[k][1]; px = pts[k][0]
        w = 0.5 + 0.5 * math.cos(2 * math.pi * py / H)       # periodic: warmer violet-magenta near the spiral rows, blue-teal between
        h = (0.6 + 0.12 * w + rng.uniform(-0.05, 0.05)) % 1
        if rng.random() < 0.18: h = 0.5 + rng.uniform(-0.03, 0.04)
        if rng.random() < 0.05: h = 0.08 + rng.uniform(0, 0.05)
        s = 0.45 + rng.uniform(0, 0.3); v = 0.32 + rng.uniform(0, 0.33)
    cols[i] = hsv(h, s, v)
img = cols[inv]
# glass: soft per-cell shading (brighter in the middle, streaky) + fine grain
seed_noise = rng.random(len(uniq)).astype(np.float32)[inv]
streak = 0.5 + 0.5 * np.sin(xx * 0.05 + yy * 0.031 + seed_noise * 20)
img *= (0.82 + 0.25 * streak[..., None] * 0.6)
img *= (0.92 + 0.16 * rng.random((H, W, 1)).astype(np.float32))
# lead lines where the label changes (+ dilate), with a thin dark border round the runner
edge = np.zeros((H, W), bool)
edge[:, 1:] |= L[:, 1:] != L[:, :-1]; edge[1:, :] |= L[1:, :] != L[:-1, :]
edge[0, :] |= L[0, :] != L[-1, :]
e = Image.fromarray((edge * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
ea = np.asarray(e, np.float32)[..., None] / 255.0
lead = np.array([0.06, 0.05, 0.045], np.float32)
img = img * (1 - ea) + lead * ea
img[:, :18] = lead; img[:, -18:] = lead                     # dark binding at both edges
out = Image.fromarray(np.clip(img * 255, 0, 255).astype(np.uint8))
out.save(sys.argv[1], quality=86)
out.resize((256, 1024)).save(sys.argv[2])
