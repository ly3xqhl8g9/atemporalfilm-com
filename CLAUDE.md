# CLAUDE.md — atemporalfilm.com

Technical reference for working on this codebase. Read this before making changes.

---

## Project Overview

Portfolio and contact website for **Atemporal Film SRL**, a Romanian post-production and production company. Services: post-production sound, editing, and field recording. The site is bilingual (English / Romanian) and serves as a public-facing filmography and contact point.

Live URL: https://atemporalfilm.com
Repo: https://github.com/ly3xqhl8g9/atemporalfilm-com

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Font | League Spartan (Google Fonts, weights 300 & 400) |
| Email | node-mailjet (via `/pages/api/send_contact.ts`) |
| Deployment | Docker (see `Dockerfile`) |

React 19 stable is used. Do not downgrade to the RC version (`19.0.0-rc-*`) that may appear in git history — it caused npm peer dependency resolution failures.

---

## Directory Structure

```
app/                    # Next.js App Router pages
  layout.tsx            # Root layout — sets metadata, font, AppWrapper
  page.tsx              # Home (landing hero)
  about/page.tsx        # About page
  contact/page.tsx      # Contact page
  gallery/page.tsx      # Photo gallery (carousel)
  news/page.tsx         # News page
  work/page.tsx         # Filmography / project list
  chat/                 # Internal AI chat feature (hidden from public nav)
  converter/            # Internal media converter tool (hidden from public nav)

components/             # Generic, reusable UI primitives
  EntityDetail/         # Full detail view for a single film/project
  EntityLoop/           # List/grid of project cards
  Input/                # Styled text input
  Textarea/             # Styled textarea
  LanguageSwitch/       # EN / RO toggle button
  PageDetail/           # Generic page content wrapper

containers/             # Composed UI sections (layout-aware)
  AppWrapper/           # Root client wrapper: holds Context providers, Menu, ContactMenu
  Contact/              # Contact form, contact details, slide-in menu variant
  Footer/               # Site footer (social icons + ProjectDisclaimer)
  LandingHero/          # Full-screen hero for the home page
  Links/IMDBLink        # IMDB badge component
  Links/YouTubeLink     # YouTube trailer button component
  Menu/Menu             # Mobile hamburger menu
  Menu/MenuText         # Desktop horizontal nav
  NoSSRWrapper/         # Disables SSR for specific children
  ProjectDisclaimer/    # Legal / credits text in footer
  ProjectImages/        # Image carousel for a project detail page
  Socials/              # Social media icon row

data/
  index.tsx             # Entity[] data array + Entity interface — the film catalogue
  constants.ts          # menuLinks, socialLinks, persons (team), galleryImages
  language.ts           # languageData — all bilingual UI strings (en/ro)
  contact.ts            # Contact details (address, email, phone etc.)
  icons.tsx             # SVG icon components
  validation.ts         # Form validation logic
  atemporal.md          # Data structure reference doc for the Entity type

logic/
  utilities.ts          # Shared utility functions

pages/api/
  send_contact.ts       # API route: handles contact form submission via Mailjet

public/
  assets/entities/      # Project hero images and detail images
  assets/gallery/       # Gallery page images (gallery-1.webp … gallery-9.webp)
  assets/logos/         # Social media logo PNGs
  landing.webp          # Home page hero background
  og.png                # Open Graph image
```

---

## Global State & Context

Defined in `app/context.ts`, consumed throughout via React Context:

- **AppContext** — controls `contactMenu` (boolean) and `setContactMenu`. When `true`, the slide-in contact panel animates in from the right.
- **LanguageContext** — holds `language` (`'en' | 'ro'`) and `setLanguage`. All bilingual strings are resolved against this value.

Both contexts are provided in `containers/AppWrapper/index.tsx`.

---

## Bilingual System

All user-facing strings exist in two forms. The pattern everywhere is:

```ts
// In data/language.ts or data/constants.ts
someKey: {
    en: 'English text',
    ro: 'Romanian text',
}

// In a component
import { useContext } from 'react';
import { LanguageContext } from '@/app/context';

const { language } = useContext(LanguageContext);
// then: someKey[language]
```

Menu links and page labels follow the same pattern in `data/constants.ts`.

---

## Film Catalogue — Adding or Editing Projects

All project data lives in `data/index.tsx` as the `data: Entity[]` array. The `Entity` interface is:

```ts
interface Entity {
    id: string;               // slug, e.g. '2024-where-elephants-go'
    type: 'feature' | 'short' | 'commercial';
    kind?: 'documentary' | 'animation';
    year: string;
    title: string;            // English title
    titleRo: string;          // Romanian title
    director: string;
    cinematography?: string;
    producer?: string;
    coproducer?: string;
    productionCompany?: string;
    press: string[];          // URLs to press articles
    festivals: string[];      // Festival names as strings
    images: string[];         // Image filenames (without extension) under public/assets/entities/
    heroImage: string;        // Hero image filename under public/assets/entities/
    trailer?: string;         // YouTube URL
    imdb?: string;            // IMDB URL
}
```

**Image naming convention:** `{id}-1`, `{id}-2`, etc. for detail images; `{id}-hero.jpg` for the hero. Place files under `public/assets/entities/`.

To add a new project: add an entry to the `data` array in `data/index.tsx` and place images in `public/assets/entities/`.

---

## Hidden Features (not in public navigation)

Two pages exist but are intentionally hidden from the menu and footer:

- `/chat` — an AI chat interface using `@huggingface/transformers` and a web worker (`app/chat/worker.js`) for in-browser inference. Uses `@ffmpeg/ffmpeg` utilities.
- `/converter` — a media converter tool, also using ffmpeg.

These are experimental/internal. Do not add them back to `containers/Footer` or `data/constants.ts` (menuLinks) without explicit instruction.

---

## Commented-Out Items

Several items are commented out in the codebase and should stay that way unless reactivated intentionally:

- **Careers page** — commented out in `data/constants.ts` menuLinks
- **Facebook social link** — commented out in `data/constants.ts` socialLinks

---

## npm & Dependencies

Install: `npm install`

If peer dependency errors appear, check that `react` and `react-dom` are set to `^19.0.0` (stable) in `package.json`, not to an RC version. Do not use `--force`; fix the underlying version mismatch instead.

The `.npmrc` has project-level config — do not remove it.

Webpack aliases in `next.config.ts` exclude `sharp` and `onnxruntime-node` from browser bundles — required for the HuggingFace transformer and image processing packages to coexist with Next.js.

---

## Deployment

The project ships as a Docker container. Build with the provided `Dockerfile`. The app runs on the default Next.js port (`3000`).

For local development: `npm run dev` — hot reload is active.

---

## TypeScript & Linting

- Strict TypeScript is configured via `tsconfig.json`.
- ESLint uses `eslint-config-next`. Run `npm run lint` to check.
- `@types/react` and `@types/react-dom` should stay on `^19` to match the React version.

---

## Contacts & Team (as of codebase)

Defined in `data/constants.ts` under `persons[]`:

- Ștefan Azaharioaie — sound designer, editor
- Diana Smeu — COO
- Andrei Sibișan — sound
- Răzvan Ilinca — editor, sound
- Mihai Nanu — sound engineer
