import { cpSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { defineConfig } from 'vite';
import { cleanRoute, STATIC_ROUTES } from './assets/js/utils/route-manifest.js';

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
        const generatedPath = relativePath.startsWith('.generated/')
          ? relativePath.replace(/^\.generated\//, '')
          : relativePath;
        const route = generatedPath === 'index.html'
          ? '/'
          : generatedPath.endsWith('/index.html')
            ? `/${generatedPath.replace(/\/index\.html$/, '/')}`
            : `/${generatedPath}`;
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

function generatedPages(directory = resolve(rootDirectory, '.generated')) {
  if (!existsSync(directory)) return {};
  const entries = {};
  const walk = (current) => {
    readdirSync(current, { withFileTypes: true }).forEach((entry) => {
      const entryPath = resolve(current, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        return;
      }
      if (entry.isFile() && entry.name === 'index.html') {
        const key = relative(directory, entryPath)
          .replaceAll('\\', '/')
          .replace(/\/index\.html$/, '')
          .replace(/^index\.html$/, 'home')
          .replace(/[^a-z0-9]+/gi, '_') || 'home';
        entries[`page_${key}`] = entryPath;
      }
      if (entry.isFile() && entry.name === '404.html') entries.notFound = entryPath;
    });
  };
  walk(directory);
  return entries;
}

function finalizeGeneratedOutputPlugin() {
  return {
    name: 'titanium-roots-finalize-generated-output',
    writeBundle(options) {
      const outputDirectory = options.dir || resolve(rootDirectory, 'dist');
      const generatedOutput = resolve(outputDirectory, '.generated');
      if (!existsSync(generatedOutput)) return;
      cpSync(generatedOutput, outputDirectory, { recursive: true, force: true });
      rmSync(generatedOutput, { recursive: true, force: true });
    },
  };
}

function fallbackPages() {
  return {
    home: resolve(rootDirectory, 'index.html'),
    about: resolve(rootDirectory, 'about.html'),
    treatments: resolve(rootDirectory, 'treatments.html'),
    doctors: resolve(rootDirectory, 'doctors.html'),
    testimonials: resolve(rootDirectory, 'testimonials.html'),
    blog: resolve(rootDirectory, 'blog.html'),
    contact: resolve(rootDirectory, 'contact.html'),
    notFound: resolve(rootDirectory, '404.html'),
  };
}

function publicPages() {
  const generated = generatedPages();
  return Object.keys(generated).length ? generated : fallbackPages();
}

function prettyRouteDevFallback() {
  // Dev only: navbar/footer links use production pretty URLs (e.g. /about/, /blog/slug/),
  // but the source files are flat (about.html, treatments.html, ...) until the static
  // build generates the pretty-route directories. Rewrite those paths to the local
  // HTML file so navigation works in `vite dev`.
  const sourceByRoute = new Map();
  STATIC_ROUTES.filter((route) => route.source.endsWith('.html')).forEach((route) => {
    const pretty = cleanRoute(route.route);
    sourceByRoute.set(pretty, `/${route.source}`);
    if (pretty !== '/') sourceByRoute.set(pretty.replace(/\/$/, ''), `/${route.source}`);
  });
  return {
    name: 'titanium-roots-pretty-route-dev-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '/').split('?')[0];
        const source = sourceByRoute.get(pathname);
        if (!source) return next();
        req.url = source;
        next();
      });
    }
  };
}

import galleryApiHandler from './api/gallery.js';

function galleryApiDevPlugin() {
  return {
    name: 'titanium-roots-gallery-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (url === '/api/gallery' || url.startsWith('/api/gallery/')) {
          try {
            await galleryApiHandler(req, res);
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          next();
        }
      });
    }
  };
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
  plugins: [galleryApiDevPlugin(), seoMetadataPlugin(), componentAssetsPlugin(), finalizeGeneratedOutputPlugin(), prettyRouteDevFallback()],
  build: {
    rollupOptions: {
      input: {
        ...publicPages(),
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
