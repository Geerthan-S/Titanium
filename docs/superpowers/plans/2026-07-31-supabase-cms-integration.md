# Titanium Roots Supabase CMS Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Titanium Roots browser-only demo CMS with a secure Supabase-backed CMS whose approved admin changes update the public website.

**Architecture:** A single browser-safe Supabase client feeds focused repositories for authentication, CMS CRUD, public content, appointments, media, settings, and analytics. Typed Postgres tables use explicit Data API grants and RLS; public pages read only published content, authenticated administrators receive constrained CRUD, and Realtime invalidates and re-fetches changed collections.

**Tech Stack:** Vite 6, vanilla ES modules, `@supabase/supabase-js` 2.111.0, Supabase CLI 2.110.0, DOMPurify 3.4.12, Postgres/RLS, Supabase Auth, Storage, Realtime, Node test runner, Playwright browser verification.

**Approved design:** `docs/superpowers/specs/2026-07-31-supabase-cms-integration-design.md`

**Repository note:** `E:\Titanium` has no usable Git metadata. Commit steps are intentionally omitted; each task ends with an automated verification checkpoint.

---

## File Map

### Create

- `supabase/config.toml` — project-local Supabase CLI configuration.
- `supabase/migrations/<cli-generated>_titanium_cms.sql` — complete schema, grants, RLS, Storage, Realtime, and approved seed content.
- `assets/js/data/supabase-client.js` — validated shared browser client.
- `assets/js/data/data-errors.js` — normalized operational errors.
- `assets/js/data/record-mappers.js` — snake_case database to camelCase UI mapping.
- `assets/js/data/auth-repository.js` — Supabase Auth and administrator membership.
- `assets/js/data/cms-repository.js` — generic authorized CMS CRUD and audit writes.
- `assets/js/data/public-content-repository.js` — published public queries.
- `assets/js/data/appointments-repository.js` — anonymous appointment submission and admin access.
- `assets/js/data/media-repository.js` — Storage upload/replace/delete.
- `assets/js/data/analytics-repository.js` — bounded event capture and real aggregates.
- `assets/js/data/public-content-store.js` — public fetch/cache/Realtime invalidation.
- `assets/js/data/index.js` — stable data-layer exports.
- `assets/js/pages/admin-reset-password.js` — password recovery completion.
- `admin/reset-password.html` — password update route.
- `scripts/fetch-seo.mjs` — build-time SEO record fetch.
- `tests/supabase-config.test.mjs` — environment and dependency checks.
- `tests/supabase-migration.test.mjs` — schema, grant, policy, and seed assertions.
- `tests/supabase-data.test.mjs` — mapper, payload, sanitizer, and repository contract tests.
- `tests/public-cms-integration.test.mjs` — confirms public pages consume the shared store.
- `tests/admin-production.test.mjs` — confirms demo behavior is removed.
- `tests/supabase-live-smoke.mjs` — bounded live public API checks.

### Modify

- `.env` — real project URL and publishable key; ignored by Git.
- `.env.example` — safe placeholders only.
- `package.json` / `package-lock.json` — exact Supabase, CLI, DOMPurify dependencies and verification scripts.
- `vite.config.js` — reset-password route and build-time SEO injection.
- `admin/login.html` — production login and recovery UI.
- `assets/js/admin/admin-auth.js` — real Auth adapter.
- `assets/js/admin/admin-store.js` — asynchronous Supabase CMS adapter.
- `assets/js/admin/admin-app.js` — async controllers, real data, uploads, aggregates, and production copy.
- `assets/js/admin/admin-form.js` — async saving/upload status.
- `assets/js/admin/admin-table.js` — loading/error states and async refresh.
- `assets/js/admin/admin-shell.js` — authenticated identity and real logout.
- `assets/css/pages/admin.css` — production auth/reset/error/loading states.
- `assets/js/app.js` — shared public content/settings/analytics initialization.
- `assets/js/pages/home.js` — live featured content.
- `assets/js/pages/about.js` — live settings and featured doctors.
- `assets/js/pages/doctors.js` — live published profiles.
- `assets/js/pages/treatments.js` — live published treatments.
- `assets/js/pages/blog.js` — live published articles.
- `assets/js/pages/contact.js` — real appointment/enquiry submission.
- `assets/js/components/modal.js` — appointment modal submission.
- `components/appointment-modal.html` — consent, honeypot, status region.
- `components/navbar.html` — settings targets.
- `components/footer.html` — settings targets.
- `index.html`, `about.html`, `doctors.html`, `treatments.html`, `blog.html`, `contact.html`, `testimonials.html` — public loading/empty/error targets where required.
- `docs/architecture.md`, `docs/database.md`, `docs/api.md` — production Supabase documentation.

### Remove after replacement

- `assets/js/admin/admin-mock-data.js`
- all imports and tests that depend on local demo seeding or demo authentication.

---

## Task 1: Pin Tooling and Configure the Project

**Files:**

- Modify: `.env`
- Modify: `.env.example`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tests/supabase-config.test.mjs`
- Create: `supabase/config.toml`

- [ ] **Step 1: Write the failing environment/dependency test**

```js
// tests/supabase-config.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Supabase browser and CLI dependencies are exactly pinned', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.dependencies['@supabase/supabase-js'], '2.111.0');
  assert.equal(pkg.dependencies.dompurify, '3.4.12');
  assert.equal(pkg.devDependencies.supabase, '2.110.0');
});

test('environment example contains only safe public variable names', async () => {
  const example = await read('.env.example');
  assert.match(example, /^VITE_SUPABASE_URL=/m);
  assert.match(example, /^VITE_SUPABASE_PUBLISHABLE_KEY=/m);
  assert.doesNotMatch(example, /service_role|secret_key|database_password/i);
});

test('Supabase config targets the public schema and project migration directory', async () => {
  const config = await read('supabase/config.toml');
  assert.match(config, /project_id = "titanium-roots"/);
  assert.match(config, /schemas = \["public", "storage"\]/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --test tests/supabase-config.test.mjs
```

Expected: failure because the dependencies and configuration do not exist.

- [ ] **Step 3: Install exact dependencies**

Run:

```powershell
npm install --save-exact @supabase/supabase-js@2.111.0 dompurify@3.4.12
npm install --save-dev --save-exact supabase@2.110.0
npx supabase --help
```

Expected: dependency installation succeeds, the lockfile records exact versions, and the CLI help renders.

- [ ] **Step 4: Initialize Supabase configuration**

Run:

```powershell
npx supabase init
```

Set the generated configuration to:

```toml
project_id = "titanium-roots"

[api]
enabled = true
schemas = ["public", "storage"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
major_version = 17

[auth]
enabled = true
site_url = "http://localhost:5173"
additional_redirect_urls = [
  "http://localhost:5173/admin/reset-password.html",
  "http://127.0.0.1:5173/admin/reset-password.html"
]

[storage]
enabled = true
file_size_limit = "5MiB"
```

- [ ] **Step 5: Add safe and real environment files**

`.env.example`:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

`.env`:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<the user-provided publishable key>
```

Never add a service-role key, secret key, database password, personal access token, or admin password.

- [ ] **Step 6: Add repeatable scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "node scripts/fetch-seo.mjs && vite build",
    "preview": "vite preview",
    "test": "node --test",
    "test:live": "node tests/supabase-live-smoke.mjs",
    "supabase:status": "supabase status",
    "supabase:migrations": "supabase migration list"
  }
}
```

- [ ] **Step 7: Verify GREEN**

Run:

```powershell
node --test tests/supabase-config.test.mjs
```

Expected: all configuration tests pass.

---

## Task 2: Create the Database Migration Test-First

**Files:**

- Create: `tests/supabase-migration.test.mjs`
- Create: `supabase/migrations/<cli-generated>_titanium_cms.sql`

- [ ] **Step 1: Generate the migration filename through the CLI**

Run:

```powershell
npx supabase migration new titanium_cms
```

Expected: the CLI creates `supabase/migrations/<timestamp>_titanium_cms.sql`. Use that exact generated filename in every later command.

- [ ] **Step 2: Write the failing migration contract**

```js
// tests/supabase-migration.test.mjs
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const migrations = new URL('../supabase/migrations/', import.meta.url);
const requiredTables = [
  'cms_admins', 'doctors', 'treatments', 'blog_posts', 'testimonials',
  'gallery_items', 'seo_pages', 'site_settings', 'appointment_requests',
  'analytics_events', 'cms_audit_log',
];

async function sql() {
  const files = (await readdir(migrations)).filter((name) => name.endsWith('_titanium_cms.sql'));
  assert.equal(files.length, 1);
  return readFile(new URL(files[0], migrations), 'utf8');
}

test('migration creates every typed CMS table', async () => {
  const source = await sql();
  requiredTables.forEach((table) => {
    assert.match(source, new RegExp(`create table public\\\\.${table}\\\\b`, 'i'));
    assert.match(source, new RegExp(`alter table public\\\\.${table} enable row level security`, 'i'));
  });
});

test('migration uses explicit grants and constrained admin policies', async () => {
  const source = await sql();
  assert.match(source, /grant select on public\.doctors to anon, authenticated/i);
  assert.match(source, /grant insert on public\.appointment_requests to anon/i);
  assert.match(source, /for update[\s\S]+using[\s\S]+with check/i);
  assert.doesNotMatch(source, /auth\.role\(\)|user_metadata|security definer/i);
});

test('migration creates bounded media and Realtime configuration', async () => {
  const source = await sql();
  assert.match(source, /cms-media/);
  assert.match(source, /5242880/);
  assert.match(source, /image\/jpeg/);
  assert.match(source, /supabase_realtime/);
});

test('migration never seeds fake identities or private records', async () => {
  const source = await sql();
  assert.doesNotMatch(source, /Demo Appointment|Doctor Profile|Patient Display|Contributor Profile/i);
  assert.doesNotMatch(source, /service_role|database_password/i);
});
```

- [ ] **Step 3: Run the migration contract and verify RED**

Run:

```powershell
node --test tests/supabase-migration.test.mjs
```

Expected: failures for missing tables, policies, grants, bucket, and Realtime entries.

- [ ] **Step 4: Implement the migration schema**

The generated SQL file must contain the following executable structure. Expand the typed content columns exactly as shown; do not replace them with a generic JSON CMS table.

```sql
create extension if not exists pgcrypto;

create table public.cms_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (email = lower(email)),
  display_name text not null check (char_length(display_name) between 2 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  designation text not null,
  qualification text not null default '',
  additional_qualifications text not null default '',
  specialization text not null,
  specialties text[] not null default '{}',
  experience_years integer check (experience_years is null or experience_years >= 0),
  languages text[] not null default '{}',
  registration_number text not null default '',
  biography text not null default '',
  philosophy text not null default '',
  consultation text not null default '',
  availability text not null default '',
  portrait_path text,
  image_alt text not null default '',
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  sort_order integer not null default 1 check (sort_order >= 1),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.treatments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 140),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category text not null,
  short_description text not null check (char_length(short_description) between 20 and 240),
  full_description text not null default '',
  duration text not null default '',
  visits text not null default '',
  price numeric(12,2) check (price is null or price >= 0),
  pricing_status text not null default 'consultation_required'
    check (pricing_status in ('confirmed', 'consultation_required', 'pending_confirmation')),
  benefits text not null default '',
  suitability text not null default '',
  procedure_steps text not null default '',
  recovery text not null default '',
  image_path text,
  image_alt text not null default '',
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  sort_order integer not null default 1 check (sort_order >= 1),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category text not null,
  tags text[] not null default '{}',
  excerpt text not null check (char_length(excerpt) between 20 and 240),
  content_html text not null check (char_length(content_html) >= 20),
  image_path text,
  image_alt text not null default '',
  author_name text not null,
  publish_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  featured boolean not null default false,
  trending boolean not null default false,
  seo_title text not null default '' check (char_length(seo_title) <= 60),
  seo_description text not null default '' check (char_length(seo_description) <= 160),
  sort_order integer not null default 1 check (sort_order >= 1),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 80),
  treatment_label text not null default '',
  rating integer not null check (rating between 1 and 5),
  review text not null check (char_length(review) between 10 and 1000),
  image_path text,
  source text not null default 'website',
  consent_status text not null default 'pending'
    check (consent_status in ('pending', 'confirmed', 'not_provided')),
  consent_at timestamptz,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  status text not null default 'unpublished'
    check (status in ('published', 'unpublished')),
  featured boolean not null default false,
  sort_order integer not null default 1 check (sort_order >= 1),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonial_publish_guard check (
    status <> 'published'
    or (moderation_status = 'approved' and consent_status = 'confirmed' and consent_at is not null)
  )
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  filename text not null,
  storage_path text not null unique,
  category text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/svg+xml')),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  alt_text text not null,
  usage_description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  sort_order integer not null default 1 check (sort_order >= 1),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  route text not null unique check (route like '/%'),
  meta_title text not null check (char_length(meta_title) <= 60),
  meta_description text not null check (char_length(meta_description) <= 160),
  canonical_url text not null,
  og_title text not null check (char_length(og_title) <= 60),
  og_description text not null check (char_length(og_description) <= 160),
  og_image_path text,
  should_index boolean not null default true,
  should_follow boolean not null default true,
  include_in_sitemap boolean not null default true,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id text primary key default 'primary' check (id = 'primary'),
  clinic_identity jsonb not null default '{}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  clinic_hours jsonb not null default '{}'::jsonb,
  message_templates jsonb not null default '{}'::jsonb,
  homepage jsonb not null default '{}'::jsonb,
  footer jsonb not null default '{}'::jsonb,
  feature_flags jsonb not null default '{}'::jsonb,
  brand jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 120),
  phone text not null check (char_length(phone) between 8 and 24),
  email text check (email is null or char_length(email) <= 254),
  enquiry_type text not null check (enquiry_type in ('appointment', 'general', 'callback', 'whatsapp')),
  treatment_id uuid references public.treatments(id) on delete set null,
  treatment_label text not null default '',
  doctor_id uuid references public.doctors(id) on delete set null,
  doctor_label text not null default '',
  preferred_date date,
  source text not null check (source in ('website', 'contact', 'whatsapp', 'phone', 'email')),
  consent boolean not null check (consent),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'appointment_pending', 'confirmed', 'completed', 'closed')),
  notes text not null default '',
  status_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analytics_events (
  id bigint generated by default as identity primary key,
  event_type text not null check (
    event_type in ('page_view', 'cta_click', 'whatsapp_click', 'phone_click', 'appointment_submit')
  ),
  page_path text not null check (page_path like '/%' and char_length(page_path) <= 200),
  referrer_domain text not null default '' check (char_length(referrer_domain) <= 180),
  created_at timestamptz not null default now()
);

create table public.cms_audit_log (
  id bigint generated by default as identity primary key,
  administrator_id uuid not null references auth.users(id),
  action text not null check (action in ('insert', 'update', 'delete', 'publish', 'unpublish', 'approve', 'reject')),
  table_name text not null check (
    table_name in ('doctors', 'treatments', 'blog_posts', 'testimonials', 'gallery_items', 'seo_pages', 'site_settings', 'appointment_requests')
  ),
  record_id uuid,
  summary text not null check (char_length(summary) <= 240),
  created_at timestamptz not null default now()
);
```

- [ ] **Step 5: Add indexes, timestamp trigger, and safe admin helper**

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

revoke all on function public.is_cms_admin() from public;
grant execute on function public.is_cms_admin() to authenticated;

create index doctors_public_idx on public.doctors (status, featured, sort_order);
create index treatments_public_idx on public.treatments (status, featured, sort_order);
create index blog_posts_public_idx on public.blog_posts (status, publish_at desc);
create index testimonials_public_idx on public.testimonials (status, moderation_status, consent_status, sort_order);
create index gallery_items_public_idx on public.gallery_items (status, category, sort_order);
create index appointments_admin_idx on public.appointment_requests (status, created_at desc);
create index analytics_time_idx on public.analytics_events (created_at desc, event_type);
create index audit_time_idx on public.cms_audit_log (created_at desc);

create trigger doctors_updated_at before update on public.doctors
for each row execute function public.set_updated_at();
create trigger treatments_updated_at before update on public.treatments
for each row execute function public.set_updated_at();
create trigger blog_posts_updated_at before update on public.blog_posts
for each row execute function public.set_updated_at();
create trigger testimonials_updated_at before update on public.testimonials
for each row execute function public.set_updated_at();
create trigger gallery_items_updated_at before update on public.gallery_items
for each row execute function public.set_updated_at();
create trigger seo_pages_updated_at before update on public.seo_pages
for each row execute function public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointment_requests
for each row execute function public.set_updated_at();
create trigger cms_admins_updated_at before update on public.cms_admins
for each row execute function public.set_updated_at();
```

- [ ] **Step 6: Add explicit grants and RLS policies**

```sql
alter table public.cms_admins enable row level security;
alter table public.doctors enable row level security;
alter table public.treatments enable row level security;
alter table public.blog_posts enable row level security;
alter table public.testimonials enable row level security;
alter table public.gallery_items enable row level security;
alter table public.seo_pages enable row level security;
alter table public.site_settings enable row level security;
alter table public.appointment_requests enable row level security;
alter table public.analytics_events enable row level security;
alter table public.cms_audit_log enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.doctors, public.treatments, public.blog_posts,
  public.testimonials, public.gallery_items, public.seo_pages,
  public.site_settings to anon, authenticated;
grant insert on public.appointment_requests, public.analytics_events to anon;
grant select, insert, update, delete on public.doctors, public.treatments,
  public.blog_posts, public.testimonials, public.gallery_items,
  public.seo_pages, public.site_settings, public.appointment_requests to authenticated;
grant select on public.analytics_events to authenticated;
grant select, insert on public.cms_audit_log to authenticated;
grant select on public.cms_admins to authenticated;
grant usage, select on sequence public.analytics_events_id_seq to anon, authenticated;
grant usage, select on sequence public.cms_audit_log_id_seq to authenticated;

create policy cms_admins_select_self on public.cms_admins
for select to authenticated
using ((select auth.uid()) = user_id);

create policy doctors_public_read on public.doctors
for select to anon, authenticated using (status = 'published');
create policy treatments_public_read on public.treatments
for select to anon, authenticated using (status = 'published');
create policy blog_posts_public_read on public.blog_posts
for select to anon, authenticated
using (status = 'published' and publish_at is not null and publish_at <= now());
create policy testimonials_public_read on public.testimonials
for select to anon, authenticated
using (
  status = 'published'
  and moderation_status = 'approved'
  and consent_status = 'confirmed'
  and consent_at is not null
);
create policy gallery_public_read on public.gallery_items
for select to anon, authenticated using (status = 'published');
create policy seo_public_read on public.seo_pages
for select to anon, authenticated using (true);
create policy settings_public_read on public.site_settings
for select to anon, authenticated using (id = 'primary');

create policy appointment_public_insert on public.appointment_requests
for insert to anon
with check (
  status = 'new'
  and notes = ''
  and consent
  and jsonb_array_length(status_history) <= 1
);

create policy analytics_public_insert on public.analytics_events
for insert to anon
with check (
  event_type in ('page_view', 'cta_click', 'whatsapp_click', 'phone_click', 'appointment_submit')
  and page_path like '/%'
);

create policy doctors_admin_all on public.doctors
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy treatments_admin_all on public.treatments
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy blogs_admin_all on public.blog_posts
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy testimonials_admin_all on public.testimonials
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy gallery_admin_all on public.gallery_items
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy seo_admin_all on public.seo_pages
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy settings_admin_all on public.site_settings
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy appointments_admin_all on public.appointment_requests
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
create policy analytics_admin_read on public.analytics_events
for select to authenticated using (public.is_cms_admin());
create policy audit_admin_read on public.cms_audit_log
for select to authenticated using (public.is_cms_admin());
create policy audit_admin_insert on public.cms_audit_log
for insert to authenticated
with check (public.is_cms_admin() and administrator_id = (select auth.uid()));
```

- [ ] **Step 7: Add Storage and Realtime**

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy cms_media_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'cms-media');
create policy cms_media_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'cms-media' and public.is_cms_admin());
create policy cms_media_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'cms-media' and public.is_cms_admin())
with check (bucket_id = 'cms-media' and public.is_cms_admin());
create policy cms_media_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'cms-media' and public.is_cms_admin());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'doctors', 'treatments', 'blog_posts', 'testimonials',
    'gallery_items', 'seo_pages', 'site_settings'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$$;
```

- [ ] **Step 8: Seed only approved clinic content**

Insert:

- the verified clinic identity, address, phone numbers, email addresses, WhatsApp number, hours, social placeholders as empty strings, and brand colors into `site_settings`;
- route rows for `/`, `/about.html`, `/doctors.html`, `/treatments.html`, `/blog.html`, `/testimonials.html`, and `/contact.html`;
- published treatments only for General Dentistry, Cosmetic Dentistry, Dental Implants, Orthodontics, Root Canal Treatment, and Teeth Whitening, using the current public-page descriptions after removing all “demo”, “temporary”, “pending confirmation”, and placeholder wording.

The seed SQL must contain:

```sql
insert into public.site_settings (
  id, clinic_identity, contact, social_links, clinic_hours,
  message_templates, homepage, footer, feature_flags, brand
) values (
  'primary',
  '{"clinicName":"Titanium Roots Dental Clinic","shortName":"Titanium Roots"}',
  '{"primaryPhone":"+91 98765 43210","alternatePhone":"+91 44 2345 6789","whatsapp":"+91 98765 43210","email":"info@titaniumroots.com","appointmentEmail":"appointments@titaniumroots.com","address":"123, Dental Care Street, Anna Nagar, Chennai, Tamil Nadu - 600001"}',
  '{}',
  '{"Monday":"9:00 AM - 8:00 PM","Tuesday":"9:00 AM - 8:00 PM","Wednesday":"9:00 AM - 8:00 PM","Thursday":"9:00 AM - 8:00 PM","Friday":"9:00 AM - 8:00 PM","Saturday":"9:00 AM - 6:00 PM","Sunday":"10:00 AM - 4:00 PM"}',
  '{"appointment":"Hello, I would like to book a dental appointment.","enquiry":"Hello, I have a question about dental care."}',
  '{"featuredTreatmentCount":6,"featuredDoctorCount":4}',
  '{"description":"Advanced dental care in a comfortable environment. Your smile is our passion.","copyright":"© Titanium Roots Dental Clinic. All rights reserved."}',
  '{"newsletter":false,"maintenanceMode":false}',
  '{"primaryEmerald":"#2f5f49","supportingSage":"#7e9e8c","backgroundIvory":"#f8f4eb","accentChampagne":"#c3a260"}'
)
on conflict (id) do update set
  clinic_identity = excluded.clinic_identity,
  contact = excluded.contact,
  social_links = excluded.social_links,
  clinic_hours = excluded.clinic_hours,
  message_templates = excluded.message_templates,
  homepage = excluded.homepage,
  footer = excluded.footer,
  feature_flags = excluded.feature_flags,
  brand = excluded.brand;
```

- [ ] **Step 9: Verify migration contract GREEN**

Run:

```powershell
node --test tests/supabase-migration.test.mjs
```

Expected: all migration tests pass.

---

## Task 3: Apply and Verify the Live Project Schema

**External scope:** Connected Supabase project `pqvhwlflwodbpcmpzetk`.

- [ ] **Step 1: Reconfirm the project is empty**

Use `SUPABASE_LIST_TABLES` for schema `public`.

Expected: zero tables immediately before the first migration.

- [ ] **Step 2: Apply the reviewed migration**

Execute the exact generated SQL file through the connected Supabase SQL execution tool with write mode enabled. Split only at transaction-safe boundaries if the provider timeout requires it:

1. extensions, tables, constraints, indexes and triggers;
2. grants and RLS policies;
3. Storage bucket and policies;
4. Realtime publication entries;
5. approved seed content.

Do not call a migration-history mutation tool while iterating. After the final SQL is verified, record the exact SQL file locally as the source of truth.

- [ ] **Step 3: Verify table schemas**

Use `SUPABASE_LIST_TABLES`, then `SUPABASE_GET_TABLE_SCHEMAS` for the eleven application tables.

Expected:

- 11 public tables;
- primary keys and constraints present;
- indexes present;
- `cms_admins.user_id` references `auth.users.id`;
- appointment foreign keys use `on delete set null`.

- [ ] **Step 4: Verify grants and RLS through catalog queries**

Run read-only SQL:

```sql
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  array_agg(distinct p.polname) filter (where p.polname is not null) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relname;
```

Expected: every application table has `rls_enabled = true` and the intended policies.

- [ ] **Step 5: Verify Storage and Realtime**

Use the bucket listing tool and read-only SQL:

```sql
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by schemaname, tablename;
```

Expected: `cms-media` exists and the seven public content tables are in the Realtime publication.

- [ ] **Step 6: Run security advisors**

Use `SUPABASE_GET_SECURITY_ADVISORS`.

Expected: no unresolved error-level RLS, grant, function, or Storage findings.

---

## Task 4: Build the Supabase Client, Mappers, and Repository Contracts

**Files:**

- Create: `assets/js/data/supabase-client.js`
- Create: `assets/js/data/data-errors.js`
- Create: `assets/js/data/record-mappers.js`
- Create: `assets/js/data/auth-repository.js`
- Create: `assets/js/data/cms-repository.js`
- Create: `assets/js/data/public-content-repository.js`
- Create: `assets/js/data/appointments-repository.js`
- Create: `assets/js/data/media-repository.js`
- Create: `assets/js/data/analytics-repository.js`
- Create: `assets/js/data/index.js`
- Create: `tests/supabase-data.test.mjs`

- [ ] **Step 1: Write failing data-layer tests**

```js
// tests/supabase-data.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapDoctorFromDatabase,
  mapTreatmentToDatabase,
  normalizeAppointmentPayload,
  sanitizeCmsHtml,
  storagePathFor,
} from '../assets/js/data/record-mappers.js';

test('database records map to existing UI property names', () => {
  const doctor = mapDoctorFromDatabase({
    id: 'd1', name: 'Dr Example', specialization: 'Dentistry',
    experience_years: 8, portrait_path: 'doctors/d1/photo.webp',
    image_alt: 'Portrait', sort_order: 2,
  });
  assert.equal(doctor.experience, 8);
  assert.equal(doctor.portrait, 'doctors/d1/photo.webp');
  assert.equal(doctor.sortOrder, 2);
});

test('treatment writes remove display-only and empty numeric values', () => {
  const row = mapTreatmentToDatabase({ name: 'Care', price: '', sortOrder: 1, displayLabel: 'x' });
  assert.equal(row.price, null);
  assert.equal(row.sort_order, 1);
  assert.equal('displayLabel' in row, false);
});

test('appointment payload discards private/admin fields', () => {
  const row = normalizeAppointmentPayload({
    name: 'Site Visitor', phone: '+91 90000 00000', consent: true,
    status: 'completed', notes: 'must not pass', source: 'contact',
  });
  assert.equal(row.status, 'new');
  assert.equal(row.notes, '');
  assert.equal(row.display_name, 'Site Visitor');
});

test('CMS HTML removes executable markup', () => {
  assert.doesNotMatch(sanitizeCmsHtml('<p onclick="x()">Safe</p><script>x()</script>'), /script|onclick/i);
});

test('storage paths are deterministic and do not trust raw filenames', () => {
  assert.equal(storagePathFor('doctors', 'abc', 'My Photo.WEBP'), 'doctors/abc/my-photo.webp');
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
node --test tests/supabase-data.test.mjs
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement the validated shared client**

```js
// assets/js/data/supabase-client.js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigured = Boolean(url && publishableKey);

export const supabase = supabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Titanium Roots data service is not configured.');
  return supabase;
}
```

- [ ] **Step 4: Implement stable data errors**

```js
// assets/js/data/data-errors.js
export class DataError extends Error {
  constructor(message, { code = 'DATA_ERROR', retryable = false, cause } = {}) {
    super(message, { cause });
    this.name = 'DataError';
    this.code = code;
    this.retryable = retryable;
  }
}

export function throwIfError(error, fallback) {
  if (!error) return;
  throw new DataError(error.message || fallback, {
    code: error.code || 'SUPABASE_ERROR',
    retryable: ['PGRST000', 'PGRST001', 'PGRST002'].includes(error.code),
    cause: error,
  });
}
```

- [ ] **Step 5: Implement mappers and sanitization**

Use DOMPurify with an explicit tag/attribute allow list:

```js
import DOMPurify from 'dompurify';

export function sanitizeCmsHtml(value = '') {
  return DOMPurify.sanitize(String(value), {
    ALLOWED_TAGS: ['p', 'br', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'rel', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}
```

Add two-direction mappers for every admin collection. Public output must retain the camelCase fields currently consumed by page renderers.

- [ ] **Step 6: Implement repositories**

The generic CMS repository contract:

```js
export async function listAdminRecords(table, { order = 'sort_order', ascending = true } = {}) {
  const client = requireSupabase();
  const { data, error } = await client.from(table).select('*').order(order, { ascending });
  throwIfError(error, `Unable to load ${table}.`);
  return data ?? [];
}

export async function saveAdminRecord(table, row) {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new DataError('Your session has expired.', { code: 'AUTH_REQUIRED' });
  const next = { ...row, updated_by: user.id };
  if (!next.id) next.created_by = user.id;
  const { data, error } = await client.from(table).upsert(next).select().single();
  throwIfError(error, `Unable to save ${table}.`);
  return data;
}
```

Appointment public insertion must construct the payload through `normalizeAppointmentPayload()` and never pass arbitrary form keys.

Media upload must use `cms-media`, validate 5 MB and MIME type before upload, and remove a newly uploaded object when record persistence fails.

Analytics insertion must pass only `event_type`, `page_path`, and `referrer_domain`.

- [ ] **Step 7: Verify data-layer tests GREEN**

Run:

```powershell
node --test tests/supabase-data.test.mjs
```

Expected: all mapper, payload, sanitizer, path, and repository contract tests pass.

---

## Task 5: Bootstrap the Administrator and Replace Demo Authentication

**Files:**

- Modify: `admin/login.html`
- Create: `admin/reset-password.html`
- Create: `assets/js/pages/admin-reset-password.js`
- Replace: `assets/js/admin/admin-auth.js`
- Modify: `assets/js/admin/admin-shell.js`
- Modify: `assets/css/pages/admin.css`
- Modify: `vite.config.js`
- Create: `tests/admin-auth-production.test.mjs`

- [ ] **Step 1: Write failing production-auth tests**

```js
// tests/admin-auth-production.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('admin authentication uses Supabase and contains no demo credential acceptance', async () => {
  const auth = await read('assets/js/admin/admin-auth.js');
  assert.match(auth, /signInWithPassword|getUser|isCmsAdmin/);
  assert.match(auth, /signOut/);
  assert.doesNotMatch(auth, /loginDemo|getDemoSession|sessionStorage|six-character demo/i);
});

test('login has recovery but no signup', async () => {
  const login = await read('admin/login.html');
  assert.match(login, /data-forgot-password/);
  assert.doesNotMatch(login, /sign up|register/i);
  assert.ok((await read('admin/reset-password.html')).includes('data-admin-reset-form'));
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```powershell
node --test tests/admin-auth-production.test.mjs
```

Expected: failures because demo auth remains and the reset route is missing.

- [ ] **Step 3: Bootstrap the Auth user safely**

Use the publishable client to call `signUp()` once with:

- email: `admin@titaniumroots.com`;
- a cryptographically generated one-time password held only in process memory;
- email redirect to `/admin/reset-password.html`.

Immediately call `resetPasswordForEmail()` for the same address and discard the generated password. If public signups are disabled, stop and have the project owner use Supabase Dashboard → Authentication → Users → Add user → Send invitation.

After the Auth user exists, execute:

```sql
insert into public.cms_admins (user_id, email, display_name)
select id, lower(email), 'Clinic Administrator'
from auth.users
where lower(email) = 'admin@titaniumroots.com'
on conflict (user_id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  is_active = true;
```

Verify with a read-only count query that exactly one active membership exists. Never retrieve or log encrypted password fields, access tokens, refresh tokens, or raw Auth metadata.

- [ ] **Step 4: Implement the production auth adapter**

```js
// assets/js/admin/admin-auth.js
import { supabase, requireSupabase } from '../data/supabase-client.js';
import { throwIfError } from '../data/data-errors.js';

export async function loginAdmin({ email, password }) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  throwIfError(error, 'Unable to sign in.');
  if (!(await isCmsAdmin(data.user))) {
    await requireSupabase().auth.signOut();
    throw new Error('This account is not authorized for the clinic CMS.');
  }
  return data.user;
}

export async function isCmsAdmin(user) {
  if (!user) return false;
  const { data, error } = await requireSupabase()
    .from('cms_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  return !error && Boolean(data);
}

export async function requireAdmin({ redirect = true } = {}) {
  const { data, error } = await requireSupabase().auth.getUser();
  const allowed = !error && await isCmsAdmin(data.user);
  if (!allowed && redirect) window.location.replace('/admin/login.html');
  return allowed ? data.user : null;
}

export async function logoutAdmin() {
  await requireSupabase().auth.signOut();
  window.location.replace('/admin/login.html');
}

export async function requestPasswordReset(email) {
  return requireSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin/reset-password.html`,
  });
}

export function subscribeToAuth(callback) {
  return supabase?.auth.onAuthStateChange(callback).data.subscription;
}
```

- [ ] **Step 5: Update login and password reset**

Login submits asynchronously, shows sanitized Auth errors, disables duplicate submissions, and sends password-reset email through `requestPasswordReset()`.

Reset page:

```js
const form = document.querySelector('[data-admin-reset-form]');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = form.elements.password.value;
  const confirmation = form.elements.confirmation.value;
  if (password.length < 12 || password !== confirmation) {
    showStatus('Use at least 12 characters and make both passwords match.', 'error');
    return;
  }
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) {
    showStatus(error.message, 'error');
    return;
  }
  window.location.replace('/admin/dashboard.html');
});
```

- [ ] **Step 6: Update shell identity and logout**

Render the authenticated user email/display name from `requireAdmin()`. Replace every `logoutDemo` reference with `logoutAdmin()`. Unsubscribe from Auth state changes during `pagehide`.

- [ ] **Step 7: Verify GREEN**

Run:

```powershell
node --test tests/admin-auth-production.test.mjs
npm run build
```

Expected: auth tests and production build pass.

---

## Task 6: Replace the Admin Demo Store with Async Supabase CRUD

**Files:**

- Replace: `assets/js/admin/admin-store.js`
- Modify: `assets/js/admin/admin-app.js`
- Modify: `assets/js/admin/admin-form.js`
- Modify: `assets/js/admin/admin-table.js`
- Modify: `assets/js/admin/admin-shell.js`
- Remove: `assets/js/admin/admin-mock-data.js`
- Create: `tests/admin-production.test.mjs`

- [ ] **Step 1: Write failing admin-production tests**

```js
// tests/admin-production.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const adminFiles = [
  'assets/js/admin/admin-app.js',
  'assets/js/admin/admin-store.js',
  'components/admin-header.html',
  'components/admin-sidebar.html',
  ...['dashboard', 'appointments', 'doctors', 'treatments', 'blogs', 'testimonials', 'gallery', 'seo', 'settings', 'analytics']
    .map((page) => `admin/${page}.html`),
];

test('admin implementation contains no demo store or fabricated UI copy', async () => {
  const source = (await Promise.all(adminFiles.map(read))).join('\n');
  assert.doesNotMatch(source, /frontend demo|demonstration data|mock asset|reset demo|Demo Appointment|not connected/i);
  assert.doesNotMatch(source, /localStorage|admin-mock-data/);
});

test('admin store delegates to asynchronous repositories', async () => {
  const store = await read('assets/js/admin/admin-store.js');
  assert.match(store, /listAdminRecords|saveAdminRecord|deleteAdminRecord/);
  assert.match(store, /async function|async \(/);
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```powershell
node --test tests/admin-production.test.mjs
```

Expected: failures for demo wording, localStorage, mock imports, and synchronous store.

- [ ] **Step 3: Implement the compatibility adapter**

Map existing admin collection names to table names:

```js
const TABLES = Object.freeze({
  appointments: 'appointment_requests',
  doctors: 'doctors',
  treatments: 'treatments',
  blogs: 'blog_posts',
  testimonials: 'testimonials',
  gallery: 'gallery_items',
  seo: 'seo_pages',
});
```

Every exported store method becomes asynchronous and delegates to repositories. Remove seeding, reset, schema-version, local storage and mock imports.

- [ ] **Step 4: Convert admin controllers to async**

Required behavior:

- `initializeAdminApp()` awaits `requireAdmin()`.
- controllers render a skeleton before queries;
- table managers await the first collection;
- save/delete/publish/approve/feature/order actions await database mutations;
- failed mutations preserve form state and show an error toast;
- appointments use real rows and no report metadata field;
- dashboard counts come from loaded table counts;
- analytics aggregate actual `analytics_events` and appointment rows;
- activity reads `cms_audit_log`;
- settings use the `primary` row;
- SEO uses `seo_pages`;
- gallery uses real Storage paths.

The controller registry becomes:

```js
const controllers = {
  dashboard: renderDashboard,
  appointments: (root) => renderManager(root, 'appointments'),
  doctors: (root) => renderManager(root, 'doctors'),
  treatments: (root) => renderManager(root, 'treatments'),
  blogs: (root) => renderManager(root, 'blogs'),
  testimonials: (root) => renderManager(root, 'testimonials'),
  gallery: (root) => renderManager(root, 'gallery'),
  seo: renderSeo,
  settings: renderSettings,
  analytics: renderAnalytics,
};

await controllers[page](root);
```

- [ ] **Step 5: Make the form drawer await saves**

```js
submitButton.disabled = true;
submitButton.dataset.loading = 'true';
status.textContent = 'Saving…';
try {
  const result = await onSave?.({ ...record, ...values });
  if (result === false) return;
  dirty = false;
  await closeDrawer(true);
} catch (error) {
  status.textContent = error.message || 'Unable to save. Please try again.';
  status.focus();
} finally {
  submitButton.disabled = false;
  delete submitButton.dataset.loading;
}
```

- [ ] **Step 6: Remove demo artifacts**

Delete `admin-mock-data.js`. Remove:

- demo banners;
- reset-demo buttons;
- fabricated dashboard arrays;
- mock URL copy;
- report metadata;
- fake notification button;
- disabled fake export.

Implement CSV export from currently loaded real analytics/appointment rows where export remains.

- [ ] **Step 7: Verify GREEN**

Run:

```powershell
node --test tests/admin-production.test.mjs
npm test
npm run build
```

Expected: all tests and build pass.

---

## Task 7: Add the Public Content Store and Realtime

**Files:**

- Create: `assets/js/data/public-content-store.js`
- Modify: `assets/js/data/public-content-repository.js`
- Create: `tests/public-cms-integration.test.mjs`

- [ ] **Step 1: Write failing public-store tests**

```js
// tests/public-cms-integration.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('public pages consume the shared content store', async () => {
  for (const page of ['home', 'about', 'doctors', 'treatments', 'blog']) {
    const source = await read(`assets/js/pages/${page}.js`);
    assert.match(source, /public-content-store|loadPublicContent/);
  }
});

test('hard-coded CMS arrays are removed from public page modules', async () => {
  const home = await read('assets/js/pages/home.js');
  const doctors = await read('assets/js/pages/doctors.js');
  const treatments = await read('assets/js/pages/treatments.js');
  assert.doesNotMatch(home, /const featuredTreatments = \[|const featuredDoctors = Array\.from|const testimonials = Array\.from|const latestBlogs = \[/);
  assert.doesNotMatch(doctors, /const doctors = doctorIds\.map/);
  assert.doesNotMatch(treatments, /const treatments = \[/);
});

test('the public content store subscribes and cleans up Realtime channels', async () => {
  const source = await read('assets/js/data/public-content-store.js');
  assert.match(source, /postgres_changes/);
  assert.match(source, /removeChannel|unsubscribe/);
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```powershell
node --test tests/public-cms-integration.test.mjs
```

Expected: failures for missing shared store and hard-coded arrays.

- [ ] **Step 3: Implement the public repository**

Use explicit selects, publication filters, and stable ordering:

```js
export async function fetchPublicCollection(name) {
  const query = {
    doctors: () => client.from('doctors').select('*').eq('status', 'published').order('sort_order'),
    treatments: () => client.from('treatments').select('*').eq('status', 'published').order('sort_order'),
    blogs: () => client.from('blog_posts').select('*').eq('status', 'published').lte('publish_at', new Date().toISOString()).order('publish_at', { ascending: false }),
    testimonials: () => client.from('testimonials').select('*').eq('status', 'published').eq('moderation_status', 'approved').eq('consent_status', 'confirmed').order('sort_order'),
    gallery: () => client.from('gallery_items').select('*').eq('status', 'published').order('sort_order'),
    seo: () => client.from('seo_pages').select('*').order('route'),
    settings: () => client.from('site_settings').select('*').eq('id', 'primary').single(),
  }[name];
  if (!query) throw new DataError(`Unknown public collection: ${name}`);
  const { data, error } = await query();
  throwIfError(error, `Unable to load ${name}.`);
  return mapPublicResult(name, data);
}
```

- [ ] **Step 4: Implement store fetch and Realtime invalidation**

```js
const state = new Map();
const listeners = new Set();
const channels = new Map();

export async function loadPublicContent(name, { force = false } = {}) {
  if (!force && state.get(name)?.status === 'ready') return state.get(name).data;
  state.set(name, { status: 'loading', data: state.get(name)?.data ?? null, error: null });
  notify(name);
  try {
    const data = await fetchPublicCollection(name);
    state.set(name, { status: 'ready', data, error: null });
    notify(name);
    return data;
  } catch (error) {
    state.set(name, { status: 'error', data: state.get(name)?.data ?? null, error });
    notify(name);
    throw error;
  }
}

export function subscribePublicContent(name) {
  if (channels.has(name)) return channels.get(name);
  const table = PUBLIC_TABLES[name];
  const channel = requireSupabase()
    .channel(`public-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      loadPublicContent(name, { force: true }).catch(() => {});
    })
    .subscribe();
  channels.set(name, channel);
  return channel;
}

export async function disposePublicContent() {
  await Promise.all([...channels.values()].map((channel) => requireSupabase().removeChannel(channel)));
  channels.clear();
  listeners.clear();
}
```

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
node --test tests/public-cms-integration.test.mjs
```

Expected: all public-store tests pass.

---

## Task 8: Wire Public Pages to Live Content and Settings

**Files:**

- Modify: `assets/js/app.js`
- Modify: `assets/js/pages/home.js`
- Modify: `assets/js/pages/about.js`
- Modify: `assets/js/pages/doctors.js`
- Modify: `assets/js/pages/treatments.js`
- Modify: `assets/js/pages/blog.js`
- Modify: `assets/js/pages/contact.js`
- Modify: `components/navbar.html`
- Modify: `components/footer.html`
- Modify: public HTML pages listed in the file map.

- [ ] **Step 1: Add failing render-contract tests**

Extend `tests/public-cms-integration.test.mjs`:

```js
test('public rendering uses escaped or sanitized CMS fields', async () => {
  const files = await Promise.all(['home', 'about', 'doctors', 'treatments', 'blog'].map((page) => read(`assets/js/pages/${page}.js`)));
  files.forEach((source) => assert.match(source, /escapeHtml|sanitizeCmsHtml/));
});

test('settings target global contact and brand elements', async () => {
  const app = await read('assets/js/app.js');
  const footer = await read('components/footer.html');
  assert.match(app, /applyPublicSettings/);
  assert.match(footer, /data-setting-/);
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```powershell
node --test tests/public-cms-integration.test.mjs
```

Expected: failures for missing sanitization/settings integration.

- [ ] **Step 3: Make page initializers asynchronous**

Each initializer:

1. marks the page initialized;
2. renders a compact skeleton;
3. awaits required collections;
4. renders ready or empty state;
5. attaches existing interactions after rendering;
6. subscribes to store updates;
7. removes the subscription on `pagehide`.

Example:

```js
export async function initializeDoctors() {
  if (document.body.dataset.doctorsInitialized) return;
  document.body.dataset.doctorsInitialized = 'true';
  renderDoctorsLoading();
  try {
    doctors = await loadPublicContent('doctors');
    renderFeatured();
    renderFilters();
    renderDirectory();
    renderAvailability();
    subscribePublicContent('doctors');
  } catch {
    renderDoctorsError();
  }
  bindInteractions();
  createIcons({ icons: ICON_SET });
}
```

- [ ] **Step 4: Replace hard-coded content**

- Home uses featured doctors/treatments/testimonials and latest blogs.
- About uses public settings and featured doctors.
- Doctors uses the doctors collection.
- Treatments uses the treatments collection.
- Blog uses the blog collection.
- Contact uses site settings and clinic hours.

If doctors, blogs or testimonials are empty, hide promotional carousels and show a polished message without inventing identities or reviews.

- [ ] **Step 5: Apply global settings**

Implement `applyPublicSettings(settings)` in `assets/js/app.js` to update elements marked:

```html
<span data-setting-clinic-name></span>
<a data-setting-phone></a>
<a data-setting-email></a>
<a data-setting-whatsapp></a>
<span data-setting-address></span>
<span data-setting-copyright></span>
```

Set URLs using validated `tel:`, `mailto:` and `https://wa.me/` builders; never assign arbitrary `javascript:` or data URLs.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
npm test
npm run build
```

Expected: public integration tests and build pass.

---

## Task 9: Connect Appointment Forms and Real Analytics

**Files:**

- Modify: `components/appointment-modal.html`
- Modify: `assets/js/components/modal.js`
- Modify: `assets/js/pages/contact.js`
- Modify: `assets/js/app.js`
- Modify: `assets/js/admin/admin-app.js`
- Create/modify: `tests/public-submission.test.mjs`

- [ ] **Step 1: Write failing payload and UI tests**

```js
// tests/public-submission.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('public forms submit through appointment repository with consent and spam controls', async () => {
  const modal = await read('components/appointment-modal.html');
  const controller = await read('assets/js/components/modal.js');
  assert.match(modal, /name="consent".*required/s);
  assert.match(modal, /name="website".*tabindex="-1"/s);
  assert.match(controller, /submitAppointmentRequest/);
});

test('analytics sends only bounded event fields', async () => {
  const source = await read('assets/js/data/analytics-repository.js');
  assert.match(source, /event_type.*page_path.*referrer_domain/s);
  assert.doesNotMatch(source, /email|phone|name|fingerprint|userAgent/i);
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```powershell
node --test tests/public-submission.test.mjs
```

Expected: missing consent/spam controls and submission integration.

- [ ] **Step 3: Implement public form submission**

Both forms:

- include a required consent checkbox;
- include hidden honeypot `website`;
- record `performance.now()` when opened;
- silently reject a non-empty honeypot;
- reject submissions made in under 1.5 seconds;
- disable the submit button while pending;
- preserve user input on failure;
- reset only after a confirmed insert;
- record `appointment_submit` only after success.

```js
const payload = {
  name: form.elements.name.value,
  phone: form.elements.phone.value,
  email: form.elements.email.value,
  enquiryType: form.elements.enquiryType.value,
  treatmentId: selectedTreatmentId || null,
  treatmentLabel: form.elements.treatment.value,
  doctorId: selectedDoctorId || null,
  doctorLabel: form.elements.doctor.value,
  preferredDate: form.elements.preferredDate.value || null,
  source: 'website',
  consent: form.elements.consent.checked,
};
await submitAppointmentRequest(payload);
```

- [ ] **Step 4: Implement bounded analytics**

Record:

- one `page_view` after public initialization;
- CTA clicks through delegated listeners;
- phone/WhatsApp clicks;
- successful appointment submission.

Referrer processing:

```js
function referrerDomain() {
  try {
    return document.referrer ? new URL(document.referrer).hostname.slice(0, 180) : '';
  } catch {
    return '';
  }
}
```

Never store query strings, form values, names, email addresses, phone numbers, free text, user agents or fingerprints.

- [ ] **Step 5: Update admin analytics**

Aggregate actual event rows by date/type and actual appointment rows by status. Render zero values honestly. CSV export includes only aggregate columns.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
node --test tests/public-submission.test.mjs
npm test
```

Expected: submission and analytics tests pass.

---

## Task 10: Connect Gallery Uploads and Media Rendering

**Files:**

- Modify: `assets/js/data/media-repository.js`
- Modify: `assets/js/admin/admin-form.js`
- Modify: `assets/js/admin/admin-app.js`
- Modify: public page renderers that display CMS media.
- Create/modify: `tests/media-integration.test.mjs`

- [ ] **Step 1: Write failing media lifecycle tests**

```js
test('media repository validates and supports upload replacement cleanup', async () => {
  const source = await read('assets/js/data/media-repository.js');
  assert.match(source, /5242880/);
  assert.match(source, /image\/jpeg.*image\/png.*image\/webp/s);
  assert.match(source, /\.storage\.from\('cms-media'\)\.upload/);
  assert.match(source, /\.storage\.from\('cms-media'\)\.remove/);
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```powershell
node --test tests/media-integration.test.mjs
```

Expected: missing upload/removal lifecycle.

- [ ] **Step 3: Implement file validation and upload**

```js
const STANDARD_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BRAND_IMAGE_TYPES = new Set([...STANDARD_IMAGE_TYPES, 'image/svg+xml']);
const MAX_BYTES = 5 * 1024 * 1024;

export function validateCmsMedia(file, { allowSvg = false } = {}) {
  const allowed = allowSvg ? BRAND_IMAGE_TYPES : STANDARD_IMAGE_TYPES;
  if (!file || !allowed.has(file.type)) throw new DataError('Use JPG, PNG or WebP.');
  if (file.size > MAX_BYTES) throw new DataError('Images must be 5 MB or smaller.');
}
```

Upload with `upsert: false`. For replacement:

1. upload new path;
2. save CMS row;
3. remove previous path;
4. if step 2 fails, remove the new path.

- [ ] **Step 4: Render public URLs safely**

Use `getPublicUrl(storagePath)` for approved paths only. Keep alt text mandatory for published gallery items, doctor portraits, treatment images and blog images.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
node --test tests/media-integration.test.mjs
npm run build
```

Expected: media lifecycle test and build pass.

---

## Task 11: Build-Time SEO and Production Documentation

**Files:**

- Create: `scripts/fetch-seo.mjs`
- Modify: `vite.config.js`
- Modify: `docs/architecture.md`
- Modify: `docs/database.md`
- Modify: `docs/api.md`
- Create/modify: `tests/seo-build.test.mjs`

- [ ] **Step 1: Write failing SEO build tests**

```js
test('build fetches public SEO without a secret key', async () => {
  const script = await read('scripts/fetch-seo.mjs');
  assert.match(script, /VITE_SUPABASE_URL/);
  assert.match(script, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(script, /service_role|secret_key/i);
});

test('Vite injects route metadata into generated HTML', async () => {
  const config = await read('vite.config.js');
  assert.match(config, /transformIndexHtml/);
  assert.match(config, /seo-pages\.json/);
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```powershell
node --test tests/seo-build.test.mjs
```

Expected: missing script and injection plugin.

- [ ] **Step 3: Fetch SEO into an ignored build artifact**

`scripts/fetch-seo.mjs` writes `.cache/seo-pages.json`, creates `.cache` if needed, and fails the production build when Supabase is unreachable or returns invalid SEO data. Add `.cache/` to `.gitignore`.

The script uses only the publishable key and selects public `seo_pages`.

- [ ] **Step 4: Inject route metadata**

Add a Vite `transformIndexHtml` plugin that:

- maps `/index.html` to `/`;
- finds the route SEO record;
- replaces title, description, canonical, robots and Open Graph tags;
- escapes every attribute and text value;
- leaves a clear build error if a required route record is missing.

- [ ] **Step 5: Update documentation**

Document:

- environment variables;
- table ownership and RLS;
- Auth bootstrap and recovery;
- Storage bucket and policies;
- Realtime behavior;
- public form privacy boundary;
- analytics event boundary;
- SEO rebuild/deployment-hook requirement;
- migration and rollback commands;
- security advisor verification.

Remove every statement that says the CMS is frontend-only or demo authentication is active.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
node --test tests/seo-build.test.mjs
npm run build
```

Expected: SEO tests pass and built HTML contains Supabase-backed metadata.

---

## Task 12: Live Security and End-to-End Verification

**Files:**

- Create: `tests/supabase-live-smoke.mjs`
- Modify: `tests/admin-e2e.mjs`

- [ ] **Step 1: Add anonymous live smoke tests**

The live smoke test reads `.env` without printing values and verifies:

```js
const publicTables = ['doctors', 'treatments', 'blog_posts', 'testimonials', 'gallery_items', 'seo_pages', 'site_settings'];
for (const table of publicTables) {
  const { error } = await client.from(table).select('*').limit(1);
  assert.equal(error, null, `${table} must be publicly readable through RLS`);
}

for (const privateTable of ['cms_admins', 'appointment_requests', 'analytics_events', 'cms_audit_log']) {
  const { data, error } = await client.from(privateTable).select('*').limit(1);
  assert.ok(error || data.length === 0, `${privateTable} must not expose rows anonymously`);
}
```

It inserts one `QA` appointment, captures its returned ID only if RLS permits returning it, and confirms anonymous select cannot retrieve it. Cleanup is performed later through the authenticated admin session.

- [ ] **Step 2: Run live smoke tests**

Run:

```powershell
npm run test:live
```

Expected: public content/settings readable, private data unreadable, allowed inserts accepted.

- [ ] **Step 3: Extend browser E2E for real Auth and Supabase**

The test must:

- verify protected redirect;
- sign in using a password supplied through a temporary process environment variable, never source code;
- verify unauthorized email rejection separately when a test identity is available;
- create/edit/publish/unpublish/delete a `QA` record in each CMS collection;
- confirm published changes appear on the corresponding public page;
- submit a `QA` appointment publicly and verify it appears only in admin;
- upload/replace/delete a small generated WebP test asset;
- verify Realtime refresh on an already-open public page;
- verify password reset UI without sending repeated email;
- verify logout and session removal;
- test 375, 430, 768, 1024, 1280, 1440 and 1920 widths;
- capture console errors, page errors, failed requests and HTTP responses of 400 or greater.

- [ ] **Step 4: Run the full local and live verification**

Run:

```powershell
npm test
npm run build
npm run test:live
```

Then run the Playwright E2E suite against `npm run preview`.

Expected:

- all automated tests pass;
- build exits 0;
- all admin routes initialize;
- no horizontal overflow;
- zero browser console errors;
- zero failed application requests;
- no remaining `QA` records or uploaded test objects.

- [ ] **Step 5: Re-run connected project inspection**

Use:

- table listing;
- table schema inspection;
- bucket listing;
- RLS catalog query;
- migration history;
- security advisors.

Expected:

- eleven application tables;
- one `cms-media` bucket;
- RLS enabled everywhere;
- expected policies and grants;
- no unresolved error-level security findings.

- [ ] **Step 6: Confirm test-environment cleanup**

Verify:

- no local preview listener remains;
- no temporary credentials were written to files;
- no service-role/secret key exists in the repository;
- no `QA` database rows remain;
- no `QA` Storage objects remain;
- `.env` remains ignored;
- production build artifacts contain only the publishable key, as expected for a browser application.

---

## Execution Checkpoints

1. **Schema checkpoint:** Tasks 1–3 complete; project tables, RLS, Storage and Realtime verified.
2. **Auth/data checkpoint:** Tasks 4–6 complete; production login and admin CRUD work.
3. **Public-sync checkpoint:** Tasks 7–10 complete; public pages, forms, Realtime and media work.
4. **Release checkpoint:** Tasks 11–12 complete; SEO, docs, live tests, security advisors and production build pass.

No checkpoint is complete based only on source inspection. Each requires the listed fresh commands and live-project evidence.

