import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile, cp, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile(resolve('.env'));
} catch {
  // CI and hosting providers inject environment variables directly.
}

const url = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !publishableKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required for the production build.');
}

const client = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const siteOrigin = String(process.env.VITE_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://titaniumroots.com').replace(/\/+$/, '');
const requiredRoutes = ['/', '/about.html', '/doctors.html', '/treatments.html', '/blog.html', '/testimonials.html', '/contact.html'];

const staticSeo = {
  '/': ['Dental Implants in Chennai | Titanium Roots', 'Book implant, prosthodontic, Digital Smile Design and general dental care at Titanium Roots Dental Clinic in Chennai.'],
  '/about.html': ['About Titanium Roots | Prosthodontic Dental Clinic', 'Learn about Titanium Roots Dental Clinic, our prosthodontic planning, implant focus, Digital Smile Design and patient-first dental care.'],
  '/doctors.html': ['Dental Specialists in Chennai | Titanium Roots', 'Meet the Titanium Roots dental team for implant, restorative, cosmetic and preventive dental-care consultations.'],
  '/treatments.html': ['Dental Treatments in Chennai | Titanium Roots', 'Explore dental implants, prosthodontics, root canal treatment, orthodontics, cosmetic dentistry and preventive dental care.'],
  '/blog.html': ['Dental Care Articles | Titanium Roots', 'Read practical dental-care, implant, prosthodontic and oral-health guidance from Titanium Roots Dental Clinic.'],
  '/testimonials.html': ['Patient Testimonials | Titanium Roots', 'Read consent-approved patient feedback and privacy-aware experience information from Titanium Roots Dental Clinic.'],
  '/contact.html': ['Book Dentist Appointment | Titanium Roots Chennai', 'Request a dental consultation at Titanium Roots Dental Clinic for implants, smile design, dentures, second opinions and general care.'],
};

function canonicalForRoute(route) {
  return `${siteOrigin}${route === '/' ? '/' : route}`;
}

function truncate(value = '', max = 160) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3).replace(/\s+\S*$/, '')}...`;
}

function normalizeRecord(record) {
  const route = record.route || '/';
  const tuned = staticSeo[route];
  const metaTitle = tuned?.[0] || record.meta_title || record.og_title || 'Titanium Roots Dental Clinic';
  const metaDescription = tuned?.[1] || record.meta_description || record.og_description || 'Dental care and appointment information from Titanium Roots Dental Clinic.';
  return {
    ...record,
    meta_title: truncate(metaTitle, 60),
    meta_description: truncate(metaDescription, 160),
    canonical_url: canonicalForRoute(route),
    og_title: truncate(record.og_title || metaTitle, 60),
    og_description: truncate(record.og_description || metaDescription, 160),
    should_index: record.should_index !== false,
    should_follow: record.should_follow !== false,
    include_in_sitemap: record.include_in_sitemap !== false,
  };
}

function treatmentSeo(treatment) {
  const name = treatment.name || 'Dental Treatment';
  const lower = `${name} ${treatment.slug || ''}`.toLowerCase();
  if (lower.includes('implant')) {
    return {
      title: `${name} in Chennai | Titanium Roots`,
      description: `${name} planned with prosthodontic precision, biocompatible titanium roots, digital diagnostics and clear consultation at Titanium Roots Dental Clinic.`,
    };
  }
  if (lower.includes('denture') || lower.includes('crown') || lower.includes('bridge')) {
    return {
      title: `${name} | Prosthodontic Care`,
      description: `${name} for restoring comfort, bite function and natural-looking aesthetics after clinical assessment at Titanium Roots Dental Clinic.`,
    };
  }
  if (lower.includes('smile') || lower.includes('veneer') || lower.includes('whitening') || lower.includes('aligner')) {
    return {
      title: `${name} | Titanium Roots`,
      description: `${name} with clear planning, aesthetic detail and treatment suitability confirmed after consultation at Titanium Roots Dental Clinic.`,
    };
  }
  return {
    title: `${name} | Titanium Roots Dental Clinic`,
    description: treatment.short_description || `Learn about ${name}, suitability, benefits and appointment options at Titanium Roots Dental Clinic.`,
  };
}

function doctorSeo(doctor) {
  const name = doctor.name || 'Dental Specialist';
  return {
    title: `${name} | Titanium Roots Dental Clinic`,
    description: doctor.short_bio || `Book a consultation with ${name} at Titanium Roots Dental Clinic for assessment-led dental care and treatment planning.`,
  };
}

function fallbackRecords() {
  return requiredRoutes.map((route) => {
    const [metaTitle, metaDescription] = staticSeo[route];
    const canonicalPath = route === '/' ? '/' : route;
    return {
      route,
      meta_title: metaTitle,
      meta_description: metaDescription,
      canonical_url: canonicalForRoute(canonicalPath),
      og_title: metaTitle,
      og_description: metaDescription,
      og_image_path: '',
      should_index: true,
      should_follow: true,
      include_in_sitemap: true,
    };
  });
}

async function loadCachedRecords() {
  try {
    const cache = JSON.parse(await readFile(resolve('.cache/seo-pages.json'), 'utf8'));
    return Array.isArray(cache.records) && cache.records.length ? cache.records : null;
  } catch {
    return null;
  }
}

async function fetchSeoRecords() {
  const { data, error } = await client
    .from('seo_pages')
    .select('route,meta_title,meta_description,canonical_url,og_title,og_description,og_image_path,should_index,should_follow,include_in_sitemap')
    .order('route');
  if (error) throw new Error(error.message);
  return (data || []).map(normalizeRecord);
}

let records;
try {
  records = await fetchSeoRecords();
} catch (error) {
  records = (await loadCachedRecords() || fallbackRecords()).map(normalizeRecord);
  console.warn(`Unable to fetch public SEO records; using ${records.length} cached/static records. ${error.message}`);
}

for (const route of requiredRoutes) {
  const record = records.find((item) => item.route === route);
  if (!record?.meta_title || !record?.meta_description || !record?.canonical_url) {
    throw new Error(`SEO record is incomplete for ${route}.`);
  }
}

await mkdir(resolve('.cache'), { recursive: true });

let treatmentsBase = [];
try {
  const { data } = await client.from('treatments').select('name, slug, short_description').eq('status', 'published');
  treatmentsBase = data || [];
} catch {
  // Supabase unavailable, skip dynamic treatment pages
}
if (treatmentsBase.length > 0) {
  await mkdir(resolve('treatments'), { recursive: true });
  for (const t of treatmentsBase) {
    if (!t.slug) continue;
    const route = `/treatments/${t.slug}.html`;
    const seo = treatmentSeo(t);
    await cp(resolve('treatments.html'), resolve(`treatments/${t.slug}.html`));
    records.push(normalizeRecord({
      route,
      meta_title: seo.title,
      meta_description: seo.description,
      canonical_url: canonicalForRoute(route),
      og_title: seo.title,
      og_description: seo.description,
      should_index: true,
      should_follow: true,
      include_in_sitemap: true
    }));
  }
}

let doctorsBase = [];
try {
  const { data } = await client.from('doctors').select('name, slug, short_bio').eq('status', 'published');
  doctorsBase = data || [];
} catch {
  // Supabase unavailable, skip dynamic doctor pages
}
if (doctorsBase.length > 0) {
  await mkdir(resolve('doctors'), { recursive: true });
  for (const d of doctorsBase) {
    if (!d.slug) continue;
    const route = `/doctors/${d.slug}.html`;
    const seo = doctorSeo(d);
    await cp(resolve('doctors.html'), resolve(`doctors/${d.slug}.html`));
    records.push(normalizeRecord({
      route,
      meta_title: seo.title,
      meta_description: seo.description,
      canonical_url: canonicalForRoute(route),
      og_title: seo.title,
      og_description: seo.description,
      should_index: true,
      should_follow: true,
      include_in_sitemap: true
    }));
  }
}

let siteSettings = null;
try {
  const { data } = await client.from('site_settings').select('*').eq('id', 'primary').single();
  siteSettings = data || null;
} catch {
  // Structured data falls back to static public clinic details.
}

await writeFile(
  resolve('.cache/seo-pages.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), projectUrl: url, siteOrigin, siteSettings, records }, null, 2),
  'utf8',
);
console.log(`Prepared ${records.length} SEO records.`);
