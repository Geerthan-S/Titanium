import { loadComponents } from './components/component-loader.js';
import { initializeNavbar } from './components/navbar.js';
import { initializeFooter } from './components/footer.js';
import { initializeModals } from './components/modal.js';
import { initializeFloatingContact } from './components/floating-contact.js';
import { hideLoader, initializeLoader } from './components/loader.js';

let applicationPromise;

export function startApplication() {
  if (applicationPromise) return applicationPromise;
  applicationPromise = new Promise((resolve) => {
    const initialize = async () => {
      try { await loadComponents(); } catch { /* Component loading degrades gracefully. */ }
      initializeLoader();
      initializeNavbar();
      initializeFooter();
      initializeModals();
      initializeFloatingContact();
      hideLoader();
      resolve();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
  });
  return applicationPromise;
}
