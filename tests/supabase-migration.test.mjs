import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const migrations = new URL('../supabase/migrations/', import.meta.url);
const requiredTables = [
  'cms_admins',
  'doctors',
  'treatments',
  'blog_posts',
  'testimonials',
  'gallery_items',
  'seo_pages',
  'site_settings',
  'appointment_requests',
  'analytics_events',
  'cms_audit_log',
];

async function sql() {
  const files = (await readdir(migrations)).filter((name) => name.endsWith('_titanium_cms.sql'));
  assert.equal(files.length, 1);
  return readFile(new URL(files[0], migrations), 'utf8');
}

async function allSql() {
  const files = (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort();
  return Promise.all(files.map((name) => readFile(new URL(name, migrations), 'utf8')));
}

test('migration creates every typed CMS table', async () => {
  const source = await sql();
  requiredTables.forEach((table) => {
    assert.match(source, new RegExp(`create table public\\.${table}\\b`, 'i'));
    assert.match(source, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
  });
});

test('migration uses explicit grants and constrained admin policies', async () => {
  const source = await sql();
  assert.match(source, /grant select on public\.doctors to anon, authenticated/i);
  assert.match(source, /grant insert on public\.appointment_requests to anon/i);
  assert.match(source, /for update[\s\S]+using[\s\S]+with check/i);
  assert.doesNotMatch(source, /auth\.role\(\)|user_metadata|security definer/i);
});

test('migration creates bounded media and Realtime configuration', async () => {
  const source = await sql();
  assert.match(source, /cms-media/);
  assert.match(source, /5242880/);
  assert.match(source, /image\/jpeg/);
  assert.doesNotMatch(source, /image\/svg\+xml/);
  assert.match(source, /supabase_realtime/);
});

test('latest media migration disables SVG uploads for existing projects', async () => {
  const sources = await allSql();
  const media = sources.find((source) => /drop constraint if exists gallery_items_mime_type_check/i.test(source));
  assert.ok(media, 'expected a forward migration for media MIME hardening');
  assert.match(media, /drop constraint if exists gallery_items_mime_type_check/i);
  assert.match(media, /allowed_mime_types[\s\S]*image\/jpeg[\s\S]*image\/png[\s\S]*image\/webp/i);
  assert.doesNotMatch(media.match(/allowed_mime_types[\s\S]*where id = 'cms-media'/i)?.[0] || '', /image\/svg\+xml/);
});

test('public media URLs do not expose bucket listing', async () => {
  const source = await sql();
  assert.doesNotMatch(source, /create policy cms_media_public_read/i);
  assert.match(source, /create policy cms_media_admin_select[\s\S]+to authenticated/i);
});

test('migration never seeds fake identities or private records', async () => {
  const source = await sql();
  assert.doesNotMatch(source, /Demo Appointment|Doctor Profile|Patient Display|Contributor Profile/i);
  assert.doesNotMatch(source, /service_role|database_password/i);
});

test('latest authorization migration restores the active CMS allowlist', async () => {
  const sources = await allSql();
  const authorization = sources.find((source) => /create or replace function public\.is_cms_admin\(\)[\s\S]*from public\.cms_admins/i.test(source));
  assert.ok(authorization, 'expected an authorization migration backed by cms_admins');
  assert.match(authorization, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(authorization, /and is_active/i);
  assert.doesNotMatch(authorization, /auth\.jwt\(\)[\s\S]*is_anonymous/i);
});
