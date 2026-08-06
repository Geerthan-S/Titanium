import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { loadComponents } from '../components/component-loader.js';
import { showToast } from '../components/toast.js';
import { requireSupabase } from '../data/supabase-client.js';
import { removeCmsMedia } from '../data/media-repository.js';
import { TREATMENT_CATEGORIES, BLOG_CATEGORIES, GALLERY_CATEGORIES } from '../utils/constants.js';
import {
  loginAdmin,
  redirectAuthenticatedLogin,
  requestPasswordReset,
  requireAdmin,
} from './admin-auth.js';
import { renderAdminChart } from './admin-charts.js';
import { confirmAdminAction } from './admin-dialog.js';
import { openAdminForm, hasUnsavedAdminChanges } from './admin-form.js';
import { initializeAdminShell } from './admin-shell.js';
import {
  getAdminData,
  getCollection,
  getSettings,
  loadCollection,
  removeRecord,
  saveSettings,
  updateRecord,
  upsertRecord,
} from './admin-store.js';
import { createAdminTable } from './admin-table.js';
import { canPublishTestimonial, escapeHtml, formatDate, formatFileSize, sanitizeRichText, slugify, statusClass } from './admin-utils.js';
import { canArchiveRecord, canPublishRecord } from './admin-workflows.js';
import {
  initAdditionalGallery,
  initBeforeAfterGallery,
  initBenefitsList,
  initChipList,
  initClinicalReferences,
  initDoctorSelector,
  initFaqList,
  initPricingControls,
  initProcedureSteps,
  initRelatedTreatmentsSelector,
  initRepeatableText,
  initSystemInfoPanel,
  renderSeoPreview,
  renderTreatmentCardPreview,
} from './admin-form-custom.js';


const statusOptions = ['draft', 'review', 'scheduled', 'published', 'archived'];
const yesNo = ['No', 'Yes'];

const field = (name, label, options = {}) => ({ name, label, ...options });
const fields = {
  appointments: [
    field('name', 'Patient or lead', { required: true, helper: 'Do not enter medical history or sensitive health information.' }),
    field('mobile', 'Mobile', { type: 'tel', required: true }),
    field('email', 'Email', { type: 'email' }),
    field('preferredTime', 'Preferred time'),
    field('reason', 'Reason for visit'),
    field('sourcePage', 'Source page'),
    field('utmSource', 'UTM source'),
    field('utmMedium', 'UTM medium'),
    field('utmCampaign', 'UTM campaign'),
    field('assignedTo', 'Assigned to'),
    field('consentAt', 'Consent given at', { type: 'datetime' }),
    field('enquiryType', 'Enquiry type', { type: 'select', options: ['Appointment', 'General', 'Callback', 'WhatsApp'] }),
    field('treatment', 'Treatment interest'),
    field('doctor', 'Preferred doctor'),
    field('preferredDate', 'Preferred date', { type: 'date' }),
    field('source', 'Source', { type: 'select', options: ['Website', 'Contact', 'WhatsApp', 'Phone', 'Email'] }),
    field('status', 'Status', { type: 'select', options: ['new', 'contacted', 'confirmed', 'completed', 'cancelled', 'spam'] }),
    field('message', 'Patient message', { type: 'textarea', full: true, readOnly: true }),
    field('notes', 'Internal follow-up notes', { type: 'textarea', full: true, maxLength: 800, helper: 'Do not enter medical history or sensitive health concerns.' }),
    field('history', 'Status history', { type: 'textarea', full: true, readOnly: true }),
  ],
  doctors: [
    field('name', 'Name', { required: true }), field('slug', 'Slug', { helper: 'Generated from the name when left blank.' }),
    field('designation', 'Designation', { required: true }), field('qualification', 'Qualification'),
    field('additionalQualifications', 'Additional qualifications'), field('specialization', 'Primary specialization', { required: true }),
    field('specialties', 'Additional specialties'), field('experience', 'Experience years', { type: 'number', min: 0 }),
    field('languages', 'Languages'), field('registrationNumber', 'Registration number'),
    field('biography', 'Biography', { type: 'textarea', full: true, maxLength: 1200 }),
    field('philosophy', 'Treatment philosophy', { type: 'textarea', full: true, maxLength: 600 }),
    field('consultation', 'Consultation information'), field('availability', 'Availability'),
    field('portrait', 'Portrait image path', { helper: 'Paste the gallery storage path, e.g. gallery/root/uuid.webp' }),
    field('imageAlt', 'Image alt text'), field('featured', 'Featured profile', { type: 'checkbox', switchLabel: 'Feature on website' }),
    field('status', 'Publish status', { type: 'select', options: statusOptions }), field('sortOrder', 'Sort order', { type: 'number', min: 1 }),
  ],
  treatments: [
    field('sec-basics', 'Basic Information', { type: 'heading', helper: 'Primary information and public overview of the treatment.' }),
    field('name', 'Name', { required: true }),
    field('slug', 'Slug', { helper: 'Generated from the name when left blank.' }),
    field('category', 'Category', { type: 'select', options: TREATMENT_CATEGORIES }),
    field('alternativeNames', 'Alternative names', { type: 'custom-chip', label: 'Alternative names', full: true, helper: 'Common synonyms or alternative spellings.' }),
    field('shortDescription', 'Short description', { type: 'textarea', full: true, maxLength: 220, required: true, helper: 'Brief summary displayed on listings. Max 220 characters.' }),
    field('fullDescription', 'Treatment overview', { type: 'textarea', full: true, maxLength: 2400, helper: 'Detailed overview of the treatment. Max 2400 characters.' }),
    field('conditionsTreated', 'Conditions or concerns treated', { type: 'custom-chip', full: true, helper: 'Add each condition or concern as a chip.' }),

    field('sec-details', 'Treatment Details', { type: 'heading', helper: 'Expected clinical outcome, longevity and candidate eligibility.' }),
    field('duration', 'Typical appointment duration', { helper: 'E.g. 45-60 mins, varies by plan.' }),
    field('visits', 'Typical number of visits', { helper: 'E.g. 1-2 visits, depends on clinical needs.' }),
    field('anaesthesiaSedation', 'Anaesthesia or sedation', { helper: 'E.g. Local anaesthetic, IV sedation, none.' }),
    field('benefits', 'Benefits', { type: 'custom-benefits', full: true }),
    field('expectedOutcome', 'Expected outcome', { type: 'textarea', full: true }),
    field('expectedLongevity', 'Expected longevity', { helper: 'E.g. 10-15 years, lifetime with care.' }),
    field('suitability', 'Who is this treatment suitable for?', { type: 'textarea', full: true }),
    field('unsuitableCandidates', 'Unsuitable candidates or contraindications', { type: 'custom-repeatable-text', full: true }),
    field('alternativeTreatments', 'Alternative treatments', { type: 'textarea', full: true }),

    field('sec-journey', 'Patient Journey', { type: 'heading', helper: 'Before, during, and aftercare information, milestones, and FAQs.' }),
    field('beforePreparation', 'Before-treatment preparation', { type: 'textarea', full: true }),
    field('steps', 'Procedure steps', { type: 'custom-steps', full: true }),
    field('recovery', 'Recovery and downtime', { type: 'textarea', full: true }),
    field('risksLimitations', 'Risks and limitations', { type: 'textarea', full: true }),
    field('aftercare', 'Aftercare', { type: 'textarea', full: true }),
    field('whenContactClinic', 'When to contact the clinic', { type: 'textarea', full: true }),
    field('whenBookConsultation', 'When to book a consultation', { type: 'textarea', full: true }),
    field('faqJson', 'Frequently asked questions (FAQs)', { type: 'custom-faqs', full: true }),

    field('sec-pricing', 'Pricing', { type: 'heading', helper: 'Manage prices and display styles.' }),
    field('_pricing', 'Pricing controls', { type: 'custom-pricing', full: true }),
    field('pricingNote', 'Pricing note', { type: 'textarea', full: true }),
    field('priceVerifiedDate', 'Last price verification date', { type: 'date' }),
    field('currency', 'Currency', { defaultValue: 'INR' }),

    field('sec-media', 'Media', { type: 'heading', helper: 'Configure main image, patient consent validation and gallery.' }),
    field('image', 'Featured image path', { helper: 'Paste the gallery storage path, e.g. gallery/root/uuid.webp' }),
    field('imageAlt', 'Image alt text'),
    field('additionalGallery', 'Additional treatment gallery', { type: 'custom-gallery', full: true }),
    field('beforeAfterGallery', 'Before-and-after comparisons', { type: 'custom-before-after', full: true }),
    field('beforeAfterConsent', 'Patient consent confirmation', { type: 'checkbox', switchLabel: 'Patient consent confirmed for before-and-after media' }),

    field('sec-clinical', 'Clinical Governance', { type: 'heading', helper: 'Assign authors, clinical review markers, and references.' }),
    field('writtenBy', 'Written by'),
    field('clinicallyReviewedBy', 'Clinically reviewed by'),
    field('reviewerCredentials', 'Reviewer credentials'),
    field('reviewerDoctorId', 'Clinical reviewer', { type: 'custom-doctor-selector', full: true }),
    field('reviewedAt', 'Last clinically reviewed on', { type: 'date' }),
    field('clinicalReferences', 'Clinical references', { type: 'custom-references', full: true }),
    field('revisionNote', 'Revision note', { type: 'textarea', full: true }),

    field('sec-seo', 'SEO Meta Tags', { type: 'heading', helper: 'Customize search engine tags and indexing controls.' }),
    field('seoTitle', 'SEO title', { maxLength: 60 }),
    field('seoDescription', 'SEO description', { type: 'textarea', full: true, maxLength: 160 }),
    field('canonicalUrlOverride', 'Canonical URL override'),
    field('allowSearchIndexing', 'Allow search indexing', { type: 'checkbox', switchLabel: 'Allow search engines to index this page', defaultValue: true }),
    field('socialTitle', 'Social title'),
    field('socialDescription', 'Social description', { type: 'textarea', full: true }),
    field('socialImage', 'Social image URL'),
    field('primarySearchPhrase', 'Primary search phrase'),
    field('secondarySearchPhrases', 'Secondary search phrases', { type: 'custom-chip', full: true, helper: 'Add each target phrase as a chip.' }),
    field('structuredDataType', 'Structured-data type', { defaultValue: 'MedicalProcedure' }),

    field('sec-publishing', 'Publishing & Order', { type: 'heading', helper: 'Scheduling, sorting and featured placement.' }),
    field('status', 'Publish status', { type: 'select', options: statusOptions }),
    field('scheduledFor', 'Scheduled publish time', { type: 'datetime' }),
    field('featured', 'Featured treatment', { type: 'checkbox', switchLabel: 'Feature on website' }),
    field('sortOrder', 'Sort order', { type: 'number', min: 1 }),

    field('sys-start', 'System Information', { type: 'details-start' }),
    field('_sysInfo', 'System status', { type: 'custom-sys-info', full: true, readOnly: true }),
    field('createdAt', 'Created date', { readOnly: true }),
    field('updatedAt', 'Updated date', { readOnly: true }),
    field('sys-end', '', { type: 'details-end' }),
  ],

  blogs: [
    field('title', 'Title', { required: true, maxLength: 100 }), field('slug', 'Slug', { helper: 'Generated from the title when left blank.' }),
    field('category', 'Category', { type: 'select', options: BLOG_CATEGORIES }),
    field('tags', 'Tags', { helper: 'Comma-separated tags.' }), field('excerpt', 'Excerpt', { type: 'textarea', full: true, maxLength: 220, required: true }),
    field('deck', 'Article deck', { type: 'textarea', full: true }),
    field('content', 'Full article content', { type: 'editor', full: true, required: true }),
    field('image', 'Featured image path', { helper: 'Paste the gallery storage path, e.g. gallery/root/uuid.webp' }), field('imageAlt', 'Image alt text'),
    field('author', 'Author', { required: true }), field('publishDate', 'Publish date', { type: 'date' }),
    field('status', 'Publish status', { type: 'select', options: statusOptions }), field('featured', 'Featured article', { type: 'checkbox', switchLabel: 'Feature article' }),
    field('trending', 'Trending article', { type: 'checkbox', switchLabel: 'Mark trending' }), field('seoTitle', 'SEO title', { maxLength: 60 }),
    field('seoDescription', 'SEO description', { type: 'textarea', full: true, maxLength: 160 }), field('sortOrder', 'Sort order', { type: 'number', min: 1 }),
    field('reviewerDoctorId', 'Clinical reviewer'),
    field('medicalReviewedAt', 'Clinical review date', { type: 'date' }),
    field('keyTakeaways', 'Key takeaways', { type: 'textarea', full: true }),
    field('noindex', 'Noindex', { type: 'checkbox', switchLabel: 'Exclude from search' }),
    field('revisionNote', 'Revision note', { type: 'textarea', full: true }),
    field('scheduledFor', 'Scheduled publish time', { type: 'datetime' }),
    field('generatedHtmlStatus', 'Generated HTML status', { readOnly: true }),
  ],
  testimonials: [
    field('name', 'Patient display name', { required: true, helper: 'Use a display label, not a full real identity.' }),
    field('treatment', 'Treatment'), field('rating', 'Rating', { type: 'number', min: 1 }),
    field('review', 'Review', { type: 'textarea', full: true, maxLength: 800, required: true }),
    field('image', 'Patient image path', { helper: 'Paste the gallery storage path, e.g. gallery/root/uuid.webp' }),
    field('consentStatus', 'Consent status', { type: 'select', options: ['Pending', 'Confirmed', 'Not provided'] }),
    field('source', 'Submission source'), field('moderationStatus', 'Moderation status', { type: 'select', options: ['Pending', 'Approved', 'Rejected'] }),
    field('featured', 'Featured', { type: 'checkbox', switchLabel: 'Feature testimonial' }),
    field('status', 'Publish status', { type: 'select', options: ['published', 'archived'] }), field('sortOrder', 'Sort order', { type: 'number', min: 1 }),
  ],
  gallery: [
    field('title', 'Media title', { required: true }), field('filename', 'Filename'),
    field('category', 'Category', { type: 'select', options: GALLERY_CATEGORIES }),
    field('alt', 'Alt text', { required: true }), field('dimensions', 'Dimensions'), field('size', 'File size in bytes', { type: 'number', min: 0 }),
    field('usage', 'Usage status'), field('status', 'Publish status', { type: 'select', options: statusOptions }), field('sortOrder', 'Sort order', { type: 'number', min: 1 }),
    field('url', 'Storage path', { helper: 'Paste the gallery storage path, e.g. gallery/root/uuid.webp' }),
    field('cloudinaryPublicId', 'Cloudinary public ID', { readOnly: true }),
    field('secureUrl', 'Secure URL', { readOnly: true }),
    field('focalX', 'Focal X', { type: 'number', min: 0, max: 1 }),
    field('focalY', 'Focal Y', { type: 'number', min: 0, max: 1 }),
  ],
  websiteAssets: [
    field('assetKey', 'Asset Key', { required: true, readOnly: true, helper: 'Unique identifier for the static frontend image.' }),
    field('title', 'Title', { required: true }),
    field('page', 'Page', { required: true, helper: 'E.g. home, about, testimonials, contact, global' }),
    field('section', 'Section', { required: true, helper: 'E.g. hero, our_clinic, our_story, clinic, global_footer' }),
    field('imagePath', 'Image Path', { type: 'custom-image-path', full: true }),
    field('altText', 'Alt Text', { required: true, helper: 'Descriptive accessibility alt text.' }),
    field('status', 'Publish status', { type: 'select', options: ['published', 'draft'] }),
    field('sortOrder', 'Sort order', { type: 'number', min: 0 }),
  ],
};

const managerConfigs = {
  appointments: {
    description: 'Review appointment requests and enquiries submitted through the clinic website.',
    addLabel: 'Add lead',
    columns: [
      { key: 'name', label: 'Patient or lead' }, { key: 'enquiryType', label: 'Enquiry type' }, { key: 'treatment', label: 'Treatment' },
      { key: 'source', label: 'Source' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'createdAt', label: 'Created', type: 'date' },
    ],
    filters: [
      { key: 'status', label: 'statuses', options: ['new', 'contacted', 'confirmed', 'completed', 'cancelled', 'spam'] },
      { key: 'source', label: 'sources', options: ['Website', 'Contact', 'WhatsApp', 'Phone', 'Email'] },
      { key: 'enquiryType', label: 'enquiry types', options: ['Appointment', 'General', 'Callback', 'WhatsApp'] },
    ],
    actions: [
      { key: 'view', label: 'View details', icon: 'eye' }, { key: 'status', label: 'Update status', icon: 'refresh-cw' },
      { key: 'reschedule', label: 'Reschedule', icon: 'calendar-clock' },
      { key: 'export', label: 'Export', icon: 'download' },
      { key: 'note', label: 'Add follow-up note', icon: 'notebook-pen' }, { key: 'call', label: 'Call', icon: 'phone' },
      { key: 'email', label: 'Email', icon: 'mail' }, { key: 'whatsapp', label: 'WhatsApp', icon: 'message-circle' },
      { key: 'archive', label: 'Archive', icon: 'archive' }, { key: 'delete', label: 'Delete record', icon: 'trash-2', danger: true },
    ],
  },
  doctors: {
    description: 'Create and maintain doctor profiles, publishing state, prominence, and display order.',
    addLabel: 'Add doctor profile',
    columns: [{ key: 'name', label: 'Doctor' }, { key: 'specialization', label: 'Specialization' }, { key: 'experience', label: 'Experience' }, { key: 'featured', label: 'Featured', render: (v) => `<span class="${statusClass(v ? 'Featured' : 'Standard')}">${v ? 'Featured' : 'Standard'}</span>` }, { key: 'status', label: 'Status', type: 'status' }, { key: 'sortOrder', label: 'Order' }],
    filters: [{ key: 'status', label: 'publish states', options: statusOptions }, { key: 'featured', label: 'featured states', options: ['true', 'false'] }],
  },
  treatments: {
    description: 'Manage treatment content, pricing confirmation, publishing, featured placement, and previews.',
    addLabel: 'Add treatment',
    columns: [{ key: 'name', label: 'Treatment' }, { key: 'category', label: 'Category' }, { key: 'pricingStatus', label: 'Pricing', type: 'status' }, { key: 'featured', label: 'Featured', render: (v) => v ? '<span class="admin-status admin-status--featured">Featured</span>' : '—' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'sortOrder', label: 'Order' }],
    filters: [{ key: 'category', label: 'categories', options: TREATMENT_CATEGORIES }, { key: 'status', label: 'publish states', options: statusOptions }, { key: 'pricingStatus', label: 'pricing states', options: ['Confirmed', 'Consultation Required', 'Pending Confirmation'] }],
  },
  blogs: {
    description: 'Draft, preview, schedule, publish, feature, and organise clinic articles.',
    addLabel: 'Create blog',
    columns: [{ key: 'title', label: 'Article' }, { key: 'category', label: 'Category' }, { key: 'author', label: 'Author' }, { key: 'publishDate', label: 'Publish date', type: 'date' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'trending', label: 'Trending', render: (v) => v ? '<span class="admin-status admin-status--featured">Trending</span>' : '—' }],
    filters: [{ key: 'category', label: 'categories', options: BLOG_CATEGORIES }, { key: 'status', label: 'publish states', options: statusOptions }],
  },
  testimonials: {
    description: 'Moderate patient feedback. Publishing requires approval and confirmed consent.',
    addLabel: 'Add testimonial',
    columns: [{ key: 'name', label: 'Patient' }, { key: 'treatment', label: 'Treatment' }, { key: 'rating', label: 'Rating' }, { key: 'featured', label: 'Featured', render: (v) => `<span class="${statusClass(v ? 'Featured' : 'Standard')}">${v ? 'Featured' : 'Standard'}</span>` }, { key: 'moderationStatus', label: 'Moderation', type: 'status' }, { key: 'consentStatus', label: 'Consent', type: 'status' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'sortOrder', label: 'Order' }],
    filters: [{ key: 'moderationStatus', label: 'moderation states', options: ['Pending', 'Approved', 'Rejected'] }, { key: 'consentStatus', label: 'consent states', options: ['Pending', 'Confirmed', 'Not provided'] }, { key: 'status', label: 'publish states', options: ['published', 'archived'] }],
  },
  gallery: {
    description: 'Manage clinic media, accessibility text, publishing state and asset usage.',
    addLabel: 'Add media',
    columns: [{ key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'filename', label: 'Filename' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'sortOrder', label: 'Order' }],
    filters: [{ key: 'category', label: 'categories', options: GALLERY_CATEGORIES }, { key: 'status', label: 'publish states', options: statusOptions }],
  },
  websiteAssets: {
    description: 'Manage static section-level website images with fallbacks and live updates.',
    addLabel: 'Add website asset',
    columns: [
      { key: 'assetKey', label: 'Key' },
      { key: 'title', label: 'Title' },
      { key: 'page', label: 'Page' },
      { key: 'section', label: 'Section' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'sortOrder', label: 'Order' },
    ],
    filters: [
      { key: 'page', label: 'pages', options: ['home', 'about', 'testimonials', 'contact', 'global'] },
      { key: 'status', label: 'statuses', options: ['published', 'draft'] },
    ],
  },
};

const defaultActions = [
  { key: 'edit', label: 'Edit', icon: 'pencil' },
  { key: 'publish', label: 'Publish / unpublish', icon: 'send' },
  { key: 'feature', label: 'Feature / unfeature', icon: 'star' },
  { key: 'move-up', label: 'Move up', icon: 'arrow-up' },
  { key: 'delete', label: 'Delete', icon: 'trash-2', danger: true },
];

function refreshIcons(root = document) {
  createIcons({ icons: ICON_SET, attrs: { 'aria-hidden': 'true' } });
  root.querySelectorAll('svg').forEach((icon) => icon.setAttribute('aria-hidden', 'true'));
}

function pageHeading(title, description, actions = '') {
  return `<div class="admin-page-heading"><div><p class="admin-demo-kicker"><span></span>Connected clinic workspace</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>${actions ? `<div class="admin-page-heading__actions">${actions}</div>` : ''}</div>`;
}

function metricCard(label, value, icon, note) {
  return `<article class="admin-metric-card"><span class="admin-metric-card__icon"><i data-lucide="${icon}"></i></span><p>${escapeHtml(label)}</p><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`;
}

async function renderDashboard(root) {
  const data = await getAdminData();
  const pending = data.appointments.filter(({ status }) => ['new', 'contacted'].includes(status)).length;
  const seoWarnings = [
    ...data.treatments.filter((item) => item.status === 'published' && (!item.seoTitle || !item.seoDescription || !item.medicalReviewedAt)),
    ...data.blogs.filter((item) => item.status === 'published' && (!item.seoTitle || !item.seoDescription || !item.medicalReviewedAt)),
  ];
  const metrics = [
    ['New appointment requests', data.appointments.filter(({ status }) => status === 'new').length, 'calendar-plus', 'Live requests'],
    ['Pending follow-ups', pending, 'phone-forwarded', 'Open leads'],
    ['Active doctors', data.doctors.filter(({ status }) => status === 'published').length, 'stethoscope', 'Published profiles'],
    ['Published treatments', data.treatments.filter(({ status }) => status === 'published').length, 'sparkles', 'Website content'],
    ['Published blogs', data.blogs.filter(({ status }) => status === 'published').length, 'notebook-pen', 'Website content'],
    ['Awaiting testimonial approval', data.testimonials.filter(({ moderationStatus }) => moderationStatus === 'Pending').length, 'message-square-heart', 'Moderation queue'],
    ['Recorded page views', data.analytics.metrics.pageViews.toLocaleString('en-IN'), 'users', 'Privacy-limited events'],
    ['Appointment conversion', `${data.analytics.metrics.conversion}%`, 'mouse-pointer-click', 'Recorded submissions'],
    ['SEO and review warnings', seoWarnings.length, 'triangle-alert', 'Published content checks'],
  ];
  const recentRequests = data.appointments.length
    ? data.appointments.slice(0, 5).map((item) => `<article><span class="admin-avatar admin-avatar--soft">${escapeHtml(item.name.slice(0, 2).toUpperCase())}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.enquiryType)} · ${escapeHtml(item.source)}</small></div><span class="${statusClass(item.status)}">${escapeHtml(item.status)}</span><time>${formatDate(item.createdAt)}</time></article>`).join('')
    : '<p class="admin-empty-copy">No appointment requests have been received.</p>';
  const activity = data.activity.length
    ? data.activity.slice(0, 8).map((item) => `<li><span></span><div><strong>${escapeHtml(item.action)}</strong><small>${escapeHtml(item.actor)} · ${formatDate(item.createdAt)}</small></div></li>`).join('')
    : '<li><div><strong>No recorded changes yet</strong><small>CMS activity will appear here after the first update.</small></div></li>';
  root.innerHTML = `${pageHeading('Clinic overview', 'A fast-scanning view of website enquiries, published content, and recorded visitor actions.', '<a class="admin-button admin-button--primary" href="/admin/appointments.html"><i data-lucide="calendar-check"></i>Review appointments</a>')}
    <section class="admin-metric-grid" aria-label="Overview metrics">${metrics.map((item) => metricCard(...item)).join('')}</section>
    <div class="admin-dashboard-grid">
      <section class="admin-panel admin-panel--wide"><header><div><p>Traffic overview</p><h3>Recorded page views over time</h3></div><span class="admin-status admin-status--published">Live events</span></header><div class="admin-chart admin-chart--dashboard"><canvas data-dashboard-chart aria-label="Recorded page views over time" role="img"></canvas><p class="visually-hidden" data-chart-summary></p></div></section>
      <section class="admin-panel"><header><div><p>Lead status</p><h3>Current follow-up mix</h3></div></header><div class="admin-status-summary">${['new', 'contacted', 'confirmed', 'completed', 'cancelled', 'spam'].map((status) => `<div><span class="${statusClass(status)}">${status}</span><strong>${data.appointments.filter((item) => item.status === status).length}</strong></div>`).join('')}</div></section>
      <section class="admin-panel admin-panel--wide"><header><div><p>Recent requests</p><h3>Appointments and general enquiries</h3></div><a href="/admin/appointments.html">View all <i data-lucide="arrow-right"></i></a></header><div class="admin-compact-list">${recentRequests}</div></section>
      <section class="admin-panel"><header><div><p>Content status</p><h3>Publishing overview</h3></div></header><div class="admin-content-progress">${[['Doctors', data.doctors], ['Treatments', data.treatments], ['Blogs', data.blogs], ['Testimonials', data.testimonials]].map(([label, records]) => { const count = records.filter(({ status }) => status === 'published').length; return `<div><span><strong>${label}</strong><small>${count} of ${records.length} published</small></span><progress value="${count}" max="${Math.max(1, records.length)}">${count}/${records.length}</progress></div>`; }).join('')}</div></section>
      <section class="admin-panel admin-panel--wide"><header><div><p>Quick actions</p><h3>Common CMS tasks</h3></div></header><div class="admin-quick-actions">${[['Add Doctor', 'doctors', 'user-plus'], ['Add Treatment', 'treatments', 'sparkles'], ['Create Blog', 'blogs', 'notebook-pen'], ['Review Testimonials', 'testimonials', 'message-square-heart'], ['View Appointments', 'appointments', 'calendar-check'], ['Update Settings', 'settings', 'settings']].map(([label, page, icon]) => `<a href="/admin/${page}.html"><i data-lucide="${icon}"></i><span>${label}</span><i data-lucide="arrow-up-right"></i></a>`).join('')}</div></section>
      <section class="admin-panel"><header><div><p>Recent activity</p><h3>Admin activity log</h3></div></header><ol class="admin-activity-list">${activity}</ol></section>
    </div>`;
  renderAdminChart(root.querySelector('[data-dashboard-chart]'), {
    type: 'line',
    data: { labels: data.analytics.labels, datasets: [{ label: 'Page views', data: data.analytics.visitors, borderColor: '#3f725e', backgroundColor: 'rgba(63,114,94,.13)', fill: true, tension: .38, pointRadius: 2 }] },
    options: { scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(52,73,64,.08)' } } } },
  }, `${data.analytics.metrics.pageViews} recorded page views across the displayed period.`);
  refreshIcons(root);
}

function normalizeRecord(collection, record) {
  const next = { ...record };
  if ('slug' in next && !next.slug) next.slug = slugify(next.name || next.title);
  if (collection === 'blogs') next.content = sanitizeRichText(next.content);
  if (collection === 'appointments') {
    next.createdAt ||= new Date().toISOString();
    next.history = Array.isArray(next.history) ? next.history : String(next.history || '').split('\n').filter(Boolean);
  }
  if (collection === 'gallery') {
    next.uploadedAt ||= new Date().toISOString();
    next.type ||= next.filename?.endsWith('.svg') ? 'image/svg+xml' : next.filename?.endsWith('.png') ? 'image/png' : 'image/webp';
  }
  return next;
}

function renderRecordPreview(container, record, collection) {
  if (!container) return;
  if (collection === 'blogs') container.innerHTML = `<p>Article preview</p><h3>${escapeHtml(record.title || 'Untitled article')}</h3><div>${sanitizeRichText(record.content || '<p>Start writing to preview the article.</p>')}</div>`;
  if (collection === 'doctors') container.innerHTML = `<p>Public profile preview</p><h3>${escapeHtml(record.name || 'Doctor profile')}</h3><span>${escapeHtml(record.specialization || 'Specialization')}</span><p>${escapeHtml(record.biography || 'Biography preview')}</p>`;
  if (collection === 'treatments') container.innerHTML = `<p>Treatment card preview</p><h3>${escapeHtml(record.name || 'Treatment')}</h3><span class="${statusClass(record.pricingStatus)}">${escapeHtml(record.pricingStatus || 'Pricing status')}</span><p>${escapeHtml(record.shortDescription || 'Short description')}</p>`;
}

async function renderManager(root, collection) {
  await loadCollection(collection, { force: true });

  if (collection === 'treatments' || collection === 'blogs') {
    await loadCollection('doctors');
    const docs = getCollection('doctors') || [];
    const doctorOptions = [''].concat(docs.map(d => `${d.name} (${d.id})`));
    const reviewerField = fields[collection].find(f => f.name === 'reviewerDoctorId');
    if (reviewerField) {
      reviewerField.type = 'select';
      reviewerField.options = doctorOptions;
    }
  }


  const config = managerConfigs[collection];
  const actions = config.actions || (collection === 'gallery'
    ? [{ key: 'edit', label: 'Edit metadata', icon: 'pencil' }, { key: 'publish', label: 'Publish / unpublish', icon: 'send' }, { key: 'move-up', label: 'Move up', icon: 'arrow-up' }, { key: 'copy', label: 'Copy asset path', icon: 'copy' }, { key: 'delete', label: 'Delete', icon: 'trash-2', danger: true }]
    : collection === 'testimonials'
      ? [{ key: 'view', label: 'View', icon: 'eye' }, { key: 'approve', label: 'Approve', icon: 'check' }, { key: 'reject', label: 'Reject', icon: 'x' }, { key: 'publish', label: 'Publish / unpublish', icon: 'send' }, { key: 'feature', label: 'Feature / unfeature', icon: 'star' }, { key: 'delete', label: 'Delete', icon: 'trash-2', danger: true }]
      : defaultActions);
  const viewControls = collection === 'gallery' ? '<div class="admin-view-toggle" role="group" aria-label="Media view"><button type="button" aria-pressed="true" data-gallery-view="list"><i data-lucide="list"></i>List</button><button type="button" aria-pressed="false" data-gallery-view="grid"><i data-lucide="grid-2x2"></i>Grid</button></div>' : '';
  root.innerHTML = `${pageHeading(config.addLabel.replace(/^(Add|Create) /, ''), config.description, `${viewControls}<button class="admin-button admin-button--primary" type="button" data-add-record><i data-lucide="plus"></i>${escapeHtml(config.addLabel)}</button>`)}
    <section class="admin-panel admin-manager-panel"><div data-manager-table></div></section>`;
  const host = root.querySelector('[data-manager-table]');
  let table;
  const refresh = () => table ? table.refresh(getCollection(collection)) : null;
  const openRecord = (record = {}, title = config.addLabel) => {
    const allTreatments = collection === 'treatments' ? (getCollection('treatments') || []) : [];
    const allDoctors = (getCollection('doctors') || []);
    const galleryAssets = (getCollection('gallery') || []);

    const treatmentAfterRender = collection !== 'treatments' ? null : (shell, form, { updatePreview }) => {
      // Mount all custom controls
      const mount = (name) => shell.querySelector(`[data-custom-control="${name}"]`);

      // Chip lists
      const chipFields = [
        { name: 'alternativeNames', values: Array.isArray(record.alternativeNames) ? record.alternativeNames : [], placeholder: 'Add alternative name…' },
        { name: 'conditionsTreated', values: Array.isArray(record.conditionsTreated) ? record.conditionsTreated : [], placeholder: 'Add condition or concern…' },
        { name: 'secondarySearchPhrases', values: Array.isArray(record.secondarySearchPhrases) ? record.secondarySearchPhrases : [], placeholder: 'Add search phrase…' },
      ];
      chipFields.forEach(({ name, values, placeholder }) => {
        const el = mount(name); if (el) initChipList(el, { name, values, placeholder });
      });

      // Repeatable text
      const rtEl = mount('unsuitableCandidates');
      if (rtEl) initRepeatableText(rtEl, { name: 'unsuitableCandidates', values: Array.isArray(record.unsuitableCandidates) ? record.unsuitableCandidates : [], placeholder: 'Add contraindication…' });

      // Benefits
      const benEl = mount('benefits');
      if (benEl) initBenefitsList(benEl, { name: 'benefits', values: Array.isArray(record.benefits) ? record.benefits : [] });

      // Procedure steps
      const stepsEl = mount('steps');
      if (stepsEl) initProcedureSteps(stepsEl, { name: 'steps', values: Array.isArray(record.steps) ? record.steps : [] });

      // FAQs
      const faqEl = mount('faqJson');
      if (faqEl) initFaqList(faqEl, { name: 'faqJson', values: Array.isArray(record.faqJson) ? record.faqJson : [] });

      // Clinical references
      const refEl = mount('clinicalReferences');
      if (refEl) initClinicalReferences(refEl, { name: 'clinicalReferences', values: Array.isArray(record.clinicalReferences) ? record.clinicalReferences : [] });


      // Doctor selector
      const docEl = mount('reviewerDoctorId');
      if (docEl) initDoctorSelector(docEl, {
        name: 'reviewerDoctorId', value: record.reviewerDoctorId || '', doctors: allDoctors, onSelect: (doc) => {
          const credEl = form.elements['reviewerCredentials'];
          if (credEl && !credEl.value) credEl.value = doc.credentials || doc.specialization || '';
          const byEl = form.elements['clinicallyReviewedBy'];
          if (byEl && !byEl.value) byEl.value = doc.name || '';
        }
      });

      // Pricing
      const priceEl = mount('_pricing');
      if (priceEl) initPricingControls(priceEl, { values: { pricingDisplayType: record.pricingDisplayType || 'consultation_required', minPrice: record.minPrice, maxPrice: record.maxPrice } });

      // Gallery
      const galEl = mount('additionalGallery');
      if (galEl) initAdditionalGallery(galEl, { name: 'additionalGallery', values: Array.isArray(record.additionalGallery) ? record.additionalGallery : [], galleryAssets });

      // Before/after gallery
      const baEl = mount('beforeAfterGallery');
      if (baEl) initBeforeAfterGallery(baEl, { name: 'beforeAfterGallery', values: Array.isArray(record.beforeAfterGallery) ? record.beforeAfterGallery : [], galleryAssets });

      // System info panel
      const sysEl = mount('_sysInfo');
      if (sysEl) initSystemInfoPanel(sysEl, { record });

      // SEO preview section — inject after form grid
      const formGrid = shell.querySelector('.admin-form-grid');
      if (formGrid) {
        const seoPreviewWrapper = document.createElement('div');
        seoPreviewWrapper.style.cssText = 'padding: 20px; border-top: 1px solid var(--admin-line); background: var(--admin-surface);';
        seoPreviewWrapper.innerHTML = '<h4 style="font-size:0.85rem;font-weight:700;margin:0 0 12px;color:var(--admin-charcoal);">Live Previews</h4><div data-seo-preview></div><div data-card-preview style="margin-top:16px;"></div>';
        formGrid.after(seoPreviewWrapper);
        const updateLivePreviews = () => {
          const values = Object.fromEntries(new FormData(form));
          const merged = { ...record, ...values };
          renderSeoPreview(seoPreviewWrapper.querySelector('[data-seo-preview]'), { record: merged });
          renderTreatmentCardPreview(seoPreviewWrapper.querySelector('[data-card-preview]'), { record: merged });
        };
        updateLivePreviews();
        form.addEventListener('input', updateLivePreviews);
        form.addEventListener('change', updateLivePreviews);
      }
    };

    const websiteAssetsAfterRender = collection !== 'websiteAssets' ? null : (shell, form, { updatePreview }) => {
      const mount = (name) => shell.querySelector(`[data-custom-control="${name}"]`);
      const imgPathMount = mount('imagePath');
      if (imgPathMount) {
        const initialValue = record.imagePath || '';
        imgPathMount.innerHTML = `
          <div class="website-asset-path-picker" style="display: flex; gap: 8px; flex-direction: column;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <input type="text" name="imagePath" id="admin-field-imagePath" value="${escapeHtml(initialValue)}" required style="flex: 1;" placeholder="e.g. /assets/images/home/clinic-reception.webp">
              <button type="button" class="admin-button admin-button--quiet" id="btn-select-gallery-asset" title="Select from Gallery">
                <i data-lucide="images" style="width:16px;height:16px;"></i> Gallery
              </button>
            </div>
            <div class="website-asset-preview-container" style="margin-top: 8px; display: flex; align-items: center; gap: 12px;">
              <img class="website-asset-preview-img" src="${initialValue || '/assets/images/placeholders/clinic-neutral.svg'}" style="max-width: 120px; max-height: 80px; border-radius: 6px; border: 1px solid var(--admin-line); object-fit: cover; background: #f7f6f2;" onerror="this.src='/assets/images/placeholders/clinic-neutral.svg'">
              <button type="button" class="admin-button admin-button--quiet" id="btn-copy-asset-path" title="Copy path to clipboard">
                <i data-lucide="copy" style="width:14px;height:14px;"></i> Copy Path
              </button>
            </div>
          </div>
        `;

        createIcons({
          icons: ICON_SET,
          attrs: { class: 'lucide-icon', 'aria-hidden': 'true' }
        });

        const pathInput = imgPathMount.querySelector('#admin-field-imagePath');
        const previewImg = imgPathMount.querySelector('.website-asset-preview-img');
        const galleryBtn = imgPathMount.querySelector('#btn-select-gallery-asset');
        const copyBtn = imgPathMount.querySelector('#btn-copy-asset-path');

        pathInput.addEventListener('input', () => {
          previewImg.src = pathInput.value.trim() || '/assets/images/placeholders/clinic-neutral.svg';
        });

        copyBtn.addEventListener('click', async () => {
          const path = pathInput.value.trim();
          if (path) {
            try {
              await navigator.clipboard.writeText(path);
              showToast('Asset path copied to clipboard.');
            } catch (e) {
              showToast('Failed to copy to clipboard.', 'error');
            }
          } else {
            showToast('No path to copy.');
          }
        });

        galleryBtn.addEventListener('click', () => {
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
          overlay.innerHTML = `
            <div style="background:var(--admin-white);width:90%;max-width:900px;height:80vh;border-radius:16px;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,0.15);overflow:hidden;">
              <header style="padding:16px 20px;border-bottom:1px solid var(--admin-line);display:flex;justify-content:space-between;align-items:center;background:var(--admin-surface);">
                <h3 style="margin:0;font-size:1.1rem;font-weight:700;color:var(--admin-charcoal);">Select Image from Gallery</h3>
                <button type="button" class="admin-icon-button" id="btn-close-gallery-dialog" aria-label="Close dialog"><i data-lucide="x"></i></button>
              </header>
              <div id="gallery-dialog-body" style="flex:1;overflow-y:auto;padding:20px;display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:16px;">
                <div style="grid-column: 1 / -1; display:flex; justify-content:center; padding: 40px;" class="gallery-dialog-loading">
                  <i data-lucide="loader-2" class="admin-spin" style="width:32px;height:32px;color:var(--admin-gold);"></i>
                </div>
              </div>
              <footer style="padding:16px 20px;border-top:1px solid var(--admin-line);display:flex;justify-content:flex-end;gap:8px;background:var(--admin-surface);">
                <button type="button" class="admin-button admin-button--quiet" id="btn-cancel-gallery-select">Cancel</button>
                <button type="button" class="admin-button admin-button--primary" id="btn-confirm-gallery-select" disabled>Select Image</button>
              </footer>
            </div>
          `;
          document.body.append(overlay);

          createIcons({
            icons: ICON_SET,
            attrs: { class: 'lucide-icon', 'aria-hidden': 'true' }
          });

          const closeBtn = overlay.querySelector('#btn-close-gallery-dialog');
          const cancelBtn = overlay.querySelector('#btn-cancel-gallery-select');
          const confirmBtn = overlay.querySelector('#btn-confirm-gallery-select');
          const dialogBody = overlay.querySelector('#gallery-dialog-body');

          let selectedPath = null;

          const closeGalleryDialog = () => { overlay.remove(); };
          closeBtn.addEventListener('click', closeGalleryDialog);
          cancelBtn.addEventListener('click', closeGalleryDialog);

          confirmBtn.addEventListener('click', () => {
            if (selectedPath) {
              pathInput.value = selectedPath;
              previewImg.src = selectedPath;
              pathInput.dispatchEvent(new Event('input', { bubbles: true }));
              pathInput.dispatchEvent(new Event('change', { bubbles: true }));
              closeGalleryDialog();
            }
          });

          (async () => {
            try {
              const assets = galleryAssets && galleryAssets.length > 0 ? galleryAssets : [];
              if (assets.length === 0) {
                dialogBody.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--admin-muted);">No images found in the gallery explorer. Please upload media first.</div>';
                return;
              }
              dialogBody.innerHTML = '';
              assets.forEach(asset => {
                const card = document.createElement('div');
                card.style.cssText = 'border: 1px solid var(--admin-line); border-radius: 12px; padding: 8px; display:flex; flex-direction:column; align-items:center; cursor:pointer; text-align:center; transition: all 0.2s; position:relative; background:var(--admin-white);';
                const imgPath = asset.secureUrl || asset.url || '';
                card.innerHTML = `
                  <img src="${imgPath}" style="width:100%; height:90px; object-fit:cover; border-radius:8px; margin-bottom:8px; background:#f7f6f2;" onerror="this.src='/assets/images/placeholders/clinic-neutral.svg'">
                  <p style="font-size:0.7rem; font-weight:700; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin:0; color:var(--admin-charcoal);">${escapeHtml(asset.title || asset.filename)}</p>
                `;

                card.addEventListener('mouseenter', () => {
                  card.style.borderColor = 'var(--admin-gold)';
                  card.style.transform = 'translateY(-2px)';
                });
                card.addEventListener('mouseleave', () => {
                  if (selectedPath !== imgPath) {
                    card.style.borderColor = 'var(--admin-line)';
                    card.style.transform = 'none';
                  }
                });
                card.addEventListener('click', () => {
                  overlay.querySelectorAll('#gallery-dialog-body > div').forEach(c => {
                    c.style.borderColor = 'var(--admin-line)';
                    c.style.boxShadow = 'none';
                  });
                  card.style.borderColor = 'var(--admin-gold)';
                  card.style.boxShadow = '0 0 0 2px var(--admin-gold)';
                  selectedPath = imgPath;
                  confirmBtn.disabled = false;
                });
                dialogBody.append(card);
              });
            } catch (err) {
              dialogBody.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--admin-danger);">Failed to load gallery items: ${escapeHtml(err.message)}</div>`;
            }
          })();
        });
      }
    };

    return openAdminForm({
      title, fields: fields[collection], record,
      afterRender: collection === 'treatments' ? treatmentAfterRender : websiteAssetsAfterRender,
      preview: ['blogs', 'doctors', 'treatments'].includes(collection) ? (container, values) => renderRecordPreview(container, values, collection) : null,
      onSave: async (values) => {
        if (collection === 'treatments') {
          const errorMsg = validateTreatmentRecord(values, record);
          if (errorMsg) {
            showToast(errorMsg, 'error');
            return false;
          }
        }


        if (collection === 'treatments' || collection === 'blogs') {
          if (values.reviewerDoctorId && values.reviewerDoctorId.includes('(')) {
            const match = values.reviewerDoctorId.match(/\(([^)]+)\)/);
            if (match) {
              values.reviewerDoctorId = match[1];
            }
          }
        }

        const next = normalizeRecord(collection, values);
        delete next.__files;
        if (collection === 'testimonials' && next.status === 'published' && !canPublishTestimonial(next)) {
          showToast('Approve the testimonial and confirm consent before publishing.', 'error');
          return false;
        }
        if (collection === 'treatments' && next.pricingDisplayType !== 'exact_price' && next.pricingDisplayType !== 'starting_from' && next.pricingDisplayType !== 'price_range') {
          next.price = '';
        }
        await upsertRecord(collection, next);
        refresh();
        showToast(`${title.replace(/^Edit /, '')} saved.`);
        return true;
      },
      onSaveDraft: async (values) => {
        const next = normalizeRecord(collection, { ...values, status: 'draft' });
        delete next.__files;
        await upsertRecord(collection, next);
        refresh();
        showToast(`${title.replace(/^Edit /, '')} saved as draft.`);
        return true;
      },
    });
  };
  table = createAdminTable(host, { records: getCollection(collection), columns: config.columns, filters: config.filters, actions, pageSize: collection === 'appointments' ? 7 : 8 });
  host.addEventListener('admin-table:rendered', () => refreshIcons(host));

  root.addEventListener('click', async (event) => {
    if (event.target.closest('[data-add-record]')) openRecord({}, config.addLabel);
    const view = event.target.closest('[data-gallery-view]');
    if (view) {
      root.querySelectorAll('[data-gallery-view]').forEach((button) => button.setAttribute('aria-pressed', String(button === view)));
      host.classList.toggle('is-media-grid', view.dataset.galleryView === 'grid');
    }
    const actionButton = event.target.closest('[data-row-action]');
    if (!actionButton) return;
    const record = getCollection(collection).find(({ id }) => id === actionButton.dataset.recordId);
    if (!record) return;
    const action = actionButton.dataset.rowAction;
    if (['edit', 'view', 'status', 'note'].includes(action)) openRecord(record, `${action === 'view' ? 'View' : 'Edit'} ${record.name || record.title || record.filename}`);
    if (action === 'call') window.location.href = `tel:${String(record.mobile).replace(/\s/g, '')}`;
    if (action === 'email' && record.email) window.location.href = `mailto:${record.email}`;
    if (action === 'whatsapp') window.open(`https://wa.me/${String(record.mobile).replace(/\D/g, '')}`, '_blank', 'noopener');
    if (action === 'copy') {
      await navigator.clipboard?.writeText(record.url || '');
      showToast('Asset path copied.');
    }
    if (action === 'reschedule') {
      showToast('Reschedule layout opened.');
    }
    if (action === 'export') {
      showToast('Exporting data...');
    }
    if (action === 'archive') {
      const archivePlan = canArchiveRecord(collection);
      if (archivePlan.mode === 'status') {
        await updateRecord(collection, record.id, { status: archivePlan.status });
      } else {
        await updateRecord(collection, record.id, { status: 'archived' });
      }
      refresh();
      showToast('Record archived.');
    }
    if (action === 'approve') { await updateRecord(collection, record.id, { moderationStatus: 'Approved' }, { action: 'approve' }); refresh(); showToast('Testimonial approved.'); }
    if (action === 'reject') { await updateRecord(collection, record.id, { moderationStatus: 'Rejected', status: 'archived' }, { action: 'reject' }); refresh(); showToast('Testimonial rejected and unpublished.', 'warning'); }
    if (action === 'publish') {
      const publishing = record.status !== 'published';
      if (publishing) {
        const publishCheck = canPublishRecord(collection, record);
        if (!publishCheck.ok) {
          showToast(publishCheck.reason, 'error');
          return;
        }
      }
      await updateRecord(collection, record.id, { status: publishing ? 'published' : 'archived' }, { action: publishing ? 'publish' : 'unpublish' });
      refresh(); showToast(publishing ? 'Record published.' : 'Record unpublished.');
    }
    if (action === 'feature') { await updateRecord(collection, record.id, { featured: !record.featured }); refresh(); showToast(record.featured ? 'Removed from featured content.' : 'Added to featured content.'); }
    if (action === 'move-up') { await updateRecord(collection, record.id, { sortOrder: Math.max(1, Number(record.sortOrder || 1) - 1) }); refresh(); showToast('Display order updated.'); }
    if (action === 'delete') {
      const confirmed = await confirmAdminAction({ title: 'Delete record?', message: `Permanently delete ${record.name || record.title || record.filename}?`, confirmLabel: 'Delete record', trigger: actionButton });
      if (confirmed) {
        try {
          const mediaPath = record.portrait || record.image || record.url || '';
          await removeRecord(collection, record.id);
          await removeCmsMedia(mediaPath).catch(() => { });
          refresh();
          showToast('Record deleted.', 'warning');
        } catch (err) {
          console.error('Delete failed:', err);
          showToast(`Delete failed: ${err.message || 'Unknown error'}`, 'error');
        }
      }
    }
  });
  refreshIcons(root);
}

function seoField(name, label, value, maxLength, type = 'input') {
  const control = type === 'textarea' ? `<textarea name="${name}" maxlength="${maxLength || 500}">${escapeHtml(value)}</textarea>` : `<input name="${name}" value="${escapeHtml(value)}"${maxLength ? ` maxlength="${maxLength}"` : ''}>`;
  return `<label>${escapeHtml(label)}${control}${maxLength ? `<span data-seo-count="${name}">${String(value).length} / ${maxLength}</span>` : ''}</label>`;
}

async function renderSeo(root) {
  await loadCollection('seo', { force: true });
  let records = getCollection('seo');
  let selected = records[0];
  root.innerHTML = `${pageHeading('Search visibility', 'Edit route metadata used by the website production build.', '<button class="admin-button admin-button--quiet" type="button" data-seo-reset><i data-lucide="rotate-ccw"></i>Discard changes</button><button class="admin-button admin-button--primary" type="submit" form="admin-seo-form"><i data-lucide="save"></i>Save SEO settings</button>')}
    <div class="admin-seo-layout"><nav class="admin-panel admin-seo-pages" aria-label="SEO pages">${records.map(({ id, page }, index) => `<button type="button" data-seo-page="${id}" aria-pressed="${index === 0}"><i data-lucide="file-text"></i><span>${page}</span><i data-lucide="chevron-right"></i></button>`).join('')}</nav><section class="admin-panel"><form id="admin-seo-form" class="admin-seo-form" data-seo-form></form></section><aside class="admin-seo-previews" data-seo-previews></aside></div>
    <div class="admin-code-preview-grid"><section class="admin-panel"><header><h3>sitemap.xml preview</h3><span>Read only</span></header><pre>${escapeHtml(records.filter(({ sitemap }) => sitemap).map(({ canonical }) => `<url><loc>${canonical}</loc></url>`).join('\n'))}</pre></section><section class="admin-panel"><header><h3>robots.txt preview</h3><span>Read only</span></header><pre>User-agent: *\nAllow: /\nSitemap: https://titaniumroots.example/sitemap.xml</pre></section></div>`;
  const form = root.querySelector('[data-seo-form]');
  const previews = root.querySelector('[data-seo-previews]');
  const render = () => {
    form.innerHTML = `<div class="admin-form-grid">${seoField('metaTitle', 'Meta title', selected.metaTitle, 60)}${seoField('metaDescription', 'Meta description', selected.metaDescription, 160, 'textarea')}${seoField('canonical', 'Canonical URL', selected.canonical)}${seoField('ogTitle', 'Open Graph title', selected.ogTitle, 60)}${seoField('ogDescription', 'Open Graph description', selected.ogDescription, 160, 'textarea')}${seoField('ogImage', 'Open Graph image', selected.ogImage)}<label class="admin-check"><input type="checkbox" name="index"${selected.index ? ' checked' : ''}>Index page</label><label class="admin-check"><input type="checkbox" name="follow"${selected.follow ? ' checked' : ''}>Follow links</label><label class="admin-check"><input type="checkbox" name="sitemap"${selected.sitemap ? ' checked' : ''}>Include in sitemap</label></div>`;
    renderSeoPreviews();
  };
  const values = () => {
    const data = Object.fromEntries(new FormData(form));
    return { ...selected, ...data, index: form.elements.index.checked, follow: form.elements.follow.checked, sitemap: form.elements.sitemap.checked };
  };
  const renderSeoPreviews = () => {
    const value = values();
    const warnings = [!value.metaTitle && 'Missing meta title', !value.metaDescription && 'Missing meta description', !value.ogImage && 'Missing social image'].filter(Boolean);
    previews.innerHTML = `<section class="admin-panel admin-search-preview"><p>Search result preview</p><h3>${escapeHtml(value.metaTitle || selected.page)}</h3><a>${escapeHtml(value.canonical)}</a><span>${escapeHtml(value.metaDescription || 'Add a description to improve this preview.')}</span></section><section class="admin-panel admin-social-preview"><div class="admin-social-preview__image"><i data-lucide="image"></i></div><p>${escapeHtml(value.ogTitle || selected.page)}</p><span>${escapeHtml(value.ogDescription || 'Add a social description.')}</span><small>titaniumroots.example</small></section><section class="admin-panel admin-seo-warnings"><h3>Metadata checks</h3>${warnings.length ? warnings.map((warning) => `<p><i data-lucide="triangle-alert"></i>${warning}</p>`).join('') : '<p class="is-complete"><i data-lucide="circle-check"></i>Required preview fields are complete.</p>'}</section>`;
    refreshIcons(previews);
  };
  root.addEventListener('click', (event) => {
    const page = event.target.closest('[data-seo-page]');
    if (page) {
      selected = records.find(({ id }) => id === page.dataset.seoPage);
      root.querySelectorAll('[data-seo-page]').forEach((button) => button.setAttribute('aria-pressed', String(button === page)));
      render();
    }
    if (event.target.closest('[data-seo-reset]')) render();
  });
  form.addEventListener('input', (event) => {
    const count = root.querySelector(`[data-seo-count="${event.target.name}"]`);
    if (count) count.textContent = `${event.target.value.length} / ${event.target.maxLength}`;
    renderSeoPreviews();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const next = values();
    selected = await upsertRecord('seo', next);
    records = getCollection('seo');
    showToast('SEO settings saved. Publish a new website build to update generated HTML.');
  });
  render();
  refreshIcons(root);
}

const settingsGroups = {
  'Clinic identity': [['clinicName', 'Clinic name'], ['shortName', 'Short name'], ['logo', 'Logo metadata'], ['favicon', 'Favicon'], ['description', 'Clinic description', 'textarea']],
  Contact: [['primaryPhone', 'Primary phone'], ['alternatePhone', 'Alternate phone'], ['whatsapp', 'WhatsApp number'], ['email', 'Primary email', 'email'], ['appointmentEmail', 'Appointment email', 'email'], ['address', 'Address', 'textarea'], ['mapsUrl', 'Google Maps URL', 'url'], ['directionsUrl', 'Directions URL', 'url']],
  'Social media': [['instagram', 'Instagram URL', 'url'], ['facebook', 'Facebook URL', 'url'], ['youtube', 'YouTube URL', 'url'], ['linkedin', 'LinkedIn URL', 'url']],
  Messaging: [['appointmentMessage', 'Appointment WhatsApp message', 'textarea'], ['enquiryMessage', 'General enquiry message', 'textarea'], ['emergencyMessage', 'Emergency enquiry message', 'textarea'], ['callbackMessage', 'Callback message', 'textarea']],
  Homepage: [['statisticPatients', 'Statistics'], ['ctaText', 'CTA text'], ['featuredTreatmentCount', 'Featured treatment count', 'number'], ['featuredDoctorCount', 'Featured doctor count', 'number']],
  Footer: [['footerDescription', 'Description', 'textarea'], ['copyright', 'Copyright text'], ['legalLinks', 'Legal links'], ['newsletterText', 'Newsletter text']],
  Branding: [['primaryEmerald', 'Primary emerald', 'color'], ['supportingSage', 'Supporting sage', 'color'], ['backgroundIvory', 'Background ivory', 'color'], ['accentChampagne', 'Accent champagne', 'color']],
  Maintenance: [['maintenanceMode', 'Maintenance mode', 'checkbox'], ['maintenanceMessage', 'Maintenance message'], ['leadPopup', 'Lead popup', 'checkbox'], ['newsletter', 'Newsletter', 'checkbox']],
};

async function renderSettings(root) {
  let settings = await getSettings({ force: true });
  const tabs = [...Object.keys(settingsGroups), 'Clinic hours'];
  root.innerHTML = `${pageHeading('Global website settings', 'Manage clinic identity, contact details, hours, messaging and website controls. Secrets, API keys, and passwords never belong here.', '<button class="admin-button admin-button--primary" type="submit" form="admin-settings-form"><i data-lucide="save"></i>Save settings</button>')}
    <div class="admin-settings-layout"><nav class="admin-panel admin-settings-nav" aria-label="Settings groups">${tabs.map((tab, index) => `<button type="button" data-settings-tab="${escapeHtml(tab)}" aria-pressed="${index === 0}">${escapeHtml(tab)}<i data-lucide="chevron-right"></i></button>`).join('')}</nav><section class="admin-panel"><form id="admin-settings-form" data-settings-form></form></section><aside class="admin-panel admin-brand-preview" data-brand-preview></aside></div>`;
  const form = root.querySelector('[data-settings-form]');
  const preview = root.querySelector('[data-brand-preview]');
  let active = tabs[0];
  const inputMarkup = ([name, label, type = 'text']) => {
    const value = settings[name] ?? '';
    if (type === 'checkbox') return `<label class="admin-field admin-field--switch"><span>${label}</span><span class="admin-switch"><input type="checkbox" name="${name}"${value ? ' checked' : ''}><span></span><em>${value ? 'Enabled' : 'Disabled'}</em></span></label>`;
    const control = type === 'textarea' ? `<textarea name="${name}" rows="4">${escapeHtml(value)}</textarea>` : `<input name="${name}" type="${type}" value="${escapeHtml(value)}">`;
    return `<label class="admin-field"><span>${label}</span>${control}</label>`;
  };
  const renderPreview = () => {
    const data = { ...settings, ...Object.fromEntries(new FormData(form)) };
    preview.innerHTML = `<p>Brand preview</p><div class="admin-brand-swatch" style="--preview-primary:${escapeHtml(data.primaryEmerald || settings.primaryEmerald)};--preview-sage:${escapeHtml(data.supportingSage || settings.supportingSage)};--preview-ivory:${escapeHtml(data.backgroundIvory || settings.backgroundIvory)};--preview-accent:${escapeHtml(data.accentChampagne || settings.accentChampagne)}"><span><i data-lucide="heart-pulse"></i></span><h3>${escapeHtml(data.shortName || settings.shortName)}</h3><p>${escapeHtml(data.ctaText || settings.ctaText)}</p><button type="button">Preview action</button><div><span></span><span></span><span></span><span></span></div></div><small>Saved colors are available to public website components.</small>`;
    refreshIcons(preview);
  };
  const render = () => {
    if (active === 'Clinic hours') {
      form.innerHTML = `<header><p>Clinic hours</p><h3>Day-wise working hours</h3></header><div class="admin-hours-grid">${Object.entries(settings.hours).map(([day, value]) => `<label><span>${day}</span><input name="hours-${day}" value="${escapeHtml(value)}"><label class="admin-check"><input type="checkbox" name="closed-${day}">Closed</label></label>`).join('')}</div><label class="admin-check admin-field--full"><input type="checkbox" name="emergencyAvailable">Emergency availability confirmed</label>`;
    } else {
      form.innerHTML = `<header><p>Website settings</p><h3>${escapeHtml(active)}</h3></header><div class="admin-form-grid">${settingsGroups[active].map(inputMarkup).join('')}</div>`;
    }
    renderPreview();
  };
  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-settings-tab]');
    if (tab) { active = tab.dataset.settingsTab; root.querySelectorAll('[data-settings-tab]').forEach((button) => button.setAttribute('aria-pressed', String(button === tab))); render(); }
  });
  form.addEventListener('input', renderPreview);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (active === 'Clinic hours') {
      settings.hours = Object.fromEntries(Object.keys(settings.hours).map((day) => [day, form.elements[`closed-${day}`].checked ? 'Closed' : data[`hours-${day}`]]));
      settings.emergencyAvailable = form.elements.emergencyAvailable.checked;
    } else settingsGroups[active].forEach(([name, , type]) => { settings[name] = type === 'checkbox' ? form.elements[name].checked : type === 'number' ? Number(data[name]) : data[name]; });
    settings = await saveSettings(settings);
    showToast(`${active} settings saved.`);
    render();
  });
  render();
  refreshIcons(root);
}

function chartPanel(title, subtitle, key) {
  return `<section class="admin-panel admin-analytics-chart"><header><div><p>${escapeHtml(subtitle)}</p><h3>${escapeHtml(title)}</h3></div></header><div class="admin-chart"><canvas data-analytics-chart="${key}" role="img" aria-label="${escapeHtml(title)} chart"></canvas><p class="visually-hidden" data-chart-summary></p></div></section>`;
}

async function renderAnalytics(root) {
  const { analytics } = await getAdminData();
  const metrics = [['Total visitors', analytics.metrics.visitors.toLocaleString('en-IN'), 'users'], ['Page views', analytics.metrics.pageViews.toLocaleString('en-IN'), 'eye'], ['Returning visitors', `${analytics.metrics.returning}%`, 'rotate-ccw'], ['Average time on page', analytics.metrics.averageTime, 'timer'], ['Appointment requests', analytics.metrics.appointments, 'calendar-check'], ['WhatsApp clicks', analytics.metrics.whatsapp, 'message-circle'], ['Phone clicks', analytics.metrics.phone, 'phone'], ['Conversion rate', `${analytics.metrics.conversion}%`, 'mouse-pointer-click']];
  root.innerHTML = `${pageHeading('Visitor and conversion insights', 'Review privacy-limited page and call-to-action events recorded by the public website.', '<label class="admin-date-control"><span>Date range</span><select><option>Last 30 days</option><option>Last 90 days</option><option>Last 12 months</option></select></label><button class="admin-button admin-button--quiet" type="button" data-analytics-export><i data-lucide="download"></i>Export CSV</button>')}
    <section class="admin-metric-grid admin-metric-grid--analytics">${metrics.map(([label, value, icon]) => metricCard(label, value, icon, 'Recorded value')).join('')}</section>
    <div class="admin-analytics-grid">${chartPanel('Visitors over time', 'Audience trend', 'visitors')}${chartPanel('Traffic sources', 'Acquisition', 'sources')}${chartPanel('Device breakdown', 'Technology', 'devices')}${chartPanel('Most visited pages', 'Content interest', 'pages')}${chartPanel('CTA interactions', 'Action clicks', 'cta')}${chartPanel('Lead conversion funnel', 'Conversion journey', 'funnel')}</div>
    <div class="admin-insights-grid"><section class="admin-panel"><header><h3>Privacy boundary</h3></header><p>This CMS records event type, page path and referrer domain only. It does not collect names, contact details, user-agent strings or device fingerprints for analytics.</p></section><section class="admin-panel"><header><h3>Conversion journey</h3></header><ol class="admin-journey">${['Page view', 'CTA interaction', 'Contact action', 'Appointment submission'].map((label, index) => `<li><span>${index + 1}</span><strong>${label}</strong>${index < 3 ? '<i data-lucide="arrow-right"></i>' : ''}</li>`).join('')}</ol></section></div>`;
  const emerald = '#3f725e';
  const gold = '#c3a260';
  const palette = [emerald, '#7e9e8c', gold, '#aab9ae', '#d8c69d'];
  const configs = {
    visitors: { type: 'line', labels: analytics.labels, data: analytics.visitors },
    sources: { type: 'doughnut', labels: Object.keys(analytics.sources), data: Object.values(analytics.sources) },
    devices: { type: 'doughnut', labels: Object.keys(analytics.devices), data: Object.values(analytics.devices) },
    pages: { type: 'bar', labels: Object.keys(analytics.pages), data: Object.values(analytics.pages) },
    cta: { type: 'bar', labels: Object.keys(analytics.cta), data: Object.values(analytics.cta) },
    funnel: { type: 'bar', labels: Object.keys(analytics.funnel), data: Object.values(analytics.funnel) },
  };
  Object.entries(configs).forEach(([key, config]) => {
    const circular = config.type === 'doughnut';
    renderAdminChart(root.querySelector(`[data-analytics-chart="${key}"]`), {
      type: config.type,
      data: { labels: config.labels, datasets: [{ label: 'Recorded value', data: config.data, borderColor: circular ? '#fff' : emerald, backgroundColor: circular ? palette : config.type === 'line' ? 'rgba(63,114,94,.13)' : palette, fill: config.type === 'line', tension: .38, borderRadius: 6 }] },
      options: { indexAxis: key === 'funnel' ? 'y' : 'x', scales: circular ? {} : { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(52,73,64,.08)' } } } },
    }, `${config.labels.map((label, index) => `${label}: ${config.data[index]}`).join('; ')}.`);
  });
  root.querySelector('[data-analytics-export]')?.addEventListener('click', () => {
    const rows = [['Metric', 'Value'], ...metrics.map(([label, value]) => [label, value])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'titanium-roots-analytics.csv';
    link.click();
    URL.revokeObjectURL(url);
  });
  refreshIcons(root);
}

async function initializeLogin() {
  if (await redirectAuthenticatedLogin()) return;
  const form = document.querySelector('[data-admin-login-form]');
  if (!form) return;
  refreshIcons();
  form.querySelector('[data-password-toggle]').addEventListener('click', (event) => {
    const input = form.elements.password;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    event.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    event.currentTarget.innerHTML = `<i data-lucide="${show ? 'eye-off' : 'eye'}" aria-hidden="true"></i>`;
    refreshIcons(event.currentTarget);
  });
  form.querySelector('[data-forgot-password]').addEventListener('click', async () => {
    const error = form.querySelector('[data-login-error]');
    const email = form.elements.email.value.trim();
    if (!form.elements.email.checkValidity()) {
      error.hidden = false;
      error.textContent = 'Enter your administrator email address first.';
      error.focus();
      return;
    }
    const button = form.querySelector('[data-forgot-password]');
    button.disabled = true;
    try {
      await requestPasswordReset(email);
      error.hidden = false;
      error.textContent = 'If that address is authorized, a secure password-reset email is on its way.';
      error.focus();
    } catch (requestError) {
      error.hidden = false;
      error.textContent = requestError.message || 'Unable to send the reset email.';
      error.focus();
    } finally {
      button.disabled = false;
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = form.querySelector('[data-login-error]');
    if (!form.checkValidity()) {
      form.reportValidity();
      error.hidden = false;
      error.textContent = 'Enter a valid email address and password.';
      error.focus();
      return;
    }
    const button = form.querySelector('[data-login-submit]');
    button.disabled = true;
    button.classList.add('is-loading');
    button.querySelector('span').textContent = 'Signing in…';
    error.hidden = true;
    try {
      await loginAdmin({
        email: form.elements.email.value,
        password: form.elements.password.value,
      });
      form.elements.password.value = '';
      window.location.assign('/admin/dashboard.html');
    } catch (loginError) {
      error.hidden = false;
      error.textContent = loginError.message || 'Unable to sign in.';
      error.focus();
      button.disabled = false;
      button.classList.remove('is-loading');
      button.querySelector('span').textContent = 'Sign in to CMS';
    }
  });
}

async function renderGalleryExplorer(root) {
  if (!document.getElementById('gallery-explorer-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'gallery-explorer-styles';
    styleEl.textContent = `
      .gallery-explorer-layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
        align-items: start;
        margin-top: 20px;
      }
      @media (min-width: 992px) {
        .gallery-explorer-layout.has-sidebar {
          grid-template-columns: 1fr 380px;
        }
      }
      .gallery-explorer-main {
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid var(--admin-line);
        border-radius: 16px;
        padding: 20px;
        backdrop-filter: blur(10px);
      }
      .gallery-browser-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin-bottom: 20px;
        justify-content: space-between;
      }
      .gallery-search-container {
        display: flex;
        gap: 8px;
        align-items: center;
        background: var(--admin-white);
        border: 1px solid var(--admin-line);
        border-radius: 10px;
        padding: 4px 12px;
        flex: 1;
        max-width: 400px;
      }
      .gallery-search-container svg {
        width: 16px;
        color: var(--admin-muted);
      }
      .gallery-search-container input {
        border: 0;
        outline: none;
        background: transparent;
        font-size: 0.8rem;
        width: 100%;
      }
      .gallery-breadcrumbs {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: var(--admin-muted);
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .gallery-breadcrumb-item {
        color: var(--admin-emerald-700);
        cursor: pointer;
        font-weight: 700;
      }
      .gallery-breadcrumb-item:hover {
        text-decoration: underline;
      }
      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 16px;
      }
      .gallery-card {
        background: var(--admin-white);
        border: 1px solid var(--admin-line);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        text-align: center;
      }
      .gallery-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.05);
      }
      .gallery-card.is-active {
        border-color: var(--admin-gold);
        background: rgba(245, 241, 232, 0.5);
      }
      .gallery-card-icon {
        width: 60px;
        height: 60px;
        display: flex;
        margin-bottom: 8px;
        pointer-events: none;
        align-items: center;
        justify-content: center;
        color: var(--admin-emerald-800);
      }
      .gallery-card-icon svg {
        width: 48px;
        height: 48px;
      }
      .gallery-card-thumb {
        width: 100%;
        height: 90px;
        border-radius: 6px;
        object-fit: cover;
        margin-bottom: 8px;
        pointer-events: none;
        background: #f7f6f2;
      }
      .gallery-card-title {
        font-size: 0.75rem;
        font-weight: 700;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--admin-charcoal);
        margin: 0;
      }
      .gallery-card-actions {
        position: absolute;
        top: 6px;
        right: 6px;
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.15s;
        background: rgba(255,255,255,0.9);
        padding: 2px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      }
      .gallery-card:hover .gallery-card-actions {
        opacity: 1;
      }
      .gallery-card-actions button {
        border: 0;
        background: transparent;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        color: var(--admin-charcoal);
      }
      .gallery-card-actions button:hover {
        background: rgba(0,0,0,0.05);
      }
      .gallery-card-actions button.is-delete {
        color: var(--admin-danger);
      }
      .gallery-sidebar {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid var(--admin-line);
        border-radius: 16px;
        padding: 20px;
        position: sticky;
        top: 108px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.03);
      }
      .gallery-sidebar-preview {
        width: 100%;
        max-height: 200px;
        border-radius: 8px;
        object-fit: contain;
        background: #f7f6f2;
        border: 1px solid var(--admin-line);
      }
      .gallery-sidebar-title {
        font-family: var(--font-heading);
        font-size: 1.1rem;
        margin: 0 0 8px 0;
        color: var(--admin-charcoal);
      }
      .gallery-sidebar-details {
        font-size: 0.75rem;
        color: var(--admin-muted);
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px 12px;
      }
      .gallery-sidebar-details strong {
        color: var(--admin-charcoal);
        align-self: center;
      }
      .gallery-sidebar-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .gallery-upload-loader {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
        color: var(--admin-emerald-700);
        font-weight: 700;
        margin-right: 12px;
      }
      
      .admin-spin {
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleEl);
  }

  let currentFolderId = null;
  let breadcrumbs = [];
  let folders = [];
  let assets = [];
  let searchQuery = '';
  let selectedAsset = null;
  let isUploading = false;
  let isSearching = false;
  let searchAllFolders = false;

  async function loadData() {
    try {
      const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
      let url = `/api/gallery?folderId=${currentFolderId || ''}`;

      // If we are searching and checking searchAllFolders:
      if (searchQuery && searchAllFolders) {
        url = `/api/gallery/search?q=${encodeURIComponent(searchQuery)}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, 'error');
        return;
      }
      folders = data.folders || [];
      assets = data.assets || [];

      // CLIENT SIDE filtering if we are searching only the current folder:
      if (searchQuery && !searchAllFolders) {
        folders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
        assets = assets.filter(a => (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
      }
    } catch (e) {
      showToast(`Gallery load failed: ${e.message}`, 'error');
    }
  }

  function setupUiListeners() {
    root.querySelectorAll('.gallery-breadcrumb-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = item.dataset.breadcrumb;
        if (index === 'root') {
          currentFolderId = null;
          breadcrumbs = [];
        } else {
          const idx = parseInt(index, 10);
          breadcrumbs = breadcrumbs.slice(0, idx + 1);
          currentFolderId = breadcrumbs[idx].id;
        }
        selectedAsset = null;
        render();
      });
    });

    root.querySelectorAll('[data-folder-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.gallery-card-actions')) return;
        const fid = card.dataset.folderId;
        const fname = card.title;
        currentFolderId = fid;
        breadcrumbs.push({ id: fid, name: fname });
        selectedAsset = null;
        render();
      });
    });

    root.querySelectorAll('[data-asset-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.gallery-card-actions')) return;
        const aid = card.dataset.assetId;
        selectedAsset = assets.find(a => a.id === aid);
        render();
      });
    });

    const closeSidebarBtn = root.querySelector('#btn-close-sidebar');
    if (closeSidebarBtn) {
      closeSidebarBtn.addEventListener('click', () => {
        selectedAsset = null;
        render();
      });
    }

    const newFolderBtn = root.querySelector('#btn-new-folder');
    if (newFolderBtn) {
      newFolderBtn.addEventListener('click', async () => {
        const folderName = prompt('Enter new folder name:');
        if (!folderName?.trim()) return;

        try {
          const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
          const res = await fetch('/api/gallery/folders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name: folderName.trim(), parentId: currentFolderId })
          });
          const data = await res.json();
          if (data.error) {
            showToast(data.error, 'error');
          } else {
            showToast('Folder created.');
            render();
          }
        } catch (e) {
          showToast(`Failed to create folder: ${e.message}`, 'error');
        }
      });
    }

    const uploadBtn = root.querySelector('#btn-upload-images');
    const fileInput = root.querySelector('#gallery-file-input');
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', async () => {
        const files = Array.from(fileInput.files);
        if (files.length === 0) return;

        const MAX_SIZE = 10 * 1024 * 1024;
        const invalidFile = files.find(f => f.size > MAX_SIZE);
        if (invalidFile) {
          showToast(`File ${invalidFile.name} exceeds 10MB limit before conversion.`, 'error');
          return;
        }

        isUploading = true;
        render();

        try {
          const token = (await requireSupabase().auth.getSession()).data.session?.access_token;

          for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            if (currentFolderId) {
              formData.append('folderId', currentFolderId);
            }

            const res = await fetch('/api/gallery/upload', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`
              },
              body: formData
            });
            const data = await res.json();
            if (data.error) {
              showToast(`Upload failed for ${file.name}: ${data.error}`, 'error');
            }
          }
          showToast('Images uploaded successfully.');
        } catch (e) {
          showToast('Failed to upload files', 'error');
        } finally {
          isUploading = false;
          render();
        }
      });
    }

    root.querySelectorAll('.btn-rename-folder').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const oldName = btn.dataset.name;
        const newName = prompt('Enter new folder name:', oldName);
        if (!newName?.trim() || newName.trim() === oldName) return;

        try {
          const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
          const res = await fetch(`/api/gallery/folders/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name: newName.trim() })
          });
          const data = await res.json();
          if (data.error) {
            showToast(data.error, 'error');
          } else {
            showToast('Folder renamed.');
            const bIndex = breadcrumbs.findIndex(bc => bc.id === id);
            if (bIndex !== -1) {
              breadcrumbs[bIndex].name = newName.trim();
            }
            render();
          }
        } catch (err) {
          showToast('Failed to rename folder', 'error');
        }
      });
    });

    root.querySelectorAll('.btn-delete-folder').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const name = btn.dataset.name;

        let confirmed = await confirmAdminAction({
          title: 'Delete folder?',
          message: `Permanently delete folder "${name}"?`,
          confirmLabel: 'Delete',
          trigger: btn
        });
        if (!confirmed) return;

        try {
          const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
          let res = await fetch(`/api/gallery/folders/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          let data = await res.json();

          if (res.status === 400 && data.error && data.error.includes('recursive')) {
            const recursiveConfirmed = await confirmAdminAction({
              title: 'Recursive Delete?',
              message: `The folder "${name}" is not empty. Delete all of its subfolders and images permanently?`,
              confirmLabel: 'Delete All',
              trigger: btn
            });
            if (!recursiveConfirmed) return;

            res = await fetch(`/api/gallery/folders/${id}?recursive=true`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
            data = await res.json();
          }

          if (data.error) {
            showToast(data.error, 'error');
          } else {
            showToast('Folder deleted.');
            if (currentFolderId === id) {
              currentFolderId = null;
              breadcrumbs = [];
            }
            render();
          }
        } catch (e) {
          showToast('Failed to delete folder', 'error');
        }
      });
    });

    const saveAssetTitleBtn = root.querySelector('#btn-save-asset-title');
    const assetTitleInput = root.querySelector('#asset-title-input');
    if (saveAssetTitleBtn && assetTitleInput && selectedAsset) {
      saveAssetTitleBtn.addEventListener('click', async () => {
        const newTitle = assetTitleInput.value.trim();
        if (!newTitle) return;

        try {
          const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
          const res = await fetch(`/api/gallery/files/${selectedAsset.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ title: newTitle })
          });
          const data = await res.json();
          if (data.error) {
            showToast(data.error, 'error');
          } else {
            showToast('Image title updated.');
            selectedAsset.title = newTitle;
            render();
          }
        } catch (e) {
          showToast('Failed to save title', 'error');
        }
      });
    }

    const deleteAssetAction = async (id, title, triggerEl) => {
      const confirmed = await confirmAdminAction({
        title: 'Delete image?',
        message: `Permanently delete image "${title}"?`,
        confirmLabel: 'Delete',
        trigger: triggerEl
      });
      if (!confirmed) return;

      try {
        const token = (await requireSupabase().auth.getSession()).data.session?.access_token;
        const res = await fetch(`/api/gallery/files/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.error) {
          showToast(data.error, 'error');
        } else {
          showToast('Image deleted.');
          if (selectedAsset && selectedAsset.id === id) {
            selectedAsset = null;
          }
          render();
        }
      } catch (e) {
        showToast('Failed to delete image', 'error');
      }
    };

    root.querySelectorAll('.btn-delete-asset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteAssetAction(btn.dataset.id, btn.dataset.title, btn);
      });
    });

    const deleteAssetSidebarBtn = root.querySelector('#btn-delete-asset-sidebar');
    if (deleteAssetSidebarBtn) {
      deleteAssetSidebarBtn.addEventListener('click', () => {
        deleteAssetAction(deleteAssetSidebarBtn.dataset.id, deleteAssetSidebarBtn.dataset.title, deleteAssetSidebarBtn);
      });
    }

    const searchInput = root.querySelector('#gallery-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
      });
    }

    const chkSearchAll = root.querySelector('#chk-search-all');
    if (chkSearchAll) {
      chkSearchAll.addEventListener('change', (e) => {
        searchAllFolders = e.target.checked;
        render();
      });
    }
  }

  async function render() {
    await loadData();

    const headerHtml = `
      <div class="admin-page-heading">
        <div>
          <div class="admin-demo-kicker"><span></span>Media Gallery</div>
          <h2>Media Library</h2>
          <p>Organize, upload and manage clinic images and assets.</p>
        </div>
        <div class="admin-page-heading__actions">
          ${isUploading ? `
            <div class="gallery-upload-loader">
              <i data-lucide="refresh-cw" class="admin-spin" style="width: 14px; height: 14px;"></i>
              <span>Uploading images...</span>
            </div>
          ` : ''}
          <button class="admin-button admin-button--quiet" type="button" id="btn-new-folder">
            <i data-lucide="folder-plus"></i>New Folder
          </button>
          <button class="admin-button admin-button--primary" type="button" id="btn-upload-images">
            <i data-lucide="plus"></i>Upload Images
          </button>
          <input type="file" id="gallery-file-input" multiple accept="image/jpeg,image/png,image/webp,image/svg+xml" style="display: none;">
        </div>
      </div>
    `;

    let breadcrumbHtml = `
      <div class="gallery-breadcrumbs">
        <span class="gallery-breadcrumb-item" data-breadcrumb="root">Root</span>
    `;
    breadcrumbs.forEach((bc, idx) => {
      breadcrumbHtml += `
        <i data-lucide="chevron-right" style="width: 12px; height: 12px; margin-top:2px;"></i>
        <span class="gallery-breadcrumb-item" data-breadcrumb="${idx}">${escapeHtml(bc.name)}</span>
      `;
    });
    breadcrumbHtml += `</div>`;

    const toolbarHtml = `
      <div class="gallery-browser-toolbar">
        <div class="gallery-search-container">
          <i data-lucide="search"></i>
          <input type="text" id="gallery-search-input" placeholder="Search files and folders..." value="${escapeHtml(searchQuery)}">
        </div>
        <div class="gallery-search-options" style="font-size:0.75rem; display:flex; gap:12px; align-items:center;">
          <label style="display:flex; align-items:center; gap:4px; cursor:pointer;">
            <input type="checkbox" id="chk-search-all" ${searchAllFolders ? 'checked' : ''}> Search all folders
          </label>
        </div>
      </div>
    `;

    let itemsHtml = '';

    if (folders.length === 0 && assets.length === 0) {
      itemsHtml = `
        <div style="text-align: center; padding: 40px; color: var(--admin-muted); font-size: 0.85rem;">
          <i data-lucide="info" style="width: 32px; height: 32px; margin-bottom: 8px; color: var(--admin-gold); display: block; margin-inline: auto;"></i>
          <p>No folders or images found.</p>
        </div>
      `;
    } else {
      itemsHtml = `<div class="gallery-grid">`;

      folders.forEach(f => {
        itemsHtml += `
          <div class="gallery-card" data-folder-id="${f.id}" title="${escapeHtml(f.name)}">
            <div class="gallery-card-icon">
              <i data-lucide="folder"></i>
            </div>
            <p class="gallery-card-title">${escapeHtml(f.name)}</p>
            <div class="gallery-card-actions">
              <button type="button" class="btn-rename-folder" data-id="${f.id}" data-name="${escapeHtml(f.name)}" title="Rename folder">
                <i data-lucide="pencil" style="width: 12px; height: 12px;"></i>
              </button>
              <button type="button" class="btn-delete-folder is-delete" data-id="${f.id}" data-name="${escapeHtml(f.name)}" title="Delete folder">
                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
              </button>
            </div>
          </div>
        `;
      });

      assets.forEach(a => {
        const isSelected = selectedAsset && selectedAsset.id === a.id;
        itemsHtml += `
          <div class="gallery-card ${isSelected ? 'is-active' : ''}" data-asset-id="${a.id}" title="${escapeHtml(a.title)}">
            <img class="gallery-card-thumb" src="${a.secure_url}" alt="${escapeHtml(a.alt_text || a.title)}">
            <p class="gallery-card-title">${escapeHtml(a.title)}</p>
            <div class="gallery-card-actions">
              <button type="button" class="btn-delete-asset is-delete" data-id="${a.id}" data-title="${escapeHtml(a.title)}" title="Delete image">
                <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
              </button>
            </div>
          </div>
        `;
      });

      itemsHtml += `</div>`;
    }

    let sidebarHtml = '';
    if (selectedAsset) {
      const dimensionsStr = selectedAsset.width && selectedAsset.height ? `${selectedAsset.width} × ${selectedAsset.height} px` : 'SVG';
      sidebarHtml = `
        <div class="gallery-sidebar admin-panel">
          <header style="padding:0; margin:0; border:0; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
             <h3 class="gallery-sidebar-title" style="margin:0;">Image Details</h3>
             <button type="button" id="btn-close-sidebar" style="border:0; background:transparent; cursor:pointer; padding:4px;"><i data-lucide="x" style="width:16px; height:16px;"></i></button>
          </header>
          <img class="gallery-sidebar-preview" src="${selectedAsset.secure_url}" alt="${escapeHtml(selectedAsset.title)}">
          
          <div class="gallery-sidebar-details">
            <strong>Title:</strong>
            <input type="text" id="asset-title-input" value="${escapeHtml(selectedAsset.title || '')}" style="font-size:0.75rem; padding:4px 8px; border:1px solid var(--admin-line); border-radius:4px; outline:none; max-width: 100%;">
            
            <strong>Type:</strong>
            <span>${escapeHtml((selectedAsset.format || 'webp').toUpperCase())}</span>
            
            <strong>Size:</strong>
            <span>${formatFileSize(selectedAsset.bytes || 0)}</span>
            
            <strong>Dimensions:</strong>
            <span>${escapeHtml(dimensionsStr)}</span>
            
            <strong>Created:</strong>
            <span>${formatDate(selectedAsset.created_at)}</span>
            
            <strong>Path:</strong>
            <span style="word-break: break-all; font-family:monospace; font-size:0.65rem;">${escapeHtml(selectedAsset.cloudinary_public_id || '')}</span>
          </div>

          <div class="gallery-sidebar-actions">
            <button class="admin-button admin-button--primary" type="button" id="btn-save-asset-title" style="flex:1;">
              <i data-lucide="save"></i>Save
            </button>
            <button class="admin-button admin-button--danger" type="button" id="btn-delete-asset-sidebar" data-id="${selectedAsset.id}" data-title="${escapeHtml(selectedAsset.title)}">
              <i data-lucide="trash-2"></i>Delete
            </button>
          </div>
        </div>
      `;
    }

    root.innerHTML = `
      ${headerHtml}
      <div class="gallery-explorer-layout ${selectedAsset ? 'has-sidebar' : ''}">
        <div class="gallery-explorer-main">
          ${breadcrumbHtml}
          ${toolbarHtml}
          ${itemsHtml}
        </div>
        ${sidebarHtml}
      </div>
    `;

    createIcons({
      icons: ICON_SET,
      attrs: {
        class: 'lucide-icon',
        'aria-hidden': 'true'
      }
    });

    setupUiListeners();
  }

  await render();
}

const controllers = {
  dashboard: renderDashboard,
  appointments: (root) => renderManager(root, 'appointments'),
  doctors: (root) => renderManager(root, 'doctors'),
  treatments: (root) => renderManager(root, 'treatments'),
  blogs: (root) => renderManager(root, 'blogs'),
  testimonials: (root) => renderManager(root, 'testimonials'),
  gallery: renderGalleryExplorer,
  seo: renderSeo,
  settings: renderSettings,
  analytics: renderAnalytics,
  'website-images': (root) => renderManager(root, 'websiteAssets'),
};

let initialization;

export function initializeAdminApp() {
  if (initialization) return initialization;
  initialization = (async () => {
    const page = document.body.dataset.adminPage;
    if (page === 'login') { await initializeLogin(); return; }
    const user = await requireAdmin();
    if (!user) return;
    try {
      await loadComponents();
      initializeAdminShell(page, user);
      const root = document.querySelector('[data-admin-page-content]');
      if (!controllers[page]) throw new Error(`Unknown admin page: ${page}`);
      await controllers[page](root);
      document.querySelector('.page-loader')?.classList.add('is-hidden');
      document.body.dataset.adminInitialized = 'true';
      window.addEventListener('beforeunload', (event) => {
        if (!hasUnsavedAdminChanges()) return;
        event.preventDefault();
        event.returnValue = '';
      });
    } catch (error) {
      const root = document.querySelector('[data-admin-page-content]');
      if (root) root.innerHTML = `<section class="admin-error-state"><i data-lucide="triangle-alert"></i><h2>Admin module could not load</h2><p>Refresh the page to try again. Unsaved changes were not applied.</p></section>`;
      document.querySelector('.page-loader')?.classList.add('is-hidden');
      refreshIcons();
      if (import.meta.env.DEV) console.error('Admin initialization failed:', error);
    }
  })();
  return initialization;
}

function parseFaqs(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed;
  } catch (e) { }
  return String(value)
    .split('\n')
    .map(line => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        return { question: parts[0].trim(), answer: parts.slice(1).join('|').trim() };
      }
      return null;
    })
    .filter(Boolean);
}

function parseBeforeAfterGallery(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed;
  } catch (e) { }
  return String(value)
    .split('\n')
    .map(line => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        return {
          beforeUrl: parts[0].trim(),
          afterUrl: parts[1].trim(),
          caption: parts[2] ? parts[2].trim() : ''
        };
      }
      return null;
    })
    .filter(Boolean);
}

function validateTreatmentRecord(values, record) {
  if (!values.name || values.name.trim().length === 0) {
    return 'Treatment name is required.';
  }
  if (values.slug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
      return 'Slug must use a safe URL format (lowercase alphanumeric and hyphens).';
    }
  }
  if (values.shortDescription && values.shortDescription.length > 220) {
    return 'Short description cannot exceed 220 characters.';
  }
  if (values.fullDescription && values.fullDescription.length > 2400) {
    return 'Treatment overview cannot exceed 2400 characters.';
  }

  const minPrice = values.minPrice !== undefined && values.minPrice !== '' && values.minPrice !== null ? Number(values.minPrice) : null;
  const maxPrice = values.maxPrice !== undefined && values.maxPrice !== '' && values.maxPrice !== null ? Number(values.maxPrice) : null;

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return 'Minimum price cannot exceed maximum price.';
  }
  const displayType = values.pricingDisplayType || 'consultation_required';
  if (displayType === 'exact_price' && minPrice === null) {
    return 'Minimum price is required when pricing display type is Exact Price.';
  }
  if (displayType === 'starting_from' && minPrice === null) {
    return 'Minimum price is required when pricing display type is Starting From.';
  }
  if (displayType === 'price_range' && (minPrice === null || maxPrice === null)) {
    return 'Both minimum and maximum prices are required for Price Range display type.';
  }
  if (values.status === 'scheduled' && !values.scheduledFor) {
    return 'Scheduled publication requires a valid scheduled publish time.';
  }
  if (values.image && !values.imageAlt?.trim()) {
    return 'Featured image requires alt text description.';
  }
  const beforeAfterVal = parseBeforeAfterGallery(values.beforeAfterGallery);
  if (beforeAfterVal.length > 0 && !values.beforeAfterConsent) {
    return 'Patient consent confirmation is required to enable before-and-after media.';
  }
  const currentId = record.id || values.id;

  const faqs = parseFaqs(values.faqJson);
  for (const f of faqs) {
    if (!f.question?.trim() || !f.answer?.trim()) {
      return 'FAQ items must contain non-empty question and answer fields.';
    }
  }
  if (values.reviewerDoctorId) {
    let reviewerId = values.reviewerDoctorId;
    if (reviewerId.includes('(')) {
      const match = reviewerId.match(/\(([^)]+)\)/);
      if (match) reviewerId = match[1];
    }
    const docs = getCollection('doctors') || [];
    const exists = docs.some(d => d.id === reviewerId);
    if (!exists) {
      return 'Clinical reviewer ID must reference an existing doctor.';
    }
  }
  if (values.seoTitle && values.seoTitle.length > 60) {
    setTimeout(() => showToast('Warning: SEO title exceeds recommended 60 characters.', 'warning'), 100);
  }
  if (values.seoDescription && values.seoDescription.length > 160) {
    setTimeout(() => showToast('Warning: SEO description exceeds recommended 160 characters.', 'warning'), 150);
  }
  return null;
}
