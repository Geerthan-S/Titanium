import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { loadComponents } from '../components/component-loader.js';
import { escapeHtml } from '../data/record-mappers.js';

const safe = (value) => escapeHtml(value || '');
const list = (value) => Array.isArray(value) ? value : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

function pageData() {
  return JSON.parse(document.getElementById('page-data')?.textContent || '{}');
}

function schemaFor(doctor) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: doctor.name,
    jobTitle: doctor.designation,
    worksFor: { '@type': 'Dentist', name: 'Titanium Roots Dental Clinic' },
    knowsLanguage: list(doctor.languages),
  };
}

function renderDoctor(doctor) {
  const mount = document.querySelector('[data-doctor-profile]');
  if (!mount) return;
  mount.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><a href="/doctors/">Doctors</a><strong>${safe(doctor.name)}</strong></nav>
    <header class="doctors-hero">
      <div class="container doctors-hero__grid">
        <div>
          <p class="section-eyebrow">${safe(doctor.designation)}</p>
          <h1>${safe(doctor.name)}</h1>
          <p>${safe(doctor.short_bio || doctor.biography)}</p>
          <button class="button" type="button" data-modal-open="appointment-modal" data-doctor-selection="${safe(doctor.name)}">Book an Appointment</button>
        </div>
      </div>
    </header>
    <section class="container doctor-profile__details">
      <h2>Qualifications and registration</h2>
      <dl>
        <div><dt>Qualification</dt><dd>${safe(doctor.qualification)}</dd></div>
        <div><dt>Registration</dt><dd>${safe(doctor.registration_number || 'Available after verification')}</dd></div>
        <div><dt>Clinical focus</dt><dd>${safe(doctor.specialization)}</dd></div>
        <div><dt>Languages</dt><dd>${list(doctor.languages).map(safe).join(', ')}</dd></div>
      </dl>
      <h2>Approach to care</h2>
      <p>${safe(doctor.philosophy || doctor.biography)}</p>
      <h2>Consultation information</h2>
      <p>${safe(doctor.consultation || 'Consultation availability is confirmed during appointment booking.')}</p>
    </section>
  `;
  document.querySelector('[data-schema-json]').textContent = JSON.stringify(schemaFor(doctor));
  createIcons({ icons: ICON_SET });
}

async function initializeDoctorProfile() {
  await loadComponents();
  renderDoctor(pageData());
  document.querySelector('.page-loader')?.classList.add('is-hidden');
}

initializeDoctorProfile();
