# Titanium Roots Blueprint Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the current Titanium Roots website and CMS with the master blueprint: complete crawlable routes, clinically responsible content, richer CMS data, accurate SEO, honest launch states, and production-quality accessibility/performance checks.

**Architecture:** Keep the current Vite + vanilla JS + Supabase stack, but replace thin modal-only detail experiences with generated static HTML entry points for treatments, doctors, and blog articles. Extend the Supabase schema in migrations without rewriting the whole CMS; preserve existing public pages while adding route templates, metadata generation, sitemap generation, and safer content rules.

**Tech Stack:** Vite 6, vanilla JavaScript modules, Supabase JS v2, Supabase migrations/Postgres RLS, DOMPurify, GSAP, lucide, Node test runner, Puppeteer smoke scripts.

---

## Scope Split

This is a master implementation plan covering five connected subsystems. Execute in order because later tasks depend on earlier schema and route contracts.

1. Route and SEO generation
2. Supabase schema and CMS data model
3. Public treatment/blog/doctor detail pages
4. Content safety and launch-state cleanup
5. Admin CMS workflow, validation, accessibility, and release checks

---

## File Structure

### Create

- `E:\Titanium-main\scripts\generate-static-pages.mjs` — build-time generator for static detail pages, sitemap, and SEO cache.
- `E:\Titanium-main\templates\treatment-detail.html` — crawlable treatment route template.
- `E:\Titanium-main\templates\blog-article.html` — crawlable article route template.
- `E:\Titanium-main\templates\doctor-profile.html` — crawlable doctor profile route template.
- `E:\Titanium-main\assets\js\pages\treatment-detail.js` — hydration for treatment detail pages.
- `E:\Titanium-main\assets\js\pages\blog-article.js` — hydration for blog article pages.
- `E:\Titanium-main\assets\js\pages\doctor-profile.js` — hydration for doctor profile pages.
- `E:\Titanium-main\assets\js\utils\route-manifest.js` — shared route helpers for canonical paths.
- `E:\Titanium-main\supabase\migrations\20260803000100_blueprint_alignment_schema.sql` — additive schema changes.
- `E:\Titanium-main\tests\blueprint-routes.test.mjs` — generated route and sitemap assertions.
- `E:\Titanium-main\tests\blueprint-content-safety.test.mjs` — no fake claims/testimonials/unsafe copy assertions.
- `E:\Titanium-main\tests\blueprint-schema.test.mjs` — migration and RLS assertions.
- `E:\Titanium-main\docs\blueprint-alignment.md` — human-readable release checklist and content governance.

### Modify

- `E:\Titanium-main\package.json` — change build script to use `scripts/generate-static-pages.mjs`.
- `E:\Titanium-main\vite.config.js` — include generated template copies and clean route output rules.
- `E:\Titanium-main\scripts\fetch-seo.mjs` — retire after `generate-static-pages.mjs` replaces it.
- `E:\Titanium-main\assets\js\data\record-mappers.js` — map new blueprint fields and remove broken testimonial permission mapping.
- `E:\Titanium-main\assets\js\data\public-content-repository.js` — fetch relations needed for detail pages.
- `E:\Titanium-main\assets\js\pages\home.js` — remove inflated stats and render honest empty states.
- `E:\Titanium-main\assets\js\pages\treatments.js` — keep catalogue behavior and stop direct-link interception from hiding crawlable pages.
- `E:\Titanium-main\assets\js\pages\blog.js` — render article cards as real anchors and use overlay only as enhancement.
- `E:\Titanium-main\assets\js\pages\testimonials.js` — fix consent logic, remove hardcoded doctors, remove before/after fake imagery.
- `E:\Titanium-main\index.html` — replace launch copy and fake metrics with blueprint copy.
- `E:\Titanium-main\about.html` — align story and claim language with blueprint.
- `E:\Titanium-main\treatments.html` — align hub copy and remove before/after section until explicit consent data exists.
- `E:\Titanium-main\blog.html` — rename visible IA to Knowledge Center and keep `/blog` route.
- `E:\Titanium-main\testimonials.html` — show honest no-reviews launch state.
- `E:\Titanium-main\contact.html` — simplify appointment flow and fix contact details.
- `E:\Titanium-main\404.html` — add noindex, recovery links, and blueprint copy.
- `E:\Titanium-main\components\navbar.html` — change Blog label to Knowledge Center.
- `E:\Titanium-main\components\footer.html` — add medical disclaimer and accurate contact links.
- `E:\Titanium-main\components\appointment-modal.html` — reduce public form fields.
- `E:\Titanium-main\assets\js\admin\admin-app.js` — add review/scheduled/archived workflows and blueprint fields.
- `E:\Titanium-main\assets\js\admin\admin-store.js` — support added relations and status names.
- `E:\Titanium-main\public\robots.txt` — keep admin blocked and point to production sitemap.
- `E:\Titanium-main\public\sitemap.xml` — generated by build, not manually maintained.
- `E:\Titanium-main\README.md` — update build, routes, and launch verification.

---

## Task 1: Establish Route Contract Tests

**Files:**
- Create: `E:\Titanium-main\tests\blueprint-routes.test.mjs`
- Modify: none

- [ ] **Step 1: Write failing route architecture tests**

Create `E:\Titanium-main\tests\blueprint-routes.test.mjs` with:

```js
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('build generator owns SEO cache, static detail pages, and sitemap', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.scripts.build, 'node scripts/generate-static-pages.mjs && vite build');
  assert.ok(existsSync(new URL('../scripts/generate-static-pages.mjs', import.meta.url)));
  assert.ok(existsSync(new URL('../templates/treatment-detail.html', import.meta.url)));
  assert.ok(existsSync(new URL('../templates/blog-article.html', import.meta.url)));
  assert.ok(existsSync(new URL('../templates/doctor-profile.html', import.meta.url)));
});

test('blog listing cards remain real anchors with optional overlay enhancement', async () => {
  const page = await read('assets/js/pages/blog.js');
  assert.match(page, /href="\/blog\/\$\{safe\(article\.slug\)\}\/"/);
  assert.match(page, /data-article-open="\$\{safe\(article\.id\)\}"/);
  assert.doesNotMatch(page, /<button class="text-link" type="button" data-article-open/);
});

test('treatment cards link to clean canonical detail routes', async () => {
  const page = await read('assets/js/pages/treatments.js');
  assert.match(page, /href="\/treatments\/\$\{safe\(treatment\.slug\)\}\/"/);
  assert.doesNotMatch(page, /match\(\^\\\/treatments\\\/\(\[\^\.\/\]\+\)\\\.html/);
});

test('sitemap includes generated public detail URLs after build', async () => {
  const sitemap = await read('public/sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/titaniumroots\.com\/treatments\/dental-implants\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/titaniumroots\.com\/blog\/what-to-expect-at-a-routine-dental-check-up\/<\/loc>/);
  assert.doesNotMatch(sitemap, /\/admin\//);
});

test('generated detail pages expose complete source metadata', async () => {
  const treatment = await read('dist/treatments/dental-implants/index.html');
  assert.match(treatment, /<title>Dental Implants in Anna Nagar, Chennai \| Titanium Roots<\/title>/);
  assert.match(treatment, /<link rel="canonical" href="https:\/\/titaniumroots\.com\/treatments\/dental-implants\/">/);
  assert.match(treatment, /<h1[^>]*>Dental Implants<\/h1>/);
  assert.match(treatment, /application\/ld\+json/);

  const article = await read('dist/blog/what-to-expect-at-a-routine-dental-check-up/index.html');
  assert.match(article, /<title>What to Expect at a Routine Dental Check-up \| Titanium Roots<\/title>/);
  assert.match(article, /Reviewed by/);
  assert.match(article, /This content is for general education/);
});
```

- [ ] **Step 2: Run route tests and verify failure**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/blueprint-routes.test.mjs
```

Expected: FAIL because generator, templates, clean links, and generated detail pages do not exist yet.

- [ ] **Step 3: Commit tests**

Run:

```powershell
git add tests/blueprint-routes.test.mjs
git commit -m "test: capture blueprint route requirements"
```

Expected: commit succeeds.

---

## Task 2: Add Shared Clean Route Helpers

**Files:**
- Create: `E:\Titanium-main\assets\js\utils\route-manifest.js`
- Test: `E:\Titanium-main\tests\blueprint-routes.test.mjs`

- [ ] **Step 1: Create route helper module**

Create `E:\Titanium-main\assets\js\utils\route-manifest.js`:

```js
export const SITE_ORIGIN = 'https://titaniumroots.com';

export const STATIC_ROUTES = Object.freeze([
  { key: 'home', route: '/', source: 'index.html' },
  { key: 'about', route: '/about/', source: 'about.html' },
  { key: 'treatments', route: '/treatments/', source: 'treatments.html' },
  { key: 'doctors', route: '/doctors/', source: 'doctors.html' },
  { key: 'testimonials', route: '/testimonials/', source: 'testimonials.html' },
  { key: 'blog', route: '/blog/', source: 'blog.html' },
  { key: 'contact', route: '/contact/', source: 'contact.html' },
  { key: 'notFound', route: '/404.html', source: '404.html', noindex: true },
]);

export function cleanRoute(path = '/') {
  const value = String(path || '/').trim();
  if (value === '/' || value === '/index.html') return '/';
  if (value.endsWith('.html')) return value.replace(/\.html$/, '/');
  return value.endsWith('/') ? value : `${value}/`;
}

export function canonicalUrl(path = '/') {
  return `${SITE_ORIGIN}${cleanRoute(path)}`;
}

export function detailRoute(collection, slug) {
  const safeSlug = String(slug || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safeSlug)) {
    throw new Error(`Invalid slug for ${collection}: ${slug}`);
  }
  return `/${collection}/${safeSlug}/`;
}
```

- [ ] **Step 2: Confirm generator uses the helper import**

When creating `E:\Titanium-main\scripts\generate-static-pages.mjs` in Task 3, place this import at the top of the file:

```js
import { canonicalUrl, cleanRoute, detailRoute, STATIC_ROUTES } from '../assets/js/utils/route-manifest.js';
```

- [ ] **Step 3: Run targeted route tests**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/blueprint-routes.test.mjs
```

Expected: Still FAIL, but no module-not-found error for route helpers after Task 3 imports them.

- [ ] **Step 4: Commit route helper**

Run:

```powershell
git add assets/js/utils/route-manifest.js tests/blueprint-routes.test.mjs
git commit -m "feat: add clean route helpers"
```

Expected: commit succeeds.

---

## Task 3: Replace SEO Fetch With Static Page Generator

**Files:**
- Create: `E:\Titanium-main\scripts\generate-static-pages.mjs`
- Modify: `E:\Titanium-main\package.json`
- Modify: `E:\Titanium-main\vite.config.js`
- Modify: `E:\Titanium-main\public\sitemap.xml`
- Test: `E:\Titanium-main\tests\blueprint-routes.test.mjs`

- [ ] **Step 1: Update package build script**

Change `E:\Titanium-main\package.json`:

```json
"build": "node scripts/generate-static-pages.mjs && vite build"
```

- [ ] **Step 2: Create generator script with safe fallbacks**

Create `E:\Titanium-main\scripts\generate-static-pages.mjs` with these responsibilities:

```js
import { createClient } from '@supabase/supabase-js';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { canonicalUrl, cleanRoute, detailRoute, STATIC_ROUTES } from '../assets/js/utils/route-manifest.js';

try {
  loadEnvFile(resolve('.env'));
} catch {
  // Hosting providers inject environment variables directly.
}

const url = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const generatedDirectory = resolve('.generated');
const seoCachePath = resolve('.cache/seo-pages.json');

const htmlEscape = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function requiredEnv() {
  if (!url || !publishableKey) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required for production generation.');
  }
}

function client() {
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchPublicData() {
  requiredEnv();
  const supabase = client();
  const [seo, treatments, doctors, blogs] = await Promise.all([
    supabase.from('seo_pages').select('*').order('route'),
    supabase.from('treatments').select('*').eq('status', 'published').order('sort_order'),
    supabase.from('doctors').select('*').eq('status', 'published').order('sort_order'),
    supabase.from('blog_posts').select('*').eq('status', 'published').lte('publish_at', new Date().toISOString()).order('publish_at', { ascending: false }),
  ]);

  for (const result of [seo, treatments, doctors, blogs]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    seo: seo.data || [],
    treatments: treatments.data || [],
    doctors: doctors.data || [],
    blogs: blogs.data || [],
  };
}

function staticSeoRecords(records) {
  return STATIC_ROUTES.map((route) => {
    const existing = records.find((item) => cleanRoute(item.route) === route.route || item.route === route.source || item.route === `/${route.source}`);
    const title = existing?.meta_title || defaultTitle(route.key);
    const description = existing?.meta_description || defaultDescription(route.key);
    return {
      route: route.route,
      source: route.source,
      meta_title: title,
      meta_description: description,
      canonical_url: canonicalUrl(route.route),
      og_title: existing?.og_title || title,
      og_description: existing?.og_description || description,
      og_image_path: existing?.og_image_path || '',
      should_index: route.noindex ? false : existing?.should_index !== false,
      should_follow: existing?.should_follow !== false,
      include_in_sitemap: !route.noindex && existing?.include_in_sitemap !== false,
    };
  });
}

function defaultTitle(key) {
  const titles = {
    home: 'Dental Clinic in Anna Nagar, Chennai | Titanium Roots',
    about: 'About Titanium Roots Dental Clinic in Anna Nagar, Chennai',
    treatments: 'Dental Treatments in Anna Nagar, Chennai | Titanium Roots',
    doctors: 'Dentists at Titanium Roots in Anna Nagar, Chennai',
    testimonials: 'Patient Experiences | Titanium Roots',
    blog: 'Dental Health Articles | Titanium Roots Knowledge Center',
    contact: 'Contact Titanium Roots in Anna Nagar, Chennai',
    notFound: 'Page Not Found | Titanium Roots',
  };
  return titles[key] || 'Titanium Roots Dental Clinic';
}

function defaultDescription(key) {
  const descriptions = {
    home: 'Modern dental care, priority treatments and appointment support at Titanium Roots in Anna Nagar, Chennai.',
    about: 'Learn about Titanium Roots, patient communication, clinical standards and a calmer dental experience.',
    treatments: 'Explore preventive, restorative, cosmetic, orthodontic, surgical and family dental care at Titanium Roots.',
    doctors: 'Meet the clinicians at Titanium Roots and review qualifications, clinical interests and languages.',
    testimonials: 'Genuine patient experiences published only after review and consent.',
    blog: 'Practical doctor-reviewed dental health guides from Titanium Roots Knowledge Center.',
    contact: 'Request an appointment, call, chat on WhatsApp, view opening hours and get directions.',
    notFound: 'The requested Titanium Roots page was not found.',
  };
  return descriptions[key] || descriptions.home;
}

function treatmentSeo(treatment) {
  const route = detailRoute('treatments', treatment.slug);
  return {
    route,
    source: `.generated/treatments/${treatment.slug}/index.html`,
    meta_title: `${treatment.name} in Anna Nagar, Chennai | Titanium Roots`,
    meta_description: treatment.seo_description || treatment.short_description || `Learn about ${treatment.name} assessment and care at Titanium Roots.`,
    canonical_url: canonicalUrl(route),
    og_title: `${treatment.name} | Titanium Roots`,
    og_description: treatment.short_description || '',
    og_image_path: treatment.image_path || '',
    should_index: true,
    should_follow: true,
    include_in_sitemap: true,
    lastmod: treatment.updated_at || treatment.created_at,
  };
}

function blogSeo(article) {
  const route = detailRoute('blog', article.slug);
  return {
    route,
    source: `.generated/blog/${article.slug}/index.html`,
    meta_title: article.seo_title || `${article.title} | Titanium Roots`,
    meta_description: article.seo_description || article.excerpt,
    canonical_url: canonicalUrl(route),
    og_title: article.seo_title || article.title,
    og_description: article.seo_description || article.excerpt,
    og_image_path: article.image_path || '',
    should_index: true,
    should_follow: true,
    include_in_sitemap: true,
    lastmod: article.updated_at || article.publish_at,
  };
}

function doctorSeo(doctor) {
  const route = detailRoute('doctors', doctor.slug);
  return {
    route,
    source: `.generated/doctors/${doctor.slug}/index.html`,
    meta_title: `${doctor.name} | Titanium Roots Dental Clinic`,
    meta_description: doctor.short_bio || doctor.biography?.slice(0, 150) || `View ${doctor.name}'s profile at Titanium Roots Dental Clinic.`,
    canonical_url: canonicalUrl(route),
    og_title: `${doctor.name} | Titanium Roots`,
    og_description: doctor.short_bio || doctor.designation || '',
    og_image_path: doctor.portrait_path || '',
    should_index: true,
    should_follow: true,
    include_in_sitemap: true,
    lastmod: doctor.updated_at || doctor.created_at,
  };
}

async function renderTemplate(templatePath, outPath, payload, metadata) {
  const template = await readFile(resolve(templatePath), 'utf8');
  const html = template
    .replaceAll('__PAGE_DATA__', htmlEscape(JSON.stringify(payload)))
    .replaceAll('__META_TITLE__', htmlEscape(metadata.meta_title))
    .replaceAll('__META_DESCRIPTION__', htmlEscape(metadata.meta_description))
    .replaceAll('__CANONICAL_URL__', htmlEscape(metadata.canonical_url))
    .replaceAll('__OG_TITLE__', htmlEscape(metadata.og_title))
    .replaceAll('__OG_DESCRIPTION__', htmlEscape(metadata.og_description))
    .replaceAll('__ROBOTS__', `${metadata.should_index ? 'index' : 'noindex'}, ${metadata.should_follow ? 'follow' : 'nofollow'}`);
  await mkdir(resolve(outPath, '..'), { recursive: true });
  await writeFile(resolve(outPath), html, 'utf8');
}

async function generateSitemap(records) {
  const urls = records
    .filter((record) => record.include_in_sitemap && record.should_index)
    .map((record) => {
      const lastmod = record.lastmod ? `\n    <lastmod>${new Date(record.lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
      return `  <url>\n    <loc>${htmlEscape(record.canonical_url)}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');
  await writeFile(resolve('public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');
}

async function copyBasePages() {
  for (const route of STATIC_ROUTES.filter((item) => item.route !== '/404.html')) {
    const target = route.route === '/' ? '.generated/index.html' : `.generated${route.route}index.html`;
    await mkdir(resolve(target, '..'), { recursive: true });
    await cp(resolve(route.source), resolve(target));
  }
  await cp(resolve('404.html'), resolve('.generated/404.html'));
}

async function main() {
  const data = await fetchPublicData();
  await mkdir(resolve('.cache'), { recursive: true });
  await mkdir(generatedDirectory, { recursive: true });
  await copyBasePages();

  const records = [
    ...staticSeoRecords(data.seo),
    ...data.treatments.map(treatmentSeo),
    ...data.doctors.map(doctorSeo),
    ...data.blogs.map(blogSeo),
  ];

  for (const treatment of data.treatments) {
    await renderTemplate('templates/treatment-detail.html', `.generated/treatments/${treatment.slug}/index.html`, treatment, treatmentSeo(treatment));
  }
  for (const doctor of data.doctors) {
    await renderTemplate('templates/doctor-profile.html', `.generated/doctors/${doctor.slug}/index.html`, doctor, doctorSeo(doctor));
  }
  for (const article of data.blogs) {
    await renderTemplate('templates/blog-article.html', `.generated/blog/${article.slug}/index.html`, article, blogSeo(article));
  }

  await generateSitemap(records);
  await writeFile(seoCachePath, JSON.stringify({ generatedAt: new Date().toISOString(), projectUrl: 'https://titaniumroots.com', records }, null, 2), 'utf8');
  console.log(`Generated ${records.length} route records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 3: Update Vite inputs to use generated pages**

In `E:\Titanium-main\vite.config.js`, set root inputs to generated pages after generator runs:

```js
function generatedPages(directory = resolve(rootDirectory, '.generated')) {
  if (!existsSync(directory)) return {};
  const entries = {};
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) walk(path);
      if (entry.isFile() && entry.name === 'index.html') {
        const key = relative(directory, path).replaceAll('\\', '/').replace(/\/index\.html$/, '').replace(/[^a-z0-9]+/gi, '_') || 'home';
        entries[`page_${key}`] = path;
      }
      if (entry.isFile() && entry.name === '404.html') entries.notFound = path;
    }
  };
  walk(directory);
  return entries;
}
```

Then replace public route inputs with:

```js
input: {
  ...generatedPages(),
  adminLogin: resolve(rootDirectory, 'admin/login.html'),
  adminResetPassword: resolve(rootDirectory, 'admin/reset-password.html'),
  adminDashboard: resolve(rootDirectory, 'admin/dashboard.html'),
  adminAppointments: resolve(rootDirectory, 'admin/appointments.html'),
  adminDoctors: resolve(rootDirectory, 'admin/doctors.html'),
  adminTreatments: resolve(rootDirectory, 'admin/treatments.html'),
  adminBlogs: resolve(rootDirectory, 'admin/blogs.html'),
  adminTestimonials: resolve(rootDirectory, 'admin/testimonials.html'),
  adminGallery: resolve(rootDirectory, 'admin/gallery.html'),
  adminSeo: resolve(rootDirectory, 'admin/seo.html'),
  adminSettings: resolve(rootDirectory, 'admin/settings.html'),
  adminAnalytics: resolve(rootDirectory, 'admin/analytics.html'),
}
```

- [ ] **Step 4: Run route tests and build**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/blueprint-routes.test.mjs
npm run build
```

Expected: route tests still fail until templates are created in Task 4; build fails if Supabase env vars are missing.

- [ ] **Step 5: Commit generator**

Run:

```powershell
git add package.json vite.config.js scripts/generate-static-pages.mjs public/sitemap.xml
git commit -m "feat: generate static blueprint routes"
```

Expected: commit succeeds.

---

## Task 4: Create Crawlable Detail Templates

**Files:**
- Create: `E:\Titanium-main\templates\treatment-detail.html`
- Create: `E:\Titanium-main\templates\blog-article.html`
- Create: `E:\Titanium-main\templates\doctor-profile.html`
- Create: `E:\Titanium-main\assets\js\pages\treatment-detail.js`
- Create: `E:\Titanium-main\assets\js\pages\blog-article.js`
- Create: `E:\Titanium-main\assets\js\pages\doctor-profile.js`
- Test: `E:\Titanium-main\tests\blueprint-routes.test.mjs`

- [ ] **Step 1: Add treatment detail template**

Create `E:\Titanium-main\templates\treatment-detail.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>__META_TITLE__</title>
  <meta name="description" content="__META_DESCRIPTION__">
  <meta name="robots" content="__ROBOTS__">
  <link rel="canonical" href="__CANONICAL_URL__">
  <meta property="og:title" content="__OG_TITLE__">
  <meta property="og:description" content="__OG_DESCRIPTION__">
  <meta property="og:type" content="article">
  <link rel="icon" href="/favicon.ico">
  <link rel="stylesheet" href="/assets/css/global.css">
  <link rel="stylesheet" href="/assets/css/pages/treatments.css">
  <script type="application/json" id="page-data">__PAGE_DATA__</script>
</head>
<body data-page="treatment-detail">
  <div data-component="page-loader"></div>
  <div data-component="navbar"></div>
  <main id="main-content">
    <article class="treatment-detail" data-treatment-detail></article>
  </main>
  <script type="application/ld+json" data-schema-json>{}</script>
  <div data-component="consultation-banner"></div>
  <div data-component="footer"></div>
  <div data-component="appointment-modal"></div>
  <div data-component="floating-contact"></div>
  <script type="module" src="/assets/js/pages/treatment-detail.js"></script>
</body>
</html>
```

- [ ] **Step 2: Add treatment detail hydration**

Create `E:\Titanium-main\assets\js\pages\treatment-detail.js`:

```js
import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { loadComponents } from '../components/component-loader.js';
import { escapeHtml } from '../data/record-mappers.js';

const safe = (value) => escapeHtml(value || '');
const lines = (value) => String(value || '').split(/\r?\n|,\s*/).map((item) => item.trim()).filter(Boolean);

function pageData() {
  const node = document.getElementById('page-data');
  return node ? JSON.parse(node.textContent || '{}') : {};
}

function schemaFor(treatment) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: treatment.name,
    description: treatment.short_description,
    isPartOf: { '@type': 'WebSite', name: 'Titanium Roots', url: 'https://titaniumroots.com/' },
    publisher: { '@type': 'Dentist', name: 'Titanium Roots Dental Clinic' },
  };
}

function renderTreatment(treatment) {
  const mount = document.querySelector('[data-treatment-detail]');
  if (!mount) return;
  mount.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>Treatments</span><strong>${safe(treatment.name)}</strong></nav>
    <header class="treatments-hero">
      <div class="container">
        <p class="section-eyebrow">${safe(treatment.category)}</p>
        <h1>${safe(treatment.name)}</h1>
        <p>${safe(treatment.full_description || treatment.short_description)}</p>
        <button class="button" type="button" data-modal-open="appointment-modal" data-treatment-interest="${safe(treatment.name)}">Book an Appointment</button>
      </div>
    </header>
    <section class="container treatment-modal__detail">
      <h2>When a consultation may be useful</h2>
      <ul>${lines(treatment.suitability).map((item) => `<li>${safe(item)}</li>`).join('')}</ul>
      <h2>Potential benefits</h2>
      <ul>${lines(treatment.benefits).map((item) => `<li>${safe(item)}</li>`).join('')}</ul>
      <h2>Typical care pathway</h2>
      <p>${safe(treatment.procedure_steps)}</p>
      <h2>Aftercare and limitations</h2>
      <p>${safe(treatment.recovery)}</p>
      <p class="treatment-modal__disclaimer">Treatment suitability, duration, limitations and pricing are confirmed after clinical consultation.</p>
    </section>
  `;
  document.querySelector('[data-schema-json]').textContent = JSON.stringify(schemaFor(treatment));
  createIcons({ icons: ICON_SET });
}

await loadComponents();
renderTreatment(pageData());
document.querySelector('.page-loader')?.classList.add('is-hidden');
```

- [ ] **Step 3: Add blog article template and hydration**

Create `E:\Titanium-main\templates\blog-article.html` using the same metadata placeholders as treatment template and set:

```html
<body data-page="blog-article">
  <div data-component="page-loader"></div>
  <div data-component="navbar"></div>
  <main id="main-content">
    <article class="article-page" data-blog-article></article>
  </main>
  <script type="application/json" id="page-data">__PAGE_DATA__</script>
  <script type="application/ld+json" data-schema-json>{}</script>
  <div data-component="consultation-banner"></div>
  <div data-component="footer"></div>
  <script type="module" src="/assets/js/pages/blog-article.js"></script>
</body>
```

Create `E:\Titanium-main\assets\js\pages\blog-article.js`:

```js
import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { loadComponents } from '../components/component-loader.js';
import { escapeHtml, sanitizeCmsHtml } from '../data/record-mappers.js';

const safe = (value) => escapeHtml(value || '');

function pageData() {
  return JSON.parse(document.getElementById('page-data')?.textContent || '{}');
}

function readTime(content) {
  const words = String(content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function schemaFor(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    author: { '@type': 'Organization', name: article.author_name || 'Titanium Roots Clinical Team' },
    datePublished: article.publish_at,
    dateModified: article.updated_at || article.publish_at,
    publisher: { '@type': 'Dentist', name: 'Titanium Roots Dental Clinic' },
  };
}

function renderArticle(article) {
  const mount = document.querySelector('[data-blog-article]');
  mount.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><a href="/blog/">Knowledge Center</a><strong>${safe(article.title)}</strong></nav>
    <header class="blog-hero">
      <div class="container">
        <p class="section-eyebrow">${safe(article.category)}</p>
        <h1>${safe(article.title)}</h1>
        <p>${safe(article.excerpt)}</p>
        <div class="blog-card__meta">
          <span>${safe(article.author_name || 'Titanium Roots Clinical Team')}</span>
          <span>Reviewed by ${safe(article.reviewer_name || 'Titanium Roots Clinical Team')}</span>
          <span>${readTime(article.content_html)}</span>
        </div>
      </div>
    </header>
    <section class="container article-modal__content">${sanitizeCmsHtml(article.content_html)}</section>
    <footer class="container article-modal__disclaimer">This content is for general education and does not replace a clinical dental consultation.</footer>
  `;
  document.querySelector('[data-schema-json]').textContent = JSON.stringify(schemaFor(article));
  createIcons({ icons: ICON_SET });
}

await loadComponents();
renderArticle(pageData());
document.querySelector('.page-loader')?.classList.add('is-hidden');
```

- [ ] **Step 4: Add doctor profile template and hydration**

Create `E:\Titanium-main\templates\doctor-profile.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>__META_TITLE__</title>
  <meta name="description" content="__META_DESCRIPTION__">
  <meta name="robots" content="__ROBOTS__">
  <link rel="canonical" href="__CANONICAL_URL__">
  <meta property="og:title" content="__OG_TITLE__">
  <meta property="og:description" content="__OG_DESCRIPTION__">
  <meta property="og:type" content="profile">
  <link rel="icon" href="/favicon.ico">
  <link rel="stylesheet" href="/assets/css/global.css">
  <link rel="stylesheet" href="/assets/css/pages/doctors.css">
  <script type="application/json" id="page-data">__PAGE_DATA__</script>
</head>
<body data-page="doctor-profile">
  <div data-component="page-loader"></div>
  <div data-component="navbar"></div>
  <main id="main-content">
    <article class="doctor-profile-page" data-doctor-profile></article>
  </main>
  <script type="application/ld+json" data-schema-json>{}</script>
  <div data-component="consultation-banner"></div>
  <div data-component="footer"></div>
  <div data-component="appointment-modal"></div>
  <div data-component="floating-contact"></div>
  <script type="module" src="/assets/js/pages/doctor-profile.js"></script>
</body>
</html>
```

Create `E:\Titanium-main\assets\js\pages\doctor-profile.js`:

```js
import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { loadComponents } from '../components/component-loader.js';
import { escapeHtml } from '../data/record-mappers.js';

const safe = (value) => escapeHtml(value || '');
const list = (value) => Array.isArray(value) ? value : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

function pageData() {
  return JSON.parse(document.getElementById('page-data')?.textContent || '{}');
}

function schemaFor(doctor) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: doctor.name,
    jobTitle: doctor.designation,
    worksFor: { '@type': 'Dentist', name: 'Titanium Roots Dental Clinic' },
    knowsLanguage: list(doctor.languages),
  };
}

function renderDoctor(doctor) {
  const mount = document.querySelector('[data-doctor-profile]');
  mount.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><a href="/doctors/">Doctors</a><strong>${safe(doctor.name)}</strong></nav>
    <header class="doctors-hero">
      <div class="container doctors-hero__grid">
        <div>
          <p class="section-eyebrow">${safe(doctor.designation)}</p>
          <h1>${safe(doctor.name)}</h1>
          <p>${safe(doctor.short_bio || doctor.biography)}</p>
          <button class="button" type="button" data-modal-open="appointment-modal" data-doctor-selection="${safe(doctor.name)}">Book an Appointment</button>
        </div>
      </div>
    </header>
    <section class="container doctor-profile__details">
      <h2>Qualifications and registration</h2>
      <dl>
        <div><dt>Qualification</dt><dd>${safe(doctor.qualification)}</dd></div>
        <div><dt>Registration</dt><dd>${safe(doctor.registration_number || 'Available after verification')}</dd></div>
        <div><dt>Clinical focus</dt><dd>${safe(doctor.specialization)}</dd></div>
        <div><dt>Languages</dt><dd>${list(doctor.languages).map(safe).join(', ')}</dd></div>
      </dl>
      <h2>Approach to care</h2>
      <p>${safe(doctor.philosophy || doctor.biography)}</p>
      <h2>Consultation information</h2>
      <p>${safe(doctor.consultation || 'Consultation availability is confirmed during appointment booking.')}</p>
    </section>
  `;
  document.querySelector('[data-schema-json]').textContent = JSON.stringify(schemaFor(doctor));
  createIcons({ icons: ICON_SET });
}

await loadComponents();
renderDoctor(pageData());
document.querySelector('.page-loader')?.classList.add('is-hidden');
```

- [ ] **Step 5: Run route tests**

Run:

```powershell
npm run build
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/blueprint-routes.test.mjs
```

Expected: PASS for template existence and metadata once Supabase contains matching published records.

- [ ] **Step 6: Commit templates**

Run:

```powershell
git add templates assets/js/pages/treatment-detail.js assets/js/pages/blog-article.js assets/js/pages/doctor-profile.js tests/blueprint-routes.test.mjs
git commit -m "feat: add crawlable detail page templates"
```

Expected: commit succeeds.

---

## Task 5: Add Blueprint Schema Migration

**Files:**
- Create: `E:\Titanium-main\supabase\migrations\20260803000100_blueprint_alignment_schema.sql`
- Create: `E:\Titanium-main\tests\blueprint-schema.test.mjs`

- [ ] **Step 1: Write schema tests**

Create `E:\Titanium-main\tests\blueprint-schema.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const migrationDir = new URL('../supabase/migrations/', import.meta.url);

async function latestBlueprintMigration() {
  const files = await readdir(migrationDir);
  const file = files.find((name) => name.endsWith('_blueprint_alignment_schema.sql'));
  assert.ok(file, 'blueprint schema migration is required');
  return readFile(new URL(file, migrationDir), 'utf8');
}

test('blueprint schema adds required content relations and workflow statuses', async () => {
  const sql = await latestBlueprintMigration();
  for (const table of [
    'admin_profiles',
    'specialties',
    'treatment_faqs',
    'treatment_doctors',
    'blog_categories',
    'blog_faqs',
    'blog_treatments',
    'media_assets',
    'gallery_collections',
    'gallery_collection_items',
    'page_sections',
    'redirects',
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(sql, /status in \('draft', 'review', 'scheduled', 'published', 'archived'\)/);
  assert.match(sql, /reviewer_doctor_id uuid references public\.doctors/);
  assert.match(sql, /medical_reviewed_at timestamptz/);
  assert.match(sql, /cloudinary_public_id text/);
});

test('appointment records remain insert-only for anonymous users', async () => {
  const base = await readFile(new URL('../supabase/migrations/20260730213431_titanium_cms.sql', import.meta.url), 'utf8');
  const sql = await latestBlueprintMigration();
  assert.match(base + sql, /grant insert on public\.appointment_requests to anon/);
  assert.doesNotMatch(base + sql, /grant select on public\.appointment_requests to anon/);
});
```

- [ ] **Step 2: Run schema tests and verify failure**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/blueprint-schema.test.mjs
```

Expected: FAIL because migration does not exist.

- [ ] **Step 3: Create additive migration**

Create `E:\Titanium-main\supabase\migrations\20260803000100_blueprint_alignment_schema.sql` with:

```sql
begin;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'editor' check (role in ('owner', 'editor', 'reviewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.admin_profiles (user_id, display_name, role, is_active)
select user_id, display_name, 'owner', is_active
from public.cms_admins
on conflict (user_id) do update set
  display_name = excluded.display_name,
  is_active = excluded.is_active;

create table if not exists public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.doctors
  add column if not exists verification_status text not null default 'draft'
    check (verification_status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  add column if not exists short_bio text not null default '',
  add column if not exists profile_reviewed_at timestamptz;

alter table public.treatments
  add column if not exists concern_triggers text[] not null default '{}',
  add column if not exists limitations text not null default '',
  add column if not exists aftercare text not null default '',
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists reviewer_doctor_id uuid references public.doctors(id) on delete set null,
  add column if not exists medical_reviewed_at timestamptz,
  add column if not exists noindex boolean not null default false;

alter table public.blog_posts
  add column if not exists deck text not null default '',
  add column if not exists reviewer_doctor_id uuid references public.doctors(id) on delete set null,
  add column if not exists key_takeaways jsonb not null default '[]'::jsonb,
  add column if not exists medical_reviewed_at timestamptz,
  add column if not exists noindex boolean not null default false;

alter table public.doctors drop constraint if exists doctors_status_check;
alter table public.doctors add constraint doctors_status_check
  check (status in ('draft', 'review', 'scheduled', 'published', 'archived'));

alter table public.treatments drop constraint if exists treatments_status_check;
alter table public.treatments add constraint treatments_status_check
  check (status in ('draft', 'review', 'scheduled', 'published', 'archived'));

alter table public.blog_posts drop constraint if exists blog_posts_status_check;
alter table public.blog_posts add constraint blog_posts_status_check
  check (status in ('draft', 'review', 'scheduled', 'published', 'archived'));

alter table public.gallery_items drop constraint if exists gallery_items_status_check;
alter table public.gallery_items add constraint gallery_items_status_check
  check (status in ('draft', 'review', 'scheduled', 'published', 'archived'));

create table if not exists public.treatment_faqs (
  id uuid primary key default gen_random_uuid(),
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.treatment_doctors (
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  relationship_label text not null default 'Provides assessment',
  primary key (treatment_id, doctor_id)
);

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_faqs (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references public.blog_posts(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_treatments (
  blog_id uuid not null references public.blog_posts(id) on delete cascade,
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  primary key (blog_id, treatment_id)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  cloudinary_public_id text not null unique,
  secure_url text not null,
  resource_type text not null default 'image' check (resource_type in ('image', 'video', 'raw')),
  format text not null default '',
  width integer,
  height integer,
  bytes integer,
  folder text not null default 'titanium-roots/gallery',
  title text not null,
  alt_text text not null,
  caption text not null default '',
  tags text[] not null default '{}',
  focal_x numeric(5,4) not null default 0.5,
  focal_y numeric(5,4) not null default 0.5,
  is_gallery_item boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_collection_items (
  collection_id uuid not null references public.gallery_collections(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  sort_order integer not null default 1,
  primary key (collection_id, media_asset_id)
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  section_key text not null,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  updated_at timestamptz not null default now(),
  unique(route, section_key)
);

create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique check (from_path like '/%'),
  to_path text not null check (to_path like '/%'),
  status_code integer not null default 301 check (status_code in (301, 302, 308)),
  reason text not null default '',
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;
alter table public.specialties enable row level security;
alter table public.treatment_faqs enable row level security;
alter table public.treatment_doctors enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_faqs enable row level security;
alter table public.blog_treatments enable row level security;
alter table public.media_assets enable row level security;
alter table public.gallery_collections enable row level security;
alter table public.gallery_collection_items enable row level security;
alter table public.page_sections enable row level security;
alter table public.redirects enable row level security;

drop policy if exists treatment_faqs_public_read on public.treatment_faqs;
create policy treatment_faqs_public_read on public.treatment_faqs
for select to anon, authenticated using (status = 'published');
drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_public_read on public.media_assets
for select to anon, authenticated using (status = 'active');
drop policy if exists redirects_public_read on public.redirects;
create policy redirects_public_read on public.redirects
for select to anon, authenticated using (true);

drop policy if exists blueprint_admin_profiles_admin on public.admin_profiles;
create policy blueprint_admin_profiles_admin on public.admin_profiles
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_specialties_admin on public.specialties;
create policy blueprint_specialties_admin on public.specialties
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_treatment_faqs_admin on public.treatment_faqs;
create policy blueprint_treatment_faqs_admin on public.treatment_faqs
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_treatment_doctors_admin on public.treatment_doctors;
create policy blueprint_treatment_doctors_admin on public.treatment_doctors
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_blog_categories_admin on public.blog_categories;
create policy blueprint_blog_categories_admin on public.blog_categories
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_blog_faqs_admin on public.blog_faqs;
create policy blueprint_blog_faqs_admin on public.blog_faqs
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_blog_treatments_admin on public.blog_treatments;
create policy blueprint_blog_treatments_admin on public.blog_treatments
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_media_assets_admin on public.media_assets;
create policy blueprint_media_assets_admin on public.media_assets
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_gallery_collections_admin on public.gallery_collections;
create policy blueprint_gallery_collections_admin on public.gallery_collections
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_gallery_collection_items_admin on public.gallery_collection_items;
create policy blueprint_gallery_collection_items_admin on public.gallery_collection_items
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_page_sections_admin on public.page_sections;
create policy blueprint_page_sections_admin on public.page_sections
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_redirects_admin on public.redirects;
create policy blueprint_redirects_admin on public.redirects
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());

commit;
```

- [ ] **Step 4: Run schema tests**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/blueprint-schema.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit schema migration**

Run:

```powershell
git add supabase/migrations/20260803000100_blueprint_alignment_schema.sql tests/blueprint-schema.test.mjs
git commit -m "feat: add blueprint schema extensions"
```

Expected: commit succeeds.

---

## Task 6: Seed Complete Blueprint Treatment and Article Content

**Files:**
- Modify: `E:\Titanium-main\supabase\migrations\20260801120305_production_cms_content.sql`
- Test: `E:\Titanium-main\tests\blueprint-content-safety.test.mjs`

- [ ] **Step 1: Create content safety tests**

Create `E:\Titanium-main\tests\blueprint-content-safety.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('production content includes all blueprint treatment packs', async () => {
  const sql = await read('supabase/migrations/20260801120305_production_cms_content.sql');
  for (const slug of [
    'dental-implants',
    'root-canal-treatment',
    'clear-aligners',
    'braces-orthodontics',
    'smile-makeover',
    'professional-teeth-whitening',
    'dental-veneers',
    'crowns-bridges',
    'gum-care-periodontics',
    'wisdom-tooth-assessment-removal',
    'pediatric-dentistry',
    'preventive-general-dentistry',
  ]) {
    assert.match(sql, new RegExp(`'${slug}'`));
  }
});

test('launch copy avoids fake proof and unsafe guarantees', async () => {
  const files = [
    await read('index.html'),
    await read('assets/js/pages/home.js'),
    await read('testimonials.html'),
    await read('assets/js/pages/testimonials.js'),
    await read('treatments.html'),
  ].join('\n');
  assert.doesNotMatch(files, /5000\+|15\+|smiles transformed|happy patients|Dr\. Priya Mehta/i);
  assert.doesNotMatch(files, /guaranteed|painless|best dental|permanent solution/i);
  assert.match(files, /Your experience matters/i);
});
```

- [ ] **Step 2: Run content tests and verify failure**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/blueprint-content-safety.test.mjs
```

Expected: FAIL because seeded treatments and current copy are incomplete.

- [ ] **Step 3: Replace treatment seed rows with 12 blueprint packs**

In `E:\Titanium-main\supabase\migrations\20260801120305_production_cms_content.sql`, seed exactly these slugs and names:

```sql
('Dental Implants', 'dental-implants', ...)
('Root Canal Treatment', 'root-canal-treatment', ...)
('Clear Aligners', 'clear-aligners', ...)
('Braces & Orthodontics', 'braces-orthodontics', ...)
('Smile Makeover', 'smile-makeover', ...)
('Professional Teeth Whitening', 'professional-teeth-whitening', ...)
('Dental Veneers', 'dental-veneers', ...)
('Crowns & Bridges', 'crowns-bridges', ...)
('Gum Care & Periodontics', 'gum-care-periodontics', ...)
('Wisdom Tooth Assessment & Removal', 'wisdom-tooth-assessment-removal', ...)
('Pediatric Dentistry', 'pediatric-dentistry', ...)
('Preventive & General Dentistry', 'preventive-general-dentistry', ...)
```

For each row, populate:

```sql
short_description,
full_description,
benefits,
suitability,
procedure_steps,
recovery,
seo_title,
seo_description,
status = 'published'
```

Use the treatment copy from the blueprint. Keep every description consultation-led and avoid fixed outcomes.

- [ ] **Step 4: Add starter editorial calendar rows**

Seed these article slugs from the blueprint calendar:

```sql
'why-does-my-tooth-hurt'
'dental-implants-suitability-planning'
'dental-implant-recovery-guide'
'root-canal-vs-extraction'
'clear-aligners-vs-braces'
'teeth-whitening-sensitive-teeth'
'veneers-bonding-whitening'
'why-do-gums-bleed'
'child-first-dental-visit'
'wisdom-tooth-pain'
'how-often-dental-check-up'
'prepare-first-appointment'
```

Every seeded article must use:

```sql
author_name = 'Titanium Roots Clinical Team',
status = 'published',
seo_title is not empty,
seo_description is not empty
```

- [ ] **Step 5: Run content safety tests**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/blueprint-content-safety.test.mjs
```

Expected: treatment pack test PASS; launch-copy test still fails until Task 9.

- [ ] **Step 6: Commit content seeds**

Run:

```powershell
git add supabase/migrations/20260801120305_production_cms_content.sql tests/blueprint-content-safety.test.mjs
git commit -m "feat: seed blueprint treatment and article content"
```

Expected: commit succeeds.

---

## Task 7: Update Public Repositories and Mappers

**Files:**
- Modify: `E:\Titanium-main\assets\js\data\record-mappers.js`
- Modify: `E:\Titanium-main\assets\js\data\public-content-repository.js`
- Test: `E:\Titanium-main\tests\supabase-data.test.mjs`
- Test: `E:\Titanium-main\tests\public-cms-integration.test.mjs`

- [ ] **Step 1: Extend treatment mapper**

In `mapTreatmentFromDatabase`, add:

```js
concernTriggers: row.concern_triggers || [],
limitations: row.limitations || '',
aftercare: row.aftercare || row.recovery || '',
seoTitle: row.seo_title || '',
seoDescription: row.seo_description || '',
reviewerDoctorId: row.reviewer_doctor_id,
medicalReviewedAt: row.medical_reviewed_at,
noindex: row.noindex,
```

- [ ] **Step 2: Extend blog mapper**

In `mapBlogFromDatabase`, add:

```js
deck: row.deck || row.excerpt,
reviewerDoctorId: row.reviewer_doctor_id,
reviewerName: row.reviewer_name || 'Titanium Roots Clinical Team',
keyTakeaways: Array.isArray(row.key_takeaways) ? row.key_takeaways : [],
medicalReviewedAt: row.medical_reviewed_at,
noindex: row.noindex,
```

- [ ] **Step 3: Fix testimonial mapper**

Replace:

```js
publicationPermission: row.publication_permission,
```

with:

```js
publicationPermission: row.status === 'published' && row.moderation_status === 'approved' && row.consent_status === 'confirmed',
```

- [ ] **Step 4: Fetch blueprint relation fields after Task 5 migration**

After `20260803000100_blueprint_alignment_schema.sql` is applied, replace the `blogs` query in `public-content-repository.js` with:

```js
blogs: () => client
  .from('blog_posts')
  .select('*, reviewer:reviewer_doctor_id(name, qualification), blog_faqs(*), blog_treatments(treatment_id)')
  .eq('status', 'published')
  .lte('publish_at', new Date().toISOString())
  .order('publish_at', { ascending: false }),
```

Replace the `treatments` query with:

```js
treatments: () => client
  .from('treatments')
  .select('*, treatment_faqs(*), treatment_doctors(doctor_id)')
  .eq('status', 'published')
  .order('sort_order'),
```

- [ ] **Step 5: Run mapper tests**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/supabase-data.test.mjs tests/public-cms-integration.test.mjs
```

Expected: PASS after any assertions are updated to include new fields.

- [ ] **Step 6: Commit mapper updates**

Run:

```powershell
git add assets/js/data/record-mappers.js assets/js/data/public-content-repository.js tests/supabase-data.test.mjs tests/public-cms-integration.test.mjs
git commit -m "feat: map blueprint content fields"
```

Expected: commit succeeds.

---

## Task 8: Convert Blog and Treatment Listings to Real Links

**Files:**
- Modify: `E:\Titanium-main\assets\js\pages\blog.js`
- Modify: `E:\Titanium-main\assets\js\pages\treatments.js`
- Test: `E:\Titanium-main\tests\blueprint-routes.test.mjs`

- [ ] **Step 1: Change blog article cards to anchors**

Replace the button in `articleCard(article)` with:

```js
`<a class="text-link" href="/blog/${safe(article.slug)}/" data-article-open="${safe(article.id)}">Read Article <i data-lucide="arrow-right" aria-hidden="true"></i></a>`
```

- [ ] **Step 2: Keep overlay as enhancement only**

In click handling, change the article trigger logic:

```js
const trigger = event.target.closest('[data-article-open]');
if (trigger && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
  const article = articles.find((item) => String(item.id) === trigger.dataset.articleOpen);
  if (article) {
    event.preventDefault();
    window.history.pushState(null, '', trigger.getAttribute('href'));
    renderArticleModal(article);
    openModal(document.querySelector('#article-detail-modal'), trigger);
  }
}
```

- [ ] **Step 3: Change treatment card links to clean URLs**

In `renderTreatments`, replace:

```js
href="/treatments/${safe(treatment.slug)}.html"
```

with:

```js
href="/treatments/${safe(treatment.slug)}/"
```

- [ ] **Step 4: Remove treatment direct-path modal interception**

Delete `initializeHistoryNavigation()` and its call. Keep catalogue interactions and FAQ toggles.

- [ ] **Step 5: Run route tests**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/blueprint-routes.test.mjs
```

Expected: route link tests PASS.

- [ ] **Step 6: Commit link changes**

Run:

```powershell
git add assets/js/pages/blog.js assets/js/pages/treatments.js tests/blueprint-routes.test.mjs
git commit -m "feat: make public cards crawlable links"
```

Expected: commit succeeds.

---

## Task 9: Clean Launch Copy and Unsafe Proof

**Files:**
- Modify: `E:\Titanium-main\index.html`
- Modify: `E:\Titanium-main\assets\js\pages\home.js`
- Modify: `E:\Titanium-main\testimonials.html`
- Modify: `E:\Titanium-main\assets\js\pages\testimonials.js`
- Modify: `E:\Titanium-main\treatments.html`
- Test: `E:\Titanium-main\tests\blueprint-content-safety.test.mjs`
- Test: `E:\Titanium-main\tests\production-readiness.test.mjs`

- [ ] **Step 1: Remove fake homepage metrics**

In `home.js`, replace:

```js
const statistics = [
  { value: '5000+', label: 'Happy Patients', icon: 'heart-handshake' },
  { value: '15+', label: 'Expert Doctors', icon: 'users-round' },
];
```

with:

```js
const statistics = [
  { value: 'Care', label: 'Planned after assessment', icon: 'heart-handshake' },
  { value: 'Clarity', label: 'Options explained before treatment', icon: 'message-circle' },
];
```

- [ ] **Step 2: Replace homepage hero copy**

In `index.html`, replace the hero H1/copy with:

```html
<p class="home-hero__badge" data-hero-badge><i data-lucide="sparkles" aria-hidden="true"></i>Modern Dentistry • Personalised Care • Chennai</p>
<h1 id="home-hero-title" data-hero-heading>Modern Dental Care,<br><span>Planned Around You</span></h1>
<p class="home-hero__description" data-hero-copy>Titanium Roots is a modern dental clinic in Chennai offering preventive, restorative, cosmetic and family dentistry through personalised treatment planning, digital diagnosis and a comfort-focused approach.</p>
```

- [ ] **Step 3: Replace story metric block**

In `index.html`, replace the `story-collage__stat` text with:

```html
<strong>Patient-first</strong><span>Clear guidance before care</span>
```

- [ ] **Step 4: Fix testimonial empty state**

In `assets/js/pages/testimonials.js`, compute approved content and set:

```js
if (empty) empty.hidden = loadFailed || testimonials.length !== 0;
if (error) error.hidden = !loadFailed;
```

Remove:

```js
item.publicationPermission === true
```

from filtering if `publicationPermission` is already derived by the mapper.

- [ ] **Step 5: Remove hardcoded doctor fallback**

Replace:

```js
<span>Treated by ${featured.doctorName || 'Dr. Priya Mehta'}</span>
```

with:

```js
${featured.doctorName ? `<span>Treated by ${safe(featured.doctorName)}</span>` : '<span>Shared with patient consent</span>'}
```

- [ ] **Step 6: Remove public before/after launch section**

In `treatments.html`, remove or hide the `treatments-transformations` section until a consented transformation schema exists. Keep this copy elsewhere on the page:

```html
<p class="treatments-consent-note">Patient imagery is published only with written approval and accurate context.</p>
```

- [ ] **Step 7: Run content and readiness tests**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/blueprint-content-safety.test.mjs tests/production-readiness.test.mjs
```

Expected: PASS for fake proof, no fabricated doctor fallback, and testimonial empty state.

- [ ] **Step 8: Commit copy cleanup**

Run:

```powershell
git add index.html assets/js/pages/home.js testimonials.html assets/js/pages/testimonials.js treatments.html tests/blueprint-content-safety.test.mjs tests/production-readiness.test.mjs
git commit -m "fix: align launch copy with blueprint safety rules"
```

Expected: commit succeeds.

---

## Task 10: Simplify Contact and Appointment Capture

**Files:**
- Modify: `E:\Titanium-main\contact.html`
- Modify: `E:\Titanium-main\components\appointment-modal.html`
- Modify: `E:\Titanium-main\assets\js\pages\contact.js`
- Modify: `E:\Titanium-main\assets\js\data\record-mappers.js`
- Test: `E:\Titanium-main\tests\contact-page.test.mjs`
- Test: `E:\Titanium-main\tests\public-submissions.test.mjs`

- [ ] **Step 1: Keep required public appointment fields**

Ensure public appointment form fields match:

```html
<input name="patientName" autocomplete="name" minlength="2" maxlength="80" required>
<input name="mobile" type="tel" autocomplete="tel" required>
<input name="email" type="email" autocomplete="email">
<input name="preferredDate" type="date" required>
<select name="timeSlot">
<select name="reason" required>
<textarea name="message" maxlength="500"></textarea>
<input name="consent" type="checkbox" required>
```

- [ ] **Step 2: Remove emergency and feedback data collection from appointment modal**

In `components/appointment-modal.html`, keep only appointment, general question, and treatment information tabs. Replace emergency tab with a static urgent-care notice:

```html
<section class="urgent-notice">
  <h3>Urgent concerns</h3>
  <p>For severe facial swelling, difficulty breathing or swallowing, uncontrolled bleeding, major facial trauma or another medical emergency, seek urgent medical care.</p>
</section>
```

- [ ] **Step 3: Enforce 500 character public message**

In `normalizeAppointmentPayload`, replace:

```js
message: text(record.message).slice(0, 2000),
```

with:

```js
message: text(record.message).slice(0, 500),
```

- [ ] **Step 4: Fix contact details formatting**

In `contact.html` and `constants.js`, use:

```txt
123, Dental Care Street, Anna Nagar, Chennai, Tamil Nadu – 600001
+91 98765 43210
+91 44 2345 6789
info@titaniumroots.com
appointments@titaniumroots.com
```

- [ ] **Step 5: Run contact tests**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/contact-page.test.mjs tests/public-submissions.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit contact changes**

Run:

```powershell
git add contact.html components/appointment-modal.html assets/js/pages/contact.js assets/js/data/record-mappers.js tests/contact-page.test.mjs tests/public-submissions.test.mjs
git commit -m "fix: simplify appointment capture"
```

Expected: commit succeeds.

---

## Task 11: Upgrade Admin CMS Workflow

**Files:**
- Modify: `E:\Titanium-main\assets\js\admin\admin-app.js`
- Modify: `E:\Titanium-main\assets\js\admin\admin-store.js`
- Modify: `E:\Titanium-main\assets\js\data\record-mappers.js`
- Test: `E:\Titanium-main\tests\admin-cms.test.mjs`
- Test: `E:\Titanium-main\tests\admin-production.test.mjs`

- [ ] **Step 1: Update status options**

Replace:

```js
const statusOptions = ['Draft', 'Published', 'Unpublished'];
```

with:

```js
const statusOptions = ['Draft', 'Review', 'Scheduled', 'Published', 'Archived'];
```

- [ ] **Step 2: Add treatment editor fields**

In treatment fields add:

```js
field('concernTriggers', 'Consultation triggers', { type: 'textarea', full: true }),
field('limitations', 'Risks and limitations', { type: 'textarea', full: true }),
field('aftercare', 'Aftercare', { type: 'textarea', full: true }),
field('reviewerDoctorId', 'Clinical reviewer'),
field('medicalReviewedAt', 'Clinical review date', { type: 'date' }),
field('seoTitle', 'SEO title', { maxLength: 60 }),
field('seoDescription', 'SEO description', { type: 'textarea', full: true, maxLength: 160 }),
field('noindex', 'Noindex', { type: 'checkbox', switchLabel: 'Exclude from search' }),
```

- [ ] **Step 3: Add blog editor fields**

In blog fields add:

```js
field('deck', 'Article deck', { type: 'textarea', full: true }),
field('reviewerDoctorId', 'Clinical reviewer'),
field('medicalReviewedAt', 'Clinical review date', { type: 'date' }),
field('keyTakeaways', 'Key takeaways', { type: 'textarea', full: true }),
field('noindex', 'Noindex', { type: 'checkbox', switchLabel: 'Exclude from search' }),
```

- [ ] **Step 4: Add SEO audit dashboard warnings**

In `renderDashboard`, add counts for:

```js
const seoWarnings = [
  ...data.treatments.filter((item) => item.status === 'Published' && (!item.seoTitle || !item.seoDescription || !item.medicalReviewedAt)),
  ...data.blogs.filter((item) => item.status === 'Published' && (!item.seoTitle || !item.seoDescription || !item.medicalReviewedAt)),
];
```

Render a metric card:

```js
['SEO and review warnings', seoWarnings.length, 'triangle-alert', 'Published content checks'],
```

- [ ] **Step 5: Run admin tests**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/admin-cms.test.mjs tests/admin-production.test.mjs
```

Expected: PASS after assertions include new workflow states.

- [ ] **Step 6: Commit admin workflow**

Run:

```powershell
git add assets/js/admin/admin-app.js assets/js/admin/admin-store.js assets/js/data/record-mappers.js tests/admin-cms.test.mjs tests/admin-production.test.mjs
git commit -m "feat: add blueprint CMS workflow fields"
```

Expected: commit succeeds.

---

## Task 12: Fix SEO Metadata, 404, Robots, and Footer

**Files:**
- Modify: `E:\Titanium-main\404.html`
- Modify: `E:\Titanium-main\components\navbar.html`
- Modify: `E:\Titanium-main\components\footer.html`
- Modify: `E:\Titanium-main\public\robots.txt`
- Test: `E:\Titanium-main\tests\seo-build.test.mjs`
- Test: `E:\Titanium-main\tests\blueprint-routes.test.mjs`

- [ ] **Step 1: Update navbar label**

In `components/navbar.html`, change visible label:

```html
<a href="/blog/" data-nav-page="blog">Knowledge Center</a>
```

- [ ] **Step 2: Add footer medical disclaimer**

In `components/footer.html`, add:

```html
<p class="footer-disclaimer">Information on this website is for general education and appointment planning. It does not replace a personal dental consultation or diagnosis.</p>
```

- [ ] **Step 3: Replace 404 page**

Use this content in `404.html`:

```html
<meta name="robots" content="noindex, follow">
<title>Page Not Found | Titanium Roots</title>
<main id="main-content">
  <section class="page-placeholder">
    <p class="section-eyebrow">404</p>
    <h1>This Page Took a Wrong Turn.</h1>
    <p>The page may have moved or no longer exists. Return home, explore treatments, visit the Knowledge Center or contact Titanium Roots.</p>
    <a class="button" href="/">Return Home</a>
    <a class="button button--secondary" href="/contact/">Contact Titanium Roots</a>
  </section>
</main>
```

- [ ] **Step 4: Confirm robots**

Keep `public/robots.txt`:

```txt
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://titaniumroots.com/sitemap.xml
```

- [ ] **Step 5: Run SEO tests**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/seo-build.test.mjs tests/blueprint-routes.test.mjs
```

Expected: PASS after generator is active and templates exist.

- [ ] **Step 6: Commit SEO shell updates**

Run:

```powershell
git add 404.html components/navbar.html components/footer.html public/robots.txt tests/seo-build.test.mjs tests/blueprint-routes.test.mjs
git commit -m "fix: align SEO shell and recovery pages"
```

Expected: commit succeeds.

---

## Task 13: Accessibility and Performance Verification

**Files:**
- Modify: `E:\Titanium-main\assets\css\global.css`
- Modify: `E:\Titanium-main\assets\css\components.css`
- Modify: `E:\Titanium-main\assets\css\pages\blog.css`
- Modify: `E:\Titanium-main\assets\css\pages\treatments.css`
- Modify: `E:\Titanium-main\assets\js\components\modal.js`
- Test: `E:\Titanium-main\tests\production-readiness.test.mjs`

- [ ] **Step 1: Add focus checks to production readiness tests**

Add assertions:

```js
test('interactive elements have visible focus styles and reduced motion support', async () => {
  const css = [
    await read('assets/css/global.css'),
    await read('assets/css/components.css'),
    await read('assets/css/pages/blog.css'),
    await read('assets/css/pages/treatments.css'),
  ].join('\n');
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
```

- [ ] **Step 2: Ensure modal restores focus**

In `modal.js`, confirm close logic includes:

```js
const opener = modal.__opener;
if (opener && typeof opener.focus === 'function') opener.focus();
```

- [ ] **Step 3: Disable heavy motion for reduced motion**

In global CSS or animation CSS, add:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Run production readiness tests**

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/production-readiness.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit accessibility/performance checks**

Run:

```powershell
git add assets/css/global.css assets/css/components.css assets/css/pages/blog.css assets/css/pages/treatments.css assets/js/components/modal.js tests/production-readiness.test.mjs
git commit -m "fix: verify accessibility and motion behavior"
```

Expected: commit succeeds.

---

## Task 14: Update Documentation and Release Checklist

**Files:**
- Create: `E:\Titanium-main\docs\blueprint-alignment.md`
- Modify: `E:\Titanium-main\README.md`
- Modify: `E:\Titanium-main\docs\deployment.md`

- [ ] **Step 1: Create blueprint alignment documentation**

Create `E:\Titanium-main\docs\blueprint-alignment.md`:

```md
# Blueprint Alignment

Titanium Roots uses generated static HTML for every indexable public route. Treatment, doctor, and Knowledge Center detail pages are generated before Vite builds the final site.

## Public Route Rules

- Top-level public pages use clean canonical URLs.
- Treatment pages use `/treatments/{slug}/`.
- Article pages use `/blog/{slug}/`.
- Doctor profile pages use `/doctors/{slug}/`.
- Every indexable page has one H1, title, description, canonical, and structured data.
- Draft, review, archived, and preview content is noindex and excluded from the sitemap.

## Content Safety Rules

- No fabricated testimonials, patient names, doctor credentials, statistics, or transformation imagery.
- No guaranteed outcomes, universal suitability, painless claims, or fixed recovery promises.
- Clinical pages require reviewer and review date before publication.
- Public appointment forms collect only the minimum information needed to respond.

## Launch Verification

- Confirm name, address, phone, WhatsApp, email, and hours.
- Confirm doctor credentials and registration numbers.
- Confirm treatments are actually offered.
- Confirm images are real, optimized, consented, and accurately described.
- Run the static test suite.
- Run a production build and preview every top-level and generated route.
```

- [ ] **Step 2: Update README build section**

Replace the build explanation with:

```md
The `build` script runs `scripts/generate-static-pages.mjs` before Vite. The generator fetches published Supabase records, writes generated HTML for treatment, doctor, and Knowledge Center slug routes, updates `.cache/seo-pages.json`, and regenerates `public/sitemap.xml`.
```

- [ ] **Step 3: Add deployment checklist**

In `docs/deployment.md`, add:

```md
## Blueprint Launch Gate

- `npm test` passes.
- `npm run build` succeeds with production Supabase credentials.
- Generated `dist/treatments/{slug}/index.html` pages contain real metadata.
- Generated `dist/blog/{slug}/index.html` pages contain author/reviewer/date information.
- `dist/sitemap.xml` contains only published canonical URLs.
- Admin routes are blocked by robots and protected by Supabase Auth.
```

- [ ] **Step 4: Commit documentation**

Run:

```powershell
git add docs/blueprint-alignment.md README.md docs/deployment.md
git commit -m "docs: document blueprint launch rules"
```

Expected: commit succeeds.

---

## Task 15: Final Verification

**Files:**
- Modify only files required by failing tests.

- [ ] **Step 1: Run full static test suite**

Move ad-hoc Puppeteer screenshot scripts out of the default Node test glob before running the suite:

```powershell
New-Item -ItemType Directory -Force tests\browser-scripts
Move-Item -LiteralPath test-contact-tabs.mjs -Destination tests\browser-scripts\contact-tabs-screenshot.mjs
Move-Item -LiteralPath test-modal.mjs -Destination tests\browser-scripts\modal-screenshot.mjs
Move-Item -LiteralPath test-testimonials.mjs -Destination tests\browser-scripts\testimonials-screenshot.mjs
```

Run:

```powershell
& 'C:\Users\seesi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test
```

Expected: all static tests PASS. The moved screenshot scripts remain available for manual visual checks and no longer run as default tests.

- [ ] **Step 2: Run build**

Run:

```powershell
npm run build
```

Expected: build completes and `dist` contains:

```txt
dist/index.html
dist/about/index.html
dist/treatments/index.html
dist/treatments/dental-implants/index.html
dist/blog/what-to-expect-at-a-routine-dental-check-up/index.html
dist/contact/index.html
dist/404.html
dist/sitemap.xml
```

- [ ] **Step 3: Inspect generated metadata**

Run:

```powershell
Select-String -Path dist\treatments\dental-implants\index.html -Pattern '<title>|canonical|application/ld\+json|<h1'
Select-String -Path dist\blog\what-to-expect-at-a-routine-dental-check-up\index.html -Pattern '<title>|canonical|Reviewed by|application/ld\+json|<h1'
```

Expected: each command returns matching metadata lines.

- [ ] **Step 4: Run preview smoke check**

Run:

```powershell
npm run preview
```

Open:

```txt
http://localhost:4173/
http://localhost:4173/treatments/dental-implants/
http://localhost:4173/blog/what-to-expect-at-a-routine-dental-check-up/
http://localhost:4173/contact/
```

Expected: each page renders, links work, modals close with Escape, and keyboard focus is visible.

- [ ] **Step 5: Commit final fixes**

Run:

```powershell
git status --short
git add .
git commit -m "fix: complete blueprint alignment verification"
```

Expected: final commit succeeds only after test/build verification.

---

## Execution Notes

- Apply migrations to a linked Supabase project only after reviewing the SQL diff.
- Keep old `.html` files during transition if hosting redirects still need them.
- Add 301 redirects from `.html` paths to clean paths through hosting config or the new `redirects` table.
- Do not publish doctor profiles until names, qualifications, registration numbers, and photos are verified.
- Do not publish testimonials or transformation media until written consent is stored and reviewed.
- Do not expose service-role keys in frontend code or build scripts.

---

## Success Criteria

- Public route model matches the blueprint.
- Treatment, blog, and doctor slug routes return complete HTML directly.
- Sitemap is generated from published content.
- CMS supports clinical review, SEO review, scheduling, archive state, media metadata, redirects, and relations.
- Homepage/testimonials/treatments contain no fabricated proof.
- Appointment forms collect minimal information.
- Tests and production build pass.
- Documentation explains how to keep future edits aligned with the blueprint.
