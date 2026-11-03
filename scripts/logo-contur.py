#!/usr/bin/env python3
"""Contururile logo-ului (Caveat 600) pentru animația cu rola — 03.11.2026.
Rulare: python3 scripts/logo-contur.py <font.woff2> <ieșire.ts>  (are nevoie de fontTools și de node, pentru brotli).
Shim-ul brotli de mai jos folosește zlib din Node, pentru că pachetul Python brotli nu e mereu instalabil."""
import sys, types, subprocess
def _b(cmd):
    return lambda data, **kw: subprocess.run(["node","-e","process.stdout.write(require(\"zlib\").brotli%sSync(require(\"fs\").readFileSync(0)))" % cmd],input=data,capture_output=True,check=True).stdout
sys.modules.setdefault("brotli", types.SimpleNamespace(decompress=_b("Decompress"), compress=_b("Compress")))
import math
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.varLib.instancer import instantiateVariableFont
SRC, OUT = sys.argv[1], sys.argv[2]
_f = TTFont(SRC); _f.flavor = None
F = instantiateVariableFont(_f, {"wght": 600})
cmap = F.getBestCmap(); hm = F["hmtx"]
def unext(L):
    subs=[]
    for st in L.SubTable:
        if L.LookupType in (7,9) and hasattr(st,'ExtSubTable'): subs.append((st.ExtensionLookupType, st.ExtSubTable))
        else: subs.append((L.LookupType, st))
    return subs
def feature_lookups(table, tag):
    idx=set()
    for fr in table.FeatureList.FeatureRecord:
        if fr.FeatureTag==tag: idx.update(fr.Feature.LookupListIndex)
    return sorted(idx)
def apply_single(L, g):
    for tp,st in unext(L):
        if tp==1 and g in st.mapping: return st.mapping[g]
    return g
def gsub(glyphs, tags=('locl','calt','liga')):
    G=F['GSUB'].table
    order=sorted(set(i for t in tags for i in feature_lookups(G,t)))
    for li in order:
        L=G.LookupList.Lookup[li]
        i=0
        while i<len(glyphs):
            done=False
            for tp,st in unext(L):
                if tp==1:
                    if glyphs[i] in st.mapping: glyphs[i]=st.mapping[glyphs[i]]; done=True; break
                elif tp==6 and st.Format==3:
                    n=len(st.InputCoverage)
                    if i+n>len(glyphs): continue
                    if not all(glyphs[i+k] in st.InputCoverage[k].glyphs for k in range(n)): continue
                    if len(st.BacktrackCoverage)>i: continue
                    if not all(glyphs[i-1-k] in st.BacktrackCoverage[k].glyphs for k in range(len(st.BacktrackCoverage))): continue
                    if i+n+len(st.LookAheadCoverage)>len(glyphs): continue
                    if not all(glyphs[i+n+k] in st.LookAheadCoverage[k].glyphs for k in range(len(st.LookAheadCoverage))): continue
                    for r in st.SubstLookupRecord:
                        glyphs[i+r.SequenceIndex]=apply_single(G.LookupList.Lookup[r.LookupListIndex], glyphs[i+r.SequenceIndex])
                    done=True; break
                elif tp==4:
                    pass
            i+=1
    return glyphs
def kern(a,b):
    P=F['GPOS'].table; tot=0
    for li in feature_lookups(P,'kern'):
        L=P.LookupList.Lookup[li]
        for tp,st in unext(L):
            if tp!=2: continue
            if a not in st.Coverage.glyphs: continue
            if st.Format==1:
                ps=st.PairSet[st.Coverage.glyphs.index(a)]
                for pv in ps.PairValueRecord:
                    if pv.SecondGlyph==b:
                        return (getattr(pv.Value1,'XAdvance',0) or 0)
            else:
                c1=st.ClassDef1.classDefs.get(a,0); c2=st.ClassDef2.classDefs.get(b,0)
                v=st.Class1Record[c1].Class2Record[c2].Value1
                x=getattr(v,'XAdvance',0) or 0 if v else 0
                if x: return x
    return 0
def shape(word):
    gl=gsub([cmap[ord(c)] for c in word])
    out=[];x=0
    for k,g in enumerate(gl):
        out.append((g,x))
        x+=hm[g][0]
        if k+1<len(gl): x+=kern(g,gl[k+1])
    return out,x
gs=F.getGlyphSet()
ASC=0.960; DESC=0.300
def word_layout(word,size,left,top,rot,ls_em=-0.005):
    lh=0.85*size
    base=top+(lh-(ASC+DESC)*size)/2+ASC*size
    out,adv=shape(word)
    ls=ls_em*size
    W=adv/1000*size+ls*len(out)
    cx,cy=left+W/2, top+lh/2
    a=math.radians(rot); ca,sa=math.cos(a),math.sin(a)
    glyphs=[]
    for k,(g,px) in enumerate(out):
        ox=left+px/1000*size+ls*k
        s=size/1000
        # font(x,y) -> pre-rot (ox+x*s, base-y*s) -> rotate about (cx,cy)
        # combined affine: X = ca*(ox+x s - cx) - sa*(base - y s - cy) + cx
        #                  Y = sa*(ox+x s - cx) + ca*(base - y s - cy) + cy
        tx=ca*(ox-cx)-sa*(base-cy)+cx
        ty=sa*(ox-cx)+ca*(base-cy)+cy
        aff=(ca*s, sa*s, sa*s, -ca*s, tx, ty)
        # fontTools Transform(xx, xy, yx, yy, dx, dy): x' = xx*x + yx*y + dx ; y' = xy*x + yy*y + dy
        rp=RecordingPen(); gs[g].draw(TransformPen(rp,(ca*s, sa*s, sa*s, -ca*s, tx, ty)))
        # split contours
        contours=[]; cur=[]
        for op,args in rp.value:
            cur.append((op,args))
            if op in ('closePath','endPath'): contours.append(cur); cur=[]
        if cur: contours.append(cur)
        cs=[]
        for c in contours:
            sp=SVGPathPen(None, ntos=lambda v: ('%.2f'%v).rstrip('0').rstrip('.'))
            for op,args in c: getattr(sp,op)(*args)
            st=c[0][1][0]
            cs.append({'d':sp.getCommands(),'x':round(st[0],2),'y':round(st[1],2)})
        glyphs.append({'g':g,'contours':cs})
    return glyphs, W, (cx,cy)
w1,W1,c1=word_layout('Atemporal',38,0,0,-2)
w2,W2,c2=word_layout('Film',32,38,0.85*38-2,-1)
lines=["/* Logo-ul „Atemporal Film” ca contururi (03.11.2026), pentru animația cu rola:",
" * Caveat 600 (fontul logo-ului, --font-hand), cu alternativele contextuale (calt)",
" * și așezarea din CSS (.logo, .logoWord1/2: 38 px rotit −2°, 32 px la +38 px, rotit −1°,",
" * line-height 0,85, letter-spacing −0,005em) — coordonatele sunt în px, cu originea",
" * în colțul din stânga-sus al logo-ului. Suprapus peste textul HTML: la ±0,5 px.",
" * Generat de scripts/logo-contur.py (din .next/static/media/46bdd75a3ff56824-s.p.woff2). */",
"",
"/** pentru fiecare cuvânt: literele, în ordinea scrisului; pentru fiecare literă: contururile */",
"export const LOGO_WORDS: { x: number; y: number; d: string }[][][] = ["]
for w in (w1, w2):
    lines.append("    [")
    for g in w:
        lines.append("        [ // "+g['g'])
        for c in g['contours']:
            lines.append(f"            {{ x: {c['x']}, y: {c['y']}, d: '{c['d']}' }},")
        lines.append("        ],")
    lines.append("    ],")
lines.append("];")
open(OUT,'w').write("\n".join(lines)+"\n")
