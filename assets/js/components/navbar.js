import { createIcons } from 'lucide';
import { ICON_SET } from './icons.js';

export function resolveNavigationHref(href, locationLike = window.location) {
  return href;
}

export function initializeNavbar() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const navigation = document.querySelector('[data-navigation]');
  if (!toggle || !navigation || toggle.dataset.initialized) return;

  toggle.dataset.initialized = 'true';
  navigation.querySelectorAll('a[href]').forEach((link) => {
    link.setAttribute('href', resolveNavigationHref(link.getAttribute('href')));
  });
  const closeMenu = () => { navigation.classList.remove('is-open'); document.body.classList.remove('is-nav-open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    const open = navigation.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-nav-open', open);
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', (event) => { if (!navigation.contains(event.target) && !toggle.contains(event.target)) { closeMenu(); } });
  navigation.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });

  const page = document.body.dataset.page;
  navigation.querySelector(`[data-nav-page="${page}"]`)?.setAttribute('aria-current', 'page');
  const header = document.querySelector('[data-site-header]');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 16);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
  createIcons({ icons: ICON_SET });
}
