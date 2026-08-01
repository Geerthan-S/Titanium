import { gsap } from 'gsap';
import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { escapeHtml } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';

const aboutStatistics = [
  { value: 10, suffix: '+', label: 'Years Experience', icon: 'stethoscope', status: 'Pending confirmation' },
  { value: 5000, suffix: '+', label: 'Smiles Transformed', icon: 'heart-handshake', status: 'Pending confirmation' },
  { value: 15, suffix: '+', label: 'Dental Professionals', icon: 'users-round', status: 'Pending confirmation' },
  { value: 20, suffix: '+', label: 'Treatments Available', icon: 'badge-plus', status: 'Pending confirmation' },
];

const aboutTrustFeatures = [
  { title: 'Advanced Technology', copy: 'Modern tools selected to support considered dental care.', icon: 'scan-face' },
  { title: 'Experienced Team', copy: 'A patient-focused team committed to clear communication.', icon: 'users-round' },
  { title: 'Comfort-First Treatment', copy: 'A thoughtful approach designed around patient comfort.', icon: 'heart-handshake' },
  { title: 'Sterile and Safe Environment', copy: 'Careful attention to hygiene and clinical standards.', icon: 'shield-check' },
  { title: 'Transparent Communication', copy: 'Clear conversations to help patients understand their options.', icon: 'message-circle' },
  { title: 'Patient-Centric Care', copy: 'Every visit is shaped around individual needs and concerns.', icon: 'sparkles' },
];

const missionVisionValues = [
  { term: 'Our Mission', definition: 'To provide thoughtful, modern and compassionate dental care focused on patient comfort and long-term oral well-being.', icon: 'heart-handshake' },
  { term: 'Our Vision', definition: 'To become a trusted dental care destination known for clinical quality, clear communication and patient-centered experiences.', icon: 'scan-face' },
  { term: 'Our Values', definition: 'Care, clarity, comfort, integrity, respect and continuous improvement.', icon: 'sparkles' },
];

const clinicFeatures = [
  'Advanced Dental Operatories',
  'Digital Imaging Support',
  'Sterilization and Hygiene Standards',
  'Comfortable Waiting Lounge',
  'Modern Dental Equipment',
];

let clinicGallery = [];
let featuredDoctors = [];

export async function initializeAbout() {
  if (document.body.dataset.aboutInitialized) return;
  document.body.dataset.aboutInitialized = 'true';
  await Promise.all([
    loadCollection('gallery', (rows) => { clinicGallery = rows.slice(0, 4); }, renderGallery),
    loadCollection('doctors', (rows) => { featuredDoctors = rows.filter((row) => row.featured).slice(0, 4); }, renderDoctors),
  ]);
  renderHeroTrust();
  renderStatistics();
  renderPrinciples();
  renderTrustFeatures();
  renderClinicFeatures();
  renderGallery();
  renderDoctors();
  createIcons({ icons: ICON_SET });
  initializeStatistics();
  initializeAnimations();
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

function renderHeroTrust() {
  const trust = document.querySelector('[data-about-hero-trust]');
  if (!trust) return;
  trust.innerHTML = [
    { title: 'Advanced Technology', icon: 'scan-face' },
    { title: 'Experienced Dental Team', icon: 'users-round' },
    { title: 'Patient-First Approach', icon: 'heart-handshake' },
  ].map(({ title, icon }) => `<li><i data-lucide="${icon}" aria-hidden="true"></i><span>${title}</span></li>`).join('');
}

function renderStatistics() {
  const statistics = document.querySelector('[data-about-statistics]');
  if (!statistics) return;
  statistics.innerHTML = aboutStatistics.map(({ value, suffix, label, icon, status }) => `<article class="about-stat" data-about-stat data-value="${value}" data-suffix="${suffix}" data-status="${status}"><i data-lucide="${icon}" aria-hidden="true"></i><div><strong>${value}${suffix}</strong><span>${label}</span></div></article>`).join('');
}

function renderPrinciples() {
  const principles = document.querySelector('[data-about-principles]');
  if (!principles) return;
  principles.innerHTML = missionVisionValues.map(({ term, definition, icon }) => `<div><dt><i data-lucide="${icon}" aria-hidden="true"></i>${term}</dt><dd>${definition}</dd></div>`).join('');
}

function renderTrustFeatures() {
  const grid = document.querySelector('[data-about-trust-features]');
  if (!grid) return;
  grid.innerHTML = aboutTrustFeatures.map(({ title, copy, icon }) => `<article class="about-feature-card"><i data-lucide="${icon}" aria-hidden="true"></i><h3>${title}</h3><p>${copy}</p></article>`).join('');
}

function renderClinicFeatures() {
  const list = document.querySelector('[data-about-clinic-features]');
  if (!list) return;
  list.innerHTML = clinicFeatures.map((feature) => `<li>${feature}</li>`).join('');
}

function renderGallery() {
  const gallery = document.querySelector('[data-about-gallery]');
  if (!gallery) return;
  const section = gallery.closest('section');
  if (!clinicGallery.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;
  gallery.innerHTML = clinicGallery.map(({ storagePath, altText, title }) => `<img src="${publicMediaUrl(storagePath)}" width="1200" height="900" loading="lazy" alt="${escapeHtml(altText || title)}">`).join('');
}

function renderDoctors() {
  const grid = document.querySelector('[data-about-doctors]');
  if (!grid) return;
  const section = grid.closest('section');
  if (!featuredDoctors.length) {
    if (section) section.hidden = true;
    return;
  }
  if (section) section.hidden = false;
  grid.innerHTML = featuredDoctors.map(({ name, qualification, specialization, experience, portrait, imageAlt }) => `<article class="about-doctor-card"><div class="about-doctor-card__media"><img src="${portrait ? publicMediaUrl(portrait) : '/assets/images/placeholders/clinic-neutral.svg'}" width="960" height="1200" loading="lazy" alt="${escapeHtml(imageAlt || name)}"></div><div class="about-doctor-card__content"><h3>${escapeHtml(name)}</h3><p>${escapeHtml(qualification)}</p><p>${escapeHtml(specialization)}</p><span><i data-lucide="stethoscope" aria-hidden="true"></i>${experience ? `${escapeHtml(experience)}+ years experience` : 'Experience information available on request'}</span><button class="button" type="button" data-modal-open="appointment-modal" data-doctor-selection="${escapeHtml(name)}" data-treatment-interest="General consultation">Book Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button></div></article>`).join('');
}

function initializeStatistics() {
  const statistics = document.querySelector('[data-about-statistics]');
  if (!statistics || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    statistics.querySelectorAll('[data-about-stat]').forEach((statistic) => {
      const target = Number(statistic.dataset.value);
      const suffix = statistic.dataset.suffix;
      const value = statistic.querySelector('strong');
      const counter = { value: 0 };
      gsap.to(counter, { value: target, duration: 1, ease: 'power2.out', onUpdate: () => { value.textContent = `${Math.round(counter.value)}${suffix}`; } });
    });
    observer.unobserve(statistics);
  }, { threshold: 0.45 });
  observer.observe(statistics);
}

function initializeAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.timeline({ defaults: { ease: 'power2.out' } })
    .from('[data-about-hero-eyebrow]', { y: 16, opacity: 0, duration: 0.4 })
    .from('[data-about-hero-heading]', { y: 25, opacity: 0, duration: 0.62 }, '-=0.18')
    .from('[data-about-hero-copy], .about-hero__trust', { y: 16, opacity: 0, duration: 0.45, stagger: 0.1 }, '-=0.35')
    .from('[data-about-hero-visual]', { scale: 1.025, opacity: 0, duration: 0.72 }, '-=0.5')
    .from('[data-about-statistics]', { y: 18, opacity: 0, duration: 0.45 }, '-=0.38');

  document.querySelectorAll('[data-about-reveal-section]').forEach((section) => {
    const targets = section.querySelectorAll('h2, .section-eyebrow, [data-about-reveal-image], .about-feature-card, .about-doctor-card');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      gsap.from(targets, { y: 20, opacity: 0, duration: 0.48, stagger: 0.06, ease: 'power2.out' });
      observer.unobserve(section);
    }, { threshold: 0.15 });
    observer.observe(section);
  });
}
