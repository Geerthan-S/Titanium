import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const adminFiles = [
  'assets/js/admin/admin-app.js',
  'assets/js/admin/admin-store.js',
  'components/admin-header.html',
  'components/admin-sidebar.html',
  ...[
    'dashboard',
    'appointments',
    'doctors',
    'treatments',
    'blogs',
    'testimonials',
    'gallery',
    'seo',
    'settings',
    'analytics',
  ].map((page) => `admin/${page}.html`),
];

test('admin implementation contains no demo store or fabricated UI copy', async () => {
  const source = (await Promise.all(adminFiles.map(read))).join('\n');
  assert.doesNotMatch(
    source,
    /frontend demo|demonstration data|mock asset|reset demo|Demo Appointment|not connected/i,
  );
  assert.doesNotMatch(source, /localStorage|admin-mock-data/);
});

test('admin store delegates to asynchronous repositories', async () => {
  const store = await read('assets/js/admin/admin-store.js');
  assert.match(store, /listAdminRecords|saveAdminRecord|deleteAdminRecord/);
  assert.match(store, /async function|async \(/);
});
