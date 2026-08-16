const COOLDOWN_MS = 30_000;
const storageKey = (scope) => `titanium-roots:last-submit:${scope}`;

export function canSubmitPublicForm(scope, now = Date.now()) {
  try {
    const previous = Number(sessionStorage.getItem(storageKey(scope)) || 0);
    return !previous || now - previous >= COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function markPublicFormSubmitted(scope, now = Date.now()) {
  try {
    sessionStorage.setItem(storageKey(scope), String(now));
  } catch {
    // Session storage is a convenience guard only; server-side validation still applies.
  }
}

export function publicFormCooldownSeconds(scope, now = Date.now()) {
  try {
    const previous = Number(sessionStorage.getItem(storageKey(scope)) || 0);
    return Math.max(0, Math.ceil((COOLDOWN_MS - (now - previous)) / 1000));
  } catch {
    return 0;
  }
}
