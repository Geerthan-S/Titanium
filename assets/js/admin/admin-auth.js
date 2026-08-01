import { supabase, requireSupabase } from '../data/supabase-client.js';
import { throwIfError } from '../data/data-errors.js';

export async function loginAdmin({ email, password }) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({
    email: String(email || '').trim().toLowerCase(),
    password,
  });
  throwIfError(error, 'Unable to sign in.');
  if (!(await isCmsAdmin(data.user))) {
    await requireSupabase().auth.signOut();
    throw new Error('This account is not authorized for the clinic CMS.');
  }
  return data.user;
}

export async function isCmsAdmin(user) {
  return Boolean(user);
}

export async function requireAdmin({ redirect = true } = {}) {
  const { data, error } = await requireSupabase().auth.getUser();
  const allowed = !error && await isCmsAdmin(data.user);
  if (!allowed && redirect && typeof window !== 'undefined') {
    window.location.replace('/admin/login.html');
  }
  return allowed ? data.user : null;
}

export async function redirectAuthenticatedLogin() {
  const user = await requireAdmin({ redirect: false });
  if (user && typeof window !== 'undefined') {
    window.location.replace('/admin/dashboard.html');
    return true;
  }
  return false;
}

export async function logoutAdmin() {
  const { error } = await requireSupabase().auth.signOut();
  throwIfError(error, 'Unable to sign out.');
  if (typeof window !== 'undefined') window.location.replace('/admin/login.html');
}

export async function requestPasswordReset(email) {
  const { data, error } = await requireSupabase().auth.resetPasswordForEmail(
    String(email || '').trim().toLowerCase(),
    { redirectTo: `${window.location.origin}/admin/reset-password.html` },
  );
  throwIfError(error, 'Unable to send the password reset email.');
  return data;
}

export function subscribeToAuth(callback) {
  return supabase?.auth.onAuthStateChange(callback).data.subscription || null;
}
