import { gsap } from 'gsap';
import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { openModal } from '../components/modal.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { escapeHtml, sanitizeCmsHtml } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';
import { SITE_CONFIG } from '../utils/constants.js';

const placeholder = '/assets/images/placeholders/clinic-neutral.svg';
const resources = [
  ['Treatment Information', 'Browse clear information about treatments offered by the clinic.', 'badge-plus', '/treatments.html'],
  ['Meet the Doctors', 'Learn about the clinic team and their areas of care.', 'users-round', '/doctors.html'],
  ['Book an Appointment', 'Send your preferred date and consultation details.', 'calendar-days', '/contact.html'],
];
let articles = [];
let activeCategory = 'All Articles';
let query = '';
let visibleCount = 6;

const safe = (value) => escapeHtml(value || '');
const tagsFor = (article) => String(article.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
const readTime = (content) => {
  const words = String(content || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

function normalizeArticle(article) {
  return {
    ...article,
    featuredImage: article.image ? publicMediaUrl(article.image) : placeholder,
    content: sanitizeCmsHtml(article.content),
    publishedAt: article.publishDate,
    readTime: readTime(article.content),
    tags: tagsFor(article),
  };
}

export async function initializeBlog() {
  if (document.body.dataset.blogInitialized) return;
  document.body.dataset.blogInitialized = 'true';
  document.querySelector('[data-breadcrumb-current]')?.replaceChildren('Blog');
  try {
    articles = (await loadPublicContent('blogs')).map(normalizeArticle);
  } catch {
    articles = [];
  }
  onPublicContent('blogs', ({ status, data }) => {
    if (status !== 'ready') return;
    articles = data.map(normalizeArticle);
    renderAllContent();
  });
  subscribePublicContent('blogs');
  renderHero();
  renderAllContent();
  renderResources();
  createIcons({ icons: ICON_SET });
  bindInteractions();
  initializeAnimations();
}

function renderAllContent() {
  renderFeatured();
  renderFilters();
  renderArticles();
  renderTrending();
  renderAuthors();
  createIcons({ icons: ICON_SET });
}

function renderHero() {
  const trust = document.querySelector('[data-blog-hero-trust]');
  if (trust) trust.innerHTML = [
    ['shield-check', 'Clinic-Published Content'],
    ['message-circle', 'Clear Patient Education'],
    ['stethoscope', 'Treatment Guidance'],
    ['sparkles', 'Useful Information'],
  ].map(([icon, label]) => `<div><i data-lucide="${icon}" aria-hidden="true"></i><span>${label}</span></div>`).join('');
  const statistics = document.querySelector('[data-blog-statistics]');
  if (statistics) statistics.innerHTML = [
    ['Published Articles', articles.length, 'badge-plus'],
    ['Article Categories', new Set(articles.map((article) => article.category)).size, 'sparkles'],
    ['Contributors', new Set(articles.map((article) => article.author).filter(Boolean)).size, 'users-round'],
  ].map(([label, value, icon]) => `<article><i data-lucide="${icon}" aria-hidden="true"></i><div><strong>${value}</strong><span>${label}</span></div></article>`).join('');
}

function articleMeta(article) {
  const published = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return `<span>${safe(article.category)}</span>${published ? `<time datetime="${safe(article.publishedAt)}">${published}</time>` : ''}<span>${article.readTime}</span>`;
}

function articleCard(article) {
  return `<article class="blog-card" id="${safe(article.slug)}">
    <div class="blog-card__media"><img src="${article.featuredImage}" width="1600" height="1000" loading="lazy" alt="${safe(article.imageAlt || article.title)}"></div>
    <div class="blog-card__body"><p class="blog-card__category">${safe(article.category)}</p><h3>${safe(article.title)}</h3><p>${safe(article.excerpt)}</p><div class="blog-card__meta">${articleMeta(article)}</div><button class="text-link" type="button" data-article-open="${safe(article.id)}">Read Article <i data-lucide="arrow-right" aria-hidden="true"></i></button></div>
  </article>`;
}

function renderFeatured() {
  const mount = document.querySelector('[data-blog-featured]');
  const section = mount?.closest('.blog-featured');
  const article = articles.find((item) => item.featured);
  if (section) section.hidden = !article;
  if (!mount || !article) return;
  mount.innerHTML = `<article class="blog-featured__card"><div class="blog-featured__content"><p class="section-eyebrow">Featured Article</p><p class="blog-featured__category">${safe(article.category)}</p><h2 id="featured-title">${safe(article.title)}</h2><p>${safe(article.excerpt)}</p><div class="blog-card__meta">${articleMeta(article)}</div><button class="button" type="button" data-article-open="${safe(article.id)}">Read Article <i data-lucide="arrow-right" aria-hidden="true"></i></button></div><div class="blog-featured__media"><img src="${article.featuredImage}" width="1600" height="900" alt="${safe(article.imageAlt || article.title)}"></div></article>`;
}

function renderFilters() {
  const mount = document.querySelector('[data-blog-filters]');
  if (!mount) return;
  const categories = ['All Articles', ...new Set(articles.map((article) => article.category).filter(Boolean))];
  if (!categories.includes(activeCategory)) activeCategory = 'All Articles';
  mount.innerHTML = categories.map((category) => `<button type="button" data-blog-filter="${safe(category)}" aria-pressed="${category === activeCategory}">${safe(category)}</button>`).join('');
}

function currentArticles() {
  return articles.filter((article) => {
    const searchable = `${article.title} ${article.excerpt} ${article.category} ${article.tags.join(' ')}`.toLowerCase();
    return (activeCategory === 'All Articles' || article.category === activeCategory) && searchable.includes(query);
  });
}

function renderArticles() {
  const matched = currentArticles();
  const shown = matched.slice(0, visibleCount);
  const grid = document.querySelector('[data-blog-grid]');
  if (grid) grid.innerHTML = `${shown.map(articleCard).join('')}${matched.length > visibleCount ? '<button class="blog-load-more button button--secondary" type="button" data-blog-load-more>Load More Articles</button>' : ''}`;
  const count = document.querySelector('[data-blog-result-count]');
  if (count) count.textContent = `${matched.length} article${matched.length === 1 ? '' : 's'} available`;
  const empty = document.querySelector('[data-blog-empty]');
  if (empty) empty.hidden = Boolean(matched.length);
  createIcons({ icons: ICON_SET });
}

function renderTrending() {
  const mount = document.querySelector('[data-blog-trending]');
  if (!mount) return;
  const trending = articles.filter((article) => article.trending);
  mount.hidden = !trending.length;
  if (!trending.length) return;
  mount.innerHTML = `<p class="section-eyebrow">Trending Articles</p><h2>Popular Patient <span>Topics</span></h2><ol>${trending.map((article, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><button type="button" data-article-open="${safe(article.id)}"><strong>${safe(article.title)}</strong><small>${safe(article.category)}</small></button></li>`).join('')}</ol>`;
}

function renderAuthors() {
  const mount = document.querySelector('[data-blog-authors]');
  if (!mount) return;
  const authors = [...new Set(articles.map((article) => article.author).filter(Boolean))];
  const section = mount.closest('section');
  if (section) section.hidden = !authors.length;
  mount.innerHTML = authors.map((author) => `<article class="author-card"><div><h3>${safe(author)}</h3><p>Clinic contributor</p><button class="text-link" type="button" data-author-filter="${safe(author)}">View Articles <i data-lucide="arrow-right" aria-hidden="true"></i></button></div></article>`).join('');
}

function renderResources() {
  const mount = document.querySelector('[data-blog-resources]');
  if (mount) mount.innerHTML = resources.map(([title, copy, icon, href]) => `<article class="resource-card"><i data-lucide="${icon}" aria-hidden="true"></i><h3>${title}</h3><p>${copy}</p><a class="button button--secondary" href="${href}">Explore</a></article>`).join('');
}

function renderArticleModal(article) {
  const target = document.querySelector('[data-article-modal-content]');
  if (!target || !article) return;
  const related = articles.filter((item) => item.id !== article.id).slice(0, 2);
  target.innerHTML = `<div class="article-modal__media"><img src="${article.featuredImage}" width="1600" height="900" alt="${safe(article.imageAlt || article.title)}"></div><p class="article-modal__category">${safe(article.category)}</p><h2 id="article-modal-title">${safe(article.title)}</h2><p class="article-modal__excerpt">${safe(article.excerpt)}</p><div class="blog-card__meta">${articleMeta(article)}${article.author ? `<span>${safe(article.author)}</span>` : ''}</div><div class="article-modal__content">${article.content}</div><div class="article-modal__tags">${article.tags.map((tag) => `<span>${safe(tag)}</span>`).join('')}</div><p class="article-modal__disclaimer">This content is for general education and does not replace a clinical dental consultation.</p><div class="article-modal__actions"><button class="button" type="button" data-modal-open="appointment-modal">Book Consultation <i data-lucide="calendar-days" aria-hidden="true"></i></button><a class="button button--secondary" href="https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello Titanium Roots Dental Clinic,\n\nI have a question about a dental article.')}" target="_blank" rel="noopener noreferrer">WhatsApp Question <i data-lucide="message-circle" aria-hidden="true"></i></a></div><section class="article-modal__related"><h3>Related Articles</h3>${related.map((item) => `<button type="button" data-article-open="${safe(item.id)}">${safe(item.title)}<i data-lucide="arrow-right" aria-hidden="true"></i></button>`).join('')}</section>`;
  createIcons({ icons: ICON_SET });
}

function bindInteractions() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-blog-load-more]')) {
      visibleCount += 6;
      renderArticles();
    }
    const filter = event.target.closest('[data-blog-filter]');
    if (filter) {
      activeCategory = filter.dataset.blogFilter;
      renderFilters();
      renderArticles();
    }
    const authorFilter = event.target.closest('[data-author-filter]');
    if (authorFilter) {
      query = authorFilter.dataset.authorFilter.toLowerCase();
      const input = document.querySelector('[data-blog-search]');
      if (input) input.value = authorFilter.dataset.authorFilter;
      renderArticles();
    }
    if (event.target.closest('[data-blog-reset]')) {
      activeCategory = 'All Articles';
      query = '';
      const input = document.querySelector('[data-blog-search]');
      if (input) input.value = '';
      renderFilters();
      renderArticles();
    }
    const trigger = event.target.closest('[data-article-open]');
    if (trigger) {
      const article = articles.find((item) => String(item.id) === trigger.dataset.articleOpen);
      if (article) {
        renderArticleModal(article);
        openModal(document.querySelector('#article-detail-modal'), trigger);
      }
    }
  });
  document.querySelector('[data-blog-search-form]')?.addEventListener('submit', (event) => event.preventDefault());
  document.querySelector('[data-blog-search]')?.addEventListener('input', (event) => {
    query = event.target.value.trim().toLowerCase();
    renderArticles();
  });
  const newsletter = document.querySelector('.blog-newsletter');
  if (newsletter) newsletter.hidden = true;
}

function initializeAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.from('[data-blog-hero-heading], [data-blog-hero-copy]', { y: 20, opacity: 0, duration: 0.55, stagger: 0.1 });
}
