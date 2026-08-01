import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { recordAnalyticsEvent } from '../data/analytics-repository.js';
import { submitAppointmentRequest } from '../data/appointments-repository.js';
import { loadPublicContent, onPublicContent, subscribePublicContent } from '../data/public-content-store.js';

const CLINIC_HOURS = Object.freeze({
  Monday: { opens: 9 * 60, closes: 20 * 60, label: '9:00 AM – 8:00 PM' },
  Tuesday: { opens: 9 * 60, closes: 20 * 60, label: '9:00 AM – 8:00 PM' },
  Wednesday: { opens: 9 * 60, closes: 20 * 60, label: '9:00 AM – 8:00 PM' },
  Thursday: { opens: 9 * 60, closes: 20 * 60, label: '9:00 AM – 8:00 PM' },
  Friday: { opens: 9 * 60, closes: 20 * 60, label: '9:00 AM – 8:00 PM' },
  Saturday: { opens: 9 * 60, closes: 18 * 60, label: '9:00 AM – 6:00 PM' },
  Sunday: { opens: 10 * 60, closes: 16 * 60, label: '10:00 AM – 4:00 PM' },
});

export function getClinicStatus(date = new Date(), timeZone = 'Asia/Kolkata') {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date).map(({ type, value }) => [type, value]),
  );
  const schedule = CLINIC_HOURS[parts.weekday];
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);

  return {
    dayLabel: parts.weekday,
    hours: schedule.label,
    isOpen: minutes >= schedule.opens && minutes < schedule.closes,
  };
}

function updateClinicStatus() {
  const status = getClinicStatus();
  const today = document.querySelector('[data-clinic-today]');
  const badge = document.querySelector('[data-clinic-status]');

  if (today) today.textContent = `Today (${status.dayLabel})`;
  if (!badge) return;

  badge.textContent = status.isOpen ? 'Open Now' : 'Closed Now';
  badge.classList.toggle('is-closed', !status.isOpen);
  badge.title = status.hours;
}

function bindRequestModes() {
  const modes = document.querySelectorAll('[data-contact-mode]');
  const requestType = document.querySelector('[data-request-type]');

  modes.forEach((button) => {
    button.addEventListener('click', () => {
      modes.forEach((mode) => mode.setAttribute('aria-pressed', String(mode === button)));
      if (requestType) requestType.value = button.dataset.contactMode;
    });
  });
}

const enquiryTypeFor = (requestType) => requestType === 'Book Appointment' ? 'appointment' : 'general';

function bindContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  form.dataset.openedAt = String(performance.now());

  const dateInput = form.elements.preferredDate;
  if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = form.querySelector('[data-form-status]');
    const elapsed = performance.now() - Number(form.dataset.openedAt || 0);
    if (form.elements.website?.value || elapsed < 1500) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = 'Please complete the required fields and confirm your consent.';
      status.className = 'contact-form-status is-error';
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Sending your request…';
    status.className = 'contact-form-status';
    const data = new FormData(form);
    try {
      await submitAppointmentRequest({
        name: data.get('patientName'),
        phone: data.get('mobile'),
        email: data.get('email'),
        enquiryType: enquiryTypeFor(data.get('requestType')),
        treatment: data.get('service') || data.get('requestType'),
        doctor: data.get('doctor'),
        preferredDate: data.get('preferredDate'),
        message: data.get('message'),
        source: 'contact',
        consent: data.get('consent') === 'on',
      });
      await recordAnalyticsEvent({ eventType: 'appointment_submit', pagePath: location.pathname }).catch(() => {});
      status.textContent = 'Thank you — your request has been sent to our clinic team.';
      status.className = 'contact-form-status is-success';
      showToast('Message received. Our team will contact you shortly.');
      form.reset();
      const defaultMode = form.querySelector('[data-contact-mode="Book Appointment"]');
      form.querySelectorAll('[data-contact-mode]').forEach((mode) => {
        mode.setAttribute('aria-pressed', String(mode === defaultMode));
      });
      form.querySelector('[data-request-type]').value = 'Book Appointment';
    } catch (error) {
      status.textContent = error.message || 'Unable to send your request. Please call the clinic.';
      status.className = 'contact-form-status is-error';
    } finally {
      submit.disabled = false;
    }
  });
}

function applyContactSettings(settings = {}) {
  const hours = settings.clinicHours || {};
  Object.entries(hours).forEach(([day, value]) => {
    const row = document.querySelector(`[data-clinic-hours="${day.toLowerCase()}"]`);
    if (row) row.textContent = value;
  });
}

function applyDoctors(doctors = []) {
  const select = document.querySelector('[data-contact-doctor-select]');
  if (!select) return;
  const encode = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character]);
  select.innerHTML = `<option>Any available doctor</option>${doctors.map(({ name }) => `<option>${encode(name)}</option>`).join('')}`;
}

function bindFaq() {
  document.querySelectorAll('[data-faq-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const answer = document.getElementById(button.getAttribute('aria-controls'));
      const icon = button.querySelector('[data-faq-icon]');
      const willOpen = button.getAttribute('aria-expanded') !== 'true';

      button.setAttribute('aria-expanded', String(willOpen));
      if (answer) answer.hidden = !willOpen;
      if (icon) icon.textContent = willOpen ? '−' : '+';
    });
  });
}

export async function initializeContact() {
  if (document.body.dataset.contactInit) return;
  document.body.dataset.contactInit = 'true';

  updateClinicStatus();
  bindRequestModes();
  bindContactForm();
  bindFaq();
  try {
    const [settings, doctors] = await Promise.all([
      loadPublicContent('settings'),
      loadPublicContent('doctors'),
    ]);
    applyContactSettings(settings);
    applyDoctors(doctors);
    onPublicContent('settings', ({ status, data }) => {
      if (status === 'ready') applyContactSettings(data);
    });
    subscribePublicContent('settings');
    onPublicContent('doctors', ({ status, data }) => {
      if (status === 'ready') applyDoctors(data);
    });
    subscribePublicContent('doctors');
  } catch {
    // Contact page keeps its embedded hours when settings cannot be loaded.
  }
  createIcons({ icons: ICON_SET });
}
