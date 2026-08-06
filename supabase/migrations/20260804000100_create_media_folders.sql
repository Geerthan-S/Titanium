-- Create media_folders table
create table if not exists public.media_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.media_folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Index parent_id for faster lookup
create index if not exists media_folders_parent_id_idx on public.media_folders (parent_id);

-- Alter media_assets to add folder_id column referencing media_folders
alter table public.media_assets 
  add column if not exists folder_id uuid references public.media_folders(id) on delete cascade;

-- Enable Row Level Security (RLS) on media_folders
alter table public.media_folders enable row level security;

-- Grant permissions on media_folders
grant select on public.media_folders to anon, authenticated;
grant insert, update, delete on public.media_folders to authenticated;

-- Policies for media_folders
drop policy if exists folders_public_read on public.media_folders;
create policy folders_public_read on public.media_folders
  for select using (true);

drop policy if exists folders_admin_all on public.media_folders;
create policy folders_admin_all on public.media_folders
  for all to authenticated using (true) with check (true);

-- Add to Realtime publication
alter publication supabase_realtime add table public.media_folders;
