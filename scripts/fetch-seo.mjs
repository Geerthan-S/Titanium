import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile, cp } from 'node:fs/promises';
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
const { data, error } = await client
  .from('seo_pages')
  .select('route,meta_title,meta_description,canonical_url,og_title,og_description,og_image_path,should_index,should_follow,include_in_sitemap')
  .order('route');
if (error) throw new Error(`Unable to fetch public SEO records: ${error.message}`);

const requiredRoutes = ['/', '/about.html', '/doctors.html', '/treatments.html', '/blog.html', '/testimonials.html', '/contact.html'];
const records = data || [];
for (const route of requiredRoutes) {
  const record = records.find((item) => item.route === route);
  if (!record?.meta_title || !record?.meta_description || !record?.canonical_url) {
    throw new Error(`SEO record is incomplete for ${route}.`);
  }
}

await mkdir(resolve('.cache'), { recursive: true });

const { data: treatmentsBase } = await client.from('treatments').select('name, slug, short_description').eq('status', 'published');
if (treatmentsBase) {
  await mkdir(resolve('treatments'), { recursive: true });
  for (const t of treatmentsBase) {
    if (!t.slug) continue;
    await cp(resolve('treatments.html'), resolve(`treatments/${t.slug}.html`));
    records.push({
      route: `/treatments/${t.slug}.html`,
      meta_title: `${t.name} | Titanium Roots Dental Clinic`,
      meta_description: t.short_description || `Learn more about ${t.name} at Titanium Roots Dental Clinic.`,
      canonical_url: `/treatments/${t.slug}.html`,
      og_title: `${t.name} | Titanium Roots Dental Clinic`,
      og_description: t.short_description,
      should_index: true,
      should_follow: true,
      include_in_sitemap: true
    });
  }
}

const { data: doctorsBase } = await client.from('doctors').select('name, slug, short_bio').eq('status', 'published');
if (doctorsBase) {
  await mkdir(resolve('doctors'), { recursive: true });
  for (const d of doctorsBase) {
    if (!d.slug) continue;
    await cp(resolve('doctors.html'), resolve(`doctors/${d.slug}.html`));
    records.push({
      route: `/doctors/${d.slug}.html`,
      meta_title: `${d.name} | Titanium Roots Dental Clinic`,
      meta_description: d.short_bio || `Book a consultation with ${d.name} at Titanium Roots Dental Clinic.`,
      canonical_url: `/doctors/${d.slug}.html`,
      og_title: `${d.name} | Titanium Roots Dental Clinic`,
      og_description: d.short_bio,
      should_index: true,
      should_follow: true,
      include_in_sitemap: true
    });
  }
}

await writeFile(
  resolve('.cache/seo-pages.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), projectUrl: url, records }, null, 2),
  'utf8',
);
console.log(`Prepared ${records.length} SEO records.`);
