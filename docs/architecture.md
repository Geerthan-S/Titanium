# Titanium Roots Architecture

## Runtime

The site is a Vite multi-page application. Public pages initialize through `assets/js/app.js`; protected admin pages initialize through `assets/js/pages/admin.js`. Both use the shared Supabase client in `assets/js/data/supabase-client.js`.

Focused repositories isolate Auth, public reads, administrator CRUD, appointments, media, analytics, and record mapping. Public collections are cached by `public-content-store.js`; Supabase Realtime invalidates the affected collection and triggers a safe re-fetch.

## CMS flow

Administrators authenticate with Supabase Auth and must also have an active `cms_admins` row. Admin CRUD writes typed tables and a bounded audit record. Only published doctors, treatments, articles, gallery items, and consent-approved testimonials are publicly readable through RLS.

Site settings drive global contact details, clinic hours, footer text, and brand colors. Public forms insert appointment requests; names, contact details, and free text are never sent to analytics.

## Media and SEO

Authenticated administrators upload validated JPG, PNG, WebP, or approved SVG files to the `cms-media` bucket. The database stores paths; public renderers build bucket URLs only for published records.

`npm run build` fetches public `seo_pages` records into the ignored `.cache/seo-pages.json` artifact. Vite injects route-specific title, description, canonical, robots, and Open Graph tags into generated HTML. Publishing SEO changes therefore requires a rebuild/deployment hook.

## Security boundary

The browser receives only the project URL and publishable key. Authorization is enforced by database grants and RLS, not by hidden UI. Never add a service-role key, database password, personal access token, or administrator password to this repository.
