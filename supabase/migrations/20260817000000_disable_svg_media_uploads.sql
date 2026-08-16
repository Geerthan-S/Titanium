begin;

delete from public.gallery_items
where mime_type = 'image/svg+xml';

alter table public.gallery_items
drop constraint if exists gallery_items_mime_type_check;

alter table public.gallery_items
add constraint gallery_items_mime_type_check
check (mime_type in ('image/jpeg', 'image/png', 'image/webp'));

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'cms-media';

commit;
