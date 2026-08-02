import { gsap } from 'gsap';
import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { publicMediaUrl } from '../data/media-repository.js';
import { escapeHtml } from '../data/record-mappers.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';

let clinicGallery = [];

export async function initializeAbout() {
  if (document.body.dataset.aboutInitialized) return;
  document.body.dataset.aboutInitialized = 'true';
  await Promise.all([
    loadCollection('gallery', (rows) => { clinicGallery = rows.slice(0, 4); }, renderGallery),
  ]);

  renderGallery();
  createIcons({ icons: ICON_SET });
  initializeAnimations();
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

function initializeAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.timeline({ defaults: { ease: 'power2.out' } })
    .from('[data-about-hero-eyebrow]', { y: 16, opacity: 0, duration: 0.4 })
    .from('[data-about-hero-heading]', { y: 25, opacity: 0, duration: 0.62 }, '-=0.18')
    .from('[data-about-hero-copy], [data-about-hero-actions], .about-hero__trust', { y: 16, opacity: 0, duration: 0.45, stagger: 0.1 }, '-=0.35')
    .from('[data-about-hero-visual]', { scale: 1.025, opacity: 0, duration: 0.72 }, '-=0.5');

  document.querySelectorAll('[data-about-reveal-section]').forEach((section) => {
    const targets = section.querySelectorAll('h2, .section-eyebrow, [data-about-reveal-image], .value-card, .diff-item, .timeline-step, .clinic-detail, .about-doctor-card, .faq-item');
    if (!targets.length) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      gsap.from(targets, { y: 20, opacity: 0, duration: 0.48, stagger: 0.06, ease: 'power2.out' });
      observer.unobserve(section);
    }, { threshold: 0.15 });

    observer.observe(section);
  });
}
