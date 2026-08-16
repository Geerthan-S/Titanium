import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { stockMedia } from '../data/media-assets.js';
import { escapeHtml } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';

const homepageStatistics = [
  { value: '10+', label: 'Years Experience', icon: 'stethoscope' },
  { value: '5000+', label: 'Happy Patients', icon: 'heart-handshake' },
  { value: '15+', label: 'Expert Doctors', icon: 'users-round' },
  { value: '20+', label: 'Treatments', icon: 'badge-plus' },
];

const whyChooseFeatures = [
  { title: 'Advanced Technology', copy: 'Modern tools selected to support thoughtful dental care.', icon: 'scan-face' },
  { title: 'Expert Team', copy: 'A patient-focused team committed to clear communication.', icon: 'users-round' },
  { title: 'Pain-Free Treatments', copy: 'A comfort-first approach through every stage of care.', icon: 'heart-handshake' },
  { title: 'Sterile & Safe Environment', copy: 'Careful attention to hygiene and clinical standards.', icon: 'badge-plus' },
  { title: 'Transparent Pricing', copy: 'Clear discussions before you decide on your treatment.', icon: 'stethoscope' },
  { title: 'Patient-Centric Care', copy: 'Treatment conversations shaped around your individual needs.', icon: 'sparkles' },
];

let featuredTreatments = [];
let featuredDoctors = [];
let testimonials = [];
let latestBlogs = [];
let clinicGallery = [];

const fallbackMedia = stockMedia;
const hiddenTestimonialPatterns = [
  'hesitant about getting dental implants',
  'dr. rajesh kumar',
  'finally smile confidently again',
  'priya sharma transformed my smile with invisalign',
  'orthodontic treatment',
];

function shouldHideTestimonial(item) {
  const searchable = `${item.name || ''} ${item.treatment || ''} ${item.review || ''} ${item.doctorName || ''}`.toLowerCase();
  return hiddenTestimonialPatterns.some((text) => searchable.includes(text));
}

export async function initializeHome() {
  const statisticsPanel = document.querySelector('[data-hero-statistics]');
  if (!statisticsPanel || statisticsPanel.dataset.initialized) return;
  statisticsPanel.dataset.initialized = 'true';
  statisticsPanel.innerHTML = homepageStatistics.map(({ value, label, icon }) => `<article class="home-stat"><i data-lucide="${icon}" aria-hidden="true"></i><div><strong>${value}</strong><span>${label}</span></div></article>`).join('');
  renderFeaturedTreatments();
  renderDifferenceFeatures();
  renderFeaturedDoctors();
  renderTestimonials();
  renderLatestBlogs();
  renderClinicGallery();
  createIcons({ icons: ICON_SET });
  await Promise.all([
    loadCollection('treatments', (rows) => { featuredTreatments = rows.filter((row) => row.featured).slice(0, 5); }, renderFeaturedTreatments),
    loadCollection('doctors', (rows) => { featuredDoctors = rows.filter((row) => row.featured).slice(0, 4); }, renderFeaturedDoctors),
    loadCollection('testimonials', (rows) => { testimonials = rows.filter((row) => row.featured && !shouldHideTestimonial(row)).slice(0, 6); }, renderTestimonials),
    loadCollection('blogs', (rows) => { latestBlogs = rows.slice(0, 3); }, renderLatestBlogs),
    loadCollection('gallery', (rows) => { clinicGallery = rows.slice(0, 5); }, renderClinicGallery),
  ]);
  renderFeaturedTreatments();
  renderDifferenceFeatures();
  renderFeaturedDoctors();
  renderTestimonials();
  renderLatestBlogs();
  renderClinicGallery();
  createIcons({ icons: ICON_SET });
  initializeTestimonialControls();
  initializeFloatingContactClearance();
}

async function loadCollection(name, assign, render) {
  try {
    assign(await loadPublicContent(name));
  } catch {
    assign([]);
  }
  onPublicContent(name, ({ status, data }) => {
    if (status !== 'ready') return;
    assign(data);
    render();
    createIcons({ icons: ICON_SET });
  });
  subscribePublicContent(name);
}

function renderFeaturedTreatments() {
  const grid = document.querySelector('[data-featured-treatments]');
  if (!grid) return;
  const section = grid.closest('section');
  if (section) section.hidden = featuredTreatments.length === 0;
  grid.innerHTML = featuredTreatments.map(({ name, category, shortDescription, image, imageAlt, slug }) => `<article class="treatment-card"><img src="${image ? publicMediaUrl(image) : fallbackMedia.treatment}" data-media-fallback="treatment" alt="${escapeHtml(imageAlt || name)}"><div class="treatment-card__content">${category ? `<span class="treatment-card__category">${escapeHtml(category)}</span>` : ''}<h3>${escapeHtml(name)}</h3><p>${escapeHtml(shortDescription)}</p><div><a class="text-link" href="/treatments/${encodeURIComponent(slug)}.html">Learn More <i data-lucide="arrow-right" aria-hidden="true"></i></a></div></div></article>`).join('');
}

function renderDifferenceFeatures() {
  const grid = document.querySelector('[data-difference-grid]');
  if (!grid) return;
  grid.innerHTML = whyChooseFeatures.map(({ title, copy, icon }) => `<article class="difference-card"><i data-lucide="${icon}" aria-hidden="true"></i><h3>${title}</h3><p>${copy}</p></article>`).join('');
}

function renderFeaturedDoctors() {
  const grid = document.querySelector('[data-featured-doctors]');
  if (!grid) return;
  const section = grid.closest('section');
  if (section) section.hidden = featuredDoctors.length === 0;
  grid.innerHTML = featuredDoctors.map(({ name, qualification, specialization, experience }) => `<article class="doctor-card"><div class="doctor-card__content"><h3>${escapeHtml(name)}</h3><p>${escapeHtml(qualification)}</p><p>${escapeHtml(specialization)}</p><span><i data-lucide="stethoscope" aria-hidden="true"></i>${experience ? `${escapeHtml(experience)}+ years experience` : 'Experience information available on request'}</span><button class="button" type="button" data-modal-open="appointment-modal" data-doctor-selection="${escapeHtml(name)}">Book Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button></div></article>`).join('');
}

function renderTestimonials() {
  const track = document.querySelector('[data-testimonial-track]');
  if (!track) return;
  const section = track.closest('section');
  if (section) section.hidden = testimonials.length === 0;
  track.innerHTML = testimonials.map(({ name, treatment, review, rating, image }) => `<article class="testimonial-card"><div class="testimonial-card__quote"><i data-lucide="message-circle" aria-hidden="true"></i></div><p>${escapeHtml(review)}</p><div class="testimonial-card__meta"><img src="${image ? publicMediaUrl(image) : fallbackMedia.patient}" data-media-fallback="patient" alt="${escapeHtml(name)}"><div><strong>${escapeHtml(name)}</strong><span>${escapeHtml(treatment)}</span><small>${escapeHtml(rating)} out of 5 stars</small></div></div></article>`).join('');
}

function renderLatestBlogs() {
  const grid = document.querySelector('[data-latest-blogs]');
  if (!grid) return;
  const section = grid.closest('section');
  if (section) section.hidden = latestBlogs.length === 0;
  grid.innerHTML = latestBlogs.map(({ category, publishDate, title, excerpt, image, imageAlt, slug }) => { const href = `/blog.html#${encodeURIComponent(slug)}`; return `<article class="blog-card"><a href="${href}" tabindex="-1" aria-hidden="true"><img src="${image ? publicMediaUrl(image) : fallbackMedia.blog}" data-media-fallback="blog" alt="${escapeHtml(imageAlt || title)}"></a><div class="blog-card__content"><p><span>${escapeHtml(category)}</span><time>${publishDate ? new Date(publishDate).toLocaleDateString('en-IN') : ''}</time></p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(excerpt)}</p><a class="text-link" href="${href}">Read More <i data-lucide="arrow-right" aria-hidden="true"></i></a></div></article>`; }).join('');
}

function renderClinicGallery() {
  const main = document.querySelector('[data-clinic-gallery-main]');
  const supporting = document.querySelector('[data-clinic-gallery-supporting]');
  if (!main || !supporting) return;
  const [lead, ...rest] = clinicGallery;
  const section = main.closest('section');
  if (!lead) {
    if (section) section.hidden = false;
    main.src = fallbackMedia.clinic;
    main.alt = 'Modern Titanium Roots dental clinic interior';
    supporting.innerHTML = [
      ['treatment', 'Prepared dental treatment room'],
      ['doctor', 'Dental specialist consultation'],
      ['patient', 'Comfort-focused patient care'],
      ['blog', 'Dental education and prevention'],
    ].map(([key, alt]) => `<img src="${fallbackMedia[key]}" data-media-fallback="${key}" alt="${alt}">`).join('');
    return;
  }
  if (section) section.hidden = false;
  main.dataset.mediaFallback = 'clinic';
  main.src = publicMediaUrl(lead.storagePath);
  main.alt = escapeHtml(lead.altText || lead.title);
  supporting.innerHTML = rest.map(({ storagePath, altText, title }) => `<img src="${publicMediaUrl(storagePath)}" data-media-fallback="clinic" alt="${escapeHtml(altText || title)}">`).join('');
}

function initializeTestimonialControls() {
  const track = document.querySelector('[data-testimonial-track]');
  if (!track) return;
  const step = () => Math.max(track.clientWidth * 0.85, 240);
  document.querySelector('[data-testimonial-prev]')?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  document.querySelector('[data-testimonial-next]')?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
}

function initializeFloatingContactClearance() {
  const boundary = document.querySelector('.consultation-banner');
  if (!boundary || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => document.body.classList.toggle('is-near-footer', entry.isIntersecting), { threshold: 0.18 }).observe(boundary);
}
