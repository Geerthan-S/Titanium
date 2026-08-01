import createDOMPurify from 'dompurify';

const HTML_TAGS = [
  'p',
  'br',
  'h2',
  'h3',
  'strong',
  'b',
  'em',
  'i',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
];
const HTML_ATTRIBUTES = ['href', 'rel', 'target'];

const STATUS_TO_DB = Object.freeze({
  Draft: 'draft',
  Published: 'published',
  Unpublished: 'unpublished',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  New: 'new',
  Contacted: 'contacted',
  'Appointment Pending': 'appointment_pending',
  Confirmed: 'confirmed',
  Completed: 'completed',
  Closed: 'closed',
  'Not Provided': 'not_provided',
  'Consultation Required': 'consultation_required',
  'Pending Confirmation': 'pending_confirmation',
});

const STATUS_FROM_DB = Object.freeze(
  Object.fromEntries(Object.entries(STATUS_TO_DB).map(([label, value]) => [value, label])),
);

const text = (value) => String(value ?? '').trim();
const nullableText = (value) => text(value) || null;
const nullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const list = (value) => {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  return text(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};
const dbStatus = (value, fallback) => {
  const normalized = text(value);
  return STATUS_TO_DB[normalized] || normalized.toLowerCase().replaceAll(' ', '_') || fallback;
};
const uiStatus = (value) => STATUS_FROM_DB[value] || text(value);

function purifier() {
  if (typeof window === 'undefined') return null;
  if (typeof createDOMPurify?.sanitize === 'function') return createDOMPurify;
  if (typeof createDOMPurify === 'function') return createDOMPurify(window);
  return null;
}

function fallbackSanitize(value) {
  return String(value ?? '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|svg|math)\b[^>]*\/?>/gi, '')
    .replace(/\s(?:on[a-z]+|style|srcdoc)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:href|src)\s*=\s*(["'])\s*(?:javascript|data):[\s\S]*?\1/gi, '');
}

export function sanitizeCmsHtml(value = '') {
  const activePurifier = purifier();
  if (!activePurifier) return fallbackSanitize(value);
  return activePurifier.sanitize(String(value), {
    ALLOWED_TAGS: HTML_TAGS,
    ALLOWED_ATTR: HTML_ATTRIBUTES,
    ALLOW_DATA_ATTR: false,
  });
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function mapDoctorFromDatabase(row = {}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    designation: row.designation,
    qualification: row.qualification,
    additionalQualifications: row.additional_qualifications,
    specialization: row.specialization,
    specialties: (row.specialties || []).join(', '),
    experience: row.experience_years,
    languages: (row.languages || []).join(', '),
    registrationNumber: row.registration_number,
    biography: row.biography,
    philosophy: row.philosophy,
    consultation: row.consultation,
    availability: row.availability,
    portrait: row.portrait_path,
    imageAlt: row.image_alt,
    featured: row.featured,
    status: uiStatus(row.status),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDoctorToDatabase(record = {}) {
  return {
    ...(record.id ? { id: record.id } : {}),
    name: text(record.name),
    slug: text(record.slug),
    designation: text(record.designation),
    qualification: text(record.qualification),
    additional_qualifications: text(record.additionalQualifications),
    specialization: text(record.specialization),
    specialties: list(record.specialties),
    experience_years: nullableNumber(record.experience),
    languages: list(record.languages),
    registration_number: text(record.registrationNumber),
    biography: text(record.biography),
    philosophy: text(record.philosophy),
    consultation: text(record.consultation),
    availability: text(record.availability),
    portrait_path: nullableText(record.portrait),
    image_alt: text(record.imageAlt),
    featured: Boolean(record.featured),
    status: dbStatus(record.status, 'draft'),
    sort_order: nullableNumber(record.sortOrder) || 1,
  };
}

export function mapTreatmentFromDatabase(row = {}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    duration: row.duration,
    visits: row.visits,
    price: row.price,
    pricingStatus: uiStatus(row.pricing_status),
    priceStatus: row.pricing_status,
    benefits: row.benefits,
    suitability: row.suitability,
    steps: row.procedure_steps,
    procedureSteps: row.procedure_steps,
    recovery: row.recovery,
    recoveryInformation: row.recovery,
    image: row.image_path,
    imageAlt: row.image_alt,
    featured: row.featured,
    status: uiStatus(row.status),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTreatmentToDatabase(record = {}) {
  return {
    ...(record.id ? { id: record.id } : {}),
    name: text(record.name),
    slug: text(record.slug),
    category: text(record.category),
    short_description: text(record.shortDescription),
    full_description: text(record.fullDescription),
    duration: text(record.duration),
    visits: text(record.visits),
    price: nullableNumber(record.price),
    pricing_status: dbStatus(record.pricingStatus ?? record.priceStatus, 'consultation_required'),
    benefits: Array.isArray(record.benefits) ? record.benefits.join(', ') : text(record.benefits),
    suitability: text(record.suitability),
    procedure_steps: text(record.steps ?? record.procedureSteps),
    recovery: text(record.recovery ?? record.recoveryInformation),
    image_path: nullableText(record.image),
    image_alt: text(record.imageAlt),
    featured: Boolean(record.featured),
    status: dbStatus(record.status, 'draft'),
    sort_order: nullableNumber(record.sortOrder) || 1,
  };
}

export function mapBlogFromDatabase(row = {}) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    tags: (row.tags || []).join(', '),
    excerpt: row.excerpt,
    content: row.content_html,
    image: row.image_path,
    imageAlt: row.image_alt,
    author: row.author_name,
    publishDate: row.publish_at,
    status: uiStatus(row.status),
    featured: row.featured,
    trending: row.trending,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBlogToDatabase(record = {}) {
  return {
    ...(record.id ? { id: record.id } : {}),
    title: text(record.title),
    slug: text(record.slug),
    category: text(record.category),
    tags: list(record.tags),
    excerpt: text(record.excerpt),
    content_html: sanitizeCmsHtml(record.content),
    image_path: nullableText(record.image),
    image_alt: text(record.imageAlt),
    author_name: text(record.author),
    publish_at: nullableText(record.publishDate),
    status: dbStatus(record.status, 'draft'),
    featured: Boolean(record.featured),
    trending: Boolean(record.trending),
    seo_title: text(record.seoTitle),
    seo_description: text(record.seoDescription),
    sort_order: nullableNumber(record.sortOrder) || 1,
  };
}

export function mapTestimonialFromDatabase(row = {}) {
  return {
    id: row.id,
    name: row.display_name,
    treatment: row.treatment_label,
    rating: row.rating,
    review: row.review,
    image: row.image_path,
    source: row.source,
    consentStatus: uiStatus(row.consent_status),
    consentAt: row.consent_at,
    moderationStatus: uiStatus(row.moderation_status),
    status: uiStatus(row.status),
    featured: row.featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTestimonialToDatabase(record = {}) {
  const consentStatus = dbStatus(record.consentStatus, 'pending');
  return {
    ...(record.id ? { id: record.id } : {}),
    display_name: text(record.name),
    treatment_label: text(record.treatment),
    rating: nullableNumber(record.rating) || 1,
    review: text(record.review),
    image_path: nullableText(record.image),
    source: text(record.source) || 'website',
    consent_status: consentStatus,
    consent_at: consentStatus === 'confirmed'
      ? (record.consentAt || new Date().toISOString())
      : null,
    moderation_status: dbStatus(record.moderationStatus, 'pending'),
    status: dbStatus(record.status, 'unpublished'),
    featured: Boolean(record.featured),
    sort_order: nullableNumber(record.sortOrder) || 1,
  };
}

export function mapGalleryFromDatabase(row = {}) {
  return {
    id: row.id,
    title: row.title,
    filename: row.filename,
    url: row.storage_path,
    storagePath: row.storage_path,
    category: row.category,
    type: row.mime_type,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    size: row.size_bytes,
    alt: row.alt_text,
    altText: row.alt_text,
    usage: row.usage_description,
    status: uiStatus(row.status),
    sortOrder: row.sort_order,
    uploadedAt: row.created_at,
  };
}

export function mapGalleryToDatabase(record = {}) {
  return {
    ...(record.id ? { id: record.id } : {}),
    title: text(record.title),
    filename: text(record.filename),
    storage_path: text(record.storagePath ?? record.url),
    category: text(record.category),
    mime_type: text(record.mimeType ?? record.type),
    width: nullableNumber(record.width),
    height: nullableNumber(record.height),
    size_bytes: nullableNumber(record.size) || 1,
    alt_text: text(record.altText ?? record.alt),
    usage_description: text(record.usage),
    status: dbStatus(record.status, 'draft'),
    sort_order: nullableNumber(record.sortOrder) || 1,
  };
}

export function mapSeoFromDatabase(row = {}) {
  return {
    id: row.id,
    page: row.route,
    route: row.route,
    title: row.meta_title,
    metaTitle: row.meta_title,
    description: row.meta_description,
    metaDescription: row.meta_description,
    canonical: row.canonical_url,
    canonicalUrl: row.canonical_url,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    ogImage: row.og_image_path,
    index: row.should_index,
    follow: row.should_follow,
    sitemap: row.include_in_sitemap,
  };
}

export function mapSeoToDatabase(record = {}) {
  return {
    ...(record.id ? { id: record.id } : {}),
    route: text(record.route ?? record.page),
    meta_title: text(record.metaTitle ?? record.title),
    meta_description: text(record.metaDescription ?? record.description),
    canonical_url: text(record.canonicalUrl ?? record.canonical),
    og_title: text(record.ogTitle),
    og_description: text(record.ogDescription),
    og_image_path: nullableText(record.ogImage),
    should_index: record.shouldIndex ?? record.index ?? true,
    should_follow: record.shouldFollow ?? record.follow ?? true,
    include_in_sitemap: record.includeInSitemap ?? record.sitemap ?? true,
  };
}

export function mapSettingsFromDatabase(row = {}) {
  const messageTemplates = row.message_templates || {};
  return {
    id: row.id || 'primary',
    clinicIdentity: row.clinic_identity || {},
    contact: row.contact || {},
    socialMedia: row.social_links || {},
    socialLinks: row.social_links || {},
    clinicHours: row.clinic_hours || {},
    messaging: {
      ...messageTemplates,
      appointmentMessage: messageTemplates.appointmentMessage ?? messageTemplates.appointment ?? '',
      enquiryMessage: messageTemplates.enquiryMessage ?? messageTemplates.enquiry ?? '',
    },
    messageTemplates: {
      ...messageTemplates,
      appointmentMessage: messageTemplates.appointmentMessage ?? messageTemplates.appointment ?? '',
      enquiryMessage: messageTemplates.enquiryMessage ?? messageTemplates.enquiry ?? '',
    },
    homepage: row.homepage || {},
    footer: row.footer || {},
    maintenance: row.feature_flags || {},
    featureFlags: row.feature_flags || {},
    branding: row.brand || {},
    brand: row.brand || {},
  };
}

export function mapSettingsToDatabase(record = {}) {
  return {
    id: 'primary',
    clinic_identity: record.clinicIdentity || {},
    contact: record.contact || {},
    social_links: record.socialLinks || record.socialMedia || {},
    clinic_hours: record.clinicHours || {},
    message_templates: record.messageTemplates || record.messaging || {},
    homepage: record.homepage || {},
    footer: record.footer || {},
    feature_flags: record.featureFlags || record.maintenance || {},
    brand: record.brand || record.branding || {},
  };
}

export function mapAppointmentFromDatabase(row = {}) {
  return {
    id: row.id,
    name: row.display_name,
    mobile: row.phone,
    phone: row.phone,
    email: row.email || '',
    enquiryType: uiStatus(row.enquiry_type),
    treatmentId: row.treatment_id,
    treatment: row.treatment_label,
    doctorId: row.doctor_id,
    doctor: row.doctor_label,
    preferredDate: row.preferred_date || '',
    message: row.message || '',
    source: uiStatus(row.source),
    status: uiStatus(row.status),
    notes: row.notes,
    history: row.status_history || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAppointmentAdminToDatabase(record = {}) {
  return {
    ...(record.id ? { id: record.id } : {}),
    display_name: text(record.name),
    phone: text(record.phone ?? record.mobile),
    email: nullableText(record.email),
    enquiry_type: dbStatus(record.enquiryType, 'appointment'),
    treatment_id: record.treatmentId || null,
    treatment_label: text(record.treatment),
    doctor_id: record.doctorId || null,
    doctor_label: text(record.doctor),
    preferred_date: nullableText(record.preferredDate),
    message: text(record.message).slice(0, 2000),
    source: dbStatus(record.source, 'website'),
    consent: record.consent ?? true,
    status: dbStatus(record.status, 'new'),
    notes: text(record.notes),
    status_history: Array.isArray(record.history) ? record.history : [],
  };
}

export function normalizeAppointmentPayload(record = {}) {
  return {
    display_name: text(record.name ?? record.displayName),
    phone: text(record.phone ?? record.mobile),
    email: nullableText(record.email),
    enquiry_type: dbStatus(record.enquiryType, 'appointment'),
    treatment_id: record.treatmentId || null,
    treatment_label: text(record.treatmentLabel ?? record.treatment),
    doctor_id: record.doctorId || null,
    doctor_label: text(record.doctorLabel ?? record.doctor),
    preferred_date: nullableText(record.preferredDate),
    message: text(record.message).slice(0, 2000),
    source: dbStatus(record.source, 'website'),
    consent: Boolean(record.consent),
    status: 'new',
    notes: '',
    status_history: [{ status: 'new', at: new Date().toISOString() }],
  };
}

export function mapAuditFromDatabase(row = {}) {
  return {
    id: row.id,
    administratorId: row.administrator_id,
    action: row.action,
    tableName: row.table_name,
    recordId: row.record_id,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

export function mapAnalyticsFromDatabase(row = {}) {
  return {
    id: row.id,
    eventType: row.event_type,
    pagePath: row.page_path,
    referrerDomain: row.referrer_domain,
    createdAt: row.created_at,
  };
}

export function storagePathFor(collection, recordId, filename) {
  const safeCollection = text(collection).toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'media';
  const safeRecord = text(recordId).toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'record';
  const raw = text(filename).toLowerCase().replace(/\\/g, '/').split('/').pop() || 'image';
  const dot = raw.lastIndexOf('.');
  const extension = dot > 0 ? raw.slice(dot + 1).replace(/[^a-z0-9]/g, '') : '';
  const base = (dot > 0 ? raw.slice(0, dot) : raw)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image';
  return `${safeCollection}/${safeRecord}/${base}${extension ? `.${extension}` : ''}`;
}
