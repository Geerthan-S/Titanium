# Production Readiness and CMS Content Design

## Objective

Prepare Titanium Roots for an initial production operating period while keeping all public content under the existing Supabase CMS. Add Testimonials to the primary navigation, but leave testimonial records for the clinic to enter after obtaining real patient approval.

## Content integrity

- New public content must be stored in Supabase tables and loaded through the existing repositories. Do not introduce hard-coded public fallback collections.
- Do not invent patient testimonials, licensed clinicians, qualifications, registration numbers, clinic addresses, phone numbers, email addresses, or treatment prices.
- Preserve the existing connected CMS doctor record rather than adding fictional clinicians.
- Preserve current clinic contact fields until the clinic supplies verified replacements. Documentation must identify any obvious placeholder values that must be replaced before public promotion.
- Add factual, general dental-care content only: treatment explanations, educational articles, service categories, calls to consultation, metadata, and operational copy that does not claim a diagnosis or guaranteed outcome.

## Public navigation and Testimonials

Add a `Testimonials` link between `Doctors` and `Blog` in the shared primary navigation. It must work in desktop and mobile navigation and receive the existing `aria-current="page"` active state on `/testimonials.html`.

Keep `/testimonials.html` as a separate CMS-backed route. Improve its visual hierarchy and empty state so an empty approved-testimonial collection looks intentional. The empty state must explain that patient stories appear only after consent and clinic approval and offer a clear appointment/contact action. No fabricated review cards will be rendered.

## CMS content

Create a new forward-only, idempotent Supabase migration for production content. It will:

- enrich the existing treatment catalogue with accurate general descriptions, suitability language, process summaries, aftercare guidance, and consultation-based pricing status;
- add a small collection of original educational blog posts written in a neutral clinic voice and attributed to `Titanium Roots Clinical Team`, not to a fictional individual;
- complete public SEO records for every public route, including Testimonials;
- improve safe global site copy and operating messages without overwriting unverified contact identity fields;
- leave the `testimonials` table unchanged;
- leave clinician identity records unchanged;
- use deterministic slugs and `ON CONFLICT` updates so repeated application does not duplicate content.

The migration will contain no passwords, privileged keys, private patient information, fabricated appointments, analytics, or audit entries.

## Media

Do not create database paths for files that do not exist in Supabase Storage. Existing local clinic and neutral placeholder assets may remain as frontend fallbacks. CMS image fields stay null until approved media is uploaded through the admin interface. Gallery records will not be invented without matching stored objects.

## Security corrections

Restore the designed administrator boundary:

- `public.is_cms_admin()` must require an active `cms_admins` row for `auth.uid()`;
- both browser authorization modules must verify that membership;
- tests must reject the current “every authenticated user is an administrator” behavior;
- local Supabase email signup must be disabled to match the connected project;
- the existing public read policies and private appointment/analytics protections remain in place.

Public form abuse protection that requires a production CAPTCHA provider or Edge Function secret will be documented as a deployment requirement rather than implemented with invented credentials.

## Production assets and documentation

- Populate `public/robots.txt` with an indexable production policy and sitemap reference.
- Populate `public/sitemap.xml` with all public routes, including Testimonials.
- Replace the empty favicon with a valid project asset derived from the existing brand mark or a simple brand-safe icon.
- Add a practical README covering setup, environment variables, migrations, content replacement, tests, build, and deployment.
- Clearly list the contact details and content that the clinic must verify before public promotion.

## Testing strategy

Follow test-driven development for behavioral changes:

1. Add failing tests for the Testimonials primary-nav link and active route.
2. Add failing tests for an intentional consent-aware empty Testimonials state.
3. Add failing migration tests for CMS-backed blog/treatment/SEO content and the absence of testimonial or clinician seeds.
4. Replace the permissive-auth tests with failing allowlist-authorization expectations.
5. Implement the minimum changes required to pass each test.
6. Run the focused tests, full Node test suite, syntax checks, production build, and safe public Supabase reads.

Live tests that create appointment or analytics rows will not be run against the connected project unless explicitly requested. Browser tests must not depend on obsolete demo credentials.

## Deployment boundary

Repository changes and migrations will be completed locally. Applying the new migration to the connected Supabase project is permitted by the approved scope, but requires an authenticated Supabase CLI/MCP session. If no authenticated deployment mechanism is available, the migration will be left ready to apply and the exact blocking requirement will be reported.

No deployment to a public hosting provider is included because no hosting target or credentials have been supplied.

## Acceptance criteria

- Testimonials is visible and keyboard-accessible in the primary navigation on desktop and mobile.
- The Testimonials route renders a polished empty state when no approved records exist.
- No testimonial or clinician identities are fabricated.
- Treatments, educational blogs, SEO, and safe global copy are represented in an idempotent CMS migration.
- CMS authorization once again depends on active `cms_admins` membership.
- Production robots, sitemap, favicon, README, and deployment guidance are non-empty and usable.
- Focused tests pass, and final reporting distinguishes verified success from missing local dependencies or unavailable external credentials.
