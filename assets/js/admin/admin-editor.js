import { sanitizeRichText } from './admin-utils.js';

const tools = [
  ['formatBlock', 'h2', 'Heading', 'heading-2'],
  ['formatBlock', 'p', 'Paragraph', 'pilcrow'],
  ['bold', null, 'Bold', 'bold'],
  ['italic', null, 'Italic', 'italic'],
  ['insertUnorderedList', null, 'Bulleted list', 'list'],
  ['insertOrderedList', null, 'Numbered list', 'list-ordered'],
  ['formatBlock', 'blockquote', 'Quote', 'quote'],
  ['createLink', 'prompt', 'Link', 'link'],
  ['undo', null, 'Undo', 'undo-2'],
  ['redo', null, 'Redo', 'redo-2'],
];

export function initializeAdminEditor(host, initialValue = '') {
  host.innerHTML = `<div class="admin-editor__toolbar" role="toolbar" aria-label="Article formatting">${tools.map(([command, value, label, icon]) => `<button type="button" data-editor-command="${command}" data-editor-value="${value || ''}" aria-label="${label}"><i data-lucide="${icon}" aria-hidden="true"></i></button>`).join('')}</div><div class="admin-editor__content" contenteditable="true" role="textbox" aria-multiline="true" data-editor-content></div>`;
  const editor = host.querySelector('[data-editor-content]');
  editor.innerHTML = sanitizeRichText(initialValue);
  host.querySelector('[data-editor-command="createLink"]')?.setAttribute('title', 'Only http and https links are accepted');
  host.addEventListener('click', (event) => {
    const button = event.target.closest('[data-editor-command]');
    if (!button) return;
    editor.focus();
    let value = button.dataset.editorValue || null;
    if (value === 'prompt') {
      const candidate = window.prompt('Enter an https:// link');
      value = /^https?:\/\//i.test(candidate || '') ? candidate : null;
      if (!value) return;
    }
    document.execCommand(button.dataset.editorCommand, false, value);
  });
  return {
    getValue: () => sanitizeRichText(editor.innerHTML),
    focus: () => editor.focus(),
  };
}
