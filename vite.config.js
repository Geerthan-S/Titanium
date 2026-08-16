import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

const rootDirectory = resolve(import.meta.dirname);
const componentDirectory = resolve(rootDirectory, 'components');
const seoCachePath = resolve(rootDirectory, '.cache/seo-pages.json');

function componentFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);
    return entry.isDirectory() ? componentFiles(entryPath) : [entryPath];
  });
}

function componentAssetsPlugin() {
  return {
    name: 'titanium-roots-components',
    generateBundle() {
      componentFiles(componentDirectory).forEach((filePath) => {
        this.emitFile({
          type: 'asset',
          fileName: `components/${relative(componentDirectory, filePath).replaceAll('\\', '/')}`,
          source: readFileSync(filePath),
        });
      });
    },
  };
}

const htmlEscape = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const jsonLdEscape = (value) => JSON.stringify(value)
  .replaceAll('<', '\\u003c')
  .replaceAll('>', '\\u003e')
  .replaceAll('&', '\\u0026');

function siteOrigin(cache = {}) {
  return String(cache.siteOrigin || 'https://titaniumroots.com').replace(/\/+$/, '');
}

function clinicData(cache = {}) {
  const settings = cache.siteSettings || {};
  const identity = settings.clinic_identity || {};
  const contact = settings.contact || {};
  return {
    name: identity.clinicName || identity.shortName || 'Titanium Roots Dental Clinic',
    description: identity.description || 'Dental implant, prosthodontic, smile design and general dental care.',
    phone: contact.primaryPhone || contact.phone || '+91 98765 43210',
    email: contact.email || contact.appointmentEmail || 'info@titaniumroots.com',
    address: contact.address || '123, Dental Care Street, Anna Nagar, Chennai, Tamil Nadu 600001',
    mapsUrl: contact.mapsUrl || contact.directionsUrl || '',
  };
}

function structuredDataForRoute(cache, route, record) {
  const origin = siteOrigin(cache);
  const clinic = clinicData(cache);
  const pageUrl = record.canonical_url || `${origin}${route === '/' ? '/' : route}`;
  const graph = [
    {
      '@type': 'Dentist',
      '@id': `${origin}/#clinic`,
      name: clinic.name,
      url: origin,
      description: clinic.description,
      telephone: clinic.phone,
      email: clinic.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: clinic.address,
        addressLocality: 'Chennai',
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      },
      areaServed: ['Chennai', 'OMR', 'Karapakkam'],
      medicalSpecialty: ['Prosthodontics', 'Implant dentistry', 'Cosmetic dentistry', 'General dentistry'],
      priceRange: '$$',
      sameAs: clinic.mapsUrl ? [clinic.mapsUrl] : undefined,
    },
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      name: clinic.name,
      url: origin,
      publisher: { '@id': `${origin}/#clinic` },
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: record.meta_title,
      description: record.meta_description,
      isPartOf: { '@id': `${origin}/#website` },
      about: { '@id': `${origin}/#clinic` },
    },
  ];
  if (route.startsWith('/treatments/')) {
    graph.push({
      '@type': 'MedicalWebPage',
      '@id': `${pageUrl}#medicalwebpage`,
      url: pageUrl,
      name: record.meta_title,
      description: record.meta_description,
      specialty: 'Dentistry',
      lastReviewed: new Date(cache.generatedAt || Date.now()).toISOString().slice(0, 10),
    });
  }
  return {
    '@context': 'https://schema.org',
    '@graph': graph.filter(Boolean).map((item) => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined && value !== ''))),
  };
}

function seoMetadataPlugin() {
  return {
    name: 'titanium-roots-seo',
    generateBundle() {
      let cache;
      try {
        cache = JSON.parse(readFileSync(seoCachePath, 'utf8'));
      } catch {
        return;
      }
      const origin = siteOrigin(cache);
      const urls = (cache.records || [])
        .filter((record) => record.include_in_sitemap !== false && record.should_index !== false)
        .map((record) => `  <url><loc>${htmlEscape(record.canonical_url || `${origin}${record.route}`)}</loc></url>`)
        .join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        let cache;
        try {
          cache = JSON.parse(readFileSync(seoCachePath, 'utf8'));
        } catch {
          return html;
        }
        const relativePath = relative(rootDirectory, context.filename || '').replaceAll('\\', '/');
        const route = relativePath === 'index.html' ? '/' : `/${relativePath}`;
        const record = cache.records?.find((item) => item.route === route);
        if (!record) return html;
        const robots = `${record.should_index ? 'index' : 'noindex'}, ${record.should_follow ? 'follow' : 'nofollow'}`;
        const image = record.og_image_path
          ? `${cache.projectUrl}/storage/v1/object/public/cms-media/${record.og_image_path.split('/').map(encodeURIComponent).join('/')}`
          : '';
        const metadata = [
          `<title>${htmlEscape(record.meta_title)}</title>`,
          `<meta name="description" content="${htmlEscape(record.meta_description)}">`,
          `<meta name="robots" content="${robots}">`,
          `<link rel="canonical" href="${htmlEscape(record.canonical_url)}">`,
          `<meta property="og:title" content="${htmlEscape(record.og_title || record.meta_title)}">`,
          `<meta property="og:description" content="${htmlEscape(record.og_description || record.meta_description)}">`,
          `<meta property="og:url" content="${htmlEscape(record.canonical_url)}">`,
          '<meta property="og:type" content="website">',
          image ? `<meta property="og:image" content="${htmlEscape(image)}">` : '',
          '<meta name="twitter:card" content="summary_large_image">',
          `<meta name="twitter:title" content="${htmlEscape(record.og_title || record.meta_title)}">`,
          `<meta name="twitter:description" content="${htmlEscape(record.og_description || record.meta_description)}">`,
          image ? `<meta name="twitter:image" content="${htmlEscape(image)}">` : '',
          `<script type="application/ld+json">${jsonLdEscape(structuredDataForRoute(cache, route, record))}</script>`,
        ].filter(Boolean).join('\n    ');
        return html
          .replace(/<title[\s\S]*?<\/title>/i, '')
          .replace(/<meta\s+(?:name|property)=["'](?:description|robots|twitter:[^"']+|og:[^"']+)["'][^>]*>/gi, '')
          .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
          .replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, '')
          .replace('</head>', `    ${metadata}\n  </head>`);
      },
    },
  };
}

function treatmentPages() {
  return dynamicHtmlPages('treatments', 'treatment');
}

function doctorPages() {
  return dynamicHtmlPages('doctors', 'doctor');
}

function dynamicHtmlPages(directoryName, keyPrefix) {
  const dir = resolve(rootDirectory, directoryName);
  if (!existsSync(dir)) return {};
  const entries = {};

  try {
    const cache = JSON.parse(readFileSync(seoCachePath, 'utf8'));
    (cache.records || []).forEach((record) => {
      const prefix = `/${directoryName}/`;
      if (!record.route?.startsWith(prefix) || !record.route.endsWith('.html')) return;
      const file = record.route.slice(prefix.length);
      const filePath = resolve(dir, file);
      if (existsSync(filePath)) entries[`${keyPrefix}_${file.replace('.html', '')}`] = filePath;
    });
    return entries;
  } catch {
    readdirSync(dir).forEach((file) => {
      if (file.endsWith('.html')) {
        entries[`${keyPrefix}_${file.replace('.html', '')}`] = resolve(dir, file);
      }
    });
    return entries;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDirectory, '');

  return {
  server: {
    proxy: {
      '/supabase-proxy': {
        target: env.VITE_SUPABASE_URL || 'https://pqvhwlflwodbpcmpzetk.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-proxy/, '')
      }
    }
  },
  plugins: [seoMetadataPlugin(), componentAssetsPlugin()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(rootDirectory, 'index.html'),
        about: resolve(rootDirectory, 'about.html'),
        treatments: resolve(rootDirectory, 'treatments.html'),
        ...treatmentPages(),
        doctors: resolve(rootDirectory, 'doctors.html'),
        ...doctorPages(),
        testimonials: resolve(rootDirectory, 'testimonials.html'),
        blog: resolve(rootDirectory, 'blog.html'),
        contact: resolve(rootDirectory, 'contact.html'),
        privacyPolicy: resolve(rootDirectory, 'privacy-policy.html'),
        termsAndConditions: resolve(rootDirectory, 'terms-and-conditions.html'),
        notFound: resolve(rootDirectory, '404.html'),
        adminLogin: resolve(rootDirectory, 'admin/login.html'),
        adminResetPassword: resolve(rootDirectory, 'admin/reset-password.html'),
        adminDashboard: resolve(rootDirectory, 'admin/dashboard.html'),
        adminAppointments: resolve(rootDirectory, 'admin/appointments.html'),
        adminDoctors: resolve(rootDirectory, 'admin/doctors.html'),
        adminTreatments: resolve(rootDirectory, 'admin/treatments.html'),
        adminBlogs: resolve(rootDirectory, 'admin/blogs.html'),
        adminTestimonials: resolve(rootDirectory, 'admin/testimonials.html'),
        adminGallery: resolve(rootDirectory, 'admin/gallery.html'),
        adminSeo: resolve(rootDirectory, 'admin/seo.html'),
        adminSettings: resolve(rootDirectory, 'admin/settings.html'),
        adminAnalytics: resolve(rootDirectory, 'admin/analytics.html'),
      },
    },
  },
  };
});
