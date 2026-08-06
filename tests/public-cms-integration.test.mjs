import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('public pages consume the shared content store', async () => {
  for (const page of ['home', 'about', 'doctors', 'treatments', 'blog', 'testimonials']) {
    const source = await read(`assets/js/pages/${page}.js`);
    assert.match(source, /public-content-store|loadPublicContent/);
  }
});

test('hard-coded CMS arrays are removed from public page modules', async () => {
  const home = await read('assets/js/pages/home.js');
  const doctors = await read('assets/js/pages/doctors.js');
  const treatments = await read('assets/js/pages/treatments.js');
  assert.doesNotMatch(
    home,
    /const featuredTreatments = \[|const featuredDoctors = Array\.from|const testimonials = Array\.from|const latestBlogs = \[/,
  );
  assert.doesNotMatch(doctors, /const doctors = doctorIds\.map/);
  assert.doesNotMatch(treatments, /const treatments = \[/);
});

test('home preview sections are controlled by CMS featured flags', async () => {
  const home = await read('assets/js/pages/home.js');

  assert.match(home, /featuredTreatments\s*=\s*rows\.filter\(\(row\) => row\.featured\)\.slice\(0, 5\)/);
  assert.match(home, /featuredDoctors\s*=\s*rows\.filter\(\(row\) => row\.featured\)\.slice\(0, 4\)/);
  assert.match(home, /testimonials\s*=\s*rows\.filter\(\(row\) => row\.featured\)\.slice\(0, 6\)/);
  assert.match(home, /featuredBlogs\s*=\s*rows\.filter\(\(row\) => row\.featured\)\.slice\(0, 3\)/);
  assert.doesNotMatch(home, /latestBlogs\s*=\s*rows\.slice\(0, 3\)/);
});

test('the public content store subscribes and cleans up Realtime channels', async () => {
  const source = await read('assets/js/data/public-content-store.js');
  assert.match(source, /postgres_changes/);
  assert.match(source, /removeChannel|unsubscribe/);
});

test('public rendering uses escaped or sanitized CMS fields', async () => {
  const files = await Promise.all(
    ['home', 'about', 'doctors', 'treatments', 'blog']
      .map((page) => read(`assets/js/pages/${page}.js`)),
  );
  files.forEach((source) => assert.match(source, /escapeHtml|sanitizeCmsHtml/));
});

test('settings target global contact and brand elements', async () => {
  const app = await read('assets/js/app.js');
  const footer = await read('components/footer.html');
  assert.match(app, /applyPublicSettings/);
  assert.match(footer, /data-setting-/);
});
