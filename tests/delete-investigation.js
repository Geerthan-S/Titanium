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

// Use service role key to bypass RLS and see what happens when we delete/archive
const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function run() {
    console.log('Fetching treatments...');
    const { data: treatments, error: fetchErr } = await client.from('treatments').select('id, name, status');
    if (fetchErr) {
        console.error('Error fetching treatments:', fetchErr);
        process.exit(1);
    }
    console.log(`Found ${treatments.length} treatments:`);
    console.log(treatments);

    if (treatments.length === 0) {
        console.log('No treatments to test with.');
        return;
    }

    const target = treatments[0];
    console.log(`\nAttempting soft-delete (archive) on Treatment ID: ${target.id} (${target.name})...`);
    const { data: softData, error: softErr } = await client
        .from('treatments')
        .update({ status: 'archived' })
        .eq('id', target.id)
        .select();

    if (softErr) {
        console.error('Soft delete failed:', softErr);
    } else {
        console.log('Soft delete succeeded!', softData);
    }

    // Restore status to original
    console.log(`Restoring status of ${target.id} back to ${target.status}...`);
    await client.from('treatments').update({ status: target.status }).eq('id', target.id);
}

run().catch(console.error);
