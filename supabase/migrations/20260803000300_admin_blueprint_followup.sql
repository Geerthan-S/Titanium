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
  add column if not exists video_url text,
  add column if not exists video_thumbnail_url text,
  add column if not exists archived_at timestamptz;

update public.testimonials set status = 'archived' where status = 'unpublished';

alter table public.testimonials
  drop constraint if exists testimonials_status_check;

alter table public.testimonials
  add constraint testimonials_status_check
  check (status in ('draft', 'review', 'scheduled', 'published', 'archived'));

alter table public.testimonials
  drop constraint if exists testimonial_publish_guard;

alter table public.testimonials
  add constraint testimonial_publish_guard check (
    status <> 'published'
    or (
      moderation_status = 'approved'
      and consent_status = 'confirmed'
      and consent_at is not null
      and publication_permission = true
    )
  );

alter table public.treatments
  add column if not exists card_copy text not null default '',
  add column if not exists assessment text not null default '',
  add column if not exists process text not null default '',
  add column if not exists gallery_asset_ids uuid[] not null default '{}',
  add column if not exists doctor_ids uuid[] not null default '{}',
  add column if not exists focal_x numeric(5,4) not null default 0.5,
  add column if not exists focal_y numeric(5,4) not null default 0.5,
  add column if not exists article_ids uuid[] not null default '{}',
  add column if not exists related_treatment_ids uuid[] not null default '{}',
  add column if not exists concern_tags text[] not null default '{}',
  add column if not exists canonical_url text,
  add column if not exists og_image_path text,
  add column if not exists schema_json jsonb,
  add column if not exists reviewed_by_doctor_id uuid references public.doctors(id) on delete set null,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists scheduled_for timestamptz,
  add column if not exists revision_note text not null default '';

alter table public.blog_posts
  add column if not exists category_id uuid references public.blog_categories(id) on delete set null,
  add column if not exists reading_time_minutes integer,
  add column if not exists reviewed_by_doctor_id uuid references public.doctors(id) on delete set null,
  add column if not exists reviewed_by_name text,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists medical_disclaimer text not null default '',
  add column if not exists clinical_review_comments text not null default '',
  add column if not exists treatment_ids uuid[] not null default '{}',
  add column if not exists internal_links text[] not null default '{}',
  add column if not exists canonical_url text,
  add column if not exists og_image_path text,
  add column if not exists scheduled_for timestamptz,
  add column if not exists revision_note text not null default '',
  add column if not exists generated_html_status text not null default 'pending'
    check (generated_html_status in ('pending', 'success', 'failed'));

alter table public.media_assets
  add column if not exists filename text,
  add column if not exists storage_path text,
  add column if not exists category text,
  add column if not exists mime_type text,
  add column if not exists size_bytes integer,
  add column if not exists usage_description text not null default '',
  add column if not exists sort_order integer not null default 1,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id),
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
  unique (metric_date, page_path, query)
);

alter table public.search_console_metrics enable row level security;

drop policy if exists search_console_metrics_admin_all on public.search_console_metrics;
create policy search_console_metrics_admin_all
  on public.search_console_metrics
  for all
  to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());
