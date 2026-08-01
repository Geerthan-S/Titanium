import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('contact and modal forms submit real appointment requests', async () => {
  const contact = await read('assets/js/pages/contact.js');
  const modal = await read('assets/js/components/modal.js');
  const modalHtml = await read('components/appointment-modal.html');
  const contactHtml = await read('contact.html');
  for (const source of [contact, modal]) {
    assert.match(source, /submitAppointmentRequest/);
    assert.match(source, /appointment_submit/);
    assert.match(source, /await submitAppointmentRequest/);
  }
  assert.doesNotMatch(contact, /message is ready/);
  assert.doesNotMatch(modal, /request is ready/);
  for (const html of [modalHtml, contactHtml]) {
    assert.match(html, /name="consent"[\s\S]*required/);
    assert.match(html, /name="website"[\s\S]*tabindex="-1"/);
  }
  for (const source of [contact, modal]) {
    assert.match(source, /1500/);
    assert.match(source, /elements\.website/);
  }
});

test('public appointment payload retains the patient message but not internal notes', async () => {
  const mapper = await read('assets/js/data/record-mappers.js');
  const migration = await read('supabase/migrations/20260731100000_add_appointment_message.sql');
  assert.match(mapper, /message:\s*text\(record\.message\)/);
  assert.match(mapper, /notes:\s*''/);
  assert.match(migration, /add column message text/i);
});

test('analytics initializes page and conversion tracking', async () => {
  const app = await read('assets/js/app.js');
  assert.match(app, /recordAnalyticsEvent/);
  assert.match(app, /page_view/);
  assert.match(app, /whatsapp_click/);
  assert.match(app, /phone_click/);
});
