import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { logoutAdmin } from './admin-auth.js';
import { PAGE_TITLES, escapeHtml } from './admin-utils.js';
import { initializeAdminDialog } from './admin-dialog.js';

const COLLAPSED_KEY = 'titanium-admin-sidebar-collapsed';
const modules = Object.entries(PAGE_TITLES).map(([page, label]) => ({ page, label, href: `/admin/${page}.html` }));
let lastDrawerTrigger;
let lastCommandTrigger;

function setDrawer(open) {
  const sidebar = document.querySelector('[data-admin-sidebar]');
  const backdrop = document.querySelector('[data-admin-drawer-backdrop]');
  const menu = document.querySelector('[data-admin-menu]');
  if (!sidebar) return;
  sidebar.classList.toggle('is-open', open);
  if (backdrop) backdrop.hidden = !open;
  menu?.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('admin-drawer-open', open);
  if (open) sidebar.querySelector('a')?.focus();
  else lastDrawerTrigger?.focus();
}

function renderCommandResults(query = '') {
  const target = document.querySelector('[data-command-results]');
  if (!target) return;
  const matches = modules.filter(({ label }) => label.toLowerCase().includes(query.trim().toLowerCase()));
  target.innerHTML = matches.length
    ? matches.map(({ label, href }) => `<a href="${href}"><i data-lucide="arrow-up-right" aria-hidden="true"></i><span>${escapeHtml(label)}</span></a>`).join('')
    : '<p>No admin modules match that search.</p>';
  createIcons({ icons: ICON_SET });
}

function setCommand(open, trigger = document.activeElement) {
  const dialog = document.querySelector('[data-admin-command]');
  if (!dialog) return;
  if (open) lastCommandTrigger = trigger;
  dialog.hidden = !open;
  document.body.classList.toggle('admin-dialog-open', open);
  if (open) {
    renderCommandResults('');
    const input = dialog.querySelector('[data-command-input]');
    input.value = '';
    input.focus();
  } else lastCommandTrigger?.focus();
}

export function initializeAdminShell(page, user) {
  const title = PAGE_TITLES[page] || 'Clinic CMS';
  document.querySelector('[data-admin-page-title]')?.replaceChildren(title);
  document.querySelector('[data-admin-breadcrumb]')?.replaceChildren(title);
  document.title = `${title} | Titanium Roots Admin`;
  document.querySelectorAll('[data-admin-identity]').forEach((target) => {
    target.textContent = user?.email || 'Clinic Administrator';
  });
  document.querySelectorAll(`[data-admin-nav="${page}"]`).forEach((link) => link.setAttribute('aria-current', 'page'));

  const collapsed = localStorage.getItem(COLLAPSED_KEY) === 'true';
  document.body.classList.toggle('admin-sidebar-collapsed', collapsed);
  document.querySelector('[data-sidebar-collapse]')?.setAttribute('aria-pressed', String(collapsed));

  document.addEventListener('click', (event) => {
    const menu = event.target.closest('[data-admin-menu]');
    if (menu) { lastDrawerTrigger = menu; setDrawer(true); }
    if (event.target.closest('[data-admin-drawer-backdrop]')) setDrawer(false);
    if (event.target.closest('[data-sidebar-collapse]')) {
      const next = !document.body.classList.contains('admin-sidebar-collapsed');
      document.body.classList.toggle('admin-sidebar-collapsed', next);
      localStorage.setItem(COLLAPSED_KEY, String(next));
      event.target.closest('button').setAttribute('aria-pressed', String(next));
    }
    if (event.target.closest('[data-command-open]')) setCommand(true, event.target.closest('[data-command-open]'));
    if (event.target.closest('[data-admin-logout]')) {
      logoutAdmin().catch((error) => {
        if (import.meta.env.DEV) console.error('Admin logout failed:', error);
      });
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setDrawer(false);
      setCommand(false);
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      setCommand(true);
    }
  });
  document.querySelector('[data-command-input]')?.addEventListener('input', (event) => renderCommandResults(event.target.value));
  document.querySelector('[data-admin-command]')?.addEventListener('click', (event) => {
    if (event.target.matches('[data-admin-command]')) setCommand(false);
  });
  initializeAdminDialog();
  createIcons({ icons: ICON_SET });
}
