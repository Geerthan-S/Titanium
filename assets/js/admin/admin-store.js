import {
  deleteAdminRecord,
  listAdminRecords,
  patchAdminRecord,
  saveAdminRecord,
} from '../data/cms-repository.js';
import {
  mapAnalyticsFromDatabase,
  mapAppointmentAdminToDatabase,
  mapAppointmentFromDatabase,
  mapAuditFromDatabase,
  mapBlogFromDatabase,
  mapBlogToDatabase,
  mapDoctorFromDatabase,
  mapDoctorToDatabase,
  mapGalleryFromDatabase,
  mapGalleryToDatabase,
  mapSeoFromDatabase,
  mapSeoToDatabase,
  mapSettingsFromDatabase,
  mapSettingsToDatabase,
  mapTestimonialFromDatabase,
  mapTestimonialToDatabase,
  mapTreatmentFromDatabase,
  mapTreatmentToDatabase,
  mapWebsiteAssetFromDatabase,
  mapWebsiteAssetToDatabase,
} from '../data/record-mappers.js';
import { BLUEPRINT_TABLES } from './admin-blueprint-config.js';
import { canArchiveRecord } from './admin-workflows.js';

const TABLES = Object.freeze({
  adminProfiles: BLUEPRINT_TABLES.adminProfiles,
  appointments: BLUEPRINT_TABLES.appointments,
  doctors: BLUEPRINT_TABLES.doctors,
  specialties: BLUEPRINT_TABLES.specialties,
  treatments: BLUEPRINT_TABLES.treatments,
  treatmentFaqs: BLUEPRINT_TABLES.treatmentFaqs,
  treatmentDoctors: BLUEPRINT_TABLES.treatmentDoctors,
  blogs: BLUEPRINT_TABLES.blogs,
  blogCategories: BLUEPRINT_TABLES.blogCategories,
  blogFaqs: BLUEPRINT_TABLES.blogFaqs,
  blogTreatments: BLUEPRINT_TABLES.blogTreatments,
  testimonials: BLUEPRINT_TABLES.testimonials,
  gallery: BLUEPRINT_TABLES.mediaAssets,
  mediaAssets: BLUEPRINT_TABLES.mediaAssets,
  galleryCollections: BLUEPRINT_TABLES.galleryCollections,
  galleryCollectionItems: BLUEPRINT_TABLES.galleryCollectionItems,
  pageSections: BLUEPRINT_TABLES.pageSections,
  redirects: BLUEPRINT_TABLES.redirects,
  seo: BLUEPRINT_TABLES.seoPages,
  analytics: BLUEPRINT_TABLES.analyticsEvents,
  searchConsole: BLUEPRINT_TABLES.searchConsoleMetrics,
  activity: BLUEPRINT_TABLES.auditLog,
  websiteAssets: BLUEPRINT_TABLES.websiteAssets,
});


const FROM_DATABASE = Object.freeze({
  appointments: mapAppointmentFromDatabase,
  doctors: mapDoctorFromDatabase,
  treatments: mapTreatmentFromDatabase,
  blogs: mapBlogFromDatabase,
  testimonials: mapTestimonialFromDatabase,
  gallery: mapGalleryFromDatabase,
  mediaAssets: mapGalleryFromDatabase,
  seo: mapSeoFromDatabase,
  analytics: mapAnalyticsFromDatabase,
  searchConsole: (row = {}) => ({
    id: row.id,
    metricDate: row.metric_date,
    pagePath: row.page_path,
    query: row.query || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }),
  activity: mapAuditFromDatabase,
  websiteAssets: mapWebsiteAssetFromDatabase,
});

const TO_DATABASE = Object.freeze({
  appointments: mapAppointmentAdminToDatabase,
  doctors: mapDoctorToDatabase,
  treatments: mapTreatmentToDatabase,
  blogs: mapBlogToDatabase,
  testimonials: mapTestimonialToDatabase,
  gallery: mapGalleryToDatabase,
  mediaAssets: mapGalleryToDatabase,
  seo: mapSeoToDatabase,
  websiteAssets: mapWebsiteAssetToDatabase,
});

const cache = new Map();
const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const identity = (row) => row;
const normalizeStatus = (status) => String(status || '').toLowerCase().replaceAll(' ', '_').replace('appointment_pending', 'contacted').replace('closed', 'cancelled');

function orderFor(collection) {
  if (collection === 'appointments' || collection === 'analytics' || collection === 'activity') {
    return { order: 'created_at', ascending: false };
  }
  if (collection === 'seo') return { order: 'route', ascending: true };
  return { order: 'sort_order', ascending: true };
}

function notify(collection) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin:store-changed', { detail: { collection } }));
  }
}

export async function loadCollection(collection, { force = false } = {}) {
  if (!TABLES[collection]) throw new Error(`Unknown admin collection: ${collection}`);
  if (!force && cache.has(collection)) return getCollection(collection);
  let rows = [];
  try {
    rows = await listAdminRecords(TABLES[collection], orderFor(collection));
  } catch (error) {
    if (!['searchConsole', 'mediaAssets', 'galleryCollections', 'galleryCollectionItems', 'redirects', 'pageSections'].includes(collection)) throw error;
    rows = [];
  }
  const mapped = rows.map(FROM_DATABASE[collection] || identity);
  cache.set(collection, mapped);
  return clone(mapped);
}

export function getCollection(collection) {
  return clone(cache.get(collection) || []);
}

export async function upsertRecord(collection, record) {
  const table = TABLES[collection];
  const mapper = TO_DATABASE[collection];
  if (!table || !mapper) throw new Error(`Collection cannot be saved: ${collection}`);
  const row = await saveAdminRecord(table, mapper(record), {
    summary: `Saved ${record.name || record.title || record.filename || collection}`,
  });
  const mapped = FROM_DATABASE[collection](row);
  const records = cache.get(collection) || [];
  const index = records.findIndex(({ id }) => id === mapped.id);
  if (index >= 0) records[index] = mapped;
  else records.unshift(mapped);
  cache.set(collection, records);
  notify(collection);
  return clone(mapped);
}

export async function updateRecord(collection, id, patch, options = {}) {
  const current = (cache.get(collection) || []).find((record) => record.id === id);
  if (!current) return null;
  const table = TABLES[collection];
  const mapper = TO_DATABASE[collection];
  const complete = { ...current, ...patch };
  const mappedPatch = mapper(complete);
  delete mappedPatch.id;
  const row = await patchAdminRecord(table, id, mappedPatch, {
    action: options.action || 'update',
    summary: options.summary || `Updated ${current.name || current.title || current.filename || collection}`,
  });
  const mapped = FROM_DATABASE[collection](row);
  cache.set(
    collection,
    (cache.get(collection) || []).map((record) => record.id === id ? mapped : record),
  );
  notify(collection);
  return clone(mapped);
}

export async function removeRecord(collection, id) {
  const current = (cache.get(collection) || []).find((record) => record.id === id);
  console.log('[removeRecord] Deleting:', { collection, id, currentStatus: current?.status });
  await deleteAdminRecord(TABLES[collection], id, {
    summary: `Deleted ${current?.name || current?.title || current?.filename || collection}`,
  });
  console.log('[removeRecord] DB delete succeeded for', id);

  const archivePlan = canArchiveRecord(collection);
  console.log('[removeRecord] Archive plan:', archivePlan);
  if (archivePlan.mode === 'delete') {
    cache.set(collection, (cache.get(collection) || []).filter((record) => record.id !== id));
  } else {
    cache.set(collection, (cache.get(collection) || []).map((record) => (
      record.id === id ? { ...record, status: archivePlan.mode === 'status' ? archivePlan.status : 'archived' } : record
    )));
  }

  const afterDelete = (cache.get(collection) || []).find((r) => r.id === id);
  console.log('[removeRecord] After cache update:', { id, newStatus: afterDelete?.status, stillInCache: !!afterDelete });
  notify(collection);
  return true;
}

function flattenSettings(row) {
  const grouped = mapSettingsFromDatabase(row);
  return {
    ...grouped.clinicIdentity,
    ...grouped.contact,
    ...grouped.socialLinks,
    ...grouped.messageTemplates,
    ...grouped.homepage,
    ...grouped.footer,
    ...grouped.featureFlags,
    ...grouped.brand,
    hours: grouped.clinicHours,
  };
}

function groupSettings(settings) {
  const pick = (keys) => Object.fromEntries(keys.map((key) => [key, settings[key]]));
  return mapSettingsToDatabase({
    clinicIdentity: pick(['clinicName', 'shortName', 'logo', 'favicon', 'description']),
    contact: pick([
      'primaryPhone',
      'alternatePhone',
      'whatsapp',
      'email',
      'appointmentEmail',
      'address',
      'mapsUrl',
      'directionsUrl',
    ]),
    socialLinks: pick(['instagram', 'facebook', 'youtube', 'linkedin']),
    clinicHours: settings.hours || {},
    messageTemplates: pick([
      'appointmentMessage',
      'enquiryMessage',
      'emergencyMessage',
      'callbackMessage',
    ]),
    homepage: pick([
      'statisticPatients',
      'ctaText',
      'featuredTreatmentCount',
      'featuredDoctorCount',
    ]),
    footer: pick(['footerDescription', 'copyright', 'legalLinks', 'newsletterText']),
    featureFlags: pick([
      'maintenanceMode',
      'maintenanceMessage',
      'leadPopup',
      'newsletter',
      'emergencyAvailable',
    ]),
    brand: pick([
      'primaryEmerald',
      'supportingSage',
      'backgroundIvory',
      'accentChampagne',
    ]),
  });
}

export async function getSettings({ force = false } = {}) {
  if (!force && cache.has('settings')) return clone(cache.get('settings'));
  const rows = await listAdminRecords('site_settings', { order: 'id', ascending: true });
  const settings = rows[0] ? flattenSettings(rows[0]) : { hours: {} };
  cache.set('settings', settings);
  return clone(settings);
}

export async function saveSettings(settings) {
  const row = await saveAdminRecord('site_settings', groupSettings(settings), {
    summary: 'Updated global website settings',
  });
  const mapped = flattenSettings(row);
  cache.set('settings', mapped);
  notify('settings');
  return clone(mapped);
}

function monthKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function aggregateAnalytics(events, appointments) {
  const pageViews = events.filter(({ eventType }) => eventType === 'page_view');
  const eventCount = (type) => events.filter(({ eventType }) => eventType === type).length;
  const monthCounts = new Map();
  pageViews.forEach((event) => {
    const key = monthKey(event.createdAt);
    if (key) monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
  });
  const months = [...monthCounts.keys()].sort().slice(-12);
  const pages = {};
  const sources = {};
  pageViews.forEach(({ pagePath, referrerDomain }) => {
    pages[pagePath] = (pages[pagePath] || 0) + 1;
    const source = referrerDomain || 'Direct';
    sources[source] = (sources[source] || 0) + 1;
  });
  const cta = {
    'CTA clicks': eventCount('cta_click'),
    WhatsApp: eventCount('whatsapp_click'),
    Phone: eventCount('phone_click'),
  };
  const submissions = eventCount('appointment_submit');
  const conversion = pageViews.length
    ? Number(((submissions / pageViews.length) * 100).toFixed(1))
    : 0;
  return {
    metrics: {
      visitors: pageViews.length,
      pageViews: pageViews.length,
      returning: 0,
      averageTime: 'Not collected',
      appointments: appointments.length,
      whatsapp: cta.WhatsApp,
      phone: cta.Phone,
      conversion,
    },
    labels: months,
    visitors: months.map((month) => monthCounts.get(month) || 0),
    sources: Object.keys(sources).length ? sources : { Direct: 0 },
    devices: { 'Not collected': 0 },
    pages: Object.keys(pages).length ? pages : { '/': 0 },
    cta,
    funnel: {
      'Page views': pageViews.length,
      'CTA interactions': Object.values(cta).reduce((sum, value) => sum + value, 0),
      'Appointment submissions': submissions,
      'Appointment requests': appointments.length,
    },
  };
}

function filterEventsByRange(events, range = 30) {
  const minTime = Date.now() - Number(range || 30) * 24 * 60 * 60 * 1000;
  return events.filter((event) => new Date(event.createdAt || event.created_at).getTime() >= minTime);
}

function buildSeoAudit({ treatments = [], blogs = [], mediaAssets = [] }) {
  const records = [...treatments, ...blogs];
  const slugCounts = records.reduce((counts, record) => {
    if (record.slug) counts[record.slug] = (counts[record.slug] || 0) + 1;
    return counts;
  }, {});

  const missingMetadata = records.filter((record) => !record.seoTitle || !record.seoDescription);
  const duplicateSlug = records.filter((record) => record.slug && slugCounts[record.slug] > 1);
  const missingReviewer = records.filter((record) => normalizeStatus(record.status) === 'published' && !(record.reviewerDoctorId || record.reviewedByDoctorId));
  const brokenRelation = records.filter((record) => record.relatedTreatmentIds?.includes(record.id));
  const missingAlt = mediaAssets.filter((asset) => !asset.alt);

  return { missingMetadata, duplicateSlug, missingReviewer, brokenRelation, missingAlt };
}

function summarizeAppointments(appointments = []) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    new: appointments.filter((item) => normalizeStatus(item.status) === 'new').length,
    contacted: appointments.filter((item) => normalizeStatus(item.status) === 'contacted').length,
    confirmed: appointments.filter((item) => normalizeStatus(item.status) === 'confirmed').length,
    today: appointments.filter((item) => item.preferredDate === today).length,
    overdue: appointments.filter((item) => item.preferredDate && item.preferredDate < today && !['completed', 'cancelled', 'spam'].includes(normalizeStatus(item.status))).length,
  };
}

function summarizeMediaAlerts(mediaAssets = []) {
  return {
    largeAssets: mediaAssets.filter((asset) => Number(asset.bytes || asset.size || 0) > 1_000_000),
    unusedAssets: mediaAssets.filter((asset) => String(asset.usage || '').startsWith('0 ')),
    missingAlt: mediaAssets.filter((asset) => !asset.alt),
  };
}

export async function getAdminData() {
  const names = [
    'appointments',
    'doctors',
    'treatments',
    'blogs',
    'testimonials',
    'gallery',
    'seo',
    'analytics',
    'searchConsole',
    'activity',
    'websiteAssets',
  ];
  await Promise.all(names.map((name) => loadCollection(name, { force: true })));
  const appointments = getCollection('appointments');
  const events = filterEventsByRange(getCollection('analytics'), 30);
  const gallery = getCollection('gallery');
  const treatments = getCollection('treatments');
  const blogs = getCollection('blogs');
  const seoHealth = buildSeoAudit({ treatments, blogs, mediaAssets: gallery });
  return {
    appointments,
    doctors: getCollection('doctors'),
    treatments,
    blogs,
    testimonials: getCollection('testimonials'),
    gallery,
    seo: getCollection('seo'),
    websiteAssets: getCollection('websiteAssets'),
    settings: await getSettings({ force: true }),
    analytics: aggregateAnalytics(events, appointments),
    searchConsole: getCollection('searchConsole'),
    auditLog: getCollection('activity'),
    appointmentRequests: summarizeAppointments(appointments),
    seoHealth,
    mediaAlerts: summarizeMediaAlerts(gallery),
    activity: getCollection('activity').map((item) => ({
      ...item,
      action: item.summary || `${item.action} ${item.tableName}`,
      actor: 'Clinic Administrator',
    })),
  };
}
