# Admin CMS Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete frontend-only Titanium Roots admin CMS across all eleven approved routes without changing public-page designs.

**Architecture:** Use one admin entry point and a shared component-loaded shell. A versioned local demo store, isolated session auth adapter, configuration-driven CRUD controller, reusable table/form/dialog modules, and focused page controllers provide the behavior for every route.

**Tech Stack:** Vite, semantic HTML, vanilla CSS, JavaScript ES modules, Lucide, Chart.js, localStorage, sessionStorage, Node test runner.

---

### Task 1: Contract tests and dependencies

**Files:**
- Create: `tests/admin-cms.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Assert all eleven HTML routes use `data-admin-page`, the shared protected shell, and `/assets/js/pages/admin.js`.
- [ ] Assert shared component files, admin modules, required navigation labels, and forbidden Services/Users/signup labels.
- [ ] Assert auth source uses sessionStorage and never localStorage for passwords.
- [ ] Assert store source includes schema versioning, corruption recovery, and safe demo labels.
- [ ] Run `npm test` and confirm the new contract tests fail for missing admin implementation.
- [ ] Install `chart.js` and retain the existing Vite/lucide dependencies.

### Task 2: Stage 1 shared shell and authentication

**Files:**
- Create: `components/admin-sidebar.html`
- Create: `components/admin-header.html`
- Create: `components/admin-mobile-nav.html`
- Create: `components/admin-confirm-dialog.html`
- Create: `components/admin-command-bar.html`
- Create: `assets/js/admin/admin-auth.js`
- Create: `assets/js/admin/admin-shell.js`
- Create: `assets/js/admin/admin-dialog.js`
- Create: `assets/js/admin/admin-utils.js`
- Create: `assets/js/admin/admin-mock-data.js`
- Create: `assets/js/admin/admin-store.js`
- Create: `assets/css/pages/admin.css`
- Modify: `admin/login.html`
- Modify: `admin/dashboard.html`

- [ ] Build the accessible shared component markup with active navigation hooks, drawer controls, command navigation, profile controls, logout, and confirmation dialog.
- [ ] Implement a sessionStorage-only demo auth adapter with login redirect, protected-route guard, and logout.
- [ ] Implement versioned safe seed data, immutable reads, CRUD writes, reset, and corrupted-envelope recovery.
- [ ] Build the split login experience with validation, show/hide password, loading/error state, Enter submission, remember-session label, and no signup.
- [ ] Build the protected dashboard shell, labelled demo metric cards, recent lead/content/activity panels, quick links, and chart canvas.
- [ ] Implement the collapsible desktop sidebar, mobile drawer, Escape close, local collapsed preference, command bar, focus management, and Lucide icons.
- [ ] Run `npm test` and verify Stage 1 contracts pass.

### Task 3: Shared table, form, editor, charts, and application dispatcher

**Files:**
- Create: `assets/js/admin/admin-table.js`
- Create: `assets/js/admin/admin-form.js`
- Create: `assets/js/admin/admin-editor.js`
- Create: `assets/js/admin/admin-charts.js`
- Create: `assets/js/admin/admin-app.js`
- Modify: `assets/js/pages/admin.js`

- [ ] Implement search, filters, sort, pagination, row actions, empty/error/loading states, and mobile record-card rendering.
- [ ] Implement schema-driven labelled fields, validation, character counters, repeatable values, switches, file metadata preview, first-invalid focus, and unsaved-change tracking.
- [ ] Implement the accessible blog toolbar and sanitizer supporting headings, paragraphs, bold, italic, lists, links, quotes, undo, and redo without script insertion.
- [ ] Implement Chart.js lifecycle helpers plus accessible text summaries and demo-data labelling.
- [ ] Implement route dispatch, duplicate-init protection, graceful error panels, and page-specific controller registration.

### Task 4: Stage 2 content and lead management

**Files:**
- Modify: `admin/appointments.html`
- Modify: `admin/doctors.html`
- Modify: `admin/treatments.html`
- Modify: `admin/blogs.html`
- Modify: `admin/testimonials.html`
- Modify: `assets/js/admin/admin-app.js`

- [ ] Add the required protected shell to all five routes.
- [ ] Configure appointment columns, search/filters, details, status history, notes, safe report metadata, communication links, archive, and delete.
- [ ] Configure all doctor fields, portrait metadata validation, publish/feature/order actions, and public-profile preview.
- [ ] Configure all treatment fields, optional price based on pricing status, preview cards, publish/feature/order actions, and filters.
- [ ] Configure all blog fields, sanitized rich editor, slug generation, counts, preview, draft/publish/trending/feature/order actions, and filters.
- [ ] Configure testimonial consent-aware moderation and prevent publishing until approved with confirmed consent.
- [ ] Verify add/edit/delete, publish flows, filters, pagination, dialogs, and toast feedback with automated and browser checks.

### Task 5: Stage 3 media, SEO, settings, and analytics

**Files:**
- Modify: `admin/gallery.html`
- Modify: `admin/seo.html`
- Modify: `admin/settings.html`
- Modify: `admin/analytics.html`
- Modify: `assets/js/admin/admin-app.js`

- [ ] Configure gallery grid/list views, allowed-type validation, temporary preview URL lifecycle, metadata editing, mock URL copy, usage status, and media deletion.
- [ ] Build SEO page selection, all metadata fields, counters, warnings, search/social previews, save/reset, and read-only sitemap/robots previews without Services.
- [ ] Build grouped settings forms for identity, contact, hours, social, messaging, homepage, footer, branding preview, and maintenance toggles, plus Reset Demo Data.
- [ ] Build labelled demo analytics metrics, filters, Chart.js traffic/source/device/CTA/funnel charts, visitor insights, journey, loading/empty state controls, and demo-only export.
- [ ] Run `npm test` and verify all Stage 3 contracts pass.

### Task 6: Documentation and production verification

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/database.md`
- Modify: `docs/api.md`

- [ ] Document the admin module boundaries, component lifecycle, safe store envelope, and replacement points for future Supabase adapters.
- [ ] State that frontend demo authentication is not production security and that no sensitive data may be stored.
- [ ] Run `npm test` with zero failures.
- [ ] Run `npm run build` and confirm all eleven admin routes are emitted.
- [ ] Verify login/logout, route protection, shell controls, CRUD, moderation, editor, previews, charts, dialogs, and toasts.
- [ ] Inspect widths 375, 430, 768, 1024, 1280, 1440, and 1920 for overflow and console errors.
