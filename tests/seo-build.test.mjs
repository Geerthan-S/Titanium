import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('build fetches public SEO without a secret key', async () => {
  const script = await read('scripts/fetch-seo.mjs');
  assert.match(script, /VITE_SUPABASE_URL/);
  assert.match(script, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(script, /seo_pages/);
  assert.doesNotMatch(script, /service_role|secret_key/i);
});

test('Vite injects route metadata into generated HTML', async () => {
  const config = await read('vite.config.js');
  assert.match(config, /transformIndexHtml/);
  assert.match(config, /seo-pages\.json/);
  assert.match(config, /canonical/);
  assert.match(config, /og:title/);
  assert.match(config, /application\/ld\+json/);
  assert.match(config, /sitemap\.xml/);
  assert.match(config, /robots\.txt/);
});

test('the generated SEO cache is not tracked as source', async () => {
  assert.match(await read('.gitignore'), /^\.cache\/$/m);
});

test('dynamic SEO records use absolute production canonicals', async () => {
  const script = await read('scripts/fetch-seo.mjs');
  assert.match(script, /siteOrigin/);
  assert.match(script, /canonicalForRoute/);
  assert.match(script, /normalizeRecord/);
  assert.doesNotMatch(script, /canonical_url:\s*`\/(?:treatments|doctors)\//);
  assert.match(script, /Dental Implants in Chennai/);
  assert.match(script, /prosthodontic/i);
});
