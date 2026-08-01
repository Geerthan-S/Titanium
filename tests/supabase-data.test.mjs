import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapDoctorFromDatabase,
  mapTreatmentToDatabase,
  normalizeAppointmentPayload,
  sanitizeCmsHtml,
  storagePathFor,
} from '../assets/js/data/record-mappers.js';

test('database records map to existing UI property names', () => {
  const doctor = mapDoctorFromDatabase({
    id: 'd1',
    name: 'Dr Example',
    specialization: 'Dentistry',
    experience_years: 8,
    portrait_path: 'doctors/d1/photo.webp',
    image_alt: 'Portrait',
    sort_order: 2,
  });
  assert.equal(doctor.experience, 8);
  assert.equal(doctor.portrait, 'doctors/d1/photo.webp');
  assert.equal(doctor.sortOrder, 2);
});

test('treatment writes remove display-only and empty numeric values', () => {
  const row = mapTreatmentToDatabase({
    name: 'Care',
    price: '',
    sortOrder: 1,
    displayLabel: 'x',
  });
  assert.equal(row.price, null);
  assert.equal(row.sort_order, 1);
  assert.equal('displayLabel' in row, false);
});

test('appointment payload discards private and administrator fields', () => {
  const row = normalizeAppointmentPayload({
    name: 'Site Visitor',
    phone: '+91 90000 00000',
    consent: true,
    status: 'completed',
    notes: 'must not pass',
    source: 'contact',
  });
  assert.equal(row.status, 'new');
  assert.equal(row.notes, '');
  assert.equal(row.display_name, 'Site Visitor');
});

test('CMS HTML removes executable markup', () => {
  assert.doesNotMatch(
    sanitizeCmsHtml('<p onclick="x()">Safe</p><script>x()</script>'),
    /script|onclick/i,
  );
});

test('storage paths are deterministic and do not trust raw filenames', () => {
  assert.equal(
    storagePathFor('doctors', 'abc', 'My Photo.WEBP'),
    'doctors/abc/my-photo.webp',
  );
});
