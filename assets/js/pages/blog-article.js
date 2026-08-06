import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { loadComponents } from '../components/component-loader.js';
import { escapeHtml, sanitizeCmsHtml } from '../data/record-mappers.js';

const safe = (value) => escapeHtml(value || '');

function pageData() {
  return JSON.parse(document.getElementById('page-data')?.textContent || '{}');
}

function readTime(content) {
  const words = String(content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function schemaFor(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    author: { '@type': 'Organization', name: article.author_name || 'Titanium Roots Clinical Team' },
    datePublished: article.publish_at,
    dateModified: article.updated_at || article.publish_at,
    publisher: { '@type': 'Dentist', name: 'Titanium Roots Dental Clinic' },
  };
}

function renderArticle(article) {
  const mount = document.querySelector('[data-blog-article]');
  if (!mount) return;
  mount.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><a href="/blog/">Knowledge Center</a><strong>${safe(article.title)}</strong></nav>
    <header class="blog-hero">
      <div class="container">
        <p class="section-eyebrow">${safe(article.category)}</p>
        <h1>${safe(article.title)}</h1>
        <p>${safe(article.deck || article.excerpt)}</p>
        <div class="blog-card__meta">
          <span>${safe(article.author_name || 'Titanium Roots Clinical Team')}</span>
          <span>Reviewed by ${safe(article.reviewer_name || 'Titanium Roots Clinical Team')}</span>
          <span>${readTime(article.content_html)}</span>
        </div>
      </div>
    </header>
    <section class="container article-modal__content">${sanitizeCmsHtml(article.content_html)}</section>
    <footer class="container article-modal__disclaimer">This content is for general education and does not replace a clinical dental consultation.</footer>
  `;
  document.querySelector('[data-schema-json]').textContent = JSON.stringify(schemaFor(article));
  createIcons({ icons: ICON_SET });
}

async function initializeBlogArticle() {
  await loadComponents();
  renderArticle(pageData());
  document.querySelector('.page-loader')?.classList.add('is-hidden');
}

initializeBlogArticle();
