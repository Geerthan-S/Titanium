import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

try {
    loadEnvFile(resolve('.env'));
} catch {
    // Ignore
}

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
assert(url && serviceKey, 'Supabase URL and Service key are required.');

const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function run() {
    console.log('Inserting a temporary dummy treatment...');
    const { data: record, error: insertErr } = await client
        .from('treatments')
        .insert({
            name: 'Temp Test Delete Treatment',
            slug: 'temp-test-delete-treatment-slug',
            category: 'Cosmetic',
            short_description: 'Temporary description',
            status: 'draft',
            sort_order: 999,
        })
        .select()
        .single();

    if (insertErr) {
        console.error('Insert failed:', insertErr);
        process.exit(1);
    }
    console.log('Inserted dummy record:', record.id);

    console.log('Attempting to delete the dummy record...');
    const { error: deleteErr } = await client
        .from('treatments')
        .delete()
        .eq('id', record.id);

    if (deleteErr) {
        console.error('Delete failed:', deleteErr);
    } else {
        console.log('Delete succeeded!');
    }
}

run().catch(console.error);
