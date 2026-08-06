import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync('.env', 'utf8');
const envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const client = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const { data: doctors } = await client.from('doctors').select('id, name, portrait_path, specialization');
const { data: treatments } = await client.from('treatments').select('id, name, image_path');
const { data: testimonials } = await client.from('testimonials').select('id, display_name, image_path, treatment_label');
const { data: blogs } = await client.from('blog_posts').select('id, title, image_path, slug');

writeFileSync('db_summary.json', JSON.stringify({
    doctors,
    treatments,
    testimonials,
    blogs
}, null, 2), 'utf8');
console.log('Written db_summary.json');
