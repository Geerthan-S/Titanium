export const SITE_ORIGIN = 'https://titaniumroots.com';

export const STATIC_ROUTES = Object.freeze([
  { key: 'home', route: '/', source: 'index.html' },
  { key: 'about', route: '/about/', source: 'about.html' },
  { key: 'treatments', route: '/treatments/', source: 'treatments.html' },
  { key: 'doctors', route: '/doctors/', source: 'doctors.html' },
  { key: 'testimonials', route: '/testimonials/', source: 'testimonials.html' },
  { key: 'blog', route: '/blog/', source: 'blog.html' },
  { key: 'contact', route: '/contact/', source: 'contact.html' },
  { key: 'notFound', route: '/404.html', source: '404.html', noindex: true },
]);

export function cleanRoute(path = '/') {
  const value = String(path || '/').trim();
  if (value === '/' || value === '/index.html') return '/';
  if (value.startsWith('/blog/') && value.endsWith('.html') && value !== '/blog/index.html') return value;
  if (value.endsWith('.html')) return value.replace(/(?:index)?\.html$/, '').replace(/\/?$/, '/');
  return value.endsWith('/') ? value : `${value}/`;
}

export function canonicalUrl(path = '/') {
  return `${SITE_ORIGIN}${cleanRoute(path)}`;
}

export function detailRoute(collection, slug) {
  const safeSlug = String(slug || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safeSlug)) {
    throw new Error(`Invalid slug for ${collection}: ${slug}`);
  }
  if (collection === 'blog') return `/${collection}/${safeSlug}.html`;
  return `/${collection}/${safeSlug}/`;
}
