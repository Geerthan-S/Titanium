import { DataError, throwIfError } from './data-errors.js';
import { stockMedia } from './media-assets.js';
import { storagePathFor } from './record-mappers.js';
import { requireSupabase } from './supabase-client.js';

const STANDARD_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;
const LOCAL_MEDIA_FALLBACKS = new Map([
  ['assets/images/stock/blog-insight.jpg', stockMedia.blog],
  ['assets/images/stock/clinic-gallery.webp', stockMedia.clinic],
  ['assets/images/stock/doctor-profile.jpg', stockMedia.doctor],
  ['assets/images/stock/patient-story.jpg', stockMedia.patient],
  ['assets/images/stock/treatment-care.jpg', stockMedia.treatment],
  ['assets/images/stock/video-testimonial.jpg', stockMedia.video],
  ['cms-media/assets/images/stock/blog-insight.jpg', stockMedia.blog],
  ['cms-media/assets/images/stock/clinic-gallery.webp', stockMedia.clinic],
  ['cms-media/assets/images/stock/doctor-profile.jpg', stockMedia.doctor],
  ['cms-media/assets/images/stock/patient-story.jpg', stockMedia.patient],
  ['cms-media/assets/images/stock/treatment-care.jpg', stockMedia.treatment],
  ['cms-media/assets/images/stock/video-testimonial.jpg', stockMedia.video],
  ['assets/images/home/clinic-reception.webp', stockMedia.treatment],
  ['cms-media/assets/images/home/clinic-reception.webp', stockMedia.treatment],
  ['seed/reception-neutral.svg', stockMedia.clinic],
  ['seed/operatory-neutral.svg', stockMedia.treatment],
  ['seed/sterilization-neutral.svg', stockMedia.video],
  ['cms-media/seed/reception-neutral.svg', stockMedia.clinic],
  ['cms-media/seed/operatory-neutral.svg', stockMedia.treatment],
  ['cms-media/seed/sterilization-neutral.svg', stockMedia.video],
]);

export function validateCmsMedia(file) {
  const allowed = STANDARD_IMAGE_TYPES;
  if (!file || !allowed.has(file.type)) {
    throw new DataError('Use JPG, PNG or WebP.');
  }
  if (file.size > MAX_BYTES) throw new DataError('Images must be 5 MB or smaller.');
  return true;
}

export async function uploadCmsMedia({
  file,
  collection,
  recordId,
}) {
  validateCmsMedia(file);
  const path = storagePathFor(collection, recordId, file.name);
  const { data, error } = await requireSupabase()
    .storage
    .from('cms-media')
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  throwIfError(error, 'Unable to upload the image.');
  return data.path;
}

export async function removeCmsMedia(path) {
  if (!path) return;
  const { error } = await requireSupabase().storage.from('cms-media').remove([path]);
  throwIfError(error, 'Unable to remove the image.');
}

export function publicMediaUrl(path) {
  if (!path) return '';
  const normalizedPath = String(path).replace(/^\/+/, '');
  if (LOCAL_MEDIA_FALLBACKS.has(normalizedPath)) return LOCAL_MEDIA_FALLBACKS.get(normalizedPath);
  if (normalizedPath.startsWith('assets/images/')) return `/${normalizedPath}`;
  if (normalizedPath.startsWith('cms-media/assets/images/')) {
    return `/${normalizedPath.replace(/^cms-media\//, '')}`;
  }
  const { data } = requireSupabase().storage.from('cms-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function replaceCmsMedia({
  file,
  collection,
  recordId,
  previousPath,
  persist,
}) {
  const plannedPath = storagePathFor(collection, recordId, file.name);
  const uploadRecordId = previousPath === plannedPath
    ? `${recordId}-${crypto.randomUUID()}`
    : recordId;
  const nextPath = await uploadCmsMedia({
    file,
    collection,
    recordId: uploadRecordId,
  });
  try {
    const result = await persist(nextPath);
    if (previousPath && previousPath !== nextPath) await removeCmsMedia(previousPath);
    return result;
  } catch (error) {
    await removeCmsMedia(nextPath).catch(() => {});
    throw error;
  }
}
