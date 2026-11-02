/* ============================================================
   /api/gear — cererea listei de echipament (03.11.2026).
   GEAR din meniu → căsuța pentru mail → POST { email, lang }.
   Răspunsul e chiar PDF-ul cu echipamentul (se descarcă în browser); adresa se
   păstrează, câte o linie, în .gear/cereri.jsonl (ignorat de Git).

   PDF-ul stă în private/gear/ — NU în public/, ca să nu poată fi
   descărcat fără mail. Pentru a-l schimba, înlocuiește fișierul și
   păstrează numele.

   ATENȚIE, pe site-ul public: containerul Docker poate pierde
   .gear/ la fiecare publicare. Înainte de lansare, de hotărât unde
   ajung adresele (ex. un mail către atemporalfilm@gmail.com).
   ============================================================ */

import { promises as fs } from 'fs';
import path from 'path';

import { NextResponse } from 'next/server';



export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GEAR_FILE     = path.join(process.cwd(), 'private', 'gear', 'atemporal-film-gear.pdf');
const DOWNLOAD_NAME = 'Atemporal-Film-Equipment.pdf';
const LOG_DIR       = path.join(process.cwd(), '.gear');
const LOG_FILE      = path.join(LOG_DIR, 'cereri.jsonl');
const EMAIL_RE      = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LANGS         = ['ro', 'en', 'fr'];


export async function POST(request: Request) {
    let body: { email?: unknown; lang?: unknown; website?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
        return NextResponse.json({ ok: false, error: 'invalid email' }, { status: 400 });
    }
    const lang  = typeof body.lang === 'string' && LANGS.includes(body.lang) ? body.lang : 'en';
    const isBot = typeof body.website === 'string' && body.website.trim() !== '';   // câmpul-capcană

    let file: Buffer;
    try {
        file = await fs.readFile(GEAR_FILE);
    } catch {
        console.error('[gear] lipsește', GEAR_FILE);
        return NextResponse.json({ ok: false, error: 'gear list unavailable' }, { status: 503 });
    }

    if (!isBot) {
        const line = JSON.stringify({ time: new Date().toISOString(), email, lang }) + '\n';
        try {
            await fs.mkdir(LOG_DIR, { recursive: true });
            await fs.appendFile(LOG_FILE, line, 'utf8');
        } catch (err) {
            console.error('[gear] adresa nu a putut fi salvată', err);
        }
    }

    return new NextResponse(new Uint8Array(file), {
        status: 200,
        headers: {
            'Content-Type':        'application/pdf',
            'Content-Disposition': `attachment; filename="${DOWNLOAD_NAME}"`,
            'Cache-Control':       'no-store',
        },
    });
}
