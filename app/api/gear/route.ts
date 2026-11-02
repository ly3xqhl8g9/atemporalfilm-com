/* ============================================================
   /api/gear — cererea listei de echipament (03.11.2026).
   GEAR din meniu → căsuța pentru mail → POST { email, lang }.
   Răspunsul e chiar PDF-ul cu echipamentul (se descarcă în browser); adresa se
   păstrează, câte o linie, în .gear/cereri.jsonl (ignorat de Git).

   PDF-ul stă în private/gear/ — NU în public/, ca să nu poată fi
   descărcat fără mail. Pentru a-l schimba, înlocuiește fișierul și
   păstrează numele.

   La fiecare cerere pleacă și un mail către atemporalfilm@gmail.com
   (03.11.2026), prin Mailjet — același cont și aceleași variabile de
   mediu ca formularul de contact (MJ_API_KEY, MJ_API_SECRET; vezi
   pages/api/send_contact.ts). Reply-To = adresa celui care a cerut
   lista, deci „Reply” din Gmail îi răspunde direct. Fără chei (ex. pe
   Mac), mailul nu pleacă, dar adresa rămâne în .gear/cereri.jsonl
   (pe server, fișierul se poate pierde la o nouă publicare).
   ============================================================ */

import { promises as fs } from 'fs';
import path from 'path';

import { after, NextResponse } from 'next/server';
import Mailjet from 'node-mailjet';



export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GEAR_FILE     = path.join(process.cwd(), 'private', 'gear', 'atemporal-film-gear.pdf');
const DOWNLOAD_NAME = 'Atemporal-Film-Equipment.pdf';
const LOG_DIR       = path.join(process.cwd(), '.gear');
const LOG_FILE      = path.join(LOG_DIR, 'cereri.jsonl');
const EMAIL_RE      = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LANGS         = ['ro', 'en', 'fr'];

const MAIL_FROM     = 'contact@atemporalfilm.com';   // expeditorul validat în Mailjet (ca la contact)
const MAIL_TO       = 'atemporalfilm@gmail.com';


/** Mail de notificare: cine a cerut lista. Nu oprește descărcarea dacă nu merge. */
async function notify(email: string, lang: string, time: string) {
    const apiKey    = process.env.MJ_API_KEY;
    const apiSecret = process.env.MJ_API_SECRET;
    if (!apiKey || !apiSecret) {
        console.warn('[gear] Mailjet nu e configurat (MJ_API_KEY / MJ_API_SECRET) — mailul nu a plecat');
        return;
    }
    const when = new Date(time).toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' });
    const text = `${email} a descărcat lista de echipament de pe atemporalfilm.com.\n\n`
               + `Data: ${when}\nLimba site-ului: ${lang.toUpperCase()}\n\n`
               + `„Reply” îi răspunde direct.`;
    try {
        const mailjet = new Mailjet({ apiKey, apiSecret });
        await mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [{
                From:     { Email: MAIL_FROM, Name: 'atemporalfilm.com' },
                To:       [{ Email: MAIL_TO }],
                ReplyTo:  { Email: email },
                Subject:  `[gear] Lista de echipament — ${email}`,
                TextPart: text,
            }],
        });
    } catch (err) {
        console.error('[gear] mailul de notificare nu a plecat', err);
    }
}


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
        const time = new Date().toISOString();
        // mailul pleacă după ce răspunsul (PDF-ul) a fost trimis
        after(() => notify(email, lang, time));
        const line = JSON.stringify({ time, email, lang }) + '\n';
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
