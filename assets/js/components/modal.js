import { createIcons } from 'lucide';
import { ICON_SET } from './icons.js';
import { recordAnalyticsEvent } from '../data/analytics-repository.js';
import { submitAppointmentRequest } from '../data/appointments-repository.js';

let lastTrigger = null;

export function initializeModals() {
  if (document.body.dataset.modalsInitialized) return;
  document.body.dataset.modalsInitialized = 'true';

  document.addEventListener('click', (event) => {
    // Tab switching
    const tabBtn = event.target.closest('.tab-button');
    if (tabBtn) {
      const tabsContainer = tabBtn.closest('.modal__tabs');
      const modal = tabBtn.closest('.modal');
      const targetId = tabBtn.dataset.tabTarget;

      if (tabsContainer && modal && targetId) {
        tabsContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active', 'aria-selected="true"'));
        tabBtn.classList.add('active');
        tabBtn.setAttribute('aria-selected', 'true');

        modal.querySelectorAll('.tab-content').forEach(content => {
          content.hidden = true;
          content.classList.remove('active');
        });

        const targetForm = modal.querySelector(`[id="${targetId}"]`);
        if (targetForm) {
          targetForm.hidden = false;
          targetForm.classList.add('active');
        }
      }
      return;
    }

    const opener = event.target.closest('[data-modal-open]');
    if (opener) {
      lastTrigger = opener;
      const modal = document.getElementById(opener.dataset.modalOpen);
      const treatmentField = modal?.querySelector('[name="treatment"]');
      const doctorField = modal?.querySelector('[name="doctor"]');
      if (treatmentField && opener.dataset.treatmentInterest) treatmentField.value = opener.dataset.treatmentInterest;
      if (doctorField && opener.dataset.doctorSelection) doctorField.value = opener.dataset.doctorSelection;
      openModal(modal, opener);
    }
    const modal = event.target.closest('[data-modal]');
    if (modal && (event.target === modal || event.target.closest('[data-modal-close]'))) closeModal(modal, lastTrigger);
  });

  document.addEventListener('keydown', (event) => {
    const modal = document.querySelector('[data-modal]:not([hidden])');
    if (!modal) return;
    if (event.key === 'Escape') { closeModal(modal, lastTrigger); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((element) => !element.hidden && !element.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  document.querySelectorAll('[data-appointment-form]').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = form.querySelector('[data-form-status]');
    const modal = form.closest('[data-modal]');
    const elapsed = performance.now() - Number(modal?.dataset.openedAt || 0);
    if (form.elements.website?.value || elapsed < 1500) return;
    if (!form.checkValidity()) { form.reportValidity(); status.textContent = 'Please complete the required details.'; status.className = 'form-status is-error'; return; }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Sending your request…';
    status.className = 'form-status';
    const data = new FormData(form);

    // Resolve Inquiry Type to Supabase Schema
    const inqType = data.get('inquiry_type');
    let mappedEnquiry = 'general';
    let baseMessage = data.get('message') || '';

    if (inqType === 'Book Appointment') {
      mappedEnquiry = 'appointment';
    } else if (inqType === 'Emergency') {
      mappedEnquiry = 'callback';
      baseMessage = `[URGENT EMERGENCY]\n${baseMessage}`;
    } else if (inqType === 'Leave Feedback') {
      mappedEnquiry = 'general';
      const rating = data.get('rating') || '0';
      baseMessage = `[FEEDBACK SUBMISSION - Rating: ${rating}/5]\n${baseMessage}`;
    } else if (inqType === 'Treatment Info') {
      mappedEnquiry = 'general';
      baseMessage = `[Treatment Info Request]\n${baseMessage}`;
    }

    try {
      await submitAppointmentRequest({
        name: data.get('name'),
        phone: data.get('phone'),
        enquiryType: mappedEnquiry,
        treatment: data.get('treatment'),
        doctor: data.get('doctor'),
        preferredDate: data.get('date'),
        message: baseMessage,
        source: 'website',
        consent: data.get('consent') === 'on',
      });
      await recordAnalyticsEvent({ eventType: 'appointment_submit', pagePath: location.pathname }).catch(() => { });
      status.textContent = 'Thank you. Your request has been securely sent.';
      status.className = 'form-status is-success';
      form.reset();
    } catch (error) {
      status.textContent = error.message || 'Unable to send your request. Please call the clinic.';
      status.className = 'form-status is-error';
    } finally {
      submit.disabled = false;
    }
  }));
  createIcons({ icons: ICON_SET });
}

export function openModal(modal, opener = null) {
  if (!modal) return;
  if (opener) lastTrigger = opener;
  modal.hidden = false;
  modal.dataset.openedAt = String(performance.now());
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-scroll-locked');
  modal.querySelector('[data-modal-close]')?.focus();
}

export function closeModal(modal, opener = null) {
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('[data-modal]:not([hidden])')) document.body.classList.remove('is-scroll-locked');
  (opener || lastTrigger)?.focus();
}
