/* ============================================================
   /api/regie — primește lista de cue-uri din Modul Regie și o
   salvează în .regie/ (ultimul.json, ultimul.txt, istoric/).
   Funcționează DOAR în previzualizarea locală (development);
   pe site-ul public răspunde 404.
   ============================================================ */

import { promises as fs } from 'fs';
import path from 'path';

import { NextResponse } from 'next/server';



export const dynamic = 'force-dynamic';


export async function POST(request: Request) {
    if (process.env.NODE_ENV !== 'development') {
        return new NextResponse('Not found', { status: 404 });
    }

    let payload: { text?: unknown };
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), '.regie');
    const historyDir = path.join(dir, 'istoric');
    await fs.mkdir(historyDir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const json = JSON.stringify(payload, null, 2);

    await fs.writeFile(path.join(dir, 'ultimul.json'), json, 'utf8');
    await fs.writeFile(path.join(historyDir, `${stamp}.json`), json, 'utf8');
    if (typeof payload.text === 'string') {
        await fs.writeFile(path.join(dir, 'ultimul.txt'), payload.text, 'utf8');
    }

    return NextResponse.json({ ok: true, file: `.regie/istoric/${stamp}.json` });
}
