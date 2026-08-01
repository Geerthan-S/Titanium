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
} from '../data/record-mappers.js';

const TABLES = Object.freeze({
  appointments: 'appointment_requests',
  doctors: 'doctors',
  treatments: 'treatments',
  blogs: 'blog_posts',
  testimonials: 'testimonials',
  gallery: 'gallery_items',
  seo: 'seo_pages',
  analytics: 'analytics_events',
  activity: 'cms_audit_log',
});

const FROM_DATABASE = Object.freeze({
  appointments: mapAppointmentFromDatabase,
  doctors: mapDoctorFromDatabase,
  treatments: mapTreatmentFromDatabase,
  blogs: mapBlogFromDatabase,
  testimonials: mapTestimonialFromDatabase,
  gallery: mapGalleryFromDatabase,
  seo: mapSeoFromDatabase,
  analytics: mapAnalyticsFromDatabase,
  activity: mapAuditFromDatabase,
});

const TO_DATABASE = Object.freeze({
  appointments: mapAppointmentAdminToDatabase,
  doctors: mapDoctorToDatabase,
  treatments: mapTreatmentToDatabase,
  blogs: mapBlogToDatabase,
  testimonials: mapTestimonialToDatabase,
  gallery: mapGalleryToDatabase,
  seo: mapSeoToDatabase,
});

const cache = new Map();
const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

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
  const rows = await listAdminRecords(TABLES[collection], orderFor(collection));
  const mapped = rows.map(FROM_DATABASE[collection]);
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
  await deleteAdminRecord(TABLES[collection], id, {
    summary: `Deleted ${current?.name || current?.title || current?.filename || collection}`,
  });
  cache.set(collection, (cache.get(collection) || []).filter((record) => record.id !== id));
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
    'activity',
  ];
  await Promise.all(names.map((name) => loadCollection(name, { force: true })));
  const appointments = getCollection('appointments');
  const events = getCollection('analytics');
  return {
    appointments,
    doctors: getCollection('doctors'),
    treatments: getCollection('treatments'),
    blogs: getCollection('blogs'),
    testimonials: getCollection('testimonials'),
    gallery: getCollection('gallery'),
    seo: getCollection('seo'),
    settings: await getSettings({ force: true }),
    analytics: aggregateAnalytics(events, appointments),
    activity: getCollection('activity').map((item) => ({
      ...item,
      action: item.summary || `${item.action} ${item.tableName}`,
      actor: 'Clinic Administrator',
    })),
  };
}
