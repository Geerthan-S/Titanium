begin;

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

revoke all on function public.is_cms_admin() from anon;
revoke all on function public.is_cms_admin() from public;
grant execute on function public.is_cms_admin() to authenticated;

commit;
