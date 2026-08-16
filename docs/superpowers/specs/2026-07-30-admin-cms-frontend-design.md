# Admin CMS Frontend Design

## Goal

Replace the placeholder Titanium Roots admin pages with a complete, frontend-only clinic CMS that works in Vite development and production builds without changing public-page designs.

## Approved Scope

The attached Phase 9 quotation is the source of truth. The admin includes login, dashboard, appointments and leads, doctors, treatments, blogs, testimonials, gallery, SEO, settings, and analytics. It excludes Services CMS, Users Management, public registration, Supabase, real authentication, real uploads, real analytics, backend APIs, and sensitive patient data.

## Architecture

- Each admin route uses the same minimal HTML shell and page-specific `data-admin-page` value.
- `assets/js/pages/admin.js` is the only page entry point.
- `assets/js/admin/admin-app.js` guards protected routes, loads shared components, initializes the shell, and dispatches the current page controller.
- Reusable modules isolate demo authentication, versioned local storage, table behavior, form/drawer behavior, confirmation dialogs, charts, the blog editor, and shared utilities.
- Management pages use configuration objects for fields, columns, filters, status actions, and preview behavior. This prevents duplicated CRUD logic while retaining page-specific data rules.

## Shared Experience

The admin shell uses a deep emerald collapsible sidebar, warm ivory workspace, restrained white panels, sage status badges, champagne details, and readable Inter typography. Playfair Display is reserved for primary page headings. Desktop uses a persistent sidebar; tablet and mobile use a keyboard-accessible drawer. Tables become stacked record cards on small screens.

The header provides page title, breadcrumb, command-bar access, notification placeholder, View Website, profile menu, and mobile navigation. Shared confirmation and command dialogs trap focus, close on Escape, and return focus.

## Demo Authentication and Data

The login adapter writes a non-sensitive demo session to `sessionStorage`; it never reads, logs, or stores the submitted password. Protected routes redirect to login when the session is absent. Logout clears the session.

The CMS store uses a versioned localStorage envelope and seeds safe mock records once. Corrupted data resets to safe seeds. Demo appointments use labels such as “Demo Appointment 01” and contain no health concerns, reports, passwords, or real patient data. Reset Demo Data is available in Settings.

## CMS Modules

- Dashboard: demo metric cards, recent leads, content status, quick actions, traffic chart, lead summary, and activity.
- Appointments: filters, pagination, status updates, detail drawer, notes, communication links, archive, and delete.
- Doctors, Treatments, Blogs: add/edit/delete, publish and feature actions, preview, ordering, search, and required domain fields.
- Testimonials: consent-aware moderation; public publishing is blocked unless approved and consent-confirmed.
- Gallery: mock upload validation, temporary object URL previews, grid/list views, metadata editing, copy URL, and deletion.
- SEO: page selector, counters, warnings, search/social previews, save/reset, and read-only sitemap/robots previews.
- Settings: grouped clinic, contact, hours, social, messaging, homepage, footer, branding, and maintenance settings.
- Analytics: clearly labelled demo metrics, Chart.js charts, visitor insights, journey, date controls, loading/empty states, and demo-only export.

## Security and Accessibility

All rendered user-controlled strings are escaped. Blog previews use a strict sanitizer that removes scripts, event handlers, and unsafe URLs. Destructive actions require confirmation. File inputs validate type and retain metadata only. No secrets or sensitive data are stored.

Every route includes skip navigation, semantic landmarks, visible focus, labelled forms, touch-friendly controls, responsive tables/cards, accessible dialogs, reduced-motion support, and no required horizontal scrolling.

## Verification

Automated tests cover route shells, forbidden navigation items, demo auth behavior, store recovery, sanitization, status rules, and build inclusion. Browser verification covers every route, login/logout, route protection, CRUD paths, dialogs, charts, editor, responsive widths from 375 to 1920 pixels, console errors, and horizontal overflow.
