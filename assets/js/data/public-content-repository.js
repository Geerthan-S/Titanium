import { DataError, throwIfError } from './data-errors.js';
import {
  mapBlogFromDatabase,
  mapDoctorFromDatabase,
  mapGalleryFromDatabase,
  mapSeoFromDatabase,
  mapSettingsFromDatabase,
  mapTestimonialFromDatabase,
  mapTreatmentFromDatabase,
  mapWebsiteAssetFromDatabase,
} from './record-mappers.js';
import { requireSupabase } from './supabase-client.js';

const MAPPERS = Object.freeze({
  doctors: mapDoctorFromDatabase,
  treatments: mapTreatmentFromDatabase,
  blogs: mapBlogFromDatabase,
  testimonials: mapTestimonialFromDatabase,
  gallery: mapGalleryFromDatabase,
  seo: mapSeoFromDatabase,
  websiteAssets: mapWebsiteAssetFromDatabase,
});

export async function fetchPublicCollection(name) {
  const client = requireSupabase();
  const queries = {
    doctors: () => client.from('doctors').select('*').eq('status', 'published').order('sort_order'),
    treatments: () => client.from('treatments').select('*').eq('status', 'published').order('sort_order'),
    blogs: () => client
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .lte('publish_at', new Date().toISOString())
      .order('publish_at', { ascending: false }),
    testimonials: () => client
      .from('testimonials')
      .select('*')
      .eq('status', 'published')
      .eq('moderation_status', 'approved')
      .eq('consent_status', 'confirmed')
      .order('sort_order'),
    gallery: () => client.from('gallery_items').select('*').eq('status', 'published').order('sort_order'),
    seo: () => client.from('seo_pages').select('*').order('route'),
    settings: () => client.from('site_settings').select('*').eq('id', 'primary').single(),
    websiteAssets: () => client.from('website_assets').select('*').eq('status', 'published').order('sort_order'),
  };
  const query = queries[name];
  if (!query) throw new DataError(`Unknown public collection: ${name}`, { code: 'INVALID_COLLECTION' });
  const { data, error } = await query();
  throwIfError(error, `Unable to load ${name}.`);
  if (name === 'settings') return mapSettingsFromDatabase(data);
  return (data || []).map(MAPPERS[name]);
}
