import { DataError, throwIfError } from './data-errors.js';
import { requireSupabase } from './supabase-client.js';

export const CMS_TABLES = Object.freeze([
  'admin_profiles',
  'doctors',
  'specialties',
  'treatments',
  'treatment_faqs',
  'treatment_doctors',
  'blog_posts',
  'blog_categories',
  'blog_faqs',
  'blog_treatments',
  'testimonials',
  'gallery_items',
  'media_assets',
  'gallery_collections',
  'gallery_collection_items',
  'page_sections',
  'redirects',
  'seo_pages',
  'site_settings',
  'appointment_requests',
  'analytics_events',
  'search_console_metrics',
  'cms_audit_log',
]);

const WRITABLE_TABLES = new Set(CMS_TABLES.filter((table) => !['analytics_events', 'search_console_metrics', 'cms_audit_log'].includes(table)));
const USER_COLUMNS = new Set([
  'doctors',
  'treatments',
  'blog_posts',
  'testimonials',
  'gallery_items',
  'media_assets',
  'seo_pages',
  'site_settings',
]);

function assertTable(table, { writable = false } = {}) {
  const allowed = writable ? WRITABLE_TABLES.has(table) : CMS_TABLES.includes(table);
  if (!allowed) throw new DataError('Unsupported CMS collection.', { code: 'INVALID_COLLECTION' });
}

async function adminUser() {
  const { data, error } = await requireSupabase().auth.getUser();
  throwIfError(error, 'Unable to verify your session.');
  if (!data.user) throw new DataError('Your session has expired.', { code: 'AUTH_REQUIRED' });
  return data.user;
}

export async function listAdminRecords(
  table,
  { order = 'sort_order', ascending = true, limit = 1000 } = {},
) {
  assertTable(table);
  let query = requireSupabase().from(table).select('*').limit(limit);
  if (order) query = query.order(order, { ascending });
  const { data, error } = await query;
  throwIfError(error, `Unable to load ${table}.`);
  return data || [];
}

export async function saveAdminRecord(table, row, { summary = '' } = {}) {
  assertTable(table, { writable: true });
  const user = await adminUser();
  const next = { ...row };
  if (USER_COLUMNS.has(table)) {
    next.updated_by = user.id;
    if (!next.id && table !== 'site_settings') next.created_by = user.id;
  }
  const { data, error } = await requireSupabase()
    .from(table)
    .upsert(next)
    .select()
    .single();
  throwIfError(error, `Unable to save ${table}.`);
  await writeAudit({
    userId: user.id,
    action: row.id ? 'update' : 'insert',
    table,
    recordId: data.id,
    summary: summary || `${row.id ? 'Updated' : 'Created'} ${table} record`,
  });
  return data;
}

export async function deleteAdminRecord(table, id, { summary = '' } = {}) {
  assertTable(table, { writable: true });
  const user = await adminUser();

  const softDeleteTables = new Set([
    'appointment_requests',
    'doctors',
    'treatments',
    'blog_posts',
    'testimonials',
    'gallery_items',
    'media_assets'
  ]);

  if (!softDeleteTables.has(table)) {
    const { error } = await requireSupabase().from(table).delete().eq('id', id);
    throwIfError(error, `Unable to delete ${table}.`);
    await writeAudit({
      userId: user.id,
      action: 'delete',
      table,
      recordId: id,
      summary: summary || `Deleted ${table} record`,
    });
    return true;
  }

  const archivedAtTables = new Set(['media_assets', 'testimonials']);
  const archivePatch = table === 'appointment_requests'
    ? { status: 'cancelled' }
    : {
      status: 'archived',
      ...(archivedAtTables.has(table) ? { archived_at: new Date().toISOString() } : {}),
    };
  const { error } = await requireSupabase().from(table).update(archivePatch).eq('id', id);
  throwIfError(error, `Unable to archive ${table}.`);
  await writeAudit({
    userId: user.id,
    action: 'archive',
    table,
    recordId: id,
    summary: summary || `Archived ${table} record`,
  });
  return true;
}

export async function patchAdminRecord(table, id, patch, { action = 'update', summary = '' } = {}) {
  assertTable(table, { writable: true });
  const user = await adminUser();
  const next = {
    ...patch,
    ...(USER_COLUMNS.has(table) ? { updated_by: user.id } : {}),
  };
  const { data, error } = await requireSupabase()
    .from(table)
    .update(next)
    .eq('id', id)
    .select()
    .single();
  throwIfError(error, `Unable to update ${table}.`);
  await writeAudit({
    userId: user.id,
    action,
    table,
    recordId: id,
    summary: summary || `${action} ${table} record`,
  });
  return data;
}

export async function writeAudit({ userId, action, table, recordId, summary }) {
  const { error } = await requireSupabase().from('cms_audit_log').insert({
    administrator_id: userId,
    action,
    table_name: table,
    record_id: String(recordId ?? ''),
    summary: String(summary || '').slice(0, 240),
  });
  throwIfError(error, 'The change was saved, but its audit entry could not be recorded.');
}
