import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { stockMedia } from '../data/media-assets.js';
import { escapeHtml, richTextSegments } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';

const placeholder = stockMedia.patient;
const videoPoster = stockMedia.video;
let testimonials = [];
let treatments = [];
let loadFailed = false;

const safe = (value) => escapeHtml(value || '');
const hiddenTestimonials = [
  'hesitant about getting dental implants',
  'dr. rajesh kumar',
  'finally smile confidently again',
  'priya sharma transformed my smile with invisalign',
  'orthodontic treatment',
];

function shouldHideTestimonial(item) {
  const searchable = `${item.name || ''} ${item.treatment || ''} ${item.review || ''} ${item.doctorName || ''}`.toLowerCase();
  return hiddenTestimonials.some((text) => searchable.includes(text));
}

function renderTestimonials() {
  const collectionSection = document.querySelector('[data-testimonials-collection]');
  const grid = document.querySelector('[data-testimonials-grid]');
  const empty = document.querySelector('[data-testimonials-empty]');
  const error = document.querySelector('[data-testimonials-error]');
  const videosSection = document.querySelector('[data-testimonials-videos]');
  const videoMount = document.querySelector('[data-testimonials-video-mount]');

  if (loadFailed) {
    if (collectionSection) collectionSection.hidden = false;
    if (empty) empty.hidden = true;
    if (error) error.hidden = false;
    if (grid) grid.hidden = true;
    if (videosSection) videosSection.hidden = true;
    return;
  }

  testimonials = testimonials.filter(item =>
    String(item.consentStatus).toLowerCase() === 'confirmed' &&
    String(item.moderationStatus).toLowerCase() === 'approved' &&
    item.publicationPermission === true &&
    ['published', 'active'].includes(String(item.status).toLowerCase()) &&
    !shouldHideTestimonial(item)
  );

  if (empty) empty.hidden = loadFailed || testimonials.length !== 0;
  if (error) error.hidden = !loadFailed;

  if (testimonials.length === 0) {
    if (collectionSection) collectionSection.hidden = true;
    if (videosSection) videosSection.hidden = true;
    return;
  }

  // Active content state
  if (collectionSection) collectionSection.hidden = false;
  if (grid) grid.hidden = false;

  const videos = testimonials.filter(item => item.videoUrl);
  if (videos.length > 0 && videosSection && videoMount) {
    videosSection.hidden = false;
    videoMount.innerHTML = videos.map(v => `
      <article class="video-card" style="background:var(--color-surface); border-radius:8px; overflow:hidden; display:flex; flex-direction:column;">
        <video src="${safe(v.videoUrl)}" poster="${v.videoThumbnail ? publicMediaUrl(v.videoThumbnail) : videoPoster}" controls preload="none" style="width:100%; object-fit:cover; aspect-ratio:16/9;"></video>
        <div class="video-card__info" style="padding:16px;">
           <strong style="display:block; color:var(--color-heading); font-family:var(--font-heading);">${safe(v.name)}</strong>
           <span style="font-size:0.875rem; color:var(--color-muted);">${safe(v.treatment)}</span>
        </div>
      </article>
    `).join('');
  } else if (videosSection) {
    videosSection.hidden = true;
  }

  if (grid) {
    grid.innerHTML = testimonials.map((item) => `
    <article class="testimonial-page-card">
      <div class="author-initials">${safe(item.name).split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
      <blockquote>"${richTextSegments(item.review).replace(/<[^>]+>/g, '')}"</blockquote>
      <footer>
        <div>
           <strong>${safe(item.treatment)}</strong>
           <span>${new Date(item.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </div>
        <a href="/contact.html" class="read-story-link">Ask About This Treatment <i data-lucide="arrow-right"></i></a>
      </footer>
    </article>`).join('');
  }

  createIcons({ icons: ICON_SET });
}

function renderTransformations() {
  const mount = document.querySelector('[data-transformations]');
  const section = mount?.closest('section');
  if (!treatments || !treatments.length) {
    if (section) section.hidden = true;
    return;
  }

  const withImages = treatments.filter((treatment) => {
    const isApproved = String(treatment.status).toLowerCase() === 'published' || String(treatment.status).toLowerCase() === 'active';
    return treatment.image && treatment.beforeImage && isApproved && treatment.consentStatus === 'confirmed';
  }).slice(0, 5);

  if (section) section.hidden = !withImages.length;
  if (!withImages.length || !mount) return;

  mount.innerHTML = withImages.map((treatment) => {
    const beforeSrc = publicMediaUrl(treatment.beforeImage);
    const afterSrc = publicMediaUrl(treatment.image);
    const alt = safe(treatment.imageAlt || treatment.name);
    return `
    <article class="transformation-card">
      <div class="transformation-slider" data-before-after>
        <img class="transformation-slider__before" src="${beforeSrc}" width="1200" height="900" loading="lazy" alt="Before ${alt}">
        <img class="transformation-slider__after" src="${afterSrc}" width="1200" height="900" loading="lazy" alt="After ${alt}">
        <input type="range" min="0" max="100" value="50" class="transformation-slider__range" aria-label="Compare before and after">
        <div class="transformation-slider__divider"></div>
        <div class="transformation-labels">
          <span>Before</span>
          <span>After</span>
        </div>
      </div>
      <h3>${safe(treatment.name)}</h3>
    </article>`;
  }).join('');

  document.querySelectorAll('[data-before-after]').forEach((slider) => {
    const range = slider.querySelector('input[type="range"]');
    const afterImg = slider.querySelector('.transformation-slider__after');
    const divider = slider.querySelector('.transformation-slider__divider');
    const updateSlider = () => {
      const value = range.value;
      afterImg.style.clipPath = `inset(0 0 0 ${value}%)`;
      divider.style.left = `${value}%`;
    };
    range.addEventListener('input', updateSlider);
    updateSlider();
  });
}

export async function initializeTestimonials() {
  if (document.body.dataset.testimonialsInitialized) return;
  document.body.dataset.testimonialsInitialized = 'true';
  try {
    const [testimonialsData, treatmentsData] = await Promise.all([
      loadPublicContent('testimonials'),
      loadPublicContent('treatments').catch(() => [])
    ]);
    testimonials = testimonialsData;
    treatments = treatmentsData;
    loadFailed = false;
  } catch {
    testimonials = [];
    loadFailed = true;
  }
  renderTestimonials();
  renderTransformations();

  onPublicContent('testimonials', ({ status, data }) => {
    if (status !== 'ready') return;
    testimonials = data;
    loadFailed = false;
    renderTestimonials();
  });
  subscribePublicContent('testimonials');
}
