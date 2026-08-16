# Production Readiness and CMS Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Titanium Roots ready for its initial production operating period with CMS-backed treatments, educational articles and SEO, a first-class empty Testimonials route, restored administrator authorization, and complete public deployment assets.

**Architecture:** Keep the Vite multi-page frontend and existing Supabase repository layer. Public content remains database-driven; a forward-only idempotent migration adds safe clinic-team content without creating clinicians, testimonials, media paths, patients, or private records. Authorization is restored at both the browser check and PostgreSQL RLS helper.

**Tech Stack:** Vite 6, vanilla ES modules, Node test runner, Supabase Auth/Postgres/Storage, HTML, CSS.

**Execution note:** This checkout currently has no `.git` metadata, so commit steps must be recorded as unavailable unless a repository is initialized or restored. Do not initialize Git solely to satisfy this plan.

---

## File map

- Create `tests/production-readiness.test.mjs`: focused static contract tests for navigation, empty Testimonials behavior, CMS seed integrity, authorization, and production assets.
- Modify `components/navbar.html`: add Testimonials to primary desktop/mobile navigation.
- Modify `testimonials.html`: add a consent-aware, action-oriented empty state.
- Modify `assets/css/pages/testimonials.css`: style the empty state and refine responsive Testimonials layout.
- Create via Supabase CLI `supabase/migrations/*_production_cms_content.sql`: idempotent treatments, educational blogs, settings copy, and SEO content.
- Create via Supabase CLI `supabase/migrations/*_restore_cms_admin_membership.sql`: restore active `cms_admins` authorization.
- Modify `assets/js/admin/admin-auth.js`: verify active administrator membership.
- Modify `assets/js/data/auth-repository.js`: use the same membership rule.
- Modify `supabase/config.toml`: disable local email signup and require a 12-character local password minimum.
- Create `public/favicon.svg`: valid lightweight brand favicon.
- Modify all public/admin HTML entry files: use `/favicon.svg`.
- Populate `public/robots.txt` and `public/sitemap.xml`.
- Populate `README.md`: setup, content, migration, verification, deployment, and replacement checklist.
- Modify `tests/admin-e2e.mjs`: remove hard-coded demo credentials and require explicit test credentials.

---

### Task 1: Establish the production-readiness test contract

**Files:**
- Create: `tests/production-readiness.test.mjs`

- [ ] **Step 1: Add the first failing navigation test**

```js
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Testimonials is a first-class primary navigation route', async () => {
  const navbar = await read('components/navbar.html');
  assert.match(
    navbar,
    /href="\/doctors\.html"[\s\S]*href="\/testimonials\.html"[\s\S]*href="\/blog\.html"/,
  );
  assert.match(navbar, /href="\/testimonials\.html"\s+data-nav-page="testimonials"/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: FAIL because `components/navbar.html` has no Testimonials primary-navigation link.

- [ ] **Step 3: Record commit unavailability**

Run:

```powershell
git rev-parse --is-inside-work-tree
```

Expected in this checkout: non-zero exit with no Git worktree. Record this once; do not initialize a repository.

---

### Task 2: Add Testimonials navigation and an intentional empty route

**Files:**
- Modify: `components/navbar.html`
- Modify: `testimonials.html`
- Modify: `assets/css/pages/testimonials.css`
- Modify: `tests/production-readiness.test.mjs`

- [ ] **Step 1: Implement the minimal navigation change**

In the shared `<nav class="site-nav">`, keep the existing links and insert this exact anchor between Doctors and Blog:

```html
<a href="/testimonials.html" data-nav-page="testimonials">Testimonials</a>
```

- [ ] **Step 2: Run the focused test and verify GREEN**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: PASS for the navigation contract.

- [ ] **Step 3: Add a failing empty-state test**

Append:

```js
test('Testimonials keeps an honest consent-aware empty state', async () => {
  const html = await read('testimonials.html');
  const page = await read('assets/js/pages/testimonials.js');
  assert.match(html, /data-testimonials-empty/);
  assert.match(html, /patient consent/i);
  assert.match(html, /data-modal-open="appointment-modal"/);
  assert.match(page, /empty\.hidden = testimonials\.length !== 0/);
  assert.doesNotMatch(html, /Sample Patient|Preview Review|Lorem ipsum/i);
});
```

- [ ] **Step 4: Run and verify RED**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: FAIL because the existing empty paragraph has no appointment action and does not explicitly mention patient consent.

- [ ] **Step 5: Replace the empty paragraph with accessible action markup**

Use this markup after `[data-testimonials-grid]`:

```html
<section class="testimonials-empty" data-testimonials-empty hidden aria-labelledby="testimonials-empty-title">
  <span class="testimonials-empty__mark" aria-hidden="true"><i data-lucide="shield-check"></i></span>
  <p class="section-eyebrow">Shared responsibly</p>
  <h3 id="testimonials-empty-title">Patient stories will appear after consent and review.</h3>
  <p>We publish feedback only after the patient has agreed and the clinic has completed its approval process. No demonstration reviews are shown as real experiences.</p>
  <div class="testimonials-empty__actions">
    <button class="button" type="button" data-modal-open="appointment-modal">Book an Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button>
    <a class="text-link" href="/contact.html">Contact the Clinic <i data-lucide="arrow-right" aria-hidden="true"></i></a>
  </div>
</section>
```

- [ ] **Step 6: Add the empty-state styles**

Append to `assets/css/pages/testimonials.css`:

```css
.testimonials-empty {
  position: relative;
  display: grid;
  max-width: 780px;
  margin: 2.5rem auto 0;
  padding: clamp(2rem, 5vw, 4rem);
  overflow: hidden;
  border: 1px solid rgba(47, 95, 73, .16);
  border-radius: 30px;
  background:
    radial-gradient(circle at 100% 0, rgba(195, 162, 96, .2), transparent 34%),
    linear-gradient(145deg, #fff, rgba(238, 244, 239, .82));
  box-shadow: 0 24px 65px rgba(47, 67, 57, .1);
  text-align: center;
  place-items: center;
}

.testimonials-empty[hidden] { display: none; }

.testimonials-empty__mark {
  display: grid;
  width: 64px;
  height: 64px;
  margin-bottom: 1.25rem;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  place-items: center;
}

.testimonials-empty__mark svg { width: 28px; }
.testimonials-empty h3 { max-width: 620px; margin: .5rem 0 1rem; }
.testimonials-empty > p:not(.section-eyebrow) { max-width: 650px; color: #68766f; line-height: 1.75; }
.testimonials-empty__actions { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.6rem; }

@media (max-width: 620px) {
  .testimonials-empty { border-radius: 22px; }
  .testimonials-empty__actions { align-items: stretch; flex-direction: column; width: 100%; }
  .testimonials-empty__actions .button,
  .testimonials-empty__actions .text-link { justify-content: center; }
}
```

- [ ] **Step 7: Verify GREEN**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: both tests PASS.

---

### Task 3: Add real CMS-backed treatments, educational articles, settings copy, and SEO

**Files:**
- Create via CLI: `supabase/migrations/*_production_cms_content.sql`
- Modify: `tests/production-readiness.test.mjs`

- [ ] **Step 1: Add the failing CMS migration contract**

Append:

```js
async function migrationNamed(suffix) {
  const directory = new URL('../supabase/migrations/', import.meta.url);
  const files = await readdir(directory);
  const name = files.find((file) => file.endsWith(`${suffix}.sql`));
  assert.ok(name, `Expected a migration ending in ${suffix}.sql`);
  return readFile(new URL(name, directory), 'utf8');
}

test('production content is CMS-backed and contains no fabricated identities', async () => {
  const sql = await migrationNamed('_production_cms_content');
  assert.match(sql, /insert into public\.treatments/i);
  assert.match(sql, /insert into public\.blog_posts/i);
  assert.match(sql, /Titanium Roots Clinical Team/);
  assert.match(sql, /\/testimonials\.html/);
  assert.match(sql, /on conflict \(slug\) do update/i);
  assert.match(sql, /on conflict \(route\) do update/i);
  assert.doesNotMatch(sql, /insert into public\.testimonials/i);
  assert.doesNotMatch(sql, /insert into public\.doctors/i);
  assert.doesNotMatch(sql, /insert into public\.(appointment_requests|analytics_events|cms_audit_log)/i);
  assert.doesNotMatch(sql, /image_path\s*[,)][\s\S]*https?:\/\//i);
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: FAIL because the production content migration does not exist.

- [ ] **Step 3: Install the pinned workspace dependencies**

```powershell
npm ci
```

Expected: exit 0 using `package-lock.json` without changing dependency declarations.

- [ ] **Step 4: Discover the Supabase migration command and generate the file**

```powershell
npx supabase migration new --help
npx supabase migration new production_cms_content
$migrationPath = (Get-ChildItem supabase/migrations/*_production_cms_content.sql | Sort-Object Name | Select-Object -Last 1).FullName
$migrationPath
```

Expected: one newly generated migration path. Do not invent or rename its timestamp.

- [ ] **Step 5: Populate the generated migration with idempotent public content**

Write the following SQL into the generated migration using `apply_patch` with the resolved filename:

```sql
begin;

insert into public.treatments (
  name, slug, category, short_description, full_description, duration, visits,
  pricing_status, benefits, suitability, procedure_steps, recovery,
  featured, status, sort_order
) values
  (
    'Preventive Dental Care', 'preventive-dental-care', 'Preventive dentistry',
    'Regular assessment and preventive care focused on protecting teeth and gums over time.',
    'Preventive visits may include an oral examination, professional cleaning advice, risk review and a personalised plan for maintaining oral health.',
    'Usually 30–60 minutes', 'Frequency is based on individual need',
    'consultation_required',
    'Early identification of concerns, practical home-care guidance and ongoing oral-health support',
    'Suitable intervals and procedures are recommended after reviewing oral health, history and individual risk factors.',
    'Your visit may include discussion, examination, appropriate imaging, cleaning recommendations and a review plan.',
    'Continue the brushing, interdental cleaning and review schedule recommended by your dental professional.',
    true, 'published', 7
  ),
  (
    'Gum Health Care', 'gum-health-care', 'Periodontal care',
    'Assessment and care planning for bleeding gums, inflammation and ongoing gum health.',
    'Gum care begins with an assessment of the teeth, gums and supporting tissues. Findings are explained before suitable cleaning, home-care or referral options are discussed.',
    'Timeline depends on assessment', 'Review visits vary by gum condition',
    'consultation_required',
    'Clear gum-health assessment, tailored cleaning guidance and structured follow-up where needed',
    'The appropriate level of care is confirmed after examination and periodontal assessment.',
    'Assessment, explanation of findings, agreed care and maintenance reviews are planned around clinical need.',
    'Daily plaque control and the recommended maintenance schedule are important parts of ongoing gum care.',
    false, 'published', 8
  ),
  (
    'Urgent Dental Assessment', 'urgent-dental-assessment', 'Urgent dentistry',
    'Prompt assessment for dental pain, swelling, a damaged tooth or another urgent concern.',
    'An urgent appointment focuses on understanding the immediate concern, checking for signs that need priority care and explaining safe next steps.',
    'Priority appointment where available', 'Follow-up depends on the finding',
    'consultation_required',
    'Focused assessment, clear next steps and appropriate pain-management or treatment planning',
    'Contact the clinic promptly for severe pain, swelling or a damaged tooth. Medical emergencies require emergency services.',
    'The dentist assesses the concern, explains the likely cause and discusses immediate and follow-up options.',
    'Follow the individual instructions provided after assessment and seek urgent help if symptoms worsen.',
    false, 'published', 9
  )
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  short_description = excluded.short_description,
  full_description = excluded.full_description,
  duration = excluded.duration,
  visits = excluded.visits,
  pricing_status = excluded.pricing_status,
  benefits = excluded.benefits,
  suitability = excluded.suitability,
  procedure_steps = excluded.procedure_steps,
  recovery = excluded.recovery,
  featured = excluded.featured,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.blog_posts (
  title, slug, category, tags, excerpt, content_html, author_name, publish_at,
  status, featured, trending, seo_title, seo_description, sort_order
) values
  (
    'What to Expect at a Routine Dental Check-up',
    'what-to-expect-at-a-routine-dental-check-up',
    'Patient Guides', array['dental check-up', 'preventive care', 'oral health'],
    'A straightforward guide to the conversation, examination and next steps that may form part of a routine dental visit.',
    '<h2>Starting with your concerns</h2><p>A routine visit usually begins with a conversation about your oral health, recent symptoms, medical history and any changes you have noticed.</p><h2>The examination</h2><p>Your dentist may examine the teeth, gums, bite and surrounding tissues. Imaging is recommended only when it is clinically useful.</p><h2>Planning next steps</h2><p>Findings should be explained clearly. If care is recommended, you can discuss priorities, alternatives, likely timelines and expected costs before deciding how to proceed.</p>',
    'Titanium Roots Clinical Team', '2026-08-01T03:30:00Z',
    'published', true, false,
    'What to Expect at a Dental Check-up',
    'Learn what may happen during a routine dental check-up and how findings and next steps are discussed.',
    1
  ),
  (
    'Daily Habits That Support Healthy Teeth and Gums',
    'daily-habits-for-healthy-teeth-and-gums',
    'Oral Health', array['brushing', 'gum health', 'prevention'],
    'Practical habits that can support oral health between professional dental visits.',
    '<h2>Clean consistently</h2><p>Brush twice daily with fluoride toothpaste and clean between the teeth using the method recommended for you.</p><h2>Notice changes</h2><p>Bleeding gums, persistent sensitivity, pain, swelling or a change that does not settle should be discussed with a dental professional.</p><h2>Keep reviews individual</h2><p>The right review interval is not identical for everyone. Your dentist can recommend timing based on your oral health and risk factors.</p>',
    'Titanium Roots Clinical Team', '2026-08-02T03:30:00Z',
    'published', true, true,
    'Daily Habits for Healthy Teeth and Gums',
    'Review practical brushing, interdental cleaning and dental-review habits that support oral health.',
    2
  ),
  (
    'Understanding Tooth Sensitivity',
    'understanding-tooth-sensitivity',
    'Dental Education', array['sensitivity', 'tooth pain', 'dental assessment'],
    'Common reasons a tooth may feel sensitive and why persistent or severe symptoms deserve assessment.',
    '<h2>What sensitivity can feel like</h2><p>Sensitivity may be noticed with cold, heat, sweetness or brushing. Its cause can vary, so the pattern and duration matter.</p><h2>Why assessment helps</h2><p>Possible contributors include exposed root surfaces, enamel wear, decay, a damaged restoration or another dental condition. An examination helps distinguish between them.</p><h2>When to contact a dentist</h2><p>Arrange an assessment when sensitivity persists, becomes severe, interrupts sleep or occurs with swelling. Avoid placing medication directly on the tooth or gum.</p>',
    'Titanium Roots Clinical Team', '2026-08-03T03:30:00Z',
    'published', false, true,
    'Understanding Tooth Sensitivity',
    'Learn why teeth can become sensitive and when persistent symptoms should be assessed by a dentist.',
    3
  )
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  tags = excluded.tags,
  excerpt = excluded.excerpt,
  content_html = excluded.content_html,
  author_name = excluded.author_name,
  publish_at = excluded.publish_at,
  status = excluded.status,
  featured = excluded.featured,
  trending = excluded.trending,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  sort_order = excluded.sort_order;

insert into public.seo_pages (
  route, meta_title, meta_description, canonical_url, og_title, og_description,
  should_index, should_follow, include_in_sitemap
) values
  (
    '/testimonials.html',
    'Patient Testimonials | Titanium Roots',
    'Read consent-approved patient feedback published by Titanium Roots Dental Clinic.',
    'https://titaniumroots.com/testimonials.html',
    'Patient Testimonials | Titanium Roots',
    'Patient feedback appears after consent and clinic approval.',
    true, true, true
  ),
  (
    '/blog.html',
    'Dental Care Articles | Titanium Roots',
    'Read practical dental-care guidance and patient education from the Titanium Roots Clinical Team.',
    'https://titaniumroots.com/blog.html',
    'Dental Care Articles | Titanium Roots',
    'Practical oral-health guidance from the Titanium Roots Clinical Team.',
    true, true, true
  )
on conflict (route) do update set
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  canonical_url = excluded.canonical_url,
  og_title = excluded.og_title,
  og_description = excluded.og_description,
  should_index = excluded.should_index,
  should_follow = excluded.should_follow,
  include_in_sitemap = excluded.include_in_sitemap;

update public.site_settings
set
  homepage = homepage || '{"ctaText":"Book a dental consultation","featuredTreatmentCount":6,"featuredDoctorCount":4}'::jsonb,
  footer = footer || '{"description":"Clear dental guidance, considered treatment planning and patient-focused care.","newsletterText":"Occasional oral-health guidance and clinic updates."}'::jsonb,
  message_templates = message_templates || '{"appointmentMessage":"Hello, I would like to request a dental appointment.","enquiryMessage":"Hello, I have a question about dental care."}'::jsonb
where id = 'primary';

commit;
```

- [ ] **Step 6: Run focused tests and verify GREEN**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: all production-readiness tests PASS.

---

### Task 4: Restore active administrator membership authorization

**Files:**
- Modify: `assets/js/admin/admin-auth.js`
- Modify: `assets/js/data/auth-repository.js`
- Modify: `tests/admin-auth-production.test.mjs`
- Modify: `tests/supabase-migration.test.mjs`
- Modify: `tests/production-readiness.test.mjs`
- Create via CLI: `supabase/migrations/*_restore_cms_admin_membership.sql`
- Modify: `supabase/config.toml`

- [ ] **Step 1: Replace the permissive browser-auth test with a failing membership test**

In `tests/admin-auth-production.test.mjs`, replace the test beginning `every authenticated Supabase user` with:

```js
test('CMS access requires an active administrator membership', async () => {
  const auth = await read('assets/js/admin/admin-auth.js');
  const repository = await read('assets/js/data/auth-repository.js');
  for (const source of [auth, repository]) {
    assert.match(source, /\.from\(['"]cms_admins['"]\)/);
    assert.match(source, /\.eq\(['"]user_id['"], user\.id\)/);
    assert.match(source, /\.eq\(['"]is_active['"], true\)/);
    assert.doesNotMatch(source, /function isCmsAdmin\(user\)[\s\S]*return Boolean\(user\)/);
  }
});
```

- [ ] **Step 2: Add a failing effective-migration test**

In `tests/supabase-migration.test.mjs`, replace the test beginning `latest authorization migration permits` with:

```js
test('latest authorization migration restores the active CMS allowlist', async () => {
  const sources = await allSql();
  const authorization = sources.find((source) => /create or replace function public\.is_cms_admin\(\)[\s\S]*from public\.cms_admins/i.test(source));
  assert.ok(authorization, 'expected an authorization migration backed by cms_admins');
  assert.match(authorization, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(authorization, /and is_active/i);
  assert.doesNotMatch(authorization, /auth\.jwt\(\)[\s\S]*is_anonymous/i);
});
```

- [ ] **Step 3: Run and verify RED**

```powershell
node --test tests/admin-auth-production.test.mjs tests/supabase-migration.test.mjs
```

Expected: FAIL because both browser helpers and the latest effective helper authorize every authenticated user.

- [ ] **Step 4: Implement the same membership query in both browser modules**

Replace each `isCmsAdmin` body with:

```js
export async function isCmsAdmin(user) {
  if (!user) return false;
  const { data, error } = await requireSupabase()
    .from('cms_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  if (error) return false;
  return data?.user_id === user.id;
}
```

- [ ] **Step 5: Generate the corrective migration through the CLI**

```powershell
npx supabase migration new restore_cms_admin_membership
$authMigrationPath = (Get-ChildItem supabase/migrations/*_restore_cms_admin_membership.sql | Sort-Object Name | Select-Object -Last 1).FullName
$authMigrationPath
```

- [ ] **Step 6: Add the corrective SQL**

```sql
begin;

create or replace function public.is_cms_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.cms_admins
    where user_id = (select auth.uid())
      and is_active
  );
$$;

revoke all on function public.is_cms_admin() from anon;
revoke all on function public.is_cms_admin() from public;
grant execute on function public.is_cms_admin() to authenticated;

commit;
```

- [ ] **Step 7: Align local Auth configuration**

Set these exact values in `supabase/config.toml`:

```toml
[auth]
enable_signup = false
minimum_password_length = 12

[auth.email]
enable_signup = false
```

Keep phone signup disabled.

- [ ] **Step 8: Verify GREEN**

```powershell
node --test tests/admin-auth-production.test.mjs tests/supabase-migration.test.mjs tests/production-readiness.test.mjs
```

Expected: all selected tests PASS.

---

### Task 5: Add production robots, sitemap, and favicon

**Files:**
- Create: `public/favicon.svg`
- Populate: `public/robots.txt`
- Populate: `public/sitemap.xml`
- Modify: `404.html`, `about.html`, `blog.html`, `contact.html`, `doctors.html`, `index.html`, `testimonials.html`, `treatments.html`
- Modify: every `admin/*.html` entry file
- Modify: `tests/production-readiness.test.mjs`

- [ ] **Step 1: Add failing public-asset tests**

Append:

```js
test('production discovery assets contain every public route', async () => {
  const robots = await read('public/robots.txt');
  const sitemap = await read('public/sitemap.xml');
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Sitemap: https:\/\/titaniumroots\.com\/sitemap\.xml/);
  for (const route of [
    '/', '/about.html', '/treatments.html', '/doctors.html',
    '/testimonials.html', '/blog.html', '/contact.html',
  ]) {
    assert.ok(sitemap.includes(`<loc>https://titaniumroots.com${route}</loc>`), route);
  }
  const favicon = await read('public/favicon.svg');
  assert.match(favicon, /<svg[\s\S]*<path/);
});

test('all HTML entry points use the production SVG favicon', async () => {
  const entries = [
    '404.html', 'about.html', 'blog.html', 'contact.html', 'doctors.html',
    'index.html', 'testimonials.html', 'treatments.html',
    'admin/login.html', 'admin/reset-password.html', 'admin/dashboard.html',
    'admin/appointments.html', 'admin/doctors.html', 'admin/treatments.html',
    'admin/blogs.html', 'admin/testimonials.html', 'admin/gallery.html',
    'admin/seo.html', 'admin/settings.html', 'admin/analytics.html',
  ];
  for (const entry of entries) {
    assert.match(await read(entry), /rel="icon" href="\/favicon\.svg"/);
  }
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: FAIL because discovery files are empty and `favicon.svg` does not exist.

- [ ] **Step 3: Populate robots.txt**

```text
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://titaniumroots.com/sitemap.xml
```

- [ ] **Step 4: Populate sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://titaniumroots.com/</loc></url>
  <url><loc>https://titaniumroots.com/about.html</loc></url>
  <url><loc>https://titaniumroots.com/treatments.html</loc></url>
  <url><loc>https://titaniumroots.com/doctors.html</loc></url>
  <url><loc>https://titaniumroots.com/testimonials.html</loc></url>
  <url><loc>https://titaniumroots.com/blog.html</loc></url>
  <url><loc>https://titaniumroots.com/contact.html</loc></url>
</urlset>
```

- [ ] **Step 5: Create the brand favicon**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Titanium Roots">
  <rect width="64" height="64" rx="16" fill="#2f5f49"/>
  <path d="M20 15c7 0 8 5 12 5s5-5 12-5c8 0 12 7 10 15-3 12-7 22-12 22-4 0-4-10-10-10s-6 10-10 10c-5 0-9-10-12-22-2-8 2-15 10-15Z" fill="#f8f4eb"/>
  <path d="M32 21v17M24 29h16" fill="none" stroke="#c3a260" stroke-width="4" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 6: Update all entry points**

Replace every exact occurrence:

```html
<link rel="icon" href="/favicon.ico">
```

with:

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
```

Update the test regex to accept the `type` attribute:

```js
assert.match(await read(entry), /rel="icon" href="\/favicon\.svg" type="image\/svg\+xml"/);
```

- [ ] **Step 7: Verify GREEN**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: all focused tests PASS.

---

### Task 6: Add operational README and verified-data checklist

**Files:**
- Populate: `README.md`
- Modify: `tests/production-readiness.test.mjs`

- [ ] **Step 1: Add a failing README contract**

Append:

```js
test('README documents production setup and verified-data replacement', async () => {
  const readme = await read('README.md');
  for (const heading of [
    '# Titanium Roots', '## Local setup', '## Supabase migrations',
    '## Content integrity', '## Production checklist', '## Verification',
  ]) assert.ok(readme.includes(heading), heading);
  assert.match(readme, /VITE_SUPABASE_URL/);
  assert.match(readme, /npm ci/);
  assert.match(readme, /npm run build/);
  assert.match(readme, /patient testimonials/i);
  assert.match(readme, /contact details/i);
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: FAIL because `README.md` is empty.

- [ ] **Step 3: Populate README.md**

Use this complete structure and content:

```markdown
# Titanium Roots

Titanium Roots is a Vite multi-page dental-clinic website with a Supabase-backed content management system. Public content, appointment requests, privacy-limited analytics, administrator authentication, and media storage use the connected Supabase project.

## Local setup

Requirements: a supported Node.js release and access to the intended Supabase project.

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` using browser-public project values only.
3. Run `npm ci`.
4. Run `npm run dev`.

Never place a service-role key, database password, administrator password, SMTP credential, or personal access token in this repository.

## Supabase migrations

Schema changes use forward-only files under `supabase/migrations/`. Discover CLI commands with `npx supabase --help`. After authenticating and linking the correct project, review pending migrations before running the supported database push command. Do not rewrite migrations already applied to a shared environment.

Administrator access requires both a Supabase Auth user and an active matching row in `public.cms_admins`.

## Content integrity

Treatments and educational articles are CMS records. Articles attributed to `Titanium Roots Clinical Team` provide general education and do not replace individual clinical advice.

Patient testimonials must be entered only after documented patient consent and clinic approval. Do not create demonstration reviews, invented clinicians, qualifications, registrations, treatment outcomes, prices, or private patient records.

CMS image fields must refer to objects that exist in the `cms-media` Supabase Storage bucket. Upload approved images through the administrator interface rather than inventing storage paths.

## Production checklist

Before public promotion, verify and replace all clinic contact details, address, phone and WhatsApp numbers, email addresses, opening hours, maps links, social links, clinician profiles, registration details, treatment availability, emergency wording, and canonical domain settings.

Keep public Auth signup disabled. Configure the production password-reset redirect, HTTPS, security headers, CAPTCHA or equivalent submission-abuse protection, database backups, monitoring, and a deployment hook for build-time SEO updates.

## Verification

Run:

```text
npm test
npm run build
```

The optional live smoke scripts write records to Supabase and must run only against an approved test project. Browser administrator tests require explicit test credentials and must not use production patient data.

Deploy the generated `dist/` directory with independent routing for each HTML file.
```

- [ ] **Step 4: Verify GREEN**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: focused suite PASS.

---

### Task 7: Remove obsolete demo credentials from browser E2E

**Files:**
- Modify: `tests/admin-e2e.mjs`
- Modify: `tests/production-readiness.test.mjs`

- [ ] **Step 1: Add a failing E2E safety contract**

Append:

```js
test('administrator E2E requires explicit credentials and contains no demo login', async () => {
  const source = await read('tests/admin-e2e.mjs');
  assert.match(source, /process\.env\.E2E_ADMIN_EMAIL/);
  assert.match(source, /process\.env\.E2E_ADMIN_PASSWORD/);
  assert.doesNotMatch(source, /qa@titaniumroots\.example|demo-pass|demo login/i);
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: FAIL because `tests/admin-e2e.mjs` contains hard-coded obsolete demo credentials.

- [ ] **Step 3: Require explicit credentials at the top of admin-e2e.mjs**

Add after `BASE_URL`:

```js
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
assert(ADMIN_EMAIL, 'E2E_ADMIN_EMAIL is required for administrator browser tests.');
assert(ADMIN_PASSWORD, 'E2E_ADMIN_PASSWORD is required for administrator browser tests.');
```

Replace the two hard-coded fills with:

```js
await page.locator('[name="email"]').fill(ADMIN_EMAIL);
await page.locator('[name="password"]').fill(ADMIN_PASSWORD);
```

Rename the check label from `demo login` to:

```js
checks.push('authorized administrator login');
```

- [ ] **Step 4: Verify GREEN**

```powershell
node --test tests/production-readiness.test.mjs
```

Expected: focused suite PASS.

Do not run the administrator E2E against the connected project in this task: it mutates CMS records and requires a dedicated test identity/project.

---

### Task 8: Full verification, visual check, and safe live migration attempt

**Files:**
- Verify all modified files
- Potential external change: apply pending migrations to the explicitly connected Supabase project

- [ ] **Step 1: Run source syntax verification**

```powershell
node --check vite.config.js
Get-ChildItem assets/js -Recurse -Filter *.js | ForEach-Object {
  node --check $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Syntax failure: $($_.FullName)" }
}
Get-ChildItem scripts,tests -Recurse -Filter *.mjs | ForEach-Object {
  node --check $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Syntax failure: $($_.FullName)" }
}
```

Expected: exit 0 for every file.

- [ ] **Step 2: Run focused and full tests**

```powershell
node --test tests/production-readiness.test.mjs
npm test
```

Expected: exit 0 with no failing tests. If an unrelated pre-existing failure remains, report its exact test and do not claim a clean suite.

- [ ] **Step 3: Run dependency and production-build verification**

```powershell
npm audit
npm run build
```

Expected: audit reports zero known vulnerabilities and Vite emits `dist/` successfully after fetching public SEO.

- [ ] **Step 4: Inspect the generated production artifacts**

```powershell
Get-Item dist/robots.txt,dist/sitemap.xml,dist/favicon.svg
rg -n "Testimonials" dist/components/navbar.html
rg -n "Patient stories will appear after consent" dist/testimonials.html
```

Expected: all files exist and both strings are present.

- [ ] **Step 5: Start a bounded local preview and perform visual checks**

Run `npm run preview -- --host 127.0.0.1`, then inspect `/`, `/testimonials.html`, and the mobile navigation at approximately 375 px width. Confirm:

- Testimonials appears between Doctors and Blog;
- the Testimonials link receives `aria-current="page"`;
- the empty state is visible with no approved testimonials;
- no horizontal overflow occurs at desktop or mobile widths;
- keyboard focus remains visible;
- no browser console or failed application requests appear.

Stop the preview process after verification.

- [ ] **Step 6: Discover authenticated Supabase deployment state**

```powershell
npx supabase --help
npx supabase projects list
```

Expected: if an authenticated CLI session exists, the connected project is listed. If authentication is missing, stop the deployment portion and report that exact blocker without exposing tokens or database credentials.

- [ ] **Step 7: Link and review migrations only when the project identity is confirmed**

Derive the project reference from the hostname in `VITE_SUPABASE_URL`, compare it with the intended connected project, then use CLI `--help` to confirm current syntax before linking. Run migration-list/status commands before any push. Do not proceed if the project reference is unexpected or the CLI requests credentials that are not already available.

- [ ] **Step 8: Apply pending migrations when authenticated and confirmed**

Use the exact database-push syntax shown by the installed CLI help. Apply only the two new reviewed migrations. Then verify migration history and run read-only public queries confirming:

- the three new treatments are publicly readable;
- the three clinic-team articles are publicly readable;
- the Testimonials SEO record exists;
- the testimonials collection remains unchanged;
- anonymous execution of `is_cms_admin` remains denied.

Never print the publishable key, access token, database password, or user credentials.

- [ ] **Step 9: Final report**

Report separately:

- local code and test results;
- production build result;
- browser/visual result;
- whether migrations were applied to the connected project;
- any remaining actions requiring clinic-verified contact, clinicians, testimonials, images, CAPTCHA provider, hosting, or credentials.

