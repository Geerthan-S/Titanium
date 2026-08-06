import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync('.env', 'utf8');
const envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const client = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const { data: treatments, error } = await client.from('treatments').select('id, name, status').limit(2);
console.log('TREATMENTS:', treatments, error);

if (treatments && treatments.length > 0) {
    const t = treatments[0];
    console.log(`Attempting to archive treatment: ${t.name} (id: ${t.id})`);
    const { data: updateData, error: updateError } = await client.from('treatments').update({ status: 'archived' }).eq('id', t.id).select();
    console.log('UPDATE RESULT:', updateData);
    console.log('UPDATE ERROR:', updateError);
}

console.log('=== END ===');
