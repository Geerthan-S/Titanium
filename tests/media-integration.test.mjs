import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('media repository validates and supports upload replacement cleanup', async () => {
  const source = await read('assets/js/data/media-repository.js');
  assert.match(source, /5 \* 1024 \* 1024/);
  assert.match(source, /image\/jpeg.*image\/png.*image\/webp/s);
  assert.doesNotMatch(source, /image\/svg\+xml/);
  assert.match(source, /\.storage[\s\S]*\.from\('cms-media'\)[\s\S]*\.upload/);
  assert.match(source, /\.storage[\s\S]*\.from\('cms-media'\)[\s\S]*\.remove/);
  assert.match(source, /previousPath/);
});

test('stock fallback images are imported through Vite asset processing', async () => {
  const assets = await read('assets/js/data/media-assets.js');
  assert.match(assets, /images\/stock\/blog-insight\.jpg/);
  for (const page of ['assets/js/app.js', 'assets/js/pages/home.js', 'assets/js/pages/blog.js', 'assets/js/pages/treatments.js', 'assets/js/pages/about.js', 'assets/js/pages/testimonials.js']) {
    const source = await read(page);
    assert.doesNotMatch(source, /\/assets\/images\/stock\//);
  }
});

test('admin forms pass File objects into the storage lifecycle', async () => {
  const form = await read('assets/js/admin/admin-form.js');
  const app = await read('assets/js/admin/admin-app.js');
  assert.match(form, /__files/);
  assert.match(app, /replaceCmsMedia/);
  assert.match(app, /removeCmsMedia/);
});

test('public CMS pages resolve approved storage paths', async () => {
  for (const page of ['home', 'about', 'treatments', 'blog']) {
    assert.match(await read(`assets/js/pages/${page}.js`), /publicMediaUrl/);
  }
});

test('public doctor pages are text-only until approved portraits are added', async () => {
  const doctors = await read('assets/js/pages/doctors.js');
  const home = await read('assets/js/pages/home.js');
  const html = await read('doctors.html');
  assert.doesNotMatch(doctors, /publicMediaUrl|doctor-profile\.jpg|data-media-fallback="doctor"/);
  assert.doesNotMatch(home, /doctor-profile\.jpg|data-media-fallback="doctor"/);
  assert.doesNotMatch(html, /doctor-profile\.jpg|data-media-fallback="doctor"|og:image/);
});
