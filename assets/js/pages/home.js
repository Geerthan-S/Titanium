import { gsap } from 'gsap';
import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { publicMediaUrl } from '../data/media-repository.js';
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

const placeholderImage = '/assets/images/placeholders/clinic-neutral.svg';

export async function initializeHome() {
  const statisticsPanel = document.querySelector('[data-hero-statistics]');
  if (!statisticsPanel || statisticsPanel.dataset.initialized) return;
  statisticsPanel.dataset.initialized = 'true';
  statisticsPanel.innerHTML = homepageStatistics.map(({ value, label, icon }) => `<article class="home-stat"><i data-lucide="${icon}" aria-hidden="true"></i><div><strong>${value}</strong><span>${label}</span></div></article>`).join('');
  await Promise.all([
    loadCollection('treatments', (rows) => { featuredTreatments = rows.filter((row) => row.featured).slice(0, 5); }, renderFeaturedTreatments),
    loadCollection('doctors', (rows) => { featuredDoctors = rows.filter((row) => row.featured).slice(0, 4); }, renderFeaturedDoctors),
    loadCollection('testimonials', (rows) => { testimonials = rows.filter((row) => row.featured).slice(0, 6); }, renderTestimonials),
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

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.querySelector('.home-hero');
  if (!hero) return;
  gsap.timeline({ defaults: { ease: 'power2.out' } })
    .from('[data-site-header]', { y: -24, opacity: 0, duration: 0.6 })
    .from('[data-hero-badge]', { y: 16, opacity: 0, duration: 0.45 }, '-=0.22')
    .from('[data-hero-heading]', { y: 26, opacity: 0, duration: 0.65 }, '-=0.2')
    .from('[data-hero-copy], [data-hero-actions]', { y: 16, opacity: 0, duration: 0.48, stagger: 0.1 }, '-=0.35')
    .from('[data-hero-features] li', { y: 14, opacity: 0, duration: 0.4, stagger: 0.08 }, '-=0.2')
    .from('[data-hero-visual]', { scale: 1.035, opacity: 0, duration: 0.75 }, '-=0.62')
    .from('[data-hero-statistics]', { y: 20, opacity: 0, duration: 0.5 }, '-=0.4');

  document.querySelectorAll('[data-reveal-section]').forEach((section) => {
    const targets = section.querySelectorAll('h2, .section-eyebrow, [data-reveal-image], .treatment-card, .difference-card, .doctor-card, .testimonial-card, .blog-card');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      gsap.from(targets, { y: 20, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' });
      observer.unobserve(section);
    }, { threshold: 0.18 });
    observer.observe(section);
  });
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
  grid.innerHTML = featuredTreatments.length
    ? featuredTreatments.map(({ name, shortDescription, image, imageAlt, slug }) => `<article class="treatment-card"><img src="${image ? publicMediaUrl(image) : placeholderImage}" alt="${escapeHtml(imageAlt || name)}"><div class="treatment-card__content"><h3>${escapeHtml(name)}</h3><p>${escapeHtml(shortDescription)}</p><div><a class="text-link" href="/treatments/${encodeURIComponent(slug)}.html">Learn More <i data-lucide="arrow-right" aria-hidden="true"></i></a></div></div></article>`).join('')
    : '<p class="content-empty">Treatment information will be available soon.</p>';
}

function renderDifferenceFeatures() {
  const grid = document.querySelector('[data-difference-grid]');
  if (!grid) return;
  grid.innerHTML = whyChooseFeatures.map(({ title, copy, icon }) => `<article class="difference-card"><i data-lucide="${icon}" aria-hidden="true"></i><h3>${title}</h3><p>${copy}</p></article>`).join('');
}

function renderFeaturedDoctors() {
  const grid = document.querySelector('[data-featured-doctors]');
  if (!grid) return;
  grid.innerHTML = featuredDoctors.length
    ? featuredDoctors.map(({ name, qualification, specialization, experience, portrait, imageAlt }) => `<article class="doctor-card"><img src="${portrait ? publicMediaUrl(portrait) : placeholderImage}" alt="${escapeHtml(imageAlt || name)}"><div class="doctor-card__content"><h3>${escapeHtml(name)}</h3><p>${escapeHtml(qualification)}</p><p>${escapeHtml(specialization)}</p><span><i data-lucide="stethoscope" aria-hidden="true"></i>${experience ? `${escapeHtml(experience)}+ years experience` : 'Experience information available on request'}</span><button class="button" type="button" data-modal-open="appointment-modal" data-doctor-selection="${escapeHtml(name)}">Book Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button></div></article>`).join('')
    : '<p class="content-empty">Doctor profiles will be available soon.</p>';
}

function renderTestimonials() {
  const track = document.querySelector('[data-testimonial-track]');
  if (!track) return;
  track.innerHTML = testimonials.length
    ? testimonials.map(({ name, treatment, review, rating, image }) => `<article class="testimonial-card"><div class="testimonial-card__quote"><i data-lucide="message-circle" aria-hidden="true"></i></div><p>${escapeHtml(review)}</p><div class="testimonial-card__meta"><img src="${image ? publicMediaUrl(image) : placeholderImage}" alt="${escapeHtml(name)}"><div><strong>${escapeHtml(name)}</strong><span>${escapeHtml(treatment)}</span><small>${escapeHtml(rating)} out of 5 stars</small></div></div></article>`).join('')
    : '<p class="content-empty">Patient stories will appear here when approved for publication.</p>';
}

function renderLatestBlogs() {
  const grid = document.querySelector('[data-latest-blogs]');
  if (!grid) return;
  grid.innerHTML = latestBlogs.length
    ? latestBlogs.map(({ category, publishDate, title, excerpt, image, imageAlt, slug }) => `<article class="blog-card"><a href="/blog.html#${encodeURIComponent(slug)}" tabindex="-1" aria-hidden="true"><img src="${image ? publicMediaUrl(image) : placeholderImage}" alt="${escapeHtml(imageAlt || title)}"></a><div class="blog-card__content"><p><span>${escapeHtml(category)}</span><time>${publishDate ? new Date(publishDate).toLocaleDateString('en-IN') : ''}</time></p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(excerpt)}</p><a class="text-link" href="/blog.html#${encodeURIComponent(slug)}">Read More <i data-lucide="arrow-right" aria-hidden="true"></i></a></div></article>`).join('')
    : '<p class="content-empty">Dental articles will be available soon.</p>';
}

function renderClinicGallery() {
  const main = document.querySelector('[data-clinic-gallery-main]');
  const supporting = document.querySelector('[data-clinic-gallery-supporting]');
  if (!main || !supporting) return;
  const [lead, ...rest] = clinicGallery;
  const section = main.closest('section');
  if (!lead) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;
  main.src = publicMediaUrl(lead.storagePath);
  main.alt = escapeHtml(lead.altText || lead.title);
  supporting.innerHTML = rest.map(({ storagePath, altText, title }) => `<img src="${publicMediaUrl(storagePath)}" alt="${escapeHtml(altText || title)}">`).join('');
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
