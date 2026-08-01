import { createIcons } from 'lucide';
import { ICON_SET } from '../components/icons.js';
import { confirmAdminAction } from './admin-dialog.js';
import { initializeAdminEditor } from './admin-editor.js';
import { escapeHtml, normalizeOptionalNumber, validateImageFile } from './admin-utils.js';

let activeDrawer;
let activeTrigger;
let dirty = false;

function fieldMarkup(field, record) {
  const value = record?.[field.name] ?? field.defaultValue ?? '';
  const required = field.required ? ' required' : '';
  const describedBy = field.helper ? `${field.name}-helper` : '';
  const common = `name="${field.name}" id="admin-field-${field.name}"${required}${describedBy ? ` aria-describedby="${describedBy}"` : ''}`;
  let input;
  if (field.type === 'textarea') input = `<textarea ${common} rows="${field.rows || 4}" maxlength="${field.maxLength || 5000}">${escapeHtml(value)}</textarea>`;
  else if (field.type === 'select') input = `<select ${common}>${field.options.map((option) => `<option value="${escapeHtml(option)}"${String(value) === String(option) ? ' selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select>`;
  else if (field.type === 'checkbox') input = `<label class="admin-switch"><input type="checkbox" ${common}${value ? ' checked' : ''}><span aria-hidden="true"></span><em>${escapeHtml(field.switchLabel || 'Enabled')}</em></label>`;
  else if (field.type === 'file') input = `<input type="file" ${common} accept="${escapeHtml(field.accept || 'image/jpeg,image/png,image/webp')}"><p class="admin-file-meta" data-file-meta>${value ? `Current metadata: ${escapeHtml(value)}` : 'No file metadata selected.'}</p>`;
  else if (field.type === 'editor') input = `<div class="admin-editor" data-editor-field="${field.name}"></div><input type="hidden" ${common} value="">`;
  else input = `<input type="${field.type || 'text'}" ${common} value="${escapeHtml(value)}"${field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : ''}${field.maxLength ? ` maxlength="${field.maxLength}"` : ''}${field.min !== undefined ? ` min="${field.min}"` : ''}${field.readOnly ? ' readonly' : ''}>`;
  return `<div class="admin-field${field.full ? ' admin-field--full' : ''}${field.type === 'checkbox' ? ' admin-field--switch' : ''}"><label for="admin-field-${field.name}">${escapeHtml(field.label)}${field.required ? ' <span aria-hidden="true">*</span>' : ''}</label>${input}${field.helper ? `<small id="${field.name}-helper">${escapeHtml(field.helper)}</small>` : ''}${field.maxLength ? `<span class="admin-character-count" data-count-for="${field.name}">${String(value).length} / ${field.maxLength}</span>` : ''}<p class="admin-field-error" id="${field.name}-error" data-field-error="${field.name}"></p></div>`;
}

async function closeDrawer(force = false) {
  if (!activeDrawer) return true;
  if (dirty && !force) {
    const discard = await confirmAdminAction({ title: 'Discard unsaved changes?', message: 'Your unsaved changes will be lost.', confirmLabel: 'Discard changes' });
    if (!discard) return false;
  }
  activeDrawer.remove();
  activeDrawer = null;
  dirty = false;
  document.body.classList.remove('admin-dialog-open');
  activeTrigger?.focus();
  return true;
}

export function openAdminForm({
  title = 'Edit record',
  description = 'Saved changes are applied to the clinic website data.',
  fields = [],
  record = {},
  saveLabel = 'Save changes',
  onSave,
  trigger = document.activeElement,
  preview,
} = {}) {
  if (activeDrawer) activeDrawer.remove();
  activeTrigger = trigger;
  dirty = false;
  const shell = document.createElement('section');
  shell.className = 'admin-drawer';
  shell.setAttribute('role', 'dialog');
  shell.setAttribute('aria-modal', 'true');
  shell.setAttribute('aria-labelledby', 'admin-drawer-title');
  shell.innerHTML = `<div class="admin-drawer__backdrop" data-drawer-close></div><div class="admin-drawer__panel"><header><div><p>Clinic CMS</p><h2 id="admin-drawer-title">${escapeHtml(title)}</h2><span>${escapeHtml(description)}</span></div><button class="admin-icon-button" type="button" data-drawer-close aria-label="Close editor"><i data-lucide="x"></i></button></header><form class="admin-record-form" novalidate><div class="admin-form-grid">${fields.map((field) => fieldMarkup(field, record)).join('')}</div>${preview ? '<section class="admin-record-preview" aria-label="Record preview" data-record-preview></section>' : ''}<footer><button class="admin-button admin-button--quiet" type="button" data-drawer-close>Cancel</button><button class="admin-button admin-button--primary" type="submit"><i data-lucide="save" aria-hidden="true"></i>${escapeHtml(saveLabel)}</button></footer><p class="admin-form-status" aria-live="polite" tabindex="-1" data-record-form-status></p></form></div>`;
  document.body.append(shell);
  activeDrawer = shell;
  document.body.classList.add('admin-dialog-open');
  const form = shell.querySelector('form');
  const editors = new Map();
  fields.filter(({ type }) => type === 'editor').forEach((field) => {
    editors.set(field.name, initializeAdminEditor(shell.querySelector(`[data-editor-field="${field.name}"]`), record[field.name] || ''));
  });
  const updatePreview = () => preview?.(shell.querySelector('[data-record-preview]'), Object.fromEntries(new FormData(form)));
  updatePreview();

  form.addEventListener('input', (event) => {
    dirty = true;
    const count = shell.querySelector(`[data-count-for="${event.target.name}"]`);
    if (count) count.textContent = `${event.target.value.length} / ${event.target.maxLength}`;
    updatePreview();
  });
  form.addEventListener('change', (event) => {
    dirty = true;
    if (event.target.type === 'file' && event.target.files[0]) {
      const validation = validateImageFile(event.target.files[0], { allowSvg: event.target.accept.includes('svg') });
      const meta = event.target.closest('.admin-field').querySelector('[data-file-meta]');
      meta.textContent = validation.valid ? `${event.target.files[0].name} · ready to upload` : validation.message;
      event.target.setCustomValidity(validation.valid ? '' : validation.message);
    }
    updatePreview();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    fields.filter(({ type }) => type === 'editor').forEach((field) => { form.elements[field.name].value = editors.get(field.name).getValue(); });
    if (!form.checkValidity()) {
      form.reportValidity();
      form.querySelector(':invalid')?.focus();
      form.querySelector('[data-record-form-status]').textContent = 'Review the highlighted required fields.';
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    const files = {};
    fields.forEach((field) => {
      if (field.type === 'checkbox') values[field.name] = form.elements[field.name].checked;
      if (field.type === 'number') values[field.name] = normalizeOptionalNumber(values[field.name]);
      if (field.type === 'file') {
        const selected = form.elements[field.name].files[0];
        if (selected) files[field.name] = selected;
        values[field.name] = record[field.name] || '';
      }
    });
    values.__files = files;
    const submitButton = form.querySelector('[type="submit"]');
    const formStatus = form.querySelector('[data-record-form-status]');
    submitButton.disabled = true;
    submitButton.dataset.loading = 'true';
    formStatus.textContent = 'Saving…';
    try {
      const result = await onSave?.({ ...record, ...values });
      if (result === false) return;
      dirty = false;
      await closeDrawer(true);
    } catch (error) {
      formStatus.textContent = error.message || 'Unable to save. Please try again.';
      formStatus.focus();
    } finally {
      submitButton.disabled = false;
      delete submitButton.dataset.loading;
    }
  });
  shell.addEventListener('click', (event) => { if (event.target.closest('[data-drawer-close]')) closeDrawer(); });
  shell.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDrawer();
    if (event.key !== 'Tab') return;
    const focusable = [...shell.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"], a[href]')];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  createIcons({ icons: ICON_SET });
  shell.querySelector('input, select, textarea, button')?.focus();
  return shell;
}

export function closeAdminForm() {
  return closeDrawer();
}

export function hasUnsavedAdminChanges() {
  return dirty;
}
