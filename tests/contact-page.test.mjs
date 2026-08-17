import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('contact page follows the supplied reference structure', async () => {
  const html = await readFile(new URL('../contact.html', import.meta.url), 'utf8');
  const normalizedHtml = html.replace(/\s+/g, ' ');

  for (const section of [
    'contact-hero',
    'contact-workspace',
    'contact-form-card',
    'contact-sidebar',
    'contact-map',
    'contact-faq',
  ]) {
    assert.match(html, new RegExp(`class="[^"]*${section}`));
  }

  for (const mode of [
    'Book Appointment',
    'General Query',
    'Treatment Info',
    'Emergency',
    'Leave Feedback',
  ]) {
    assert.match(normalizedHtml, new RegExp(`>${mode}<`));
  }
});

test('contact page contains the approved clinic details', async () => {
  const html = await readFile(new URL('../contact.html', import.meta.url), 'utf8');
  const constants = await readFile(new URL('../assets/js/utils/constants.js', import.meta.url), 'utf8');

  assert.match(html, /Karapakkam, OMR, Chennai/);
  assert.match(html, /Exact landmark shared during appointment confirmation/);
  assert.match(html, /\+91 98765 43210/);
  assert.match(html, /\+91 44 2345 6789/);
  assert.match(html, /info@titaniumroots\.com/);
  assert.match(html, /appointments@titaniumroots\.com/);
  assert.match(constants, /phone: '\+91 98765 43210'/);
  assert.match(constants, /email: 'info@titaniumroots\.com'/);
  assert.match(constants, /address: 'Karapakkam, OMR, Chennai\. Exact landmark shared during appointment confirmation\.'/);
});

test('clinic status follows the published Asia Kolkata hours', async () => {
  const module = await import('../assets/js/pages/contact.js');

  assert.equal(typeof module.getClinicStatus, 'function');
  assert.equal(module.getClinicStatus(new Date('2026-07-27T04:30:00.000Z')).isOpen, true);
  assert.equal(module.getClinicStatus(new Date('2026-07-27T03:00:00.000Z')).isOpen, false);
  assert.equal(module.getClinicStatus(new Date('2026-08-01T12:29:00.000Z')).isOpen, true);
  assert.equal(module.getClinicStatus(new Date('2026-08-02T10:31:00.000Z')).isOpen, false);
  assert.equal(module.getClinicStatus(new Date('2026-08-02T04:30:00.000Z')).hours, 'By appointment only');
});
