import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

try {
  loadEnvFile(resolve('.env'));
} catch {
  // CI may provide environment variables directly.
}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert(url && key, 'Public Supabase environment variables are required.');
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

for (const table of ['doctors', 'treatments', 'blog_posts', 'testimonials', 'gallery_items', 'seo_pages', 'site_settings']) {
  const { error } = await client.from(table).select('*').limit(1);
  assert.equal(error, null, `${table} must be publicly readable through RLS`);
}

for (const table of ['cms_admins', 'appointment_requests', 'analytics_events', 'cms_audit_log']) {
  const { data, error } = await client.from(table).select('*').limit(1);
  assert(error || !data?.length, `${table} must not expose rows anonymously`);
}

const marker = `QA Smoke ${randomUUID()}`;
const { error: insertError } = await client.from('appointment_requests').insert({
  display_name: marker,
  phone: '+91 90000 00000',
  email: null,
  enquiry_type: 'appointment',
  treatment_label: 'Live smoke test',
  doctor_label: '',
  preferred_date: null,
  source: 'website',
  consent: true,
  status: 'new',
  message: 'Automated live verification record.',
  notes: '',
  status_history: [{ status: 'new', at: new Date().toISOString() }],
});
assert.equal(insertError, null, 'Anonymous appointment insert must be accepted');

const { error: analyticsError } = await client.from('analytics_events').insert({
  event_type: 'page_view',
  page_path: '/qa-live-smoke',
  referrer_domain: '',
});
assert.equal(analyticsError, null, 'Bounded anonymous analytics insert must be accepted');

console.log(`QA_SMOKE_MARKER=${marker}`);
console.log('LIVE_PUBLIC_READS=7');
console.log('LIVE_PRIVATE_READS_BLOCKED=4');
console.log('LIVE_INSERTS=2');
