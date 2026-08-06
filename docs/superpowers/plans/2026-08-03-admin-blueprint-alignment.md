# Admin Blueprint Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the admin CMS pages into full alignment with the Titanium Roots website blueprint by fixing workflows, editors, media, SEO, settings, analytics, and schema access.

**Architecture:** Keep the existing shared admin shell and page entry, but split blueprint-specific configuration/workflow logic out of the large admin app file. Add tests first that fail on missing blueprint fields, then wire the UI to existing Supabase repositories and the newer blueprint tables.

**Tech Stack:** Vite, vanilla ES modules, Supabase JS, Node test runner, Chart.js, existing admin components.

---

## File Structure

- Modify `E:\Titanium-main\assets\js\admin\admin-app.js` to render the corrected pages, dashboards, workflows, and admin editors.
- Modify `E:\Titanium-main\assets\js\admin\admin-store.js` to load blueprint tables, relations, dashboard data, SEO audit data, media data, and analytics summaries.
- Modify `E:\Titanium-main\assets\js\data\cms-repository.js` to expose blueprint tables and archive-first CMS actions.
- Modify `E:\Titanium-main\assets\js\data\auth-repository.js` and `E:\Titanium-main\assets\js\admin\admin-auth.js` to use `admin_profiles`.
- Modify `E:\Titanium-main\assets\js\data\record-mappers.js` to map blueprint fields consistently for appointments, treatments, blogs, testimonials, and media assets.
- Create `E:\Titanium-main\assets\js\admin\admin-blueprint-config.js` for shared statuses, editor sections, table names, SEO audit labels, media metadata fields, and dashboard widget definitions.
- Create `E:\Titanium-main\assets\js\admin\admin-workflows.js` for publish, review, schedule, archive, appointment status, and delete-blocking helpers.
- Create `E:\Titanium-main\tests\admin-blueprint-alignment.test.mjs` for source-level blueprint coverage tests.
- Create `E:\Titanium-main\tests\admin-workflows.test.mjs` for pure workflow/helper tests.
- Create `E:\Titanium-main\supabase\migrations\20260803000200_admin_blueprint_followup.sql` for appointment, testimonial, analytics, and missing admin support columns.

---

### Task 1: Add Failing Blueprint Admin Tests

**Files:**
- Create: `E:\Titanium-main\tests\admin-blueprint-alignment.test.mjs`
- Create: `E:\Titanium-main\tests\admin-workflows.test.mjs`

- [ ] **Step 1: Add admin blueprint coverage test**

Create `E:\Titanium-main\tests\admin-blueprint-alignment.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('admin uses blueprint workflow statuses and admin profiles', async () => {
  const app = await read('assets/js/admin/admin-app.js');
  const auth = await read('assets/js/admin/admin-auth.js');
  const repository = await read('assets/js/data/cms-repository.js');

  for (const status of ['draft', 'review', 'scheduled', 'published', 'archived']) {
    assert.match(app + repository, new RegExp(`['"\`]${status}['"\`]`));
  }

  assert.match(auth, /admin_profiles/);
  assert.doesNotMatch(auth, /cms_admins/);
  assert.doesNotMatch(app, /Appointment Pending|Closed/);
});

test('admin exposes blueprint appointment fields and actions', async () => {
  const app = await read('assets/js/admin/admin-app.js');

  for (const field of [
    'preferredTime',
    'reason',
    'sourcePage',
    'utmSource',
    'utmMedium',
    'utmCampaign',
    'assignedTo',
    'consentAt',
    'cancelled',
    'spam',
    'export',
    'reschedule',
  ]) {
    assert.match(app, new RegExp(field));
  }
});

test('admin exposes blueprint treatment and blog workflows', async () => {
  const app = await read('assets/js/admin/admin-app.js');

  for (const marker of [
    'Basics',
    'Content',
    'FAQs',
    'Media',
    'Relationships',
    'SEO',
    'Publishing',
    'reviewerDoctorId',
    'medicalReviewedAt',
    'revisionNote',
    'scheduledFor',
    'generatedHtmlStatus',
  ]) {
    assert.match(app, new RegExp(marker));
  }
});

test('admin manages blueprint media, seo, settings, and analytics surfaces', async () => {
  const source = [
    await read('assets/js/admin/admin-app.js'),
    await read('assets/js/admin/admin-store.js'),
    await read('assets/js/data/cms-repository.js'),
  ].join('\n');

  for (const marker of [
    'media_assets',
    'gallery_collections',
    'cloudinaryPublicId',
    'secureUrl',
    'focalX',
    'focalY',
    'redirects',
    'duplicateSlug',
    'missingReviewer',
    'brokenRelation',
    'canonicalDomain',
    'searchConsole',
    'auditLog',
  ]) {
    assert.match(source, new RegExp(marker));
  }
});
```

- [ ] **Step 2: Add workflow helper test**

Create `E:\Titanium-main\tests\admin-workflows.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canArchiveRecord,
  canPublishRecord,
  getNextAppointmentStatus,
  normalizeBlueprintStatus,
} from '../assets/js/admin/admin-workflows.js';

test('normalizes old statuses to blueprint statuses', () => {
  assert.equal(normalizeBlueprintStatus('Draft'), 'draft');
  assert.equal(normalizeBlueprintStatus('Published'), 'published');
  assert.equal(normalizeBlueprintStatus('Unpublished'), 'archived');
  assert.equal(normalizeBlueprintStatus('review'), 'review');
});

test('blocks publishing content without required review metadata', () => {
  assert.equal(canPublishRecord('treatments', { reviewerDoctorId: '', reviewedAt: '' }).ok, false);
  assert.equal(canPublishRecord('blogs', { reviewerDoctorId: 'doctor-1', medicalReviewedAt: '2026-08-03T10:00:00Z' }).ok, true);
});

test('uses blueprint appointment transitions', () => {
  assert.equal(getNextAppointmentStatus('new', 'contact'), 'contacted');
  assert.equal(getNextAppointmentStatus('contacted', 'confirm'), 'confirmed');
  assert.equal(getNextAppointmentStatus('confirmed', 'complete'), 'completed');
  assert.equal(getNextAppointmentStatus('new', 'markSpam'), 'spam');
});

test('archives records instead of deleting publishable content', () => {
  assert.equal(canArchiveRecord('gallery').mode, 'archive');
  assert.equal(canArchiveRecord('blogs').mode, 'archive');
  assert.equal(canArchiveRecord('appointments').mode, 'status');
});
```

- [ ] **Step 3: Run tests to confirm failure**

Run:

```powershell
npm test -- tests/admin-blueprint-alignment.test.mjs tests/admin-workflows.test.mjs
```

Expected: FAIL because `admin-workflows.js`, blueprint fields, media tables, and admin profile checks are not implemented yet.

- [ ] **Step 4: Commit tests**

Run:

```powershell
git add tests/admin-blueprint-alignment.test.mjs tests/admin-workflows.test.mjs
git commit -m "test: cover admin blueprint alignment"
```

---

### Task 2: Add Shared Blueprint Config And Workflow Helpers

**Files:**
- Create: `E:\Titanium-main\assets\js\admin\admin-blueprint-config.js`
- Create: `E:\Titanium-main\assets\js\admin\admin-workflows.js`
- Modify: `E:\Titanium-main\assets\js\admin\admin-app.js`

- [ ] **Step 1: Add blueprint config module**

Create `E:\Titanium-main\assets\js\admin\admin-blueprint-config.js`:

```js
export const BLUEPRINT_STATUSES = ['draft', 'review', 'scheduled', 'published', 'archived'];

export const APPOINTMENT_STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'cancelled', 'spam'];

export const BLUEPRINT_TABLES = {
  adminProfiles: 'admin_profiles',
  doctors: 'doctors',
  treatments: 'treatments',
  treatmentFaqs: 'treatment_faqs',
  treatmentDoctors: 'treatment_doctors',
  blogs: 'blogs',
  blogCategories: 'blog_categories',
  blogFaqs: 'blog_faqs',
  blogTreatments: 'blog_treatments',
  testimonials: 'testimonials',
  mediaAssets: 'media_assets',
  galleryCollections: 'gallery_collections',
  galleryCollectionItems: 'gallery_collection_items',
  pageSections: 'page_sections',
  redirects: 'redirects',
  auditLog: 'cms_audit_log',
};

export const EDITOR_SECTIONS = {
  treatments: ['Basics', 'Content', 'FAQs', 'Media', 'Relationships', 'SEO', 'Publishing'],
  blogs: ['Basics', 'Content', 'Clinical Review', 'SEO Review', 'Relationships', 'Publishing'],
  media: ['Asset', 'Metadata', 'Usage', 'Gallery'],
};

export const SEO_AUDIT_KEYS = ['missingMetadata', 'duplicateSlug', 'missingReviewer', 'brokenRelation', 'missingAlt'];

export const DASHBOARD_WIDGETS = [
  'appointmentRequests',
  'contentReview',
  'publishingCalendar',
  'seoHealth',
  'mediaAlerts',
  'auditLog',
];
```

- [ ] **Step 2: Add workflow helper module**

Create `E:\Titanium-main\assets\js\admin\admin-workflows.js`:

```js
const OLD_STATUS_MAP = {
  Draft: 'draft',
  Published: 'published',
  Unpublished: 'archived',
  New: 'new',
  Contacted: 'contacted',
  Confirmed: 'confirmed',
  Completed: 'completed',
  Closed: 'cancelled',
};

export function normalizeBlueprintStatus(status) {
  return OLD_STATUS_MAP[status] || String(status || 'draft').toLowerCase();
}

export function canPublishRecord(type, record = {}) {
  if (type === 'treatments') {
    const ok = Boolean(record.reviewerDoctorId || record.reviewer_doctor_id) && Boolean(record.reviewedAt || record.reviewed_at);
    return { ok, reason: ok ? '' : 'Treatments need a reviewer and review date before publishing.' };
  }

  if (type === 'blogs') {
    const ok = Boolean(record.reviewerDoctorId || record.reviewer_doctor_id) && Boolean(record.medicalReviewedAt || record.medical_reviewed_at);
    return { ok, reason: ok ? '' : 'Blogs need clinical review before publishing.' };
  }

  if (type === 'testimonials') {
    const ok = record.publicationPermission === true && record.consentStatus === 'Confirmed' && record.moderationStatus === 'Approved';
    return { ok, reason: ok ? '' : 'Testimonials need consent, moderation approval, and publication permission.' };
  }

  return { ok: true, reason: '' };
}

export function getNextAppointmentStatus(currentStatus, action) {
  const transitions = {
    contact: 'contacted',
    confirm: 'confirmed',
    complete: 'completed',
    cancel: 'cancelled',
    markSpam: 'spam',
  };
  return transitions[action] || normalizeBlueprintStatus(currentStatus || 'new');
}

export function canArchiveRecord(type) {
  if (['gallery', 'media', 'blogs', 'treatments', 'doctors', 'testimonials'].includes(type)) {
    return { mode: 'archive' };
  }
  if (type === 'appointments') {
    return { mode: 'status', status: 'cancelled' };
  }
  return { mode: 'delete' };
}
```

- [ ] **Step 3: Import config into admin app**

Modify the import block in `E:\Titanium-main\assets\js\admin\admin-app.js`:

```js
import {
  APPOINTMENT_STATUSES,
  BLUEPRINT_STATUSES,
  DASHBOARD_WIDGETS,
  EDITOR_SECTIONS,
  SEO_AUDIT_KEYS,
} from './admin-blueprint-config.js';
import {
  canArchiveRecord,
  canPublishRecord,
  getNextAppointmentStatus,
  normalizeBlueprintStatus,
} from './admin-workflows.js';
```

- [ ] **Step 4: Replace old status option constants**

In `E:\Titanium-main\assets\js\admin\admin-app.js`, replace old status arrays with:

```js
const statusOptions = BLUEPRINT_STATUSES;
const appointmentStatusOptions = APPOINTMENT_STATUSES;
```

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm test -- tests/admin-workflows.test.mjs tests/admin-blueprint-alignment.test.mjs
```

Expected: workflow tests PASS; blueprint alignment test still FAILS on missing UI/store/repository fields.

- [ ] **Step 6: Commit helpers**

Run:

```powershell
git add assets/js/admin/admin-blueprint-config.js assets/js/admin/admin-workflows.js assets/js/admin/admin-app.js
git commit -m "feat: add admin blueprint workflow helpers"
```

---

### Task 3: Align Schema Access And Admin Authorization

**Files:**
- Create: `E:\Titanium-main\supabase\migrations\20260803000200_admin_blueprint_followup.sql`
- Modify: `E:\Titanium-main\assets\js\data\cms-repository.js`
- Modify: `E:\Titanium-main\assets\js\data\auth-repository.js`
- Modify: `E:\Titanium-main\assets\js\admin\admin-auth.js`
- Modify: `E:\Titanium-main\assets\js\admin\admin-store.js`

- [ ] **Step 1: Add follow-up migration**

Create `E:\Titanium-main\supabase\migrations\20260803000200_admin_blueprint_followup.sql`:

```sql
alter table public.appointment_requests
  add column if not exists preferred_time text,
  add column if not exists reason text,
  add column if not exists source_page text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists assigned_to uuid references public.admin_profiles(id) on delete set null,
  add column if not exists internal_notes text,
  add column if not exists consent_at timestamptz;

alter table public.appointment_requests
  drop constraint if exists appointment_requests_status_check;

alter table public.appointment_requests
  add constraint appointment_requests_status_check
  check (status in ('new', 'contacted', 'confirmed', 'completed', 'cancelled', 'spam'));

alter table public.testimonials
  add column if not exists publication_permission boolean default false,
  add column if not exists archived_at timestamptz;

alter table public.media_assets
  add column if not exists usage_count integer default 0,
  add column if not exists last_used_at timestamptz,
  add column if not exists archived_at timestamptz;

create table if not exists public.search_console_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  page_path text not null,
  query text,
  clicks integer default 0,
  impressions integer default 0,
  ctr numeric default 0,
  position numeric default 0,
  created_at timestamptz default now(),
  unique (metric_date, page_path, coalesce(query, ''))
);

alter table public.search_console_metrics enable row level security;

drop policy if exists search_console_metrics_admin_all on public.search_console_metrics;
create policy search_console_metrics_admin_all
  on public.search_console_metrics
  for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());
```

- [ ] **Step 2: Expose blueprint tables in CMS repository**

Modify `CMS_TABLES` and `WRITABLE_TABLES` in `E:\Titanium-main\assets\js\data\cms-repository.js`:

```js
const CMS_TABLES = {
  adminProfiles: 'admin_profiles',
  doctors: 'doctors',
  specialties: 'specialties',
  treatments: 'treatments',
  treatmentFaqs: 'treatment_faqs',
  treatmentDoctors: 'treatment_doctors',
  blogs: 'blogs',
  blogCategories: 'blog_categories',
  blogFaqs: 'blog_faqs',
  blogTreatments: 'blog_treatments',
  testimonials: 'testimonials',
  mediaAssets: 'media_assets',
  galleryCollections: 'gallery_collections',
  galleryCollectionItems: 'gallery_collection_items',
  pageSections: 'page_sections',
  redirects: 'redirects',
  seoPages: 'seo_pages',
  appointments: 'appointment_requests',
  auditLog: 'cms_audit_log',
  analyticsEvents: 'analytics_events',
  searchConsoleMetrics: 'search_console_metrics',
};

const WRITABLE_TABLES = new Set(Object.values(CMS_TABLES).filter((table) => table !== 'analytics_events' && table !== 'cms_audit_log'));
```

- [ ] **Step 3: Replace permanent delete with archive-first behavior**

Modify `deleteAdminRecord` in `E:\Titanium-main\assets\js\data\cms-repository.js`:

```js
export async function deleteAdminRecord(table, id, options = {}) {
  const { mode = 'archive' } = options;

  if (!id) {
    throw new Error('A record id is required.');
  }

  if (mode === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      throw new DataRepositoryError(error.message, error);
    }
    return true;
  }

  const patch = table === CMS_TABLES.appointments
    ? { status: 'cancelled' }
    : { status: 'archived', archived_at: new Date().toISOString() };

  const { error } = await supabase.from(table).update(patch).eq('id', id);
  if (error) {
    throw new DataRepositoryError(error.message, error);
  }

  await createAuditLog(table, id, 'archive', patch);
  return true;
}
```

- [ ] **Step 4: Switch auth lookup to admin profiles**

Modify the admin check in `E:\Titanium-main\assets\js\data\auth-repository.js` and `E:\Titanium-main\assets\js\admin\admin-auth.js` so the Supabase lookup uses:

```js
const { data, error } = await supabase
  .from('admin_profiles')
  .select('id, role, full_name, is_active')
  .eq('id', user.id)
  .eq('is_active', true)
  .maybeSingle();
```

- [ ] **Step 5: Load blueprint tables in admin store**

Update the table map in `E:\Titanium-main\assets\js\admin\admin-store.js`:

```js
const ADMIN_TABLES = {
  appointments: 'appointment_requests',
  doctors: 'doctors',
  specialties: 'specialties',
  treatments: 'treatments',
  treatmentFaqs: 'treatment_faqs',
  treatmentDoctors: 'treatment_doctors',
  blogs: 'blogs',
  blogCategories: 'blog_categories',
  blogFaqs: 'blog_faqs',
  blogTreatments: 'blog_treatments',
  testimonials: 'testimonials',
  gallery: 'media_assets',
  mediaAssets: 'media_assets',
  galleryCollections: 'gallery_collections',
  galleryCollectionItems: 'gallery_collection_items',
  seo: 'seo_pages',
  redirects: 'redirects',
  pageSections: 'page_sections',
  settings: 'site_settings',
  auditLog: 'cms_audit_log',
  analyticsEvents: 'analytics_events',
  searchConsoleMetrics: 'search_console_metrics',
};
```

- [ ] **Step 6: Run schema and auth tests**

Run:

```powershell
npm test -- tests/blueprint-schema.test.mjs tests/admin-auth-production.test.mjs tests/admin-blueprint-alignment.test.mjs
```

Expected: schema/auth tests PASS; blueprint alignment may still FAIL on page UI fields.

- [ ] **Step 7: Commit schema access work**

Run:

```powershell
git add supabase/migrations/20260803000200_admin_blueprint_followup.sql assets/js/data/cms-repository.js assets/js/data/auth-repository.js assets/js/admin/admin-auth.js assets/js/admin/admin-store.js
git commit -m "feat: align admin data access with blueprint schema"
```

---

### Task 4: Fix Appointments Admin Page

**Files:**
- Modify: `E:\Titanium-main\assets\js\admin\admin-app.js`
- Modify: `E:\Titanium-main\assets\js\admin\admin-store.js`
- Modify: `E:\Titanium-main\assets\js\data\record-mappers.js`

- [ ] **Step 1: Add appointment blueprint fields to manager config**

Update the appointments fields in `E:\Titanium-main\assets\js\admin\admin-app.js`:

```js
fields: [
  { name: 'fullName', label: 'Full Name', type: 'text', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'preferredDate', label: 'Preferred Date', type: 'date' },
  { name: 'preferredTime', label: 'Preferred Time', type: 'text' },
  { name: 'reason', label: 'Reason', type: 'select', options: ['consultation', 'follow_up', 'procedure', 'other'] },
  { name: 'sourcePage', label: 'Source Page', type: 'text' },
  { name: 'utmSource', label: 'UTM Source', type: 'text' },
  { name: 'utmMedium', label: 'UTM Medium', type: 'text' },
  { name: 'utmCampaign', label: 'UTM Campaign', type: 'text' },
  { name: 'assignedTo', label: 'Assigned To', type: 'select', optionsFrom: 'adminProfiles' },
  { name: 'status', label: 'Status', type: 'select', options: appointmentStatusOptions },
  { name: 'message', label: 'Message', type: 'textarea' },
  { name: 'internalNotes', label: 'Internal Notes', type: 'textarea' },
  { name: 'consentAt', label: 'Consent Captured At', type: 'datetime-local' },
]
```

- [ ] **Step 2: Add appointment actions**

Add these action definitions to the appointments manager config:

```js
actions: ['view', 'contact', 'confirm', 'reschedule', 'complete', 'cancel', 'markSpam', 'export']
```

- [ ] **Step 3: Implement appointment action handling**

In the action handler in `E:\Titanium-main\assets\js\admin\admin-app.js`, handle appointment actions:

```js
if (config.key === 'appointments' && ['contact', 'confirm', 'complete', 'cancel', 'markSpam'].includes(action)) {
  const status = getNextAppointmentStatus(record.status, action);
  await store.updateStatus(config.key, record.id, status);
  await refreshPage();
  return;
}

if (config.key === 'appointments' && action === 'reschedule') {
  openEditor(config, { ...record, status: 'contacted' }, { focusField: 'preferredDate' });
  return;
}

if (config.key === 'appointments' && action === 'export') {
  exportRecordsCsv('appointments', [record]);
  return;
}
```

- [ ] **Step 4: Map appointment fields to database**

Update appointment mapper in `E:\Titanium-main\assets\js\data\record-mappers.js`:

```js
preferredTime: row.preferred_time || '',
reason: row.reason || row.enquiry_type || '',
sourcePage: row.source_page || '',
utmSource: row.utm_source || '',
utmMedium: row.utm_medium || '',
utmCampaign: row.utm_campaign || '',
assignedTo: row.assigned_to || '',
internalNotes: row.internal_notes || row.notes || '',
consentAt: row.consent_at || '',
```

Update database mapping:

```js
preferred_time: record.preferredTime || null,
reason: record.reason || null,
source_page: record.sourcePage || null,
utm_source: record.utmSource || null,
utm_medium: record.utmMedium || null,
utm_campaign: record.utmCampaign || null,
assigned_to: record.assignedTo || null,
internal_notes: record.internalNotes || null,
consent_at: record.consentAt || null,
```

- [ ] **Step 5: Run appointment tests**

Run:

```powershell
npm test -- tests/admin-blueprint-alignment.test.mjs tests/public-submissions.test.mjs
```

Expected: appointment blueprint assertions PASS and public submission tests PASS.

- [ ] **Step 6: Commit appointment admin**

Run:

```powershell
git add assets/js/admin/admin-app.js assets/js/admin/admin-store.js assets/js/data/record-mappers.js
git commit -m "feat: align appointment admin with blueprint"
```

---

### Task 5: Build Blueprint Treatment Editor

**Files:**
- Modify: `E:\Titanium-main\assets\js\admin\admin-app.js`
- Modify: `E:\Titanium-main\assets\js\admin\admin-store.js`
- Modify: `E:\Titanium-main\assets\js\data\record-mappers.js`

- [ ] **Step 1: Replace flat treatment form with sectioned blueprint fields**

In `E:\Titanium-main\assets\js\admin\admin-app.js`, define treatment sections:

```js
sections: [
  { title: 'Basics', fields: ['title', 'slug', 'category', 'cardCopy', 'heroSummary', 'status', 'featuredOrder'] },
  { title: 'Content', fields: ['overview', 'concernTriggers', 'benefits', 'assessment', 'process', 'aftercare', 'limitations'] },
  { title: 'FAQs', relation: 'treatmentFaqs' },
  { title: 'Media', fields: ['heroImage', 'cardImage', 'galleryAssetIds', 'focalX', 'focalY', 'altText'] },
  { title: 'Relationships', fields: ['doctorIds', 'articleIds', 'relatedTreatmentIds', 'concernTags'] },
  { title: 'SEO', fields: ['seoTitle', 'seoDescription', 'canonicalUrl', 'ogImage', 'schemaJson', 'noindex'] },
  { title: 'Publishing', fields: ['reviewerDoctorId', 'reviewedAt', 'scheduledFor', 'revisionNote', 'archivedAt'] },
]
```

- [ ] **Step 2: Add missing treatment field definitions**

Add these fields to the treatment manager:

```js
{ name: 'heroSummary', label: 'Hero Summary', type: 'textarea' },
{ name: 'concernTriggers', label: 'Concern Triggers', type: 'tags' },
{ name: 'assessment', label: 'Assessment', type: 'richtext' },
{ name: 'aftercare', label: 'Aftercare', type: 'richtext' },
{ name: 'limitations', label: 'Risks & Limitations', type: 'richtext' },
{ name: 'galleryAssetIds', label: 'Gallery Assets', type: 'relation', source: 'mediaAssets' },
{ name: 'focalX', label: 'Focal X', type: 'number', min: 0, max: 1, step: 0.01 },
{ name: 'focalY', label: 'Focal Y', type: 'number', min: 0, max: 1, step: 0.01 },
{ name: 'doctorIds', label: 'Related Doctors', type: 'relation', source: 'doctors' },
{ name: 'articleIds', label: 'Related Articles', type: 'relation', source: 'blogs' },
{ name: 'relatedTreatmentIds', label: 'Related Treatments', type: 'relation', source: 'treatments' },
{ name: 'canonicalUrl', label: 'Canonical URL', type: 'url' },
{ name: 'ogImage', label: 'Open Graph Image', type: 'relation', source: 'mediaAssets' },
{ name: 'schemaJson', label: 'Schema JSON', type: 'textarea' },
{ name: 'noindex', label: 'Noindex', type: 'checkbox' },
{ name: 'reviewerDoctorId', label: 'Reviewer Doctor', type: 'relation', source: 'doctors' },
{ name: 'reviewedAt', label: 'Review Date', type: 'datetime-local' },
{ name: 'scheduledFor', label: 'Scheduled Publish Time', type: 'datetime-local' },
{ name: 'revisionNote', label: 'Revision Note', type: 'textarea' },
```

- [ ] **Step 3: Add treatment relation loading**

In `E:\Titanium-main\assets\js\admin\admin-store.js`, add treatment detail loading:

```js
async function loadTreatmentRelations(treatmentId) {
  if (!treatmentId) {
    return { faqs: [], doctors: [], relatedBlogs: [], relatedTreatments: [] };
  }

  const [faqs, doctors, blogLinks] = await Promise.all([
    listAdminRecords('treatment_faqs', { filters: { treatment_id: treatmentId } }),
    listAdminRecords('treatment_doctors', { filters: { treatment_id: treatmentId } }),
    listAdminRecords('blog_treatments', { filters: { treatment_id: treatmentId } }),
  ]);

  return { faqs, doctors, relatedBlogs: blogLinks, relatedTreatments: [] };
}
```

- [ ] **Step 4: Use publish guard for treatments**

Before publishing a treatment in `E:\Titanium-main\assets\js\admin\admin-app.js`:

```js
const publishCheck = canPublishRecord('treatments', record);
if (!publishCheck.ok) {
  showToast(publishCheck.reason, 'warning');
  return;
}
await store.updateStatus('treatments', record.id, 'published');
```

- [ ] **Step 5: Run treatment tests**

Run:

```powershell
npm test -- tests/admin-blueprint-alignment.test.mjs tests/blueprint-content-safety.test.mjs
```

Expected: treatment field assertions PASS and content safety tests PASS.

- [ ] **Step 6: Commit treatment editor**

Run:

```powershell
git add assets/js/admin/admin-app.js assets/js/admin/admin-store.js assets/js/data/record-mappers.js
git commit -m "feat: add blueprint treatment editor"
```

---

### Task 6: Build Blueprint Blog Editor

**Files:**
- Modify: `E:\Titanium-main\assets\js\admin\admin-app.js`
- Modify: `E:\Titanium-main\assets\js\admin\admin-store.js`
- Modify: `E:\Titanium-main\assets\js\data\record-mappers.js`

- [ ] **Step 1: Add blog editor sections**

In the blog manager config in `E:\Titanium-main\assets\js\admin\admin-app.js`, add:

```js
sections: [
  { title: 'Basics', fields: ['title', 'slug', 'categoryId', 'excerpt', 'deck', 'status', 'featuredOrder'] },
  { title: 'Content', fields: ['content', 'keyTakeaways', 'faqs'] },
  { title: 'Clinical Review', fields: ['reviewerDoctorId', 'medicalReviewedAt', 'clinicalReviewComments'] },
  { title: 'SEO Review', fields: ['seoTitle', 'seoDescription', 'canonicalUrl', 'ogImage', 'imageAlt', 'noindex'] },
  { title: 'Relationships', fields: ['treatmentIds', 'internalLinks'] },
  { title: 'Publishing', fields: ['scheduledFor', 'publishedAt', 'revisionNote', 'generatedHtmlStatus', 'archivedAt'] },
]
```

- [ ] **Step 2: Add blog blueprint fields**

Add blog fields:

```js
{ name: 'categoryId', label: 'Category', type: 'relation', source: 'blogCategories' },
{ name: 'deck', label: 'Deck', type: 'textarea' },
{ name: 'keyTakeaways', label: 'Key Takeaways', type: 'tags' },
{ name: 'reviewerDoctorId', label: 'Clinical Reviewer', type: 'relation', source: 'doctors' },
{ name: 'medicalReviewedAt', label: 'Medical Reviewed At', type: 'datetime-local' },
{ name: 'clinicalReviewComments', label: 'Clinical Review Comments', type: 'textarea' },
{ name: 'canonicalUrl', label: 'Canonical URL', type: 'url' },
{ name: 'ogImage', label: 'Open Graph Image', type: 'relation', source: 'mediaAssets' },
{ name: 'imageAlt', label: 'Image Alt Text', type: 'text' },
{ name: 'noindex', label: 'Noindex', type: 'checkbox' },
{ name: 'treatmentIds', label: 'Related Treatments', type: 'relation', source: 'treatments' },
{ name: 'internalLinks', label: 'Internal Links', type: 'tags' },
{ name: 'scheduledFor', label: 'Scheduled Publish Time', type: 'datetime-local' },
{ name: 'revisionNote', label: 'Revision Note', type: 'textarea' },
{ name: 'generatedHtmlStatus', label: 'Generated HTML Status', type: 'select', options: ['pending', 'success', 'failed'] },
```

- [ ] **Step 3: Add blog relation persistence**

In `E:\Titanium-main\assets\js\admin\admin-store.js`, add save support for blog FAQs and treatment links:

```js
async function saveBlogRelations(blogId, record) {
  await replaceRelationRows('blog_treatments', 'blog_id', blogId, (record.treatmentIds || []).map((treatmentId) => ({
    blog_id: blogId,
    treatment_id: treatmentId,
  })));

  await replaceRelationRows('blog_faqs', 'blog_id', blogId, (record.faqs || []).map((faq, index) => ({
    blog_id: blogId,
    question: faq.question,
    answer: faq.answer,
    sort_order: index + 1,
  })));
}
```

- [ ] **Step 4: Use publish guard for blogs**

Before publishing a blog:

```js
const publishCheck = canPublishRecord('blogs', record);
if (!publishCheck.ok) {
  showToast(publishCheck.reason, 'warning');
  return;
}
await store.updateStatus('blogs', record.id, 'published');
```

- [ ] **Step 5: Run blog tests**

Run:

```powershell
npm test -- tests/admin-blueprint-alignment.test.mjs tests/seo-build.test.mjs
```

Expected: blog workflow assertions PASS and SEO build tests PASS.

- [ ] **Step 6: Commit blog editor**

Run:

```powershell
git add assets/js/admin/admin-app.js assets/js/admin/admin-store.js assets/js/data/record-mappers.js
git commit -m "feat: add blueprint blog editor"
```

---

### Task 7: Replace Gallery With Media Library Workflow

**Files:**
- Modify: `E:\Titanium-main\assets\js\admin\admin-app.js`
- Modify: `E:\Titanium-main\assets\js\admin\admin-store.js`
- Modify: `E:\Titanium-main\assets\js\data\record-mappers.js`
- Modify: `E:\Titanium-main\assets\js\data\media-repository.js`

- [ ] **Step 1: Switch gallery manager to media assets**

In `E:\Titanium-main\assets\js\admin\admin-app.js`, configure gallery around `media_assets`:

```js
{
  key: 'gallery',
  title: 'Media Library',
  table: 'media_assets',
  fields: [
    { name: 'cloudinaryPublicId', label: 'Cloudinary Public ID', type: 'text', required: true },
    { name: 'secureUrl', label: 'Secure URL', type: 'url', required: true },
    { name: 'resourceType', label: 'Resource Type', type: 'select', options: ['image', 'video', 'raw'] },
    { name: 'format', label: 'Format', type: 'text' },
    { name: 'width', label: 'Width', type: 'number' },
    { name: 'height', label: 'Height', type: 'number' },
    { name: 'bytes', label: 'Bytes', type: 'number' },
    { name: 'folder', label: 'Folder', type: 'text' },
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'alt', label: 'Alt Text', type: 'text' },
    { name: 'caption', label: 'Caption', type: 'textarea' },
    { name: 'tags', label: 'Tags', type: 'tags' },
    { name: 'focalX', label: 'Focal X', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'focalY', label: 'Focal Y', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'isGalleryItem', label: 'Show In Public Gallery', type: 'checkbox' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'archived'] },
  ],
}
```

- [ ] **Step 2: Add media asset mapper**

In `E:\Titanium-main\assets\js\data\record-mappers.js`, map media assets:

```js
export function mapMediaAssetFromDatabase(row = {}) {
  return {
    id: row.id,
    cloudinaryPublicId: row.cloudinary_public_id || '',
    secureUrl: row.secure_url || '',
    resourceType: row.resource_type || 'image',
    format: row.format || '',
    width: row.width || '',
    height: row.height || '',
    bytes: row.bytes || '',
    folder: row.folder || '',
    title: row.title || '',
    alt: row.alt || '',
    caption: row.caption || '',
    tags: row.tags || [],
    focalX: row.focal_x ?? 0.5,
    focalY: row.focal_y ?? 0.5,
    isGalleryItem: row.is_gallery_item === true,
    status: row.status || 'active',
  };
}
```

- [ ] **Step 3: Add usage protection before archive/delete**

In `E:\Titanium-main\assets\js\admin\admin-store.js`, add:

```js
async function getMediaUsage(assetId) {
  const references = await Promise.all([
    listAdminRecords('treatments', { filters: { hero_asset_id: assetId } }),
    listAdminRecords('blogs', { filters: { hero_asset_id: assetId } }),
    listAdminRecords('gallery_collection_items', { filters: { media_asset_id: assetId } }),
  ]);
  return references.flat();
}
```

- [ ] **Step 4: Block deletion and archive instead**

Before media deletion:

```js
const usage = await store.getMediaUsage(record.id);
if (usage.length > 0) {
  showToast('This media is used by content. Archive or replace references first.', 'warning');
  return;
}
await store.archiveRecord('gallery', record.id);
```

- [ ] **Step 5: Run media tests**

Run:

```powershell
npm test -- tests/admin-blueprint-alignment.test.mjs tests/media-integration.test.mjs
```

Expected: media blueprint assertions PASS and media integration tests PASS.

- [ ] **Step 6: Commit media library**

Run:

```powershell
git add assets/js/admin/admin-app.js assets/js/admin/admin-store.js assets/js/data/record-mappers.js assets/js/data/media-repository.js
git commit -m "feat: align gallery admin with media library"
```

---

### Task 8: Upgrade SEO, Settings, Dashboard, And Analytics

**Files:**
- Modify: `E:\Titanium-main\assets\js\admin\admin-app.js`
- Modify: `E:\Titanium-main\assets\js\admin\admin-store.js`
- Modify: `E:\Titanium-main\assets\js\admin\admin-charts.js`

- [ ] **Step 1: Add dashboard widgets**

In `E:\Titanium-main\assets\js\admin\admin-app.js`, render widgets for:

```js
const dashboardSections = [
  'Appointment requests: new, contacted, confirmed, today, overdue',
  'Content review: doctors, treatments, blogs awaiting review',
  'Publishing calendar: scheduled content',
  'SEO health: missing metadata, duplicate slugs, missing reviewer, broken relations',
  'Media alerts: large assets, unused assets, missing alt text',
  'Recent activity: auditLog',
];
```

- [ ] **Step 2: Add dashboard data loader**

In `E:\Titanium-main\assets\js\admin\admin-store.js`, expand dashboard loading:

```js
async function getDashboardBlueprintData() {
  const [appointments, treatments, blogs, mediaAssets, auditLog] = await Promise.all([
    listAdminRecords('appointment_requests'),
    listAdminRecords('treatments'),
    listAdminRecords('blogs'),
    listAdminRecords('media_assets'),
    listAdminRecords('cms_audit_log'),
  ]);

  return {
    appointmentRequests: summarizeAppointments(appointments),
    contentReview: summarizeReviewQueue({ treatments, blogs }),
    publishingCalendar: summarizeScheduledContent({ treatments, blogs }),
    seoHealth: buildSeoAudit({ treatments, blogs }),
    mediaAlerts: summarizeMediaAlerts(mediaAssets),
    auditLog: auditLog.slice(0, 10),
  };
}
```

- [ ] **Step 3: Upgrade SEO page**

In `E:\Titanium-main\assets\js\admin\admin-app.js`, add SEO sections:

```js
const seoSections = [
  { title: 'Defaults', fields: ['siteName', 'titleSuffix', 'defaultDescription', 'defaultOgImage', 'canonicalDomain'] },
  { title: 'Audit', keys: SEO_AUDIT_KEYS },
  { title: 'Redirects', table: 'redirects', fields: ['oldPath', 'destination', 'code', 'reason'] },
  { title: 'Sitemap & Robots Preview', fields: ['sitemapPreview', 'robotsPreview'] },
];
```

- [ ] **Step 4: Add SEO audit helpers**

In `E:\Titanium-main\assets\js\admin\admin-store.js`, add:

```js
function buildSeoAudit({ treatments = [], blogs = [] }) {
  const records = [...treatments, ...blogs];
  const slugCounts = records.reduce((counts, record) => {
    counts[record.slug] = (counts[record.slug] || 0) + 1;
    return counts;
  }, {});

  return {
    missingMetadata: records.filter((record) => !record.seoTitle || !record.seoDescription),
    duplicateSlug: records.filter((record) => record.slug && slugCounts[record.slug] > 1),
    missingReviewer: records.filter((record) => record.status === 'published' && !record.reviewerDoctorId),
    brokenRelation: records.filter((record) => record.relatedTreatmentIds?.includes(record.id)),
    missingAlt: records.filter((record) => record.heroImage && !record.altText),
  };
}
```

- [ ] **Step 5: Upgrade settings page**

Add settings groups in `E:\Titanium-main\assets\js\admin\admin-app.js`:

```js
const settingsGroups = [
  'Identity',
  'Contact',
  'Locality',
  'Content Defaults',
  'SEO Defaults',
  'Integrations',
  'Analytics Privacy',
  'Maintenance',
];
```

- [ ] **Step 6: Upgrade analytics page**

In `E:\Titanium-main\assets\js\admin\admin-app.js`, add:

```js
const analyticsSections = [
  'Acquisition: organic, direct, referral, social, campaign',
  'Conversion: appointment starts, successful submissions, CTA clicks',
  'Content: top pages, treatment interest, blog engagement',
  'Search Console: clicks, impressions, CTR, average position',
  'Privacy boundary: does not collect names, contact details, or medical history',
];
```

- [ ] **Step 7: Wire date filtering into analytics store**

In `E:\Titanium-main\assets\js\admin\admin-store.js`, filter analytics events:

```js
function filterEventsByRange(events, range) {
  const now = new Date();
  const days = Number(range || 30);
  const minTime = now.getTime() - days * 24 * 60 * 60 * 1000;
  return events.filter((event) => new Date(event.createdAt || event.created_at).getTime() >= minTime);
}
```

- [ ] **Step 8: Run admin and analytics tests**

Run:

```powershell
npm test -- tests/admin-blueprint-alignment.test.mjs tests/admin-cms.test.mjs tests/admin-production.test.mjs
```

Expected: all admin blueprint, CMS, and production tests PASS.

- [ ] **Step 9: Commit admin surfaces**

Run:

```powershell
git add assets/js/admin/admin-app.js assets/js/admin/admin-store.js assets/js/admin/admin-charts.js
git commit -m "feat: upgrade admin dashboard seo settings analytics"
```

---

### Task 9: Final Verification And Build

**Files:**
- Modify only files needed to fix failures found by verification.

- [ ] **Step 1: Run full test suite**

Run:

```powershell
npm test
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```powershell
npm run build
```

Expected: build completes and writes `E:\Titanium-main\dist`.

- [ ] **Step 3: Review admin pages manually**

Run:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173/admin/dashboard.html
http://localhost:5173/admin/appointments.html
http://localhost:5173/admin/treatments.html
http://localhost:5173/admin/blogs.html
http://localhost:5173/admin/gallery.html
http://localhost:5173/admin/seo.html
http://localhost:5173/admin/settings.html
http://localhost:5173/admin/analytics.html
```

Expected:

```text
Dashboard shows six blueprint widgets.
Appointments expose all lead fields and workflow actions.
Treatments and blogs show sectioned review/publishing editors.
Gallery acts as a media library with Cloudinary metadata.
SEO exposes defaults, redirects, audits, and previews.
Settings includes locality, SEO defaults, integrations, and analytics privacy.
Analytics includes date filtering and Search Console section.
```

- [ ] **Step 4: Check git diff**

Run:

```powershell
git diff --stat
git diff --check
```

Expected: no whitespace errors; changed files match this plan.

- [ ] **Step 5: Commit verification fixes**

If verification required fixes, run:

```powershell
git add .
git commit -m "fix: complete admin blueprint verification"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review

- **Spec coverage:** Covers admin auth, dashboard, appointments, treatment editor, blog workflow, testimonials permission, media/gallery, SEO, settings, analytics, archive-first behavior, and missing blueprint table access.
- **Known split:** This plan intentionally keeps the existing admin shell and shared entry. It does not redesign the visual system; it only corrects blueprint functionality.
- **Testing path:** Starts with failing source-level coverage, adds pure workflow tests, then verifies schema/auth, media, SEO, full admin tests, and production build.
- **Execution risk:** The largest risk is the current generic admin drawer not supporting tabbed/sectioned editors. If needed during execution, split editor rendering into `E:\Titanium-main\assets\js\admin\admin-sectioned-editor.js` and import it from `admin-app.js`.
