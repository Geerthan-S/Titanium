import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { stockMedia } from '../data/media-assets.js';
import { escapeHtml } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';

const homepageStatistics = [
  { value: '10+', label: 'Years Clinical Experience', icon: 'stethoscope' },
  { value: '5000+', label: 'Smiles Cared For', icon: 'heart-handshake' },
  { value: '15+', label: 'Dental Specialists', icon: 'users-round' },
  { value: '90+', label: 'Treatment Options', icon: 'badge-plus' },
];

const whyChooseFeatures = [
  { title: 'Digital Diagnostics', copy: 'Clinical decisions are supported with modern imaging and careful case assessment.', icon: 'scan-face' },
  { title: 'Specialist-Led Care', copy: 'Each treatment is guided by the right expertise, not a one-size-fits-all plan.', icon: 'users-round' },
  { title: 'Comfort-First Visits', copy: 'Appointments are paced and explained to reduce uncertainty at every stage.', icon: 'heart-handshake' },
  { title: 'Sterilisation Discipline', copy: 'Hygiene, instrument flow, and operatory readiness stay central to daily care.', icon: 'shield-check' },
  { title: 'Transparent Planning', copy: 'Options, timelines, and costs are explained before treatment begins.', icon: 'clipboard-list' },
  { title: 'Long-Term Focus', copy: 'Recommendations are shaped around oral health, function, and lasting confidence.', icon: 'sparkles' },
];

const fallbackTreatments = [
  {
    name: 'Dental Implants',
    category: 'Implant Dentistry',
    shortDescription: 'Replacement options planned for function, comfort, and confident chewing.',
    image: '',
    imageAlt: 'Dental implant consultation and treatment planning',
    slug: 'dental-implants',
  },
  {
    name: 'Root Canal Treatment',
    category: 'Tooth-Saving Care',
    shortDescription: 'Pain-conscious care designed to preserve natural teeth whenever clinically possible.',
    image: '',
    imageAlt: 'Root canal treatment care',
    slug: 'root-canal-treatment',
  },
  {
    name: 'Clear Aligners',
    category: 'Orthodontics',
    shortDescription: 'Discreet alignment planning for patients looking for straighter smiles.',
    image: '',
    imageAlt: 'Clear aligner dental treatment',
    slug: 'clear-aligners',
  },
  {
    name: 'Teeth Whitening',
    category: 'Cosmetic Dentistry',
    shortDescription: 'Professional brightening options with guidance on sensitivity and maintenance.',
    image: '',
    imageAlt: 'Professional teeth whitening consultation',
    slug: 'professional-teeth-whitening',
  },
  {
    name: 'Children’s Dentistry',
    category: 'Pediatric Care',
    shortDescription: 'Gentle preventive and restorative care for growing smiles.',
    image: '',
    imageAlt: 'Comfortable pediatric dental care',
    slug: 'pediatric-dentistry',
  },
];

const fallbackDoctors = [
  { name: 'Clinical Team', qualification: 'Multidisciplinary dental care', specialization: 'Consultation, diagnosis, treatment planning', experience: '' },
  { name: 'Implant & Prosthetic Care', qualification: 'Specialist-led treatment planning', specialization: 'Implants, crowns, bridges, dentures', experience: '' },
  { name: 'Root Canal & Restorative Care', qualification: 'Tooth-saving treatment focus', specialization: 'Root canal care, fillings, crowns', experience: '' },
  { name: 'Orthodontic & Smile Care', qualification: 'Alignment and aesthetic planning', specialization: 'Braces, aligners, smile design', experience: '' },
];

const fallbackTestimonials = [
  {
    name: 'Patient Story',
    treatment: 'Consultation Experience',
    review: 'The team explained the treatment choices clearly and helped me feel comfortable before starting care.',
    rating: '5',
    image: '',
  },
  {
    name: 'Patient Story',
    treatment: 'Dental Treatment',
    review: 'The appointment felt calm, organised, and transparent from diagnosis to after-care instructions.',
    rating: '5',
    image: '',
  },
  {
    name: 'Patient Story',
    treatment: 'Preventive Care',
    review: 'I appreciated the clean clinic environment, practical guidance, and patient way everything was explained.',
    rating: '5',
    image: '',
  },
];

const fallbackBlogs = [
  {
    category: 'Dental Education',
    publishDate: '',
    title: 'How to Prepare for Your First Dental Consultation',
    excerpt: 'A simple guide to sharing symptoms, treatment history, goals, and questions before your visit.',
    image: '',
    imageAlt: 'Dental consultation education',
    slug: 'first-dental-consultation',
  },
  {
    category: 'Oral Health',
    publishDate: '',
    title: 'When Tooth Pain Needs Immediate Attention',
    excerpt: 'Understand the warning signs that should not be ignored and what to discuss with your dentist.',
    image: '',
    imageAlt: 'Tooth pain dental education',
    slug: 'tooth-pain-warning-signs',
  },
  {
    category: 'Smile Care',
    publishDate: '',
    title: 'Choosing Between Whitening, Veneers and Aligners',
    excerpt: 'Different smile goals need different treatment paths. Here is how dentists usually assess them.',
    image: '',
    imageAlt: 'Smile care treatment planning',
    slug: 'smile-care-options',
  },
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
  const rows = featuredTreatments.length ? featuredTreatments : fallbackTreatments;
  grid.innerHTML = rows.map(({ name, category, shortDescription, image, imageAlt, slug }) => `<article class="treatment-card"><img src="${image ? publicMediaUrl(image) : fallbackMedia.treatment}" data-media-fallback="treatment" alt="${escapeHtml(imageAlt || name)}"><div class="treatment-card__content">${category ? `<span class="treatment-card__category">${escapeHtml(category)}</span>` : ''}<h3>${escapeHtml(name)}</h3><p>${escapeHtml(shortDescription)}</p><div><a class="text-link" href="/treatments/${encodeURIComponent(slug)}.html">View Treatment <i data-lucide="arrow-right" aria-hidden="true"></i></a></div></div></article>`).join('');
}

function renderDifferenceFeatures() {
  const grid = document.querySelector('[data-difference-grid]');
  if (!grid) return;
  grid.innerHTML = whyChooseFeatures.map(({ title, copy, icon }) => `<article class="difference-card"><i data-lucide="${icon}" aria-hidden="true"></i><h3>${title}</h3><p>${copy}</p></article>`).join('');
}

function renderFeaturedDoctors() {
  const grid = document.querySelector('[data-featured-doctors]');
  if (!grid) return;
  const rows = featuredDoctors.length ? featuredDoctors : fallbackDoctors;
  grid.innerHTML = rows.map(({ name, qualification, specialization, experience }) => `<article class="doctor-card"><div class="doctor-card__content"><h3>${escapeHtml(name)}</h3><p>${escapeHtml(qualification)}</p><p>${escapeHtml(specialization)}</p><span><i data-lucide="stethoscope" aria-hidden="true"></i>${experience ? `${escapeHtml(experience)}+ years experience` : 'Specialist appointment guidance available'}</span><button class="button" type="button" data-modal-open="appointment-modal" data-doctor-selection="${escapeHtml(name)}">Book Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button></div></article>`).join('');
}

function renderTestimonials() {
  const track = document.querySelector('[data-testimonial-track]');
  if (!track) return;
  const rows = testimonials.length ? testimonials : fallbackTestimonials;
  track.innerHTML = rows.map(({ name, treatment, review, rating }) => `<article class="testimonial-card"><div class="testimonial-card__quote"><i data-lucide="message-circle" aria-hidden="true"></i></div><p>${escapeHtml(review)}</p><div class="testimonial-card__meta"><span class="testimonial-card__initials" aria-hidden="true">${escapeHtml(String(name || 'P').slice(0, 2).toUpperCase())}</span><div><strong>${escapeHtml(name)}</strong><span>${escapeHtml(treatment)}</span><small>${escapeHtml(rating)} out of 5 stars</small></div></div></article>`).join('');
}

function renderLatestBlogs() {
  const grid = document.querySelector('[data-latest-blogs]');
  if (!grid) return;
  const rows = latestBlogs.length ? latestBlogs : fallbackBlogs;
  grid.innerHTML = rows.map(({ category, publishDate, title, excerpt, image, imageAlt, slug }) => { const href = `/blog.html#${encodeURIComponent(slug)}`; return `<article class="blog-card"><a href="${href}" tabindex="-1" aria-hidden="true"><img src="${image ? publicMediaUrl(image) : fallbackMedia.blog}" data-media-fallback="blog" alt="${escapeHtml(imageAlt || title)}"></a><div class="blog-card__content"><p><span>${escapeHtml(category)}</span><time>${publishDate ? new Date(publishDate).toLocaleDateString('en-IN') : 'Clinic Guide'}</time></p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(excerpt)}</p><a class="text-link" href="${href}">Read More <i data-lucide="arrow-right" aria-hidden="true"></i></a></div></article>`; }).join('');
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
