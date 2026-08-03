import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { escapeHtml, richTextSegments } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';

const placeholder = '/assets/images/placeholders/clinic-neutral.svg';
let testimonials = [];
let treatments = [];
let loadFailed = false;

const safe = (value) => escapeHtml(value || '');

function renderTestimonials() {
  const collectionSection = document.querySelector('[data-testimonials-collection]');
  const grid = document.querySelector('[data-testimonials-grid]');
  const empty = document.querySelector('[data-testimonials-empty]');
  const error = document.querySelector('[data-testimonials-error]');
  const featuredSection = document.querySelector('[data-testimonials-featured]');
  const featuredMount = document.querySelector('[data-testimonials-featured-mount]');
  const videosSection = document.querySelector('[data-testimonials-videos]');
  const videoMount = document.querySelector('[data-testimonials-video-mount]');

  if (loadFailed) {
    if (collectionSection) collectionSection.hidden = false;
    if (empty) empty.hidden = true;
    if (error) error.hidden = false;
    if (grid) grid.hidden = true;
    if (featuredSection) featuredSection.hidden = true;
    if (videosSection) videosSection.hidden = true;
    return;
  }

  const approved = testimonials.filter(item =>
    String(item.consentStatus).toLowerCase() === 'confirmed' &&
    String(item.moderationStatus).toLowerCase() === 'approved' &&
    item.publicationPermission === true &&
    ['published', 'active'].includes(String(item.status).toLowerCase())
  );

  if (approved.length === 0) {
    if (collectionSection) collectionSection.hidden = true;
    if (featuredSection) featuredSection.hidden = true;
    if (videosSection) videosSection.hidden = true;
    if (empty) empty.hidden = false;
    return;
  }

  // Active content state
  if (empty) empty.hidden = true;
  if (error) error.hidden = true;
  if (collectionSection) collectionSection.hidden = false;
  if (grid) grid.hidden = false;

  const featured = approved.find(item => item.featured) || null;
  const remaining = featured ? approved.filter(item => item.id !== featured.id) : approved;

  if (featured && featuredSection && featuredMount) {
    featuredSection.hidden = false;
    featuredMount.innerHTML = `
      <article class="featured-story">
        <div class="featured-story__image">
           <img src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600" alt="Titanium Roots patient suite">
        </div>
        <div class="featured-story__content">
          <div class="featured-story__quote">
            <span class="quote-mark">“</span>
            <blockquote>${richTextSegments(featured.review)}</blockquote>
          </div>
          <div class="featured-story__footer">
            <div class="author-avatar">${safe(featured.name).split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
            <div class="author-details">
               <strong>${safe(featured.treatment)}</strong>
               <span>Treated by ${featured.doctorName || 'Dr. Priya Mehta'}</span>
            </div>
            <div class="consent-badge">
               <i data-lucide="shield-check"></i> Consent Approved
            </div>
          </div>
        </div>
      </article>
    `;
  } else if (featuredSection) {
    featuredSection.hidden = true;
  }

  const videos = approved.filter(item => item.videoUrl);
  if (videos.length > 0 && videosSection && videoMount) {
    videosSection.hidden = false;
    videoMount.innerHTML = videos.map(v => `
      <article class="video-card" style="background:var(--color-surface); border-radius:8px; overflow:hidden; display:flex; flex-direction:column;">
        <video src="${safe(v.videoUrl)}" poster="${v.videoThumbnail ? publicMediaUrl(v.videoThumbnail) : ''}" controls preload="none" style="width:100%; object-fit:cover; aspect-ratio:16/9;"></video>
        <div class="video-card__info" style="padding:16px;">
           <strong style="display:block; color:var(--color-heading); font-family:var(--font-heading);">${safe(v.name)}</strong>
           <span style="font-size:0.875rem; color:var(--color-muted);">${safe(v.treatment)}</span>
        </div>
      </article>
    `).join('');
  } else if (videosSection) {
    videosSection.hidden = true;
  }

  if (remaining.length > 0 && grid) {
    grid.innerHTML = remaining.map((item) => `
    <article class="testimonial-page-card">
      <div class="author-initials">${safe(item.name).split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
      <blockquote>"${richTextSegments(item.review).replace(/<[^>]+>/g, '')}"</blockquote>
      <footer>
        <div>
           <strong>${safe(item.treatment)}</strong>
           <span>${new Date(item.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </div>
        <a href="#" class="read-story-link">Read Story <i data-lucide="arrow-right"></i></a>
      </footer>
    </article>`).join('');
  }

  createIcons({ icons: ICON_SET });
}

function renderTransformations() {
  const mount = document.querySelector('[data-transformations]');
  const section = mount?.closest('section');
  if (!treatments || !treatments.length) return;

  const withImages = treatments.filter((treatment) => {
    const isApproved = String(treatment.status).toLowerCase() === 'published' || String(treatment.status).toLowerCase() === 'active';
    return treatment.image && isApproved; // Further transformation verification would use specific consent logic on a transformation schema
  }).slice(0, 5);

  if (section) section.hidden = !withImages.length;
  if (!withImages.length || !mount) return;

  mount.innerHTML = withImages.map((treatment) => {
    const src = publicMediaUrl(treatment.image);
    const alt = safe(treatment.imageAlt || treatment.name);
    return `
    <article class="transformation-card">
      <div class="transformation-slider" data-before-after>
        <img class="transformation-slider__before" src="${src}" width="1200" height="900" loading="lazy" alt="Before ${alt}">
        <img class="transformation-slider__after" src="${src}" width="1200" height="900" loading="lazy" alt="After ${alt}">
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
