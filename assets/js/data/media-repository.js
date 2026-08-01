import { DataError, throwIfError } from './data-errors.js';
import { storagePathFor } from './record-mappers.js';
import { requireSupabase } from './supabase-client.js';

const STANDARD_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const BRAND_IMAGE_TYPES = new Set([...STANDARD_IMAGE_TYPES, 'image/svg+xml']);
const MAX_BYTES = 5 * 1024 * 1024;

export function validateCmsMedia(file, { allowSvg = false } = {}) {
  const allowed = allowSvg ? BRAND_IMAGE_TYPES : STANDARD_IMAGE_TYPES;
  if (!file || !allowed.has(file.type)) {
    throw new DataError(allowSvg ? 'Use JPG, PNG, WebP or an approved SVG.' : 'Use JPG, PNG or WebP.');
  }
  if (file.size > MAX_BYTES) throw new DataError('Images must be 5 MB or smaller.');
  return true;
}

export async function uploadCmsMedia({
  file,
  collection,
  recordId,
  allowSvg = false,
}) {
  validateCmsMedia(file, { allowSvg });
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
  const { data } = requireSupabase().storage.from('cms-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function replaceCmsMedia({
  file,
  collection,
  recordId,
  previousPath,
  persist,
  allowSvg = false,
}) {
  const plannedPath = storagePathFor(collection, recordId, file.name);
  const uploadRecordId = previousPath === plannedPath
    ? `${recordId}-${crypto.randomUUID()}`
    : recordId;
  const nextPath = await uploadCmsMedia({
    file,
    collection,
    recordId: uploadRecordId,
    allowSvg,
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
