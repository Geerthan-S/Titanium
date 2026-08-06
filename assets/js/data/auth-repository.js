import { DataError, throwIfError } from './data-errors.js';
import { requireSupabase, supabase } from './supabase-client.js';

export async function signInAdministrator({ email, password }) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({
    email: String(email || '').trim().toLowerCase(),
    password,
  });
  throwIfError(error, 'Unable to sign in.');
  if (!(await isCmsAdmin(data.user))) {
    await requireSupabase().auth.signOut();
    throw new DataError('This account is not authorized for the clinic CMS.', {
      code: 'CMS_ACCESS_DENIED',
    });
  }
  return data.user;
}

export async function currentAuthenticatedUser() {
  const { data, error } = await requireSupabase().auth.getUser();
  throwIfError(error, 'Unable to verify your session.');
  return data.user || null;
}

export async function isCmsAdmin(user) {
  if (!user) return false;
  const { data, error } = await requireSupabase()
    .from('admin_profiles')
    .select('id, role, full_name, is_active')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();
  if (error) return false;
  return data?.id === user.id;
}

export async function signOutAdministrator() {
  const { error } = await requireSupabase().auth.signOut();
  throwIfError(error, 'Unable to sign out.');
}

export async function sendPasswordReset(email) {
  const { data, error } = await requireSupabase().auth.resetPasswordForEmail(
    String(email || '').trim().toLowerCase(),
    { redirectTo: `${window.location.origin}/admin/reset-password.html` },
  );
  throwIfError(error, 'Unable to send the password reset email.');
  return data;
}

export function onAuthenticationChange(callback) {
  return supabase?.auth.onAuthStateChange(callback).data.subscription || null;
}
