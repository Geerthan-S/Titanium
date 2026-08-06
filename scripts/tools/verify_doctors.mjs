import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey);

async function checkDoctors() {
    const { data, error } = await supabase.from('doctors').select('name, specialization').eq('status', 'published').order('sort_order');
    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\n--- Verification: Found ${data.length} published doctors ---`);
    data.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.name} (${doc.specialization})`);
    });
    console.log('--------------------------------------------------\n');
}

checkDoctors();
