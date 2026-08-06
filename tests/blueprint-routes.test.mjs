import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('build generator owns SEO cache, static detail pages, and sitemap', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.scripts.build, 'node scripts/generate-static-pages.mjs && vite build');
  assert.ok(existsSync(new URL('../scripts/generate-static-pages.mjs', import.meta.url)));
  assert.ok(existsSync(new URL('../templates/treatment-detail.html', import.meta.url)));
  assert.ok(existsSync(new URL('../templates/blog-article.html', import.meta.url)));
  assert.ok(existsSync(new URL('../templates/doctor-profile.html', import.meta.url)));
});

test('blog listing cards remain real anchors with optional overlay enhancement', async () => {
  const page = await read('assets/js/pages/blog.js');
  assert.match(page, /href="\/blog\/\$\{safe\(article\.slug\)\}\/"/);
  assert.match(page, /data-article-open="\$\{safe\(article\.id\)\}"/);
  assert.doesNotMatch(page, /<button class="text-link" type="button" data-article-open/);
});

test('treatment cards link to clean canonical detail routes', async () => {
  const page = await read('assets/js/pages/treatments.js');
  assert.match(page, /href="\/treatments\/\$\{safe\(treatment\.slug\)\}\/"/);
  assert.doesNotMatch(page, /match\(\^\\\/treatments\\\/\(\[\^\.\/\]\+\)\\\.html/);
});

test('sitemap includes generated public detail URLs after build', async () => {
  const sitemap = await read('public/sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/titaniumroots\.com\/treatments\/dental-implants\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/titaniumroots\.com\/blog\/what-to-expect-at-a-routine-dental-check-up\/<\/loc>/);
  assert.doesNotMatch(sitemap, /\/admin\//);
});

test('generated detail pages expose complete source metadata', async () => {
  const treatment = await read('dist/treatments/dental-implants/index.html');
  assert.match(treatment, /<title>Dental Implants in Anna Nagar, Chennai \| Titanium Roots<\/title>/);
  assert.match(treatment, /<link rel="canonical" href="https:\/\/titaniumroots\.com\/treatments\/dental-implants\/">/);
  assert.match(treatment, /<h1[^>]*>Dental Implants<\/h1>/);
  assert.match(treatment, /application\/ld\+json/);

  const article = await read('dist/blog/what-to-expect-at-a-routine-dental-check-up/index.html');
  assert.match(article, /<title>What to Expect at a Routine Dental Check-up \| Titanium Roots<\/title>/);
  assert.match(article, /Reviewed by/);
  assert.match(article, /This content is for general education/);
});
