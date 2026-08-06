begin;

create table if not exists public.website_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  title text not null,
  page text not null,
  section text not null,
  image_path text not null,
  alt_text text,
  status text not null default 'published' check (status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Enable RLS
alter table public.website_assets enable row level security;

-- Drop existing policies if any
drop policy if exists website_assets_public_read on public.website_assets;
drop policy if exists website_assets_admin_all on public.website_assets;

-- Create policies
create policy website_assets_public_read on public.website_assets
  for select to public
  using (true);

create policy website_assets_admin_all on public.website_assets
  for all to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());

-- Seed data
insert into public.website_assets (asset_key, title, page, section, image_path, alt_text, sort_order)
values
  ('home_hero_image', 'Home Hero Reception', 'home', 'hero', '/assets/images/home/clinic-reception.webp', 'Titanium Roots clinic reception with seating and architectural lighting', 10),
  ('home_clinic_main_image', 'Home Clinic Main Reception', 'home', 'our_clinic', '/assets/images/home/clinic-reception.webp', 'Bright and welcoming reception area of Titanium Roots Dental Clinic with warm lighting.', 20),
  ('home_clinic_supporting_image_1', 'Home Clinic Support Operatory', 'home', 'our_clinic', '/temp_images/checkup.jpg', 'State-of-the-art dental operatory room featuring modern dental chairs and equipment.', 30),
  ('home_clinic_supporting_image_2', 'Home Clinic Support Lounge', 'home', 'our_clinic', '/temp_images/sensitivity.jpg', 'Relaxing waiting lounge designed for comfort.', 40),
  ('about_hero_image', 'About Hero Reception', 'about', 'hero', '/assets/images/home/clinic-reception.webp', 'Titanium Roots clinic reception with seating and architectural lighting', 50),
  ('about_story_image', 'About Story Consultation', 'about', 'our_story', '/assets/images/placeholders/clinic-neutral.svg', 'Patient-care consultation environment', 60),
  ('about_clinic_image', 'About Page Clinic Image', 'about', 'clinic', '/assets/images/placeholders/clinic-neutral.svg', 'Warm and welcoming clinic operatory', 70),
  ('testimonials_hero_image', 'Testimonials Hero Consultation', 'testimonials', 'hero', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=800', 'Patient consulting with dentist', 80),
  ('contact_hero_image', 'Contact Hero Placeholder', 'contact', 'hero', '/assets/images/placeholders/clinic-neutral.svg', 'Contact our dental team', 90)
on conflict (asset_key) do update set
  title = excluded.title,
  page = excluded.page,
  section = excluded.section,
  image_path = excluded.image_path,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order;

commit;
