import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Testimonials is a first-class primary navigation route', async () => {
  const navbar = await read('components/navbar.html');
  assert.match(
    navbar,
    /href="\/doctors\/"[\s\S]*href="\/testimonials\/"[\s\S]*href="\/blog\/"/,
  );
  assert.match(navbar, /href="\/testimonials\/"\s+data-nav-page="testimonials"/);
});

test('Testimonials keeps an honest consent-aware empty state', async () => {
  const html = await read('testimonials.html');
  const page = await read('assets/js/pages/testimonials.js');
  assert.match(html, /data-testimonials-empty/);
  assert.match(html, /patient consent/i);
  assert.match(html, /data-modal-open="appointment-modal"/);
  assert.match(page, /if \(approved\.length === 0\)/);
  assert.match(page, /if \(empty\) empty\.hidden = false/);
  assert.doesNotMatch(html, /Sample Patient|Preview Review|Lorem ipsum/i);
});

test('Testimonials distinguishes load failures from an honest empty result', async () => {
  const html = await read('testimonials.html');
  const page = await read('assets/js/pages/testimonials.js');
  assert.match(html, /data-testimonials-error/);
  assert.match(html, /temporarily unavailable/i);
  assert.match(page, /let loadFailed = false/);
  assert.match(page, /loadFailed = true/);
  assert.match(page, /if \(empty\) empty\.hidden = true/);
  assert.match(page, /if \(error\) error\.hidden = false/);
});

test('Testimonials empty-state text action is visibly interactive and touch accessible', async () => {
  const css = await read('assets/css/pages/testimonials.css');
  const rule = css.match(/\.testimonials-empty__actions \.text-link\s*\{([^}]*)\}/)?.[1] ?? '';
  const minHeight = Number(rule.match(/min-height:\s*(\d+)px/)?.[1] ?? 0);
  assert.match(rule, /display:\s*(?:inline-)?flex/);
  assert.ok(minHeight >= 44, `Expected a minimum 44px target, received ${minHeight}px`);
  assert.match(rule, /color:/);
  assert.match(rule, /font-weight:/);
  assert.match(rule, /text-decoration:/);
  assert.match(css, /\.testimonials-empty__actions \.text-link:(?:hover|focus-visible)/);
});

async function migrationNamed(suffix) {
  const directory = new URL('../supabase/migrations/', import.meta.url);
  const files = await readdir(directory);
  const matches = files.filter((file) => file.endsWith(`${suffix}.sql`));
  assert.equal(matches.length, 1, `Expected exactly one migration ending in ${suffix}.sql`);
  return readFile(new URL(matches[0], directory), 'utf8');
}

test('production content is CMS-backed and contains no fabricated identities', async () => {
  const sql = await migrationNamed('_production_cms_content');
  const blogValues =
    sql.match(/insert into public\.blog_posts[\s\S]*?on conflict \(slug\)/i)?.[0] ?? '';
  assert.match(sql, /insert into public\.treatments/i);
  assert.match(sql, /insert into public\.blog_posts/i);
  assert.equal(sql.match(/'Titanium Roots Clinical Team'/g)?.length, 3);
  assert.match(sql, /\/testimonials\.html/);
  assert.match(sql, /on conflict \(slug\) do update/i);
  assert.match(sql, /on conflict \(route\) do update/i);
  assert.match(sql, /updated_by is null/i);
  assert.match(sql, /is distinct from/i);
  assert.doesNotMatch(
    sql,
    /(?:insert\s+into|update|delete\s+from)\s+public\.(?:testimonials|doctors|gallery_items|appointment_requests|analytics_events|cms_audit_log|cms_admins)/i,
  );
  assert.doesNotMatch(sql, /(?:image_path|portrait_path|storage_path|og_image_path)/i);
  assert.doesNotMatch(blogValues, /'(?:Dr\.?|Doctor)(?:\s+[^']*)?'/i);
});
