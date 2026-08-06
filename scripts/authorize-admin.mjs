import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync('.env', 'utf8');
const envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!envUrl || !serviceKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const client = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_EMAIL = 'titaniumroots.media@gmail.com';
const DISPLAY_NAME = 'Titanium Roots Admin';

const { data: { users }, error: listErr } = await client.auth.admin.listUsers();
if (listErr) {
    console.error('listUsers failed:', listErr.message);
    process.exit(1);
}

const user = users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
if (!user) {
    console.error('User not found in auth.');
    process.exit(1);
}

const userId = user.id;
console.log(`User ID: ${userId}`);

// 1. cms_admins
const { error: e1 } = await client.from('cms_admins').upsert({
    user_id: userId,
    email: TARGET_EMAIL,
    display_name: DISPLAY_NAME,
    is_active: true
}, { onConflict: 'user_id' });

if (e1) {
    console.error('cms_admins upsert failed:', e1.message);
} else {
    console.log('cms_admins upsert success');
}

// 2. admin_profiles
const { error: e2 } = await client.from('admin_profiles').upsert({
    user_id: userId,
    display_name: DISPLAY_NAME,
    role: 'owner',
    is_active: true
}, { onConflict: 'user_id' });

if (e2) {
    console.error('admin_profiles upsert failed:', e2.message);
} else {
    console.log('admin_profiles upsert success');
}
