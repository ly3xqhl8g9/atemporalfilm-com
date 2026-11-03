/* ============================================================
   Limbile site-ului (03.11.2026, 13:49, cererea lui Ștefan): site-ul se
   deschide în engleză; butonul de limbă din bara de jos deschide lista, în
   ordinea: engleză, spaniolă, franceză, română, thailandeză, chineză
   (simplificată), hindi. Alegerea rămâne cât ține vizita (sessionStorage),
   deci nu se pierde la trecerea WORK → ABOUT; o vizită nouă pornește în engleză.
   ============================================================ */

export type Lang = 'en' | 'es' | 'fr' | 'ro' | 'th' | 'zh' | 'hi';

export const LANGS: Lang[] = ['en', 'es', 'fr', 'ro', 'th', 'zh', 'hi'];

/** numele limbii, scris în limba ei */
export const LANG_NAME: Record<Lang, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    ro: 'Română',
    th: 'ไทย',
    zh: '中文',
    hi: 'हिन्दी',
};

/** codul de pe buton */
export const LANG_CODE: Record<Lang, string> = {
    en: 'EN', es: 'ES', fr: 'FR', ro: 'RO', th: 'TH', zh: 'ZH', hi: 'HI',
};

/** atributul lang al paginii (pentru fonturi, despărțirea rândurilor, cititoare de ecran) */
export const HTML_LANG: Record<Lang, string> = {
    en: 'en', es: 'es', fr: 'fr', ro: 'ro', th: 'th', zh: 'zh-Hans', hi: 'hi',
};

/** eticheta listei de limbi (aria) */
export const LANG_MENU_LABEL: Record<Lang, string> = {
    en: 'Language', es: 'Idioma', fr: 'Langue', ro: 'Limba', th: 'ภาษา', zh: '语言', hi: 'भाषा',
};

export const LANG_STORE = 'af-lang';

export const isLang = (v: unknown): v is Lang =>
    typeof v === 'string' && (LANGS as string[]).includes(v);
