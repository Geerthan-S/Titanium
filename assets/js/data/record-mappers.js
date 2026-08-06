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
  Review: 'review',
  Scheduled: 'scheduled',
  Published: 'published',
  Unpublished: 'archived',
  Archived: 'archived',
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  New: 'new',
  Contacted: 'contacted',
  'Appointment Pending': 'contacted',
  Confirmed: 'confirmed',
  Completed: 'completed',
  Closed: 'cancelled',
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
const nullableJson = (value) => {
  if (!text(value)) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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

export function richTextSegments(value = '') {
  return String(value ?? '')
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r?\n/g, '<br>')}</p>`)
    .join('');
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

function parseBenefits(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return {
          title: item.title || '',
          description: item.description || '',
          sortOrder: item.sortOrder ?? item.sort_order ?? (idx + 1)
        };
      }
      return { title: String(item), description: '', sortOrder: idx + 1 };
    });
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parseBenefits(parsed);
  } catch (e) { }
  return String(value)
    .split(/[\r\n,]+/)
    .map((item, idx) => ({ title: item.trim(), description: '', sortOrder: idx + 1 }))
    .filter(item => item.title);
}

function parseProcedureSteps(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return {
          title: item.title || '',
          description: item.description || '',
          duration: item.duration || '',
          sortOrder: item.sortOrder ?? item.sort_order ?? (idx + 1)
        };
      }
      return { title: 'Procedure Step', description: String(item), duration: '', sortOrder: idx + 1 };
    });
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parseProcedureSteps(parsed);
  } catch (e) { }
  if (typeof value === 'string' && value.trim()) {
    return [{ title: 'Procedure Step', description: value.trim(), duration: '', sortOrder: 1 }];
  }
  return [];
}

function parseClinicalReferences(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          title: item.title || '',
          organisation: item.organisation || item.org || '',
          url: item.url || '',
          publicationDate: item.publicationDate || item.publication_date || ''
        };
      }
      try {
        const parsed = JSON.parse(item);
        if (typeof parsed === 'object' && parsed !== null) return parseClinicalReferences([parsed])[0];
      } catch (e) { }
      return { title: String(item), organisation: '', url: '', publicationDate: '' };
    }).filter(item => item.title);
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parseClinicalReferences(parsed);
  } catch (e) { }
  return String(value)
    .split(/[\r\n,]+/)
    .map(item => ({ title: item.trim(), organisation: '', url: '', publicationDate: '' }))
    .filter(item => item.title);
}

function parseAdditionalGallery(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return {
          assetId: item.assetId || item.asset_id || '',
          imagePath: item.imagePath || item.image_path || '',
          altText: item.altText || item.alt_text || '',
          caption: item.caption || '',
          sortOrder: item.sortOrder ?? item.sort_order ?? (idx + 1)
        };
      }
      try {
        const parsed = JSON.parse(item);
        if (typeof parsed === 'object' && parsed !== null) return parseAdditionalGallery([parsed])[0];
      } catch (e) { }
      return { assetId: '', imagePath: String(item), altText: '', caption: '', sortOrder: idx + 1 };
    }).filter(item => item.imagePath);
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parseAdditionalGallery(parsed);
  } catch (e) { }
  return String(value)
    .split(/[\r\n,]+/)
    .map((item, idx) => ({ assetId: '', imagePath: item.trim(), altText: '', caption: '', sortOrder: idx + 1 }))
    .filter(item => item.imagePath);
}

function parseFaqs(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return {
          question: item.question || '',
          answer: item.answer || '',
          sortOrder: item.sortOrder ?? item.sort_order ?? (idx + 1)
        };
      }
      return null;
    }).filter(Boolean);
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parseFaqs(parsed);
  } catch (e) { }
  return String(value)
    .split('\n')
    .map((line, idx) => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        return { question: parts[0].trim(), answer: parts.slice(1).join('|').trim(), sortOrder: idx + 1 };
      }
      return null;
    })
    .filter(Boolean);
}

function parseBeforeAfterGallery(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return {
          beforeAssetId: item.beforeAssetId || item.before_asset_id || '',
          afterAssetId: item.afterAssetId || item.after_asset_id || '',
          beforeUrl: item.beforeUrl || item.before_url || '',
          afterUrl: item.afterUrl || item.after_url || '',
          caption: item.caption || '',
          timelineStage: item.timelineStage || item.timeline_stage || '',
          sortOrder: item.sortOrder ?? item.sort_order ?? (idx + 1),
          consentConfirmed: item.consentConfirmed === true || item.consent_confirmed === true || item.consentConfirmed === 'true'
        };
      }
      return null;
    }).filter(Boolean);
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parseBeforeAfterGallery(parsed);
  } catch (e) { }
  return String(value)
    .split('\n')
    .map((line, idx) => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        return {
          beforeAssetId: '',
          afterAssetId: '',
          beforeUrl: parts[0].trim(),
          afterUrl: parts[1].trim(),
          caption: parts[2] ? parts[2].trim() : '',
          timelineStage: '',
          sortOrder: idx + 1,
          consentConfirmed: true
        };
      }
      return null;
    })
    .filter(Boolean);
}

function parseUnsuitableCandidates(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed;
  } catch (e) { }
  return String(value)
    .split(/[\r\n]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

export function mapTreatmentFromDatabase(row = {}) {
  // Graceful handling of reviewer ID alignment
  const reviewerId = row.reviewer_profile_id || row.reviewer_doctor_id || row.reviewed_by_doctor_id || null;
  const reviewedAtDate = row.last_reviewed_at || row.reviewed_at || row.medical_reviewed_at || null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    shortDescription: row.short_description,
    cardCopy: row.card_copy || row.short_description,
    fullDescription: row.full_description,
    concernTriggers: (row.concern_triggers || row.ideal_for || []).join(', '),
    idealFor: (row.ideal_for || []).join(', '),
    notIdealFor: (row.not_ideal_for || []).join(', '),
    materialsUsed: (row.materials_used || []).join(', '),
    risksLimitations: row.risks_limitations || row.limitations,
    limitations: row.limitations || row.risks_limitations,
    aftercare: row.aftercare,
    assessment: row.assessment,
    process: row.process || row.procedure_steps,
    faqs: row.treatment_faqs || [],
    specialists: row.treatment_specialists || [],
    relatedArticles: row.treatment_related_articles || [],
    galleryAssetIds: row.gallery_asset_ids || [],
    focalX: row.focal_x ?? 0.5,
    focalY: row.focal_y ?? 0.5,
    doctorIds: row.doctor_ids || [],
    articleIds: row.article_ids || [],
    relatedTreatmentIds: row.related_treatment_ids || [],
    concernTags: row.concern_tags || [],
    duration: row.duration,
    visits: row.visits,
    price: row.price,
    pricingStatus: uiStatus(row.pricing_status),
    priceStatus: row.pricing_status,
    benefits: parseBenefits(row.benefits),
    suitability: row.suitability,
    steps: parseProcedureSteps(row.procedure_steps || row.process),
    recovery: row.recovery || row.recovery_information,
    image: row.image_path,
    imageAlt: row.image_alt,
    featured: row.featured,
    status: uiStatus(row.status),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    canonicalUrl: row.canonical_url || row.canonical_url_override,
    ogImage: row.og_image_path,
    schemaJson: row.schema_json ? JSON.stringify(row.schema_json, null, 2) : '',
    noindex: row.noindex === true,
    reviewerDoctorId: reviewerId,
    reviewedAt: reviewedAtDate,
    scheduledFor: row.scheduled_for || row.publish_at,
    revisionNote: row.revision_note,
    reviewedByDoctorId: reviewerId,
    lastReviewedAt: reviewedAtDate,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    // New fields
    alternativeNames: row.alternative_names || [],
    conditionsTreated: row.conditions_treated || [],
    anaesthesiaSedation: row.anaesthesia_sedation || '',
    expectedOutcome: row.expected_outcome || '',
    expectedLongevity: row.expected_longevity || '',
    unsuitableCandidates: parseUnsuitableCandidates(row.unsuitable_candidates),
    alternativeTreatments: row.alternative_treatments || '',
    beforePreparation: row.before_preparation || '',
    whenContactClinic: row.when_contact_clinic || '',
    whenBookConsultation: row.when_book_consultation || '',
    faqJson: parseFaqs(row.faq_json),
    pricingDisplayType: row.pricing_display_type || 'consultation_required',
    minPrice: row.min_price,
    maxPrice: row.max_price,
    currency: row.currency || 'INR',
    pricingNote: row.pricing_note || '',
    priceVerifiedDate: row.price_verified_date || '',
    additionalGallery: parseAdditionalGallery(row.additional_gallery),
    beforeAfterGallery: parseBeforeAfterGallery(row.before_after_gallery),
    beforeAfterConsent: row.before_after_consent === true,
    writtenBy: row.written_by || '',
    clinicallyReviewedBy: row.clinically_reviewed_by || '',
    reviewerCredentials: row.reviewer_credentials || '',
    reviewerProfileId: row.reviewer_profile_id || reviewerId,
    clinicalReferences: parseClinicalReferences(row.clinical_references),
    canonicalUrlOverride: row.canonical_url_override || row.canonical_url,
    allowSearchIndexing: row.allow_search_indexing !== false,
    socialTitle: row.social_title || '',
    socialDescription: row.social_description || '',
    socialImage: row.social_image || '',
    primarySearchPhrase: row.primary_search_phrase || '',
    secondarySearchPhrases: row.secondary_search_phrases || [],
    structuredDataType: row.structured_data_type || 'MedicalProcedure',
    structuredDataStatus: row.structured_data_status || 'Pending',
    sitemapStatus: row.sitemap_status || 'Included',
  };
}

export function mapTreatmentToDatabase(record = {}) {
  // Align clinical reviewer ID
  const reviewerId = record.reviewerProfileId || record.reviewerDoctorId || record.reviewedByDoctorId || null;
  const reviewedAtDate = record.lastReviewedAt || record.reviewedAt || null;

  return {
    ...(record.id ? { id: record.id } : {}),
    name: text(record.name),
    slug: text(record.slug),
    category: text(record.category),
    card_copy: text(record.cardCopy ?? record.shortDescription),
    short_description: text(record.shortDescription),
    full_description: text(record.fullDescription),
    concern_triggers: list(record.concernTriggers ?? record.whenBookConsultation),
    ideal_for: list(record.idealFor ?? record.conditionsTreated),
    not_ideal_for: list(record.notIdealFor ?? record.unsuitableCandidates),
    materials_used: list(record.materialsUsed),
    risks_limitations: text(record.risksLimitations ?? record.limitations),
    limitations: text(record.limitations ?? record.risksLimitations),
    aftercare: text(record.aftercare),
    assessment: text(record.assessment),
    process: text(record.process ?? record.steps ?? record.procedureSteps),
    gallery_asset_ids: list(record.galleryAssetIds),
    focal_x: nullableNumber(record.focalX) ?? 0.5,
    focal_y: nullableNumber(record.focalY) ?? 0.5,
    doctor_ids: list(record.doctorIds),
    article_ids: list(record.articleIds),
    related_treatment_ids: list(record.relatedTreatmentIds),
    concern_tags: list(record.concernTags),
    duration: text(record.duration),
    visits: text(record.visits),
    price: nullableNumber(record.price ?? record.minPrice),
    pricing_status: dbStatus(record.pricingStatus ?? record.priceStatus, 'consultation_required'),
    benefits: parseBenefits(record.benefits),
    suitability: text(record.suitability),
    procedure_steps: parseProcedureSteps(record.steps ?? record.procedureSteps ?? record.process),
    recovery: text(record.recovery ?? record.recoveryInformation),
    image_path: nullableText(record.image),
    image_alt: text(record.imageAlt),
    featured: Boolean(record.featured),
    status: dbStatus(record.status, 'draft'),
    seo_title: text(record.seoTitle),
    seo_description: text(record.seoDescription),
    canonical_url: nullableText(record.canonicalUrl ?? record.canonicalUrlOverride),
    og_image_path: nullableText(record.ogImage ?? record.socialImage),
    schema_json: nullableJson(record.schemaJson),
    noindex: Boolean(record.noindex || !record.allowSearchIndexing),
    reviewer_doctor_id: reviewerId,
    reviewed_at: nullableText(reviewedAtDate),
    scheduled_for: nullableText(record.scheduledFor),
    revision_note: text(record.revisionNote),
    reviewed_by_doctor_id: reviewerId,
    last_reviewed_at: nullableText(reviewedAtDate),
    sort_order: nullableNumber(record.sortOrder) || 1,

    // New fields
    alternative_names: list(record.alternativeNames),
    conditions_treated: list(record.conditionsTreated),
    anaesthesia_sedation: text(record.anaesthesiaSedation),
    expected_outcome: text(record.expectedOutcome),
    expected_longevity: text(record.expectedLongevity),
    unsuitable_candidates: Array.isArray(record.unsuitableCandidates) ? JSON.stringify(record.unsuitableCandidates) : text(record.unsuitableCandidates),
    alternative_treatments: text(record.alternativeTreatments),
    before_preparation: text(record.beforePreparation),
    when_contact_clinic: text(record.whenContactClinic),
    when_book_consultation: text(record.whenBookConsultation),
    faq_json: parseFaqs(record.faqJson),
    pricing_display_type: text(record.pricingDisplayType || 'consultation_required'),
    min_price: nullableNumber(record.minPrice),
    max_price: nullableNumber(record.maxPrice),
    currency: text(record.currency || 'INR'),
    pricing_note: text(record.pricingNote),
    price_verified_date: nullableText(record.priceVerifiedDate),
    additional_gallery: parseAdditionalGallery(record.additionalGallery),
    before_after_gallery: parseBeforeAfterGallery(record.beforeAfterGallery),
    before_after_consent: Boolean(record.beforeAfterConsent),
    written_by: text(record.writtenBy),
    clinically_reviewed_by: text(record.clinicallyReviewedBy),
    reviewer_credentials: text(record.reviewerCredentials),
    reviewer_profile_id: reviewerId,
    clinical_references: parseClinicalReferences(record.clinicalReferences),
    canonical_url_override: nullableText(record.canonicalUrlOverride),
    allow_search_indexing: Boolean(record.allowSearchIndexing),
    social_title: text(record.socialTitle),
    social_description: text(record.socialDescription),
    social_image: nullableText(record.socialImage),
    primary_search_phrase: text(record.primarySearchPhrase),
    secondary_search_phrases: list(record.secondarySearchPhrases),
    structured_data_type: text(record.structuredDataType || 'MedicalProcedure'),
    structured_data_status: text(record.structuredDataStatus || 'Pending'),
    sitemap_status: text(record.sitemapStatus || 'Included'),
  };
}

export function mapBlogFromDatabase(row = {}) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    categoryId: row.category_id,
    tags: (row.tags || []).join(', '),
    excerpt: row.excerpt,
    deck: row.deck,
    content: row.content_html,
    contentHtml: row.content_html,
    keyTakeaways: (row.key_takeaways || []).join(', '),
    readingTimeMinutes: row.reading_time_minutes,
    reviewerDoctorId: row.reviewer_doctor_id || row.reviewed_by_doctor_id,
    medicalReviewedAt: row.medical_reviewed_at || row.last_reviewed_at,
    clinicalReviewComments: row.clinical_review_comments,
    reviewedByDoctorId: row.reviewed_by_doctor_id,
    reviewedByName: row.reviewed_by_name,
    lastReviewedAt: row.last_reviewed_at,
    medicalDisclaimer: row.medical_disclaimer,
    relatedTreatments: row.blog_related_treatments || [],
    treatmentIds: row.treatment_ids || [],
    internalLinks: (row.internal_links || []).join(', '),
    image: row.image_path,
    imageAlt: row.image_alt,
    author: row.author_name,
    publishDate: row.publish_at,
    status: uiStatus(row.status),
    featured: row.featured,
    trending: row.trending,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    canonicalUrl: row.canonical_url,
    ogImage: row.og_image_path,
    noindex: row.noindex === true,
    scheduledFor: row.scheduled_for || row.publish_at,
    revisionNote: row.revision_note,
    generatedHtmlStatus: row.generated_html_status || 'pending',
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
    category_id: record.categoryId || null,
    tags: list(record.tags),
    excerpt: text(record.excerpt),
    deck: text(record.deck),
    content_html: sanitizeCmsHtml(record.content),
    key_takeaways: list(record.keyTakeaways),
    reading_time_minutes: nullableNumber(record.readingTimeMinutes),
    reviewer_doctor_id: record.reviewerDoctorId || record.reviewedByDoctorId || null,
    medical_reviewed_at: nullableText(record.medicalReviewedAt ?? record.lastReviewedAt),
    clinical_review_comments: text(record.clinicalReviewComments),
    reviewed_by_doctor_id: record.reviewerDoctorId || record.reviewedByDoctorId || null,
    reviewed_by_name: nullableText(record.reviewedByName),
    last_reviewed_at: nullableText(record.lastReviewedAt),
    medical_disclaimer: text(record.medicalDisclaimer),
    treatment_ids: list(record.treatmentIds),
    internal_links: list(record.internalLinks),
    image_path: nullableText(record.image),
    image_alt: text(record.imageAlt),
    author_name: text(record.author),
    publish_at: nullableText(record.publishDate),
    status: dbStatus(record.status, 'active'),
    featured: Boolean(record.featured),
    trending: Boolean(record.trending),
    seo_title: text(record.seoTitle),
    seo_description: text(record.seoDescription),
    canonical_url: nullableText(record.canonicalUrl),
    og_image_path: nullableText(record.ogImage),
    noindex: Boolean(record.noindex),
    scheduled_for: nullableText(record.scheduledFor),
    revision_note: text(record.revisionNote),
    generated_html_status: text(record.generatedHtmlStatus || 'pending'),
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
    videoUrl: row.video_url,
    videoThumbnail: row.video_thumbnail_url,
    publicationPermission: row.publication_permission,
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
    video_url: nullableText(record.videoUrl),
    video_thumbnail_url: nullableText(record.videoThumbnail),
    publication_permission: Boolean(record.publicationPermission),
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
    filename: row.filename || row.cloudinary_public_id,
    cloudinaryPublicId: row.cloudinary_public_id || '',
    secureUrl: row.secure_url || row.storage_path || '',
    url: row.secure_url || row.storage_path,
    storagePath: row.secure_url || row.storage_path,
    resourceType: row.resource_type || 'image',
    format: row.format || '',
    folder: row.folder || '',
    category: row.category || row.folder,
    type: row.mime_type || row.resource_type,
    mimeType: row.mime_type || row.resource_type,
    width: row.width,
    height: row.height,
    size: row.size_bytes || row.bytes,
    bytes: row.bytes || row.size_bytes,
    alt: row.alt_text || row.alt,
    altText: row.alt_text || row.alt,
    caption: row.caption || '',
    tags: (row.tags || []).join(', '),
    focalX: row.focal_x ?? 0.5,
    focalY: row.focal_y ?? 0.5,
    isGalleryItem: row.is_gallery_item === true,
    usage: row.usage_description || `${row.usage_count || 0} references`,
    status: uiStatus(row.status),
    sortOrder: row.sort_order,
    uploadedAt: row.created_at,
  };
}

export function mapGalleryToDatabase(record = {}) {
  return {
    ...(record.id ? { id: record.id } : {}),
    title: text(record.title),
    cloudinary_public_id: text(record.cloudinaryPublicId || record.filename),
    secure_url: text(record.secureUrl ?? record.storagePath ?? record.url),
    resource_type: text(record.resourceType || record.type || 'image'),
    format: text(record.format),
    folder: text(record.folder || record.category),
    filename: text(record.filename),
    storage_path: text(record.secureUrl ?? record.storagePath ?? record.url),
    category: text(record.category),
    mime_type: text(record.mimeType ?? record.type),
    width: nullableNumber(record.width),
    height: nullableNumber(record.height),
    bytes: nullableNumber(record.bytes ?? record.size) || 1,
    size_bytes: nullableNumber(record.size ?? record.bytes) || 1,
    alt: text(record.altText ?? record.alt),
    alt_text: text(record.altText ?? record.alt),
    caption: text(record.caption),
    tags: list(record.tags),
    focal_x: nullableNumber(record.focalX),
    focal_y: nullableNumber(record.focalY),
    is_gallery_item: Boolean(record.isGalleryItem),
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
    preferredTime: row.preferred_time || '',
    reason: row.reason || row.enquiry_type || '',
    sourcePage: row.source_page || '',
    utmSource: row.utm_source || '',
    utmMedium: row.utm_medium || '',
    utmCampaign: row.utm_campaign || '',
    assignedTo: row.assigned_to || '',
    message: row.message || '',
    source: uiStatus(row.source),
    status: uiStatus(row.status),
    notes: row.notes,
    internalNotes: row.internal_notes || row.notes,
    consentAt: row.consent_at || '',
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
    preferred_time: nullableText(record.preferredTime),
    reason: nullableText(record.reason),
    source_page: nullableText(record.sourcePage),
    utm_source: nullableText(record.utmSource),
    utm_medium: nullableText(record.utmMedium),
    utm_campaign: nullableText(record.utmCampaign),
    assigned_to: record.assignedTo || null,
    message: text(record.message).slice(0, 500),
    source: dbStatus(record.source, 'website'),
    consent: record.consent ?? true,
    status: dbStatus(record.status, 'new'),
    notes: text(record.notes),
    internal_notes: text(record.internalNotes ?? record.notes),
    consent_at: nullableText(record.consentAt),
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
    preferred_time: nullableText(record.preferredTime),
    reason: nullableText(record.reason),
    source_page: nullableText(record.sourcePage),
    utm_source: nullableText(record.utmSource),
    utm_medium: nullableText(record.utmMedium),
    utm_campaign: nullableText(record.utmCampaign),
    message: text(record.message).slice(0, 500),
    source: dbStatus(record.source, 'website'),
    consent: Boolean(record.consent),
    consent_at: record.consent ? new Date().toISOString() : null,
    status: 'new',
    notes: '',
    internal_notes: '',
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

export function mapWebsiteAssetFromDatabase(row = {}) {
  return {
    id: row.id,
    assetKey: row.asset_key,
    title: row.title,
    page: row.page,
    section: row.section,
    imagePath: row.image_path,
    altText: row.alt_text,
    status: uiStatus(row.status),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function mapWebsiteAssetToDatabase(record = {}) {
  return {
    ...(record.id ? { id: record.id } : {}),
    asset_key: text(record.assetKey),
    title: text(record.title),
    page: text(record.page),
    section: text(record.section),
    image_path: text(record.imagePath),
    alt_text: text(record.altText),
    status: dbStatus(record.status, 'published'),
    sort_order: nullableNumber(record.sortOrder) || 0,
    updated_by: record.updatedBy || null,
  };
}
