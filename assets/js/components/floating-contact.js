import { createIcons } from 'lucide';
import { ICON_SET } from './icons.js';
import { SITE_CONFIG } from '../utils/constants.js';

export function initializeFloatingContact() {
  const number = SITE_CONFIG.whatsapp.replace(/\D/g, '');
  const href = `https://wa.me/${number}?text=${encodeURIComponent(SITE_CONFIG.whatsappMessage)}`;
  document.querySelectorAll('[data-whatsapp-link]').forEach((link) => { link.href = href; });
  createIcons({ icons: ICON_SET });
}
