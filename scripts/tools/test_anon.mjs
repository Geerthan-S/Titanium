import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const anonKey = envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(envUrl, anonKey);

async function testAnonAccess() {
    const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('status', 'published')
        .order('sort_order');

    if (error) {
        console.error("Anon access error:", error);
    } else {
        console.log(`Anon access successful, found ${data?.length} treatments.`);
        if (data?.length === 0) {
            console.log("No treatments found. RLS might be blocking it or there's a typo in status.");
        }
    }
}

testAnonAccess();
