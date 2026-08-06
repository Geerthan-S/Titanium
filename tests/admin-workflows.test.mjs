import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canArchiveRecord,
  canPublishRecord,
  getNextAppointmentStatus,
  normalizeBlueprintStatus,
} from '../assets/js/admin/admin-workflows.js';

test('normalizes old statuses to blueprint statuses', () => {
  assert.equal(normalizeBlueprintStatus('Draft'), 'draft');
  assert.equal(normalizeBlueprintStatus('Published'), 'published');
  assert.equal(normalizeBlueprintStatus('Unpublished'), 'archived');
  assert.equal(normalizeBlueprintStatus('review'), 'review');
});

test('blocks publishing content without required review metadata', () => {
  assert.equal(canPublishRecord('treatments', { reviewerDoctorId: '', reviewedAt: '' }).ok, false);
  assert.equal(canPublishRecord('blogs', { reviewerDoctorId: 'doctor-1', medicalReviewedAt: '2026-08-03T10:00:00Z' }).ok, true);
});

test('uses blueprint appointment transitions', () => {
  assert.equal(getNextAppointmentStatus('new', 'contact'), 'contacted');
  assert.equal(getNextAppointmentStatus('contacted', 'confirm'), 'confirmed');
  assert.equal(getNextAppointmentStatus('confirmed', 'complete'), 'completed');
  assert.equal(getNextAppointmentStatus('new', 'markSpam'), 'spam');
});

test('archives records instead of deleting publishable content', () => {
  assert.equal(canArchiveRecord('gallery').mode, 'archive');
  assert.equal(canArchiveRecord('blogs').mode, 'archive');
  assert.equal(canArchiveRecord('appointments').mode, 'status');
});
