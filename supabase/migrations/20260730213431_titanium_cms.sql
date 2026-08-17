begin;

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
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
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
    table_name in (
      'doctors',
      'treatments',
      'blog_posts',
      'testimonials',
      'gallery_items',
      'seo_pages',
      'site_settings',
      'appointment_requests'
    )
  ),
  record_id text,
  summary text not null check (char_length(summary) <= 240),
  created_at timestamptz not null default now()
);

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
create index testimonials_public_idx
  on public.testimonials (status, moderation_status, consent_status, sort_order);
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

grant select on public.doctors to anon, authenticated;
grant select on public.treatments to anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant select on public.testimonials to anon, authenticated;
grant select on public.gallery_items to anon, authenticated;
grant select on public.seo_pages to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert on public.appointment_requests to anon;
grant insert on public.analytics_events to anon;

grant select, insert, update, delete on public.doctors to authenticated;
grant select, insert, update, delete on public.treatments to authenticated;
grant select, insert, update, delete on public.blog_posts to authenticated;
grant select, insert, update, delete on public.testimonials to authenticated;
grant select, insert, update, delete on public.gallery_items to authenticated;
grant select, insert, update, delete on public.seo_pages to authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select, insert, update, delete on public.appointment_requests to authenticated;
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy cms_media_admin_select on storage.objects
for select to authenticated
using (bucket_id = 'cms-media' and public.is_cms_admin());
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
    'doctors',
    'treatments',
    'blog_posts',
    'testimonials',
    'gallery_items',
    'seo_pages',
    'site_settings'
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

insert into public.site_settings (
  id,
  clinic_identity,
  contact,
  social_links,
  clinic_hours,
  message_templates,
  homepage,
  footer,
  feature_flags,
  brand
) values (
  'primary',
  '{"clinicName":"Titanium Roots Dental Clinic","shortName":"Titanium Roots"}',
  '{"primaryPhone":"+91 98765 43210","alternatePhone":"+91 44 2345 6789","whatsapp":"+91 98765 43210","email":"info@titaniumroots.com","appointmentEmail":"appointments@titaniumroots.com","address":"Karapakkam, OMR, Chennai. Exact landmark shared during appointment confirmation."}',
  '{}',
  '{"Monday":"10:00 AM - 8:00 PM","Tuesday":"10:00 AM - 8:00 PM","Wednesday":"10:00 AM - 8:00 PM","Thursday":"10:00 AM - 8:00 PM","Friday":"10:00 AM - 8:00 PM","Saturday":"10:00 AM - 8:00 PM","Sunday":"By appointment only"}',
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

insert into public.seo_pages (
  route,
  meta_title,
  meta_description,
  canonical_url,
  og_title,
  og_description
) values
  (
    '/',
    'Titanium Roots Dental Clinic',
    'Advanced prosthodontics and implant dentistry at Titanium Roots Dental Clinic in Karapakkam, OMR, Chennai.',
    'https://titaniumroots.com/',
    'Titanium Roots Dental Clinic',
    'Advanced prosthodontics and implant dentistry in Karapakkam, OMR, Chennai.'
  ),
  (
    '/about.html',
    'About Titanium Roots Dental Clinic',
    'Learn about Titanium Roots Dental Clinic, our approach to comfortable care and our commitment to clear communication.',
    'https://titaniumroots.com/about.html',
    'About Titanium Roots Dental Clinic',
    'Comfortable dental care, clear communication and thoughtful treatment planning.'
  ),
  (
    '/doctors.html',
    'Dental Doctors | Titanium Roots',
    'Meet the dental professionals providing considered, patient-focused care at Titanium Roots Dental Clinic.',
    'https://titaniumroots.com/doctors.html',
    'Dental Doctors | Titanium Roots',
    'Meet the dental professionals at Titanium Roots Dental Clinic.'
  ),
  (
    '/treatments.html',
    'Dental Treatments | Titanium Roots',
    'Explore dental treatments available at Titanium Roots Dental Clinic, with options explained after personal assessment.',
    'https://titaniumroots.com/treatments.html',
    'Dental Treatments | Titanium Roots',
    'Explore treatment options at Titanium Roots Dental Clinic.'
  ),
  (
    '/blog.html',
    'Dental Blog | Titanium Roots',
    'Read general dental-care guidance and appointment-planning information from Titanium Roots Dental Clinic.',
    'https://titaniumroots.com/blog.html',
    'Dental Blog | Titanium Roots',
    'General dental-care guidance from Titanium Roots Dental Clinic.'
  ),
  (
    '/testimonials.html',
    'Patient Testimonials | Titanium Roots',
    'Read approved patient feedback published with confirmed consent by Titanium Roots Dental Clinic.',
    'https://titaniumroots.com/testimonials.html',
    'Patient Testimonials | Titanium Roots',
    'Approved patient feedback published with confirmed consent.'
  ),
  (
    '/contact.html',
    'Contact Titanium Roots Dental Clinic',
    'Contact Titanium Roots Dental Clinic in Karapakkam, OMR, Chennai, or request a dental appointment online.',
    'https://titaniumroots.com/contact.html',
    'Contact Titanium Roots Dental Clinic',
    'Contact our clinic or request a dental appointment online.'
  )
on conflict (route) do update set
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description,
  canonical_url = excluded.canonical_url,
  og_title = excluded.og_title,
  og_description = excluded.og_description;

insert into public.treatments (
  name,
  slug,
  category,
  short_description,
  full_description,
  duration,
  visits,
  pricing_status,
  benefits,
  suitability,
  procedure_steps,
  recovery,
  featured,
  status,
  sort_order
) values
  (
    'General Dentistry',
    'general-dentistry',
    'General dentistry',
    'Preventive and restorative dental care planned around your oral health needs.',
    'General dentistry begins with a careful assessment and a clear discussion of findings, priorities and suitable care options.',
    'Timeline discussed after consultation',
    'Visits depend on treatment plan',
    'consultation_required',
    'Preventive guidance, clear treatment planning and ongoing oral-health support',
    'Your dentist will recommend suitable care after examination.',
    'Assessment, discussion, agreed care and review are planned around your needs.',
    'Individual aftercare guidance is provided for any treatment completed.',
    true,
    'published',
    1
  ),
  (
    'Cosmetic Dentistry',
    'cosmetic-dentistry',
    'Smile aesthetics',
    'Thoughtful cosmetic options designed around your smile goals and oral health.',
    'Cosmetic treatment discussions begin with your goals, dental health and a clear explanation of suitable options.',
    'Timeline discussed after consultation',
    'Visits depend on treatment plan',
    'consultation_required',
    'Personalised smile goals, clearly explained options and health-led planning',
    'Your dentist will discuss suitable options after assessing your oral health and goals.',
    'Consultation, assessment, treatment planning and care are tailored to the chosen option.',
    'Aftercare depends on the treatment selected and is explained before proceeding.',
    true,
    'published',
    2
  ),
  (
    'Dental Implants',
    'dental-implants',
    'Restorative dentistry',
    'Advanced titanium root implant planning for replacing missing teeth with a stable, natural-looking result.',
    'Dental implants replace the missing root as well as the visible tooth. At Titanium Roots, implant consultations combine prosthodontic planning, AI-assisted diagnostics and Digital Smile Design to plan single titanium roots, implant-supported crowns and full-mouth rehabilitation.',
    'Timeline discussed after consultation',
    'Visits depend on treatment plan',
    'consultation_required',
    'Biocompatible titanium roots, bone preservation support and prosthodontic precision for the final restoration',
    'Suitability is confirmed after a clinical examination, bone assessment and prosthodontic treatment planning discussion.',
    'Assessment, diagnostics, implant planning, healing review and final crown or prosthetic restoration are discussed with your dentist.',
    'Aftercare, healing timelines and maintenance guidance depend on the treatment plan and are explained during consultation.',
    true,
    'published',
    3
  ),
  (
    'Orthodontics',
    'orthodontics',
    'Smile alignment',
    'Guided treatment options for patients exploring tooth alignment and bite concerns.',
    'Orthodontic treatment is planned after reviewing tooth position, bite and individual treatment goals.',
    'Timeline discussed after consultation',
    'Follow-up visits vary',
    'consultation_required',
    'Clear treatment planning, scheduled follow-up care and individually reviewed options',
    'Suitability and treatment options are assessed by the dentist after examination.',
    'Assessment, records, planning, active treatment and review appointments are discussed clearly.',
    'Care instructions and retention planning are provided according to the selected treatment.',
    true,
    'published',
    4
  ),
  (
    'Root Canal Treatment',
    'root-canal-treatment',
    'Restorative dentistry',
    'Care focused on protecting and restoring a natural tooth when clinically appropriate.',
    'Root canal treatment may be considered when a dentist determines that care is needed inside a tooth. Your dentist will explain the findings and available options.',
    'Timeline discussed after consultation',
    'Visits depend on treatment plan',
    'consultation_required',
    'Focus on retaining a natural tooth, explained treatment stages and planned restorative follow-up',
    'A dentist confirms whether this treatment is appropriate following examination.',
    'Assessment, treatment planning, care and any recommended restoration are explained before proceeding.',
    'Your dentist will provide individual aftercare guidance and explain what to expect after treatment.',
    true,
    'published',
    5
  ),
  (
    'Teeth Whitening',
    'teeth-whitening',
    'Smile aesthetics',
    'Professional guidance for patients considering a brighter-looking smile.',
    'Teeth whitening options are discussed after an oral health assessment and a conversation about your expectations.',
    'Timeline discussed after consultation',
    'Visits depend on treatment plan',
    'consultation_required',
    'Professional assessment, clear expectations and personalised aftercare guidance',
    'A dentist confirms whether whitening is appropriate after examination.',
    'Assessment, shade discussion, treatment planning and aftercare are explained before treatment.',
    'Your dentist will explain individual aftercare and maintenance guidance.',
    true,
    'published',
    6
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

commit;
