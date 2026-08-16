# Supabase Database

The migration set under `supabase/migrations/` defines eleven typed public tables: administrators, doctors, treatments, blog posts, testimonials, gallery items, SEO pages, site settings, appointment requests, analytics events, and the CMS audit log.

RLS is enabled on every table. Anonymous users can read only publishable public content/settings and can insert constrained appointment and analytics rows. Authenticated users receive CMS access only when `public.is_cms_admin()` confirms an active membership. Storage listing and all Storage mutations are administrator-only; public object URLs remain available for approved paths.

Apply migrations with the linked Supabase project workflow or `supabase db push` after authenticating the CLI. Inspect history with `npm run supabase:migrations`. Rollbacks must be reviewed and applied as new corrective migrations; do not rewrite migration history after production use.

The administrator account is bootstrapped by creating the Auth user and a matching active `cms_admins` row. Passwords are set or recovered through the email reset flow and are never stored in source.

Appointment public messages are separate from administrator-only follow-up notes. Analytics rows contain only event type, pathname, referrer domain, and timestamp.
