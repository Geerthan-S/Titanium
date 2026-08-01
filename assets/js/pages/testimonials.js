import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { escapeHtml } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';

const placeholder = '/assets/images/placeholders/clinic-neutral.svg';
let testimonials = [];
let loadFailed = false;

function renderTestimonials() {
  const grid = document.querySelector('[data-testimonials-grid]');
  const empty = document.querySelector('[data-testimonials-empty]');
  const error = document.querySelector('[data-testimonials-error]');
  if (!grid || !empty || !error) return;
  empty.hidden = loadFailed || testimonials.length !== 0;
  error.hidden = !loadFailed;
  grid.innerHTML = testimonials.map((item) => `<article class="testimonial-page-card">
    <div class="testimonial-page-card__rating" aria-label="${escapeHtml(item.rating)} out of 5 stars">${'★'.repeat(Number(item.rating))}</div>
    <blockquote>${escapeHtml(item.review)}</blockquote>
    <footer><img src="${item.image ? publicMediaUrl(item.image) : placeholder}" alt=""><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.treatment)}</span></div></footer>
  </article>`).join('');
  createIcons({ icons: ICON_SET });
}

export async function initializeTestimonials() {
  if (document.body.dataset.testimonialsInitialized) return;
  document.body.dataset.testimonialsInitialized = 'true';
  try {
    testimonials = await loadPublicContent('testimonials');
    loadFailed = false;
  } catch {
    testimonials = [];
    loadFailed = true;
  }
  renderTestimonials();
  onPublicContent('testimonials', ({ status, data }) => {
    if (status !== 'ready') return;
    testimonials = data;
    loadFailed = false;
    renderTestimonials();
  });
  subscribePublicContent('testimonials');
}
