import { createClient } from '@supabase/supabase-js';

const originalUrl = import.meta.env?.VITE_SUPABASE_URL?.trim();
const url = originalUrl;
const publishableKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const REQUEST_TIMEOUT_MS = 5000;

function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const signal = init.signal || controller.signal;

  return fetch(input, { ...init, signal }).finally(() => window.clearTimeout(timeout));
}

export const supabaseConfigured = Boolean(url && publishableKey);

export const supabase = supabaseConfigured
  ? createClient(url, publishableKey, {
    global: { fetch: fetchWithTimeout },
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
