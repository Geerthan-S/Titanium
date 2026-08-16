import { createIcons } from 'lucide';
import { ICON_SET } from './icons.js';
import { SITE_CONFIG } from '../utils/constants.js';

export function initializeFooter() {
  document.querySelectorAll('[data-current-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });
  document.querySelectorAll('[data-site-name]').forEach((element) => { element.textContent = SITE_CONFIG.clinicName; });
  document.querySelectorAll('[data-footer-description]').forEach((element) => { element.textContent = SITE_CONFIG.footerDescription; });
  document.querySelectorAll('[data-site-phone]').forEach((element) => { element.textContent = SITE_CONFIG.phone; element.href = `tel:${SITE_CONFIG.phone.replace(/\s/g, '')}`; });
  document.querySelectorAll('[data-site-email]').forEach((element) => { element.textContent = SITE_CONFIG.email; element.href = `mailto:${SITE_CONFIG.email}`; });
  document.querySelectorAll('[data-site-address]').forEach((element) => { element.textContent = SITE_CONFIG.address; });
  document.querySelectorAll('[data-site-timings]').forEach((element) => { element.textContent = SITE_CONFIG.timings; });
  document.querySelectorAll('footer [data-newsletter-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.elements.email;
    const status = form.querySelector('[data-newsletter-status]');
    if (!input.checkValidity()) { input.reportValidity(); status.textContent = 'Enter a valid email address.'; return; }
    status.textContent = 'Thank you. Your subscription is ready for confirmation.';
    form.reset();
  }));
  createIcons({ icons: ICON_SET });
}
