# Titanium Roots Supabase CMS Integration Design

**Date:** 2026-07-31  
**Status:** Approved architecture; implementation pending specification review  
**Project reference:** `pqvhwlflwodbpcmpzetk`

## 1. Goal

Replace the browser-only demonstration CMS with a production-oriented Supabase integration so that:

- authorized admin changes persist in Postgres;
- published changes appear on the public website;
- appointment and enquiry forms reach the admin workspace;
- images use Supabase Storage;
- authentication and authorization use Supabase Auth and Row Level Security;
- development-only labels, fake records, mock analytics, and inactive controls are removed.

The existing Titanium Roots visual design remains the source of truth. This phase changes data ownership, security, behavior, and production polish rather than redesigning the public site.

## 2. Current-State Findings

### Local application

- The Vite application is a multi-page vanilla JavaScript website.
- Admin pages use `assets/js/pages/admin.js` and the modules in `assets/js/admin/`.
- Admin authentication is a browser-only session stored in `sessionStorage`.
- Admin content is stored in a versioned `localStorage` envelope.
- Public home, doctor, treatment, blog, and testimonial content comes from separate hard-coded arrays.
- Public and admin content are therefore unrelated.
- `.env` and `.env.example` exist but are empty; `.env` is ignored by source control.

### Connected Supabase project

- The project connection is active.
- The `public` schema contains no tables or views.
- There are no storage buckets.
- There is no applied migration history.
- The security advisor currently reports no findings because no application schema exists.

This is a clean installation. There is no existing production data to migrate or preserve.

## 3. Chosen Architecture

Use separate, typed tables for each CMS module with a shared repository layer in the browser application.

This is preferred over a single JSON content table because it provides:

- database constraints per content type;
- clear public-read and admin-write policies;
- simpler queries and indexes;
- safer future integrations;
- predictable public rendering;
- easier auditing and maintenance.

The Supabase publishable key is used by browser clients. It is not an authorization mechanism; RLS remains the authorization boundary. No secret or service-role key may appear in source code, Vite variables, browser storage, or build artifacts.

## 4. Environment Configuration

Local `.env`:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<project publishable key>
```

Committed `.env.example`:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

The production host must define the same variables. Environment validation will fail clearly during initialization if either value is absent.

## 5. Authentication and Admin Authorization

### Sign-in

- Use Supabase email/password authentication.
- Use `signInWithPassword()` for login.
- Use `signOut()` for logout.
- Use `getUser()` when protecting an admin route so authorization is confirmed with the Auth server.
- Subscribe to `onAuthStateChange()` and unsubscribe during teardown.
- Do not provide a public registration page.
- Add password recovery using `resetPasswordForEmail()` and a dedicated password-update page.

### Initial administrator

The initial Auth identity is `admin@titaniumroots.com`.

Authorization uses a `cms_admins` table:

```text
user_id       uuid primary key references auth.users(id)
email         text unique not null
display_name  text not null
is_active     boolean not null default true
created_at    timestamptz not null
updated_at    timestamptz not null
```

Every admin CRUD policy checks for an active row whose `user_id` equals `auth.uid()`. The table allows an authenticated user to select only their own administrator row. It does not allow client-side insertion, update, or deletion.

The initial row is inserted only after the Supabase Auth user exists. The password is created or reset through Supabase Auth and is never placed in SQL, source code, chat, or browser logs.

## 6. Database Schema

All application tables use UUID primary keys, `created_at`, `updated_at`, and explicit constraints. Content tables include `created_by` and `updated_by` UUIDs where administrative attribution is useful.

### 6.1 `doctors`

Stores real clinic profiles:

- name, slug, designation;
- qualifications and registration number;
- specialization, specialties, languages;
- experience years;
- biography and treatment philosophy;
- consultation and availability information;
- portrait storage path and alt text;
- featured flag, publication status, sort order.

Only rows with `status = 'published'` are publicly readable.

### 6.2 `treatments`

Stores:

- name, slug and category;
- short and full descriptions;
- duration and visit guidance;
- optional price and pricing status;
- benefits, suitability, procedure steps and recovery copy;
- image path and alt text;
- featured flag, publication status and sort order.

Published treatments are publicly readable. Prices remain nullable and are displayed only when their status is confirmed.

### 6.3 `blog_posts`

Stores:

- title, slug, category and tags;
- excerpt and sanitized rich content;
- featured image path and alt text;
- author display name and publication date;
- draft, published or unpublished status;
- featured/trending flags and sort order;
- SEO title and description.

Only published posts whose publication date is not in the future are publicly readable.

### 6.4 `testimonials`

Stores:

- approved display name;
- treatment label, rating and review;
- optional image path;
- submission source;
- consent status and consent timestamp;
- moderation status;
- publication status, featured flag and sort order.

A database check prevents publication unless moderation is approved and consent is confirmed. Public reads require all three conditions.

### 6.5 `gallery_items`

Stores:

- title and approved filename;
- storage path;
- category, MIME type, dimensions and byte size;
- alt text and usage description;
- sort order and publication status.

Storage objects are not treated as CMS records until matching approved metadata exists.

### 6.6 `seo_pages`

Stores one record per public route:

- route identifier;
- meta title and description;
- canonical URL;
- Open Graph title, description and image path;
- index, follow and sitemap flags;
- updated timestamp and administrator attribution.

Browser metadata updates immediately after a fetch or Realtime event. A build-time metadata generator also reads these records for crawler-visible HTML. Production SEO changes require the hosting platform to trigger a new Vite build; the implementation will expose a documented deployment-hook boundary without storing deployment secrets in the browser.

### 6.7 `site_settings`

Uses a single `primary` row with structured JSON objects that are safe for public reading:

- clinic identity;
- contact information;
- social links;
- clinic hours;
- WhatsApp message templates;
- homepage statistics and feature counts;
- footer content;
- public feature flags;
- brand colors.

The table must never contain passwords, API secrets, SMTP credentials, payment secrets, private staff information, or service-role keys.

### 6.8 `appointment_requests`

Stores public appointment and enquiry submissions:

- safe patient/lead display name;
- phone and optional email;
- enquiry type;
- treatment and doctor references or labels;
- preferred date;
- source and consent;
- internal status, notes and status history;
- created and updated timestamps.

Anonymous users may insert a bounded request but can never select, update, or delete appointment rows. Only active CMS administrators can read or mutate them.

Medical reports, diagnoses, health histories, payment details, and uploaded clinical documents are outside this scope and must not be stored.

### 6.9 `analytics_events`

Stores limited, non-sensitive website events:

- allowed event type: page view, CTA click, WhatsApp click, phone click, or appointment submission;
- normalized page path;
- coarse referrer domain;
- created timestamp.

It stores no names, contact details, message contents, IP addresses, browser fingerprints, or medical information. Anonymous clients may insert only allowed event shapes. Only administrators may read analytics rows. The analytics page displays actual aggregates and honest zero/empty states rather than fabricated metrics.

### 6.10 `cms_audit_log`

Stores administrative mutation history:

- administrator UUID;
- action type;
- table name and record UUID;
- safe summary;
- timestamp.

The client writes an audit entry after a successful CMS mutation. Only active administrators may select or insert log rows. Logs never contain passwords, access tokens, raw appointment details, or full content snapshots.

## 7. Grants and Row Level Security

Every exposed table receives explicit grants because new Supabase projects no longer guarantee automatic Data API exposure.

### Public content tables

- `anon`: `SELECT`
- `authenticated`: `SELECT`
- RLS public policy: only published rows
- RLS admin policy: active administrators may select all rows

### Admin CRUD

- `authenticated`: required `SELECT`, `INSERT`, `UPDATE`, and `DELETE` grants
- every mutation policy checks the active `cms_admins` membership
- update policies contain both `USING` and `WITH CHECK`
- `anon` receives no mutation grants

### Appointment requests

- `anon`: `INSERT` only
- authenticated administrators: full CRUD
- anonymous users receive no select policy

### Analytics events

- `anon`: bounded `INSERT`
- administrators: `SELECT` and retention cleanup
- no public select policy

### `cms_admins`

- authenticated users may select only their own row
- no client-side mutation policies

RLS is enabled on every table before browser access is tested. No authorization decision uses user-editable `user_metadata`. No public `SECURITY DEFINER` authorization helper is required.

## 8. Supabase Storage

Create one bucket named `cms-media`.

Configuration:

- public read access for approved website images;
- maximum object size of 5 MB;
- allowed MIME types: JPEG, PNG, WebP and approved SVG branding assets;
- object paths grouped by module and UUID;
- active administrators receive `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies;
- anonymous users receive no upload, replacement or deletion policy.

Admin forms upload the object first, then save the returned storage path in the associated CMS record. If metadata saving fails, the uploaded object is removed. Replacements delete the previous object only after the new record update succeeds.

## 9. Application Data Layer

### Shared Supabase client

Create one browser client in `assets/js/data/supabase-client.js`. It validates environment variables and exports the configured client.

### Repositories

Create focused repositories:

- `auth-repository.js`
- `content-repository.js`
- `appointments-repository.js`
- `settings-repository.js`
- `media-repository.js`
- `analytics-repository.js`

Repositories return normalized application objects and throw typed operational errors. Page controllers do not construct raw Supabase queries.

### Public content store

`public-content-store.js`:

- loads published doctors, treatments, blogs, testimonials, gallery metadata, SEO and settings;
- caches only public content in memory;
- exposes loading, ready, empty and error states;
- subscribes to relevant Realtime table events;
- re-fetches the affected collection after an event instead of trusting an unvalidated payload;
- removes channels during page teardown.

Appointment and private admin data are never cached in the public store.

## 10. Public Website Integration

### Home

Uses Supabase for:

- published featured treatments;
- published featured doctors;
- approved featured testimonials;
- latest published blogs;
- public settings and homepage statistics.

Sections with no approved records are hidden or show intentional clinic-focused empty states. Fake doctor, testimonial and article content is removed.

### Doctors

Loads published doctor profiles, filters and availability choices from Supabase. Draft and unpublished profiles never render publicly.

### Treatments

Loads published treatment cards and detail dialogs from Supabase. Booking buttons pass the selected treatment into the appointment form.

### Blog

Loads published posts and supports category/search behavior against the fetched content. Scheduled future posts remain private.

### Testimonials and gallery

Render only approved/published records. Missing media uses a neutral clinic design treatment, not a fake patient or doctor identity.

### Contact and appointment forms

Submit to `appointment_requests`. The interface shows submitting, success, duplicate-click prevention and retryable failure states. A hidden honeypot and minimum interaction time reduce automated spam. Successful submissions appear in the admin appointments module.

### Global settings

Navbar, footer, appointment modal, contact information, hours, social links and CTA copy read from `site_settings`.

## 11. Admin Integration

The current admin layout and reusable table/form components remain.

Changes:

- replace demo login with Supabase Auth;
- replace synchronous local store calls with asynchronous repositories;
- add skeleton/loading and retry states;
- update tables after successful writes;
- use Realtime to reconcile changes made in another tab;
- upload real media through Storage;
- export real table data to CSV where export is offered;
- derive dashboard counts from real database rows;
- derive analytics from real events;
- derive activity from audit logs;
- show the authenticated administrator’s actual identity.

The admin UI will not expose signup, role management, secrets, database controls or raw SQL.

## 12. Removal Scope

Remove:

- all “demo”, “mock”, “frontend-only” and “not connected” banners;
- browser-local CMS persistence and seed/reset controls;
- fake appointment, doctor, author, testimonial and activity records;
- fabricated dashboard and analytics values;
- mock URL copy actions;
- report metadata placeholders;
- fake notifications;
- disabled controls that have no production behavior;
- temporary profile wording and placeholder claims on public pages;
- developer documentation that describes the CMS as frontend-only.

Keep:

- the approved admin visual system;
- responsive navigation and command palette;
- tables, forms, previews, moderation and confirmation interactions;
- explicit safety copy that remains operationally relevant;
- real Titanium Roots clinic contact information already present in the website.

## 13. Initial Content

The migration seeds:

- verified clinic contact information and hours from the existing public site;
- existing approved treatment names and public-facing copy that do not contain demo or placeholder language;
- route records for public SEO configuration.

It does not publish:

- placeholder doctors;
- fabricated testimonials;
- demo articles;
- fake appointments;
- fake analytics;
- unconfirmed statistics or claims.

Those modules begin with intentional empty states until the administrator enters approved content.

## 14. Error Handling

- Missing environment configuration: block data initialization and show a concise configuration error.
- Unauthenticated admin route: redirect to login.
- Authenticated but unauthorized user: sign out and show an access-denied message.
- Expired session: refresh through Supabase; redirect only when refresh fails.
- Query failure: preserve the current UI, show retry, and avoid replacing valid content with fake data.
- Mutation failure: keep the form open, preserve entered values, and display the Supabase-safe error message.
- Realtime failure: retain normal fetch behavior and retry the subscription without blocking page use.
- Upload failure: keep record data unsaved and offer retry.
- Public form failure: preserve input and never imply that a request was received.
- Empty result: render a deliberate empty state; never fall back to fake identities or fabricated metrics.

## 15. Security and Privacy

- No service-role or secret key in client code.
- Explicit grants and RLS on every table.
- No public reads of appointments, analytics events, audit logs or administrator membership.
- No user-editable metadata for authorization.
- Rich content is sanitized before persistence and before rendering.
- Only supported media MIME types and sizes are accepted.
- Appointment records avoid medical histories and clinical documents.
- Analytics avoid personal data and fingerprinting.
- Public forms require consent and use spam-reduction controls.
- Admin pages use appropriate cache and referrer behavior for a static browser application.
- Database security advisors are run after schema application.

## 16. Testing Strategy

### Automated tests

- environment configuration and client initialization;
- repository query mapping and error normalization;
- public status filters;
- testimonial approval and consent rules;
- admin authorization guards;
- appointment payload validation;
- rich-text and URL sanitization;
- Storage path and MIME validation;
- removal of demo-only UI;
- migration checks for grants, RLS, `USING` and `WITH CHECK`;
- public pages importing the shared content store instead of hard-coded CMS arrays.

### Live project verification

- apply the migration;
- list tables and inspect schemas;
- verify explicit grants;
- verify RLS policies through anonymous and authenticated queries;
- create the administrator identity and membership;
- sign in and perform CRUD for every module;
- confirm public pages render only published content;
- confirm an open public page updates after an admin publication change;
- submit a public appointment and confirm it is private to the administrator;
- upload, replace and remove a CMS image;
- run Supabase security advisors;
- verify production build;
- run responsive browser checks with zero console errors or failed application requests.

Test records use a `QA` prefix and are deleted after verification.

## 17. Migration and Rollout Order

1. Add environment configuration and pin the Supabase JavaScript dependency.
2. Add failing integration-boundary tests.
3. Create the SQL schema, constraints, indexes, grants, RLS policies and storage bucket.
4. Apply the migration to the connected empty project.
5. Create or invite the admin Auth user and add the `cms_admins` membership.
6. Implement the shared client and repository layer.
7. Replace demo authentication and persistence in admin pages.
8. Connect public pages and public forms.
9. Remove mock/demo UI and seed data.
10. Add Realtime synchronization, Storage uploads and real analytics aggregates.
11. Update architecture, database, API and operational documentation.
12. Run live query, security, browser, test and production-build verification.

## 18. Known Production Boundary

Client-side SEO metadata changes are immediate for browsers but not guaranteed to be reflected by crawlers that do not execute JavaScript. Crawler-visible SEO changes require a Vite rebuild and redeployment. The implementation will generate metadata from Supabase at build time and document a secure deployment-webhook integration point. Activating automatic deployments depends on the chosen hosting provider and must not expose that provider’s webhook secret in the browser.

