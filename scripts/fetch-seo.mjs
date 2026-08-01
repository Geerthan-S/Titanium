import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
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
await writeFile(
  resolve('.cache/seo-pages.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), projectUrl: url, records }, null, 2),
  'utf8',
);
console.log(`Prepared ${records.length} SEO records.`);
