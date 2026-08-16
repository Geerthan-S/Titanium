import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { recordAnalyticsEvent } from '../data/analytics-repository.js';
import { submitAppointmentRequest } from '../data/appointments-repository.js';
import { canSubmitPublicForm, markPublicFormSubmitted, publicFormCooldownSeconds } from '../data/submission-guard.js';
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

function bindTabs() {
  const tablist = document.querySelector('.modal__tabs');
  if (!tablist) return;

  const tabs = tablist.querySelectorAll('.tab-button');
  const panels = document.querySelectorAll('.tab-content');

  // Shared inputs that should sync across tabs to save user effort
  const syncState = { patientName: '', mobile: '', email: '' };

  function handleTabSwitch(targetId) {
    tabs.forEach(btn => {
      const isActive = btn.dataset.tabTarget === targetId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach(panel => {
      const isActive = panel.id === targetId;
      panel.hidden = !isActive;
      panel.classList.toggle('active', isActive);

      // Update form fields with synced values when returning
      if (isActive) {
        if (panel.elements.patientName && syncState.patientName) panel.elements.patientName.value = syncState.patientName;
        if (panel.elements.mobile && syncState.mobile) panel.elements.mobile.value = syncState.mobile;
        if (panel.elements.email && syncState.email) panel.elements.email.value = syncState.email;
      }
    });
  }

  // Monitor shared inputs to save progress globally
  document.addEventListener('input', (e) => {
    if (e.target.name === 'patientName') syncState.patientName = e.target.value;
    if (e.target.name === 'mobile') syncState.mobile = e.target.value;
    if (e.target.name === 'email') syncState.email = e.target.value;
  });

  tablist.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-button');
    if (!btn) return;
    handleTabSwitch(btn.dataset.tabTarget);
  });

  // Handle keyboard navigation for accessibility
  tablist.addEventListener('keydown', (e) => {
    const tabsArr = Array.from(tabs);
    const index = tabsArr.indexOf(document.activeElement);
    if (index === -1) return;

    let targetIndex = index;
    if (e.key === 'ArrowRight') targetIndex = (index + 1) % tabsArr.length;
    else if (e.key === 'ArrowLeft') targetIndex = (index - 1 + tabsArr.length) % tabsArr.length;
    else if (e.key === 'Home') targetIndex = 0;
    else if (e.key === 'End') targetIndex = tabsArr.length - 1;
    else return;

    e.preventDefault();
    tabsArr[targetIndex].focus();
    handleTabSwitch(tabsArr[targetIndex].dataset.tabTarget);
  });
}

function bindContactForms() {
  const forms = document.querySelectorAll('[data-contact-form]');

  forms.forEach(form => {
    form.dataset.openedAt = String(performance.now());
    const dateInput = form.elements.preferredDate;
    if (dateInput && form.dataset.contactForm === 'appointment') {
      dateInput.min = new Date().toISOString().slice(0, 10);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = form.querySelector('[data-form-status]');
      const formType = form.dataset.contactForm;
      const elapsed = performance.now() - Number(form.dataset.openedAt || 0);

      if (form.elements.website?.value || elapsed < 1500) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        status.textContent = 'Please complete all required fields and confirm your consent.';
        status.className = 'contact-form-status is-error';
        return;
      }

      const scope = `contact:${formType}`;
      if (!canSubmitPublicForm(scope)) {
        status.textContent = `Please wait ${publicFormCooldownSeconds(scope)} seconds before sending another request.`;
        status.className = 'contact-form-status is-error';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      status.textContent = 'Sending your request…';
      status.className = 'contact-form-status';

      const formData = new FormData(form);
      let enquiryType = 'general';
      let compiledMessage = formData.get('message') || '';

      // Dynamic mapping for unique tabs based on the requirements
      if (formType === 'appointment') {
        enquiryType = 'appointment';
        const timeSlot = formData.get('timeSlot');
        if (timeSlot) compiledMessage = `Preferred Time: ${timeSlot}\n\n${compiledMessage}`;
      } else if (formType === 'general') {
        enquiryType = 'general';
        compiledMessage = `Query Category: ${formData.get('category')}\nContact Pref: ${formData.get('contactMethod')}\n\n${compiledMessage}`;
      } else if (formType === 'treatment_information') {
        enquiryType = 'general';
        compiledMessage = `[Treatment Info Request]\nConsulted Before: ${formData.get('consultedBefore')}\nContact Pref: ${formData.get('contactMethod')}\n\n${compiledMessage}`;
      } else if (formType === 'emergency') {
        enquiryType = 'callback'; // High priority routing
        compiledMessage = `[URGENT EMERGENCY]\nType: ${formData.get('emergencyType')}\nStarted: ${formData.get('beganString')}\nUrgency: ${formData.get('urgency')}\nBleeding: ${formData.get('bleeding')}\nSwelling: ${formData.get('swelling')}\nInjury: ${formData.get('injury')}\n\nDescription: ${compiledMessage}`;
      } else if (formType === 'feedback') {
        enquiryType = 'general';
        const isAnon = formData.get('anonymous') === 'true';
        const rating = formData.get('rating');
        const visibility = formData.get('visibility');
        compiledMessage = `[FEEDBACK SUBMISSION - Rating: ${rating}/5]\nVisibility Profile: ${visibility}\nAnonymous: ${isAnon ? 'Yes' : 'No'}\nContact Info Provided: ${formData.get('contactString') || 'None'}\n\nPerms [Testimonial: ${formData.get('permTestimonial')}, Photo: ${formData.get('permPhoto')}, Video: ${formData.get('permVideo')}]\n\nFeedback:\n${compiledMessage}`;
      }

      try {
        await submitAppointmentRequest({
          name: formData.get('patientName'),
          phone: formData.get('mobile'),
          email: formData.get('email'),
          enquiryType,
          treatment: formData.get('service'),
          doctor: formData.get('doctor'),
          preferredDate: formData.get('preferredDate'),
          message: compiledMessage,
          source: 'contact',
          consent: formData.get('consent') === 'on',
        });

        await recordAnalyticsEvent({ eventType: 'appointment_submit', pagePath: location.pathname }).catch(() => { });
        status.textContent = 'Thank you! Your request has been securely processed by our team.';
        status.className = 'contact-form-status is-success';
        showToast('Message received. Our team will assist you shortly.');
        markPublicFormSubmitted(scope);
        form.reset();
      } catch (error) {
        status.textContent = error.message || 'Unable to send your request. Please contact the clinic directly.';
        status.className = 'contact-form-status is-error';
      } finally {
        submitBtn.disabled = false;
      }
    });
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
  bindTabs();
  bindContactForms();
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
