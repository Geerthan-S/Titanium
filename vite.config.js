import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { defineConfig } from 'vite';

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

function seoMetadataPlugin() {
  return {
    name: 'titanium-roots-seo',
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
        ].filter(Boolean).join('\n    ');
        return html
          .replace(/<title[\s\S]*?<\/title>/i, '')
          .replace(/<meta\s+(?:name|property)=["'](?:description|robots|og:[^"']+)["'][^>]*>/gi, '')
          .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
          .replace('</head>', `    ${metadata}\n  </head>`);
      },
    },
  };
}

function treatmentPages() {
  const dir = resolve(rootDirectory, 'treatments');
  if (!existsSync(dir)) return {};
  const entries = {};
  readdirSync(dir).forEach((file) => {
    if (file.endsWith('.html')) {
      entries[`treatment_${file.replace('.html', '')}`] = resolve(dir, file);
    }
  });
  return entries;
}

function doctorPages() {
  const dir = resolve(rootDirectory, 'doctors');
  if (!existsSync(dir)) return {};
  const entries = {};
  readdirSync(dir).forEach((file) => {
    if (file.endsWith('.html')) {
      entries[`doctor_${file.replace('.html', '')}`] = resolve(dir, file);
    }
  });
  return entries;
}

export default defineConfig({
  server: {
    proxy: {
      '/supabase-proxy': {
        target: process.env.VITE_SUPABASE_URL || 'https://pqvhwlflwodbpcmpzetk.supabase.co',
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
});
