# Atemporal Film

Website for [Atemporal Film SRL](https://atemporalfilm.com) — a post-production and production company based in Romania, specialising in post-production sound, editing, and field recording services.

---

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 3**
- **node-mailjet** for contact form email delivery
- **Docker** for containerised deployment

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## Project Structure

```
app/          # Pages (App Router): home, work, about, news, gallery, contact
components/   # Reusable UI primitives
containers/   # Composed layout sections (menu, footer, hero, contact panel)
data/         # Film catalogue, site copy, bilingual strings, constants
logic/        # Shared utility functions
pages/api/    # API route for contact form (Mailjet)
public/       # Static assets: images, icons, favicons, OG image
```

See `CLAUDE.md` for a full technical breakdown of the architecture.

---

## Bilingual Support

The site supports English and Romanian. All UI strings are defined in `data/language.ts` and `data/constants.ts` using `{ en: '...', ro: '...' }` objects, resolved at runtime via React Context.

---

## Film Catalogue

Projects are defined as an array of `Entity` objects in `data/index.tsx`. Each entry includes title, director, type (feature / short / commercial), festivals, press links, images, and IMDB reference. To add a new project, append an entry to the array and place the corresponding images under `public/assets/entities/`.

---

## Deployment

The project includes a `Dockerfile` for containerised deployment. Build and run with:

```bash
docker build -t atemporalfilm-com .
docker run -p 3000:3000 atemporalfilm-com
```

---

## Environment

Contact form delivery requires a Mailjet API key. Configure the relevant environment variables before running in production (see `pages/api/send_contact.ts`).

---

## Repository

[github.com/ly3xqhl8g9/atemporalfilm-com](https://github.com/ly3xqhl8g9/atemporalfilm-com)
