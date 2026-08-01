drop policy if exists cms_media_public_read on storage.objects;

create policy cms_media_admin_select on storage.objects
for select to authenticated
using (bucket_id = 'cms-media' and public.is_cms_admin());
