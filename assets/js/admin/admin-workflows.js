const OLD_STATUS_MAP = {
  Draft: 'draft',
  Published: 'published',
  Unpublished: 'archived',
  New: 'new',
  Contacted: 'contacted',
  Confirmed: 'confirmed',
  Completed: 'completed',
  Closed: 'cancelled',
  'Appointment Pending': 'contacted',
};

export function normalizeBlueprintStatus(status) {
  return OLD_STATUS_MAP[status] || String(status || 'draft').toLowerCase().replaceAll(' ', '_');
}

export function canPublishRecord(type, record = {}) {
  if (type === 'treatments') {
    const ok = Boolean(record.reviewerDoctorId || record.reviewedByDoctorId || record.reviewed_by_doctor_id)
      && Boolean(record.reviewedAt || record.lastReviewedAt || record.last_reviewed_at);
    return { ok, reason: ok ? '' : 'Treatments need a reviewer and review date before publishing.' };
  }

  if (type === 'blogs') {
    const ok = Boolean(record.reviewerDoctorId || record.reviewedByDoctorId || record.reviewed_by_doctor_id)
      && Boolean(record.medicalReviewedAt || record.lastReviewedAt || record.last_reviewed_at);
    return { ok, reason: ok ? '' : 'Blogs need clinical review before publishing.' };
  }

  if (type === 'testimonials') {
    const ok = record.publicationPermission === true
      && record.consentStatus === 'Confirmed'
      && record.moderationStatus === 'Approved';
    return { ok, reason: ok ? '' : 'Testimonials need consent, moderation approval, and publication permission.' };
  }

  return { ok: true, reason: '' };
}

export function getNextAppointmentStatus(currentStatus, action) {
  const transitions = {
    contact: 'contacted',
    confirm: 'confirmed',
    complete: 'completed',
    cancel: 'cancelled',
    markSpam: 'spam',
  };
  return transitions[action] || normalizeBlueprintStatus(currentStatus || 'new');
}

export function canArchiveRecord(type) {
  if (['gallery', 'media', 'blogs', 'treatments', 'doctors', 'testimonials'].includes(type)) {
    return { mode: 'archive' };
  }
  if (type === 'appointments') {
    return { mode: 'status', status: 'cancelled' };
  }
  return { mode: 'delete' };
}
