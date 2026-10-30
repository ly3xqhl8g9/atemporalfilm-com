"""Pista optică stereo (variable-area, bilaterală) — banda de lângă vizor.
Generează public/assets/ui/soundtrack.svg:  python3 scripts/pista-sonora.py public/assets/ui/soundtrack.svg
Tile vertical de H px, fără cusătură la repetare. Alb pe negru, ca în poza lui Ștefan (30.10.2026):
miez care respiră încet (dinamica sunetului) + „dinți” orizontali deși (frecvențele înalte)."""
import math, random, sys
W, H, STEP = 36, 2000, 1.0          # H trebuie să fie egal cu BAND_TILE din LandingHero/index.tsx
M, CH, GUT = 3.0, 13.0, 4.0         # margine, lățimea unui canal, spațiul dintre canale (L / R)

def periodic(n_terms, min_cyc, max_cyc, seed):
    r = random.Random(seed)
    t = [(r.randint(min_cyc, max_cyc), r.uniform(0, 2*math.pi), r.uniform(0.4, 1.0)) for _ in range(n_terms)]
    s = sum(a for _, _, a in t)
    return lambda y: sum(a*math.sin(2*math.pi*c*y/H + p) for c, p, a in t) / s

shared = periodic(9, 14, 60, 11)     # fraza muzicală, comună L/R
ownL, ownR = periodic(6, 20, 80, 12), periodic(6, 20, 80, 13)
quiet = periodic(4, 2, 7, 14)        # câteva locuri mai liniștite
n = int(H/STEP)

def channel(own, seed):
    r = random.Random(seed)
    out, nxt = [], 0
    for i in range(n):
        y = i*STEP
        E = 0.52 + 1.7*shared(y) + 0.5*own(y)
        q = quiet(y)
        if q < -0.72: E -= (-0.72 - q)*3.0
        E = min(1.0, max(0.04, E))
        core = 0.38 + 0.38*E
        if i == nxt:                          # dinte: o linie orizontală subțire
            nxt = i + r.choice((2, 3, 3, 4))
            tooth = (0.10 + 0.42*E)*(0.35 + 0.65*r.random())
        else:
            tooth = -0.04*r.random()
        out.append(min(1.0, core + tooth) * CH/2)
    return out

L, R = channel(ownL, 21), channel(ownR, 22)
R = [0.5*a + 0.5*b for a, b in zip(L, R)]   # stereo: R urmează parțial L

def poly(cx, hw):
    pts = [(cx+h, i*STEP) for i, h in enumerate(hw)] + [(cx+hw[0], H), (cx-hw[0], H)]
    pts += [(cx-h, i*STEP) for i, h in reversed(list(enumerate(hw)))]
    return 'M' + ' '.join(f'{x:.1f},{y:g}' for x, y in pts) + 'Z'

cxL, cxR = M + CH/2, M + CH + GUT + CH/2
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
       f'<rect width="{W}" height="{H}" fill="#0b0a09"/>'
       f'<path fill="#f4f1ea" d="{poly(cxL, L)} {poly(cxR, R)}"/></svg>\n')
open(sys.argv[1], 'w').write(svg); print(len(svg))
