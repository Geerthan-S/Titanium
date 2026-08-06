
import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { escapeHtml } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';

const heroStatistics = [
  { value: '10+', label: 'Years Experience', icon: 'stethoscope' },
  { value: '5000+', label: 'Happy Patients', icon: 'heart-handshake' },
  { value: '15+', label: 'Expert Doctors', icon: 'users-round' },
  { value: '20+', label: 'Treatments', icon: 'badge-plus' },
];

let clinicGallery = [];

export async function initializeAbout() {
  if (document.body.dataset.aboutInitialized) return;
  document.body.dataset.aboutInitialized = 'true';

  const statisticsPanel = document.querySelector('.about-statistics');
  if (statisticsPanel && !statisticsPanel.dataset.initialized) {
    statisticsPanel.dataset.initialized = 'true';
    statisticsPanel.innerHTML = heroStatistics.map(({ value, label, icon }) =>
      `<article class="home-stat"><i data-lucide="${icon}" aria-hidden="true"></i><div><strong>${value}</strong><span>${label}</span></div></article>`
    ).join('');
  }

  await Promise.all([
    loadCollection('gallery', (rows) => { clinicGallery = rows.slice(0, 4); }, renderGallery),
  ]);

  renderGallery();
  createIcons({ icons: ICON_SET });
  initializeFaq();
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

function renderGallery() {
  const gallery = document.querySelector('[data-about-gallery]');
  if (!gallery) return;
  const section = gallery.closest('section');
  if (!clinicGallery.length) {
    // Graceful fallback if no gallery images exist in CMS
    gallery.innerHTML = '<p class="content-empty">Clinic media will be available soon.</p>';
    return;
  }
  if (section) section.hidden = false;
  gallery.innerHTML = clinicGallery.map(({ storagePath, altText, title }) => `<img src="${publicMediaUrl(storagePath)}" width="1200" height="900" loading="lazy" alt="${escapeHtml(altText || title)}">`).join('');
}


function initializeFaq() {
  const triggers = document.querySelectorAll('.faq-trigger');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const controlsId = trigger.getAttribute('aria-controls');
      const content = document.getElementById(controlsId);

      trigger.setAttribute('aria-expanded', !isExpanded);
      if (content) {
        content.hidden = isExpanded;
      }
    });
  });
}
