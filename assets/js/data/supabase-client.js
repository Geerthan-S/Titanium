import { createClient } from '@supabase/supabase-js';

const originalUrl = import.meta.env?.VITE_SUPABASE_URL?.trim();
const url = typeof window !== 'undefined' && originalUrl?.includes('.supabase.co')
  ? `${window.location.origin}/supabase-proxy`
  : originalUrl;
const publishableKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigured = Boolean(url && publishableKey);

export const supabase = supabaseConfigured
  ? createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Titanium Roots data service is not configured.');
  }
  return supabase;
}
