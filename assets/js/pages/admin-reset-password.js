import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { requireSupabase } from '../data/supabase-client.js';

const form = document.querySelector('[data-admin-reset-form]');
const status = document.querySelector('[data-reset-status]');
const submit = document.querySelector('[data-reset-submit]');

function showStatus(message, type = 'error') {
  status.hidden = false;
  status.dataset.status = type;
  status.textContent = message;
  status.focus();
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = form.elements.password.value;
  const confirmation = form.elements.confirmation.value;
  if (password.length < 12 || password !== confirmation) {
    showStatus('Use at least 12 characters and make both passwords match.');
    return;
  }
  submit.disabled = true;
  submit.querySelector('span').textContent = 'Updating…';
  try {
    const { error } = await requireSupabase().auth.updateUser({ password });
    if (error) throw error;
    form.reset();
    showStatus('Password updated. Redirecting to the clinic CMS…', 'success');
    window.setTimeout(() => window.location.replace('/admin/dashboard.html'), 700);
  } catch (error) {
    showStatus(error.message || 'Unable to update the password. Request a new reset email.');
    submit.disabled = false;
    submit.querySelector('span').textContent = 'Update password';
  }
});

createIcons({ icons: ICON_SET });
