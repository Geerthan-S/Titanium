import { gsap } from 'gsap';
import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { openModal } from '../components/modal.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { escapeHtml, sanitizeCmsHtml } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';
import { SITE_CONFIG, TREATMENT_CATEGORIES } from '../utils/constants.js';

const placeholder = '/assets/images/placeholders/clinic-neutral.svg';
const heroStatistics = [
  { value: '10+', label: 'Years Experience', icon: 'stethoscope' },
  { value: '5000+', label: 'Happy Patients', icon: 'heart-handshake' },
  { value: '15+', label: 'Expert Doctors', icon: 'users-round' },
  { value: '20+', label: 'Treatments', icon: 'badge-plus' },
];
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
let activeFilter = 'All';

const safe = (value) => escapeHtml(value || '');
const listFor = (value) => Array.isArray(value)
  ? value
  : String(value || '').split(/\r?\n|,\s*/).map((item) => item.trim()).filter(Boolean);

export async function initializeTreatments() {
  if (document.body.dataset.treatmentsInitialized) return;
  document.body.dataset.treatmentsInitialized = 'true';
  document.querySelector('[data-breadcrumb-current]')?.replaceChildren('Treatments');

  const statisticsPanel = document.querySelector('[data-treatments-hero-features]');
  if (statisticsPanel && !statisticsPanel.dataset.initialized) {
    statisticsPanel.dataset.initialized = 'true';
    statisticsPanel.innerHTML = heroStatistics.map(({ value, label, icon }) =>
      `<article class="home-stat"><i data-lucide="${icon}" aria-hidden="true"></i><div><strong>${value}</strong><span>${label}</span></div></article>`
    ).join('');
  }

  try {
    treatments = await loadPublicContent('treatments');
    window.__clinicalDoctors = await loadPublicContent('doctors').catch(() => []);
  } catch {
    treatments = [];
    window.__clinicalDoctors = [];
  }
  onPublicContent('treatments', ({ status, data }) => {
    if (status !== 'ready') return;
    treatments = data;
    renderTreatments();
    createIcons({ icons: ICON_SET });
  });
  subscribePublicContent('treatments');
  renderHero();
  renderFilters();
  renderTreatments();
  renderWhy();
  renderJourney();
  renderTransformations();
  renderFaqs();
  createIcons({ icons: ICON_SET });
  initializeInteractions();
  initializeHistoryNavigation();
  initializeAnimations();
}

function initializeHistoryNavigation() {
  const checkPath = () => {
    const match = window.location.pathname.match(/^\/treatments\/([^./]+)\.html$/);
    if (!match) return;
    const slug = match[1];
    const treatment = treatments.find((t) => String(t.slug) === slug);
    if (treatment) {
      renderTreatmentModal(treatment);
      openModal(document.querySelector('#treatment-detail-modal'));
    } else {
      window.location.href = '/404.html';
    }
  };

  window.addEventListener('popstate', checkPath);
  setTimeout(checkPath, 50);
  window.__checkTreatmentPath = checkPath;
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

function renderFilters() {
  const container = document.querySelector('[data-treatment-filters]');
  if (!container) return;

  const categories = ['All', ...TREATMENT_CATEGORIES];
  container.innerHTML = `
    <div class="filter-buttons">
      ${categories.map(category => `
        <button
          class="filter-button ${activeFilter === category ? 'active' : ''}"
          data-filter="${safe(category)}"
          type="button"
        >${safe(category)}</button>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      renderFilters();
      renderTreatments();
      createIcons({ icons: ICON_SET });
    });
  });
}

function compactPriceSummary(treatment) {
  if (treatment.price) {
    return treatment.price;
  }

  const type = treatment.pricingDisplayType || 'consultation_required';
  const min = treatment.minPrice !== undefined && treatment.minPrice !== null && Number(treatment.minPrice) > 0 ? Number(treatment.minPrice) : null;
  const max = treatment.maxPrice !== undefined && treatment.maxPrice !== null && Number(treatment.maxPrice) > 0 ? Number(treatment.maxPrice) : null;

  if (type === 'exact_price' && min) {
    return `₹${min.toLocaleString('en-IN')}`;
  }
  if (type === 'starting_from' && min) {
    return `Starts from ₹${min.toLocaleString('en-IN')}`;
  }
  if (type === 'price_range' && min && max) {
    return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
  }
  if (type === 'not_displayed') {
    return null;
  }
  return 'Price confirmed after consultation';
}

function parseFaqs(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed;
  } catch (e) { }
  return String(value)
    .split('\n')
    .map(line => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        return { question: parts[0].trim(), answer: parts.slice(1).join('|').trim() };
      }
      return null;
    })
    .filter(Boolean);
}

function parseBeforeAfterGallery(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed;
  } catch (e) { }
  return String(value)
    .split('\n')
    .map(line => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        return {
          beforeUrl: parts[0].trim(),
          afterUrl: parts[1].trim(),
          caption: parts[2] ? parts[2].trim() : ''
        };
      }
      return null;
    })
    .filter(Boolean);
}

function renderTreatments() {
  const grid = document.querySelector('[data-treatment-grid]');
  if (!grid) return;

  const filteredTreatments = activeFilter === 'All'
    ? treatments
    : treatments.filter(t => t.category === activeFilter);

  grid.innerHTML = filteredTreatments.length
    ? filteredTreatments.map((treatment) => {
      const hasCardMedia = treatment.image;
      const cardMediaHtml = hasCardMedia
        ? `<div class="treatment-card__media"><img src="${publicMediaUrl(treatment.image)}" width="1200" height="900" loading="lazy" alt="${safe(treatment.imageAlt || treatment.name)}"></div>`
        : '';
      const featuredBadge = treatment.featured
        ? `<span class="treatment-card__featured-badge" style="position: absolute; top: 12px; right: 12px; background: var(--admin-emerald-800, #064e3b); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="sparkles" style="width: 10px; height: 10px;"></i> Featured</span>`
        : '';

      const durationRow = treatment.duration ? `<div><dt>Duration</dt><dd>${cardDuration(treatment)}</dd></div>` : '';
      const visitsRow = treatment.visits ? `<div><dt>Visits</dt><dd>${safe(treatment.visits)}</dd></div>` : '';
      const priceText = compactPriceSummary(treatment);
      const priceRow = priceText ? `<div><dt>Price</dt><dd>${safe(priceText)}</dd></div>` : '';

      const dlHtml = (durationRow || visitsRow || priceRow)
        ? `<dl>${durationRow}${visitsRow}${priceRow}</dl>`
        : '';

      return `<article class="treatment-card" id="${safe(treatment.slug)}" style="position: relative;">
          ${featuredBadge}
          ${cardMediaHtml}
          <div class="treatment-card__content">
            <p class="treatment-card__category">${safe(treatment.category)}</p>
            <h3>${safe(treatment.name)}</h3>
            <p>${safe(treatment.shortDescription)}</p>
            ${dlHtml}
            <div class="treatment-card__actions">
              <a class="button button--secondary treatment-card__details" href="/treatments/${safe(treatment.slug)}.html" data-treatment-open="${safe(treatment.id)}">View Details</a>
              <button class="button treatment-card__booking" type="button" data-modal-open="appointment-modal" data-treatment-interest="${safe(treatment.name)}">Book Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button>
            </div>
          </div>
        </article>`;
    }).join('')
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

  if (mount) mount.innerHTML = withImages.map((treatment) => {
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

    range.addEventListener('input', (e) => {
      const val = e.target.value;
      afterImg.style.clipPath = `polygon(${val}% 0, 100% 0, 100% 100%, ${val}% 100%)`;
      divider.style.left = `${val}%`;
    });
  });
}

function renderFaqs() {
  const mount = document.querySelector('[data-treatment-faq]');
  if (mount) mount.innerHTML = faqs.map(([question, answer], index) => `<article class="faq-item"><h3><button type="button" aria-expanded="false" aria-controls="faq-panel-${index}"><span>${question}</span><i data-lucide="arrow-right" aria-hidden="true"></i></button></h3><div id="faq-panel-${index}" role="region" hidden><p>${answer}</p></div></article>`).join('');
}

function initializeInteractions() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-treatment-open]');
    if (trigger && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      const treatment = treatments.find((t) => String(t.id) === trigger.dataset.treatmentOpen);
      if (treatment) {
        event.preventDefault();
        window.history.pushState(null, '', trigger.getAttribute('href'));
        renderTreatmentModal(treatment);
        openModal(document.querySelector('#treatment-detail-modal'), trigger);
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

  const pricingLabelVal = compactPriceSummary(treatment) || 'Price confirmed after consultation';

  let clinicalReviewHtml = '';
  if (treatment.reviewerDoctorId) {
    const doc = (window.__clinicalDoctors || []).find(d => d.id === treatment.reviewerDoctorId);
    if (doc) {
      clinicalReviewHtml = `
        <div class="treatment-clinical-governance" style="margin-top: 24px; padding: 16px; border: 1px solid var(--admin-line, #e2e8f0); border-radius: 8px; background: rgba(0,0,0,0.015);">
          <h4 style="margin: 0 0 8px 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--admin-charcoal, #1e293b); font-weight: 700;">Clinical Governance</h4>
          <p style="margin: 4px 0; font-size: 0.85rem;"><strong>Clinically Reviewed By:</strong> ${safe(doc.name)} ${doc.qualification ? `(${safe(doc.qualification)})` : ''}</p>
          ${treatment.lastReviewedAt ? `<p style="margin: 4px 0; font-size: 0.85rem;"><strong>Last Reviewed:</strong> ${safe(treatment.lastReviewedAt)}</p>` : ''}
          ${treatment.reviewerCredentials ? `<p style="margin: 4px 0; font-size: 0.85rem;"><strong>Credentials:</strong> ${safe(treatment.reviewerCredentials)}</p>` : ''}
        </div>
      `;
    }
  }

  const benefitsList = listFor(treatment.benefits);
  const benefitsHtml = benefitsList.length > 0
    ? `<h3>Potential benefits</h3><ul>${benefitsList.map((benefit) => `<li>${safe(benefit)}</li>`).join('')}</ul>`
    : '';

  const detailsHtml = `
    ${treatment.anaesthesiaSedation ? `<p><strong>Anaesthesia/Sedation:</strong> ${safe(treatment.anaesthesiaSedation)}</p>` : ''}
    ${treatment.expectedOutcome ? `<p><strong>Expected Outcome:</strong> ${safe(treatment.expectedOutcome)}</p>` : ''}
    ${treatment.expectedLongevity ? `<p><strong>Expected Longevity:</strong> ${safe(treatment.expectedLongevity)}</p>` : ''}
    ${treatment.suitability ? `<p><strong>Suitability:</strong> ${safe(treatment.suitability)}</p>` : ''}
    ${treatment.unsuitableCandidates ? `<p><strong>Contraindications:</strong> ${safe(treatment.unsuitableCandidates)}</p>` : ''}
    ${treatment.alternativeTreatments ? `<p><strong>Alternative Treatments:</strong> ${safe(treatment.alternativeTreatments)}</p>` : ''}
  `;

  const journeyHtml = `
    ${treatment.beforePreparation ? `<h4>Preparation</h4><p>${safe(treatment.beforePreparation)}</p>` : ''}
    ${treatment.steps || treatment.procedureSteps ? `<h4>Procedure Steps</h4><p>${safe(treatment.steps || treatment.procedureSteps)}</p>` : ''}
    ${treatment.recovery || treatment.recoveryInformation ? `<h4>Recovery & Aftercare</h4><p>${safe(treatment.recovery || treatment.recoveryInformation)}</p>` : ''}
    ${treatment.aftercare ? `<p><strong>Aftercare Guidelines:</strong> ${safe(treatment.aftercare)}</p>` : ''}
    ${treatment.whenContactClinic ? `<p><strong>When to Contact Clinic:</strong> ${safe(treatment.whenContactClinic)}</p>` : ''}
  `;

  const parsedFaqs = parseFaqs(treatment.faqJson);
  let faqsHtml = '';
  if (parsedFaqs.length > 0) {
    faqsHtml = `<h3>Frequently Asked Questions</h3><div class="treatment-modal-faqs" style="margin-top: 12px; display: flex; flex-direction: column; gap: 12px;">` +
      parsedFaqs.map((faq, idx) => `
        <details class="faq-item" style="border: 1px solid var(--admin-line, #e2e8f0); border-radius: 6px; padding: 12px;">
          <summary style="font-weight: 700; cursor: pointer; font-size: 0.85rem; outline: none; list-style: none; display: flex; justify-content: space-between; align-items: center;">
            <span>${safe(faq.question)}</span>
            <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </summary>
          <p style="margin: 8px 0 0 0; font-size: 0.8rem; color: #475569; line-height: 1.5;">${safe(faq.answer)}</p>
        </details>
      `).join('') + `</div>`;
  }

  const parsedBA = parseBeforeAfterGallery(treatment.beforeAfterGallery);
  let baHtml = '';
  if (parsedBA.length > 0 && treatment.beforeAfterConsent) {
    baHtml = `
      <h3>Before & After Results</h3>
      <div class="before-after-gallery-modal" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 16px;">
        ${parsedBA.map((item, idx) => `
          <div class="transformation-card" style="border: 1px solid var(--admin-line, #e2e8f0); border-radius: 8px; overflow: hidden; background: #fff; padding: 10px;">
            <div class="transformation-slider" data-before-after-modal="${idx}" style="position: relative; width: 100%; aspect-ratio: 4/3; border-radius: 6px; overflow: hidden; background: #f1f5f9;">
              <img class="transformation-slider__before" src="${escapeHtml(item.beforeUrl)}" width="1200" height="900" loading="lazy" alt="Before" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;">
              <img class="transformation-slider__after" src="${escapeHtml(item.afterUrl)}" width="1200" height="900" loading="lazy" alt="After" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;">
              <input type="range" min="0" max="100" value="50" class="transformation-slider__range" aria-label="Compare before and after" style="position: absolute; top:0; left:0; width: 100%; height: 100%; opacity: 0; z-index: 10; cursor: ew-resize;">
              <div class="transformation-slider__divider" style="position: absolute; top:0; bottom:0; left:50%; width: 2px; background: #fff; z-index: 5; pointer-events: none; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>
              <div class="transformation-labels" style="position: absolute; bottom: 8px; left: 8px; right: 8px; display: flex; justify-content: space-between; z-index: 6; pointer-events: none;">
                <span style="background: rgba(0,0,0,0.6); color: #fff; padding: 2px 6px; font-size: 0.65rem; border-radius: 3px; font-weight: 700;">Before</span>
                <span style="background: rgba(0,0,0,0.6); color: #fff; padding: 2px 6px; font-size: 0.65rem; border-radius: 3px; font-weight: 700;">After</span>
              </div>
            </div>
            ${item.caption ? `<p class="transformation-caption" style="margin: 8px 0 0 0; font-size: 0.75rem; color: #475569; text-align: center;">${safe(item.caption)}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  let relatedHtml = '';
  if (treatment.relatedTreatmentIds) {
    const relatedIds = Array.isArray(treatment.relatedTreatmentIds)
      ? treatment.relatedTreatmentIds
      : String(treatment.relatedTreatmentIds).split(',').map(s => s.trim()).filter(Boolean);
    const filteredIds = relatedIds.filter(id => id !== treatment.id);
    const uniqueIds = [...new Set(filteredIds)];
    const matches = uniqueIds.map(id => treatments.find(t => t.id === id)).filter(Boolean);
    if (matches.length > 0) {
      relatedHtml = `
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--admin-line, #e2e8f0);">
          <h4 style="margin: 0 0 8px 0; font-size: 0.85rem; text-transform: uppercase; color: var(--admin-charcoal, #1e293b); font-weight: 700;">Related Treatments</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${matches.map(m => `<a href="/treatments/${safe(m.slug)}.html" data-treatment-open="${safe(m.id)}" class="button button--secondary" style="font-size: 0.75rem; padding: 4px 10px;">${safe(m.name)}</a>`).join('')}
          </div>
        </div>
      `;
    }
  }

  const hasMedia = treatment.image;
  const mediaHtml = hasMedia
    ? `<div class="treatment-modal__media"><img src="${publicMediaUrl(treatment.image)}" width="1200" height="900" alt="${safe(treatment.imageAlt || treatment.name)}"></div>`
    : '';

  target.innerHTML = `
    ${mediaHtml}
    <p class="modal__eyebrow">${safe(treatment.category)}</p>
    <h2 id="treatment-detail-title">${safe(treatment.name)}</h2>
    <p>${sanitizeCmsHtml(treatment.fullDescription || treatment.shortDescription)}</p>
    
    <dl class="treatment-modal__facts">
      ${treatment.duration ? `<div><dt>Duration</dt><dd>${safe(treatment.duration)}</dd></div>` : ''}
      ${treatment.visits ? `<div><dt>Visits</dt><dd>${safe(treatment.visits)}</dd></div>` : ''}
      <div><dt>Pricing</dt><dd>${safe(pricingLabelVal)}</dd></div>
    </dl>
    
    <div class="treatment-modal__detail">
      ${benefitsHtml}
      ${detailsHtml.trim() ? `<h3>Treatment Details</h3>${detailsHtml}` : ''}
      ${journeyHtml.trim() ? `<h3>Patient Journey</h3>${journeyHtml}` : ''}
      ${baHtml}
      ${faqsHtml}
      ${clinicalReviewHtml}
      ${relatedHtml}
    </div>
    
    <p class="treatment-modal__disclaimer">Treatment suitability, duration and pricing are confirmed after clinical consultation.</p>
    <div class="treatment-modal__actions">
      <button class="button" type="button" data-modal-open="appointment-modal" data-treatment-interest="${safe(treatment.name)}">Book Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button>
      <a class="button button--secondary" href="https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}" target="_blank" rel="noopener noreferrer">WhatsApp Enquiry <i data-lucide="message-circle" aria-hidden="true"></i></a>
    </div>
  `;

  target.querySelectorAll('[data-before-after-modal]').forEach((slider) => {
    const range = slider.querySelector('input[type="range"]');
    const afterImg = slider.querySelector('.transformation-slider__after');
    const divider = slider.querySelector('.transformation-slider__divider');

    range.addEventListener('input', (e) => {
      const val = e.target.value;
      afterImg.style.clipPath = `polygon(${val}% 0, 100% 0, 100% 100%, ${val}% 100%)`;
      divider.style.left = `${val}%`;
    });
  });

  createIcons({ icons: ICON_SET });
}

function toggleFaq(button) {
  const panel = button.closest('.faq-item').querySelector('[role="region"]');
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  panel.hidden = expanded;
}

function priceLabel(treatment) {
  return compactPriceSummary(treatment) || 'Price confirmed after consultation';
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
