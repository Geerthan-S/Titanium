import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const migrationDir = new URL('../supabase/migrations/', import.meta.url);

async function latestBlueprintMigration() {
  const files = await readdir(migrationDir);
  const file = files.find((name) => name.endsWith('_blueprint_alignment_schema.sql'));
  assert.ok(file, 'blueprint schema migration is required');
  return readFile(new URL(file, migrationDir), 'utf8');
}

test('blueprint schema adds required content relations and workflow statuses', async () => {
  const sql = await latestBlueprintMigration();
  for (const table of [
    'admin_profiles',
    'specialties',
    'treatment_faqs',
    'treatment_doctors',
    'blog_categories',
    'blog_faqs',
    'blog_treatments',
    'media_assets',
    'gallery_collections',
    'gallery_collection_items',
    'page_sections',
    'redirects',
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(sql, /status in \('draft', 'review', 'scheduled', 'published', 'archived'\)/);
  assert.match(sql, /reviewer_doctor_id uuid references public\.doctors/);
  assert.match(sql, /medical_reviewed_at timestamptz/);
  assert.match(sql, /cloudinary_public_id text/);
});

test('appointment records remain insert-only for anonymous users', async () => {
  const base = await readFile(new URL('../supabase/migrations/20260730213431_titanium_cms.sql', import.meta.url), 'utf8');
  const sql = await latestBlueprintMigration();
  assert.match(base + sql, /grant insert on public\.appointment_requests to anon/);
  assert.doesNotMatch(base + sql, /grant select on public\.appointment_requests to anon/);
});
