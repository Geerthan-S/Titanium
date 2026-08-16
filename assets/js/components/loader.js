import { createIcons } from 'lucide';
import { ICON_SET } from './icons.js';

export function initializeLoader() {
  const loader = document.querySelector('.page-loader');
  if (!loader) return;
  document.body.classList.add('is-loader-active');
  createIcons({ icons: ICON_SET });
}

export function hideLoader() {
  const loader = document.querySelector('.page-loader');
  if (!loader) return;
  let completed = false;
  const remove = () => { if (completed) return; completed = true; loader.setAttribute('aria-hidden', 'true'); loader.classList.add('is-hidden'); document.body.classList.remove('is-loader-active'); window.setTimeout(() => loader.remove(), 450); };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { remove(); return; }
  if (document.readyState === 'complete') { window.setTimeout(remove, 120); return; }
  window.addEventListener('load', () => window.setTimeout(remove, 100), { once: true });
  window.setTimeout(remove, 600);
}
