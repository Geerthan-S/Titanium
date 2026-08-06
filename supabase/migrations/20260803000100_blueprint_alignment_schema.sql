begin;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'editor' check (role in ('owner', 'editor', 'reviewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.admin_profiles (id, full_name, role, is_active)
select user_id, display_name, 'owner', is_active
from public.cms_admins
on conflict (id) do update set
  full_name = excluded.full_name,
  is_active = excluded.is_active;

create table if not exists public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

update public.doctors set status = 'archived' where status = 'unpublished';
update public.treatments set status = 'archived' where status = 'unpublished';
update public.blog_posts set status = 'archived' where status = 'unpublished';
update public.gallery_items set status = 'archived' where status = 'unpublished';

alter table public.doctors
  add column if not exists verification_status text not null default 'draft'
    check (verification_status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  add column if not exists short_bio text not null default '',
  add column if not exists profile_reviewed_at timestamptz;

alter table public.treatments
  add column if not exists concern_triggers text[] not null default '{}',
  add column if not exists limitations text not null default '',
  add column if not exists aftercare text not null default '',
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists reviewer_doctor_id uuid references public.doctors(id) on delete set null,
  add column if not exists medical_reviewed_at timestamptz,
  add column if not exists noindex boolean not null default false;

alter table public.blog_posts
  add column if not exists deck text not null default '',
  add column if not exists reviewer_doctor_id uuid references public.doctors(id) on delete set null,
  add column if not exists key_takeaways jsonb not null default '[]'::jsonb,
  add column if not exists medical_reviewed_at timestamptz,
  add column if not exists noindex boolean not null default false;

alter table public.doctors drop constraint if exists doctors_status_check;
alter table public.doctors add constraint doctors_status_check
  check (status in ('draft', 'review', 'scheduled', 'published', 'archived'));

alter table public.treatments drop constraint if exists treatments_status_check;
alter table public.treatments add constraint treatments_status_check
  check (status in ('draft', 'review', 'scheduled', 'published', 'archived'));

alter table public.blog_posts drop constraint if exists blog_posts_status_check;
alter table public.blog_posts add constraint blog_posts_status_check
  check (status in ('draft', 'review', 'scheduled', 'published', 'archived'));

alter table public.gallery_items drop constraint if exists gallery_items_status_check;
alter table public.gallery_items add constraint gallery_items_status_check
  check (status in ('draft', 'review', 'scheduled', 'published', 'archived'));

create table if not exists public.treatment_faqs (
  id uuid primary key default gen_random_uuid(),
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.treatment_doctors (
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  relationship_label text not null default 'Provides assessment',
  primary key (treatment_id, doctor_id)
);

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_faqs (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references public.blog_posts(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_treatments (
  blog_id uuid not null references public.blog_posts(id) on delete cascade,
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  primary key (blog_id, treatment_id)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  cloudinary_public_id text not null unique,
  secure_url text not null,
  resource_type text not null default 'image' check (resource_type in ('image', 'video', 'raw')),
  format text not null default '',
  width integer,
  height integer,
  bytes integer,
  folder text not null default 'titanium-roots/gallery',
  title text not null,
  alt_text text not null,
  caption text not null default '',
  tags text[] not null default '{}',
  focal_x numeric(5,4) not null default 0.5,
  focal_y numeric(5,4) not null default 0.5,
  is_gallery_item boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_collection_items (
  collection_id uuid not null references public.gallery_collections(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  sort_order integer not null default 1,
  primary key (collection_id, media_asset_id)
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  section_key text not null,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  updated_at timestamptz not null default now(),
  unique(route, section_key)
);

create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique check (from_path like '/%'),
  to_path text not null check (to_path like '/%'),
  status_code integer not null default 301 check (status_code in (301, 302, 308)),
  reason text not null default '',
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;
alter table public.specialties enable row level security;
alter table public.treatment_faqs enable row level security;
alter table public.treatment_doctors enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_faqs enable row level security;
alter table public.blog_treatments enable row level security;
alter table public.media_assets enable row level security;
alter table public.gallery_collections enable row level security;
alter table public.gallery_collection_items enable row level security;
alter table public.page_sections enable row level security;
alter table public.redirects enable row level security;

grant select on public.treatment_faqs to anon, authenticated;
grant select on public.media_assets to anon, authenticated;
grant select on public.redirects to anon, authenticated;
grant select, insert, update, delete on public.admin_profiles, public.specialties, public.treatment_faqs, public.treatment_doctors, public.blog_categories, public.blog_faqs, public.blog_treatments, public.media_assets, public.gallery_collections, public.gallery_collection_items, public.page_sections, public.redirects to authenticated;

drop policy if exists treatment_faqs_public_read on public.treatment_faqs;
create policy treatment_faqs_public_read on public.treatment_faqs
for select to anon, authenticated using (status = 'published');
drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_public_read on public.media_assets
for select to anon, authenticated using (status = 'active');
drop policy if exists redirects_public_read on public.redirects;
create policy redirects_public_read on public.redirects
for select to anon, authenticated using (true);

drop policy if exists blueprint_admin_profiles_admin on public.admin_profiles;
create policy blueprint_admin_profiles_admin on public.admin_profiles
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_specialties_admin on public.specialties;
create policy blueprint_specialties_admin on public.specialties
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_treatment_faqs_admin on public.treatment_faqs;
create policy blueprint_treatment_faqs_admin on public.treatment_faqs
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_treatment_doctors_admin on public.treatment_doctors;
create policy blueprint_treatment_doctors_admin on public.treatment_doctors
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_blog_categories_admin on public.blog_categories;
create policy blueprint_blog_categories_admin on public.blog_categories
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_blog_faqs_admin on public.blog_faqs;
create policy blueprint_blog_faqs_admin on public.blog_faqs
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_blog_treatments_admin on public.blog_treatments;
create policy blueprint_blog_treatments_admin on public.blog_treatments
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_media_assets_admin on public.media_assets;
create policy blueprint_media_assets_admin on public.media_assets
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_gallery_collections_admin on public.gallery_collections;
create policy blueprint_gallery_collections_admin on public.gallery_collections
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_gallery_collection_items_admin on public.gallery_collection_items;
create policy blueprint_gallery_collection_items_admin on public.gallery_collection_items
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_page_sections_admin on public.page_sections;
create policy blueprint_page_sections_admin on public.page_sections
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());
drop policy if exists blueprint_redirects_admin on public.redirects;
create policy blueprint_redirects_admin on public.redirects
for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());

commit;
