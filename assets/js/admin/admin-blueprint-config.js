export const BLUEPRINT_STATUSES = ['draft', 'review', 'scheduled', 'published', 'archived'];

export const APPOINTMENT_STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'cancelled', 'spam'];

export const BLUEPRINT_TABLES = {
  adminProfiles: 'admin_profiles',
  doctors: 'doctors',
  specialties: 'specialties',
  treatments: 'treatments',
  treatmentFaqs: 'treatment_faqs',
  treatmentDoctors: 'treatment_doctors',
  blogs: 'blog_posts',
  blogCategories: 'blog_categories',
  blogFaqs: 'blog_faqs',
  blogTreatments: 'blog_treatments',
  testimonials: 'testimonials',
  mediaAssets: 'media_assets',
  galleryCollections: 'gallery_collections',
  galleryCollectionItems: 'gallery_collection_items',
  pageSections: 'page_sections',
  redirects: 'redirects',
  seoPages: 'seo_pages',
  settings: 'site_settings',
  appointments: 'appointment_requests',
  analyticsEvents: 'analytics_events',
  searchConsoleMetrics: 'search_console_metrics',
  auditLog: 'cms_audit_log',
  websiteAssets: 'website_assets',
};

export const EDITOR_SECTIONS = {
  treatments: ['Basics', 'Content', 'FAQs', 'Media', 'Relationships', 'SEO', 'Publishing'],
  blogs: ['Basics', 'Content', 'Clinical Review', 'SEO Review', 'Relationships', 'Publishing'],
  media: ['Asset', 'Metadata', 'Usage', 'Gallery'],
};

export const SEO_AUDIT_KEYS = ['missingMetadata', 'duplicateSlug', 'missingReviewer', 'brokenRelation', 'missingAlt'];

export const DASHBOARD_WIDGETS = [
  'appointmentRequests',
  'contentReview',
  'publishingCalendar',
  'seoHealth',
  'mediaAlerts',
  'auditLog',
];

export const SEO_SECTIONS = [
  { title: 'Defaults', fields: ['siteName', 'titleSuffix', 'defaultDescription', 'defaultOgImage', 'canonicalDomain'] },
  { title: 'Audit', keys: SEO_AUDIT_KEYS },
  { title: 'Redirects', table: BLUEPRINT_TABLES.redirects, fields: ['oldPath', 'destination', 'code', 'reason'] },
  { title: 'Sitemap & Robots Preview', fields: ['sitemapPreview', 'robotsPreview'] },
];

export const SETTINGS_GROUPS = [
  'Identity',
  'Contact',
  'Locality',
  'Content Defaults',
  'SEO Defaults',
  'Integrations',
  'Analytics Privacy',
  'Maintenance',
];

export const ANALYTICS_SECTIONS = [
  'Acquisition: organic, direct, referral, social, campaign',
  'Conversion: appointment starts, successful submissions, CTA clicks',
  'Content: top pages, treatment interest, blog engagement',
  'Search Console: clicks, impressions, CTR, average position',
  'Privacy boundary: does not collect names, contact details, or medical history',
];
