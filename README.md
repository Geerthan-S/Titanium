# Titanium Roots Dental Clinic — Operational README

## Project Overview

A production-ready static website for **Titanium Roots Dental Clinic** built with Vite, Supabase, and Vanilla JS/CSS. It includes a full public-facing site (Home, About, Treatments, Doctors, Testimonials, Blog, Contact) and a CMS admin portal (Dashboard, Appointments, Doctors, Treatments, Blogs, Testimonials, Gallery, SEO, Analytics, Settings).

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20 or later |
| npm | 9 or later |
| Supabase CLI | v2.110.0 (pinned in `package.json`) |

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-public-key>
```

> **Never put `service_role` or `secret` keys here.** The build and runtime both use only the public anon key.

---

## Setup

```powershell
# 1. Install dependencies
npm install

# 2. Apply Supabase migrations to your linked project
npx supabase db push

# 3. Start the development server
npm run dev
```

The dev server runs at `http://localhost:5173` by default.

---

## Development

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Fetch SEO data & build production bundle to `dist/` |
| `npm run preview` | Preview production build locally at port 4173 |
| `npm test` | Run all static tests |
| `npm run test:live` | Run live Supabase smoke test (requires credentials) |
| `npm run supabase:status` | Show Supabase project status |
| `npm run supabase:migrations` | List applied migrations |

---

## Running Tests

```powershell
# All static tests (no live DB required)
node --test tests/production-readiness.test.mjs tests/admin-cms.test.mjs tests/admin-auth-production.test.mjs tests/admin-production.test.mjs tests/seo-build.test.mjs
```

All 24 tests must pass before deploying.

### Browser E2E (optional, requires Playwright + preview server)

```powershell
# Set credentials via env vars (do not hard-code)
$env:QA_ADMIN_EMAIL = "your-qa-admin@example.com"
$env:QA_ADMIN_PASSWORD = "your-qa-password"

npm run preview &
node tests/admin-e2e.mjs
```

---

## Production Build & Deployment

```powershell
npm run build
```

The `build` script runs `scripts/fetch-seo.mjs` first to pull route metadata from Supabase into `.cache/seo-pages.json`, which Vite then injects into each HTML page (`<title>`, `<meta>`, `<link rel="canonical">`, Open Graph tags).

Upload the contents of `dist/` to your static host (e.g. Vercel, Netlify, Cloudflare Pages).

---

## Supabase Migrations

All schema changes live in `supabase/migrations/`. To apply them:

```powershell
npx supabase db push
```

The migration `20260801120305_production_cms_content.sql` seeds production treatments, blog posts, and SEO page entries. It uses `ON CONFLICT … DO UPDATE … WHERE updated_by IS NULL` so that CMS-edited rows are never overwritten by a re-run.

---

## Project Structure

```
/
├── admin/          Admin portal HTML pages
├── assets/
│   ├── css/        Global + per-page CSS
│   └── js/
│       ├── admin/  Admin JavaScript modules
│       ├── data/   Supabase repositories
│       ├── pages/  Public page controllers
│       └── utils/  Shared utilities
├── components/     HTML component partials
├── public/         Static public files (robots.txt, sitemap.xml, favicon.ico)
├── scripts/        Build-time scripts (fetch-seo.mjs)
├── supabase/       Supabase config and migrations
├── tests/          Static + live test files
└── vite.config.js  Vite configuration with SEO transform
```

---

## Verified-Data Checklist

Before marking a release as production-ready, confirm:

- [ ] All Supabase migrations applied (`npm run supabase:migrations`)
- [ ] All 24 static tests pass (`npm test`)
- [ ] `public/robots.txt` contains `Disallow: /admin/` and correct `Sitemap:` URL
- [ ] `public/sitemap.xml` lists all public pages
- [ ] `public/favicon.ico` is present and non-empty
- [ ] No demo, Lorem ipsum, or fabricated patient identities in production SQL
- [ ] No `service_role` or secret keys in source or environment
- [ ] Admin login redirects unauthenticated users to `/admin/login.html`
- [ ] Testimonial publishing requires `moderationStatus = 'Approved'` AND `consentStatus = 'Confirmed'`
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` set in hosting environment
