import { throwIfError } from './data-errors.js';
import { requireSupabase } from './supabase-client.js';

const ALLOWED_EVENTS = new Set([
  'page_view',
  'cta_click',
  'whatsapp_click',
  'phone_click',
  'appointment_submit',
]);

export async function recordAnalyticsEvent({ eventType, pagePath, referrerDomain = '' }) {
  if (!ALLOWED_EVENTS.has(eventType)) return false;
  const payload = {
    event_type: eventType,
    page_path: String(pagePath || '/').slice(0, 200),
    referrer_domain: String(referrerDomain || '').slice(0, 180),
  };
  const { error } = await requireSupabase().from('analytics_events').insert(payload);
  throwIfError(error, 'Unable to record the analytics event.');
  return true;
}
