import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { openModal } from '../components/modal.js';
import { escapeHtml, richTextSegments } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';
import { SITE_CONFIG } from '../utils/constants.js';

const trustFeatures = [
  ['message-circle', 'Clear Communication', 'Treatment conversations are kept clear and considered.'],
  ['scan-face', 'Thoughtful Treatment Planning', 'Care options are discussed after examination.'],
  ['heart-handshake', 'Patient-First Approach', 'Individual concerns help guide each consultation.'],
  ['sparkles', 'Comfort-Focused Care', 'The clinic aims to support a calm, informed visit.'],
  ['users-round', 'Collaborative Dental Team', 'Care planning can involve the appropriate dental team.'],
  ['shield-check', 'Continued Follow-Up', 'Follow-up guidance is discussed when it is relevant.'],
];
const journey = [
  ['01', 'Book Consultation', 'Arrange a consultation to discuss your concerns and goals.', 'calendar-days'],
  ['02', 'Meet the Dental Team', 'The clinic team helps guide your consultation process.', 'users-round'],
  ['03', 'Dental Examination', 'Your dentist reviews relevant clinical findings.', 'scan-face'],
  ['04', 'Treatment Discussion', 'Suitable options are discussed clearly after examination.', 'badge-plus'],
  ['05', 'Follow-Up Guidance', 'Next steps and any follow-up guidance are explained.', 'heart-handshake'],
];
const faqs = [
  ['How do I know which doctor to consult?', 'The clinic can guide you toward an appropriate specialist after understanding your concerns.'],
  ['Can I request a specific doctor?', 'You can share your preference when booking. Availability is confirmed by the clinic.'],
  ['Are doctor consultation timings fixed?', 'Consultation timing is confirmed during booking and may vary by doctor availability.'],
  ['Can I book directly with a specialist?', 'You may request a specialist, while the clinic confirms the most appropriate consultation arrangement.'],
];

let doctors = [];
let activeFilter = 'All Doctors';
let searchTerm = '';
let showAllDoctors = false;

const safe = (value) => escapeHtml(value || '');
const specialtiesFor = (doctor) => String(doctor.specialties || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export async function initializeDoctors() {
  if (document.body.dataset.doctorsInitialized) return;
  document.body.dataset.doctorsInitialized = 'true';
  document.querySelector('[data-breadcrumb-current]')?.replaceChildren('Doctors');
  renderHero();
  renderFilters();
  renderDirectory();
  renderTrust();
  renderJourney();
  renderAvailability();
  renderFaqs();
  createIcons({ icons: ICON_SET });
  try {
    doctors = await loadPublicContent('doctors');
  } catch {
    doctors = [];
  }
  onPublicContent('doctors', ({ status, data }) => {
    if (status !== 'ready') return;
    doctors = data;

    renderFilters();
    renderDirectory();
    renderAvailability();
  });
  subscribePublicContent('doctors');
  renderHero();

  renderFilters();
  renderDirectory();
  renderTrust();
  renderJourney();
  renderAvailability();
  renderFaqs();
  createIcons({ icons: ICON_SET });
  bindInteractions();
  initializeHistoryNavigation();
}

function initializeHistoryNavigation() {
  const checkPath = () => {
    const match = window.location.pathname.match(/^\/doctors\/([^./]+)\.html$/);
    if (!match) return;
    const slug = match[1];
    const doctor = doctors.find((d) => String(d.slug) === slug);
    if (doctor) {
      renderProfileModal(doctor);
      openModal(document.querySelector('#doctor-profile-modal'));
    }
  };

  window.addEventListener('popstate', checkPath);
  setTimeout(checkPath, 50);
  window.__checkDoctorPath = checkPath;
}

function renderHero() {
  const promise = document.querySelector('[data-doctors-hero-promise]');
  if (promise) promise.innerHTML = [
    ['heart-handshake', 'Patient-First Communication'],
    ['badge-plus', 'Thoughtful Treatment Planning'],
    ['sparkles', 'Comfort-Focused Care'],
  ].map(([icon, text]) => `<div><i data-lucide="${icon}" aria-hidden="true"></i><span>${text}</span></div>`).join('');
  const statistics = document.querySelector('[data-doctor-statistics]');
  if (statistics) statistics.innerHTML = [
    ['Dental Professionals', doctors.length || '—', 'users-round'],
    ['Specialities', new Set(doctors.flatMap(specialtiesFor)).size || '—', 'stethoscope'],
    ['Patient-Focused Care', 'Every visit', 'heart-handshake'],
  ].map(([label, value, icon]) => `<article><i data-lucide="${icon}" aria-hidden="true"></i><div><strong>${value}</strong><span>${label}</span></div></article>`).join('');
}

function doctorCard(doctor, featured = false) {
  const experience = doctor.experience ? `${doctor.experience}+ years experience` : 'Ask about experience';
  const availabilityText = String(doctor.availability || 'Available on request').replace(/\r?\n/g, ' &middot; ');

  return `<article class="${featured ? 'featured-doctor-card' : 'doctor-card'}">
    <div class="doctor-card__content">
      <h3>${safe(doctor.name)}</h3>
      <p>${safe(doctor.designation)}</p><p>${safe(doctor.qualification)}</p><p>${safe(doctor.specialization)}</p>
      <div style="display:flex; flex-direction:column; gap:4px; margin: 7px 0 10px;">
        <span class="doctor-card__experience" style="margin:0;"><i data-lucide="stethoscope" aria-hidden="true"></i>${safe(experience)}</span>
        <span class="doctor-card__experience" style="margin:0;"><i data-lucide="clock" aria-hidden="true"></i>${availabilityText}</span>
      </div>
      <div class="doctor-card__actions">
        <button class="button" type="button" data-modal-open="appointment-modal" data-doctor-selection="${safe(doctor.name)}" data-treatment-interest="General consultation">Book Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button>
        <a class="text-link" href="/doctors/${safe(doctor.slug)}.html">View Profile <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      </div>
    </div>
  </article>`;
}



function renderFilters() {
  const mount = document.querySelector('[data-doctor-filters]');
  if (!mount) return;
  const filters = ['All Doctors', ...new Set(doctors.flatMap(specialtiesFor))];
  if (!filters.includes(activeFilter)) activeFilter = 'All Doctors';
  mount.innerHTML = filters.map((filter) => `<button type="button" data-doctor-filter="${safe(filter)}" aria-pressed="${filter === activeFilter}">${safe(filter)}</button>`).join('') + `<button class="text-button" type="button" data-doctor-reset style="margin-left:8px; align-self:center;">Reset filters</button>`;
}

function renderDirectory() {
  const filtered = doctors.filter((doctor) => (
    (activeFilter === 'All Doctors' || specialtiesFor(doctor).includes(activeFilter))
    && `${doctor.name} ${doctor.specialization}`.toLowerCase().includes(searchTerm)
  ));
  const initialLimit = window.matchMedia('(max-width: 640px)').matches ? 6 : 8;
  const visibleDoctors = showAllDoctors || activeFilter !== 'All Doctors' || searchTerm
    ? filtered
    : filtered.slice(0, initialLimit);
  const grid = document.querySelector('[data-doctor-grid]');
  if (grid) grid.innerHTML = visibleDoctors.map((doctor) => doctorCard(doctor)).join('');
  const count = document.querySelector('[data-doctor-count]');
  if (count) {
    const suffix = filtered.length === visibleDoctors.length ? '' : `, showing ${visibleDoctors.length} first`;
    count.textContent = `${filtered.length} doctor${filtered.length === 1 ? '' : 's'}${suffix}`;
  }
  const loadMore = document.querySelector('[data-doctor-load-more]');
  if (loadMore) loadMore.hidden = filtered.length <= visibleDoctors.length;
  const empty = document.querySelector('[data-doctor-empty]');
  if (empty) empty.hidden = filtered.length !== 0;
  createIcons({ icons: ICON_SET });
}

function renderTrust() {
  const mount = document.querySelector('[data-doctors-why]');
  if (mount) mount.innerHTML = trustFeatures.map(([icon, title, copy]) => `<article><i data-lucide="${icon}" aria-hidden="true"></i><h3>${title}</h3><p>${copy}</p></article>`).join('');
}

function renderJourney() {
  const mount = document.querySelector('[data-doctors-journey]');
  if (mount) mount.innerHTML = journey.map(([number, title, copy, icon]) => `<li><span><i data-lucide="${icon}" aria-hidden="true"></i></span><strong>${number}</strong><h3>${title}</h3><p>${copy}</p></li>`).join('');
}

function renderAvailability() {
  const select = document.querySelector('[data-availability-doctor]');
  if (!select) return;
  select.innerHTML = `<option value="">Any available doctor</option>${doctors.map((doctor) => `<option value="${safe(doctor.name)}">${safe(doctor.name)}</option>`).join('')}`;
}

function renderFaqs() {
  const mount = document.querySelector('[data-doctors-faq]');
  if (mount) mount.innerHTML = faqs.map(([question, answer], index) => `<article class="faq-item"><h3><button type="button" aria-expanded="false" aria-controls="doctors-faq-${index}"><span>${question}</span><i data-lucide="arrow-right" aria-hidden="true"></i></button></h3><div id="doctors-faq-${index}" role="region" hidden><p>${answer}</p></div></article>`).join('');
}

function bindInteractions() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="/doctors/"]');
    if (link && !event.ctrlKey && !event.metaKey) {
      const match = link.getAttribute('href').match(/^\/doctors\/([^./]+)\.html$/);
      if (match) {
        event.preventDefault();
        window.history.pushState(null, '', link.getAttribute('href'));
        if (window.__checkDoctorPath) window.__checkDoctorPath();
      }
    }
    const filter = event.target.closest('[data-doctor-filter]');
    if (filter) {
      activeFilter = filter.dataset.doctorFilter;
      showAllDoctors = false;
      renderFilters();
      renderDirectory();
    }
    if (event.target.closest('[data-doctor-reset]')) {
      activeFilter = 'All Doctors';
      searchTerm = '';
      showAllDoctors = false;
      const search = document.querySelector('[data-doctor-search]');
      if (search) search.value = '';
      renderFilters();
      renderDirectory();
    }
    if (event.target.closest('[data-doctor-show-all]')) {
      showAllDoctors = true;
      renderDirectory();
    }
    const faq = event.target.closest('.doctors-faq .faq-item button');
    if (faq) toggleFaq(faq);
  });
  document.querySelector('[data-doctor-search]')?.addEventListener('input', (event) => {
    searchTerm = event.target.value.trim().toLowerCase();
    showAllDoctors = false;
    renderDirectory();
  });

}

function renderProfileModal(doctor) {
  const target = document.querySelector('[data-doctor-modal-content]');
  if (!target) return;
  const message = `Hello Titanium Roots Dental Clinic,\n\nI would like to enquire about consulting ${doctor.name}.`;
  target.innerHTML = `<p class="modal__eyebrow">${safe(doctor.specialization)}</p><h2 id="doctor-profile-title">${safe(doctor.name)}</h2><p>${safe(doctor.designation)}</p>
    <dl class="doctor-modal__facts">
      <div><dt>Qualification</dt><dd>${safe(doctor.qualification)}</dd></div>
      <div><dt>Experience</dt><dd>${doctor.experience ? `${safe(doctor.experience)}+ years` : 'Available on request'}</dd></div>
      <div><dt>Languages</dt><dd>${safe(doctor.languages)}</dd></div>
      <div><dt>Registration</dt><dd>${safe(doctor.registrationNumber)}</dd></div>
      <div><dt>Availability</dt><dd>${safe(doctor.availability)}</dd></div>
    </dl>
    <h3>About</h3>${richTextSegments(doctor.biography)}<h3>Treatment philosophy</h3>${richTextSegments(doctor.philosophy)}<p class="doctor-modal__note">${safe(doctor.consultation)}</p>
    <div class="doctor-modal__actions"><button class="button" type="button" data-modal-open="appointment-modal" data-doctor-selection="${safe(doctor.name)}">Book Appointment <i data-lucide="calendar-days" aria-hidden="true"></i></button><a class="button button--secondary" href="https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener noreferrer">WhatsApp Consultation <i data-lucide="message-circle" aria-hidden="true"></i></a></div>`;
  createIcons({ icons: ICON_SET });
}

function toggleFaq(button) {
  const panel = button.closest('.faq-item').querySelector('[role="region"]');
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  panel.hidden = expanded;
}
