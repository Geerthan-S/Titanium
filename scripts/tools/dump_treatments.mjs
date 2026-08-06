import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const envPath = resolve(process.cwd(), '.env');
let envUrl = '';
let serviceKey = '';

try {
    const envContent = readFileSync(envPath, 'utf8');
    envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
    serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
} catch (e) {
    console.error('Failed to read .env', e);
    process.exit(1);
}

const supabase = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
    const { data: treatments, error } = await supabase
        .from('treatments')
        .select('id, name, slug, image_path, image_alt')
        .order('id');

    if (error) {
        console.error('Error fetching treatments:', error);
        return;
    }

    console.log(`Found ${treatments.length} treatments`);
    writeFileSync('treatments_dump.json', JSON.stringify(treatments, null, 2));
    console.log('Saved to treatments_dump.json');
}

main();
