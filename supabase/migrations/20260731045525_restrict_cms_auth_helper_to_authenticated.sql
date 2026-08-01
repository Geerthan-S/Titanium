begin;

revoke all on function public.is_cms_admin() from anon;
revoke all on function public.is_cms_admin() from public;
grant execute on function public.is_cms_admin() to authenticated;

commit;
