/* ============================================================
   INTRO „VIZOR”, VERSIUNEA 7 (18.11.2026) — pelicula și rola, desenate în WebGL

   Ștefan, după versiunea 6: grafica să fie „mult mai calitativă”, pelicula
   „extrem de realistă”, „nu ceva desenat”, absorbită „într-un mod natural” în
   rolă. De aceea desenul nu mai e canvas 2D (felii de imagine puse una lângă
   alta), ci WebGL, pe placa video:

   - pelicula e o panglică 3D adevărată: perspectivă corectă pe fiecare pixel
     (cadrele se micșorează firesc când pelicula se îndepărtează), textura cu
     mipmap și filtrare anizotropă (nu se pixelează și nu „fâlfâie” când e
     văzută pieziș), lumină pe fiecare pixel — luciul bazei de peliculă alunecă
     pe ea când se curbează și se răsucește, marginile prind lumină;
   - unde pelicula stă cu fața spre noi (lângă banda din pagină), lumina nu
     schimbă nimic: arată exact ca banda din pagină, ca să nu se vadă îmbinarea;
   - rola e un obiect 3D: două flanșe de metal (cu cele cinci ferestre ale
     rolei de lângă logo), pelicula înfășurată între ele (se vede prin
     ferestre), butucul; când ajunge lângă logo, culorile ei devin exact cele
     ale iconiței (care o înlocuiește în același cadru).

   Coordonatele: px CSS; x la dreapta, y în jos, z spre noi; pagina e z = 0.
   Camera stă în fața centrului ecranului, la distanța D. Ce e la z = 0 cade
   exact pe pixelul CSS; ce e în spate (z < 0) se micșorează spre centru.
   ============================================================ */

/* WebGL, nu React: gl.useProgram nu e un „hook” */
/* eslint-disable react-hooks/rules-of-hooks */

export type V3 = [number, number, number];

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3): number => Math.sqrt(dot(a, a));
export const norm = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const mix3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** rotește v în jurul axei k (unitară) cu unghiul an (Rodrigues) */
export function rotAbout(v: V3, k: V3, an: number): V3 {
    const c = Math.cos(an), s = Math.sin(an);
    const kv = cross(k, v), kd = dot(k, v) * (1 - c);
    return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd];
}

/** direcția unitară dintre a și b (slerp) */
export function slerp(a: V3, b: V3, t: number): V3 {
    const d = Math.max(-1, Math.min(1, dot(a, b)));
    const om = Math.acos(d);
    if (om < 1e-5) return norm(mix3(a, b, t));
    const so = Math.sin(om);
    return norm(add(mul(a, Math.sin((1 - t) * om) / so), mul(b, Math.sin(t * om) / so)));
}


/* ── CAMERA ── */
export type Camera = { vw: number; vh: number; D: number };
/** punctul p pe ecran (px CSS) */
export const project = (c: Camera, p: V3): [number, number] => {
    const k = c.D / (c.D - p[2]);
    return [c.vw / 2 + (p[0] - c.vw / 2) * k, c.vh / 2 + (p[1] - c.vh / 2) * k];
};
/** cât de mare apare ceva aflat la adâncimea z (1 = pe pagină) */
export const magnif = (c: Camera, z: number): number => c.D / (c.D - z);


/* ── DRUMUL PELICULEI ──
   Centrul peliculei e o curbă din bucăți Bézier cubice. Pelicula adevărată se
   îndoaie doar „peste lățime”, ca o foaie de hârtie (în planul ei nu se poate
   îndoi fără să se încrețească), și se răsucește unde drumul e aproape drept.
   Așa o așezăm și aici: pornim de la un reper care nu se răsucește singur
   (rotation-minimizing frame, dubla reflexie), apoi căutăm răsucirea θ(s) care
   ține lățimea pe binormala curbei acolo unde drumul se curbează, cu capetele
   fixe (la bandă: lățimea benzii; la rolă: axa rolei). E o problemă de cele mai
   mici pătrate, tridiagonală; o rezolvăm de trei ori, pentru că binormala
   contează doar modulo π (lățimea nu are „sens”). */
export type Path = {
    n: number;
    P: Float32Array;      // centrul (3n)
    T: Float32Array;      // tangenta, spre rolă (3n)
    B: Float32Array;      // direcția lățimii (3n)
    N: Float32Array;      // normala feței (3n)
    s: Float32Array;      // lungimea adevărată de la început (n)
    L: number;            // lungimea totală
    twist: number;        // răsucirea adăugată (rad)
};

const SEG_SAMPLES = 420;
const MAX_SAMPLES = SEG_SAMPLES * 4;
const sX = new Float64Array(MAX_SAMPLES * 3), sL = new Float64Array(MAX_SAMPLES), sM = new Float64Array(MAX_SAMPLES);
/* răsucirea față de îndoirea „în planul peliculei”: cât de lin se răsucește
   (lungimea pe care se așază lățimea pe binormală ≈ 0,5 × raza curburii) */
const TWIST_SOFT = 0.25;
const MAX_N = 1024;
const qW = new Float64Array(MAX_N), qPhi = new Float64Array(MAX_N), qC = new Float64Array(MAX_N);
const qTh = new Float64Array(MAX_N), qTg = new Float64Array(MAX_N), qCp = new Float64Array(MAX_N), qDp = new Float64Array(MAX_N);
const wrapPi = (x: number) => x - Math.PI * Math.round(x / Math.PI);

/** o curbă din mai multe bucăți Bézier cubice, legate lin (fiecare: [p0, p1, p2, p3]);
    b0 = lățimea la început; bEnd = lățimea dorită la capăt (sau null) */
export function bezierPath(cam: Camera, segs: [V3, V3, V3, V3][], b0: V3, bEnd: V3 | null,
    prevTwist: number | null, pxStep = 4.5, maxN = 280): Path {
    // 1. eșantioane dese, cu lungimea adevărată și lungimea pe ecran
    let lt = 0, ls = 0, px = 0, py = 0, cnt = 0;
    for (let g = 0; g < segs.length && g < 4; g++) {
        const [p0, p1, p2, p3] = segs[g];
        for (let jj = g === 0 ? 0 : 1; jj < SEG_SAMPLES; jj++) {
            const t = jj / (SEG_SAMPLES - 1), m = 1 - t;
            const a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
            const x = a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0];
            const y = a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1];
            const z = a * p0[2] + b * p1[2] + c * p2[2] + d * p3[2];
            const [qx, qy] = project(cam, [x, y, z]);
            if (cnt > 0) {
                lt += Math.hypot(x - sX[3 * cnt - 3], y - sX[3 * cnt - 2], z - sX[3 * cnt - 1]);
                ls += Math.hypot(qx - px, qy - py);
            }
            sX[3 * cnt] = x; sX[3 * cnt + 1] = y; sX[3 * cnt + 2] = z;
            sL[cnt] = lt;
            sM[cnt] = ls + 0.012 * lt;      // măsura după care punem punctele: pixeli pe ecran (+ puțin din lungime)
            px = qx; py = qy;
            cnt++;
        }
    }
    const SAMPLES = cnt;
    const p0 = segs[0][0], p1 = segs[0][1], p2 = segs[segs.length - 1][2], p3 = segs[segs.length - 1][3];
    const total = sM[SAMPLES - 1];
    const n = Math.max(24, Math.min(maxN, MAX_N, Math.ceil(total / pxStep) + 1));
    const P = new Float32Array(3 * n), T = new Float32Array(3 * n), B = new Float32Array(3 * n), N = new Float32Array(3 * n), S = new Float32Array(n);
    // 2. punctele, la pași egali în măsura de mai sus
    let j = 0;
    for (let i = 0; i < n; i++) {
        const want = (total * i) / (n - 1);
        while (j < SAMPLES - 2 && sM[j + 1] < want) j++;
        const f = sM[j + 1] > sM[j] ? Math.min(1, Math.max(0, (want - sM[j]) / (sM[j + 1] - sM[j]))) : 0;
        for (let k = 0; k < 3; k++) P[3 * i + k] = sX[3 * j + k] + (sX[3 * j + 3 + k] - sX[3 * j + k]) * f;
        S[i] = sL[j] + (sL[j + 1] - sL[j]) * f;
    }
    // tangentele: din vecini (diferențe centrate)
    for (let i = 0; i < n; i++) {
        const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
        const t = norm([P[3 * b] - P[3 * a], P[3 * b + 1] - P[3 * a + 1], P[3 * b + 2] - P[3 * a + 2]]);
        T[3 * i] = t[0]; T[3 * i + 1] = t[1]; T[3 * i + 2] = t[2];
    }
    // capetele: tangenta exactă a curbei
    const t0 = norm(sub(p1, p0)), t3 = norm(sub(p3, p2));
    T[0] = t0[0]; T[1] = t0[1]; T[2] = t0[2];
    T[3 * n - 3] = t3[0]; T[3 * n - 2] = t3[1]; T[3 * n - 1] = t3[2];
    // 3. reperul fără răsucire (dublă reflexie, Wang et al. 2008)
    let r: V3 = norm(sub(b0, mul(t0, dot(b0, t0))));
    B[0] = r[0]; B[1] = r[1]; B[2] = r[2];
    for (let i = 0; i < n - 1; i++) {
        const v1: V3 = [P[3 * i + 3] - P[3 * i], P[3 * i + 4] - P[3 * i + 1], P[3 * i + 5] - P[3 * i + 2]];
        const c1 = dot(v1, v1);
        const ti: V3 = [T[3 * i], T[3 * i + 1], T[3 * i + 2]];
        const tn: V3 = [T[3 * i + 3], T[3 * i + 4], T[3 * i + 5]];
        if (c1 < 1e-9) { B[3 * i + 3] = r[0]; B[3 * i + 4] = r[1]; B[3 * i + 5] = r[2]; continue; }
        const rL = sub(r, mul(v1, (2 / c1) * dot(v1, r)));
        const tL = sub(ti, mul(v1, (2 / c1) * dot(v1, ti)));
        const v2 = sub(tn, tL);
        const c2 = dot(v2, v2);
        r = c2 > 1e-12 ? sub(rL, mul(v2, (2 / c2) * dot(v2, rL))) : rL;
        r = norm(sub(r, mul(tn, dot(r, tn))));
        B[3 * i + 3] = r[0]; B[3 * i + 4] = r[1]; B[3 * i + 5] = r[2];
    }
    // 4. răsucirea: lățimea pe binormala curbei unde drumul se curbează, capetele fixe
    let twist = 0;
    if (bEnd) {
        const te: V3 = [T[3 * n - 3], T[3 * n - 2], T[3 * n - 1]];
        const re: V3 = [B[3 * n - 3], B[3 * n - 2], B[3 * n - 1]];
        const be = norm(sub(bEnd, mul(te, dot(bEnd, te))));
        twist = Math.atan2(dot(cross(re, be), te), dot(re, be));
        if (prevTwist !== null) {   // fără salturi de un tur de la un cadru la altul
            while (twist - prevTwist > Math.PI) twist -= 2 * Math.PI;
            while (twist - prevTwist < -Math.PI) twist += 2 * Math.PI;
        }
        const Lt = S[n - 1] || 1;
        // curbura (k = dt/ds) și unghiul binormalei față de reperul fără răsucire
        for (let i = 0; i < n; i++) {
            const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
            const ds = S[b] - S[a];
            qTh[i] = (twist * S[i]) / Lt;
            qW[i] = 0; qPhi[i] = 0;
            if (ds <= 1e-6) continue;
            const k: V3 = [(T[3 * b] - T[3 * a]) / ds, (T[3 * b + 1] - T[3 * a + 1]) / ds, (T[3 * b + 2] - T[3 * a + 2]) / ds];
            const k2 = dot(k, k);
            if (k2 < 1e-16) continue;
            const ti: V3 = [T[3 * i], T[3 * i + 1], T[3 * i + 2]];
            const bi: V3 = [B[3 * i], B[3 * i + 1], B[3 * i + 2]];
            const bf = norm(cross(ti, k));
            qPhi[i] = Math.atan2(dot(cross(bi, bf), ti), dot(bi, bf));
            qW[i] = k2 * 0.5 * ds;                       // îndoirea „în plan”, dacă lățimea n-ar sta pe binormală
        }
        for (let i = 0; i < n - 1; i++) qC[i] = TWIST_SOFT / Math.max(1e-3, S[i + 1] - S[i]);   // răsucirea
        qTh[0] = 0;
        qTh[n - 1] = twist;
        for (let it = 0; it < 3; it++) {
            // ținta: binormala, cu sensul (modulo π) cel mai apropiat de soluția de acum
            for (let i = 1; i < n - 1; i++) qTg[i] = qTh[i] - wrapPi(qTh[i] - qPhi[i]);
            // Thomas: −c(i−1)·θ(i−1) + (w + c(i−1) + c(i))·θ(i) − c(i)·θ(i+1) = w·ținta
            for (let i = 1; i < n - 1; i++) {
                const lo = i === 1 ? 0 : -qC[i - 1];
                const up = i === n - 2 ? 0 : -qC[i];
                let d = qW[i] * qTg[i];
                if (i === 1) d += qC[0] * qTh[0];
                if (i === n - 2) d += qC[n - 2] * qTh[n - 1];
                const den = qW[i] + qC[i - 1] + qC[i] - (i === 1 ? 0 : lo * qCp[i - 1]);
                qCp[i] = up / den;
                qDp[i] = (d - (i === 1 ? 0 : lo * qDp[i - 1])) / den;
            }
            qTh[n - 2] = qDp[n - 2];
            for (let i = n - 3; i >= 1; i--) qTh[i] = qDp[i] - qCp[i] * qTh[i + 1];
        }
        for (let i = 1; i < n; i++) {
            if (Math.abs(qTh[i]) < 1e-7) continue;
            const ti: V3 = [T[3 * i], T[3 * i + 1], T[3 * i + 2]];
            const b = rotAbout([B[3 * i], B[3 * i + 1], B[3 * i + 2]], ti, qTh[i]);
            B[3 * i] = b[0]; B[3 * i + 1] = b[1]; B[3 * i + 2] = b[2];
        }
    }
    // 5. normala feței
    for (let i = 0; i < n; i++) {
        const nn = norm(cross([T[3 * i], T[3 * i + 1], T[3 * i + 2]], [B[3 * i], B[3 * i + 1], B[3 * i + 2]]));
        N[3 * i] = nn[0]; N[3 * i + 1] = nn[1]; N[3 * i + 2] = nn[2];
    }
    return { n, P, T, B, N, s: S, L: S[n - 1], twist };
}


/* ── WEBGL ── */
export type FilmTex = { tex: WebGLTexture };

/** pelicula de desenat: drumul + ce bucată din el (de la sFrom la capăt) + textura */
export type RibbonDraw = {
    path: Path;
    sFrom: number;                    // de unde începe (lungime de la începutul drumului)
    half: number;                     // jumătate din lățime (px adevărați)
    halfAt?: (s: number) => number;   // (opțional) lățimea pe lungime
    vAt: (s: number) => number;       // coordonata v a texturii în punctul s
    opacity: number;
    tex: FilmTex;
};

/** rola: centrul, axa (spre fața ei), reperul flanșei (e1, e2 — se rotesc cu rola), mărimea */
export type ReelDraw = {
    C: V3; A: V3; E1: V3; E2: V3;
    s: number;        // px adevărați pe unitate de rolă (flanșa are raza 16)
    pack: number;     // raza peliculei înfășurate (unități de rolă)
    shade: number;    // 1 = metal adevărat; 0 = culorile iconiței de lângă logo
    blur: number;     // cât se rotește rola cât „stă deschis obturatorul” (rad): ferestrele se estompează
    depth: number;    // 1 = grosimea adevărată; spre 0 = turtită ca iconița (fără marginea văzută în perspectivă)
};

export type Scene = {
    cam: Camera;
    ribbons: RibbonDraw[];
    reel: ReelDraw | null;
    occluders: [number, number, number, number][];   // benzile din pagină (x, y, w, h), la z = 0
    black: number;                                   // negrul de deasupra (deschiderea ecranului)
    bg: V3;                                          // culoarea paginii (0..1)
};

export interface FilmGL {
    readonly webgl2: boolean;
    readonly maxTexture: number;
    resize(vw: number, vh: number, q: number): void;
    texture(src: TexImageSource, w: number, h: number): FilmTex | null;
    draw(s: Scene): void;
    dispose(): void;
}

/* lățimea peliculei înfășurate pe rolă (unități de rolă; flanșa are raza 16).
   Ca la o rolă mică de 35 mm (cea de 18 cm, cu cinci ferestre, ca iconița):
   lățimea e cam 0,4 din rază. */
export const PACK_W = 6.4;
const FLANGE_Z = PACK_W / 2 + 0.3;     // planul flanșelor
const FLANGE_T = 0.32;                 // grosimea tablei

/* lumina: din stânga-sus, din față. Pe pelicula cu fața spre noi nu face nimic. */
const LIGHT: V3 = norm([-0.42, -0.62, 0.66]);

const VS2 = '#version 300 es\n#define attribute in\n#define varying out\n';
const FS2 = '#version 300 es\nprecision highp float;\n#define varying in\n#define texture2D texture\nout vec4 outColor;\n#define gl_FragColor outColor\n';
const VS1 = '';
const FS1 = 'precision highp float;\n';

const PROJ = `
uniform vec4 uCam;
uniform vec2 uHalf;
uniform vec2 uDepth;
vec4 projectW(vec3 w) {
    float d = uCam.z - w.z;
    return vec4((w.x - uCam.x) / uHalf.x, (uCam.y - w.y) / uHalf.y, (uDepth.x * d + uDepth.y) / uCam.z, d / uCam.z);
}
`;

const FILM_VS = `
attribute vec3 aPos;
attribute vec3 aNor;
attribute vec2 aUV;
${PROJ}
varying vec3 vW;
varying vec3 vN;
varying vec2 vUV;
void main() {
    vW = aPos;
    vN = aNor;
    vUV = aUV;
    gl_Position = projectW(aPos);
}
`;

/* pelicula: textura (premultiplicată) × lumină. Toți termenii de lumină sunt
   „în plus față de pelicula cu fața spre noi”, ca lângă bandă să nu schimbe nimic.
   Baza peliculei e lucioasă (acetat/poliester, ~4,5% reflexie drept, aproape tot
   la unghi razant — Fresnel): în ea se oglindește un studio — o lampă lungă sus,
   în fața ei (ca o fereastră de lumină), una mică în dreapta, cerul luminos de sus.
   Unde pelicula se curbează, lampa alunecă pe ea ca o dungă de lumină de-a
   curmezișul, ca în fotografiile cu peliculă. */
const FILM_FS = `
uniform sampler2D uTex;
uniform vec3 uEye;
uniform vec3 uLight;
uniform float uOpacity;
varying vec3 vW;
varying vec3 vN;
varying vec2 vUV;
float studio(vec3 R) {
    float up = -R.y;
    float bar = smoothstep(0.58, 0.63, up) * (1.0 - smoothstep(0.87, 0.92, up)) * smoothstep(0.0, 0.08, R.z)
              * (1.0 - smoothstep(0.55, 0.75, abs(R.x + 0.12)));
    float b = smoothstep(0.95, 0.985, dot(R, vec3(0.767, -0.329, 0.551))) * 0.5;
    float sky = 0.18 + 0.42 * smoothstep(-0.25, 0.9, up);
    return 9.0 * (bar + b) + sky;
}
void main() {
    vec3 N = normalize(vN);
    vec4 tex = texture2D(uTex, vUV);
    vec3 V = normalize(uEye - vW);
    if (dot(N, V) < 0.0) N = -N;           // fata pe care o vedem
    vec3 Z = vec3(0.0, 0.0, 1.0);
    float dif = clamp(1.0 + 0.55 * (dot(N, uLight) - dot(Z, uLight)), 0.32, 1.45);
    float cn = clamp(abs(dot(N, V)), 0.0, 1.0), cz = clamp(dot(Z, V), 0.0, 1.0);
    float Fn = 0.045 + 0.955 * pow(1.0 - cn, 5.0);
    float Fz = 0.045 + 0.955 * pow(1.0 - cz, 5.0);
    float refl = Fn * studio(reflect(-V, N)) - Fz * studio(reflect(-V, Z));
    // si sclipirea ingusta a lampii
    vec3 H = normalize(uLight + V);
    float hn = max(dot(N, H), 0.0), hz = max(dot(Z, H), 0.0);
    float spec = 0.6 * (pow(hn, 120.0) - pow(hz, 120.0));
    vec3 col = tex.rgb * dif + vec3(max(refl + spec, 0.0)) * tex.a;
    gl_FragColor = vec4(col, tex.a) * uOpacity;
}
`;

const REEL_VS = `
attribute vec3 aPos;
attribute vec3 aNor;
${PROJ}
uniform vec3 uC;
uniform vec3 uE1;
uniform vec3 uE2;
uniform vec3 uA;
uniform float uS;
uniform vec3 uPart;
uniform float uZ;
varying vec3 vL;
varying vec3 vW;
varying vec3 vN;
void main() {
    vec3 l = vec3(aPos.xy * uPart.xy, aPos.z * uPart.z + uZ);
    vL = l;
    vec3 w = uC + uS * (l.x * uE1 + l.y * uE2 + l.z * uA);
    vW = w;
    vN = aNor.x * uE1 + aNor.y * uE2 + aNor.z * uA;
    gl_Position = projectW(w);
}
`;

/* rola: 0 = fața flanșei din față, 1 = fața dinăuntru a flanșei din spate,
   2 = marginea flanșelor, 3 = capătul peliculei înfășurate, 4 = pelicula înfășurată (pe lângă).
   uShade = 0: exact culorile iconiței (#d3d1cd, conturul și butucul #15110d, pătratul = pagina) */
const REEL_FS = `
uniform float uKind;
uniform float uPack;
uniform float uAA;
uniform float uShade;
uniform float uBlur;
uniform vec3 uEye;
uniform vec3 uLight;
uniform vec3 uE1;
uniform vec3 uE2;
uniform vec3 uA;
uniform vec3 uBg;
varying vec3 vL;
varying vec3 vW;
varying vec3 vN;

const vec3 FILM = vec3(0.0824, 0.0667, 0.0510);
const vec3 METAL = vec3(0.827, 0.820, 0.804);

float winDist(vec2 p) {
    float d = 1e4;
    for (int k = 0; k < 5; k++) {
        float an = -1.5707963 + float(k) * 1.2566371;
        d = min(d, length(p - 9.4 * vec2(cos(an), sin(an))) - 3.7);
    }
    return d;
}
float hash1(float x) { return fract(sin(x * 127.1) * 43758.5453); }

/* ferestrele (si patratul din butuc), mediate pe unghiul cu care se roteste rola
   cat sta deschis obturatorul (1/48 s): la viteza mare se intind, ca filmate */
void winAvg(vec2 p, out float metalCov, out float edge, out float hole) {
    if (uBlur < 0.004) {
        float dW = winDist(p);
        metalCov = smoothstep(-0.55 - uAA, -0.55 + uAA, dW);
        edge = 1.0 - smoothstep(0.55 - uAA, 0.55 + uAA, abs(dW));
        hole = 1.0 - smoothstep(-uAA, uAA, max(abs(p.x), abs(p.y)) - 0.9);
        return;
    }
    float m = 0.0, e = 0.0, h = 0.0;
    for (int k = 0; k < 7; k++) {
        float a = uBlur * (float(k) / 6.0 - 0.5);
        float c = cos(a), s = sin(a);
        vec2 q = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
        float dW = winDist(q);
        m += smoothstep(-0.55 - uAA, -0.55 + uAA, dW);
        e += 1.0 - smoothstep(0.55 - uAA, 0.55 + uAA, abs(dW));
        h += 1.0 - smoothstep(-uAA, uAA, max(abs(q.x), abs(q.y)) - 0.9);
    }
    metalCov = m / 7.0;
    edge = e / 7.0;
    hole = h / 7.0;
}

/* metal: aluminiu tras la strung (dungi circulare fine), reflexia unui studio luminos
   sus si mai intunecat jos, lucirea care se intinde de-a curmezisul dungilor */
vec3 metal(vec3 N, vec3 V, vec2 p, float dim) {
    vec3 H = normalize(uLight + V);
    float ndl = max(dot(N, uLight), 0.0);
    float r = max(length(p), 1e-3);
    vec3 T = normalize(-p.y * uE1 + p.x * uE2);
    float th = dot(T, H);
    float aniso = pow(max(1.0 - th * th, 0.0), 22.0);
    vec3 R = reflect(-V, N);
    float up = -R.y;
    float env = mix(0.5, 1.06, smoothstep(-0.45, 0.5, up)) - 0.07 * smoothstep(0.55, 0.95, up);
    float rings = 0.955 + 0.045 * hash1(floor(r * 11.0)) + 0.02 * sin(r * 37.0);
    // lumina de umplere: cerul luminos de sus, podeaua (pagina) alba de jos
    float hemi = 0.62 + 0.38 * (0.5 - 0.5 * N.y);
    vec3 c = METAL * (0.3 * hemi + 0.42 * ndl + 0.18) * env * rings + vec3(0.62, 0.61, 0.6) * aniso * 0.5;
    return c * dim;
}

void main() {
    vec2 p = vL.xy;
    float r = length(p);
    vec3 N = normalize(vN);
    vec3 V = normalize(uEye - vW);
    if (dot(N, V) < 0.0) N = -N;
    vec3 col;
    float cov = 1.0;
    if (uKind < 1.5) {
        // flansele: discul de raza 16 cu cinci ferestre; conturul iconitei (1,1) sta pe margini
        float dOut = r - 16.0;
        float mc, eb, hole;
        winAvg(p, mc, eb, hole);
        cov = (1.0 - smoothstep(0.55 - uAA, 0.55 + uAA, dOut)) * mc;
        if (cov < 0.003) discard;
        float band = max(1.0 - smoothstep(0.55 - uAA, 0.55 + uAA, abs(dOut)), eb);
        float isFront = 1.0 - step(0.5, uKind);
        vec3 m = metal(N, V, p, uKind < 0.5 ? 1.0 : 0.52);
        // marginea reala: tabla e indoita - mai inchisa, cu o linie de lumina
        float lip = smoothstep(0.0, 0.55, -dOut) * (1.0 - smoothstep(0.55, 1.3, -dOut));
        vec3 rim = mix(m * 0.42, m * 1.12, lip);
        vec3 realC = mix(m, rim, band);
        vec3 iconC = mix(METAL, FILM, band);
        col = mix(iconC, realC, uShade);
        if (uKind > 0.5) cov *= uShade;         // flansa din spate nu exista pe iconita: dispare
        if (isFront > 0.5) {
            float hub = 1.0 - smoothstep(2.3 - uAA, 2.3 + uAA, r);
            vec3 hubReal = FILM * 1.4 + vec3(0.25) * pow(max(dot(N, normalize(uLight + V)), 0.0), 40.0);
            col = mix(col, mix(FILM, hubReal, uShade), hub);
            col = mix(col, uBg, hole);
        }
        if (cov < 0.003) discard;
        gl_FragColor = vec4(col * cov, cov);
        return;
    }
    if (uKind < 2.5) {
        // marginea flanselor (grosimea tablei), vazuta cand rola e intoarsa
        vec3 m = metal(N, V, p, 0.7);
        col = mix(FILM, m, uShade);
        gl_FragColor = vec4(col, 1.0);
        return;
    }
    vec3 H = normalize(uLight + V);
    if (uKind < 3.5) {
        // capatul peliculei infasurate: spire fine, lucioase, care se vad prin ferestre
        cov = 1.0 - smoothstep(uPack - uAA, uPack + uAA, r);
        if (cov < 0.003) discard;
        float layers = 0.86 + 0.08 * sin(r * 9.0 + 2.0 * hash1(floor(r * 3.0))) + 0.06 * hash1(floor(r * 23.0));
        vec3 T = normalize(-p.y * uE1 + p.x * uE2);
        float th = dot(T, H);
        float sheen = pow(max(1.0 - th * th, 0.0), 30.0) * 0.22;
        vec3 realC = FILM * layers * 1.1 + vec3(sheen);
        col = mix(FILM, realC, uShade);
        gl_FragColor = vec4(col * cov, cov);
        return;
    }
    // pelicula infasurata, pe langa: ultima spira, lucioasa
    float spec = pow(max(dot(N, H), 0.0), 60.0) * 0.5;
    col = mix(FILM, FILM * 1.15 + vec3(spec), uShade);
    gl_FragColor = vec4(col, 1.0);
}
`;

const OCC_VS = `
attribute vec3 aPos;
${PROJ}
void main() { gl_Position = projectW(aPos); }
`;
const OCC_FS = 'void main() { gl_FragColor = vec4(0.0); }\n';

const QUAD_VS = `
attribute vec3 aPos;
void main() { gl_Position = vec4(aPos.xy, 0.0, 1.0); }
`;
const QUAD_FS = `
uniform vec4 uColor;
void main() { gl_FragColor = uColor; }
`;

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null>; a: Record<string, number> };

export function createFilmGL(canvas: HTMLCanvasElement): FilmGL | null {
    const opts: WebGLContextAttributes = {
        alpha: true, antialias: true, depth: true, stencil: false,
        premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance',
    };
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try { gl = canvas.getContext('webgl2', opts) as WebGL2RenderingContext | null; } catch { gl = null; }
    const webgl2 = !!gl;
    if (!gl) {
        try { gl = (canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts)) as WebGLRenderingContext | null; } catch { gl = null; }
    }
    if (!gl) return null;
    const G = gl;
    const aniso = G.getExtension('EXT_texture_filter_anisotropic') || G.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    const maxAniso = aniso ? Math.min(8, G.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number) : 0;

    const compile = (type: number, src: string): WebGLShader | null => {
        const sh = G.createShader(type);
        if (!sh) return null;
        G.shaderSource(sh, (type === G.VERTEX_SHADER ? (webgl2 ? VS2 : VS1) : (webgl2 ? FS2 : FS1)) + src);
        G.compileShader(sh);
        if (!G.getShaderParameter(sh, G.COMPILE_STATUS)) {
            console.warn('[intro] shader:', G.getShaderInfoLog(sh));
            return null;
        }
        return sh;
    };
    const program = (vs: string, fs: string, attrs: string[], unis: string[]): Prog | null => {
        const v = compile(G.VERTEX_SHADER, vs), f = compile(G.FRAGMENT_SHADER, fs);
        if (!v || !f) return null;
        const p = G.createProgram();
        if (!p) return null;
        G.attachShader(p, v);
        G.attachShader(p, f);
        attrs.forEach((name, i) => G.bindAttribLocation(p, i, name));
        G.linkProgram(p);
        if (!G.getProgramParameter(p, G.LINK_STATUS)) {
            console.warn('[intro] program:', G.getProgramInfoLog(p));
            return null;
        }
        const u: Prog['u'] = {};
        for (const name of unis) u[name] = G.getUniformLocation(p, name);
        const a: Prog['a'] = {};
        attrs.forEach((name, i) => { a[name] = i; });
        return { p, u, a };
    };

    const camU = ['uCam', 'uHalf', 'uDepth'];
    const film = program(FILM_VS, FILM_FS, ['aPos', 'aNor', 'aUV'], [...camU, 'uTex', 'uEye', 'uLight', 'uOpacity']);
    const reel = program(REEL_VS, REEL_FS, ['aPos', 'aNor'],
        [...camU, 'uC', 'uE1', 'uE2', 'uA', 'uS', 'uPart', 'uZ', 'uKind', 'uPack', 'uAA', 'uShade', 'uBlur', 'uEye', 'uLight', 'uBg']);
    const occ = program(OCC_VS, OCC_FS, ['aPos'], camU);
    const quad = program(QUAD_VS, QUAD_FS, ['aPos'], ['uColor']);
    if (!film || !reel || !occ || !quad) return null;

    /* ── plasele fixe ale rolei: un disc (evantai) și un cilindru (bandă), de rază 1 ── */
    const SEG = 96;
    const disc: number[] = [0, 0, 0, 0, 0, 1];
    for (let i = 0; i <= SEG; i++) {
        const an = (i / SEG) * Math.PI * 2;
        disc.push(Math.cos(an), Math.sin(an), 0, 0, 0, 1);
    }
    const cyl: number[] = [];
    for (let i = 0; i <= SEG; i++) {
        const an = (i / SEG) * Math.PI * 2, c = Math.cos(an), s = Math.sin(an);
        cyl.push(c, s, 0.5, c, s, 0, c, s, -0.5, c, s, 0);
    }
    const mkBuf = (data: number[] | Float32Array, usage: number) => {
        const b = G.createBuffer();
        G.bindBuffer(G.ARRAY_BUFFER, b);
        G.bufferData(G.ARRAY_BUFFER, data instanceof Float32Array ? data : new Float32Array(data), usage);
        return b;
    };
    const discBuf = mkBuf(disc, G.STATIC_DRAW);
    const cylBuf = mkBuf(cyl, G.STATIC_DRAW);
    const quadBuf = mkBuf([-1, -1, 0, 3, -1, 0, -1, 3, 0], G.STATIC_DRAW);
    const ribBuf = G.createBuffer();
    const occBuf = G.createBuffer();
    let ribData = new Float32Array(8 * 2 * 600);

    let vw = 1, vh = 1, q = 1;
    const NEAR = 40, FAR = 400000;
    const depthA = (FAR + NEAR) / (FAR - NEAR), depthB = (-2 * FAR * NEAR) / (FAR - NEAR);

    const setCam = (pr: Prog, cam: Camera) => {
        G.uniform4f(pr.u.uCam, cam.vw / 2, cam.vh / 2, cam.D, 0);
        G.uniform2f(pr.u.uHalf, cam.vw / 2, cam.vh / 2);
        G.uniform2f(pr.u.uDepth, depthA, depthB);
    };
    const bindAttrs = (buf: WebGLBuffer | null, layout: [number, number][], stride: number) => {
        G.bindBuffer(G.ARRAY_BUFFER, buf);
        for (let i = 0; i < 3; i++) G.disableVertexAttribArray(i);
        layout.forEach(([size, off], i) => {
            G.enableVertexAttribArray(i);
            G.vertexAttribPointer(i, size, G.FLOAT, false, stride * 4, off * 4);
        });
    };

    const api: FilmGL = {
        webgl2,
        maxTexture: Math.min(8192, (G.getParameter(G.MAX_TEXTURE_SIZE) as number) || 4096),
        resize(w, h, qq) {
            vw = w; vh = h; q = qq;
            const W = Math.max(1, Math.round(w * qq)), H = Math.max(1, Math.round(h * qq));
            if (canvas.width !== W) canvas.width = W;
            if (canvas.height !== H) canvas.height = H;
        },
        texture(src, w, h) {
            const tex = G.createTexture();
            if (!tex) return null;
            G.bindTexture(G.TEXTURE_2D, tex);
            G.pixelStorei(G.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            G.pixelStorei(G.UNPACK_FLIP_Y_WEBGL, false);
            G.texImage2D(G.TEXTURE_2D, 0, G.RGBA, G.RGBA, G.UNSIGNED_BYTE, src);
            const pot = (x: number) => (x & (x - 1)) === 0;
            const canMip = webgl2 || (pot(w) && pot(h));
            G.texParameteri(G.TEXTURE_2D, G.TEXTURE_WRAP_S, G.CLAMP_TO_EDGE);
            G.texParameteri(G.TEXTURE_2D, G.TEXTURE_WRAP_T, canMip ? G.REPEAT : G.CLAMP_TO_EDGE);
            G.texParameteri(G.TEXTURE_2D, G.TEXTURE_MAG_FILTER, G.LINEAR);
            if (canMip) {
                G.generateMipmap(G.TEXTURE_2D);
                G.texParameteri(G.TEXTURE_2D, G.TEXTURE_MIN_FILTER, G.LINEAR_MIPMAP_LINEAR);
            } else {
                G.texParameteri(G.TEXTURE_2D, G.TEXTURE_MIN_FILTER, G.LINEAR);
            }
            if (aniso && maxAniso > 1) G.texParameterf(G.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, maxAniso);
            return { tex };
        },
        draw(sc) {
            const cam = sc.cam;
            G.viewport(0, 0, canvas.width, canvas.height);
            G.clearColor(0, 0, 0, 0);
            G.clearDepth(1);
            G.depthMask(true);
            G.clear(G.COLOR_BUFFER_BIT | G.DEPTH_BUFFER_BIT);
            G.enable(G.DEPTH_TEST);
            G.depthFunc(G.LEQUAL);
            G.disable(G.CULL_FACE);
            G.enable(G.BLEND);
            G.blendFunc(G.ONE, G.ONE_MINUS_SRC_ALPHA);
            const eye: V3 = [cam.vw / 2, cam.vh / 2, cam.D];

            // 1. benzile din pagină: doar adâncimea (ce e în spatele lor nu se vede). Le punem
            //    cu 3 px în spatele paginii (cât să cadă exact pe bandă pe ecran): pelicula care
            //    pleacă din bandă (la z ≈ 0, abia răsucită) trebuie să acopere lipitura, nu să cadă în ea.
            if (sc.occluders.length) {
                const d: number[] = [];
                const OZ = -3, k = (cam.D - OZ) / cam.D, cx = cam.vw / 2, cy = cam.vh / 2;
                const X = (x: number) => cx + (x - cx) * k, Y = (y: number) => cy + (y - cy) * k;
                for (const [x0, y0, w, h] of sc.occluders) {
                    const x = X(x0), y = Y(y0), x1 = X(x0 + w), y1 = Y(y0 + h);
                    d.push(x, y, OZ, x1, y, OZ, x, y1, OZ, x1, y, OZ, x1, y1, OZ, x, y1, OZ);
                }
                G.useProgram(occ.p);
                setCam(occ, cam);
                G.bindBuffer(G.ARRAY_BUFFER, occBuf);
                G.bufferData(G.ARRAY_BUFFER, new Float32Array(d), G.STREAM_DRAW);
                bindAttrs(occBuf, [[3, 0]], 3);
                G.colorMask(false, false, false, false);
                G.drawArrays(G.TRIANGLES, 0, d.length / 3);
                G.colorMask(true, true, true, true);
            }

            // 2. rola
            const R = sc.reel;
            if (R) {
                G.useProgram(reel.p);
                setCam(reel, cam);
                G.uniform3f(reel.u.uC, R.C[0], R.C[1], R.C[2]);
                G.uniform3f(reel.u.uE1, R.E1[0], R.E1[1], R.E1[2]);
                G.uniform3f(reel.u.uE2, R.E2[0], R.E2[1], R.E2[2]);
                G.uniform3f(reel.u.uA, R.A[0], R.A[1], R.A[2]);
                G.uniform1f(reel.u.uS, R.s);
                G.uniform1f(reel.u.uPack, R.pack);
                // ~0,8 px de margine moale, în unități de rolă
                const k = R.s * magnif(cam, R.C[2]);
                G.uniform1f(reel.u.uAA, Math.min(1.2, 0.8 / Math.max(1e-3, k)));
                G.uniform1f(reel.u.uShade, R.shade);
                G.uniform1f(reel.u.uBlur, Math.min(1.3, Math.max(0, R.blur)));
                G.uniform3f(reel.u.uEye, eye[0], eye[1], eye[2]);
                G.uniform3f(reel.u.uLight, LIGHT[0], LIGHT[1], LIGHT[2]);
                G.uniform3f(reel.u.uBg, sc.bg[0], sc.bg[1], sc.bg[2]);
                const part = (buf: WebGLBuffer | null, n: number, mode: number, kind: number, rad: number, z: number, zs: number) => {
                    bindAttrs(buf, [[3, 0], [3, 3]], 6);
                    G.uniform3f(reel.u.uPart, rad, rad, zs);
                    G.uniform1f(reel.u.uZ, z);
                    G.uniform1f(reel.u.uKind, kind);
                    G.drawArrays(mode, 0, n);
                };
                const nDisc = SEG + 2, nCyl = 2 * (SEG + 1);
                const dz = Math.max(0.02, Math.min(1, R.depth));
                // din spate spre față
                part(discBuf, nDisc, G.TRIANGLE_FAN, 1, 16.6, (-FLANGE_Z + FLANGE_T / 2) * dz, 0);      // flanșa din spate (fața dinăuntru)
                part(cylBuf, nCyl, G.TRIANGLE_STRIP, 2, 16.55, -FLANGE_Z * dz, FLANGE_T * dz);          // marginea ei
                part(cylBuf, nCyl, G.TRIANGLE_STRIP, 4, R.pack, 0, PACK_W * dz);                        // pelicula înfășurată
                part(discBuf, nDisc, G.TRIANGLE_FAN, 3, R.pack + 0.05, (PACK_W / 2) * dz, 0);          // capătul ei
                part(cylBuf, nCyl, G.TRIANGLE_STRIP, 2, 16.55, FLANGE_Z * dz, FLANGE_T * dz);           // marginea flanșei din față
                part(discBuf, nDisc, G.TRIANGLE_FAN, 0, 16.6, (FLANGE_Z + FLANGE_T / 2) * dz, 0);       // flanșa din față
            }

            // 3. pelicula (transparentă: nu scrie adâncimea). O desenăm de la capătul dinspre rolă
            //    spre bandă — din spate în față —, ca bucata din față să acopere ce e în spatele ei.
            if (sc.ribbons.length) {
                G.useProgram(film.p);
                setCam(film, cam);
                G.uniform3f(film.u.uEye, eye[0], eye[1], eye[2]);
                G.uniform3f(film.u.uLight, LIGHT[0], LIGHT[1], LIGHT[2]);
                G.uniform1i(film.u.uTex, 0);
                G.activeTexture(G.TEXTURE0);
                G.depthMask(false);
                for (const rb of sc.ribbons) {
                    const pth = rb.path;
                    // primul punct: exact la sFrom
                    let i0 = 0;
                    while (i0 < pth.n - 1 && pth.s[i0 + 1] <= rb.sFrom) i0++;
                    const count = pth.n - i0;
                    if (count < 2) continue;
                    if (ribData.length < count * 16) ribData = new Float32Array(count * 32);
                    let o = 0;
                    for (let i = pth.n - 1; i >= i0; i--) {
                        let px = pth.P[3 * i], py = pth.P[3 * i + 1], pz = pth.P[3 * i + 2], s = pth.s[i];
                        if (i === i0 && rb.sFrom > pth.s[i0] && i0 + 1 < pth.n) {
                            const f = (rb.sFrom - pth.s[i0]) / Math.max(1e-6, pth.s[i0 + 1] - pth.s[i0]);
                            px += (pth.P[3 * i + 3] - px) * f;
                            py += (pth.P[3 * i + 4] - py) * f;
                            pz += (pth.P[3 * i + 5] - pz) * f;
                            s = rb.sFrom;
                        }
                        const h = rb.halfAt ? rb.halfAt(s) : rb.half;
                        const bx = pth.B[3 * i] * h, by = pth.B[3 * i + 1] * h, bz = pth.B[3 * i + 2] * h;
                        const nx = pth.N[3 * i], ny = pth.N[3 * i + 1], nz = pth.N[3 * i + 2];
                        const v = rb.vAt(s);
                        ribData[o++] = px - bx; ribData[o++] = py - by; ribData[o++] = pz - bz;
                        ribData[o++] = nx; ribData[o++] = ny; ribData[o++] = nz;
                        ribData[o++] = 0; ribData[o++] = v;
                        ribData[o++] = px + bx; ribData[o++] = py + by; ribData[o++] = pz + bz;
                        ribData[o++] = nx; ribData[o++] = ny; ribData[o++] = nz;
                        ribData[o++] = 1; ribData[o++] = v;
                    }
                    G.bindBuffer(G.ARRAY_BUFFER, ribBuf);
                    G.bufferData(G.ARRAY_BUFFER, ribData.subarray(0, o), G.STREAM_DRAW);
                    bindAttrs(ribBuf, [[3, 0], [3, 3], [2, 6]], 8);
                    G.bindTexture(G.TEXTURE_2D, rb.tex.tex);
                    G.uniform1f(film.u.uOpacity, rb.opacity);
                    G.drawArrays(G.TRIANGLE_STRIP, 0, o / 8);
                }
                G.depthMask(true);
            }

            // 4. negrul de deasupra (ecranul care se deschide)
            if (sc.black > 0.001) {
                G.disable(G.DEPTH_TEST);
                G.useProgram(quad.p);
                bindAttrs(quadBuf, [[3, 0]], 3);
                const a = Math.min(1, sc.black);
                G.uniform4f(quad.u.uColor, 0.012 * a, 0.009 * a, 0.006 * a, a);
                G.drawArrays(G.TRIANGLES, 0, 3);
            }
        },
        dispose() {
            const lose = G.getExtension('WEBGL_lose_context');
            lose?.loseContext();
        },
    };
    void vw; void vh; void q;
    return api;
}
