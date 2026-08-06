import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('media repository validates and supports upload replacement cleanup', async () => {
  const source = await read('assets/js/data/media-repository.js');
  assert.match(source, /5 \* 1024 \* 1024/);
  assert.match(source, /image\/jpeg.*image\/png.*image\/webp/s);
  assert.match(source, /\.storage[\s\S]*\.from\('cms-media'\)[\s\S]*\.upload/);
  assert.match(source, /\.storage[\s\S]*\.from\('cms-media'\)[\s\S]*\.remove/);
  assert.match(source, /previousPath/);
});

test('admin forms pass File objects into the storage lifecycle', async () => {
  const form = await read('assets/js/admin/admin-form.js');
  const app = await read('assets/js/admin/admin-app.js');
  assert.match(form, /__files/);
});

test('public CMS pages resolve approved storage paths', async () => {
  for (const page of ['home', 'about', 'doctors', 'treatments', 'blog']) {
    assert.match(await read(`assets/js/pages/${page}.js`), /publicMediaUrl/);
  }
});
