import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

try {
    const env = readFileSync('.env', 'utf8');
    const envUrl = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
    const serviceKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

    const client = createClient(envUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log('=== LIST TABLES ===');
    const checkTables = ['media_assets', 'gallery_items', 'gallery_collections', 'gallery_collection_items'];
    for (const t of checkTables) {
        try {
            const { data: rows, error: err } = await client.from(t).select('id').limit(1);
            if (err) {
                console.log(`Table ${t}: Error (${err.message})`);
            } else {
                console.log(`Table ${t}: OK (rows: ${rows.length})`);
            }
        } catch (inner) {
            console.log(`Table ${t}: Exception (${inner.message})`);
        }
    }
    console.log('=== END ===');
} catch (outer) {
    console.error('Outer script failure:', outer);
}
