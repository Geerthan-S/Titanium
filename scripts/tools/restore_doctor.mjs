import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey);

async function restoreDoctor() {
    console.log("Restoring Dr. Sarvesh Ram...");
    const { data, error } = await supabase
        .from('doctors')
        .update({ status: 'published' })
        .eq('name', 'Dr. Sarvesh Ram')
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Success! Restored: ${data[0]?.name}`);
    }
}

restoreDoctor();
