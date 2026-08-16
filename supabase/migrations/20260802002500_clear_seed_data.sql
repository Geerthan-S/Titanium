-- Clear baseline "dummy" seed data to ensure the CMS starts completely blank
-- as requested by the clinic administrator.
-- Note: This does not clear structural site_settings or seo_pages.

delete from public.treatments;
delete from public.blog_posts;
delete from public.doctors;
delete from public.testimonials;
