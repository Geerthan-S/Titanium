import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { loadComponents } from '../components/component-loader.js';
import { escapeHtml } from '../data/record-mappers.js';

const safe = (value) => escapeHtml(value || '');
const lines = (value) => String(value || '').split(/\r?\n|,\s*/).map((item) => item.trim()).filter(Boolean);

function pageData() {
  const node = document.getElementById('page-data');
  return node ? JSON.parse(node.textContent || '{}') : {};
}

function schemaFor(treatment) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: treatment.name,
    description: treatment.short_description,
    isPartOf: { '@type': 'WebSite', name: 'Titanium Roots', url: 'https://titaniumroots.com/' },
    publisher: { '@type': 'Dentist', name: 'Titanium Roots Dental Clinic' },
  };
}

function renderTreatment(treatment) {
  const mount = document.querySelector('[data-treatment-detail]');
  if (!mount) return;
  const benefits = lines(treatment.benefits);
  const triggers = lines(treatment.suitability || treatment.concern_triggers?.join('\n'));
  mount.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><a href="/treatments/">Treatments</a><strong>${safe(treatment.name)}</strong></nav>
    <header class="treatments-hero">
      <div class="container">
        <p class="section-eyebrow">${safe(treatment.category)}</p>
        <h1>${safe(treatment.name)}</h1>
        <p>${safe(treatment.full_description || treatment.short_description)}</p>
        <button class="button" type="button" data-modal-open="appointment-modal" data-treatment-interest="${safe(treatment.name)}">Book an Appointment</button>
      </div>
    </header>
    <section class="container treatment-modal__detail">
      <h2>When a consultation may be useful</h2>
      <ul>${triggers.map((item) => `<li>${safe(item)}</li>`).join('')}</ul>
      <h2>Potential benefits</h2>
      <ul>${benefits.map((item) => `<li>${safe(item)}</li>`).join('')}</ul>
      <h2>Typical care pathway</h2>
      <p>${safe(treatment.procedure_steps)}</p>
      <h2>Aftercare and limitations</h2>
      <p>${safe(treatment.aftercare || treatment.recovery)}</p>
      <p>${safe(treatment.limitations || '')}</p>
      <p class="treatment-modal__disclaimer">Treatment suitability, duration, limitations and pricing are confirmed after clinical consultation.</p>
    </section>
  `;
  document.querySelector('[data-schema-json]').textContent = JSON.stringify(schemaFor(treatment));
  createIcons({ icons: ICON_SET });
}

async function initializeTreatmentDetail() {
  await loadComponents();
  renderTreatment(pageData());
  document.querySelector('.page-loader')?.classList.add('is-hidden');
}

initializeTreatmentDetail();
