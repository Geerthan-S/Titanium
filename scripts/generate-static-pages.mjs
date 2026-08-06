import { createClient } from '@supabase/supabase-js';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { canonicalUrl, cleanRoute, detailRoute, STATIC_ROUTES } from '../assets/js/utils/route-manifest.js';

try {
  loadEnvFile(resolve('.env'));
} catch {
  // CI and hosting providers inject environment variables directly.
}

const url = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const generatedDirectory = resolve('.generated');
const seoCachePath = resolve('.cache/seo-pages.json');
const requiredBlogArticles = [
  {
    title: 'What to Expect at a Routine Dental Check-up',
    slug: 'what-to-expect-at-a-routine-dental-check-up',
    category: 'Patient Guides',
    tags: ['dental check-up', 'patient guide', 'preventive care'],
    excerpt: 'Learn how concerns, examination findings and care options are discussed during a routine dental check-up.',
    content_html: '<h2>Start with your concerns and history</h2><p>A routine check-up usually begins with a conversation about symptoms, changes you have noticed, previous dental care and relevant health information.</p><h2>The examination</h2><p>The clinician will examine your teeth, gums and mouth. Imaging or other diagnostic checks may be suggested when useful for answering a clinical question.</p><h2>Discussing the plan</h2><p>If care is recommended, you can discuss reasonable options, expected timelines and likely costs before deciding how to proceed.</p>',
    author_name: 'Titanium Roots Clinical Team',
    reviewed_by_name: 'Titanium Roots Clinical Team',
    publish_at: '2026-08-01T03:30:00.000Z',
    status: 'published',
    featured: true,
    trending: true,
    seo_title: 'What to Expect at a Routine Dental Check-up',
    seo_description: 'Learn how concerns, examination findings and care options are discussed during a routine dental check-up.',
    sort_order: 1,
  },
];

const htmlEscape = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function requiredEnv() {
  if (!url || !publishableKey) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required for production generation.');
  }
}

function client() {
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchPublicData() {
  requiredEnv();
  const supabase = client();
  const [seo, treatments, doctors, blogs] = await Promise.all([
    supabase.from('seo_pages').select('*').order('route'),
    supabase.from('treatments').select('*').eq('status', 'published').order('sort_order'),
    supabase.from('doctors').select('*').eq('status', 'published').order('sort_order'),
    supabase.from('blog_posts').select('*').eq('status', 'published').lte('publish_at', new Date().toISOString()).order('publish_at', { ascending: false }),
  ]);

  for (const result of [seo, treatments, doctors, blogs]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    seo: seo.data || [],
    treatments: treatments.data || [],
    doctors: doctors.data || [],
    blogs: mergeRequiredArticles(blogs.data || []),
  };
}

function mergeRequiredArticles(articles) {
  const slugs = new Set(articles.map((article) => article.slug));
  return [
    ...articles,
    ...requiredBlogArticles.filter((article) => !slugs.has(article.slug)),
  ].sort((left, right) => new Date(right.publish_at || 0) - new Date(left.publish_at || 0));
}

function defaultTitle(key) {
  return {
    home: 'Dental Clinic in Anna Nagar, Chennai | Titanium Roots',
    about: 'About Titanium Roots Dental Clinic in Anna Nagar, Chennai',
    treatments: 'Dental Treatments in Anna Nagar, Chennai | Titanium Roots',
    doctors: 'Dentists at Titanium Roots in Anna Nagar, Chennai',
    testimonials: 'Patient Experiences | Titanium Roots',
    blog: 'Dental Health Articles | Titanium Roots Knowledge Center',
    contact: 'Contact Titanium Roots in Anna Nagar, Chennai',
    notFound: 'Page Not Found | Titanium Roots',
  }[key] || 'Titanium Roots Dental Clinic';
}

function defaultDescription(key) {
  return {
    home: 'Modern dental care, priority treatments and appointment support at Titanium Roots in Anna Nagar, Chennai.',
    about: 'Learn about Titanium Roots, patient communication, clinical standards and a calmer dental experience.',
    treatments: 'Explore preventive, restorative, cosmetic, orthodontic, surgical and family dental care at Titanium Roots.',
    doctors: 'Meet the clinicians at Titanium Roots and review qualifications, clinical interests and languages.',
    testimonials: 'Genuine patient experiences published only after review and consent.',
    blog: 'Practical doctor-reviewed dental health guides from Titanium Roots Knowledge Center.',
    contact: 'Request an appointment, call, chat on WhatsApp, view opening hours and get directions.',
    notFound: 'The requested Titanium Roots page was not found.',
  }[key] || 'Modern dental care at Titanium Roots.';
}

function staticSeoRecords(records) {
  return STATIC_ROUTES.map((route) => {
    const existing = records.find((item) => cleanRoute(item.route) === route.route || item.route === route.source || item.route === `/${route.source}`);
    const title = existing?.meta_title || defaultTitle(route.key);
    const description = existing?.meta_description || defaultDescription(route.key);
    return {
      route: route.route,
      source: route.route === '/' ? '.generated/index.html' : route.route === '/404.html' ? '.generated/404.html' : `.generated${route.route}index.html`,
      meta_title: title,
      meta_description: description,
      canonical_url: canonicalUrl(route.route),
      og_title: existing?.og_title || title,
      og_description: existing?.og_description || description,
      og_image_path: existing?.og_image_path || '',
      should_index: route.noindex ? false : existing?.should_index !== false,
      should_follow: existing?.should_follow !== false,
      include_in_sitemap: !route.noindex && existing?.include_in_sitemap !== false,
    };
  });
}

function treatmentSeo(treatment) {
  const route = detailRoute('treatments', treatment.slug);
  return {
    route,
    source: `.generated/treatments/${treatment.slug}/index.html`,
    meta_title: `${treatment.name} in Anna Nagar, Chennai | Titanium Roots`,
    meta_description: treatment.seo_description || treatment.short_description || `Learn about ${treatment.name} assessment and care at Titanium Roots.`,
    canonical_url: canonicalUrl(route),
    og_title: `${treatment.name} | Titanium Roots`,
    og_description: treatment.short_description || '',
    og_image_path: treatment.image_path || '',
    should_index: treatment.allow_search_indexing !== false,
    should_follow: true,
    include_in_sitemap: treatment.allow_search_indexing !== false && treatment.sitemap_status === 'Included',
    lastmod: treatment.updated_at || treatment.created_at,
  };
}

function blogSeo(article) {
  const route = detailRoute('blog', article.slug);
  const rawTitle = article.seo_title || article.title;
  const metaTitle = /\|\s*Titanium Roots/i.test(rawTitle) ? rawTitle : `${rawTitle} | Titanium Roots`;
  return {
    route,
    source: `.generated/blog/${article.slug}.html`,
    meta_title: metaTitle,
    meta_description: article.seo_description || article.excerpt,
    canonical_url: canonicalUrl(route),
    og_title: article.seo_title || article.title,
    og_description: article.seo_description || article.excerpt,
    og_image_path: article.image_path || '',
    should_index: !article.noindex,
    should_follow: true,
    include_in_sitemap: !article.noindex,
    lastmod: article.updated_at || article.publish_at,
  };
}

function doctorSeo(doctor) {
  const route = detailRoute('doctors', doctor.slug);
  return {
    route,
    source: `.generated/doctors/${doctor.slug}/index.html`,
    meta_title: `${doctor.name} | Titanium Roots Dental Clinic`,
    meta_description: doctor.short_bio || doctor.biography?.slice(0, 150) || `View ${doctor.name}'s profile at Titanium Roots Dental Clinic.`,
    canonical_url: canonicalUrl(route),
    og_title: `${doctor.name} | Titanium Roots`,
    og_description: doctor.short_bio || doctor.designation || '',
    og_image_path: doctor.portrait_path || '',
    should_index: true,
    should_follow: true,
    include_in_sitemap: true,
    lastmod: doctor.updated_at || doctor.created_at,
  };
}

async function renderTemplate(templatePath, outPath, payload, metadata) {
  const template = await readFile(resolve(templatePath), 'utf8');
  const html = withStaticContent(templatePath, template, payload)
    .replaceAll('__PAGE_DATA__', htmlEscape(JSON.stringify(payload)))
    .replaceAll('__META_TITLE__', htmlEscape(metadata.meta_title))
    .replaceAll('__META_DESCRIPTION__', htmlEscape(metadata.meta_description))
    .replaceAll('__CANONICAL_URL__', htmlEscape(metadata.canonical_url))
    .replaceAll('__OG_TITLE__', htmlEscape(metadata.og_title))
    .replaceAll('__OG_DESCRIPTION__', htmlEscape(metadata.og_description))
    .replaceAll('__ROBOTS__', `${metadata.should_index ? 'index' : 'noindex'}, ${metadata.should_follow ? 'follow' : 'nofollow'}`);
  await mkdir(dirname(resolve(outPath)), { recursive: true });
  await writeFile(resolve(outPath), html, 'utf8');
}

function withStaticContent(templatePath, template, payload) {
  if (templatePath.includes('treatment-detail')) {
    return template.replace(
      '<article class="treatment-detail" data-treatment-detail></article>',
      `<article class="treatment-detail" data-treatment-detail><header class="treatments-hero"><div class="container"><p class="section-eyebrow">${htmlEscape(payload.category)}</p><h1>${htmlEscape(payload.name)}</h1><p>${htmlEscape(payload.full_description || payload.short_description)}</p></div></header></article>`,
    );
  }
  if (templatePath.includes('blog-article')) {
    return template.replace(
      '<article class="article-page" data-blog-article></article>',
      `<article class="article-page" data-blog-article><header class="blog-hero"><div class="container"><p class="section-eyebrow">${htmlEscape(payload.category)}</p><h1>${htmlEscape(payload.title)}</h1><p>${htmlEscape(payload.excerpt)}</p><div class="blog-card__meta"><span>${htmlEscape(payload.author_name || 'Titanium Roots Clinical Team')}</span><span>Reviewed by ${htmlEscape(payload.reviewed_by_name || 'Titanium Roots Clinical Team')}</span></div></div></header><section class="container article-modal__content">${payload.content_html || ''}</section><footer class="container article-modal__disclaimer">This content is for general education and does not replace a clinical dental consultation.</footer></article>`,
    );
  }
  return template;
}

async function generateSitemap(records) {
  const urls = records
    .filter((record) => record.include_in_sitemap && record.should_index)
    .map((record) => {
      const lastmod = record.lastmod ? `\n    <lastmod>${new Date(record.lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
      return `  <url>\n    <loc>${htmlEscape(record.canonical_url)}</loc>${lastmod}\n  </url>`;
    })
    .join('\n');
  await writeFile(resolve('public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');
}

async function copyBasePages() {
  for (const route of STATIC_ROUTES) {
    const target = route.route === '/' ? '.generated/index.html' : route.route === '/404.html' ? '.generated/404.html' : `.generated${route.route}index.html`;
    await mkdir(dirname(resolve(target)), { recursive: true });
    await cp(resolve(route.source), resolve(target));
  }
}

async function main() {
  const data = await fetchPublicData();
  await rm(generatedDirectory, { recursive: true, force: true });
  await mkdir(resolve('.cache'), { recursive: true });
  await mkdir(generatedDirectory, { recursive: true });
  await copyBasePages();

  const records = [
    ...staticSeoRecords(data.seo),
    ...data.treatments.map(treatmentSeo),
    ...data.doctors.map(doctorSeo),
    ...data.blogs.map(blogSeo),
  ];

  for (const treatment of data.treatments) {
    await renderTemplate('templates/treatment-detail.html', `.generated/treatments/${treatment.slug}/index.html`, treatment, treatmentSeo(treatment));
  }
  for (const doctor of data.doctors) {
    await renderTemplate('templates/doctor-profile.html', `.generated/doctors/${doctor.slug}/index.html`, doctor, doctorSeo(doctor));
  }
  for (const article of data.blogs) {
    await renderTemplate('templates/blog-article.html', `.generated/blog/${article.slug}.html`, article, blogSeo(article));
  }

  await generateSitemap(records);
  await writeFile(seoCachePath, JSON.stringify({ generatedAt: new Date().toISOString(), projectUrl: 'https://titaniumroots.com', records }, null, 2), 'utf8');
  console.log(`Generated ${records.length} route records.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
