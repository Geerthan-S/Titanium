import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const pages = ['login', 'dashboard', 'appointments', 'doctors', 'treatments', 'blogs', 'testimonials', 'gallery', 'seo', 'settings', 'analytics'];
const modules = ['admin-app', 'admin-auth', 'admin-shell', 'admin-store', 'admin-table', 'admin-form', 'admin-dialog', 'admin-charts', 'admin-editor', 'admin-utils'];
const components = ['admin-sidebar', 'admin-header', 'admin-mobile-nav', 'admin-confirm-dialog', 'admin-command-bar'];

async function readOrEmpty(path) {
  try {
    return await readFile(new URL(path, root), 'utf8');
  } catch {
    return '';
  }
}

test('all approved admin routes use the shared admin entry and protected shell', async () => {
  for (const page of pages) {
    const html = await readOrEmpty(`admin/${page}.html`);
    assert.match(html, new RegExp(`data-admin-page="${page}"`), `${page} needs its page identifier`);
    assert.match(html, /\/assets\/js\/pages\/admin\.js/, `${page} needs the admin entry`);
    assert.match(html, /\/assets\/css\/pages\/admin\.css/, `${page} needs admin styles`);
    if (page !== 'login') {
      assert.match(html, /data-component="admin-sidebar"/);
      assert.match(html, /data-component="admin-header"/);
      assert.match(html, /id="admin-content"/);
      assert.match(html, /data-component="admin-confirm-dialog"/);
    }
  }
});

test('shared admin components and modules exist', async () => {
  for (const component of components) {
    assert.ok((await readOrEmpty(`components/${component}.html`)).length > 40, `${component} is missing`);
  }
  for (const module of modules) {
    assert.ok((await readOrEmpty(`assets/js/admin/${module}.js`)).length > 40, `${module} is missing`);
  }
});

test('sidebar contains approved navigation and excludes forbidden modules', async () => {
  const sidebar = await readOrEmpty('components/admin-sidebar.html');
  for (const label of ['Dashboard', 'Appointments & Leads', 'Doctors', 'Treatments', 'Blogs', 'Testimonials', 'Gallery', 'SEO', 'Analytics', 'Settings', 'Logout']) {
    assert.match(sidebar, new RegExp(label.replace('&', '&amp;|&')));
  }
  assert.doesNotMatch(sidebar, />\s*Services\s*</i);
  assert.doesNotMatch(sidebar, /Users Management|Register|Sign up/i);
});

test('production auth delegates to Supabase and never stores passwords', async () => {
  const auth = await readOrEmpty('assets/js/admin/admin-auth.js');
  assert.match(auth, /signInWithPassword/);
  assert.match(auth, /getUser/);
  assert.match(auth, /isCmsAdmin/);
  assert.doesNotMatch(auth, /setItem\([^)]*password/i);
  assert.doesNotMatch(auth, /sessionStorage|localStorage|loginDemo/);
});

test('store uses asynchronous Supabase repositories and no browser persistence', async () => {
  const store = await readOrEmpty('assets/js/admin/admin-store.js');
  assert.match(store, /listAdminRecords/);
  assert.match(store, /saveAdminRecord/);
  assert.match(store, /deleteAdminRecord/);
  assert.match(store, /async function/);
  assert.doesNotMatch(store, /localStorage|sessionStorage|admin-mock-data/);
});

test('rich text sanitizer and testimonial publishing rule are safe', async () => {
  let utils = {};
  try {
    utils = await import('../assets/js/admin/admin-utils.js');
  } catch {
    // Missing module is asserted below.
  }
  assert.equal(typeof utils.sanitizeRichText, 'function');
  assert.equal(typeof utils.canPublishTestimonial, 'function');
  assert.doesNotMatch(utils.sanitizeRichText('<p onclick="x()">Safe</p><script>alert(1)</script>'), /script|onclick/i);
  assert.equal(utils.canPublishTestimonial({ moderationStatus: 'Approved', consentStatus: 'Confirmed' }), true);
  assert.equal(utils.canPublishTestimonial({ moderationStatus: 'Approved', consentStatus: 'Pending' }), false);
});

test('optional numeric CMS fields stay blank instead of becoming invalid zero values', async () => {
  const { normalizeOptionalNumber } = await import('../assets/js/admin/admin-utils.js');
  assert.equal(typeof normalizeOptionalNumber, 'function');
  assert.equal(normalizeOptionalNumber('', { min: 1 }), '');
  assert.equal(normalizeOptionalNumber('   ', { min: 1 }), '');
  assert.equal(normalizeOptionalNumber('3', { min: 1 }), 3);
  assert.equal(normalizeOptionalNumber('0', { min: 0 }), 0);
});

test('analytics uses Chart.js and states its privacy boundary', async () => {
  const charts = await readOrEmpty('assets/js/admin/admin-charts.js');
  const analytics = await readOrEmpty('assets/js/admin/admin-app.js');
  const packageJson = await readOrEmpty('package.json');
  assert.match(charts, /chart\.js/);
  assert.match(analytics, /Privacy boundary/);
  assert.match(analytics, /does not collect names, contact details/);
  assert.match(packageJson, /"chart\.js"/);
});
