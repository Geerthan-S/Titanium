import '../css/global.css';
import '../css/hero-alignment.css';
import '../css/treatment-card-rules.css';
import '../css/treatment-catalogue-polish.css';
import { gsap } from 'gsap';
import Swiper from 'swiper';
import { startApplication } from './main.js';
import { initializeHome } from './pages/home.js';
import { initializeAbout } from './pages/about.js';
import { initializeTreatments } from './pages/treatments.js';
import { initializeDoctors } from './pages/doctors.js';
import { initializeBlog } from './pages/blog.js';
import { initializeContact } from './pages/contact.js';
import { initializeTestimonials } from './pages/testimonials.js';
import { recordAnalyticsEvent } from './data/analytics-repository.js';
import {
  disposePublicContent,
  loadPublicContent,
  onPublicContent,
  subscribePublicContent,
} from './data/public-content-store.js';

export { gsap, Swiper };

const phoneHref = (value) => `tel:${String(value || '').replace(/[^\d+]/g, '')}`;
const emailHref = (value) => `mailto:${encodeURIComponent(String(value || '').trim())}`;
const whatsappHref = (value) => `https://wa.me/${String(value || '').replace(/\D/g, '')}`;

export function applyWebsiteAssets(assets = []) {
  assets.forEach((asset) => {
    if (!asset.assetKey || !asset.imagePath) return;
    const targets = document.querySelectorAll(`[data-website-asset="${asset.assetKey}"]`);
    targets.forEach((target) => {
      if (target.tagName.toLowerCase() === 'img') {
        target.src = asset.imagePath;
        if (asset.altText) target.alt = asset.altText;
      } else {
        target.style.backgroundImage = `url('${asset.imagePath}')`;
        if (asset.altText) target.setAttribute('aria-label', asset.altText);
      }
    });
  });
}

export function applyPublicSettings(settings = {}) {
  const identity = settings.clinicIdentity || {};
  const contact = settings.contact || {};
  const footer = settings.footer || {};
  const brand = settings.brand || {};
  document.querySelectorAll('[data-setting-clinic-name]').forEach((target) => {
    target.textContent = identity.clinicName || identity.shortName || 'Titanium Roots Dental Clinic';
  });
  document.querySelectorAll('[data-setting-phone]').forEach((target) => {
    target.textContent = contact.primaryPhone || '';
    target.href = phoneHref(contact.primaryPhone);
  });
  document.querySelectorAll('[data-setting-email]').forEach((target) => {
    target.textContent = contact.email || '';
    target.href = emailHref(contact.email);
  });
  document.querySelectorAll('[data-setting-alternate-phone]').forEach((target) => {
    target.textContent = contact.alternatePhone || '';
    target.href = phoneHref(contact.alternatePhone);
  });
  document.querySelectorAll('[data-setting-appointment-email]').forEach((target) => {
    target.textContent = contact.appointmentEmail || '';
    target.href = emailHref(contact.appointmentEmail);
  });
  document.querySelectorAll('[data-setting-whatsapp]').forEach((target) => {
    target.href = whatsappHref(contact.whatsapp);
  });
  document.querySelectorAll('[data-setting-address]').forEach((target) => {
    target.textContent = contact.address || '';
  });
  document.querySelectorAll('[data-setting-directions]').forEach((target) => {
    if (contact.directionsUrl) target.href = contact.directionsUrl;
  });
  document.querySelectorAll('[data-setting-map]').forEach((target) => {
    if (contact.mapsUrl) target.src = contact.mapsUrl;
  });
  document.querySelectorAll('[data-setting-footer-description]').forEach((target) => {
    target.textContent = footer.description || '';
  });
  document.querySelectorAll('[data-setting-copyright]').forEach((target) => {
    target.textContent = footer.copyright || identity.clinicName || '';
  });
  const variables = {
    '--color-primary': brand.primaryEmerald,
    '--color-sage': brand.supportingSage,
    '--color-background': brand.backgroundIvory,
    '--color-accent': brand.accentChampagne,
  };
  Object.entries(variables).forEach(([name, value]) => {
    if (/^#[\da-f]{6}$/i.test(value || '')) document.documentElement.style.setProperty(name, value);
  });
}

startApplication().then(async () => {
  const analyticsContext = {
    pagePath: location.pathname,
    referrerDomain: (() => {
      try { return document.referrer ? new URL(document.referrer).hostname : ''; } catch { return ''; }
    })(),
  };
  await recordAnalyticsEvent({ eventType: 'page_view', ...analyticsContext }).catch(() => { });
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (link.href.startsWith('https://wa.me/')) {
      recordAnalyticsEvent({ eventType: 'whatsapp_click', ...analyticsContext }).catch(() => { });
    } else if (link.protocol === 'tel:') {
      recordAnalyticsEvent({ eventType: 'phone_click', ...analyticsContext }).catch(() => { });
    } else if (event.target.closest('.button, [data-modal-open]')) {
      recordAnalyticsEvent({ eventType: 'cta_click', ...analyticsContext }).catch(() => { });
    }
  }, { passive: true });
  try {
    applyPublicSettings(await loadPublicContent('settings'));
    onPublicContent('settings', ({ status, data }) => {
      if (status === 'ready') applyPublicSettings(data);
    });
    subscribePublicContent('settings');
  } catch {
    // Existing component defaults remain available if the data service is temporarily unavailable.
  }

  try {
    const assets = await loadPublicContent('websiteAssets');
    applyWebsiteAssets(assets);
    onPublicContent('websiteAssets', ({ status, data }) => {
      if (status === 'ready') applyWebsiteAssets(data);
    });
    subscribePublicContent('websiteAssets');
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to load website assets:', error);
  }

  if (document.body.dataset.page === 'home') await initializeHome();
  if (document.body.dataset.page === 'about') await initializeAbout();
  if (document.body.dataset.page === 'treatments') await initializeTreatments();
  if (document.body.dataset.page === 'doctors') await initializeDoctors();
  if (document.body.dataset.page === 'blog') await initializeBlog();
  if (document.body.dataset.page === 'contact') await initializeContact();
  if (document.body.dataset.page === 'testimonials') await initializeTestimonials();
  document.body.dataset.publicInitialized = 'true';
});

window.addEventListener('pagehide', () => {
  disposePublicContent().catch(() => { });
}, { once: true });
