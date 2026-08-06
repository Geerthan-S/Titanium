do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'admin_profiles' and column_name = 'user_id') then
    alter table public.admin_profiles rename column user_id to id;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'admin_profiles' and column_name = 'display_name') then
    alter table public.admin_profiles rename column display_name to full_name;
  end if;
end $$;
