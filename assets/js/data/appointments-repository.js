import { throwIfError } from './data-errors.js';
import { normalizeAppointmentPayload } from './record-mappers.js';
import { requireSupabase } from './supabase-client.js';

export async function submitAppointmentRequest(record) {
  const payload = normalizeAppointmentPayload(record);
  const { error } = await requireSupabase().from('appointment_requests').insert(payload);
  throwIfError(error, 'Unable to submit your request. Please call the clinic for assistance.');
  return true;
}
