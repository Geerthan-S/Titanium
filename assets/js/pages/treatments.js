import { gsap } from 'gsap';
import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { openModal } from '../components/modal.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { escapeHtml } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';
import { SITE_CONFIG } from '../utils/constants.js';

const placeholder = '/assets/images/placeholders/clinic-neutral.svg';
const whyFeatures = [
  ['scan-face', 'Advanced Technology', 'Modern tools selected to support considered dental care.'],
  ['users-round', 'Experienced Dental Team', 'A patient-focused team committed to clear communication.'],
  ['heart-handshake', 'Comfort-First Procedures', 'A thoughtful approach designed around patient comfort.'],
  ['sparkles', 'Personalised Care', 'Treatment discussions are shaped around individual needs.'],
  ['message-circle', 'Transparent Communication', 'Clear conversations help patients understand their options.'],
  ['shield-check', 'Sterile and Safe Environment', 'Careful attention to hygiene and clinical standards.'],
];
const journey = [
  ['01', 'Book Consultation', 'Schedule a visit to discuss your dental concerns and goals.', 'calendar-days'],
  ['02', 'Dental Examination', 'Your dentist reviews your oral health and relevant findings.', 'scan-face'],
  ['03', 'Personalised Treatment Plan', 'Suitable options and next steps are discussed clearly.', 'badge-plus'],
  ['04', 'Treatment Procedure', 'Care proceeds according to the confirmed plan.', 'stethoscope'],
  ['05', 'Recovery and Follow-Up', 'Aftercare and review guidance are provided as needed.', 'heart-handshake'],
];
const faqs = [
  ['Is dental treatment painful?', 'Comfort measures and treatment options are discussed with your dentist. Individual experiences and recommended care vary.'],
  ['How long will my treatment take?', 'Treatment timelines depend on examination findings, the type of care needed and the agreed treatment plan.'],
  ['What is the recovery period?', 'Recovery and aftercare depend on the treatment. Your dentist will explain what to expect for your individual plan.'],
  ['How is treatment pricing confirmed?', 'Pricing is confirmed after clinical consultation, assessment and treatment planning.'],
  ['Will I need multiple visits?', 'Some treatments need more than one visit. Your dentist will explain the expected visit schedule after assessment.'],
];
let treatments = [];

const safe = (value) => escapeHtml(value || '');
const listFor = (value) => Array.isArray(value)
  ? value
  : String(value || '').split(/\r?\n|,\s*/).map((item) => item.trim()).filter(Boolean);

export async function initializeTreatments() {
  if (document.body.dataset.treatmentsInitialized) return;
  document.body.dataset.treatmentsInitialized = 'true';
  document.querySelector('[data-breadcrumb-current]')?.replaceChildren('Treatments');
  try {
    treatments = await loadPublicContent('treatments');
  } catch {
    treatments = [];
  }
  onPublicContent('treatments', ({ status, data }) => {
    if (status !== 'ready') return;
    treatments = data;
    renderTreatments();
    createIcons({ icons: ICON_SET });
  });
  subscribePublicContent('treatments');
  renderHero();
  renderTreatments();
  renderWhy();
  renderJourney();
  renderTransformations();
  renderFaqs();
  createIcons({ icons: ICON_SET });
  initializeInteractions();
  initializeAnimations();
}

function renderHero() {
  const trust = document.querySelector('[data-treatments-hero-trust]');
  if (trust) trust.innerHTML = [
    ['scan-face', 'Advanced Technology', 'Thoughtful planning support'],
    ['heart-handshake', 'Comfort-First Treatment', 'Care shaped around patients'],
    ['users-round', 'Patient-Focused Care', 'Clear treatment discussions'],
  ].map(([icon, title, copy]) => `<article><i data-lucide="${icon}" aria-hidden="true"></i><div><strong>${title}</strong><span>${copy}</span></div></article>`).join('');
  const features = document.querySelector('[data-treatments-hero-features]');
  if (features) features.innerHTML = whyFeatures.slice(0, 4).map(([icon, title]) => `<div><i data-lucide="${icon}" aria-hidden="true"></i><span>${title}</span></div>`).join('');
}

function renderTreatments() {
  const grid = document.querySelector('[data-treatment-grid]');
  if (!grid) return;
  grid.innerHTML = treatments.length
    ? treatments.map((treatment) => `<article class="treatment-card" id="${safe(treatment.slug)}">
      <div class="treatment-card__media"><img src="${treatment.image ? publicMediaUrl(treatment.image) : placeholder}" width="1200" height="900" loading="lazy" alt="${safe(treatment.imageAlt || treatment.name)}"></div>
      <div class="treatment-card__content"><p class="treatment-card__category">${safe(treatment.category)}</p><h3>${safe(treatment.name)}</h3><p>${safe(treatment.shortDescription)}</p>
        <dl><div><dt>Duration</dt><dd>${cardDuration(treatment)}</dd></div><div><dt>Visits</dt><dd>${cardVisits(treatment)}</dd></div><div><dt>Price</dt><dd>${priceLabel(treatment)}</dd></div></dl>
        <div class="treatment-card__actions"><button class="button button--secondary treatment-card__details" type="button" data-treatment-detail="${safe(treatment.id)}">View Details</button><button class="button treatment-card__booking" type="button" data-modal-open="appointment-modal" data-treatment-interest="${safe(treatment.name)}">Book Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button></div>
      </div>
    </article>`).join('')
    : '<p class="content-empty">Treatment information will be available soon.</p>';
}

function renderWhy() {
  const mount = document.querySelector('[data-treatments-why]');
  if (mount) mount.innerHTML = whyFeatures.map(([icon, title, copy]) => `<article class="treatments-why__item"><i data-lucide="${icon}" aria-hidden="true"></i><h3>${title}</h3><p>${copy}</p></article>`).join('');
}

function renderJourney() {
  const mount = document.querySelector('[data-treatment-journey]');
  if (mount) mount.innerHTML = journey.map(([number, title, copy, icon]) => `<li><span class="journey-timeline__icon"><i data-lucide="${icon}" aria-hidden="true"></i></span><strong>${number}</strong><h3>${title}</h3><p>${copy}</p></li>`).join('');
}

function renderTransformations() {
  const mount = document.querySelector('[data-transformations]');
  const section = mount?.closest('section');
  const withImages = treatments.filter((treatment) => treatment.image).slice(0, 5);
  if (section) section.hidden = !withImages.length;
  if (mount) mount.innerHTML = withImages.map((treatment) => `<article class="transformation-card"><div class="transformation-media"><img src="${publicMediaUrl(treatment.image)}" width="1200" height="900" loading="lazy" alt="${safe(treatment.imageAlt || treatment.name)}"></div><h3>${safe(treatment.name)}</h3></article>`).join('');
}

function renderFaqs() {
  const mount = document.querySelector('[data-treatment-faq]');
  if (mount) mount.innerHTML = faqs.map(([question, answer], index) => `<article class="faq-item"><h3><button type="button" aria-expanded="false" aria-controls="faq-panel-${index}"><span>${question}</span><i data-lucide="arrow-right" aria-hidden="true"></i></button></h3><div id="faq-panel-${index}" role="region" hidden><p>${answer}</p></div></article>`).join('');
}

function initializeInteractions() {
  document.addEventListener('click', (event) => {
    const detailButton = event.target.closest('[data-treatment-detail]');
    if (detailButton) {
      const treatment = treatments.find((item) => String(item.id) === detailButton.dataset.treatmentDetail);
      if (treatment) {
        renderTreatmentModal(treatment);
        openModal(document.querySelector('#treatment-detail-modal'), detailButton);
      }
    }
    const faqButton = event.target.closest('.faq-item button');
    if (faqButton) toggleFaq(faqButton);
  });
}

function renderTreatmentModal(treatment) {
  const target = document.querySelector('[data-treatment-modal-content]');
  if (!target) return;
  const whatsappText = `Hello Titanium Roots Dental Clinic,\n\nI would like to enquire about ${treatment.name}.`;
  target.innerHTML = `<div class="treatment-modal__media"><img src="${treatment.image ? publicMediaUrl(treatment.image) : placeholder}" width="1200" height="900" alt="${safe(treatment.imageAlt || treatment.name)}"></div><p class="modal__eyebrow">${safe(treatment.category)}</p><h2 id="treatment-detail-title">${safe(treatment.name)}</h2><p>${safe(treatment.fullDescription)}</p><dl class="treatment-modal__facts"><div><dt>Duration</dt><dd>${safe(treatment.duration)}</dd></div><div><dt>Visits</dt><dd>${safe(treatment.visits)}</dd></div><div><dt>Pricing</dt><dd>${priceLabel(treatment)}</dd></div></dl><div class="treatment-modal__detail"><h3>Potential benefits</h3><ul>${listFor(treatment.benefits).map((benefit) => `<li>${safe(benefit)}</li>`).join('')}</ul><h3>Suitability</h3><p>${safe(treatment.suitability)}</p><h3>General process</h3><p>${safe(treatment.procedureSteps)}</p><h3>Recovery and aftercare</h3><p>${safe(treatment.recoveryInformation)}</p></div><p class="treatment-modal__disclaimer">Treatment suitability, duration and pricing are confirmed after clinical consultation.</p><div class="treatment-modal__actions"><button class="button" type="button" data-modal-open="appointment-modal" data-treatment-interest="${safe(treatment.name)}">Book Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button><a class="button button--secondary" href="https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}" target="_blank" rel="noopener noreferrer">WhatsApp Enquiry <i data-lucide="message-circle" aria-hidden="true"></i></a></div>`;
  createIcons({ icons: ICON_SET });
}

function toggleFaq(button) {
  const panel = button.closest('.faq-item').querySelector('[role="region"]');
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  panel.hidden = expanded;
}

function priceLabel(treatment) {
  return treatment.priceStatus === 'confirmed' && treatment.price
    ? `Starts from ₹${Number(treatment.price).toLocaleString('en-IN')}`
    : 'Price confirmed after consultation';
}

function cardDuration(treatment) {
  return treatment.duration === 'Timeline discussed after consultation' ? 'Varies' : treatment.duration;
}

function cardVisits(treatment) {
  return treatment.visits || 'Based on your treatment plan';
}

function initializeAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.from('[data-treatments-hero-heading], [data-treatments-hero-copy]', { y: 20, opacity: 0, duration: 0.55, stagger: 0.1 });
}
