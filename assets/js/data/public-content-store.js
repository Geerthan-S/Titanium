import { fetchPublicCollection } from './public-content-repository.js';
import { requireSupabase } from './supabase-client.js';

export const PUBLIC_TABLES = Object.freeze({
  doctors: 'doctors',
  treatments: 'treatments',
  blogs: 'blog_posts',
  testimonials: 'testimonials',
  gallery: 'gallery_items',
  seo: 'seo_pages',
  settings: 'site_settings',
});

const state = new Map();
const listeners = new Map();
const channels = new Map();

function notify(name) {
  const snapshot = state.get(name) || { status: 'idle', data: null, error: null };
  (listeners.get(name) || new Set()).forEach((listener) => listener(snapshot));
}

export function publicContentState(name) {
  return state.get(name) || { status: 'idle', data: null, error: null };
}

export async function loadPublicContent(name, { force = false } = {}) {
  const current = state.get(name);
  if (!force && current?.status === 'ready') return current.data;
  state.set(name, { status: 'loading', data: current?.data ?? null, error: null });
  notify(name);
  try {
    const data = await fetchPublicCollection(name);
    state.set(name, { status: 'ready', data, error: null });
    notify(name);
    return data;
  } catch (error) {
    state.set(name, { status: 'error', data: current?.data ?? null, error });
    notify(name);
    throw error;
  }
}

export function onPublicContent(name, listener) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(listener);
  return () => listeners.get(name)?.delete(listener);
}

export function subscribePublicContent(name) {
  if (channels.has(name)) return channels.get(name);
  if (state.get(name)?.status === 'error') return null;
  const table = PUBLIC_TABLES[name];
  if (!table) return null;
  const channel = requireSupabase()
    .channel(`public-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      loadPublicContent(name, { force: true }).catch(() => {});
    })
    .subscribe();
  channels.set(name, channel);
  return channel;
}

export async function disposePublicContent() {
  await Promise.all(
    [...channels.values()].map((channel) => requireSupabase().removeChannel(channel)),
  );
  channels.clear();
  listeners.clear();
}
