export const PAGE_TITLES = Object.freeze({
  dashboard: 'Dashboard',
  appointments: 'Appointments & Leads',
  doctors: 'Doctors',
  treatments: 'Treatments',
  blogs: 'Blogs',
  testimonials: 'Testimonials',
  gallery: 'Gallery & Media',
  seo: 'SEO',
  settings: 'Global Settings',
  analytics: 'Analytics',
});

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]);
}

export function slugify(value = '') {
  return String(value).trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function createId(prefix = 'record') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(date);
}

export function formatFileSize(bytes = 0) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function normalizeOptionalNumber(value) {
  if (String(value ?? '').trim() === '') return '';
  const number = Number(value);
  return Number.isFinite(number) ? number : '';
}

export function debounce(callback, delay = 180) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), delay);
  };
}

export function sanitizeRichText(value = '') {
  const allowed = /^(p|br|h2|h3|strong|b|em|i|ul|ol|li|a|blockquote)$/i;
  return String(value)
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(style|srcdoc)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+href\s*=\s*(["'])\s*(?:javascript|data):[\s\S]*?\1/gi, '')
    .replace(/<\/?([a-z0-9-]+)(?:\s[^>]*)?>/gi, (tag, name) => allowed.test(name) ? tag : '')
    .replace(/<a(?![^>]*\brel=)([^>]*)>/gi, '<a$1 rel="noopener noreferrer">');
}

export function canPublishTestimonial(record = {}) {
  return record.moderationStatus === 'Approved' && record.consentStatus === 'Confirmed';
}

export function validateImageFile(file, { allowSvg = false } = {}) {
  if (!file) return { valid: true };
  const allowed = allowSvg
    ? ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    : ['image/jpeg', 'image/png', 'image/webp'];
  return allowed.includes(file.type)
    ? { valid: true }
    : { valid: false, message: allowSvg ? 'Use JPG, PNG, WebP, or an approved SVG.' : 'Use JPG, PNG, or WebP.' };
}

export function statusClass(value = '') {
  return `admin-status admin-status--${slugify(value) || 'neutral'}`;
}
