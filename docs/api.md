# Supabase Data API Boundaries

Environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

These are browser-public identifiers. No privileged key is required by the application.

Public reads are limited by RLS to published CMS rows and the primary site-settings row. Appointment inserts accept contact/request fields, force the initial status, require consent, and cannot set internal notes. Analytics accepts only `page_view`, `cta_click`, `whatsapp_click`, `phone_click`, and `appointment_submit`; it does not receive form values, query strings, user agents, or fingerprints.

Authenticated CMS operations use the current Supabase Auth session plus the active `cms_admins` membership check. All rich article HTML is sanitized before storage and again before dynamic rendering.

Realtime listens to published-content tables and re-fetches through the same RLS-protected public query. Storage uploads are validated to 5 MiB and accepted image MIME types, uploaded before the CMS path is committed, and cleaned up on replacement failure.

Password recovery uses Supabase Auth reset links targeting `/admin/reset-password.html`.
