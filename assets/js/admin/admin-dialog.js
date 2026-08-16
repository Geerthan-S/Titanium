let activeResolve;
let activeTrigger;

function focusable(dialog) {
  return [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
}

export function initializeAdminDialog() {
  const dialog = document.querySelector('[data-admin-confirm]');
  if (!dialog || dialog.dataset.initialized) return;
  dialog.dataset.initialized = 'true';

  const close = (accepted) => {
    dialog.hidden = true;
    document.body.classList.remove('admin-dialog-open');
    activeTrigger?.focus();
    activeResolve?.(accepted);
    activeResolve = null;
  };
  dialog.querySelector('[data-confirm-cancel]')?.addEventListener('click', () => close(false));
  dialog.querySelector('[data-confirm-accept]')?.addEventListener('click', () => close(true));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(false); });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { close(false); return; }
    if (event.key !== 'Tab') return;
    const items = focusable(dialog);
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

export function confirmAdminAction({
  title = 'Confirm action',
  message = 'This action changes live clinic content.',
  confirmLabel = 'Confirm',
  trigger = document.activeElement,
} = {}) {
  const dialog = document.querySelector('[data-admin-confirm]');
  if (!dialog) return Promise.resolve(window.confirm(message));
  activeTrigger = trigger;
  dialog.querySelector('[data-confirm-title]').textContent = title;
  dialog.querySelector('[data-confirm-message]').textContent = message;
  dialog.querySelector('[data-confirm-accept]').textContent = confirmLabel;
  dialog.hidden = false;
  document.body.classList.add('admin-dialog-open');
  dialog.querySelector('[data-confirm-cancel]').focus();
  return new Promise((resolve) => { activeResolve = resolve; });
}
