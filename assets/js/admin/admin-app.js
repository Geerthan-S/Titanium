import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { loadComponents } from '../components/component-loader.js';
import { showToast } from '../components/toast.js';
import { removeCmsMedia, replaceCmsMedia } from '../data/media-repository.js';
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

const statusOptions = ['Draft', 'Published', 'Unpublished'];
const yesNo = ['No', 'Yes'];

const field = (name, label, options = {}) => ({ name, label, ...options });
const fields = {
  appointments: [
    field('name', 'Patient or lead', { required: true, helper: 'Do not enter medical history or sensitive health information.' }),
    field('mobile', 'Mobile', { type: 'tel', required: true }),
    field('email', 'Email', { type: 'email' }),
    field('enquiryType', 'Enquiry type', { type: 'select', options: ['Appointment', 'General', 'Callback', 'WhatsApp'] }),
    field('treatment', 'Treatment interest'),
    field('doctor', 'Preferred doctor'),
    field('preferredDate', 'Preferred date', { type: 'date' }),
    field('source', 'Source', { type: 'select', options: ['Website', 'Contact', 'WhatsApp', 'Phone', 'Email'] }),
    field('status', 'Status', { type: 'select', options: ['New', 'Contacted', 'Appointment Pending', 'Confirmed', 'Completed', 'Closed'] }),
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
    field('portrait', 'Portrait image', { type: 'file', accept: 'image/jpeg,image/png,image/webp', helper: 'JPG, PNG or WebP; maximum 5 MB.' }),
    field('imageAlt', 'Image alt text'), field('featured', 'Featured profile', { type: 'checkbox', switchLabel: 'Feature on website' }),
    field('status', 'Publish status', { type: 'select', options: statusOptions }), field('sortOrder', 'Sort order', { type: 'number', min: 1 }),
  ],
  treatments: [
    field('name', 'Name', { required: true }), field('slug', 'Slug', { helper: 'Generated from the name when left blank.' }),
    field('category', 'Category', { type: 'select', options: ['General Dentistry', 'Restorative', 'Cosmetic', 'Orthodontics', 'Surgical', 'Preventive'] }),
    field('shortDescription', 'Short description', { type: 'textarea', full: true, maxLength: 220, required: true }),
    field('fullDescription', 'Full description', { type: 'textarea', full: true, maxLength: 2400 }),
    field('duration', 'Duration'), field('visits', 'Number of visits'), field('price', 'Price', { type: 'number', min: 0, helper: 'Leave blank when pricing is not confirmed.' }),
    field('pricingStatus', 'Pricing status', { type: 'select', options: ['Confirmed', 'Consultation Required', 'Pending Confirmation'] }),
    field('benefits', 'Benefits', { type: 'textarea', full: true }), field('suitability', 'Suitability', { type: 'textarea', full: true }),
    field('steps', 'Procedure steps', { type: 'textarea', full: true }), field('recovery', 'Recovery information', { type: 'textarea', full: true }),
    field('image', 'Featured image', { type: 'file', accept: 'image/jpeg,image/png,image/webp' }), field('imageAlt', 'Image alt text'),
    field('featured', 'Featured treatment', { type: 'checkbox', switchLabel: 'Feature on website' }),
    field('status', 'Publish status', { type: 'select', options: statusOptions }), field('sortOrder', 'Sort order', { type: 'number', min: 1 }),
  ],
  blogs: [
    field('title', 'Title', { required: true, maxLength: 100 }), field('slug', 'Slug', { helper: 'Generated from the title when left blank.' }),
    field('category', 'Category', { type: 'select', options: ['Patient Guides', 'Dental Education', 'Clinic News', 'Treatments', 'Oral Health'] }),
    field('tags', 'Tags', { helper: 'Comma-separated tags.' }), field('excerpt', 'Excerpt', { type: 'textarea', full: true, maxLength: 220, required: true }),
    field('content', 'Full article content', { type: 'editor', full: true, required: true }),
    field('image', 'Featured image', { type: 'file', accept: 'image/jpeg,image/png,image/webp' }), field('imageAlt', 'Image alt text'),
    field('author', 'Author', { required: true }), field('publishDate', 'Publish date', { type: 'date' }),
    field('status', 'Publish status', { type: 'select', options: statusOptions }), field('featured', 'Featured article', { type: 'checkbox', switchLabel: 'Feature article' }),
    field('trending', 'Trending article', { type: 'checkbox', switchLabel: 'Mark trending' }), field('seoTitle', 'SEO title', { maxLength: 60 }),
    field('seoDescription', 'SEO description', { type: 'textarea', full: true, maxLength: 160 }), field('sortOrder', 'Sort order', { type: 'number', min: 1 }),
  ],
  testimonials: [
    field('name', 'Patient display name', { required: true, helper: 'Use a display label, not a full real identity.' }),
    field('treatment', 'Treatment'), field('rating', 'Rating', { type: 'number', min: 1 }),
    field('review', 'Review', { type: 'textarea', full: true, maxLength: 800, required: true }),
    field('image', 'Patient image', { type: 'file', accept: 'image/jpeg,image/png,image/webp' }),
    field('consentStatus', 'Consent status', { type: 'select', options: ['Pending', 'Confirmed', 'Not provided'] }),
    field('source', 'Submission source'), field('moderationStatus', 'Moderation status', { type: 'select', options: ['Pending', 'Approved', 'Rejected'] }),
    field('featured', 'Featured', { type: 'checkbox', switchLabel: 'Feature testimonial' }),
    field('status', 'Publish status', { type: 'select', options: ['Published', 'Unpublished'] }), field('sortOrder', 'Sort order', { type: 'number', min: 1 }),
  ],
  gallery: [
    field('title', 'Media title', { required: true }), field('filename', 'Filename'),
    field('category', 'Category', { type: 'select', options: ['Clinic Interiors', 'Equipment', 'Treatments', 'Doctors', 'Testimonials', 'Blog', 'Branding', 'Other'] }),
    field('alt', 'Alt text', { required: true }), field('dimensions', 'Dimensions'), field('size', 'File size in bytes', { type: 'number', min: 0 }),
    field('usage', 'Usage status'), field('status', 'Publish status', { type: 'select', options: statusOptions }), field('sortOrder', 'Sort order', { type: 'number', min: 1 }),
    field('url', 'Storage path', { readOnly: true }), field('file', 'Replace file', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/svg+xml', helper: 'SVG is accepted only for approved branding assets.' }),
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
      { key: 'status', label: 'statuses', options: ['New', 'Contacted', 'Appointment Pending', 'Confirmed', 'Completed', 'Closed'] },
      { key: 'source', label: 'sources', options: ['Website', 'WhatsApp', 'Callback', 'Phone', 'Email'] },
      { key: 'enquiryType', label: 'enquiry types', options: ['Appointment Request', 'General Enquiry', 'Callback Request', 'WhatsApp Enquiry'] },
    ],
    actions: [
      { key: 'view', label: 'View details', icon: 'eye' }, { key: 'status', label: 'Update status', icon: 'refresh-cw' },
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
    filters: [{ key: 'category', label: 'categories', options: ['General Dentistry', 'Restorative', 'Cosmetic', 'Orthodontics', 'Surgical', 'Preventive'] }, { key: 'status', label: 'publish states', options: statusOptions }, { key: 'pricingStatus', label: 'pricing states', options: ['Confirmed', 'Consultation Required', 'Pending Confirmation'] }],
  },
  blogs: {
    description: 'Draft, preview, schedule, publish, feature, and organise clinic articles.',
    addLabel: 'Create blog',
    columns: [{ key: 'title', label: 'Article' }, { key: 'category', label: 'Category' }, { key: 'author', label: 'Author' }, { key: 'publishDate', label: 'Publish date', type: 'date' }, { key: 'status', label: 'Status', type: 'status' }, { key: 'trending', label: 'Trending', render: (v) => v ? '<span class="admin-status admin-status--featured">Trending</span>' : '—' }],
    filters: [{ key: 'category', label: 'categories', options: ['Patient Guides', 'Dental Education', 'Clinic News', 'Treatments', 'Oral Health'] }, { key: 'status', label: 'publish states', options: statusOptions }],
  },
  testimonials: {
    description: 'Moderate patient feedback. Publishing requires approval and confirmed consent.',
    addLabel: 'Add testimonial',
    columns: [{ key: 'name', label: 'Display name' }, { key: 'treatment', label: 'Treatment' }, { key: 'rating', label: 'Rating', render: (v) => `${escapeHtml(v)} / 5` }, { key: 'consentStatus', label: 'Consent', type: 'status' }, { key: 'moderationStatus', label: 'Moderation', type: 'status' }, { key: 'status', label: 'Publish status', type: 'status' }],
    filters: [{ key: 'moderationStatus', label: 'moderation states', options: ['Pending', 'Approved', 'Rejected'] }, { key: 'consentStatus', label: 'consent states', options: ['Pending', 'Confirmed', 'Not provided'] }, { key: 'status', label: 'publish states', options: ['Published', 'Unpublished'] }],
  },
  gallery: {
    description: 'Manage clinic media, accessibility text, publishing state and asset usage.',
    addLabel: 'Add media',
    columns: [{ key: 'filename', label: 'Filename' }, { key: 'category', label: 'Category' }, { key: 'dimensions', label: 'Dimensions' }, { key: 'size', label: 'Size', render: (v) => escapeHtml(formatFileSize(Number(v))) }, { key: 'usage', label: 'Usage' }, { key: 'uploadedAt', label: 'Added', type: 'date' }],
    filters: [{ key: 'category', label: 'categories', options: ['Clinic Interiors', 'Equipment', 'Treatments', 'Doctors', 'Testimonials', 'Blog', 'Branding', 'Other'] }, { key: 'type', label: 'file types', options: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] }],
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
  const pending = data.appointments.filter(({ status }) => ['New', 'Contacted', 'Appointment Pending'].includes(status)).length;
  const metrics = [
    ['New appointment requests', data.appointments.filter(({ status }) => status === 'New').length, 'calendar-plus', 'Live requests'],
    ['Pending follow-ups', pending, 'phone-forwarded', 'Open leads'],
    ['Active doctors', data.doctors.filter(({ status }) => status === 'Published').length, 'stethoscope', 'Published profiles'],
    ['Published treatments', data.treatments.filter(({ status }) => status === 'Published').length, 'sparkles', 'Website content'],
    ['Published blogs', data.blogs.filter(({ status }) => status === 'Published').length, 'notebook-pen', 'Website content'],
    ['Awaiting testimonial approval', data.testimonials.filter(({ moderationStatus }) => moderationStatus === 'Pending').length, 'message-square-heart', 'Moderation queue'],
    ['Recorded page views', data.analytics.metrics.pageViews.toLocaleString('en-IN'), 'users', 'Privacy-limited events'],
    ['Appointment conversion', `${data.analytics.metrics.conversion}%`, 'mouse-pointer-click', 'Recorded submissions'],
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
      <section class="admin-panel"><header><div><p>Lead status</p><h3>Current follow-up mix</h3></div></header><div class="admin-status-summary">${['New', 'Contacted', 'Appointment Pending', 'Confirmed', 'Completed', 'Closed'].map((status) => `<div><span class="${statusClass(status)}">${status}</span><strong>${data.appointments.filter((item) => item.status === status).length}</strong></div>`).join('')}</div></section>
      <section class="admin-panel admin-panel--wide"><header><div><p>Recent requests</p><h3>Appointments and general enquiries</h3></div><a href="/admin/appointments.html">View all <i data-lucide="arrow-right"></i></a></header><div class="admin-compact-list">${recentRequests}</div></section>
      <section class="admin-panel"><header><div><p>Content status</p><h3>Publishing overview</h3></div></header><div class="admin-content-progress">${[['Doctors', data.doctors], ['Treatments', data.treatments], ['Blogs', data.blogs], ['Testimonials', data.testimonials]].map(([label, records]) => { const count = records.filter(({ status }) => status === 'Published').length; return `<div><span><strong>${label}</strong><small>${count} of ${records.length} published</small></span><progress value="${count}" max="${Math.max(1, records.length)}">${count}/${records.length}</progress></div>`; }).join('')}</div></section>
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
  const openRecord = (record = {}, title = config.addLabel) => openAdminForm({
    title, fields: fields[collection], record,
    preview: ['blogs', 'doctors', 'treatments'].includes(collection) ? (container, values) => renderRecordPreview(container, values, collection) : null,
    onSave: async (values) => {
      const next = normalizeRecord(collection, values);
      const files = next.__files || {};
      delete next.__files;
      if (collection === 'testimonials' && next.status === 'Published' && !canPublishTestimonial(next)) {
        showToast('Approve the testimonial and confirm consent before publishing.', 'error');
        return false;
      }
      if (collection === 'treatments' && next.pricingStatus !== 'Confirmed') next.price = '';
      const mediaFields = {
        doctors: ['portrait', 'portrait'],
        treatments: ['image', 'image'],
        blogs: ['image', 'image'],
        testimonials: ['image', 'image'],
        gallery: ['file', 'url'],
      };
      const [fileField, pathField] = mediaFields[collection] || [];
      const file = files[fileField];
      if (file) {
        next.id ||= crypto.randomUUID();
        if (collection === 'gallery') {
          next.filename = file.name;
          next.type = file.type;
          next.size = file.size;
        }
        await replaceCmsMedia({
          file,
          collection,
          recordId: next.id,
          previousPath: record[pathField] || '',
          allowSvg: collection === 'gallery' && file.type === 'image/svg+xml',
          persist: (path) => upsertRecord(collection, { ...next, [pathField]: path }),
        });
      } else {
        await upsertRecord(collection, next);
      }
      refresh();
      showToast(`${title.replace(/^Edit /, '')} saved.`);
      return true;
    },
  });
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
    if (action === 'archive') { await updateRecord(collection, record.id, { status: 'Closed' }); refresh(); showToast('Record archived.'); }
    if (action === 'approve') { await updateRecord(collection, record.id, { moderationStatus: 'Approved' }, { action: 'approve' }); refresh(); showToast('Testimonial approved.'); }
    if (action === 'reject') { await updateRecord(collection, record.id, { moderationStatus: 'Rejected', status: 'Unpublished' }, { action: 'reject' }); refresh(); showToast('Testimonial rejected and unpublished.', 'warning'); }
    if (action === 'publish') {
      const publishing = record.status !== 'Published';
      if (collection === 'testimonials' && publishing && !canPublishTestimonial(record)) { showToast('Publishing requires approval and confirmed consent.', 'error'); return; }
      await updateRecord(collection, record.id, { status: publishing ? 'Published' : 'Unpublished' }, { action: publishing ? 'publish' : 'unpublish' });
      refresh(); showToast(publishing ? 'Record published.' : 'Record unpublished.');
    }
    if (action === 'feature') { await updateRecord(collection, record.id, { featured: !record.featured }); refresh(); showToast(record.featured ? 'Removed from featured content.' : 'Added to featured content.'); }
    if (action === 'move-up') { await updateRecord(collection, record.id, { sortOrder: Math.max(1, Number(record.sortOrder || 1) - 1) }); refresh(); showToast('Display order updated.'); }
    if (action === 'delete') {
      const confirmed = await confirmAdminAction({ title: 'Delete record?', message: `Permanently delete ${record.name || record.title || record.filename}?`, confirmLabel: 'Delete record', trigger: actionButton });
      if (confirmed) {
        const mediaPath = record.portrait || record.image || record.url || '';
        await removeRecord(collection, record.id);
        await removeCmsMedia(mediaPath).catch(() => {});
        refresh();
        showToast('Record deleted.', 'warning');
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

const controllers = {
  dashboard: renderDashboard,
  appointments: (root) => renderManager(root, 'appointments'),
  doctors: (root) => renderManager(root, 'doctors'),
  treatments: (root) => renderManager(root, 'treatments'),
  blogs: (root) => renderManager(root, 'blogs'),
  testimonials: (root) => renderManager(root, 'testimonials'),
  gallery: (root) => renderManager(root, 'gallery'),
  seo: renderSeo,
  settings: renderSettings,
  analytics: renderAnalytics,
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
