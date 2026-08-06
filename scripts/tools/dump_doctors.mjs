import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, serviceKey);

async function checkDoctors() {
    const { data, error } = await supabase.from('doctors').select('name, specialization, status').order('sort_order');
    if (error) {
        console.error('Error:', error);
        return;
    }

    let output = `--- DB Dump: Found ${data.length} total doctors ---\n`;
    data.forEach((doc, i) => {
        output += `${i + 1}. ${doc.name} (${doc.specialization}) - [${doc.status}]\n`;
    });

    writeFileSync(resolve(process.cwd(), 'latest_doctors.txt'), output, 'utf8');
    console.log('Wrote to latest_doctors.txt');
}

checkDoctors();
