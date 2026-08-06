import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('admin uses blueprint workflow statuses and admin profiles', async () => {
  const app = await read('assets/js/admin/admin-app.js');
  const auth = await read('assets/js/admin/admin-auth.js');
  const repository = await read('assets/js/data/cms-repository.js');
  const config = await read('assets/js/admin/admin-blueprint-config.js');

  for (const status of ['draft', 'review', 'scheduled', 'published', 'archived']) {
    assert.match(app + repository + config, new RegExp(`['"\`]${status}['"\`]`));
  }

  assert.match(auth, /admin_profiles/);
  assert.doesNotMatch(auth, /cms_admins/);
  assert.doesNotMatch(app, /Appointment Pending/);
  assert.doesNotMatch(app, /status:\s*['"]Closed['"]|status === ['"]Closed['"]/);
});

test('admin exposes blueprint appointment fields and actions', async () => {
  const app = await read('assets/js/admin/admin-app.js');

  for (const field of [
    'preferredTime',
    'reason',
    'sourcePage',
    'utmSource',
    'utmMedium',
    'utmCampaign',
    'assignedTo',
    'consentAt',
    'cancelled',
    'spam',
    'export',
    'reschedule',
  ]) {
    assert.match(app, new RegExp(field));
  }
});

test('admin exposes blueprint treatment and blog workflows', async () => {
  const app = await read('assets/js/admin/admin-app.js');
  const config = await read('assets/js/admin/admin-blueprint-config.js');

  for (const marker of [
    'Basics',
    'Content',
    'FAQs',
    'Media',
    'Relationships',
    'SEO',
    'Publishing',
    'reviewerDoctorId',
    'medicalReviewedAt',
    'revisionNote',
    'scheduledFor',
    'generatedHtmlStatus',
  ]) {
    assert.match(app + config, new RegExp(marker));
  }
});

test('admin manages blueprint media, seo, settings, and analytics surfaces', async () => {
  const source = [
    await read('assets/js/admin/admin-app.js'),
    await read('assets/js/admin/admin-store.js'),
    await read('assets/js/data/cms-repository.js'),
    await read('assets/js/admin/admin-blueprint-config.js'),
  ].join('\n');

  for (const marker of [
    'media_assets',
    'gallery_collections',
    'cloudinaryPublicId',
    'secureUrl',
    'focalX',
    'focalY',
    'redirects',
    'duplicateSlug',
    'missingReviewer',
    'brokenRelation',
    'canonicalDomain',
    'searchConsole',
    'auditLog',
  ]) {
    assert.match(source, new RegExp(marker));
  }
});
