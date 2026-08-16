import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { stockMedia } from '../data/media-assets.js';
import { escapeHtml } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';

let clinicGallery = [];
const fallbackGallery = [
  { src: stockMedia.clinic, alt: 'Modern Titanium Roots dental clinic interior' },
  { src: stockMedia.treatment, alt: 'Prepared dental treatment room' },
  { src: stockMedia.clinicReception, alt: 'Titanium Roots clinic reception area' },
  { src: stockMedia.patient, alt: 'Comfort-focused patient care' },
];

export async function initializeAbout() {
  if (document.body.dataset.aboutInitialized) return;
  document.body.dataset.aboutInitialized = 'true';
  renderGallery();
  createIcons({ icons: ICON_SET });
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
    if (section) section.hidden = false;
    gallery.innerHTML = fallbackGallery.map(({ src, alt }) => `<img src="${src}" data-media-fallback="clinic" width="1200" height="900" loading="lazy" alt="${alt}">`).join('');
    return;
  }
  if (section) section.hidden = false;
  gallery.innerHTML = clinicGallery.map(({ storagePath, altText, title }) => `<img src="${publicMediaUrl(storagePath)}" data-media-fallback="clinic" width="1200" height="900" loading="lazy" alt="${escapeHtml(altText || title)}">`).join('');
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
