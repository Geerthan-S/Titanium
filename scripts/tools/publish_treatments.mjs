import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!envUrl || !serviceKey) {
    console.error("Missing Supabase URL or Service Role Key in .env");
    process.exit(1);
}

const supabase = createClient(envUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function publishAllTreatments() {
    console.log("Fetching all draft treatments...");

    // Publish all treatments
    const { data, error } = await supabase
        .from('treatments')
        .update({ status: 'published' })
        .neq('status', 'published')
        .select('id, name, status');

    if (error) {
        console.error("Error updating treatments:", error);
        return;
    }

    console.log(`Successfully published ${data?.length || 0} treatments.`);
}

publishAllTreatments();
